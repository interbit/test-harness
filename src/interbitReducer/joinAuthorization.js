const { valuesMatching } = require('../common/utils')
const { PATHS } = require('./constants')

const isAuthorizedToWrite = (config, chainId, action) =>
  valuesMatching(config.acl.actionPermissions, action.type).some(
    authorizedRole => authorizedRole === `chain-${chainId}`
  )

const matchingConsumeConfig = (joinName, chainId, state) =>
  state
    .getIn(PATHS.CONSUMING)
    .find(
      consuming =>
        consuming.joinName === joinName && consuming.provider === chainId
    )

module.exports = { matchingConsumeConfig, isAuthorizedToWrite }
