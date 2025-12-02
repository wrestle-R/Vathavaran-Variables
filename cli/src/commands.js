import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { saveAuth, getAuth, clearAuth, isAuthenticated } from './auth.js';
import { encryptEnv, decryptEnv } from './encryption.js';
import { githubOAuthLogin } from './oauth.js';

// Backend API URL - defaults to production, can be overridden for local dev
const BACKEND_URL = process.env.VATHAVARAN_BACKEND_URL || 'https://my-worker.vidyoyo.workers.dev';

// Helper function to get GitHub username from git remote URL
function getGitHubUsername() {
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
    const match = remoteUrl.match(/github\.com[:/]([^/]+)/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}

// Helper function to get current repo name from git
function getGitRepoName() {
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
    const match = remoteUrl.match(/\/([^/]+?)(\.git)?$/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}

// List top-level directories in the git repository root (or cwd)
function listTopLevelDirs() {
  // Helper: walk up directories looking for repo indicators
  function findRepoRoot(startDir) {
    let dir = startDir;
    while (true) {
      if (existsSync(path.join(dir, '.git')) || existsSync(path.join(dir, 'package.json'))) {
        return dir;
      }
      const parent = path.dirname(dir);
      if (!parent || parent === dir) break;
      dir = parent;
    }
    return startDir;
  }

  // Try git to get top-level; otherwise walk up or fallback to cwd
  try {
    const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
    const entries = readdirSync(repoRoot, { withFileTypes: true });
    return entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .filter(name => !name.startsWith('.') && name !== 'node_modules' && name !== '.git');
  } catch (err) {
    try {
      const repoRoot = findRepoRoot(process.cwd());
      const entries = readdirSync(repoRoot, { withFileTypes: true });
      return entries
        .filter(e => e.isDirectory())
        .map(e => e.name)
        .filter(name => !name.startsWith('.') && name !== 'node_modules' && name !== '.git');
    } catch (e) {
      return [];
    }
  }
}

// Login command with GitHub OAuth
export async function login() {
  console.log(chalk.blue('\n🔐 Login to Varte\n'));
  
  try {
    const { userId, userName, token } = await githubOAuthLogin();
    
    // Save auth with userId as number
    saveAuth(userId, userName, token);
    
    console.log(chalk.green(`\n✅ Successfully logged in as ${userName} (ID: ${userId})\n`));
    
    // Force exit to prevent hanging
    process.exit(0);
  } catch (error) {
    console.log(chalk.red(`\n❌ Failed to login: ${error.message}\n`));
    console.log(chalk.yellow('\nTroubleshooting:'));
    console.log(chalk.gray('1. Check your internet connection'));
    console.log(chalk.gray('2. Try again: varte login\n'));
    process.exit(1);
  }
}

// Logout command
export async function logout() {
  clearAuth();
  console.log(chalk.green('\n✅ Successfully logged out!\n'));
}

// Push env command
export async function pushEnv(options) {
  if (!isAuthenticated()) {
    console.log(chalk.red('❌ Not authenticated. Please run: varte login'));
    return;
  }

  const auth = getAuth();

  try {
    // Get file path
    const envFile = options.file || '.env';
    
    if (!existsSync(envFile)) {
      console.log(chalk.red(`❌ File ${envFile} not found`));
      return;
    }

    // Read env file
    const envContent = readFileSync(envFile, 'utf8');
    
    // Auto-detect git info
    const gitUsername = getGitHubUsername();
    const gitRepoName = getGitRepoName();
    
    // Get repository info
    const availableDirs = listTopLevelDirs();
    const dirChoices = [
      { name: 'Repository root (/) — push to repository root', value: '' },
      ...availableDirs.map(d => ({ name: d, value: d }))
    ];

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'repoOwner',
        message: 'Repository Owner:',
        default: options.owner || gitUsername || auth.userName
      },
      {
        type: 'input',
        name: 'repoName',
        message: 'Repository Name:',
        default: options.repo || gitRepoName
      },
      {
        type: 'list',
        name: 'directory',
        message: 'Select directory to push into (use arrow keys):',
        choices: dirChoices,
        default: options.directory || ''
      },
      {
        type: 'input',
        name: 'envName',
        message: 'Environment file name:',
        default: (() => {
          const now = new Date();
          const day = String(now.getDate()).padStart(2, '0');
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const year = now.getFullYear();
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          const username = auth.userName || 'Unknown';
          return options.name || `.env.${day}/${month}/${year}T${hours}:${minutes} (${username})`;
        })()
      }
    ]);

    const repoFullName = `${answers.repoOwner}/${answers.repoName}`;
    const spinner = ora('Encrypting and pushing environment variables...').start();
    
    try {
      // Encrypt the content
      const encryptedContent = await encryptEnv(envContent);
      
      // Call backend API
      const response = await fetch(`${BACKEND_URL}/api/env/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          userId: Number(auth.userId),
          repoFullName,
          repoName: answers.repoName,
          directory: answers.directory,
          envName: answers.envName,
          content: encryptedContent
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        spinner.fail(chalk.red(data.error || 'Failed to push environment variables'));
        if (response.status === 403) {
          console.log(chalk.yellow('\n⚠️  You must be the owner or have push access to this repository\n'));
        }
        return;
      }

      spinner.succeed(chalk.green(`✅ Environment variables encrypted and pushed to ${repoFullName}`));
    } catch (error) {
      spinner.fail(chalk.red(`Failed: ${error.message}`));
    }
  } catch (error) {
    console.log(chalk.red(`❌ Failed to push: ${error.message}`));
  }
}

// Pull env command
export async function pullEnv(options) {
  if (!isAuthenticated()) {
    console.log(chalk.red('❌ Not authenticated. Please run: varte login'));
    return;
  }

  const auth = getAuth();

  try {
    // Auto-detect git info
    const gitUsername = getGitHubUsername();
    const gitRepoName = getGitRepoName();
    
    // Get repository info
    const availableDirs = listTopLevelDirs();
    const dirChoices = [
      { name: 'Repository root (/) — pull from repository root', value: '' },
      ...availableDirs.map(d => ({ name: d, value: d }))
    ];

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'repoOwner',
        message: 'Repository Owner:',
        default: options.owner || gitUsername || auth.userName
      },
      {
        type: 'input',
        name: 'repoName',
        message: 'Repository Name:',
        default: options.repo || gitRepoName
      },
      {
        type: 'list',
        name: 'directory',
        message: 'Select directory to pull from (use arrow keys):',
        choices: dirChoices,
        default: options.directory || ''
      }
    ]);

    const repoFullName = `${answers.repoOwner}/${answers.repoName}`;
    const spinner = ora('Fetching environment variables...').start();

    try {
      // Call backend API
      const response = await fetch(`${BACKEND_URL}/api/env/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          repoFullName,
          directory: answers.directory
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        spinner.fail(chalk.red(data.error || 'Failed to fetch environment variables'));
        return;
      }

      if (!data.envFiles || data.envFiles.length === 0) {
        spinner.fail(chalk.yellow('No environment files found for this repository'));
        return;
      }

      spinner.stop();

      const { selectedFile } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedFile',
          message: 'Select environment file:',
          choices: data.envFiles.map(f => ({
            name: `${f.envName} (updated: ${new Date(f.updatedAt).toLocaleString()})`,
            value: f
          }))
        }
      ]);

      // Decrypt content
      const decryptedContent = await decryptEnv(selectedFile.content);
      
      // Determine output filename
      let outputFile = options.output;
      
      if (!outputFile) {
        // Sanitize the envName to create a valid filename
        // Replace all invalid characters with underscores
        const sanitizedName = selectedFile.envName
          .replace(/[/\\:*?"<>|]/g, '_');  // Replace all invalid filename characters with underscores
        
        // Ask user for confirmation or custom output path
        const { finalOutput } = await inquirer.prompt([
          {
            type: 'input',
            name: 'finalOutput',
            message: 'Output file name:',
            default: sanitizedName || '.env'
          }
        ]);
        outputFile = finalOutput;
      }
      
      writeFileSync(outputFile, decryptedContent);

      console.log(chalk.green(`✅ Environment variables saved to ${outputFile}`));
    } catch (error) {
      spinner.fail(chalk.red(`Failed: ${error.message}`));
    }
  } catch (error) {
    console.log(chalk.red(`❌ Failed to pull: ${error.message}`));
  }
}

// List env command
export async function listEnv(options) {
  if (!isAuthenticated()) {
    console.log(chalk.red('❌ Not authenticated. Please run: varte login'));
    return;
  }

  const auth = getAuth();
  
  // Build request body based on options
  const requestBody = {};
  
  // Allow filtering by repo if EITHER owner or repo is provided (try to auto-detect the other)
  if (options.repo) {
    const repoOwner = options.owner || auth.userName;  // Default to current user if not specified
    requestBody.repoFullName = `${repoOwner}/${options.repo}`;
  } else if (options.owner) {
    // If only owner is provided, prompt for repo name
    console.log(chalk.yellow('⚠️  Repository name is required when filtering by owner'));
    console.log(chalk.gray('Usage: varte list -r REPO_NAME or varte list -o OWNER -r REPO_NAME\n'));
    return;
  }
  
  const messageText = requestBody.repoFullName 
    ? `Fetching environment files for ${requestBody.repoFullName}...`
    : 'Fetching your environment files...';
  
  const spinner = ora(messageText).start();

  try {
    // Call backend API
    const response = await fetch(`${BACKEND_URL}/api/env/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    if (!response.ok) {
      spinner.fail(chalk.red(data.error || 'Failed to fetch environment files'));
      return;
    }

    if (!data.envFiles || data.envFiles.length === 0) {
      spinner.fail(chalk.yellow('No environment files found'));
      return;
    }

    spinner.stop();

    const headerText = requestBody.repoFullName 
      ? `\n📋 Environment Files for ${requestBody.repoFullName}:\n`
      : '\n📋 All Environment Files (including collaborators):\n';
    
    console.log(chalk.blue(headerText));

    // Display as a flat list
    data.envFiles.forEach((file, index) => {
      const dir = file.directory ? `/${file.directory}` : '/root';
      const author = file.userName ? chalk.magenta(`by ${file.userName}`) : '';
      const repo = chalk.cyan(`${file.repoFullName}`);
      console.log(`${index + 1}. ${file.envName} ${chalk.gray(`(${dir})`)} - ${repo} ${author} - ${chalk.gray(new Date(file.updatedAt).toLocaleString())}`);
    });

    console.log('\n');
  } catch (error) {
    spinner.fail(chalk.red(`Failed to list: ${error.message}`));
  }
}
