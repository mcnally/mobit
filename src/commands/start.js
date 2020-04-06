import keypress from 'keypress';
import notifier from 'node-notifier';
import ora from 'ora';
import clear from 'clear';
import * as git from '../git';
import mobConfig from '../mobConfig';
import prompt from '../prompt';
import finish from './finish';
import {
  message, mobbingInfo, commandPreRequisites,
} from '../utils';

export const setTimerInterval = (time, callBack, onEndCallBack) => {
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


// eslint-disable-next-line no-async-promise-executor
const start = (commandSpecifiedDuration) => new Promise(async (resolve) => {
  await commandPreRequisites();
  let timerInterval;
  let mainInterval;
  const spinner = ora('Setting up').start();
  let isDriving;
  let mobitConfig;
  const currentGitUser = await git.getUserName();
  const leaveStart = () => {
    spinner.succeed();
    clearInterval(timerInterval);
    clearInterval(mainInterval);
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
      await finish();
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
      (commandSpecifiedDuration || mobitConfig.duration) * 60,
      spinner,
      mobitConfig,
      currentGitUser,
      onCompleteDriving,
    );
  } else {
    spinner.text = `${mobbingInfo(mobitConfig, currentGitUser)}`;
  }

  mainInterval = setInterval(async () => {
    if (mobitConfig.current !== currentGitUser) {
      spinner.text = '- Checking for changes';
      await git.pull();
    }
    mobitConfig = mobConfig.get();
    if (isDriving && mobitConfig.current === currentGitUser) {
      // do nothing
    } else if (!isDriving && mobitConfig.current === currentGitUser) {
      // Your turn, set timer interval
      isDriving = true;
      clearInterval(timerInterval);
      timerInterval = setDrivingInterval(
        (commandSpecifiedDuration || mobitConfig.duration) * 60,
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
  process.stdin.on('keypress', (ch, key) => {
    if (key && key.name === 'e') {
      process.stdin.pause();
      leaveStart();
    }
  });
  process.stdin.setRawMode(true);
  process.stdin.resume();
});

export default start;
