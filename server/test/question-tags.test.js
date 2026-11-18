// Unit tests for the question bank and test-rule helpers (no database).
const test = require('node:test')
const assert = require('node:assert/strict')
const { scoreItem, isCorrect, answerKey } = require('../utils/scoreAnswer')
const { normaliseQuestion } = require('../utils/questionShape')
const { parseImport, toCsv, parseDelimited } = require('../utils/questionCsv')
const R = require('../utils/testRules')
const { itemAnalysis, distribution } = require('../utils/testAnalysis')
const { tagPatch } = require('../scripts/backfill-question-tags')

test('scoreAnswer: same rules as the client, plus partial credit', () => {
  assert.equal(isCorrect({ interaction: 'tap_mcq', correct_answer: 'soap', accepted_answers: ['soap'] }, ' Soap '), true)
  assert.equal(isCorrect({ interaction: 'tap_mcq', correct_answer: 'soap' }, ['soap']), false)
  const ms = { interaction: 'multi_select', correct_answer: ['a', 'b'] }
  assert.deepEqual(scoreItem(ms, ['a', 'b'], { points: 2 }), { correct: true, fraction: 1, score: 2 })
  assert.equal(scoreItem(ms, ['a'], { points: 2 }).score, 1)
  assert.equal(scoreItem(ms, ['a', 'c'], { points: 2 }).score, 0) // a wrong pick cancels a right one
  assert.equal(scoreItem(ms, ['a'], { points: 2, partialCredit: false }).score, 0)
  const order = { interaction: 'drag_order', correct_answer: ['1', '2', '3', '4'] }
  assert.equal(scoreItem(order, ['1', '2', '4', '3'], { points: 4 }).score, 2)
  const pairs = { interaction: 'match_pairs', correct_answer: [['cat', '🐱'], ['dog', '🐶']] }
  assert.equal(scoreItem(pairs, [['cat', '🐱'], ['dog', '🐱']], { points: 2 }).score, 1)
  const bins = { interaction: 'sort_bins', correct_answer: { animals: ['cat', 'dog'], vehicles: ['bus'] } }
  assert.equal(scoreItem(bins, { animals: ['cat'], vehicles: ['bus', 'dog'] }, { points: 3 }).score, 2)
  assert.equal(scoreItem({ interaction: 'letter_bank', correct_answer: 'cat' }, ['c', 'a', 't']).correct, true)
  assert.equal(scoreItem({ interaction: 'mic_record', speech_scoring: { expected_keywords: ['soap'] } }, { unsupported: true }).correct, false)
  assert.equal(answerKey([['a', 'b']]), 'a→b')
})

test('questionShape: every interaction validated into the widget shape', () => {
  const ok = (q) => { const r = normaliseQuestion({ instruction: 'Do it', ...q }); assert.ok(r.data, JSON.stringify(r.errors)); return r.data }
  const bad = (q, field) => { const r = normaliseQuestion({ instruction: 'Do it', ...q }); assert.ok(r.errors?.some((e) => e.field === field), JSON.stringify(r)); }
  assert.deepEqual(ok({ interaction: 'tap_mcq', options: ['a', 'b'], correct_answer: 'b' }).accepted_answers, ['b'])
  bad({ interaction: 'tap_mcq', options: ['a', 'b'], correct_answer: 'c' }, 'correct_answer')
  bad({ interaction: 'tap_mcq', options: ['a', 'a'], correct_answer: 'a' }, 'options')
  assert.deepEqual(ok({ interaction: 'true_false', correct_answer: 'True' }).options, ['True', 'False'])
  ok({ interaction: 'multi_select', options: ['a', 'b', 'c'], correct_answer: ['a', 'c'] })
  assert.deepEqual(ok({ interaction: 'drag_order', correct_answer: ['x', 'y', 'z'] }).options, ['x', 'y', 'z'])
  ok({ interaction: 'tap_sequence', options: ['🍎', '🍌'], correct_answer: ['🍎'] })
  assert.deepEqual(ok({ interaction: 'letter_bank', correct_answer: 'cat' }).options, ['c', 'a', 't'])
  bad({ interaction: 'letter_bank', correct_answer: 'cat', options: ['c', 'a', 't', 'x'] }, 'options')
  assert.deepEqual(ok({ interaction: 'match_pairs', correct_answer: [['cat', '🐱'], ['dog', '🐶']] }).options, ['🐱', '🐶'])
  assert.deepEqual(ok({ interaction: 'sort_bins', correct_answer: { a: ['1'], b: ['2', '3'] } }).options, ['1', '2', '3'])
  bad({ interaction: 'sort_bins', correct_answer: { a: ['1'], b: ['1'] } }, 'correct_answer')
  ok({ interaction: 'typed_short', correct_answer: 'seven', accepted_answers: ['7'] })
  ok({ interaction: 'typed_long', correct_answer: 'A model answer' })
  assert.deepEqual(ok({ interaction: 'mic_record', speech_scoring: { expected_keywords: ['soap'] } }).speech_scoring.expected_keywords, ['soap'])
  bad({ interaction: 'mic_record' }, 'speech_scoring')
  bad({ interaction: 'nope' }, 'interaction')
  const tags = ok({ interaction: 'typed_short', correct_answer: 'x', skillIds: ['Fractions Basics', 'fractions basics'], difficulty: 4, gradeBand: '3-5', curriculumCode: 'NC-Y4' })
  assert.deepEqual(tags.skillIds, ['fractions-basics'])
  assert.equal(tags.difficulty, 4)
  bad({ interaction: 'typed_short', correct_answer: 'x', difficulty: 9 }, 'difficulty')
  bad({ interaction: 'typed_short', correct_answer: 'x', imageUrl: 'javascript:alert(1)' }, 'imageUrl')
})

test('CSV/paste import and export round trip', () => {
  const csv = 'interaction,instruction,options,correct_answer,skills,difficulty\n' +
    'tap_mcq,"Pick, the cat",cat|dog,cat,animals,2\n' +
    'match_pairs,Match,,"cat=🐱|dog=🐶",,\n' +
    'sort_bins,Sort,,"animals: cat, dog | vehicles: bus",,'
  const p = parseImport(csv)
  assert.equal(p.format, 'csv')
  assert.equal(p.rows[0].input.instruction, 'Pick, the cat')
  for (const r of p.rows) assert.ok(normaliseQuestion(r.input).data, JSON.stringify(normaliseQuestion(r.input).errors))
  const out = toCsv(p.rows.map((r) => normaliseQuestion(r.input).data))
  const again = parseImport(out)
  assert.deepEqual(normaliseQuestion(again.rows[2].input).data.correct_answer, { animals: ['cat', 'dog'], vehicles: ['bus'] })
  const text = parseImport('1. What is 3 + 4?\na) 6\nb) 7 *\n\nSpell cat\nAnswer: cat')
  assert.equal(text.format, 'text')
  assert.equal(text.rows[0].input.correct_answer, '7')
  assert.equal(text.rows[1].input.interaction, 'typed_short')
  assert.match(toCsv([{ interaction: 'typed_short', instruction: '=HYPERLINK("x")', correct_answer: 'a' }]), /'=HYPERLINK/)
  assert.deepEqual(parseDelimited('a\tb\n1\t2', '\t'), [['a', 'b'], ['1', '2']])
})

test('rules: timezone-aware windows, deadlines with extra time, release', () => {
  assert.equal(R.zonedToUtc('2026-11-20T09:00', 'Asia/Kolkata').toISOString(), '2026-11-20T03:30:00.000Z')
  assert.equal(R.zonedToUtc('2026-07-01T09:00', 'Europe/London').toISOString(), '2026-07-01T08:00:00.000Z')
  const now = new Date('2026-11-20T10:00:00Z')
  const rules = { opensAt: new Date('2026-11-20T09:00:00Z'), closesAt: new Date('2026-11-20T11:00:00Z'), timeLimit: 'total', totalMinutes: 30 }
  assert.equal(R.windowState(rules, now).phase, 'open')
  assert.equal(R.windowState(rules, new Date('2026-11-20T08:00:00Z')).phase, 'upcoming')
  assert.equal(R.windowState(rules, new Date('2026-11-20T12:00:00Z')).phase, 'closed')
  assert.equal(R.windowState({ ...rules, lateWork: 'marked' }, new Date('2026-11-21T12:00:00Z')).phase, 'late')
  assert.equal(R.attemptDeadline(rules, now, { extraTime: 1.5 }).toISOString(), '2026-11-20T10:45:00.000Z')
  // never past the close
  assert.equal(R.attemptDeadline(rules, new Date('2026-11-20T10:50:00Z'), {}).toISOString(), '2026-11-20T11:00:00.000Z')
  const sub = { status: 'submitted' }
  assert.equal(R.isReleased({ rules: { feedback: 'after_submit' } }, sub, now), true)
  assert.equal(R.isReleased({ rules: { feedback: 'after_submit', release: 'manual' } }, sub, now), false)
  assert.equal(R.isReleased({ rules: { feedback: 'after_close', closesAt: rules.closesAt } }, sub, now), false)
  assert.equal(R.isReleased({ rules: { feedback: 'after_close', closesAt: rules.closesAt } }, sub, new Date('2026-11-20T12:00:00Z')), true)
  assert.equal(R.isReleased({ rules: { feedback: 'never' }, resultsReleasedAt: now }, sub, now), true)
  assert.equal(R.showAnswers({ rules: { feedback: 'never' }, resultsReleasedAt: now }, sub, now), false)
  assert.equal(R.isReleased({ rules: { feedback: 'immediate' } }, { status: 'in_progress' }, now), false)
  assert.deepEqual(R.advancedFeatures({ sections: [{ items: [{ kind: 'pool' }] }], rules: { timeLimit: 'per_question' } }), ['random pools', 'per-question time limits'])
  assert.equal(R.countedScore([{ status: 'submitted', percent: 40, submittedAt: 1 }, { status: 'submitted', percent: 80, submittedAt: 2 }], 'average'), 60)
})

test('item analysis flags a likely wrong key and computes discrimination', () => {
  // 10 students; strong students all "miss" Q2 with the same answer: the key is probably wrong.
  const attempts = Array.from({ length: 10 }, (_, i) => {
    const strong = i < 5
    return {
      _id: `a${i}`, status: 'submitted', percent: strong ? 90 - i : 30 + i,
      items: [
        { questionId: 'q1', points: 1, answered: true, correct: strong, score: strong ? 1 : 0, responseKey: strong ? 'x' : 'y', timeMs: 5000 },
        { questionId: 'q2', points: 1, answered: true, correct: !strong, score: strong ? 0 : 1, responseKey: strong ? '12' : '11', timeMs: 9000 },
      ],
    }
  })
  const items = itemAnalysis(attempts)
  const q1 = items.find((i) => i.questionId === 'q1'), q2 = items.find((i) => i.questionId === 'q2')
  assert.equal(q1.percentCorrect, 50)
  assert.ok(q1.discrimination > 0.5)
  assert.ok(q2.discrimination < 0)
  assert.ok(q2.flags.includes('possibly_wrong_key'))
  assert.equal(q2.commonWrong.answer, '12')
  assert.equal(q2.avgSeconds, 9)
  assert.equal(distribution([95, 50, 10]).buckets[9].count, 1)
})

test('backfill: tags from existing fields, never overwrites', () => {
  assert.deepEqual(tagPatch({ level: 3, academic: { skill: 'Counting a set', curriculum_strand: 'number sense' }, telemetry: { expected_response_time_ms: 9000 } }),
    { difficulty: 3, skillIds: ['counting-a-set', 'number-sense'], estimatedSeconds: 9, version: 1 })
  assert.deepEqual(tagPatch({ difficulty_band: 'medium' }), { difficulty: 3, version: 1 })
  assert.deepEqual(tagPatch({ difficulty: 5, skillIds: ['x'], version: 2, uploadBatchId: 'b' }, 'org1'), { orgId: 'org1' })
})
