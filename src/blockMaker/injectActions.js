const {
  migrate,
  init,
  setChainId,
  finishedReadJoinActions,
  updateChildren
} = require('../interbitReducer/actions')
const { READ_JOIN_RESP } = require('../interbitReducer/actionTypes')

const injectActions = ({ actions, previousBlockHash, blockHash, state }) => {
  const { interbit } = state
  const covenantHash = interbit.getIn(['config', 'covenantHash'])
  const mustInit = interbit.getIn(['config', 'mustInit'])
  const mustMigrate = interbit.getIn(['config', 'mustMigrate'])

  let updatedActionPool = actions
  // is this attaching to the genesis block?
  if (previousBlockHash === 'genesis') {
    updatedActionPool = [setChainId({ chainId: blockHash })].concat(
      updatedActionPool
    )
  }
  if (mustInit) {
    updatedActionPool = [init()].concat(updatedActionPool)
  } else if (mustMigrate) {
    updatedActionPool = [migrate(covenantHash)].concat(updatedActionPool)
  }
  if (updatedActionPool.some(action => action.type === READ_JOIN_RESP)) {
    updatedActionPool = [...updatedActionPool, finishedReadJoinActions()]
  }

  const createdChildIds = Object.values(
    interbit.getIn(['newChildren'], {})
  ).map(genesis => genesis.blockHash)

  if (createdChildIds.length) {
    updatedActionPool = updatedActionPool.concat(
      updateChildren({ createdChildIds })
    )
  }

  return updatedActionPool
}

module.exports = injectActions
