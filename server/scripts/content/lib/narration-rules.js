// The narration rules (docs/learning/QUESTION-BANK.md "Narration"), in one place: used by the
// merge of authored scripts and the templated builder (narration.js), the QA gate (audit.js)
// and the tests. A narration is { text, style, v: 1, status }. checkNarration() returns a list
// of problems (empty = fine) for one question in one language.
//
// It speaks to the learner, at most 50 words (35 on listening items, the audio follows), at
// most one "!", and it never gives the answer: typed / spoken / ordering / tile items never
// contain the answer (as words or as the same number); choice items read all options in
// order, or none. It never reads what the item tests: the card text of a Read item, the audio
// of a listening item, the word options of a listening or English reading item, the target of
// an English Write item (said or spelled). A templated translation contains no English.
const { numberTokens, parseNumberAnswer } = require('../../../utils/scoreAnswer')

// v4 styles; v2 scripts (content v5) are all 'plain' (docs/learning/TEACHING-STANDARDS.md).
const STYLES = ['curious', 'story', 'detective', 'adventure', 'calm', 'challenge', 'plain']
const STATUSES = ['authored', 'templated', 'reviewed']
const CHOICE = new Set(['tap_mcq', 'true_false', 'drag_to_blank', 'multi_select'])
const MAX_WORDS = 50
const MAX_WORDS_LISTEN = 35

// ── Narration v2 (content v5): short, literal, action first (TEACHING-STANDARDS.md) ──
// The action strip shows these keys as icon + word, in the order the script says them.
const CUES = ['listen', 'look', 'read', 'count', 'think', 'tap', 'drag', 'type', 'say', 'order', 'match', 'sort']
// How an English script says each cue (whole words).
const CUE_WORDS = {
  listen: /\b(listen|hear)\b/i, look: /\blook\b/i, read: /\bread\b/i, count: /\bcount\b/i,
  think: /\b(think|work (it|them|this) out)\b/i, tap: /\b(tap|press|choose|pick)\b/i, drag: /\b(drag|move|put)\b/i,
  type: /\b(type|write|spell)\b/i, say: /\b(say|tell|answer out loud|clap)\b/i, order: /\border\b/i,
  match: /\b(match|join|pair)\b/i, sort: /\b(sort|group)\b/i,
}
// Budgets by level: [words, words per sentence]; at most 3 sentences. Other languages get half
// as much again (the same instruction takes more words in German or Russian than in English).
const V2_BUDGET = (level) => (level <= 2 ? [12, 8] : level <= 5 ? [18, 10] : [24, 12])
const V2_SENTENCES = 3
// An English v2 sentence starts with an action, or is a short question.
const V2_STARTS = new Set(['listen', 'look', 'read', 'count', 'think', 'tap', 'drag', 'type', 'say', 'put', 'find', 'match', 'sort', 'choose', 'pick', 'write', 'spell', 'build', 'fix', 'clap', 'answer', 'tell', 'show', 'make', 'work', 'add', 'take', 'use', 'check', 'fill', 'copy', 'order', 'hear', 'name', 'press', 'move', 'join', 'explain', 'plan', 'drag', 'group', 'try', 'then', 'first', 'next', 'now', 'which', 'what', 'how', 'is', 'are', 'does', 'do', 'can', 'who', 'where', 'when', 'why', 'will', 'did', 'was', 'were', 'should', 'would'])
// Story and game framing, idioms and figurative phrases (never in a v2 script).
const FIGURATIVE = /\b(detective|adventure|mission|quest|treasure|magic(al)?|sneaky|hiding|hidden|secret|spy|superhero|ninja|wizard|mystery|riddle|puzzle it|brain[- ]?(teaser|power)|catch (it|them)|with your ears|eagle[- ]eyed|super ?star|let'?s|time to|ready for|you'?ve got this|tricky one|piece of cake|over to you|give it a (go|try|whirl))\b/i
const sentencesOf = (t) => String(t).split(/(?<=[.?!。？！])\s*/u).map((x) => x.trim()).filter((x) => /[\p{L}\p{N}]/u.test(x))

// Cues an item needs when no script gives them: from the English instruction, else the module
// and the widget. Language-neutral keys, the same in every language.
function deriveCues(q, module, baseInstruction) {
  const text = String(baseInstruction ?? q.instruction ?? '')
  const found = CUES.map((c) => ({ c, at: text.search(CUE_WORDS[c]) })).filter((x) => x.at >= 0).sort((a, b) => a.at - b.at).map((x) => x.c)
  const it = q.interaction
  const act = it === 'mic_record' ? 'say' : /^typed_/.test(it) ? 'type' : it === 'drag_order' ? 'order' : it === 'match_pairs' ? 'match' : it === 'sort_bins' ? 'sort' : it === 'drag_to_blank' ? 'drag' : 'tap'
  const first = module === 'listen' ? 'listen' : module === 'read' ? 'read' : null
  const out = []
  for (const c of [first, ...found, act]) if (c && !out.includes(c)) out.push(c)
  return out.slice(0, 3)
}

// The v2 checks for one script (q = the question in this language).
function checkV2(q, n, lang, problems) {
  const t = n.text
  const level = Number.isInteger(q.level) ? q.level : 3
  const scale = lang === 'en' ? 1 : 1.5
  const [maxWords, maxPerSentence] = V2_BUDGET(level).map((x) => Math.round(x * scale))
  const words = wordCount(t, lang)
  if (words > maxWords) problems.push(`v2: ${words} words (max ${maxWords} at level ${level})`)
  const sentences = sentencesOf(t)
  if (sentences.length > V2_SENTENCES) problems.push(`v2: ${sentences.length} sentences (max ${V2_SENTENCES})`)
  const long = sentences.find((x) => wordCount(x, lang) > maxPerSentence)
  if (long) problems.push(`v2: a sentence of ${wordCount(long, lang)} words (max ${maxPerSentence}): "${long.slice(0, 30)}"`)
  if (/[!！]/.test(t)) problems.push('v2: no "!"')
  if (n.style !== 'plain') problems.push('v2: style must be plain')
  if (!Array.isArray(n.cues) || n.cues.length < 1 || n.cues.length > 3) problems.push('v2: 1-3 cues')
  else {
    const bad = n.cues.filter((c) => !CUES.includes(c))
    if (bad.length) problems.push(`v2: unknown cue "${bad[0]}"`)
    if (new Set(n.cues).size !== n.cues.length) problems.push('v2: a cue twice')
  }
  if (lang !== 'en') return
  const fig = t.match(FIGURATIVE)
  if (fig) problems.push(`v2: figurative or game framing "${fig[0]}"`)
  for (const x of sentences) {
    const w = x.replace(/^[^\p{L}]+/u, '').split(/[\s,]+/)[0].toLowerCase().replace(/[^a-z']/g, '')
    if (!V2_STARTS.has(w) && !/\?$/.test(x)) { problems.push(`v2: sentence starts "${w}", not an action or a question`); break }
  }
  if (level <= 2 && /\b(not|never)\b|n't\b/.test(t)) problems.push('v2: no negation at levels 0-2 (NOT in capitals only from level 3)')
  if (Array.isArray(n.cues)) {
    let last = -1
    for (const c of n.cues) {
      const at = CUE_WORDS[c] ? t.search(CUE_WORDS[c]) : -1
      if (at < 0) { problems.push(`v2: cue "${c}" is not said`); break }
      if (at < last) { problems.push('v2: cues out of the order they are said'); break }
      last = at
    }
  }
}

const HAN = /[\p{Script=Han}]/u
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}]/u
const CJK_CHARS = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu
const PICTO = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{20E3}\u{200D}]/gu

// Lower case, no accents, letters and digits only, single spaces. Works for every script.
function norm(s) {
  return String(s ?? '').toLowerCase().normalize('NFKD').replace(/\p{M}+/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim()
}
const stripPicto = (s) => String(s ?? '').replace(PICTO, '').replace(/^[\s✅❌✔️✓✗•·\-–—:]+/u, '').trim()

// Does `text` say `needle`? Whole words for spaced scripts; Chinese/Japanese text has no spaces,
// so a substring (one Han character is a word; kana needles need two characters, since one
// kana is a grammatical particle as often as a word). Digits never match inside a bigger number.
function says(text, needle) {
  const n = norm(needle)
  if (!n) return false
  const t = norm(text)
  if (/^\d+$/.test(n.replace(/ /g, ''))) return new RegExp(`(^|[^\\p{N}])${n.replace(/ /g, '\\s*')}($|[^\\p{N}])`, 'u').test(t)
  if (HAN.test(n) || KANA.test(n)) {
    if (!HAN.test(n) && [...n.replace(/ /g, '')].length < 2) return false
    return t.replace(/ /g, '').includes(n.replace(/ /g, ''))
  }
  if (n.length < 2) return false
  return (` ${t} `).includes(` ${n} `)
}

function wordCount(text, lang) {
  const s = String(text || '')
  if (lang === 'zh' || lang === 'ja') {
    const cjk = (s.match(CJK_CHARS) || []).length
    const rest = s.replace(CJK_CHARS, ' ').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length
    return Math.ceil(cjk / (lang === 'zh' ? 1.6 : 2)) + rest
  }
  return s.trim().split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length
}

const flat = (v) => (Array.isArray(v) ? v.flat(3) : v && typeof v === 'object' ? Object.values(v).flat(3) : [v]).filter((x) => x != null && typeof x !== 'object').map(String)
const textOptions = (opts) => (Array.isArray(opts) ? opts.map((o) => (typeof o === 'string' ? stripPicto(o) : '')) : [])
const hasLetters = (s) => /\p{L}/u.test(String(s || ''))

// English words that never belong in a templated narration in another language (names and
// maths units are not in the list). Checked on whole words.
const ENGLISH_LEFTOVERS = ['the', 'and', 'you', 'your', 'listen', 'tap', 'which', 'what', 'look', 'read', 'choose', 'picture', 'answer', 'carefully', 'then', 'with', 'this', 'that', 'here', 'let', 'lets', 'say', 'word', 'true', 'false', 'yes', 'type', 'drag', 'missing', 'number', 'sentence', 'out', 'loud', 'think', 'find', 'take', 'time', 'step', 'one']
const EN_LEFTOVER_SET = new Set(ENGLISH_LEFTOVERS)
// …except where the word is also ordinary in that language.
const LEFTOVER_OK = { nl: new Set(['type', 'drag']), fr: new Set(['type']), it: new Set(['type']), de: new Set(['type']), id: new Set(['tap']), tr: new Set([]) }

// Module / subject in lower case (the bank stores "Listen", "Science", "Math").
function ctxOf(q, ctx = {}) {
  const prefix = String(q.id || '').split('-')
  const module = String(ctx.module || q.module || { LIS: 'listen', RD: 'read', WR: 'write', SPK: 'speak' }[prefix[1]] || '').toLowerCase()
  let subject = String(ctx.subject || q.subject || { EN: 'english', MA: 'maths', SCI: 'science' }[prefix[0]] || '').toLowerCase()
  if (subject === 'math') subject = 'maths'
  return { module, subject }
}
// The learner hears the stimulus (listening module, or "Listen…" in the English instruction).
const audioCarriesStimulus = (q, module, baseInstruction) => !!q.audio_text && (module === 'listen' || /\blisten\b/i.test(String(baseInstruction ?? q.instruction ?? '')))

// q = the question in this language (after applyQuestionTranslation for lang != en).
// opts: { lang, module, subject, baseInstruction (English), templated (bool) }
function checkNarration(q, n, opts = {}) {
  const lang = opts.lang || 'en'
  const { module, subject } = ctxOf(q, opts)
  const problems = []
  if (!n || typeof n !== 'object' || typeof n.text !== 'string' || !n.text.trim()) return ['missing narration']
  const t = n.text
  if (!STYLES.includes(n.style)) problems.push(`style "${n.style}"`)
  if (n.v !== undefined && n.v !== 1 && n.v !== 2) problems.push(`v ${n.v}`)
  if (n.v === 2) checkV2(q, n, lang, problems)
  if (opts.requireV2 && n.v !== 2) problems.push('v2 required (content v5)')
  if (n.status !== undefined && !STATUSES.includes(n.status)) problems.push(`status "${n.status}"`)
  const listen = module === 'listen'
  const max = listen ? MAX_WORDS_LISTEN : MAX_WORDS
  const words = wordCount(t, lang)
  if (words > max) problems.push(`${words} words (max ${max})`)
  if ((t.match(/[!！]/g) || []).length > 1) problems.push('more than one "!"')
  if (/[{}[\]]|<\/?[a-z]/i.test(t)) problems.push('markup characters')

  const it = q.interaction
  const choice = CHOICE.has(it)
  const opts2 = textOptions(q.options)
  const optNorms = opts2.map(norm)

  // 1. Never the answer (choice items may read every option neutrally). For ordering items the
  // answer is the order: the whole sequence, or every item (any order) since the tiles are often
  // stored in answer order. Pairs and bins: the items are on screen; the matching is the answer.
  const SEQ = it === 'drag_order' || it === 'tap_sequence' || (it === 'letter_bank' && Array.isArray(q.correct_answer))
  const STRUCT = it === 'match_pairs' || it === 'sort_bins'
  let answers = STRUCT ? [] : SEQ ? [] : [...flat(q.correct_answer), ...flat(q.accepted_answers)]
  if (SEQ && Array.isArray(q.correct_answer)) {
    const items = q.correct_answer.map((x) => stripPicto(String(x))).filter((x) => norm(x))
    if (items.length) answers.push(items.join(' '))
    const sayable = items.filter((x) => norm(x).length >= 2)
    if (sayable.length >= 2 && sayable.every((x) => says(t, x))) problems.push('says every item of the sequence')
  }
  if (it === 'mic_record' && q.speech_scoring && typeof q.speech_scoring.sample_answer === 'string') answers.push(q.speech_scoring.sample_answer)
  for (const a of answers) {
    if (!a || a === 'open' || norm(a) === 'open') continue
    const isOption = choice && optNorms.includes(norm(stripPicto(a)))
    if (isOption) continue
    if (says(t, stripPicto(a)) || says(t, a)) { problems.push(`says the answer "${a.slice(0, 30)}"`); break }
  }
  // …nor the same number (digits or number words; "one" is an article too often to count).
  if (!choice && typeof q.correct_answer === 'string' && q.correct_answer !== 'open') {
    const p = parseNumberAnswer(q.correct_answer, lang, { final: false })
    if (p && !p.multiple && Number.isFinite(p.value) && !(p.rest && p.rest.length > 1)) {
      const hit = p.value === 1
        ? /(^|[^\d.,])1([^\d.,]|$)/.test(t) // "one" / "un" / "een" are articles too: only the digit counts
        : numberTokens(t, lang).some((x) => x.num !== undefined && Math.abs(x.value - p.value) < 1e-9)
      if (hit) problems.push(`says the answer number ${p.value}`)
    }
  }
  // Speaking items whose prompt is what the learner must say (read aloud, say this number).
  if (it === 'mic_record' && typeof q.prompt === 'string' && hasLetters(q.prompt.replace(PICTO, '')) === true) {
    // …i.e. the prompt is (nearly all of) the answer: "Read this sentence out loud", "cat, dog, sun".
    const pw = norm(q.prompt).split(' ').filter(Boolean)
    const said = pw.length > 0 && answers.some((a) => {
      const aw = norm(a).split(' ').filter(Boolean)
      return aw.length > 0 && says(a, q.prompt) && pw.length / aw.length >= 0.6
    })
    if (said && says(t, q.prompt)) problems.push('reads the words the learner must say')
  }
  if (it === 'mic_record' && typeof q.prompt === 'string' && /^\s*[\d\s+\-−x×÷=.,]+\s*$/.test(q.prompt) && says(t, q.prompt)) {
    const pn = numberTokens(q.prompt, 'en').map((x) => x.value).join(' ')
    const an = answers.map((a) => numberTokens(a, lang).filter((x) => x.num !== undefined).map((x) => x.value).join(' '))
    if (an.includes(pn)) problems.push('reads the numbers the learner must say')
  }

  // 2. A listening item: never the audio, never its word options.
  if (audioCarriesStimulus(q, module, opts.baseInstruction)) {
    const a = norm(q.audio_text)
    const long = HAN.test(a) || KANA.test(a) ? a.replace(/ /g, '').length >= 2 : a.length >= 3
    if (long && says(t, q.audio_text)) problems.push('says the listening audio')
  }
  const wordOptionsBanned = listen || (subject === 'english' && module === 'read')
  if (wordOptionsBanned && it !== 'true_false') {
    const read = opts2.filter((o) => hasLetters(o) && says(t, o))
    if (read.length) problems.push(`reads the word option "${read[0].slice(0, 20)}"`)
  }

  // 3. Read module (every subject): never the card text; English Write: never the target.
  if ((module === 'read' || (subject === 'english' && module === 'write')) && typeof q.prompt === 'string') {
    const card = q.prompt.replace(/_{2,}/g, ' ').trim()
    const nc = norm(card)
    const cjk = HAN.test(nc) || KANA.test(nc)
    if (nc && (cjk ? nc.replace(/ /g, '').length >= 2 : nc.length >= 3) && says(t, card)) problems.push(`reads the card text "${card.slice(0, 30)}"`)
    else {
      for (const sentence of card.split(/(?<=[.?!。？！])\s*|\n+/u)) {
        const ns = norm(sentence)
        const big = HAN.test(ns) || KANA.test(ns) ? ns.replace(/ /g, '').length >= 4 : ns.split(' ').length >= 3
        if (big && says(t, sentence)) { problems.push(`reads the card text "${sentence.slice(0, 30)}"`); break }
      }
    }
  }
  if (subject === 'english' && module === 'write') {
    for (const a of answers) {
      const letters = [...String(a).toLowerCase().replace(/[^a-z]/g, '')]
      if (letters.length >= 2 && letters.length <= 12) {
        const spelled = new RegExp(`(^|[^a-z])${letters.join('[\\s,.\\-–]+')}([^a-z]|$)`)
        if (spelled.test(t.toLowerCase())) { problems.push(`spells the target "${a}"`); break }
      }
    }
  }

  // 4. Choice items: all options in order, or none (true/false labels are ordinary words).
  if (choice && it !== 'true_false' && opts2.length && opts2.every((o) => norm(o).length >= 1)) {
    const readIdx = opts2.map((o, i) => (says(t, o) ? i : -1)).filter((i) => i >= 0)
    if (readIdx.length && readIdx.length !== opts2.length) problems.push(`reads ${readIdx.length} of ${opts2.length} options`)
    if (readIdx.length === opts2.length && opts2.length > 1) {
      const tn = norm(t)
      const pos = opts2.map((o) => tn.indexOf(norm(o)))
      if (pos.some((p, i) => i && p < pos[i - 1])) problems.push('options out of order')
    }
  }

  // 5. Another language: no English left over.
  if (lang !== 'en') {
    const ok = LEFTOVER_OK[lang] || new Set()
    // Accents kept: Vietnamese "thật" is not English "that".
    const left = t.normalize('NFC').toLowerCase().split(/[^\p{L}\p{M}']+/u).map((w) => w.replace(/'/g, '')).filter((w) => EN_LEFTOVER_SET.has(w) && !ok.has(w))
    if (left.length) problems.push(`English left in ${lang}: "${left.slice(0, 3).join(', ')}"`)
  }
  return problems
}

module.exports = { checkNarration, norm, says, wordCount, stripPicto, textOptions, ctxOf, audioCarriesStimulus, deriveCues, sentencesOf, STYLES, STATUSES, CHOICE, MAX_WORDS, MAX_WORDS_LISTEN, ENGLISH_LEFTOVERS, CUES, CUE_WORDS, V2_BUDGET, FIGURATIVE }
