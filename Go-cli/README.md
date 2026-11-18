# Varte — native Go, installed through npm

Encrypted environment files for your GitHub repositories. Install or upgrade
with Node.js 18 or newer; you do not need Go or a compiler.

```sh
npm install -g varte@latest
varte --version
varte login
varte status
```

Supports Linux, macOS, and Windows on x64 and arm64. Version 2.1.0 adds variable search and exact-version
pulls. Existing commands and saved environment files remain compatible.

## Push, find, and pull files

```sh
varte push -f .env -d backend -n .env.production
varte list
varte pull -d backend --name .env.production --output .env
```

Inside a GitHub repository, varte detects its owner and name. Use `--owner` and
`--repo` to select a repository explicitly. Reading requires GitHub repository
access; uploading requires write access.

Each push adds a version without replacing earlier uploads. Pull asks before
replacing an existing destination. For scripts, specify `--name` and `--output`,
then use `--force` only when replacement is intended. `varte list --json` returns
structured output; treat it as private repository data.

## Sign-in and privacy

`varte status` checks your connected account. `varte logout` signs out this CLI.
An environment-based sign-in is available with `varte login --token-env GITHUB_TOKEN`;
this takes a variable name, never the token itself.

Keep downloaded environment files out of Git and public logs. Never share local
session files or put tokens directly into command arguments.

Read the [CLI guides](https://vathavaran-variable.vercel.app/docs) for command
options, examples, and troubleshooting. See [third-party notices](THIRD-PARTY-NOTICES.md)
for license acknowledgments.

## Find a saved variable

```sh
varte search GROK --json
varte search GROK_API_KEY --exact --owner example --repo project
varte search GROK --directory backend --name .env.production --history
varte pull --id SAVED_ID --output .env.production
```

Search defaults to all accessible repositories and the latest version of each
file. Use `--directory ""` for the root. Search output contains names and version
metadata. `list --json` includes file bodies. An incomplete search exits 2 and
reports what it could scan. A cancelled search exits 130.

Check `varte --help` for search support. To try this checkout with a compatible
backend, run `go build -o varte ./cmd/varte` in this directory.
