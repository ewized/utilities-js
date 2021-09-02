import { wrap } from './commons/wrap';
import { wrapLast } from './commons/wrapLast';


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
