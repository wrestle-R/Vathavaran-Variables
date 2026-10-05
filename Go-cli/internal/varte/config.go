package varte

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"runtime"
)

type Auth struct {
	UserID   int64  `json:"userId"`
	UserName string `json:"userName"`
	Token    string `json:"token"`
}

func configPath() (string, error) {
	if dir := os.Getenv("VATHAVARAN_CONFIG_DIR"); dir != "" {
		return filepath.Join(dir, "config.json"), nil
	}
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "varte", "config.json"), nil
}
func legacyPath() string {
	home, _ := os.UserHomeDir()
	switch runtime.GOOS {
	case "darwin":
		return filepath.Join(home, "Library", "Preferences", "vathavaran-cli-nodejs", "config.json")
	case "windows":
		return filepath.Join(os.Getenv("APPDATA"), "vathavaran-cli-nodejs", "Config", "config.json")
	default:
		dir := os.Getenv("XDG_CONFIG_HOME")
		if dir == "" {
			dir = filepath.Join(home, ".config")
		}
		return filepath.Join(dir, "vathavaran-cli-nodejs", "config.json")
	}
}
func LoadAuth() (*Auth, error) {
	path, err := configPath()
	if err != nil {
		return nil, err
	}
	raw, err := os.ReadFile(path)
	if os.IsNotExist(err) && os.Getenv("VATHAVARAN_CONFIG_DIR") == "" {
		raw, err = os.ReadFile(legacyPath())
	}
	if err != nil {
		if os.IsNotExist(err) {
			return nil, errors.New("not signed in; run varte login")
		}
		return nil, err
	}
	var auth Auth
	if err = json.Unmarshal(raw, &auth); err != nil {
		return nil, errors.New("invalid session file; run varte login again")
	}
	if auth.Token == "" {
		return nil, errors.New("not signed in; run varte login")
	}
	return &auth, nil
}
func SaveAuth(auth *Auth) error {
	path, err := configPath()
	if err != nil {
		return err
	}
	if err = os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return err
	}
	raw, err := json.Marshal(auth)
	if err != nil {
		return err
	}
	temp, err := os.CreateTemp(filepath.Dir(path), "session-*")
	if err != nil {
		return err
	}
	defer os.Remove(temp.Name())
	if err = temp.Chmod(0600); err != nil {
		temp.Close()
		return err
	}
	if _, err = temp.Write(raw); err != nil {
		temp.Close()
		return err
	}
	if err = temp.Close(); err != nil {
		return err
	}
	// Windows cannot atomically rename over an existing file.
	if runtime.GOOS == "windows" {
		if err = os.Remove(path); err != nil && !os.IsNotExist(err) {
			return err
		}
	}
	return os.Rename(temp.Name(), path)
}
func ClearAuth() error {
	path, err := configPath()
	if err != nil {
		return err
	}
	// Keep a signed-out tombstone so an older CLI session is not silently restored.
	if err = os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return err
	}
	return os.WriteFile(path, []byte("{}\n"), 0600)
}
