// The client (client/src/utils/scoreAnswer.js) and server (utils/scoreAnswer.js) answer checkers
// must apply the same rules. 1) Their shared core is byte-identical. 2) The WHOLE bank — every
// question, in English and every translation, with every widget submission the audit builds
// (right answers, distractors, failed speech) — gets identical results from both.
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const { pathToFileURL } = require('url')
const server = require('../utils/scoreAnswer')
const { core, build, SERVER, CLIENT } = require('../scripts/content/sync-checker')
const { loadAll } = require('../scripts/content/lib/bankio')
const { submissions, LANGS } = require('../scripts/content/audit')
const { applyQuestionTranslation } = require('../utils/applyQuestionTranslation')

test('client and server share the same checker core', () => {
  const s = fs.readFileSync(SERVER, 'utf8'), c = fs.readFileSync(CLIENT, 'utf8')
  assert.equal(core(c, CLIENT), core(s, SERVER), 'run: node server/scripts/content/sync-checker.js')
  assert.equal(c, build(), 'client file is exactly what sync-checker.js generates')
})

test('client and server give identical results for the whole bank', async () => {
  const client = await import(pathToFileURL(CLIENT).href)
  const extras = [{ unsupported: true }, { error: 'not-allowed' }, { transcript: '' }, '', 'zzzz', ['x'], { a: ['b'] }]
  let compared = 0
  const mismatches = []
  for (const b of loadAll()) {
    for (const q of b.data.questions) {
      const variants = [q]
      if (q.translations) for (const lang of LANGS) if (q.translations[lang]) variants.push(applyQuestionTranslation(JSON.parse(JSON.stringify(q)), lang))
      for (const v of variants) {
        const { right, wrong } = submissions(v)
        for (const a of [...right, ...wrong, ...extras]) {
          const x = server.checkAnswer(v, a), y = client.checkAnswer(v, a)
          compared++
          if (JSON.stringify(x) !== JSON.stringify(y) || server.isCorrect(v, a) !== client.isCorrect(v, a)) mismatches.push(`${v.id} ${v.lang || 'en'} ${JSON.stringify(a)}: ${JSON.stringify(x)} vs ${JSON.stringify(y)}`)
        }
      }
    }
  }
  assert.deepEqual(mismatches.slice(0, 10), [])
  assert.ok(compared > 20000, `compared ${compared} answers`)
})
