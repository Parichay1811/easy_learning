// The learner's journey views, built only from stored history (never invented). Pure.
//
//   welcomeFor   GET /api/learn/welcome   one calm welcome-back message + actions
//   nextFor      GET /api/learn/next      "What next?", ranked, each with a reason a child understands
//   journeyFor   GET /api/learn/journey   stages per subject for the journey map
//   pickDiscovery GET /api/learn/discovery today's everyday question (deterministic per learner + date)
//
// Texts: English here, keys learn.welcome.* / learn.next.* (the client translates with
// t(key, { defaultValue: text, ...params }); skill names with t("skills.<id>", skillName)).
// Never: missed days framed as a fault, guilt, streak talk, false urgency, invented wins.
const cfg = require('../../config/learning')
const { render } = require('./feedback')
const { isReviewDue } = require('./spacing')
const { isParked } = require('./support')
const { isMastered } = require('./mastery')
const { normalise } = require('./levelPolicy')
const { latestActive, keyOf } = require('./roundState')
const { hashSeed } = require('./rng')
const { SUBJECT_NAMES, STRATEGY_NAMES } = require('./decisions')

const DAY = 86400000
const MODULE_NAMES = { listen: 'Listening', read: 'Reading', write: 'Writing', speak: 'Speaking' }
const firstName = (name) => String(name || '').trim().split(/\s+/)[0]?.slice(0, 40) || ''

// learn.welcome.<kind>.<variant>: a / b rotate by date; calm = shorter and quieter; anon = no name known.
const WELCOME = {
  first: {
    a: "Hi {{name}}. Let's find out what you already know, one small step at a time.",
    b: "Hello {{name}}. We'll start with a few questions to see where you are. There's no rush.",
    calm: 'Hi {{name}}. Ready when you are.',
    anon: "Hi. Let's find out what you already know, one small step at a time.",
  },
  unfinished: {
    a: 'Welcome back, {{name}}. Your {{subjectName}} round is saved, just where you stopped.',
    b: 'Hi {{name}}. You were part of the way through a {{subjectName}} round. You can carry on from there.',
    calm: 'Hi {{name}}. Your round is saved.',
    anon: 'Welcome back. Your {{subjectName}} round is saved, just where you stopped.',
  },
  success: {
    a: 'Welcome back, {{name}}. Last time {{skillName}} came together. Ready for the next step?',
    b: 'Hi {{name}}. {{skillName}} is looking solid after your practice. Shall we build on it?',
    calm: 'Hi {{name}}. {{skillName}} is going well.',
    anon: 'Welcome back. {{skillName}} is looking solid after your practice.',
  },
  struggle: {
    a: "Welcome back, {{name}}. {{skillName}} was tricky last time. That's part of learning. Let's try it a new way.",
    b: "Hi {{name}}. We'll look at {{skillName}} again, a different way this time.",
    calm: "Hi {{name}}. We'll take {{skillName}} slowly.",
    anon: "Welcome back. We'll look at {{skillName}} again, a different way this time.",
  },
  break: {
    a: "Good to see you, {{name}}. Let's warm up with something you already know.",
    b: "Hi {{name}}. We'll start gently, with something familiar.",
    calm: "Hi {{name}}. We'll start gently.",
    anon: "Good to see you. Let's warm up with something you already know.",
  },
  returning: {
    a: 'Welcome back, {{name}}. Pick up wherever you like.',
    b: 'Hi {{name}}. What would you like to do today?',
    calm: 'Hi {{name}}.',
    anon: 'Welcome back. Pick up wherever you like.',
  },
}
const ACTION_TEXT = { continue: 'Continue', review: 'Review', new: 'Something new', start: 'Start' }

// learn.discovery.<key>: the line that goes with today's discovery.
const DISCOVERY = {
  intro: "Today's discovery: one everyday question, just for curiosity.",
  done: "You've done today's discovery. A new one comes tomorrow.",
  none: 'There is no discovery question for you yet.',
}
const discoveryMessage = (state) => ({ key: `learn.discovery.${state}`, params: {}, text: DISCOVERY[state] })

// learn.next.<kind>.title / .why (and a few variants)
const NEXT = {
  continue: { title: 'Carry on with your {{subjectName}} round', why: 'You stopped after {{answered}} of {{total}} questions. It is saved for you.' },
  review: { title: 'Review {{skillName}}', why: 'Bringing it back now helps you remember it for longer.' },
  support_prereq: { title: 'Warm up with {{skillName}}', why: 'It helps with {{forName}}, which has been tricky.' },
  support_self: { title: 'Practise {{skillName}} a new way', why: "This time we'll use {{strategyName}}." },
  next: { title: 'Try something new: {{skillName}}', why: 'It builds on {{fromName}}, which you know well now.' },
  challenge: { title: 'Mini challenge: {{skillName}}', why: 'You know {{skillName}} well. Here are 3 trickier questions, just to see.' },
  discovery: { title: "Today's discovery", why: 'One everyday question, just for curiosity.' },
  explore_subject: { title: 'Explore {{subjectName}}', why: "You haven't tried {{subjectName}} yet. Have a look around." },
  explore_module: { title: '{{subjectName}}: {{moduleName}}', why: "You haven't tried {{moduleName}} in {{subjectName}} yet." },
}

const msg = (prefix, table, key, params) => ({ key: `${prefix}.${key}`, params, text: render(table[key], params) })
const skillParams = (id, catalog, fallback) => ({ skill: id, skillName: catalog?.name(id, fallback) || fallback || id })
const subjParams = (subject, module) => ({
  subject, subjectName: SUBJECT_NAMES[subject] || subject,
  ...(module ? { module, moduleName: MODULE_NAMES[module] || module } : {}),
})
const moduleHref = (module, subject, q = '') => `/module/${module}/${subject}${q ? `?${q}` : ''}`

// The module a skill has the most items in (else its last module, else the catalogue's first mode).
function moduleOfSkill(id, index, row, catalog) {
  const mods = index?.skills?.get(id)?.modules
  if (mods && Object.keys(mods).length) return Object.entries(mods).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0][0]
  return row?.modules?.[row.modules.length - 1] || catalog?.get(id)?.modes?.[0] || 'read'
}
const subjectOfSkill = (id, index, row) => index?.skills?.get(id)?.subject || row?.subject || id.split('.')[0]

const skipSet = (profile) => new Set((profile.overrides || []).filter((o) => o.type === 'skip_skill').map((o) => o.skill))
const byLastAt = (a, b) => new Date(b.lastAt || 0) - new Date(a.lastAt || 0)

// A skill to start next: the next concept after one mastered (with content at most one level above the
// learner's level in that subject, not started), else null.
function nextConcept(rows, catalog, index, skip, profile = {}) {
  const tried = new Set(rows.filter((r) => (r.attempts || 0) > 0).map((r) => r.skill))
  const reachable = (id) => {
    const s = index?.skills?.get(id)
    if (!s) return false
    return !s.levels?.length || s.levels[0] <= normalise(profile.levels?.[s.subject]).level + 1
  }
  const strong = rows.filter((r) => isMastered(r) || (r.mastery || 0) >= cfg.masteredAt).sort((a, b) => new Date(b.masteredAt || b.lastAt || 0) - new Date(a.masteredAt || a.lastAt || 0))
  for (const r of strong) {
    for (const id of catalog?.nextSkills(r.skill) || []) {
      if (!tried.has(id) && !skip.has(id) && reachable(id)) return { id, from: r }
    }
  }
  return null
}

// Something never tried with content: a subject, else a module of a subject already tried.
function explore(rows, index, last) {
  if (!index?.skills) return null
  const triedSubjects = new Set(rows.filter((r) => (r.attempts || 0) > 0).map((r) => r.subject))
  const has = (subject, module) => [...index.skills.values()].some((s) => s.subject === subject && (!module || s.modules[module]))
  for (const subject of cfg.SUBJECTS) if (!triedSubjects.has(subject) && has(subject)) return { subject }
  const triedMods = new Set(rows.flatMap((r) => (r.modules || []).map((m) => `${r.subject}|${m}`)))
  const subjects = last?.subject ? [last.subject, ...cfg.SUBJECTS.filter((s) => s !== last.subject)] : cfg.SUBJECTS
  for (const subject of subjects) for (const module of cfg.MODULES) if (!triedMods.has(`${subject}|${module}`) && has(subject, module)) return { subject, module }
  return null
}

// A strong skill with questions one stage up (in some module), for a mini challenge.
function challengeTarget(rows, index, skip, now) {
  const strong = rows.filter((r) => !skip.has(r.skill) && !isParked(r, now) && (r.attempts || 0) > 0
    && ((r.mastery || 0) >= cfg.challenge.minMastery || isMastered(r) || r.probe?.state === 'confident'))
  strong.sort((a, b) => (b.mastery || 0) - (a.mastery || 0) || byLastAt(a, b))
  for (const r of strong) {
    const up = (Number.isInteger(r.topStage) ? r.topStage : 1) + 1
    const mods = index?.skills?.get(r.skill)?.moduleMax || {}
    const module = Object.entries(mods).filter(([, max]) => Number.isInteger(max) && max >= up).sort((a, b) => b[1] - a[1])[0]?.[0]
    if (module) return { row: r, module, stage: up }
  }
  return null
}

/**
 * GET /api/learn/welcome
 * in: { name, profile, skills (rows), catalog, index, now, calm }
 * -> { kind, message: { key, params, text }, actions: [{ type, key, text, href, subject, module, skill? }], calm }
 */
function welcomeFor({ name = '', profile = {}, skills = [], catalog = null, index = null, now = new Date(), calm = false }) {
  const first = firstName(name)
  const skip = skipSet(profile)
  const rows = skills.filter((r) => (r.attempts || 0) > 0 && !skip.has(r.skill))
  const lastSeen = profile.lastActiveAt ? new Date(profile.lastActiveAt) : null
  const active = latestActive(profile.rounds, now)
  const recentCut = now.getTime() - cfg.welcome.recentDays * DAY
  const due = rows.filter((r) => isReviewDue(r, now) && !isParked(r, now)).sort((a, b) => new Date(a.due) - new Date(b.due))[0] || null

  let kind = 'returning'
  let params = {}
  let focus = null
  if (!lastSeen && !rows.length) kind = 'first'
  else if (active) {
    const [subject, module] = active.key.split('|')
    kind = 'unfinished'
    params = subjParams(subject, module)
  } else if (lastSeen && now.getTime() - lastSeen.getTime() >= cfg.welcome.breakDays * DAY) {
    kind = 'break'
    params = { days: Math.floor((now.getTime() - lastSeen.getTime()) / DAY) }
  } else {
    const lastSkill = [...rows].sort(byLastAt)[0] || null
    const recentLast = lastSkill && new Date(lastSkill.lastAt || 0).getTime() >= recentCut
    const struggling = recentLast && (lastSkill.missesSinceSuccess || 0) >= cfg.welcome.struggleMisses
    const won = rows.filter((r) => r.masteredAt && new Date(r.masteredAt).getTime() >= recentCut && isMastered(r))
      .sort((a, b) => new Date(b.masteredAt) - new Date(a.masteredAt))[0] || null
    if (struggling) { kind = 'struggle'; focus = lastSkill } else if (won) { kind = 'success'; focus = won }
    if (focus) params = { ...skillParams(focus.skill, catalog, focus.name), ...subjParams(focus.subject) }
  }

  const variant = !first ? 'anon' : calm ? 'calm' : (['a', 'b'][Math.floor(now.getTime() / DAY) % 2])
  const message = { key: `learn.welcome.${kind}.${variant}`, params: { ...(first ? { name: first } : {}), ...params }, text: render(WELCOME[kind][variant], { name: first, ...params }) }

  // Actions (each real: a saved round, a due review, a skill they practised, content they can open).
  const actions = []
  // source: what the client sends as ?source= on the round it opens (counts as an activity chosen).
  const act = (type, a) => actions.push({ type, key: `learn.welcome.action.${type}`, text: ACTION_TEXT[type], ...a, source: 'welcome' })
  const reviewAction = (r) => act('review', { href: moduleHref(moduleOfSkill(r.skill, index, r, catalog), r.subject, `skill=${encodeURIComponent(r.skill)}`), subject: r.subject, module: moduleOfSkill(r.skill, index, r, catalog), skill: r.skill })
  const newAction = () => {
    const nc = nextConcept(rows, catalog, index, skip, profile)
    if (nc) {
      const subject = subjectOfSkill(nc.id, index)
      const module = moduleOfSkill(nc.id, index, null, catalog)
      return act('new', { href: moduleHref(module, subject, `skill=${encodeURIComponent(nc.id)}`), subject, module, skill: nc.id })
    }
    const ex = explore(rows, index, profile.last)
    if (ex) {
      const module = ex.module || 'listen'
      return act('new', { href: ex.module ? moduleHref(ex.module, ex.subject) : `/subject/${ex.subject}`, subject: ex.subject, module })
    }
    return null
  }
  const continueLast = () => {
    if (!profile.last?.subject) return
    act('continue', { href: moduleHref(profile.last.module || 'read', profile.last.subject), subject: profile.last.subject, module: profile.last.module || 'read' })
  }

  if (kind === 'first') {
    // The first subject and module this learner has questions in (a school learner may have only some).
    const all = [...(index?.skills?.values() || [])]
    const first = cfg.SUBJECTS.flatMap((subject) => cfg.MODULES.map((module) => ({ subject, module })))
      .find(({ subject, module }) => all.some((x) => x.subject === subject && x.modules[module])) || { subject: 'english', module: 'listen' }
    act('start', { href: moduleHref(first.module, first.subject), subject: first.subject, module: first.module })
  } else if (kind === 'unfinished') {
    const [subject, module] = active.key.split('|')
    act('continue', { href: moduleHref(module, subject, 'resume=1'), subject, module })
    if (due) reviewAction(due)
    newAction()
  } else if (kind === 'struggle') {
    reviewAction(focus)
    newAction()
  } else if (kind === 'success') {
    newAction()
    if (due) reviewAction(due)
    continueLast()
  } else if (kind === 'break') {
    // Warm up with something they know well (their strongest skill), never a test.
    const known = [...rows].sort((a, b) => (b.mastery || 0) - (a.mastery || 0) || byLastAt(a, b))[0]
    if (known) reviewAction(known)
    newAction()
  } else {
    continueLast()
    if (due) reviewAction(due)
    newAction()
  }
  return { kind, message, actions: actions.slice(0, 3), calm: !!calm }
}

/**
 * GET /api/learn/next
 * in: { profile, skills, catalog, index, now, discovery: { available, answered } }
 * -> { items: [{ kind, title, why, action: { href, subject, module, skill?, mode? } }] } (at most next.max)
 */
function nextFor({ profile = {}, skills = [], catalog = null, index = null, now = new Date(), discovery = null }) {
  const skip = skipSet(profile)
  const rows = skills.filter((r) => (r.attempts || 0) > 0 && !skip.has(r.skill))
  const items = []
  // learn.next.<key>.title / .why
  const table = {}
  for (const [k, v] of Object.entries(NEXT)) { table[`${k}.title`] = v.title; table[`${k}.why`] = v.why }
  const push = (kind, k, params, action) => items.push({ kind, title: msg('learn.next', table, `${k}.title`, params), why: msg('learn.next', table, `${k}.why`, params), action: { ...action, source: 'next' } })

  // 1. Unfinished round
  const active = latestActive(profile.rounds, now)
  if (active) {
    const [subject, module] = active.key.split('|')
    push('continue', 'continue', { ...subjParams(subject, module), answered: (active.answered || []).length, total: active.items.length }, { href: moduleHref(module, subject, 'resume=1'), subject, module })
  }
  // 2. Reviews due (most overdue first)
  const due = rows.filter((r) => isReviewDue(r, now) && !isParked(r, now)).sort((a, b) => new Date(a.due) - new Date(b.due))
  if (due.length) {
    const r = due[0]
    const module = moduleOfSkill(r.skill, index, r, catalog)
    push('review', 'review', { ...skillParams(r.skill, catalog, r.name), ...subjParams(r.subject), count: due.length }, { href: moduleHref(module, r.subject, `skill=${encodeURIComponent(r.skill)}`), subject: r.subject, module, skill: r.skill })
  }
  // 3. A prerequisite needing support (or the skill itself, a new way)
  const needy = rows.filter((r) => !isParked(r, now) && ((r.supportStep | 0) >= 3 || ((r.attempts || 0) >= cfg.needsPracticeMinAttempts && (r.mastery || 0) < cfg.needsPracticeBelow)))
    .sort((a, b) => (a.mastery || 0) - (b.mastery || 0) || byLastAt(a, b))
  if (needy.length) {
    const r = needy[0]
    const done = new Set(rows.filter(isMastered).map((x) => x.skill))
    const pre = (catalog?.prerequisites(r.skill) || []).find((p) => !done.has(p) && !skip.has(p) && index?.skills?.has(p))
    if (pre) {
      const subject = subjectOfSkill(pre, index)
      const module = moduleOfSkill(pre, index, null, catalog)
      push('support', 'support_prereq', { ...skillParams(pre, catalog), forSkill: r.skill, forName: catalog?.name(r.skill, r.name) || r.name || r.skill, ...subjParams(subject) }, { href: moduleHref(module, subject, `skill=${encodeURIComponent(pre)}`), subject, module, skill: pre })
    } else {
      const module = moduleOfSkill(r.skill, index, r, catalog)
      const strategy = cfg.strategies[Math.min(2, Math.max(1, r.supportStep | 0))]
      push('support', 'support_self', { ...skillParams(r.skill, catalog, r.name), ...subjParams(r.subject), strategy, strategyName: STRATEGY_NAMES[strategy] }, { href: moduleHref(module, r.subject, `skill=${encodeURIComponent(r.skill)}`), subject: r.subject, module, skill: r.skill })
    }
  }
  // 4. The next concept
  const nc = nextConcept(rows, catalog, index, skip, profile)
  if (nc) {
    const subject = subjectOfSkill(nc.id, index)
    const module = moduleOfSkill(nc.id, index, null, catalog)
    push('next', 'next', { ...skillParams(nc.id, catalog), from: nc.from.skill, fromName: catalog?.name(nc.from.skill, nc.from.name) || nc.from.name || nc.from.skill, ...subjParams(subject) }, { href: moduleHref(module, subject, `skill=${encodeURIComponent(nc.id)}`), subject, module, skill: nc.id })
  }
  // 5. A mini challenge (3 items one stage up, on a strong skill)
  const ch = challengeTarget(rows, index, skip, now)
  if (ch) {
    const r = ch.row
    push('challenge', 'challenge', { ...skillParams(r.skill, catalog, r.name), ...subjParams(r.subject), stage: ch.stage }, { href: moduleHref(ch.module, r.subject, `challenge=1&skill=${encodeURIComponent(r.skill)}`), subject: r.subject, module: ch.module, skill: r.skill, mode: 'challenge' })
  }
  // 6. Today's discovery (when there is one and it is not answered yet today)
  if (discovery?.available && !discovery.answered) push('discovery', 'discovery', {}, { href: '/discovery', subject: discovery.subject || null, module: discovery.module || null, mode: 'discovery' })
  // 7. Something new to explore
  const ex = explore(rows, index, profile.last)
  if (ex) {
    if (ex.module) push('explore', 'explore_module', subjParams(ex.subject, ex.module), { href: moduleHref(ex.module, ex.subject), subject: ex.subject, module: ex.module })
    else push('explore', 'explore_subject', subjParams(ex.subject), { href: `/subject/${ex.subject}`, subject: ex.subject, module: null })
  }
  return { items: items.slice(0, cfg.next.max) }
}

/**
 * GET /api/learn/journey
 * -> { [subject]: { level, ceiling, stages: [{ stage, name, skills, practiceOnly, attempted, mastered }], reached } }
 *   skills: skills with graded questions at that stage (that this learner can see); practiceOnly: skills with
 *   only practice (ungraded) questions there, e.g. stage 5 today; attempted / mastered:
 *   of those, how many the learner answered at that stage / has mastered; reached: the highest stage
 *   answered right first try without a hint (null before any).
 */
function journeyFor({ profile = {}, skills = [], index = null, ceilings = {} }) {
  const out = {}
  for (const subject of cfg.SUBJECTS) {
    const rows = skills.filter((r) => r.subject === subject)
    const inSubject = [...(index?.skills?.values() || [])].filter((s) => s.subject === subject)
    const stages = cfg.STAGES.map((name, stage) => {
      // skills: with graded questions at this stage; practiceOnly: with only practice (ungraded) ones there
      // (e.g. stage 5 transfer today: "nothing graded yet").
      const withStage = new Set(inSubject.filter((s) => s.stages.includes(stage)).map((s) => s.skill))
      const practiceOnly = inSubject.filter((s) => !s.stages.includes(stage) && (s.practiceStages || []).includes(stage)).length
      const at = rows.filter((r) => (r.byStage || []).some((b) => b.s === stage && b.n > 0))
      return {
        stage, name, skills: withStage.size, practiceOnly,
        attempted: at.length,
        mastered: at.filter((r) => isMastered(r) && (r.byStage || []).some((b) => b.s === stage && b.c > 0)).length,
      }
    })
    const reached = rows.flatMap((r) => (r.byStage || []).filter((b) => b.i > 0).map((b) => b.s)).reduce((m, s) => (m == null || s > m ? s : m), null)
    out[subject] = { level: normalise(profile.levels?.[subject]).level, ceiling: ceilings[subject] ?? null, stages, reached }
  }
  return out
}

/**
 * Today's discovery: one everyday item, the same all day for this learner, not one answered in the
 * `discovery.avoidDays` days before today; microphone items only when there is nothing else.
 *   everyday: [{ id, interaction, ... }] sorted by id; avoid: Set of ids answered lately (before today)
 * -> the item or null
 */
function pickDiscovery(everyday, { email, date, avoid = new Set() }) {
  if (!everyday?.length) return null
  const fresh = everyday.filter((q) => !avoid.has(q.id))
  const pool = fresh.length ? fresh : everyday
  const quiet = pool.filter((q) => q.interaction !== 'mic_record')
  const list = quiet.length ? quiet : pool
  return list[hashSeed(`${String(email).toLowerCase()}|${date}`) % list.length]
}

module.exports = { WELCOME, NEXT, ACTION_TEXT, DISCOVERY, MODULE_NAMES, welcomeFor, nextFor, journeyFor, pickDiscovery, discoveryMessage, moduleOfSkill, keyOf }
