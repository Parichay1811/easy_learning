// Boots the REAL server (server.js) against an in-memory MongoDB so tests go
// through real routes, real middleware and real tokens. Three databases, like production.
const { MongoMemoryServer } = require('mongodb-memory-server')
const { spawn } = require('child_process')
const path = require('path')
const net = require('net')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

const SECRETS = {
  JWT_SECRET: 'test-student-secret', PARENT_JWT_SECRET: 'test-parent-secret', ADMIN_JWT_SECRET: 'test-admin-secret',
  TEACHER_JWT_SECRET: 'test-teacher-secret', SUPERADMIN_JWT_SECRET: 'test-superadmin-secret',
}

const freePort = () => new Promise((resolve) => { const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => resolve(p)) }) })

// `env` adds environment variables; `preload` lists modules required before server.js
// (e.g. test/integration/fake-firebase.js so sign-in endpoints accept test tokens).
async function start({ port: fixedPort, clientUrl, env: extraEnv = {}, preload = [] } = {}) {
  const mongo = await MongoMemoryServer.create()
  const base = mongo.getUri().replace(/\/$/, '')
  const uris = { MONGODB_URI: `${base}/main`, ADMIN_MONGODB_URI: `${base}/admin`, SUPERADMIN_MONGODB_URI: `${base}/superadmin` }
  const port = fixedPort || await freePort()
  const env = {
    ...process.env, ...SECRETS, ...uris, PORT: String(port), AI_ASSISTANT: 'off', NODE_ENV: 'test',
    SUPER_ADMIN_EMAIL: 'root@example.com', SUPER_ADMIN_PASSWORD: 'x', CLIENT_URL: clientUrl || 'http://localhost:5173',
    // Never send real mail from a test or demo server: empty values win over server/.env (dotenv
    // never overrides a variable that is set), so every email stays in the Outbox.
    SMTP_URL: '', SMTP_HOST: '', ...extraEnv,
  }
  const child = spawn(process.execPath, [...preload.flatMap((m) => ['-r', m]), 'server.js'], { cwd: path.join(__dirname, '..', '..'), env, stdio: ['ignore', 'pipe', 'pipe'] })
  let log = ''
  child.stdout.on('data', (d) => { log += d }); child.stderr.on('data', (d) => { log += d })
  const url = `http://127.0.0.1:${port}`
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(`${url}/api/meta/metrics`); if (r.ok) break } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 150))
    if (i === 99) { child.kill(); throw new Error(`server did not start:\n${log}`) }
  }
  // The test process talks to the same databases, to seed and inspect data.
  const main = await mongoose.createConnection(uris.MONGODB_URI).asPromise()
  const admin = await mongoose.createConnection(uris.ADMIN_MONGODB_URI).asPromise()
  const superadmin = await mongoose.createConnection(uris.SUPERADMIN_MONGODB_URI).asPromise()

  const sign = (secret, payload, opts = {}) => jwt.sign(payload, SECRETS[secret], { expiresIn: '1h', ...opts })
  const tokens = {
    student: (email, name = 'Student') => sign('JWT_SECRET', { id: `uid-${email}`, email, name }),
    parent: (id, email = 'mum@example.com') => sign('PARENT_JWT_SECRET', { id, uid: `p-${id}`, email, name: 'Parent', role: 'parent' }),
    admin: (id, orgId, uid = `a-${id}`) => sign('ADMIN_JWT_SECRET', { id, uid, email: `${uid}@school.test`, name: 'Admin', orgId, role: 'org_admin' }),
    teacher: (id, orgId, email = `t-${id}@school.test`) => sign('TEACHER_JWT_SECRET', { id, uid: `t-${id}`, email, name: 'Teacher', orgId, role: 'teacher' }),
    superadmin: () => sign('SUPERADMIN_JWT_SECRET', { email: 'root@example.com', role: 'superadmin', name: 'Super Admin' }),
    // School staff (ADM-023): the OrgStaff row must exist and be active.
    staff: (id, orgId, staffId, staffRole, email) => sign('ADMIN_JWT_SECRET', { id, uid: `s-${id}`, email, name: 'Staff', orgId, staffId, staffRole, role: 'org_staff' }),
  }

  async function call(method, route, { token, body, headers = {}, cookie } = {}) {
    const res = await fetch(`${url}${route}`, {
      method,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(cookie ? { cookie } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
    })
    let json = null
    try { json = await res.json() } catch { /* no body */ }
    return { status: res.status, body: json }
  }

  const stop = async () => {
    child.kill()
    await Promise.all([main.close(), admin.close(), superadmin.close()])
    await mongo.stop()
  }
  return { url, call, tokens, db: { main, admin, superadmin }, stop, log: () => log }
}

module.exports = { start }
