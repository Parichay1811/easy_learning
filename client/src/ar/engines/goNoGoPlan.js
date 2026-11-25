/**
 * Round planning for the go / no-go games (Pets Only, Rule Switch, Safe Hands).
 *
 * Pure — no engine, no clock, no content — so the three decisions below can be
 * tested directly, because each one was a tester complaint that the engine
 * itself gave no way to see:
 *
 *   - which rule pair a Rule Switch round uses (there was exactly one, every
 *     round, so "the opposite rule" was always the same single thing);
 *   - whether a turn is a "touch it" or a "leave it alone" (at level 1 only
 *     15 % are "leave it alone", so a round could show one such picture, or
 *     none — a rule the child was told but never met);
 *   - which picture comes up (drawn with replacement, so the two or three
 *     "leave it alone" pictures in a round were often the same one twice).
 *
 * Nothing here adds time pressure or a penalty. It only makes sure the round
 * actually contains what its instruction promised.
 */

/**
 * Which rule variant this round plays: any but the one just played.
 * @param {number} count how many variants the game declares
 * @param {number|null} last index played last time (null/-1 = none yet)
 * @param {() => number} rng
 */
export function pickVariant(count, last, rng = Math.random) {
  if (!(count > 1)) return 0
  const options = []
  for (let i = 0; i < count; i++) if (i !== last) options.push(i)
  return options[Math.min(options.length - 1, Math.floor(rng() * options.length))]
}

/**
 * The stretch of the round that shares one rule with trial `index`.
 * Without a switch that is the whole round; with one, the part before the flip
 * or the part after it.
 * @returns {{start:number, length:number, position:number, remaining:number}}
 *   `remaining` counts this trial.
 */
export function segmentOf(index, total, flipAt = null) {
  const hasFlip = Number.isFinite(flipAt) && flipAt > 0 && flipAt < total
  const start = hasFlip && index >= flipAt ? flipAt : 0
  const end = hasFlip && index < flipAt ? flipAt : total
  const length = Math.max(0, end - start)
  const position = index - start
  return { start, length, position, remaining: Math.max(0, length - position) }
}

/**
 * How many "leave it alone" turns a stretch of this length must contain.
 * Two, where there is room: one could be luck, and a rule met once has not
 * been practised. A very short stretch (a mission stage) asks for less.
 */
export function minNoGoFor(length) {
  if (length >= 6) return 2
  if (length >= 3) return 1
  return 0
}

/**
 * Is this turn a "touch it" turn?
 *
 * @param {object} p
 * @param {number} p.noGoRate the level's share of "leave it alone" turns
 * @param {number} p.roll a uniform random number in [0, 1)
 * @param {string[]} p.recent rules of the turns played so far, oldest first
 *   ('go' | 'noGo')
 * @param {number} p.remaining turns left under the current rule, this one included
 * @param {number} p.noGoSoFar "leave it alone" turns already played under it
 * @param {number} p.minNoGo how many this stretch must contain (minNoGoFor)
 */
export function chooseGo({ noGoRate, roll, recent = [], remaining, noGoSoFar = 0, minNoGo = 0 }) {
  // Never three "leave it alone" turns in a row — that stops being an
  // inhibition task and becomes a waiting task. (An empty history counts, so a
  // round always opens on something to touch.)
  const forceGo = recent.slice(-2).every((r) => r === 'noGo')
  if (forceGo) return true
  // Still owed some, and running out of turns to fit them in with a "touch it"
  // between each: this one has to be it.
  const owed = Math.max(0, minNoGo - noGoSoFar)
  if (owed > 0 && remaining <= owed * 2) return false
  return roll > noGoRate
}

/**
 * Draws from `pool` without repeating until every item has had a turn.
 * `used` is mutated: it is the caller's memory of what has been shown.
 *
 * @param {Array<{id:string}>} pool
 * @param {Set<string>} used ids already shown this stretch
 * @param {() => number} rng
 * @param {string|null} [lastId] the picture shown on the previous turn, which
 *   is never shown twice running while there is another to show
 */
export function drawFresh(pool, used, rng = Math.random, lastId = null) {
  if (!pool.length) return null
  let fresh = pool.filter((i) => !used.has(i.id))
  if (!fresh.length) {
    for (const i of pool) used.delete(i.id)
    fresh = pool
  }
  // Also after the caller has wiped its memory (the rule switch does), where
  // the picture just shown is "fresh" again.
  if (fresh.length > 1) fresh = fresh.filter((i) => i.id !== lastId)
  const item = fresh[Math.min(fresh.length - 1, Math.floor(rng() * fresh.length))]
  used.add(item.id)
  return item
}
