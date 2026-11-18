# Vathavaran workflows

## Sign in

Install Varte with `npm install -g varte@latest` and check `varte --version` and `varte --help`. If the installed release lacks search, build the CLI from the repository's `Go-cli` directory with `go build -o varte ./cmd/varte` and use a compatible backend. The web workspace and Expo build also need the search endpoints.

Run `varte login` to sign in through your browser, `varte status` to verify the account, and `varte logout` to clear the CLI session. If a token is already supplied in the environment, `varte login --token-env GITHUB_TOKEN` uses the variable's name. Website and mobile sessions use GitHub sign-in independently.

GitHub permissions control repository access. Public source visibility alone does not grant access to saved files. Uploads require repository write access.

## Find and retrieve a version

```sh
varte search GROK --json
varte search GROK_API_KEY --exact --owner example --repo project --directory backend --name .env.production
varte search GROK --history
varte pull --id SAVED_ID --output .env.production
```

Search reads assignment names from authorized saved files, including older upload formats. Queries are case insensitive. Directory and filename filters match saved labels exactly. Use `--directory ""` for the root. Search does not inspect unsaved local files, comments, or values.

JSON includes `schemaVersion`, `status`, `scanned`, `eligible`, `matches`, and `errors`. Each match has an ID, repository, directory, filename, timestamps, `names`, and `historical`. A completed empty result exits 0. An incomplete scan exits 2, a cancelled scan exits 130, and command or authentication setup errors exit 1. Recheck the filters and your session, or try a narrower search if discovery or file retrieval fails.

## Manage uploads and versions

```sh
varte push --owner example --repo project -f .env -d backend -n .env.production
varte list --owner example --repo project
varte pull --owner example --repo project -d backend --name .env.production --output .env
```

Push adds a saved version. Directory labels organize saved files and need not correspond to local paths. Ordinary commands can infer the GitHub repository from the checkout. Search defaults to all accessible repositories, even inside a checkout. Explicit output paths make downloads predictable. Omit `--force` to retain overwrite protection.

## Website and mobile

In the web workspace, sign in with GitHub and use **Search variables** from Workspace or a repository page. **View version** selects the exact version and **Reveal contents** decrypts it in the browser. Copy or download only when needed. The repository browser also lets you upload files, browse earlier versions, and change appearance from the site controls.

In the mobile app, open **Search** for the workspace or **Search variables** inside a repository. Open a version and reveal or copy it when needed. Moving the app to the background cancels the search and closes its decrypted viewer. Sign-in and appearance controls are in **Account** once connected. Use the web or CLI to upload.

For access errors, verify the connected account and whether it can read the repository. If a completed search has no matches, check spelling, directory and filename labels, and whether the variable was removed from the newest version. For incomplete searches, retry with a narrower scope. The clients decrypt files during the scan and retain match metadata.
