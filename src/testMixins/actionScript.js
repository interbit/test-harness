const { scanLastBlockForRequest } = require('./utils')

const isAction = ({ type }) => !!type
const isResponseGenerator = ({ test, response }) => !!test && !!response

const actionScriptMixin = hypervisor => {
  const scriptActions = steps => {
    for (const [index, step] of steps.entries()) {
      if (isAction(step)) {
        hypervisor.dispatch(step)
        hypervisor.block()
      } else if (isResponseGenerator(step)) {
        const { test, response } = step
        const requestAction = scanLastBlockForRequest(hypervisor, test)
        if (!requestAction) {
          throw new Error(
            `no request found at step ${index} using test ${test}`
          )
        }
        const responseAction = response(requestAction)
        hypervisor.dispatch(responseAction)
        hypervisor.block()
      } else {
        throw new Error(
          'Action scripts must have only actions or response generators'
        )
      }
    }
  }
  return Object.assign({}, hypervisor, {
    scriptActions
  })
}

module.exports = actionScriptMixin
