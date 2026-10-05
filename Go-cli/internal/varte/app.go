package varte

import (
	"bufio"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"golang.org/x/term"
)

var Version = "2.0.0"

type App struct {
	In          *bufio.Reader
	Out         io.Writer
	Err         io.Writer
	Interactive bool
}

func NewApp() *App {
	return &App{In: bufio.NewReader(os.Stdin), Out: os.Stdout, Err: os.Stderr, Interactive: term.IsTerminal(int(os.Stdin.Fd()))}
}
func (app *App) prompt(label, fallback string) (string, error) {
	if !app.Interactive {
		if fallback != "" {
			return fallback, nil
		}
		return "", fmt.Errorf("%s is required; provide the corresponding flag", label)
	}
	fmt.Fprintf(app.Out, "%s [%s]: ", label, fallback)
	value, err := app.In.ReadString('\n')
	if err != nil {
		return "", err
	}
	value = strings.TrimSpace(value)
	if value == "" {
		value = fallback
	}
	return value, nil
}
func (app *App) confirm(label string) (bool, error) {
	if !app.Interactive {
		return false, errors.New("output file already exists; use --force to replace it")
	}
	fmt.Fprint(app.Out, label+" [y/N]: ")
	value, err := app.In.ReadString('\n')
	return strings.EqualFold(strings.TrimSpace(value), "y") || strings.EqualFold(strings.TrimSpace(value), "yes"), err
}
func gitRepository() (string, string) {
	raw, err := exec.Command("git", "config", "--get", "remote.origin.url").Output()
	if err != nil {
		return "", ""
	}
	match := regexp.MustCompile(`github\.com[:/]([^/]+)/([^/\s]+)`).FindStringSubmatch(strings.TrimSpace(string(raw)))
	if len(match) != 3 {
		return "", ""
	}
	return match[1], strings.TrimSuffix(match[2], ".git")
}
func (app *App) help() {
	fmt.Fprintln(app.Out, `varte — encrypted environment files for your GitHub repositories

Usage: varte <command> [options]

Commands:
  login    Sign in through GitHub (or --token-env ENV_NAME)
  logout   Clear your saved session
  status   Verify your saved session and backend connection
  push     Encrypt and upload a version of an environment file
  pull     Select, decrypt, and save an environment file
  list     List stored files (--json for scripts)

Options:
  -o, --owner       Repository owner (detected from Git when possible)
  -r, --repo        Repository name (detected from Git when possible)
  -d, --directory   Repository directory (default: root)
  -f, --file        File to push (default: .env)
  -n, --name        Stored file name to push or select when pulling
      --output      Pull destination
      --force       Allow replacing an existing destination
      --json        Print list as JSON
  -V, --version     Print version
  -h, --help        Print help

Configuration:
  VATHAVARAN_BACKEND_URL  Next server URL
  VATHAVARAN_CONFIG_DIR   Override local session directory

Examples:
  varte login
  varte push -f .env -d backend -n .env.production
  varte pull -d backend --output .env
  varte list -o your-team -r your-project`)
}
func (app *App) Run(args []string) error {
	if len(args) == 0 || args[0] == "help" || args[0] == "--help" || args[0] == "-h" {
		app.help()
		return nil
	}
	if args[0] == "--version" || args[0] == "-V" {
		fmt.Fprintln(app.Out, Version)
		return nil
	}
	command := args[0]
	options := flag.NewFlagSet(command, flag.ContinueOnError)
	options.SetOutput(app.Err)
	var owner, repo, directory, file, name, output, tokenEnv string
	var force, jsonOutput, help bool
	options.StringVar(&owner, "owner", "", "Repository owner")
	options.StringVar(&owner, "o", "", "Repository owner")
	options.StringVar(&repo, "repo", "", "Repository name")
	options.StringVar(&repo, "r", "", "Repository name")
	options.StringVar(&directory, "directory", "", "Repository directory")
	options.StringVar(&directory, "d", "", "Repository directory")
	options.StringVar(&file, "file", ".env", "File to upload")
	options.StringVar(&file, "f", ".env", "File to upload")
	options.StringVar(&name, "name", "", "Stored environment file name")
	options.StringVar(&name, "n", "", "Stored environment file name")
	options.StringVar(&output, "output", "", "Destination file")
	options.StringVar(&tokenEnv, "token-env", "", "Read a GitHub token from this environment variable")
	options.BoolVar(&force, "force", false, "Replace an existing file")
	options.BoolVar(&jsonOutput, "json", false, "Print JSON")
	options.BoolVar(&help, "help", false, "Show help")
	options.BoolVar(&help, "h", false, "Show help")
	if err := options.Parse(args[1:]); err != nil {
		return err
	}
	if help {
		app.help()
		return nil
	}
	if len(options.Args()) > 0 {
		return fmt.Errorf("unexpected argument: %s", options.Args()[0])
	}
	switch command {
	case "logout":
		if err := ClearAuth(); err != nil {
			return err
		}
		fmt.Fprintln(app.Out, "Signed out.")
		return nil
	case "login":
		if tokenEnv == "" {
			return app.login()
		}
		token := strings.TrimSpace(os.Getenv(tokenEnv))
		if token == "" {
			return fmt.Errorf("%s is empty", tokenEnv)
		}
		client, err := NewClient(token)
		if err != nil {
			return err
		}
		var user User
		if err = client.Request("GET", "/api/user", nil, &user); err != nil {
			return err
		}
		if err = SaveAuth(&Auth{UserID: user.ID, UserName: user.Login, Token: token}); err != nil {
			return err
		}
		fmt.Fprintf(app.Out, "Signed in as %s.\n", user.Login)
		return nil
	case "status", "push", "pull", "list":
	default:
		return fmt.Errorf("unknown command %q; run varte --help", command)
	}
	auth, err := LoadAuth()
	if err != nil {
		return err
	}
	client, err := NewClient(auth.Token)
	if err != nil {
		return err
	}
	if command == "status" {
		var user User
		if err = client.Request("GET", "/api/user", nil, &user); err != nil {
			return err
		}
		fmt.Fprintf(app.Out, "Signed in as %s\nServer: %s\n", user.Login, client.Base)
		return nil
	}
	gitOwner, gitRepo := gitRepository()
	if repo != "" && owner == "" {
		owner = auth.UserName
	} else if owner == "" {
		owner = gitOwner
	}
	if repo == "" && owner == gitOwner {
		repo = gitRepo
	}
	specifiedFlags := map[string]bool{}
	options.Visit(func(f *flag.Flag) { specifiedFlags[f.Name] = true })
	if command != "list" {
		if !specifiedFlags["owner"] && !specifiedFlags["o"] {
			if owner, err = app.prompt("Repository owner", owner); err != nil {
				return err
			}
		}
		if !specifiedFlags["repo"] && !specifiedFlags["r"] {
			if repo, err = app.prompt("Repository name", repo); err != nil {
				return err
			}
		}
	}
	if (owner == "") != (repo == "") {
		return errors.New("provide both --owner and --repo")
	}
	fullName := ""
	if owner != "" {
		fullName = owner + "/" + repo
		if !regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9_.-]*/[A-Za-z0-9_][A-Za-z0-9_.-]*$`).MatchString(fullName) {
			return errors.New("repository must be owner/name")
		}
	}
	if command != "list" && app.Interactive {
		specified := false
		options.Visit(func(f *flag.Flag) {
			if f.Name == "directory" || f.Name == "d" {
				specified = true
			}
		})
		if !specified {
			if directory, err = app.prompt("Directory (empty for repository root)", ""); err != nil {
				return err
			}
		}
	}
	if command == "push" {
		raw, err := os.ReadFile(file)
		if err != nil {
			return fmt.Errorf("read environment file: %w", err)
		}
		if len(raw) > 500000 {
			return errors.New("environment file exceeds the 500 KB limit")
		}
		if name == "" {
			name = ".env." + time.Now().Format("02/01/2006T15:04") + " (" + auth.UserName + ")"
		}
		if app.Interactive && !specifiedFlags["name"] && !specifiedFlags["n"] {
			if name, err = app.prompt("Environment file name", name); err != nil {
				return err
			}
		}
		key, err := client.Key()
		if err != nil {
			return err
		}
		encrypted, err := Encrypt(raw, key)
		if err != nil {
			return err
		}
		if err = client.Request("POST", "/api/env/push", map[string]any{"repoFullName": fullName, "directory": directory, "envName": name, "content": encrypted}, nil); err != nil {
			return err
		}
		fmt.Fprintf(app.Out, "Encrypted and uploaded %s to %s.\n", name, fullName)
		return nil
	}
	input := map[string]any{}
	if fullName != "" {
		input["repoFullName"] = fullName
	}
	endpoint := "/api/env/list"
	if command == "pull" {
		endpoint = "/api/env/pull"
		input["directory"] = directory
	}
	var data struct {
		EnvFiles []EnvFile `json:"envFiles"`
	}
	if err = client.Request("POST", endpoint, input, &data); err != nil {
		return err
	}
	if command == "list" {
		if jsonOutput {
			return json.NewEncoder(app.Out).Encode(data.EnvFiles)
		}
		if len(data.EnvFiles) == 0 {
			fmt.Fprintln(app.Out, "No environment files found.")
			return nil
		}
		for index, entry := range data.EnvFiles {
			dir := entry.Directory
			if dir == "" {
				dir = "root"
			}
			fmt.Fprintf(app.Out, "%d. %s\n   %s / %s · %s · %s\n", index+1, entry.EnvName, entry.RepoFullName, dir, entry.UserName, entry.UpdatedAt)
		}
		return nil
	}
	if len(data.EnvFiles) == 0 {
		return errors.New("no environment files found for this repository and directory")
	}
	var selected EnvFile
	if name != "" {
		found := false
		for _, entry := range data.EnvFiles {
			if entry.EnvName == name {
				selected = entry
				found = true
				break
			}
		}
		if !found {
			return fmt.Errorf("environment file %q not found", name)
		}
	} else if len(data.EnvFiles) == 1 {
		selected = data.EnvFiles[0]
	} else {
		for index, entry := range data.EnvFiles {
			fmt.Fprintf(app.Out, "%d. %s · %s · %s\n", index+1, entry.EnvName, entry.UserName, entry.UpdatedAt)
		}
		if !app.Interactive {
			return errors.New("multiple files found; select one using --name")
		}
		choice, err := app.prompt("Select a file number", "1")
		if err != nil {
			return err
		}
		index, err := strconv.Atoi(choice)
		if err != nil || index < 1 || index > len(data.EnvFiles) {
			return errors.New("invalid file selection")
		}
		selected = data.EnvFiles[index-1]
	}
	var plain []byte
	if selected.IsEncrypted {
		key, err := client.Key()
		if err != nil {
			return err
		}
		plain, err = Decrypt(selected.Content, key)
		if err != nil {
			return err
		}
	} else {
		plain = []byte(selected.Content)
	}
	if output == "" {
		output = safeName(selected.EnvName)
		if app.Interactive {
			if output, err = app.prompt("Output file", output); err != nil {
				return err
			}
		}
	}
	if !force {
		if _, err = os.Lstat(output); err == nil {
			accepted, err := app.confirm("Replace " + output + "?")
			if err != nil {
				return err
			}
			if !accepted {
				return errors.New("pull cancelled; existing file was not modified")
			}
			force = true
		} else if !os.IsNotExist(err) {
			return err
		}
	}
	if err = WriteSecret(output, plain, force); err != nil {
		return err
	}
	fmt.Fprintf(app.Out, "Environment file saved to %s.\n", output)
	return nil
}
func safeName(name string) string {
	value := regexp.MustCompile(`[\\/:*?"<>|\x00-\x1f]`).ReplaceAllString(name, "_")
	if value == "" || strings.Trim(value, ".") == "" {
		return ".env"
	}
	return value
}
func WriteSecret(path string, content []byte, force bool) error {
	if !force {
		file, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
		if err != nil {
			return err
		}
		_, writeErr := file.Write(content)
		closeErr := file.Close()
		if writeErr != nil {
			_ = os.Remove(path)
			return writeErr
		}
		return closeErr
	}
	// Never follow a symlink, even when overwrite was explicitly requested.
	if info, err := os.Lstat(path); err == nil && !info.Mode().IsRegular() {
		return errors.New("destination is not a regular file")
	} else if err != nil && !os.IsNotExist(err) {
		return err
	}
	dir := filepath.Dir(path)
	temp, err := os.CreateTemp(dir, ".varte-*")
	if err != nil {
		return err
	}
	defer os.Remove(temp.Name())
	if err = temp.Chmod(0600); err != nil {
		temp.Close()
		return err
	}
	if _, err = temp.Write(content); err != nil {
		temp.Close()
		return err
	}
	if err = temp.Sync(); err != nil {
		temp.Close()
		return err
	}
	if err = temp.Close(); err != nil {
		return err
	}
	return replaceFile(temp.Name(), path)
}
