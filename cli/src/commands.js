import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { getDb } from './firebase.js';
import { saveAuth, getAuth, clearAuth, isAuthenticated } from './auth.js';
import { encryptEnv, decryptEnv } from '../../frontend/src/lib/envUtils.js';
import { githubOAuthLogin } from './oauth.js';

// Helper function to get git config
function getGitConfig(key) {
  try {
    return execSync(`git config --get ${key}`, { encoding: 'utf8' }).trim();
  } catch (error) {
    return null;
  }
}

// Helper function to get GitHub username from git remote URL
function getGitHubUsername() {
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
    // Parse GitHub username from URL
    // Handles both SSH (git@github.com:username/repo.git) and HTTPS (https://github.com/username/repo.git)
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
    // Extract repo name from URL
    const match = remoteUrl.match(/\/([^/]+?)(\.git)?$/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}

// Login command with GitHub OAuth
export async function login() {
  console.log(chalk.blue('\n🔐 Login to Vathavaran\n'));
  console.log(chalk.yellow('Make sure your backend server is running on http://localhost:8000\n'));
  
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
    console.log(chalk.gray('1. Make sure backend is running: cd server && npm run dev'));
    console.log(chalk.gray('2. Check if port 3456 is available'));
    console.log(chalk.gray('3. Try again: vathavaran login\n'));
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
    console.log(chalk.red('❌ Not authenticated. Please run: vathavaran login'));
    return;
  }

  const auth = getAuth();

  try {
    const db = getDb();
    
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

    // Verify user has access to this repository
    const spinner = ora('Verifying repository access...').start();
    
    try {
      // Check if user has push access to the repository
      const repoCheck = await fetch(`https://api.github.com/repos/${repoFullName}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!repoCheck.ok) {
        spinner.fail(chalk.red('Repository not found or you do not have access'));
        return;
      }
      
      const repoData = await repoCheck.json();
      
      // Check if user has push permissions (is owner or collaborator with push access)
      if (!repoData.permissions || !repoData.permissions.push) {
        spinner.fail(chalk.red('You do not have push access to this repository'));
        console.log(chalk.yellow('\n⚠️  You must be the owner or have push access to store environment variables for this repository\n'));
        return;
      }
      
      spinner.text = 'Encrypting and pushing environment variables...';
      
      // Encrypt the entire content
      const encryptedContent = encryptEnv(envContent);
      
      // Save to Firestore with userId as number
      await db.collection('envFiles').add({
        userId: auth.userId, // Already stored as number
        userName: auth.userName,
        repoFullName: repoFullName,
        repoName: answers.repoName,
        directory: answers.directory,
        envName: answers.envName,
        content: encryptedContent,
        isEncrypted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

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
    console.log(chalk.red('❌ Not authenticated. Please run: vathavaran login'));
    return;
  }

  const auth = getAuth();

  try {
    const db = getDb();
    
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

    // Query Firestore
    const snapshot = await db.collection('envFiles')
      .where('userId', '==', auth.userId)
      .where('repoFullName', '==', repoFullName)
      .where('directory', '==', answers.directory)
      .get();

    if (snapshot.empty) {
      spinner.fail(chalk.yellow('No environment files found for this repository'));
      return;
    }

    // List available env files
    const envFiles = [];
    snapshot.forEach(doc => {
      envFiles.push({ id: doc.id, ...doc.data() });
    });

    spinner.stop();

    const { selectedFile } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedFile',
        message: 'Select environment file:',
        choices: envFiles.map(f => ({
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
    console.log(chalk.red(`❌ Failed to pull: ${error.message}`));
  }
}

// List env command
export async function listEnv(options) {
  if (!isAuthenticated()) {
    console.log(chalk.red('❌ Not authenticated. Please run: vathavaran login'));
    return;
  }

  const auth = getAuth();
  const spinner = ora('Fetching your environment files...').start();

  try {
    const db = getDb();
    
    const snapshot = await db.collection('envFiles')
      .where('userId', '==', auth.userId)
      .get();

    if (snapshot.empty) {
      spinner.fail(chalk.yellow('No environment files found'));
      return;
    }

    spinner.stop();

    console.log(chalk.blue('\n📋 Your Environment Files:\n'));
    
    const envFiles = [];
    snapshot.forEach(doc => {
      envFiles.push({ id: doc.id, ...doc.data() });
    });

    // Group by repository
    const grouped = envFiles.reduce((acc, file) => {
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
