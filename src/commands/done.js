import ora from 'ora';
import chalk from 'chalk';
import { commandPreRequisites, getLocalConfig } from '../utils';
import prompt from '../prompt';

import * as git from '../git';

const getStat = (status) => {
  if (status === 'M') {
    return '(Modified)';
  } if (status === 'D') {
    return '(Deleted)';
  } if (status === 'A') {
    return '(New file)';
  }
};

const done = async () => {
  await commandPreRequisites();
  const spinner = ora().start('Completing mob session');
  const config = getLocalConfig();
  const mobBranch = await config.get('branchName');
  await git.fetch();
  // Check if there are any changed files and commit
  const branchStatus = await git.getBranchExistsStatus(mobBranch);
  if (branchStatus.remote) {
    if (await git.hasChanges()) {
      spinner.text = 'Local changes found, pushing to remote first';
      await git.commitAndPush();
      spinner.succeed();
      spinner.start();
    }

    await git.checkout('master');
    await git.pull();
    // Squash commits on to main branch
    spinner.start('Staging changes on master branch');
    await git.stageMobBranchFiles(mobBranch);
    spinner.succeed();
    // Delete mob branch
    spinner.start('Removing mob branch (local and remote)');
    await git.deleteLocalAndRemoteBranch(mobBranch);
    config.delete('branchName');
    spinner.succeed();
    // get localchanges
    const changedFiles = await git.getChangedFiles();
    spinner.succeed();
    if (changedFiles.length) {
      console.log('');
      changedFiles.map((f) => {
        spinner.info(chalk.gray(`- ${f.path} ${getStat(f.index)}`));
      });
      console.log('');
      spinner.succeed('Above files are staged on master ready to commit');
      console.log('');
    } else {
      spinner.succeed('No changes found on mob branch');
    }
    await prompt.any();
    process.exit(0);
  } else {
    spinner.succeed('No mob branch found on the remote, looks like the mob session has already ended');
  }
};

export default done;
