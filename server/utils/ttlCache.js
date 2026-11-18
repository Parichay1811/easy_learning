// A small in-memory cache for heavy, platform-wide reads (SUP-020..023): the
// first caller computes, everyone asking for the same key while that runs gets
// the same promise, and the result is reused for `ttlMs`.
const store = new Map()

async function cached(key, ttlMs, compute) {
  const hit = store.get(key)
  const now = Date.now()
  if (hit && (hit.pending || now - hit.at < ttlMs)) return hit.pending || hit.value
  const pending = Promise.resolve().then(compute)
  store.set(key, { pending, at: now, value: hit?.value })
  try {
    const value = await pending
    store.set(key, { at: Date.now(), value, pending: null })
    if (store.size > 500) store.delete(store.keys().next().value)
    return value
  } catch (err) {
    store.delete(key)
    throw err
  }
}

const ageOf = (key) => { const h = store.get(key); return h && !h.pending ? Date.now() - h.at : null }
const clear = (prefix = '') => { for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k) }

module.exports = { cached, clear, ageOf }
