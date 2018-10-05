const response = (request, payload, completionStatus) => {
  const containerId = request.meta.spawnedBy
  const jobId = request.meta.jobId
  return {
    type: `${containerId}/${jobId}/${completionStatus}`,
    payload,
    meta: {
      jobId
    }
  }
}

const reply = (request, payload) => response(request, payload, 'done')

const error = (request, message, stack) =>
  response(request, { message, stack }, 'error')

const scanLastBlockForRequest = (hypervisor, testBase) => {
  let test = testBase
  if (typeof testBase === 'string') {
    test = ({ type }) => testBase === type
  }
  const [lastBlock] = hypervisor.getBlocks().slice(-1)
  return lastBlock.content.actions.find(test)
}

module.exports = {
  scanLastBlockForRequest,
  response,
  reply,
  error
}
