import ora from 'ora';
import mobConfig from '../mobConfig';
import prompt from '../prompt';
import * as git from '../git';

const next = async (specifiedNextUser) => {
  // @todo check if there is anything to commit
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
  spinner.start(`Running handover to ${nextUser}`);
  // update next person
  mobConfig.set({ ...mobitConfig, current: nextUser });
  // Commit and push
  await git.commitAndPush('WIP commit');
  spinner.succeed();
};

export default next;
