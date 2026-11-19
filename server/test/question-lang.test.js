// The narrator reads a question's spoken text in a voice of that text's
// language (audio_lang). A German voice must never read English words, so a
// translation without its own audio_text keeps English, and says so.
const test = require('node:test')
const assert = require('node:assert/strict')
const { applyQuestionTranslation } = require('../utils/applyQuestionTranslation')

const LANGS = ['es', 'fr', 'pt', 'it', 'de', 'nl', 'ru', 'tr', 'zh', 'ja', 'ko', 'id', 'vi']
const FILES = ['math_listen', 'math_read', 'math_speak', 'math_write', 'science_listen', 'science_read', 'science_speak', 'science_write']

test('every question says which language its spoken text is in', () => {
  const q = { id: 'x', audio_text: 'six', translations: { fr: { instruction: 'Écoute', audio_text: 'six' }, de: { instruction: 'Hör zu' } } }
  const clone = () => JSON.parse(JSON.stringify(q))
  assert.deepEqual([applyQuestionTranslation(clone(), 'en').audio_lang, applyQuestionTranslation(clone(), '').audio_lang], ['en', 'en'])
  const fr = applyQuestionTranslation(clone(), 'fr')
  assert.equal(fr.lang, 'fr')
  assert.equal(fr.audio_lang, 'fr')
  const de = applyQuestionTranslation(clone(), 'de')
  assert.equal(de.lang, 'de')
  assert.equal(de.audio_text, 'six')
  assert.equal(de.audio_lang, 'en', 'English spoken text is read in English')
  assert.equal(applyQuestionTranslation(clone(), 'ko').audio_lang, 'en', 'no translation at all: English')
})

test('translated maths and science questions have their own spoken text in every language', () => {
  const missing = []
  for (const f of FILES) {
    for (const q of require(`../data/${f}.json`).questions) {
      if (!q.audio_text || !q.translations) continue
      for (const lang of LANGS) {
        if (!q.translations[lang]?.audio_text) missing.push(`${q.id}:${lang}`)
      }
    }
  }
  assert.deepEqual(missing, [])
})
