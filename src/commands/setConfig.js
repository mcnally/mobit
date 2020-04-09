import prompt from '../prompt';
import mobConfig from '../mobConfig';
import { updateMobConfig, commandPreRequisites } from '../utils';

const setConfig = async () => {
  // @todo move to branch if no changes
  await commandPreRequisites({ checkMobConfig: false });
  let currentMobConfig = mobConfig.get();
  if (!currentMobConfig) {
    currentMobConfig = mobConfig.default;
  }
  const newConfig = await prompt.mobConfig(currentMobConfig);
  await updateMobConfig(newConfig);
};

export default setConfig;
