const { fillMoney } = require('./currency')

// Overlays a question's translations.<lang> content onto its base (English)
// fields for API responses. Missing fields/languages fall back to the base
// English value so partially-translated content never renders blank.
// English-subject questions are intentionally never translated here (that
// module teaches English spelling/reading — see questionsSlice.js on the
// client, which only sends ?lang= for non-english subjects).
//
// Every question it returns says which language its spoken text is in
// (`audio_lang`) and which language the rest of it is in (`lang`), so the
// narrator always reads it in a voice of that language: a German voice never
// reads English words, whatever the site's language is. `narration` (the spoken
// script, content v4) comes back in the same language as the rest of the question.
// Money tokens ([[m:20]], [[M:45]]; content v5) are filled in for `opts.currency` (default
// EUR), in the question's language: see utils/currency.js.
function applyQuestionTranslation(questionDoc, lang, opts = {}) {
  const question = typeof questionDoc.toObject === 'function' ? questionDoc.toObject() : questionDoc
  const translation = lang && lang !== 'en' && question.translations && question.translations[lang]
  if (!translation) {
    delete question.translations
    question.lang = 'en'
    question.audio_lang = 'en'
    return fillMoney(question, { currency: opts.currency, lang: 'en' })
  }

  const merged = { ...question }
  for (const field of ['instruction', 'prompt', 'audio_text', 'options', 'correct_answer', 'accepted_answers', 'hints', 'worked_example']) {
    if (translation[field] !== undefined && translation[field] !== null) merged[field] = translation[field]
  }
  if (translation.feedback) {
    merged.feedback = { ...question.feedback, ...translation.feedback }
  }
  if (translation.speech_scoring) {
    merged.speech_scoring = { ...question.speech_scoring, ...translation.speech_scoring }
  }
  // Checking rules written for this language (e.g. its own keyword lists) replace the English
  // ones; without them the checker falls back to the translated expected keywords / answers.
  if (translation.validation && question.validation) {
    merged.validation = { ...question.validation, ...translation.validation, keywords_lang: lang }
  }
  // Narration script (content v4): the one written for this language, never the English one
  // read by another language's voice. No script in this language → none (the client falls back
  // to reading the instruction and prompt, as before).
  if (translation.narration && translation.narration.text) merged.narration = translation.narration
  else delete merged.narration
  delete merged.translations
  merged.lang = lang
  // Spoken text with no translation of its own stays English, and is read in English.
  merged.audio_lang = translation.audio_text ? lang : 'en'
  return fillMoney(merged, { currency: opts.currency, lang })
}

module.exports = { applyQuestionTranslation }
