const { PATHS, PENDING_ACTIONS, ACTION_STATUS } = require('./constants')
const { REMOVE_JOIN_CONFIG } = require('./actionTypes')

const PENDING_ACTION_JOIN_NAME = 'WRITE-JOIN-PENDING-ACTIONS'
const ACTION_STATUS_JOIN_NAME = 'WRITE-JOIN-ACTION-STATUS'

// TODO: Prevent joins with the reserved Write join names:
const configureProvideState = (config, consumer, statePath, joinName) => {
  const nextConfig = config.providing.some(
    providingConfig =>
      providingConfig.consumer === consumer &&
      providingConfig.joinName === joinName
  )
    ? config
    : addEntry(config, 'providing', { consumer, statePath, joinName })
  return setAclForJoin({
    config: nextConfig,
    otherChainId: consumer,
    permittedActions: [REMOVE_JOIN_CONFIG]
  })
}

const configureConsumeState = (config, provider, mount, joinName) => {
  const nextConfig = config.consuming.some(
    consumingConfig =>
      consumingConfig.provider === provider &&
      consumingConfig.joinName === joinName
  )
    ? config
    : addEntry(config, 'consuming', { provider, mount, joinName })
  return setAclForJoin({
    config: nextConfig,
    otherChainId: provider,
    permittedActions: [REMOVE_JOIN_CONFIG]
  })
}

const setAclForJoin = ({ config, otherChainId, permittedActions }) => {
  let nextConfig = config
  const currentActionPermissions = nextConfig.getIn(
    ['acl', 'actionPermissions'],
    {}
  )
  // Create a role with chainId
  const roleName = `chain-${otherChainId}`
  nextConfig = nextConfig.setIn(['acl', 'roles', roleName], [otherChainId])

  const newActionPermissions = permittedActions.reduce(
    (accumulatedPermissions, actionType) => {
      return accumulatedPermissions.updateIn(
        [actionType],
        (existingRoles = []) =>
          existingRoles.includes(roleName)
            ? existingRoles
            : existingRoles.concat(roleName)
      )
    },
    currentActionPermissions
  )
  return nextConfig
    .setIn(['acl', 'actionPermissions'], newActionPermissions)
    .setIn(['acl', 'roles', roleName], [otherChainId])
}

const configureReceiveActions = (config, senderChainId, permittedActions) => {
  let nextConfig = config
  // Are we already receiving actions from the same chain:
  const alreadyReceivingActions = !!nextConfig
    .getIn(['consuming'], [])
    .find(
      providingEntry =>
        providingEntry.provider === senderChainId &&
        providingEntry.joinName === PENDING_ACTION_JOIN_NAME
    )
  // consuming pending queue from sender
  // providing action status to  sender
  nextConfig = alreadyReceivingActions
    ? nextConfig
    : addEntries(
        nextConfig,
        {
          path: 'consuming',
          entry: {
            provider: senderChainId,
            mount: PATHS.RECEIVED_ACTIONS.concat([
              senderChainId,
              PENDING_ACTIONS
            ]),
            joinName: PENDING_ACTION_JOIN_NAME
          }
        },
        {
          path: 'providing',
          entry: {
            consumer: senderChainId,
            statePath: PATHS.RECEIVED_ACTIONS.concat([
              senderChainId,
              ACTION_STATUS
            ]),
            joinName: ACTION_STATUS_JOIN_NAME
          }
        }
      )
  return setAclForJoin({
    config: nextConfig,
    otherChainId: senderChainId,
    permittedActions: [...permittedActions, REMOVE_JOIN_CONFIG]
  })
}

const configureSendActions = (config, receiverChainId) => {
  let nextConfig = config
  // Are we already sending actions to the same chain:
  const alreadySendingActions = !!nextConfig
    .getIn(['providing'], [])
    .find(
      providingEntry =>
        providingEntry.consumer === receiverChainId &&
        providingEntry.joinName === PENDING_ACTION_JOIN_NAME
    )
  nextConfig = alreadySendingActions
    ? nextConfig
    : addEntries(
        nextConfig,
        {
          path: 'providing',
          entry: {
            consumer: receiverChainId,
            statePath: PATHS.SENT_ACTIONS.concat([
              receiverChainId,
              PENDING_ACTIONS
            ]),
            joinName: PENDING_ACTION_JOIN_NAME
          }
        },
        {
          path: 'consuming',
          entry: {
            provider: receiverChainId,
            mount: PATHS.SENT_ACTIONS.concat([receiverChainId, ACTION_STATUS]),
            joinName: ACTION_STATUS_JOIN_NAME
          }
        }
      )
  return setAclForJoin({
    config: nextConfig,
    otherChainId: receiverChainId,
    permittedActions: [REMOVE_JOIN_CONFIG]
  })
}

const addEntry = (state, path, entry) =>
  state.updateIn(Array.isArray(path) ? path : [path], (entries = []) =>
    entries.concat(entry)
  )

const addEntries = (state, ...entriesWithPaths) => {
  let nextState = state
  entriesWithPaths.forEach(entryWithPath => {
    nextState = addEntry(nextState, entryWithPath.path, entryWithPath.entry)
  })
  return nextState
}

module.exports = {
  configureProvideState,
  configureConsumeState,
  configureSendActions,
  configureReceiveActions,
  setAclForJoin,
  PENDING_ACTION_JOIN_NAME,
  ACTION_STATUS_JOIN_NAME
}

module.exports = {
  configureProvideState,
  configureConsumeState,
  configureReceiveActions,
  configureSendActions,
  PENDING_ACTION_JOIN_NAME,
  ACTION_STATUS_JOIN_NAME
}
