const { runSaga } = require('redux-saga')
const createSubscribers = require('./common/subscribers')
const Immutable = require('seamless-immutable')

const createSagaRunner = (saga, dispatch, ...sagaArgs) => {
  const subscribers = createSubscribers()

  let sagaState
  const getState = () => sagaState

  const sagaInterface = {
    dispatch: action => setTimeout(() => dispatch(action), 0),
    getState,
    subscribe: subscribers.add
  }
  runSaga(sagaInterface, saga, ...sagaArgs)

  const run = ({ state, actions }) => {
    sagaState = state
    actions
      .map(action => Immutable.asMutable(action))
      .forEach(subscribers.notify)
  }

  return { run }
}

module.exports = createSagaRunner
