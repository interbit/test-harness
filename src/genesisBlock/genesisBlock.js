const Immutable = require('seamless-immutable')
const hashObject = require('../common/hashObject')
const { GENESIS, CONSENSUS, PREVIOUS_HASH } = require('./constants')
const {
  configureProvideState,
  configureConsumeState,
  configureSendActions,
  configureReceiveActions
} = require('../interbitReducer/joinUtils')

const createGenesisBlock = ({
  seed = Math.random(),
  timestamp = Date.now(),
  config
} = {}) => {
  const state = {
    interbit: {
      config
    }
  }
  const stateHash = hashObject(state)
  const content = {
    previousHash: PREVIOUS_HASH,
    stateHash,
    actions: [],
    errors: {},
    redispatches: {},
    height: 0,
    timestamp,
    seed,
    configChanged: true
  }
  const endTimestamp = Date.now()
  content.timeToCreateBlock = endTimestamp - timestamp
  const contentHash = hashObject(content)
  content.state = state
  const signatures = {
    GENESIS: GENESIS
  }
  const signaturesHash = hashObject(signatures)
  const signedBlock = {
    content,
    contentHash,
    signatures,
    signaturesHash
  }
  const blockHash = hashObject(signedBlock)
  return Immutable.from(signedBlock).set('blockHash', blockHash)
}

const BASE_CONFIG = Immutable.from({
  consensus: CONSENSUS.POA,
  providing: [],
  consuming: [],
  acl: {
    actionPermissions: {
      '*': ['root']
    },
    roles: {
      root: []
    }
  }
})

const genesisConfigBuilder = (config = BASE_CONFIG) => {
  const setBlockMaster = ({ blockMaster }) =>
    genesisConfigBuilder(
      config
        .setIn(['blockMaster'], blockMaster)
        .setIn(['acl', 'roles', 'root', 0], blockMaster)
    )
  const setCovenantHash = ({ covenantHash }) =>
    covenantHash
      ? genesisConfigBuilder(
          config.setIn(['covenantHash'], covenantHash).setIn(['mustInit'], true)
        )
      : genesisConfigBuilder(config)

  const addRootKey = ({ rootKey }) =>
    addToRole({ role: 'root', keyOrChainId: rootKey })

  const addActionPermissions = ({ actionTypes, roles }) => {
    let newConfig = actionTypes.reduce(
      (interimConfig, actionType) =>
        interimConfig.updateIn(
          ['acl', 'actionPermissions', actionType],
          (existingRoles = []) => existingRoles.concat(roles)
        ),
      config
    )
    return genesisConfigBuilder(newConfig)
  }
  const addToRole = ({ role, keyOrChainId }) =>
    genesisConfigBuilder(
      config.updateIn(['acl', 'roles', role], (roleKeys = []) =>
        roleKeys.concat(keyOrChainId)
      )
    )
  const addProvideState = ({ consumerChainId, statePath, joinName }) =>
    genesisConfigBuilder(
      configureProvideState(config, consumerChainId, statePath, joinName)
    )

  const addConsumeState = ({ providerChainId, statePath, joinName }) =>
    genesisConfigBuilder(
      configureConsumeState(config, providerChainId, statePath, joinName)
    )

  const addReceiveActions = ({ senderChainId, permittedActions }) =>
    genesisConfigBuilder(
      configureReceiveActions(config, senderChainId, permittedActions)
    )

  const addSendActions = ({ receiverChainId }) =>
    genesisConfigBuilder(configureSendActions(config, receiverChainId))

  const addSponsorChainId = ({ sponsorChainId }) =>
    genesisConfigBuilder(config.set('sponsorChainId', sponsorChainId))

  const build = () => config

  return {
    addRootKey,
    setBlockMaster,
    setCovenantHash,
    addProvideState,
    addConsumeState,
    addReceiveActions,
    addSendActions,
    addActionPermissions,
    addToRole,
    addSponsorChainId,
    build
  }
}

const createDefaultChainConfig = ({ blockMaster, covenantHash }) =>
  genesisConfigBuilder()
    .setBlockMaster({ blockMaster })
    .setCovenantHash({ covenantHash })
    .build()

// TODO: Rename this helper function
const createDefaultSponsoredChainConfig = ({
  blockMaster,
  covenantHash,
  myPublicKey,
  sponsorChainId
}) =>
  genesisConfigBuilder()
    .setBlockMaster({ blockMaster })
    .setCovenantHash({ covenantHash })
    .addRootKey({ rootKey: myPublicKey })
    .addSponsorChainId({ sponsorChainId })
    .addReceiveActions({
      senderChainId: sponsorChainId,
      permittedActions: ['*']
    })
    .build()

module.exports = {
  createGenesisBlock,
  createDefaultChainConfig,
  genesisConfigBuilder,
  createDefaultSponsoredChainConfig
}
