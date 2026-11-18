// Test results and item analysis (TCH-052): computed in memory from the
// attempts of one test (30 students x 30 items is a few thousand rows).
const { countedScore } = require('./testRules')

const round1 = (x) => Math.round(x * 10) / 10

// The attempt that counts for a student under the test's rule.
function countedAttempt(attempts, how = 'best') {
  const done = attempts.filter((a) => a.status !== 'in_progress')
  if (!done.length) return null
  if (how === 'last' || how === 'average') return [...done].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0]
  return [...done].sort((a, b) => (b.percent - a.percent) || (new Date(a.submittedAt) - new Date(b.submittedAt)))[0]
}

function distribution(percents, passMark = 50) {
  const buckets = Array.from({ length: 10 }, (_, i) => ({ from: i * 10, to: i === 9 ? 100 : i * 10 + 9, count: 0 }))
  for (const p of percents) buckets[Math.min(9, Math.floor(p / 10))].count++
  const sorted = [...percents].sort((a, b) => a - b)
  const n = sorted.length
  return {
    buckets, n,
    mean: n ? Math.round(sorted.reduce((s, x) => s + x, 0) / n) : null,
    median: n ? (n % 2 ? sorted[(n - 1) / 2] : Math.round((sorted[n / 2 - 1] + sorted[n / 2]) / 2)) : null,
    min: n ? sorted[0] : null, max: n ? sorted[n - 1] : null,
    passed: percents.filter((p) => p >= passMark).length,
  }
}

// Per question: difficulty (share of credit), discrimination (top 27 % minus
// bottom 27 %), time, most common wrong answer and quality flags.
function itemAnalysis(attempts) {
  const done = attempts.filter((a) => a.status !== 'in_progress')
  const ranked = [...done].sort((a, b) => b.percent - a.percent)
  const g = Math.max(1, Math.round(ranked.length * 0.27))
  const upper = new Set(ranked.slice(0, g).map((a) => String(a._id)))
  const lower = new Set(ranked.slice(-g).map((a) => String(a._id)))
  const by = new Map()
  for (const a of done) {
    for (const it of a.items) {
      const key = it.questionId
      if (!by.has(key)) by.set(key, { questionId: key, module: it.module, subject: it.subject, q: it.q, points: it.points, n: 0, answered: 0, credit: 0, correct: 0, time: [], wrong: new Map(), up: [0, 0], low: [0, 0], upWrong: new Map(), pending: 0 })
      const s = by.get(key)
      s.n++
      if (it.needsMarking) { s.pending++; continue }
      const frac = it.points ? (Number(it.score) || 0) / it.points : (it.correct ? 1 : 0)
      s.credit += frac
      if (it.correct) s.correct++
      if (it.answered) s.answered++
      if (Number.isFinite(it.timeMs) && it.timeMs > 0) s.time.push(it.timeMs)
      if (it.answered && !it.correct && it.responseKey) s.wrong.set(it.responseKey, (s.wrong.get(it.responseKey) || 0) + 1)
      const id = String(a._id)
      if (upper.has(id)) { s.up[0] += frac; s.up[1]++; if (!it.correct && it.responseKey) s.upWrong.set(it.responseKey, (s.upWrong.get(it.responseKey) || 0) + 1) }
      if (lower.has(id)) { s.low[0] += frac; s.low[1]++ }
    }
  }
  return [...by.values()].map((s) => {
    const marked = s.n - s.pending
    const p = marked ? s.credit / marked : null
    const disc = s.up[1] && s.low[1] && done.length >= 4 ? s.up[0] / s.up[1] - s.low[0] / s.low[1] : null
    const top = [...s.wrong.entries()].sort((a, b) => b[1] - a[1])[0]
    const upTop = [...s.upWrong.entries()].sort((a, b) => b[1] - a[1])[0]
    const flags = []
    if (p !== null && marked >= 5 && p >= 0.95) flags.push('too_easy')
    if (p !== null && marked >= 5 && p <= 0.2) flags.push('too_hard')
    if (top && marked >= 5 && top[1] / marked >= 0.4) flags.push('confusing')
    if ((disc !== null && disc <= -0.1 && marked >= 5) || (upTop && s.up[1] >= 2 && upTop[1] / s.up[1] >= 0.5)) flags.push('possibly_wrong_key')
    const time = [...s.time].sort((a, b) => a - b)
    return {
      questionId: s.questionId, module: s.module, subject: s.subject,
      interaction: s.q?.interaction, instruction: s.q?.instruction || '', prompt: s.q?.prompt || '', correctAnswer: s.q?.correct_answer ?? null,
      n: s.n, marked, pendingMarking: s.pending,
      difficulty: p === null ? null : Math.round(p * 100),          // % of credit earned (higher = easier)
      percentCorrect: marked ? Math.round((s.correct / marked) * 100) : null,
      discrimination: disc === null ? null : Math.round(disc * 100) / 100,
      avgSeconds: time.length ? round1(time.reduce((x, y) => x + y, 0) / time.length / 1000) : null,
      medianSeconds: time.length ? round1(time[Math.floor(time.length / 2)] / 1000) : null,
      commonWrong: top ? { answer: top[0], count: top[1], share: marked ? Math.round((top[1] / marked) * 100) : 0 } : null,
      flags,
    }
  })
}

// Everything the results page needs, from the test, its attempts and who it was for.
function buildResults(test, attempts, recipients, now = new Date()) {
  const how = test.rules?.counts || 'best'
  const byEmail = new Map()
  for (const a of attempts) {
    if (!byEmail.has(a.studentEmail)) byEmail.set(a.studentEmail, [])
    byEmail.get(a.studentEmail).push(a)
  }
  const counted = []
  const students = recipients.map((s) => {
    const email = String(s.email).toLowerCase()
    const mine = (byEmail.get(email) || []).sort((a, b) => a.attemptNo - b.attemptNo)
    const c = countedAttempt(mine, how)
    if (c) counted.push(c)
    const inProgress = mine.find((a) => a.status === 'in_progress')
    const pct = how === 'average' ? countedScore(mine, 'average') : c?.percent ?? null
    const events = mine.flatMap((a) => a.events || [])
    return {
      studentId: String(s._id), name: s.name, email,
      status: c ? (c.needsMarking ? 'needs_marking' : 'done') : inProgress ? 'in_progress' : 'not_started',
      percent: pct, score: c?.score ?? null, maxScore: c?.maxScore ?? null, passed: pct === null ? null : pct >= (test.rules?.passMark ?? 50),
      late: !!c?.late, submittedAt: c?.submittedAt || null,
      minutes: c?.submittedAt ? Math.round((new Date(c.submittedAt) - new Date(c.startedAt)) / 6000) / 10 : null,
      attempts: mine.map((a) => ({ _id: String(a._id), attemptNo: a.attemptNo, status: a.status, percent: a.status === 'in_progress' ? null : a.percent, submittedAt: a.submittedAt, late: a.late, needsMarking: a.needsMarking })),
      countedAttemptId: c ? String(c._id) : null,
      integrity: { tabSwitches: events.filter((e) => e.type === 'tab_hidden').length, pastes: events.filter((e) => e.type === 'paste').length, fullscreenExits: events.filter((e) => e.type === 'fullscreen_exit').length },
      accommodations: s.accommodations && (s.accommodations.extraTime > 1 || s.accommodations.readAloud || s.accommodations.largerText || s.accommodations.fewerOptions) ? s.accommodations : null,
    }
  })
  const percents = students.map((s) => s.percent).filter((p) => Number.isFinite(p))
  // Compare attempts: the average of everyone's 1st, 2nd, 3rd... try.
  const byNo = new Map()
  for (const a of attempts.filter((x) => x.status !== 'in_progress')) {
    if (!byNo.has(a.attemptNo)) byNo.set(a.attemptNo, [])
    byNo.get(a.attemptNo).push(a.percent)
  }
  const attemptsCompare = [...byNo.entries()].sort((a, b) => a[0] - b[0]).map(([no, ps]) => ({ attemptNo: no, n: ps.length, mean: Math.round(ps.reduce((s, x) => s + x, 0) / ps.length) }))
  return {
    summary: {
      assigned: recipients.length,
      started: students.filter((s) => s.status !== 'not_started').length,
      finished: students.filter((s) => s.status === 'done' || s.status === 'needs_marking').length,
      needsMarking: counted.filter((a) => a.needsMarking).length,
      ...distribution(percents, test.rules?.passMark ?? 50),
    },
    students,
    items: itemAnalysis(counted),
    attemptsCompare,
    generatedAt: now,
  }
}

const csvCell = (v) => {
  const s = v === undefined || v === null ? '' : String(v)
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

function resultsCsv(results) {
  const head = ['Student', 'Email', 'Status', 'Percent', 'Score', 'Max', 'Passed', 'Late', 'Attempts', 'Minutes', 'Submitted', 'Tab switches', 'Pastes']
  const rows = results.students.map((s) => [s.name, s.email, s.status, s.percent, s.score, s.maxScore, s.passed === null ? '' : s.passed ? 'yes' : 'no', s.late ? 'yes' : '', s.attempts.length, s.minutes, s.submittedAt ? new Date(s.submittedAt).toISOString() : '', s.integrity.tabSwitches, s.integrity.pastes])
  const items = [[], ['Question', 'Type', '% correct', 'Difficulty', 'Discrimination', 'Avg seconds', 'Most common wrong answer', 'Flags'],
    ...results.items.map((i) => [i.instruction + (i.prompt ? ` ${i.prompt}` : ''), i.interaction, i.percentCorrect, i.difficulty, i.discrimination, i.avgSeconds, i.commonWrong?.answer || '', i.flags.join(' ')])]
  return [head, ...rows, ...items].map((r) => r.map(csvCell).join(',')).join('\r\n')
}

module.exports = { countedAttempt, distribution, itemAnalysis, buildResults, resultsCsv }
