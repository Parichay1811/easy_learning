// Narration scripts (content v4): every served question has a spoken script in English and in
// every language it is translated to; every script obeys the rules (never the answer, never what
// the item tests, short, calm); the phrase bank is complete and has no English left in other
// languages; the API returns the script in the requested language; the merge of authored
// scripts rejects rule breakers and is idempotent.
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { loadAll } = require('../scripts/content/lib/bankio')
const rules = require('../scripts/content/lib/narration-rules')
const narration = require('../scripts/content/narration')
const { applyQuestionTranslation } = require('../utils/applyQuestionTranslation')

const { checkNarration, wordCount, STYLES } = rules
const LANGS = narration.LANGS
const banks = loadAll()
const served = banks.flatMap((b) => b.data.questions.filter((q) => q.qa.status !== 'excluded').map((q) => ({ q, b })))
const byId = Object.fromEntries(served.map(({ q }) => [q.id, q]))
const clone = (x) => JSON.parse(JSON.stringify(x))
const phrases = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/narration-phrases.json'), 'utf8'))

test('every served question has a valid narration in English and in every translated language', () => {
  const problems = []
  let checked = 0
  for (const { q, b } of served) {
    const ctx = { subject: b.subject, module: b.module }
    for (const p of checkNarration(q, q.narration, { lang: 'en', ...ctx })) problems.push(`${q.id} en: ${p}`)
    assert.equal(q.narration.v, 2, `${q.id}: content v5 scripts`)
    assert.ok(Array.isArray(q.narration.cues) && q.narration.cues.length >= 1, `${q.id}: cues`)
    assert.ok(['authored', 'reviewed', 'templated'].includes(q.narration.status))
    checked++
    if (!q.translations) { assert.equal(b.subject, 'english', `${q.id}: only English-subject items are untranslated`); continue }
    for (const lang of LANGS) {
      const n = q.translations[lang].narration
      assert.ok(n, `${q.id} ${lang}`)
      assert.equal(n.status, 'templated', `${q.id} ${lang}: other languages are templated until a person reviews them`)
      assert.equal(n.style, q.narration.style, `${q.id} ${lang}: same style as English`)
      assert.deepEqual(n.cues, q.narration.cues, `${q.id} ${lang}: the same steps as English`)
      for (const p of checkNarration(applyQuestionTranslation(clone(q), lang), n, { lang, ...ctx, baseInstruction: q.instruction })) problems.push(`${q.id} ${lang}: ${p}`)
      checked++
    }
  }
  assert.deepEqual(problems.slice(0, 10), [])
  assert.ok(checked > 18000, `${checked} scripts checked`)
})

test('English scripts are authored for every served item (writers + the everyday pool)', () => {
  const notAuthored = served.filter(({ q }) => !['authored', 'reviewed'].includes(q.narration.status)).map(({ q }) => q.id)
  assert.deepEqual(notAuthored, [])
  const store = narration.loadAuthored()
  for (const { q } of served) if (!q.everyday) assert.equal(q.narration.text, store[q.id].text, `${q.id}: bank text is the stored authored text`)
})

test('applyQuestionTranslation returns the narration in the requested language, never English in another language', () => {
  const q = byId['SCI-RD-T02-Q01']
  const de = applyQuestionTranslation(clone(q), 'de')
  assert.equal(de.lang, 'de')
  assert.deepEqual(de.narration, q.translations.de.narration)
  assert.ok(!/[A-Za-z]{2,} (the|you|and) /.test(de.narration.text))
  const en = applyQuestionTranslation(clone(q), 'en')
  assert.deepEqual(en.narration, q.narration)
  assert.equal(en.translations, undefined)
  // English-subject items are not translated: English everywhere, said in English.
  const e = applyQuestionTranslation(clone(byId['EN-RD-T01-Q01']), 'fr')
  assert.equal(e.lang, 'en')
  assert.equal(e.narration.text, byId['EN-RD-T01-Q01'].narration.text)
  // A translation without its own script gets none (the client falls back), not the English one.
  const partial = { id: 'x', instruction: 'Listen.', narration: { text: 'Hello there.', style: 'calm', v: 1, status: 'authored' }, translations: { es: { instruction: 'Escucha.' } } }
  assert.equal(applyQuestionTranslation(clone(partial), 'es').narration, undefined)
  assert.equal(applyQuestionTranslation(clone(partial), 'en').narration.text, 'Hello there.')
})

test('the rules catch what a narration must never do', () => {
  const n = (text, extra = {}) => ({ text, style: 'calm', v: 1, status: 'authored', ...extra })
  const has = (q, text, re, opts = {}) => assert.ok(checkNarration(q, n(text), { lang: 'en', ...opts }).some((p) => re.test(p)), `${q.id}: "${text}" should fail ${re}`)
  const ok = (q, text, opts = {}) => assert.deepEqual(checkNarration(q, n(text), { lang: 'en', ...opts }), [], `${q.id}: "${text}"`)
  const listen = byId['EN-LIS-T01-Q01'] // audio "soap", options soap / soup / sop
  has(listen, 'Listen for the word soap and tap it.', /listening audio|word option/)
  has(listen, 'Is it soup or sop? Listen.', /word option/)
  ok(listen, 'Listen carefully to the word, then tap the one you heard.')
  has(listen, Array(36).fill('word').join(' '), /36 words \(max 35\)/)
  const read = byId['SCI-RD-T02-Q01'] // card "Fish live in water."
  has(read, 'Fish live in water. Is that true?', /card text/)
  ok(read, 'Read the sentence on the card, then decide if it is true.')
  const typed = byId['MA-WR-T11-Q01']
  has(typed, `The answer is ${typed.correct_answer}.`, /answer/)
  const word = byId['MA-WR-T06-Q01'] // "three" → type 3
  has(word, 'Type the number three as digits.', /answer/)
  const spell = byId['EN-WR-T04-Q01']
  has(spell, `Listen and type it: ${[...String(spell.correct_answer)].join('-')}.`, /spells the target|answer/)
  const choice = byId['MA-WR-T04-Q01'] // options 7, 6, 8 (drag to blank)
  has(choice, 'Is it 7 or 6?', /reads 2 of 3 options/)
  has(choice, 'Is it 8, 7 or 6?', /out of order/)
  ok(choice, 'Is it 7, 6 or 8?')
  has(choice, 'Wow! Great! Drag it.', /more than one "!"/)
  const speak = byId['SCI-SPK-T05-Q01'] // read this sentence out loud
  has(speak, `Read it out loud: ${speak.prompt}`, /must say|answer/)
  const order = byId['EN-WR-T05-Q01']
  has(order, `Build it: ${order.correct_answer.join(' ')}.`, /answer|sequence/)
  ok(order, 'Put the words in order to build a sentence.', { module: 'write', subject: 'english' })
  // Another language: no English left.
  const sci = byId['SCI-LIS-T01-Q01']
  assert.ok(checkNarration(applyQuestionTranslation(clone(sci), 'de'), n('Hör zu. Tap the picture.'), { lang: 'de', baseInstruction: sci.instruction }).some((p) => /English left/.test(p)))
  assert.equal(wordCount('这是一个很长的句子', 'zh') > 0, true)
})

test('the phrase bank: every language and style, written in that language, no "!" and no English', () => {
  assert.deepEqual(Object.keys(phrases.languages).sort(), ['en', ...LANGS].sort())
  for (const [lang, P] of Object.entries(phrases.languages)) {
    // The story styles of v4 scripts (v2 scripts are all "plain" and use no intros or outros).
    const V4 = STYLES.filter((s) => s !== 'plain')
    assert.deepEqual(Object.keys(P.styles).sort(), [...V4].sort(), lang)
    const texts = [P.read, P.fallback, P.options.frame, P.options.frame_multi]
    for (const s of V4) {
      assert.ok(P.styles[s].intros.length >= 2 && P.styles[s].outros.length >= 2, `${lang} ${s}`)
      texts.push(...P.styles[s].intros, ...P.styles[s].outros)
    }
    assert.ok(P.options.frame.includes('{list}') && P.options.frame_multi.includes('{list}'))
    for (const t of texts) {
      assert.ok(t && !/[!！]/.test(t), `${lang}: "${t}"`)
      if (lang !== 'en') {
        const left = t.toLowerCase().split(/[^\p{L}']+/u).filter((w) => rules.ENGLISH_LEFTOVERS.includes(w))
        assert.deepEqual(left, [], `${lang}: "${t}"`)
        assert.ok(!Object.values(phrases.languages.en.styles).some((st) => st.intros.includes(t) || st.outros.includes(t)), `${lang}: "${t}" is the English text`)
      }
    }
  }
})

test('templated narration is deterministic and built from the item in that language', () => {
  const q = byId['MA-WR-T11-Q01']
  const qde = applyQuestionTranslation(clone(q), 'de')
  const a = narration.buildTemplated(qde, 'de', { style: 'story', module: 'write', subject: 'maths', baseInstruction: q.instruction, id: q.id })
  const b = narration.buildTemplated(qde, 'de', { style: 'story', module: 'write', subject: 'maths', baseInstruction: q.instruction, id: q.id })
  assert.deepEqual(a, b)
  assert.equal(a.status, 'templated')
  assert.ok(a.text.includes(qde.instruction), 'it reads the translated instruction')
  assert.ok(phrases.languages.de.styles.story.intros.some((i) => a.text.startsWith(i)), 'with a German story intro')
  // A listening item never gets its audio or options; a Read item never its card.
  const lis = byId['MA-LIS-T10-Q01']
  for (const lang of LANGS) {
    const t = lis.translations[lang]
    assert.ok(!t.narration.text.includes(t.audio_text), `${lang}: audio`)
  }
  const rd = byId['SCI-RD-T09-Q02']
  for (const lang of LANGS) assert.ok(!rd.translations[lang].narration.text.includes(rd.translations[lang].prompt.trim()), `${lang}: card`)
})

test('merge: rule-breaking authored scripts are rejected, unknown ids reported, reviewed status kept, idempotent', () => {
  // Works on a copy of the authored store, never the real one (other test files read it in parallel).
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'narr-'))
  const storeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'narr-store-'))
  const real = path.resolve(__dirname, '../scripts/content/narration/authored')
  for (const f of fs.readdirSync(real)) fs.copyFileSync(path.join(real, f), path.join(storeDir, f))
  try {
    const q2 = byId['SCI-RD-T02-Q02']
    fs.writeFileSync(path.join(dir, 'science_read.json'), JSON.stringify({
      'SCI-RD-T02-Q01': { text: 'Fish live in water. True or false?', style: 'calm' },
      'SCI-RD-T02-Q02': { text: q2.narration.text, style: q2.narration.style },
      'SCI-RD-T99-Q01': { text: 'Hello.', style: 'calm' },
    }))
    const r = narration.merge(dir, { banks: loadAll(), storeDir })
    assert.equal(r.files, 1)
    assert.equal(r.rejected.length, 1)
    assert.match(r.rejected[0], /^SCI-RD-T02-Q01: .*card text/)
    assert.deepEqual(r.unknown, ['science_read.json SCI-RD-T99-Q01'])
    assert.equal(r.unchanged, 1, 'the same text again changes nothing')
    const file = path.join(storeDir, 'science_read.json')
    assert.equal(JSON.parse(fs.readFileSync(file, 'utf8'))['SCI-RD-T02-Q01'], undefined, 'a rejected script is not stored')
    // a person marks a script reviewed: merging the same text again keeps "reviewed"
    const s = JSON.parse(fs.readFileSync(file, 'utf8'))
    s['SCI-RD-T02-Q02'].status = 'reviewed'
    fs.writeFileSync(file, JSON.stringify(s))
    fs.writeFileSync(path.join(dir, 'science_read.json'), JSON.stringify({ 'SCI-RD-T02-Q02': { text: q2.narration.text, style: q2.narration.style } }))
    const r2 = narration.merge(dir, { banks: loadAll(), storeDir })
    assert.equal(r2.unchanged, 1)
    assert.equal(JSON.parse(fs.readFileSync(file, 'utf8'))['SCI-RD-T02-Q02'].status, 'reviewed')
    // …and a changed text goes back to "authored"
    fs.writeFileSync(path.join(dir, 'science_read.json'), JSON.stringify({ 'SCI-RD-T02-Q02': { text: 'Read the sentence on the card. Then tap true or false.', style: 'calm' } }))
    narration.merge(dir, { banks: loadAll(), storeDir })
    assert.equal(JSON.parse(fs.readFileSync(file, 'utf8'))['SCI-RD-T02-Q02'].status, 'authored')
  } finally {
    narration.resetCaches()
    fs.rmSync(dir, { recursive: true, force: true })
    fs.rmSync(storeDir, { recursive: true, force: true })
  }
})

test('coverage report: every served item, every language', () => {
  const c = narration.coverage(banks)
  assert.equal(c.byLang.en.missing, 0)
  assert.equal(c.byLang.en.templated, 0)
  for (const lang of LANGS) {
    assert.equal(c.byLang[lang].missing, 0, `${lang}: every translated item has a script`)
    assert.equal(c.byLang[lang].templated, served.filter(({ b }) => b.subject !== 'english').length)
  }
})

test('narration v2 (content v5): short by level, literal, action first, cues said in order', () => {
  const q = { id: 'EN-LIS-T99-Q01', level: 1, interaction: 'tap_mcq', instruction: 'Listen. Tap the word you hear.', prompt: 'Which word did you hear?', audio_text: 'giggle', options: ['giggle', 'goggle', 'gaggle'], correct_answer: 'giggle' }
  const v2 = (text, cues = ['listen', 'tap']) => ({ text, style: 'plain', v: 2, status: 'authored', cues })
  const ok = (text, cues) => assert.deepEqual(checkNarration(q, v2(text, cues), { lang: 'en' }), [], text)
  const bad = (text, re, cues) => assert.ok(checkNarration(q, v2(text, cues), { lang: 'en' }).some((p) => re.test(p)), text)
  ok('Listen to the word. Tap the word you hear.')
  bad('A word is hiding inside the sound. Catch it with your ears.', /figurative/)
  bad('Listen to the word now, then tap the word that you heard on the screen.', /words/)
  bad('Listen to the word. Tap it!', /"!"/)
  bad('Listen. Which one is not a cat? Tap it.', /negation/)
  bad('Tap the word. Listen first.', /order/)
  bad('Listen to the word. Tap the word you hear.', /unknown cue/, ['listen', 'clap'])
  // Higher levels may say more, and NOT (in capitals) is allowed there.
  assert.deepEqual(checkNarration({ ...q, level: 4 }, v2('Listen to all the words. Which word does NOT belong? Tap it.'), { lang: 'en' }), [])
})
