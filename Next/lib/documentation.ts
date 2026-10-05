export type DocSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  steps?: string[];
  code?: { label: string; value: string }[];
  table?: { headers: string[]; rows: string[][] };
  note?: { title: string; text: string };
};
export type DocPage = {
  slug: string;
  group: string;
  title: string;
  description: string;
  sections: DocSection[];
};
export const documentation: DocPage[] = [
  {
    slug: "",
    group: "Get started",
    title: "Introduction",
    description:
      "Give every environment a home. Vathavaran connects encrypted environment files to the GitHub repositories your team already uses.",
    sections: [
      {
        id: "overview",
        title: "One workspace, three ways in",
        paragraphs: [
          "Vathavaran stores encrypted versions of environment files, organized by repository and directory. A teammate can upload a configuration once, and collaborators with repository access can retrieve it from the CLI, website, or mobile app.",
          "Use the Go CLI when working in a repository. Use the web workspace to browse, upload, decrypt, or download files. Use the Expo app to view and copy files on your phone. Each client connects to the same Next server and existing Firestore database.",
        ],
        table: {
          headers: ["Client", "Best for"],
          rows: [
            [
              "varte CLI",
              "Pushing and pulling files from your local development workflow",
            ],
            [
              "Web workspace",
              "Browsing repositories, inspecting versions, and uploading files",
            ],
            ["Expo app", "Finding and copying environment files on Android"],
          ],
        },
      },
      {
        id: "workflow",
        title: "The everyday workflow",
        steps: [
          "Sign in with GitHub. Vathavaran verifies your identity and repository access.",
          "Push a local .env file. Its contents are encrypted before upload, and a new version is added.",
          "Choose a repository and directory, then pull the version you need. It is decrypted on your device.",
        ],
        code: [
          {
            label: "Terminal",
            value:
              "varte login\nvarte push -f .env -d backend -n .env.production\nvarte pull -d backend --output .env",
          },
        ],
      },
      {
        id: "concepts",
        title: "A few useful concepts",
        table: {
          headers: ["Term", "Meaning"],
          rows: [
            ["Repository", "A GitHub owner/name pair, such as your-team/api"],
            [
              "Directory",
              "A logical folder label inside the repository. An empty string means the root.",
            ],
            [
              "Environment file",
              "A saved version with a name, author, timestamp, and encrypted content",
            ],
            [
              "Version",
              "A separate document created by each upload. Uploads do not replace earlier versions.",
            ],
            [
              "Encryption passphrase",
              "The server’s existing shared passphrase used by clients to preserve legacy ciphertext compatibility.",
            ],
          ],
        },
      },
      {
        id: "next-steps",
        title: "Where to go next",
        paragraphs: [
          "Start with Installation, then follow the Quickstart. The CLI reference explains every option, while the web and mobile guides walk through their interfaces. Maintainers should read Deployment before changing server settings.",
        ],
        note: {
          title: "Go CLI available on npm",
          text: "Varte 2.0.0 is published under the existing varte package name. Install or upgrade with npm install -g varte@latest. The package includes native Go binaries, so users do not need a Go compiler.",
        },
      },
    ],
  },
  {
    slug: "installation",
    group: "Get started",
    title: "Installation",
    description:
      "Install varte through npm, or run the Go implementation directly from this repository.",
    sections: [
      {
        id: "requirements",
        title: "What you need",
        table: {
          headers: ["Requirement", "Details"],
          rows: [
            ["GitHub account", "Access to the repository you want to use"],
            ["Node.js 18+", "Required for the npm installer and launcher"],
            ["Operating system", "Linux, macOS, or Windows on x64 or arm64"],
            ["Git", "Recommended for automatic repository detection"],
            ["Go 1.23+", "Only needed to develop or build the CLI yourself"],
          ],
        },
      },
      {
        id: "npm",
        title: "Install from npm",
        paragraphs: [
          "The npm package contains prebuilt Go binaries and a small launcher. Users do not need a Go compiler. The launcher selects the binary matching your operating system and CPU architecture.",
        ],
        code: [
          {
            label: "npm",
            value: "npm install -g varte@latest\nvarte --version\nvarte --help",
          },
        ],
        note: {
          title: "Upgrading from the JavaScript CLI",
          text: "The install command upgrades your existing varte installation to the Go release. Run varte --version to confirm 2.0.0 or newer. Existing commands, encrypted files, and saved JavaScript CLI sessions remain compatible. Source builds are optional.",
        },
      },
      {
        id: "source",
        title: "Run from source",
        paragraphs: [
          "Clone the repository and enter Go-cli. Go downloads the small terminal-support dependency automatically when you build.",
        ],
        code: [
          {
            label: "Terminal",
            value:
              "git clone https://github.com/wrestle-R/Vathavaran-Variables.git\ncd Vathavaran-Variables/Go-cli\ngo run ./cmd/varte --help\ngo build -o bin/varte ./cmd/varte\n./bin/varte login",
          },
          {
            label: "PowerShell",
            value:
              "git clone https://github.com/wrestle-R/Vathavaran-Variables.git\ncd Vathavaran-Variables/Go-cli\ngo build -o bin/varte.exe ./cmd/varte\n.\\bin\\varte.exe --help",
          },
        ],
      },
      {
        id: "update",
        title: "Update an existing installation",
        code: [
          {
            label: "npm",
            value: "npm install -g varte@latest\nvarte --version\nvarte status",
          },
        ],
        paragraphs: [
          "The Go CLI can read the original JavaScript CLI’s saved session when a new Go session does not exist. Commands and encrypted file format remain compatible. New releases point at the Next server instead of the old Worker.",
        ],
      },
    ],
  },
  {
    slug: "quickstart",
    group: "Get started",
    title: "Quickstart",
    description:
      "Go from a repository clone to a shared environment file in a few deliberate steps.",
    sections: [
      {
        id: "start",
        title: "1. Connect your GitHub account",
        code: [{ label: "Terminal", value: "varte login\nvarte status" }],
        paragraphs: [
          "The login command opens GitHub in your browser. After authorization, the server returns your session to a temporary loopback listener on your device. The CLI verifies your identity and saves your session locally.",
        ],
      },
      {
        id: "repository",
        title: "2. Check your repository",
        code: [
          {
            label: "Terminal",
            value: "git remote -v\nvarte list -o your-team -r your-project",
          },
        ],
        paragraphs: [
          "Inside a GitHub repository, varte can detect the owner and repository from remote.origin.url. Explicit --owner and --repo flags are useful outside the repository or when your remote points somewhere else.",
        ],
      },
      {
        id: "push",
        title: "3. Upload an environment file",
        code: [
          {
            label: "Terminal",
            value:
              "varte push -f .env -o your-team -r your-project -d backend -n .env.production",
          },
        ],
        paragraphs: [
          "This reads your local .env file, encrypts it on your device, and creates a version under the backend directory. You need GitHub write access. Keep real .env files out of Git.",
        ],
        note: {
          title: "Use a clear file name",
          text: "A name such as .env.production or .env.staging is easier to recognize. The default name includes a local timestamp and your GitHub username.",
        },
      },
      {
        id: "pull",
        title: "4. Pull it on another machine",
        code: [
          {
            label: "Terminal",
            value:
              "varte login\nvarte pull -o your-team -r your-project -d backend --output .env",
          },
        ],
        paragraphs: [
          "Choose an available version when prompted. The CLI decrypts it locally and saves it with owner-only permissions where the operating system supports them. Existing destination files require confirmation.",
        ],
      },
      {
        id: "verify",
        title: "5. Verify and collaborate",
        code: [
          {
            label: "Terminal",
            value: "varte list -o your-team -r your-project\nvarte status",
          },
        ],
        paragraphs: [
          "A collaborator signs in with their own GitHub account and uses the same owner, repository, and directory. They do not need to be the original uploader, but GitHub must grant them repository access.",
        ],
      },
    ],
  },
  {
    slug: "cli/login",
    group: "CLI reference",
    title: "Login & sessions",
    description:
      "Connect GitHub, check your session, and sign out without exposing credentials in terminal history.",
    sections: [
      {
        id: "login",
        title: "Browser login",
        code: [{ label: "Terminal", value: "varte login" }],
        paragraphs: [
          "The CLI binds a temporary HTTP listener to 127.0.0.1 on an available port. The Next server handles GitHub OAuth and redirects back to that listener. A random nonce protects the local callback; the server also binds OAuth state to a short-lived HTTP-only cookie.",
          "If the browser does not open automatically, copy the printed sign-in URL into your browser. The CLI waits up to five minutes. Restart login if it times out.",
        ],
      },
      {
        id: "token",
        title: "Use a token from an environment variable",
        code: [
          { label: "Terminal", value: "varte login --token-env GITHUB_TOKEN" },
        ],
        paragraphs: [
          "When GITHUB_TOKEN is already present in your environment, this verifies the token through the Next server and stores the resulting session. Use a token that can access your target repositories. Organization SSO settings may require additional authorization.",
          "Avoid putting the token itself in command arguments or sharing it in chat. The --token-env option takes a variable name, not a secret value.",
        ],
      },
      {
        id: "status",
        title: "Check the connected account and server",
        code: [{ label: "Terminal", value: "varte status" }],
        paragraphs: [
          "Status asks the configured server to verify your token with GitHub. It prints the username and server URL, never the token. Expired or revoked sessions return an error and a nonzero exit code.",
        ],
      },
      {
        id: "logout",
        title: "Sign out",
        code: [{ label: "Terminal", value: "varte logout" }],
        paragraphs: [
          "Logout clears the Go CLI session and leaves a signed-out marker so the original JavaScript session is not restored accidentally. It does not revoke the OAuth app on GitHub or sign out other devices. Revoke the app in GitHub settings if you need to invalidate its access.",
        ],
      },
      {
        id: "storage",
        title: "Where sessions live",
        table: {
          headers: ["Platform", "Go CLI session"],
          rows: [
            [
              "Linux",
              "$XDG_CONFIG_HOME/varte/config.json or ~/.config/varte/config.json",
            ],
            ["macOS", "~/Library/Application Support/varte/config.json"],
            ["Windows", "%AppData%/varte/config.json"],
            ["Override", "$VATHAVARAN_CONFIG_DIR/config.json"],
          ],
        },
        paragraphs: [
          "The local session contains a bearer token and must be treated as a credential. The CLI uses owner-only permissions where available. This file is not an operating-system keychain.",
        ],
      },
    ],
  },
  {
    slug: "cli/push",
    group: "CLI reference",
    title: "Push",
    description:
      "Encrypt a local file and add a version to the shared repository workspace.",
    sections: [
      {
        id: "usage",
        title: "Usage",
        code: [
          {
            label: "Terminal",
            value:
              "varte push [options]\n\nvarte push -f .env.production -o your-team -r api -d server -n production",
          },
        ],
        paragraphs: [
          "Push reads the file as UTF-8, obtains the existing encryption passphrase through an authenticated request, encrypts content on the client, and sends ciphertext to Next. The server verifies GitHub write access and adds a Firestore document.",
        ],
      },
      {
        id: "options",
        title: "Options",
        table: {
          headers: ["Option", "Default", "Purpose"],
          rows: [
            ["-f, --file <path>", ".env", "Local file to read"],
            [
              "-o, --owner <owner>",
              "Git remote / signed-in user",
              "GitHub repository owner",
            ],
            ["-r, --repo <repo>", "Git remote", "GitHub repository name"],
            [
              "-d, --directory <directory>",
              "Root (empty string)",
              "Logical directory label",
            ],
            [
              "-n, --name <name>",
              "Timestamp and username",
              "Name displayed for this version",
            ],
          ],
        },
      },
      {
        id: "directories",
        title: "Directories are labels",
        paragraphs: [
          "The directory value organizes versions under a repository; it does not copy a directory or change the local working directory. Use the exact same label when pulling. backend, Backend, and /backend are different labels.",
        ],
        code: [
          {
            label: "Terminal",
            value:
              'varte push -f backend/.env -d backend -n .env.production\nvarte push -f .env -d "" -n .env.local',
          },
        ],
      },
      {
        id: "versioning",
        title: "Every upload adds a version",
        paragraphs: [
          "Uploads do not overwrite existing documents, even when the environment name is identical. Each record keeps its document ID, uploader, creation time, and update time. This preserves the original database behavior.",
          "The local CLI file limit is 500 KB. The server caps JSON requests at 800 KB to allow encryption and encoding overhead.",
        ],
        note: {
          title: "Never upload plaintext through the API",
          text: "POST /api/env/push expects the compatible encrypted content string. The web uploader and CLI encrypt before sending it.",
        },
      },
      {
        id: "permissions",
        title: "Required repository access",
        paragraphs: [
          "GitHub must report push or admin permission for your account. A valid GitHub login alone does not grant write access to every repository. Check organization membership and SSO authorization if you receive an access error.",
        ],
      },
    ],
  },
  {
    slug: "cli/pull",
    group: "CLI reference",
    title: "Pull",
    description:
      "Choose an environment version, decrypt it locally, and protect existing files from accidental overwrite.",
    sections: [
      {
        id: "usage",
        title: "Usage",
        code: [
          {
            label: "Terminal",
            value: "varte pull -o your-team -r api -d server --output .env",
          },
        ],
        paragraphs: [
          "Pull queries the chosen repository and exact directory. When multiple files are available, the interactive CLI asks for a version. An empty directory value targets the repository root.",
        ],
      },
      {
        id: "options",
        title: "Options",
        table: {
          headers: ["Option", "Purpose"],
          rows: [
            ["-o, --owner <owner>", "Repository owner"],
            ["-r, --repo <repo>", "Repository name"],
            [
              "-d, --directory <directory>",
              "Exact directory label; root by default",
            ],
            ["-n, --name <name>", "Select an exact stored environment name"],
            ["--output <path>", "Destination on your device"],
            ["--force", "Replace an existing regular file intentionally"],
          ],
        },
      },
      {
        id: "scripts",
        title: "Use pull in scripts",
        code: [
          {
            label: "Terminal",
            value:
              "varte pull -o your-team -r api -d server --name .env.production --output .env.production",
          },
        ],
        paragraphs: [
          "Noninteractive runs do not guess among multiple versions. Provide --name when needed. When duplicate versions have the same name, the newest matching version is selected because the server returns files newest first. Use the interactive chooser to select an older version.",
        ],
      },
      {
        id: "overwrite",
        title: "Existing files are protected",
        paragraphs: [
          "If the destination already exists, an interactive run asks for confirmation. Noninteractive runs fail unless --force is provided. The CLI rejects symlink and non-regular destinations even with --force.",
        ],
        code: [
          {
            label: "Terminal",
            value:
              "varte pull -o your-team -r api --name .env.production --output .env --force",
          },
        ],
        note: {
          title: "The output contains secrets",
          text: "After decryption, the destination is a normal plaintext environment file. Add it to your project’s .gitignore and avoid copying it into logs or build artifacts.",
        },
      },
      {
        id: "filenames",
        title: "Default output names",
        paragraphs: [
          "When --output is omitted, varte uses a sanitized version of the stored name. Characters that are invalid in common filesystems are replaced with underscores. In an interactive terminal, you can change this name before saving. Parent directories must already exist.",
        ],
      },
    ],
  },
  {
    slug: "cli/list",
    group: "CLI reference",
    title: "List",
    description:
      "Find saved versions, inspect their authors and directories, or get structured output for scripts.",
    sections: [
      {
        id: "usage",
        title: "Usage",
        code: [
          {
            label: "Terminal",
            value:
              "varte list\nvarte list -o your-team -r api\nvarte list -o your-team -r api --json",
          },
        ],
      },
      {
        id: "scope",
        title: "How the repository is selected",
        table: {
          headers: ["Where you run it", "Result"],
          rows: [
            ["Inside a GitHub repository", "Files for the detected Git remote"],
            ["With --owner and --repo", "Files for the explicit repository"],
            [
              "Outside a repository without flags",
              "Files across repositories accessible to your account",
            ],
            ["Only --owner supplied", "Error: provide the repository too"],
          ],
        },
      },
      {
        id: "output",
        title: "Reading the result",
        paragraphs: [
          "The text output includes the environment name, full repository name, directory, uploader, and update timestamp. Files are sorted newest first. An empty result is successful and prints “No environment files found.”",
          "--json returns the environment record array for scripting. This array includes encrypted content; handle the output as private repository data. It does not print the encryption passphrase.",
        ],
        code: [
          {
            label: "Example output",
            value:
              "1. .env.production\n   your-team/api / server · teammate · 2026-10-05T09:30:00.000Z",
          },
        ],
      },
      {
        id: "options",
        title: "Options",
        table: {
          headers: ["Option", "Purpose"],
          rows: [
            ["-o, --owner <owner>", "Repository owner"],
            ["-r, --repo <repo>", "Repository name"],
            ["--json", "Return an array of records instead of readable text"],
          ],
        },
      },
    ],
  },
  {
    slug: "guides/web",
    group: "Guides",
    title: "Web workspace",
    description:
      "Browse repositories, upload versions, and inspect environment files directly in your browser.",
    sections: [
      {
        id: "connect",
        title: "Connect GitHub",
        steps: [
          "Open the website and choose Connect GitHub.",
          "Review the GitHub authorization request and continue.",
          "You return to the workspace with an encrypted HTTP-only session cookie.",
        ],
        paragraphs: [
          "The browser session lasts up to seven days, subject to GitHub token validity. Signing out clears the website cookie; it does not sign out the CLI or mobile app.",
        ],
      },
      {
        id: "repositories",
        title: "Find a repository",
        paragraphs: [
          "The workspace lists repositories returned by GitHub for your account. Search by owner or name, filter to private repositories, or show only repositories with environment files. Summary counts reflect the returned records, not a simulated activity feed.",
        ],
      },
      {
        id: "upload",
        title: "Upload a file",
        steps: [
          "Open a repository and choose Upload file.",
          "Select a local file, or enter its contents.",
          "Set a meaningful environment name and directory label.",
          "Choose Encrypt and upload. The browser encrypts locally and sends the ciphertext.",
        ],
        paragraphs: [
          "The server verifies repository write access. A successful upload adds a new version and refreshes the file list. Earlier versions are not changed.",
        ],
      },
      {
        id: "open",
        title: "Inspect or download",
        steps: [
          "Filter the repository’s environment list by directory if needed.",
          "Choose Open file on a version. The browser decrypts it locally.",
          "Copy the contents or download a sanitized file name.",
          "Close the panel when you finish.",
        ],
        note: {
          title: "Clipboard and downloads",
          text: "Copied text and downloaded files are plaintext secrets. Clipboard contents remain until replaced. Keep downloads outside version control.",
        },
      },
      {
        id: "appearance",
        title: "Appearance and accessibility",
        paragraphs: [
          "The website defaults to dark graphite with a restrained green accent. The header theme button switches to light mode and stores your preference locally. Interactive controls include keyboard focus states; motion respects reduced-motion preferences.",
        ],
      },
    ],
  },
  {
    slug: "guides/mobile",
    group: "Guides",
    title: "Mobile app",
    description:
      "Access the same repositories and environment versions on your Android device.",
    sections: [
      {
        id: "install",
        title: "Install a preview build",
        paragraphs: [
          "The Expo preview profile produces an Android APK for internal distribution. Open the EAS build link supplied by the maintainer, download the APK, and allow installation from that source if Android prompts. This is a preview build, not a Play Store release.",
        ],
      },
      {
        id: "login",
        title: "Sign in",
        steps: [
          "Open Vathavaran and choose Continue with GitHub.",
          "Complete authorization in the browser.",
          "Return to the app through the vathavaran://auth/callback link.",
        ],
        paragraphs: [
          "If browser login is unavailable, expand Use a personal access token and sign in with an appropriately authorized GitHub token. Native tokens are saved in Expo SecureStore.",
        ],
      },
      {
        id: "browse",
        title: "Find and open files",
        paragraphs: [
          "Workspace shows environment file counts and recently active repositories. Repositories adds search and a “With env files” filter. Open a repository and choose a directory or All files.",
          "Tap a file to decrypt it locally. A scrollable file sheet shows its contents and provides a copy action. Close the sheet to remove its plaintext from the current view. The app hides decrypted content when it moves into the background.",
        ],
      },
      {
        id: "theme",
        title: "Make it yours",
        paragraphs: [
          "Account settings offer dark, light, and system themes. Dark is the default for a fresh installation. Your preference survives app restarts.",
        ],
      },
      {
        id: "connection",
        title: "Connection and sessions",
        paragraphs: [
          "The app uses https://vathavaran-variable.vercel.app as its server. There is no fallback to the old Worker. If the server is unavailable, retry after checking the connection. A temporary outage does not intentionally erase a saved valid session.",
          "Changing EXPO_PUBLIC_BACKEND_URL requires a new app bundle/build. Only public URLs belong in Expo’s public environment variables; never include Firebase credentials or the encryption passphrase.",
        ],
      },
    ],
  },
  {
    slug: "configuration",
    group: "Reference",
    title: "Configuration",
    description:
      "Set the server URL and session location without changing your existing database or encrypted data.",
    sections: [
      {
        id: "cli",
        title: "CLI environment variables",
        table: {
          headers: ["Variable", "Default", "Purpose"],
          rows: [
            [
              "VATHAVARAN_BACKEND_URL",
              "https://vathavaran-variable.vercel.app",
              "Next API origin",
            ],
            [
              "VATHAVARAN_CONFIG_DIR",
              "OS-specific varte directory",
              "Local session storage override",
            ],
          ],
        },
        code: [
          {
            label: "Bash / zsh",
            value:
              "export VATHAVARAN_BACKEND_URL=http://localhost:3000\nvarte status",
          },
          {
            label: "PowerShell",
            value:
              '$env:VATHAVARAN_BACKEND_URL = "http://localhost:3000"\nvarte status',
          },
        ],
        paragraphs: [
          "Remote servers must use HTTPS. HTTP is permitted only for localhost, 127.0.0.1, and ::1 during development. The CLI refuses redirects for authenticated API calls to avoid forwarding credentials unexpectedly.",
        ],
      },
      {
        id: "server",
        title: "Next server environment",
        table: {
          headers: ["Variable", "Purpose"],
          rows: [
            [
              "FIREBASE_PROJECT_ID",
              "Existing Firebase project; do not replace it",
            ],
            [
              "FIREBASE_CLIENT_EMAIL",
              "Existing Firebase service-account email",
            ],
            [
              "FIREBASE_PRIVATE_KEY",
              "Service-account private key; escaped newlines are supported",
            ],
            [
              "ENCRYPTION_KEY",
              "Original shared passphrase needed by existing ciphertext",
            ],
            ["GITHUB_CLIENT_ID", "OAuth app client ID"],
            ["GITHUB_CLIENT_SECRET", "OAuth app client secret"],
            ["GITHUB_CALLBACK_URL", "Exact Next OAuth callback URL"],
            [
              "APP_URL",
              "Canonical website origin used for callbacks and request-origin checks",
            ],
            [
              "SESSION_SECRET",
              "Random secret of at least 32 characters for encrypted session cookies",
            ],
          ],
        },
        paragraphs: [
          "These values belong in Next/.env.local for local use or the hosting provider’s server environment settings. The repository includes a safe .env.example with names only. Neither .env.local nor Docs/ is tracked by Git.",
        ],
      },
      {
        id: "expo",
        title: "Expo public configuration",
        table: {
          headers: ["Variable", "Purpose"],
          rows: [
            [
              "EXPO_PUBLIC_BACKEND_URL",
              "Next API URL compiled into the application",
            ],
            ["EXPO_PUBLIC_AUTH_CALLBACK_URL", "Next OAuth callback URL"],
          ],
        },
        paragraphs: [
          "The preview build profile already sets the production Next URLs. These variables are public and must never contain credentials.",
        ],
      },
    ],
  },
  {
    slug: "api",
    group: "Reference",
    title: "API reference",
    description:
      "A compact HTTP contract shared by the website, Go CLI, and Expo app.",
    sections: [
      {
        id: "authentication",
        title: "Authentication",
        paragraphs: [
          "Native requests send a GitHub token in Authorization: Bearer <token>. Website requests use the encrypted HTTP-only session cookie. Cookie-authenticated write requests must include the configured APP_URL origin.",
          "Responses containing private data use Cache-Control: no-store. Requests and responses are JSON unless a route performs an OAuth redirect.",
        ],
      },
      {
        id: "routes",
        title: "Routes",
        table: {
          headers: ["Method", "Path", "Behavior"],
          rows: [
            [
              "GET",
              "/api/health",
              "Public service liveness check; does not validate external credentials",
            ],
            [
              "GET",
              "/api/auth/github",
              "Return GitHub authorization URL and bind state cookie",
            ],
            [
              "GET",
              "/api/auth/github?browser=1",
              "Redirect directly to GitHub",
            ],
            [
              "GET",
              "/api/auth/github/cli?redirect_uri=…",
              "Begin native login with a validated callback",
            ],
            [
              "GET",
              "/api/auth/github/callback",
              "Exchange authorization code, verify state, establish session",
            ],
            ["POST", "/api/auth/logout", "Clear the authenticated web session"],
            ["GET", "/api/user", "Return the GitHub user"],
            [
              "GET",
              "/api/repositories",
              "Return accessible GitHub repositories with pagination handled server-side",
            ],
            [
              "POST / GET",
              "/api/env/list",
              "List versions; repoFullName is optional",
            ],
            [
              "POST",
              "/api/env/pull",
              "Return versions for repoFullName and exact directory",
            ],
            [
              "POST",
              "/api/env/push",
              "Add an encrypted version; requires repository write access",
            ],
            [
              "GET",
              "/api/encryption-key",
              "Return legacy passphrase to an authenticated client",
            ],
          ],
        },
      },
      {
        id: "pull",
        title: "Pull request and response",
        code: [
          {
            label: "Request JSON",
            value:
              '{\n  "repoFullName": "your-team/api",\n  "directory": "server"\n}',
          },
          {
            label: "Response JSON",
            value:
              '{\n  "success": true,\n  "envFiles": [\n    {\n      "id": "existing-document-id",\n      "envName": ".env.production",\n      "repoFullName": "your-team/api",\n      "directory": "server",\n      "userId": 123456,\n      "userName": "teammate",\n      "content": "<encrypted OpenSSL-compatible string>",\n      "isEncrypted": true,\n      "createdAt": "2026-10-05T09:30:00.000Z",\n      "updatedAt": "2026-10-05T09:30:00.000Z"\n    }\n  ]\n}',
          },
        ],
      },
      {
        id: "push",
        title: "Push payload",
        code: [
          {
            label: "Request JSON",
            value:
              '{\n  "repoFullName": "your-team/api",\n  "directory": "server",\n  "envName": ".env.production",\n  "content": "<client-encrypted OpenSSL-compatible string>"\n}',
          },
        ],
        paragraphs: [
          "userId, userName, repoName, and timestamps are derived by the server. Client-supplied attribution is not trusted. The response is HTTP 201 with success and the new document id.",
        ],
      },
      {
        id: "errors",
        title: "Error responses",
        table: {
          headers: ["Status", "Meaning"],
          rows: [
            ["400", "Malformed input, missing field, or invalid OAuth state"],
            ["401", "Missing, expired, or invalid session"],
            ["403", "Request origin or repository permission denied"],
            ["404", "Repository unavailable or endpoint not found"],
            ["413", "JSON request is too large"],
            ["429", "GitHub rate limit or access restriction"],
            ["503", "Required server configuration is missing or invalid"],
          ],
        },
        code: [
          {
            label: "Response JSON",
            value: '{ "error": "Sign in to continue" }',
          },
        ],
      },
    ],
  },
  {
    slug: "security",
    group: "Reference",
    title: "Security & data",
    description:
      "Understand what is encrypted, who can access files, and which compatibility constraints matter.",
    sections: [
      {
        id: "encryption",
        title: "The existing encryption format",
        paragraphs: [
          "File content uses the CryptoJS OpenSSL-compatible passphrase format: Salted__ header, an 8-byte salt, AES-256-CBC encryption, and PKCS#7 padding. The legacy key and IV derivation uses MD5. The Go CLI reproduces this format so existing files can be read without a data conversion.",
          "This is a compatibility format, not modern authenticated encryption. AES-CBC here does not provide an integrity tag. The service uses a shared server-managed passphrase available to authenticated clients, so it is not a zero-knowledge or per-repository-key vault.",
        ],
        note: {
          title: "Do not rotate the encryption passphrase casually",
          text: "Changing ENCRYPTION_KEY without a coordinated data re-encryption plan makes previously stored files unreadable. Preserve the original value during this migration.",
        },
      },
      {
        id: "metadata",
        title: "What the database stores",
        table: {
          headers: ["Field", "Protection"],
          rows: [
            ["content", "Encrypted before upload"],
            ["Repository name and directory", "Plaintext metadata"],
            ["User ID and username", "Plaintext attribution"],
            ["Environment name and timestamps", "Plaintext metadata"],
          ],
        },
        paragraphs: [
          "Existing records remain in the same Firebase project, default database, and envFiles collection. The migration does not rewrite IDs, authors, timestamps, or ciphertext.",
        ],
      },
      {
        id: "access",
        title: "Repository authorization",
        paragraphs: [
          "Reads require repository access reported by GitHub. Push requires push or admin permission. Authentication alone is insufficient to read a repository’s environment records. Unfiltered lists are assembled from repositories accessible to the current account.",
          "The old Worker exposed its encryption-key endpoint anonymously and used weaker read authorization. The new endpoint requires authentication. Native clients must be updated to send bearer tokens for that request.",
        ],
      },
      {
        id: "sessions",
        title: "Sessions and device storage",
        paragraphs: [
          "Web sessions are encrypted with AES-256-GCM in HTTP-only cookies and use Secure cookies in production. OAuth state is bound to a short-lived browser cookie. The callback accepts only the supported mobile deep link or a loopback /callback URL.",
          "The Expo app stores native tokens in SecureStore. The Go CLI stores tokens in an owner-only local configuration file where supported. Decrypted files and copied clipboard content are plaintext and need normal secret handling.",
        ],
      },
    ],
  },
  {
    slug: "deployment",
    group: "Maintainers",
    title: "Deployment",
    description:
      "Deploy the consolidated Next server, keep existing data intact, and connect the native clients.",
    sections: [
      {
        id: "next",
        title: "1. Configure the Next project",
        steps: [
          "Set the Vercel project Root Directory to Next.",
          "Choose Next.js and Node.js 22 or newer.",
          "Add the server environment variables from Next/.env.example.",
          "Use the original Firebase project, service account, and encryption passphrase.",
          "Generate a distinct SESSION_SECRET with at least 32 random characters.",
        ],
        code: [
          {
            label: "Production URLs",
            value:
              "APP_URL=https://vathavaran-variable.vercel.app\nGITHUB_CALLBACK_URL=https://vathavaran-variable.vercel.app/api/auth/github/callback",
          },
          {
            label: "Generate a session secret",
            value:
              "node -e \"console.log(require('node:crypto').randomBytes(48).toString('hex'))\"",
          },
        ],
        note: {
          title: "A health check is not a database check",
          text: "GET /api/health confirms the app is running. Verify a real authenticated repository list and existing file read before treating the migration as complete.",
        },
      },
      {
        id: "firebase-key",
        title: "Import the Firebase private key",
        paragraphs: [
          "FIREBASE_PRIVATE_KEY must contain the complete service-account PEM key, including its BEGIN PRIVATE KEY and END PRIVATE KEY lines. In the Vercel dashboard, paste the key with its original line breaks. When importing a .env file, use a quoted value with a single escaped \\n between lines. Do not add JSON escaping a second time.",
          "The server supports multiline PEM, escaped newlines, and doubly escaped legacy imports. Invalid keys return a configuration error without exposing the credential. After updating any production variable, redeploy so the new value reaches the running server.",
        ],
        note: {
          title: "Keep the original encryption passphrase",
          text: "Correcting Firebase credential formatting does not require changing ENCRYPTION_KEY. Preserve that value so existing files remain readable.",
        },
      },
      {
        id: "github",
        title: "2. Update the GitHub OAuth app",
        table: {
          headers: ["GitHub setting", "Value"],
          rows: [
            ["Homepage URL", "https://vathavaran-variable.vercel.app"],
            [
              "Authorization callback URL",
              "https://vathavaran-variable.vercel.app/api/auth/github/callback",
            ],
          ],
        },
        paragraphs: [
          "In GitHub Settings → Developer settings → OAuth Apps, select the application matching GITHUB_CLIENT_ID. Keep its client ID and secret.",
          "Use a separate development OAuth app for localhost. Its callback, client ID, and secret must match the local Next environment.",
        ],
      },
      {
        id: "verify",
        title: "3. Verify before cutting over",
        steps: [
          "Build Next with npm run build and check its type, lint, and security tests.",
          "Sign in through the production website and open a repository with existing files.",
          "Verify old document IDs, ciphertext, and timestamps through read-only checks.",
          "Decrypt an existing file on a client without logging its contents.",
          "Confirm anonymous file and encryption-key requests are rejected.",
        ],
      },
      {
        id: "cli",
        title: "4. Prepare the npm CLI release",
        code: [
          {
            label: "Terminal",
            value:
              "cd Go-cli\ngo test -race ./...\ngo vet ./...\nnpm run build\nnpm pack",
          },
        ],
        paragraphs: [
          "The build produces six binaries and SHA256 checksums. Inspect the package and test the launcher before publishing. Release varte 2.0.0 only after the Next production server is verified. npm publishing requires access to the existing varte package and is a separate action.",
        ],
      },
      {
        id: "expo",
        title: "5. Build the Android preview",
        code: [
          {
            label: "Terminal",
            value: "cd Expo\neas build --profile preview --platform android",
          },
        ],
        paragraphs: [
          "The preview profile targets the singular-domain Next URL and builds an APK. Link the Expo project to the correct account, provide signing credentials if prompted, and monitor the resulting EAS build. An uploaded build is not a successful APK until EAS reports completion.",
        ],
      },
    ],
  },
  {
    slug: "development",
    group: "Maintainers",
    title: "Local development",
    description:
      "Work on the server, native CLI, and mobile application with reproducible local checks.",
    sections: [
      {
        id: "structure",
        title: "Repository structure",
        code: [
          {
            label: "Folders",
            value:
              "Go-cli/   Go implementation, npm launcher, binary build script\nNext/     Website and all HTTP server routes\nExpo/     React Native mobile application\nDocs/     Local context, plans, and credential retrieval (gitignored)",
          },
        ],
      },
      {
        id: "next",
        title: "Run the Next server",
        paragraphs: [
          "Use Node.js 22+. Set APP_URL=http://localhost:3000 and the development OAuth callback to http://localhost:3000/api/auth/github/callback. Never commit .env.local.",
        ],
        code: [
          {
            label: "Start",
            value: "cd Next\nnpm ci\ncp .env.example .env.local\nnpm run dev",
          },
          {
            label: "Check",
            value: "npm run typecheck\nnpm run lint\nnpm test\nnpm run build",
          },
        ],
      },
      {
        id: "go",
        title: "Learn the Go CLI layout",
        paragraphs: [
          "cmd/varte/main.go is the executable entry point. internal/varte/app.go handles commands; client.go talks to Next; oauth.go receives browser callbacks; config.go handles sessions; crypto.go preserves encrypted files.",
          "Go returns errors explicitly. The entry point prints a useful error and exits with status 1. gofmt is the standard formatter. The CLI uses golang.org/x/term for terminal detection; the remaining implementation uses Go’s standard library.",
        ],
        code: [
          {
            label: "Terminal",
            value:
              "cd Go-cli\ngofmt -w .\ngo test -race ./...\ngo vet ./...\ngo run ./cmd/varte --help",
          },
        ],
      },
      {
        id: "expo",
        title: "Run Expo",
        code: [
          {
            label: "Terminal",
            value:
              "cd Expo\nnpm ci\nnpx expo start\nnpm run typecheck\nnpx expo install --check",
          },
        ],
        paragraphs: [
          "For a physical Android device, localhost points at the phone rather than your computer. Use the deployed HTTPS Next server or a reachable development URL. The app’s native OAuth deep link is intended for a development or preview build, not an arbitrary Expo Go callback.",
        ],
      },
    ],
  },
  {
    slug: "troubleshooting",
    group: "Support",
    title: "Troubleshooting",
    description:
      "Start with the failing boundary: your session, repository access, directory label, server configuration, or file destination.",
    sections: [
      {
        id: "login",
        title: "“Not signed in” or HTTP 401",
        steps: [
          "Run varte status to verify the saved account and server.",
          "Run varte login if the session is absent, expired, or revoked.",
          "Confirm the token can access the target organization and repository.",
        ],
        paragraphs: [
          "A GitHub organization may require SSO authorization. Signing into the website does not create a CLI session on your computer.",
        ],
      },
      {
        id: "callback",
        title: "GitHub callback mismatch",
        steps: [
          "Open GitHub Settings → Developer settings → OAuth Apps, then select your application.",
          "Compare its Client ID with GITHUB_CLIENT_ID in Vercel Production. Select the matching application, even if another app has the same name.",
          "Set its Homepage URL and Authorization callback URL to the production values below, then save the application settings.",
          "If you intend to use a different OAuth app, update both GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in Vercel with that app’s matching credentials and redeploy.",
          "Open /auth on the production website and begin a fresh sign-in. Earlier authorization links contain a state value that can expire.",
        ],
        table: {
          headers: ["Setting", "Production value"],
          rows: [
            ["Homepage URL / APP_URL", "https://vathavaran-variable.vercel.app"],
            [
              "Authorization callback URL / GITHUB_CALLBACK_URL",
              "https://vathavaran-variable.vercel.app/api/auth/github/callback",
            ],
          ],
        },
        paragraphs: [
          "GitHub’s warning that the redirect_uri is not associated with the application means its OAuth registration does not accept the callback requested by the server. Register that callback in the OAuth app selected by the deployed Client ID.",
          "The GitHub OAuth app’s Authorization callback URL and the server’s GITHUB_CALLBACK_URL must point at the same deployment. APP_URL must identify that website. Updating an environment variable requires a new deployment to take effect.",
          "For this production project, use the singular hostname vathavaran-variable.vercel.app. The original website used the plural hostname, which is a different origin. Start a fresh sign-in after changing settings.",
        ],
        note: {
          title: "If the matching app is owned by someone else",
          text: "Ask that app’s owner to update its registered callback, or configure an OAuth app you control and use its matching credentials in Vercel. The existing Firebase project and encryption passphrase remain the same.",
        },
      },
      {
        id: "state",
        title: "“Login expired or state invalid”",
        paragraphs: [
          "Start sign-in again from the website or CLI. Complete it in the same browser context that opened the authorization flow. The OAuth state cookie expires after ten minutes; the CLI waits five minutes.",
          "Avoid mixing localhost, a preview deployment, and the production domain during one login. The browser cookie must return to the same server origin that issued it.",
        ],
      },
      {
        id: "files",
        title: "“No environment files found”",
        steps: [
          "List the entire repository with varte list -o OWNER -r REPO.",
          "Check the exact repository owner and name.",
          "Match the directory label exactly, including case and leading slashes.",
          "Confirm your GitHub account has repository access.",
        ],
        paragraphs: [
          "A file uploaded to backend will not appear in a root-directory pull. Listing a repository includes all its directory labels.",
        ],
      },
      {
        id: "permission",
        title: "Repository unavailable or access denied",
        paragraphs: [
          "Use an account with repository access. Push requires write access. Public visibility alone does not grant access to a repository’s private environment files. Check organization membership, OAuth restrictions, and SSO settings.",
        ],
      },
      {
        id: "decrypt",
        title: "“Could not decrypt file”",
        paragraphs: [
          "Confirm the server still uses the original ENCRYPTION_KEY. A new random key cannot decrypt earlier uploads. Verify that ciphertext has not been truncated or replaced with plaintext.",
          "The Go fixture tests check the CryptoJS format independently. If a legacy file is unreadable, preserve the original document and investigate before attempting any rewrite or key rotation.",
        ],
      },
      {
        id: "overwrite",
        title: "Destination already exists",
        paragraphs: [
          "Choose a different --output file, confirm replacement interactively, or supply --force for an intentional replacement in a script. Symlinks and non-regular destinations are rejected. Ensure the parent directory exists.",
        ],
      },
      {
        id: "server",
        title: "Missing server configuration or empty production workspace",
        paragraphs: [
          "Check the Vercel project’s Root Directory is Next and Node.js is 22+. Add all server environment variables and redeploy. FIREBASE_PRIVATE_KEY supports escaped newline sequences; the Firebase project must match the existing database.",
          "The public /api/health endpoint only checks service liveness. An authenticated file read is needed to verify credentials and database connectivity.",
          "If the server reports an invalid FIREBASE_PRIVATE_KEY, reimport the complete PEM key from the service-account credential. Use real line breaks in a dashboard paste, or single escaped \\n sequences in a quoted .env value. Redeploy after saving the variable. An HTTP 500 from a database route needs its Vercel runtime log checked; do not treat it as an empty repository.",
        ],
      },
    ],
  },
];
export function docHref(slug: string) {
  return slug ? `/docs/${slug}` : "/docs";
}
