package varte

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

const DefaultBackend = "https://vathavaran-variable.vercel.app"

type Client struct {
	Base  string
	Token string
	HTTP  *http.Client
}
type User struct {
	ID    int64  `json:"id"`
	Login string `json:"login"`
}
type EnvFile struct {
	ID           string `json:"id"`
	UserName     string `json:"userName"`
	RepoFullName string `json:"repoFullName"`
	Directory    string `json:"directory"`
	EnvName      string `json:"envName"`
	Content      string `json:"content"`
	IsEncrypted  bool   `json:"isEncrypted"`
	UpdatedAt    string `json:"updatedAt"`
}

func NewClient(token string) (*Client, error) {
	base := os.Getenv("VATHAVARAN_BACKEND_URL")
	if base == "" {
		base = DefaultBackend
	}
	parsed, err := url.Parse(base)
	if err != nil || parsed.Host == "" || parsed.User != nil || parsed.RawQuery != "" || parsed.Fragment != "" {
		return nil, errors.New("invalid VATHAVARAN_BACKEND_URL")
	}
	if parsed.Scheme != "https" && !(parsed.Scheme == "http" && (parsed.Hostname() == "localhost" || parsed.Hostname() == "127.0.0.1" || parsed.Hostname() == "::1")) {
		return nil, errors.New("backend must use HTTPS (HTTP is allowed only for local development)")
	}
	return &Client{Base: strings.TrimRight(base, "/"), Token: token, HTTP: &http.Client{Timeout: 30 * time.Second, CheckRedirect: func(req *http.Request, via []*http.Request) error { return http.ErrUseLastResponse }}}, nil
}
func (client *Client) Request(method, path string, input, output any) error {
	var body io.Reader
	if input != nil {
		raw, err := json.Marshal(input)
		if err != nil {
			return err
		}
		body = bytes.NewReader(raw)
	}
	request, err := http.NewRequest(method, client.Base+path, body)
	if err != nil {
		return err
	}
	if input != nil {
		request.Header.Set("Content-Type", "application/json")
	}
	if client.Token != "" {
		request.Header.Set("Authorization", "Bearer "+client.Token)
	}
	response, err := client.HTTP.Do(request)
	if err != nil {
		return errors.New("could not reach the server; check your connection and VATHAVARAN_BACKEND_URL")
	}
	defer response.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(response.Body, 20*1024*1024+1))
	if err != nil {
		return err
	}
	if len(raw) > 20*1024*1024 {
		return errors.New("server response exceeds the 20 MB limit; filter by repository")
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		var result struct {
			Error string `json:"error"`
		}
		_ = json.Unmarshal(raw, &result)
		if result.Error == "" {
			result.Error = http.StatusText(response.StatusCode)
		}
		if response.StatusCode == 401 {
			return fmt.Errorf("%s; run varte login", result.Error)
		}
		return fmt.Errorf("server returned HTTP %d: %s", response.StatusCode, result.Error)
	}
	if output == nil {
		return nil
	}
	if err = json.Unmarshal(raw, output); err != nil {
		return errors.New("server returned an invalid response; check the backend URL")
	}
	return nil
}
func (client *Client) Key() (string, error) {
	var data struct {
		EncryptionKey string `json:"encryptionKey"`
	}
	if err := client.Request("GET", "/api/encryption-key", nil, &data); err != nil {
		return "", err
	}
	if data.EncryptionKey == "" {
		return "", errors.New("server did not return an encryption key")
	}
	return data.EncryptionKey, nil
}
