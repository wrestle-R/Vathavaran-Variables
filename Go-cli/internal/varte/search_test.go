package varte

import (
	"bufio"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
)

func TestVariableNamesSharedFixtures(t *testing.T) {
	raw, err := os.ReadFile("../../../fixtures/env-search.json")
	if err != nil {
		t.Fatal(err)
	}
	var fixtures []struct {
		Name, Text string
		Names      []string
		Error      bool
	}
	if err := json.Unmarshal(raw, &fixtures); err != nil {
		t.Fatal(err)
	}
	for _, f := range fixtures {
		t.Run(f.Name, func(t *testing.T) {
			names, err := variableNames(f.Text)
			if f.Error {
				if err == nil {
					t.Fatal("malformed file accepted")
				}
				return
			}
			if err != nil || !reflect.DeepEqual(names, f.Names) {
				t.Fatalf("got %v, %v; expected %v", names, err, f.Names)
			}
		})
	}
}
func TestSearchAndExactPullThroughHTTP(t *testing.T) {
	t.Setenv("VATHAVARAN_CONFIG_DIR", t.TempDir())
	if err := SaveAuth(&Auth{UserID: 1, UserName: "owner", Token: "test-token"}); err != nil {
		t.Fatal(err)
	}
	ciphertext, _ := Encrypt([]byte("GROK_API_KEY=synthetic-secret-value\n"), "fixture-key")
	fail := false
	fetched := []string{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer test-token" {
			t.Error("missing authentication")
		}
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/api/env/discover":
			var input map[string]any
			json.NewDecoder(r.Body).Decode(&input)
			if _, scoped := input["repoFullName"]; scoped {
				t.Error("unscoped search used git repository")
			}
			if input["cursor"] == "next" {
				json.NewEncoder(w).Encode(map[string]any{"files": []FileMetadata{{ID: "new", RepoFullName: "team/other", EnvName: ".env", UpdatedAt: "2026-02-01T00:00:00Z"}, {ID: "prod", RepoFullName: "team/other", EnvName: ".env.prod", UpdatedAt: "2026-02-01T00:00:00Z"}}, "nextCursor": nil})
			} else {
				json.NewEncoder(w).Encode(map[string]any{"files": []FileMetadata{{ID: "old", RepoFullName: "team/other", EnvName: ".env", UpdatedAt: "2026-01-01T00:00:00Z"}}, "nextCursor": "next"})
			}
		case "/api/env/record":
			var input map[string]string
			json.NewDecoder(r.Body).Decode(&input)
			fetched = append(fetched, input["id"])
			if fail && input["id"] == "prod" {
				w.WriteHeader(500)
				w.Write([]byte(`{"error":"PRIVATE=do-not-repeat"}`))
				return
			}
			json.NewEncoder(w).Encode(map[string]any{"file": EnvFile{ID: input["id"], EnvName: ".env", Content: ciphertext, IsEncrypted: true}})
		case "/api/encryption-key":
			json.NewEncoder(w).Encode(map[string]string{"encryptionKey": "fixture-key"})
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()
	t.Setenv("VATHAVARAN_BACKEND_URL", server.URL)
	var out, diagnostics bytes.Buffer
	app := &App{In: bufio.NewReader(strings.NewReader("")), Out: &out, Err: &diagnostics}
	if err := app.Run([]string{"search", "grok", "--json"}); err != nil {
		t.Fatal(err)
	}
	var result SearchResult
	if err := json.Unmarshal(out.Bytes(), &result); err != nil {
		t.Fatalf("stdout not JSON: %v", err)
	}
	if result.Status != "complete" || len(result.Matches) != 2 || result.Eligible != 2 {
		t.Fatalf("wrong results: %+v", result)
	}
	for _, id := range fetched {
		if id == "old" {
			t.Fatal("old version fetched by default")
		}
	}
	if strings.Contains(out.String()+diagnostics.String(), "synthetic-secret-value") || strings.Contains(out.String(), ciphertext) {
		t.Fatal("search exposed contents")
	}
	out.Reset()
	diagnostics.Reset()
	fail = true
	err := app.Run([]string{"search", "grok", "--json"})
	exit, ok := err.(*ExitError)
	if !ok || exit.Code != 2 {
		t.Fatal("partial scan did not return exit 2")
	}
	if err := json.Unmarshal(out.Bytes(), &result); err != nil || result.Status != "partial" {
		t.Fatal("missing partial JSON")
	}
	if strings.Contains(out.String(), "do-not-repeat") {
		t.Fatal("unsafe error exposed")
	}
	fail = false
	output := filepath.Join(t.TempDir(), ".env")
	if err := app.Run([]string{"pull", "--id", "old", "--output", output}); err != nil {
		t.Fatal(err)
	}
	plain, _ := os.ReadFile(output)
	if string(plain) != "GROK_API_KEY=synthetic-secret-value\n" {
		t.Fatal("wrong exact file")
	}
	if err := app.Run([]string{"pull", "--id", "old", "--output", output}); err == nil {
		t.Fatal("exact pull overwrote existing file")
	}
}
