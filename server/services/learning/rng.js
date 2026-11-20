// A small seeded random generator (mulberry32), so a round is the same for the
// same seed (tests, reloads) and different otherwise.

function hashSeed(seed) {
  const s = String(seed ?? '')
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

function createRng(seed) {
  let a = typeof seed === 'number' && Number.isFinite(seed) ? seed >>> 0 : hashSeed(seed)
  const next = () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (n) => Math.floor(next() * n),
    shuffle(list) {
      const out = [...list]
      for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [out[i], out[j]] = [out[j], out[i]] }
      return out
    },
    pick: (list) => (list.length ? list[Math.floor(next() * list.length)] : undefined),
  }
}

module.exports = { createRng, hashSeed }
