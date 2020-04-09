import chalk from 'chalk';
import Conf from 'conf';
import path from 'path';
import figlet from 'figlet';
import ora from 'ora';
import prompt from './prompt';
import mobConfig from './mobConfig';
import * as git from './git';

export const getLocalConfig = () => new Conf({ projectName: path.basename(process.cwd()) });

export const commandPreRequisites = async ({ checkMobConfig = true } = {}) => {
  const errors = [];
  const config = getLocalConfig();
  const currentBranch = await git.currentBranch();
  const currentUser = await git.getUserName();
  const mobBranch = await config.get('branchName');
  if (!(await git.checkIsRepo())) {
    errors.push('Directory does not have git');
  } else {
    if (currentBranch === 'master') {
      errors.push('Cannot run command on master branch');
    }
    if (!mobBranch) {
      errors.push('No mobbing branch set');
    } else if (currentBranch !== mobBranch) {
      errors.push('You are not on the mobbing branch');
    } else if (currentBranch === mobBranch) {
      if (checkMobConfig) {
        if (!mobConfig.has()) {
          errors.push('No mob config present in branch');
        } else {
          const mobitConfig = await mobConfig.get();
          if (!mobitConfig.members.includes(currentUser)) {
            errors.push('You are not in this mob');
          }
        }
      }
    }
  }
  if (errors.length > 0) {
    console.log(chalk.yellow('Please correct the folllowing errrors before using this command'));
    errors.map((error, index) => {
      console.log(chalk.red(`${index + 1}: ${error}`));
    });
    process.exit(1);
  }
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
  console.log();
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
