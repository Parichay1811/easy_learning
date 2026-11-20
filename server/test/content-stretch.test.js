// Maths stretch set (levels 6-8): every key is recomputed from its definition, the bank holds
// exactly those items, and the ways learners write such answers are accepted.
const test = require('node:test')
const assert = require('node:assert/strict')
const stretch = require('../scripts/content/new-items/stretch-maths')
const { loadAll } = require('../scripts/content/lib/bankio')
const { checkAnswer } = require('../utils/scoreAnswer')
const { applyQuestionTranslation } = require('../utils/applyQuestionTranslation')

const bank = Object.fromEntries(loadAll().flatMap((b) => b.data.questions.map((q) => [q.id, q])))
const LANGS = ['es', 'fr', 'pt', 'it', 'de', 'nl', 'ru', 'tr', 'zh', 'ja', 'ko', 'id', 'vi']

test('every stretch key equals its computed answer, and the bank carries it unchanged', () => {
  let n = 0
  for (const [file, specs] of Object.entries(stretch)) {
    for (const spec of specs) {
      n++
      const want = String(spec.compute())
      assert.equal(spec.correct_answer, want, spec.id)
      const q = bank[spec.id]
      assert.ok(q, `${spec.id} in ${file}`)
      assert.equal(q.correct_answer, want, `${spec.id} bank key`)
      assert.ok(q.level >= 6 && q.level <= 8, `${spec.id} level`)
      assert.equal(q.age_band, 'all')
      assert.equal(q.graded, true)
      assert.equal(q.qa.status, 'verified')
      if (q.options) {
        assert.ok(q.options.includes(want), `${spec.id} answer is an option`)
        assert.equal(new Set(q.options).size, q.options.length, `${spec.id} distinct options`)
      }
      for (const lang of LANGS) {
        const t = applyQuestionTranslation(JSON.parse(JSON.stringify(q)), lang)
        assert.equal(String(t.correct_answer), want, `${spec.id} ${lang}`)
        if (q.audio_text) assert.notEqual(t.audio_text, q.audio_text, `${spec.id} ${lang} spoken text translated`)
        if (q.interaction === 'tap_mcq') assert.equal(checkAnswer(t, want).status, 'correct', `${spec.id} ${lang}`)
      }
    }
  }
  assert.ok(n >= 24, `${n} stretch items`)
  for (const level of [6, 7, 8]) for (const mode of ['LIS', 'RD', 'WR']) assert.ok(Object.keys(bank).some((id) => id.startsWith(`MA-${mode}-S0${level}-`)), `MA-${mode} level ${level}`)
})

test('stretch answers in the forms learners write them', () => {
  const ok = (id, a, lang = 'en') => assert.equal(checkAnswer(applyQuestionTranslation(JSON.parse(JSON.stringify(bank[id])), lang), a).status, 'correct', `${id} ${lang} "${a}"`)
  const no = (id, a) => assert.notEqual(checkAnswer(bank[id], a).status, 'correct', `${id} "${a}"`)
  for (const a of ['-5', '−5', 'minus 5', 'negative five', '-5.']) ok('MA-WR-S06-Q01', a)
  no('MA-WR-S06-Q01', '5')
  ok('MA-WR-S06-Q01', 'menos cinco', 'es')
  ok('MA-WR-S06-Q04', '0.75'); ok('MA-WR-S06-Q04', '3/4'); ok('MA-WR-S06-Q04', '0,75', 'de')
  no('MA-WR-S06-Q04', '0.7')
  ok('MA-WR-S07-Q01', '4'); ok('MA-WR-S07-Q01', 'x = 4'); ok('MA-WR-S07-Q01', 'x=4')
  no('MA-WR-S07-Q01', '8')
  ok('MA-WR-S06-Q03', '20'); ok('MA-WR-S06-Q03', '20', 'ja')
  ok('MA-WR-S08-Q03', '25'); no('MA-WR-S08-Q03', '14')
})
