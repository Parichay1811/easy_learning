// Runs the AI voice assistant (../ai-assistant) in its own child process and
// forwards /api/ai-assistant/* to it.
//
// Why a child process: the assistant does CPU-heavy work (speech recognition
// and synthesis, embeddings, a local LLM). Inside the API's own process that
// work starved the event loop on a small server and every API route hung. In
// a child process, at a lower CPU priority, it can only ever slow itself down,
// and if it crashes the API keeps running and the child is started again.
// It is still one app: same code, same deploy, same PM2 process.
const { fork } = require('child_process')
const http = require('http')
const path = require('path')

const WORKER = path.join(__dirname, '..', 'ai-assistant', 'worker.mjs')
// Hop-by-hop headers are about one connection, not the request, so they are not forwarded.
const HOP = new Set(['connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'upgrade', 'te', 'trailer'])
const without = (headers) => Object.fromEntries(Object.entries(headers).filter(([k]) => !HOP.has(k.toLowerCase())))

function createAIAssistant({ enabled = true, log = console } = {}) {
  let child = null
  let port = null
  let failures = 0
  let startedAt = 0
  let stopping = false
  let retry = null

  function start() {
    if (!enabled || stopping || child) return
    startedAt = Date.now()
    port = null
    child = fork(WORKER, [], { stdio: 'inherit' })
    child.on('message', (m) => {
      if (m && m.type === 'ready') {
        port = m.port
        log.log(`AI assistant ready (pid ${child.pid}, 127.0.0.1:${port})`)
      }
    })
    child.on('exit', (code, signal) => {
      child = null
      port = null
      if (stopping) return
      // Back off if it keeps failing soon after starting (2 s, 4 s, ... up to 5 min).
      failures = Date.now() - startedAt < 5 * 60_000 ? failures + 1 : 1
      const delay = Math.min(5 * 60_000, 1000 * 2 ** Math.min(failures, 9))
      log.error(`AI assistant process exited (${signal || `code ${code}`}); starting it again in ${Math.round(delay / 1000)} s`)
      retry = setTimeout(start, delay)
      retry.unref()
    })
  }

  function unavailable(res, status = 503) {
    res.status(status).json({
      ready: false,
      error: enabled && !stopping ? 'The AI assistant is starting' : 'The AI assistant is not available',
    })
  }

  // Express middleware mounted at /api/ai-assistant (req.url is relative to it).
  // Bodies are streamed both ways untouched: raw audio in, NDJSON answers out.
  function handle(req, res) {
    if (!port) return unavailable(res)
    const upstream = http.request(
      { host: '127.0.0.1', port, method: req.method, path: req.url, headers: without(req.headers) },
      (up) => {
        res.writeHead(up.statusCode, without(up.headers))
        up.pipe(res)
      },
    )
    upstream.on('error', () => {
      if (!res.headersSent) unavailable(res, 502)
      else res.destroy()
    })
    // The student stopped the answer (or left): stop the work behind it too.
    res.on('close', () => {
      if (!res.writableEnded) upstream.destroy()
    })
    req.pipe(upstream)
  }

  function stop() {
    stopping = true
    clearTimeout(retry)
    if (child) child.kill('SIGTERM')
  }

  return { start, handle, stop, get ready() { return port !== null } }
}

module.exports = { createAIAssistant }
