const { response, scanLastBlockForRequest } = require('./utils')

const jobMixins = hypervisor => {
  const injectResponseWhen = (
    actionPredicate,
    responsePayload,
    completionStatus = 'done'
  ) => {
    const unsubscribe = hypervisor.subscribe(() => {
      const requestAction = scanLastBlockForRequest(hypervisor, actionPredicate)
      if (requestAction) {
        const responseAction = response(
          requestAction,
          responsePayload,
          completionStatus
        )
        hypervisor.dispatch(responseAction)
        hypervisor.block()
        unsubscribe()
      }
    })
  }

  // TODO: is this the cli? can the cli be generic since the API actions
  // behave a lot like functions now?
  const DONE = 'done'
  const ERROR = 'error'
  const TIMEOUT = 'timeout'
  const terminalStates = [DONE, ERROR, TIMEOUT]
  const jobIsTerminal = jobStatus => terminalStates.includes(jobStatus)

  const getJobStatus = (jobId, containerName, state) =>
    state.getIn(['containers', containerName, 'queue', jobId, 'status'], '')

  const returnCompletionOrThrow = (jobId, containerName, state, blocks) => {
    const jobStatus = getJobStatus(jobId, containerName, state)
    const [lastBlock] = blocks.slice(-1)
    switch (jobStatus) {
      case ERROR:
      case TIMEOUT: {
        let errorMessage = `job ${jobId} went into ${jobStatus} state`
        const errorType = `${containerName}/${jobId}/${jobStatus}`
        // TODO: this should always be able to find the error action but sometimes doesn't
        const errorAction = lastBlock.content.actions.find(
          ({ type, meta }) => type === errorType && meta.jobId === jobId
        )
        if (errorAction) {
          const { stack, message } = errorAction.payload.error
          errorMessage = `${errorMessage}\nOriginal Error:\n${message}\n${stack}`
        }
        throw new Error(errorMessage)
      }
      case DONE: {
        const completionType = `${containerName}/${jobId}`
        const [completionAction] = lastBlock.content.actions
          .filter(({ type }) => type.startsWith(completionType))
          .slice(-1)
        const job = state.getIn(['containers', containerName, 'queue', jobId])
        return { completionBlock: lastBlock, completionAction, jobId, job }
      }
    }
  }

  const runJob = async action => {
    const [container] = action.type.split('/')
    hypervisor.dispatch(action)
    hypervisor.block()
    // the job is the last job of this type that was added to the queue
    // TODO: this doesn't cover jobs that create themselves
    // synchronously which is stupid
    const [jobId] = Object.entries(
      hypervisor.getState().getIn(['containers', container, 'queue'], {})
    )
      .filter(([jobId, job]) => job.actionType === action.type)
      .map(([jobIdString]) => parseInt(jobIdString))
      .slice(-1)
    if (typeof jobId === 'undefined') {
      throw new Error(`action ${action.type} did not result in a job`)
    }
    if (jobIsTerminal(getJobStatus(jobId, container, hypervisor.getState()))) {
      return returnCompletionOrThrow(
        jobId,
        container,
        hypervisor.getState(),
        hypervisor.getBlocks()
      )
    }
    await hypervisor.blockUntilState(state =>
      jobIsTerminal(getJobStatus(jobId, container, state))
    )
    return returnCompletionOrThrow(
      jobId,
      container,
      hypervisor.getState(),
      hypervisor.getBlocks()
    )
  }

  const getJob = (jobId, containerName) =>
    hypervisor.getState().getIn(['containers', containerName, 'queue', jobId])

  // TODO: Is this necessary? A job at terminal state only stays in the state for exactly one block.
  const getJobCompletionData = (jobId, containerName) => {
    if (
      !jobIsTerminal(getJobStatus(jobId, containerName, hypervisor.getState()))
    ) {
      throw new Error(`job ${jobId} is not complete`)
    }
    const blocks = hypervisor.getBlocks()
    const blockIndexActionPairs = blocks
      .reduce(
        (pairs, nextBlock, blockIndex) =>
          pairs.concat(
            nextBlock.content.actions.map(action => [action, blockIndex])
          ),
        []
      )
      .reverse()
    const jobActionPrefix = `${containerName}/${jobId}`
    const [completionAction, completionBlockIndex] = blockIndexActionPairs.find(
      ([action]) => action.type.startsWith(jobActionPrefix)
    )
    return {
      completionAction,
      completionBlock: blocks[completionBlockIndex]
    }
  }

  return Object.assign({}, hypervisor, {
    injectResponseWhen,
    runJob,
    getJob,
    getJobCompletionData
  })
}

module.exports = jobMixins
