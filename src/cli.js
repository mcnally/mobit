/* eslint-disable no-await-in-loop */
import { program } from 'commander';
import Conf from 'conf';
import clear from 'clear';
import chalk from 'chalk';
import path from 'path';
import ora from 'ora';
import keypress from 'keypress';
import notifier from 'node-notifier';
import prompt from './prompt';
import * as git from './git';
import mobConfig from './mobConfig';
import {
  showInfo, shuffle, showError, message, mobbingInfo,
} from './utils';

program.option('-d, --debug', 'output extra debugging').parse(process.argv);

const updateMobConfig = async conf => {
  const currentConfig = mobConfig.get();
  if (JSON.stringify(conf) !== JSON.stringify(currentConfig)) {
    const spinner = ora('Pushing mobit config file').start();
    mobConfig.set(conf);
    await git.commitAndPush('Updated mob config', ['./.mobit.json']);
    spinner.succeed();
  }
};

const setConfig = async () => {
  let currentMobConfig = mobConfig.get();
  if (!currentMobConfig) {
    currentMobConfig = mobConfig.default;
  }
  const newConfig = await prompt.mobConfig(currentMobConfig);
  await updateMobConfig(newConfig);
};

const shuffleMob = async () => {
  const conf = mobConfig.get();
  const { members } = conf;
  await updateMobConfig({ ...conf, members: shuffle(members) });
};

export const setMobBranch = async config => {
  const branchName = await prompt.mobBranch(config.get('branchName'));
  const currentBranch = await git.currentBranch();
  const spinner = ora('Setting up branch').start();

  try {
    await git.pullAndFetch();
    const branchExists = await git.getBranchExistsStatus(branchName);
    if (branchExists.local && branchExists.remote) {
      spinner.succeed('Branch is available locally and on the remote');
      if (currentBranch !== branchName) {
        await git.removeLocalBranchAndCheckoutRemote();
      }
    } else if (!branchExists.local && !branchExists.remote) {
      spinner.info('Branch does not exist locally or on the remote');
      spinner.start('Creating brand new branch');
      await git.createNewBranchFromMaster(branchName);
      spinner.succeed();
    } else if (!branchExists.local && branchExists.remote) {
      spinner.info('Branch exists on the remote but not locally');
      spinner.start('Checking out remote branch');
      git.checkoutRemoteBranch(branchName);
      spinner.succeed();
    } else if (branchExists.local && !branchExists.remote) {
      spinner.info('Branch exists locally but not on the remote ');
      spinner.start('Purging local branch and starting a new one');
      await git.removeLocalAndCreatNew(branchName);
      spinner.succeed();
    }
    config.set('branchName', branchName);
  } catch (e) {
    await showError(e);
  }
};


const setTimerInterval = (time, callBack, onEndCallBack) => {
  let timer = time;
  const timerInterval = setInterval((function timerCallback() {
    timer--;
    if (timer === 0) {
      clearInterval(timerInterval);
      onEndCallBack();
    }
    callBack(timer);
    return timerCallback;
  }()), 1000);
};

const setDrivingInterval = (duration, spinner, mobitConfig, currentUser, callback) => {
  const nextUser = mobConfig.getNextUser(mobitConfig.members, currentUser);
  return setTimerInterval(duration,
    (t) => { spinner.text = message(mobbingInfo(mobitConfig, currentUser), 'Press e to exit', t); },
    async () => {
      notifier.notify(
        {
          title: 'Mobit',
          message: 'Mob duration finished, see terminal',
          sound: true,
        },
      );
      spinner.succeed();
      clear();
      const answer = await prompt.postStartOptions(nextUser);
      callback(answer);
    });
};

const mobFinish = async () => {
  // Squash commits on to main branch

  // prompt for commit message

  // Delete main branch
};

// eslint-disable-next-line no-async-promise-executor
const start = (currentGitUser) => new Promise(async (resolve) => {
  const intervalIds = [];
  let timerInterval;
  const spinner = ora('').start();
  let isDriving;
  let mobitConfig;
  const leaveStart = () => {
    spinner.succeed();
    intervalIds.map((id) => {
      clearInterval(id);
    });
    resolve('complete');
  };
  const onCompleteDriving = async (option) => {
    isDriving = false;
    const nextUser = mobConfig.getNextUser(mobitConfig.members, currentGitUser);
    if (option === 'next') {
      spinner.text = 'Running handover to next user';
      // update next person
      mobConfig.set({ ...mobitConfig, current: nextUser });
      // Commit and push
      await git.commitAndPush('WIP commit');
      spinner.succeed();
      clear();
      spinner.start('');
    } else if (option === 'exit') {
      leaveStart();
    } else if (option === 'finish') {
      // Complete mob
      await mobFinish();
      leaveStart();
    }
  };

  keypress(process.stdin);
  clear();
  // @todo move to branch here
  await git.pullAndFetch();
  mobitConfig = mobConfig.get();
  isDriving = mobitConfig.current === currentGitUser;

  // First run
  if (isDriving) {
    // set timer interval
    timerInterval = setDrivingInterval(
      mobitConfig.duration * 60,
      spinner,
      mobitConfig,
      currentGitUser,
      onCompleteDriving,
    );
    // For cleanup later if the user exits
    intervalIds.push(timerInterval);
  } else {
    spinner.text = `${mobbingInfo(mobitConfig, currentGitUser)}`;
  }

  const interval = setInterval(async () => {
    if (mobitConfig.current !== currentGitUser) {
      spinner.text = '- Checking for changes';
      await git.pull();
    }
    mobitConfig = mobConfig.get();
    if (!isDriving && mobitConfig.current === currentGitUser) {
      // Your turn, set timer interval
      isDriving = true;
      clearInterval(timerInterval);
      timerInterval = setDrivingInterval(
        mobitConfig.duration * 60,
        spinner,
        mobitConfig,
        currentGitUser,
        onCompleteDriving,
      );
      spinner.text = `${mobbingInfo(mobitConfig, currentGitUser)}`;
    } else {
      spinner.text = `${mobbingInfo(mobitConfig, currentGitUser)}`;
    }
  }, 5000);
  intervalIds.push(interval);
  process.stdin.on('keypress', (ch, key) => {
    if (key && key.name === 'e') {
      process.stdin.pause();
      leaveStart();
    }
  });
  process.stdin.setRawMode(true);
  process.stdin.resume();
});

export const main = async () => {
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
    await setMobBranch(config);
  } else {
    // @todo Check if there are uncommitted changes

    // Move to mobbing branch and pull
    await git.checkout(mobbingBranch);
    // @todo Check if there are uncommitted changes

    await git.pullAndFetch();
  }

  const mobConfigPresent = mobConfig.has();

  if (!mobConfigPresent) {
    // prompt to create
    await setConfig();
  }

  let mobitConfig = mobConfig.get();

  // If current users name isnt in the list, add it
  const currentUser = await git.getUserName();
  if (!currentUser) {
    throw new Error('Please set a user name ');
  }


  // @todo check if user is in the config, if not add them !

  clear();
  showInfo(projectName, config, mobitConfig, currentUser);

  do {
    mobitConfig = mobConfig.get();
    currentOption = await prompt.menu([
      {
        name: 'start',
        message: 'Start mobbing',
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
        await setMobBranch(config);
        break;
      case 'start':
        await start(currentUser);
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
    showInfo(projectName, config, mobConfig.get(), currentUser);
  } while (currentOption !== 'exit');
  console.log(chalk.green('Bye 👋'));
};
