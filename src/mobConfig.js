const { existsSync, writeFileSync, readFileSync } = require('fs');

const has = () => existsSync('./.mobit.json');

const getNextUser = (users = [], currentUser) => {
  const currentUserIndex = users.indexOf(currentUser);

  if (!currentUser || users.length === 0 || currentUserIndex === -1) {
    return 'unknown (check config)';
  }

  if (currentUserIndex + 1 === users.length) {
    return users[0];
  }

  return users[currentUserIndex + 1];
};

const get = () => {
  if (has()) {
    return JSON.parse(readFileSync('./.mobit.json'));
  }
  return undefined;
};

const set = (mobConfig) => {
  const currentConfig = get();
  if (JSON.stringify(mobConfig) !== JSON.stringify(currentConfig)) {
    writeFileSync('./.mobit.json', JSON.stringify(mobConfig));
  }
};

const defaultConfig = {
  current: '',
  members: [],
  duration: 10,
  breakAfter: 3,
  breakDuration: 10,
};


export default {
  defaultConfig,
  set,
  get,
  getNextUser,
  has,
  default: defaultConfig,
};
