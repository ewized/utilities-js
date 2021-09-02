
/** Creates a function that will wrap functions value */
export const wrap = (func: Function, wrap: Function) => (...args: any[]) => wrap(func?.(...args) ?? func);
