/* eslint-disable no-await-in-loop */
import Conf from 'conf';
import clear from 'clear';
import chalk from 'chalk';
import path from 'path';
import * as git from '../git';
import prompt from '../prompt';
import mobConfig from '../mobConfig';
import setConfig from './setConfig';
import setMobBranch from './setMobBranch';
import shuffleMob from './shuffleMob';
import done from './done';
import start from './start';
import next from './next';

import {
  showInfo, updateMobConfig,
} from '../utils';

const menu = async () => {
  // Are we in a repo ?
  if (!(await git.checkIsRepo())) {
    return;
  }

  const config = new Conf({ projectName: path.basename(process.cwd()) });
  const { projectName } = config._options;
  let mobbingBranch = config.get('branchName');
  const currentBranch = await git.currentBranch();
  let currentOption = '';

  if (!mobbingBranch) {
    // prompt to create
    mobbingBranch = await setMobBranch();
  }

  await git.fetch();
  const branchExists = await git.getBranchExistsStatus(mobbingBranch);

  if (branchExists.remote === false) {
    // If theres no remote branch the mob session has probably finished
    console.log(chalk.yellow('Mobbing has finished on this branch, resetting your local mob branch name'));
    console.log(chalk.yellow('Please rerun this command to start again'));
    config.delete('branchName');
    process.exit(0);
  }


  // Check if there are uncommitted changes in none mobbing branch
  if (currentBranch !== mobbingBranch && await git.hasChanges()) {
    console.log(chalk.red(`You have changes in the current branch, please stash or commit (or use ${chalk.bold('mob next')}) `));
    process.exit(1);
  }

  // Move to mobbing branch and pull
  await git.checkout(mobbingBranch);
  await git.pullAndFetch();
  const mobConfigPresent = mobConfig.has();

  if (!mobConfigPresent) {
    // prompt to create
    await setConfig();
  }

  let mobitConfig = mobConfig.get();

  const currentUser = await git.getUserName();
  if (!currentUser) {
    throw new Error('Please set a git user name');
  }

  // If user is not in the config, add them
  if (!mobitConfig.members.includes(currentUser)) {
    mobitConfig.members.push(currentUser);
    await updateMobConfig(mobitConfig);
  }

  clear();
  showInfo(projectName, config, mobitConfig);


  do {
    mobitConfig = mobConfig.get();
    const isDriving = mobitConfig.current === currentUser;
    currentOption = await prompt.menu([
      {
        name: 'start',
        message: 'Start mobbing',
        disabled: mobitConfig === undefined,
      },

      {
        name: 'next',
        message: 'Pass to next',
        disabled: mobitConfig === undefined || !isDriving ? '(disabled - You are not driving)' : undefined,
      },
      {
        name: 'done',
        message: 'Complete mobbing on this branch',
        disabled: mobitConfig === undefined,
      },
      {
        name: 'updateMobConfig',
        message: 'Update mobit config ⚙️',
        disabled: mobitConfig === undefined,
      },
      {
        name: 'shuffleMob',
        message: 'Randomize the mob 🎲',
        disabled: mobitConfig === undefined,
      },
      {
        name: 'setMobbingBranch',
        message: 'Set mob branch 🔀',
      },
      { name: 'exit', message: 'Exit 🚪' },
    ]);

    switch (currentOption) {
      case 'setMobbingBranch':
        await setMobBranch();
        break;
      case 'start':
        await start();
        break;
      case 'next':
        await next();
        break;
      case 'updateMobConfig':
        await setConfig();
        break;
      case 'shuffleMob':
        await shuffleMob();
        break;
      case 'done':
        await done();
        break;
      default:
        break;
    }
    clear();
    showInfo(projectName, config, mobConfig.get());
  } while (currentOption !== 'exit');
  console.log(chalk.green('Bye 👋'));
  process.exit(0);
};

export default menu;
