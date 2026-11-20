// The learner's own learning profile (GET/PUT /api/learn/profile, suggestions),
// with the student's token. One copy is kept for the session so the Today and
// Progress tabs share it without fetching twice; each tab still refreshes it.
import { useCallback, useEffect, useState } from 'react'

const BASE = import.meta.env.VITE_API_BASE_URL

function token() {
  try { return localStorage.getItem('jwt_token') || localStorage.getItem('firebase_jwt') || '' } catch { return '' }
}

function headers(body) {
  let tz = 'UTC'
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { /* keep UTC */ }
  const tok = token()
  return { ...(tok ? { Authorization: `Bearer ${tok}` } : {}), 'X-Timezone': tz, ...(body ? { 'Content-Type': 'application/json' } : {}) }
}

/** fetch /api<path> as the student: { ok, status, ...json }, never throws. */
export async function learnFetch(path, { method = 'GET', body } = {}) {
  try {
    const r = await fetch(`${BASE}${path}`, { method, headers: headers(body), credentials: 'include', body: body ? JSON.stringify(body) : undefined })
    const json = await r.json().catch(() => ({}))
    return { ...json, ok: r.ok && json.success !== false, status: r.status }
  } catch {
    return { ok: false, status: 0, message: 'offline' }
  }
}

let cache = { tok: null, data: null }
const listeners = new Set()
function publish(data) {
  cache = { tok: token(), data }
  listeners.forEach((fn) => fn(data))
}

/**
 * The learner's profile: { data: { profile, skills, next, wins, needsPractice, history? }, loading, error, status, reload, save, answer }.
 * `status` 404 means this server has no learning engine yet (callers hide the views).
 */
export function useLearnProfile({ enabled = true } = {}) {
  const own = cache.tok === token() ? cache.data : null
  const [state, setState] = useState({ data: own, loading: enabled, error: '', status: own ? 200 : 0 })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!enabled) return undefined
    let live = true
    learnFetch('/learn/profile').then((r) => {
      if (!live) return
      if (r.ok) publish(r)
      setState({ data: r.ok ? r : null, loading: false, error: r.ok ? '' : (r.message || 'error'), status: r.status })
    })
    return () => { live = false }
  }, [enabled, nonce])

  // Another tab of the dashboard saved something: show it here too.
  useEffect(() => {
    const on = (data) => setState((st) => ({ ...st, data, status: 200, error: '' }))
    listeners.add(on)
    return () => { listeners.delete(on) }
  }, [])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  /**
   * PUT /learn/profile with a patch; resolves { ok, status, message }.
   * `optimistic(data) -> data` shows the change at once (undone if the save fails).
   */
  const save = useCallback(async (patch, optimistic) => {
    if (optimistic && cache.data) publish(optimistic(cache.data))
    const r = await learnFetch('/learn/profile', { method: 'PUT', body: patch })
    if (r.ok && r.profile) publish({ ...(cache.data || {}), ...r })
    else setNonce((n) => n + 1)
    return r
  }, [])

  /** POST /learn/suggestions/:id { accept }. */
  const answer = useCallback(async (id, accept) => {
    const r = await learnFetch(`/learn/suggestions/${encodeURIComponent(id)}`, { method: 'POST', body: { accept } })
    // The reply carries the whole new profile; a refusal (409) leaves it as it was, so refresh.
    if (r.ok && r.profile) publish({ ...(cache.data || {}), ...r })
    else setNonce((n) => n + 1)
    return r
  }, [])

  return { ...state, reload, save, answer }
}
