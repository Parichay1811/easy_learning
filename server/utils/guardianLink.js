// Who may see a learner's data through a parent link (FND-001, FND-012).
//
// A parent typing a learner's email proves nothing, so a new link starts
// `pending` and shows no data. It becomes `verified` when:
//   - a school already linked this parent to this student (org Parent record
//     with the same email, listing a Student with the child's email), or
//   - the learner generated a one-time code and the parent entered it.
const crypto = require('crypto')

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O, 1/I
const CODE_LENGTH = 6
const CODE_TTL_MS = 24 * 60 * 60 * 1000
const MAX_ACTIVE_CODES = 5

const norm = (s) => String(s || '').trim().toLowerCase()

function newCode() {
  let out = ''
  for (let i = 0; i < CODE_LENGTH; i++) out += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]
  return out
}

// What people type: lowercase, spaces or a dash. Returns null if it can't be a code.
function cleanCode(input) {
  const code = String(input || '').toUpperCase().replace(/[\s-]/g, '')
  if (code.length !== CODE_LENGTH) return null
  return [...code].every((c) => CODE_ALPHABET.includes(c)) ? code : null
}

// Bound to the email, so a code only works for the learner who made it.
const hashCode = (code, email) => crypto.createHash('sha256').update(`${code}|${norm(email)}`).digest('hex')

// The one rule every child route follows.
function childAccess(child) {
  if (!child) return { ok: false, status: 404, message: 'Child not found' }
  if (!child.email) return { ok: false, status: 404, message: 'Child has no linked learning account' }
  if (child.linkStatus === 'verified') return { ok: true }
  const why = child.linkStatus === 'revoked'
    ? 'This link was removed. Ask your child to share a new link code.'
    : "This link isn't verified yet. Ask your child (or their school) for a link code."
  return { ok: false, status: 403, message: why, code: 'LINK_NOT_VERIFIED', linkStatus: child.linkStatus || 'pending' }
}

// Did a school already connect this parent and this learner?
async function schoolLinkExists(parentEmail, childEmail, models) {
  const { OrgParent, OrgStudent } = models || {
    OrgParent: require('../models/admin/Parent'),
    OrgStudent: require('../models/admin/Student'),
  }
  const parents = await OrgParent.find({ email: norm(parentEmail), status: 'active' }).select('studentIds')
  const ids = parents.flatMap((p) => p.studentIds || [])
  if (!ids.length) return false
  return Boolean(await OrgStudent.exists({ _id: { $in: ids }, email: norm(childEmail) }))
}

// A small in-memory limiter for code guessing. One server process, so this is enough.
function createLimiter({ max, windowMs, now = Date.now }) {
  const hits = new Map()
  return {
    // true = allowed. Counts the attempt.
    take(key) {
      const t = now()
      const list = (hits.get(key) || []).filter((x) => t - x < windowMs)
      if (list.length >= max) { hits.set(key, list); return false }
      list.push(t)
      hits.set(key, list)
      return true
    },
    reset(key) { hits.delete(key) },
  }
}

module.exports = {
  CODE_TTL_MS, MAX_ACTIVE_CODES, newCode, cleanCode, hashCode, childAccess, schoolLinkExists, createLimiter, norm,
}
