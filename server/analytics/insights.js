// Plain-language findings (FND-044): rule-based, no AI needed. Each insight has
// a stable `key` + `params` so the client can translate it; `text` is English.
const { MODULES, SUBJECTS } = require('../utils/metrics')

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const hourLabel = (h) => { const s = h % 12 === 0 ? 12 : h % 12; return `${s} ${h < 12 ? 'am' : 'pm'}` }

function buildInsights({ cur, prev, matrix, patterns, streak, who = 'They', rangeDays }) {
  const out = []
  const push = (kind, key, params, text) => out.push({ kind, key, params, text })

  if (streak?.current >= 3) push('celebrate', 'streak', { days: streak.current }, `${streak.current}-day streak! ${streak.current >= 7 ? 'Wonderful consistency.' : 'A great run.'}`)
  if (streak?.current > 0 && streak.current === streak.longest && streak.current >= 5) push('celebrate', 'streak_record', { days: streak.current }, `A new record: ${streak.current} days in a row.`)

  if (cur.answered === 0 && cur.minutes === 0) {
    push('nudge', 'no_activity', {}, `No learning in this period yet. A short session today is a great start.`)
    return out
  }
  if (prev && prev.minutes > 0) {
    const d = cur.minutes - prev.minutes
    if (d >= 10) push('celebrate', 'time_up', { minutes: Math.round(d) }, `${Math.round(d)} more minutes of learning than the period before.`)
    else if (d <= -10) push('nudge', 'time_down', { minutes: Math.round(-d) }, `${Math.round(-d)} fewer minutes than the period before.`)
  }
  if (prev && cur.accuracy != null && prev.accuracy != null) {
    const d = cur.accuracy - prev.accuracy
    if (d >= 5) push('celebrate', 'accuracy_up', { points: d }, `Accuracy is up ${d} points to ${cur.accuracy} %.`)
    else if (d <= -10) push('alert', 'accuracy_down', { points: -d }, `Accuracy is down ${-d} points. A little revision could help.`)
  }

  // Strongest and next-to-practise from the subject x module grid.
  const tiles = []
  for (const s of SUBJECTS) for (const m of MODULES) {
    const c = matrix?.[s]?.[m]
    if (c && c.answered >= 5 && c.accuracy != null) tiles.push({ s, m, ...c })
  }
  if (tiles.length) {
    const best = [...tiles].sort((a, b) => b.accuracy - a.accuracy)[0]
    if (best.accuracy >= 75) push('info', 'strongest', { subject: best.s, module: best.m, accuracy: best.accuracy }, `Strongest: ${cap(best.m)} · ${cap(best.s)} (${best.accuracy} %).`)
    const weak = [...tiles].sort((a, b) => a.accuracy - b.accuracy)[0]
    if (weak.accuracy < 70 && weak !== best) push('nudge', 'practise_next', { subject: weak.s, module: weak.m, accuracy: weak.accuracy }, `Practise next: ${cap(weak.m)} · ${cap(weak.s)} (${weak.accuracy} %).`)
  }
  if (patterns?.bestHour != null && cur.answered >= 20) {
    push('info', 'best_time', { hour: patterns.bestHour }, `Most learning happens around ${hourLabel(patterns.bestHour)}.`)
  }
  if (rangeDays >= 7 && cur.consistency != null && cur.consistency >= 80) push('celebrate', 'consistent', { percent: cur.consistency }, `Learning on ${cur.activeDays} of ${rangeDays} days. Wonderfully consistent.`)
  return out.slice(0, 6)
}

// One calm sentence for the top of a dashboard.
function buildStory({ cur, prev, who = 'They', rangeLabel = 'this period' }) {
  if (!cur || (cur.minutes === 0 && cur.answered === 0)) return `${who} haven't learned ${rangeLabel} yet.`
  const h = Math.floor(cur.minutes / 60), m = Math.round(cur.minutes % 60)
  const time = h ? `${h} h ${m} min` : `${m} min`
  let s = `${who} learned ${time} ${rangeLabel}`
  if (prev && prev.minutes > 0) {
    const d = Math.round(cur.minutes - prev.minutes)
    if (Math.abs(d) >= 5) s += d > 0 ? `, ${d} min more than before` : `, ${-d} min less than before`
  }
  s += cur.accuracy != null ? ` and answered ${cur.answered} questions with ${cur.accuracy} % right.` : '.'
  return s
}

module.exports = { buildInsights, buildStory }
