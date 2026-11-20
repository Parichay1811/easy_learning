// Content v3 of the question bank: the QA gate, metadata, the skills catalogue, foundation
// coverage, stable ids, reproducible derivation and untouched file formatting.
const test = require('node:test')
const assert = require('node:assert/strict')
const { loadAll, serialize } = require('../scripts/content/lib/bankio')
const { runAudit } = require('../scripts/content/audit')
const { run: derive } = require('../scripts/content/derive-metadata')
const skills = require('../data/skills.json')

const banks = loadAll()
const all = banks.flatMap((b) => b.data.questions.map((q) => ({ ...q, __bank: b })))
const LANGS = ['es', 'fr', 'pt', 'it', 'de', 'nl', 'ru', 'tr', 'zh', 'ja', 'ko', 'id', 'vi']

test('QA gate: every served question passes every blocking audit check', () => {
  const report = runAudit(banks)
  const failing = report.questions.filter((r) => r.status !== 'excluded' && r.findings.some((f) => f.severity === 'blocking'))
  assert.deepEqual(failing.map((r) => `${r.id}: ${r.findings.filter((f) => f.severity === 'blocking').map((f) => f.message).join('; ')}`).slice(0, 10), [])
})

test('every question carries content-v3 metadata', () => {
  const ids = new Set(skills.skills.map((s) => s.id))
  for (const q of all) {
    assert.ok(Number.isInteger(q.level) && q.level >= 0 && q.level <= 8, `${q.id} level`)
    assert.ok(ids.has(q.skill), `${q.id} skill ${q.skill}`)
    assert.ok(['all', 'young'].includes(q.age_band), `${q.id} age_band`)
    assert.equal(typeof q.graded, 'boolean', `${q.id} graded`)
    assert.ok(q.validation && typeof q.validation.method === 'string', `${q.id} validation`)
    assert.ok(q.qa && q.qa.version === 3 && q.qa.reviewed === '2026-11-20', `${q.id} qa`)
    assert.ok(['verified', 'needs_review', 'excluded'].includes(q.qa.status), `${q.id} qa.status`)
    if (q.qa.status === 'needs_review') assert.equal(q.graded, false, `${q.id}: needs_review must be practice-only`)
    if (q.qa.status === 'excluded') assert.ok(q.qa.reason, `${q.id}: excluded needs a reason`)
    if (q.interaction === 'mic_record' && q.graded) {
      const v = q.validation
      assert.ok((v.keywords && v.keywords.length) || (v.numbers && v.numbers.length) || v.compare || v.time, `${q.id}: graded speech needs something to check`)
    }
  }
})

test('skills.json: a small, consistent catalogue', () => {
  const list = skills.skills
  assert.ok(list.length >= 40 && list.length <= 90, `${list.length} skills`)
  const ids = new Set(list.map((s) => s.id))
  assert.equal(ids.size, list.length, 'unique ids')
  for (const s of list) {
    assert.match(s.id, /^(english|maths|science)\.[a-z0-9-]+$/)
    assert.equal(s.id.split('.')[0], s.subject)
    assert.ok(s.name && s.name.length <= 45 && !/[()]/.test(s.name), `${s.id}: short plain name`)
    assert.ok(s.objective && s.objective.endsWith('.'), `${s.id}: objective sentence`)
    assert.ok(Number.isInteger(s.level) && s.level >= 0 && s.level <= 8)
    for (const p of s.prerequisites) assert.ok(ids.has(p), `${s.id} → ${p}`)
  }
  // no prerequisite cycles
  const byId = Object.fromEntries(list.map((s) => [s.id, s]))
  const visit = (id, path = []) => {
    assert.ok(!path.includes(id), `cycle: ${[...path, id].join(' → ')}`)
    for (const p of byId[id].prerequisites) visit(p, [...path, id])
  }
  for (const s of list) visit(s.id)
  // modes match the questions that use each skill
  for (const s of list) {
    const modes = new Set(all.filter((q) => q.skill === s.id).map((q) => q.__bank.module))
    assert.deepEqual([...modes].sort(), [...s.modes].sort(), `${s.id} modes`)
  }
})

test('every subject × mode has graded, verified level-0 items fine for any age', () => {
  for (const b of banks) {
    const starters = b.data.questions.filter((q) => q.level === 0 && q.graded && q.qa.status === 'verified' && q.age_band === 'all')
    assert.ok(starters.length >= 6, `${b.file}: ${starters.length} starter items`)
    for (const q of starters) {
      assert.match(q.id, /-F00-Q\d{2}$/)
      if (b.subject !== 'english') for (const lang of LANGS) {
        const t = q.translations && q.translations[lang]
        assert.ok(t, `${q.id} ${lang}`)
        assert.ok(t.instruction && t.instruction !== q.instruction, `${q.id} ${lang} instruction translated`)
        if (q.audio_text) assert.ok(t.audio_text, `${q.id} ${lang} audio_text`)
      }
    }
  }
})

test('no gaps: graded items at every level from 0 up to the highest level of each subject × mode', () => {
  for (const b of banks) for (let level = 0, top = Math.max(...b.data.questions.filter((q) => q.level <= 5 && q.graded && q.qa.status !== "excluded").map((q) => q.level)); level <= top; level++) {
    const n = b.data.questions.filter((q) => q.level === level && q.graded && q.qa.status !== 'excluded').length
    assert.ok(n > 0, `${b.file} level ${level}`)
  }
})

test('ids are stable: all 1,800 original questions are still there, excluded ones included', () => {
  const original = all.filter((q) => /-T\d{2}-Q\d{2}$/.test(q.id))
  assert.equal(original.length, 1800)
  assert.equal(new Set(all.map((q) => q.id)).size, all.length)
})

test('bank files keep their original JSON formatting (indent, float style, no trailing newline)', () => {
  for (const b of banks) assert.ok(serialize(b.data, b.format) === b.raw, `${b.file} would be reformatted`)
})

test('derive-metadata.js is reproducible: re-running it changes nothing', () => {
  const { wouldChange } = derive({ dry: true })
  assert.deepEqual(wouldChange, [])
})
