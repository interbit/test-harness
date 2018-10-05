const createSubscribers = () => {
  const subscribers = []
  const add = fn => {
    subscribers.push(fn)
    return () => {
      const index = subscribers.indexOf(fn)
      if (index >= 0) {
        subscribers.splice(index, 1)
      }
    }
  }
  const notify = (...args) =>
    Array.from(subscribers).forEach(subscriber => subscriber(...args))
  return {
    add,
    notify
  }
}

module.exports = createSubscribers
