import { List, prompt, Select } from 'enquirer';
import chalk from 'chalk';
import * as git from './git';

const mobConfig = async (currentMobConfig) => {
  const memberPrompt = new List({
    name: 'keywords',
    message: 'Enter git usernames for members of the mob',
    initial: currentMobConfig.members,
  });

  let members = await memberPrompt.run();

  members = members.filter((a, b) => members.indexOf(a) === b);

  const currentUser = await git.getUserName();
  if (!members.includes(currentUser)) {
    members.push(currentUser);
  }

  const starterUserPrompt = new Select({
    name: 'current',
    message: 'Pick a member to start',
    choices: members,
  });
  const starter = await starterUserPrompt.run();

  const response = await prompt([
    {
      type: 'numeral',
      name: 'duration',
      message: 'How long do you want the timer?',
      initial: currentMobConfig.duration,
    },
    {
      type: 'numeral',
      name: 'breakAfter',
      message: 'Number of rotations before a break?',
      initial: currentMobConfig.breakAfter,
    },
    {
      type: 'numeral',
      name: 'breakDuration',
      message: 'How long should the break be?',
      initial: currentMobConfig.breakDuration,
    },
  ]);

  const { breakAfter, duration, breakDuration } = response;

  return {
    members: members.map((member) => member.name.trim()),
    current: starter,
    breakAfter,
    breakDuration,
    duration,
  };
};

const postStartOptions = async (next) => {
  const response = await prompt({
    type: 'select',
    name: 'choice',
    message: 'You have finished your turn, what do you want to do?',
    initial: 0,
    choices: [
      { name: 'next', message: `Handover to ${next}` },
      { name: 'finish', message: 'Finish mob and commit to main branch' },
      {
        name: 'exit',
        message: 'Exit',
      }],
  });
  return response.choice;
};

const mobBranch = async (currentMobBranch) => {
  const response = await prompt({
    type: 'input',
    name: 'branchName',
    message: 'Type a branch to use for mobbing wip commits',
    initial: currentMobBranch,
    validate: (value) => {
      if (value === 'master') {
        return chalk.red('Cannot mob on master branch');
      }
      return true;
    },
  });
  return response.branchName;
};

const menu = async (choices) => {
  const menuOptions = [
    {
      type: 'select',
      name: 'option',
      message: 'Choose an option',
      initial: 1,
      choices,
    },
  ];

  const answer = await prompt(menuOptions);
  return answer.option;
};

const any = async () => {
  await prompt({
    type: 'input',
    name: 'sdsdsd',
    message: 'Press enter to continue',
  });
};

export default {
  any,
  menu,
  postStartOptions,
  mobBranch,
  mobConfig,
};
