export const sleep = (timeout) => new Promise((resolve) => {
  globalThis.setTimeout(resolve, timeout);
});

/** Creates a function that will wrap the last nested functions value */
export const wrapLast = (func, wrap) => (...args) => {
  const value = func?.(...args) ?? func; // call the func or get its value
  return value instanceof Function ? wrapLast(value, wrap) : wrap(value);
};

/** Creates a function that will wrap functions value */
export const wrap = (func, wrap) => (...args) => wrap(func?.(...args) ?? func);

/** Creates a proxy object that wraps the values of the function */
const createWrapProxy = (wrap) => (target, func) => new Proxy(target, {
  get(target, key) {
    return wrap(target[key], func);
  },
});

/** Creates a proxy object that wraps the values of the function */
export const wrapProxy = createWrapProxy(wrap);

/** Creates a proxy object that wraps last the values of the function */
export const wrapLastProxy = createWrapProxy(wrapLast);
