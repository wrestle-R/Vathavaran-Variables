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

Varte is a command-line tool for securely encrypting, storing, and synchronising environment
variable files for GitHub repositories. The project focuses on local encryption and a minimal,
keyboard-driven command-line experience.

This README documents only the CLI package in `cli/` and does not cover the web or server
components of the project.

Prerequisites
-------------

- Node.js 18 or later
- A GitHub account for authentication

Installation
------------

Install the CLI globally to make the `varte` command available system-wide:

```bash
npm install -g varte
```

Alternatively, to test a local package archive before publishing:

```bash
npm pack
npm install -g ./varte-1.0.1.tgz
```

Usage
-----

Authenticate with GitHub (opens a browser window):

```bash
varte login
```

Push a local `.env` file (interactive prompts will collect repository and directory information):

```bash
varte push
```

Pull and decrypt a stored environment snapshot:

```bash
varte pull
```

List environment snapshots for the current repository (auto-detected) or specify a repository:

```bash
varte list         # lists snapshots for current git repo when run inside a repo
varte list -o ORG -r REPO
```

Commands
--------

- `varte login` — Authenticate using GitHub OAuth.
- `varte logout` — Remove stored credentials from the local machine.
- `varte push` — Encrypt and upload an environment file to the remote store.
- `varte pull` — Download and decrypt an environment file to the local filesystem.
- `varte list` — List environment snapshots. When run inside a git repository it lists only
	snapshots belonging to that repository; you can also filter with `-o` and `-r`.

Common Options
--------------

Push options:

- `-f, --file <path>` — Path to env file (default: `.env`).
- `-o, --owner <owner>` — Repository owner (defaults to detected GitHub user).
- `-r, --repo <repo>` — Repository name (auto-detected when possible).
- `-d, --directory <directory>` — Top-level directory in the repository (interactive selector).
- `-n, --name <name>` — Custom name for the environment snapshot.

Pull options:

- `-o, --owner <owner>` — Repository owner.
- `-r, --repo <repo>` — Repository name.
- `-d, --directory <directory>` — Top-level directory in the repository.
- `--output <path>` — Output path for the decrypted file.

Security and Privacy
--------------------

All environment files are encrypted locally before being uploaded. The server stores only
encrypted blobs; plaintext environment values are never transmitted or persisted by the CLI.

Contributing
------------

Contributions are welcome. Typical workflow:

1. Fork the repository and create a feature branch.
2. Implement your changes and add tests where applicable.
3. Open a pull request with a clear description of the change.

Before publishing
-----------------

Ensure `package.json` contains correct metadata (`name`, `version`, `bin`, `repository`,
`keywords`). Use `npm pack` and `npm publish --dry-run` to verify package contents
before publishing.

Maintainer
----------

wrestle-R
