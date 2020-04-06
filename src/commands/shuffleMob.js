import ora from 'ora';
import { updateMobConfig, commandPreRequisites } from '../utils';
import mobConfig from '../mobConfig';

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // eslint-disable-next-line no-param-reassign
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const shuffleMob = async () => {
  await commandPreRequisites();
  const spinner = ora('Shuffling mob');
  let conf = mobConfig.get();
  const { members } = conf;
  await updateMobConfig({ ...conf, members: shuffle(members) });
  conf = mobConfig.get();
  spinner.succeed(`New mob order is: ${conf.members.join(', ')} `);
};

export default shuffleMob;
