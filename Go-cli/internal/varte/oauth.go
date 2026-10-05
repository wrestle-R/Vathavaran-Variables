package varte

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os/exec"
	"runtime"
	"time"
)

func openBrowser(address string) error {
	var command *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		command = exec.Command("open", address)
	case "windows":
		command = exec.Command("rundll32", "url.dll,FileProtocolHandler", address)
	default:
		command = exec.Command("xdg-open", address)
	}
	return command.Run()
}
func (app *App) login() error {
	client, err := NewClient("")
	if err != nil {
		return err
	}
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return err
	}
	defer listener.Close()
	nonceBytes := make([]byte, 32)
	if _, err = rand.Read(nonceBytes); err != nil {
		return err
	}
	nonce := hex.EncodeToString(nonceBytes)
	callback := fmt.Sprintf("http://%s/callback?nonce=%s", listener.Addr(), nonce)
	address := client.Base + "/api/auth/github/cli?redirect_uri=" + url.QueryEscape(callback)
	results := make(chan *Auth, 1)
	failures := make(chan error, 1)
	mux := http.NewServeMux()
	mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Referrer-Policy", "no-referrer")
		if r.Method != "GET" || r.URL.Query().Get("nonce") != nonce {
			http.Error(w, "Invalid login callback", 400)
			return
		}
		token := r.URL.Query().Get("token")
		if token == "" {
			http.Error(w, "No token returned", 400)
			return
		}
		var user User
		if err := json.Unmarshal([]byte(r.URL.Query().Get("user")), &user); err != nil || user.Login == "" {
			http.Error(w, "Invalid user", 400)
			return
		}
		select {
		case results <- &Auth{UserID: user.ID, UserName: user.Login, Token: token}:
			fmt.Fprint(w, "Signed in to Vathavaran. You can close this tab.")
		default:
			http.Error(w, "Login already completed", 409)
		}
	})
	server := &http.Server{Handler: mux, ReadHeaderTimeout: 5 * time.Second}
	go func() {
		if err := server.Serve(listener); err != nil && !errors.Is(err, http.ErrServerClosed) {
			select {
			case failures <- err:
			default:
			}
		}
	}()
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		_ = server.Shutdown(ctx)
	}()
	fmt.Fprintln(app.Out, "Opening GitHub sign-in in your browser…")
	fmt.Fprintln(app.Out, "If it does not open, visit:", address)
	_ = openBrowser(address)
	select {
	case auth := <-results:
		// Verify callback identity against GitHub through the new server before saving.
		client.Token = auth.Token
		var user User
		if err = client.Request("GET", "/api/user", nil, &user); err != nil {
			return err
		}
		auth.UserID = user.ID
		auth.UserName = user.Login
		if err = SaveAuth(auth); err != nil {
			return err
		}
		fmt.Fprintf(app.Out, "Signed in as %s.\n", auth.UserName)
		return nil
	case err := <-failures:
		return err
	case <-time.After(5 * time.Minute):
		return errors.New("sign-in timed out; run varte login again")
	}
}
