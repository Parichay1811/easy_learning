// Loads server modules without any database: the org/superadmin connections
// become stubs, so requiring a controller never opens a socket.
const Module = require('module')
const path = require('path')
const mongoose = require('mongoose')

function stubConnection(file) {
  const resolved = require.resolve(path.join(__dirname, '..', 'db', file))
  const fake = { model: (name, schema) => mongoose.models['T_' + name] || mongoose.model('T_' + name, schema), on() {} }
  const m = new Module(resolved)
  m.filename = resolved
  m.loaded = true
  m.exports = fake
  require.cache[resolved] = m
}
stubConnection('adminDb.js')
stubConnection('superAdminDb.js')

// A minimal Express-style response that records what was sent.
function fakeRes() {
  const res = { statusCode: 200, body: undefined }
  res.status = (c) => { res.statusCode = c; return res }
  res.json = (b) => { res.body = b; return res }
  return res
}

module.exports = { fakeRes }
