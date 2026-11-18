// Pure pieces of the communication layer: privacy helpers, export safety,
// unsubscribe tokens, office hours, email templates and local time.
const test = require('node:test')
const assert = require('node:assert/strict')
const { firstNameInitial, leaderboardRows, benchmark, benchmarks } = require('../utils/minimise')
const { csvCell, safeCell } = require('../utils/exporter')
const { makeToken, readToken } = require('../utils/unsubscribe')
const { withinOfficeHours } = require('../services/commsLinks')
const { t, duration } = require('../i18n/emails')
const tpl = require('../templates/email/digests')
const { instantEmail } = require('../templates/email/notification')
const { localParts } = require('../services/digests')
const { modeFrom, describe } = require('../utils/notifyPrefs')
const { needsGuardianConsent } = require('../utils/consent')

test('leaderboards show first name + initial only', () => {
  assert.equal(firstNameInitial('Aanya Rao'), 'Aanya R.')
  assert.equal(firstNameInitial('  maria de la cruz '), 'Maria C.')
  assert.equal(firstNameInitial('ravi'), 'Ravi')
  assert.equal(firstNameInitial(''), 'Learner')
  const rows = leaderboardRows([{ name: 'Zed Young', email: 'z@x.test', score: 5 }, { name: 'Aanya Rao', email: 'a@x.test', score: 9, me: true }], { meKey: 'me' })
  assert.deepEqual(rows, [{ rank: 1, name: 'Aanya R.', score: 9, me: true }, { rank: 2, name: 'Zed Y.', score: 5 }])
  assert.ok(!JSON.stringify(rows).includes('@'))
})

test('benchmarks need at least 20 learners per bucket', () => {
  assert.equal(benchmark(Array.from({ length: 19 }, (_, i) => i)), null)
  assert.equal(benchmark(Array.from({ length: 30 }, () => 1), { min: 5 }).n, 30)
  assert.equal(benchmark(Array.from({ length: 10 }, () => 1), { min: 5 }), null, 'a smaller min cannot go under 20')
  const b = benchmark(Array.from({ length: 21 }, (_, i) => i))
  assert.deepEqual([b.n, b.median, b.mean], [21, 10, 10])
  assert.equal(benchmarks({ a: [1, 2], b: Array(25).fill(3) }).a, null)
  assert.equal(benchmarks({ a: [1, 2], b: Array(25).fill(3) }).b.n, 25)
})

test('exports neutralise spreadsheet formulas and quote CSV safely', () => {
  assert.equal(safeCell('=HYPERLINK("x")'), '\'=HYPERLINK("x")')
  assert.equal(safeCell('+1'), "'+1")
  assert.equal(safeCell(-4), -4)
  assert.equal(csvCell('a,b'), '"a,b"')
  assert.equal(csvCell('say "hi"'), '"say ""hi"""')
  assert.equal(csvCell(null), '')
})

test('unsubscribe tokens are signed and bound to one account and kind', () => {
  const tok = makeToken('parent:abc', 'weekly_digest')
  assert.deepEqual(readToken(tok), { owner: 'parent:abc', kind: 'weekly_digest' })
  const [payload, mac] = tok.split('.')
  const forged = Buffer.from(JSON.stringify(['parent:someone-else', 'weekly_digest'])).toString('base64url')
  assert.equal(readToken(`${forged}.${mac}`), null)
  assert.equal(readToken(`${payload}.AAAA`), null)
  assert.equal(readToken(''), null)
})

test('office hours: simple specs are understood in the given timezone', () => {
  const wedNoonUtc = new Date('2026-11-18T12:00:00Z')
  assert.equal(withinOfficeHours('Mon-Fri 08:00-16:00', { now: wedNoonUtc }), true)
  assert.equal(withinOfficeHours('Mon-Fri 08:00-11:00', { now: wedNoonUtc }), false)
  assert.equal(withinOfficeHours('Sat-Sun 08:00-16:00', { now: wedNoonUtc }), false)
  assert.equal(withinOfficeHours('08:00-16:00', { now: wedNoonUtc, tz: 'Asia/Kolkata' }), false) // 17:30 in India
  assert.equal(withinOfficeHours('whenever', { now: wedNoonUtc }), null)
})

test('local time for digests', () => {
  assert.deepEqual(localParts('UTC', new Date('2026-11-22T19:30:00Z')), { date: '2026-11-22', dow: 0, hour: 19 })
  assert.deepEqual(localParts('Asia/Kolkata', new Date('2026-11-22T19:30:00Z')), { date: '2026-11-23', dow: 1, hour: 1 })
  assert.equal(localParts('Not/AZone', new Date('2026-11-22T19:30:00Z')).date, '2026-11-22')
})

test('email strings: English, fallback, durations', () => {
  assert.equal(t('en', 'common.hi', { name: 'Priya' }), 'Hi Priya,')
  assert.equal(t('de', 'common.hi', { name: 'Priya' }), 'Hi Priya,', 'missing language falls back to English')
  assert.equal(duration(130), '2 h 10 min')
  assert.equal(duration(25), '25 min')
})

test('weekly parent email: warm story, 4 tiles, one idea, button, unsubscribe; table layout, no <style>', () => {
  const child = { name: 'Aanya', cur: { minutes: 130, answered: 86, accuracy: 81, activeDays: 5 }, prev: { minutes: 105, answered: 70, accuracy: 76 }, insights: [{ key: 'practise_next', params: { module: 'read', subject: 'maths', accuracy: 54 } }], url: 'https://app.test/parent-dashboard?child=1' }
  const m = tpl.parentWeeklyEmail({ name: 'Priya Rao', children: [child], unsubscribeUrl: 'https://api.test/u?t=x' })
  assert.equal(m.subject, "Aanya's week on Learnigo")
  assert.ok(m.html.includes('Hi Priya,'))
  assert.ok(m.html.includes('Aanya learned for 2 h 10 min this week, 25 min more than last week and answered 86 questions, 81 % of them right.'))
  for (const s of ['Time learning', 'Questions answered', 'Answers right', 'Days active', '5 of 7', 'Read · Maths', 'See Aanya&#39;s progress', 'https://api.test/u?t=x']) assert.ok(m.html.includes(s), s)
  assert.ok(!m.html.includes('<style') && !m.html.includes('display:flex'))
  assert.ok(m.text.includes('One idea for the week ahead'))
  const quiet = tpl.parentWeeklyEmail({ name: '', children: [{ ...child, cur: { minutes: 0, answered: 0, accuracy: null, activeDays: 0 }, insights: [{ key: 'no_activity', params: {} }] }] })
  assert.ok(quiet.html.includes('didn&#39;t learn on Learnigo this week. That&#39;s completely fine'))
})

test('templates escape user text', () => {
  const m = instantEmail({ role: 'parent', name: '<b>x</b>', title: 'New <script>', body: 'a & b', link: '/parent-dashboard' })
  assert.ok(!m.html.includes('<script>') && m.html.includes('&lt;script&gt;') && m.html.includes('a &amp; b'))
})

test('preferences: defaults, locked kinds, per-role lists', () => {
  assert.equal(modeFrom(null, 'message'), 'instant')
  assert.equal(modeFrom(null, 'at_risk'), 'digest')
  assert.equal(modeFrom({ kinds: [{ kind: 'security', mode: 'off' }] }, 'security'), 'instant')
  assert.equal(modeFrom({ kinds: [{ kind: 'message', mode: 'off' }] }, 'message'), 'off')
  assert.ok(describe(null, 'teacher').kinds.some((k) => k.kind === 'teacher_summary'))
  assert.ok(!describe(null, 'teacher').kinds.some((k) => k.kind === 'weekly_digest'))
})

test('guardian consent age (GDPR Art. 8)', () => {
  assert.equal(needsGuardianConsent(14, 'DE'), true)
  assert.equal(needsGuardianConsent(14, 'ES'), false)
  assert.equal(needsGuardianConsent(12, 'GB'), true)
  assert.equal(needsGuardianConsent(null, 'GB'), true)
})
