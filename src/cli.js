import { program } from 'commander';

import {
  start, setMobBranch, shuffleMob, menu, setConfig, next,
} from './commands';

program
  .command('menu', { isDefault: true })
  .description('Shows the main menu with all options')
  .action(menu);

program
  .command('start [minutes]')
  .description('Starts mob session (with optional minutes to override config)')
  .alias('s')
  .action(start);

program
  .command('shuffle')
  .description('Shuffles the mob order')
  .action(shuffleMob);

program
  .command('setbranch [branchname]')
  .description('Sets up the mobbing branch for this repo (optionally pass a branchname')
  .action(setMobBranch);

program
  .command('config')
  .description('Sets up the mob config on the branch')
  .action(setConfig);

program
  .command('next [user]')
  .description('Handover to the next person in the mob (optionally pass a git username to specify which user)')
  .action(next);


program.parse(process.argv);
