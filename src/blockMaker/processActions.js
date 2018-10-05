const { disjoinRedispatches } = require('../common/redispatches')
const { strobe } = require('../interbitReducer/actions')
const defaultSortActions = require('./sortActions')
const defaultAuthorizeAction = require('./authorizeAction')

const actionsWithStrobes = (actions, timestamp) => [
  strobe(timestamp),
  ...actions
]

const reduceWithRedispatches = (state, action, reducer, authorizeAction) => {
  let computedState = state
  const actionsToRun = [action]
  const actionsRun = []
  let nextAction
  try {
    while (actionsToRun.length) {
      nextAction = actionsToRun.shift()
      authorizeAction(
        computedState.getIn(['interbit', 'config'], {}).acl,
        nextAction
      )
      const { nextState, redispatches } = disjoinRedispatches(
        reducer(computedState, nextAction)
      )
      actionsRun.push(nextAction)
      actionsToRun.push(...redispatches)
      computedState = nextState
    }
    return {
      computedState,
      actionsRun
    }
  } catch (error) {
    let errorMessage = error.message || true
    if (nextAction !== action) {
      errorMessage = `${errorMessage} \nthrown at redispatch action: ${
        nextAction.type
      }`
    }
    return {
      computedState: state,
      actionsRun: [action],
      errorMessage
    }
  }
}

const processActions = ({
  state,
  timestamp,
  actions,
  reducer,
  authorizeAction = defaultAuthorizeAction,
  sortActions = defaultSortActions
}) => {
  let nextState = state
  const processedActions = []
  const errorActions = {}
  actionsWithStrobes(sortActions(actions), timestamp).forEach(action => {
    const { computedState, actionsRun, errorMessage } = reduceWithRedispatches(
      nextState,
      action,
      reducer,
      authorizeAction
    )
    if (errorMessage) {
      errorActions[processedActions.length] = errorMessage
    }
    nextState = computedState
    processedActions.push(...actionsRun)
  })
  return {
    state: nextState,
    actions: processedActions,
    errors: errorActions
  }
}

module.exports = processActions
