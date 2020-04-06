import mobConfig from '../mobConfig';
import * as git from '../git';
import next from './next';

jest.mock('../utils.js', () => ({ ...jest.requireActual('../utils.js'), commandPreRequisites: jest.fn() }));
jest.mock('../mobConfig.js');
jest.mock('../git.js');
describe('next command', () => {
  it('Should set the next user correctly correctly', async () => {
    const before = {
      current: 'two',
      members: ['one, two'],
      duration: 10,
      breakAfter: 3,
      breakDuration: 10,
    };
    const expected = { ...before, current: 'one' };
    mobConfig.get.mockReturnValue(before);
    mobConfig.getNextUser.mockReturnValue('one');
    await next();
    expect(mobConfig.set).toHaveBeenCalledWith(expected);
    expect(git.commitAndPush).toHaveBeenCalledWith('Updated mob config', ['./.mobit.json']);
  });
});
