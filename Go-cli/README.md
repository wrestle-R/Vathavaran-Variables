# Varte — native Go, installed through npm

Encrypted environment files for your GitHub repositories. Install or upgrade
with Node.js 18 or newer; you do not need Go or a compiler.

```sh
npm install -g varte@latest
varte --version
varte login
varte status
```

Supports Linux, macOS, and Windows on x64 and arm64. Version 2.0.0 is available
under the existing varte package name. Existing commands and saved environment
files remain compatible.

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
