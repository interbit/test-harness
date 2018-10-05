const { createAction } = require('../common/utils')
const ActionTypes = require('./actionTypes')

const strobe = (timestamp = Date.now()) =>
  createAction(ActionTypes.STROBE, {
    timestamp
  })

const getState = () => createAction(ActionTypes.INTERBIT_GET_STATE, {})

const migrate = () => createAction(ActionTypes.MIGRATE)

const init = () => createAction(ActionTypes.INIT)

const setChainId = () => createAction(ActionTypes.SET_CHAIN_ID)

const finishedReadJoinActions = () =>
  createAction(ActionTypes.FINISHED_READ_JOIN_ACTIONS)

const updateChildren = () => createAction(ActionTypes.UPDATE_CHILDREN)

const remoteRedistpatch = () => createAction(ActionTypes.REMOTE_REDISPATCH)

const sponsorChain = ({ genesisBlock, childAlias }) =>
  createAction(ActionTypes.SPONSOR_CHAIN, { genesisBlock, childAlias })

const setAcl = ({ actionPermissions, roles }) =>
  createAction(ActionTypes.SET_ACL, { actionPermissions, roles })

const addToAcl = ({ actionPermissions = {}, roles = {} }) =>
  createAction(ActionTypes.ADD_TO_ACL, { actionPermissions, roles })

const authorizeReceiveActions = ({ senderChainId, permittedActions }) =>
  createAction(ActionTypes.AUTHORIZE_RECEIVE_ACTIONS, {
    senderChainId,
    permittedActions
  })

const authorizeSendActions = ({ receiverChainId }) =>
  createAction(ActionTypes.AUTHORIZE_SEND_ACTIONS, {
    receiverChainId
  })

const createChildChain = ({
  childAlias,
  parentShareConfig,
  childShareConfig,
  childCovenantHash,
  sponsorChainId,
  blockMaster
}) =>
  createAction(ActionTypes.CREATE_CHILD_CHAIN, {
    childAlias,
    parentShareConfig,
    childShareConfig,
    childCovenantHash,
    sponsorChainId,
    blockMaster
  })

const recreateChildChain = ({ childAlias, genesisBlock }) =>
  createAction(ActionTypes.RECREATE_CHILD_CHAIN, {
    childAlias,
    genesisBlock
  })

const destroy = () => createAction(ActionTypes.DESTROY, {})

const sponsorChainRequest = ({ genesisBlock, childAlias }) =>
  createAction(ActionTypes.SPONSOR_CHAIN_REQUEST, { genesisBlock, childAlias })

const startProvideState = ({ consumer, statePath, joinName }) =>
  createAction(ActionTypes.START_PROVIDE_STATE, {
    consumer,
    statePath,
    joinName
  })

const startConsumeState = ({ provider, mount, joinName }) =>
  createAction(ActionTypes.START_CONSUME_STATE, {
    provider,
    mount,
    joinName
  })

// Format:
//   joinConfig: {
//     provide: [{ chainId: '', alias: '', path: [], joinName: '' }],
//     consume: [{ chainId: '', alias: '', path: [], joinName: '' }],
//     sendActionTo: [{ chainId: '', alias: '' }],
//     receiveActionFrom: [{ chainId: '', alias: '', authorizedActions: [] }]
//   }
// aliases: {alias1: 'chainId-1', alias2: 'chainId-2', ...}
const configureJoin = ({ joinConfig, aliases }) =>
  createAction(ActionTypes.CONFIGURE_JOIN, { joinConfig, aliases })

const remoteRedispatch = ({ chainId, actions }) =>
  createAction(ActionTypes.REMOTE_REDISPATCH, { chainId, actions })

const hypervisorBoot = () => createAction(ActionTypes.HYPERVISOR_BOOT, {})

const hypervisorShutdown = () =>
  createAction(ActionTypes.HYPERVISOR_SHUTDOWN, {})

module.exports = {
  setAcl,
  addToAcl,
  authorizeReceiveActions,
  authorizeSendActions,
  startProvideState,
  startConsumeState,
  createChildChain,
  recreateChildChain,
  destroy,
  sponsorChain,
  sponsorChainRequest,
  configureJoin,
  remoteRedispatch,
  strobe,
  getState,
  migrate,
  init,
  setChainId,
  finishedReadJoinActions,
  updateChildren,
  remoteRedistpatch,
  hypervisorBoot,
  hypervisorShutdown
}
