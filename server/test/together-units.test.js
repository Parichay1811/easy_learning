// Unit tests for the "everybody wins" rules of learning together (docs/learning/GAME-ROADMAP.md
// Phase 5), no database: balanced teams, one true award for every participant, the grown-ups'
// switches (the strictest wins), the questions two learners share, what a short is made of,
// and how the Shorts feed weighs a learner's own picks.
require('./helpers') // no database connections
const test = require('node:test')
const assert = require('node:assert/strict')
const cfg = require('../config/social')
const { balance, pickAwards, clean } = require('../services/social/teams')
const { strictest } = require('../services/social/guard')
const { pickItems } = require('../services/social/matches')
const { firstNameOf, nickText, newCode } = require('../services/social/cards')
const catalog = require('../services/shorts/catalog')
const { weights, weekKey } = require('../services/shorts/feed')
const { summarise } = require('../services/shorts/interests')
const { weekStart } = require('../services/social/jar')

const kids = (n) => Array.from({ length: n }, (_, i) => `k${i}@kids.test`)

test('teams are the same size (within one) and close in strength', () => {
  const members = kids(11)
  const recent = new Map(members.map((e, i) => [e, (i * 7) % 40]))
  for (const teamsWanted of [2, 3, 4]) {
    const teams = balance(members, recent, teamsWanted, 'seed')
    assert.equal(teams.length, teamsWanted)
    assert.deepEqual([...teams.flat()].sort(), [...members].sort()) // everyone is in exactly one team
    const sizes = teams.map((t) => t.length)
    assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1)
    const strength = teams.map((t) => t.reduce((s, e) => s + recent.get(e), 0) / t.length)
    assert.ok(Math.max(...strength) - Math.min(...strength) <= 12, `teams of ${teamsWanted}: ${strength.map(Math.round)}`)
  }
  assert.deepEqual(balance(members, recent, 2, 'a'), balance(members, recent, 2, 'a')) // the same seed, the same teams
})

test('every participant gets exactly one award, each true for them, and nobody gets "last"', () => {
  const members = kids(6)
  const d = new Map([
    [members[0], { right: 30, noHint: 28, comebacks: 0, improved: 0, areas: 1 }],
    [members[1], { right: 12, noHint: 4, comebacks: 3, improved: 2, areas: 2 }],
    [members[2], { right: 9, noHint: 2, comebacks: 0, improved: 25, firstHalf: 50, secondHalf: 75, areas: 2 }],
    [members[3], { right: 4, noHint: 1, comebacks: 0, improved: 0, areas: 5 }],
    [members[4], { right: 2, noHint: 0, comebacks: 0, improved: 0, areas: 1 }],
    [members[5], { right: 0, noHint: 0, comebacks: 0, improved: 0, areas: 0 }],
  ])
  const cheers = new Map([[members[4], { days: 2, cheers: 4 }]])
  const got = pickAwards(members, d, cheers, [members[0], null])
  assert.equal(got.size, 6)
  assert.equal(got.get(members[1]).award, 'best_comeback')
  assert.deepEqual(got.get(members[2]), { award: 'most_improved', evidence: { from: 50, to: 75 } })
  assert.equal(got.get(members[0]).award, 'sharp_first_try')
  assert.equal(got.get(members[4]).award, 'kindest_cheerer')
  assert.equal(got.get(members[3]).award, 'curious_explorer')
  assert.deepEqual(got.get(members[5]), { award: 'teammate', evidence: { stars: 0 } }) // took no part: still one of the team
  for (const a of got.values()) assert.ok(cfg.AWARDS.includes(a.award))
  // A group where nobody did anything: everyone is a team-mate, nothing is invented.
  const quiet = pickAwards(members, new Map(), new Map(), [null])
  assert.ok([...quiet.values()].every((a) => a.award === 'teammate'))
})

test('a quest or match needs a name, sensible days, and two learners a team', () => {
  assert.throws(() => clean({ title: 'x' }, 10), /name/)
  assert.throws(() => clean({ title: 'Week', days: 99 }, 10), /days/)
  assert.throws(() => clean({ title: 'Week', kind: 'teams', teams: 9 }, 30), /2 to 4/)
  assert.throws(() => clean({ title: 'Week', kind: 'teams', teams: 3 }, 5), /at least 6/)
  assert.throws(() => clean({ title: 'Week', subject: 'chess' }, 5), /subject/)
  assert.deepEqual(clean({ title: ' Reading quest ', days: 3 }, 1), { title: 'Reading quest', kind: 'quest', days: 3, teamCount: 1, subject: '', perDay: cfg.team.defaultStarsPerLearnerPerDay })
})

test('the grown-ups\' switches: any "no" is a no, and someone new needs every grown-up\'s yes', () => {
  assert.deepEqual(strictest([{ together: {} }]), { friends: true, friendApproval: true, matches: true, mystery: false, shorts: true }) // the defaults
  const two = strictest([{ together: { friends: true, mystery: true, friendApproval: false } }, { together: { friends: false, mystery: true, friendApproval: false, shorts: false } }])
  assert.equal(two.friends, false)
  assert.equal(two.shorts, false)
  assert.equal(two.mystery, true)
  assert.equal(two.friendApproval, false)
  assert.equal(strictest([{ together: { mystery: true } }, { together: {} }]).mystery, false)
  assert.equal(strictest([{ together: { friendApproval: false } }, {}]).friendApproval, true) // one grown-up asking to approve is enough
})

test('a round for two: checkable questions at the level, spread over skills, the same for the same seed', () => {
  const q = (id, level, skill, o = {}) => ({ _id: `o-${id}`, id, level, skill, graded: true, qaStatus: 'verified', ...o })
  const pool = [
    ...[1, 2, 3].map((i) => q(`a${i}`, 1, 'adding')), ...[1, 2, 3].map((i) => q(`b${i}`, 1, 'counting')), q('c1', 1, 'shapes'),
    q('open', 1, 'talk', { graded: false }), q('review', 1, 'adding', { qaStatus: 'needs_review' }), q('hard', 3, 'times'),
  ]
  const a = pickItems(pool, 1, 5, 'seed')
  assert.equal(a.items.length, 5)
  assert.equal(a.level, 1)
  assert.ok(a.items.every((it) => !['open', 'review', 'hard'].includes(it.q)))
  const skills = new Set(a.items.map((it) => pool.find((p) => p.id === it.q).skill))
  assert.equal(skills.size, 3) // every skill at the level is in it
  assert.deepEqual(pickItems(pool, 1, 5, 'seed'), a)
  assert.equal(pickItems(pool, 5, 5, 's').level, 3) // above the bank: the highest level that has questions
  assert.deepEqual(pickItems([], 1, 5, 's'), { items: [], level: null })
})

test('a player card shows a first name only, and a code that is hard to misread', () => {
  assert.equal(firstNameOf('Aanya Rao'), 'Aanya')
  assert.equal(firstNameOf('kid@example.com'), '') // an email used as a name is never shown
  assert.equal(firstNameOf(''), '')
  assert.equal(nickText('brave', 'fox'), 'Brave Fox')
  for (let i = 0; i < 50; i++) assert.match(newCode(), /^[A-HJ-NP-Z2-9]{6}$/) // no 0/O, 1/I/L
  assert.equal(new Set(cfg.NICK_A).size, cfg.NICK_A.length)
  assert.ok(cfg.AVATARS.length >= 20)
})

test('a short: whole sentences, nothing that asks to tap the AI Teacher\'s page, one question', () => {
  const pack = {
    id: 'T-1', title: 'Rain', area: 'Nature', levels: ['P1'], status: 'draft',
    explain: [
      { say: 'Rain falls from clouds. Tap any part, and I will tell you what it does.', draw: [{ op: 'title', text: 'Rain' }, null, { nope: true }] },
      { say: 'The sun warms the sea and water rises into the air as vapour. It cools and makes clouds.', draw: [{ op: 'bullets', items: ['sun', 'cloud'] }] },
      { say: 'Then it rains again.', draw: [] }, { say: 'A fourth idea.', draw: [] },
    ],
    facts: ['Rain is water.', 'Clouds are tiny drops.', 'Snow is frozen.', 'A fourth.'],
    quiz: [{ say: 'What falls from clouds?', options: [{ show: 'Rain' }, { show: 'Sand' }], answer: 0, why: 'Rain is water from clouds.' }],
  }
  const s = catalog.toShort(pack, new Map(), new Set())
  assert.equal(s.steps.length, 3)
  assert.equal(s.steps[0].say, 'Rain falls from clouds.')
  assert.deepEqual(s.steps[0].draw, [{ op: 'title', text: 'Rain' }])
  assert.equal(s.theme, 'nature')
  assert.equal(s.facts.length, 3)
  assert.deepEqual(s.quiz, { ask: 'What falls from clouds?', options: ['Rain', 'Sand'], answer: 0, why: 'Rain is water from clouds.' })
  assert.equal(catalog.toShort(pack, new Map(), new Set(['T-1'])), null) // marked sensitive: never a short
  assert.equal(catalog.toShort({ ...pack, quiz: [] }, new Map(), new Set()), null) // no question, no short
  assert.equal(catalog.toShort({ ...pack, explain: [{ say: 'Too short.' }] }, new Map(), new Set()), null)
  assert.deepEqual(catalog.levelsFor('child'), ['EY', 'P1', 'P2'])
  assert.deepEqual(catalog.levelsFor(undefined), catalog.levelsFor('unknown')) // age unknown: the young levels
  assert.equal(catalog.themeOf('Space'), 'space')
  assert.equal(catalog.themeOf('Something new'), 'curious')
})

test('the real packs: thousands of shorts, none sensitive areas for children, every one with a question', () => {
  const all = catalog.load().list
  assert.ok(all.length > 3000)
  const child = catalog.forBand('child')
  assert.ok(child.length > 800)
  assert.ok(child.every((s) => s.quiz.options[s.quiz.answer] && s.steps.length >= 1 && !catalog.NOT_FOR_CHILD.has(s.area)))
  assert.ok(child.every((s) => s.levels.some((l) => ['EY', 'P1', 'P2'].includes(l))))
  assert.ok(!all.some((s) => s.steps.some((x) => /\btap any\b/i.test(x.say))))
  assert.ok(catalog.THEME_KEYS.every((t) => child.some((s) => s.theme === t)), 'every theme a child can pick has shorts')
})

test('the feed weighs a learner\'s own picks first, then hearts, then shorts finished', () => {
  const doc = { picks: ['space'], themes: new Map([['animals', { views: 4, done: 3, likes: 1 }], ['numbers', { views: 6, done: 0, likes: 0 }]]) }
  const w = weights(doc)
  assert.equal(w.get('space'), 4)
  assert.equal(w.get('animals'), 3 * 1 + 3 - 0.25)
  assert.equal(w.has('numbers'), false) // opened and swiped away: not a favourite
  assert.equal(weekKey(new Date('2026-11-25T10:00:00Z')), '2026-W48')
  assert.equal(weekStart(new Date('2026-11-25T10:00:00Z')).toISOString(), '2026-11-23T00:00:00.000Z')
})

test('"what they love" for grown-ups: top themes, shares that add up, and no judgement in the trend', () => {
  const wk = weekKey(new Date())
  const doc = {
    picks: ['space'], totals: { views: 9, done: 6, likes: 2 },
    themes: new Map([['space', { views: 5, done: 4, likes: 2 }], ['animals', { views: 3, done: 2, likes: 0 }], ['arts', { views: 1, done: 0, likes: 0 }]]),
    areas: new Map([['Space', { views: 5, done: 4, likes: 2 }]]), weeks: new Map([[wk, 6]]),
    liked: [{ id: 'A', title: 'Mars', theme: 'space', at: new Date() }],
  }
  const s = summarise(doc)
  assert.deepEqual(s.top, ['space', 'animals'])
  assert.equal(s.themes[0].picked, true)
  assert.ok(Math.abs(s.themes.reduce((a, t) => a + t.share, 0) - 1) < 0.02)
  assert.equal(s.weeks.length, 6)
  assert.equal(s.weeks[5].done, 6)
  assert.equal(s.trend, 'more')
  assert.deepEqual(summarise(null).totals, { views: 0, done: 0, likes: 0 })
  assert.equal(summarise(null).hasData, false)
  assert.ok(!/"(rank|score|position)":/.test(JSON.stringify({ ...s, themes: s.themes.map(({ score, ...t }) => t) })))
})
