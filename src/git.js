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
  const branchOutput = await git().branch();
  const keys = Object.keys(branchOutput.branches);
  return {
    local: keys.includes(branchName),
    remote: keys.includes(`remotes/origin/${branchName}`),
  };
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

export const pull = () => {
  git().pull(['--ff-only']);
};

export const checkoutRemoteBranch = async (branchName) => {
  await git().checkout(branchName);
  await git().branch(['-u', `origin/${branchName}`]);
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

export const removeLocalAndCreatNew = async (branchName) => {
  await git().branch(['-D', branchName]);
  await createNewBranchFromMaster(branchName);
};

export const commitAndPush = async (message, files = ['.']) => {
  await git().add(files);
  await git().commit(message);
  await git().push(['--no-verify']);
};

export const getUserName = async () => {
  const userName = await git().raw(['config', '--get', 'user.name']);
  return userName.trim();
};
