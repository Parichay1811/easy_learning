// Team matches and class quests inside a group (G-501, G-511, G-512).
//
//   create(ctx, batch, students, body)   the teacher starts one; teams are balanced here
//   board(match)                         live: each team's stars towards its goal
//   end(match, by)                       the ceremony: trophies, the first-flag ribbon, one true award each
//   forTeacher(match, students)          the board plus who has joined in (name order, never ranked)
//   forLearner(email)                    my teams: my team's bar, what I added, my award
//
// Everybody wins (docs/learning/GAME-ROADMAP.md Phase 5):
//   - a star is one right answer at the learner's own level, at most `starsPerDayCap` a day;
//   - each team's goal is in proportion to its size, and every team that reaches it wins;
//   - no list of children from first to last is ever built, stored or returned.
const TeamMatch = require('../../models/social/TeamMatch')
const cfg = require('../../config/social')
const learn = require('../../config/learning')
const { createRng } = require('../learning/rng')
const { firstNameInitial } = require('../../utils/minimise')
const { SocialError, lower } = require('./guard')
const { starsBy, reachedAt, detail } = require('./stars')
const { cheerDays } = require('./cheers')
const { cardsFor, publicView } = require('./cards')
const awards = require('./awards')

const DAY = 86400000
const int = (v, min, max) => { const n = Number(v); return Number.isInteger(n) && n >= min && n <= max ? n : null }

// Teams of nearly equal size and strength: learners are ordered by how much they have been
// learning lately (ties shuffled), then dealt out in a snake (1 2 3 3 2 1 ...).
function balance(members, recent, teamCount, seed) {
  const rng = createRng(seed)
  const order = rng.shuffle(members).sort((x, y) => (recent.get(y) || 0) - (recent.get(x) || 0))
  const teams = Array.from({ length: teamCount }, () => [])
  order.forEach((email, i) => {
    const round = Math.floor(i / teamCount)
    const pos = i % teamCount
    teams[round % 2 === 0 ? pos : teamCount - 1 - pos].push(email)
  })
  return teams
}

function clean(body = {}, memberCount) {
  const title = String(body.title || '').trim().slice(0, 60)
  if (title.length < 2) throw new SocialError(400, 'Give it a name (2 to 60 characters)')
  const kind = body.kind === 'teams' ? 'teams' : 'quest'
  const days = int(body.days ?? 5, cfg.team.minDays, cfg.team.maxDays)
  if (days == null) throw new SocialError(400, `It can run for ${cfg.team.minDays} to ${cfg.team.maxDays} days`)
  let teamCount = 1
  if (kind === 'teams') {
    teamCount = int(body.teams ?? 2, 2, cfg.team.maxTeams)
    if (teamCount == null) throw new SocialError(400, `A team match has 2 to ${cfg.team.maxTeams} teams`)
    if (memberCount < teamCount * 2) throw new SocialError(409, `A team match with ${teamCount} teams needs at least ${teamCount * 2} learners who can sign in.`, 'TOO_FEW')
  } else if (memberCount < 1) throw new SocialError(409, 'This group has no learners who can sign in yet.', 'TOO_FEW')
  const subject = body.subject ? String(body.subject).toLowerCase() : ''
  if (subject && !learn.SUBJECTS.includes(subject)) throw new SocialError(400, `subject must be one of ${learn.SUBJECTS.join(', ')}`)
  const perDay = int(body.starsPerLearnerPerDay ?? cfg.team.defaultStarsPerLearnerPerDay, 1, cfg.team.starsPerDayCap)
  if (perDay == null) throw new SocialError(400, `The goal is 1 to ${cfg.team.starsPerDayCap} stars a learner a day`)
  return { title, kind, days, teamCount, subject, perDay }
}

// students: [{ email, name }] of the group (only learners with an email can take part).
async function create(ctx, batch, students, body, now = new Date()) {
  const members = [...new Set(students.map((s) => lower(s.email)).filter(Boolean))]
  const c = clean(body, members.length)
  const running = await TeamMatch.countDocuments({ batchId: batch._id, status: 'active' })
  if (running >= cfg.team.maxActivePerGroup) throw new SocialError(409, `A group can have ${cfg.team.maxActivePerGroup} running at once. End one first.`, 'TOO_MANY')
  const since = new Date(now.getTime() - cfg.team.balanceWindowDays * DAY)
  const recentRows = await starsBy(members, since, now, {})
  const recent = new Map([...recentRows].map(([e, r]) => [e, r.raw]))
  const split = balance(members, recent, c.teamCount, `${batch._id}|${now.getTime()}`)
  const teams = split.map((list, i) => ({
    ...cfg.TEAMS[i], members: list,
    goal: Math.max(1, list.length * c.days * c.perDay),
  }))
  return TeamMatch.create({
    orgId: ctx.orgId, batchId: batch._id, createdByTutorId: ctx.tutorId, title: c.title, kind: c.kind, subject: c.subject,
    startsAt: now, endsAt: new Date(now.getTime() + c.days * DAY), starsPerDayCap: cfg.team.starsPerDayCap,
    teams, emails: members,
  })
}

// Each team's stars right now: right answers (capped a day) plus one team-spirit star for
// each day a member cheered a team-mate.
async function count(match, until = new Date()) {
  const to = new Date(Math.min(until.getTime(), match.endsAt.getTime(), (match.endedAt || match.endsAt).getTime()))
  const opts = { capPerDay: match.starsPerDayCap, subject: match.subject }
  const per = await starsBy(match.emails, match.startsAt, to, opts)
  const teams = []
  for (const t of match.teams) {
    const spirit = t.members.length > 1 ? await cheerDays(t.members, match.startsAt, to) : new Map()
    let stars = 0
    for (const e of t.members) stars += (per.get(e)?.stars || 0) + (spirit.get(e)?.days || 0)
    teams.push({ key: t.key, stars, spirit })
  }
  return { per, teams, to }
}

const teamView = (t, stars) => ({
  key: t.key, emoji: t.emoji, color: t.color, size: t.members.length, goal: t.goal,
  stars, progress: Math.min(1, t.goal ? stars / t.goal : 0), reached: stars >= t.goal, firstFlag: Boolean(t.firstFlag),
})

const head = (m) => ({
  id: String(m._id), title: m.title, kind: m.kind, subject: m.subject || null, startsAt: m.startsAt, endsAt: m.endsAt,
  status: m.status, endedAt: m.endedAt, daysLeft: m.status === 'active' ? Math.max(0, Math.ceil((m.endsAt - Date.now()) / DAY)) : 0,
})

// A match whose time is up is closed the first time anyone looks at it.
async function settleIfDue(match, now = new Date()) {
  if (match.status === 'active' && match.endsAt <= now) return end(match, 'time', now)
  return match
}

async function board(match) {
  if (match.status === 'ended') return { ...head(match), teams: match.teams.map((t) => teamView(t, t.stars || 0)) }
  const c = await count(match)
  return { ...head(match), teams: match.teams.map((t, i) => teamView(t, c.teams[i].stars)) }
}

// One true award for each participant, worked out from their own answers in the match.
// Each award goes to the learner it fits best; everyone left over gets "team-mate" with the
// stars they added, so nobody leaves without one and nothing is invented.
function pickAwards(members, d, cheers, firstByTeam) {
  const out = new Map()
  const free = () => members.filter((e) => !out.has(e))
  const give = (email, award, evidence) => { if (email && !out.has(email)) out.set(email, { award, evidence }) }
  const best = (metric, min = 1) => {
    let top = null
    for (const e of free()) { const v = metric(e); if (v >= min && (!top || v > top.v)) top = { e, v } }
    return top
  }
  let b = best((e) => d.get(e)?.comebacks || 0); if (b) give(b.e, 'best_comeback', { comebacks: b.v })
  b = best((e) => d.get(e)?.improved || 0, 5); if (b) give(b.e, 'most_improved', { from: d.get(b.e).firstHalf, to: d.get(b.e).secondHalf })
  b = best((e) => d.get(e)?.noHint || 0, 3); if (b) give(b.e, 'sharp_first_try', { noHint: b.v })
  b = best((e) => cheers.get(e)?.cheers || 0); if (b) give(b.e, 'kindest_cheerer', { cheers: b.v })
  b = best((e) => d.get(e)?.areas || 0, 3); if (b) give(b.e, 'curious_explorer', { places: b.v })
  // Whoever earned their team's very first star, when nothing above already fits them better.
  for (const e of firstByTeam) if (e) give(e, 'team_spark', { first: true })
  // Second helpings, so a big group does not end with one of each and "team-mate" for the rest.
  for (const e of free()) {
    const x = d.get(e) || {}
    if (x.comebacks >= 2) give(e, 'best_comeback', { comebacks: x.comebacks })
    else if (x.improved >= 10) give(e, 'most_improved', { from: x.firstHalf, to: x.secondHalf })
    else if (x.noHint >= 10) give(e, 'sharp_first_try', { noHint: x.noHint })
    else if ((cheers.get(e)?.cheers || 0) >= 3) give(e, 'kindest_cheerer', { cheers: cheers.get(e).cheers })
    else if (x.right > 0) give(e, 'steady_helper', { stars: x.right })
    else give(e, 'teammate', { stars: 0 })
  }
  return out
}

async function end(match, by = 'teacher', now = new Date()) {
  if (match.status === 'ended') return match
  const to = new Date(Math.min(now.getTime(), match.endsAt.getTime()))
  const opts = { capPerDay: match.starsPerDayCap, subject: match.subject }
  match.endedAt = to
  const c = await count(match, to)
  const d = await detail(match.emails, match.startsAt, to, { subject: match.subject })
  const allCheers = new Map()
  const firstByTeam = []
  let earliest = null
  for (const [i, t] of match.teams.entries()) {
    t.stars = c.teams[i].stars
    t.reached = t.stars >= t.goal
    t.reachedAt = t.reached ? (await reachedAt(t.members, match.startsAt, to, t.goal, opts)) || to : null
    if (t.reached && (!earliest || t.reachedAt < earliest.at)) earliest = { i, at: t.reachedAt }
    for (const [e, v] of c.teams[i].spirit) allCheers.set(e, v)
    // The learner who earned the team's very first star.
    let first = null
    for (const e of t.members) { const at = d.get(e)?.first; if (at && (!first || at < first.at)) first = { e, at } }
    firstByTeam.push(first?.e || null)
  }
  // "First to the flag" only means something when there is more than one team.
  if (earliest && match.teams.length > 1) match.teams[earliest.i].firstFlag = true
  match.status = 'ended'
  match.endedBy = by
  await match.save()

  const personal = pickAwards(match.emails, d, allCheers, firstByTeam)
  const base = { sourceType: 'team', sourceId: String(match._id), at: to }
  for (const t of match.teams) {
    for (const e of t.members) {
      const mine = c.per.get(e)?.stars || 0
      const tasks = []
      if (t.reached) tasks.push(awards.grant(e, { ...base, kind: 'trophy', title: match.title, evidence: { team: t.key, teamStars: t.stars, goal: t.goal, mine } }))
      if (t.firstFlag) tasks.push(awards.grant(e, { ...base, kind: 'first_flag', title: match.title, evidence: { team: t.key } }))
      const p = personal.get(e)
      tasks.push(awards.grant(e, { ...base, kind: 'award', award: p.award, title: match.title, evidence: p.evidence }))
      await Promise.all(tasks)
    }
  }
  return match
}

// The teacher's view: the board, and for each team who has joined in so far. Names are in
// name order and carry no number, so it is a list for a nudge, never a ranking.
async function forTeacher(match, students) {
  const names = new Map(students.map((s) => [lower(s.email), { id: String(s._id), name: s.name }]))
  const b = await board(match)
  const c = match.status === 'active' ? await count(match) : null
  let given = null
  if (match.status === 'ended') {
    const SocialAward = require('../../models/social/SocialAward')
    const rows = await SocialAward.find({ sourceType: 'team', sourceId: String(match._id), kind: 'award' }).select('email award').lean()
    given = new Map(rows.map((r) => [r.email, r.award]))
  }
  const teams = match.teams.map((t, i) => ({
    ...b.teams[i],
    members: t.members.map((e) => ({
      id: names.get(e)?.id || null, name: names.get(e)?.name || 'Learner',
      ...(c ? { joinedIn: (c.per.get(e)?.stars || 0) > 0 } : {}),
      ...(given ? { award: given.get(e) || 'teammate' } : {}),
    })).sort((x, y) => x.name.localeCompare(y.name)),
  }))
  const all = teams.flatMap((t) => t.members)
  return { ...b, teams, joinedIn: c ? all.filter((m) => m.joinedIn).length : null, learners: all.length }
}

// A learner's teams: running ones, and the ceremonies of the last 30 days.
async function forLearner(email) {
  const e = lower(email)
  const since = new Date(Date.now() - 30 * DAY)
  const found = await TeamMatch.find({ emails: e, $or: [{ status: 'active' }, { endedAt: { $gte: since } }] }).sort({ endsAt: -1 }).limit(12)
  const out = []
  for (let m of found) {
    m = await settleIfDue(m)
    const b = await board(m)
    const mineIdx = m.teams.findIndex((t) => t.members.includes(e))
    if (mineIdx < 0) continue
    const mine = m.teams[mineIdx]
    const cards = await cardsFor(mine.members.filter((x) => x !== e))
    const row = {
      ...b, myTeam: mine.key,
      // Team-mates by first name and picture, for a cheer. No numbers next to anyone.
      mates: [...cards.values()].map((c) => publicView(c, { name: true })).sort((x, y) => (x.name || x.nick.text).localeCompare(y.name || y.nick.text)),
      matesWithoutCard: mine.members.length - 1 - cards.size,
    }
    if (m.status === 'active') {
      const per = await starsBy([e], m.startsAt, new Date(), { capPerDay: m.starsPerDayCap, subject: m.subject })
      row.iAdded = per.get(e)?.stars || 0
      row.todayLeft = null
    } else {
      const SocialAward = require('../../models/social/SocialAward')
      const mineAwards = await SocialAward.find({ email: e, sourceType: 'team', sourceId: String(m._id) }).lean()
      row.ceremony = {
        trophy: mineAwards.some((a) => a.kind === 'trophy'), firstFlag: mineAwards.some((a) => a.kind === 'first_flag'),
        award: mineAwards.find((a) => a.kind === 'award')?.award || 'teammate',
        evidence: mineAwards.find((a) => a.kind === 'award')?.evidence || {},
        isNew: mineAwards.some((a) => !a.seenAt),
      }
    }
    out.push(row)
  }
  return out
}

// For a grown-up of one learner: their teams, without any other child's name.
async function forAdult(email) {
  const rows = await forLearner(email)
  return rows.map(({ mates, matesWithoutCard, ...r }) => ({ ...r, teamSize: (mates?.length || 0) + (matesWithoutCard || 0) + 1 }))
}

module.exports = { create, board, end, forTeacher, forLearner, forAdult, settleIfDue, balance, pickAwards, clean, count, head, firstNameInitial }
