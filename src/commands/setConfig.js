import chalk from 'chalk';
import prompt from '../prompt';
import mobConfig from '../mobConfig';
import * as git from '../git';
import { updateMobConfig } from '../utils';

const setConfig = async () => {
  const currentBranch = await git.currentBranch();
  if (currentBranch === 'master') {
    console.log(
      chalk.red(`Cannot create config on master branch. Please setup branch with ${chalk.bold('mobit setbranch')} or setup using the menu by typing ${chalk.bold('mobit')}`),
    );
    process.exit(1);
  }
  let currentMobConfig = mobConfig.get();
  if (!currentMobConfig) {
    currentMobConfig = mobConfig.default;
  }
  const newConfig = await prompt.mobConfig(currentMobConfig);
  await updateMobConfig(newConfig);
};

export default setConfig;
