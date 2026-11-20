// Composes one adaptive round (~10 items) for a subject x module. Pure and
// deterministic for a given seed.
//
// The mix (config.round.mix, by pace, scaled to the round size), in priority order:
//   prerequisite  easier related items, only when something needs support
//   review        skills due for spaced repetition (and parked skills to reassess)
//   practice      focus skills (guardian/teacher), then the weakest skills
//   stretch       items from the next level when the learner is advancing
//   new           everything else: items at the level, new skills first
// Content ceiling: never above the highest level that has items. Items seen in
// the last sitting are not repeated (except reviews) while others exist; for
// teens and adults, items themed for young children come last; a learner who
// chose to type or choose instead of speaking gets microphone items last.
const cfg = require('../../config/learning')
const { createRng } = require('./rng')
const { isReviewDue } = require('./spacing')
const { strategyFor, isParked } = require('./support')

const HOUR = 3600000

// What support an item of this skill gets.
function supportFor(skill, why) {
  if (!skill || !skill.attempts) return { step: 0, strategy: 'words' }
  const step = skill.supportStep | 0
  if (step >= 4) return { step: 4, strategy: 'reassess' }
  // At step 3 the easier item goes first (why "prerequisite"); the skill's own items are then guided.
  if (step === 3 && why !== 'prerequisite') return { step: 2, strategy: 'guided' }
  return { step, strategy: strategyFor(step) }
}

function scaleMix(mix, size) {
  const f = size / 10
  const out = {}
  for (const [k, v] of Object.entries(mix)) out[k] = v ? Math.max(1, Math.round(v * f)) : 0
  return out
}

// The level to serve: the learner's level, capped at the content ceiling, moved
// to the nearest level that has items (down first, then up).
function servedLevel(level, levelsWithContent) {
  if (!levelsWithContent.length) return null
  const cap = Math.min(level, levelsWithContent[levelsWithContent.length - 1])
  const below = levelsWithContent.filter((l) => l <= cap)
  return below.length ? below[below.length - 1] : levelsWithContent[0]
}

/**
 * @param {object} a
 * @param {Array}  a.pool     items: { id, _id, level, skill, ageBand, interaction }
 * @param {string} a.subject
 * @param {string} a.module
 * @param {number} a.level    the learner's level in this subject
 * @param {string} a.status   the level status (new|practice|support|advancing)
 * @param {Map}    a.skills   skill id -> SkillMastery-like state (this subject)
 * @param {object} a.profile  { pace, ageBand, overrides, supports, recent }
 * @param {object} a.catalog  services/learning/catalog.js
 * @param {string} a.focusSkill  optional ("Practise now"): the round centres on this skill
 * -> { items: [{ id, _id, skill, level, why, support, for? }], level, servedLevel, ceiling, status, focus }
 */
function composeRound({ pool, subject, module, level, status = 'new', skills = new Map(), profile = {}, catalog, size = cfg.round.defaultSize, seed = 'x', now = new Date(), focusSkill = null }) {
  const rng = createRng(seed)
  const n = Math.max(cfg.round.minSize, Math.min(cfg.round.maxSize, Number(size) || cfg.round.defaultSize))
  const levelsAll = [...new Set(pool.map((q) => q.level).filter((l) => Number.isInteger(l)))].sort((a, b) => a - b)
  const ceiling = levelsAll.length ? levelsAll[levelsAll.length - 1] : null
  const empty = { items: [], level, servedLevel: null, ceiling, status, focus: null }

  const overrides = profile.overrides || []
  const hold = overrides.some((o) => o.type === 'hold_level' && (!o.subject || o.subject === subject))
  const skip = new Set(overrides.filter((o) => o.type === 'skip_skill' && o.skill).map((o) => o.skill))
  const focus = overrides.filter((o) => o.type === 'focus_skill' && o.skill).map((o) => o.skill)

  const items = pool.filter((q) => !skip.has(q.skill))
  if (!items.length) return empty

  const levels = [...new Set(items.map((q) => q.level).filter((l) => Number.isInteger(l)))].sort((a, b) => a - b)
  const L = servedLevel(level, levels) // null when no item has a level (e.g. old teacher uploads)
  const atLevel = (q) => L == null || q.level == null || q.level === L
  const notAbove = (max) => (q) => max == null || q.level == null || q.level <= max

  // One stable random rank per item, plus penalties: seen lately, "young" for
  // teens/adults, a microphone item for someone who prefers not to speak.
  const recentCut = now.getTime() - cfg.round.recentHours * HOUR
  const recent = new Set((profile.recent || []).filter((r) => r.at && new Date(r.at).getTime() >= recentCut).map((r) => r.q))
  const adultish = profile.ageBand === 'teen' || profile.ageBand === 'adult'
  const noSpeaking = ['type', 'choose'].includes(profile.supports?.speakInstead) && module !== 'speak'
  const rank = new Map(items.map((q) => [q.id, rng.next()]))
  // Tiers: a poor fit (1000) outweighs a repeat (100), which outweighs spreading over skills (1 per item).
  const fit = (q) => (adultish && q.ageBand === 'young' ? 1 : 0) + (noSpeaking && q.interaction === 'mic_record' ? 1 : 0)
  const isRecent = (q) => recent.has(q.id)
  const score = (q, why) => fit(q) * 1000 + (why !== 'review' && isRecent(q) ? 100 : 0) + rank.get(q.id)

  const picks = []
  const used = new Set()
  const usedSkills = new Map() // skill -> items picked this round
  const left = () => n - picks.length
  // Picks the best `count` candidates one at a time; a skill already in the round
  // ranks lower each time, so a round spreads over several skills.
  function take(candidates, count, why, extra = {}) {
    const want = Math.min(count, left())
    const pool2 = candidates.filter((q) => !used.has(q.id))
    const out = []
    while (out.length < want && pool2.length) {
      let best = 0
      let bestScore = Infinity
      pool2.forEach((q, i) => {
        const sc = score(q, why) + (usedSkills.get(q.skill) || 0)
        if (sc < bestScore) { bestScore = sc; best = i }
      })
      const [q] = pool2.splice(best, 1)
      used.add(q.id)
      usedSkills.set(q.skill, (usedSkills.get(q.skill) || 0) + 1)
      const pick = { id: q.id, _id: q._id, skill: q.skill, level: q.level, why, support: supportFor(skills.get(q.skill), why), ...extra }
      out.push(pick)
      picks.push(pick)
    }
    return out
  }

  const bySkill = new Map()
  for (const q of items) { if (!bySkill.has(q.skill)) bySkill.set(q.skill, []); bySkill.get(q.skill).push(q) }
  // A skill's items not above `max`, nearest to the served level first.
  const skillItems = (id, max = L) => (bySkill.get(id) || []).filter(notAbove(max))
    .sort((a, b) => Math.abs((a.level ?? L ?? 0) - (L ?? 0)) - Math.abs((b.level ?? L ?? 0) - (L ?? 0)))

  const mix = scaleMix(cfg.round.mix[profile.pace] || cfg.round.mix.steady, n)
  const known = [...skills.values()].filter((s) => !skip.has(s.skill) && bySkill.has(s.skill))

  const prereqFor = new Map() // pick id -> the skill it prepares
  let prereqLeft = mix.prerequisite
  // Easier related items for a skill: its catalogue prerequisites; with no catalogue link,
  // the same skill at an easier level, else anything from the nearest easier level.
  const easierFor = (id) => {
    const viaCatalog = catalog.prerequisites(id).flatMap((p) => skillItems(p))
    if (viaCatalog.length) return viaCatalog
    const easierSame = (bySkill.get(id) || []).filter((q) => q.level != null && L != null && q.level < L)
    if (easierSame.length) return easierSame
    const below = levels.filter((l) => L != null && l < L)
    return below.length ? items.filter((q) => q.level === below[below.length - 1]) : []
  }
  const takeEasier = (id, count) => {
    const got = take(easierFor(id), count, 'prerequisite', { for: id })
    for (const g of got) prereqFor.set(g.id, id)
    prereqLeft -= got.length
  }

  // ── 0. "Practise now": a round centred on one skill (unknown or skipped skill: the normal round) ──
  const focusOn = focusSkill && bySkill.has(focusSkill) ? focusSkill : null
  if (focusOn) {
    const fs = skills.get(focusOn)
    const inSupport = status === 'support' || (!!fs && ((fs.supportStep | 0) >= 3
      || ((fs.attempts || 0) >= cfg.needsPracticeMinAttempts && (fs.mastery || 0) < cfg.needsPracticeBelow)))
    if (inSupport) takeEasier(focusOn, Math.max(1, prereqLeft))
    // Its items at the served level, then easier ones (nearest first); only if the skill has nothing
    // at or below the level, the nearest level above. Items from the last sitting are left out: the
    // normal mix tops up instead.
    const all = bySkill.get(focusOn) || []
    const above = all.filter((q) => q.level != null && L != null && q.level > L).map((q) => q.level)
    const allowed = all.some(notAbove(L)) ? notAbove(L) : (q) => q.level === Math.min(...above)
    const own = all.filter((q) => allowed(q) && !isRecent(q))
    const why = isReviewDue(fs, now) ? 'review' : 'practice'
    const groups = new Map()
    for (const q of own) {
      const k = q.level == null || L == null ? 0 : Math.abs(q.level - L)
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k).push(q)
    }
    for (const k of [...groups.keys()].sort((a, b) => a - b)) take(groups.get(k), left(), why)
  }

  // ── 1. Easier related items: skills at the "easier first" step, or the level in support ──
  for (const s of known.filter((k) => (k.supportStep | 0) === 3 && !isParked(k, now) && k.skill !== focusOn)) {
    if (prereqLeft <= 0) break
    takeEasier(s.skill, 1)
  }
  if (status === 'support' && L != null && prereqLeft > 0) {
    const lower = levels.filter((l) => l < L)
    if (lower.length) take(items.filter((q) => q.level === lower[lower.length - 1]), prereqLeft, 'prerequisite')
  }

  // ── 2. Reviews due (spaced repetition), most overdue first; parked skills come back here ──
  let reviewLeft = mix.review
  for (const s of known.filter((k) => isReviewDue(k, now) && !isParked(k, now)).sort((a, b) => new Date(a.due) - new Date(b.due))) {
    if (reviewLeft <= 0) break
    reviewLeft -= take(skillItems(s.skill, Math.max(L ?? 0, s.level ?? 0)), 1, 'review').length
  }

  // ── 3. Targeted practice: focus skills first, then the weakest skills ──
  const focusHere = focus.filter((f) => bySkill.has(f) && !isParked(skills.get(f), now))
  let practiceLeft = mix.practice + Math.min(2, focusHere.length)
  for (const f of focusHere) {
    if (practiceLeft <= 0) break
    practiceLeft -= take(skillItems(f, L == null ? null : L + 1), Math.min(2, practiceLeft), 'practice').length
  }
  const weakest = known
    .filter((s) => s.attempts > 0 && (s.mastery || 0) < cfg.masteredAt && !isParked(s, now) && !focus.includes(s.skill) && s.skill !== focusOn)
    .sort((a, b) => (a.mastery || 0) - (b.mastery || 0) || new Date(a.lastAt || 0) - new Date(b.lastAt || 0))
  const perSkill = profile.pace === 'gentle' ? 2 : 1 // gentle: more repetition of the same skill
  for (const s of weakest) {
    if (practiceLeft <= 0) break
    practiceLeft -= take(skillItems(s.skill), Math.min(perSkill, practiceLeft), 'practice').length
  }

  // ── 4. Stretch: the next level up, when advancing and not held ──
  if (!hold && status === 'advancing' && L != null) {
    const above = levels.filter((l) => l > L)
    if (above.length) take(items.filter((q) => q.level === above[0]), mix.stretch, 'stretch')
  }

  // ── 5. New: fill up at the served level; one item per new skill first ──
  // (only well-fitting, unseen items here: nothing "young" for an adult, no
  // microphone for someone who chose to type, nothing from the last sitting)
  if (left() > 0) {
    const fresh = items.filter((q) => atLevel(q) && !skills.get(q.skill)?.attempts && !usedSkills.has(q.skill) && !fit(q) && !isRecent(q))
      .sort((a, b) => score(a, 'new') - score(b, 'new'))
    const onePerSkill = []
    const seen = new Set()
    for (const q of fresh) if (!seen.has(q.skill)) { seen.add(q.skill); onePerSkill.push(q) }
    // Gentle pace meets fewer new things per round, brisk more.
    const share = profile.pace === 'gentle' ? 4 : profile.pace === 'brisk' ? 2 : 3
    take(onePerSkill, Math.ceil(n / share), 'new')
  }
  const whyFor = (q) => (skills.get(q.skill)?.attempts ? 'practice' : 'new')
  const takeEach = (cand) => { for (const q of [...cand].sort((a, b) => score(a, whyFor(a)) - score(b, whyFor(b)))) take([q], 1, whyFor(q)) }
  if (left() > 0) {
    // Gentle pace: more of what they already practise before new things; otherwise new first.
    const usable = (q) => !isParked(skills.get(q.skill), now) && !isRecent(q)
    const practised = items.filter((q) => atLevel(q) && usable(q) && skills.get(q.skill)?.attempts)
    const unpractised = items.filter((q) => atLevel(q) && usable(q) && !skills.get(q.skill)?.attempts)
    const sequence = profile.pace === 'gentle' ? [[practised, 'practice'], [unpractised, 'new']] : [[unpractised, 'new'], [practised, 'practice']]
    for (const [cand, why] of sequence) take(cand, left(), why)
  }
  // A small pool: unseen easier items, then (last resort) repeats at the level.
  if (L != null && left() > 0) take(items.filter((q) => q.level != null && q.level < L && !isRecent(q)), left(), 'practice')
  if (left() > 0) takeEach(items.filter(notAbove(L)))

  return { items: sequenceRound(picks, prereqFor, rng), level, servedLevel: L, ceiling, status, focus: focusOn }
}

// Order: start with something familiar, an easier item right before the skill
// it prepares, the stretch item about two thirds in, never first or last.
function sequenceRound(picks, prereqFor, rng) {
  const prereqs = picks.filter((p) => p.why === 'prerequisite')
  const stretch = picks.filter((p) => p.why === 'stretch')
  const reviews = picks.filter((p) => p.why === 'review')
  const middle = rng.shuffle([...reviews.slice(1), ...picks.filter((p) => !['prerequisite', 'stretch', 'review'].includes(p.why))])
  const out = [...reviews.slice(0, 1)]
  for (const p of prereqs) {
    out.push(p)
    const target = prereqFor.get(p.id)
    const i = target ? middle.findIndex((m) => m.skill === target) : -1
    if (i >= 0) out.push(...middle.splice(i, 1))
  }
  out.push(...middle)
  for (const s of stretch) out.splice(Math.max(1, Math.min(out.length - 1, Math.round(out.length * 0.66))), 0, s)
  if (out.length > 1 && out[out.length - 1].why === 'stretch') {
    const j = [...out.keys()].reverse().find((k) => out[k].why !== 'stretch')
    if (j != null) [out[out.length - 1], out[j]] = [out[j], out[out.length - 1]]
  }
  if (out.length > 1 && out[0].why === 'stretch') {
    const j = out.findIndex((p) => p.why !== 'stretch')
    if (j > 0) [out[0], out[j]] = [out[j], out[0]]
  }
  return out
}

module.exports = { composeRound, supportFor, servedLevel, scaleMix }
