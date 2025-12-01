#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { login, logout, pushEnv, pullEnv, listEnv } from '../src/commands.js';

const program = new Command();

program
  .name('varte')
  .description('CLI tool to securely manage environment variables across your GitHub repositories')
  .version('1.0.0');

program
  .command('login')
  .description('Login to Varte using GitHub OAuth')
  .action(login);

program
  .command('logout')
  .description('Logout from Varte')
  .action(logout);

program
  .command('push')
  .description('Encrypt and push environment variables to the cloud')
  .option('-f, --file <path>', 'Path to env file', '.env')
  .option('-o, --owner <owner>', 'Repository owner')
  .option('-r, --repo <repo>', 'Repository name')
  .option('-d, --directory <directory>', 'Directory path')
  .option('-n, --name <name>', 'Environment file name')
  .action(pushEnv);

program
  .command('pull')
  .description('Pull and decrypt environment variables from the cloud')
  .option('-o, --owner <owner>', 'Repository owner')
  .option('-r, --repo <repo>', 'Repository name')
  .option('-d, --directory <directory>', 'Directory path')
  .option('--output <path>', 'Output file path')
  .action(pullEnv);

program
  .command('list')
  .description('List all your stored environment files')
  .option('-o, --owner <owner>', 'Repository owner (filter by repo)')
  .option('-r, --repo <repo>', 'Repository name (filter by repo)')
  .action(listEnv);

program.parse();
