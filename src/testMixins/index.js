const base = require('./base')
const job = require('./job')
const actionScript = require('./actionScript')
const mixin = (...mixins) => baseHarness =>
  mixins.reduceRight((computed, nextMixin) => nextMixin(computed), baseHarness)

module.exports = {
  mixin,
  base,
  job,
  actionScript
}
