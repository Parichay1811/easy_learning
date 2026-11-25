// Dashboard counting (docs/learning/GAME-ROADMAP.md G-001, G-002, G-006):
// - an answered question adds its XP and real minutes, never a session;
// - a round is one session with its real length, and its XP is not added again;
// - older clients (no `kind`, no `questions`) keep the old behaviour;
// - new badges come back with what the page needs to show them;
// - streak and XP badges are no longer awarded (earned ones stay visible), and the stats
//   say how many days the learner learned this week instead;
// - a day is the learner's own calendar day (the X-Timezone header), stored as UTC midnight of
//   that date: never the UTC day of the instant (the calendar showed play one day off).
const test = require('node:test')
const assert = require('node:assert/strict')
const { start } = require('./harness')

let app
const S = {}

test.before(async () => {
  app = await start()
  for (const e of ['count1', 'count2', 'count3', 'count4', 'count5', 'count6', 'count7']) S[e] = app.tokens.student(`${e}@kids.test`, e)
})
test.after(async () => { await app?.stop?.() })

const session = (token, body) => app.call('POST', '/api/dashboard/log-session', { token, headers: { 'x-timezone': 'UTC' }, body: { module: 'read', subject: 'maths', score: 100, ...body } })
const round = (token, body) => app.call('POST', '/api/dashboard/log-round', { token, headers: { 'x-timezone': 'UTC' }, body: { module: 'read', subject: 'maths', mode: 'practice', ...body } })
const stats = async (token) => (await app.call('GET', '/api/dashboard/stats', { token })).body.data

test('a round of answers counts its XP once, its real minutes, and one session', async () => {
  const t = S.count1
  // Ten answers, 8 right (10 XP each), about 30 s each.
  for (let i = 0; i < 10; i += 1) {
    const r = await session(t, { kind: 'answer', durationMinutes: 0.5, xpEarned: i < 8 ? 10 : 0, score: i < 8 ? 100 : 0 })
    assert.equal(r.status, 200)
    assert.deepEqual(r.body.newAchievements, [], 'an answer never awards session badges')
  }
  const r = await round(t, { stars: 8, bonusStars: 0, totalStars: 8, questions: 10, durationMinutes: 5.2, xpEarned: 80 })
  assert.equal(r.status, 200)
  const s = await stats(t)
  assert.equal(s.totalXP, 80, 'XP counted once')
  assert.equal(s.totalSessions, 1, 'one round = one session')
  assert.equal(s.totalMinutes, 5, 'real minutes (10 × 0.5), not 10 + 5')
  assert.equal(s.todayMinutes, 5)
})

test('an idle tab does not keep counting minutes; nonsense values are clamped', async () => {
  const t = S.count2
  await session(t, { kind: 'answer', durationMinutes: 240, xpEarned: 10 })
  await session(t, { kind: 'answer', durationMinutes: -5, xpEarned: 1e9 })
  const s = await stats(t)
  assert.equal(s.totalMinutes, 3, 'one answer adds at most 3 minutes')
  assert.equal(s.totalXP, 110, 'one answer adds at most 100 XP')
  assert.equal(s.totalSessions, 0)
})

test('older clients keep the old behaviour (a fixed session per answer and per round)', async () => {
  const t = S.count3
  await session(t, { durationMinutes: 1, xpEarned: 10 })
  await round(t, { stars: 1, bonusStars: 0, totalStars: 1 })
  const s = await stats(t)
  assert.equal(s.totalSessions, 2)
  assert.equal(s.totalMinutes, 6)
  assert.equal(s.totalXP, 20)
})

test('the round reply carries new badges ready to show, never streak or XP badges', async () => {
  const t = S.count4
  for (let i = 0; i < 12; i += 1) await session(t, { kind: 'answer', durationMinutes: 0.4, xpEarned: 10 })
  const r = await round(t, { stars: 10, totalStars: 10, questions: 10, durationMinutes: 4, xpEarned: 120 })
  assert.ok(r.body.newAchievements.includes('first_step'))
  const card = r.body.badges.find((b) => b.id === 'first_step')
  assert.ok(card && card.name && card.icon && card.category, 'badge card has name, icon and category')
  // 120 XP would have earned "Century" before: no more.
  assert.ok(!r.body.newAchievements.includes('century'))
  const s = await stats(t)
  assert.equal(s.daysThisWeek, 1, 'days learned this week (nothing lost by missing a day)')

  const list = (await app.call('GET', '/api/dashboard/achievements', { token: t })).body.data
  for (const id of ['three_day_streak', 'week_warrior', 'century', 'champion']) {
    assert.ok(!list.some((a) => a.id === id), `${id} is retired and not shown unless earned`)
  }
  // A badge already earned before stays visible.
  await app.db.main.collection('studentachievements').insertOne({ email: 'count4@kids.test', achievementId: 'century', earnedAt: new Date() })
  const again = (await app.call('GET', '/api/dashboard/achievements', { token: t })).body.data
  assert.ok(again.some((a) => a.id === 'century' && a.earned), 'an earned retired badge still shows')
})

// ── A day is the learner's own day ──────────────────────────────────────────
const localDate = (tz, at = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at)
const dayRows = async (email) => (await app.db.main.collection('studentactivities').find({ email }).toArray())
const iso = (d) => new Date(d).toISOString()

test('the day key is the local calendar date around midnight (Los Angeles, Kolkata)', () => {
  const { dayKey } = require('../../models/StudentActivity')
  const key = (at, tz) => iso(dayKey(new Date(at), tz))
  // Los Angeles (UTC-8 in November): 23:30 on the 23rd is still the 23rd, though it is the 24th in UTC.
  assert.equal(key('2026-11-24T07:30:00Z', 'America/Los_Angeles'), '2026-11-23T00:00:00.000Z')
  assert.equal(key('2026-11-24T08:00:00Z', 'America/Los_Angeles'), '2026-11-24T00:00:00.000Z', 'midnight: the new day')
  assert.equal(key('2026-11-25T03:00:00Z', 'America/Los_Angeles'), '2026-11-24T00:00:00.000Z', '7 pm on the 24th, the 25th in UTC')
  // Kolkata (UTC+5:30): 00:30 on the 25th is the 25th, though it is still the 24th in UTC.
  assert.equal(key('2026-11-24T18:29:00Z', 'Asia/Kolkata'), '2026-11-24T00:00:00.000Z')
  assert.equal(key('2026-11-24T19:00:00Z', 'Asia/Kolkata'), '2026-11-25T00:00:00.000Z')
  // Summer time is the timezone's business (Los Angeles is UTC-7 in July).
  assert.equal(key('2026-07-04T06:59:00Z', 'America/Los_Angeles'), '2026-07-03T00:00:00.000Z')
  assert.equal(key('2026-07-04T07:00:00Z', 'America/Los_Angeles'), '2026-07-04T00:00:00.000Z')
  assert.equal(key('2026-11-24T23:59:59Z', 'UTC'), '2026-11-24T00:00:00.000Z')
  assert.equal(key('2026-11-24T23:59:59Z', 'Not/AZone'), '2026-11-24T00:00:00.000Z', 'an unknown timezone counts as UTC')
  assert.equal(key('2026-11-24T23:59:59Z', undefined), '2026-11-24T00:00:00.000Z')
})

test('"today", the days this week and the run of days are counted from the learner\'s own today', async () => {
  const t = S.count6
  const email = 'count6@kids.test'
  const far = 'Pacific/Kiritimati', behind = 'Pacific/Pago_Pago' // 25 hours apart: never the same date
  const F = new Date(`${localDate(far)}T00:00:00.000Z`).getTime()
  const DAY = 86400000
  const played = [0, 1, 2, 6, 7] // days ago, in Kiritimati
  await app.db.main.collection('studentactivities').insertMany(played.map((ago) => ({ email, date: new Date(F - ago * DAY), sessions: [], totalMinutes: 5, totalXP: 10 + ago, totalSessions: 1 })))
  const read = async (tz) => (await app.call('GET', '/api/dashboard/stats', { token: t, headers: { 'x-timezone': tz } })).body.data
  const there = await read(far)
  assert.deepEqual([there.todayXP, there.todayMinutes, there.streak, there.daysThisWeek], [10, 5, 3, 4])
  // In Pago Pago it is one or two days earlier: the Kiritimati "today" is not today there, and
  // days ahead of the reader's today break nothing.
  const P = new Date(`${localDate(behind)}T00:00:00.000Z`).getTime()
  const ago = Math.round((F - P) / DAY)
  assert.ok(ago === 1 || ago === 2, `Pago Pago is ${ago} day(s) behind Kiritimati`)
  const here = await read(behind)
  assert.deepEqual([here.todayXP, here.streak, here.daysThisWeek], ago === 1 ? [11, 2, 4] : [12, 1, 3])
})

test('answers and rounds land on the learner\'s own day (X-Timezone), read back as that date', async () => {
  const t = S.count5
  const email = 'count5@kids.test'
  // Kiritimati (UTC+14) and Pago Pago (UTC-11) are never on the same calendar date: the same
  // instant is two different days. Los Angeles and Kolkata differ for half of every day.
  const zones = ['Pacific/Kiritimati', 'Pacific/Pago_Pago', 'America/Los_Angeles', 'Asia/Kolkata']
  const want = {}
  for (const tz of zones) {
    const before = localDate(tz)
    const r = await app.call('POST', '/api/dashboard/log-session', { token: t, headers: { 'x-timezone': tz }, body: { module: 'read', subject: 'maths', kind: 'answer', durationMinutes: 1, xpEarned: 10 } })
    assert.equal(r.status, 200)
    const after = localDate(tz)
    const keys = (await dayRows(email)).map((d) => iso(d.date))
    const hit = [before, after].find((d) => keys.includes(`${d}T00:00:00.000Z`))
    assert.ok(hit, `${tz}: a row for ${before} in ${keys.join(', ')}`)
    want[hit] = (want[hit] || 0) + 10
  }
  const rows = await dayRows(email)
  assert.ok(rows.length >= 2, 'the same instant is at least two different days')
  assert.notEqual(localDate('Pacific/Kiritimati'), localDate('Pacific/Pago_Pago'))
  for (const d of rows) {
    assert.match(iso(d.date), /T00:00:00\.000Z$/, 'a calendar date, stored as UTC midnight')
    assert.equal(d.totalXP, want[iso(d.date).slice(0, 10)], `XP of ${iso(d.date).slice(0, 10)}`)
  }

  // The round of that day joins the same row (one session), not the UTC day's.
  const far = 'Pacific/Kiritimati'
  const r = await app.call('POST', '/api/dashboard/log-round', { token: t, headers: { 'x-timezone': far }, body: { module: 'read', subject: 'maths', mode: 'practice', stars: 1, totalStars: 1, questions: 1, durationMinutes: 1, xpEarned: 10 } })
  assert.equal(r.status, 200)
  const farDay = (await dayRows(email)).find((d) => iso(d.date).slice(0, 10) === localDate(far))
  assert.deepEqual([farDay.totalSessions, farDay.sessions.length], [1, 1])
  assert.equal((await dayRows(email)).length, rows.length, 'no extra row for the UTC day')

  // "Today" is the reader's own today: each timezone sees its own day's numbers.
  for (const tz of ['Pacific/Kiritimati', 'Pacific/Pago_Pago']) {
    const s = (await app.call('GET', '/api/dashboard/stats', { token: t, headers: { 'x-timezone': tz } })).body.data
    assert.equal(s.todayXP, want[localDate(tz)], `${tz}: today's XP`)
    assert.ok(s.daysThisWeek >= 1 && s.daysThisWeek <= rows.length)
  }
  // The calendar gets each day as a plain date (the client reads its UTC year-month-day).
  const year = Number(localDate(far).slice(0, 4))
  const cal = (await app.call('GET', `/api/dashboard/activity?year=${year}`, { token: t, headers: { 'x-timezone': far } })).body.data
  assert.ok(cal.some((d) => iso(d.date) === `${localDate(far)}T00:00:00.000Z`))
  const perf = (await app.call('GET', '/api/dashboard/performance?days=30', { token: t, headers: { 'x-timezone': far } })).body.data
  assert.equal(perf.length, rows.length, 'the last 30 days include today in every timezone')
  assert.deepEqual(perf.map((d) => iso(d.date)), [...perf.map((d) => iso(d.date))].sort(), 'oldest first')
})

test('a missing or unknown timezone counts as UTC (older clients); rows from before keep reading as their date', async () => {
  const t = S.count7
  const email = 'count7@kids.test'
  // An old row, keyed by the UTC day as before: yesterday's.
  const utcToday = new Date(`${localDate('UTC')}T00:00:00.000Z`)
  const yesterday = new Date(utcToday.getTime() - 86400000)
  await app.db.main.collection('studentactivities').insertOne({ email, date: yesterday, sessions: [], totalMinutes: 4, totalXP: 20, totalSessions: 1 })
  for (const headers of [{}, { 'x-timezone': 'Not/AZone' }]) {
    const r = await app.call('POST', '/api/dashboard/log-session', { token: t, headers, body: { module: 'read', subject: 'maths', kind: 'answer', durationMinutes: 1, xpEarned: 10 } })
    assert.equal(r.status, 200)
  }
  const rows = await dayRows(email)
  assert.deepEqual(rows.map((d) => iso(d.date)).sort(), [iso(yesterday), iso(utcToday)], 'both answers on the UTC day; the old row untouched')
  const s = await stats(t)
  assert.deepEqual([s.todayXP, s.totalXP, s.daysThisWeek, s.streak], [20, 40, 2, 2])
})
