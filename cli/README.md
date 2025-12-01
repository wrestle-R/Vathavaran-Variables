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

| Command | Description | Options |
|---------|-------------|---------|
| `varte login` | Login using GitHub OAuth | - |
| `varte logout` | Logout from Varte | - |
| `varte push` | Push encrypted env file to cloud | `--file`, `--owner`, `--repo`, `--directory`, `--name` |
| `varte pull` | Pull and decrypt env file | `--owner`, `--repo`, `--directory`, `--output` |
| `varte list` | List all stored env files | - |

## Options

### Push Command Options

- `-f, --file <path>` - Path to env file (default: `.env`)
- `-o, --owner <owner>` - Repository owner
- `-r, --repo <repo>` - Repository name
- `-d, --directory <directory>` - Directory path in repository
- `-n, --name <name>` - Custom name for the env file

### Pull Command Options

- `-o, --owner <owner>` - Repository owner
- `-r, --repo <repo>` - Repository name
- `-d, --directory <directory>` - Directory path in repository
- `--output <path>` - Output file path

## How It Works

1. **Authentication**: Uses GitHub OAuth for secure authentication
2. **Encryption**: Your environment variables are encrypted locally before being sent
3. **Storage**: Encrypted data is stored securely in the cloud
4. **Sync**: Pull your encrypted env files on any machine after authentication
5. **Decryption**: Files are decrypted locally when you pull them

## Security

- All environment variables are encrypted before leaving your machine
- Encryption keys are derived from your authentication
- Only you can decrypt your environment variables
- No plain-text storage in the cloud

## Requirements

- Node.js >= 18.0.0
- A GitHub account

## License

MIT

## Author

wrestle-R

## Links

- [GitHub Repository](https://github.com/wrestle-R/Vathavaran-Variables)
- [Report Issues](https://github.com/wrestle-R/Vathavaran-Variables/issues)
