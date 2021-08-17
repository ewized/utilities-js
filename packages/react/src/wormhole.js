import {
  createContext,
  forwardRef,
  useContext,
  useImperativeHandle,
  useMemo,
  useReducer,
} from 'react';
import { notNullish, wrapLastProxy } from '@ewized/utilities-core';


// Prepend the namespace if it exists
const getType = (namespace, type) => namespace ? `${namespace}/${type.toString()}` : type;

export const INIT_ACTION = { type: '@@INIT' };

/* Creates a builder that builds a case like reducer */
export const reducerBuilder = (namespace, initialState) => ({
  reducers: new Map(),

  add(type, reducer) {
    notNullish(type, 'type is required');
    notNullish(reducer, 'reducer is required');
    this.reducers.set(getType(namespace, type), reducer);
    return this;
  },

  addDefault(reducer) {
    if (reducer) {
      this.reducers.set('default', reducer);
    } else {
      this.reducers.delete('default');
    }
    return this;
  },

  /* Builds the reducer with an optional initialState */
  build() {
    return (state = initialState, action = INIT_ACTION) => {
      // get the value once and check its truthy value
      // its faster than using has/get combo
      const reducer = this.reducers.get(action?.type) ?? this.reducers.get('default');
      // pass the state to the default reducer or just return the state
      return reducer?.(state, action) ?? state;
    };
  },
});

/* Create the action depending on if its an event handler */
export const makeAction = (name, namespace) => {
  const type = getType(namespace, name);
  // check if its an event handle action, append the event to the payload(args)
  if (name.match(/^on[A-Z][a-z]?/)) {
    return (...payload) => (event) => Object.assign([event, ...payload], { type, payload });
  }
  // normal action dispatch copied payload(args)
  return (...payload) => Object.assign([], payload, { type, payload });
};

/* Creates a builder that builds the actions from the types */
export const actionBuilder = (namespace) => ({
  actions: new Map(),

  add(type) {
    notNullish(type, 'type is required');
    this.actions.set(type, makeAction(type, namespace));
    return this;
  },

  build() {
    return Object.fromEntries(this.actions.entries());
  },
});

/*
 * Creates a Splice which is our version of a Slice
 * It constructs the actions object that uses the actionsBuilder()
 * When the reducers map contains a `default` key that would be used as
 * the catch all reducer.
 * All reducers are able to be nested with additional reducerBuilders.
 * Note: They use the builder that returns the function not the object format.
 * If you perfer to use the builder pattern have an object with a default key.
 *
 * reducers: {
 *   default: reducerBuilder()
 *    .add('nested action', () => { ... })
 *    .add('another action', () => { ... })
 *    .build(),
 * }
 */
export const createSplice = ({ initialState, name, reducers }) => {
  notNullish(reducers, 'reducers is required');
  // construct the reducer and actions from the object
  // due to how small the rentires are its slightly more effencient to reduce twice
  // than to create intermiderly objects/arrays to do in one loop
  const entries = Object.entries(reducers);
  const reducer = entries.reduce((builder, [type, reducer]) => (
    builder.add(type, reducer)
  ), reducerBuilder(name, initialState));
  const actions = entries.reduce((builder, [type]) => (
    builder.add(type)
  ), actionBuilder(name));
  return {
    name,
    initialState, // pass along the initial state for the wormhole
    actions: actions.build(),
    reducer: reducer.build(),
  };
};

/*
 * Create a wormhole state mangment pattern using React Context and Reducer.
 * The interface mimics the return of Slice to allow Wormholes to be created with slices.
 */
export const createWormhole = ({ displayName, name, initialState, actions, reducer }) => {
  notNullish(actions, 'actions is required');
  notNullish(reducer, 'reducer is required');
  // spread the state over to make sure the context is created with an object
  const Context = createContext({ ...initialState });
  // pass an init action in cases where type is expected on the action
  const initializer = initialState ? undefined : (state) => reducer(state, INIT_ACTION);
  const Provider = forwardRef(({ children }, ref) => {
    // the reducer and state for the react component
    // if initialState is defined respect react conventions, the initializer will be undefined
    // if initialState is undefined use the reducer to init the state
    const [state, dispatch] = useReducer(reducer, initialState, initializer);
    // create the controller of this wormhole
    const controller = useMemo(() => ({ ...state, ...wrapLastProxy(actions, dispatch) }), [state, actions]);
    // expose the controller to the ref
    useImperativeHandle(ref, () => controller, [controller]);
    return <Context.Provider value={controller} children={children} />;
  });
  Context.displayName = name ?? displayName;
  const hook = () => useContext(Context);
  const hoc = (Component) => forwardRef((props, ref) => (
    <Provider ref={ref}><Component {...props} /></Provider>
  ));
  // return an array of the hook, provider
  // but also assign the context and hoc if we would need it later
  return Object.assign([hook, Provider, hoc], { hook, hoc, Provider, Context });
};
