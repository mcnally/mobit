import mobConfig from './mobConfig';

describe('getNextUser', () => {
  it('Should return the next user in the array', () => {
    expect(mobConfig.getNextUser(['one', 'two', 'three'], 'one')).toBe('two');
    expect(mobConfig.getNextUser(['one', 'two', 'three'], 'two')).toBe('three');
  });
  it('Should return the first user in the array when current is at the end', () => {
    expect(mobConfig.getNextUser(['one', 'two', 'three'], 'three')).toBe('one');
  });
  it('Should return "unknown (check config)" if the current user doesnt exist in the list', () => {
    expect(mobConfig.getNextUser(['one', 'two', 'three'], 'four')).toBe('unknown (check config)');
  });
  it('Should return "unknown (check config)" if there are no users', () => {
    expect(mobConfig.getNextUser(undefined, 'ones')).toBe('unknown (check config)');
  });
});
