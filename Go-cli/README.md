# Varte — native Go, installed through npm

The implementation is Go. npm ships the six prebuilt native binaries and a small
launcher; users need Node for installation, but do not need Go or a compiler.

```sh
npm install -g varte@latest
varte login
varte push -f .env -d backend -n .env.production
varte pull -d backend --output .env
varte list --json
```

Version 2.0.0 is published as the existing `varte` package. The install command
also upgrades the JavaScript CLI and keeps its saved session available for import.
The CLI uses `https://vathavaran-variable.vercel.app` as its API server. For development:

```sh
export VATHAVARAN_BACKEND_URL=http://localhost:3000
```

Existing `login`, `logout`, `push`, `pull`, `list`, owner/repo/directory/file/name
flags, and CryptoJS encrypted files are preserved. Legacy JavaScript CLI sessions
are read when no Go session exists. Logging out creates a tombstone so a legacy
session cannot silently log you back in. New sessions and decrypted files use
owner-only permissions where supported.

`pull` asks before replacing files. For scripts, use `--name` to select a file,
`--output` for its destination, and `--force` when replacement is intended.
An environment-based login is also available: `varte login --token-env GITHUB_TOKEN`.
Never put a token directly into shell command arguments.

## Learning and developing Go

Install Go 1.23 or newer. The CLI uses Go’s standard library plus golang.org/x/term for reliable terminal detection.

```sh
cd Go-cli
go run ./cmd/varte --help
go test -race ./...
go vet ./...
go build -o bin/varte ./cmd/varte
```

`cmd/varte/main.go` is the executable entry point. `internal/varte/app.go` handles
commands and prompts. `client.go` speaks to Next, `oauth.go` handles browser login,
`config.go` stores sessions, and `crypto.go` preserves the existing encryption.
Go returns errors explicitly; the entry point prints them and exits with code 1.
Use `gofmt -w .` after editing: Go has a standard formatter.

## Preparing an npm release

```sh
npm run build
npm pack
```

The build cross-compiles Linux, macOS, and Windows binaries for x64 and arm64,
with CGO disabled. `npm pack` builds them too, so the published package never
requires a user-side download or Go installation. Inspect the tarball, test the
launcher, then publish only after Next is deployed. Generated binaries are ignored
by Git and included in the npm package through its explicit `files` list.

The legacy AES-CBC passphrase format is retained for compatibility. It is not an
authenticated ciphertext format. Do not change the passphrase while existing files
still depend on it.
