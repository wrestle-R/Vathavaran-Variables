import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync, writeFileSync, existsSync } from 'fs';
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
        type: 'input',
        name: 'directory',
        message: 'Directory path (leave empty for root):',
        default: options.directory || ''
      },
      {
        type: 'input',
        name: 'envName',
        message: 'Environment file name:',
        default: options.name || `.env.${new Date().toISOString().split('T')[0]}`
      }
    ]);

    const repoFullName = `${answers.repoOwner}/${answers.repoName}`;
    const spinner = ora('Encrypting and pushing environment variables...').start();
    
    try {
      // Encrypt the content
      const encryptedContent = encryptEnv(envContent);
      
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
        type: 'input',
        name: 'directory',
        message: 'Directory path (leave empty for root):',
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
      const decryptedContent = decryptEnv(selectedFile.content);
      
      // Save to file
      const outputFile = options.output || selectedFile.envName;
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
  const spinner = ora('Fetching your environment files...').start();

  try {
    // Call backend API
    const response = await fetch(`${BACKEND_URL}/api/env/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${auth.token}`
      }
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

    console.log(chalk.blue('\n📋 Your Environment Files:\n'));

    // Group by repository
    const grouped = data.envFiles.reduce((acc, file) => {
      if (!acc[file.repoFullName]) {
        acc[file.repoFullName] = [];
      }
      acc[file.repoFullName].push(file);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([repo, files]) => {
      console.log(chalk.cyan(`\n📁 ${repo}`));
      files.forEach(file => {
        const dir = file.directory ? `/${file.directory}` : '/root';
        console.log(`   ${chalk.gray('└─')} ${file.envName} ${chalk.gray(`(${dir})`)} - ${chalk.gray(new Date(file.updatedAt).toLocaleString())}`);
      });
    });

    console.log('\n');
  } catch (error) {
    spinner.fail(chalk.red(`Failed to list: ${error.message}`));
  }
}
