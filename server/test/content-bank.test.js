// The question bank (content v3 + v4): the QA gate, metadata, the skills catalogue, foundation
// coverage, stages, the everyday pool, stable ids, reproducible derivation and untouched file
// formatting. Narration has its own test (narration.test.js).
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
    assert.ok(q.qa && q.qa.version === 4 && q.qa.reviewed === '2026-11-21', `${q.id} qa`)
    assert.ok(Number.isInteger(q.stage) && q.stage >= 0 && q.stage <= 5, `${q.id} stage`)
    assert.equal(typeof q.everyday, 'boolean', `${q.id} everyday`)
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
  assert.ok(list.length >= 40 && list.length <= 100, `${list.length} skills`)
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
    assert.ok(starters.filter((q) => /-F00-/.test(q.id)).length >= 6, `${b.file}: ${starters.length} starter items`)
    for (const q of starters) {
      assert.match(q.id, /-(F00|E00)-Q\d{2}$/)
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

// ── Content v4: stages ──
const { deriveStage, STAGE_NAMES } = require('../scripts/content/stages')
const { stageOverrides } = require('../scripts/content/patches')

test('stage: derived from Bloom + interaction, overrides win, 0 only for everyday items', () => {
  const B = { remember: 1, understand: 2, apply: 3, analyze: 4, evaluate: 4 }
  assert.deepEqual(deriveStage({ id: 'X-T01-Q01', cognition: { bloom: 'apply' }, interaction: 'tap_mcq' }, []), { stage: 3, source: 'derived' })
  assert.equal(deriveStage({ id: 'X-T01-Q01', cognition: { bloom: 'evaluate' }, interaction: 'true_false' }, []).stage, 2, 'a yes/no judgement is understanding at most')
  assert.equal(deriveStage({ id: 'X-T01-Q01', cognition: { bloom: 'analyze' }, interaction: 'sort_bins' }, []).stage, 3, 'sorting into named groups applies a rule')
  assert.equal(deriveStage({ id: 'EN-WR-T15-Q01', cognition: { bloom: 'create' }, interaction: 'typed_long' }, []).stage, 4, 'create is reasoning unless it is transfer')
  assert.equal(deriveStage({ id: 'SCI-SPK-T15-Q01', cognition: { bloom: 'create' }, interaction: 'mic_record' }, []).stage, 5, 'an investigation plan is transfer')
  assert.equal(deriveStage({ id: 'X', everyday: true, cognition: { bloom: 'analyze' } }).stage, 0)
  for (const q of all) {
    const d = deriveStage(q)
    assert.equal(q.stage, d.stage, `${q.id}: bank stage ${q.stage}, derivation ${d.stage}`)
    if (q.everyday) assert.equal(q.stage, 0, q.id)
    else assert.ok(q.stage >= 1, `${q.id}: stage 0 is only for everyday items`)
    if (d.source === 'derived' && B[q.cognition.bloom] !== undefined && !['true_false', 'sort_bins'].includes(q.interaction)) assert.equal(q.stage, B[q.cognition.bloom], q.id)
  }
  for (const o of stageOverrides) {
    assert.ok(o.reason && o.reason.length > 20, 'every override has a reason')
    assert.ok(Number.isInteger(o.stage) && o.stage >= 1 && o.stage <= 5)
    assert.ok(all.some((q) => (o.ids ? o.ids.includes(q.id) : o.match.test(q.id))), `override matches something: ${o.reason}`)
  }
  assert.deepEqual(Object.keys(STAGE_NAMES).map(Number), [0, 1, 2, 3, 4, 5])
})

test('stage: every subject has served items at stages 1-4, and stage 5 exists', () => {
  for (const subject of ['english', 'maths', 'science']) {
    const st = new Set(all.filter((q) => q.__bank.subject === subject && q.qa.status !== 'excluded').map((q) => q.stage))
    for (const s of [0, 1, 2, 3, 4]) assert.ok(st.has(s), `${subject} stage ${s}`)
  }
  assert.ok(all.some((q) => q.stage === 5 && q.qa.status !== 'excluded'))
})

// ── Content v4: the everyday-curiosity pool ──
test('everyday pool: 48 relatable items, stage 0, level 0-1, graded, verified, full metadata', () => {
  const pool = all.filter((q) => q.everyday)
  const by = (s) => pool.filter((q) => q.__bank.subject === s).length
  assert.equal(pool.length, 48)
  assert.deepEqual([by('science'), by('maths'), by('english')], [24, 12, 12])
  const ids = new Set(skills.skills.map((s) => s.id))
  for (const q of pool) {
    assert.match(q.id, /-E00-Q\d{2}$/)
    assert.equal(q.stage, 0)
    assert.ok(q.level === 0 || q.level === 1, `${q.id} level`)
    assert.equal(q.graded, true)
    assert.equal(q.qa.status, 'verified')
    assert.equal(q.age_band, 'all')
    assert.ok(ids.has(q.skill), `${q.id} skill`)
    assert.ok(q.hints && q.hints[0], `${q.id} hint`)
    assert.ok(q.feedback && q.feedback.correct, `${q.id} feedback`)
    assert.ok(q.analysis.parent_note && q.analysis.teacher_action_if_missed, `${q.id} analysis notes`)
    assert.ok(q.life_skill && q.life_skill.hidden_lesson, `${q.id} life skill`)
    assert.ok(q.narration && q.narration.status === 'authored', `${q.id} authored narration`)
    if (['tap_mcq', 'true_false', 'drag_to_blank'].includes(q.interaction) && q.options.length > 2) assert.ok(Object.keys(q.distractor_insight).length >= 1, `${q.id} distractor insight`)
    if (q.__bank.subject === 'english') assert.equal(q.translations, undefined, `${q.id}: English items teach English and are not translated`)
    else for (const lang of LANGS) {
      const t = q.translations[lang]
      assert.ok(t && t.instruction && t.instruction !== q.instruction, `${q.id} ${lang} instruction`)
      assert.ok(t.hints[0] && t.hints[0] !== q.hints[0], `${q.id} ${lang} hint translated`)
      assert.ok(t.feedback.correct && t.feedback.correct !== q.feedback.correct, `${q.id} ${lang} feedback translated`)
      if (q.audio_text) assert.ok(t.audio_text && t.audio_text !== q.audio_text, `${q.id} ${lang} audio`)
      if (q.prompt && /\p{L}{3}/u.test(q.prompt)) assert.ok(t.prompt && t.prompt !== q.prompt, `${q.id} ${lang} prompt`)
    }
  }
  // Interactions the widgets support, mostly tap / true-false.
  const kinds = pool.reduce((m, q) => ((m[q.interaction] = (m[q.interaction] || 0) + 1), m), {})
  assert.ok(kinds.tap_mcq + kinds.true_false >= 36, JSON.stringify(kinds))
})

test('everyday pool: the checker accepts the right answer and rejects wrong ones in every language (server and client)', async () => {
  const { pathToFileURL } = require('url')
  const { CLIENT } = require('../scripts/content/sync-checker')
  const client = await import(pathToFileURL(CLIENT).href)
  const server = require('../utils/scoreAnswer')
  const { submissions } = require('../scripts/content/audit')
  const { applyQuestionTranslation } = require('../utils/applyQuestionTranslation')
  let n = 0
  for (const q of all.filter((x) => x.everyday)) {
    const variants = [q, ...(q.translations ? LANGS.map((l) => applyQuestionTranslation(JSON.parse(JSON.stringify(q)), l)) : [])]
    for (const v of variants) {
      const { right, wrong } = submissions(v)
      assert.ok(right.length, `${v.id} ${v.lang}: a right answer`)
      for (const r of right) for (const c of [server, client]) { assert.equal(c.checkAnswer(v, r).status, 'correct', `${v.id} ${v.lang} ${JSON.stringify(r)}`); n++ }
      for (const w of wrong) for (const c of [server, client]) assert.notEqual(c.checkAnswer(v, w).status, 'correct', `${v.id} ${v.lang} wrong ${JSON.stringify(w)}`)
    }
  }
  assert.ok(n > 800, `${n} right answers checked`)
})

// ── Content v4 repairs found while writing narration ──
test('generated items carry no stale widget data from their template; listening badges never show the answer', () => {
  const byId = Object.fromEntries(all.map((q) => [q.id, q]))
  for (const q of all.filter((x) => /-(F00|E00|S0\d)-/.test(x.id))) for (const k of ['letter_tiles', 'word_tiles', 'number_tiles', 'sequence_items', 'pairs', 'bins']) assert.equal(q[k], undefined, `${q.id}.${k}`)
  assert.deepEqual(byId['EN-WR-F00-Q04'].options, ['s', 'u', 'n'])
  for (const id of ['EN-LIS-T01-Q01', 'EN-LIS-T09-Q03', 'MA-LIS-T13-Q01']) assert.equal(byId[id].image.emoji, '👂', id)
  const { auditQuestion } = require('../scripts/content/audit')
  const badge = { ...byId['EN-LIS-T01-Q01'], image: { mode: 'emoji', emoji: '🧼' } }
  assert.ok(auditQuestion(badge, { subject: 'english', module: 'listen' }).some((f) => f.check === 'badge' && f.severity === 'blocking'), 'the gate blocks a badge that shows the answer')
  const tiles = { ...byId['EN-WR-T02-Q01'], letter_tiles: ['d', 's'] }
  assert.ok(auditQuestion(tiles, { subject: 'english', module: 'write' }).some((f) => f.check === 'options' && /letter_tiles/.test(f.message)), 'the gate blocks tiles that cannot build the answer')
})

test('rhyme and category-naming speech items: the card word itself is never a right answer', () => {
  const { checkAnswer } = require('../utils/scoreAnswer')
  for (const q of all.filter((x) => /^EN-SPK-T(06|12)-/.test(x.id))) {
    assert.ok(!q.speech_scoring.expected_keywords.some((k) => k.toLowerCase() === q.prompt.toLowerCase()), `${q.id}: expected_keywords no longer hold the card word`)
    if (!q.graded) continue
    assert.notEqual(checkAnswer(q, { transcript: q.prompt }).status, 'correct', `${q.id}: saying "${q.prompt}"`)
    assert.notEqual(checkAnswer(q, { transcript: `um ${q.prompt}` }).status, 'correct', `${q.id}: saying "um ${q.prompt}"`)
    assert.equal(checkAnswer(q, { transcript: q.speech_scoring.sample_answer }).status, 'correct', `${q.id}: the sample answer`)
  }
  const rhyme = all.find((x) => x.id === 'EN-SPK-T06-Q01')
  assert.equal(checkAnswer(rhyme, { transcript: 'bat' }).status, 'correct')
  assert.notEqual(checkAnswer(rhyme, { transcript: 'cat' }).status, 'correct')
})
