import { createRef, useEffect } from 'react';
import { create } from 'react-test-renderer';
import { wrapLastProxy } from '@ewized/utilities-core';

import {
  actionBuilder,
  createSplice,
  createWormhole,
  makeAction,
  reducerBuilder,
} from './wormhole';


it('builds reducer', () => {
  let state = { counter: 0 };
  const reducer = reducerBuilder()
    .add('increment', (state) => ({ ...state, counter: state.counter + 1 }))
    .add('decrement', (state) => ({ ...state, counter: state.counter - 1 }))
    .build();

  // initial state checking
  expect(state.counter).toBe(0);

  // increment
  state = reducer(state, { type: 'increment' });
  expect(state.counter).toBe(1);
  // increment
  state = reducer(state, { type: 'increment' });
  expect(state.counter).toBe(2);
  // decrement
  state = reducer(state, { type: 'decrement' });
  state = reducer(state, { type: 'decrement' });
  expect(state.counter).toBe(0);

  // invalid state
  state = reducer(state, { type: 'foo' });
  state = reducer(state, { type: 'bar' });
  expect(state.counter).toBe(0);
});

it('builds namedspaced reducer', () => {
  let state = { counter: 0 };
  const reducer = reducerBuilder('counter')
    .add('increment', (state) => ({ ...state, counter: state.counter + 1 }))
    .add('decrement', (state) => ({ ...state, counter: state.counter - 1 }))
    .build();

  // initial state checking
  expect(state.counter).toBe(0);

  // increment
  state = reducer(state, { type: 'counter/increment' });
  expect(state.counter).toBe(1);
  // decrement
  state = reducer(state, { type: 'counter/decrement' });
  expect(state.counter).toBe(0);
});

it('builds actions', () => {
  const actions = actionBuilder()
    .add('echo')
    .add('onEcho')
    .add('delta')
    .build();

  const action = (type, ...args) => makeAction(type)(...args);
  const onAction = (type, event, ...args) => makeAction(type)(...args)(event);

  expect(actions.bob).toBeUndefined();
  expect(actions.echo).toBeDefined();
  expect(actions.echo(0, 1, 2)).toStrictEqual(action('echo', 0, 1, 2));
  expect(actions.delta('foobar')).not.toStrictEqual(action('echo', 'foobar'));
  expect(actions.delta('foo', 'bar')).toStrictEqual(action('delta', 'foo', 'bar'));
  expect(actions.onEcho('foo', 'bar')).toBeInstanceOf(Function);
  expect(actions.onEcho('foo', 'bar')()).toBeInstanceOf(Array);
  expect(actions.onEcho('foo', 'bar')()).toStrictEqual(onAction('onEcho', undefined, 'foo', 'bar'));
  expect(actions.onEcho('foo', 'bar')('foobar')).toStrictEqual(onAction('onEcho', 'foobar', 'foo', 'bar'));
});

it('spreads actions', () => {
  const actions = actionBuilder()
    .add('echo')
    .add('delta')
    .add('onEcho')
    .build();

  // destructure the object by hand
  const { bob, echo } = actions; //?
  expect(bob).toBeUndefined();
  expect(echo).toBeDefined();

  // esctructure the object with the spread opperator
  const spreadCopy = { ...actions }; //?
  expect(spreadCopy.bob).toBeUndefined();
  expect(spreadCopy.echo).toBeDefined();
});


it('splices', () => {
  let state = { counter: 0 };

  const { reducer, actions } = createSplice({
    reducers: {
      increment(state, [amount = 1]) {
        return { ...state, counter: state.counter + amount };
      },

      decrement(state, [amount = 1]) {
        return { ...state, counter: state.counter - amount };
      },

      onMultiplier(state, [, amount = 1, modifier = 1]) {
        return { ...state, counter: state.counter * amount * modifier };
      },
    },
  });

  // create a dispatcher that changes the state
  const dispatcher = wrapLastProxy(actions, (action) => state = reducer(state, action));

  // increment
  dispatcher.increment(2);
  expect(state.counter).toEqual(2);
  // decrement
  dispatcher.decrement();
  expect(state.counter).toEqual(1);
  // onMultiplier
  const dispatch = dispatcher.onMultiplier(2, -1);
  dispatch();
  expect(state.counter).toEqual(-2);
  dispatch();
  dispatch();
  dispatch();
  expect(state.counter).toEqual(16);
});

it('wormholes', () => {
  /* export */ const UNIT_MAP = { ns: 1, ms: 100, s: 1000 };

  // Create the splice used for the wormhole, export it for use in unit testing
  /* export */ const splice = createSplice({
    name: 'myWormhole',
    initialState: {
      vortex: 'PENDING',
    },
    reducers: {
      generate(state) {
        return { ...state, vortex: 'GENERATING' };
      },
      elapse(state, [time, unit]) {
        return { ...state, time: state.time + time * UNIT_MAP[unit] ?? 0 };
      },
      onGenerate(state) {
        return { ...state, vortex: 'GENERATING' };
      },
      destory(state) {
        return { ...state, vortex: 'COLAPSE' };
      },
    },
  });

  // create the wormhole, this is usualy exported
  /* export */ const [useWormhole, Wormhole] = createWormhole(splice);

  const Vortex = () => {
    const { vortex, elapse, generate, destory, onGenerate } = useWormhole();
    useEffect(() => {
      generate();
      elapse(1, 'ns');
      elapse(2, 'ms');
      elapse(20, 's');
      return () => destory();
    }, []);
    return <button data-testid="vortex" onClick={onGenerate()}>{vortex}</button>;
  };

  const ref = createRef();
  expect(() => create(<Wormhole ref={ref}><Vortex /></Wormhole>)).not.toThrow();
  ref.current; //?
});

it('spreads', () => {
  const args = ['x', 'y', 'z'];
  const type = 'tester';

  const action = Object.assign([], args, { type }); //?

  const { 0: x, 1: y, 2: z, type: destructType } = action;
  const { ...rest } = action;
  rest; //?
  expect(destructType).toEqual(type);
  expect([x, y, z]).toEqual(args);
  expect(rest).toEqual({ 0: x, 1: y, 2: z, type });
});
