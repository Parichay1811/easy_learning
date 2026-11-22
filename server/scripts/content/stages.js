// Stage 0-5 per question: the kind of thinking asked for (separate from level 0-8, which is
// how far into a subject). docs/learning/QUESTION-BANK.md "Stages".
//   0 everyday curiosity · 1 recognition · 2 understanding · 3 application · 4 reasoning · 5 transfer
//
// Derived from the item's Bloom tag (cognition.bloom) and its interaction, then the reviewed
// overrides in patches.js (`stageOverrides`, each with a reason) win. Stage 0 is only for the
// everyday-curiosity pool (`everyday: true`). derive-metadata.js writes `stage` into the bank;
// re-running it gives the same result.
const { stageOverrides } = require('./patches')

const STAGE_NAMES = { 0: 'everyday curiosity', 1: 'recognition', 2: 'understanding', 3: 'application', 4: 'reasoning', 5: 'transfer' }
const BLOOM_STAGE = { remember: 1, understand: 2, apply: 3, analyze: 4, analyse: 4, evaluate: 4, create: 4 }

// Bloom "create" only counts as transfer (5) when the item really asks the learner to use the
// idea in a new situation of their own; otherwise making something is reasoning (4).
const TRANSFER_TYPES = new Set([
  'MA-SPK-T15', // teach a method to a friend who does not know it
  'SCI-SPK-T15', // plan a whole investigation for a new question
])

const typeKey = (id) => String(id).replace(/-Q\d+$/, '')

function matches(o, id) {
  if (o.ids) return o.ids.includes(id)
  if (o.match) return o.match.test(id)
  return false
}

// → { stage, source: 'everyday' | 'override' | 'derived', reason? }
function deriveStage(q, overrides = stageOverrides) {
  if (q.everyday === true) return { stage: 0, source: 'everyday' }
  const o = overrides.find((x) => matches(x, q.id))
  if (o) return { stage: o.stage, source: 'override', reason: o.reason }
  const bloom = String((q.cognition && q.cognition.bloom) || '').toLowerCase()
  let stage = BLOOM_STAGE[bloom]
  if (stage === undefined) stage = 2
  if (bloom === 'create' && TRANSFER_TYPES.has(typeKey(q.id))) stage = 5
  // Interaction: a yes/no judgement of one stated fact is understanding at most, and sorting
  // into groups that are named on screen applies a given rule (it is not open reasoning).
  if (q.interaction === 'true_false') stage = Math.min(stage, 2)
  if (q.interaction === 'sort_bins') stage = Math.min(stage, 3)
  return { stage, source: 'derived' }
}

module.exports = { deriveStage, STAGE_NAMES, BLOOM_STAGE, TRANSFER_TYPES }

// node scripts/content/stages.js   → served items by stage per subject × module (and how each stage was set)
if (require.main === module) {
  const { loadAll } = require('./lib/bankio')
  const rows = []
  const total = [0, 0, 0, 0, 0, 0]
  const source = { everyday: 0, override: 0, derived: 0 }
  for (const b of loadAll()) {
    const c = [0, 0, 0, 0, 0, 0]
    for (const q of b.data.questions) {
      if (q.qa && q.qa.status === 'excluded') continue
      c[q.stage]++; total[q.stage]++; source[deriveStage(q).source]++
    }
    rows.push(`| ${b.subject} ${b.module} | ${c.join(' | ')} | ${c.reduce((a, x) => a + x, 0)} |`)
  }
  console.log('| subject × mode | S0 | S1 | S2 | S3 | S4 | S5 | total |')
  console.log('|---|---|---|---|---|---|---|---|')
  console.log(rows.join('\n'))
  console.log(`| **all** | ${total.join(' | ')} | ${total.reduce((a, x) => a + x, 0)} |`)
  console.log('How set (served):', JSON.stringify(source))
}
