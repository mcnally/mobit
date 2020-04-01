import ora from 'ora';
import Conf from 'conf';
import path from 'path';
import * as git from '../git';
import prompt from '../prompt';
import { showError } from '../utils';


const setMobBranch = async (userSpecifiedBranch) => {
  const config = new Conf({ projectName: path.basename(process.cwd()) });
  const branchName = userSpecifiedBranch || await prompt.mobBranch(config.get('branchName'));
  const currentBranch = await git.currentBranch();
  const spinner = ora(`Setting up branch: ${branchName}`).start();

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

export default setMobBranch;
