# Vathavaran Variables

Encrypted environment files for your GitHub repositories, across terminal, web,
and mobile. The website and every API route now live in one Next.js application.
The native CLI is implemented in Go and distributed through npm.

```text
Go-cli/   Native varte implementation and npm packaging
Next/     Next.js website, documentation, GitHub OAuth, and encrypted-file API
Expo/     Expo / React Native application
Docs/     Local context, plans, and verification artifacts (gitignored)
```

Production Next URL: **https://vathavaran-variable.vercel.app**.
The singular `variable` hostname is intentional.

## Run the website and server

Use Node.js 22 or newer.

```sh
cd Next
npm ci
cp .env.example .env.local
# Fill in the existing server, encryption, and GitHub credentials.
npm run dev
```

For local OAuth testing, use a development GitHub OAuth app with a callback of
`http://localhost:3000/api/auth/github/callback` and set `APP_URL=http://localhost:3000`.
The production OAuth app points to the deployed Next callback instead.

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Documentation is available at `/docs`, with separate pages for installation,
quickstart, CLI commands, web/mobile guides, API, security, deployment, and debugging.

## Run the Go CLI

```sh
cd Go-cli
go run ./cmd/varte --help
go test -race ./...
go vet ./...
npm run build
node npm/varte.cjs --version
npm pack
```

Go 1.23+ is required to build. The npm package includes native binaries for Linux,
macOS, and Windows on x64 and arm64. End users do not need Go.

```sh
npm install -g varte@latest
varte login
varte push -f .env -d backend -n .env.production
varte pull -d backend --output .env
varte list --json
```

The Go 2.0.0 release is published as [varte on npm](https://www.npmjs.com/package/varte).
The install command above also upgrades the original JavaScript package. See [Go-cli/README.md](Go-cli/README.md)
for compatibility, configuration, beginner-friendly Go guidance, and release steps.
The new CLI defaults to Next. Use `VATHAVARAN_BACKEND_URL=http://localhost:3000` to
exercise a local server. Pull protects existing files; `--force` allows an intentional
replacement. GitHub sessions from the original JavaScript CLI can be reused.

## Run and build Expo

```sh
cd Expo
npm ci
npm start
npm run typecheck
npm run lint
npx expo install --check
npx expo-doctor
eas build --profile preview --platform android
```

The preview profile produces an APK for internal distribution and connects to the
new Next URL. The app defaults to dark graphite and offers light/system themes.
Native tokens use Expo SecureStore. Public Expo configuration contains URLs only.

The Android preview is available as a [downloadable APK](https://expo.dev/artifacts/eas/k-OK0GGHhh5ieZAVBmlW_tqWIDgADnl30EbHG3yrxcM.apk).
It is an internal preview; physical-device verification is still pending.

## Data compatibility

Files are encrypted on your device before upload and stay encrypted in storage.
Uploads append versions. The migration does not reset or rewrite
existing document IDs, author fields, timestamps, directories, or ciphertext.

The actual legacy encryption is CryptoJS's OpenSSL-compatible salted AES-256-CBC
passphrase format, preserved by Go. Earlier documentation incorrectly described it
as AES-GCM. The format is not authenticated encryption and the service uses a shared
server-managed passphrase; it is not a zero-knowledge vault. **Preserve ENCRYPTION_KEY**
while existing files depend on it.

Next verifies GitHub repository permissions for reads and writes. The encryption-key
route requires authentication. Web sessions use encrypted HTTP-only cookies;
native clients use bearer tokens. Public repository visibility alone does not grant
access to its environment files. Upgrade older clients with `npm install -g varte@latest`
to connect to the current Next server.

## Deploy Next to Vercel

Set the Vercel Root Directory to `Next`, framework to Next.js, and runtime to Node.js
22+. Add the server variables listed in [Next/.env.example](Next/.env.example).

```env
APP_URL=https://vathavaran-variable.vercel.app
GITHUB_CALLBACK_URL=https://vathavaran-variable.vercel.app/api/auth/github/callback
```

In the existing GitHub OAuth app:

- Homepage URL: `https://vathavaran-variable.vercel.app`
- Authorization callback URL: `https://vathavaran-variable.vercel.app/api/auth/github/callback`

Redeploy after environment changes. `/api/health` is a liveness check, not a storage
credential check. Verify an authenticated list, a legacy file read/decryption, and
GitHub sign-in before publishing the CLI or relying on the mobile app.

Secrets, local environment files, generated binaries, APKs, and `Docs/` are ignored.
Do not commit decrypted environment files or include them in release artifacts.
