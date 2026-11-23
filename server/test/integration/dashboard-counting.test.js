// Dashboard counting (docs/learning/GAME-ROADMAP.md G-001, G-002, G-006):
// - an answered question adds its XP and real minutes, never a session;
// - a round is one session with its real length, and its XP is not added again;
// - older clients (no `kind`, no `questions`) keep the old behaviour;
// - new badges come back with what the page needs to show them;
// - streak and XP badges are no longer awarded (earned ones stay visible), and the stats
//   say how many days the learner learned this week instead.
const test = require('node:test')
const assert = require('node:assert/strict')
const { start } = require('./harness')

let app
const S = {}

test.before(async () => {
  app = await start()
  for (const e of ['count1', 'count2', 'count3', 'count4']) S[e] = app.tokens.student(`${e}@kids.test`, e)
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
