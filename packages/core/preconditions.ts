/** Error for Conditons */
export class ConditionsError extends Error {}

/**
 * Make sure that the value is not nullish
 */
export const notNullish = <T>(value: T, message?: string): T => {
  if (value == null) {
    throw new ConditionsError(message ?? 'The value was nullish');
  }
  return value;
};
