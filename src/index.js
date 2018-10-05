const createHarnessBase = require('./hypervisor')
const interbitReducer = require('./interbitReducer')
const { mixin, actionScript, base } = require('./testMixins')
const ActionTypes = require('./interbitReducer/actionTypes')
const actions = require('./interbitReducer/actions')
const { redispatch } = require('./common/redispatches')

const createHarness = covenant => {
  const liftedReducer = interbitReducer(covenant.reducer)
  const harness = createHarnessBase({
    reducer: liftedReducer,
    rootSaga: covenant.rootSaga
  })
  const mixinHarness = mixin(actionScript, base)(harness)
  mixinHarness.dispatch(actions.init())
  mixinHarness.block()
  return mixinHarness
}

module.exports = {
  createHarness,
  redispatch,
  interbitTypes: ActionTypes,
  interbitActions: actions
}
