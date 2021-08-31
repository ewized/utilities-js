import { notNullish, ConditionsError } from './preconditions';


describe('notNullish', () => {
  it('should throw nullish values', () => {
    expect(() => notNullish(null)).toThrow(ConditionsError);
    expect(() => notNullish(undefined)).toThrow(ConditionsError);
    expect(() => notNullish(void 0)).toThrow(ConditionsError);
  });

  it('should return values', () => {
    expect(notNullish('string')).toBe('string');
    const obj = { foo: 'bar' };
    expect(notNullish(obj)).toBe(obj);
    const arr = [0, 1, 2];
    expect(notNullish(arr)).toBe(arr);
    expect(notNullish(0)).toBe(0);
    expect(notNullish(1)).toBe(1);
    expect(notNullish(true)).toBe(true);
    expect(notNullish(false)).toBe(false);
  });
});
