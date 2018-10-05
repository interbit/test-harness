const Immutable = require('seamless-immutable')
const actionCreators = require('../interbitReducer/actions')

const KEY = 'sideEffects'

const redispatches = state => state[KEY] || Immutable.from([])

const redispatch = (state, redispatchActions) => {
  const actions = redispatches(state)
  return state.setIn([KEY], actions.concat(redispatchActions))
}

const shiftRedispatchQueue = state => {
  if (!state || !state[KEY]) {
    return { state }
  }
  const action = redispatches(state)[0]
  const nextState = state.set(KEY, state[KEY].slice(1))
  return { state: nextState, action }
}

const removeRedispatches = state => state.without(KEY)

const pushUpRedispatches = (hyperstate, path, containerId) => {
  let nextSlice = Immutable.from(hyperstate[path][containerId])
  const newRedispatches = redispatches(nextSlice)
  if (!newRedispatches.length) {
    return hyperstate
  }
  nextSlice = removeRedispatches(nextSlice)
  const nextHyperState = redispatch(hyperstate, newRedispatches)
  return nextHyperState.setIn([path, containerId], nextSlice)
}

const remoteRedispatch = (state, chainId, actions) => {
  const remoteRedispatchAction = actionCreators.remoteRedispatch({
    chainId,
    actions
  })
  return redispatch(state, remoteRedispatchAction)
}

const disjoinRedispatches = state => ({
  redispatches: redispatches(state),
  nextState: removeRedispatches(state)
})

module.exports = {
  redispatch,
  redispatches,
  removeRedispatches,
  shiftRedispatchQueue,
  pushUpRedispatches,
  remoteRedispatch,
  disjoinRedispatches
}
