// Unit tests for the adaptive engine's policy rules (no database):
// what counts, mastery, level policy, escalation, spaced repetition, feedback.
require('./helpers') // no database connections
const test = require('node:test')
const assert = require('node:assert/strict')
const cfg = require('../config/learning')
const { deriveSkill, isGraded, isServable, metaOf } = require('../services/learning/questionMeta')
const { answerStatus, classifyAttempt, nextMastery, updateSkill, skillState } = require('../services/learning/mastery')
const { recordLevelAttempt, evaluateLevel, freshLevel } = require('../services/learning/levelPolicy')
const { escalate } = require('../services/learning/support')
const { schedule, isReviewDue } = require('../services/learning/spacing')
const { chooseMessage, MESSAGES, SUGGESTIONS, pickKey } = require('../services/learning/feedback')
const { applyAttempt } = require('../services/learning/engine')

const DAY = 86400000
const HOUR = 3600000
const T0 = new Date('2026-11-02T09:00:00Z') // a Monday
const at = (days, hours = 0) => new Date(T0.getTime() + days * DAY + hours * HOUR)
const dateOf = (d) => d.toISOString().slice(0, 10)

// ── What a question is ──────────────────────────────────────────────────────
test('questionMeta: skill = skill || skillIds[0] || slug(academic.skill) || subject.type, always subject-prefixed', () => {
  assert.equal(deriveSkill({ skill: 'maths.subtraction-within-10', skillIds: ['x'] }, 'maths'), 'maths.subtraction-within-10')
  assert.equal(deriveSkill({ skillIds: ['counting-and-producing-the-numeral'] }, 'maths'), 'maths.counting-and-producing-the-numeral')
  assert.equal(deriveSkill({ academic: { skill: 'Vowel teams: oa' } }, 'english'), 'english.vowel-teams-oa')
  assert.equal(deriveSkill({ question_type: 'typed_number_count' }, 'maths'), 'maths.typed-number-count')
  assert.equal(deriveSkill({}, 'science'), 'science.general')
})

test('questionMeta: graded derivation; excluded items are never served', () => {
  assert.equal(isGraded({ graded: false, interaction: 'tap_mcq' }), false)
  assert.equal(isGraded({ graded: true, interaction: 'mic_record' }), true)
  assert.equal(isGraded({ interaction: 'mic_record', speech_scoring: { expected_keywords: [] } }), false, 'open speech is practice only')
  assert.equal(isGraded({ interaction: 'mic_record', speech_scoring: { expected_keywords: ['soap'] } }), true)
  assert.equal(isGraded({ interaction: 'typed_long', correct_answer: 'open' }), false)
  assert.equal(isGraded({ interaction: 'typed_long', correct_answer: 'I open my umbrella.' }), true)
  assert.equal(isGraded({ interaction: 'tap_mcq', qa: { status: 'needs_review' } }), false)
  assert.equal(isServable({ qa: { status: 'excluded' } }), false)
  assert.equal(isServable({ qa: { status: 'verified' } }), true)
  assert.equal(isServable({}), true)
  const m = metaOf({ id: 'A', level: 12, age_band: 'young', interaction: 'tap_mcq' }, 'maths')
  assert.equal(m.level, 8, 'levels are clamped to 0..8')
  assert.equal(m.ageBand, 'young')
})

// ── What counts ─────────────────────────────────────────────────────────────
test('only graded correct/close/incorrect from untimed modes count; uncertain, ungraded and timed never do', () => {
  assert.deepEqual(classifyAttempt({ status: 'correct', firstTry: true, hintsUsed: 0 }), { countable: true, outcome: 'independent', why: null })
  assert.equal(classifyAttempt({ status: 'correct', firstTry: true, hintsUsed: 1 }).outcome, 'assisted')
  assert.equal(classifyAttempt({ status: 'correct', firstTry: false, hintsUsed: 0 }).outcome, 'assisted')
  assert.equal(classifyAttempt({ status: 'correct', firstTry: null }).outcome, 'independent', 'old clients: one try per question')
  assert.equal(classifyAttempt({ status: 'close' }).outcome, 'close')
  assert.equal(classifyAttempt({ status: 'incorrect' }).outcome, 'incorrect')
  for (const status of ['uncertain', 'ungraded', 'whatever']) assert.equal(classifyAttempt({ status }).countable, false, status)
  assert.equal(classifyAttempt({ status: 'incorrect', graded: false }).countable, false, 'ungraded item')
  assert.equal(classifyAttempt({ status: 'incorrect', mode: 'warrior' }).countable, false, 'timed game')
  assert.equal(classifyAttempt({ status: 'incorrect', timedOut: true }).countable, false, 'time ran out')
  assert.equal(classifyAttempt({ status: 'incorrect', mode: 'baseline' }).countable, false, 'placement check-in')
})

test('answer status: new body wins; old body is right/wrong, but old speech answers are uncertain', () => {
  assert.equal(answerStatus({ status: 'close', correct: true }, {}), 'close')
  assert.equal(answerStatus({ uncertain: true, correct: true }, {}), 'uncertain')
  assert.equal(answerStatus({ correct: true }, { interaction: 'tap_mcq' }), 'correct')
  assert.equal(answerStatus({ correct: false }, { interaction: 'tap_mcq' }), 'incorrect')
  assert.equal(answerStatus({ correct: true }, { interaction: 'mic_record' }), 'uncertain', 'old clients marked a failed microphone correct')
})

// ── Mastery ─────────────────────────────────────────────────────────────────
test('mastery: a right answer never lowers it; independent weighs most; a miss lowers it', () => {
  assert.ok(nextMastery(0.5, 'independent') > nextMastery(0.5, 'assisted'))
  assert.ok(nextMastery(0.5, 'assisted') > 0.5)
  assert.equal(nextMastery(0.95, 'assisted'), 0.95, 'help never lowers mastery')
  assert.ok(nextMastery(0.8, 'incorrect') < 0.8)
  assert.ok(nextMastery(0.8, 'close') < 0.8 && nextMastery(0.8, 'close') > nextMastery(0.8, 'incorrect'))
  let m = 0
  for (let i = 0; i < 20; i++) m = nextMastery(m, 'independent')
  assert.ok(m > 0.99 && m <= 1)
})

test('skill state: new -> learning -> mastered (needs recall on two separate days) -> review_due', () => {
  let s = null
  assert.equal(skillState(s, T0), 'new')
  for (let i = 0; i < 6; i++) s = updateSkill(s || {}, { outcome: 'independent', itemLevel: 1 }, at(0, i / 10)).skill
  assert.ok(s.mastery >= cfg.masteredAt)
  assert.equal(s.box, 1, 'same day: one box only')
  assert.equal(skillState(s, at(0, 1)), 'learning')
  const r = updateSkill(s, { outcome: 'independent', itemLevel: 1 }, at(1, 1))
  assert.equal(r.skill.box, 2)
  assert.equal(skillState(r.skill, at(1, 2)), 'mastered')
  assert.equal(r.events.newlyMastered, true)
  assert.equal(skillState(r.skill, at(5)), 'review_due')
})

test('misconceptions: only a few, most frequent first', () => {
  let s = {}
  for (const t of ['a', 'b', 'a', 'c', 'd', 'a', 'b']) s = updateSkill(s, { outcome: 'incorrect', misconception: t }, T0).skill
  assert.equal(s.misconceptions.length, cfg.limits.misconceptions)
  assert.deepEqual(s.misconceptions.slice(0, 2).map((m) => [m.text, m.count]), [['a', 3], ['b', 2]])
})

// ── Level policy ────────────────────────────────────────────────────────────
const fill = (ls, list) => list.reduce((acc, [outcome, itemLevel, date]) => recordLevelAttempt(acc, { outcome, credit: cfg.credit[outcome], itemLevel, date }), ls)
const days2 = (n, level, outcome = 'independent') => Array.from({ length: n }, (_, i) => [outcome, level, i < n / 2 ? '2026-11-02' : '2026-11-03'])

test('advance: >= 0.85 after >= 12 graded attempts at the level over >= 2 days', () => {
  const ls = fill(freshLevel(2, 'default'), days2(12, 2))
  const ev = evaluateLevel(ls, { ceiling: 5 })
  assert.equal(ev.status, 'advancing')
  assert.equal(ev.action, 'advance')
  // 11 attempts: advancing but no move yet
  assert.equal(evaluateLevel(fill(freshLevel(2, 'default'), days2(11, 2)), { ceiling: 5 }).action, null)
  // one day only: no move yet
  const oneDay = fill(freshLevel(2, 'default'), Array.from({ length: 15 }, () => ['independent', 2, '2026-11-02']))
  assert.equal(evaluateLevel(oneDay, { ceiling: 5 }).status, 'advancing')
  assert.equal(evaluateLevel(oneDay, { ceiling: 5 }).action, null)
  // the content ceiling: nothing above -> no move
  assert.equal(evaluateLevel(ls, { ceiling: 2 }).action, null)
  assert.equal(evaluateLevel(ls, { ceiling: null }).action, null)
})

test('practice 0.60-0.84 and support < 0.60; few answers say "new"', () => {
  const mixed = (right, wrong) => [...Array(right).fill(['independent', 1, '2026-11-02']), ...Array(wrong).fill(['incorrect', 1, '2026-11-03'])]
  assert.equal(evaluateLevel(fill(freshLevel(1, 'default'), mixed(7, 3))).status, 'practice')
  assert.equal(evaluateLevel(fill(freshLevel(1, 'default'), mixed(4, 6))).status, 'support')
  assert.equal(evaluateLevel(fill(freshLevel(1, 'default'), mixed(2, 1))).status, 'new')
  assert.equal(evaluateLevel(freshLevel(1, 'default')).accuracy, null)
})

test('never lower automatically: sustained support only SUGGESTS a step down (and not below 0)', () => {
  const struggling = fill(freshLevel(3, 'default'), days2(14, 3, 'incorrect'))
  const ev = evaluateLevel(struggling, { ceiling: 5 })
  assert.equal(ev.status, 'support')
  assert.equal(ev.action, 'suggest_down')
  assert.equal(evaluateLevel(fill(freshLevel(0, 'default'), days2(14, 0, 'incorrect')), { ceiling: 5 }).action, null)
  // snoozed after a "no thanks"
  assert.equal(evaluateLevel({ ...struggling, snoozeDown: at(7) }, { ceiling: 5, now: T0 }).action, null)
  // the pure core never moves a level down
  let profile = { levels: { maths: freshLevel(3, 'default') }, suggestions: [] }
  let skill = null
  for (let i = 0; i < 30; i++) {
    const now = at(Math.floor(i / 10), i % 10)
    const out = applyAttempt(profile, skill, { outcome: 'incorrect', subject: 'maths', module: 'read', skill: 'maths.x', skillName: 'X', itemLevel: 3, date: dateOf(now), now, ceiling: 5 })
    profile = out.profile; skill = out.skill
    assert.equal(profile.levels.maths.level, 3)
    assert.equal(out.levelChange, null)
  }
  assert.ok(profile.suggestions.some((s) => s.type === 'level_down' && s.to === 2))
})

test('locked levels and holds never move: the engine suggests instead', () => {
  const locked = fill({ ...freshLevel(2, 'guardian'), locked: true, lockedBy: 'guardian' }, days2(14, 2))
  assert.equal(evaluateLevel(locked, { ceiling: 5 }).action, 'suggest_up')
  const held = fill(freshLevel(2, 'default'), days2(14, 2))
  assert.equal(evaluateLevel(held, { ceiling: 5, hold: true }).action, 'suggest_up')
  let profile = { levels: { maths: { ...freshLevel(2, 'teacher'), locked: true, lockedBy: 'teacher' } }, suggestions: [] }
  let skill = null
  for (let i = 0; i < 20; i++) {
    const now = at(Math.floor(i / 7), i % 7)
    const out = applyAttempt(profile, skill, { outcome: 'independent', subject: 'maths', module: 'read', skill: 'maths.x', skillName: 'X', itemLevel: 2, date: dateOf(now), now, ceiling: 5 })
    profile = out.profile; skill = out.skill
  }
  assert.equal(profile.levels.maths.level, 2)
  assert.equal(profile.suggestions.filter((s) => s.type === 'level_up').length, 1, 'one suggestion, not one per answer')
})

test('which attempts count for the level: at the level; above only when right; below and unlevelled never', () => {
  let ls = freshLevel(3, 'default')
  ls = recordLevelAttempt(ls, { outcome: 'incorrect', credit: 0, itemLevel: 2, date: 'd' })
  ls = recordLevelAttempt(ls, { outcome: 'incorrect', credit: 0, itemLevel: 4, date: 'd' })
  ls = recordLevelAttempt(ls, { outcome: 'incorrect', credit: 0, itemLevel: null, date: 'd' })
  assert.equal(ls.window.length, 0, 'warm-ups and stretch misses never count against')
  ls = recordLevelAttempt(ls, { outcome: 'independent', credit: 1, itemLevel: 4, date: 'd' })
  ls = recordLevelAttempt(ls, { outcome: 'incorrect', credit: 0, itemLevel: 3, date: 'd' })
  assert.equal(ls.window.length, 2)
  assert.equal(ls.attempts, 2)
})

test('time is never an input: the same answers at any speed give the same result', () => {
  const run = (timeTaken) => {
    let profile = { levels: { maths: freshLevel(1, 'default') }, suggestions: [] }
    let skill = null
    for (let i = 0; i < 16; i++) {
      const now = at(Math.floor(i / 8), i % 8)
      const cls = classifyAttempt({ status: i % 5 ? 'correct' : 'incorrect', firstTry: true, hintsUsed: 0, timeTaken })
      const out = applyAttempt(profile, skill, { outcome: cls.outcome, subject: 'maths', module: 'read', skill: 'maths.x', skillName: 'X', itemLevel: 1, date: dateOf(now), now, ceiling: 5 })
      profile = out.profile; skill = out.skill
    }
    return { mastery: skill.mastery, level: profile.levels.maths.level, window: profile.levels.maths.window }
  }
  assert.deepEqual(run(1), run(600))
})

// ── Escalation ──────────────────────────────────────────────────────────────
test('escalation: words -> pictures -> guided -> easier item -> park; an independent right answer steps down', () => {
  let s = { supportStep: 0, missesAtStep: 0 }
  const steps = []
  for (let i = 0; i < 4; i++) { s = { ...s, ...escalate(s, 'incorrect', T0) }; steps.push([s.supportStep, s.strategy]) }
  assert.deepEqual(steps, [[1, 'visual'], [2, 'guided'], [3, 'simpler'], [4, 'reassess']])
  assert.equal(new Date(s.parkedUntil).getTime(), T0.getTime() + DAY, 'parked until tomorrow')
  const again = escalate(s, 'incorrect', T0)
  assert.equal(again.reparked, true)
  assert.equal(escalate(s, 'independent', T0).supportStep, 0, 'after a break, a right answer starts fresh')
  assert.equal(escalate(s, 'assisted', T0).supportStep, 2)
  assert.equal(escalate({ supportStep: 2 }, 'independent', T0).supportStep, 1)
  assert.equal(escalate({ supportStep: 2 }, 'assisted', T0).supportStep, 2)
  assert.equal(escalate({ supportStep: 2 }, 'close', T0).supportStep, 2, 'a near miss is not a miss')
  assert.equal(escalate({ supportStep: 0 }, 'independent', T0).supportStep, 0)
})

test('the strategy that came before a success after a struggle is remembered', () => {
  let s = updateSkill({}, { outcome: 'incorrect' }, T0).skill
  assert.equal(s.supportStep, 1)
  const r = updateSkill(s, { outcome: 'independent', strategyUsed: 'visual' }, at(0, 1))
  assert.equal(r.events.strategyCredited, 'visual')
  assert.equal(r.skill.helpedBy, 'visual')
  assert.equal(r.skill.supportStep, 0)
  const plain = updateSkill(r.skill, { outcome: 'independent', strategyUsed: 'words' }, at(0, 2))
  assert.equal(plain.events.strategyCredited, null, 'no struggle, nothing to credit')
  let profile = { levels: {}, suggestions: [], explanationPrefs: { words: 0, visual: 0, guided: 0, simpler: 0 } }
  const out = applyAttempt(profile, { ...s, skill: 'maths.x', subject: 'maths' }, { outcome: 'independent', strategyUsed: 'guided', subject: 'maths', module: 'read', skill: 'maths.x', skillName: 'X', itemLevel: 1, date: '2026-11-02', now: T0, ceiling: 3 })
  profile = out.profile
  assert.equal(profile.explanationPrefs.guided, 1)
})

// ── Spaced repetition ───────────────────────────────────────────────────────
test('Leitner: intervals 0,1,3,7,14,30 days; promotion only when due; a miss goes back to box 0; parking -> tomorrow', () => {
  let st = { box: 0, due: null }
  let now = T0
  const seen = []
  for (let i = 0; i < 6; i++) {
    st = schedule(st, 'independent', now)
    seen.push([st.box, Math.round((st.due - now) / DAY)])
    now = new Date(st.due)
  }
  assert.deepEqual(seen, [[1, 1], [2, 3], [3, 7], [4, 14], [5, 30], [5, 30]])
  const early = schedule({ box: 3, due: at(7) }, 'independent', at(1))
  assert.equal(early.box, 3, 'not due yet: no jump')
  assert.equal(schedule({ box: 3, due: at(7) }, 'incorrect', at(8)).box, 0)
  assert.equal(schedule({ box: 3, due: at(7) }, 'incorrect', at(8)).due.getTime(), at(8).getTime())
  const assisted = schedule({ box: 2, due: at(0) }, 'assisted', at(1))
  assert.equal(assisted.box, 2)
  assert.equal(assisted.due.getTime(), at(4).getTime())
  const park = schedule({ box: 4, due: at(0) }, 'incorrect', at(1), { park: true })
  assert.deepEqual([park.box, park.due.getTime()], [1, at(2).getTime()])
  assert.equal(isReviewDue({ box: 0, due: at(0) }, at(1)), false, 'box 0 is learning, not a review')
  assert.equal(isReviewDue({ box: 2, due: at(0) }, at(1)), true)
})

// ── Feedback messages ───────────────────────────────────────────────────────
const ctxFor = (prev, outcome, now, extra = {}) => {
  const r = updateSkill(prev, { outcome, strategyUsed: extra.strategyUsed }, now)
  return { ctx: { status: outcome === 'incorrect' ? 'incorrect' : 'correct', events: r.events, skill: { id: 'maths.x', name: 'Taking away' }, now, firstTry: true, ...extra }, skill: r.skill }
}

test('"remembered from yesterday" only after a real miss >= 20 h earlier', () => {
  const missed = updateSkill({ attempts: 3, mastery: 0.5, lastOutcome: 'independent' }, { outcome: 'incorrect' }, T0).skill
  const soon = ctxFor(missed, 'independent', at(0, 2))
  assert.notEqual(chooseMessage(soon.ctx).key, 'rememberedYesterday')
  const nextDay = ctxFor(missed, 'independent', at(0, 21))
  assert.equal(chooseMessage(nextDay.ctx).key, 'rememberedYesterday')
  assert.equal(chooseMessage(nextDay.ctx).params.skill.name, 'Taking away')
  assert.equal(chooseMessage(ctxFor(missed, 'independent', at(4)).ctx).key, 'cameBack')
  // never missed: never "remembered"
  const fine = updateSkill({ attempts: 3, mastery: 0.5, lastOutcome: 'independent', lastAt: T0 }, { outcome: 'independent' }, at(1)).skill
  for (let i = 0; i < 5; i++) assert.notEqual(chooseMessage(ctxFor(fine, 'independent', at(2)).ctx, { counter: i }).key, 'rememberedYesterday')
})

test('messages vary and never repeat the same key twice in a row', () => {
  let skill = {}
  let last = ''
  const keys = []
  for (let i = 0; i < 12; i++) {
    const { ctx, skill: next } = ctxFor(skill, i % 4 === 3 ? 'incorrect' : 'independent', at(0, i / 10), { interaction: 'tap_mcq' })
    const m = chooseMessage(ctx, { lastKey: last, counter: i })
    assert.notEqual(m.key, last)
    assert.ok(MESSAGES[m.key], m.key)
    assert.equal(typeof m.text, 'string')
    assert.ok(!/\{\{/.test(m.text), 'every placeholder filled')
    keys.push(m.key); last = m.key; skill = next
  }
  assert.ok(new Set(keys).size >= 5, `varied: ${keys.join(', ')}`)
  assert.equal(pickKey([['a'], ['b']], 'a'), 'b')
})

test('escalation and status messages match what happens next', () => {
  const step = (prev) => ctxFor(prev, 'incorrect', T0)
  let s = { attempts: 2, mastery: 0.5 }
  const got = []
  for (let i = 0; i < 4; i++) { const { ctx, skill } = step(s); got.push(chooseMessage(ctx).key); s = skill }
  assert.deepEqual(got, ['tryPictures', 'tryTogether', 'easierFirst', 'parkIt'])
  assert.equal(chooseMessage({ status: 'uncertain', reason: 'no_speech' }).key, 'noSpeech')
  assert.equal(chooseMessage({ status: 'uncertain', reason: 'no_speech' }, { lastKey: 'noSpeech' }).key, 'noSpeechAgain')
  assert.equal(chooseMessage({ status: 'uncertain', reason: 'mic_blocked' }).key, 'micBlocked')
  assert.equal(chooseMessage({ status: 'ungraded' }).key, 'practiceOnly')
  const close = ctxFor({ attempts: 2 }, 'close', T0)
  assert.equal(chooseMessage({ ...close.ctx, status: 'close', reason: 'spelling' }).key, 'closeSpelling')
  assert.equal(chooseMessage({ status: 'correct', events: null }).key, 'rightAnswer', 'timed game: plain reply')
  const levelUp = ctxFor({ attempts: 20, mastery: 0.9 }, 'independent', T0, { levelChange: { subject: 'maths', from: 2, to: 3 } })
  assert.deepEqual([chooseMessage(levelUp.ctx).key, chooseMessage(levelUp.ctx).params.level], ['levelUp', 3])
})

test('message texts: process praise, no labels, every placeholder known', () => {
  const all = { ...MESSAGES, ...SUGGESTIONS }
  for (const [key, text] of Object.entries(all)) {
    assert.ok(!/\b(smart|clever|genius|brilliant|gifted|good boy|good girl|easy)\b/i.test(text), `${key}: ${text}`)
    for (const [, p] of text.matchAll(/\{\{(\w+)\}\}/g)) assert.ok(['skill', 'next', 'level', 'count', 'to'].includes(p), `${key}: {{${p}}}`)
    assert.ok(text.length <= 140, key)
  }
})

// ── Who set a level; misconception sources and notes ────────────────────────
test('levels say who set them and when (role and short name, never an email)', () => {
  const { levelsView, difficulties, noteKey } = require('../services/learning/views')
  assert.deepEqual(freshLevel(2, 'engine', { now: T0 }).setBy, { role: 'engine', name: '' })
  assert.deepEqual(freshLevel(2, 'self').setBy, { role: 'learner', name: '' })
  assert.deepEqual(freshLevel(2, 'baseline').setBy, { role: 'learner', name: '' })
  assert.equal(freshLevel(2, 'default').setBy.role, null)
  const profile = {
    levels: {
      maths: { ...freshLevel(3, 'engine', { now: T0 }), locked: true, lockedBy: 'guardian', setAt: at(1), setBy: { role: 'guardian', name: 'Priya R.' } },
      english: freshLevel(1, 'default', { now: T0 }),
    },
  }
  const v = levelsView(profile, { maths: 5 })
  assert.deepEqual([v.maths.source, v.maths.locked, v.maths.lockedBy, v.maths.setBy], ['engine', true, 'guardian', { role: 'guardian', name: 'Priya R.' }])
  assert.equal(new Date(v.maths.setAt).getTime(), at(1).getTime())
  assert.deepEqual([v.english.lockedBy, v.english.setBy, v.science.setBy], [null, null, null])

  // A misconception remembers the question of its latest occurrence; the view adds that question's notes.
  let s = updateSkill({}, { outcome: 'incorrect', misconception: 'nd heard as d', questionId: 'Q1', module: 'listen' }, T0).skill
  s = updateSkill(s, { outcome: 'incorrect', misconception: 'nd heard as d', questionId: 'Q2', module: 'read' }, at(1)).skill
  assert.deepEqual([s.misconceptions[0].q, s.misconceptions[0].module, s.misconceptions[0].count], ['Q2', 'read', 2])
  const notes = new Map([[noteKey('english', 'read', 'Q2'), { parentNote: 'Reading the end of a word carefully.', teacherAction: 'Tap each sound in the final blend.' }]])
  const d = difficulties([{ ...s, skill: 'english.blends', subject: 'english', name: 'Blends' }], null, notes)
  assert.deepEqual([d[0].misconception, d[0].parentNote, d[0].teacherAction], ['nd heard as d', 'Reading the end of a word carefully.', 'Tap each sound in the final blend.'])
  assert.equal(difficulties([{ ...s, skill: 'english.blends', subject: 'english' }], null, new Map())[0].parentNote, null)
})
