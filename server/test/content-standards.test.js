// Content v5: every skill is mapped to the curricula (skills-standards.json), the mapping reaches
// skills.json, and the document and the client copy are generated from it (standards.js --check).
const test = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const path = require('path')
const SKILLS = require('../scripts/content/skills-source')
const STD = require('../scripts/content/skills-standards.json')
const skillsJson = require('../data/skills.json')

test('every skill is mapped to Ireland, England, the US, Europe and adult levels', () => {
  for (const s of SKILLS) {
    const m = STD.skills[s.id]
    assert.ok(m, `${s.id} has a mapping`)
    for (const k of ['ie', 'uk', 'us', 'eu', 'adult']) assert.ok(m[k], `${s.id}: ${k}`)
    assert.ok(['high', 'medium', 'low'].includes(m.confidence), `${s.id}: confidence`)
    assert.ok(m.ie.framework && (m.ie.outcome || m.ie.area), `${s.id}: an Irish framework and outcome`)
    // Common Core ELA (RF.K.2a) and maths (1.OA.C.6), its practices (MP3), NGSS (K-LS1-1, 3-5-ETS1-3).
    for (const c of m.us.codes || []) assert.match(c, /^(MP[1-8]|(RF|RI|RL|SL|L|W)\.(K|\d+)\.\d+[a-z]?|(K|\d)\.(CC|OA|NBT|NF|MD|G|EE|NS|RP)\.[A-Z]\.\d+[a-z]?|(K|\d)(-\d)?-(ESS|LS|PS|ETS)\d-\d)$/, `${s.id}: US code ${c}`)
  }
  assert.ok(STD.sources.length >= 10, 'official sources are listed')
})

test('the mapping reaches skills.json as proposed, and the document and client copy are current', () => {
  for (const s of skillsJson.skills) {
    assert.ok(s.standards, `${s.id} in skills.json`)
    assert.equal(s.standards.status, 'proposed')
  }
  execFileSync(process.execPath, [path.resolve(__dirname, '../scripts/content/standards.js'), '--check'], { stdio: 'pipe' })
})

test('the ladder follows the developmental order (content v5)', () => {
  const by = Object.fromEntries(SKILLS.map((s) => [s.id, s]))
  assert.ok(by['english.syllables'].level <= by['english.rhyme'].level, 'syllables no later than rhyme')
  assert.ok(by['english.rhyme'].prerequisites.includes('english.syllables'))
  assert.ok(by['english.rhyme'].level <= by['english.first-last-sounds'].level)
  assert.ok(by['maths.time'].level <= 2, "o'clock and half past are early")
  assert.ok(by['maths.fractions'].prerequisites.includes('maths.sharing-equally'))
})
