// Unit tests for the adaptive-journey rules (no database): stages, chance discount,
// mastery evidence, probes, the target band, misconception targeting, the decision
// log, unfinished rounds, welcome / next / journey / discovery, growth badges and
// the guardian/teacher evidence. Every threshold comes from config/learning.js.
require('./helpers') // no database connections
const test = require('node:test')
const assert = require('node:assert/strict')
const cfg = require('../config/learning')
const { itemStage, choicesOf, chanceWeight, metaOf } = require('../services/learning/questionMeta')
const { nextMastery, updateSkill, isMastered, classifyAttempt, skillState } = require('../services/learning/mastery')
const { applyProbe, inProbe } = require('../services/learning/probe')
const { bandOf, recordBand, bandState, restartBand } = require('../services/learning/band')
const { applyAttempt, noteDiscovery, bumpBaseline, commonLevel } = require('../services/learning/engine')
const { freshLevel } = require('../services/learning/levelPolicy')
const { composeRound } = require('../services/learning/round')
const { EMPTY, buildCatalog } = require('../services/learning/catalog')
const { decisionView, REASONS, levelSet, templateOf } = require('../services/learning/decisions')
const { issueRound, trackAnswer, activeRound, latestActive, dropRound, resumePosition } = require('../services/learning/roundState')
const { welcomeFor, nextFor, journeyFor, pickDiscovery, WELCOME, NEXT } = require('../services/learning/journey')
const { newlyEarned, badgeView, GROWTH } = require('../services/learning/achievements')
const { evidenceView, INSIGHTS } = require('../services/learning/evidence')
const { buildExplain, TEXTS: EXPLAIN } = require('../services/learning/explain')

const DAY = 86400000
const HOUR = 3600000
const T0 = new Date('2026-11-02T09:00:00Z') // a Monday
const at = (days, hours = 0) => new Date(T0.getTime() + days * DAY + hours * HOUR)
const dateOf = (d) => d.toISOString().slice(0, 10)
const placeholders = (t) => [...String(t).matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1])
const GUILT = /\b(miss(ed)? (a |any |\d+ )?days?|streak|lost|lose|hurry|quick,? before|don'?t forget|you haven'?t been|where (were|have) you|lazy|disappoint)/i

// ── Stages ─────────────────────────────────────────────────────────────────
test('stage: the item\'s own stage wins; else everyday -> 0; else from cognition.bloom; else null', () => {
  assert.equal(itemStage({ stage: 5, cognition: { bloom: 'remember' } }), 5)
  assert.equal(itemStage({ stage: 0, everyday: true }), 0)
  assert.equal(itemStage({ everyday: true, cognition: { bloom: 'apply' } }), 0)
  const want = { remember: 1, understand: 2, apply: 3, analyze: 4, evaluate: 4, create: 4 }
  for (const [bloom, stage] of Object.entries(want)) assert.equal(itemStage({ cognition: { bloom } }), stage, bloom)
  assert.equal(itemStage({ cognition: { bloom: 'Apply ' } }), 3, 'case and spaces do not matter')
  assert.equal(itemStage({}), null)
  assert.equal(itemStage({ stage: 9, cognition: { bloom: 'understand' } }), 2, 'an out-of-range stage is ignored')
  const m = metaOf({ id: 'A', level: 1, interaction: 'true_false', options: ['Yes', 'No'], cognition: { bloom: 'understand' } }, 'science')
  assert.deepEqual([m.stage, m.choices, m.everyday], [2, 2, false])
})

test('choices: 2/3-option single-choice items are discounted, others are not', () => {
  assert.equal(choicesOf({ interaction: 'true_false' }), 2)
  assert.equal(choicesOf({ interaction: 'tap_mcq', options: ['a', 'b', 'c'] }), 3)
  assert.equal(choicesOf({ interaction: 'drag_to_blank', options: ['a', 'b'] }), 2)
  assert.equal(choicesOf({ interaction: 'tap_mcq', options: ['a', 'b', 'c', 'd'] }), 4)
  assert.equal(choicesOf({ interaction: 'multi_select', options: ['a', 'b', 'c'] }), null)
  assert.equal(choicesOf({ interaction: 'typed_short' }), null)
  assert.deepEqual([chanceWeight(2), chanceWeight(3), chanceWeight(4), chanceWeight(null)], [cfg.chanceDiscount[2], cfg.chanceDiscount[3], 1, 1])
})

// ── Chance discount ────────────────────────────────────────────────────────
test('chance discount: a right answer on a true/false item counts for less, never lowers mastery, and mastery stays reachable', () => {
  assert.ok(nextMastery(0.4, 'independent', chanceWeight(2)) < nextMastery(0.4, 'independent', chanceWeight(3)))
  assert.ok(nextMastery(0.4, 'independent', chanceWeight(3)) < nextMastery(0.4, 'independent', 1))
  assert.ok(nextMastery(0.4, 'independent', chanceWeight(2)) > 0.4)
  assert.equal(nextMastery(0.9, 'assisted', chanceWeight(2)), 0.9, 'help + guessing still never lowers it')
  assert.equal(nextMastery(0.8, 'incorrect', chanceWeight(2)), nextMastery(0.8, 'incorrect', 1), 'a miss is a miss')
  const rightAnswersTo = (w) => { let m = 0; let k = 0; while (m < cfg.masteredAt && k < 100) { m = nextMastery(m, 'independent', w); k++ } return k }
  assert.ok(rightAnswersTo(chanceWeight(2)) > rightAnswersTo(1), 'true/false needs more right answers')
  assert.ok(rightAnswersTo(chanceWeight(2)) < 20, 'but it can get there')
  // through updateSkill: the item's choices decide the weight
  const tf = updateSkill({}, { outcome: 'independent', choices: 2, questionId: 'A' }, T0).skill.mastery
  const open = updateSkill({}, { outcome: 'independent', choices: null, questionId: 'A' }, T0).skill.mastery
  assert.ok(tf < open)
})

// ── Mastery needs evidence ─────────────────────────────────────────────────
const right = (s, q, stage, now, extra = {}) => updateSkill(s, { outcome: 'independent', questionId: q, stage, stageAvail: extra.stageAvail ?? 3, ...extra }, now).skill
test('mastered needs right answers on 2 different items, one at stage >= 2 when the skill has such items, plus a recall on a later day', () => {
  // The same item over and over: never mastered.
  let s = {}
  for (let i = 0; i < 6; i++) s = right(s, 'Q1', 2, at(0, i / 10))
  s = right(s, 'Q1', 2, at(1, 1))
  assert.ok(s.mastery >= cfg.masteredAt && s.box >= 2)
  assert.equal(isMastered(s), false, 'one question is not evidence')
  // Two items, both recognition (stage 1), while the skill has stage-3 items: not yet.
  let t = {}
  for (let i = 0; i < 6; i++) t = right(t, `Q${i % 2}`, 1, at(0, i / 10))
  t = right(t, 'Q0', 1, at(1, 1))
  assert.equal(isMastered(t), false, 'needs one beyond recognition')
  t = right(t, 'Q9', 2, at(1, 2))
  assert.equal(isMastered(t), true)
  assert.ok(t.masteredAt)
  // A skill whose questions are all recognition: two items suffice.
  let u = {}
  for (let i = 0; i < 6; i++) u = right(u, `Q${i % 2}`, 1, at(0, i / 10), { stageAvail: 1 })
  u = right(u, 'Q0', 1, at(1, 1), { stageAvail: 1 })
  assert.equal(isMastered(u), true)
  // ...and never on the same day (delayed recall, Leitner box >= 2).
  let v = {}
  for (let i = 0; i < 8; i++) v = right(v, `Q${i % 3}`, 3, at(0, i / 10))
  assert.equal(v.box, 1)
  assert.equal(isMastered(v), false)
})

test('mastery evidence: rows from before the rule keep their mastered state until the next miss', () => {
  const legacy = { attempts: 9, correct: 9, mastery: 0.95, box: 3, due: at(10) } // no rightItems
  assert.equal(isMastered(legacy), true)
  const after = updateSkill(legacy, { outcome: 'independent', questionId: 'Q1', stage: 1, stageAvail: 3 }, at(1)).skill
  assert.deepEqual(after.rightItems, ['Q1'])
  assert.equal(after.legacyEvidence, true)
  assert.equal(isMastered(after), true, 'nobody loses a mastered skill because the rule changed')
  const missed = updateSkill(after, { outcome: 'incorrect', questionId: 'Q2' }, at(2)).skill
  assert.equal(missed.legacyEvidence, false)
  assert.equal(skillState({ ...missed, box: 3, mastery: 0.95, due: at(30) }, at(3)), 'learning', 'after a miss the new rule applies')
})

test('per-stage counts and the highest stage answered right are kept on the skill', () => {
  let s = updateSkill({}, { outcome: 'independent', questionId: 'A', stage: 1 }, T0).skill
  s = updateSkill(s, { outcome: 'assisted', questionId: 'B', stage: 3 }, T0).skill
  s = updateSkill(s, { outcome: 'incorrect', questionId: 'C', stage: 4 }, T0).skill
  assert.deepEqual(s.byStage, [{ s: 1, n: 1, c: 1, i: 1 }, { s: 3, n: 1, c: 1, i: 0 }, { s: 4, n: 1, c: 0, i: 0 }])
  assert.equal(s.topStage, 3)
  assert.deepEqual(s.rightItems, ['A', 'B'])
})

test('a mini-challenge miss never counts against anything; a right answer counts', () => {
  assert.deepEqual(classifyAttempt({ status: 'incorrect', mode: 'challenge' }), { countable: false, outcome: null, why: 'challenge' })
  assert.equal(classifyAttempt({ status: 'close', mode: 'challenge' }).countable, false)
  assert.equal(classifyAttempt({ status: 'correct', firstTry: true, mode: 'challenge' }).outcome, 'independent')
  assert.equal(classifyAttempt({ status: 'incorrect', mode: 'discovery' }).countable, true, 'a discovery is an ordinary graded item')
})

// ── Probes ─────────────────────────────────────────────────────────────────
const probeRun = (answers) => {
  let row = null
  const results = []
  answers.forEach(([outcome, stage], i) => {
    const after = updateSkill(row || {}, { outcome, stage, questionId: `P${i}` }, at(0, i / 10))
    const pr = applyProbe(row, after.skill, { outcome, stage }, at(0, i / 10))
    row = pr.skill
    results.push(pr.result)
  })
  return { row, results }
}

test('probe: a confident start (right first try, no hint, stage >= 2) raises starting mastery and skips beginner repetition', () => {
  const { row, results } = probeRun([['independent', 2]])
  assert.deepEqual(results[0], { state: 'confident', n: 1, right: 1, stage: 2 })
  assert.ok(row.mastery >= cfg.probe.confidentMastery)
  assert.equal(row.box, 1)
  assert.equal(new Date(row.due).getTime(), at(1).getTime(), 'it comes back tomorrow as a review')
  assert.equal(inProbe(row), false)
  // a confident start at recognition level is not confident yet
  const easy = probeRun([['independent', 1], ['independent', 1]])
  assert.deepEqual(easy.results, [null, { state: 'steady', n: 2, right: 2, stage: 1 }])
  // help is not confident
  assert.equal(probeRun([['assisted', 3], ['assisted', 3]]).results[1].state, 'steady')
  // a weak start: gently, with support
  const weak = probeRun([['incorrect', 1], ['incorrect', 2]])
  assert.equal(weak.results[1].state, 'gentle')
  assert.ok(weak.row.supportStep >= cfg.probe.gentleStep)
  // a confident second probe after a miss on the first
  assert.equal(probeRun([['incorrect', 1], ['independent', 3]]).results[1].state, 'confident')
})

test('probe: skill rows from before probes existed are never probed; the decision is logged once', () => {
  const legacy = { skill: 'maths.x', subject: 'maths', attempts: 4, mastery: 0.4 }
  assert.equal(inProbe(legacy), false)
  let profile = { levels: { maths: freshLevel(1, 'default') }, suggestions: [] }
  const out = applyAttempt(profile, null, { outcome: 'independent', subject: 'maths', module: 'read', questionId: 'Q1', skill: 'maths.x', skillName: 'Adding', itemLevel: 1, date: dateOf(T0), now: T0, ceiling: 3, stage: 3, stageAvail: 3 })
  assert.equal(out.probe.state, 'confident')
  const d = out.decisions.filter((x) => x.type === 'probe')
  assert.equal(d.length, 1)
  assert.deepEqual([d[0].reason, d[0].evidence], ['probe_confident', { n: 1, right: 1, stage: 3 }])
  profile = out.profile
  const again = applyAttempt(profile, out.skill, { outcome: 'independent', subject: 'maths', module: 'read', questionId: 'Q2', skill: 'maths.x', skillName: 'Adding', itemLevel: 1, date: dateOf(T0), now: at(0, 1), ceiling: 3, stage: 3 })
  assert.equal(again.decisions.filter((x) => x.type === 'probe').length, 0)
})

// A pool with stages: per skill, items at stages 1..4.
function stagedPool({ skills = 3, level = 1, stages = [1, 1, 2, 3, 4] } = {}) {
  const pool = []
  for (let s = 0; s < skills; s++) {
    stages.forEach((stage, i) => {
      const id = `S${s}-I${i}`
      pool.push({ id, _id: id, level, skill: `maths.s${s}`, stage, ageBand: 'all', interaction: 'tap_mcq', graded: true })
    })
  }
  for (let i = 0; i < 6; i++) pool.push({ id: `W${i}`, _id: `W${i}`, level: level - 1, skill: 'maths.warm', stage: 1, ageBand: 'all', interaction: 'tap_mcq', graded: true })
  for (let i = 0; i < 4; i++) pool.push({ id: `U${i}`, _id: `U${i}`, level: level + 1, skill: 'maths.up', stage: 2, ageBand: 'all', interaction: 'tap_mcq', graded: true })
  return pool
}
const R = (over = {}) => composeRound({ pool: stagedPool(), subject: 'maths', module: 'read', level: 1, status: 'new', skills: new Map(), profile: { pace: 'steady' }, catalog: EMPTY, size: 10, seed: 'p1', now: T0, ...over })

test('round: a never-seen skill gets a probe, the most accessible item first, then one at stage >= 2', () => {
  const r = R()
  const bySkill = new Map()
  for (const it of r.items) { if (!bySkill.has(it.skill)) bySkill.set(it.skill, []); bySkill.get(it.skill).push(it) }
  for (const [skill, list] of bySkill) {
    const probes = list.filter((x) => x.why === 'probe')
    assert.ok(probes.length >= 1 && probes.length <= cfg.probe.items, skill)
    assert.ok(list.indexOf(probes[0]) === 0, `${skill}: the probe comes first`)
    if (probes.length === 2) {
      assert.ok(probes[0].stage <= probes[1].stage, `${skill}: lower stage first`)
      assert.ok(probes[1].stage >= cfg.probe.confidentStage, `${skill}: one past recognition`)
    }
  }
  assert.ok(r.items.every((x) => Number.isInteger(x.stage)), 'items carry their stage')
})

test('round: a probe still open gets one more (stage >= 2); a confident start is not drilled; a gentle one gets low stages', () => {
  const pendingRow = { skill: 'maths.s0', subject: 'maths', attempts: 1, mastery: 0.2, box: 0, due: at(0), supportStep: 0, probe: { state: 'pending', n: 1, right: 1 } }
  const r = R({ skills: new Map([['maths.s0', pendingRow]]), seed: 'p2' })
  const mine = r.items.filter((x) => x.skill === 'maths.s0')
  assert.equal(mine.filter((x) => x.why === 'probe').length, 1)
  assert.ok(mine.find((x) => x.why === 'probe').stage >= cfg.probe.confidentStage)
  assert.ok(!mine.some((x) => x.why === 'practice'), 'not practised while the probe is open')

  const confident = { skill: 'maths.s1', subject: 'maths', attempts: 1, mastery: 0.6, box: 1, due: at(1), supportStep: 0, probe: { state: 'confident', n: 1, right: 1 } }
  const r2 = R({ skills: new Map([['maths.s1', confident]]), seed: 'p3' })
  assert.ok(!r2.items.some((x) => x.skill === 'maths.s1' && x.why === 'practice'), 'no beginner repetition')
  const due = { ...confident, due: at(-0.5) }
  const r3 = R({ skills: new Map([['maths.s1', due]]), now: T0, seed: 'p3' })
  assert.ok(r3.items.some((x) => x.skill === 'maths.s1' && x.why === 'review'), 'it comes back as a review when due')

  const gentle = { skill: 'maths.s2', subject: 'maths', attempts: 2, mastery: 0.1, box: 0, due: at(0), supportStep: 1, probe: { state: 'gentle', n: 2, right: 0 } }
  for (const seed of ['p4', 'p5', 'p6']) {
    const r4 = R({ skills: new Map([['maths.s2', gentle]]), seed, profile: { pace: 'gentle' } })
    const practice = r4.items.filter((x) => x.skill === 'maths.s2' && x.why === 'practice')
    assert.ok(practice.length >= 2)
    // whatever is chosen of that skill is its lowest stages
    const lowest = stagedPool().filter((q) => q.skill === 'maths.s2').map((q) => q.stage).sort((a, b) => a - b).slice(0, practice.length)
    assert.deepEqual(practice.map((x) => x.stage).sort((a, b) => a - b), lowest, `low stages first: ${practice.map((x) => x.stage)}`)
    assert.ok(practice.every((x) => x.support.step === 1 && x.support.strategy === 'visual'), 'with support')
  }
  // a confident start: its highest stages first
  const conf2 = { ...confident, skill: 'maths.s2', due: at(-0.5) }
  const r5 = R({ skills: new Map([['maths.s2', conf2]]), seed: 'p7' })
  const mine5 = r5.items.filter((x) => x.skill === 'maths.s2')
  assert.equal(Math.max(...mine5.map((x) => x.stage)), 4)
})

// ── Target band ────────────────────────────────────────────────────────────
test('practice-only (ungraded) items: never a probe while graded ones exist, never a mini challenge', () => {
  const pool = stagedPool().map((q) => (q.stage >= 3 && q.skill === 'maths.s0' ? { ...q, graded: false } : q))
  const r = R({ pool, seed: 'g1' })
  const ungraded = new Set(pool.filter((q) => q.graded === false).map((q) => q.id))
  assert.ok(!r.items.some((x) => x.why === 'probe' && ungraded.has(x.id)))
  const strong = { skill: 'maths.s0', subject: 'maths', attempts: 6, mastery: 0.9, box: 2, due: at(5), topStage: 2, rightItems: ['a', 'b'] }
  const ch = R({ pool, mode: 'challenge', focusSkill: 'maths.s0', skills: new Map([['maths.s0', strong], ['maths.s1', { ...strong, skill: 'maths.s1' }]]) })
  assert.equal(ch.challenge.skill, 'maths.s1', 'maths.s0 has only practice items above stage 2')
  assert.ok(ch.items.every((x) => !ungraded.has(x.id)))
})

test('band: 75-90% over the last 20 graded answers; below tilts easier, above harder; nothing before 8 answers', () => {
  const list = (r, w) => [...Array(r).fill(1), ...Array(w).fill(0)]
  assert.equal(bandOf(list(5, 1)).tilt, 'hold', 'too few answers')
  assert.deepEqual(bandOf(list(14, 6)), { low: 0.75, high: 0.9, recent: 0.7, n: 20, tilt: 'easier' })
  assert.equal(bandOf(list(15, 5)).tilt, 'hold', '75% is inside')
  assert.equal(bandOf(list(18, 2)).tilt, 'hold', '90% is inside')
  assert.equal(bandOf(list(19, 1)).tilt, 'harder')
  assert.equal(bandOf([...list(0, 30), ...list(20, 0)]).recent, 1, 'only the last 20 count')
  const r = recordBand({ recent: list(18, 1), tilt: 'hold' }, true)
  assert.deepEqual(r.changed, { from: 'hold', to: 'harder' })
  assert.equal(recordBand(r.state, true).changed, null, 'logged once, when it changes')
  // hysteresis: back to hold only a little inside the band
  assert.equal(bandOf(list(18, 2), cfg.targetBand, 'harder').tilt, 'harder', '90% after harder stays harder')
  assert.equal(bandOf(list(17, 3), cfg.targetBand, 'harder').tilt, 'hold')
  assert.equal(bandOf(list(15, 5), cfg.targetBand, 'easier').tilt, 'easier', '75% after easier stays easier')
  assert.equal(bandOf(list(16, 4), cfg.targetBand, 'easier').tilt, 'hold')
  // a new level starts the count afresh; the recent answers stay for the grown-ups' "now"
  const fresh = restartBand({ recent: list(20, 0), fresh: 20, tilt: 'harder' })
  assert.deepEqual([bandState(fresh).tilt, bandState(fresh).n, fresh.recent.length], ['hold', 0, 20])
  let st = fresh
  for (let i = 0; i < cfg.targetBand.minAttempts; i++) st = recordBand(st, false).state
  assert.deepEqual([bandState(st).tilt, bandState(st).n, st.recent.length], ['easier', cfg.targetBand.minAttempts, 20])
})

test('band: applyAttempt logs band_tilt when the tilt changes, with the numbers', () => {
  let profile = { levels: { maths: freshLevel(1, 'default') }, suggestions: [] }
  let skill = null
  const tilts = []
  for (let i = 0; i < 12; i++) {
    const now = at(0, i / 10)
    const out = applyAttempt(profile, skill, { outcome: i % 2 ? 'incorrect' : 'independent', subject: 'maths', module: 'read', questionId: `Q${i}`, skill: 'maths.x', skillName: 'X', itemLevel: 0, date: dateOf(now), now, ceiling: 3 })
    profile = out.profile; skill = out.skill
    tilts.push(...out.decisions.filter((d) => d.type === 'band_tilt'))
  }
  assert.equal(tilts.length, 1)
  assert.deepEqual([tilts[0].from, tilts[0].to, tilts[0].reason, tilts[0].evidence.n, tilts[0].evidence.acc], ['hold', 'easier', 'band_easier', 8, 0.5])
  assert.equal(profile.band.maths.tilt, 'easier')
})

test('band tilt shapes the round: easier = a warm-up from the level below and no stretch; harder = a stretch item, higher stages', () => {
  const skills = new Map(['maths.s0', 'maths.s1', 'maths.s2'].map((id) => [id, { skill: id, subject: 'maths', attempts: 6, mastery: 0.7, box: 1, due: at(5), supportStep: 0, level: 1 }]))
  const easier = R({ skills, status: 'advancing', tilt: 'easier', seed: 'b1' })
  assert.ok(easier.items.some((x) => x.why === 'prerequisite' && x.level === 0))
  assert.ok(!easier.items.some((x) => x.why === 'stretch'))
  const harder = R({ skills, status: 'practice', tilt: 'harder', seed: 'b1' })
  assert.equal(harder.items.filter((x) => x.why === 'stretch').length, 1)
  const hold = R({ skills, status: 'practice', tilt: 'hold', seed: 'b1' })
  assert.equal(hold.items.filter((x) => x.why === 'stretch').length, 0, 'practice + hold: no stretch, as before')
  const held = R({ skills, status: 'practice', tilt: 'harder', seed: 'b1', profile: { pace: 'steady', overrides: [{ type: 'hold_level', subject: 'maths' }] } })
  assert.equal(held.items.filter((x) => x.why === 'stretch').length, 0, 'a held level is never stretched')
  const mean = (r) => r.items.filter((x) => x.level === 1).reduce((a, x) => a + x.stage, 0) / r.items.filter((x) => x.level === 1).length
  assert.ok(mean(R({ skills, tilt: 'harder', seed: 'b2', status: 'practice' })) > mean(R({ skills, tilt: 'easier', seed: 'b2', status: 'practice' })), 'harder serves higher stages')
})

// ── Misconceptions ─────────────────────────────────────────────────────────
test('misconception: the same distractor twice brings an explanation next; again after two more; resolved after two right in a row', () => {
  const miss = (s, text, q, now) => updateSkill(s, { outcome: 'incorrect', misconception: text, questionId: q, module: 'read' }, now)
  let r = miss({}, 'counted one apple twice', 'Q1', at(0))
  assert.equal(r.events.misconceptionRepeat, null)
  r = miss(r.skill, 'skipped one apple', 'Q2', at(0, 1))
  assert.equal(r.events.misconceptionRepeat, null, 'two different mix-ups are not a repeat')
  r = miss(r.skill, 'counted one apple twice', 'Q3', at(0, 2))
  assert.deepEqual(r.events.misconceptionRepeat, { text: 'counted one apple twice', count: 2, q: 'Q3', module: 'read' })
  r = miss(r.skill, 'counted one apple twice', 'Q4', at(0, 3))
  assert.equal(r.events.misconceptionRepeat, null, 'just explained')
  r = miss(r.skill, 'counted one apple twice', 'Q5', at(0, 4))
  assert.equal(r.events.misconceptionRepeat.count, 4)
  let s = updateSkill(r.skill, { outcome: 'independent', questionId: 'Q6' }, at(0, 5)).skill
  assert.ok(s.misconceptions.every((m) => !m.resolvedAt), 'one right answer is not yet resolved')
  s = updateSkill(s, { outcome: 'assisted', questionId: 'Q7' }, at(0, 6)).skill
  assert.ok(s.misconceptions.every((m) => m.resolvedAt))
  s = miss(s, 'skipped one apple', 'Q8', at(1)).skill
  assert.equal(s.misconceptions.find((m) => m.text === 'skipped one apple').resolvedAt, null, 'it came back: open again')
  // logged as a decision (numbers only, never the text)
  const out = applyAttempt({ levels: {}, suggestions: [] }, { ...miss({}, 'x', 'Q1', T0).skill, skill: 'maths.x', subject: 'maths' }, { outcome: 'incorrect', misconception: 'x', subject: 'maths', module: 'read', questionId: 'Q2', skill: 'maths.x', skillName: 'X', itemLevel: 1, date: dateOf(T0), now: T0, ceiling: 2 })
  const d = out.decisions.find((x) => x.type === 'misconception_explained')
  assert.deepEqual([d.skill, d.evidence], ['maths.x', { count: 2 }])
  assert.ok(!JSON.stringify(out.decisions).includes('"x"'), 'no misconception text in the log')
})

test('explanation: the item\'s worked example (translated when there is one), else its note, else the misconception; never invented', () => {
  const doc = { id: 'Q', worked_example: 'Touch each apple once as you count.', analysis: { teacher_action_if_missed: 'Count together.' }, translations: { de: { worked_example: 'Berühre jeden Apfel einmal.' } } }
  const en = buildExplain(doc, { skill: 'maths.count', skillName: 'Counting', misconception: 'counted twice' })
  assert.deepEqual([en.text, en.source, en.lang, en.skill], ['Touch each apple once as you count.', 'worked_example', 'en', 'maths.count'])
  assert.equal(en.lead.key, 'learn.explain.lead_skill')
  assert.equal(en.lead.text, render(EXPLAIN.lead_skill, { skillName: 'Counting' }))
  const de = buildExplain(doc, { skill: 'maths.count', lang: 'de' })
  assert.deepEqual([de.text, de.lang], ['Berühre jeden Apfel einmal.', 'de'])
  const fr = buildExplain(doc, { skill: 'maths.count', lang: 'fr' })
  assert.deepEqual([fr.text, fr.lang], ['Touch each apple once as you count.', 'en'], 'no French: English, and says so')
  assert.equal(buildExplain({ id: 'Q', analysis: { teacher_action_if_missed: 'Count together.' } }, {}).source, 'teacher_action')
  assert.equal(buildExplain({ id: 'Q' }, { misconception: 'counted twice' }).source, 'insight')
  assert.equal(buildExplain(null, {}), null)
})
const { render } = require('../services/learning/feedback')

// ── Decisions ──────────────────────────────────────────────────────────────
test('decision log: level up, support step and mastered decisions carry the numbers behind them; texts are fully rendered', () => {
  let profile = { levels: { maths: freshLevel(1, 'default') }, suggestions: [] }
  let skill = null
  const all = []
  for (let i = 0; i < 12; i++) {
    const now = at(i < 6 ? 0 : 1, i % 6)
    const out = applyAttempt(profile, skill, { outcome: 'independent', subject: 'maths', module: 'read', questionId: `Q${i % 3}`, skill: 'maths.x', skillName: 'Adding', itemLevel: 1, date: dateOf(now), now, ceiling: 3, stage: 2, stageAvail: 2 })
    profile = out.profile; skill = out.skill
    all.push(...out.decisions)
  }
  const up = all.find((d) => d.type === 'level_up')
  assert.deepEqual([up.from, up.to, up.evidence.acc, up.evidence.n, up.evidence.days], [1, 2, 1, 12, 2])
  assert.ok(all.some((d) => d.type === 'mastered' && d.evidence.items >= 2))
  const v = decisionView(up, buildCatalog({ skills: [] }))
  assert.equal(v.reason.key, 'learn.decision.level_up')
  assert.equal(v.reason.text, 'Moved up from level 1 to level 2 in Maths: 100% right over the last 12 answers, on 2 different days.')
  // support steps
  const miss = applyAttempt({ levels: {}, suggestions: [] }, { skill: 'maths.y', subject: 'maths', attempts: 3, mastery: 0.5, supportStep: 0, probe: { state: 'steady' } }, { outcome: 'incorrect', subject: 'maths', module: 'read', questionId: 'Z', skill: 'maths.y', skillName: 'Y', itemLevel: 1, date: dateOf(T0), now: T0, ceiling: 2 })
  const step = miss.decisions.find((d) => d.type === 'support_step')
  assert.deepEqual([step.from, step.to, step.reason, step.evidence.misses], [0, 1, 'support_up', 1])
  const names = new Map([['maths.y', 'Y']])
  assert.equal(decisionView(step, null, names).reason.text, 'Y: now explained a different way (pictures) after a miss.')
  assert.equal(decisionView({ ...step, evidence: { ...step.evidence, misses: 3 } }, null, names).reason.text, 'Y: now explained a different way (pictures) after 3 misses in a row.')
  assert.equal(decisionView(step).reason.params.skillName, 'maths.y', 'no name known: the id')
  assert.equal(decisionView(step).reason.key, 'learn.decision.support_up', 'one key; the plural form comes from params.count')
  // every reason renders without leftover placeholders for its own numbers
  for (const [code, text] of Object.entries(REASONS)) {
    const d = { at: T0, type: 'level_set', subject: 'maths', skill: 'maths.x', from: 1, to: 2, reason: code, evidence: { acc: 0.8, n: 10, days: 2, right: 3, misses: 2, count: 2, items: 2, stage: 2, low: 0.75, high: 0.9, step: 1 } }
    if (code.startsWith('support')) d.type = 'support_step'
    const out = decisionView(d, null)
    assert.ok(!/\{\{/.test(out.reason.text), `${code}: ${out.reason.text}`)
    for (const p of placeholders(text)) assert.ok(p in out.reason.params, `${code}: {{${p}}} is in params`)
  }
  // only small numbers in evidence, never text
  for (const d of [...all, ...miss.decisions]) for (const v2 of Object.values(d.evidence)) assert.equal(typeof v2, 'number')
  assert.deepEqual(levelSet({ at: T0, subject: 'maths', from: 1, to: 3, reason: 'set_by_guardian' }).type, 'level_set')
})

test('decision log model: TTL of decisionTtlDays on `at`, keyed by email', () => {
  const LearningDecision = require('../models/learning/LearningDecision')
  const ttl = LearningDecision.schema.indexes().find(([fields, opts]) => fields.at === 1 && opts.expireAfterSeconds)
  assert.ok(ttl)
  assert.equal(ttl[1].expireAfterSeconds, cfg.decisionTtlDays * 86400)
  assert.equal(cfg.decisionTtlDays, 180)
  assert.deepEqual(LearningDecision.schema.path('type').enumValues, cfg.DECISION_TYPES)
  assert.ok(LearningDecision.schema.path('email').isRequired)
})

// ── Unfinished rounds ──────────────────────────────────────────────────────
const items5 = ['A', 'B', 'C', 'D', 'E'].map((q) => ({ q, oid: `o${q}`, why: 'practice' }))
test('round state: an answer turns the issued round into the unfinished one; resume where it stopped; done clears it; it expires', () => {
  let rounds = issueRound([], { id: 'aaaaaaaaaaaa', subject: 'maths', module: 'read', items: items5, now: T0 })
  assert.equal(activeRound(rounds, 'maths', 'read', T0), null, 'nothing answered yet')
  let t = trackAnswer(rounds, { roundId: 'aaaaaaaaaaaa', position: 0, subject: 'maths', module: 'read', q: 'A', now: at(0, 0.1) })
  t = trackAnswer(t.rounds, { roundId: 'aaaaaaaaaaaa', position: 1, subject: 'maths', module: 'read', q: 'B', now: at(0, 0.2) })
  assert.deepEqual(t.info, { roundId: 'aaaaaaaaaaaa', position: 1, answered: 2, total: 5, done: false })
  // the first answer says the round started, and whether the learner chose it
  const plainStart = trackAnswer(rounds, { roundId: 'aaaaaaaaaaaa', position: 0, subject: 'maths', module: 'read', q: 'A', now: at(0, 0.1) }).info
  assert.deepEqual([plainStart.started, plainStart.chosen], [true, false])
  const chosenRounds = issueRound([], { id: 'dddddddddddd', subject: 'maths', module: 'read', source: 'next', items: items5, now: T0 })
  const chosenStart = trackAnswer(chosenRounds, { roundId: 'dddddddddddd', position: 0, subject: 'maths', module: 'read', q: 'A', now: at(0, 0.1) })
  assert.deepEqual([chosenStart.info.started, chosenStart.info.chosen], [true, true])
  assert.equal(trackAnswer(chosenStart.rounds, { roundId: 'dddddddddddd', position: 1, subject: 'maths', module: 'read', q: 'B', now: at(0, 0.2) }).info.started, undefined, 'counted once')
  assert.equal(issueRound([], { id: 'eeeeeeeeeeee', subject: 'maths', module: 'read', mode: 'challenge', items: items5, now: T0 })[0].source, 'challenge')
  const a = activeRound(t.rounds, 'maths', 'read', at(1))
  assert.deepEqual([a.id, a.answered, resumePosition(a)], ['aaaaaaaaaaaa', ['A', 'B'], 2])
  assert.equal(latestActive(t.rounds, at(1)).id, 'aaaaaaaaaaaa')
  // a newer round handed out does not replace the unfinished one until it is answered
  let r2 = issueRound(t.rounds, { id: 'bbbbbbbbbbbb', subject: 'maths', module: 'read', items: items5, now: at(1) })
  assert.equal(activeRound(r2, 'maths', 'read', at(1)).id, 'aaaaaaaaaaaa')
  r2 = trackAnswer(r2, { roundId: 'bbbbbbbbbbbb', position: 0, subject: 'maths', module: 'read', q: 'A', now: at(1, 1) }).rounds
  assert.equal(activeRound(r2, 'maths', 'read', at(1, 1)).id, 'bbbbbbbbbbbb')
  // finishing clears it
  let f = { rounds: t.rounds }
  for (const [i, q] of ['C', 'D', 'E'].entries()) f = trackAnswer(f.rounds, { roundId: 'aaaaaaaaaaaa', position: i + 2, subject: 'maths', module: 'read', q, now: at(0, 1) })
  assert.equal(f.info.done, true)
  assert.equal(activeRound(f.rounds, 'maths', 'read', at(0, 1)), null)
  // expiry
  assert.equal(activeRound(t.rounds, 'maths', 'read', new Date(at(0, 0.2).getTime() + (cfg.resumeHours + 1) * HOUR)), null)
  // start fresh; unknown or malformed round ids change nothing
  assert.equal(dropRound(t.rounds, 'maths', 'read', at(1)).dropped, 1)
  assert.equal(activeRound(dropRound(t.rounds, 'maths', 'read', at(1)).rounds, 'maths', 'read', at(1)), null)
  assert.equal(trackAnswer(t.rounds, { roundId: 'cccccccccccc', subject: 'maths', module: 'read', q: 'C', now: at(1) }).info, null)
  assert.equal(trackAnswer(t.rounds, { roundId: '<script>', subject: 'maths', module: 'read', q: 'C', now: at(1) }).info, null)
  assert.equal(trackAnswer(t.rounds, { roundId: 'aaaaaaaaaaaa', subject: 'english', module: 'read', q: 'C', now: at(1) }).info, null, 'another subject')
})

// ── Welcome back ───────────────────────────────────────────────────────────
const catalog = buildCatalog({ skills: [
  { id: 'maths.count', subject: 'maths', name: 'Counting', level: 1, modes: ['read'], prerequisites: [] },
  { id: 'maths.add', subject: 'maths', name: 'Adding', level: 1, modes: ['read'], prerequisites: ['maths.count'] },
  { id: 'maths.take', subject: 'maths', name: 'Taking away', level: 2, modes: ['read'], prerequisites: ['maths.add'] },
] })
const index = { skills: new Map([
  ['maths.count', { skill: 'maths.count', subject: 'maths', modules: { read: 5 }, moduleMax: { read: 3 }, stages: [1, 2, 3], levels: [1], maxStage: 3 }],
  ['maths.add', { skill: 'maths.add', subject: 'maths', modules: { read: 4, write: 2 }, moduleMax: { read: 2, write: 3 }, stages: [1, 2, 3], levels: [1], maxStage: 3 }],
  ['maths.take', { skill: 'maths.take', subject: 'maths', modules: { write: 4 }, moduleMax: { write: 2 }, stages: [1, 2], levels: [2], maxStage: 2 }],
  ['english.words', { skill: 'english.words', subject: 'english', modules: { listen: 4 }, moduleMax: { listen: 1 }, stages: [0, 1], levels: [1], maxStage: 1 }],
]), everyday: [] }
const masteredRow = (skill, masteredAt) => ({ skill, subject: 'maths', name: skill, attempts: 8, correct: 8, mastery: 0.92, box: 2, due: at(30), rightItems: ['a', 'b'], topStage: 2, stageAvail: 3, masteredAt, lastAt: masteredAt, modules: ['read'], byStage: [{ s: 1, n: 4, c: 4, i: 4 }, { s: 2, n: 4, c: 4, i: 3 }] })

test('welcome: first time, unfinished, long break, struggle, success, returning: each only from stored history', () => {
  const now = at(3)
  const first = welcomeFor({ name: 'Ana Maria', profile: {}, skills: [], catalog, index, now })
  assert.equal(first.kind, 'first')
  assert.equal(first.message.params.name, 'Ana')
  assert.deepEqual([first.actions[0].type, first.actions[0].href], ['start', '/module/listen/english'])
  const school = welcomeFor({ name: 'Ana', profile: {}, skills: [], catalog, index: { skills: new Map([['maths.general', { skill: 'maths.general', subject: 'maths', modules: { read: 3 } }]]) }, now })
  assert.equal(school.actions[0].href, '/module/read/maths', 'where this learner has questions')

  const rounds = trackAnswer(issueRound([], { id: 'aaaaaaaaaaaa', subject: 'maths', module: 'read', items: items5, now: at(2) }), { roundId: 'aaaaaaaaaaaa', position: 0, subject: 'maths', module: 'read', q: 'A', now: at(2) }).rounds
  const unfinished = welcomeFor({ name: 'Ana', profile: { lastActiveAt: at(2), rounds, last: { subject: 'maths', module: 'read' } }, skills: [masteredRow('maths.count', at(2))], catalog, index, now })
  assert.equal(unfinished.kind, 'unfinished')
  assert.deepEqual([unfinished.message.params.subject, unfinished.message.params.module], ['maths', 'read'])
  assert.deepEqual([unfinished.actions[0].type, unfinished.actions[0].href], ['continue', '/module/read/maths?resume=1'])

  const brk = welcomeFor({ name: 'Ana', profile: { lastActiveAt: at(-20) }, skills: [masteredRow('maths.count', at(-25))], catalog, index, now })
  assert.equal(brk.kind, 'break')
  assert.equal(brk.message.params.days, 23)
  assert.ok(!/\d/.test(brk.message.text), 'the number of days away is not said')
  assert.equal(brk.actions[0].type, 'review', 'warm up with something known')

  const struggling = { skill: 'maths.add', subject: 'maths', name: 'Adding', attempts: 4, mastery: 0.2, missesSinceSuccess: 3, supportStep: 2, lastAt: at(2), modules: ['read'] }
  const st = welcomeFor({ name: 'Ana', profile: { lastActiveAt: at(2) }, skills: [masteredRow('maths.count', at(1)), struggling], catalog, index, now })
  assert.equal(st.kind, 'struggle')
  assert.deepEqual([st.message.params.skill, st.message.params.skillName], ['maths.add', 'Adding'])
  assert.equal(st.actions[0].href, '/module/read/maths?skill=maths.add')

  const ok = welcomeFor({ name: 'Ana', profile: { lastActiveAt: at(2) }, skills: [masteredRow('maths.count', at(2))], catalog, index, now })
  assert.equal(ok.kind, 'success')
  assert.equal(ok.message.params.skill, 'maths.count')
  assert.equal(ok.actions[0].type, 'new')
  assert.equal(ok.actions[0].skill, 'maths.add', 'the next concept after the one mastered')

  const plain = welcomeFor({ name: 'Ana', profile: { lastActiveAt: at(2), last: { subject: 'maths', module: 'read' } }, skills: [{ skill: 'maths.add', subject: 'maths', attempts: 3, mastery: 0.5, lastAt: at(2), missesSinceSuccess: 0 }], catalog, index, now })
  assert.equal(plain.kind, 'returning')
  assert.equal(plain.actions[0].href, '/module/read/maths')
})

test('welcome never invents: no win without a real mastered skill; params only name stored skills; no guilt; calm and anonymous variants', () => {
  const now = at(3)
  // high mastery but not mastered by the evidence rule (one item): not a success
  const notYet = { ...masteredRow('maths.count', null), rightItems: ['a'], masteredAt: null, lastAt: at(2) }
  assert.notEqual(welcomeFor({ name: 'Ana', profile: { lastActiveAt: at(2) }, skills: [notYet], catalog, index, now }).kind, 'success')
  // mastered long ago: not "last time"
  assert.notEqual(welcomeFor({ name: 'Ana', profile: { lastActiveAt: at(2) }, skills: [masteredRow('maths.count', at(-30))], catalog, index, now }).kind, 'success')
  for (const kind of Object.keys(WELCOME)) {
    for (const [variant, text] of Object.entries(WELCOME[kind])) {
      assert.ok(!GUILT.test(text), `${kind}.${variant}: ${text}`)
      assert.ok((text.match(/!/g) || []).length === 0, `${kind}.${variant}: calm, no exclamation marks`)
      for (const p of placeholders(text)) assert.ok(['name', 'skillName', 'subjectName'].includes(p), `${kind}.${variant}: {{${p}}}`)
      if (variant === 'anon') assert.ok(!placeholders(text).includes('name'))
      if (variant === 'calm') assert.ok(text.length <= Math.min(...['a', 'b'].map((v) => WELCOME[kind][v].length)), `${kind}: calm is the shortest`)
    }
  }
  const calm = welcomeFor({ name: 'Ana', profile: {}, skills: [], catalog, index, now, calm: true })
  assert.deepEqual([calm.calm, calm.message.key], [true, 'learn.welcome.first.calm'])
  const anon = welcomeFor({ name: '', profile: {}, skills: [], catalog, index, now })
  assert.equal(anon.message.key, 'learn.welcome.first.anon')
  assert.equal(anon.message.params.name, undefined)
  // the skill named is always one of the learner's own rows
  const rows = [masteredRow('maths.count', at(2))]
  const w = welcomeFor({ name: 'Ana', profile: { lastActiveAt: at(2) }, skills: rows, catalog, index, now })
  if (w.message.params.skill) assert.ok(rows.some((r) => r.skill === w.message.params.skill))
})

// ── What next ──────────────────────────────────────────────────────────────
test('next: ranked continue, review, support, next concept, challenge, discovery, explore; at most 6, each with a reason', () => {
  const now = at(3)
  const rounds = trackAnswer(issueRound([], { id: 'aaaaaaaaaaaa', subject: 'maths', module: 'read', items: items5, now: at(2) }), { roundId: 'aaaaaaaaaaaa', position: 0, subject: 'maths', module: 'read', q: 'A', now: at(2) }).rounds
  const rows = [
    { ...masteredRow('maths.count', at(1)), box: 2, due: at(2) }, // mastered, review due
    { skill: 'maths.take', subject: 'maths', name: 'Taking away', attempts: 5, mastery: 0.3, supportStep: 3, lastAt: at(2), modules: ['write'] }, // needs support
  ]
  const out = nextFor({ profile: { rounds, lastActiveAt: at(2), last: { subject: 'maths', module: 'read' } }, skills: rows, catalog, index, now, discovery: { available: true, answered: false } })
  const kinds = out.items.map((x) => x.kind)
  assert.deepEqual(kinds, ['continue', 'review', 'support', 'next', 'challenge', 'discovery'])
  assert.ok(out.items.length <= cfg.next.max)
  assert.equal(out.items[0].action.href, '/module/read/maths?resume=1')
  assert.equal(out.items[1].action.skill, 'maths.count')
  assert.deepEqual([out.items[2].action.skill, out.items[2].why.params.forSkill], ['maths.add', 'maths.take'], 'the unmastered prerequisite of the tricky skill')
  assert.equal(out.items[3].action.skill, 'maths.add')
  assert.deepEqual([out.items[4].action.mode, out.items[4].action.module, out.items[4].action.href], ['challenge', 'read', '/module/read/maths?challenge=1&skill=maths.count'])
  assert.equal(out.items[5].action.href, '/discovery')
  for (const it of out.items) {
    assert.ok(it.title.key.startsWith('learn.next.') && it.why.key.startsWith('learn.next.'))
    assert.ok(it.why.text.length > 10 && !/\{\{/.test(it.why.text + it.title.text))
    assert.ok(!GUILT.test(it.why.text) && !/!/.test(it.why.text), it.why.text)
  }
  // the next concept is never far above the learner's level
  const far = { ...index, skills: new Map([...index.skills].map(([k, v]) => [k, k === 'maths.add' ? { ...v, levels: [5] } : v])) }
  const low = nextFor({ profile: { levels: { maths: { level: 1 } } }, skills: [masteredRow('maths.count', at(1))], catalog, index: far, now })
  assert.ok(!low.items.some((x) => x.kind === 'next'), 'level 5 content is not "next" at level 1')
  // nothing to do yet: explore something new; a discovery already answered today is not offered again
  const fresh = nextFor({ profile: {}, skills: [], catalog, index, now, discovery: { available: true, answered: true } })
  assert.deepEqual(fresh.items.map((x) => x.kind), ['explore'])
  for (const v of Object.values(NEXT)) assert.ok(!GUILT.test(v.title + v.why))
})

// ── Journey map ────────────────────────────────────────────────────────────
test('journey: per subject, skills per stage, attempted and mastered at that stage, and the stage reached', () => {
  const rows = [masteredRow('maths.count', at(1)), { skill: 'maths.add', subject: 'maths', attempts: 2, mastery: 0.3, byStage: [{ s: 1, n: 2, c: 1, i: 0 }] }]
  const j = journeyFor({ profile: { levels: { maths: { level: 2 } } }, skills: rows, index, ceilings: { maths: 4 } })
  assert.deepEqual(Object.keys(j), cfg.SUBJECTS)
  assert.deepEqual([j.maths.level, j.maths.ceiling, j.maths.reached], [2, 4, 2])
  assert.deepEqual(j.maths.stages[1], { stage: 1, name: 'recognition', skills: 3, practiceOnly: 0, attempted: 2, mastered: 1 })
  assert.deepEqual(j.maths.stages[3], { stage: 3, name: 'application', skills: 2, practiceOnly: 0, attempted: 0, mastered: 0 })
  // stage 5 with practice-only questions: nothing graded yet
  const withPractice = { skills: new Map([...index.skills].map(([k, v]) => [k, k === 'maths.count' ? { ...v, practiceStages: [5] } : v])) }
  assert.deepEqual(journeyFor({ profile: {}, skills: rows, index: withPractice }).maths.stages[5], { stage: 5, name: 'transfer', skills: 0, practiceOnly: 1, attempted: 0, mastered: 0 })
  assert.deepEqual([j.english.reached, j.english.stages[0].skills, j.english.level], [null, 1, cfg.defaultLevel])
})

// ── Discovery ──────────────────────────────────────────────────────────────
test('discovery: the same item all day for a learner, varies by day and learner, avoids recent ones, microphone last', () => {
  const everyday = Array.from({ length: 12 }, (_, i) => ({ id: `E${String(i).padStart(2, '0')}`, interaction: i === 3 ? 'mic_record' : 'tap_mcq' }))
  const a = pickDiscovery(everyday, { email: 'ana@kids.test', date: '2026-11-21' })
  assert.equal(pickDiscovery(everyday, { email: 'ANA@kids.test', date: '2026-11-21' }).id, a.id, 'deterministic per learner + date')
  const days = new Set(Array.from({ length: 10 }, (_, i) => pickDiscovery(everyday, { email: 'ana@kids.test', date: `2026-11-${10 + i}` }).id))
  assert.ok(days.size >= 4, 'changes from day to day')
  const avoid = new Set(everyday.filter((q) => q.id !== 'E07').map((q) => q.id))
  assert.equal(pickDiscovery(everyday, { email: 'ana@kids.test', date: '2026-11-21', avoid }).id, 'E07', 'not one answered lately')
  const onlyMic = new Set(everyday.filter((q) => q.id !== 'E03').map((q) => q.id))
  assert.equal(pickDiscovery(everyday, { email: 'x', date: 'd', avoid: onlyMic }).id, 'E03', 'a microphone item only when nothing else is left')
  for (let i = 0; i < 20; i++) assert.notEqual(pickDiscovery(everyday, { email: `k${i}`, date: 'd' }).id, 'E03')
  assert.ok(pickDiscovery(everyday, { email: 'x', date: 'd', avoid: new Set(everyday.map((q) => q.id)) }), 'all answered lately: one anyway')
  assert.equal(pickDiscovery([], { email: 'x', date: 'd' }), null)
})

// ── Growth achievements ────────────────────────────────────────────────────
test('growth badges: earned on evidence, once; none for time, speed or rankings', () => {
  const A = cfg.achievements
  assert.deepEqual(newlyEarned({}), [])
  const all = newlyEarned({ discoveries: A.curious, discoveryDays: A.curious, firstDiscoveryDate: '2026-11-20', skillsTried: A.conceptExplorer, mastered: A.threeMastered, solved: A.problemSolver, reviewsRight: A.reviewChampion, comeback: { skill: 'maths.add', skillName: 'Adding', misses: A.comebackMisses } })
  assert.deepEqual(all.map((x) => x.id).sort(), GROWTH.map((g) => g.id).sort())
  assert.deepEqual(newlyEarned({ skillsTried: A.conceptExplorer - 1, mastered: A.threeMastered - 1, solved: A.problemSolver - 1, reviewsRight: A.reviewChampion - 1, discoveryDays: A.curious - 1, comeback: { misses: A.comebackMisses - 1 } }), [])
  assert.deepEqual(newlyEarned({ skillsTried: 9 }, new Set(['growth_concept_explorer'])), [], 'once')
  const v = badgeView('growth_comeback', { skill: 'maths.add', skillName: 'Adding', misses: 3 })
  assert.deepEqual([v.key, v.text, v.desc.key, v.evidence.key], ['learn.achievement.growth_comeback.name', 'Brilliant comeback', 'learn.achievement.growth_comeback.desc', 'learn.achievement.growth_comeback.evidence'])
  assert.equal(v.evidence.text, 'Adding came right after 3 tries that did not work out.')
  for (const g of GROWTH) assert.ok(!/\b(minute|hour|fast|speed|quick|streak|night|morning|rank|top)\b/i.test(`${g.name} ${g.desc} ${g.evidence}`), g.id)
  const ce = badgeView('growth_concept_explorer', { skills: 6 })
  assert.deepEqual([ce.desc.params, ce.desc.text], [{ count: A.conceptExplorer }, `Try ${A.conceptExplorer} different skills.`], 'the threshold is a param, not baked into the text')
})

test('growth counters: discoveries on different days, problem solving at stage >= 3, reviews remembered', () => {
  let p = noteDiscovery({}, { q: 'E1', date: '2026-11-20' })
  p = noteDiscovery(p, { q: 'E2', date: '2026-11-20' })
  p = noteDiscovery(p, { q: 'E3', date: '2026-11-21' })
  assert.deepEqual([p.growth.discoveries, p.growth.discoveryDays, p.growth.firstDiscoveryDate], [3, ['2026-11-20', '2026-11-21'], '2026-11-20'])
  assert.equal(p.growth.chosen, 3, 'each discovery taken up is an activity chosen')
  assert.equal(noteDiscovery(p, { q: 'E3', date: '2026-11-21' }).growth.chosen, 3, 'the same one again that day: not twice')
  assert.equal(noteDiscovery(p, { q: 'E4', date: '2026-11-21', inRound: true }).growth.chosen, 3, 'its round counted it already')
  let profile = { levels: {}, suggestions: [] }
  const out = applyAttempt(profile, null, { outcome: 'independent', subject: 'maths', module: 'read', questionId: 'Q', skill: 'maths.x', skillName: 'X', itemLevel: 1, date: dateOf(T0), now: T0, ceiling: 2, stage: 3 })
  assert.equal(out.profile.growth.solved, 1)
  const lowStage = applyAttempt(profile, null, { outcome: 'independent', subject: 'maths', module: 'read', questionId: 'Q', skill: 'maths.x', skillName: 'X', itemLevel: 1, date: dateOf(T0), now: T0, ceiling: 2, stage: 2 })
  assert.equal(lowStage.profile.growth.solved, 0)
  const due = { skill: 'maths.x', subject: 'maths', attempts: 5, mastery: 0.9, box: 2, due: at(-1), probe: { state: 'steady' } }
  profile = applyAttempt(profile, due, { outcome: 'independent', subject: 'maths', module: 'read', questionId: 'Q', skill: 'maths.x', skillName: 'X', itemLevel: 1, date: dateOf(T0), now: T0, ceiling: 2 }).profile
  assert.deepEqual([profile.growth.reviews, profile.growth.reviewsRight], [1, 1])
  const back = applyAttempt({ levels: {}, suggestions: [] }, { skill: 'maths.x', subject: 'maths', attempts: 5, mastery: 0.3, missesSinceSuccess: 3, probe: { state: 'steady' } }, { outcome: 'assisted', subject: 'maths', module: 'read', questionId: 'Q', skill: 'maths.x', skillName: 'X', itemLevel: 1, date: dateOf(T0), now: T0, ceiling: 2 })
  assert.deepEqual(back.events.comeback, { skill: 'maths.x', skillName: 'X', misses: 3 })
})

// ── Evidence for grown-ups ─────────────────────────────────────────────────
test('baseline: the first 10 graded answers, stored once; the most common item level', () => {
  let p = { baselineAcc: { maths: { n: 0, right: 0, levels: {} } } }
  for (let i = 0; i < 10; i++) p = bumpBaseline(p, { subject: 'maths', outcome: i < 7 ? 'independent' : 'incorrect', itemLevel: i < 6 ? 1 : 2, now: at(0, i) })
  assert.deepEqual(p.baseline.maths, { level: 1, accuracy: 0.7, n: 10, at: at(0, 9), source: 'first_attempts' })
  assert.equal(p.baselineAcc.maths, undefined)
  const again = bumpBaseline(p, { subject: 'maths', outcome: 'incorrect', itemLevel: 3, now: at(2) })
  assert.deepEqual(again.baseline.maths, p.baseline.maths, 'stored once')
  assert.equal(commonLevel({ 2: 3, 1: 3, 4: 1 }), 1)
  assert.equal(commonLevel({}), null)
})

test('evidence: baseline vs now, stages, independence, retention, misconceptions; every insight cites its numbers; no time, no IQ', () => {
  const journal = [
    { w: '2026-10-26', s: 'maths', top: 1, ind: 4, ast: 4, rv: 0, rvc: 0, disc: 0 },
    { w: '2026-11-02', s: 'maths', top: 3, ind: 9, ast: 3, rv: 4, rvc: 3, disc: 1 },
    { w: '2026-11-02', s: 'english', top: null, ind: 0, ast: 1, rv: 0, rvc: 0, disc: 0 },
  ]
  const profile = {
    levels: { maths: { level: 3 } },
    baseline: { maths: { level: 1, accuracy: 0.5, n: 10, at: at(-10), source: 'first_attempts' } },
    band: { maths: { recent: [...Array(16).fill(1), ...Array(4).fill(0)], tilt: 'hold' } },
    journal,
    growth: { reviews: 4, reviewsRight: 3, discoveries: 1 },
  }
  const rows = [
    { ...masteredRow('maths.count', at(1)), misconceptions: [{ text: 'counted twice', count: 2, q: 'Q1', module: 'read', resolvedAt: at(1) }] },
    { skill: 'maths.add', subject: 'maths', name: 'Adding', attempts: 3, mastery: 0.4, byStage: [{ s: 3, n: 3, c: 1, i: 1 }], misconceptions: [{ text: 'added instead', count: 1, q: 'Q2', module: 'read', resolvedAt: null }] },
  ]
  const notes = new Map([['maths|read|Q1', { parentNote: 'Counting each thing once.' }]])
  const ev = evidenceView({ profile, skills: rows, catalog, notes, activity: { rounds: 7, days: 4 }, decisions: [{ at: T0, type: 'level_up', subject: 'maths', from: 1, to: 2, reason: 'level_up', evidence: { acc: 0.9, n: 12, days: 2 } }], now: at(3) })
  assert.deepEqual(ev.baseline.maths, { level: 1, accuracy: 0.5, n: 10, at: at(-10), source: 'first_attempts' })
  assert.deepEqual(ev.current.maths, { level: 3, accuracy: 0.8, n: 20 })
  assert.deepEqual(ev.byStage[1], { attempts: 4, correct: 4, independent: 4 })
  assert.deepEqual(ev.byStage[3], { attempts: 3, correct: 1, independent: 1 })
  assert.deepEqual(Object.keys(ev.byStage), ['0', '1', '2', '3', '4', '5'])
  assert.deepEqual(ev.stageReached, [{ week: '2026-10-26', subject: 'maths', stage: 1 }, { week: '2026-11-02', subject: 'maths', stage: 3 }])
  assert.deepEqual(ev.independence, [{ week: '2026-10-26', independent: 4, assisted: 4 }, { week: '2026-11-02', independent: 9, assisted: 4 }])
  assert.deepEqual([ev.retention.reviews, ev.retention.correct, ev.retention.rate], [4, 3, 0.75])
  assert.deepEqual(ev.retention.byWeek[1], { week: '2026-11-02', reviews: 4, correct: 3 })
  assert.deepEqual([ev.misconceptions.seen, ev.misconceptions.resolved], [2, 1])
  assert.deepEqual(ev.misconceptions.items.find((m) => m.skill === 'maths.count'), { skill: 'maths.count', skillName: 'Counting', subject: 'maths', count: 2, parentNote: 'Counting each thing once.', resolvedAt: at(1) })
  assert.deepEqual(ev.activity, { rounds: 7, days: 4, discoveries: 1, explored: 2, chosen: 0 })
  assert.equal(ev.decisions[0].reason.key, 'learn.decision.level_up')
  const codes = ev.insights.map((i) => i.key.replace('learn.insight.', ''))
  for (const c of ['baseline_now', 'level_now', 'stage_reached', 'independence_week', 'retention', 'misconceptions_resolved', 'mastered', 'discoveries']) assert.ok(codes.includes(c), c)
  const bn = ev.insights.find((i) => i.key === 'learn.insight.baseline_now')
  assert.equal(bn.text, 'Maths: 50% right in the first 10 answers, 80% right in the last 20.')
  for (const i of ev.insights) {
    for (const p of placeholders(templateOf(INSIGHTS, i.key.replace('learn.insight.', ''), i.params))) assert.ok(p in i.params, `${i.key}: {{${p}}}`)
    for (const n of i.text.match(/\d+/g) || []) assert.ok(JSON.stringify(i.params).includes(n), `${i.key}: ${n} is cited in params`)
    assert.ok(!/\b(minutes?|hours?|time spent|screen|IQ|gifted|genius|smart|clever)\b/i.test(i.text), i.text)
  }
  // plural forms by params.count: never "1 skills"
  const one = evidenceView({
    profile: { growth: { reviews: 4, reviewsRight: 1, discoveries: 1, chosen: 3 }, journal: [{ w: '2026-11-02', s: 'maths', top: 1, ind: 0, ast: 1, rv: 0, rvc: 0, disc: 0 }] },
    skills: [{ ...masteredRow('maths.count', at(1)), misconceptions: [{ text: 'a', count: 2, resolvedAt: at(1) }, { text: 'b', count: 1, resolvedAt: null }] }],
  })
  const text = (code) => one.insights.find((i) => i.key === `learn.insight.${code}`)?.text
  assert.equal(text('mastered'), '1 skill mastered: right on different questions and remembered on a later day.')
  assert.equal(text('discoveries'), '1 everyday discovery question answered.')
  assert.equal(text('retention'), '1 of 4 reviews was remembered (25%).')
  assert.equal(text('misconceptions_resolved'), '1 mix-up is now cleared up (of 2 noticed so far).')
  assert.equal(one.activity.chosen, 3)
  for (const i of one.insights) assert.ok(!/\b1 (skills|questions|reviews were|mix-ups)\b/.test(i.text), i.text)
  for (const code of ['mastered', 'discoveries', 'retention', 'misconceptions_resolved', 'baseline_now', 'independence_week', 'independence_first']) {
    assert.ok(INSIGHTS[`${code}_one`] && INSIGHTS[`${code}_other`], `${code} has _one/_other`)
    assert.ok(placeholders(INSIGHTS[`${code}_other`]).includes('count'), `${code}_other cites {{count}}`)
  }
  const none = evidenceView({ profile: {}, skills: [] })
  assert.deepEqual(none.insights.map((i) => i.key), ['learn.insight.not_enough'])
  assert.deepEqual([none.baseline, none.current, none.misconceptions.seen], [{}, {}, 0])
})

test('every i18n text renders: welcome, next, decisions, insights, achievements, explain', () => {
  const all = { ...REASONS, ...INSIGHTS, ...EXPLAIN }
  for (const kind of Object.values(WELCOME)) Object.assign(all, kind)
  for (const v of Object.values(NEXT)) { all[`${v.title}`] = v.title; all[`${v.why}`] = v.why }
  for (const g of GROWTH) Object.assign(all, { [g.id]: g.name, [`${g.id}.d`]: g.desc, [`${g.id}.e`]: g.evidence })
  for (const [k, t] of Object.entries(all)) {
    assert.equal(typeof t, 'string', k)
    assert.ok(t.length > 0 && t.length <= 220, k)
    assert.ok(!/\b(smart|clever|genius|gifted)\b/i.test(t), `${k}: no labels`)
  }
})
