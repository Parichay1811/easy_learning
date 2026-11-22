// Unit tests for round composition, baseline placement, input validation and
// simulated learners over many sessions (no database).
require('./helpers') // no database connections
const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const cfg = require('../config/learning')
const { composeRound } = require('../services/learning/round')
const { buildCatalog, EMPTY } = require('../services/learning/catalog')
const { pickBaselineItems, placeLevel } = require('../services/learning/baseline')
const { learnerUpdate, adultUpdate } = require('../services/learning/validate')
const { classifyAttempt } = require('../services/learning/mastery')
const { applyAttempt } = require('../services/learning/engine')
const { freshLevel, evaluateLevel } = require('../services/learning/levelPolicy')
const { createRng } = require('../services/learning/rng')

const DAY = 86400000
const NOW = new Date('2026-11-20T10:00:00Z')
const ago = (days) => new Date(NOW.getTime() - days * DAY)

// A synthetic pool: per level, `skills` skills with `per` items each.
function makePool({ levels = [0, 1, 2, 3, 4, 5], skills = 3, per = 4, young = () => false, mic = () => false, verified = () => true } = {}) {
  const pool = []
  for (const level of levels) {
    for (let s = 0; s < skills; s++) {
      for (let i = 0; i < per; i++) {
        const id = `L${level}-S${s}-I${i}`
        pool.push({ id, _id: id, level, skill: `maths.l${level}-s${s}`, ageBand: young(level, s, i) ? 'young' : 'all', interaction: mic(level, s, i) ? 'mic_record' : 'tap_mcq', graded: true, verified: verified(level, s, i), qaStatus: 'verified' })
      }
    }
  }
  return pool
}
const skillRow = (skill, extra) => ({ skill, subject: 'maths', attempts: 5, mastery: 0.5, box: 0, due: ago(0), supportStep: 0, ...extra })
const round = (over = {}) => composeRound({ pool: makePool(), subject: 'maths', module: 'read', level: 1, status: 'new', skills: new Map(), profile: { pace: 'steady' }, catalog: EMPTY, size: 10, seed: 's1', now: NOW, ...over })
const whys = (r) => r.items.map((i) => i.why)

test('beginner: a full round at their level, several new skills, deterministic per seed', () => {
  const r = round()
  assert.equal(r.items.length, 10)
  assert.ok(r.items.every((i) => i.level === 1))
  // Every skill is new: its first items (up to probe.items) are a diagnostic probe, the rest new.
  assert.ok(r.items.every((i) => i.why === 'probe' || i.why === 'new'))
  for (const sk of new Set(r.items.map((i) => i.skill))) {
    const mine = r.items.filter((i) => i.skill === sk)
    assert.ok(mine.filter((i) => i.why === 'probe').length <= cfg.probe.items, sk)
    assert.equal(mine[0].why, 'probe', 'a probe comes first')
  }
  assert.ok(new Set(r.items.map((i) => i.skill)).size >= 3)
  assert.ok(r.items.every((i) => i.support.step === 0 && i.support.strategy === 'words'))
  assert.deepEqual(round().items.map((i) => i.id), r.items.map((i) => i.id), 'same seed, same round')
  assert.notDeepEqual(round({ seed: 's2' }).items.map((i) => i.id), r.items.map((i) => i.id))
  assert.equal(r.ceiling, 5)
  assert.equal(new Set(r.items.map((i) => i.id)).size, 10, 'no duplicates')
})

test('advancing learner: reviews due, weakest skills, exactly one stretch item from the next level (never first or last)', () => {
  const skills = new Map([
    ['maths.l2-s0', skillRow('maths.l2-s0', { box: 2, due: ago(1), mastery: 0.9, level: 2 })],
    ['maths.l3-s0', skillRow('maths.l3-s0', { mastery: 0.3, level: 3 })],
    ['maths.l3-s1', skillRow('maths.l3-s1', { mastery: 0.6, level: 3, supportStep: 1 })],
  ])
  const r = round({ level: 3, status: 'advancing', skills })
  assert.equal(r.items.length, 10)
  const stretch = r.items.filter((i) => i.why === 'stretch')
  assert.equal(stretch.length, 1)
  assert.equal(stretch[0].level, 4)
  assert.notEqual(r.items[0].why, 'stretch'); assert.notEqual(r.items[9].why, 'stretch')
  assert.ok(r.items.every((i) => i.level <= 3 || i.why === 'stretch'))
  const review = r.items.find((i) => i.why === 'review')
  assert.equal(review.skill, 'maths.l2-s0')
  assert.equal(r.items[0].why, 'review', 'a familiar start')
  const practice = r.items.filter((i) => i.why === 'practice').map((i) => i.skill)
  assert.ok(practice.includes('maths.l3-s0') && practice.includes('maths.l3-s1'))
  assert.deepEqual(r.items.find((i) => i.skill === 'maths.l3-s1').support, { step: 1, strategy: 'visual' })
  // not advancing: no stretch
  assert.equal(whys(round({ level: 3, status: 'practice', skills })).filter((w) => w === 'stretch').length, 0)
})

test('pace: brisk gets more stretch and new items; gentle repeats more before new things', () => {
  const skills = new Map([['maths.l3-s0', skillRow('maths.l3-s0', { mastery: 0.3, level: 3 })], ['maths.l3-s1', skillRow('maths.l3-s1', { mastery: 0.5, level: 3 })]])
  const brisk = round({ level: 3, status: 'advancing', skills, profile: { pace: 'brisk' } })
  const gentle = round({ level: 3, status: 'advancing', skills, profile: { pace: 'gentle' } })
  assert.equal(whys(brisk).filter((w) => w === 'stretch').length, 2)
  assert.equal(whys(gentle).filter((w) => w === 'stretch').length, 1)
  const count = (r, w) => whys(r).filter((x) => x === w).length
  assert.ok(count(gentle, 'practice') > count(brisk, 'practice'), `${count(gentle, 'practice')} vs ${count(brisk, 'practice')}`)
  assert.ok(count(gentle, 'new') < count(brisk, 'new'))
  assert.ok(gentle.items.filter((i) => i.skill === 'maths.l3-s0').length >= 2, 'gentle: the weakest skill more than once')
  assert.ok(gentle.items.filter((i) => i.skill === 'maths.l3-s0').length > brisk.items.filter((i) => i.skill === 'maths.l3-s0').length)
})

test('adult / teen: items themed for young children are avoided when enough others exist', () => {
  const pool = makePool({ skills: 4, per: 5, young: (l, s) => s < 2 }) // half of every level is "young"
  const adult = round({ pool, profile: { pace: 'steady', ageBand: 'adult' } })
  assert.equal(adult.items.length, 10)
  assert.ok(adult.items.every((i) => pool.find((q) => q.id === i.id).ageBand === 'all'))
  const teen = round({ pool, profile: { ageBand: 'teen' } })
  assert.ok(teen.items.every((i) => pool.find((q) => q.id === i.id).ageBand === 'all'))
  // not enough others: young items fill in rather than an empty round
  const mostlyYoung = makePool({ skills: 3, per: 4, young: (l, s) => s > 0 })
  const r = round({ pool: mostlyYoung, profile: { ageBand: 'adult' } })
  assert.equal(r.items.length, 10)
  assert.ok(r.items.slice(0, 4).length)
  assert.equal(r.items.filter((i) => mostlyYoung.find((q) => q.id === i.id).ageBand === 'all').length, 4, 'every non-young item at the level is used first')
})

test('accommodated learner: chose to type -> no microphone items when others exist; level and status unchanged', () => {
  const pool = makePool({ skills: 4, per: 4, mic: (l, s) => s === 0 })
  const r = round({ pool, profile: { pace: 'steady', supports: { speakInstead: 'type', timer: 'off', font: 'dyslexic' } } })
  assert.equal(r.items.length, 10)
  assert.ok(r.items.every((i) => pool.find((q) => q.id === i.id).interaction !== 'mic_record'))
  assert.equal(r.level, 1)
  assert.equal(r.items.every((i) => i.level === 1), true, 'accommodations never change the level served')
  const speak = round({ pool, module: 'speak', profile: { supports: { speakInstead: 'type' } } })
  assert.ok(speak.items.some((i) => pool.find((q) => q.id === i.id).interaction === 'mic_record'), 'the speak module keeps speaking')
})

test('empty pool and content ceiling', () => {
  const empty = round({ pool: [] })
  assert.deepEqual([empty.items.length, empty.ceiling, empty.servedLevel], [0, null, null])
  const capped = round({ level: 7, status: 'advancing', pool: makePool({ levels: [1, 2, 3, 4, 5] }) })
  assert.equal(capped.ceiling, 5)
  assert.equal(capped.servedLevel, 5)
  assert.ok(capped.items.every((i) => i.level <= 5))
  assert.equal(capped.level, 7, 'the learner keeps their level; only what is served is capped')
  const gap = round({ level: 3, pool: makePool({ levels: [1, 2, 5] }) })
  assert.equal(gap.servedLevel, 2, 'nearest level with content, below first')
  const unlevelled = round({ pool: makePool({ levels: [1] }).map((q) => ({ ...q, level: null })) })
  assert.equal(unlevelled.items.length, 10)
  assert.equal(unlevelled.ceiling, null)
  const tiny = round({ pool: makePool({ levels: [1], skills: 1, per: 3 }) })
  assert.equal(tiny.items.length, 3, 'a small pool gives a short round, never duplicates')
})

test('support: an easier related item (catalogue prerequisite) comes right before the skill it prepares', () => {
  const catalog = buildCatalog({ skills: [{ id: 'maths.l2-s1', subject: 'maths', name: 'Adding', level: 2, prerequisites: [] }, { id: 'maths.l3-s0', subject: 'maths', name: 'Taking away', level: 3, prerequisites: ['maths.l2-s1'] }] })
  const skills = new Map([['maths.l3-s0', skillRow('maths.l3-s0', { mastery: 0.2, supportStep: 3, level: 3 })]])
  const r = round({ level: 3, status: 'practice', skills, catalog })
  const i = r.items.findIndex((x) => x.why === 'prerequisite')
  assert.ok(i >= 0)
  assert.equal(r.items[i].skill, 'maths.l2-s1')
  assert.equal(r.items[i].for, 'maths.l3-s0')
  assert.equal(r.items[i + 1].skill, 'maths.l3-s0')
  assert.deepEqual(r.items[i + 1].support, { step: 2, strategy: 'guided' })
  // no catalogue: an easier item of the same skill or level
  const r2 = round({ level: 3, status: 'practice', skills })
  assert.ok(r2.items.find((x) => x.why === 'prerequisite').level < 3)
  // the whole level in support: warm-ups from the level below
  const r3 = round({ level: 3, status: 'support' })
  assert.ok(r3.items.filter((x) => x.why === 'prerequisite').every((x) => x.level === 2))
  assert.ok(r3.items.some((x) => x.why === 'prerequisite'))
})

test('parked skills rest until due, then come back to be reassessed', () => {
  const parked = skillRow('maths.l1-s0', { supportStep: 4, parkedUntil: new Date(NOW.getTime() + DAY), box: 1, due: new Date(NOW.getTime() + DAY), mastery: 0.1 })
  const r = round({ skills: new Map([['maths.l1-s0', parked]]) })
  assert.ok(!r.items.some((i) => i.skill === 'maths.l1-s0' && i.why !== 'new'), 'not practised while parked')
  const back = { ...parked, parkedUntil: ago(0.1), due: ago(0.1) }
  const r2 = round({ skills: new Map([['maths.l1-s0', back]]) })
  const item = r2.items.find((i) => i.skill === 'maths.l1-s0')
  assert.equal(item.why, 'review')
  assert.deepEqual(item.support, { step: 4, strategy: 'reassess' })
})

test('guardian/teacher overrides: skip a skill, focus a skill, hold the level', () => {
  const skip = round({ profile: { overrides: [{ type: 'skip_skill', skill: 'maths.l1-s0' }] } })
  assert.ok(!skip.items.some((i) => i.skill === 'maths.l1-s0'))
  const focus = round({ level: 2, profile: { overrides: [{ type: 'focus_skill', skill: 'maths.l1-s2' }] } })
  assert.ok(focus.items.filter((i) => i.skill === 'maths.l1-s2' && i.why === 'practice').length >= 1)
  const held = round({ level: 3, status: 'advancing', profile: { overrides: [{ type: 'hold_level', subject: 'maths' }] } })
  assert.equal(whys(held).filter((w) => w === 'stretch').length, 0)
  const otherSubjectHold = round({ level: 3, status: 'advancing', profile: { overrides: [{ type: 'hold_level', subject: 'english' }] } })
  assert.equal(whys(otherSubjectHold).filter((w) => w === 'stretch').length, 1)
})

test('items answered in the last sitting are not repeated (unless it is a review)', () => {
  const first = round({ seed: 'a' })
  const recent = first.items.map((i) => ({ q: i.id, at: ago(0.1) }))
  // 2 unseen items at the level + unseen easier items: no repeats at all
  const second = round({ seed: 'a', profile: { recent } })
  assert.equal(second.items.length, 10)
  assert.equal(second.items.filter((i) => recent.some((r) => r.q === i.id)).length, 0)
  assert.equal(second.items.filter((i) => i.level === 1).length, 2)
  // only the level itself: repeats only as a last resort
  const small = makePool({ levels: [1] })
  const s1 = round({ pool: small, seed: 'a' })
  const s2 = round({ pool: small, seed: 'a', profile: { recent: s1.items.map((i) => ({ q: i.id, at: ago(0.1) })) } })
  assert.equal(s2.items.length, 10)
  assert.deepEqual(s2.items.slice(0, 10).filter((i) => !s1.items.some((x) => x.id === i.id)).length, 2)
  // a day later they may come back
  const old = first.items.map((i) => ({ q: i.id, at: ago(2) }))
  assert.deepEqual(round({ seed: 'a', profile: { recent: old } }).items.map((i) => i.id), first.items.map((i) => i.id))
  // a review is a review even if seen lately
  const due = new Map([['maths.l1-s0', skillRow('maths.l1-s0', { box: 1, due: ago(0.5), level: 1, mastery: 0.9 })]])
  const seen = makePool().filter((q) => q.skill === 'maths.l1-s0').map((q) => ({ q: q.id, at: ago(0.1) }))
  assert.equal(round({ skills: due, profile: { recent: seen } }).items.filter((i) => i.why === 'review').length, 1)
})

// ── Baseline placement ──────────────────────────────────────────────────────
test('baseline: one graded item per level, easiest first, verified and non-speaking preferred', () => {
  const pool = makePool({ skills: 2, per: 3, mic: (l, s) => s === 0, verified: (l, s, i) => i > 0 })
  const items = pickBaselineItems(pool, { module: 'read', seed: 'x' })
  assert.deepEqual(items.map((i) => i.level), [0, 1, 2, 3, 4, 5])
  assert.ok(items.every((i) => i.verified && i.interaction !== 'mic_record'))
  const ungraded = pickBaselineItems(pool.map((q) => (q.level === 2 ? { ...q, graded: false } : q)), { module: 'read' })
  assert.deepEqual(ungraded.map((i) => i.level), [0, 1, 3, 4, 5])
})

test('placement: highest level right before the second miss; uncertain and close never push down', () => {
  const r = (pairs) => pairs.map(([level, status]) => ({ level, status }))
  assert.equal(placeLevel(r([[0, 'correct'], [1, 'correct'], [2, 'incorrect'], [3, 'correct'], [4, 'incorrect'], [5, 'correct']])), 3)
  assert.equal(placeLevel(r([[0, 'incorrect'], [1, 'incorrect'], [2, 'correct']])), 0)
  assert.equal(placeLevel(r([[0, 'correct'], [1, 'uncertain'], [2, 'correct'], [3, 'close'], [4, 'incorrect'], [5, 'incorrect']])), 2)
  assert.equal(placeLevel(r([[0, 'correct'], [1, 'correct'], [2, 'correct'], [3, 'correct'], [4, 'correct'], [5, 'correct']])), 5)
  assert.equal(placeLevel([]), 0)
})

// ── Validation ──────────────────────────────────────────────────────────────
test('learner input is validated strictly', () => {
  assert.deepEqual(learnerUpdate({ levels: { maths: 3 }, pace: 'gentle', ageBand: 'adult' }).errors, [])
  for (const v of [9, -1, 2.5, '3', null]) assert.ok(learnerUpdate({ levels: { maths: v } }).errors.length, String(v))
  assert.ok(learnerUpdate({ levels: { maths: { level: 3, locked: true } } }).errors.length, 'learners cannot lock')
  assert.ok(learnerUpdate({ levels: { history: 3 } }).errors.length)
  assert.ok(learnerUpdate({ role: 'admin' }).errors.length)
  assert.ok(learnerUpdate({ pace: 'fast' }).errors.length)
  assert.ok(learnerUpdate({ supports: { diagnosis: 'x' } }).errors.length, 'only known settings')
  assert.ok(learnerUpdate({ supports: { voiceRate: 3 } }).errors.length)
  assert.ok(learnerUpdate({ supports: { font: 'comic' } }).errors.length)
  assert.deepEqual(learnerUpdate({ supports: { font: 'dyslexic', voiceRate: 0.8, breakEvery: 15, focusMode: true } }).value.supports, { font: 'dyslexic', voiceRate: 0.8, breakEvery: 15, focusMode: true })
  assert.ok(learnerUpdate({ goals: Array(11).fill({ text: 'x' }) }).errors.length)
  assert.ok(learnerUpdate({ goals: [{ text: 'x'.repeat(200) }] }).errors.length)
  const g = learnerUpdate({ goals: [{ text: ' Read <b>every</b> day ', subject: 'english', target: 5 }] })
  assert.deepEqual(g.errors, [])
  assert.equal(g.value.goals[0].text, 'Read every day')
  assert.ok(learnerUpdate('nope').errors.length)
})

test('guardian/teacher input is validated strictly', () => {
  const ok = adultUpdate({ levels: { maths: { level: 4, locked: true }, english: 2 }, overrides: [{ type: 'hold_level', subject: 'maths' }, { type: 'focus_skill', skill: 'maths.subtraction-within-10' }] }, 'guardian')
  assert.deepEqual(ok.errors, [])
  assert.deepEqual(ok.value.levels, { maths: { level: 4, locked: true }, english: { level: 2 } })
  assert.equal(ok.value.overrides[1].by, 'guardian')
  assert.ok(adultUpdate({ levels: { maths: { locked: 'yes' } } }).errors.length)
  assert.ok(adultUpdate({ levels: { maths: { level: 9 } } }).errors.length)
  assert.ok(adultUpdate({ levels: { maths: {} } }).errors.length)
  assert.ok(adultUpdate({ levels: { maths: { level: 2, color: 'red' } } }).errors.length)
  assert.ok(adultUpdate({ overrides: [{ type: 'hold_level' }] }).errors.length, 'hold needs a subject')
  assert.ok(adultUpdate({ overrides: [{ type: 'skip_skill', skill: 'Bad Skill!' }] }).errors.length)
  assert.ok(adultUpdate({ overrides: [{ type: 'lower_level', subject: 'maths' }] }).errors.length)
  assert.ok(adultUpdate({ overrides: Array(31).fill({ type: 'hold_level', subject: 'maths' }) }).errors.length)
  assert.ok(adultUpdate({ diagnosis: 'dyslexia' }).errors.length, 'no diagnosis field exists')
})

test('server support settings mirror the client PREF_FIELDS exactly', async () => {
  const { PREF_FIELDS } = await import(path.join(__dirname, '..', '..', 'client', 'src', 'utils', 'learnerPrefs.js'))
  const client = PREF_FIELDS.map((f) => ({ key: f.key, type: f.type, ...(f.type === 'range' ? { min: f.min, max: f.max } : {}), ...(f.type === 'choice' ? { options: f.options } : {}) }))
  assert.deepEqual(cfg.SUPPORT_FIELDS, client)
})

// ── Simulated learners over many sessions ───────────────────────────────────
// A learner with a true ability per level answers rounds day after day; the
// pure engine core decides. Checks the long-run behaviour of the policy.
function simulate({ ability, startLevel = 1, days = 30, perDay = 10, locked = false, ceiling = 5, seed = 'sim' }) {
  const rng = createRng(seed)
  let profile = { levels: { maths: { ...freshLevel(startLevel, locked ? 'guardian' : 'default'), locked, lockedBy: locked ? 'guardian' : null } }, suggestions: [] }
  const skills = new Map()
  const levels = []
  let lowered = false
  for (let d = 0; d < days; d++) {
    for (let k = 0; k < perDay; k++) {
      const now = new Date(Date.UTC(2026, 9, 1 + d, 9, k))
      const L = profile.levels.maths.level
      const itemLevel = k === perDay - 1 && L < ceiling ? L + 1 : L // one stretch item a day
      const skill = `maths.l${itemLevel}-s${k % 3}`
      const right = rng.next() < ability(itemLevel)
      const cls = classifyAttempt({ status: right ? 'correct' : 'incorrect', firstTry: true, hintsUsed: 0 })
      const out = applyAttempt(profile, skills.get(skill) || null, { outcome: cls.outcome, subject: 'maths', module: 'read', skill, skillName: skill, itemLevel, date: now.toISOString().slice(0, 10), now, ceiling })
      if (out.profile.levels.maths.level < L) lowered = true
      profile = out.profile
      skills.set(skill, out.skill)
    }
    levels.push(profile.levels.maths.level)
  }
  return { levels, profile, lowered, skills }
}

test('simulation: a capable learner climbs gradually to where they are challenged, then settles', () => {
  const sim = simulate({ ability: (l) => (l <= 3 ? 0.97 : 0.45) })
  assert.equal(sim.lowered, false)
  // Level 3 is easy for them, so they reach 4 (their challenge) and stay: never pushed back, only offered a step back.
  assert.equal(sim.levels[sim.levels.length - 1], 4)
  assert.ok(sim.levels.every((l) => l <= 4))
  assert.ok(sim.profile.suggestions.some((s) => s.type === 'level_down' && s.to === 3))
  assert.ok(sim.levels[0] <= 2, 'no jump on day one (needs two days)')
  for (let i = 1; i < sim.levels.length; i++) assert.ok(sim.levels[i] - sim.levels[i - 1] <= 1, 'one level at a time')
  assert.notEqual(evaluateLevel(sim.profile.levels.maths, { ceiling: 5 }).action, 'advance')
})

test('simulation: a struggling learner is never moved down; they get a suggestion instead', () => {
  const sim = simulate({ ability: () => 0.35, startLevel: 3 })
  assert.equal(sim.lowered, false)
  assert.ok(sim.levels.every((l) => l === 3))
  assert.ok(sim.profile.suggestions.some((s) => s.type === 'level_down'))
  assert.ok([...sim.skills.values()].some((s) => s.supportStep > 0), 'the teaching approach changed')
})

test('simulation: a locked level never moves; a top learner stops at the content ceiling', () => {
  const lockedSim = simulate({ ability: () => 0.99, startLevel: 2, locked: true })
  assert.ok(lockedSim.levels.every((l) => l === 2))
  assert.equal(lockedSim.profile.suggestions.filter((s) => s.type === 'level_up').length, 1)
  const top = simulate({ ability: () => 0.99, startLevel: 1, days: 40, ceiling: 4 })
  assert.equal(top.levels[top.levels.length - 1], 4)
  assert.ok(top.levels.every((l) => l <= 4))
})

// ── "Practise now": ?skill= ────────────────────────────────────────────────
test('focus skill: the round centres on that skill at the level, then the normal mix tops up', () => {
  const r = round({ seed: 'f', focusSkill: 'maths.l1-s1' })
  assert.equal(r.focus, 'maths.l1-s1')
  assert.equal(r.items.length, 10)
  assert.equal(r.items.filter((i) => i.skill === 'maths.l1-s1').length, 4, 'all four of its items')
  assert.ok(r.items.filter((i) => i.skill === 'maths.l1-s1').every((i) => i.why === 'practice' && i.level === 1))
  assert.ok(r.items.every((i) => i.level <= 1), 'top-up is the normal mix: nothing above the level')
  // a skill at several levels: its items at the served level and easier, never above while those exist
  const pool = [...makePool({ levels: [1, 2, 3], skills: 2, per: 2 }), ...[1, 2, 3].flatMap((l) => [0, 1, 2].map((i) => ({ id: `F${l}-${i}`, _id: `F${l}-${i}`, level: l, skill: 'maths.focus', ageBand: 'all', interaction: 'tap_mcq' })))]
  const r2 = round({ pool, level: 2, seed: 'f', focusSkill: 'maths.focus' })
  const own = r2.items.filter((i) => i.skill === 'maths.focus')
  assert.deepEqual(own.map((i) => i.level).sort(), [1, 1, 1, 2, 2, 2])
  // its items at the level were just seen: no jump above the level, the normal mix fills in
  const r3 = round({ pool, level: 1, seed: 'f', focusSkill: 'maths.focus', profile: { recent: ['F1-0', 'F1-1', 'F1-2'].map((q) => ({ q, at: ago(0.1) })) } })
  assert.equal(r3.focus, 'maths.focus')
  assert.ok(r3.items.every((i) => i.level <= 1))
  assert.equal(r3.items.filter((i) => i.skill !== 'maths.focus').length, 4, 'every unseen item first; repeats only as a last resort')
  // the skill only exists above the level: its nearest level up
  const high = pool.filter((q) => !(q.skill === 'maths.focus' && q.level === 1))
  const r4 = round({ pool: high, level: 1, seed: 'f', focusSkill: 'maths.focus' })
  assert.deepEqual(r4.items.filter((i) => i.skill === 'maths.focus').map((i) => i.level), [2, 2, 2])
})

test('focus skill: an easier item first when it needs support; unknown, skipped or recently seen items fall back', () => {
  const skills = new Map([['maths.l3-s0', skillRow('maths.l3-s0', { mastery: 0.2, supportStep: 3, level: 3 })]])
  const r = round({ level: 3, status: 'practice', skills, seed: 'g', focusSkill: 'maths.l3-s0' })
  const i = r.items.findIndex((x) => x.why === 'prerequisite')
  assert.ok(i >= 0)
  assert.equal(r.items[i].for, 'maths.l3-s0')
  assert.equal(r.items[i].level, 2)
  assert.equal(r.items[i + 1].skill, 'maths.l3-s0')
  assert.equal(r.items.filter((x) => x.why === 'prerequisite').length, 2, 'steady: up to two warm-ups')
  // weak but not at step 3 yet: still a warm-up (needs practice)
  const weak = new Map([['maths.l3-s1', skillRow('maths.l3-s1', { mastery: 0.3, supportStep: 1, level: 3 })]])
  assert.ok(round({ level: 3, status: 'practice', skills: weak, focusSkill: 'maths.l3-s1' }).items.some((x) => x.why === 'prerequisite'))
  // doing fine: no warm-up
  const fine = new Map([['maths.l3-s1', skillRow('maths.l3-s1', { mastery: 0.8, level: 3 })]])
  assert.ok(!round({ level: 3, status: 'practice', skills: fine, focusSkill: 'maths.l3-s1' }).items.some((x) => x.why === 'prerequisite'))
  // unknown or skipped: exactly the normal round
  const normal = round({ seed: 'h' })
  const unknown = round({ seed: 'h', focusSkill: 'maths.nothing-like-this' })
  assert.deepEqual([unknown.focus, unknown.items.map((x) => x.id)], [null, normal.items.map((x) => x.id)])
  const skipped = round({ seed: 'h', focusSkill: 'maths.l1-s0', profile: { overrides: [{ type: 'skip_skill', skill: 'maths.l1-s0' }] } })
  assert.equal(skipped.focus, null)
  assert.ok(!skipped.items.some((x) => x.skill === 'maths.l1-s0'))
  // its items from the last sitting are left out; the normal mix fills the round
  const recent = makePool().filter((q) => q.skill === 'maths.l1-s1').slice(0, 3).map((q) => ({ q: q.id, at: ago(0.1) }))
  const r2 = round({ seed: 'h', focusSkill: 'maths.l1-s1', profile: { recent } })
  assert.equal(r2.items.length, 10)
  assert.ok(r2.items.some((x) => x.skill === 'maths.l1-s1'))
  assert.ok(!r2.items.some((x) => recent.some((rr) => rr.q === x.id)))
})
