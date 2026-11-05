import { describe, it, expect } from 'vitest';
import { formPathValue, matchesFormPath } from '../src/components/formPath';
describe('nested form paths', () => {
  it('resolves nested objects and indexed rows without mutating the model', () => {
    const model = Object.freeze({ author: Object.freeze({ name: '墨浪' }), members: [{ name: '一' }, { name: '二' }] });
    expect(formPathValue(model, 'author.name')).toBe('墨浪'); expect(formPathValue(model, 'members[1].name')).toBe('二'); expect(formPathValue(model, 'members.0.name')).toBe('一'); expect(formPathValue(model, 'members.8.name')).toBeUndefined();
  });
  it('preserves literal flat keys while refusing inherited prototype paths', () => {
    expect(formPathValue({ 'author.name': 'flat', author: { name: 'nested' } }, 'author.name')).toBe('flat');
    expect(formPathValue({}, 'constructor.prototype')).toBeUndefined(); expect(formPathValue(Object.create({ inherited: 'private' }), 'inherited')).toBeUndefined();
  });
  it('matches dynamic list rules on exactly one path segment', () => { expect(matchesFormPath('members.*.name', 'members[2].name')).toBe(true); expect(matchesFormPath('members.*.name', 'members.2.other.name')).toBe(false); });
});
