// Parent role end to end: managed learners and their sign-in, co-guardians,
// revoking links, family settings, cheers, AI Teacher usage, deeper views, the
// report and its share links, and the privacy centre with export and deletion.
const test = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const { start } = require('./harness')

let app
const oid = () => new mongoose.Types.ObjectId()
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(new Date())
const ids = {}
const P = {} // tokens

test.before(async () => {
  app = await start()
  const { main } = app.db
  ids.mum = oid(); ids.dad = oid(); ids.stranger = oid(); ids.gran = oid()
  await main.collection('parentaccounts').insertMany([
    { _id: ids.mum, uid: 'p-mum', email: 'mum@family.test', name: 'Priya Rao', plan: 'family_plus' },
    { _id: ids.dad, uid: 'p-dad', email: 'dad@family.test', name: 'Arun Rao', plan: 'free' },
    { _id: ids.stranger, uid: 'p-x', email: 'x@other.test', name: 'Stranger', plan: 'family_plus' },
    { _id: ids.gran, uid: 'p-gran', email: 'gran@family.test', name: 'Gran', plan: 'free' },
  ])
  P.mum = app.tokens.parent(String(ids.mum), 'mum@family.test')
  P.dad = app.tokens.parent(String(ids.dad), 'dad@family.test')
  P.stranger = app.tokens.parent(String(ids.stranger), 'x@other.test')
  P.gran = app.tokens.parent(String(ids.gran), 'gran@family.test')
  // A pending (unverified) link of the stranger to a real learner.
  const pend = oid()
  await main.collection('children').insertOne({ _id: pend, parentId: ids.stranger, name: 'Someone', age: 9, email: 'someone@kids.test', linkStatus: 'pending' })
  ids.pending = String(pend)
})
test.after(async () => { await app?.stop() })

test('managed learner: a parent creates a child account and the child signs in with code + pictures', async () => {
  const bad = await app.call('POST', '/api/parent/children/managed', { token: P.mum, body: { name: '', age: 7 } })
  assert.equal(bad.status, 400)
  const r = await app.call('POST', '/api/parent/children/managed', { token: P.mum, body: { name: 'Mira', age: 7, avatar: '🦊' } })
  assert.equal(r.status, 201)
  assert.match(r.body.loginCode, /^[A-Z2-9]{3} [A-Z2-9]{3}$/)
  assert.equal(r.body.picturePassword.length, 3)
  assert.equal(r.body.child.linkStatus, 'verified')
  assert.equal(r.body.child.verifiedBy, 'parent_created')
  assert.match(r.body.child.email, /^ml-[a-f0-9]{24}@managed\.learnigo\.invalid$/)
  ids.mira = r.body.child._id; ids.miraEmail = r.body.child.email
  ids.miraCode = r.body.loginCode; ids.miraPics = r.body.picturePassword

  // Nothing secret is stored in clear.
  const ml = await app.db.main.collection('managedlearners').findOne({ email: ids.miraEmail })
  assert.ok(ml && !JSON.stringify(ml).includes(ids.miraCode.replace(' ', '')))

  // Wrong pictures and an unknown code get the same answer (no enumeration).
  const wrongPics = ids.miraPics.map((p) => (p === 'dog' ? 'cat' : 'dog'))
  const w1 = await app.call('POST', '/api/auth/managed-login', { body: { loginCode: ids.miraCode, picture: wrongPics } })
  const w2 = await app.call('POST', '/api/auth/managed-login', { body: { loginCode: 'ZZZ 999', picture: ids.miraPics } })
  assert.equal(w1.status, 401); assert.equal(w2.status, 401)
  assert.equal(w1.body.message, w2.body.message)

  const ok = await app.call('POST', '/api/auth/managed-login', { body: { loginCode: ids.miraCode.toLowerCase(), picture: ids.miraPics } })
  assert.equal(ok.status, 200)
  assert.equal(ok.body.user.name, 'Mira')
  ids.miraToken = ok.body.token
  // The token works like any learner's: learning is logged under the synthetic email.
  for (let i = 0; i < 6; i++) {
    const a = await app.call('POST', '/api/dashboard/log-answer', { token: ids.miraToken, headers: { 'x-timezone': 'UTC' }, body: { module: 'read', subject: 'maths', correct: i % 3 !== 0, timeTaken: i === 5 ? 40 : 5, question: `Count ${i}`, userAnswer: '3', correctAnswer: '4', questionId: 'MA-RD-T01-Q01', topic: 'number sense', hintsUsed: i === 1 ? 1 : 0 } })
    assert.equal(a.status, 200)
  }
  await app.call('POST', '/api/dashboard/log-session', { token: ids.miraToken, headers: { 'x-timezone': 'UTC' }, body: { module: 'read', subject: 'maths', durationMinutes: 25 } })
  const ov = await app.call('GET', `/api/parent/children/${ids.mira}/analytics/overview`, { token: P.mum })
  assert.equal(ov.status, 200)
  assert.equal(ov.body.totals.answered, 6)

  // A new card makes the old one stop working.
  const reset = await app.call('POST', `/api/parent/children/${ids.mira}/managed/reset`, { token: P.mum })
  assert.equal(reset.status, 200)
  assert.equal((await app.call('POST', '/api/auth/managed-login', { body: { loginCode: ids.miraCode, picture: ids.miraPics } })).status, 401)
  ids.miraCode = reset.body.loginCode; ids.miraPics = reset.body.picturePassword
  assert.equal((await app.call('POST', '/api/auth/managed-login', { body: { loginCode: ids.miraCode, picture: ids.miraPics } })).status, 200)
})

test('managed login is rate limited per code', async () => {
  let last
  for (let i = 0; i < 8; i++) last = await app.call('POST', '/api/auth/managed-login', { body: { loginCode: 'QQQ 222', picture: ['dog', 'dog', 'dog'] } })
  assert.equal(last.status, 429)
})

test('co-guardians: invite by email, accept only with that email, see the child, be removed', async () => {
  const inv = await app.call('POST', `/api/parent/children/${ids.mira}/guardians/invite`, { token: P.mum, body: { email: 'dad@family.test' } })
  assert.equal(inv.status, 201)
  const mail = await app.db.main.collection('outboxes').findOne({ to: 'dad@family.test', kind: 'guardian_invite' })
  assert.ok(mail && /invite=/.test(mail.html))
  const token = /invite=([A-Za-z0-9_-]+)/.exec(mail.html)[1]

  // A forwarded link doesn't work for someone else.
  const other = await app.call('POST', '/api/parent/guardian-invites/accept', { token: P.gran, body: { token } })
  assert.equal(other.status, 403)
  // Dad sees the invite waiting for his email and accepts it.
  const mine = await app.call('GET', '/api/parent/guardian-invites', { token: P.dad })
  assert.equal(mine.body.invites.length, 1)
  assert.equal(mine.body.invites[0].childName, 'Mira')
  const acc = await app.call('POST', '/api/parent/guardian-invites/accept', { token: P.dad, body: { inviteId: mine.body.invites[0].id } })
  assert.equal(acc.status, 200)
  assert.equal(acc.body.child.verifiedBy, 'co_guardian')
  ids.dadMira = acc.body.child._id
  assert.equal((await app.call('GET', `/api/parent/children/${ids.dadMira}/analytics/overview`, { token: P.dad })).status, 200)
  // Used invites can't be reused.
  assert.equal((await app.call('POST', '/api/parent/guardian-invites/accept', { token: P.dad, body: { token } })).status, 404)

  const g = await app.call('GET', `/api/parent/children/${ids.mira}/guardians`, { token: P.mum })
  assert.equal(g.body.guardians.length, 2)
  const dadRow = g.body.guardians.find((x) => !x.you)
  assert.equal(dadRow.removable, true)
  // A co-guardian can't invite or remove.
  assert.equal((await app.call('POST', `/api/parent/children/${ids.dadMira}/guardians/invite`, { token: P.dad, body: { email: 'gran@family.test' } })).status, 403)
  assert.equal((await app.call('DELETE', `/api/parent/children/${ids.dadMira}/guardians/${ids.mira}`, { token: P.dad })).status, 403)
  // Each guardian has their own notification preferences.
  await app.call('PATCH', `/api/parent/children/${ids.dadMira}/settings`, { token: P.dad, body: { notifyPrefs: { weeklyDigest: false } } })
  const rows = await app.db.main.collection('children').find({ email: ids.miraEmail }).toArray()
  assert.equal(rows.find((r) => String(r.parentId) === String(ids.dad)).notifyPrefs.weeklyDigest, false)
  assert.equal(rows.find((r) => String(r.parentId) === String(ids.mum)).notifyPrefs.weeklyDigest, true)
  // The stranger can't touch Mira at all.
  assert.equal((await app.call('GET', `/api/parent/children/${ids.mira}/guardians`, { token: P.stranger })).status, 404)

  // The main guardian removes the co-guardian: from then on he sees nothing.
  const rm = await app.call('DELETE', `/api/parent/children/${ids.mira}/guardians/${dadRow.id}`, { token: P.mum })
  assert.equal(rm.status, 200)
  assert.equal((await app.call('GET', `/api/parent/children/${ids.dadMira}/analytics/overview`, { token: P.dad })).status, 403)
  const audits = await app.db.main.collection('auditevents').find({ action: { $in: ['guardian.invite', 'guardian.accept', 'guardian.remove', 'learner.managed_create'] } }).toArray()
  assert.equal(new Set(audits.map((a) => a.action)).size, 4)
})

test('revoking: a guardian can drop their own link; the only guardian of a managed child cannot strand it', async () => {
  const strand = await app.call('POST', `/api/parent/children/${ids.mira}/revoke`, { token: P.mum })
  assert.equal(strand.status, 409)
  assert.equal((await app.call('DELETE', `/api/parent/children/${ids.mira}`, { token: P.mum })).status, 409)
  // Gran links to an ordinary learner by code-less pending link, then a school-free verified row we seed, and revokes it.
  const row = oid()
  await app.db.main.collection('children').insertOne({ _id: row, parentId: ids.gran, name: 'Leo', age: 10, email: 'leo@kids.test', linkStatus: 'verified', verifiedBy: 'child_code', guardianRole: 'primary' })
  assert.equal((await app.call('GET', `/api/parent/children/${row}/analytics/overview`, { token: P.gran })).status, 200)
  assert.equal((await app.call('POST', `/api/parent/children/${row}/revoke`, { token: P.gran })).status, 200)
  const after = await app.call('GET', `/api/parent/children/${row}/analytics/overview`, { token: P.gran })
  assert.equal(after.status, 403)
})

test('settings: first-run setup, weekly goal and healthy use reach the learner', async () => {
  const bad = await app.call('PATCH', `/api/parent/children/${ids.mira}/settings`, { token: P.mum, body: { weeklyGoal: { minutesPerDay: 2, daysPerWeek: 9 } } })
  assert.equal(bad.status, 400)
  const badQuiet = await app.call('PATCH', `/api/parent/children/${ids.mira}/settings`, { token: P.mum, body: { healthyUse: { quietStart: '25:00', quietEnd: '07:00' } } })
  assert.equal(badQuiet.status, 400)
  const ok = await app.call('PATCH', `/api/parent/children/${ids.mira}/settings`, {
    token: P.mum,
    body: { grade: 'Year 2', language: 'en', weeklyGoal: { minutesPerDay: 20, daysPerWeek: 5, reward: 'Pizza night', rewardEmoji: '🍕' }, healthyUse: { dailyLimitMin: 20, quietStart: '00:00', quietEnd: '00:01', breakEveryMin: 15 }, onboarded: true },
  })
  assert.equal(ok.status, 200)
  assert.ok(ok.body.child.onboardedAt)
  const goal = await app.call('GET', `/api/parent/children/${ids.mira}/goal`, { token: P.mum, headers: { 'x-timezone': 'UTC' } })
  assert.equal(goal.body.progress.days.length, 7)
  assert.equal(goal.body.progress.days.find((d) => d.date === today).met, true) // 25 min logged today
  // The learner sees the goal, the reward and that today's limit (20 min) is reached.
  const fam = await app.call('GET', '/api/dashboard/family', { token: ids.miraToken, headers: { 'x-timezone': 'UTC' } })
  assert.equal(fam.status, 200)
  assert.equal(fam.body.goal.reward, 'Pizza night')
  assert.equal(fam.body.healthy.limitReached, true)
  assert.equal(fam.body.healthy.breakEveryMin, 15)
  // An unrelated learner sees no family data.
  const lone = await app.call('GET', '/api/dashboard/family', { token: app.tokens.student('lonely@kids.test') })
  assert.equal(lone.body.linked, false)
})

test('cheers: sent by a parent, shown to the child once, voice note only for that child', async () => {
  assert.equal((await app.call('POST', `/api/parent/children/${ids.mira}/cheers`, { token: P.mum, body: { sticker: 'nope' } })).status, 400)
  const voice = Buffer.from('fake-opus-bytes').toString('base64')
  const c = await app.call('POST', `/api/parent/children/${ids.mira}/cheers`, { token: P.mum, body: { sticker: 'star', message: 'So proud of you!', voice, voiceType: 'audio/webm;codecs=opus' } })
  assert.equal(c.status, 201)
  const fam = await app.call('GET', '/api/dashboard/family', { token: ids.miraToken })
  assert.equal(fam.body.cheers.length, 1)
  assert.equal(fam.body.cheers[0].fromName, 'Priya')
  const cid = fam.body.cheers[0].id
  const other = app.tokens.student('lonely@kids.test')
  assert.equal((await app.call('POST', `/api/dashboard/cheers/${cid}/seen`, { token: other })).status, 404)
  const v = await fetch(`${app.url}/api/dashboard/cheers/${cid}/voice`, { headers: { authorization: `Bearer ${ids.miraToken}` } })
  assert.equal(v.status, 200)
  assert.equal(v.headers.get('content-type'), 'audio/webm')
  assert.equal((await fetch(`${app.url}/api/dashboard/cheers/${cid}/voice`, { headers: { authorization: `Bearer ${other}` } })).status, 404)
  assert.equal((await app.call('POST', `/api/dashboard/cheers/${cid}/seen`, { token: ids.miraToken })).status, 200)
  assert.equal((await app.call('GET', '/api/dashboard/family', { token: ids.miraToken })).body.cheers.length, 0)
})

test('AI Teacher usage: logged as topics (not free text) and shown to the parent', async () => {
  assert.equal((await app.call('POST', '/api/dashboard/ai-teacher-log', { token: ids.miraToken, body: { topic: 'why is the sky blue?', seconds: 60 } })).status, 400)
  assert.equal((await app.call('POST', '/api/dashboard/ai-teacher-log', { body: { topic: 'PHYS-01', seconds: 60 } })).status, 401)
  const r = await app.call('POST', '/api/dashboard/ai-teacher-log', { token: ids.miraToken, headers: { 'x-timezone': 'UTC' }, body: { topic: 'SCI-LIGHT-02', title: 'Why the sky is blue', subject: 'Science', seconds: 300 } })
  assert.equal(r.status, 200)
  const ai = await app.call('GET', `/api/parent/children/${ids.mira}/analytics/ai-teacher`, { token: P.mum })
  assert.equal(ai.body.topics[0].title, 'Why the sky is blue')
  assert.equal(ai.body.minutes, 5)
  const day = await app.db.main.collection('learnerdays').findOne({ email: ids.miraEmail, date: today })
  assert.equal(day.minutes, 30) // 25 min of practice + 5 min with the AI Teacher
})

test('deeper views: question review with filters, sources, trends, skills, screen time, AR, milestones', async () => {
  const all = await app.call('GET', `/api/parent/children/${ids.mira}/answers`, { token: P.mum })
  assert.equal(all.status, 200)
  assert.equal(all.body.answers.length, 6)
  const wrong = await app.call('GET', `/api/parent/children/${ids.mira}/answers?filter=wrong`, { token: P.mum })
  assert.equal(wrong.body.answers.length, 2)
  assert.ok(wrong.body.answers.every((a) => a.correct === false))
  const hint = await app.call('GET', `/api/parent/children/${ids.mira}/answers?filter=hint`, { token: P.mum })
  assert.equal(hint.body.answers.length, 1)
  const slow = await app.call('GET', `/api/parent/children/${ids.mira}/answers?filter=slow`, { token: P.mum })
  assert.equal(slow.body.answers.length, 1)
  assert.equal(slow.body.answers[0].timeSec, 40)

  const src = await app.call('GET', `/api/parent/children/${ids.mira}/analytics/sources`, { token: P.mum })
  assert.equal(src.body.sources.practice.answered, 6)
  assert.equal(src.body.sources.warrior.answered, 0)
  const tr = await app.call('GET', `/api/parent/children/${ids.mira}/analytics/trends`, { token: P.mum })
  assert.equal(tr.status, 200)
  assert.equal(tr.body.current.answered, 6)
  const sk = await app.call('GET', `/api/parent/children/${ids.mira}/analytics/skills`, { token: P.mum })
  assert.equal(sk.body.level, 'module_subject') // too few topic-tagged answers yet
  assert.equal(sk.body.groups.find((g) => g.subject === 'maths').skills.find((s) => s.module === 'read').answered, 6)
  const st = await app.call('GET', `/api/parent/children/${ids.mira}/analytics/screen-time`, { token: P.mum })
  assert.equal(st.body.minutes, 30)
  await app.db.main.collection('arsessions').insertOne({ email: ids.miraEmail, clientSessionId: 'x1', gameId: 'pop', title: 'Bubble Pop', startedAt: new Date(), activeMs: 120000, summary: { accuracyPct: 80, medianLatencyMs: 900, pathEfficiency: 0.8, byHand: { left: { trials: 5 }, right: { trials: 5 } } } })
  const ar = await app.call('GET', `/api/parent/children/${ids.mira}/analytics/ar`, { token: P.mum })
  assert.equal(ar.body.sessions, 1)
  assert.equal(ar.body.games[0].title, 'Bubble Pop')
  assert.ok(/not a medical/i.test(ar.body.disclaimer))
  const ms = await app.call('GET', `/api/parent/children/${ids.mira}/analytics/milestones`, { token: P.mum })
  assert.equal(ms.body.milestones[0].key, 'first_day')
})

test('every new child endpoint refuses an unverified link and another parent\'s child', async () => {
  const paths = ['answers', 'analytics/sources', 'analytics/trends', 'analytics/skills', 'analytics/ai-teacher', 'analytics/screen-time', 'analytics/ar', 'analytics/milestones', 'analytics/year', 'report', 'report-shares', 'privacy', 'export', 'guardians', 'goal', 'cheers', 'activity.csv']
  for (const p of paths) {
    const pend = await app.call('GET', `/api/parent/children/${ids.pending}/${p}`, { token: P.stranger })
    assert.equal(pend.status, 403, `pending ${p}`)
    const other = await app.call('GET', `/api/parent/children/${ids.mira}/${p}`, { token: P.stranger })
    assert.equal(other.status, 404, `stranger ${p}`)
    assert.equal((await app.call('GET', `/api/parent/children/${ids.mira}/${p}`)).status, 401, `anon ${p}`)
  }
  assert.equal((await app.call('PATCH', `/api/parent/children/${ids.pending}/settings`, { token: P.stranger, body: { grade: 'x' } })).status, 403)
  assert.equal((await app.call('POST', `/api/parent/children/${ids.pending}/cheers`, { token: P.stranger, body: { sticker: 'star' } })).status, 403)
})

test('report: Family Plus only; share links are read-only, 7 days, revocable and audited', async () => {
  // Gran is on the free plan: a friendly 402, not an error page.
  const row = oid()
  await app.db.main.collection('children').insertOne({ _id: row, parentId: ids.gran, name: 'Tia', age: 8, email: 'tia@kids.test', linkStatus: 'verified', verifiedBy: 'child_code' })
  const locked = await app.call('GET', `/api/parent/children/${row}/report`, { token: P.gran })
  assert.equal(locked.status, 402)
  assert.equal(locked.body.code, 'MODULE_LOCKED')

  const rep = await app.call('GET', `/api/parent/children/${ids.mira}/report?from=${today}&to=${today}`, { token: P.mum })
  assert.equal(rep.status, 200)
  assert.equal(rep.body.report.totals.answered, 6)
  assert.ok(rep.body.report.story.includes('Mira'))

  const sh = await app.call('POST', `/api/parent/children/${ids.mira}/report-shares`, { token: P.mum, body: { from: today, to: today, label: 'For Gran' } })
  assert.equal(sh.status, 201)
  const days = (new Date(sh.body.share.expiresAt) - Date.now()) / 86400000
  assert.ok(days > 6.9 && days <= 7)
  const pub = await app.call('GET', `/api/public/report/${sh.body.token}`)
  assert.equal(pub.status, 200)
  assert.equal(pub.body.report.totals.answered, 6)
  assert.equal(pub.body.report.child.name, 'Mira')
  assert.ok(!JSON.stringify(pub.body).includes(ids.miraEmail)) // no email in the shared page
  assert.equal((await app.call('GET', `/api/public/report/${'x'.repeat(32)}`)).status, 404)
  // Only the owner can revoke; afterwards the link is dead.
  assert.equal((await app.call('DELETE', `/api/parent/children/${ids.mira}/report-shares/${sh.body.share.id}`, { token: P.stranger })).status, 404)
  assert.equal((await app.call('DELETE', `/api/parent/children/${ids.mira}/report-shares/${sh.body.share.id}`, { token: P.mum })).status, 200)
  assert.equal((await app.call('GET', `/api/public/report/${sh.body.token}`)).status, 404)
  // Expired links are dead too.
  const sh2 = await app.call('POST', `/api/parent/children/${ids.mira}/report-shares`, { token: P.mum, body: { from: today, to: today } })
  await app.db.main.collection('reportshares').updateOne({ _id: new mongoose.Types.ObjectId(sh2.body.share.id) }, { $set: { expiresAt: new Date(Date.now() - 1000) } })
  assert.equal((await app.call('GET', `/api/public/report/${sh2.body.token}`)).status, 404)
  const acts = (await app.db.main.collection('auditevents').find({ action: /^report\./ }).toArray()).map((a) => a.action)
  for (const a of ['report.share_create', 'report.share_view', 'report.share_revoke']) assert.ok(acts.includes(a), a)

  const yr = await app.call('GET', `/api/parent/children/${ids.mira}/analytics/year`, { token: P.mum })
  assert.equal(yr.status, 200)
  assert.equal(yr.body.answered, 6)
})

test('privacy centre: what we store, who sees it, export everything, delete after the grace period', async () => {
  const pv = await app.call('GET', `/api/parent/children/${ids.mira}/privacy`, { token: P.mum })
  assert.equal(pv.status, 200)
  assert.ok(pv.body.whoCanSee.some((w) => w.kind === 'guardian' && w.you))
  assert.ok(pv.body.consentHistory.some((c) => c.action === 'guardian_consent'))

  const ex = await fetch(`${app.url}/api/parent/children/${ids.mira}/export`, { headers: { authorization: `Bearer ${P.mum}` } })
  assert.equal(ex.status, 200)
  assert.match(ex.headers.get('content-disposition'), /attachment/)
  const data = await ex.json()
  assert.equal(data.answers.length, 6)
  assert.ok(data.learnerDays.length >= 1)
  assert.ok(data.managedAccount)
  const text = JSON.stringify(data)
  assert.ok(!/pictureHash|loginCodeHash|tokenHash|codeHash/.test(text))
  assert.ok(await app.db.main.collection('auditevents').findOne({ action: 'learner.export' }))

  // Deletion: confirm by typing the name; cancel within the grace period; ask again.
  assert.equal((await app.call('POST', `/api/parent/children/${ids.mira}/delete-request`, { token: P.mum, body: { confirm: 'wrong' } })).status, 400)
  const d1 = await app.call('POST', `/api/parent/children/${ids.mira}/delete-request`, { token: P.mum, body: { confirm: 'mira', reason: 'Moving to another app' } })
  assert.equal(d1.status, 201)
  const grace = (new Date(d1.body.request.dueAt) - Date.now()) / 86400000
  assert.ok(grace > 29.9 && grace <= 30)
  assert.equal((await app.call('DELETE', `/api/parent/children/${ids.mira}/delete-request/${d1.body.request.id}`, { token: P.mum })).status, 200)
  const d2 = await app.call('POST', `/api/parent/children/${ids.mira}/delete-request`, { token: P.mum, body: { confirm: 'Mira' } })
  assert.equal(d2.status, 201)
  assert.equal((await app.call('POST', `/api/parent/children/${ids.mira}/delete-request`, { token: P.mum, body: { confirm: 'Mira' } })).body.existing, true)

  // Super admin queue: a parent can't use it; approval + due date -> the real cascade.
  assert.equal((await app.call('GET', '/api/superadmin/data-requests', { token: P.mum })).status, 401)
  const sa = app.tokens.superadmin()
  const list = await app.call('GET', '/api/superadmin/data-requests?status=pending&kind=delete', { token: sa })
  assert.equal(list.body.requests.length, 1)
  assert.equal((await app.call('POST', `/api/superadmin/data-requests/${d2.body.request.id}/approve`, { token: sa })).status, 200)
  // Not due yet: nothing is erased.
  assert.equal((await app.call('POST', '/api/superadmin/data-requests/run-due', { token: sa })).body.erased, 0)
  await app.db.main.collection('datarequests').updateOne({ _id: new mongoose.Types.ObjectId(d2.body.request.id) }, { $set: { dueAt: new Date(Date.now() - 1000) } })
  const run = await app.call('POST', '/api/superadmin/data-requests/run-due', { token: sa })
  assert.equal(run.body.erased, 1)
  for (const col of ['learnerdays', 'learningevents', 'studentanswers', 'children', 'managedlearners', 'cheers', 'arsessions', 'reportshares']) {
    const n = await app.db.main.collection(col).countDocuments(col === 'cheers' || col === 'reportshares' ? { learnerEmail: ids.miraEmail } : { email: ids.miraEmail })
    assert.equal(n, 0, col)
  }
  assert.equal((await app.call('POST', '/api/auth/managed-login', { body: { loginCode: ids.miraCode, picture: ids.miraPics } })).status, 401)
  const req = await app.db.main.collection('datarequests').findOne({ _id: new mongoose.Types.ObjectId(d2.body.request.id) })
  assert.equal(req.status, 'done')
  assert.ok(await app.db.main.collection('auditevents').findOne({ action: 'learner.erase' }))
})
