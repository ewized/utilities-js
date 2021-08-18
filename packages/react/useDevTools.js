import {
  useEffect,
  useRef,
  useState as useReactState,
  useReducer as useReactReducer,
  // this is a debug tool so this is ok... plz dont fire me
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as ReactInternals,
} from 'react';

import { reducerBuilder } from './wormhole.js';


// counters for instances
const devToolInstances = {};

const getComponentName = () => {
  const owner = ReactInternals.ReactCurrentOwner.current;
  return owner?.type?.name || owner?.type?.displayName;
};

const getNamedFunction = (stateOrReducer) => {
  if (stateOrReducer === useReactState) {
    return 'useState';
  }
  if (stateOrReducer === useReactReducer) {
    return 'useReducer';
  }
  return null;
};

const getDevToolName = (stateOrReducer) => {
  const name = getComponentName() ?? getNamedFunction(stateOrReducer) ?? 'Instance';
  const instanceId = devToolInstances[name] = (devToolInstances[name] ?? 0 ) + 1;
  return `${name}#${instanceId}`;
};

const callOrReturn = (functionOrValue, ...args) => {
  if (typeof functionOrValue === 'function') {
    return functionOrValue(...args);
  }
  return functionOrValue;
};

// inject redux tools actions into the state
const injectActions = (initStateOrReducer, reducerInitState) => reducerBuilder()
  .add('DISPATCH', (state, action) => reducerBuilder()
    .add('IMPORT_STATE', (state, { nextLiftedState }) => {
      return state;
    })
    .add('PAUSE_RECORDING', (state, { status }) => {
      return { ...state, isPaused: status };
    })
    .add('LOCK_CHANGES', (state, { status }) => {
      // some reason the ui wont allow me to unlock via status
      return { ...state, isLocked: !state.isLocked };
    })
    .add('JUMP_TO_ACTION', (state, { actionId }) => ({
      ...state,
      currentStateIndex: actionId,
      computedStates: [...state.computedStates, getCurrentState(state)],
    }))
    .add('JUMP_TO_STATE', (state, { index }) => ({
      ...state,
      currentStateIndex: index,
      computedStates: [...state.computedStates, getCurrentState(state)],
    }))
    .add('COMMIT', (state, action) => {
      console.log(action);
      return state;
    })
    // remap the payload type
    .build()(state, action.payload))
  // decode the action payload and send it through the reducer
  .add('ACTION', (state, { payload }) => {
    return state; // JSON.parse(payload);
  })
  .add('START', (state, { payload }) => {
    return state; // JSON.parse(payload);
  })
  .add('STOP', (state, { payload }) => {
    return state; // JSON.parse(payload);
  })
  .addDefault((state, action) => {
    // if (state.isLocked) return { ...state };
    const lastState = getCurrentState(state);
    const computedState = callOrReturn(initStateOrReducer, lastState, action ?? { type: '@@INIT' });
    return {
      ...state,
      computedStates: [...state.computedStates, computedState],
      currentStateIndex: state.currentStateIndex + 1,
      lastAction: action,
    };
  })
  .build();

const DEV_TOOL_OPTIONS = {
  serialize: { // handle this ourself to removed deply nested vars
    replacer: (key, value) => {
      if (value instanceof Event) {
        return '[Event]';
      }
      if (value == globalThis) {
        return '[globalThis]';
      }
      if (`${key}`.startsWith('__reactFiber$')) {
        return `[ReactFiber: ${value.type}]`;
      }
      return value;
    },
  },
  // select features to enable that are currently suported
  features: [
    'pause',
    'lock',
    'persist',
    'jump',
    'skip',
    'reorder',
    'import',
    'export',
  ].reduce((acc, value) => ({ ...acc, [value]: true }), {}),
};


const liftedReducer = (reducer = (x) => x) => (state) => ({
  computedStates: [reducer(state)],
  currentStateIndex: 0,
});

const getCurrentState = (liftedState) => (
  liftedState.computedStates[liftedState.currentStateIndex]
);

/**
 * This hook will wrap around a react useState and useReducer that will proxy dispatches and state to redux devtools.
 * Internally it uses a reducer for both useState and useReducer, this reducer is managed by itself.
 * It wraps the exposed state and adds internal logic for the dev tools
 */
const useReduxDevTools = (stateOrReducer, initStateOrReducer, reducerInitState, reducerInit) => {
  const { current: handle } = useRef({ frame: 0 });
  // create the state or dispatcher (useState is just an idenity reducer)
  const injectedReducer = injectActions(initStateOrReducer, reducerInitState);
  // const [liftedState, liftedDispatch] = stateOrReducer === useReactState ? (
  //   // todo cover the case where setState is lazy
  //   useReactReducer(injectedReducer, { state: initStateOrReducer }, injectedReducer)
  // ) : (
  //   useReactReducer(injectedReducer, { state: reducerInitState, frames: [] }, injectedReducer)
  // );
  const [liftedState, liftedDispatch] = useReactReducer(injectedReducer, reducerInitState, liftedReducer(reducerInit));
  const unliftedState = getCurrentState(liftedState);
  // create the instance that connects to the devtools
  // useState when passed a function only runs on first mount this is perfect to hijack the
  // dispatch events and state as this get called after the managed dispatch is called first
  const [devTools] = useReactState(() => {
    const devTools = globalThis.__REDUX_DEVTOOLS_EXTENSION__.connect({
      ...DEV_TOOL_OPTIONS,
      name: getDevToolName(stateOrReducer),
    });
    devTools.subscribe((payload) => {
      console.log('devTools.subscribe', payload);
      if (payload.state) {
        devTools.send(null, JSON.parse(payload.state));
      }

      liftedDispatch(payload);
    }); // dispatch all subscribed actions
    return devTools;
  });
  // track liftedState
  // useEffect(() => {
  //   console.log('liftedState', liftedState);
  //   devTools.send(null, JSON.parse(JSON.stringify(liftedState, DEV_TOOL_OPTIONS.serialize.replacer)));
  // }, [liftedState]);
  // track initial state and state updates
  // spread the action since devtools serlizes everything but actions can be an array with a type property
  useEffect(() => {
    if (!handle.frame) { // send the initial state
      devTools.init(reducerInitState ?? initStateOrReducer);
    } else { // send the dispatched events to the dev tools
      devTools.send({ ...liftedState.lastAction, $handle: handle }, unliftedState);
    }
    handle.frame++; // increment the frame counter
  }, [liftedState]);
  // register teardown of devtools
  useEffect(() => () => devTools.unsubscribe(), []);
  return [unliftedState, liftedDispatch];
};

// disable in production or when redux devtools does not exist
const enableDevtools = process.env.NODE_ENV !== 'production' && globalThis.__REDUX_DEVTOOLS_EXTENSION__;

// production just alias to reacts useReducer in other enviroments wrap with devtools
export const useReducer = !enableDevtools ? useReactReducer : (...args) => useReduxDevTools(useReactReducer, ...args);

// production just alias to reacts useState in other enviroments wrap with devtools
export const useState = !enableDevtools ? useReactState : (...args) => useReduxDevTools(useReactState, ...args);

// create a devtools wrapper for the args in cases where one is not using react's useState nor useReducer
export const useDevTools = enableDevtools ? useReduxDevTools : (func, ...args) => func(...args);


// const [i, rerender] = useReactReducer((i = 0) => i++);
// const { current: store } =
//  useRef(instrument(monitorReducer(initStateOrReducer),
//     devToolOptions)(createStore)(initStateOrReducer, reducerInitState));
// console.log(createDevTools(Monitor));
// const [liftedState, liftedDispatch] = useReactReducer(liftReducerWith(initStateOrReducer,
//    reducerInit?.(reducerInitState, { type: '#ASD' }),
//    monitorReducer(initStateOrReducer, reducerInitState), devToolOptions));
// const [__state, __dispatch] = useReactReducer(initStateOrReducer, reducerInitState, reducerInit);
