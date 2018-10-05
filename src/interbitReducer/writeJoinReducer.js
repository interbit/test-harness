const Immutable = require('seamless-immutable')
const { PATHS, PENDING_ACTIONS, ACTION_STATUS } = require('./constants')
const { isAuthorizedToWrite } = require('./joinAuthorization')

const pendingActionsForChain = (chainId, state) => {
  return state.getIn(receivedPendingActionsPath(chainId), Immutable.from({}))
}

const sentPendingActionsPath = chainId =>
  PATHS.SENT_ACTIONS.concat([chainId, PENDING_ACTIONS])
const sentActionsStatusPath = chainId =>
  PATHS.SENT_ACTIONS.concat([chainId, ACTION_STATUS])
const receivedPendingActionsPath = chainId =>
  PATHS.RECEIVED_ACTIONS.concat([chainId, PENDING_ACTIONS])
const receivedActionsStatusPath = chainId =>
  PATHS.RECEIVED_ACTIONS.concat([chainId, ACTION_STATUS])

const writeJoinReducer = reducer => (state, action) => {
  const senderChainIds = Object.keys(state.getIn(PATHS.RECEIVED_ACTIONS, {}))
  let nextReceivedActions = state.getIn(
    PATHS.RECEIVED_ACTIONS,
    Immutable.from({})
  )
  let indexInQueue = 0
  let exhausted = false
  let nextState = state
  while (!exhausted) {
    exhausted = true
    for (let i = 0; i < senderChainIds.length; i++) {
      const senderChainId = senderChainIds[i]
      const pendingActions = pendingActionsForChain(senderChainId, nextState)
      const writeJoinTaskId = Object.keys(pendingActions)[indexInQueue]
      if (writeJoinTaskId) {
        const nextAction = pendingActions[writeJoinTaskId]
        const alreadyReduced = nextReceivedActions.getIn([
          senderChainId,
          ACTION_STATUS,
          writeJoinTaskId
        ])
        exhausted = false
        if (!alreadyReduced) {
          // Check Permission
          const status = { completed: true }
          if (
            isAuthorizedToWrite(
              nextState.getIn(['interbit', 'config']),
              senderChainId,
              nextAction
            )
          ) {
            try {
              nextState = reducer(nextState, nextAction)
            } catch (error) {
              status.error = error.message || true
            }
          } else {
            status.error = `action with type ${nextAction.type} is not allowed.`
          }
          nextReceivedActions = nextReceivedActions.setIn(
            [senderChainId, ACTION_STATUS, writeJoinTaskId],
            status
          )
        }
      }
    }
    indexInQueue++
  }

  nextState = nextState.setIn(PATHS.RECEIVED_ACTIONS, nextReceivedActions)

  // Clean up action statuses that don't correspond to a pending action:
  Object.keys(nextState.getIn(PATHS.RECEIVED_ACTIONS, {})).forEach(chainId => {
    let nextActionStatus = nextState.getIn(
      receivedActionsStatusPath(chainId),
      Immutable.from({})
    )
    const pendingActionTaskIds = Object.keys(
      pendingActionsForChain(chainId, nextState)
    )
    nextActionStatus = nextActionStatus.without(
      (val, writeJoinTaskId) => !pendingActionTaskIds.includes(writeJoinTaskId)
    )

    nextState = nextState.setIn(
      receivedActionsStatusPath(chainId),
      nextActionStatus
    )
  })

  // Clean up pending actions that are completed
  Object.keys(nextState.getIn(PATHS.SENT_ACTIONS, {})).forEach(chainId => {
    const completedActionTaskIds = Object.keys(
      nextState.getIn(sentActionsStatusPath(chainId), {})
    )
    let newPending = nextState.getIn(
      sentPendingActionsPath(chainId),
      Immutable.from({})
    )
    newPending = newPending.without((value, writeJoinTaskId) =>
      completedActionTaskIds.includes(writeJoinTaskId)
    )

    nextState = nextState.setIn(sentPendingActionsPath(chainId), newPending)
  })
  return nextState
}

module.exports = writeJoinReducer
