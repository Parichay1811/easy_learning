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
//
// Adaptive journey (config: probe, targetBand, challenge, discovery):
//   probe      the first contact with a skill: up to probe.items items, the most
//              accessible (lowest stage) first, then one at stage >= 2 when there is
//              one, so a confident start can show (why "probe");
//   tilt       the target band of the subject: "easier" adds a warm-up from the level
//              below, drops the stretch, meets fewer new skills and prefers lower stages;
//              "harder" adds a stretch item (only at "practice" or "advancing", never held), more new
//              skills, higher stages first; "hold" changes nothing;
//   per skill  a confident probe skips beginner practice until it is due and prefers
//              stage >= 2; a gentle one prefers the lowest stages;
//   modes      "challenge": 3 items one stage up on a strong skill (why "challenge");
//              "discovery": everyday-curiosity items (why "discovery").
const cfg = require('../../config/learning')
const { createRng } = require('./rng')
const { isReviewDue } = require('./spacing')
const { strategyFor, isParked } = require('./support')
const { isMastered } = require('./mastery')

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
 * @param {string} a.tilt     target band tilt of the subject: 'easier' | 'harder' | 'hold'
 * @param {string} a.mode     null | 'challenge' | 'discovery'
 * -> { items: [{ id, _id, skill, level, stage, why, support, for? }], level, servedLevel, ceiling, status, focus, challenge? }
 */
function composeRound({ pool, subject, module, level, status = 'new', skills = new Map(), profile = {}, catalog, size = cfg.round.defaultSize, seed = 'x', now = new Date(), focusSkill = null, tilt = 'hold', mode = null }) {
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
  // Stage preference. Per skill (strong: within that skill, items come in stage order): a gentle
  // probe takes its lowest stages first, a confident one its highest. Per round (soft, a tilt
  // among the random ranks): "easier" prefers low stages, "harder" high ones.
  const stageRange = new Map()
  for (const q of items) {
    if (!Number.isInteger(q.stage)) continue
    const r = stageRange.get(q.skill) || { min: q.stage, max: q.stage }
    stageRange.set(q.skill, { min: Math.min(r.min, q.stage), max: Math.max(r.max, q.stage) })
  }
  const stageBias = (q) => {
    if (!Number.isInteger(q.stage)) return 0
    const st = skills.get(q.skill)?.probe?.state
    const r = stageRange.get(q.skill)
    if (st === 'gentle') return q.stage - r.min
    if (st === 'confident') return r.max - q.stage
    return tilt === 'easier' ? q.stage * 0.15 : tilt === 'harder' ? (5 - q.stage) * 0.15 : 0
  }
  const score = (q, why) => fit(q) * 1000 + (why !== 'review' && isRecent(q) ? 100 : 0) + rank.get(q.id) + stageBias(q)

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
      const pick = { id: q.id, _id: q._id, skill: q.skill, level: q.level, stage: Number.isInteger(q.stage) ? q.stage : null, graded: q.graded !== false, why, support: supportFor(skills.get(q.skill), why), ...extra }
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
  if (tilt === 'easier') { mix.stretch = 0; mix.prerequisite += 1 }
  if (tilt === 'harder') mix.stretch += 1
  const known = [...skills.values()].filter((s) => !skip.has(s.skill) && bySkill.has(s.skill))

  // ── Modes: a mini challenge or a discovery round ──
  if (mode === 'challenge') {
    // A strong skill: mastery >= challenge.minMastery, mastered, or a confident probe.
    const strong = (s) => !!s && (s.attempts || 0) > 0 && !isParked(s, now)
      && ((s.mastery || 0) >= cfg.challenge.minMastery || isMastered(s) || s.probe?.state === 'confident')
    const up = (s) => (Number.isInteger(s.topStage) ? s.topStage : 1) + 1
    // graded items only: a challenge is there to show something (practice-only items never count)
    const stageUp = (s) => (bySkill.get(s.skill) || []).filter((q) => q.graded !== false && Number.isInteger(q.stage) && q.stage >= up(s) && (L == null || q.level == null || q.level <= L + 1))
    let target = focusSkill && strong(skills.get(focusSkill)) && stageUp(skills.get(focusSkill)).length ? skills.get(focusSkill) : null
    if (!target) {
      target = known.filter((s) => strong(s) && stageUp(s).length)
        .sort((a, b) => (b.mastery || 0) - (a.mastery || 0) || new Date(b.lastAt || 0) - new Date(a.lastAt || 0) || (a.skill < b.skill ? -1 : 1))[0] || null
    }
    if (!target) return { ...empty, items: [], servedLevel: L, challenge: null }
    const want = Math.min(n, cfg.challenge.items)
    const groups = new Map()
    for (const q of stageUp(target)) { if (!groups.has(q.stage)) groups.set(q.stage, []); groups.get(q.stage).push(q) }
    for (const st of [...groups.keys()].sort((a, b) => a - b)) if (picks.length < want) take(groups.get(st), want - picks.length, 'challenge')
    return { items: picks, level, servedLevel: L, ceiling, status, focus: target.skill, challenge: { skill: target.skill, stage: up(target) } }
  }
  if (mode === 'discovery') {
    const everyday = items.filter((q) => q.everyday)
    take(everyday.filter((q) => !fit(q) && !isRecent(q)), n, 'discovery')
    if (left() > 0) take(everyday, left(), 'discovery')
    return { items: rng.shuffle(picks), level, servedLevel: L, ceiling, status, focus: null }
  }

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
  if ((status === 'support' || tilt === 'easier') && L != null && prereqLeft > 0) {
    const lower = levels.filter((l) => l < L)
    if (lower.length) take(items.filter((q) => q.level === lower[lower.length - 1]), status === 'support' ? prereqLeft : 1, 'prerequisite')
  }

  // ── 2. Reviews due (spaced repetition), most overdue first; parked skills come back here ──
  let reviewLeft = mix.review
  for (const s of known.filter((k) => isReviewDue(k, now) && !isParked(k, now)).sort((a, b) => new Date(a.due) - new Date(b.due))) {
    if (reviewLeft <= 0) break
    reviewLeft -= take(skillItems(s.skill, Math.max(L ?? 0, s.level ?? 0)), 1, 'review').length
  }

  // ── 2b. Probes still open (one probe answered): one more, at stage >= 2 when there is one ──
  const cs = cfg.probe.confidentStage
  const pending = known.filter((k) => k.probe?.state === 'pending' && !isParked(k, now) && k.skill !== focusOn)
  for (const s of pending.slice(0, 2)) {
    const all = skillItems(s.skill).filter((q) => !isRecent(q))
    const cand = all.some((q) => q.graded !== false) ? all.filter((q) => q.graded !== false) : all
    const high = cand.filter((q) => Number.isInteger(q.stage) && q.stage >= cs)
    take(high.length ? high : cand, 1, 'probe')
  }
  // A confident start skips beginner practice until the skill is due.
  const skipBeginner = (s) => s.probe?.state === 'confident' && !isReviewDue(s, now) && !(s.missesSinceSuccess > 0)

  // ── 3. Targeted practice: focus skills first, then the weakest skills ──
  const focusHere = focus.filter((f) => bySkill.has(f) && !isParked(skills.get(f), now))
  let practiceLeft = mix.practice + Math.min(2, focusHere.length)
  for (const f of focusHere) {
    if (practiceLeft <= 0) break
    practiceLeft -= take(skillItems(f, L == null ? null : L + 1), Math.min(2, practiceLeft), 'practice').length
  }
  const weakest = known
    .filter((s) => s.attempts > 0 && (s.mastery || 0) < cfg.masteredAt && !isParked(s, now) && !focus.includes(s.skill) && s.skill !== focusOn
      && s.probe?.state !== 'pending' && !skipBeginner(s))
    .sort((a, b) => (a.mastery || 0) - (b.mastery || 0) || new Date(a.lastAt || 0) - new Date(b.lastAt || 0))
  const perSkill = profile.pace === 'gentle' ? 2 : 1 // gentle: more repetition of the same skill
  for (const s of weakest) {
    if (practiceLeft <= 0) break
    practiceLeft -= take(skillItems(s.skill), Math.min(perSkill, practiceLeft), 'practice').length
  }

  // ── 4. Stretch: the next level up, when advancing and not held ──
  if (!hold && (status === 'advancing' || (tilt === 'harder' && status === 'practice')) && L != null) {
    const above = levels.filter((l) => l > L)
    // Advancing: the pace's stretch places (+1 when "harder"); practising but above the band: one.
    if (above.length) take(items.filter((q) => q.level === above[0]), status === 'advancing' ? mix.stretch : 1, 'stretch')
  }

  // ── 5. New skills: a probe of up to probe.items items each, the most accessible first ──
  // (only well-fitting, unseen items here: nothing "young" for an adult, no
  // microphone for someone who chose to type, nothing from the last sitting)
  if (left() > 0) {
    const fresh = items.filter((q) => atLevel(q) && !skills.get(q.skill)?.attempts && !usedSkills.has(q.skill) && !fit(q) && !isRecent(q))
    const groups = new Map()
    for (const q of fresh) { if (!groups.has(q.skill)) groups.set(q.skill, []); groups.get(q.skill).push(q) }
    // A probe needs answers that count: a skill's practice-only items only when it has nothing else.
    for (const [id, list] of groups) if (list.some((q) => q.graded !== false)) groups.set(id, list.filter((q) => q.graded !== false))
    const byStage = (a, b) => (a.stage ?? 9) - (b.stage ?? 9) || score(a, 'probe') - score(b, 'probe')
    for (const list of groups.values()) list.sort(byStage)
    const order = [...groups.keys()].sort((a, b) => Math.min(...groups.get(a).map((q) => score(q, 'probe'))) - Math.min(...groups.get(b).map((q) => score(q, 'probe'))))
    // Gentle pace (or an "easier" tilt) meets fewer new things per round, brisk (or "harder") more.
    const lean = tilt === 'easier' ? 'gentle' : tilt === 'harder' ? 'brisk' : profile.pace
    const share = lean === 'gentle' ? 4 : lean === 'brisk' ? 2 : 3
    const wantSkills = Math.max(1, Math.ceil(Math.ceil(n / share) / cfg.probe.items))
    for (const id of order.slice(0, wantSkills)) {
      if (left() <= 0) break
      const list = groups.get(id)
      const first = list[0]
      const second = cfg.probe.items > 1
        ? (list.find((q) => q !== first && Number.isInteger(q.stage) && q.stage >= cs && !((first.stage ?? -1) >= cs)) || list.find((q) => q !== first))
        : null
      take([first], 1, 'probe')
      if (second) take([second], 1, 'probe')
    }
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

  // The first items of a skill never seen are its probe (up to probe.items), wherever they came from.
  const probes = new Map()
  for (const p of picks) if (p.why === 'probe') probes.set(p.skill, (probes.get(p.skill) || 0) + 1)
  for (const p of picks) {
    if (p.why !== 'new' || skills.get(p.skill)?.attempts || !p.graded) continue
    const c = probes.get(p.skill) || 0
    if (c < cfg.probe.items) { p.why = 'probe'; probes.set(p.skill, c + 1) }
  }

  return { items: probeOrder(sequenceRound(picks, prereqFor, rng)), level, servedLevel: L, ceiling, status, focus: focusOn }
}

// Within each skill, its probe items come before its other new items, lowest stage first
// (the places in the round stay; only which item of that skill sits where changes).
function probeOrder(list) {
  const out = [...list]
  const bySkill = new Map()
  out.forEach((p, i) => { if (p.why === 'probe' || p.why === 'new') { if (!bySkill.has(p.skill)) bySkill.set(p.skill, []); bySkill.get(p.skill).push(i) } })
  for (const idx of bySkill.values()) {
    if (idx.length < 2) continue
    const sorted = idx.map((i) => out[i]).sort((a, b) => (a.why === 'probe' ? 0 : 1) - (b.why === 'probe' ? 0 : 1) || (a.stage ?? 9) - (b.stage ?? 9))
    idx.forEach((i, k) => { out[i] = sorted[k] })
  }
  return out
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

module.exports = { composeRound, supportFor, servedLevel, scaleMix, probeOrder }
