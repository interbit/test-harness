const {
  CREATE_CHILD_CHAIN,
  SPONSOR_CHAIN_REQUEST,
  SPONSOR_CHAIN,
  UPDATE_CONFIG,
  MIGRATE,
  INIT,
  SET_CHAIN_ID,
  READ_JOIN_RESP,
  FINISHED_READ_JOIN_ACTIONS,
  UPDATE_CHILDREN,
  STROBE
} = require('../interbitReducer/actionTypes')
const { valuesMatching } = require('../common/utils')

const ALLOWED_SYSTEM_ACTIONS = [
  UPDATE_CONFIG,
  MIGRATE,
  INIT,
  SET_CHAIN_ID,
  FINISHED_READ_JOIN_ACTIONS,
  STROBE,
  READ_JOIN_RESP,
  UPDATE_CHILDREN,
  CREATE_CHILD_CHAIN,
  SPONSOR_CHAIN, // TODO: This might not be the right thing to do. If we allow redispatches to pass through auth, we can remove this
  SPONSOR_CHAIN_REQUEST
]
// Note: authorization for chain joining actions happens in the lifted user covenant
const authorizeAction = (
  acl,
  action,
  systemActions = ALLOWED_SYSTEM_ACTIONS
) => {
  if (!action.hash || systemActions.includes(action.type)) {
    return
  }
  if (!acl) {
    throw new Error(`No ACL found`)
  }
  const authorizedRoles = valuesMatching(acl.actionPermissions, action.type)
  const userKey = action.publicKey
  const chainId = action.payload && action.payload.fromChainId
  if (
    !authorizedRoles.some(authorizedRole => {
      const keys = acl.roles[authorizedRole] || []
      return (
        keys.includes(userKey) || keys.includes(chainId) || keys.includes('*')
      )
    })
  ) {
    throw new Error(`${action.type} unauthorized`)
  }
}

module.exports = authorizeAction
