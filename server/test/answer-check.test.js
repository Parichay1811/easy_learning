// Answer checker (server/utils/scoreAnswer.js, same rules as the client copy): concrete cases
// for every validation method, the contract examples, and the rule "never mark a right answer wrong".
const test = require('node:test')
const assert = require('node:assert/strict')
const { checkAnswer, isCorrect, scoreItem, numberTokens, parseEquation } = require('../utils/scoreAnswer')
const { applyQuestionTranslation } = require('../utils/applyQuestionTranslation')

const status = (q, a) => checkAnswer(q, a).status
const mcq = (correct, options, extra = {}) => ({ interaction: 'tap_mcq', options, correct_answer: correct, accepted_answers: [correct], validation: { method: 'choice' }, ...extra })
const typed = (correct, validation, extra = {}) => ({ interaction: 'typed_short', correct_answer: correct, accepted_answers: [].concat(extra.accepted || correct), validation, ...extra })
const speech = (validation, extra = {}) => ({ interaction: 'mic_record', correct_answer: 'x', speech_scoring: { expected_keywords: extra.keywords || [], sample_answer: '' }, validation, ...extra })

test('result shape: status, correct, score; isCorrect mirrors checkAnswer', () => {
  const q = mcq('🐱 cat', ['🐱 cat', '🐶 dog', '🐟 fish'], { distractor_insight: { '🐶 dog': 'picked an animal that was not mentioned' } })
  assert.deepEqual(checkAnswer(q, '🐱 cat'), { status: 'correct', correct: true, score: 1 })
  assert.deepEqual(checkAnswer(q, '🐶 dog'), { status: 'incorrect', correct: false, score: 0, misconception: 'picked an animal that was not mentioned' })
  assert.equal(isCorrect(q, '🐱 cat'), true)
  assert.equal(isCorrect(q, '🐟 fish'), false)
})

test('contract: hear "The cat is sleeping." → Which animal is sleeping?', () => {
  const q = mcq('🐱 cat', ['🐱 cat', '🐶 dog', '🐟 fish'], { audio_text: 'The cat is sleeping.' })
  assert.equal(status(q, '🐱 cat'), 'correct')
  assert.equal(status(q, '🐱 Cat'), 'correct', 'case does not matter')
  assert.equal(status(q, '🐶 dog'), 'incorrect')
  assert.equal(status(q, ['🐱 cat']), 'incorrect', 'wrong shape is never right')
})

test('contract: read "The sun is hot." → What is hot? accepts "the sun" and "sun", not "moon"', () => {
  const q = typed('the sun', { method: 'text', strip_articles: true, allow_echo: true }, { prompt: 'The sun is hot. What is hot?' })
  for (const a of ['the sun', 'sun', 'Sun.', 'THE SUN', ' the  sun ', 'The sun is hot.', 'the sun!']) assert.equal(status(q, a), 'correct', a)
  for (const a of ['moon', 'the moon', 'hot']) assert.equal(status(q, a), 'incorrect', a)
})

test('contract: "I ___ happy." → am (and the whole sentence); is/are are wrong with a misconception', () => {
  const q = typed('am', { method: 'text', allow_echo: true }, { prompt: 'I ___ happy.', distractor_insight: { is: 'used "is" - with I we say "am"' } })
  assert.equal(status(q, 'am'), 'correct')
  assert.equal(status(q, 'Am'), 'correct')
  assert.equal(status(q, 'I am happy.'), 'correct')
  assert.deepEqual(checkAnswer(q, 'is'), { status: 'incorrect', correct: false, score: 0, misconception: 'used "is" - with I we say "am"' })
  assert.equal(status(q, 'are'), 'incorrect')
})

test('contract: numbers - 5 / five, 3 / "3 apples", 2 + 3', () => {
  const five = typed('5', { method: 'number', number_words: true }, { prompt: '2 + 3' })
  for (const a of ['5', 'five', 'Five.', ' 5 ', '5.0']) assert.equal(status(five, a), 'correct', a)
  for (const a of ['6', 'four', '55', '0.5']) assert.equal(status(five, a), 'incorrect', a)
  const sam = typed('3', { method: 'number', number_words: true }, { audio_text: 'Sam has 2 apples and gets 1 more. How many apples does Sam have now?' })
  for (const a of ['3', 'three', '3 apples', 'Three apples', 'Sam has 3 apples']) assert.equal(status(sam, a), 'correct', a)
  assert.equal(status(sam, '2'), 'incorrect')
  assert.equal(status(sam, '3 bananas'), 'close', 'right number, a word that is not in the question')
  assert.equal(checkAnswer(sam, '3 bananas').correct, false)
})

test('number words in the translation languages (0-20, tens, compounds)', () => {
  const cases = [['es', 'cinco', 5], ['es', 'veintitrés', 23], ['es', 'treinta y uno', 31], ['fr', 'quatre-vingt-dix-sept', 97], ['fr', 'soixante et onze', 71], ['fr', 'vingt et un', 21],
    ['pt', 'dezasseis', 16], ['pt', 'vinte e dois', 22], ['it', 'ventitré', 23], ['it', 'trentotto', 38], ['de', 'fünf', 5], ['de', 'einundzwanzig', 21], ['de', 'zwölf', 12],
    ['nl', 'tweeëntwintig', 22], ['nl', 'veertien', 14], ['ru', 'семь', 7], ['ru', 'двадцать один', 21], ['tr', 'on bir', 11], ['tr', 'yirmi beş', 25],
    ['zh', '七', 7], ['zh', '二十一', 21], ['zh', '十二', 12], ['ja', 'なな', 7], ['ja', 'じゅうはち', 18], ['ja', '十五', 15], ['ko', '칠', 7], ['ko', '이십일', 21], ['ko', '다섯', 5],
    ['id', 'lima belas', 15], ['id', 'dua puluh satu', 21], ['id', 'sebelas', 11], ['vi', 'mười lăm', 15], ['vi', 'hai mươi mốt', 21], ['en', 'twenty-one', 21], ['en', 'forty seven', 47], ['en', 'one hundred', 100]]
  for (const [lang, w, n] of cases) {
    const nums = numberTokens(w, lang).filter((t) => t.num !== undefined)
    assert.equal(nums.length, 1, `${lang} ${w}`)
    assert.equal(nums[0].num, n, `${lang} ${w}`)
  }
  const q = typed('5', { method: 'number', number_words: true }, { lang: 'de' })
  assert.equal(status(q, 'fünf'), 'correct')
  assert.equal(status(q, 'funf'), 'correct', 'missing umlaut')
  assert.equal(status({ ...q, lang: 'es' }, 'cinco'), 'correct')
})

test('digits only where the item tests writing digits', () => {
  const q = typed('3', { method: 'number', number_words: false }, { prompt: 'three' })
  assert.equal(status(q, '3'), 'correct')
  assert.equal(status(q, 'three'), 'incorrect')
  assert.equal(checkAnswer(q, 'three').reason, 'number_form')
})

test('units: required unit missing is close; wrong unit is wrong; spelled-out units are fine', () => {
  const q = typed('8cm', { method: 'number', unit_required: true }, { accepted: ['8cm', '8 cm'], prompt: 'A ribbon is 5 cm long. Another is 3 cm long. How long are they together?' })
  for (const a of ['8cm', '8 cm', '8 centimetres', '8 centimeters', 'eight cm']) assert.equal(status(q, a), 'correct', a)
  assert.equal(status(q, '8'), 'close')
  assert.equal(checkAnswer(q, '8').reason, 'unit')
  assert.equal(status(q, '8 m'), 'incorrect')
  assert.equal(status(q, '9 cm'), 'incorrect')
  const money = typed('17', { method: 'number', number_words: true }, { accepted: ['17', '17p'], prompt: 'Ben has 20 pence. How much does he have now?' })
  for (const a of ['17', '17p', '17 pence', 'seventeen pence']) assert.equal(status(money, a), 'correct', a)
  const decimal = typed('7.5l', { method: 'number', unit_required: true }, { accepted: ['7.5l', '7.5 litres'], lang: 'en' })
  assert.equal(status(decimal, '7.5 l'), 'correct')
  assert.equal(status({ ...decimal, lang: 'de', accepted_answers: ['7,5 l'] }, '7,5 Liter'), 'correct', 'decimal comma')
})

test('fractions: equivalent forms only when the item allows them', () => {
  const strict = typed('1/2', { method: 'number' }, { accepted: ['1/2', 'half'] })
  assert.equal(status(strict, '1/2'), 'correct')
  assert.equal(status(strict, 'a half'), 'correct')
  assert.equal(status(strict, 'one half'), 'correct')
  assert.equal(status(strict, '2/4'), 'close', 'equal value, different form')
  assert.equal(status(strict, '0.5'), 'close')
  const eq = typed('6/8', { method: 'number', equivalent_forms: 'fraction' }, { accepted: ['6/8', '3/4'] })
  assert.equal(status(eq, '3/4'), 'correct')
  assert.equal(status(eq, '12/16'), 'correct')
  assert.equal(status(eq, 'three quarters'), 'correct')
  assert.equal(status(eq, '0.75'), 'close', 'a decimal is not "the fraction"')
  const any = typed('1/2', { method: 'number', equivalent_forms: true })
  assert.equal(status(any, '0.5'), 'correct')
  assert.equal(status(any, '50%'), 'correct')
})

test('spelling: one slip is "close" where spelling is tested, accepted where it is not', () => {
  const spell = typed('friend', { method: 'text', spelling_strict: true })
  assert.equal(status(spell, 'friend'), 'correct')
  for (const a of ['freind', 'frend', 'friends']) assert.deepEqual([a, checkAnswer(spell, a).status, checkAnswer(spell, a).reason], [a, 'close', 'spelling'])
  assert.equal(status(spell, 'frnd'), 'incorrect', 'two slips')
  const short = typed('cat', { method: 'text', spelling_strict: true })
  assert.equal(status(short, 'cot'), 'incorrect', 'no slack on words under four letters')
  const vocab = typed('petal', { method: 'text', strip_articles: true })
  assert.equal(status(vocab, 'petals'), 'correct')
  assert.equal(status(vocab, 'petel'), 'correct')
  assert.equal(status(vocab, 'a petal'), 'correct')
  const knownWrong = typed('heart', { method: 'text' }, { distractor_insight: { hearth: 'confused with fireplace' } })
  assert.equal(status(knownWrong, 'hearth'), 'incorrect', 'a known wrong answer is never rescued by the typo rule')
})

test('capitals and full stops are checked strictly where that is the point', () => {
  const q = typed('The duck sat on Dad\'s hat.', { method: 'text', case_sensitive: true, punctuation_strict: true })
  assert.equal(status(q, 'The duck sat on Dad\'s hat.'), 'correct')
  assert.equal(status(q, 'The duck sat on Dad’s hat.'), 'correct', 'curly apostrophe')
  assert.equal(status(q, 'the duck sat on Dad\'s hat.'), 'close')
  assert.equal(status(q, 'The duck sat on Dad\'s hat'), 'close')
})

test('strict capitals and full stops: the hint names what is really wrong', () => {
  const q = typed('Ana saves her coins.', { method: 'text', case_sensitive: true, punctuation_strict: true })
  const got = (a) => { const r = checkAnswer(q, a); return [r.status, r.reason] }
  assert.deepEqual(got('Ana saves her coins.'), ['correct', undefined])
  assert.deepEqual(got('ana saves her coins.'), ['close', 'capitals'])
  assert.deepEqual(got('Ana Saves her coins.'), ['close', 'capitals'], 'a capital too many')
  assert.deepEqual(got('Ana saves her coins'), ['close', 'punctuation'], 'a missing full stop is not a capitals problem')
  assert.deepEqual(got('Ana saves her coins!'), ['close', 'punctuation'])
  assert.deepEqual(got('ana saves her coins'), ['close', 'capitals_punctuation'], 'both')
  assert.equal(checkAnswer(q, 'ana saves her coins').correct, false, 'close is never counted as right')
  // A phone "correcting" the name: one slip is close (spelling), never plain wrong.
  assert.deepEqual(got('Anna saves her coins.'), ['close', 'spelling'])
  assert.deepEqual(got('anna saves her coins'), ['close', 'spelling'], 'the slip is named first')
  assert.deepEqual(got('Ana save her coins.'), ['close', 'spelling'])
  assert.deepEqual(got('Ana saves his coins.'), ['incorrect', undefined], 'another word is still wrong')
  assert.deepEqual(got('Bob saves her coins.'), ['incorrect', undefined])
  assert.deepEqual(got('Ann saves her coins.'), ['incorrect', undefined], 'no slack when both spellings are under four letters')
  // A known wrong answer is never rescued by the slip rule.
  const known = typed('Tia told the truth.', { method: 'text', case_sensitive: true, punctuation_strict: true }, { distractor_insight: { 'Tina told the truth.': 'changed the name' } })
  assert.deepEqual([checkAnswer(known, 'Tina told the truth.').status, checkAnswer(known, 'Tina told the truth.').misconception], ['incorrect', 'changed the name'])
  // One flag on its own is as strict as before, and still says what differs.
  const caseOnly = typed('Paris', { method: 'text', case_sensitive: true })
  assert.deepEqual([checkAnswer(caseOnly, 'paris').status, checkAnswer(caseOnly, 'paris').reason], ['close', 'capitals'])
  const dotOnly = typed('It is hot.', { method: 'text', punctuation_strict: true })
  assert.deepEqual([checkAnswer(dotOnly, 'It is hot').status, checkAnswer(dotOnly, 'It is hot').reason], ['close', 'punctuation'])
})

test('letter_bank: letters, word tiles and equation tiles', () => {
  const word = { interaction: 'letter_bank', options: ['c', 'a', 't'], correct_answer: 'cat', accepted_answers: ['cat'], validation: { method: 'text', tiles: true, spelling_strict: true } }
  assert.equal(status(word, ['c', 'a', 't']), 'correct')
  assert.equal(status(word, ['t', 'a', 'c']), 'incorrect')
  const sentence = { interaction: 'letter_bank', options: ['I', 'wash', 'with', 'soap'], correct_answer: ['I', 'wash', 'with', 'soap'], accepted_answers: ['I', 'wash', 'with', 'soap'], validation: { method: 'sequence' } }
  assert.equal(status(sentence, ['I', 'wash', 'with', 'soap']), 'correct', 'word tiles were always marked wrong before v3')
  assert.equal(status(sentence, ['wash', 'I', 'with', 'soap']), 'incorrect')
  const eq = { interaction: 'letter_bank', options: ['3', '4', '7', '+', '='], correct_answer: '3 + 4 = 7', validation: { method: 'text', tiles: true, equation: 'any_true' } }
  for (const t of [['3', '+', '4', '=', '7'], ['4', '+', '3', '=', '7'], ['7', '=', '3', '+', '4']]) assert.equal(status(eq, t), 'correct', t.join(' '))
  assert.equal(status(eq, ['7', '+', '4', '=', '3']), 'incorrect')
  assert.equal(status(eq, ['3', '4', '+', '=', '7']), 'incorrect')
})

test('number sentences: any order of the same sum, spacing and × signs do not matter', () => {
  const q = typed('3+2=5', { method: 'text', equation: true }, { accepted: ['3+2=5', '3 + 2 = 5'] })
  for (const a of ['3+2=5', '3 + 2 = 5', '2 + 3 = 5', '5 = 3 + 2']) assert.equal(status(q, a), 'correct', a)
  for (const a of ['3+3=6', '3+2=6', '5']) assert.equal(status(q, a), 'incorrect', a)
  assert.equal(parseEquation('3 x 8 = 24').true, true)
  assert.equal(parseEquation('48-24+15=39').true, true)
})

test('show your working: the final number counts', () => {
  const q = typed('5+4=9', { method: 'number', final_answer: true }, { accepted: ['5+4=9'], interaction: 'typed_long' })
  for (const a of ['5+4=9', '5 then 6 7 8 9 so 9', 'I counted on from 5 and got 9 apples', 'nine']) assert.equal(status(q, a), 'correct', a)
  assert.equal(status(q, '5+4=8'), 'incorrect')
})

test('structured widgets: sets, orders, pairs, bins (values, never positions)', () => {
  const ms = { interaction: 'multi_select', options: ['a', 'b', 'c'], correct_answer: ['a', 'c'], validation: { method: 'set' } }
  assert.equal(status(ms, ['c', 'a']), 'correct')
  assert.equal(status(ms, ['a']), 'incorrect')
  assert.equal(checkAnswer(ms, ['a']).score, 0.5, 'partial credit as score')
  const order = { interaction: 'drag_order', options: ['3', '1', '2'], correct_answer: ['1', '2', '3'], validation: { method: 'sequence' } }
  assert.equal(status(order, ['1', '2', '3']), 'correct')
  assert.equal(status(order, ['2', '1', '3']), 'incorrect')
  const pairs = { interaction: 'match_pairs', correct_answer: [['cat', '🐱'], ['dog', '🐶']], validation: { method: 'pairs' } }
  assert.equal(status(pairs, [['dog', '🐶'], ['cat', '🐱']]), 'correct')
  const bins = { interaction: 'sort_bins', correct_answer: { even: ['2', '4'], odd: ['5'] }, validation: { method: 'bins' } }
  assert.equal(status(bins, { odd: ['5'], even: ['4', '2'] }), 'correct')
  assert.equal(status(bins, { odd: ['5', '4'], even: ['2'] }), 'incorrect')
})

test('speech: contract "apple", fuzzy words, and failed recognition is uncertain (never right, never wrong)', () => {
  const q = speech({ method: 'speech_keywords', keywords: [['apple']], min: 1 })
  for (const t of ['apple', 'Apple.', 'an apple', 'apples', 'It is an apple']) assert.equal(status(q, { transcript: t }), 'correct', t)
  assert.equal(status(q, { transcript: 'banana' }), 'incorrect')
  assert.equal(status(q, { transcript: 'banana', alternatives: ['an apple'] }), 'correct', 'any recognition alternative may match')
  assert.deepEqual(checkAnswer(q, { unsupported: true }), { status: 'uncertain', correct: false, score: 0, reason: 'unsupported' })
  assert.equal(checkAnswer(q, { error: 'not-allowed' }).reason, 'mic_blocked')
  assert.equal(checkAnswer(q, { error: 'no-speech' }).reason, 'no_speech')
  assert.equal(status(q, { transcript: '' }), 'uncertain')
  assert.equal(status(q, {}), 'uncertain')
  const long = speech({ method: 'speech_keywords', keywords: [['butterfly']], min: 1 })
  assert.equal(status(long, { transcript: 'butterfry' }), 'correct', 'one slip in a long word')
  assert.equal(scoreItem(q, { unsupported: true }).correct, false)
})

test('speech: contract seven / 7, homophones, the last number said', () => {
  const q = speech({ method: 'speech_keywords', numbers: [7], number_final: true })
  for (const t of ['7', 'seven', 'Seven.', "it's seven", '3 plus 4 is 7', 'six, no, seven']) assert.equal(status(q, { transcript: t }), 'correct', t)
  for (const t of ['eleven', '6', 'seventy', 'seven, no, eight']) assert.equal(status(q, { transcript: t }), 'incorrect', t)
  const two = speech({ method: 'speech_keywords', numbers: [2], number_final: true })
  for (const t of ['two', 'to', 'too', '2']) assert.equal(status(two, { transcript: t }), 'correct', t)
  assert.equal(status(two, { transcript: 'I want to go home now please' }), 'incorrect', 'homophones only count in a short answer')
  const four = speech({ method: 'speech_keywords', numbers: [4], number_final: true })
  assert.equal(status(four, { transcript: 'for' }), 'correct')
  const eight = speech({ method: 'speech_keywords', numbers: [8], number_final: true })
  assert.equal(status(eight, { transcript: 'ate' }), 'correct')
})

test('speech: counting sequences, comparisons, times', () => {
  const skip = speech({ method: 'speech_keywords', numbers: [2, 4, 6, 8, 10], ordered: true, min_numbers: 4 })
  assert.equal(status(skip, { transcript: 'two four six eight ten' }), 'correct')
  assert.equal(status(skip, { transcript: '2 4 6 10' }), 'correct', 'one number missed by the recogniser')
  assert.equal(status(skip, { transcript: '10 8 6 4 2' }), 'incorrect')
  const cmp = speech({ method: 'speech_keywords', compare: { more: [7], less: [3] } })
  for (const t of ['seven is bigger', '7 is bigger than 3', 'three is smaller', 'the bigger one is seven', 'seven']) assert.equal(status(cmp, { transcript: t }), 'correct', t)
  for (const t of ['three is bigger', 'seven is smaller', 'three']) assert.equal(status(cmp, { transcript: t }), 'incorrect', t)
  const fr = { ...cmp, lang: 'fr' }
  assert.equal(status(fr, { transcript: 'trois est plus petit' }), 'correct')
  assert.equal(status(fr, { transcript: 'trois est plus grand' }), 'incorrect')
  const time = speech({ method: 'speech_keywords', time: '4:30' })
  for (const t of ['half past four', 'four thirty', '4:30', "it's half past 4"]) assert.equal(status(time, { transcript: t }), 'correct', t)
  for (const t of ['four o\'clock', 'half past five', '5:30']) assert.equal(status(time, { transcript: t }), 'incorrect', t)
  const q2 = speech({ method: 'speech_keywords', time: '10:45' })
  assert.equal(status(q2, { transcript: 'quarter to eleven' }), 'correct')
  assert.equal(status(q2, { transcript: 'quarter past ten' }), 'incorrect')
})

test('speech: rhymes never accept the prompt word; open speech is ungraded', () => {
  const rhyme = speech({ method: 'speech_keywords', keywords: [['hat', 'bat', 'mat']], min: 1, not_prompt: true }, { prompt: 'cat' })
  assert.equal(status(rhyme, { transcript: 'hat' }), 'correct')
  assert.equal(status(rhyme, { transcript: 'cat' }), 'incorrect')
  const wig = speech({ method: 'speech_keywords', keywords: [['giggle', 'jiggle']], min: 1, not_prompt: true }, { prompt: 'wiggle' })
  assert.equal(status(wig, { transcript: 'wiggle' }), 'incorrect', 'no fuzzy match onto the prompt word')
  assert.equal(status(wig, { transcript: 'giggle' }), 'correct')
  const open = speech({ method: 'speech_open' }, { graded: false })
  assert.deepEqual(checkAnswer(open, { transcript: 'I think helping is kind' }), { status: 'ungraded', correct: true, score: 1 })
  assert.equal(status(open, { unsupported: true }), 'uncertain')
})

test('speech in a translated question uses the translation\'s keywords; graded_langs limits marking', () => {
  const q = {
    id: 'x', interaction: 'mic_record', correct_answer: 'fish', speech_scoring: { expected_keywords: ['fish'], sample_answer: 'fish' },
    validation: { method: 'speech_keywords', keywords: [['fish']], min: 1 },
    translations: { es: { speech_scoring: { expected_keywords: ['pez', 'pescado'], sample_answer: 'un pez' } }, de: { speech_scoring: { expected_keywords: ['Fisch'], sample_answer: 'Fisch' }, validation: { keywords: [['Fisch', 'Fische']] } } },
  }
  const es = applyQuestionTranslation(JSON.parse(JSON.stringify(q)), 'es')
  assert.equal(status(es, { transcript: 'es un pez' }), 'correct')
  assert.equal(status(es, { transcript: 'pescado' }), 'correct', 'synonyms are alternatives when the English rule is "any one"')
  assert.equal(status(es, { transcript: 'fish' }), 'incorrect')
  const de = applyQuestionTranslation(JSON.parse(JSON.stringify(q)), 'de')
  assert.equal(status(de, { transcript: 'zwei Fische' }), 'correct', 'the translation\'s own validation keywords')
  const onlyEn = { ...q, validation: { ...q.validation, graded_langs: ['en'] } }
  const es2 = applyQuestionTranslation(JSON.parse(JSON.stringify(onlyEn)), 'es')
  assert.equal(status(es2, { transcript: 'pez' }), 'ungraded')
  assert.equal(status(es2, { transcript: 'banana' }), 'ungraded', 'not judged in a language it cannot check')
})

test('rubric: explanations need the key idea (synonyms), exact model answers count, other languages are ungraded', () => {
  const q = { interaction: 'typed_long', correct_answer: 'to get rid of germs', accepted_answers: ['to get rid of germs'], validation: { method: 'rubric', keywords: [['germs', 'bacteria', 'dirt', 'clean', 'sick']], min: 1 } }
  for (const a of ['to get rid of germs', 'So we do not get sick', 'because hands have bacteria on them', 'to keep them clean']) assert.equal(status(q, a), 'correct', a)
  assert.equal(status(q, 'because it is fun'), 'incorrect')
  assert.equal(status({ ...q, lang: 'fr' }, 'pour enlever les microbes'), 'ungraded')
  const caption = { interaction: 'typed_long', correct_answer: 'I wash my hands.', accepted_answers: ['I wash my hands.'], validation: { method: 'rubric', keywords: [['wash', 'washing', 'clean'], ['hand', 'hands']], min: 2 } }
  for (const a of ['I wash my hands.', 'washing hands', 'She is cleaning her hands']) assert.equal(status(caption, a), 'correct', a)
  assert.equal(status(caption, 'I like soap'), 'incorrect')
  const fix = { interaction: 'typed_short', prompt: 'Fish live on the moon.', correct_answer: 'Fish live in water.', accepted_answers: ['Fish live in water.', 'water'], validation: { method: 'rubric', keywords: [['water', 'sea', 'ocean', 'river']], min: 1, negation_fix: true, forbidden: ['moon'] } }
  for (const a of ['Fish live in the sea.', 'water', 'Fish do not live on the moon.']) assert.equal(status(fix, a), 'correct', a)
  assert.equal(status(fix, 'Fish live on the moon and in the sea'), 'incorrect', 'keeps the false part')
})

test('practice-only items: any non-empty answer is "ungraded" (correct:true, never counted)', () => {
  const q = { interaction: 'typed_long', correct_answer: 'open', graded: false, validation: { method: 'rubric', open: true } }
  assert.deepEqual(checkAnswer(q, 'Plants need light and water.'), { status: 'ungraded', correct: true, score: 1 })
  assert.equal(status(q, ''), 'incorrect')
  assert.equal(scoreItem(q, 'anything').correct, false, 'tests never auto-credit a practice item')
})

test('questions without validation (teacher uploads) keep working with sensible defaults', () => {
  assert.equal(isCorrect({ interaction: 'tap_mcq', correct_answer: 'soap', accepted_answers: ['soap'] }, ' Soap '), true)
  assert.equal(isCorrect({ interaction: 'tap_mcq', correct_answer: 'soap' }, ['soap']), false)
  assert.equal(isCorrect({ interaction: 'typed_short', correct_answer: 'seven', accepted_answers: ['7'] }, '7'), true)
  assert.equal(isCorrect({ interaction: 'typed_short', correct_answer: '7' }, 'seven'), true)
  assert.equal(isCorrect({ interaction: 'letter_bank', correct_answer: 'cat' }, ['c', 'a', 't']), true)
  assert.equal(isCorrect({ interaction: 'typed_short', correct_answer: 'Paris' }, 'paris.'), true)
  assert.equal(checkAnswer({ interaction: 'mic_record', speech_scoring: { expected_keywords: ['wash', 'hands'] } }, { transcript: 'I wash my hands' }).status, 'correct')
})

test('speech items without validation.keywords fall back to speech_scoring.expected_keywords (English and translated)', () => {
  const bare = { interaction: 'mic_record', speech_scoring: { expected_keywords: ['soap'] } }
  assert.equal(status(bare, { transcript: 'soap' }), 'correct')
  assert.equal(status(bare, { transcript: 'banana' }), 'incorrect')
  const methodOnly = { ...bare, validation: { method: 'speech_keywords' } }
  assert.equal(status(methodOnly, { transcript: 'it is soap' }), 'correct')
  assert.equal(status(methodOnly, { transcript: 'water' }), 'incorrect')
  const two = { interaction: 'mic_record', speech_scoring: { expected_keywords: ['wash', 'hands'] }, validation: { method: 'speech_keywords' } }
  assert.equal(status(two, { transcript: 'I wash my hands' }), 'correct')
  const translated = applyQuestionTranslation({ id: 'y', interaction: 'mic_record', speech_scoring: { expected_keywords: ['soap'] }, validation: { method: 'speech_keywords' }, translations: { es: { speech_scoring: { expected_keywords: ['jabón'] } } } }, 'es')
  assert.equal(status(translated, { transcript: 'jabón' }), 'correct')
  assert.equal(status(translated, { transcript: 'jabon' }), 'correct', 'missing accent')
  assert.equal(status(translated, { transcript: 'agua' }), 'incorrect')
})

test('spelling objectives: a one-letter typo is "close", not correct', () => {
  const dictation = { interaction: 'typed_short', correct_answer: 'butterfly', accepted_answers: ['butterfly'], validation: { method: 'text', spelling_strict: true } }
  assert.equal(status(dictation, 'butterfly'), 'correct')
  assert.equal(status(dictation, 'buterfly'), 'close')
  assert.equal(checkAnswer(dictation, 'buterfly').correct, false)
  const tiles = { interaction: 'letter_bank', options: ['h', 'e', 'l', 'p'], correct_answer: 'help', validation: { method: 'text', tiles: true, spelling_strict: true } }
  assert.equal(status(tiles, ['h', 'e', 'p', 'l']), 'close')
  assert.equal(status({ interaction: 'letter_bank', correct_answer: 'help' }, ['h', 'e', 'p', 'l']), 'close', 'letter_bank defaults to strict spelling')
})
