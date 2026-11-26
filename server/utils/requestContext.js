// Small per-request settings that deep code needs without passing them through every call:
// today, the learner's currency (X-Currency, utils/currency.js), so a question filled in
// anywhere during the request (a round, a discovery, a friendly match) shows their money.
const { AsyncLocalStorage } = require('async_hooks')

const als = new AsyncLocalStorage()

const get = () => als.getStore() || {}
const run = (store, fn) => als.run(store, fn)

function middleware(req, res, next) {
  const { currencyFrom } = require('./currency')
  als.run({ currency: currencyFrom(req) }, next)
}

module.exports = { get, run, middleware }
