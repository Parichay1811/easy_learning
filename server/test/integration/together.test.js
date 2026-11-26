// Learning together end to end (docs/learning/GAME-ROADMAP.md Phase 5): player cards, friends
// by code with a grown-up's OK for a young child, the same round for two learners, cheers,
// team matches with a ceremony where everybody wins, the Shorts feed and "what they love"
// for parents and teachers. And the safety rules: no endpoint returns another learner's
// email, nothing ranks children, another school or family reaches nothing, every switch holds.
const test = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const { start } = require('./harness')

let app
const oid = () => new mongoose.Types.ObjectId()
const ids = {}
const S = {}
const KIDS = ['ana', 'ben', 'cal', 'dee', 'eve', 'fay', 'asha', 'bo', 'cy', 'di', 'out']

const q = (id, level, skill) => ({
  _id: oid(), id, subject: 'Math', module: 'Read', interaction: 'tap_mcq', level, status: 'approved', uploadBatchId: null,
  instruction: `How many? (${id})`, prompt: '🍎🍎🍎', options: ['2', '3', '4'], correct_answer: '3', accepted_answers: ['3'], skill,
})

const call = (who, method, route, body) => app.call(method, route, { token: S[who], body, headers: { 'x-timezone': 'UTC' } })
const P = () => ({ mum: app.tokens.parent(ids.mum, 'mum@family.test'), stranger: app.tokens.parent(ids.stranger, 'x@other.test') })
const T = () => ({ tA: app.tokens.teacher(ids.tA, ids.orgA, 'ta@a.test'), tA2: app.tokens.teacher(ids.tA2, ids.orgA, 'ta2@a.test'), tB: app.tokens.teacher(ids.tB, ids.orgB, 'tb@b.test') })
// Nothing a learner, parent or teacher is sent may carry a learner's email.
const noEmails = (body, why) => assert.ok(!/@kids\.test/.test(JSON.stringify(body)), `${why}: a learner's email leaked`)
const noRanking = (body, why) => assert.ok(!/"(rank|position|place|leaderboard)"/i.test(JSON.stringify(body)), `${why}: a ranking key`)

test.before(async () => {
  app = await start()
  const { main, admin } = app.db
  await main.collection('readmaths').insertMany([
    ...[1, 2, 3, 4].map((i) => q(`TG-A-${i}`, 1, 'maths.tg-adding')),
    ...[1, 2, 3].map((i) => q(`TG-B-${i}`, 1, 'maths.tg-counting')),
    ...[1, 2, 3].map((i) => q(`TG-C-${i}`, 2, 'maths.tg-adding-20')),
    { ...q('TG-OPEN', 1, 'maths.tg-talk'), interaction: 'typed_long', correct_answer: 'open' },
  ])

  const orgA = oid(), orgB = oid(), g = oid(), gB = oid(), tA = oid(), tA2 = oid(), tB = oid()
  const st = { asha: oid(), bo: oid(), cy: oid(), di: oid(), noMail: oid(), out: oid() }
  await admin.collection('organizations').insertMany([
    { _id: orgA, name: 'Sunrise School', kind: 'institute', status: 'approved', adminUid: 'adm-a', adminEmail: 'head@a.test' },
    { _id: orgB, name: 'Other School', kind: 'institute', status: 'approved', adminUid: 'adm-b', adminEmail: 'head@b.test' },
  ])
  const tutor = (_id, orgId, email) => ({ _id, name: email, email, orgId, uid: `g-${email}`, authStatus: 'active', status: 'active', batchIds: [], studentIds: [], subjectIds: [] })
  await admin.collection('tutors').insertMany([tutor(tA, orgA, 'ta@a.test'), tutor(tA2, orgA, 'ta2@a.test'), tutor(tB, orgB, 'tb@b.test')])
  const pupil = (_id, name, email, orgId, batchIds) => ({ _id, name, email, orgId, batchIds, tutorIds: [], parentIds: [], status: 'active' })
  await admin.collection('students').insertMany([
    pupil(st.asha, 'Asha Rao', 'asha@kids.test', orgA, [g]), pupil(st.bo, 'Bo Lee', 'bo@kids.test', orgA, [g]),
    pupil(st.cy, 'Cy Park', 'cy@kids.test', orgA, [g]), pupil(st.di, 'Di Moss', 'di@kids.test', orgA, [g]),
    pupil(st.noMail, 'No Mail', '', orgA, [g]), pupil(st.out, 'Out Sider', 'out@kids.test', orgB, [gB]),
  ])
  await admin.collection('batches').insertMany([
    { _id: g, name: 'Year 4', orgId: orgA, tutorIds: [tA], directTutorIds: [tA], subjects: [], studentIds: [st.asha, st.bo, st.cy, st.di, st.noMail], status: 'active', archivedAt: null },
    { _id: gB, name: 'B group', orgId: orgB, tutorIds: [tB], directTutorIds: [tB], subjects: [], studentIds: [st.out], status: 'active', archivedAt: null },
  ])

  const mum = oid(), stranger = oid(), childAna = oid()
  await main.collection('parentaccounts').insertMany([
    { _id: mum, uid: 'p-mum', email: 'mum@family.test', name: 'Priya', plan: 'free' },
    { _id: stranger, uid: 'p-x', email: 'x@other.test', name: 'Stranger', plan: 'free' },
  ])
  await main.collection('children').insertOne({ _id: childAna, parentId: mum, name: 'Ana', age: 9, email: 'ana@kids.test', linkStatus: 'verified', verifiedBy: 'child_code', guardianRole: 'primary' })

  Object.assign(ids, {
    orgA: String(orgA), orgB: String(orgB), g: String(g), gB: String(gB), tA: String(tA), tA2: String(tA2), tB: String(tB),
    mum: String(mum), stranger: String(stranger), childAna: String(childAna), asha: String(st.asha), out: String(st.out),
  })
  for (const k of KIDS) S[k] = app.tokens.student(`${k}@kids.test`, `${k[0].toUpperCase()}${k.slice(1)} Family`)
})
test.after(async () => { await app?.stop() })

const me = async (who) => (await call(who, 'GET', '/api/social/me')).body.me
const befriend = async (a, b) => {
  const code = (await me(b)).code
  await call(a, 'POST', '/api/social/friends', { code })
  const incoming = (await call(b, 'GET', '/api/social/friends')).body.incoming
  return call(b, 'POST', `/api/social/friends/${incoming[0].id}/accept`)
}

test('a player card is a nickname, a picture and a code: never an email', async () => {
  const r = await call('ben', 'GET', '/api/social/me')
  assert.equal(r.status, 200)
  assert.match(r.body.me.code, /^[A-HJ-NP-Z2-9]{6}$/)
  assert.ok(r.body.me.nick.text && r.body.me.avatar)
  assert.equal(r.body.me.name, 'Ben') // the first name only
  noEmails(r.body, 'my card')
  assert.equal((await call('ben', 'PATCH', '/api/social/me', { nickA: 'Dr', nickN: 'evil' })).status, 400) // words come from the list
  const ok = await call('ben', 'PATCH', '/api/social/me', { nickA: 'brave', nickN: 'otter', avatar: 'otter' })
  assert.equal(ok.body.me.nick.text, 'Brave Otter')
  assert.equal((await app.call('GET', '/api/social/me')).status, 401)
})

test('friends: by code, both agree, and nobody else can touch the friendship', async () => {
  const cal = await me('cal')
  assert.equal((await call('ben', 'POST', '/api/social/friends', { code: 'ZZZZZZ' })).status, 404)
  assert.equal((await call('ben', 'POST', '/api/social/friends', { code: (await me('ben')).code })).body.code, 'OWN_CODE')
  const asked = await call('ben', 'POST', '/api/social/friends', { code: cal.code.toLowerCase() })
  assert.equal(asked.status, 201)
  assert.equal(asked.body.status, 'pending')
  assert.equal(asked.body.outgoing.length, 1)
  const inbox = await call('cal', 'GET', '/api/social/friends')
  assert.equal(inbox.body.incoming.length, 1)
  assert.equal(inbox.body.incoming[0].name, 'Ben')
  noEmails(inbox.body, 'friend requests')
  const fid = inbox.body.incoming[0].id
  assert.equal((await call('dee', 'POST', `/api/social/friends/${fid}/accept`)).status, 404) // not hers
  assert.equal((await call('dee', 'DELETE', `/api/social/friends/${fid}`)).status, 404)
  assert.equal((await call('ben', 'POST', `/api/social/friends/${fid}/accept`)).body.status, 'pending') // the asker cannot accept for the other
  const yes = await call('cal', 'POST', `/api/social/friends/${fid}/accept`)
  assert.equal(yes.body.status, 'active')
  assert.equal(yes.body.friends.length, 1)
  assert.equal((await call('ben', 'GET', '/api/social/friends')).body.friends[0].name, 'Cal')
  // A card id from outside my own class is never a way in.
  assert.equal((await call('dee', 'POST', '/api/social/friends', { cardId: cal.id })).status, 404)
})

test('a young child with a grown-up linked: the grown-up says yes first, and holds the switches', async () => {
  const ana = await me('ana')
  assert.equal(ana.needsAdultOk, true)
  await call('ben', 'POST', '/api/social/friends', { code: ana.code })
  const inbox = (await call('ana', 'GET', '/api/social/friends')).body.incoming
  const agreed = await call('ana', 'POST', `/api/social/friends/${inbox[0].id}/accept`)
  assert.equal(agreed.body.status, 'awaiting_adult')
  assert.equal(agreed.body.friends.length, 0)
  assert.equal(agreed.body.awaiting[0].mine, true)
  // Not friends yet: no round together.
  assert.equal((await call('ana', 'POST', '/api/social/matches', { friendId: (await me('ben')).id, subject: 'maths', module: 'read' })).status, 404)

  const view = await app.call('GET', `/api/parent/children/${ids.childAna}/together`, { token: P().mum })
  assert.equal(view.status, 200)
  assert.equal(view.body.friends.waitingForYou.length, 1)
  assert.equal(view.body.friends.waitingForYou[0].name, 'Ben')
  noEmails(view.body, 'the parent view')
  const fid = view.body.friends.waitingForYou[0].id
  assert.equal((await app.call('POST', `/api/parent/children/${ids.childAna}/together/friends/${fid}/approve`, { token: P().stranger })).status, 404)
  const ok = await app.call('POST', `/api/parent/children/${ids.childAna}/together/friends/${fid}/approve`, { token: P().mum })
  assert.equal(ok.body.status, 'active')
  assert.equal((await call('ana', 'GET', '/api/social/friends')).body.friends.length, 1)

  // The switch: friends off for Ana. Her code then matches nobody, and she cannot ask either.
  const off = await app.call('PATCH', `/api/parent/children/${ids.childAna}/settings`, { token: P().mum, body: { together: { friends: false } } })
  assert.equal(off.status, 200)
  assert.equal(off.body.child.together.matches, true) // the other switches kept their value
  assert.equal((await me('ana')).can.friends, false)
  assert.equal((await me('ana')).off.friends, 'adult')
  assert.equal((await call('dee', 'POST', '/api/social/friends', { code: ana.code })).status, 404)
  assert.equal((await call('ana', 'POST', '/api/social/friends', { code: (await me('dee')).code })).body.code, 'FRIENDS_OFF')
  assert.equal((await app.call('PATCH', `/api/parent/children/${ids.childAna}/settings`, { token: P().mum, body: { together: { friends: 'no' } } })).status, 400)
  await app.call('PATCH', `/api/parent/children/${ids.childAna}/settings`, { token: P().mum, body: { together: { friends: true } } })
  // The parent can end a friendship.
  const gone = await app.call('DELETE', `/api/parent/children/${ids.childAna}/together/friends/${fid}`, { token: P().mum })
  assert.equal(gone.body.friends.friends.length, 0)
})

test('the same round for two friends, each in their own time: one shared result', async () => {
  const cal = await me('cal')
  assert.equal((await call('ben', 'POST', '/api/social/matches', { friendId: cal.id, subject: 'maths', module: 'speak' })).status, 400) // not for the microphone
  assert.equal((await call('ben', 'POST', '/api/social/matches', { friendId: (await me('dee')).id, subject: 'maths', module: 'read' })).status, 404) // not a friend
  const made = await call('ben', 'POST', '/api/social/matches', { friendId: cal.id, kind: 'buddy', subject: 'maths', module: 'read' })
  assert.equal(made.status, 201)
  const id = made.body.match.id
  assert.equal(made.body.match.status, 'your_turn')
  assert.equal(made.body.match.with.name, 'Cal')
  noEmails(made.body, 'a new round')

  const play = await call('cal', 'GET', `/api/social/matches/${id}/play`)
  assert.equal(play.body.items.length, 5)
  assert.ok(play.body.items.every((it) => it.instruction && it.id !== 'TG-OPEN')) // checkable questions only
  assert.equal((await call('dee', 'GET', `/api/social/matches/${id}/play`)).status, 404)
  const calIds = play.body.items.map((it) => it.id)
  const benIds = (await call('ben', 'GET', `/api/social/matches/${id}/play`)).body.items.map((it) => it.id)
  assert.deepEqual(benIds, calIds) // the same questions in the same order

  const first = await call('cal', 'POST', `/api/social/matches/${id}/result`, {
    results: [...calIds.slice(0, 3).map((x) => ({ id: x, correct: true, firstTry: true })), { id: calIds[0], correct: true }, { id: 'NOT-IN-ROUND', correct: true }],
  })
  assert.equal(first.body.match.status, 'waiting')
  assert.equal(first.body.match.me.stars, 3) // a question counts once, and only this round's
  assert.equal(first.body.match.them, undefined) // nothing to chase before the friend has played
  assert.equal((await call('cal', 'GET', `/api/social/matches/${id}/play`)).body.code, 'PLAYED')

  const done = await call('ben', 'POST', `/api/social/matches/${id}/result`, { results: benIds.slice(0, 4).map((x) => ({ id: x, correct: true })) })
  assert.equal(done.body.match.status, 'done')
  assert.deepEqual(done.body.match.result, { together: 7, of: 10, prize: 'together' })
  for (const who of ['ben', 'cal']) {
    const t = await call(who, 'GET', '/api/social/trophies')
    assert.equal(t.body.awards.filter((a) => a.kind === 'together' && a.sourceId === id).length, 1)
  }
  await call('ben', 'POST', `/api/social/matches/${id}/result`, { results: benIds.map((x) => ({ id: x, correct: true })) }) // again: nothing changes
  assert.equal((await call('ben', 'GET', `/api/social/matches/${id}`)).body.match.me.stars, 4)
})

test('a friendly match: a ribbon for the higher score, "brave challenger" for the other, both for a draw', async () => {
  const cal = await me('cal')
  const play = async (kind, benRight, calRight) => {
    const id = (await call('ben', 'POST', '/api/social/matches', { friendId: cal.id, kind, subject: 'maths', module: 'read' })).body.match.id
    // A fair duel (content v5): each plays their own questions at their own level.
    const items = (await call('ben', 'GET', `/api/social/matches/${id}/play`)).body.items.map((it) => it.id)
    const calItems = (await call('cal', 'GET', `/api/social/matches/${id}/play`)).body.items.map((it) => it.id)
    assert.equal(calItems.length, items.length, 'the same number of questions')
    await call('ben', 'POST', `/api/social/matches/${id}/result`, { results: items.slice(0, benRight).map((x) => ({ id: x, correct: true })) })
    return (await call('cal', 'POST', `/api/social/matches/${id}/result`, { results: calItems.slice(0, calRight).map((x) => ({ id: x, correct: true })) })).body.match
  }
  const m = await play('friendly', 2, 5)
  assert.deepEqual(m.result, { draw: false, prize: 'ribbon', theirPrize: 'brave' })
  const draw = await play('friendly', 3, 3)
  assert.deepEqual(draw.result, { draw: true, prize: 'ribbon', theirPrize: 'ribbon' })
  const kinds = (await call('ben', 'GET', '/api/social/trophies')).body.counts
  assert.equal(kinds.brave, 1)
  assert.equal(kinds.ribbon, 1)
  noRanking(await call('ben', 'GET', '/api/social/home').then((r) => r.body), 'the Together home')
})

test('someone new: off until asked for, nickname only, and a supervised child needs a grown-up to switch it on', async () => {
  assert.equal((await call('dee', 'POST', '/api/social/matches/mystery', { subject: 'maths', module: 'read' })).body.code, 'MYSTERY_OFF')
  await call('dee', 'PATCH', '/api/social/me', { mystery: true })
  await call('eve', 'PATCH', '/api/social/me', { mystery: true })
  const mine = await call('dee', 'POST', '/api/social/matches/mystery', { subject: 'maths', module: 'read' })
  assert.equal(mine.status, 201)
  const id = mine.body.match.id
  assert.equal(mine.body.match.with, null)
  const items = (await call('dee', 'GET', `/api/social/matches/${id}/play`)).body.items.map((it) => it.id)
  await call('dee', 'POST', `/api/social/matches/${id}/result`, { results: items.slice(0, 2).map((x) => ({ id: x, correct: true })) })

  const joined = await call('eve', 'POST', '/api/social/matches/mystery', { subject: 'maths', module: 'read' })
  assert.equal(joined.body.match.id, id) // Eve plays the round Dee left
  assert.ok(joined.body.match.with.nick.text)
  assert.equal(joined.body.match.with.name, undefined) // a stranger is a nickname and a picture
  const eveItems = (await call('eve', 'GET', `/api/social/matches/${id}/play`)).body.items.map((it) => it.id)
  const done = await call('eve', 'POST', `/api/social/matches/${id}/result`, { results: eveItems.map((x) => ({ id: x, correct: true })) })
  assert.equal(done.body.match.result.prize, 'ribbon')
  noEmails(done.body, 'a mystery match')
  // Dee can ask not to meet that nickname again.
  assert.equal((await call('dee', 'POST', '/api/social/report', { cardId: (await call('dee', 'GET', `/api/social/matches/${id}`)).body.match.with.id })).status, 200)

  // Ana is nine and has a grown-up linked: her own switch is not enough.
  await call('ana', 'PATCH', '/api/social/me', { mystery: true })
  assert.equal((await call('ana', 'POST', '/api/social/matches/mystery', { subject: 'maths', module: 'read' })).body.code, 'MYSTERY_OFF')
  assert.equal((await me('ana')).off.mystery, 'adult')
  await app.call('PATCH', `/api/parent/children/${ids.childAna}/settings`, { token: P().mum, body: { together: { mystery: true } } })
  assert.equal((await call('ana', 'POST', '/api/social/matches/mystery', { subject: 'maths', module: 'read' })).status, 201)
  // ...and "playing together" off stops rounds with friends too.
  await app.call('PATCH', `/api/parent/children/${ids.childAna}/settings`, { token: P().mum, body: { together: { matches: false } } })
  assert.equal((await call('ana', 'POST', '/api/social/matches/mystery', { subject: 'maths', module: 'read' })).status, 403)
  await app.call('PATCH', `/api/parent/children/${ids.childAna}/settings`, { token: P().mum, body: { together: { matches: true, mystery: false } } })
})

test('cheers: preset stickers and lines only, to friends only, a few a day', async () => {
  const cal = await me('cal')
  assert.equal((await call('ben', 'POST', '/api/social/cheers', { to: cal.id, sticker: 'star', line: 'you are bad' })).status, 400) // no free text
  assert.equal((await call('ben', 'POST', '/api/social/cheers', { to: (await me('dee')).id, sticker: 'star', line: 'great_job' })).status, 404) // not a friend
  const sent = await call('ben', 'POST', '/api/social/cheers', { to: cal.id, sticker: 'star', line: 'great_job' })
  assert.equal(sent.status, 201)
  assert.equal(sent.body.left, 4)
  for (let i = 0; i < 4; i++) await call('ben', 'POST', '/api/social/cheers', { to: cal.id, sticker: 'heart', line: 'thanks' })
  assert.equal((await call('ben', 'POST', '/api/social/cheers', { to: cal.id, sticker: 'heart', line: 'thanks' })).body.code, 'CHEER_LIMIT')
  const home = await call('cal', 'GET', '/api/social/home')
  assert.equal(home.body.cheers.length, 5)
  assert.equal(home.body.cheers[0].from.name, 'Ben')
  noEmails(home.body, 'cheers')
  assert.equal((await call('dee', 'POST', '/api/social/cheers/seen', { ids: home.body.cheers.map((c) => c.id) })).body.seen, 0) // not hers to mark
  assert.equal((await call('cal', 'POST', '/api/social/cheers/seen', { ids: home.body.cheers.map((c) => c.id) })).body.seen, 5)
  assert.equal((await call('cal', 'GET', '/api/social/home')).body.cheers.length, 0)
})

test('the friends\' star jar is one shared total: nobody\'s share is shown but your own', async () => {
  const now = new Date()
  await app.db.main.collection('studentanswers').insertMany(Array.from({ length: 30 }, (_, i) => ({ email: 'cal@kids.test', module: 'read', subject: 'maths', correct: true, hintsUsed: 0, timestamp: new Date(now.getTime() - i * 1000), mode: 'practice' })))
  const jar = (await call('ben', 'GET', '/api/social/jar')).body.jar
  assert.equal(jar.friends, 1)
  assert.ok(jar.stars >= 20 && jar.stars <= 20 + 12, `the day's cap holds (${jar.stars})`) // Cal's 30 count as 20, plus Ben's own
  assert.equal(jar.marks[0].reached, jar.stars >= 25)
  assert.deepEqual(Object.keys(jar).sort(), ['friends', 'marks', 'mine', 'next', 'stars', 'week'])
})

test('a team match: balanced teams, stars from right answers (capped a day), and only the group\'s teacher runs it', async () => {
  const body = { title: 'Fraction week', kind: 'teams', teams: 2, days: 2, starsPerLearnerPerDay: 5 }
  assert.equal((await app.call('POST', `/api/teacher/groups/${ids.g}/competitions`, { token: T().tA2, body })).status, 404) // same school, not this group
  assert.equal((await app.call('POST', `/api/teacher/groups/${ids.g}/competitions`, { token: T().tB, body })).status, 404) // another school
  assert.equal((await app.call('POST', `/api/teacher/groups/${ids.g}/competitions`, { token: T().tA, body: { ...body, teams: 4 } })).body.code, 'TOO_FEW') // 4 learners, 4 teams
  assert.equal((await app.call('POST', `/api/teacher/groups/${ids.g}/competitions`, { token: T().tA, body: { ...body, title: '' } })).status, 400)
  const made = await app.call('POST', `/api/teacher/groups/${ids.g}/competitions`, { token: T().tA, body })
  assert.equal(made.status, 201)
  const c = made.body.competition
  ids.comp = c.id
  assert.equal(c.teams.length, 2)
  assert.deepEqual(c.teams.map((t) => t.size), [2, 2]) // the learner without an email cannot take part
  assert.deepEqual(c.teams.map((t) => t.goal), [20, 20]) // 2 learners x 2 days x 5
  noEmails(made.body, 'a new team match')
  noRanking(made.body, 'a new team match')
  // Members are in name order.
  for (const t of c.teams) assert.deepEqual(t.members.map((m) => m.name), [...t.members.map((m) => m.name)].sort())

  // Asha gets 30 right today (20 count), Bo misses twice then gets one right (a comeback).
  const now = Date.now()
  const ans = (email, correct, i, extra = {}) => ({ email, module: 'read', subject: 'maths', correct, hintsUsed: 0, timestamp: new Date(now + i), mode: 'practice', ...extra })
  await app.db.main.collection('studentanswers').insertMany([
    ...Array.from({ length: 30 }, (_, i) => ans('asha@kids.test', true, i)),
    ans('bo@kids.test', false, 1), ans('bo@kids.test', false, 2), ans('bo@kids.test', true, 3),
    ans('out@kids.test', true, 1), // another school's learner never counts
  ])
  await new Promise((r) => setTimeout(r, 400))

  const board = await app.call('GET', `/api/teacher/competitions/${ids.comp}`, { token: T().tA })
  assert.equal(board.status, 200)
  const total = board.body.competition.teams.reduce((s, t) => s + t.stars, 0)
  assert.equal(total, 21) // 20 (capped) + 1
  assert.equal(board.body.competition.joinedIn, 2)
  assert.equal(board.body.competition.learners, 4)
  assert.equal((await app.call('GET', `/api/teacher/competitions/${ids.comp}`, { token: T().tA2 })).status, 404)
  assert.equal((await app.call('GET', `/api/teacher/competitions/${ids.comp}`, { token: T().tB })).status, 404)
  assert.equal((await app.call('POST', `/api/teacher/competitions/${ids.comp}/end`, { token: T().tB })).status, 404)

  // The learner's side: my team's bar and what I added. No numbers next to team-mates.
  const mine = (await call('asha', 'GET', '/api/social/teams')).body.teams
  assert.equal(mine.length, 1)
  assert.equal(mine[0].iAdded, 20)
  assert.equal(mine[0].teams.length, 2)
  assert.ok(mine[0].mates.every((m) => Object.keys(m).every((k) => ['id', 'nick', 'avatar', 'name'].includes(k))))
  noEmails(mine, 'my teams')
  noRanking(mine, 'my teams')
  assert.equal((await call('out', 'GET', '/api/social/teams')).body.teams.length, 0)
  assert.equal((await call('dee', 'GET', '/api/social/teams')).body.teams.length, 0)

  // The shortcuts on Home: my team and how far it is from its flag; nothing about anyone else.
  const sum = await call('asha', 'GET', '/api/social/summary')
  assert.equal(sum.status, 200)
  assert.equal(sum.body.team.title, 'Fraction week')
  assert.equal(sum.body.team.left, Math.max(0, sum.body.team.goal - sum.body.team.stars))
  assert.equal(sum.body.round, null)
  noEmails(sum.body, 'the summary')
  noRanking(sum.body, 'the summary')
  assert.equal((await call('dee', 'GET', '/api/social/summary')).body.team, null)
  assert.equal((await app.call('GET', '/api/social/summary')).status, 401)
})

test('the ceremony: every team that reached its goal wins, and every participant gets one true award', async () => {
  const ended = await app.call('POST', `/api/teacher/competitions/${ids.comp}/end`, { token: T().tA })
  assert.equal(ended.status, 200)
  const c = ended.body.competition
  assert.equal(c.status, 'ended')
  const members = c.teams.flatMap((t) => t.members)
  assert.equal(members.length, 4)
  assert.ok(members.every((m) => typeof m.award === 'string' && m.award), 'everyone has an award')
  const ashaTeam = c.teams.find((t) => t.members.some((m) => m.name === 'Asha Rao'))
  assert.equal(ashaTeam.reached, true) // 20 of 20 (or more with Bo)
  noRanking(ended.body, 'the ceremony')

  const bo = (await call('bo', 'GET', '/api/social/teams')).body.teams[0]
  assert.equal(bo.status, 'ended')
  assert.equal(bo.ceremony.award, 'best_comeback')
  assert.deepEqual(bo.ceremony.evidence, { comebacks: 1 })
  const asha = (await call('asha', 'GET', '/api/social/teams')).body.teams[0]
  assert.equal(asha.ceremony.trophy, true)
  assert.ok(asha.ceremony.award)
  // Someone who answered nothing still belongs: "team-mate", never nothing and never last.
  const quiet = c.teams.flatMap((t) => t.members).filter((m) => ['Cy Park', 'Di Moss'].includes(m.name))
  assert.ok(quiet.every((m) => m.award === 'teammate'))
  // Ending twice changes nothing.
  const again = await app.call('POST', `/api/teacher/competitions/${ids.comp}/end`, { token: T().tA })
  assert.equal(again.body.competition.status, 'ended')
  const trophies = await app.db.main.collection('socialawards').countDocuments({ sourceId: ids.comp, kind: 'award' })
  assert.equal(trophies, 4)
  const audit = await app.db.main.collection('auditevents').countDocuments({ action: { $in: ['competition.start', 'competition.end'] } })
  assert.ok(audit >= 2)
})

test('a class quest is one team with one shared bar, and the school can switch all of it off', async () => {
  const quest = await app.call('POST', `/api/teacher/groups/${ids.g}/competitions`, { token: T().tA, body: { title: 'Reading quest', kind: 'quest', days: 3 } })
  assert.equal(quest.status, 201)
  assert.equal(quest.body.competition.teams.length, 1)
  assert.equal(quest.body.competition.teams[0].size, 4)
  const list = await app.call('GET', `/api/teacher/groups/${ids.g}/competitions`, { token: T().tA })
  assert.equal(list.body.enabled, true)
  assert.equal(list.body.running.length, 1)
  assert.equal(list.body.ended.length, 1)
  assert.equal(list.body.canJoin, 4)
  assert.equal(list.body.learners, 5)

  await app.db.admin.collection('orgpolicies').updateOne({ orgId: new mongoose.Types.ObjectId(ids.orgA) }, { $set: { competitions: 'off' } }, { upsert: true })
  const blocked = await app.call('POST', `/api/teacher/groups/${ids.g}/competitions`, { token: T().tA, body: { title: 'Nope', kind: 'quest' } })
  assert.equal(blocked.status, 403)
  assert.equal(blocked.body.code, 'POLICY_BLOCKED')
  assert.equal((await app.call('GET', `/api/teacher/groups/${ids.g}/competitions`, { token: T().tA })).body.enabled, false)
  await app.db.admin.collection('orgpolicies').updateOne({ orgId: new mongoose.Types.ObjectId(ids.orgA) }, { $set: { competitions: 'teams' } })
})

test('class-mates are suggested as friends by first name and initial; a learner elsewhere never is', async () => {
  for (const k of ['asha', 'bo', 'cy', 'out']) await me(k)
  const s = (await call('asha', 'GET', '/api/social/friends')).body.suggested
  assert.deepEqual(s.map((x) => x.name), ['Bo L.', 'Cy P.'])
  noEmails(s, 'suggestions')
  const asked = await call('asha', 'POST', '/api/social/friends', { cardId: s[0].id })
  assert.equal(asked.status, 201)
  assert.equal((await call('out', 'GET', '/api/social/friends')).body.suggested.length, 0)
})

test('Shorts: a feed of small lessons, the learner\'s own picks, and a break card count', async () => {
  const first = await call('fay', 'GET', '/api/shorts/feed?limit=6')
  assert.equal(first.status, 200)
  assert.equal(first.body.items.length, 6)
  assert.equal(first.body.needsPicks, true)
  assert.ok(first.body.breakEvery > 0)
  for (const it of first.body.items) {
    assert.ok(it.title && it.steps.length >= 1 && it.steps.every((s) => s.say && Array.isArray(s.draw)))
    assert.ok(it.quiz.options.length >= 2 && it.quiz.options[it.quiz.answer])
    assert.ok(!it.steps.some((s) => /\btap any\b/i.test(s.say)))
  }
  assert.equal(new Set(first.body.items.map((x) => x.id)).size, 6)
  assert.equal((await call('fay', 'PUT', '/api/shorts/picks', { themes: ['space', 'animals', 'not-a-theme'] })).body.picks.length, 2)
  const a = first.body.items[0]
  assert.equal((await call('fay', 'POST', '/api/shorts/events', { id: 'NOPE', kind: 'view' })).status, 404)
  assert.equal((await call('fay', 'POST', '/api/shorts/events', { id: a.id, kind: 'watched' })).status, 400)
  for (const kind of ['view', 'done', 'like', 'like']) assert.equal((await call('fay', 'POST', '/api/shorts/events', { id: a.id, kind })).status, 200)
  await call('fay', 'POST', '/api/shorts/events', { id: a.id, kind: 'quiz', correct: true })
  const next = await call('fay', 'GET', `/api/shorts/feed?limit=6&exclude=${first.body.items.map((x) => x.id).join(',')}`)
  assert.ok(next.body.items.every((x) => !first.body.items.some((y) => y.id === x.id)), 'the feed does not repeat itself')
  assert.equal(next.body.needsPicks, false)
  const liked = await call('fay', 'GET', '/api/shorts/liked')
  assert.deepEqual(liked.body.items.map((x) => x.id), [a.id]) // a heart counts once
  assert.equal(liked.body.items[0].liked, true)
})

test('"what they love": the parent and the group\'s teacher see a summary; nobody else does', async () => {
  const feed = await call('ana', 'GET', '/api/shorts/feed?limit=4')
  for (const it of feed.body.items.slice(0, 3)) { await call('ana', 'POST', '/api/shorts/events', { id: it.id, kind: 'view' }); await call('ana', 'POST', '/api/shorts/events', { id: it.id, kind: 'done' }) }
  await call('ana', 'POST', '/api/shorts/events', { id: feed.body.items[0].id, kind: 'like' })
  const seen = await app.call('GET', `/api/parent/children/${ids.childAna}/interests`, { token: P().mum })
  assert.equal(seen.status, 200)
  assert.equal(seen.body.interests.hasData, true)
  assert.deepEqual(seen.body.interests.totals, { views: 3, done: 3, likes: 1 })
  assert.equal(seen.body.interests.liked[0].title, feed.body.items[0].title)
  assert.ok(seen.body.interests.top.length >= 1)
  assert.equal(seen.body.interests.weeks.length, 6)
  assert.equal(seen.body.interests.weeks[5].done, 3)
  assert.equal((await app.call('GET', `/api/parent/children/${ids.childAna}/interests`, { token: P().stranger })).status, 404)

  await call('asha', 'PUT', '/api/shorts/picks', { themes: ['space'] })
  const one = await app.call('GET', `/api/teacher/students/${ids.asha}/interests`, { token: T().tA })
  assert.deepEqual(one.body.interests.picks, ['space'])
  assert.equal((await app.call('GET', `/api/teacher/students/${ids.asha}/interests`, { token: T().tA2 })).status, 404)
  assert.equal((await app.call('GET', `/api/teacher/students/${ids.asha}/interests`, { token: T().tB })).status, 404)
  assert.equal((await app.call('GET', `/api/teacher/students/${ids.out}/interests`, { token: T().tA })).status, 404)
  const group = await app.call('GET', `/api/teacher/groups/${ids.g}/interests`, { token: T().tA })
  assert.equal(group.body.interests.learners, 4)
  assert.deepEqual(group.body.interests.themes[0], { theme: 'space', learners: 1, done: 0 })
  noEmails(group.body, 'group interests')
  assert.equal((await app.call('GET', `/api/teacher/groups/${ids.g}/interests`, { token: T().tB })).status, 404)

  // The parent's switch turns the feed off.
  await app.call('PATCH', `/api/parent/children/${ids.childAna}/settings`, { token: P().mum, body: { together: { shorts: false } } })
  assert.equal((await call('ana', 'GET', '/api/shorts/feed')).body.code, 'SHORTS_OFF')
  await app.call('PATCH', `/api/parent/children/${ids.childAna}/settings`, { token: P().mum, body: { together: { shorts: true } } })
})

test('privacy: learning together is in the data export, without anyone else\'s email, and is erased with the learner', async () => {
  await befriend('ben', 'ana') // Ana's grown-up approves below
  const view = await app.call('GET', `/api/parent/children/${ids.childAna}/together`, { token: P().mum })
  await app.call('POST', `/api/parent/children/${ids.childAna}/together/friends/${view.body.friends.waitingForYou[0].id}/approve`, { token: P().mum })
  const exp = await app.call('GET', `/api/parent/children/${ids.childAna}/export`, { token: P().mum })
  assert.equal(exp.status, 200)
  const data = exp.body.export || exp.body.data || exp.body
  assert.ok(data.together.friendships.length >= 1)
  assert.ok(data.playerCard.length === 1 && data.shortsInterest.length === 1)
  assert.ok(!/ben@kids\.test/.test(JSON.stringify(data)), 'the friend is not named in the export')

  // Erased with the learner (the same cascade the deletion request runs).
  const base = `mongodb://${app.db.main.host}:${app.db.main.port}`
  Object.assign(process.env, { MONGODB_URI: `${base}/main`, ADMIN_MONGODB_URI: `${base}/admin`, SUPERADMIN_MONGODB_URI: `${base}/superadmin` })
  await mongoose.connect(process.env.MONGODB_URI)
  try {
    const { eraseLearner } = require('../../services/dataRights')
    const counts = await eraseLearner('ana@kids.test')
    assert.ok(counts.friendships >= 1)
    assert.equal(counts.playerCard, 1)
    assert.equal(counts.shortsInterest, 1)
    assert.equal(await app.db.main.collection('friendships').countDocuments({ emails: 'ana@kids.test' }), 0)
    assert.equal((await call('ben', 'GET', '/api/social/friends')).body.friends.some((f) => f.name === 'Ana'), false)
  } finally {
    await mongoose.disconnect()
  }
})

// ── Content v5: fair duels, camera game challenges, milestones and camera game badges ──
let camSeq = 0
const camRound = ({ gameId = 'ball-pop', stars = 2, level = 1, cleared = true, duelId, group = 'body', ago = 0 }) => {
  const at = new Date(Date.now() - ago * 86400000 - 60_000)
  return {
    clientSessionId: `duel-${camSeq++}`, gameId, engine: 'tap', title: gameId, group, domains: ['reachAccuracy'], duelId,
    startedAt: at.toISOString(), endedAt: new Date(at.getTime() + 60_000).toISOString(), durationMs: 60_000, activeMs: 58_000,
    outcome: 'completed', level, levelCleared: cleared, clearedBy: cleared ? 'criterion' : null, stars,
    summary: { trials: 10, correct: 8, near: 0, accuracyPct: 80, comprehensionPct: 80, independentPct: 70, medianLatencyMs: 900, medianMovementMs: 1200, pathEfficiency: 0.7 },
    trials: [{ accuracy: 'correct', latencyMs: 900 }],
  }
}

test('a friendly match is a fair duel: each answers their own questions, and both get a prize and a true award', async () => {
  await befriend('eve', 'fay')
  const fay = (await call('eve', 'GET', '/api/social/friends')).body.friends[0]
  const made = await call('eve', 'POST', '/api/social/matches', { friendId: fay.cardId, kind: 'friendly', subject: 'maths', module: 'read' })
  assert.equal(made.status, 201)
  const id = made.body.match.id
  const playE = (await call('eve', 'GET', `/api/social/matches/${id}/play`)).body
  const playF = (await call('fay', 'GET', `/api/social/matches/${id}/play`)).body
  assert.equal(playE.items.length, playF.items.length, 'the same number of questions')
  const answer = (items, right) => items.map((x, i) => ({ id: x.id, correct: i < right, firstTry: i < right }))
  await call('eve', 'POST', `/api/social/matches/${id}/result`, { results: answer(playE.items, playE.items.length) })
  const done = (await call('fay', 'POST', `/api/social/matches/${id}/result`, { results: answer(playF.items, 1) })).body.match
  assert.equal(done.status, 'done')
  assert.equal(done.result.prize, 'brave')
  const prizes = (who) => call(who, 'GET', '/api/social/trophies').then((r) => r.body.awards)
  const e = await prizes('eve'), f = await prizes('fay')
  assert.ok(e.some((a) => a.kind === 'ribbon') && f.some((a) => a.kind === 'brave'), 'a ribbon and a brave challenger prize')
  assert.ok(e.some((a) => a.kind === 'award' && a.award === 'sharp_first_try'), 'sharp first tries')
  assert.ok(f.some((a) => a.kind === 'award' && a.award === 'fair_play'), 'fair play for seeing it through')
  assert.ok(e.some((a) => a.source === 'milestone' && a.award === 'first_match'), 'the first friendly match milestone')
  noRanking(await call('eve', 'GET', '/api/social/home').then((r) => r.body), 'home')
})

test('a camera game challenge: the same game, each at their own level, the first finished round counts', async () => {
  const fay = (await call('eve', 'GET', '/api/social/friends')).body.friends[0]
  const bad = await call('eve', 'POST', '/api/social/duels', { friendId: fay.cardId, gameId: '../etc' })
  assert.equal(bad.status, 400)
  const made = await call('eve', 'POST', '/api/social/duels', { friendId: fay.cardId, gameId: 'ball-pop' })
  assert.equal(made.status, 201)
  const id = made.body.duel.id
  assert.equal(made.body.duel.kind, 'game')
  const home = (await call('fay', 'GET', '/api/social/home')).body
  assert.ok(home.matches.yourTurn.some((m) => m.id === id && m.kind === 'game'), 'shown with the rounds')
  noEmails(home, 'home with a duel')
  // Rounds come from the camera games; another game's round or an abandoned one does not count.
  await app.call('POST', '/api/ar/session', { token: S.eve, body: { session: { ...camRound({ gameId: 'other-game', stars: 3, duelId: id }) } } })
  await app.call('POST', '/api/ar/session', { token: S.eve, body: { session: { ...camRound({ stars: 2, level: 3, duelId: id }) } } })
  await app.call('POST', '/api/ar/session', { token: S.eve, body: { session: { ...camRound({ stars: 0, level: 3, duelId: id }) } } }) // a later round: ignored
  const waiting = (await call('eve', 'GET', `/api/social/duels/${id}`)).body.duel
  assert.equal(waiting.status, 'waiting')
  assert.equal(waiting.me.stars, 2)
  await app.call('POST', '/api/ar/session', { token: S.fay, body: { session: { ...camRound({ stars: 2, level: 1, duelId: id }) } } })
  const done = (await call('fay', 'GET', `/api/social/duels/${id}`)).body.duel
  assert.equal(done.status, 'done')
  assert.equal(done.result.draw, true, 'level 3 and level 1, two stars each: a draw')
  const f = (await call('fay', 'GET', '/api/social/trophies')).body.awards
  assert.ok(f.some((a) => a.kind === 'game_ribbon'), 'a draw gives both the ribbon')
  assert.ok(f.some((a) => a.source === 'milestone' && a.award === 'first_game_duel'))
})

test('camera game badges come from real rounds: first game, levels, keeping going', async () => {
  await app.call('POST', '/api/ar/sessions', { token: S.cal, body: { sessions: [
    camRound({ gameId: 'reach-1', level: 3, cleared: false, ago: 2 }),
    camRound({ gameId: 'reach-1', level: 3, cleared: true, ago: 1 }),
  ] } })
  const list = (await app.call('GET', '/api/dashboard/achievements', { token: S.cal })).body
  const earned = new Set((list.data || list.achievements || []).filter((a) => a.earned || a.earnedAt || a.unlocked).map((a) => a.id))
  for (const id of ['game_first', 'game_level_3', 'game_kept_going']) assert.ok(earned.has(id), `${id} in ${[...earned].join(',')}`)
  assert.ok(!earned.has('game_level_5'))
})
