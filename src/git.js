import git from 'simple-git/promise';

export const isOnMobBranch = async (branchName) => {
  const output = await git().branch();
  return output.current === branchName;
};

export const checkout = async (branch) => {
  await git().checkout(branch);
};

export const checkIsRepo = async () => git().checkIsRepo();

export const getBranchExistsStatus = async (branchName) => {
  await git().fetch();
  const branchOutput = await git().branch();
  const keys = Object.keys(branchOutput.branches);
  return {
    local: keys.includes(branchName),
    remote: keys.includes(`remotes/origin/${branchName}`),
  };
};


export const hasBranch = async (branchName) => {
  const stat = await getBranchExistsStatus(branchName);
  return stat.local || stat.remote;
};

export const currentBranch = async () => {
  const output = await git().branch();
  return output.current;
};

export const removeLocalBranchAndCheckoutRemote = async (branchName) => {
  await git().branch(['-D', branchName]);
  await git().checkoutBranch(branchName);
  await git().branch(['-u', `origin/${branchName}`]);
};

export const pullAndFetch = async () => {
  await git().fetch();
  await git().pull(['--ff-only']);
};

export const fetch = async () => {
  await git().fetch(['--prune']);
};

export const pull = () => git().pull(['--ff-only']);


export const checkoutRemoteBranch = async (branchName) => {
  await git().checkout(branchName);
  await git().branch(['-u', `origin/${branchName}`]);
};

export const deleteLocalAndRemoteBranch = async (branchName) => {
  if (!branchName || branchName === 'master') {
    throw new Error('Cannot delete master branch');
  }
  await git().branch(['-D', branchName]);
  await git().push(['origin', '--delete', branchName]);
};


export const createNewBranchFromMaster = async (branchName) => {
  await git().checkout('master');
  await git().merge(['origin/master', '--ff-only']);
  await git().checkout(['-b', branchName]);
  await git().push(['--set-upstream', 'origin', branchName]);
};

export const hasChanges = async () => {
  const stat = await git().status();
  return stat.files.length > 0;
};

export const getChangedFiles = async () => {
  const stat = await git().status();
  return stat.files;
};

export const removeLocalAndCreatNew = async (branchName) => {
  await git().branch(['-D', branchName]);
  await createNewBranchFromMaster(branchName);
};

export const stageMobBranchFiles = (branch) => git().merge(['--squash', '--ff', branch]);

export const commitAndPush = async (message, files = ['.']) => {
  await git().add(files);
  await git().commit(message);
  await git().push(['--no-verify']);
};

export const getUserName = async () => {
  const userName = await git().raw(['config', '--get', 'user.name']);
  return userName.trim();
};
