// Server copy of client/src/utils/scoreAnswer.js (same rules, CommonJS), plus
// partial credit for tests (TCH-040). Tests are marked here, never in the browser.
//
// correct_answer shapes by interaction (server/data/README.md):
//   tap_mcq, true_false, drag_to_blank, typed_short, typed_long, letter_bank: string
//   multi_select, drag_order, tap_sequence: string[]
//   match_pairs: [left, right][]      sort_bins: { bin: string[] }
//   mic_record: speech_scoring.expected_keywords[] against { transcript }

const norm = (v) => String(v ?? '').trim().toLowerCase()

const sameSet = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
  const as = [...a].map(norm).sort()
  const bs = [...b].map(norm).sort()
  return as.every((v, i) => v === bs[i])
}

const sameOrder = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
  return a.every((v, i) => norm(v) === norm(b[i]))
}

const pairKey = (pair) => (Array.isArray(pair) ? `${norm(pair[0])}||${norm(pair[1])}` : '')
const samePairSet = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
  const as = a.map(pairKey).sort()
  const bs = b.map(pairKey).sort()
  return as.every((v, i) => v === bs[i])
}

const sameBins = (a, b) => {
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) || Array.isArray(b)) return false
  const aKeys = Object.keys(a).sort()
  const bKeys = Object.keys(b).sort()
  if (aKeys.length !== bKeys.length || !aKeys.every((k, i) => k === bKeys[i])) return false
  return aKeys.every((k) => sameSet(a[k], b[k]))
}

function keywordOverlap(transcript, keywords) {
  const words = norm(transcript).replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean)
  const matched = keywords.filter((k) => words.includes(norm(k))).length
  return keywords.length ? matched / keywords.length : 0
}

const acceptedList = (q) => (Array.isArray(q.accepted_answers) ? q.accepted_answers : [q.correct_answer])

function isCorrect(question, userAnswer) {
  const { interaction, correct_answer, speech_scoring } = question
  switch (interaction) {
    case 'tap_mcq': case 'true_false': case 'drag_to_blank':
    case 'typed_short': case 'typed_long':
      if (typeof userAnswer === 'object' && userAnswer !== null) return false
      return acceptedList(question).some((a) => norm(a) === norm(userAnswer))
    case 'letter_bank': {
      const built = Array.isArray(userAnswer) ? userAnswer.join('') : userAnswer
      if (typeof built === 'object' && built !== null) return false
      return acceptedList(question).some((a) => norm(a) === norm(built))
    }
    case 'multi_select': return sameSet(userAnswer, correct_answer)
    case 'drag_order': case 'tap_sequence': return sameOrder(userAnswer, correct_answer)
    case 'match_pairs': return samePairSet(userAnswer, correct_answer)
    case 'sort_bins': return sameBins(userAnswer, correct_answer)
    case 'mic_record': {
      const keywords = speech_scoring?.expected_keywords || []
      return keywordOverlap(userAnswer?.transcript || '', keywords) >= 0.5
    }
    default: return norm(userAnswer) === norm(correct_answer)
  }
}

// Fraction of credit (0..1) for interactions where "part right" means something.
// multi_select: right picks minus wrong picks, over the number of right answers.
// drag_order/tap_sequence: items in the right position. match_pairs: right pairs.
// sort_bins: items in the right bin. Everything else is all or nothing.
function partialFraction(question, userAnswer) {
  const { interaction, correct_answer } = question
  const clamp = (x) => Math.max(0, Math.min(1, x))
  switch (interaction) {
    case 'multi_select': {
      if (!Array.isArray(userAnswer) || !Array.isArray(correct_answer) || !correct_answer.length) return 0
      const right = new Set(correct_answer.map(norm))
      const picked = new Set(userAnswer.map(norm))
      let hits = 0, misses = 0
      for (const p of picked) (right.has(p) ? hits++ : misses++)
      return clamp((hits - misses) / right.size)
    }
    case 'drag_order': case 'tap_sequence': {
      if (!Array.isArray(userAnswer) || !Array.isArray(correct_answer) || !correct_answer.length) return 0
      return correct_answer.filter((v, i) => norm(v) === norm(userAnswer[i])).length / correct_answer.length
    }
    case 'match_pairs': {
      if (!Array.isArray(userAnswer) || !Array.isArray(correct_answer) || !correct_answer.length) return 0
      const right = new Set(correct_answer.map(pairKey))
      const seen = new Set()
      let hits = 0
      for (const p of userAnswer) { const k = pairKey(p); if (right.has(k) && !seen.has(k)) { hits++; seen.add(k) } }
      return hits / correct_answer.length
    }
    case 'sort_bins': {
      if (!correct_answer || typeof correct_answer !== 'object' || !userAnswer || typeof userAnswer !== 'object') return 0
      const home = {}
      for (const [bin, items] of Object.entries(correct_answer)) for (const it of items || []) home[norm(it)] = bin
      const total = Object.keys(home).length
      if (!total) return 0
      let hits = 0
      for (const [bin, items] of Object.entries(userAnswer)) for (const it of (Array.isArray(items) ? items : [])) if (home[norm(it)] === bin) hits++
      return clamp(hits / total)
    }
    default: return isCorrect(question, userAnswer) ? 1 : 0
  }
}

const PARTIAL_TYPES = new Set(['multi_select', 'drag_order', 'tap_sequence', 'match_pairs', 'sort_bins'])
const MANUAL_TYPES = new Set(['typed_long', 'mic_record'])

// Marks one test item. Returns { correct, fraction, score } where score is in points.
function scoreItem(question, userAnswer, { points = 1, partialCredit = true } = {}) {
  if (userAnswer === undefined || userAnswer === null || userAnswer === '') return { correct: false, fraction: 0, score: 0 }
  const correct = isCorrect(question, userAnswer)
  let fraction = correct ? 1 : 0
  if (!correct && partialCredit && PARTIAL_TYPES.has(question.interaction)) fraction = partialFraction(question, userAnswer)
  return { correct, fraction, score: Math.round(fraction * points * 100) / 100 }
}

// A stable short string for "what did they answer", used for "most common wrong answer".
function answerKey(userAnswer) {
  if (userAnswer === undefined || userAnswer === null) return ''
  if (typeof userAnswer === 'string' || typeof userAnswer === 'number') return norm(userAnswer).slice(0, 120)
  if (Array.isArray(userAnswer)) return userAnswer.map((x) => (Array.isArray(x) ? x.map(norm).join('→') : norm(x))).join(', ').slice(0, 120)
  if (typeof userAnswer === 'object') {
    if ('transcript' in userAnswer) return norm(userAnswer.transcript).slice(0, 120)
    return Object.entries(userAnswer).map(([k, v]) => `${k}: ${(Array.isArray(v) ? v : []).map(norm).join(', ')}`).join(' · ').slice(0, 120)
  }
  return ''
}

module.exports = { isCorrect, partialFraction, scoreItem, answerKey, PARTIAL_TYPES, MANUAL_TYPES, norm }
