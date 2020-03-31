import chalk from 'chalk';
import figlet from 'figlet';
import prompt from './prompt';
import mobConfig from './mobConfig';

export const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // eslint-disable-next-line no-param-reassign
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};


export const message = (defaultMessage, info, time) => {
  if (time) {
    const minutes = Math.floor(time / 60);
    const seconds = time - minutes * 60;
    const leftPad = (n) => (n < 10 ? `0${n}` : n);
    return `${leftPad(minutes)}:${leftPad(seconds)} - ${defaultMessage} - ${info}`;
  }
  return `${defaultMessage} - ${info}`;
};

export const mobbingInfo = (config, currentUser) => {
  const { current, members } = config;
  const nextUser = mobConfig.getNextUser(members, current);
  const isDriving = config.current === currentUser;
  if (isDriving) {
    return `You are currently driving, ${nextUser} is next`;
  }
  return `You are navigating - ${current} is driving, ${nextUser === currentUser ? 'you are next' : `${nextUser} is next`}`;
};

export const showError = async (error) => {
  console.log(chalk.red('Errors found:'));
  console.log(error);
  await prompt.any();
};

export const showInfo = (projectName, config, mobitConfig, currentUser) => {
  const branchName = config.get('branchName');
  console.log(
    chalk.yellow(figlet.textSync('Mobit', { horizontalLayout: 'full' })),
  );
  console.log(chalk.green(`In ${projectName}`));
  console.log(
    chalk.green(`Mobbing branch: ${branchName || 'Not set'}`),
  );
  if (mobitConfig) {
    const members = mobitConfig.members.map((m) => {
      let member;
      if (m === currentUser) {
        member = `-${m} - you`;
      } else {
        member = `-${m}`;
      }
      return member === mobitConfig.current
        ? chalk.white.bold(`${member} - current`)
        : chalk.white(member);
    });
    console.log(
      chalk.green.bold(
        `Currently ${members.length === 2 ? 'pairing' : 'mobbing'} with:`,
      ),
    );
    console.log(`${members.join('\n')}`);
    console.log(chalk.green.bold(`Duration is ${mobitConfig.duration}`));
    console.log(
      chalk.green.bold(
        `Break after ${mobitConfig.duration} rotations for ${mobitConfig.breakDuration} minutes`,
      ),
    );
  } else {
    console.log(chalk.yellow.bold('No mob config set up'));
  }
};
