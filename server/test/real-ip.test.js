const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')
const http = require('http')
const { realIp } = require('../middleware/realIp')

const run = (req) => { realIp(req, {}, () => {}); return req.headers['x-forwarded-for'] }

test('from nginx on this machine, X-Real-IP becomes the client address', () => {
  assert.equal(run({ headers: { 'x-real-ip': '203.0.113.9' }, socket: { remoteAddress: '127.0.0.1' } }), '203.0.113.9')
  assert.equal(run({ headers: { 'x-real-ip': '203.0.113.9' }, socket: { remoteAddress: '::ffff:127.0.0.1' } }), '203.0.113.9')
})

test('from anywhere else the header is ignored (no spoofing)', () => {
  assert.equal(run({ headers: { 'x-real-ip': '1.2.3.4' }, socket: { remoteAddress: '198.51.100.7' } }), undefined)
})

test('an existing X-Forwarded-For is left alone', () => {
  assert.equal(run({ headers: { 'x-real-ip': '1.2.3.4', 'x-forwarded-for': '5.6.7.8' }, socket: { remoteAddress: '127.0.0.1' } }), '5.6.7.8')
})

test('with trust proxy 1, req.ip is the visitor behind nginx', async () => {
  const app = express()
  app.set('trust proxy', 1)
  app.use(realIp)
  app.get('/ip', (req, res) => res.json({ ip: req.ip }))
  const server = app.listen(0)
  const { port } = server.address()
  const ip = await new Promise((resolve) => {
    http.get({ host: '127.0.0.1', port, path: '/ip', headers: { 'x-real-ip': '203.0.113.50' } }, (r) => { let b = ''; r.on('data', (c) => { b += c }); r.on('end', () => resolve(JSON.parse(b).ip)) })
  })
  server.close()
  assert.equal(ip, '203.0.113.50')
})
