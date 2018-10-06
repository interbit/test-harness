# Covenant

An Interbit covenant describes the code and configuration that manages
the evolution of a state (a key->value dictionary of arbitrary
composition). When updates are to be made to the state, the covenant
defines how those changes are to be made.

> Note: The repo contains a working version of the code samples provided
> below.


## Composition

A covenant is a Javascript comprised of the following elements:

```js
{
  actions: {},
  reducer: (state, action) => nextState,
  rootSaga: function*() {},
  selectors: {}
}
```

Together, these form an interface to an object that has state managed by
a `reducer`, and impure behavior contained within the `rootSaga`
generator function.


### `actions`

A collection of action creator functions. Each action creator function
has the signature:

```js
(...args) => ({ type: ACTION_TYPE, payload: { /* data */ }, error: {/* errorMessage */} })
```

`ACTION_TYPE` is a string in uppercase starting with covenant's name
followed by a `/` character. For example, if the covenant name is
`DICTIONARY`, all of its action types start with `DICTIONARY/`.

The `ACTION_TYPE`s for saga actions, actions that the reducer sends to
its own saga, use the `SAGA_` prefix after the covenant name. For
example `DICTIONARY/SAGA_CHECK_IN_ALPHABET`.

Actions initiated by other parts of the system **always** arrive at the
covenant's reducer. These actions are called _requests_. A request
triggers a series of operations and state changes within the covenant. A
covenant eventually has to provide a response to the originator of the
request.

A response action has the same `ACTION_TYPE` as the original request
with an interjected `/RESPONSE` substring between the covenant's name
and the type of the action. For example, if the incoming request type is
`DICTIONARY/CHECK_IN_ALPHABET`, the eventual response type would be
`DICTIONARY/RESPONSE/CHECK_IN_ALPHABET`

Example definition of actions:

```js
const actions = {
  checkInAlphabet: value => ({
    type: types.CHECK_IN_ALPHABET,
    payload: { value }
  }),
  checkInAlphabetResponse: isInAlphabet => ({
    type: types.CHECK_IN_ALPHABET_RESPONSE,
    payload: { isInAlphabet }
  }),
  sagaCheckInAlphabet: value => ({
    type: types.SAGA_CHECK_IN_ALPHABET,
    payload: { value }
  }),
  sagaCheckInAlphabetResponse: isInAlphabet => ({
    type: types.SAGA_CHECK_IN_ALPHABET_RESPONSE,
    payload: { isInAlphabet }
  }),
  updateBlacklist: newBlacklist => ({
    type: types.UPDATE_BLACKLIST,
    payload: { newBlacklist }
  })
}
```

Since the `reducer` responds to these actions, it is best practice to
declare the action types separately:

```js
const types = {
  CHECK_IN_ALPHABET: 'DICTIONARY/CHECK_IN_ALPHABET',
  CHECK_IN_ALPHABET_RESPONSE: 'DICTIONARY/RESPONSE/CHECK_IN_ALPHABET',
  UPDATE_BLACKLIST: 'DICTIONARY/UPDATE_BLACKLIST',
  SAGA_CHECK_IN_ALPHABET: 'DICTIONARY/SAGA_CHECK_IN_ALPHABET',
  SAGA_CHECK_IN_ALPHABET_RESPONSE: 'DICTIONARY/RESPONSE/SAGA_CHECK_IN_ALPHABET'
}
```


### `reducer`

A pure function that responds to the `actions`.

```js
const reducer = (state = initialState, action) => {
  switch (action.type) {
    case types.CHECK_IN_ALPHABET: {
      const { value } = action.payload
      if (state.blacklist.includes(value)) {
        return state
      }
      return redispatch(state, [actions.sagaCheckInAlphabet(value)])
    }
    case types.CHECK_IN_ALPHABET_SAGA_RESPONSE: {
      const { isInAlphabet } = action.payload
      return redispatch(state, [actions.checkInAlphabetResponse(isInAlphabet)])
    }
    case types.UPDATE_BLACKLIST: {
      const { newBlacklist } = action.payload
      return state.set('blacklist', newBlacklist)
    }
    case interbitTypes.HYPERVISOR_BOOT: {
      return state.set('bootHypervisorReceived', true)
    }
    case interbitTypes.HYPERVISOR_SHUTDOWN: {
      return state.set('shutdownHypervisorReceived', true)
    }
    default:
      return state
  }
}
```


### `rootSaga`

Any impure or asynchronous functionality of a covenant must be
implemented using the following three structural elements:

1.  `rootSaga`:

    - A `redux-saga`-compatible generator function exported from the
      covenant object.

    - Mostly acts as a proxy for communications between `reducer`,
      `singleton context`, and `async object`s.

    - Responsible for creating the `singleton context` object during
      initialization.

2.  `singleton context`:

   - Responsible for managing a resources shared with different `async
     object` workers.

   - It is often used to cache information or provision handles to some
     hardware resources.

3.  `async object`:

   - An object with knowledge of how to interact with hardware to
     accomplish an asynchronous or impure operation.

   - At each moment in time, there might be many instances of a worker,
     each accomplishing some task on behalf of the saga.

> **Important**: A saga should only implement private behavior for its
> covenant. Therefore, sagas should only listen to actions redispatched
> by the reducer. In effect, only the reducer can "talk" to the saga.

```js
function* rootSaga({ createContext, worker } = sagaDefault) {
  const context = createContext()
  yield all([
    takeEvery(types.SAGA_CHECK_IN_ALPHABET, function*(action) {
      const { value } = action.payload
      const isInAlphabet = yield worker.checkInAlphabet(value, context)
      yield put(actions.sagaCheckInAlphabetResponse(isInAlphabet))
    })
  ])
}
```


### `selectors`

A collection of functions that extracts derived values out of the
state. These functions permit you to implement the state in any way
that you choose.

The test harness currently doesn't implement any example selectors.
You need to implement your own, as their implementation is based on the
shape of your state data structure.


## Communication

The test harness routes actions (based on their `action type`s) to
instances of relevant covenants.

Sending `request` and `response` actions is the main means of
communication between the elements in the test harness.

The `redispatch` function exported by the harness can be used to send
`request` and `response` actions. This function takes a `state` and a
list of actions, and returns a new state with the actions in a special
reserved key.

Example:

```js
const { redispatch } = require('./test/harness')

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case types.CHECK_IN_ALPHABET: {
      const { value } = action.payload
      const actionForSaga = actions.sagaCheckInAlphabet(value)
      const newState = redispatch(state, [actionForSaga]) // Redispatch returns a new state
      return newState
    }
    default:
      return state
  }
}
```

**IMPORTANT**: Careless use of `redispatch` function can cause stack overflow errors.

The most common uses of `redispatch` function are:

- to send an action to another covenant that runs alongside this one,

- to send an action from a covenant reducer to its saga (this means that
  the reducers can be used as an interface to the impure behavior
  contained in the saga),

- to decouple a long action in a single reducer into several steps that
  are guaranteed to be run synchronously in one block generation.
