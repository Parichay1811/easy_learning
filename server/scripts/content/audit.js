#!/usr/bin/env node
// Question-bank audit and QA gate (no database). Loads the 12 bank files and checks every
// question; prints a readable summary and can write the full JSON report.
//
//   node server/scripts/content/audit.js                 summary of everything
//   node server/scripts/content/audit.js --check         exit 1 if any SERVED item (qa.status != excluded)
//                                                        fails a blocking check (the QA gate)
//   node server/scripts/content/audit.js --json out.json full per-question report
//   node server/scripts/content/audit.js --id MA-WR-T02-Q01   one question, all findings
//   node server/scripts/content/audit.js --verbose       list every finding, not just counts
//
// Blocking checks: schema, unique_id, options, answer_key, round_trip, translations, audio,
// speech, qa. Warnings: duplicate_content, mode, level, untranslated, word_problem.
const path = require('path')
const { loadAll } = require('./lib/bankio')
const scorer = require('../../utils/scoreAnswer')
const { applyQuestionTranslation } = require('../../utils/applyQuestionTranslation')

const { checkAnswer, canon, loose, parseEquation, numberTokens } = scorer
const LANGS = ['es', 'fr', 'pt', 'it', 'de', 'nl', 'ru', 'tr', 'zh', 'ja', 'ko', 'id', 'vi']
const INTERACTIONS = ['tap_mcq', 'true_false', 'drag_to_blank', 'multi_select', 'drag_order', 'tap_sequence', 'letter_bank', 'match_pairs', 'sort_bins', 'typed_short', 'typed_long', 'mic_record']
const METHODS = ['choice', 'set', 'sequence', 'pairs', 'bins', 'text', 'number', 'speech_keywords', 'speech_open', 'rubric']
const BLOCKING = new Set(['schema', 'unique_id', 'options', 'answer_key', 'round_trip', 'translations', 'audio', 'speech', 'qa'])
const ALL_CHECKS = ['schema', 'unique_id', 'options', 'answer_key', 'round_trip', 'translations', 'audio', 'speech', 'qa', 'duplicate_content', 'mode', 'level', 'untranslated', 'word_problem']
const ID_RE = /^(EN|MA|SCI)-(LIS|RD|WR|SPK)-(T\d{2}|F00|S0[6-8])-Q\d{2}$/

let skillsCache = null
function skillCatalogue() {
  if (!skillsCache) {
    try { skillsCache = require('../../data/skills.json') } catch { skillsCache = { skills: [] } }
  }
  return skillsCache
}

const clone = (x) => JSON.parse(JSON.stringify(x))
const graphemes = (s) => {
  try { return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(String(s))].map((g) => g.segment) } catch { return [...String(s)] }
}

// ── What the widget submits for the right answer, and for wrong ones ──
function submissions(q) {
  const it = q.interaction
  const right = [], wrong = []
  const acc = Array.isArray(q.accepted_answers) ? q.accepted_answers : []
  switch (it) {
    case 'tap_mcq': case 'true_false': case 'drag_to_blank': {
      const opts = Array.isArray(q.options) ? q.options : []
      const okSet = new Set([...acc, q.correct_answer].filter((x) => typeof x === 'string').map(canon))
      for (const o of opts) (okSet.has(canon(o)) ? right : wrong).push(o)
      break
    }
    case 'multi_select': {
      const c = Array.isArray(q.correct_answer) ? q.correct_answer : []
      right.push([...c])
      if (c.length > 1) wrong.push(c.slice(1))
      const extra = (q.options || []).find((o) => !c.map(canon).includes(canon(o)))
      if (extra !== undefined) wrong.push([...c, extra])
      break
    }
    case 'drag_order': case 'tap_sequence': {
      const c = Array.isArray(q.correct_answer) ? q.correct_answer : []
      right.push([...c])
      if (c.length > 1) { const sw = [...c]; [sw[0], sw[1]] = [sw[1], sw[0]]; if (canon(sw[0]) !== canon(sw[1])) wrong.push(sw) }
      break
    }
    case 'letter_bank': {
      if (Array.isArray(q.correct_answer)) {
        right.push([...q.correct_answer])
        const c = q.correct_answer
        if (c.length > 1 && canon(c[0]) !== canon(c[c.length - 1])) { const sw = [...c]; [sw[0], sw[sw.length - 1]] = [sw[sw.length - 1], sw[0]]; wrong.push(sw) }
      } else if (q.validation && q.validation.equation) {
        const tiles = String(q.correct_answer).trim().split(/\s+/)
        right.push(tiles)
        const nums = tiles.map((t, i) => (/^\d/.test(t) ? i : -1)).filter((i) => i >= 0)
        if (nums.length >= 2) { const sw = [...tiles]; [sw[nums[0]], sw[nums[nums.length - 1]]] = [sw[nums[nums.length - 1]], sw[nums[0]]]; wrong.push(sw) }
      } else {
        const word = String(q.correct_answer)
        const opts = Array.isArray(q.options) ? q.options : []
        const multi = opts.some((o) => [...String(o)].length > 1)
        right.push(multi ? [word] : [...word])
        if (word.length > 2 && !multi) { const w = [...word]; [w[0], w[w.length - 1]] = [w[w.length - 1], w[0]]; if (w.join('') !== word) wrong.push(w) }
      }
      break
    }
    case 'match_pairs': {
      const c = Array.isArray(q.correct_answer) ? q.correct_answer : []
      right.push(c.map((p) => [...p]))
      if (c.length > 1 && Array.isArray(c[0]) && Array.isArray(c[1])) { const w = c.map((p) => [...p]); [w[0][1], w[1][1]] = [w[1][1], w[0][1]]; wrong.push(w) }
      break
    }
    case 'sort_bins': {
      const c = q.correct_answer || {}
      right.push(clone(c))
      const bins = Object.keys(c)
      if (bins.length > 1 && (c[bins[0]] || []).length) { const w = clone(c); const it2 = w[bins[0]].shift(); w[bins[1]].push(it2); wrong.push(w) }
      break
    }
    case 'typed_short': case 'typed_long': {
      for (const a of [...acc, q.correct_answer]) if (typeof a === 'string' && a.trim() && a !== 'open') right.push(a)
      if (q.graded === false && !right.length) right.push('My own answer.')
      // Rubric items keyed "open": a minimal answer that uses the rubric's words.
      if (!right.length && q.validation && q.validation.method === 'rubric' && Array.isArray(q.validation.keywords)) {
        const n = Math.max(1, q.validation.min || 1)
        right.push(`I think ${q.validation.keywords.slice(0, n).map((g) => [].concat(g)[0]).join(' and ')}.`)
      }
      const okSet = new Set(right.map(canon))
      for (const k of Object.keys(q.distractor_insight || {})) if (!okSet.has(canon(k))) wrong.push(k)
      for (const o of q.options || []) if (typeof o === 'string' && !okSet.has(canon(o))) wrong.push(o)
      if (q.validation && q.validation.method === 'number') {
        const n = scorer.parseNumberAnswer(String(q.correct_answer), q.lang || 'en', { final: true })
        if (n && !n.multiple && Number.isFinite(n.value) && !n.frac) wrong.push(String(n.value + 1))
      } else wrong.push('zzzz')
      break
    }
    case 'mic_record': {
      const ss = q.speech_scoring || {}
      if (typeof ss.sample_answer === 'string' && ss.sample_answer.trim()) right.push({ transcript: ss.sample_answer })
      wrong.push({ transcript: 'I do not know' })
      const v = q.validation || {}
      const en = (q.lang || 'en') === 'en'
      if (Array.isArray(v.numbers) && v.numbers.length && v.number_final) wrong.push({ transcript: String(v.numbers[v.numbers.length - 1] + 1) })
      if (Array.isArray(v.numbers) && v.numbers.length === 1 && !v.number_final) wrong.push({ transcript: String(v.numbers[0] + 2) })
      if (v.compare && en && v.compare.less && v.compare.more) {
        wrong.push({ transcript: `${v.compare.less[0]} is bigger` })
        wrong.push({ transcript: `${v.compare.more[0]} is smaller` })
      }
      if (v.time && en) { const [hh, mm] = v.time.split(':').map(Number); wrong.push({ transcript: `${(hh % 12) + 1}:${String(mm).padStart(2, '0')}` }) }
      break
    }
    default: break
  }
  return { right, wrong }
}

// ── Maths answer checks on prompts/audio we can parse ──
const evalSimple = (a, op, b) => (op === '+' ? a + b : op === '-' ? a - b : op === 'x' || op === '×' || op === '*' ? a * b : op === '÷' || op === '/' ? a / b : NaN)
function mathsExpected(q) {
  const raw = `${q.prompt || ''}`.replace(/[−–]/g, '-').trim()
  const audio = `${q.audio_text || ''}`.replace(/[−–]/g, '-').trim()
  const T = q.id.replace(/-Q\d+$/, '')
  let m
  // a op b = ? / a op b
  if ((m = raw.match(/^(\d+)\s*([+\-x×])\s*(\d+)\s*(?:=\s*(?:\?|_{2,}))?$/))) return { value: evalSimple(+m[1], m[2], +m[3]), how: 'expression' }
  // a op b = c, true/false items handled elsewhere; missing numbers
  if ((m = raw.match(/^(\d+)\s*([+-])\s*(?:\?|_{2,})\s*=\s*(\d+)$/))) return { value: m[2] === '+' ? +m[3] - +m[1] : +m[1] - +m[3], how: 'missing' }
  if ((m = raw.match(/^(?:\?|_{2,})\s*([+-])\s*(\d+)\s*=\s*(\d+)$/))) return { value: m[1] === '+' ? +m[3] - +m[2] : +m[3] + +m[2], how: 'missing' }
  // operator: 6 ___ 2 = 8
  if ((m = raw.match(/^(\d+)\s*(?:\?|_{2,})\s*(\d+)\s*=\s*(\d+)$/))) {
    const ops = ['+', '-'].filter((o) => evalSimple(+m[1], o, +m[2]) === +m[3])
    return ops.length === 1 ? { value: ops[0], how: 'operator', text: true } : null
  }
  // comparison: 7 ___ 4 / 6 + 3 ? 5 + 4
  const side = (s) => { const t = s.trim().match(/^(\d+)(?:\s*([+\-x×])\s*(\d+))?$/); return t ? (t[2] ? evalSimple(+t[1], t[2], +t[3]) : +t[1]) : null }
  if ((m = raw.match(/^(.+?)\s*(?:\?|_{2,})\s*(.+)$/)) && T !== 'MA-WR-T05') {
    const a = side(m[1]), b = side(m[2])
    if (a !== null && b !== null) return { value: a > b ? '>' : a < b ? '<' : '=', how: 'compare', text: true }
  }
  // repeated emoji counting
  const g = graphemes(raw).filter((x) => x.trim())
  const numericKey = typeof q.correct_answer === 'string' && /^\s*\d+\s*$/.test(q.correct_answer)
  if (numericKey && g.length >= 2 && g.every((x) => x === g[0]) && /\p{Extended_Pictographic}/u.test(g[0])) return { value: g.length, how: 'count' }
  // number words → digits
  if (T === 'MA-WR-T06' || T === 'MA-SPK-T01') {
    const n = scorer.parseNumberAnswer(raw, 'en')
    if (n && !n.multiple && !n.rest.length) return { value: n.value, how: 'number_word' }
  }
  // patterns: 1, 2, 3, ___
  if ((m = raw.match(/^((?:\d+,\s*)+)(?:\?|_{2,})$/))) {
    const ns = m[1].split(',').map((s) => s.trim()).filter(Boolean).map(Number)
    if (ns.length >= 3) {
      const d = ns.map((v, i) => (i ? v - ns[i - 1] : null)).slice(1)
      if (d.every((x) => x === d[0])) return { value: ns[ns.length - 1] + d[0], how: 'pattern' }
      const r = ns[1] / ns[0]
      if (ns.every((v, i) => !i || v === ns[i - 1] * r)) return { value: ns[ns.length - 1] * r, how: 'pattern' }
      if (ns.slice(2).every((v, i) => v === ns[i] + ns[i + 1])) return { value: ns[ns.length - 1] + ns[ns.length - 2], how: 'pattern' }
    }
  }
  // audio: "What is four minus one?", "What number comes after six?"
  const a = audio.toLowerCase()
  const nums = numberTokens(a, 'en').filter((t) => t.num !== undefined).map((t) => t.num)
  if ((m = a.match(/comes (after|before)/)) && nums.length === 1) return { value: m[1] === 'after' ? nums[0] + 1 : nums[0] - 1, how: 'before_after' }
  if (/^what is .* (plus|minus|add|take away|times) /.test(a) && nums.length === 2) {
    const op = /plus|add/.test(a) ? '+' : /times/.test(a) ? 'x' : '-'
    return { value: evalSimple(nums[0], op, nums[1]), how: 'spoken_expression' }
  }
  return null
}
// Simple one-step word problems: two numbers and a clear "more"/"left" cue.
function wordProblemCandidates(text) {
  const t = String(text || '').toLowerCase()
  const nums = numberTokens(t, 'en').filter((x) => x.num !== undefined && !x.frac).map((x) => x.num)
  if (nums.length !== 2) return null
  const add = /\b(more|gets|finds|found|adds|added|gives (him|her) |picks up|altogether|in total|total|together|then)\b/.test(t)
  const sub = /\b(gives|gave|eats|ate|eaten|spends|spent|sold|sells|used|left|away|fewer|lost|loses|checked out|free|less)\b/.test(t)
  const out = []
  if (add) out.push(nums[0] + nums[1])
  if (sub) out.push(Math.abs(nums[0] - nums[1]))
  return out.length ? out : null
}

function asNumber(v, lang) {
  const p = scorer.parseNumberAnswer(String(v ?? ''), lang || 'en', { final: true })
  return p && !p.multiple ? p.value : null
}

// ── The audit of one question ──
function auditQuestion(q, ctx = {}) {
  const findings = []
  const add = (check, message, extra = {}) => findings.push({ check, severity: BLOCKING.has(check) ? 'blocking' : 'warning', message, ...extra })
  const subject = ctx.subject || ({ EN: 'english', MA: 'maths', SCI: 'science' }[String(q.id).split('-')[0]])
  const module = ctx.module || ({ LIS: 'listen', RD: 'read', WR: 'write', SPK: 'speak' }[String(q.id).split('-')[1]])
  const served = !(q.qa && q.qa.status === 'excluded')

  // schema
  if (!ID_RE.test(String(q.id))) add('schema', `id "${q.id}" does not match the id pattern`)
  if (!INTERACTIONS.includes(q.interaction)) add('schema', `unknown interaction "${q.interaction}"`)
  if (!q.instruction || !String(q.instruction).trim()) add('schema', 'missing instruction')
  if (!Number.isInteger(q.level) || q.level < 0 || q.level > 8) add('schema', `level ${q.level} not an integer 0..8`)
  if (q.correct_answer === undefined || q.correct_answer === null || q.correct_answer === '') add('schema', 'missing correct_answer')
  const cat = skillCatalogue()
  if (ctx.baseline) { /* original (v2) content: no v3 metadata expected */ } else {
  if (!q.skill) add('schema', 'missing skill')
  else if (cat.skills.length && !cat.skills.some((s) => s.id === q.skill)) add('schema', `skill "${q.skill}" is not in skills.json`)
  if (!['all', 'young'].includes(q.age_band)) add('schema', `age_band "${q.age_band}"`)
  if (typeof q.graded !== 'boolean') add('schema', 'graded is not a boolean')
  if (!q.validation || !METHODS.includes(q.validation.method)) add('schema', `validation.method "${q.validation && q.validation.method}"`)
  if (!q.qa || q.qa.version !== 3 || !['verified', 'needs_review', 'excluded'].includes(q.qa.status)) add('schema', 'qa block missing or not version 3')
  }

  // qa consistency
  if (q.qa && q.qa.status === 'needs_review' && q.graded !== false) add('qa', 'needs_review items must be graded:false')
  if (q.qa && q.qa.status === 'excluded' && !q.qa.reason) add('qa', 'excluded without a reason')

  // options / structure
  const opts = Array.isArray(q.options) ? q.options : null
  const acc = Array.isArray(q.accepted_answers) ? q.accepted_answers : []
  const it = q.interaction
  if (['tap_mcq', 'true_false', 'drag_to_blank'].includes(it)) {
    if (!opts || opts.length < 2) add('options', 'fewer than two options')
    else {
      if (new Set(opts.map(canon)).size !== opts.length) add('options', 'duplicate options')
      if (typeof q.correct_answer !== 'string' || !opts.map(canon).includes(canon(q.correct_answer))) add('options', `correct answer "${q.correct_answer}" is not an option`)
      for (const a of acc) if (!opts.map(canon).includes(canon(a))) add('options', `accepted answer "${a}" is not an option`)
    }
  } else if (it === 'multi_select') {
    if (!opts || !Array.isArray(q.correct_answer) || !q.correct_answer.length) add('options', 'multi_select needs options and a non-empty answer list')
    else {
      for (const c of q.correct_answer) if (!opts.map(canon).includes(canon(c))) add('options', `answer "${c}" is not an option`)
      if (q.correct_answer.length === opts.length) add('options', 'every option is right (nothing to discriminate)')
    }
  } else if (it === 'drag_order' || it === 'tap_sequence') {
    if (!opts || !Array.isArray(q.correct_answer)) add('options', 'sequence needs options and an answer list')
    else {
      const pool = opts.map(canon)
      for (const c of q.correct_answer) { const i = pool.indexOf(canon(c)); if (i < 0) add('options', `answer item "${c}" is not a tile`); else pool.splice(i, 1) }
      if (it === 'drag_order' && q.correct_answer.length !== opts.length) add('options', 'drag_order answer is not a permutation of the options')
    }
  } else if (it === 'letter_bank') {
    if (!opts) add('options', 'letter_bank without tiles')
    else if (Array.isArray(q.correct_answer)) {
      const pool = opts.map(canon)
      for (const c of q.correct_answer) { const i = pool.indexOf(canon(c)); if (i < 0) add('options', `word "${c}" is not a tile`); else pool.splice(i, 1) }
      if (pool.length) add('options', 'extra tiles: the widget waits for exactly the answer length')
    } else {
      const tiles = q.validation && q.validation.equation ? String(q.correct_answer).trim().split(/\s+/) : [...String(q.correct_answer)]
      const pool = opts.map(String)
      for (const c of tiles) { const i = pool.indexOf(c); if (i < 0) add('options', `"${c}" of the answer is not a tile`); else pool.splice(i, 1) }
      if (pool.length) add('options', 'tiles left over: the widget waits for every tile when the answer is text')
    }
  } else if (it === 'match_pairs') {
    const c = q.correct_answer
    if (!Array.isArray(c) || !c.length || !c.every((p) => Array.isArray(p) && p.length === 2)) add('options', 'match_pairs answer is not a list of [left, right] pairs')
    else {
      if (!opts) add('options', 'match_pairs without right-hand options')
      else for (const p of c) if (!opts.includes(p[1])) add('options', `right side "${p[1]}" is not shown (options hold the right-hand column)`)
      if (new Set(c.map((p) => p[0])).size !== c.length) add('options', 'duplicate left items')
    }
  } else if (it === 'sort_bins') {
    const c = q.correct_answer
    if (!c || typeof c !== 'object' || Array.isArray(c)) add('options', 'sort_bins answer is not a {bin: items} map')
    else {
      const items = Object.values(c).flat().map(canon)
      if (new Set(items).size !== items.length) add('options', 'an item is in two bins')
      if (opts && (opts.length !== items.length || !opts.every((o) => items.includes(canon(o))))) add('options', 'options are not exactly the sorted items')
    }
  }

  // answer key (maths)
  if (subject === 'maths' && served) {
    const exp = mathsExpected(q)
    if (exp) {
      const key = exp.text ? canon(q.correct_answer) : asNumber(q.correct_answer)
      const ok = exp.text ? key === canon(exp.value) : key !== null && Math.abs(key - exp.value) < 1e-9
      if (!ok && it !== 'mic_record') add('answer_key', `key "${q.correct_answer}" but the ${exp.how} gives ${exp.value}`)
      if (it === 'mic_record' && q.validation && Array.isArray(q.validation.numbers) && q.validation.number_final && exp.how !== 'number_word') {
        const n = q.validation.numbers[q.validation.numbers.length - 1]
        if (Math.abs(n - exp.value) > 1e-9) add('answer_key', `speech target ${n} but the ${exp.how} gives ${exp.value}`)
      }
      if (it === 'mic_record' && q.validation && Array.isArray(q.validation.numbers) && exp.how === 'number_word' && q.validation.numbers[0] !== exp.value) add('answer_key', `speech target ${q.validation.numbers[0]} but the number is ${exp.value}`)
    }
    // equations stated as answers must be true
    const eqText = it === 'mic_record' ? q.prompt : q.correct_answer
    if (typeof eqText === 'string' && /=/.test(eqText) && /^[\d\s+\-x×=.]+$/.test(eqText)) {
      const e = parseEquation(eqText)
      if (e && !e.true) add('answer_key', `"${eqText}" is not a true equation`)
    }
    if (['MA-LIS-T10', 'MA-RD-T10', 'MA-WR-T11', 'MA-SPK-T13'].includes(q.id.replace(/-Q\d+$/, ''))) {
      const c = wordProblemCandidates(q.prompt || q.audio_text)
      const key = it === 'mic_record' ? (q.validation && q.validation.numbers ? q.validation.numbers[0] : null) : asNumber(q.correct_answer)
      if (c && key !== null && !c.some((x) => Math.abs(x - key) < 1e-9)) add('word_problem', `key ${key}; a one-step reading gives ${c.join(' or ')}`)
    }
  }

  // audio
  const listens = module === 'listen' || /\blisten\b/i.test(String(q.instruction))
  if (listens && !(typeof q.audio_text === 'string' && q.audio_text.trim())) add('audio', 'Listen item without audio_text')

  // speech
  if (it === 'mic_record' && q.graded !== false) {
    const v = q.validation || {}
    const usable = (Array.isArray(v.keywords) && v.keywords.length && v.keywords.every((g) => [].concat(g).length)) || (Array.isArray(v.numbers) && v.numbers.length && v.numbers.every(Number.isFinite)) || v.compare || v.time
    if (!usable) add('speech', 'graded speech item without keywords/numbers/comparison/time to check')
    if (!(q.speech_scoring && q.speech_scoring.sample_answer)) add('speech', 'no sample answer to verify against')
  }

  // round trip (English / base)
  const rt = roundTrip(q, ctx.check)
  for (const f of rt) add('round_trip', f)

  // translations
  if (subject !== 'english') {
    const tr = q.translations || {}
    for (const lang of LANGS) {
      const t = tr[lang]
      if (!t) { add('translations', `missing translation ${lang}`); continue }
      if (q.audio_text && !t.audio_text) add('translations', `${lang}: no audio_text`)
      const tq = applyQuestionTranslation(clone(q), lang)
      if (it !== 'letter_bank' && Array.isArray(q.options) && (!Array.isArray(tq.options) || tq.options.length !== q.options.length)) add('translations', `${lang}: ${Array.isArray(tq.options) ? tq.options.length : 0} options, English has ${q.options.length}`)
      if (['tap_mcq', 'true_false', 'drag_to_blank'].includes(it) && Array.isArray(tq.options)) {
        const ei = q.options.map(canon).indexOf(canon(q.correct_answer)), ti = tq.options.map(canon).indexOf(canon(tq.correct_answer))
        if (ti < 0) add('translations', `${lang}: answer "${tq.correct_answer}" is not among the options`)
        else if (ei !== ti) add('translations', `${lang}: the answer is option ${ti + 1} but option ${ei + 1} in English`)
      }
      if (subject === 'maths' && typeof q.correct_answer === 'string' && /^\s*[\d.,/]+\s*[a-z£€$%]*\s*$/i.test(q.correct_answer)) {
        const en = asNumber(q.correct_answer), tn = asNumber(tq.correct_answer, lang)
        if (en !== null && tn !== null && Math.abs(en - tn) > 1e-9) add('translations', `${lang}: answer ${tq.correct_answer} differs from English ${q.correct_answer}`)
      }
      for (const f of roundTrip(tq, ctx.check)) add('translations', `${lang}: ${f}`)
      // untranslated text
      for (const field of ['instruction', 'prompt', 'audio_text']) {
        const e = q[field], x = t[field]
        if (typeof e === 'string' && typeof x === 'string' && e === x && (e.match(/[A-Za-z]{3,}/g) || []).length >= 3) add('untranslated', `${lang}: ${field} is still English`)
      }
    }
  }

  // mode: picture badge or prompt that shows the answer
  const img = q.image && q.image.emoji
  if (img && ['listen', 'read'].includes(module) && ['tap_mcq', 'true_false', 'drag_to_blank', 'multi_select'].includes(it)) {
    const rights = [].concat(q.correct_answer).filter((x) => typeof x === 'string')
    if (rights.some((r) => r === img || (graphemes(r)[0] === img && graphemes(r).length <= 2))) add('mode', `the picture badge ${img} is the answer`)
  }
  if (module === 'listen' && typeof q.prompt === 'string' && typeof q.audio_text === 'string' && q.audio_text.length > 6 && loose(q.prompt).includes(loose(q.audio_text))) add('mode', 'the prompt shows everything the audio says')

  // level heuristics
  if (q.level <= 1 && q.cognition && q.cognition.reasoning_steps >= 3) add('level', `level ${q.level} with ${q.cognition.reasoning_steps} reasoning steps`)
  if (q.level >= 5 && it === 'tap_sequence' && Array.isArray(q.correct_answer) && q.correct_answer.length === 1) add('level', 'level 5 for a single tap')
  if (subject === 'maths' && q.level <= 1 && /\d{2}\s*[+\-x×]\s*\d{2}/.test(`${q.prompt} ${q.audio_text}`)) add('level', 'two-digit arithmetic at level 0/1')

  return findings
}

// Builds each widget submission and runs the checker on it.
function roundTrip(q, check = checkAnswer) {
  const checkAnswer = check || scorer.checkAnswer
  const out = []
  if (q.qa && q.qa.status === 'excluded') return out
  const { right, wrong } = submissions(q)
  const graded = q.graded !== false
  if (!right.length && !(q.interaction === 'mic_record' && !graded)) out.push('no right answer could be built for the widget')
  for (const r of right) {
    const res = checkAnswer(q, r)
    const want = graded ? ['correct'] : ['ungraded']
    if (!want.includes(res.status) && !(graded && res.status === 'ungraded' && res.reason === 'no_check_in_language')) out.push(`right answer ${JSON.stringify(r)} → ${res.status}${res.reason ? ` (${res.reason})` : ''}`)
  }
  if (graded) for (const w of wrong) {
    const res = checkAnswer(q, w)
    if (res.correct && res.status !== 'ungraded') out.push(`wrong answer ${JSON.stringify(w)} → correct`)
  }
  if (q.interaction === 'mic_record') {
    for (const a of [{ unsupported: true }, { error: 'no-speech' }, { transcript: '' }]) {
      const res = checkAnswer(q, a)
      if (res.status !== 'uncertain') out.push(`${JSON.stringify(a)} → ${res.status} (should be uncertain)`)
    }
  }
  return out
}

function runAudit(banks = loadAll()) {
  const report = { generated: new Date().toISOString(), questions: [], totals: {} }
  const seen = new Map()
  const contentSeen = new Map()
  for (const b of banks) {
    for (const q of b.data.questions) {
      const findings = auditQuestion(q, { subject: b.subject, module: b.module })
      if (seen.has(q.id)) findings.push({ check: 'unique_id', severity: 'blocking', message: `duplicate id (also in ${seen.get(q.id)})` })
      seen.set(q.id, b.file)
      const sig = JSON.stringify([b.subject, b.module, q.instruction, q.prompt, q.audio_text, q.correct_answer])
      if (contentSeen.has(sig)) findings.push({ check: 'duplicate_content', severity: 'warning', message: `same content as ${contentSeen.get(sig)}` })
      else contentSeen.set(sig, q.id)
      report.questions.push({ id: q.id, file: b.file, subject: b.subject, module: b.module, level: q.level, interaction: q.interaction, graded: q.graded, status: q.qa && q.qa.status, findings })
    }
  }
  const served = report.questions.filter((r) => r.status !== 'excluded')
  const byCheck = {}
  for (const r of report.questions) for (const f of r.findings) {
    const k = `${f.severity}:${f.check}`
    byCheck[k] = byCheck[k] || { count: 0, served: 0, examples: [] }
    byCheck[k].count++
    if (r.status !== 'excluded') byCheck[k].served++
    if (byCheck[k].examples.length < 5) byCheck[k].examples.push(`${r.id}: ${f.message}`)
  }
  report.totals = {
    questions: report.questions.length,
    served: served.length,
    excluded: report.questions.length - served.length,
    graded: served.filter((r) => r.graded !== false).length,
    practice: served.filter((r) => r.graded === false).length,
    servedBlocking: served.filter((r) => r.findings.some((f) => f.severity === 'blocking')).length,
    byCheck,
  }
  return report
}

function passedChecks(findings) {
  const failed = new Set(findings.map((f) => f.check))
  return ALL_CHECKS.filter((c) => !failed.has(c))
}

function printSummary(report, { verbose = false } = {}) {
  const t = report.totals
  console.log(`Question bank audit — ${t.questions} questions, ${t.served} served (${t.graded} graded, ${t.practice} practice-only), ${t.excluded} excluded`)
  const rows = Object.entries(t.byCheck).sort()
  if (!rows.length) console.log('No findings.')
  for (const [k, v] of rows) {
    console.log(`  ${k.padEnd(28)} ${String(v.count).padStart(5)} (served ${v.served})`)
    for (const e of v.examples.slice(0, verbose ? 5 : 2)) console.log(`      e.g. ${e}`)
  }
  if (verbose) for (const r of report.questions) for (const f of r.findings) console.log(`${r.id}\t${f.severity}\t${f.check}\t${f.message}`)
  console.log(`Served items failing a blocking check: ${t.servedBlocking}`)
}

if (require.main === module) {
  const args = process.argv.slice(2)
  const report = runAudit()
  const idArg = args.indexOf('--id')
  if (idArg >= 0) {
    const r = report.questions.find((x) => x.id === args[idArg + 1])
    console.log(JSON.stringify(r, null, 2))
    process.exit(0)
  }
  printSummary(report, { verbose: args.includes('--verbose') })
  const jsonArg = args.indexOf('--json')
  if (jsonArg >= 0 && args[jsonArg + 1]) {
    require('fs').writeFileSync(path.resolve(args[jsonArg + 1]), JSON.stringify(report, null, 1))
    console.log(`Wrote ${args[jsonArg + 1]}`)
  }
  if (args.includes('--check')) {
    if (report.totals.servedBlocking > 0) {
      for (const r of report.questions) if (r.status !== 'excluded') for (const f of r.findings) if (f.severity === 'blocking') console.error(`BLOCKING ${r.id} ${f.check}: ${f.message}`)
      console.error(`QA gate FAILED: ${report.totals.servedBlocking} served item(s) fail a blocking check.`)
      process.exit(1)
    }
    console.log('QA gate passed: every served item passes every blocking check.')
  }
}

module.exports = { auditQuestion, roundTrip, runAudit, submissions, mathsExpected, passedChecks, printSummary, ALL_CHECKS, BLOCKING, LANGS }
