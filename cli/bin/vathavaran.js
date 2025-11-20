#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initializeFirebase } from '../src/firebase.js';
import { login, logout, pushEnv, pullEnv, listEnv } from '../src/commands.js';

const program = new Command();

// Initialize Firebase
try {
  initializeFirebase();
} catch (error) {
  // Will be initialized when needed
}

program
  .name('vathavaran')
  .description('CLI tool to manage environment variables with Vathavaran')
  .version('1.0.0');

program
  .command('login')
  .description('Login to Vathavaran')
  .action(login);

program
  .command('logout')
  .description('Logout from Vathavaran')
  .action(logout);

program
  .command('push')
  .description('Push environment variables to the cloud')
  .option('-f, --file <path>', 'Path to env file', '.env')
  .option('-o, --owner <owner>', 'Repository owner')
  .option('-r, --repo <repo>', 'Repository name')
  .option('-d, --directory <directory>', 'Directory path')
  .option('-n, --name <name>', 'Environment file name')
  .action(pushEnv);

program
  .command('pull')
  .description('Pull environment variables from the cloud')
  .option('-o, --owner <owner>', 'Repository owner')
  .option('-r, --repo <repo>', 'Repository name')
  .option('-d, --directory <directory>', 'Directory path')
  .option('--output <path>', 'Output file path')
  .action(pullEnv);

program
  .command('list')
  .description('List all your environment files')
  .action(listEnv);

program.parse();
