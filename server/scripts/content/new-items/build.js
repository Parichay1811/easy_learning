// Expands a compact item spec into a full bank question (same 36-field shape as the rest of
// the file it joins), copying the structural blocks from a template question of that file and
// translating instruction / second-try lines from the bank's own translations.
const LANGS = ['es', 'fr', 'pt', 'it', 'de', 'nl', 'ru', 'tr', 'zh', 'ja', 'ko', 'id', 'vi']
const SECOND_TRY = "Let's do this one together - watch how it works."
const LEVEL_NAMES = { 0: 'Starter', 1: 'Foundation', 2: 'Early Developing', 3: 'Developing', 4: 'Secure', 5: 'Independent', 6: 'Extending', 7: 'Advanced', 8: 'Mastery' }
const clone = (x) => JSON.parse(JSON.stringify(x))
const STANDARD_FIELDS = new Set(['id', 'subject', 'module', 'type_index', 'question_type', 'interaction', 'level', 'level_name', 'difficulty_band', 'joy_flavor',
  'instruction', 'prompt', 'audio_text', 'audio_link', 'module_image_link', 'question_image_link', 'image', 'options', 'correct_answer', 'accepted_answers',
  'distractor_insight', 'hints', 'worked_example', 'feedback', 'points', 'bonus', 'readability', 'academic', 'life_skill', 'cognition', 'analysis', 'tags',
  'telemetry', 'adaptive', 'wellbeing', 'accessibility', 'speech_scoring', 'translations'])

// English text → { lang: text } from existing bank translations of the same English string.
function translationIndex(banks) {
  const idx = { instruction: new Map(), second_try: new Map() }
  for (const b of banks) for (const q of b.data.questions) {
    if (!q.translations) continue
    for (const lang of LANGS) {
      const t = q.translations[lang]
      if (!t) continue
      if (t.instruction && !idx.instruction.has(`${q.instruction}|${lang}`)) idx.instruction.set(`${q.instruction}|${lang}`, t.instruction)
      const st = t.feedback && t.feedback.second_try
      if (st && q.feedback && q.feedback.second_try === SECOND_TRY && !idx.second_try.has(lang)) idx.second_try.set(lang, st)
    }
  }
  return idx
}

const pick = (v, lang) => (v && typeof v === 'object' && !Array.isArray(v) ? (v[lang] !== undefined ? v[lang] : v.en) : v)

// spec fields: id, interaction, question_type, instruction (string or {en, es...}), prompt, audio_text,
// options, correct_answer, accepted_answers (all may be {en, es, ...}), hint, feedback_correct,
// feedback_incorrect, keywords (speech, per lang), sample (speech, per lang), skill, emoji,
// distractor_insight, academic, level (default 0), strand, construct.
function buildItem(spec, { bank, idx }) {
  const template = bank.data.questions.find((q) => q.interaction === spec.interaction && !/-(F00|S0\d)-/.test(q.id)) || bank.data.questions[0]
  const q = clone(template)
  // Only the standard bank fields are inherited: the template's own widget data (letter_tiles,
  // word_tiles, sequence_items, pairs, bins…) belongs to the template item, not to this one.
  for (const k of Object.keys(q)) if (!STANDARD_FIELDS.has(k)) delete q[k]
  const translated = !!template.translations
  const level = spec.level ?? 0
  const en = (v) => pick(v, 'en')
  const options = en(spec.options) ?? null
  const correct = en(spec.correct_answer)
  const accepted = en(spec.accepted_answers) ?? (Array.isArray(correct) ? correct : [correct])
  Object.assign(q, {
    id: spec.id,
    type_index: 0,
    question_type: spec.question_type,
    interaction: spec.interaction,
    level,
    level_name: LEVEL_NAMES[level],
    difficulty_band: 'easy',
    joy_flavor: 'warm',
    instruction: en(spec.instruction),
    prompt: en(spec.prompt) ?? '',
    audio_text: en(spec.audio_text) ?? null,
    audio_link: null,
    question_image_link: null,
    image: { mode: 'emoji', emoji: spec.emoji || '⭐', generation_prompt: null },
    options,
    correct_answer: correct,
    accepted_answers: accepted,
    distractor_insight: spec.distractor_insight || {},
    hints: [en(spec.hint)],
    worked_example: en(spec.worked_example) ?? null,
    feedback: { correct: en(spec.feedback_correct), incorrect: en(spec.feedback_incorrect ?? spec.hint), second_try: SECOND_TRY, encouragement_style: 'process_praise' },
  })
  const words = String(q.instruction).split(/\s+/).filter(Boolean)
  q.readability = { instruction_word_count: words.length, target_word_count: String(q.prompt || '').split(/\s+/).filter(Boolean).length, max_syllables_in_target: 2, decodable: true }
  q.academic = { skill: spec.academic || spec.construct || 'foundation step', curriculum_strand: spec.strand || (q.academic && q.academic.curriculum_strand) || 'foundation', structured_literacy_stage: 'foundation' }
  q.life_skill = { primary: 'Everyday basics', domain: spec.life_domain || 'organisation', everyday_context: spec.context || 'everyday_life', hidden_lesson: 'Small, sure steps build big skills.', transfer_prompt: null }
  q.cognition = { process: 'remember', bloom: 'remember', executive_function: ['sustained_attention'], working_memory_load: 1, reasoning_steps: 1 }
  q.analysis = {
    primary_construct: spec.construct || spec.academic || 'foundation step',
    diagnostic_purpose: 'Starter item: confirms the very first step of this skill before anything harder is offered.',
    dyslexia_marker: null,
    behaviour_watch: 'Hesitation here usually means the learner needs the next step modelled, not more practice of the same.',
    personality_signal: null,
    parent_note: 'A starter question. Getting it right shows the first building block is in place.',
    teacher_action_if_missed: 'Model it once with real objects or a spoken example, then try a similar starter item.',
  }
  if (spec.life) q.life_skill = { ...q.life_skill, ...spec.life }
  if (spec.cognition) q.cognition = { ...q.cognition, ...spec.cognition }
  if (spec.analysis) q.analysis = { ...q.analysis, ...spec.analysis }
  if (spec.difficulty_band) q.difficulty_band = spec.difficulty_band
  q.tags = { cognitive: [q.cognition.bloom, ...q.cognition.executive_function], life_skill: [q.life_skill.domain], emotional: ['neutral'], context: [q.life_skill.everyday_context], phonics: [] }
  if (q.telemetry) q.telemetry = { ...q.telemetry, expected_response_time_ms: 8000, hesitation_concern_ms: 24000 }
  q.adaptive = { mastery_weight: 1, on_correct: 'advance', on_first_error: 'hint_1', on_second_error: 'worked_example', on_third_error: `reteach:${spec.question_type}`, revisit_after_days: 3 }
  q.wellbeing = { emotion_checkin_after: false, confidence_prompt: false, timer_pressure: false, guaranteed_win: false }
  if (spec.interaction === 'mic_record') q.speech_scoring = { expected_keywords: [].concat(en(spec.keywords)), sample_answer: en(spec.sample) }
  else if ('speech_scoring' in template) q.speech_scoring = null
  if (translated) {
    q.translations = {}
    for (const lang of LANGS) {
      const inst = pick(spec.instruction, lang) !== en(spec.instruction) ? pick(spec.instruction, lang) : idx.instruction.get(`${en(spec.instruction)}|${lang}`)
      if (!inst) throw new Error(`${spec.id}: no ${lang} instruction for "${en(spec.instruction)}"`)
      const need = (field) => { const v = pick(spec[field], lang); if (spec[field] && typeof spec[field] === 'object' && !Array.isArray(spec[field]) && spec[field][lang] === undefined && spec[field].en !== undefined && !spec[`${field}_neutral`]) throw new Error(`${spec.id}: missing ${lang} ${field}`); return v }
      const tCorrect = need('correct_answer')
      q.translations[lang] = {
        instruction: inst,
        prompt: need('prompt') ?? '',
        audio_text: need('audio_text') ?? null,
        options: need('options') ?? null,
        correct_answer: tCorrect,
        accepted_answers: need('accepted_answers') ?? (Array.isArray(tCorrect) ? tCorrect : [tCorrect]),
        hints: [need('hint')],
        worked_example: need('worked_example') ?? null,
        feedback: { correct: need('feedback_correct'), incorrect: pick(spec.feedback_incorrect ?? spec.hint, lang), second_try: idx.second_try.get(lang) || SECOND_TRY },
        speech_scoring: spec.interaction === 'mic_record' ? { expected_keywords: [].concat(need('keywords')), sample_answer: need('sample') } : null,
      }
      if (spec.validation_by_lang) q.translations[lang].validation = spec.validation_by_lang(lang)
    }
  }
  return q
}

module.exports = { buildItem, translationIndex, LANGS, LEVEL_NAMES }
