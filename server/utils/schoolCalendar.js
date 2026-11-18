// The school calendar (FND-018 / ADM-012 / ADM-062): academic years, terms,
// holidays and exam weeks. Dates are local YYYY-MM-DD strings.
const ISO = /^\d{4}-\d{2}-\d{2}$/
const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }

// Every date from start to end inclusive (capped at a year, to stay small).
function datesBetween(start, end) {
  const out = []
  if (!ISO.test(start) || !ISO.test(end) || start > end) return out
  for (let d = start; d <= end && out.length < 366; d = addDays(d, 1)) out.push(d)
  return out
}

// Validates a year payload; returns { error } or the clean value.
function cleanYear(body = {}) {
  const name = String(body.name || '').trim()
  if (!name || name.length > 40) return { error: 'Give the year a name, like 2026-27.' }
  if (!ISO.test(body.start || '') || !ISO.test(body.end || '') || body.start >= body.end) return { error: 'The year needs a start date before its end date.' }
  const spans = (list, label, withKind) => {
    const out = []
    for (const x of Array.isArray(list) ? list : []) {
      const n = String(x?.name || '').trim()
      if (!n || n.length > 80) return { error: `Each ${label} needs a name.` }
      if (!ISO.test(x.start || '') || !ISO.test(x.end || '') || x.start > x.end) return { error: `${n}: the start must be on or before the end.` }
      if (x.start < body.start || x.end > body.end) return { error: `${n} must fall inside the year.` }
      if (withKind && !['holiday', 'exam', 'event'].includes(x.kind)) return { error: `${n}: choose holiday, exam or event.` }
      out.push({ name: n, start: x.start, end: x.end, ...(withKind ? { kind: x.kind } : {}) })
    }
    if (out.length > 60) return { error: `Too many ${label}s.` }
    return { list: out }
  }
  const terms = spans(body.terms, 'term', false)
  if (terms.error) return terms
  const sorted = [...terms.list].sort((a, b) => (a.start < b.start ? -1 : 1))
  for (let i = 1; i < sorted.length; i++) if (sorted[i].start <= sorted[i - 1].end) return { error: `${sorted[i - 1].name} and ${sorted[i].name} overlap.` }
  const events = spans(body.events, 'calendar entry', true)
  if (events.error) return events
  return { value: { name, start: body.start, end: body.end, terms: sorted, events: events.list } }
}

// The term containing `date`, and the one before it (for "vs previous term").
function termsAround(years, date) {
  const all = years.flatMap((y) => (y.terms || []).map((t) => ({ ...t, id: String(t._id || ''), year: y.name }))).sort((a, b) => (a.start < b.start ? -1 : 1))
  const i = all.findIndex((t) => t.start <= date && date <= t.end)
  if (i < 0) return { current: null, previous: all.filter((t) => t.end < date).pop() || null, all }
  return { current: all[i], previous: i > 0 ? all[i - 1] : null, all }
}

// Holiday dates for streaks, or undefined when the school turned that off.
async function streakSkipDates(orgId) {
  const { getOrgPolicy } = require('./orgPolicy')
  const AcademicYear = require('../models/admin/AcademicYear')
  const policy = await getOrgPolicy(orgId)
  if (!policy.holidaysKeepStreak) return undefined
  const years = await AcademicYear.find({ orgId, status: { $ne: 'archived' } }).select('events').lean()
  const dates = years.flatMap((y) => (y.events || []).filter((e) => e.kind === 'holiday').flatMap((e) => datesBetween(e.start, e.end)))
  return dates.length ? dates : undefined
}

module.exports = { datesBetween, cleanYear, termsAround, streakSkipDates, addDays, ISO }
