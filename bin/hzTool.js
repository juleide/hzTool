#!/usr/bin/env node
import { Command } from 'commander'
import cleanNodeModules from '../commands/cleanNodeModules.js'
import startDevServer from '../commands/startDevServer.js';

const program = new Command();

// 设置版本和描述
program
  .version('1.0.0')
  .description('hzTool: A CLI tool for various tasks');

// 添加子命令
program
  .command('clean-node_modules')
  .description('Delete all node_modules folders in the current directory and its subdirectories.')
  .action(cleanNodeModules);

program
  .command('start-dev-server')
  .description('Start a development server with live reloading and optional API proxy.')
  .option('-c, --config <configPath>', 'Path to the proxy configuration file')
  .option('-p, --port <port>', 'Specify the port number (default is 8080)')
  .action(startDevServer);

// 解析命令行输入
program.parse(process.argv);