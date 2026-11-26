// The short explanation a repeated misconception brings (config.misconceptionRepeat). Pure.
//
// Taken from the question the misconception last came from, in this order:
//   1. its worked example (written for the learner; translated when the item has a translation)
//   2. analysis.teacher_action_if_missed (written for grown-ups, in English)
//   3. the misconception text itself (the item's distractor_insight, in English)
// Nothing is invented: when none of these exist there is no explanation.
const { applyQuestionTranslation } = require('../../utils/applyQuestionTranslation')
const { render } = require('./feedback')

const TEXTS = {
  lead: "Let's look at this idea again before the next one.",
  lead_skill: "{{skillName}}: let's look at this idea again before the next one.",
}

const clean = (v) => (typeof v === 'string' && v.trim() ? v.replace(/\s+/g, ' ').trim().slice(0, 400) : null)

/**
 * doc: the source question (id, worked_example, analysis, translations.<lang>.worked_example) or null
 * -> { text, skill, skillName, source: 'worked_example'|'teacher_action'|'insight', lang, lead: { key, params, text } } | null
 */
function buildExplain(doc, { skill = null, skillName = '', misconception = '', lang = 'en' } = {}) {
  let text = null
  let source = null
  let textLang = 'en'
  if (doc) {
    const tr = applyQuestionTranslation(JSON.parse(JSON.stringify(doc)), lang && lang !== 'en' ? lang : 'en')
    if (clean(tr.worked_example)) { text = clean(tr.worked_example); source = 'worked_example'; textLang = lang && lang !== 'en' && doc.translations?.[lang]?.worked_example ? tr.lang : 'en' }
    else if (clean(doc.analysis?.teacher_action_if_missed)) { text = clean(doc.analysis.teacher_action_if_missed); source = 'teacher_action' }
  }
  if (!text && clean(misconception)) { text = clean(misconception); source = 'insight' }
  if (!text) return null
  const params = skillName ? { skill, skillName } : {}
  const leadKey = skillName ? 'lead_skill' : 'lead'
  return {
    text, skill, skillName: skillName || null, source, lang: textLang,
    lead: { key: `learn.explain.${leadKey}`, params, text: render(TEXTS[leadKey], params) },
  }
}

module.exports = { buildExplain, TEXTS }
