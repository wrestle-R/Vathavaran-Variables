# Varte CLI

> Securely manage environment variables across your GitHub repositories

Varte is a command-line tool that allows you to encrypt, store, and sync environment variables across different repositories and environments. It uses GitHub OAuth for authentication and provides end-to-end encryption for your sensitive data.

## Features

- 🔐 **Secure**: End-to-end encryption for your environment variables
- 🔄 **Sync**: Push and pull env files across different machines and repositories
- 🚀 **Easy to use**: Simple CLI commands with interactive prompts
- 🔑 **GitHub OAuth**: Secure authentication using your GitHub account
- 📦 **Multi-repo**: Manage environment variables for multiple repositories

## Installation

```bash
npm install -g varte
```

## Quick Start

### 1. Login with GitHub

```bash
varte login
```

This will open your browser for GitHub OAuth authentication.

### 2. Push Environment Variables

```bash
varte push
```

Encrypts and pushes your `.env` file to the cloud. You can also specify options:

```bash
varte push --file .env.production --owner myorg --repo myrepo
```

### 3. Pull Environment Variables

```bash
varte pull
```

Pulls and decrypts environment variables from the cloud.

### 4. List All Stored Environment Files

```bash
varte list
```

Shows all your stored environment files across repositories.

### 5. Logout

```bash
varte logout
```

## Commands
# Varte CLI

Varte is a lightweight command-line tool that securely encrypts, stores, and syncs environment
variables across your GitHub repositories. Designed for developers and teams, Varte uses
GitHub OAuth for authentication and performs local encryption so sensitive data never leaves
your machine in plaintext.

## Key features

- Secure local encryption of `.env` files before upload
- Push and pull environment files per repository and directory
- GitHub OAuth authentication (CLI flow supported)
- Interactive, keyboard-friendly prompts

## Installation

Install the CLI globally to use it from any directory:

```bash
npm install -g varte
```

You can also test a local package tarball before publishing:

```bash
npm pack
npm install -g ./varte-1.0.0.tgz
```

## Quick start

1. Authenticate with GitHub:

```bash
varte login
```

2. Encrypt and push an environment file:

```bash
varte push --file .env
```

3. Pull and decrypt an environment file:

```bash
varte pull
```

4. List stored environment files:

```bash
varte list
```

## Commands

- `varte login` — Authenticate using GitHub OAuth (opens browser)
- `varte logout` — Remove stored credentials from this machine
- `varte push` — Encrypt and upload an environment file
- `varte pull` — Download and decrypt an environment file
- `varte list` — List environment files you own or have access to

## Push / Pull options

Common options for `push`:

- `-f, --file <path>` — Path to env file (default: `.env`)
- `-o, --owner <owner>` — Repository owner (defaults to current user)
- `-r, --repo <repo>` — Repository name (auto-detected from git when possible)
- `-d, --directory <directory>` — Top-level directory inside the repo (interactive selector provided)
- `-n, --name <name>` — Custom name for the environment snapshot

Common options for `pull`:

- `-o, --owner <owner>` — Repository owner
- `-r, --repo <repo>` — Repository name
- `-d, --directory <directory>` — Top-level directory inside the repo (interactive selector provided)
- `--output <path>` — Output path for the decrypted file

## Security & privacy

- Files are encrypted locally using a symmetric key derived from your session.
- Only encrypted blobs are stored on the server. Varte does not store plaintext environment
	variables.
- Use a secure machine and protect your login credentials. If you lose access to your
	authentication, encrypted blobs may not be recoverable.

## Publishing & contributing

If you plan to contribute or publish fixes:

1. Fork the repo and create a feature branch
2. Add tests for new behaviors
3. Run linting/formatting (if configured)
4. Open a pull request with a clear description

Before publishing to `npm`, ensure `package.json` is correct: `name`, `version`, `bin`,
`repository`, `license`, and `keywords`. Run a dry run before publishing:

```bash
npm pack
npm publish --dry-run
```

If you publish a scoped package (for example `@your-scope/varte`), you may need to set
the package access to public on publish:

```bash
npm publish --access public
```

## Support

Report issues or feature requests on GitHub: https://github.com/wrestle-R/Vathavaran-Variables/issues

## License

MIT — see the `LICENSE` file in this repository.

## Maintainer

wrestle-R
