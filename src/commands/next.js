import ora from 'ora';
import mobConfig from '../mobConfig';
import prompt from '../prompt';
import * as git from '../git';
import { commandPreRequisites, updateMobConfig } from '../utils';


const next = async (specifiedNextUser) => {
  // @todo check if there is anything to commit
  await commandPreRequisites();
  const spinner = ora();
  const mobitConfig = mobConfig.get();
  const currentGitUser = await git.getUserName();
  let nextUser;

  if (!specifiedNextUser) {
    nextUser = mobConfig.getNextUser(mobitConfig.members, currentGitUser);
  } else {
    // @todo validate the specifieduser is in the mob, prompt to add ?
    if (!mobitConfig.members.includes(specifiedNextUser)) {
      const agrees = await prompt.yn(`${specifiedNextUser} is not in the mob, do you want to add ?`);
      if (agrees) {
        // add to mob
        mobitConfig.members.push(specifiedNextUser);
      } else {
        process.exit(0);
      }
    }
    nextUser = specifiedNextUser;
  }

  if (await git.hasChanges()) {
    spinner.start(`Running handover to ${nextUser}`);
    mobConfig.set({ ...mobitConfig, current: nextUser });
    await git.commitAndPush('WIP commit');
    spinner.succeed();
  } else {
    await updateMobConfig({ ...mobitConfig, current: nextUser });
  }
};

export default next;
