#!/usr/bin/env node
// Content builder for the 12 question-bank files (v3 + v4; reproducible; safe to re-run).
//   1. applies the hand repairs in patches.js (absolute values: re-running changes nothing),
//   2. auto-fixes picture badges that show the answer and keeps level_name in step with level,
//   3. adds the new items (level-0 foundation for every subject × mode, maths stretch 6-8,
//      the everyday-curiosity pool),
//   4. derives skill / age_band / graded / validation (rules.js), stage + everyday (stages.js),
//      narration in English and every translation (narration.js) and qa (the audit's checks),
//   5. writes server/data/skills.json and the bank files in their original formatting.
//
//   node server/scripts/content/derive-metadata.js          write the files
//   node server/scripts/content/derive-metadata.js --dry    report only
// Then: node server/scripts/content/audit.js --check
const fs = require('fs')
const path = require('path')
const { loadAll, saveBank, DATA_DIR } = require('./lib/bankio')
const { patches, LANGS } = require('./patches')
const rules = require('./rules')
const SKILLS = require('./skills-source')
const { buildNewItems } = require('./new-items')
const { LEVEL_NAMES } = require('./new-items/build')

const REVIEWED = '2026-11-21'
const QA_VERSION = 4
const GENERATED = /-(F00|E00|S0[6-8])-Q\d+$/
const DERIVED = ['skill', 'age_band', 'graded', 'validation', 'stage', 'everyday', 'narration', 'qa']
const { deriveStage } = require('./stages')
const narration = require('./narration')
const NEUTRAL_BADGE = { listen: '👂', read: '📖', write: '✏️', speak: '🗣️' }
const graphemes = (s) => { try { return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(String(s))].map((g) => g.segment) } catch { return [...String(s)] } }
const strip = (s) => String(s).replace(/️/g, '')

function matches(p, id) {
  if (p.ids) return p.ids.includes(id)
  if (p.match) return p.match.test(id)
  return false
}

// The picture badge next to the prompt must not be the answer (Listen/Read choice items),
// nor the counted object in a maths counting prompt (it reads as one more).
function fixBadge(q, module) {
  const img = q.image && q.image.emoji
  if (!img) return null
  const rights = [].concat(q.correct_answer).filter((x) => typeof x === 'string')
  const isAnswer = rights.some((r) => strip(r) === strip(img) || (strip(graphemes(r)[0] || '') === strip(img) && graphemes(r).length <= 2) || strip(r).startsWith(`${strip(img)} `))
  if (['listen', 'read'].includes(module) && ['tap_mcq', 'true_false', 'drag_to_blank', 'multi_select', 'tap_sequence'].includes(q.interaction) && isAnswer) {
    q.image.emoji = rights.some((r) => strip(r).startsWith(strip(NEUTRAL_BADGE[module]))) ? '🔊' : NEUTRAL_BADGE[module]
    return 'badge showed the answer'
  }
  if (/^(MA)-/.test(q.id) && typeof q.prompt === 'string' && graphemes(q.prompt).filter((g) => strip(g) === strip(img)).length >= 2) {
    q.image.emoji = '🔢'
    return 'badge was the counted object'
  }
  return null
}

function run({ dry = false } = {}) {
  const banks = loadAll()
  const log = { patches: [], badges: [], added: [], excluded: [], ungradedLangs: [] }

  // Generated items are rebuilt from their source every run.
  for (const b of banks) b.data.questions = b.data.questions.filter((q) => !GENERATED.test(q.id))
  const fresh = buildNewItems(banks)

  for (const b of banks) {
    for (const q of b.data.questions) {
      for (const k of DERIVED) delete q[k]
      narration.clearNarration(q)
      let excluded = null
      const h = {
        LANGS,
        forEachLang(q2, fn) { fn(q2, 'en'); for (const l of LANGS) if (q2.translations && q2.translations[l]) fn(q2.translations[l], l) },
        exclude(_q, reason) { excluded = reason },
      }
      for (const p of patches) if (matches(p, q.id)) { p.apply(q, h); log.patches.push({ id: q.id, category: p.category, severity: p.severity, reason: p.reason }) }
      const badge = fixBadge(q, b.module)
      if (badge) log.badges.push({ id: q.id, reason: badge })
      if (LEVEL_NAMES[q.level]) q.level_name = LEVEL_NAMES[q.level]
      q.__excluded = excluded
    }
    for (const { spec, question } of fresh[b.file] || []) {
      question.__spec = spec
      // Content v5: the review fixes and money tokens reach the generated items (starters,
      // everyday pool, stretch) too; they are rebuilt from their source every run.
      let excluded = null
      const h = {
        LANGS,
        forEachLang(q2, fn) { fn(q2, 'en'); for (const l of LANGS) if (q2.translations && q2.translations[l]) fn(q2.translations[l], l) },
        exclude(_q, reason) { excluded = reason },
      }
      for (const p of patches) if (matches(p, question.id)) { p.apply(question, h); log.patches.push({ id: question.id, category: p.category, severity: p.severity, reason: p.reason }) }
      if (LEVEL_NAMES[question.level]) question.level_name = LEVEL_NAMES[question.level]
      if (excluded) question.__excluded = excluded
      b.data.questions.push(question)
      log.added.push({ id: question.id, level: question.level })
    }
  }

  // Skills catalogue (modes filled from the questions).
  const modes = {}
  const skillOf = (q) => (q.__spec && q.__spec.skill) || rules.deriveSkill(q)
  for (const b of banks) for (const q of b.data.questions) { const s = skillOf(q); (modes[s] = modes[s] || new Set()).add(b.module) }
  const order = ['listen', 'read', 'write', 'speak']
  // Content v5: each skill's curriculum mapping (skills-standards.json; proposed until a qualified
  // teacher reviews it): Ireland, England, the US, the CEFR / EU key competences, adult levels.
  const STD = require('./skills-standards.json')
  const skillsJson = {
    version: 1,
    generated_by: 'server/scripts/content/derive-metadata.js (source: skills-source.js, skills-standards.json)',
    standards_sources: STD.sources,
    skills: SKILLS.map((s) => ({ id: s.id, subject: s.subject, modes: order.filter((m) => modes[s.id] && modes[s.id].has(m)), name: s.name, objective: s.objective, level: s.level, prerequisites: s.prerequisites, ...(STD.skills[s.id] ? { standards: { ...STD.skills[s.id], status: 'proposed' } } : {}) })),
  }
  const unknown = Object.keys(modes).filter((id) => !SKILLS.some((s) => s.id === id))
  if (unknown.length) throw new Error(`questions use skills missing from skills-source.js: ${unknown.join(', ')}`)
  if (!dry) fs.writeFileSync(path.join(DATA_DIR, 'skills.json'), JSON.stringify(skillsJson, null, 2) + '\n')

  // Metadata + QA (audit needs skills.json, so load it fresh).
  try { delete require.cache[require.resolve('../../data/skills.json')] } catch { /* first run */ }
  const { auditQuestion, passedChecks } = require('./audit')
  narration.resetCaches()
  for (const b of banks) {
    for (const q of b.data.questions) {
      const spec = q.__spec
      const excluded = q.__excluded
      const skill = skillOf(q)
      delete q.__spec
      delete q.__excluded
      q.skill = skill
      q.age_band = spec ? (spec.age_band || 'all') : rules.deriveAgeBand(q)
      if (spec) {
        q.graded = spec.graded !== false
        q.validation = spec.validation || rules.deriveValidation(q).validation
      } else {
        const d = rules.deriveValidation(q)
        q.graded = d.graded
        q.validation = d.validation
      }
      // Content v5: reviewed checking rules (review-v5/*.json) replace the derived ones.
      const reviewed = require('./review-v5').validationOverrides.get(q.id)
      if (reviewed) q.validation = JSON.parse(JSON.stringify(reviewed))
      q.everyday = !!(spec && spec.everyday)
      q.stage = deriveStage(q).stage
      if (excluded) {
        q.qa = { status: 'excluded', reason: excluded, checks: [], version: QA_VERSION, reviewed: REVIEWED }
        log.excluded.push({ id: q.id, reason: excluded })
        continue
      }
      narration.applyNarration(q, { subject: b.subject, module: b.module, spec })
      q.qa = { status: 'verified', checks: [], version: QA_VERSION, reviewed: REVIEWED }
      let findings = auditQuestion(q, { subject: b.subject, module: b.module })
      // Translated speech/typed items whose answers the checker cannot judge in one language
      // are practice-only in that language (listed in the audit), never marked wrong.
      if (b.subject !== 'english' && ['mic_record', 'typed_short', 'typed_long'].includes(q.interaction) && q.graded) {
        const bad = new Set(findings.filter((f) => f.check === 'translations' && /: (right answer|wrong answer)/.test(f.message)).map((f) => f.message.slice(0, f.message.indexOf(':'))))
        if (bad.size) {
          q.validation.ungraded_langs = [...bad].sort()
          log.ungradedLangs.push({ id: q.id, langs: q.validation.ungraded_langs })
          findings = auditQuestion(q, { subject: b.subject, module: b.module })
        }
      }
      const blocking = findings.filter((f) => f.severity === 'blocking')
      q.qa = { status: blocking.length ? 'needs_review' : 'verified', checks: passedChecks(findings), version: QA_VERSION, reviewed: REVIEWED }
    }
    b.data.metadata = { ...b.data.metadata, version: '4.0', content_version: 4, total_questions: b.data.questions.length, reviewed: REVIEWED }
  }

  let changed = 0
  const wouldChange = []
  const { serialize } = require('./lib/bankio')
  for (const b of banks) {
    if (serialize(b.data, b.format) !== b.raw) wouldChange.push(b.file)
    if (!dry && saveBank(b)) changed++
  }
  if (dry) {
    const want = JSON.stringify(skillsJson, null, 2) + '\n'
    let have = ''
    try { have = fs.readFileSync(path.join(DATA_DIR, 'skills.json'), 'utf8') } catch { /* none yet */ }
    if (want !== have) wouldChange.push('skills.json')
  }
  return { banks, log, changed, wouldChange }
}

if (require.main === module) {
  const dry = process.argv.includes('--dry')
  const { banks, log, changed, wouldChange } = run({ dry })
  const by = (arr, key) => arr.reduce((m, x) => ((m[x[key]] = (m[x[key]] || 0) + 1), m), {})
  const items = new Set(log.patches.map((p) => p.id))
  console.log(`Patches applied: ${log.patches.length} (${items.size} questions)`, by(log.patches, 'category'))
  console.log(`Picture badges fixed: ${log.badges.length}`, by(log.badges, 'reason'))
  console.log(`New items: ${log.added.length}`, by(log.added, 'level'))
  console.log(`Excluded: ${log.excluded.length}`)
  console.log(`Practice-only in some languages: ${log.ungradedLangs.length} questions`)
  const status = {}
  for (const b of banks) for (const q of b.data.questions) status[q.qa.status] = (status[q.qa.status] || 0) + 1
  console.log('QA status:', status)
  console.log(dry ? `Dry run: nothing written. Would change: ${wouldChange.length ? wouldChange.join(', ') : 'nothing'}` : `Wrote ${changed} bank file(s) and server/data/skills.json.`)
  if (process.argv.includes('--log')) fs.writeFileSync(process.argv[process.argv.indexOf('--log') + 1], JSON.stringify(log, null, 1))
}

module.exports = { run }
