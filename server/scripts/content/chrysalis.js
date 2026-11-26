// Content v5: butterflies form a chrysalis, not a cocoon (a cocoon is the silk case some moths
// spin). The review fixed the keys; this fixes every other place the bank said "cocoon": feedback,
// hints, sample answers and stories, in English and (from chrysalis-translations.json, written by
// a translator with the right articles and cases) in every language. Speech checking already
// accepts cocoon, chrysalis and pupa, so a child who says "cocoon" is still understood.
// Re-runnable: replacing an already corrected text changes nothing.
const fs = require('fs')
const path = require('path')

const FIELDS = ['instruction', 'prompt', 'audio_text', 'hints', 'worked_example', 'feedback', 'distractor_insight', 'speech_scoring', 'correct_answer', 'accepted_answers', 'options']
const en = (s) => (typeof s === 'string'
  ? s.replace(/\b(C|c)ocoons\b/g, (_, c) => `${c === 'C' ? 'C' : 'c'}hrysalises`).replace(/\b(C|c)ocoon\b/g, (_, c) => `${c === 'C' ? 'C' : 'c'}hrysalis`)
  : Array.isArray(s) ? s.map(en) : s && typeof s === 'object' ? Object.fromEntries(Object.entries(s).map(([k, v]) => [k, en(v)])) : s)

// The items: any served text that names a cocoon or a chrysalis (English decides).
const IDS = new Set()
const DATA = path.resolve(__dirname, '../../data')
for (const f of fs.readdirSync(DATA).filter((x) => /_(listen|read|write|speak)\.json$/.test(x))) {
  for (const q of JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')).questions) {
    if (/\b(cocoons?|chrysalis(es)?)\b/i.test(JSON.stringify(FIELDS.map((k) => q[k])))) IDS.add(q.id)
  }
}
const TR_FILE = path.resolve(__dirname, 'chrysalis-translations.json')
const TR = fs.existsSync(TR_FILE) ? JSON.parse(fs.readFileSync(TR_FILE, 'utf8')) : []
for (const t of TR) IDS.add(t.id)

const getPath = (o, p) => p.split('.').reduce((x, k) => (x == null ? x : x[k]), o)
function setPath(o, p, v) {
  const ks = p.split('.')
  let x = o
  for (const k of ks.slice(0, -1)) { if (x[k] == null) return; x = x[k] }
  x[ks[ks.length - 1]] = v
}

const patches = [{
  ids: [...IDS],
  category: 'science_accuracy',
  severity: 'blocking',
  reason: 'A butterfly caterpillar forms a chrysalis, not a cocoon. The keys were fixed in the review; this corrects the feedback, hints, sample answers and stories, in English and every language.',
  apply(q) {
    // A deliberate wrong option "cocoon" beside the right "chrysalis" stays as it is.
    const both = Array.isArray(q.options) && q.options.some((o) => /chrysalis/i.test(o)) && q.options.some((o) => /cocoon/i.test(o))
    for (const f of FIELDS) {
      if (q[f] == null) continue
      if (both && ['options', 'correct_answer', 'accepted_answers', 'distractor_insight'].includes(f)) continue
      q[f] = en(q[f])
    }
    // Two items whose key changed in the review: their English feedback follows the new key.
    if (q.id === 'SCI-LIS-T03-Q09') {
      q.feedback = { ...q.feedback, correct: 'True. There is a chrysalis stage in between. 🦋' }
      q.distractor_insight = { '❌ No': 'missed the chrysalis stage between caterpillar and butterfly' }
    }
    if (q.id === 'SCI-RD-T04-Q02') q.feedback = { ...q.feedback, correct: 'Caterpillar and butterfly - two stages of one life cycle. 🐛' }
    if (!q.translations) return
    for (const t of TR) {
      if (t.id !== q.id || !q.translations[t.lang]) continue
      const now = getPath(q.translations[t.lang], t.field)
      if (now === t.from) setPath(q.translations[t.lang], t.field, t.to)
    }
  },
}]

module.exports = { patches, IDS }
