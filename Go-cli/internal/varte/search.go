package varte

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/signal"
	"regexp"
	"sort"
	"strings"
	"time"
)

type FileMetadata struct {
	ID           string `json:"id"`
	RepoFullName string `json:"repoFullName"`
	Directory    string `json:"directory"`
	EnvName      string `json:"envName"`
	UpdatedAt    string `json:"updatedAt"`
	CreatedAt    string `json:"createdAt"`
	IsEncrypted  bool   `json:"isEncrypted"`
}
type SearchMatch struct {
	FileMetadata
	Names      []string `json:"names"`
	Historical bool     `json:"historical"`
}
type SearchIssue struct {
	ID   string `json:"id,omitempty"`
	Code string `json:"code"`
}
type SearchResult struct {
	SchemaVersion int           `json:"schemaVersion"`
	Status        string        `json:"status"`
	Scanned       int           `json:"scanned"`
	Eligible      int           `json:"eligible"`
	Matches       []SearchMatch `json:"matches"`
	Errors        []SearchIssue `json:"errors"`
}
type ExitError struct {
	Code    int
	Message string
}

func (err *ExitError) Error() string { return err.Message }

var assignment = regexp.MustCompile(`^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$`)

func variableNames(text string) ([]string, error) {
	names := map[string]bool{}
	var quote rune
	for _, line := range strings.Split(strings.TrimPrefix(text, "\ufeff"), "\n") {
		value := strings.TrimSuffix(line, "\r")
		if quote == 0 {
			match := assignment.FindStringSubmatch(value)
			if match == nil {
				continue
			}
			names[match[1]] = true
			value = match[2]
			if value == "" || !strings.ContainsRune("\"'`", rune(value[0])) {
				continue
			}
			quote = rune(value[0])
			value = value[1:]
		}
		escaped := false
		for _, char := range value {
			if escaped {
				escaped = false
				continue
			}
			if char == '\\' && quote != '\'' {
				escaped = true
				continue
			}
			if char == quote {
				quote = 0
				break
			}
		}
	}
	if quote != 0 {
		return nil, errors.New("malformed quoted value")
	}
	output := make([]string, 0, len(names))
	for name := range names {
		output = append(output, name)
	}
	sort.Strings(output)
	return output, nil
}
func (app *App) search(client *Client, query string, input map[string]any, exact, history, jsonOutput bool) error {
	if !regexp.MustCompile(`^[A-Za-z0-9_]{1,128}$`).MatchString(query) {
		return errors.New("search requires 1–128 letters, numbers, or underscores")
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	client.Context = ctx
	result := SearchResult{SchemaVersion: 1, Status: "complete", Matches: []SearchMatch{}, Errors: []SearchIssue{}}
	files := []FileMetadata{}
	cursors := map[string]bool{}
	fmt.Fprintln(app.Err, "Discovering saved files in the selected accessible repositories…")
	for {
		var page struct {
			Files      []FileMetadata `json:"files"`
			NextCursor *string        `json:"nextCursor"`
		}
		if err := client.Request("POST", "/api/env/discover", input, &page); err != nil {
			result.Status = "partial"
			result.Errors = append(result.Errors, SearchIssue{Code: "discovery_failed"})
			break
		}
		files = append(files, page.Files...)
		if len(files) > 50000 {
			result.Status = "partial"
			result.Errors = append(result.Errors, SearchIssue{Code: "limit_exceeded"})
			break
		}
		if page.NextCursor == nil {
			break
		}
		if cursors[*page.NextCursor] {
			result.Status = "partial"
			result.Errors = append(result.Errors, SearchIssue{Code: "discovery_failed"})
			break
		}
		cursors[*page.NextCursor] = true
		input["cursor"] = *page.NextCursor
	}
	if result.Status == "complete" {
		timestamps := make(map[string]int64, len(files))
		for _, file := range files {
			stamp := file.UpdatedAt
			if stamp == "" {
				stamp = file.CreatedAt
			}
			if parsed, err := time.Parse(time.RFC3339Nano, stamp); err == nil {
				timestamps[file.ID] = parsed.UnixMilli()
			}
		}
		sort.Slice(files, func(i, j int) bool {
			a, b := timestamps[files[i].ID], timestamps[files[j].ID]
			if a == b {
				return files[i].ID > files[j].ID
			}
			return a > b
		})
		seen := map[string]bool{}
		eligible := []SearchMatch{}
		for _, file := range files {
			identityBytes, _ := json.Marshal([]string{file.RepoFullName, file.Directory, file.EnvName})
			identity := string(identityBytes)
			historical := seen[identity]
			seen[identity] = true
			if historical && !history {
				continue
			}
			eligible = append(eligible, SearchMatch{FileMetadata: file, Historical: historical})
		}
		result.Eligible = len(eligible)
		key := ""
		for _, entry := range eligible {
			if ctx.Err() != nil {
				result.Status = "cancelled"
				break
			}
			var record struct {
				File EnvFile `json:"file"`
			}
			var names []string
			err := client.Request("POST", "/api/env/record", map[string]string{"id": entry.ID}, &record)
			if err == nil {
				plain := []byte(record.File.Content)
				if record.File.IsEncrypted {
					if key == "" {
						key, err = client.Key()
					}
					if err == nil {
						plain, err = Decrypt(record.File.Content, key)
					}
				}
				if err == nil {
					names, err = variableNames(string(plain))
				}
				clear(plain)
			}
			if ctx.Err() != nil {
				result.Status = "cancelled"
				break
			}
			if err != nil {
				result.Status = "partial"
				result.Errors = append(result.Errors, SearchIssue{ID: entry.ID, Code: "file_unreadable"})
			} else {
				matches := []string{}
				for _, name := range names {
					lower := strings.ToLower(name)
					q := strings.ToLower(query)
					if (exact && lower == q) || (!exact && strings.Contains(lower, q)) {
						matches = append(matches, name)
					}
				}
				if len(matches) > 0 {
					entry.Names = matches
					result.Matches = append(result.Matches, entry)
				}
			}
			result.Scanned++
			fmt.Fprintf(app.Err, "Scanned %d/%d files\n", result.Scanned, result.Eligible)
		}
	}
	if ctx.Err() != nil {
		result.Status = "cancelled"
	}
	if jsonOutput {
		if err := json.NewEncoder(app.Out).Encode(result); err != nil {
			return err
		}
	} else {
		for _, match := range result.Matches {
			label := "current"
			if match.Historical {
				label = "historical"
			}
			fmt.Fprintf(app.Out, "%s\n  %s / %s / %s\n  %s · %s · ID %s\n", strings.Join(match.Names, ", "), match.RepoFullName, match.Directory, match.EnvName, label, match.UpdatedAt, match.ID)
		}
		if len(result.Matches) == 0 && result.Status == "complete" {
			fmt.Fprintln(app.Out, "No matching variable names found.")
		}
	}
	if result.Status == "cancelled" {
		return &ExitError{Code: 130, Message: "search cancelled"}
	}
	if result.Status == "partial" {
		return &ExitError{Code: 2, Message: "search incomplete; narrow the scope or retry (see JSON errors)"}
	}
	return nil
}
