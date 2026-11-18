// Reads (and, for "mark done", writes) the AI Teacher's own admin endpoints
// (/api/ai-assistant/admin, /heard, /health) over loopback through the API's
// proxy, so the console never needs to know the child process's port and the
// assistant's endpoints keep working exactly as they do for its admin page.
const http = require('http')

function request(method, path, { body, timeoutMs = 3000 } = {}) {
  const port = process.env.PORT || 5000
  return new Promise((resolve) => {
    const data = body ? Buffer.from(JSON.stringify(body)) : null
    const req = http.request({ host: '127.0.0.1', port, method, path: `/api/ai-assistant${path}`, timeout: timeoutMs, headers: data ? { 'content-type': 'application/json', 'content-length': data.length } : {} }, (res) => {
      let buf = ''
      res.on('data', (d) => { buf += d; if (buf.length > 5_000_000) req.destroy() })
      res.on('end', () => {
        let json = null
        try { json = JSON.parse(buf) } catch { /* not json */ }
        if (res.statusCode !== 200 || !json) return resolve({ ok: false, status: res.statusCode, message: json?.error || 'The AI Teacher is not available right now.' })
        resolve({ ok: true, status: 200, body: json })
      })
    })
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0, message: 'The AI Teacher did not answer in time.' }) })
    req.on('error', () => resolve({ ok: false, status: 0, message: 'The AI Teacher is not running.' }))
    if (data) req.write(data)
    req.end()
  })
}

module.exports = { get: (path) => request('GET', path), post: (path, body) => request('POST', path, { body }) }
