import Conf from 'conf';
import * as utils from './utils';
import mobConfig from './mobConfig';
import * as git from './git';

jest.mock('conf');
jest.mock('./mobConfig.js');
jest.mock('./git.js');


describe('commandPreRequisites', () => {
  beforeEach(() => {
    process.exit = jest.fn();
    console.log = jest.fn();
  });

  afterAll(() => {
    process.exit.mockReset();
    console.log.mockReset();
  });

  it('Should not call process exit and not log if everything is fine', async () => {
    git.checkIsRepo.mockReturnValue(true);
    Conf.prototype.get = jest.fn(() => 'test-branch');
    git.currentBranch.mockReturnValue('test-branch');
    git.getUserName.mockReturnValue('one');
    mobConfig.has.mockReturnValue(true);
    mobConfig.get.mockReturnValue({ members: ['one'] });

    await utils.commandPreRequisites();
    expect(console.log).not.toBeCalled();
    expect(process.exit).not.toBeCalled();
  });

  it('Should call process exit and log one error if no git is found', async () => {
    git.checkIsRepo.mockReturnValue(false);
    await utils.commandPreRequisites();
    const errors = console.log.mock.calls;
    expect(errors.length).toBe(2);
    expect(errors[1][0]).toContain('Directory does not have git');
    expect(process.exit).toBeCalledTimes(1);
  });

  it('Should call process exit and log one error if no mob branch is set', async () => {
    git.checkIsRepo.mockReturnValue(true);
    Conf.prototype.get = jest.fn(() => {});
    await utils.commandPreRequisites();
    const errors = console.log.mock.calls;
    expect(errors.length).toBe(2);
    expect(errors[1][0]).toContain('No mobbing branch set');
    expect(process.exit).toBeCalledTimes(1);
  });

  it('Should call process exit and log one error if mob branch is set but is not the branch checked out', async () => {
    git.checkIsRepo.mockReturnValue(true);
    Conf.prototype.get = jest.fn(() => 'test-branch');
    git.currentBranch.mockReturnValue('another-branch');
    await utils.commandPreRequisites();
    const errors = console.log.mock.calls;
    expect(errors.length).toBe(2);
    expect(errors[1][0]).toContain('You are not on the mobbing branch');
    expect(process.exit).toBeCalledTimes(1);
  });

  it('Should call process exit and log one error if config isnt present in branch', async () => {
    git.checkIsRepo.mockReturnValue(true);
    Conf.prototype.get = jest.fn(() => 'test-branch');
    git.currentBranch.mockReturnValue('test-branch');
    mobConfig.has.mockReturnValue(false);
    await utils.commandPreRequisites();
    const errors = console.log.mock.calls;
    expect(errors.length).toBe(2);
    expect(errors[1][0]).toContain('No mob config present in branch');
    expect(process.exit).toBeCalledTimes(1);
  });

  it('Should call process exit and log one error if current user is not in the branch', async () => {
    git.checkIsRepo.mockReturnValue(true);
    Conf.prototype.get = jest.fn(() => 'test-branch');
    git.currentBranch.mockReturnValue('test-branch');
    git.getUserName.mockReturnValue('one');
    mobConfig.has.mockReturnValue(true);
    mobConfig.get.mockReturnValue({ members: ['two'] });
    await utils.commandPreRequisites();
    const errors = console.log.mock.calls;
    expect(errors.length).toBe(2);
    expect(errors[1][0]).toContain('You are not in this mob');
    expect(process.exit).toBeCalledTimes(1);
  });
});
