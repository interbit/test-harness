const Immutable = require('seamless-immutable')
const {
  UPDATE_CHILDREN,
  DEPLOY_COVENANT,
  MIGRATE,
  INIT,
  SET_CHAIN_ID,
  READ_JOIN_RESP,
  FINISHED_READ_JOIN_ACTIONS,
  REMOVE_JOIN_CONFIG,
  SET_ACL,
  ADD_TO_ACL,
  AUTHORIZE_RECEIVE_ACTIONS,
  AUTHORIZE_SEND_ACTIONS,
  CREATE_CHILD_CHAIN,
  SPONSOR_CHAIN,
  DESTROY,
  START_PROVIDE_STATE,
  START_CONSUME_STATE,
  CONFIGURE_JOIN,
  SPONSOR_CHAIN_REQUEST,
  REMOTE_REDISPATCH
} = require('./actionTypes')
const { PATHS, PENDING_ACTIONS } = require('./constants')
const { redispatch } = require('../common/redispatches')
const { sponsorChain } = require('./actions')
const writeJoinReducer = require('./writeJoinReducer')
const {
  createGenesisBlock,
  createDefaultChainConfig,
  createDefaultSponsoredChainConfig
} = require('../genesisBlock')

const {
  configureProvideState,
  configureConsumeState,
  configureReceiveActions,
  configureSendActions,
  PENDING_ACTION_JOIN_NAME,
  ACTION_STATUS_JOIN_NAME
} = require('./joinUtils')
const { addJoinConfigs, knownAliases } = require('./bulkJoinCreation')
const { matchingConsumeConfig } = require('./joinAuthorization')

const unique = array => [...new Set(array)]
const removeDuplicateValues = object =>
  Object.keys(object).reduce((accumulator, key) => {
    accumulator[key] = unique(object[key])
    return accumulator
  }, {})

const addToUniqueValues = (state, additions) => {
  let merged = state
  Object.keys(additions).forEach(key => {
    const values = additions[key]
    merged = merged.setIn([key], unique(state.getIn([key], []).concat(values)))
  })
  return merged
}

const mapValues = (mapper, object) =>
  Object.entries(object).reduce(
    (acc, [key, value]) => Object.assign(acc, { [key]: mapper(value, key) }),
    {}
  )

const updateRoles = (state, updateFunction) =>
  state.updateIn(['interbit', 'config', 'acl', 'roles'], roles => {
    if (!roles) {
      return
    }
    return mapValues(updateFunction, roles)
  })

const withStandardReducer = (reducer, stopRecursion = false) => (
  state,
  action
) => {
  switch (action.type) {
    case DEPLOY_COVENANT: {
      const previousCovenantHash = state.getIn([
        'interbit',
        'config',
        'covenantHash'
      ])
      const nextState = previousCovenantHash
        ? state.setIn(['interbit', 'config', 'mustMigrate'], true)
        : state.setIn(['interbit', 'config', 'mustInit'], true)
      return nextState.setIn(
        ['interbit', 'config', 'covenantHash'],
        action.payload.covenantHash
      )
    }
    case SET_ACL: {
      const { actionPermissions, roles } = action.payload
      return state
        .setIn(
          ['interbit', 'config', 'acl', 'actionPermissions'],
          removeDuplicateValues(actionPermissions)
        )
        .setIn(
          ['interbit', 'config', 'acl', 'roles'],
          removeDuplicateValues(roles)
        )
    }
    case ADD_TO_ACL: {
      const {
        actionPermissions: newActionPermissions = {},
        roles: newRoles = {}
      } = action.payload

      const currentActionPermissions = state.getIn(
        ['interbit', 'config', 'acl', 'actionPermissions'],
        Immutable.from({})
      )
      const mergedActionPermissions = addToUniqueValues(
        currentActionPermissions,
        newActionPermissions
      )
      const currentRoles = state.getIn(
        ['interbit', 'config', 'acl', 'roles'],
        Immutable.from({})
      )
      const mergedRoles = addToUniqueValues(currentRoles, newRoles)
      return state
        .setIn(
          ['interbit', 'config', 'acl', 'actionPermissions'],
          mergedActionPermissions
        )
        .setIn(['interbit', 'config', 'acl', 'roles'], mergedRoles)
    }
    case MIGRATE: {
      const { interbit } = state
      const nextInterbit = interbit.updateIn(['config'], config =>
        config.without('mustMigrate')
      )
      const nextState = reducer(state, action)
      return nextState.merge({ interbit: nextInterbit })
    }
    case INIT: {
      const nextState = state.updateIn(['interbit', 'config'], config =>
        config.without('mustInit')
      )
      return nextState.merge(reducer(undefined, action) || {}, { deep: true })
    }
    case SET_CHAIN_ID: {
      const { chainId } = action.payload
      return state.setIn(PATHS.CHAIN_ID, chainId)
    }
    case START_PROVIDE_STATE: {
      const { consumer, statePath, joinName } = action.payload
      let nextConfig = state.getIn(['interbit', 'config'])
      nextConfig = configureProvideState(
        nextConfig,
        consumer,
        statePath,
        joinName
      )
      return state.setIn(['interbit', 'config'], nextConfig)
    }
    case START_CONSUME_STATE: {
      const { provider, mount, joinName } = action.payload
      let nextConfig = state.getIn(['interbit', 'config'])
      nextConfig = configureConsumeState(nextConfig, provider, mount, joinName)
      return state.setIn(['interbit', 'config'], nextConfig)
    }
    case READ_JOIN_RESP: {
      let nextState = state
      const { fromChainId, states } = action.payload
      nextState = Object.keys(states).reduce((interimState, joinName) => {
        const matchingConfig = matchingConsumeConfig(
          joinName,
          fromChainId,
          interimState
        )
        return matchingConfig
          ? interimState.setIn(matchingConfig.mount, states[joinName])
          : interimState
      }, nextState)
      return nextState
    }
    // Write join story:
    case AUTHORIZE_RECEIVE_ACTIONS: {
      const { senderChainId, permittedActions } = action.payload
      let config = state.getIn(['interbit', 'config'])
      config = configureReceiveActions(config, senderChainId, permittedActions)
      return state.setIn(['interbit', 'config'], config)
    }
    case AUTHORIZE_SEND_ACTIONS: {
      const { receiverChainId } = action.payload
      let nextState = state
      let config = nextState.getIn(['interbit', 'config'])

      config = configureSendActions(config, receiverChainId)
      return nextState.setIn(['interbit', 'config'], config)
    }
    case FINISHED_READ_JOIN_ACTIONS: {
      const nextReducer = stopRecursion
        ? reducer
        : withStandardReducer(reducer, true)
      return writeJoinReducer(nextReducer)(state, action)
    }
    // create child chain story:
    case CREATE_CHILD_CHAIN: {
      const {
        childAlias,
        childShareConfig,
        parentShareConfig,
        childCovenantHash,
        blockMaster,
        sponsorChainId
      } = action.payload
      let nextState = state
      const ownChainId = nextState.getIn(PATHS.CHAIN_ID)
      const myPublicKey = nextState.interbit.config.blockMaster
      let genesisConfig
      if (blockMaster && sponsorChainId) {
        genesisConfig = createDefaultSponsoredChainConfig({
          blockMaster,
          covenantHash: childCovenantHash,
          myPublicKey,
          sponsorChainId
        })
      } else {
        genesisConfig = createDefaultChainConfig({
          blockMaster: myPublicKey,
          covenantHash: childCovenantHash
        })
      }

      const aliases = knownAliases(nextState.getIn(['interbit']))
      if (childShareConfig) {
        aliases.parent = ownChainId
        genesisConfig = addJoinConfigs(
          genesisConfig,
          childShareConfig,
          aliases,
          childAlias // We don't have ownChainId. The name of ACTION_STATUS and PENDING_ACTION slices will have chain alias instead
        )
        delete aliases.parent
      }

      const genesisBlock = createGenesisBlock({
        seed: nextState.interbit.lastBlock.blockHash,
        timestamp: nextState.interbit.lastBlock.content.timestamp,
        config: genesisConfig
      })

      nextState = nextState.setIn(
        ['interbit', 'newChildren', childAlias],
        genesisBlock
      )

      if (parentShareConfig) {
        aliases[childAlias] = genesisBlock.blockHash
        let config = nextState.getIn(['interbit', 'config'])
        config = addJoinConfigs(config, parentShareConfig, aliases, ownChainId)
        nextState = nextState.setIn(['interbit', 'config'], config)
      }

      return nextState
    }
    case DESTROY: {
      let nextState = state
      return nextState.setIn(['interbit', 'destroyed'], true)
    }
    case REMOVE_JOIN_CONFIG: {
      const { fromChainId: chainIdToRemove } = action.payload
      let nextState = state

      nextState = nextState.updateIn(
        ['interbit', 'config', 'consuming'],
        (providers = []) =>
          providers.filter(({ provider }) => provider !== chainIdToRemove)
      )

      nextState = nextState.updateIn(
        ['interbit', 'config', 'providing'],
        (consumers = []) =>
          consumers.filter(({ consumer }) => consumer !== chainIdToRemove)
      )

      nextState = updateRoles(nextState, members =>
        members.filter(member => member !== chainIdToRemove)
      )
      return nextState
    }
    case SPONSOR_CHAIN_REQUEST: {
      const { childAlias, genesisBlock } = action.payload
      let nextState = state
      // Making sure we have full access to this chain:
      const genesisConfig = genesisBlock.getIn(
        ['content', 'state', 'interbit', 'config'],
        Immutable.from({})
      )
      const ourChainId = nextState.getIn(PATHS.CHAIN_ID)
      const ourChainRole = `chain-${ourChainId}`

      // 1 - Check ACL
      // TODO: the existence of the role is not sufficient since there could be no action permission actually using that role, and there're potential alternatives to the .* actionPermission
      const starIsAllowedByUs = genesisConfig
        .getIn(['acl', 'actionPermissions', '*'], [])
        .includes(ourChainRole)
      const ourRoleCreated =
        genesisConfig.getIn(['acl', 'roles', ourChainRole, 0]) === ourChainId
      if (!starIsAllowedByUs || !ourRoleCreated) {
        throw new Error('ACL for sponsored child is not set up properly')
      }
      // 2 - Check write join to us
      const allowsUsToWrite =
        !!genesisConfig
          .getIn(['consuming'], [])
          .find(
            entry =>
              entry.provider === ourChainId &&
              entry.joinName === PENDING_ACTION_JOIN_NAME
          ) &&
        !!genesisConfig
          .getIn(['providing'], [])
          .find(
            entry =>
              entry.consumer === ourChainId &&
              entry.joinName === ACTION_STATUS_JOIN_NAME
          )
      if (!allowsUsToWrite) {
        throw new Error('Write join to parent is not set up properly')
      }
      // reduce it with user covenant
      nextState = reducer(nextState, action)
      // Set up our own write join to the child:
      nextState = nextState.setIn(
        ['interbit', 'config'],
        configureSendActions(
          nextState.getIn(['interbit', 'config']),
          genesisBlock.blockHash
        )
      )
      // Redispatch a sponsorChain request
      const sponsorChainAction = sponsorChain({
        childAlias,
        genesisBlock
      })
      return redispatch(nextState, sponsorChainAction)
    }
    case SPONSOR_CHAIN: {
      let nextState = state
      const { genesisBlock, childAlias } = action.payload
      const childKey = childAlias || genesisBlock.blockHash
      nextState = nextState.setIn(
        ['interbit', 'newChildren', childKey],
        genesisBlock
      )
      return nextState
    }
    case UPDATE_CHILDREN: {
      const { createdChildIds } = action.payload
      let newChildren = state.interbit.newChildren
      let children = state.getIn(['interbit', 'children'], Immutable.from({}))
      Object.entries(state.interbit.newChildren).forEach(
        ([childAlias, genesisBlock]) => {
          if (createdChildIds.includes(genesisBlock.blockHash)) {
            children = children.setIn([childAlias], genesisBlock)
            newChildren = newChildren.without(childAlias)
          }
        }
      )
      let nextState = state
      nextState = nextState
        .setIn(['interbit', 'newChildren'], newChildren)
        .setIn(['interbit', 'children'], children)
      return nextState
    }
    // Bulk join config story:
    case CONFIGURE_JOIN: {
      const { joinConfig, aliases } = action.payload
      let nextState = state
      let config = nextState.getIn(['interbit', 'config'])
      config = addJoinConfigs(
        config,
        joinConfig,
        aliases,
        nextState.getIn(PATHS.CHAIN_ID)
      )
      return nextState.setIn(['interbit', 'config'], config)
    }
    case REMOTE_REDISPATCH: {
      const pathToPendingWithTaskId = (chainId, taskId) =>
        PATHS.SENT_ACTIONS.concat([chainId, PENDING_ACTIONS, taskId])

      const nextWriteJoinTaskId = state => {
        const taskId = state.getIn(PATHS.WRITE_JOIN_TASK_ID, 0)
        const updatedState = state.setIn(PATHS.WRITE_JOIN_TASK_ID, taskId + 1)
        return { updatedState, taskId }
      }
      let nextState = state
      const { chainId, actions } = action.payload
      const redispatchActionList = [].concat(actions)
      redispatchActionList.forEach(action => {
        const { updatedState, taskId } = nextWriteJoinTaskId(nextState)
        nextState = updatedState
        nextState = nextState.setIn(
          pathToPendingWithTaskId(chainId, taskId),
          action
        )
      })
      return nextState
    }
  }
  const nextState = reducer(state, action)
  return nextState
}

module.exports = withStandardReducer
