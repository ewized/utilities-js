/** Error for Conditons */
export class ConditionsError extends Error {}

/**
 * Make sure that the value is not nullish
 *
 * @template T
 * @type {(value: T, message: string) => T}
 */
export const notNullish = (value, message) => {
  if (value == null) {
    throw new ConditionsError(message ?? 'The value was nullish');
  }
  return value;
};
