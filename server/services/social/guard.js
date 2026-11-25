// Who is this learner, and what may they do with other learners? (G-518)
//
// Three things decide it, the strictest wins:
//   the grown-ups' switches   Child.together on every verified guardian link
//   the learner's own switches PlayerCard.friends / matches / mystery
//   the school's policy        OrgPolicy.competitions (team matches in its groups)
//
//   standing(email) -> { email, supervised, age, child, friends, matches, mystery, shorts, needsAdultOk }
const Child = require('../../models/Child')
const ManagedLearner = require('../../models/ManagedLearner')
const cfg = require('../../config/social')

const lower = (s) => String(s || '').trim().toLowerCase()

class SocialError extends Error {
  constructor(status, message, code) { super(message); this.status = status; if (code) this.code = code }
}

// The grown-ups' switches for one learner: a "no" from any grown-up is a no, and one
// grown-up asking to approve friends is enough to ask.
function strictest(rows) {
  const out = { friends: true, friendApproval: false, matches: true, mystery: true, shorts: true }
  for (const r of rows) {
    const g = r.together || {}
    if (g.friends === false) out.friends = false
    if (g.matches === false) out.matches = false
    if (g.shorts === false) out.shorts = false
    if (g.mystery !== true) out.mystery = false // off unless every grown-up turned it on
    if (g.friendApproval !== false) out.friendApproval = true
  }
  return out
}

async function standing(email, card = null) {
  const e = lower(email)
  const [rows, managed] = await Promise.all([
    Child.find({ email: e, linkStatus: 'verified' }).select('age together parentId').lean(),
    ManagedLearner.findOne({ email: e }).select('age createdByRole').lean(),
  ])
  const supervised = rows.length > 0
  const ages = [...rows.map((r) => r.age), managed?.age].filter((a) => Number.isFinite(a))
  const age = ages.length ? Math.min(...ages) : null
  // A learner an adult set up without an email, or one whose age we know to be young, is a child.
  const child = age != null ? age < cfg.friends.adultApprovalUnder : Boolean(managed)
  const adult = supervised ? strictest(rows) : { friends: true, friendApproval: false, matches: true, mystery: true, shorts: true }
  const own = card || { friends: true, matches: true, mystery: false }
  return {
    email: e, supervised, age, child,
    parentIds: rows.map((r) => String(r.parentId)),
    adult,
    friends: adult.friends && own.friends !== false,
    matches: adult.matches && own.matches !== false,
    // Someone new: only when the learner asked for it and no grown-up said no. For a
    // supervised child a grown-up has to switch it on.
    mystery: adult.matches && own.matches !== false && own.mystery === true && (supervised ? adult.mystery : !child),
    shorts: adult.shorts,
    needsAdultOk: supervised && child && adult.friendApproval,
  }
}

module.exports = { standing, strictest, SocialError, lower }
