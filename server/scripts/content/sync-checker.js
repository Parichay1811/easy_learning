#!/usr/bin/env node
// Copies the SHARED CORE of the answer checker from server/utils/scoreAnswer.js (CommonJS)
// into client/src/utils/scoreAnswer.js (ES module), so both apply exactly the same rules.
//   node server/scripts/content/sync-checker.js          write the client copy
//   node server/scripts/content/sync-checker.js --check  exit 1 if the copies differ
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../../..')
const SERVER = path.join(ROOT, 'server/utils/scoreAnswer.js')
const CLIENT = path.join(ROOT, 'client/src/utils/scoreAnswer.js')
const BEGIN = '// ---- BEGIN SHARED CORE ----'
const END = '// ---- END SHARED CORE ----'

function core(text, file) {
  const a = text.indexOf(BEGIN), b = text.indexOf(END)
  if (a < 0 || b < a) throw new Error(`${file}: shared core markers not found`)
  return text.slice(a, b + END.length)
}

const HEADER = `// Answer checker, client copy (ES module). Same rules as server/utils/scoreAnswer.js:
// the code between the SHARED CORE markers is copied from the server file by
//   node server/scripts/content/sync-checker.js
// (never edit it here; server/test/answer-check-parity.test.js fails if the copies drift).
//
// checkAnswer(question, userAnswer) -> { status: "correct"|"close"|"incorrect"|"uncertain"|"ungraded",
//   correct, score, reason?, misconception? }. isCorrect(q, a) === checkAnswer(q, a).correct.
// "close", "uncertain" and "ungraded" answers are never counted as right for mastery
// ("ungraded" has correct:true so a practice answer is never called wrong).

`
const FOOTER = `

export { checkAnswer, isCorrect, partialFraction, canon, loose, numberTokens, parseNumberAnswer, CHECKER_VERSION }
`

function build() {
  const server = fs.readFileSync(SERVER, 'utf8')
  return HEADER + core(server, SERVER) + FOOTER
}

if (require.main === module) {
  const want = build()
  const have = fs.existsSync(CLIENT) ? fs.readFileSync(CLIENT, 'utf8') : ''
  if (process.argv.includes('--check')) {
    if (want !== have) { console.error('client/src/utils/scoreAnswer.js is out of date: run node server/scripts/content/sync-checker.js'); process.exit(1) }
    console.log('answer checker copies are identical')
  } else if (want !== have) {
    fs.writeFileSync(CLIENT, want)
    console.log('wrote', path.relative(ROOT, CLIENT))
  } else console.log('client copy already up to date')
}

module.exports = { build, core, SERVER, CLIENT }
