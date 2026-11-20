// What the APIs return, built from the stored profile and skill rows. Pure.
const cfg = require('../../config/learning')
const { evaluateLevel, normalise } = require('./levelPolicy')
const { skillState } = require('./mastery')
const { isReviewDue } = require('./spacing')

const firstName = (name) => String(name || '').trim().split(/\s+/)[0]?.slice(0, 40) || ''
const hold = (profile, subject) => (profile.overrides || []).some((o) => o.type === 'hold_level' && (!o.subject || o.subject === subject))

function levelsView(profile, ceilings = {}, now = new Date()) {
  const out = {}
  for (const s of cfg.SUBJECTS) {
    const ls = normalise(profile.levels?.[s])
    const ev = evaluateLevel(ls, { ceiling: ceilings[s] ?? null, hold: hold(profile, s), now })
    out[s] = {
      level: ls.level, source: ls.source, locked: ls.locked, lockedBy: ls.locked ? ls.lockedBy : null,
      setAt: ls.setAt || null, setBy: ls.setBy?.role ? { role: ls.setBy.role, name: ls.setBy.name || '' } : null,
      status: ev.status, accuracy: ev.accuracy, attempts: ls.attempts, ceiling: ceilings[s] ?? null, held: hold(profile, s),
    }
  }
  return out
}

const nameOf = (s, catalog) => catalog?.name(s.skill, s.name) || s.name || s.skill

function skillView(s, catalog, now) {
  return {
    id: s.skill, name: nameOf(s, catalog), subject: s.subject, level: s.level ?? null,
    mastery: Math.round((s.mastery || 0) * 100) / 100, state: skillState(s, now), due: s.due || null,
    supportStep: s.supportStep | 0, strategy: cfg.strategies[s.supportStep | 0], attempts: s.attempts || 0,
  }
}

function needsPractice(skills, catalog) {
  return skills
    .filter((s) => (s.attempts || 0) >= cfg.needsPracticeMinAttempts && (s.mastery || 0) < cfg.needsPracticeBelow)
    .sort((a, b) => (a.mastery || 0) - (b.mastery || 0))
    .slice(0, 8)
    .map((s) => ({ skill: s.skill, name: nameOf(s, catalog), subject: s.subject, ...(s.misconceptions?.[0] ? { misconception: s.misconceptions[0].text } : {}) }))
}

function wins(skills, catalog, limit = 5) {
  return skills.filter((s) => s.masteredAt).sort((a, b) => new Date(b.masteredAt) - new Date(a.masteredAt)).slice(0, limit)
    .map((s) => ({ skill: s.skill, name: nameOf(s, catalog), subject: s.subject, at: s.masteredAt }))
}

// notes: Map "<subject>|<module>|<question id>" -> { parentNote, teacherAction } from the question's
// own `analysis` (plain language written with the content). The misconception text is technical
// (for teachers); parents get the question's parent note.
const noteKey = (subject, module, q) => `${subject}|${module}|${q}`

function difficulties(skills, catalog, notes = new Map()) {
  const out = []
  for (const s of skills) {
    for (const m of s.misconceptions || []) {
      const n = m.q && m.module ? notes.get(noteKey(s.subject, m.module, m.q)) : null
      out.push({
        skill: s.skill, name: nameOf(s, catalog), subject: s.subject, misconception: m.text, count: m.count, at: m.at || null,
        parentNote: n?.parentNote || null, teacherAction: n?.teacherAction || null,
      })
    }
  }
  return out.sort((a, b) => b.count - a.count || new Date(b.at || 0) - new Date(a.at || 0)).slice(0, 10)
}

function historyView(profile) {
  return (profile.history || []).map((h) => ({ week: h.week, attempts: h.attempts, accuracy: h.attempts ? Math.round((h.credit / h.attempts) * 100) / 100 : null }))
}

const moduleFor = (s, catalog) => s.modules?.[s.modules.length - 1] || catalog?.get(s.skill)?.modes?.[0] || 'read'

// What to do next: a due review, else the weakest skill, else carry on, else start.
function nextStep(profile, skills, catalog, now = new Date()) {
  const skip = new Set((profile.overrides || []).filter((o) => o.type === 'skip_skill').map((o) => o.skill))
  const live = skills.filter((s) => !skip.has(s.skill))
  const due = live.filter((s) => isReviewDue(s, now)).sort((a, b) => new Date(a.due) - new Date(b.due))[0]
  if (due) return { subject: due.subject, module: moduleFor(due, catalog), reason: 'review', skill: { id: due.skill, name: nameOf(due, catalog) } }
  const weak = live.filter((s) => s.attempts > 0 && (s.mastery || 0) < cfg.thresholds.practice && !(s.parkedUntil && new Date(s.parkedUntil) > now))
    .sort((a, b) => (a.mastery || 0) - (b.mastery || 0))[0]
  if (weak) return { subject: weak.subject, module: moduleFor(weak, catalog), reason: 'practice', skill: { id: weak.skill, name: nameOf(weak, catalog) } }
  if (profile.last?.subject) return { subject: profile.last.subject, module: profile.last.module || 'read', reason: 'continue' }
  return { subject: 'english', module: 'listen', reason: 'new' }
}

// The full learner profile (GET /api/learn/profile and the guardian/teacher view).
function profileView(profile, skills, { catalog, ceilings = {}, now = new Date() } = {}) {
  const prefs = profile.explanationPrefs || {}
  return {
    profile: {
      levels: levelsView(profile, ceilings, now),
      ageBand: profile.ageBand ?? null,
      pace: profile.pace || 'steady',
      supports: profile.supports || {},
      goals: (profile.goals || []).map((g) => ({ id: g.id, text: g.text, subject: g.subject ?? null, target: g.target ?? null, done: !!g.done, by: g.by || 'learner' })),
      explanationPrefs: { words: prefs.words || 0, visual: prefs.visual || 0, guided: prefs.guided || 0, simpler: prefs.simpler || 0 },
      suggestions: (profile.suggestions || []).map((x) => ({ id: x.id, type: x.type, subject: x.subject ?? null, skill: x.skill ?? null, level: x.level ?? null, to: x.to ?? null, key: x.key, params: x.params || {}, text: x.text, createdAt: x.createdAt })),
      baselineDone: Object.fromEntries(cfg.SUBJECTS.map((s) => [s, !!profile.baselineDone?.[s]])),
      overrides: (profile.overrides || []).map((o) => ({ type: o.type, subject: o.subject ?? null, skill: o.skill ?? null, by: o.by })),
    },
    skills: skills.map((s) => skillView(s, catalog, now)).sort((a, b) => a.subject.localeCompare(b.subject) || (a.level ?? 0) - (b.level ?? 0) || a.name.localeCompare(b.name)),
    next: nextStep(profile, skills, catalog, now),
    wins: wins(skills, catalog),
    needsPractice: needsPractice(skills, catalog),
  }
}

// What the AI Teacher may know: skill ids/names, levels, strategy. No free text
// the learner wrote (goals, answers), no email, no misconception texts.
function companionView(profile, skills, { catalog, name = '', now = new Date() } = {}) {
  const prefs = profile.explanationPrefs || {}
  const ranked = ['words', 'visual', 'guided'].map((k) => [k, prefs[k] || 0]).sort((a, b) => b[1] - a[1])
  const focus = skills
    .filter((s) => s.attempts > 0 && (s.mastery || 0) < cfg.masteredAt && !(s.parkedUntil && new Date(s.parkedUntil) > now))
    .sort((a, b) => (a.mastery || 0) - (b.mastery || 0))
    .slice(0, 3)
    .map((s) => ({ skill: s.skill, name: nameOf(s, catalog), subject: s.subject, strategy: cfg.strategies[s.supportStep | 0] }))
  return {
    name: firstName(name),
    levels: Object.fromEntries(cfg.SUBJECTS.map((s) => [s, normalise(profile.levels?.[s]).level])),
    focus,
    wins: wins(skills, catalog, 3).map(({ skill, name: n, subject }) => ({ skill, name: n, subject })),
    prefers: ranked[0][1] > 0 ? ranked[0][0] : 'words',
    lastSeen: profile.lastActiveAt || null,
  }
}

module.exports = { profileView, companionView, levelsView, skillView, needsPractice, wins, difficulties, historyView, nextStep, firstName, noteKey }
