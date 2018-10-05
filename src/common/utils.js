const createAction = (type, payload, meta) => {
  const action = {
    type,
    payload
  }
  if (meta) {
    action.meta = meta
  }
  return action
}

const valuesMatching = (dictionary, lookup) =>
  Object.keys(dictionary).reduce((valueAccumulator, keyRegex) => {
    const properRegex = keyRegex
      .replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&') // escape all regex control characters, except for *
      .replace(/[*]/g, '.*') // replace * with .*
      .replace(/.*/, '^$&$') // wrap everything in ^...$ to prevent submatching
    return lookup.match(properRegex)
      ? valueAccumulator.concat(dictionary[keyRegex])
      : valueAccumulator
  }, [])

module.exports = { createAction, valuesMatching }
