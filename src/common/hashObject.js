// TODO: coerce false or true?
const objectHash = require('node-object-hash')({ sort: true, coerce: false })
  .hash

const hash = (object, alg = 'sha256') => objectHash(object, { alg, enc: 'hex' })

module.exports = hash
