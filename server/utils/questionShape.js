// Validates and normalises a question written in the in-app editor or imported
// from CSV (TCH-020/021/022) into the shape the question widgets and
// scoreAnswer expect (see server/data/README.md). Returns { data } or { errors }.

const INTERACTIONS = [
  'tap_mcq', 'true_false', 'drag_to_blank', 'multi_select', 'drag_order', 'tap_sequence',
  'letter_bank', 'match_pairs', 'sort_bins', 'typed_short', 'typed_long', 'mic_record',
]
const GRADE_BANDS = ['K-2', '3-5', '6-8', '9-10', '11-12', 'adult']

const str = (v, max) => (v === undefined || v === null ? '' : String(v).trim().slice(0, max))
const list = (v, max = 50, each = 200) => (Array.isArray(v) ? v : v === undefined || v === null || v === '' ? [] : [v])
  .map((x) => str(x, each)).filter(Boolean).slice(0, max)
const slug = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
const lc = (s) => String(s).trim().toLowerCase()
const dupes = (arr) => arr.length !== new Set(arr.map(lc)).size
const sortedChars = (s) => [...lc(s).replace(/\s+/g, '')].sort().join('')

// Fields the editor may set. Anything else in the body is ignored.
function normaliseQuestion(input = {}) {
  const errors = []
  const err = (field, message) => errors.push({ field, message })
  const q = {}

  const interaction = str(input.interaction, 30)
  if (!INTERACTIONS.includes(interaction)) err('interaction', 'Pick a question type')
  q.interaction = interaction

  q.instruction = str(input.instruction, 300)
  if (!q.instruction) err('instruction', 'Write the instruction the student reads first')
  q.prompt = str(input.prompt, 1000)
  q.audio_text = str(input.audio_text, 500) || null
  q.worked_example = str(input.worked_example, 1000)
  q.hints = list(input.hints, 5, 300)

  const fb = input.feedback || {}
  q.feedback = { correct: str(fb.correct, 300), incorrect: str(fb.incorrect, 300), second_try: str(fb.second_try, 300) }

  const emoji = str(input.emoji ?? input.image?.emoji, 16)
  const imageUrl = str(input.imageUrl ?? input.image?.url, 500)
  if (imageUrl && !/^(https?:\/\/|\/uploads\/)/.test(imageUrl)) err('imageUrl', 'The picture link must start with http(s)://')
  q.image = imageUrl ? { mode: 'image', url: imageUrl, emoji: emoji || null } : emoji ? { mode: 'emoji', emoji } : null

  // Answers, by type.
  let options = list(input.options, 12, 200)
  let correct = input.correct_answer
  let accepted = list(input.accepted_answers, 20, 300)

  switch (interaction) {
    case 'tap_mcq': case 'drag_to_blank': case 'true_false': {
      if (interaction === 'true_false' && options.length === 0) options = ['True', 'False']
      correct = str(correct, 200)
      if (options.length < 2) err('options', 'Add at least two options')
      if (interaction === 'true_false' && options.length !== 2) err('options', 'True/false needs exactly two options')
      if (dupes(options)) err('options', 'Options must all be different')
      if (!correct) err('correct_answer', 'Choose the right answer')
      else if (!options.some((o) => lc(o) === lc(correct))) err('correct_answer', 'The right answer must be one of the options')
      accepted = [correct]
      break
    }
    case 'multi_select': {
      correct = list(correct, 12, 200)
      if (options.length < 2) err('options', 'Add at least two options')
      if (dupes(options)) err('options', 'Options must all be different')
      if (!correct.length) err('correct_answer', 'Tick at least one right answer')
      else if (!correct.every((c) => options.some((o) => lc(o) === lc(c)))) err('correct_answer', 'Every right answer must be one of the options')
      accepted = correct
      break
    }
    case 'drag_order': {
      // The options ARE the items, in the right order; students see them shuffled.
      correct = list(correct, 12, 200)
      if (!correct.length) correct = options
      if (correct.length < 2) err('correct_answer', 'Add at least two items to put in order')
      if (dupes(correct)) err('correct_answer', 'Items must all be different')
      options = [...correct]
      accepted = correct
      break
    }
    case 'tap_sequence': {
      correct = list(correct, 12, 200)
      if (options.length < 1) err('options', 'Add the things students can tap')
      if (!correct.length) err('correct_answer', 'Add the taps in the right order')
      else if (!correct.every((c) => options.some((o) => lc(o) === lc(c)))) err('correct_answer', 'Every tap must be one of the options')
      accepted = correct
      break
    }
    case 'letter_bank': {
      correct = str(correct, 60)
      if (!correct) err('correct_answer', 'Type the word students build')
      // Students use every tile, so the tiles are the answer's letters (shuffled for them).
      if (!options.length && correct) options = [...correct.replace(/\s+/g, '')]
      if (correct && sortedChars(options.join('')) !== sortedChars(correct)) err('options', 'The tiles must spell the answer exactly, with no extra tiles')
      accepted = [correct, ...accepted.filter((a) => lc(a) !== lc(correct))]
      break
    }
    case 'match_pairs': {
      const pairs = (Array.isArray(correct) ? correct : [])
        .filter((p) => Array.isArray(p) && p.length >= 2)
        .map((p) => [str(p[0], 200), str(p[1], 200)])
        .filter((p) => p[0] && p[1])
        .slice(0, 8)
      if (pairs.length < 2) err('correct_answer', 'Add at least two pairs')
      if (dupes(pairs.map((p) => p[0])) || dupes(pairs.map((p) => p[1]))) err('correct_answer', 'Each left and each right item must be different')
      correct = pairs
      options = pairs.map((p) => p[1])
      accepted = pairs
      break
    }
    case 'sort_bins': {
      const bins = {}
      if (correct && typeof correct === 'object' && !Array.isArray(correct)) {
        for (const [bin, items] of Object.entries(correct).slice(0, 4)) {
          const name = str(bin, 40)
          if (name) bins[name] = list(items, 12, 200)
        }
      }
      const all = Object.values(bins).flat()
      if (Object.keys(bins).length < 2) err('correct_answer', 'Add at least two groups')
      if (Object.values(bins).some((items) => !items.length)) err('correct_answer', 'Every group needs at least one item')
      if (dupes(all)) err('correct_answer', 'An item can only belong to one group')
      correct = bins
      options = all
      accepted = bins
      break
    }
    case 'typed_short': case 'typed_long': {
      correct = str(correct, interaction === 'typed_long' ? 1000 : 200)
      if (!correct) err('correct_answer', interaction === 'typed_long' ? 'Write a model answer for marking' : 'Type the right answer')
      accepted = [correct, ...accepted.filter((a) => lc(a) !== lc(correct))]
      options = null
      break
    }
    case 'mic_record': {
      const ss = input.speech_scoring || {}
      const keywords = list(ss.expected_keywords, 12, 60)
      if (!keywords.length) err('speech_scoring', 'Add the key words you listen for')
      q.speech_scoring = { expected_keywords: keywords, sample_answer: str(ss.sample_answer ?? correct, 300) }
      correct = q.speech_scoring.sample_answer || keywords.join(' ')
      accepted = [correct]
      options = null
      break
    }
    default: break
  }
  q.options = options
  q.correct_answer = correct
  q.accepted_answers = accepted

  // Tags (TCH-021, FND-042).
  q.skillIds = [...new Set(list(input.skillIds, 10, 80).map(slug).filter(Boolean))]
  q.gradeBand = str(input.gradeBand, 20) || undefined
  if (q.gradeBand && !GRADE_BANDS.includes(q.gradeBand)) err('gradeBand', `Grade band must be one of ${GRADE_BANDS.join(', ')}`)
  const difficulty = input.difficulty === undefined || input.difficulty === '' || input.difficulty === null ? 2 : Number(input.difficulty)
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) err('difficulty', 'Difficulty is 1 to 5')
  q.difficulty = difficulty
  q.level = Number.isInteger(difficulty) ? Math.min(5, Math.max(1, difficulty)) : 1
  q.curriculumCode = str(input.curriculumCode, 40) || undefined
  const est = input.estimatedSeconds === undefined || input.estimatedSeconds === '' ? undefined : Number(input.estimatedSeconds)
  if (est !== undefined && (!Number.isFinite(est) || est < 0 || est > 3600)) err('estimatedSeconds', 'Estimated time is 0 to 3600 seconds')
  q.estimatedSeconds = est
  const points = input.points === undefined || input.points === '' ? 10 : Number(input.points)
  if (!Number.isFinite(points) || points < 1 || points > 100) err('points', 'Points are 1 to 100')
  q.points = points

  if (errors.length) return { errors }
  return { data: q }
}

// Fields copied when a question is duplicated or snapshotted into a test attempt.
const CONTENT_FIELDS = [
  'interaction', 'instruction', 'prompt', 'audio_text', 'image', 'options', 'correct_answer', 'accepted_answers',
  'hints', 'feedback', 'worked_example', 'speech_scoring', 'points', 'level', 'skillIds', 'gradeBand', 'difficulty',
  'curriculumCode', 'estimatedSeconds', 'question_type',
  // old flat schema
  'sentence', 'text', 'title', 'content', 'question', 'answer', 'character', 'type', 'hint', 'emoji', 'category',
]
const pickContent = (doc) => {
  const out = {}
  for (const k of CONTENT_FIELDS) if (doc[k] !== undefined && doc[k] !== null) out[k] = doc[k]
  return out
}

module.exports = { normaliseQuestion, pickContent, CONTENT_FIELDS, INTERACTIONS, GRADE_BANDS, slug }
