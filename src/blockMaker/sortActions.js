const Immutable = require('seamless-immutable')
const {
  UPDATE_CONFIG,
  MIGRATE,
  INIT,
  SET_CHAIN_ID,
  READ_JOIN_RESP,
  FINISHED_READ_JOIN_ACTIONS,
  STROBE
} = require('../interbitReducer/actionTypes')

const priorityLevels = [
  STROBE,
  SET_CHAIN_ID,
  INIT,
  MIGRATE,
  UPDATE_CONFIG,
  READ_JOIN_RESP,
  FINISHED_READ_JOIN_ACTIONS
]

const sortActions = (actions, order = priorityLevels) => {
  const sorted = [...actions.filter(action => order.indexOf(action.type) > -1)]
    .sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))
    .concat(actions.filter(action => order.indexOf(action.type) === -1))
  return Immutable.from(sorted)
}

module.exports = sortActions
