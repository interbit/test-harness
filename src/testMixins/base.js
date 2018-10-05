const { scanLastBlockForRequest } = require('./utils')

const baseMixins = hypervisor => {
  const blockUntil = async predicate => {
    let passed = false
    const pool = hypervisor.inspectPool()
    passed = pool.some(predicate)
    hypervisor.block()
    while (!passed) {
      await hypervisor.waitForPool()
      const pool = hypervisor.inspectPool()
      passed = pool.some(predicate)
      hypervisor.block()
    }
  }

  const blockUntilState = async predicate => {
    let passed = false
    do {
      hypervisor.block()
      passed = predicate(hypervisor.getState())
      passed || (await hypervisor.waitForPool())
    } while (!passed)
  }

  const getStateMutable = () => hypervisor.getState().asMutable({ deep: true })
  const getPath = path => hypervisor.getState().getIn(path)

  const getLastBlock = () => {
    const [lastBlock] = hypervisor.getBlocks().slice(-1)
    return lastBlock
  }
  const findActionInLastBlock = findFn =>
    scanLastBlockForRequest(hypervisor, findFn)

  return Object.assign({}, hypervisor, {
    getLastBlock,
    findActionInLastBlock,
    blockUntil,
    blockUntilState,
    getStateMutable,
    getPath
  })
}

module.exports = baseMixins
