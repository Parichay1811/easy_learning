// Everyday-curiosity pool (content v4) as new-item specs, by bank file. English text and the
// narration scripts live in everyday-source.js; the 13-language text of the maths and science
// items in everyday-translations.json. Every item: everyday true, stage 0 (stages.js), level 0-1,
// graded, age_band "all", real skills, full analysis metadata.
const { ENGLISH, MATHS, SCIENCE, YES_NO, TRUE_FALSE } = require('./everyday-source')
const TR = require('./everyday-translations.json')

const LANGS = ['es', 'fr', 'pt', 'it', 'de', 'nl', 'ru', 'tr', 'zh', 'ja', 'ko', 'id', 'vi']
// The bank's own Yes/No and True/False labels (SCI-LIS-T03, SCI-RD-T02).
const LABELS = {
  yesNo: { es: ['✅ Sí', '❌ No'], fr: ['✅ Oui', '❌ Non'], pt: ['✅ Sim', '❌ Não'], it: ['✅ Sì', '❌ No'], de: ['✅ Ja', '❌ Nein'], nl: ['✅ Ja', '❌ Nee'], ru: ['✅ Да', '❌ Нет'], tr: ['✅ Evet', '❌ Hayır'], zh: ['✅ 对', '❌ 错'], ja: ['✅ はい', '❌ いいえ'], ko: ['✅ 네', '❌ 아니요'], id: ['✅ Ya', '❌ Tidak'], vi: ['✅ Có', '❌ Không'] },
  trueFalse: { es: ['✅ Verdadero', '❌ Falso'], fr: ['✅ Vrai', '❌ Faux'], pt: ['✅ Verdadeiro', '❌ Falso'], it: ['✅ Vero', '❌ Falso'], de: ['✅ Wahr', '❌ Falsch'], nl: ['✅ Waar', '❌ Onwaar'], ru: ['✅ Верно', '❌ Неверно'], tr: ['✅ Doğru', '❌ Yanlış'], zh: ['✅ 对', '❌ 错'], ja: ['✅ 正しい', '❌ 間違い'], ko: ['✅ 참', '❌ 거짓'], id: ['✅ Benar', '❌ Salah'], vi: ['✅ Đúng', '❌ Sai'] },
}
// Spoken answers per language (speaking items): the first word is the sample answer.
const WORDS = {
  umbrella: { en: ['umbrella'], es: ['paraguas', 'sombrilla'], fr: ['parapluie'], pt: ['guarda-chuva', 'chapéu de chuva'], it: ['ombrello'], de: ['Regenschirm', 'Schirm'], nl: ['paraplu'], ru: ['зонт', 'зонтик'], tr: ['şemsiye'], zh: ['雨伞', '伞'], ja: ['かさ', '傘', 'あまがさ', '雨傘'], ko: ['우산'], id: ['payung'], vi: ['cái ô', 'ô', 'cái dù', 'dù'] },
  rainbow: { en: ['rainbow'], es: ['arcoíris', 'arco iris'], fr: ['arc-en-ciel'], pt: ['arco-íris'], it: ['arcobaleno'], de: ['Regenbogen'], nl: ['regenboog'], ru: ['радуга'], tr: ['gökkuşağı'], zh: ['彩虹'], ja: ['にじ', '虹'], ko: ['무지개'], id: ['pelangi'], vi: ['cầu vồng'] },
}
// Instructions the bank has no translation of yet (same wording as the starter items).
const INSTRUCTIONS = {
  'Listen to the question. Answer out loud.': { es: 'Escucha la pregunta. Responde en voz alta.', fr: 'Écoute la question. Réponds à voix haute.', pt: 'Ouve a pergunta. Responde em voz alta.', it: 'Ascolta la domanda. Rispondi ad alta voce.', de: 'Hör dir die Frage an. Antworte laut.', nl: 'Luister naar de vraag. Antwoord hardop.', ru: 'Послушай вопрос. Ответь вслух.', tr: 'Soruyu dinle. Yüksek sesle cevap ver.', zh: '听问题,大声回答。', ja: 'しつもんをきいて、こえにだしてこたえよう。', ko: '질문을 듣고 소리 내어 대답해 보세요.', id: 'Dengarkan pertanyaannya. Jawab dengan suara keras.', vi: 'Nghe câu hỏi rồi trả lời thật to.' },
}
const QT = { listen: 'everyday_listen', read: 'everyday_read', write: 'everyday_write', speak: 'everyday_speak' }
const moduleOf = (id) => ({ LIS: 'listen', RD: 'read', WR: 'write', SPK: 'speak' }[id.split('-')[1]])
const fileOf = (id) => `${{ EN: 'english', MA: 'math', SCI: 'science' }[id.split('-')[0]]}_${moduleOf(id)}.json`

// { en, es, … } for one translated field (throws if a language is missing).
function field(item, name, en) {
  const t = TR[item.id] && TR[item.id][name]
  if (!t) throw new Error(`${item.id}: no translations for ${name}`)
  const out = { en }
  for (const l of LANGS) { if (t[l] === undefined || t[l] === '') throw new Error(`${item.id}: no ${l} ${name}`); out[l] = t[l] }
  return out
}
const perLang = (en, fn) => Object.fromEntries([['en', en], ...LANGS.map((l) => [l, fn(l)])])

function common(item, translated) {
  const module = moduleOf(item.id)
  const spec = {
    id: item.id, interaction: item.interaction, question_type: QT[module], level: item.level, everyday: true, age_band: 'all', difficulty_band: 'easy',
    instruction: item.instruction, emoji: item.emoji, skill: item.skill, construct: item.construct, academic: item.construct, strand: 'everyday curiosity',
    distractor_insight: item.insight || {}, narration: item.narration,
    life: { primary: 'Everyday curiosity', ...item.life, transfer_prompt: null },
    cognition: { process: 'understand', bloom: 'understand', executive_function: ['sustained_attention'], working_memory_load: 1, reasoning_steps: 1 },
    analysis: {
      primary_construct: item.construct,
      diagnostic_purpose: 'Everyday-curiosity item: a relatable daily-life question that opens the skill before any formal practice.',
      behaviour_watch: 'Hesitation here usually means the everyday situation is unfamiliar, not that the idea is hard: talk about the situation first.',
      parent_note: item.parent,
      teacher_action_if_missed: item.teacher,
    },
  }
  if (item.validation) spec.validation = item.validation
  if (!translated) {
    Object.assign(spec, { prompt: item.prompt ?? '', audio_text: item.audio ?? null, options: item.options ?? null, correct_answer: item.correct, hint: item.hint, feedback_correct: item.feedback, worked_example: item.worked ?? null })
    if (item.accepted) spec.accepted_answers = item.accepted
    if (item.interaction === 'mic_record') { spec.keywords = item.keywords; spec.sample = item.sample }
    return spec
  }
  // Translated (maths / science)
  if (TR[item.id].instruction) spec.instruction = field(item, 'instruction', item.instruction)
  else if (INSTRUCTIONS[item.instruction]) spec.instruction = { en: item.instruction, ...INSTRUCTIONS[item.instruction] }
  if (item.audio) spec.audio_text = field(item, 'audio_text', item.audio)
  spec.prompt = TR[item.id].prompt ? field(item, 'prompt', item.prompt) : (item.prompt ?? '')
  spec.hint = field(item, 'hint', item.hint)
  spec.feedback_correct = field(item, 'feedback_correct', item.feedback)
  if (item.worked) spec.worked_example = field(item, 'worked_example', item.worked)
  if (item.interaction === 'mic_record') {
    const w = WORDS[item.word]
    spec.correct_answer = perLang(w.en[0], (l) => w[l][0])
    spec.accepted_answers = perLang([...w.en, ...item.synonyms], (l) => w[l])
    spec.keywords = perLang([...w.en, ...item.synonyms], (l) => w[l])
    spec.sample = perLang(w.en[0], (l) => w[l][0])
    spec.validation = { method: 'speech_keywords', keywords: [[...w.en, ...item.synonyms]], min: 1 }
    spec.validation_by_lang = (l) => ({ keywords: [w[l]], min: 1 })
    return spec
  }
  const labels = item.options === YES_NO ? LABELS.yesNo : item.options === TRUE_FALSE ? LABELS.trueFalse : null
  const options = labels ? perLang(item.options, (l) => labels[l]) : TR[item.id].options ? field(item, 'options', item.options) : item.options
  spec.options = options
  if (options && !Array.isArray(options)) {
    const i = options.en.indexOf(item.correct)
    if (i < 0) throw new Error(`${item.id}: answer is not an option`)
    spec.correct_answer = perLang(item.correct, (l) => options[l][i])
    spec.accepted_answers = perLang([item.correct], (l) => [options[l][i]])
  } else {
    spec.correct_answer = item.correct // pictures, digits, sequences: the same in every language
    if (Array.isArray(item.correct)) spec.accepted_answers = item.correct
  }
  return spec
}

const out = {}
for (const item of ENGLISH) (out[fileOf(item.id)] = out[fileOf(item.id)] || []).push(common(item, false))
for (const item of [...MATHS, ...SCIENCE]) (out[fileOf(item.id)] = out[fileOf(item.id)] || []).push(common(item, true))

module.exports = out
