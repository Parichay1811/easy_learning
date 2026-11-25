/**
 * Demo data for learning together and Shorts (GAME-ROADMAP.md Phase 5), made through the
 * real API so it is exactly what the app would hold: player cards, friends (one waiting
 * for the parent's OK), rounds together, cheers, a finished class quest with its ceremony,
 * a running team match, and what the demo family's children like to watch.
 *
 *   const { seedTogetherDemo } = require('./seed-together-demo')
 *   await seedTogetherDemo(app, demo)        // app: test/integration/harness start(); demo: seedDemo()
 */
const mongoose = require('mongoose')

const DAY = 86400000

async function seedTogetherDemo(app, demo) {
  const { main, admin } = app.db
  const oid = (s) => new mongoose.Types.ObjectId(s)
  const batchId = demo.org.batchIds[0] // Year 4 Maths (Mr Sharma), Aanya's group
  const batch = await admin.collection('batches').findOne({ _id: oid(batchId) })
  const pupils = await admin.collection('students').find({ _id: { $in: batch.studentIds } }).sort({ name: 1 }).toArray()
  const tok = Object.fromEntries(pupils.map((p) => [p.name, app.tokens.student(p.email, p.name)]))
  const teacher = app.tokens.teacher(demo.org.tutorIds[0], demo.org.id, 'sharma@demo.test')
  const parent = app.tokens.parent(demo.family.parentId, demo.family.parentEmail)
  const call = (token, method, route, body) => app.call(method, route, { token, body, headers: { 'x-timezone': 'UTC' } })
  const as = (name, method, route, body) => call(tok[name], method, route, body)
  const counts = { cards: 0, friends: 0, rounds: 0, cheers: 0, competitions: 0, shorts: 0 }

  // Right answers over the last eight days for the whole group (what team stars are counted from).
  const now = Date.now()
  const answers = []
  pupils.forEach((p, i) => {
    for (let d = 8; d >= 0; d--) {
      if ((i + d) % 4 === 3) continue // nobody learns every single day
      const n = 4 + ((i * 3 + d * 5) % 9)
      for (let k = 0; k < n; k++) {
        // Some learners start a little unsure and get steadier (a comeback, an improvement).
        const miss = (i % 3 === 1 && d > 4 && k < 3) || (i % 4 === 2 && k === 0)
        answers.push({ email: p.email, module: 'read', subject: 'maths', question: '', userAnswer: '', correctAnswer: '', correct: !miss, xpEarned: miss ? 0 : 10, hintsUsed: i % 5 === 0 && k % 4 === 0 ? 1 : 0, mode: 'practice', timestamp: new Date(now - d * DAY - (9 - k) * 600000) })
      }
    }
  })
  if (answers.length) await main.collection('studentanswers').insertMany(answers)

  // Player cards for the group.
  const card = {}
  for (const p of pupils) { const r = await as(p.name, 'GET', '/api/social/me'); if (r.body?.me) { card[p.name] = r.body.me; counts.cards++ } }

  // Friends for Aanya: Kabir (her parent said yes), Diya (waiting for the parent), Rohan (asked her, not answered).
  const befriend = async (from, to) => {
    await as(from, 'POST', '/api/social/friends', { code: card[to].code })
    const inbox = (await as(to, 'GET', '/api/social/friends')).body
    const row = inbox.incoming.find((x) => x.name === from)
    return row ? as(to, 'POST', `/api/social/friends/${row.id}/accept`) : null
  }
  if (card.Aanya && card.Kabir && card.Diya && card.Rohan) {
    await befriend('Kabir', 'Aanya')
    const waiting = (await call(parent, 'GET', `/api/parent/children/${demo.family.childIds[0]}/together`)).body
    const kabir = waiting.friends?.waitingForYou?.find((x) => x.name === 'Kabir')
    if (kabir) { await call(parent, 'POST', `/api/parent/children/${demo.family.childIds[0]}/together/friends/${kabir.id}/approve`); counts.friends++ }
    await befriend('Diya', 'Aanya')
    await as('Rohan', 'POST', '/api/social/friends', { code: card.Aanya.code })
    // Kabir and Diya are friends with each other too.
    if ((await befriend('Kabir', 'Diya'))?.body?.status === 'active') counts.friends++

    // Rounds together: one finished buddy round, one friendly match where it is Aanya's turn.
    const play = async (who, id, right) => {
      const items = (await as(who, 'GET', `/api/social/matches/${id}/play`)).body.items || []
      return as(who, 'POST', `/api/social/matches/${id}/result`, { results: items.map((it, i) => ({ id: it.id, correct: i < right, firstTry: i < right })) })
    }
    const made = await as('Aanya', 'POST', '/api/social/matches', { friendId: card.Kabir.id, kind: 'buddy', subject: 'maths', module: 'read' })
    if (made.status === 201) {
      await play('Aanya', made.body.match.id, 4); await play('Kabir', made.body.match.id, 3); counts.rounds++
      const next = await as('Kabir', 'POST', '/api/social/matches', { friendId: card.Aanya.id, kind: 'friendly', subject: 'maths', module: 'read' })
      if (next.status === 201) { await play('Kabir', next.body.match.id, 4); counts.rounds++ }
    }
    for (const [sticker, line] of [['star', 'great_job'], ['highfive', 'well_played']]) {
      if ((await as('Kabir', 'POST', '/api/social/cheers', { to: card.Aanya.id, sticker, line })).status === 201) counts.cheers++
    }
  }

  // A class quest that ran last week (so its ceremony is there), and a team match running now.
  const quest = await call(teacher, 'POST', `/api/teacher/groups/${batchId}/competitions`, { title: 'Times tables quest', kind: 'quest', days: 5, starsPerLearnerPerDay: 4 })
  if (quest.status === 201) {
    await main.collection('teammatches').updateOne({ _id: oid(quest.body.competition.id) }, { $set: { startsAt: new Date(now - 8 * DAY), endsAt: new Date(now - 3 * DAY) } })
    await call(teacher, 'GET', `/api/teacher/competitions/${quest.body.competition.id}`) // its time is up: the ceremony is written
    counts.competitions++
  }
  const match = await call(teacher, 'POST', `/api/teacher/groups/${batchId}/competitions`, { title: 'Fractions week', kind: 'teams', teams: 2, days: 5, starsPerLearnerPerDay: 5 })
  if (match.status === 201) {
    await main.collection('teammatches').updateOne({ _id: oid(match.body.competition.id) }, { $set: { startsAt: new Date(now - 2 * DAY), endsAt: new Date(now + 3 * DAY) } })
    counts.competitions++
  }

  // Shorts: what the demo family's children (and a few class-mates) like.
  const likes = { Aanya: ['space', 'animals'], Kabir: ['machines', 'space'], Diya: ['animals', 'nature'], Rohan: ['numbers'] }
  const watch = async (token, picks, n) => {
    await call(token, 'PUT', '/api/shorts/picks', { themes: picks })
    const seen = []
    for (let page = 0; page < 3 && seen.length < n; page++) {
      const feed = (await call(token, 'GET', `/api/shorts/feed?limit=8${seen.length ? `&exclude=${seen.join(',')}` : ''}`)).body
      for (const it of feed.items || []) {
        if (seen.length >= n) break
        seen.push(it.id)
        await call(token, 'POST', '/api/shorts/events', { id: it.id, kind: 'view' })
        const fav = picks.includes(it.theme)
        if (fav || seen.length % 3 === 0) await call(token, 'POST', '/api/shorts/events', { id: it.id, kind: 'done' })
        if (fav && seen.length % 2 === 0) await call(token, 'POST', '/api/shorts/events', { id: it.id, kind: 'like' })
        counts.shorts++
      }
    }
  }
  for (const [name, picks] of Object.entries(likes)) if (tok[name]) await watch(tok[name], picks, name === 'Aanya' ? 14 : 6)
  await watch(app.tokens.student('sam.solo@demo.test', 'Sam'), ['nature', 'words'], 9)

  return counts
}

module.exports = { seedTogetherDemo }
