// Money in the learner's own currency (content v5): utils/currency.js and the checker.
const test = require('node:test')
const assert = require('node:assert/strict')
const { fillMoney, moneySymbol, moneyWords, fillText, LANG_CURRENCIES, CURRENCIES } = require('../utils/currency')
const { applyQuestionTranslation } = require('../utils/applyQuestionTranslation')
const { checkAnswer } = require('../utils/scoreAnswer')
const ctx = require('../utils/requestContext')

const clone = (x) => JSON.parse(JSON.stringify(x))

test('symbols on tiles, words in sentences, written the local way', () => {
  assert.equal(moneySymbol(17, 'm', 'EUR', 'en'), '17c')
  assert.equal(moneySymbol(17, 'm', 'GBP', 'en'), '17p')
  assert.equal(moneySymbol(17, 'm', 'USD', 'en'), '17¢')
  assert.equal(moneySymbol(45, 'M', 'EUR', 'en'), '€45')
  assert.equal(moneySymbol(45, 'M', 'EUR', 'de'), '45 €')
  assert.equal(moneySymbol(3.5, 'M', 'GBP', 'en'), '£3.50')
  assert.equal(moneyWords(1, 'm', 'GBP', 'en'), '1 penny')
  assert.equal(moneyWords(20, 'm', 'GBP', 'en'), '20 pence')
  assert.equal(moneyWords(45, 'M', 'RUB', 'ru'), '45 рублей')
  assert.equal(moneyWords(2, 'M', 'RUB', 'ru'), '2 рубля')
  assert.equal(moneyWords(17, 'm', 'JPY', 'ja'), '17円', 'no small coin: the main unit, same number')
  assert.equal(moneySymbol(17, 'm', 'KRW', 'ko'), '17원')
})

test('Turkish endings follow the new word; German compounds keep their hyphens', () => {
  assert.equal(fillText("Bir [[m:5]]'lik para", 'words', 'TRY', 'tr'), 'Bir 5 kuruşluk para')
  assert.equal(fillText("[[m:8]]'ye bir şeker", 'words', 'TRY', 'tr'), '8 kuruşa bir şeker')
  assert.equal(fillText("[[M:80]]'u vardı", 'words', 'TRY', 'tr'), '80 lirası vardı')
  assert.equal(fillText("[[M:10]]'ydi", 'words', 'EUR', 'tr'), '10 euroydu')
  assert.equal(fillText('zwei [[m:20]]-Münzen', 'words', 'EUR', 'de'), 'zwei 20-Cent-Münzen')
})

test('a served question: options and answer filled alike, so a tapped tile always matches', () => {
  const q = { id: 'MA-LIS-T99-Q01', interaction: 'tap_mcq', validation: { method: 'choice' }, audio_text: 'Ben has [[m:20]] and spends [[m:3]].', options: ['[[m:17]]', '[[m:23]]'], correct_answer: '[[m:17]]', accepted_answers: ['[[m:17]]'] }
  for (const currency of ['EUR', 'GBP', 'USD']) {
    const s = applyQuestionTranslation(clone(q), 'en', { currency })
    assert.doesNotMatch(JSON.stringify(s), /\[\[/)
    assert.equal(s.correct_answer, s.options[0])
    assert.equal(checkAnswer(s, s.options[0]).status, 'correct', currency)
    assert.notEqual(checkAnswer(s, s.options[1]).status, 'correct', currency)
  }
  assert.equal(applyQuestionTranslation(clone(q), 'en', { currency: 'GBP' }).audio_text, 'Ben has 20 pence and spends 3 pence.')
})

test('typed money answers count in any form; the wrong amount does not', () => {
  const q = fillMoney({ id: 't', interaction: 'typed_short', lang: 'en', validation: { method: 'number', number_words: true }, correct_answer: '17', accepted_answers: ['17', '[[m:17]]'] }, { currency: 'EUR' })
  for (const a of ['17', '17c', '17 cent', '17p', '17¢', 'seventeen cents']) assert.equal(checkAnswer(q, a).status, 'correct', a)
  assert.equal(checkAnswer(q, '18c').status, 'incorrect')
})

test('no currency given: the request\'s (X-Currency), else euro; unknown codes fall back to euro', () => {
  const q = { options: ['[[M:5]]'] }
  assert.equal(fillMoney(clone(q)).options[0], '€5')
  ctx.run({ currency: 'USD' }, () => assert.equal(fillMoney(clone(q)).options[0], '$5'))
  assert.equal(fillMoney(clone(q), { currency: 'XXX' }).options[0], '€5')
})

test('every currency a language can meet is one we can write', () => {
  for (const list of Object.values(LANG_CURRENCIES)) for (const c of list) assert.ok(CURRENCIES.includes(c), c)
})
