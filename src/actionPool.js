const deferred = require('./common/deferred')

const createResolvers = () => {
  const resolvers = []
  const add = basePoolPredicate => {
    const poolPredicate = (() => {
      switch (typeof basePoolPredicate) {
        case 'string':
          return ({ type }) => type === basePoolPredicate
        case 'function':
          return basePoolPredicate
        case 'undefined':
          return () => true
        case 'number':
          return (_, pool) => pool.length === basePoolPredicate
        default:
          throw new Error("can't figure out how to wait for pool")
      }
    })()

    const { promise, resolve } = deferred()
    const resolver = (data, pool) => {
      if (poolPredicate(data, pool)) {
        resolve(data)
        const index = resolvers.indexOf(resolver)
        if (index >= -1) {
          resolvers.splice(index, 1)
        }
      }
    }
    resolvers.push(resolver)
    return promise
  }
  const check = data =>
    Array.from(resolvers).forEach(resolver => resolver(data))
  return {
    add,
    check
  }
}

const createActionPool = () => {
  const resolvers = createResolvers()
  let pool = []
  const add = data => {
    resolvers.check(data, pool) // TODO: If we resolve before pushing, the length check might be inaccurate
    pool.push(data)
    return data
  }
  const drain = () => pool.splice(0)
  const inspect = () => [...pool]
  const waitFor = resolvers.add
  const transform = mapper => {
    pool = pool.map(mapper)
  }
  return {
    add,
    drain,
    inspect,
    waitFor,
    transform
  }
}

module.exports = createActionPool
