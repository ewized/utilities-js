/** Creates a function that will wrap the last nested functions value */
export const wrapLast = (func: Function, wrap: Function) => (...args: any[]) => {
  const value = func?.(...args) ?? func; // call the func or get its value
  return value instanceof Function ? wrapLast(value, wrap) : wrap(value);
};
