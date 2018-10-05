const createActionPool = require('./actionPool')
const createSagaRunner = require('./sagaRunner')
const createSubscribers = require('./common/subscribers')
const processActions = require('./blockMaker/processActions')

const createHarness = ({ reducer, rootSaga }) => {
  let isRunning = false
  const subscribers = createSubscribers()
  const subscribe = subscribers.add

  const blocks = []
  const getBlocks = () => blocks

  let state = reducer(undefined, { type: 'INIT' })
  const getState = () => state
  const setState = nextState => {
    state = nextState
  }

  const actionPool = createActionPool()
  const dispatch = actionPool.add
  const inspectPool = actionPool.inspect
  const waitForPool = actionPool.waitFor
  const transformPool = actionPool.transform

  const sagaRunner = createSagaRunner(rootSaga, dispatch)

  const block = () => {
    const timestamp = Date.now()
    const blockContent = processActions({
      state: getState(),
      timestamp,
      actions: actionPool.drain(),
      reducer,
      authorizeAction: () => {},
      sortActions: actions => actions
    })
    const block = { content: blockContent }
    blocks.push(block)
    sagaRunner.run(block.content)
    setState(block.content.state)
    subscribers.notify()
    if (isRunning) {
      // TODO: Is this actually being used?
      setTimeout(block, 0)
    }
  }

  return {
    dispatch,
    subscribe,
    getState,
    setState,
    block,
    getBlocks,
    inspectPool,
    waitForPool,
    transformPool
  }
}

module.exports = createHarness
