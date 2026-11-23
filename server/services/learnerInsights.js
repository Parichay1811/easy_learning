// "At a glance" insights for grown-ups: one learner (parent and teacher) and a teacher's group.
//
//   GET /api/parent/children/:id/insights?days=7|28     (requireOwnChild)
//   GET /api/teacher/students/:id/insights?days=7|28    (a student in one of my groups)
//   GET /api/teacher/groups/:id/insights?days=7|28      (one of my groups)
//
// Built only from what is already recorded: the LearnerDay rollups (activity, first-try and
// hint counts), the engine's per-skill rows (SkillMastery: mastery, reviews, mix-ups, support
// steps), the learner profile's weekly journal (reviews remembered) and the decision log (level
// changes). Periods are ROLLING windows that end today ("the last 7 days" vs "the 7 days
// before"), so a Monday morning is never compared with a whole week.
//
// Every finding carries the numbers it is built from, and nothing is said before the
// minimum evidence in RULES is there ("too early to tell" instead). No scores about ability,
// no comparison with other children, no ranking; time on screen is never shown as progress.
// The server sends keys + params only: the client words them (insights.* i18n keys).
const cfg = require('../config/learning')
const q = require('../analytics/queries')
const { localParts } = require('../analytics/record')
const LearnerDay = require('../models/analytics/LearnerDay')
const LearningDecision = require('../models/learning/LearningDecision')
const store = require('./learning/store')
const { loadCatalog } = require('./learning/catalog')
const { isMastered } = require('./learning/mastery')
const { isReviewDue } = require('./learning/spacing')
const { normalise } = require('./learning/levelPolicy')
const { noteKey } = require('./learning/views')

// The rules every insight follows (also sent to the client for the "How we decide" note).
const RULES = {
  periods: [7, 28],
  // A share (right first time, without a hint) is only compared when BOTH periods have this many answers...
  minAnswers: 20,
  // ...and only called a change when it moved at least this many points AND more than
  // `noise` x the usual ups and downs (the standard error of the difference of two shares).
  minChangePoints: 8,
  noise: 2,
  // A skill is "worth more practice" after at least this many tries, with mastery below `practiseBelow`
  // AND (under `practiseAccuracy` right overall, or the last `recentMisses` tries missed, or a mix-up
  // that keeps coming up). Fewer tries: still "practising" (mastery needs several right answers to build).
  minSkillTries: 6,
  practiseBelow: cfg.needsPracticeBelow,
  practiseAccuracy: 0.65,
  recentMisses: 2,
  // Reviews (a skill coming back days later): said only from this many reviews.
  minReviews: 5,
  rememberedWell: 0.7,
  rememberedLow: 0.5,
  // A mix-up "keeps coming up" from this many times on one skill, not cleared up since.
  mixupRepeat: cfg.misconceptionRepeat,
  // A weekly trend point needs this many answers (fewer: left out, "too few answers that week").
  minWeekAnswers: 10,
  trendWeeks: 8,
  // Practising on at least this share of the days in the period counts as a steady habit.
  habitShare: 4 / 7,
  // A pattern in a group needs at least this many students.
  groupMin: 2,
  // A skill counts as "hard for the group" when at least this share of those practising it find it hard.
  groupHardShare: 0.3,
}

const DAY = 86400000
const round1 = (x) => Math.round(x * 10) / 10
const pctOf = (k, n) => (n > 0 ? Math.round((k / n) * 100) : null)
const lower = (s) => String(s || '').toLowerCase()

// ── Periods ──────────────────────────────────────────────────────────────────
function periodFor(days, tz = 'UTC', today = q.todayIn(tz)) {
  const d = RULES.periods.includes(Number(days)) ? Number(days) : RULES.periods[0]
  const from = q.addDays(today, -(d - 1))
  return { days: d, from, to: today, prev: { from: q.addDays(from, -d), to: q.addDays(from, -1) }, today }
}
const mondayOf = (iso) => { const dt = new Date(`${iso}T12:00:00Z`); const dow = (dt.getUTCDay() + 6) % 7; dt.setUTCDate(dt.getUTCDate() - dow); return dt.toISOString().slice(0, 10) }
const dateIn = (d, tz) => (d ? localParts(new Date(d), tz).date : null)
const within = (iso, from, to) => !!iso && iso >= from && iso <= to

// ── Counting ─────────────────────────────────────────────────────────────────
// LearnerDay rows of ONE learner -> { answered, firstTry, independent, activeDays, lastActive }.
function tally(days) {
  const t = { answered: 0, correct: 0, firstTry: 0, independent: 0, activeDays: 0, minutes: 0, lastActive: null }
  for (const d of days) {
    const a = d.answered || 0
    t.answered += a; t.correct += d.correct || 0; t.firstTry += d.firstTry || 0; t.minutes += d.minutes || 0
    t.independent += Math.max(0, a - Math.min(d.hints || 0, a))
    if (a > 0 || (d.minutes || 0) >= q.ACTIVE_MINUTES) {
      t.activeDays++
      if (!t.lastActive || d.date > t.lastActive) t.lastActive = d.date
    }
  }
  return t
}

// Two shares (k of n): up / down / steady / early, with the rule above.
function compareShare(cur, prev) {
  const out = { cur: pctOf(cur.k, cur.n), prev: pctOf(prev.k, prev.n), curN: cur.n, prevN: prev.n, diff: null, status: 'early' }
  if (cur.n < RULES.minAnswers || prev.n < RULES.minAnswers) return out
  const p1 = cur.k / cur.n, p2 = prev.k / prev.n
  const diff = (p1 - p2) * 100
  const se = Math.sqrt((p1 * (1 - p1)) / cur.n + (p2 * (1 - p2)) / prev.n) * 100
  out.diff = Math.round(diff)
  out.status = Math.abs(diff) >= RULES.minChangePoints && Math.abs(diff) > RULES.noise * se ? (diff > 0 ? 'up' : 'down') : 'steady'
  return out
}

// One skill row -> the state a grown-up sees.
//   secure: mastered (right on different questions, remembered on a later day) and not due
//   review: mastered before and due to come back now ("time for a quick review")
//   practise: tried at least RULES.minSkillTries times, mastery still below RULES.practiseBelow
//   practising: everything else that has been tried
function stateOf(row, now) {
  if (!row || !(row.attempts > 0)) return 'notStarted'
  const mastered = isMastered(row)
  if (mastered && isReviewDue(row, now)) return 'review'
  if (mastered) return 'secure'
  if (needsPractice(row)) return 'practise'
  return 'practising'
}

const openMixups = (row) => (row.misconceptions || []).filter((m) => !m.resolvedAt && (m.count || 0) >= 1)
function needsPractice(row) {
  if ((row.attempts || 0) < RULES.minSkillTries || (row.mastery || 0) >= RULES.practiseBelow) return false
  const acc = (row.correct || 0) / row.attempts
  const repeated = openMixups(row).some((m) => (m.count || 0) >= RULES.mixupRepeat)
  return acc < RULES.practiseAccuracy || (row.missesSinceSuccess || 0) >= RULES.recentMisses || repeated
}
const topMixup = (row) => openMixups(row).sort((a, b) => (b.count || 0) - (a.count || 0) || new Date(b.at || 0) - new Date(a.at || 0))[0] || null

// ── One learner (pure) ───────────────────────────────────────────────────────
/**
 * in: { name, audience: 'parent'|'teacher', period (periodFor), curDays, prevDays, trendDays (LearnerDay rows),
 *       skills (SkillMastery rows), profile (LearnerProfile), decisions (level changes), notes (Map), catalog,
 *       streak, now, tz }
 */
function buildLearner({ name = '', audience = 'parent', period, curDays = [], prevDays = [], trendDays = [], skills = [], profile = {}, decisions = [], notes = new Map(), catalog = null, streak = null, now = new Date(), tz = 'UTC' }) {
  const P = period
  const first = String(name || '').trim().split(/\s+/)[0] || ''
  const cur = tally(curDays), prev = tally(prevDays)
  const nameOf = (row) => catalog?.name(row.skill, row.name) || row.name || row.skill
  const skillRef = (row) => ({ id: row.skill, name: nameOf(row), subject: row.subject })
  const rows = skills.filter((r) => (r.attempts || 0) > 0)

  // Reviews remembered, from the weekly journal: the whole weeks that end in each period.
  // (The journal counts per Monday-week: a week belongs to the period it overlaps, the current one first.)
  const thisMonday = mondayOf(P.to)
  const weeksOver = (from, to) => { const out = []; for (let w = mondayOf(from); w <= to; w = q.addDays(w, 7)) out.push(w); return out }
  const curWeeks = weeksOver(P.from, P.to).reverse()
  const prevWeeks = weeksOver(P.prev.from, P.prev.to).filter((w) => !curWeeks.includes(w)).reverse()
  const journal = profile.journal || []
  const sumReviews = (weeks) => journal.filter((j) => weeks.includes(j.w)).reduce((a, j) => ({ n: a.n + (j.rv || 0), k: a.k + (j.rvc || 0) }), { n: 0, k: 0 })
  const reviews = { cur: sumReviews(curWeeks), prev: sumReviews(prevWeeks), from: curWeeks[curWeeks.length - 1], to: P.to }

  const firstTry = compareShare({ k: cur.firstTry, n: cur.answered }, { k: prev.firstTry, n: prev.answered })
  const independent = compareShare({ k: cur.independent, n: cur.answered }, { k: prev.independent, n: prev.answered })

  // Skills: states, wins, stuck points.
  const states = new Map(rows.map((r) => [r.skill, stateOf(r, now)]))
  const masteredNow = rows.filter((r) => isMastered(r) && within(dateIn(r.masteredAt, tz), P.from, P.to))
    .sort((a, b) => new Date(b.masteredAt) - new Date(a.masteredAt))
  const secureNow = rows.filter((r) => isMastered(r)).length
  const secureAtStart = rows.filter((r) => isMastered(r) && dateIn(r.masteredAt, tz) && dateIn(r.masteredAt, tz) < P.from).length
  const cleared = []
  for (const r of rows) for (const m of r.misconceptions || []) {
    if (m.resolvedAt && within(dateIn(m.resolvedAt, tz), P.from, P.to) && (m.count || 0) >= RULES.mixupRepeat) cleared.push({ row: r, m })
  }
  cleared.sort((a, b) => (b.m.count || 0) - (a.m.count || 0))
  const recentFrom = q.addDays(P.to, -Math.max(P.days, 28) + 1)
  const practise = rows.filter((r) => states.get(r.skill) === 'practise' && within(dateIn(r.lastAt, tz), recentFrom, P.to))
    .map((r) => ({ r, mix: topMixup(r) }))
    .sort((a, b) => Number((b.mix?.count || 0) >= RULES.mixupRepeat) - Number((a.mix?.count || 0) >= RULES.mixupRepeat) || (a.r.mastery || 0) - (b.r.mastery || 0))
  const levelUps = decisions.filter((d) => Number.isInteger(d.from) && Number.isInteger(d.to) && d.to > d.from && within(dateIn(d.at, tz), P.from, P.to))

  const note = (row, m) => {
    const n = m?.q && m?.module ? notes.get(noteKey(row.subject, m.module, m.q)) : null
    return audience === 'teacher' ? n?.teacherAction || null : n?.parentNote || null
  }
  const next = (kind, params = {}, extra = {}) => ({ key: `${audience === 'teacher' ? 'class' : 'home'}.${kind}`, params: { name: first, ...params }, ...extra })

  const findings = []
  // 1. Going well
  if (masteredNow.length) {
    const top = masteredNow[0]
    findings.push({
      id: 'mastered', kind: 'win', key: 'mastered', params: { name: first, count: masteredNow.length, skills: masteredNow.slice(0, 3).map(nameOf) },
      skill: skillRef(top),
      evidence: [{ key: 'masteredRule', params: {} }, { key: 'masteredOn', params: { skill: nameOf(top), date: dateIn(top.masteredAt, tz) } }],
      next: next('teachBack', { skill: nameOf(top) }),
    })
  }
  if (cleared.length) {
    const { row, m } = cleared[0]
    findings.push({
      id: 'cleared', kind: 'win', key: 'mixupCleared', params: { name: first, skill: nameOf(row), count: cleared.length },
      skill: skillRef(row),
      evidence: [{ key: 'clearedHow', params: { count: m.count, date: dateIn(m.resolvedAt, tz) } }, ...(audience === 'teacher' && m.text ? [{ key: 'mixupWas', params: { text: m.text } }] : [])],
      next: next('praiseFix', { skill: nameOf(row) }),
    })
  }
  if (reviews.cur.n >= RULES.minReviews && reviews.cur.k / reviews.cur.n >= RULES.rememberedWell) {
    findings.push({
      id: 'remembered', kind: 'win', key: 'remembered', params: { name: first, k: reviews.cur.k, n: reviews.cur.n, count: reviews.cur.n, pct: pctOf(reviews.cur.k, reviews.cur.n) },
      evidence: [{ key: 'reviewsWhat', params: { from: reviews.from, to: reviews.to } }],
      next: next('recall'),
    })
  }
  if (!findings.length) {
    const strong = rows.filter((r) => isMastered(r) && within(dateIn(r.lastAt, tz), P.from, P.to)).sort((a, b) => (b.attempts || 0) - (a.attempts || 0))[0]
    if (strong) {
      findings.push({
        id: 'strength', kind: 'win', key: 'strength', params: { name: first, skill: nameOf(strong) }, skill: skillRef(strong),
        evidence: [{ key: 'rightOf', params: { correct: strong.correct || 0, attempts: strong.attempts || 0, count: strong.attempts || 0 } }],
        next: next('teachBack', { skill: nameOf(strong) }),
      })
    }
  }
  const wins = findings.slice(0, 2)

  // 2. Worth more practice
  const practiceFindings = practise.slice(0, 2).map(({ r, mix }) => {
    const misses = r.missesSinceSuccess || 0
    const ev = [misses >= RULES.recentMisses
      ? { key: 'rightOfRecent', params: { correct: r.correct || 0, attempts: r.attempts || 0, misses, count: misses } }
      : { key: 'rightOf', params: { correct: r.correct || 0, attempts: r.attempts || 0, count: r.attempts || 0 } }]
    if (mix && mix.count >= RULES.mixupRepeat) ev.push(audience === 'teacher' ? { key: 'mixupText', params: { text: mix.text, count: mix.count } } : { key: 'mixupCount', params: { count: mix.count } })
    if ((r.supportStep | 0) >= 1) ev.push({ key: 'supportTried', params: { strategy: cfg.strategies[r.supportStep | 0] } })
    return {
      id: `practise:${r.skill}`, kind: 'practice', key: 'practise', params: { name: first, skill: nameOf(r) }, skill: skillRef(r),
      evidence: ev,
      next: next('practise', { skill: nameOf(r) }, { note: note(r, mix) }),
    }
  })
  if (reviews.cur.n >= RULES.minReviews && reviews.cur.k / reviews.cur.n < RULES.rememberedLow && practiceFindings.length < 2) {
    practiceFindings.push({
      id: 'slipping', kind: 'practice', key: 'slipping', params: { name: first, k: reviews.cur.k, n: reviews.cur.n, count: reviews.cur.n },
      evidence: [{ key: 'reviewsWhat', params: { from: reviews.from, to: reviews.to } }], next: next('revisit'),
    })
  }

  // 3. Changed since the period before (or too early to tell)
  let change
  if (firstTry.status === 'early') {
    change = {
      id: 'early', kind: 'early', key: 'tooEarly', params: { name: first, cur: cur.answered, prev: prev.answered, need: RULES.minAnswers, count: cur.answered },
      evidence: [{ key: 'tooEarlyWhy', params: { need: RULES.minAnswers, cur: cur.answered, prev: prev.answered } }],
      next: cur.answered ? null : next('start'),
    }
  } else {
    const moved = [['firstTry', firstTry], ['independent', independent]].filter(([, c]) => c.status === 'up' || c.status === 'down')
      .sort((a, b) => Math.abs(b[1].diff) - Math.abs(a[1].diff))[0]
    if (moved) {
      const [what, c] = moved
      // A dip right after moving up a level is expected: say so, with every level-up of the period (at most two).
      const lu = c.status === 'down' ? levelUps[0] : null
      change = {
        id: `change:${what}`, kind: 'change', tone: c.status, key: `${what}${c.status === 'up' ? 'Up' : 'Down'}${lu ? 'Level' : ''}`,
        params: { name: first, from: c.prev, to: c.cur },
        evidence: [{ key: what === 'firstTry' ? 'shareFirstTry' : 'shareIndependent', params: { cur: c.cur, prev: c.prev, curN: c.curN, prevN: c.prevN } },
          ...(lu ? levelUps.slice(0, 2).map((d) => ({ key: 'levelUp', params: { subject: d.subject, from: d.from, to: d.to, date: dateIn(d.at, tz) } })) : [])],
        next: c.status === 'up' ? next('keepGoing') : lu ? next('harder') : next('slowDown'),
      }
    } else {
      change = {
        id: 'steady', kind: 'change', tone: 'steady', key: 'steady', params: { name: first, pct: firstTry.cur },
        evidence: [{ key: 'shareFirstTry', params: { cur: firstTry.cur, prev: firstTry.prev, curN: firstTry.curN, prevN: firstTry.prevN } }],
        next: null,
      }
    }
  }

  // 4. Effort and habits (praise the process; a quiet period is never a fault)
  const habitDays = Math.ceil(P.days * RULES.habitShare)
  const lastActive = cur.lastActive || prev.lastActive || streak?.lastActive || null
  const effort = cur.activeDays === 0
    ? { id: 'quiet', kind: 'effort', key: 'quiet', params: { name: first, days: P.days, last: lastActive }, evidence: lastActive ? [{ key: 'lastActive', params: { date: lastActive } }] : [], next: next('restart') }
    : {
      id: 'effort', kind: 'effort', key: cur.activeDays >= habitDays ? 'habit' : 'someDays',
      params: { name: first, days: cur.activeDays, of: P.days, count: cur.activeDays },
      evidence: [{ key: 'activeDays', params: { cur: cur.activeDays, prev: prev.activeDays, of: P.days, answered: cur.answered, count: cur.answered } }],
      next: cur.activeDays >= habitDays ? null : next('slot'),
    }

  const all = [...wins, ...practiceFindings, change, effort].filter(Boolean).slice(0, 5)

  // Skill map
  const level = Object.fromEntries(cfg.SUBJECTS.map((s) => [s, normalise(profile.levels?.[s]).level]))
  const subjects = cfg.SUBJECTS.map((s) => {
    const mine = rows.filter((r) => r.subject === s)
    if (!mine.length) return null
    const tried = new Set(mine.map((r) => r.skill))
    const upcoming = (catalog?.all?.() || []).filter((c) => c.subject === s && !tried.has(c.id) && Number.isInteger(c.level) && c.level <= level[s])
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
    const list = mine.map((r) => {
      const m = topMixup(r)
      return {
        id: r.skill, name: nameOf(r), state: states.get(r.skill), mastery: Math.round((r.mastery || 0) * 100) / 100,
        attempts: r.attempts || 0, correct: r.correct || 0, lastAt: dateIn(r.lastAt, tz), masteredAt: isMastered(r) ? dateIn(r.masteredAt, tz) : null,
        mixups: openMixups(r).reduce((a, x) => a + (x.count || 0), 0),
        ...(audience === 'teacher' && m ? { mixup: m.text } : {}),
        strategy: (r.supportStep | 0) >= 1 ? cfg.strategies[r.supportStep | 0] : null,
      }
    }).sort((a, b) => ORDER[a.state] - ORDER[b.state] || a.name.localeCompare(b.name))
    const counts = { secure: 0, review: 0, practising: 0, practise: 0 }
    for (const x of list) counts[x.state]++
    return { subject: s, level: level[s], counts: { ...counts, notStarted: upcoming.length }, skills: list, upcoming: upcoming.slice(0, 4).map((c) => ({ id: c.id, name: c.name })) }
  }).filter(Boolean)

  // Weekly trend (last RULES.trendWeeks Monday-weeks), thin weeks left out
  const weeks = Array.from({ length: RULES.trendWeeks }, (_, i) => q.addDays(thisMonday, -7 * (RULES.trendWeeks - 1 - i)))
  const byWeek = new Map(weeks.map((w) => [w, []]))
  for (const d of trendDays) { const w = mondayOf(d.date); if (byWeek.has(w)) byWeek.get(w).push(d) }
  const trend = weeks.map((w) => {
    const t = tally(byWeek.get(w))
    const j = journal.filter((x) => x.w === w).reduce((a, x) => ({ n: a.n + (x.rv || 0), k: a.k + (x.rvc || 0) }), { n: 0, k: 0 })
    const enough = t.answered >= RULES.minWeekAnswers
    return {
      week: w, partial: w === thisMonday && q.addDays(w, 6) > P.to, activeDays: t.activeDays, answered: t.answered,
      firstTry: enough ? pctOf(t.firstTry, t.answered) : null, independent: enough ? pctOf(t.independent, t.answered) : null,
      reviews: j.n, remembered: j.k, rememberedPct: j.n >= 3 ? pctOf(j.k, j.n) : null,
    }
  })

  const practiseCount = rows.filter((r) => states.get(r.skill) === 'practise').length
  return {
    audience,
    period: { days: P.days, from: P.from, to: P.to, prev: P.prev },
    headline: cur.activeDays === 0
      ? { key: 'quiet', params: { name: first, days: P.days } }
      : { key: 'active', params: { name: first, days: cur.activeDays, of: P.days, mastered: masteredNow.length, practise: practiseCount, answered: cur.answered, count: cur.activeDays } },
    findings: all,
    measures: {
      activeDays: { cur: cur.activeDays, prev: prev.activeDays, of: P.days },
      answered: { cur: cur.answered, prev: prev.answered },
      firstTry, independent,
      reviews: { cur: reviews.cur, prev: reviews.prev, status: reviews.cur.n >= RULES.minReviews ? 'ok' : 'early', from: reviews.from, to: reviews.to },
      secure: { now: secureNow, atStart: secureAtStart },
      streak: streak ? { current: streak.current, longest: streak.longest } : null,
    },
    trend,
    skills: { subjects, total: rows.length },
    rules: RULES,
  }
}
const ORDER = { practise: 0, review: 1, practising: 2, secure: 3, notStarted: 4 }

// ── One learner (loader) ─────────────────────────────────────────────────────
async function forLearner(email, { name = '', audience = 'parent', days = 7, tz = 'UTC', now = new Date() } = {}) {
  const e = lower(email)
  const P = periodFor(days, tz)
  const trendFrom = q.addDays(mondayOf(P.to), -7 * (RULES.trendWeeks - 1))
  const fetchFrom = trendFrom < P.prev.from ? trendFrom : P.prev.from
  const [allDays, skills, profile, decisions, streak] = await Promise.all([
    LearnerDay.find({ email: e, date: { $gte: fetchFrom, $lte: P.to } }).select('date answered correct firstTry hints minutes').lean(),
    store.getSkills(e),
    store.getProfile(e),
    LearningDecision.find({ email: e, type: { $in: ['level_up', 'level_set'] }, at: { $gte: new Date(`${P.prev.from}T00:00:00Z`) } }).sort({ at: -1 }).limit(20).lean(),
    q.streak(e, tz),
  ])
  // The notes of the mix-ups behind the skills worth practising (a few questions, one query per bank).
  const refs = []
  for (const r of skills) {
    const m = topMixup(r)
    if (m?.q && m.module && needsPractice(r)) refs.push({ subject: r.subject, module: m.module, q: m.q })
  }
  const notes = refs.length ? await store.questionNotes(refs.slice(0, 12)) : new Map()
  return buildLearner({
    name, audience, period: P, now, tz, skills, profile, decisions, notes, streak, catalog: loadCatalog(),
    curDays: allDays.filter((d) => within(d.date, P.from, P.to)),
    prevDays: allDays.filter((d) => within(d.date, P.prev.from, P.prev.to)),
    trendDays: allDays.filter((d) => d.date >= trendFrom),
  })
}

// ── A teacher's group (pure) ─────────────────────────────────────────────────
/**
 * in: { period, students: [{ id, name, email }], days (LearnerDay rows of all of them, prev.from..to),
 *       skills (SkillMastery rows of all of them), decisions (level changes), notes, catalog, now, tz }
 * Lists are sorted by need and then by NAME, never by a score: this is for planning, not ranking.
 */
function buildGroup({ period, students = [], days = [], skills = [], decisions = [], notes = new Map(), catalog = null, now = new Date(), tz = 'UTC' }) {
  const P = period
  const nameOf = (row) => catalog?.name(row.skill, row.name) || row.name || row.skill
  const byEmail = new Map(students.filter((s) => s.email).map((s) => [lower(s.email), s]))
  const daysBy = new Map(), skillsBy = new Map()
  for (const d of days) { if (!daysBy.has(d.email)) daysBy.set(d.email, []); daysBy.get(d.email).push(d) }
  for (const r of skills) { if (!(r.attempts > 0)) continue; if (!skillsBy.has(r.email)) skillsBy.set(r.email, []); skillsBy.get(r.email).push(r) }
  const who = (s) => ({ id: String(s.id), name: s.name })
  const byName = (a, b) => a.name.localeCompare(b.name)
  const recentFrom = q.addDays(P.to, -Math.max(P.days, 28) + 1)
  const habitDays = Math.ceil(P.days * RULES.habitShare)

  // Per student
  const per = []
  for (const [email, s] of byEmail) {
    const mine = daysBy.get(email) || []
    const cur = tally(mine.filter((d) => within(d.date, P.from, P.to)))
    const prev = tally(mine.filter((d) => within(d.date, P.prev.from, P.prev.to)))
    const rows = skillsBy.get(email) || []
    per.push({ s, email, cur, prev, rows, firstTry: compareShare({ k: cur.firstTry, n: cur.answered }, { k: prev.firstTry, n: prev.answered }) })
  }

  // Skills the group finds hard (to plan a lesson) and suggested small groups
  const bySkill = new Map()
  for (const p of per) for (const r of p.rows) {
    if (!within(dateIn(r.lastAt, tz), recentFrom, P.to) || (r.attempts || 0) < 3) continue
    if (!bySkill.has(r.skill)) bySkill.set(r.skill, { skill: r.skill, name: nameOf(r), subject: r.subject, practising: 0, hard: [], secure: 0, mixups: new Map() })
    const g = bySkill.get(r.skill)
    g.practising++
    if (isMastered(r)) g.secure++
    if (stateOf(r, now) === 'practise') {
      g.hard.push({ ...who(p.s), correct: r.correct || 0, attempts: r.attempts || 0 })
      for (const m of openMixups(r)) {
        const k = m.text
        if (!g.mixups.has(k)) g.mixups.set(k, { text: k, students: 0, ref: m })
        g.mixups.get(k).students++
      }
    }
  }
  const hardSkills = [...bySkill.values()]
    .filter((g) => g.hard.length >= RULES.groupMin && g.hard.length / g.practising >= RULES.groupHardShare)
    .sort((a, b) => b.hard.length - a.hard.length || a.name.localeCompare(b.name))
    .slice(0, 5)
    .map((g) => {
      const mix = [...g.mixups.values()].filter((m) => m.students >= RULES.groupMin).sort((a, b) => b.students - a.students)[0] || null
      const n = mix?.ref?.q && mix.ref.module ? notes.get(noteKey(g.subject, mix.ref.module, mix.ref.q)) : null
      return {
        skill: g.skill, name: g.name, subject: g.subject, practising: g.practising, secure: g.secure, findingHard: g.hard.length,
        students: g.hard.sort(byName),
        mixup: mix ? { text: mix.text, students: mix.students } : null,
        action: n?.teacherAction || null,
      }
    })
  const groupHard = new Set(hardSkills.map((h) => h.skill))

  // Who might need a check-in, and why (at most two reasons each, with the numbers)
  const checkIns = []
  for (const p of per) {
    const reasons = []
    if (p.cur.activeDays === 0) reasons.push({ key: p.prev.activeDays ? 'quiet' : 'notStarted', params: { days: P.days, last: p.prev.lastActive } })
    if (p.firstTry.status === 'down') {
      const lu = decisions.find((d) => d.email === p.email && Number.isInteger(d.from) && Number.isInteger(d.to) && d.to > d.from && within(dateIn(d.at, tz), P.from, P.to))
      reasons.push({ key: lu ? 'firstTryDownLevel' : 'firstTryDown', params: { from: p.firstTry.prev, to: p.firstTry.cur, curN: p.firstTry.curN, prevN: p.firstTry.prevN, ...(lu ? { subject: lu.subject, level: lu.to } : {}) } })
    }
    // A skill the whole group finds hard is planned for below (lesson, small group): not repeated here.
    const stuck = p.rows.filter((r) => stateOf(r, now) === 'practise' && !groupHard.has(r.skill) && within(dateIn(r.lastAt, tz), P.from, P.to))
      .map((r) => ({ r, m: topMixup(r) }))
      .sort((a, b) => (b.m?.count || 0) - (a.m?.count || 0) || (a.r.mastery || 0) - (b.r.mastery || 0))[0]
    if (stuck && ((stuck.m?.count || 0) >= RULES.mixupRepeat + 1 || (stuck.r.supportStep | 0) >= 2)) {
      reasons.push({ key: 'stuck', params: { skill: nameOf(stuck.r), correct: stuck.r.correct || 0, attempts: stuck.r.attempts || 0, mixup: stuck.m?.count >= RULES.mixupRepeat ? stuck.m.text : null, times: stuck.m?.count || 0, strategy: cfg.strategies[stuck.r.supportStep | 0] } })
    }
    if (reasons.length) checkIns.push({ student: who(p.s), reasons: reasons.slice(0, 2) })
  }
  checkIns.sort((a, b) => b.reasons.length - a.reasons.length || byName(a.student, b.student))

  // Mix-ups shared by several students (the same distractor, not cleared up)
  const mixMap = new Map()
  for (const p of per) for (const r of p.rows) for (const m of openMixups(r)) {
    if ((m.count || 0) < RULES.mixupRepeat || !within(dateIn(m.at, tz), recentFrom, P.to)) continue
    const k = `${r.skill}|${m.text}`
    if (!mixMap.has(k)) mixMap.set(k, { text: m.text, skill: nameOf(r), skillId: r.skill, subject: r.subject, students: [], times: 0, ref: m })
    const x = mixMap.get(k)
    x.students.push(who(p.s)); x.times += m.count || 0
  }
  // (A mix-up already named as a hard skill's common one is not listed twice.)
  const shown = new Set(hardSkills.filter((h) => h.mixup).map((h) => `${h.skill}|${h.mixup.text}`))
  const mixups = [...mixMap.values()].filter((x) => x.students.length >= RULES.groupMin && !shown.has(`${x.skillId}|${x.text}`))
    .sort((a, b) => b.students.length - a.students.length || b.times - a.times)
    .slice(0, 5)
    .map((x) => {
      const n = x.ref.q && x.ref.module ? notes.get(noteKey(x.subject, x.ref.module, x.ref.q)) : null
      return { text: x.text, skill: x.skill, skillId: x.skillId, subject: x.subject, students: x.students.sort(byName), times: x.times, action: n?.teacherAction || null }
    })

  // Going well
  const masteredBySkill = new Map()
  for (const p of per) for (const r of p.rows) {
    if (!isMastered(r) || !within(dateIn(r.masteredAt, tz), P.from, P.to)) continue
    if (!masteredBySkill.has(r.skill)) masteredBySkill.set(r.skill, { skill: r.skill, name: nameOf(r), subject: r.subject, students: [] })
    masteredBySkill.get(r.skill).students.push(who(p.s))
  }
  const mastered = [...masteredBySkill.values()].sort((a, b) => b.students.length - a.students.length || a.name.localeCompare(b.name))
  const steady = per.filter((p) => p.cur.activeDays >= habitDays).map((p) => who(p.s)).sort(byName)
  const improving = per.filter((p) => p.firstTry.status === 'up').map((p) => ({ ...who(p.s), from: p.firstTry.prev, to: p.firstTry.cur })).sort(byName)

  // Group numbers
  const sum = (key, which) => per.reduce((a, p) => a + p[which][key], 0)
  const groupShare = compareShare({ k: sum('firstTry', 'cur'), n: sum('answered', 'cur') }, { k: sum('firstTry', 'prev'), n: sum('answered', 'prev') })
  const activeNow = per.filter((p) => p.cur.activeDays > 0).length
  const activeBefore = per.filter((p) => p.prev.activeDays > 0).length

  return {
    period: { days: P.days, from: P.from, to: P.to, prev: P.prev },
    students: students.length, withLogin: byEmail.size,
    headline: { key: 'group', params: { days: P.days, active: activeNow, of: students.length, count: students.length, mastered: mastered.reduce((a, m) => a + m.students.length, 0), checkIns: checkIns.length, hard: hardSkills.length } },
    measures: {
      active: { cur: activeNow, prev: activeBefore, of: students.length },
      answered: { cur: sum('answered', 'cur'), prev: sum('answered', 'prev') },
      firstTry: groupShare,
      mastered: mastered.reduce((a, m) => a + m.students.length, 0),
    },
    checkIns, hardSkills, mixups,
    wins: { mastered: mastered.slice(0, 5), steady, improving },
    rules: RULES,
  }
}

async function forGroup(students, { days = 7, tz = 'UTC', now = new Date() } = {}) {
  const P = periodFor(days, tz)
  const emails = [...new Set(students.map((s) => lower(s.email)).filter(Boolean))]
  if (!emails.length) return buildGroup({ period: P, students, now, tz })
  const SkillMastery = store.SkillMastery
  const [dayRows, skills, decisions] = await Promise.all([
    LearnerDay.find({ email: { $in: emails }, date: { $gte: P.prev.from, $lte: P.to } }).select('email date answered correct firstTry hints minutes').lean(),
    SkillMastery.find({ email: { $in: emails }, attempts: { $gt: 0 } })
      .select('email skill subject name mastery attempts correct box due masteredAt lastAt misconceptions supportStep missesSinceSuccess rightItems legacyEvidence topStage stageAvail').lean(),
    LearningDecision.find({ email: { $in: emails }, type: { $in: ['level_up', 'level_set'] }, at: { $gte: new Date(`${P.from}T00:00:00Z`) } }).select('email at subject from to').lean(),
  ])
  // Notes for the mix-ups that can be shown (one query per bank).
  const refs = []
  for (const r of skills) for (const m of r.misconceptions || []) if (!m.resolvedAt && (m.count || 0) >= RULES.mixupRepeat && m.q && m.module) refs.push({ subject: r.subject, module: m.module, q: m.q })
  const notes = refs.length ? await store.questionNotes(refs.slice(0, 40)) : new Map()
  return buildGroup({ period: P, students, days: dayRows, skills, decisions, notes, catalog: loadCatalog(), now, tz })
}

module.exports = { RULES, periodFor, tally, compareShare, stateOf, buildLearner, forLearner, buildGroup, forGroup, mondayOf }
