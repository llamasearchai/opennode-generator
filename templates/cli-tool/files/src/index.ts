#!/usr/bin/env node

import { program } from 'commander';
import { hello } from './commands/hello';

const packageJson = require('../package.json');

program
  .name('{{packageName}}')
  .description('{{description}}')
  .version(packageJson.version);

program
  .command('hello [name]')
  .description('Say hello to someone')
  .option('-e, --enthusiastic', 'add enthusiasm')
  .action(hello);

program.parse();
