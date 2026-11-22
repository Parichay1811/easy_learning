// Unfinished rounds, so a learner can resume after logging out (config.resumeHours). Pure.
//
// The profile keeps per subject+module at most two entries:
//   issued  the last round the server handed out (no answer yet)
//   active  a round with at least one answer and not finished
// An answer with that round's roundId turns `issued` into `active` (replacing an
// older active one); the last answer (or a "Start fresh") removes it. Entries
// expire `resumeHours` after their last activity. Only question ids are kept.
const cfg = require('../../config/learning')

const HOUR = 3600000
const keyOf = (subject, module) => `${subject}|${module}`
const ID_RE = /^[a-f0-9]{8,32}$/

const lastOf = (r) => new Date(r.lastAt || r.at || 0).getTime()
const fresh = (r, now) => now.getTime() - lastOf(r) <= cfg.resumeHours * HOUR

// Drops expired entries.
const pruneRounds = (rounds, now) => (rounds || []).filter((r) => fresh(r, now))

// A round handed out: replaces the issued entry of that subject+module.
//   items: [{ q (content id), oid (database id), why, for? }]
//   source: where the learner chose it from (config.CHOICE_SOURCES), or null
function issueRound(rounds, { id, subject, module, mode = null, source = null, skill = null, items, now }) {
  const key = keyOf(subject, module)
  const kept = pruneRounds(rounds, now).filter((r) => !(r.key === key && r.slot === 'issued'))
  if (!items.length) return kept
  return [...kept, {
    key, slot: 'issued', id, mode, source: source || mode || null, skill,
    items: items.slice(0, cfg.round.maxSize).map((x) => ({ q: String(x.q).slice(0, 80), oid: String(x.oid || ''), why: x.why || null, for: x.for || null })),
    answered: [], position: -1, at: now, lastAt: now,
  }]
}

/**
 * An answer that names its round. -> { rounds, info } where info is null when the
 * round is unknown (old clients, expired), else { roundId, position, answered, total, done }
 * (+ `started: true` on its first answer, `chosen: true` when the learner chose it: a source or mode).
 */
function trackAnswer(rounds, { roundId, position, subject, module, q, now }) {
  const list = pruneRounds(rounds, now)
  if (typeof roundId !== 'string' || !ID_RE.test(roundId)) return { rounds: list, info: null }
  const key = keyOf(subject, module)
  const i = list.findIndex((r) => r.id === roundId && r.key === key)
  if (i < 0) return { rounds: list, info: null }
  const r = { ...list[i], answered: [...(list[i].answered || [])] }
  const started = !r.answered.length
  const inRound = r.items.some((x) => x.q === q)
  if (inRound && !r.answered.includes(q)) r.answered.push(q)
  const at = Number.isInteger(position) && position >= 0 && position < r.items.length ? position : (inRound ? r.items.findIndex((x) => x.q === q) : r.position)
  r.position = Math.max(r.position ?? -1, at ?? -1)
  r.lastAt = now
  const total = r.items.length
  const done = r.answered.length >= total || r.position >= total - 1
  let out = list.filter((_, j) => j !== i)
  if (!done) {
    // It becomes THE unfinished round of this subject+module.
    out = out.filter((x) => !(x.key === key && x.slot === 'active'))
    out.push({ ...r, slot: 'active' })
  } else out = out.filter((x) => !(x.key === key && x.slot === 'active' && x.id === roundId))
  const info = { roundId, position: r.position, answered: r.answered.length, total, done }
  if (started) Object.assign(info, { started: true, chosen: !!(r.source || r.mode) })
  return { rounds: out, info }
}

// The unfinished round of a subject+module that can be resumed, or null.
function activeRound(rounds, subject, module, now) {
  const key = keyOf(subject, module)
  return pruneRounds(rounds, now).find((r) => r.key === key && r.slot === 'active' && (r.answered || []).length < r.items.length) || null
}

// The most recent unfinished round in any subject+module (for welcome / what next), or null.
function latestActive(rounds, now) {
  return pruneRounds(rounds, now).filter((r) => r.slot === 'active' && (r.answered || []).length < r.items.length)
    .sort((a, b) => lastOf(b) - lastOf(a))[0] || null
}

// "Start fresh": forget the unfinished (and issued) round of a subject+module.
function dropRound(rounds, subject, module, now) {
  const key = keyOf(subject, module)
  const before = pruneRounds(rounds, now)
  const out = before.filter((r) => r.key !== key)
  return { rounds: out, dropped: before.length - out.length }
}

// Where to continue: the first item after the furthest one answered.
const resumePosition = (r) => Math.min(r.items.length - 1, Math.max((r.position ?? -1) + 1, 0))

module.exports = { keyOf, pruneRounds, issueRound, trackAnswer, activeRound, latestActive, dropRound, resumePosition, ID_RE }
