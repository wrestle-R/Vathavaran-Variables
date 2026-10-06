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
          "Use the CLI to push and pull files while you work. Open the web workspace to browse, upload, or download a version. Use the mobile app to find and copy configuration when you are away from your desk.",
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
            ["Mobile app", "Finding and copying environment files on Android"],
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
              "A saved snapshot created by an upload. Earlier versions remain available.",
            ],
          ],
        },
      },
      {
        id: "next-steps",
        title: "Where to go next",
        paragraphs: [
          "Start with Installation, then follow the Quickstart. The CLI reference explains each command and option. The web and mobile guides show you how to find, upload, and open your files.",
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
      "Install or upgrade the native Go CLI through npm. You do not need a Go compiler.",
    sections: [
      {
        id: "requirements",
        title: "What you need",
        table: {
          headers: ["Requirement", "Details"],
          rows: [
            ["GitHub account", "Access to the repository you want to use"],
            ["Node.js 18+", "Required to install and run varte through npm"],
            ["Operating system", "Linux, macOS, or Windows on x64 or arm64"],
            ["Git", "Recommended for automatic repository detection"],
          ],
        },
      },
      {
        id: "npm",
        title: "Install from npm",
        paragraphs: [
          "Install the varte package for your platform. The package supports Linux, macOS, and Windows on x64 and arm64. You do not need to install Go or build anything yourself.",
        ],
        code: [
          {
            label: "npm",
            value: "npm install -g varte@latest\nvarte --version\nvarte --help",
          },
        ],
        note: {
          title: "Upgrading from the JavaScript CLI",
          text: "This command upgrades an existing varte installation. Run varte --version to confirm 2.0.0 or newer. Your existing commands, saved files, and compatible sign-in session remain available.",
        },
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
          "Run the same install command to update an older installation. Check the version and connected account afterward. Existing encrypted files stay available.",
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
        code: [
          {
            label: "Terminal",
            value: "varte login\nvarte status",
          },
        ],
        paragraphs: [
          "Run varte login, complete GitHub sign-in in your browser, and return to your terminal. Run varte status to confirm the connected account before uploading a file.",
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
        code: [
          {
            label: "Terminal",
            value: "varte login",
          },
        ],
        paragraphs: [
          "Run varte login and finish GitHub sign-in in the browser that opens. Return to the terminal when sign-in completes.",
          "If the browser does not open automatically, copy the printed sign-in URL into your browser. The CLI waits up to five minutes. Restart login if it times out.",
        ],
      },
      {
        id: "token",
        title: "Use a token from an environment variable",
        code: [
          {
            label: "Terminal",
            value: "varte login --token-env GITHUB_TOKEN",
          },
        ],
        paragraphs: [
          "When GITHUB_TOKEN is already available in your environment, this command signs in using that token. It must have access to your target repositories. Organization SSO settings may require additional authorization.",
          "Avoid putting the token itself in command arguments or sharing it in chat. The --token-env option takes a variable name, not a secret value.",
        ],
      },
      {
        id: "status",
        title: "Check the connected account",
        code: [
          {
            label: "Terminal",
            value: "varte status",
          },
        ],
        paragraphs: [
          "Status checks your connection and prints the connected username. If your sign-in has expired or been revoked, run varte login again.",
        ],
      },
      {
        id: "logout",
        title: "Sign out",
        code: [
          {
            label: "Terminal",
            value: "varte logout",
          },
        ],
        paragraphs: [
          "Logout signs out the CLI on this device. It does not sign out the website, mobile app, or other devices. You can also manage Vathavaran authorization in your GitHub account settings.",
        ],
      },
      {
        id: "devices",
        title: "Shared devices",
        paragraphs: [
          "Sign out when you finish using a shared computer. Keep local session files private and never include them in a repository, shared archive, or support message.",
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
          "Push encrypts your local environment file before upload and adds a saved version to the selected repository and directory. You need GitHub write access. Earlier versions remain available.",
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
          "Each upload creates a new saved version. Using the same file name again adds the latest configuration while keeping earlier versions available.",
          "The local CLI file limit is 500 KB.",
        ],
        note: {
          title: "Keep local secrets out of Git",
          text: "Add real environment files to your project’s .gitignore. Share configuration through Vathavaran with the collaborators who need it.",
        },
      },
      {
        id: "permissions",
        title: "Required repository access",
        paragraphs: [
          "Uploading requires GitHub write access to the repository. Check your organization membership and SSO authorization if an upload is denied.",
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
          "For a script, provide --name to select a saved file and --output to set its destination. If multiple versions use that name, the newest matching version is selected. Use the interactive chooser when you need an older version.",
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
          "--json returns structured file information for scripts. It includes encrypted file content, so treat the output as private repository data and keep it out of public logs.",
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
          "Return to your workspace and open a repository.",
        ],
        paragraphs: [
          "Your sign-in can remain active for up to seven days. If access expires, connect GitHub again. Signing out of the website does not sign out the CLI or mobile app.",
        ],
      },
      {
        id: "repositories",
        title: "Find a repository",
        paragraphs: [
          "Search your workspace by repository owner or name. Filter to private repositories or show only repositories with saved environment files. File counts reflect the versions available to your account.",
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
          "Download and install the Android preview APK linked from this project’s README. You may need to allow installation from that download source in Android settings.",
        ],
      },
      {
        id: "login",
        title: "Sign in",
        steps: [
          "Open Vathavaran and choose Continue with GitHub.",
          "Complete authorization in the browser.",
          "Return to the app after sign-in completes.",
        ],
        paragraphs: [
          "If browser sign-in is unavailable, expand Use a personal access token and enter a GitHub token with access to the repositories you need. Keep that token private.",
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
          "The mobile app connects to the same workspace as the website and CLI. If a request fails, check your connection and try again. A temporary connection failure does not intentionally sign you out.",
        ],
      },
    ],
  },
  {
    slug: "configuration",
    group: "Reference",
    title: "Preferences",
    description:
      "Choose your theme, check your CLI version, and manage sign-in across devices.",
    sections: [
      {
        id: "cli",
        title: "CLI version and account",
        code: [
          {
            label: "Terminal",
            value: "varte --version\nvarte status\nnpm install -g varte@latest",
          },
        ],
        paragraphs: [
          "Check your installed version and connected account before using a new device. The install command updates an existing installation.",
        ],
      },
      {
        id: "web",
        title: "Website appearance",
        paragraphs: [
          "The website opens in dark mode by default. Use the theme button in the header to switch to light mode. Your preference is remembered on that browser.",
        ],
      },
      {
        id: "mobile",
        title: "Mobile appearance",
        paragraphs: [
          "Open Account settings to choose dark, light, or system appearance. Dark is the default for a fresh installation. Your preference survives app restarts.",
        ],
      },
      {
        id: "sessions",
        title: "Manage connected devices",
        paragraphs: [
          "The website, CLI, and mobile app have independent sign-ins. Sign out of each client separately when leaving a shared device. For wider access changes, review your GitHub account settings.",
        ],
      },
    ],
  },
  {
    slug: "api",
    group: "Reference",
    title: "Automation",
    description:
      "Use the CLI in scripts with explicit selections and structured output.",
    sections: [
      {
        id: "list",
        title: "Read structured file information",
        code: [
          {
            label: "Terminal",
            value: "varte list -o your-team -r api --json",
          },
        ],
        paragraphs: [
          "Use --json when a script needs structured output. Choose the repository explicitly so the script does not depend on its working directory.",
        ],
        note: {
          title: "Keep script output private",
          text: "Structured output includes encrypted file content. Avoid public logs and shared artifacts.",
        },
      },
      {
        id: "pull",
        title: "Choose a file without a prompt",
        code: [
          {
            label: "Terminal",
            value:
              "varte pull -o your-team -r api -d backend --name .env.production --output .env",
          },
        ],
        paragraphs: [
          "Set the repository, directory, saved name, and destination explicitly. If several versions share the same name, the newest matching version is selected.",
        ],
      },
      {
        id: "overwrite",
        title: "Replace a destination intentionally",
        code: [
          {
            label: "Terminal",
            value:
              "varte pull -o your-team -r api -d backend --name .env.production --output .env --force",
          },
        ],
        paragraphs: [
          "Use --force only when your script is meant to replace an existing file. Keep the destination out of version control. Symlinks and non-regular destinations are rejected.",
        ],
      },
      {
        id: "errors",
        title: "Check command results",
        paragraphs: [
          "A failed command returns a nonzero exit code. Stop dependent steps when a pull fails. An empty list is successful and means there are no saved files in the selected scope.",
        ],
      },
    ],
  },
  {
    slug: "security",
    group: "Reference",
    title: "Privacy & access",
    description:
      "Understand who can open your files and how to handle downloaded configuration.",
    sections: [
      {
        id: "encryption",
        title: "Encrypted files",
        paragraphs: [
          "File contents are encrypted before upload and stay encrypted in storage. Opening or pulling a file makes its contents readable on your device.",
          "Keep downloads, copied text, and local environment files private. Once copied or downloaded, they need the same care as any other project secret.",
        ],
      },
      {
        id: "versions",
        title: "Versions and attribution",
        paragraphs: [
          "Each upload adds a saved version. Earlier uploads remain available with their file name, repository, directory, author, and timestamp. These details help collaborators find the right configuration.",
        ],
      },
      {
        id: "access",
        title: "Repository access",
        paragraphs: [
          "Sign in with your own GitHub account. Reading environment files requires repository access; uploading requires write access. A public source repository does not make its environment files public.",
          "Only share configuration that your repository collaborators are allowed to use. Review your GitHub access when teammates join or leave.",
        ],
      },
      {
        id: "devices",
        title: "Protect your device and clipboard",
        paragraphs: [
          "Sign out after using a shared device. Add real environment files to .gitignore and keep them out of public logs, screenshots, and build artifacts.",
          "The mobile app hides decrypted contents when it moves into the background. Clipboard contents remain until replaced, so clear sensitive copied text when you finish.",
        ],
      },
      {
        id: "backups",
        title: "Keep a separate backup",
        paragraphs: [
          "Keep a separate backup of configuration your project depends on. Before changing a saved setup, confirm that the new version works and retain the previous working version.",
        ],
      },
    ],
  },
  {
    slug: "troubleshooting",
    group: "Support",
    title: "Troubleshooting",
    description:
      "Resolve sign-in, repository access, file selection, and download problems.",
    sections: [
      {
        id: "login",
        title: "Not signed in",
        steps: [
          "Run varte status to check the connected account.",
          "Run varte login if the session is absent, expired, or revoked.",
          "Confirm the token can access the target organization and repository.",
        ],
        paragraphs: [
          "A GitHub organization may require SSO authorization. Signing into the website does not create a CLI session on your computer.",
        ],
      },
      {
        id: "callback",
        title: "GitHub sign-in could not complete",
        paragraphs: [
          "Start a fresh sign-in from the website or varte login, then finish it in the same browser. If GitHub reports that sign-in is misconfigured, contact the project maintainer with the error message and the time it occurred.",
        ],
      },
      {
        id: "state",
        title: "“Login expired or state invalid”",
        paragraphs: [
          "Start sign-in again from the website or CLI. Complete it in the same browser that opened the sign-in flow. If the CLI stops waiting, run varte login again.",
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
          "Keep the existing saved version and local file intact. Try opening the file again with the current CLI or website. If the problem continues, contact the maintainer with the file name and error message, without sending the secret contents.",
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
        title: "Workspace or connection unavailable",
        paragraphs: [
          "Check your network connection and retry. If the workspace remains unavailable, contact the maintainer with the time, client version, and error message.",
          "Do not interpret a failed request as proof that files have been deleted. Keep your local working configuration until access is restored.",
        ],
      },
    ],
  },
];

export function docHref(slug: string) {
  return slug ? `/docs/${slug}` : "/docs";
}

export function legacyDocDestination(slug: string) {
  if (slug === "deployment") return "/docs";
  if (slug === "development") return "/docs/installation";
}
