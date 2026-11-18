// CSV / paste import and CSV export for the question bank (TCH-022).
// The .xlsx template path (teacherQuestionController) is unchanged; this covers
// rich questions of every interaction type.
//
// Columns (header row required for CSV/TSV):
//   interaction, instruction, prompt, emoji, audio_text, options, correct_answer,
//   accepted_answers, hints, feedback_correct, feedback_incorrect, feedback_second_try,
//   worked_example, keywords, skills, grade_band, difficulty, curriculum_code,
//   estimated_seconds, points
// Lists use "|". match_pairs answers: "cat=🐱|dog=🐶". sort_bins answers:
// "animals: cat, dog | vehicles: car, bus".

const COLUMNS = [
  'interaction', 'instruction', 'prompt', 'emoji', 'audio_text', 'options', 'correct_answer', 'accepted_answers', 'hints',
  'feedback_correct', 'feedback_incorrect', 'feedback_second_try', 'worked_example', 'keywords', 'skills', 'grade_band',
  'difficulty', 'curriculum_code', 'estimated_seconds', 'points',
]

// RFC 4180-ish: quotes, doubled quotes, newlines inside quotes. `sep` is ',' or '\t'.
function parseDelimited(text, sep = ',') {
  const rows = []
  let row = [], cell = '', inQ = false
  const s = String(text || '').replace(/^﻿/, '')
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inQ) {
      if (ch === '"') { if (s[i + 1] === '"') { cell += '"'; i++ } else inQ = false }
      else cell += ch
    } else if (ch === '"' && cell === '') inQ = true
    else if (ch === sep) { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += ch
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ''))
}

const split = (v) => String(v || '').split('|').map((x) => x.trim()).filter(Boolean)

function rowToInput(rec) {
  const interaction = String(rec.interaction || '').trim().toLowerCase() || 'tap_mcq'
  let correct = rec.correct_answer
  if (interaction === 'multi_select' || interaction === 'drag_order' || interaction === 'tap_sequence') correct = split(correct)
  if (interaction === 'match_pairs') correct = split(correct).map((p) => p.split('=').map((x) => x.trim()))
  if (interaction === 'sort_bins') {
    correct = {}
    for (const part of split(rec.correct_answer)) {
      const [bin, items] = part.split(':')
      if (bin && items !== undefined) correct[bin.trim()] = items.split(',').map((x) => x.trim()).filter(Boolean)
    }
  }
  return {
    interaction,
    instruction: rec.instruction, prompt: rec.prompt, emoji: rec.emoji, audio_text: rec.audio_text,
    options: split(rec.options), correct_answer: correct, accepted_answers: split(rec.accepted_answers), hints: split(rec.hints),
    feedback: { correct: rec.feedback_correct, incorrect: rec.feedback_incorrect, second_try: rec.feedback_second_try },
    worked_example: rec.worked_example,
    speech_scoring: { expected_keywords: split(rec.keywords), sample_answer: rec.correct_answer },
    skillIds: split(rec.skills), gradeBand: rec.grade_band || undefined, difficulty: rec.difficulty || undefined,
    curriculumCode: rec.curriculum_code, estimatedSeconds: rec.estimated_seconds || undefined, points: rec.points || undefined,
  }
}

// Plain text pasted from a document:
//   What is 3 + 4?
//   a) 6
//   b) 7 *
//   Answer: seven        (no options -> typed answer)
// Questions are separated by a blank line; "*" marks right options.
function parseTextBlocks(text) {
  const blocks = String(text || '').replace(/\r/g, '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  return blocks.map((b) => {
    const lines = b.split('\n').map((l) => l.trim()).filter(Boolean)
    const question = lines[0].replace(/^(\d+[.)]|q\d*[.:)]|question\s*\d*[.:)])\s*/i, '')
    const opts = [], right = []
    let answer = '', hint = ''
    for (const l of lines.slice(1)) {
      const m = l.match(/^(?:[-•*]|\(?[a-hA-H][.)]|\d+[.)])\s*(.+)$/)
      const ans = l.match(/^(?:answer|ans)\s*[:=-]\s*(.+)$/i)
      const h = l.match(/^hint\s*[:=-]\s*(.+)$/i)
      if (ans) answer = ans[1].trim()
      else if (h) hint = h[1].trim()
      else if (m) {
        let o = m[1].trim()
        const star = /\*\s*$/.test(o) || /\(correct\)\s*$/i.test(o)
        o = o.replace(/\s*(\*|\(correct\))\s*$/i, '').trim()
        opts.push(o); if (star) right.push(o)
      }
    }
    if (opts.length) {
      const fromAnswer = answer ? opts.filter((o) => o.toLowerCase() === answer.toLowerCase()) : []
      const correct = right.length ? right : fromAnswer
      return correct.length > 1
        ? { interaction: 'multi_select', instruction: question, options: opts, correct_answer: correct, hints: hint ? [hint] : [] }
        : { interaction: 'tap_mcq', instruction: question, options: opts, correct_answer: correct[0] || '', hints: hint ? [hint] : [] }
    }
    return { interaction: 'typed_short', instruction: question, correct_answer: answer, hints: hint ? [hint] : [] }
  })
}

// Returns [{ line, input }] from CSV, TSV or plain text.
function parseImport(text, format = 'auto') {
  const t = String(text || '')
  const firstLine = t.replace(/^﻿/, '').split(/\r?\n/)[0] || ''
  let fmt = format
  if (fmt === 'auto') fmt = /\binteraction\b/i.test(firstLine) || /\binstruction\b/i.test(firstLine) ? (firstLine.includes('\t') ? 'tsv' : 'csv') : 'text'
  if (fmt === 'text') return { format: 'text', rows: parseTextBlocks(t).map((input, i) => ({ line: i + 1, input })) }
  const rows = parseDelimited(t, fmt === 'tsv' ? '\t' : ',')
  if (!rows.length) return { format: fmt, rows: [] }
  const header = rows[0].map((h) => String(h).trim().toLowerCase().replace(/\s+/g, '_'))
  return {
    format: fmt,
    rows: rows.slice(1).map((r, i) => {
      const rec = {}
      header.forEach((h, j) => { rec[h] = r[j] !== undefined ? String(r[j]).trim() : '' })
      return { line: i + 2, input: rowToInput(rec) }
    }),
  }
}

const csvCell = (v) => {
  const s = v === undefined || v === null ? '' : String(v)
  // Neutralise spreadsheet formulas (CSV injection) and quote when needed.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

function questionToRow(q) {
  const ca = q.correct_answer
  let correct = ''
  if (q.interaction === 'match_pairs' && Array.isArray(ca)) correct = ca.map((p) => `${p[0]}=${p[1]}`).join('|')
  else if (q.interaction === 'sort_bins' && ca && typeof ca === 'object') correct = Object.entries(ca).map(([b, items]) => `${b}: ${(items || []).join(', ')}`).join(' | ')
  else if (Array.isArray(ca)) correct = ca.join('|')
  else correct = ca ?? ''
  const rec = {
    interaction: q.interaction, instruction: q.instruction, prompt: q.prompt, emoji: q.image?.emoji || q.emoji || '', audio_text: q.audio_text || '',
    options: Array.isArray(q.options) && q.interaction !== 'match_pairs' && q.interaction !== 'sort_bins' ? q.options.join('|') : '',
    correct_answer: correct,
    accepted_answers: Array.isArray(q.accepted_answers) && typeof q.accepted_answers[0] === 'string' ? q.accepted_answers.join('|') : '',
    hints: Array.isArray(q.hints) ? q.hints.join('|') : '',
    feedback_correct: q.feedback?.correct || '', feedback_incorrect: q.feedback?.incorrect || '', feedback_second_try: q.feedback?.second_try || '',
    worked_example: q.worked_example || '', keywords: (q.speech_scoring?.expected_keywords || []).join('|'),
    skills: (q.skillIds || []).join('|'), grade_band: q.gradeBand || '', difficulty: q.difficulty || q.level || '',
    curriculum_code: q.curriculumCode || '', estimated_seconds: q.estimatedSeconds || '', points: q.points || '',
  }
  return COLUMNS.map((c) => csvCell(rec[c])).join(',')
}

const toCsv = (questions) => [COLUMNS.join(','), ...questions.map(questionToRow)].join('\r\n')

module.exports = { COLUMNS, parseDelimited, parseTextBlocks, parseImport, rowToInput, toCsv, questionToRow, csvCell }
