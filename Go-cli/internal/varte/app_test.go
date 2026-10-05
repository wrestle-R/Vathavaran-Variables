package varte

import (
	"bufio"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestPullDoesNotOverwriteAndUsesLegacyCiphertext(t *testing.T) {
	config := t.TempDir()
	t.Setenv("VATHAVARAN_CONFIG_DIR", config)
	if err := SaveAuth(&Auth{UserID: 1, UserName: "owner", Token: "test-token"}); err != nil {
		t.Fatal(err)
	}
	ciphertext, _ := Encrypt([]byte("KEY=value\n"), "fixture-key")
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer test-token" {
			t.Error("missing bearer auth")
		}
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/api/env/pull":
			json.NewEncoder(w).Encode(map[string]any{"envFiles": []EnvFile{{EnvName: ".env", Content: ciphertext, IsEncrypted: true}}})
		case "/api/encryption-key":
			json.NewEncoder(w).Encode(map[string]string{"encryptionKey": "fixture-key"})
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()
	t.Setenv("VATHAVARAN_BACKEND_URL", server.URL)
	path := filepath.Join(t.TempDir(), ".env")
	os.WriteFile(path, []byte("existing"), 0600)
	var output bytes.Buffer
	app := &App{In: bufio.NewReader(strings.NewReader("")), Out: &output, Err: &output}
	args := []string{"pull", "-o", "owner", "-r", "repo", "--output", path}
	if err := app.Run(args); err == nil {
		t.Fatal("overwrite should be rejected")
	}
	raw, _ := os.ReadFile(path)
	if string(raw) != "existing" {
		t.Fatal("existing file changed")
	}
	if err := app.Run(append(args, "--force")); err != nil {
		t.Fatal(err)
	}
	raw, _ = os.ReadFile(path)
	if string(raw) != "KEY=value\n" {
		t.Fatal("wrong decrypted contents")
	}
	if err := ClearAuth(); err != nil {
		t.Fatal(err)
	}
	if _, err := LoadAuth(); err == nil {
		t.Fatal("logout restored a session")
	}
}
func TestWriteSecretRejectsSymlink(t *testing.T) {
	directory := t.TempDir()
	target := filepath.Join(directory, "target")
	os.WriteFile(target, []byte("untouched"), 0600)
	link := filepath.Join(directory, "link")
	if err := os.Symlink(target, link); err != nil {
		t.Skip("symlinks unsupported")
	}
	if err := WriteSecret(link, []byte("new"), true); err == nil {
		t.Fatal("symlink should be rejected")
	}
	raw, _ := os.ReadFile(target)
	if string(raw) != "untouched" {
		t.Fatal("symlink target changed")
	}
}
func TestClientReportsFailureAndDoesNotFollowRedirects(t *testing.T) {
	var leaked bool
	destination := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { leaked = true }))
	defer destination.Close()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { http.Redirect(w, r, destination.URL, 307) }))
	defer server.Close()
	t.Setenv("VATHAVARAN_BACKEND_URL", server.URL)
	client, err := NewClient("secret")
	if err != nil {
		t.Fatal(err)
	}
	if err = client.Request("GET", "/api/user", nil, nil); err == nil {
		t.Fatal("redirect should fail")
	}
	if leaked {
		t.Fatal("followed redirect with token")
	}
}
