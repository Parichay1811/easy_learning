/**
 * The vision runtime (.wasm) and models (.task), kept in Cache Storage.
 *
 * Opening Games stores them here in the background (prefetchVisionFiles); the
 * tracker (the worker, or the main-thread fallback) then loads them from here
 * instead of the network. Cache Storage is shared by the page and its workers and
 * lasts across visits, so the 12-20 MB are downloaded once, not on every first
 * game of a visit, and no longer depend on the server's cache headers.
 *
 * No DOM: this runs in the worker too. Every call fails soft (null / false): the
 * tracker then simply fetches from the network as before.
 *
 * Bump VERSION when client/scripts/setup-mediapipe.mjs vendors new files under the
 * same names, so nobody keeps an old model.
 */
const VERSION = 1
const NAME = `learnigo-vision-v${VERSION}`

const store = () => (typeof caches !== 'undefined' ? caches.open(NAME) : Promise.reject(new Error('no Cache Storage')))

/** Download and keep these URLs (absolute), skipping ones already kept. */
export async function keepFiles(urls) {
  try {
    const c = await store()
    const got = await Promise.all(
      urls.map(async (u) => {
        if (await c.match(u)) return true
        const r = await fetch(u, { priority: 'low' })
        if (!r.ok) return false
        await c.put(u, r)
        return true
      })
    )
    return got.every(Boolean)
  } catch {
    return false
  }
}

/** The bytes of a kept file, or null. */
export async function keptBytes(url) {
  try {
    const r = await (await store()).match(url)
    return r ? new Uint8Array(await r.arrayBuffer()) : null
  } catch {
    return null
  }
}

/** A blob: URL for a kept file (for loaders that only take a URL), or null. */
export async function keptUrl(url, type = 'application/octet-stream') {
  const bytes = await keptBytes(url)
  return bytes ? URL.createObjectURL(new Blob([bytes], { type })) : null
}
