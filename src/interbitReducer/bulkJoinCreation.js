const {
  configureProvideState,
  configureConsumeState,
  configureSendActions,
  configureReceiveActions
} = require('./joinUtils')

const addJoinConfigs = (config, shareConfig, aliases, ownChainId) => {
  let nextConfig = config
  const provideSlice = shareConfig.getIn(['provide'], [])
  const consumeSlice = shareConfig.getIn(['consume'], [])
  const sendActionToSlice = shareConfig.getIn(['sendActionTo'], [])
  const receiveActionFromSlice = shareConfig.getIn(['receiveActionFrom'], [])
  provideSlice.forEach(provideConfig => {
    const consumer = asChainId(provideConfig, aliases)
    nextConfig = configureProvideState(
      nextConfig,
      consumer,
      provideConfig.path,
      provideConfig.joinName
    )
  })

  consumeSlice.forEach(consumeConfig => {
    const provider = asChainId(consumeConfig, aliases)
    nextConfig = configureConsumeState(
      nextConfig,
      provider,
      consumeConfig.path,
      consumeConfig.joinName
    )
  })

  sendActionToSlice.forEach(sendActionConfig => {
    const receiverChainId = asChainId(sendActionConfig, aliases)
    nextConfig = configureSendActions(nextConfig, receiverChainId)
  })

  receiveActionFromSlice.forEach(receiveActionConfig => {
    const senderChainId = asChainId(receiveActionConfig, aliases)
    nextConfig = configureReceiveActions(
      nextConfig,
      senderChainId,
      receiveActionConfig.authorizedActions
    )
  })
  return nextConfig
}

const knownAliases = ({ children = {}, newChildren = {} }) =>
  []
    .concat(Object.entries(children), Object.entries(newChildren))
    .reduce(
      (accumulator, [alias, { blockHash }]) =>
        Object.assign(accumulator, { [alias]: blockHash }),
      {}
    )

// TODO: We might want to throw an error if the alias is not found:
const asChainId = ({ chainId, alias }, knownAliases) =>
  chainId || knownAliases[alias]

module.exports = {
  addJoinConfigs,
  knownAliases
}
