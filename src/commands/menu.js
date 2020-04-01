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
import start from './start';
import next from './next';

import {
  showInfo,
} from '../utils';

const menu = async () => {
  // Are we in a repo ?
  if (!(await git.checkIsRepo())) {
    process.exit(1);
  }

  const config = new Conf({ projectName: path.basename(process.cwd()) });
  const { projectName } = config._options;
  const mobbingBranch = config.get('branchName');
  let currentOption = '';

  if (!mobbingBranch) {
    // prompt to create
    await setMobBranch();
  }

  // @todo Check if there are uncommitted changes

  // Move to mobbing branch and pull
  await git.checkout(mobbingBranch);
  // @todo Check if there are uncommitted changes

  await git.pullAndFetch();
  const mobConfigPresent = mobConfig.has();

  if (!mobConfigPresent) {
    // prompt to create
    await setConfig();
  }

  let mobitConfig = mobConfig.get();

  // If current users name isnt in the list, add it
  const currentUser = await git.getUserName();
  if (!currentUser) {
    throw new Error('Please set a git user name');
  }


  // @todo check if user is in the config, if not add them !

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
        name: 'finish',
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
