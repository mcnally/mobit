import chalk from 'chalk';
import figlet from 'figlet';
import ora from 'ora';
import prompt from './prompt';
import mobConfig from './mobConfig';
import * as git from './git';

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

export const updateMobConfig = async conf => {
  const currentConfig = mobConfig.get();
  if (JSON.stringify(conf) !== JSON.stringify(currentConfig)) {
    const spinner = ora('Pushing mobit config file').start();
    mobConfig.set(conf);
    await git.commitAndPush('Updated mob config', ['./.mobit.json']);
    spinner.succeed('Pushing config file');
  }
};

export const showInfo = (projectName, config, mobitConfig) => {
  const branchName = config.get('branchName');
  console.log(
    chalk.yellow(figlet.textSync('Mobit', { horizontalLayout: 'full' })),
  );
  console.log(chalk.green(`In ${projectName}`));
  console.log(
    chalk.green(`Mobbing branch: ${branchName || 'Not set'}`),
  );
  if (mobitConfig) {
    const members = mobitConfig.members.map((member) => (member === mobitConfig.current
      ? chalk.white.bold(`-${member} - driver`)
      : chalk.white(`-${member}`)));
    console.log(
      chalk.green.bold(
        `Currently ${members.length === 2 ? 'pairing' : 'mobbing'} with:`,
      ),
    );
    console.log(`${members.join('\n')}`);
    console.log(chalk.green(`Duration is ${mobitConfig.duration}`));
    console.log(
      chalk.green(
        `Break after ${mobitConfig.duration} rotations for ${mobitConfig.breakDuration} minutes`,
      ),
    );
  } else {
    console.log(chalk.yellow.bold('No mob config set up'));
  }
};
