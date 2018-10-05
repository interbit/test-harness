const deferred = () => {
  let deferredResolve
  let deferreedReject
  const promise = new Promise((resolve, reject) => {
    deferredResolve = resolve
    deferreedReject = reject
  })
  return {
    promise,
    resolve: deferredResolve,
    reject: deferreedReject
  }
}

module.exports = deferred
