// Managed learners (FND-011): children without an email, created by a parent or
// a teacher, who sign in with a login code and a picture password.
//
//   const { learner, loginCode, picturePassword } = await createManagedLearner({ name, age, avatar, createdByRole, createdById, orgId, batchId })
//
// `loginCode` and `picturePassword` are returned ONCE, in clear, so the adult can
// write them down or print a card; only hashes are stored. The learner's data is
// keyed by `learner.email` (synthetic, `ml-<id>@managed.learnigo.invalid`).
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const ManagedLearner = require('../models/ManagedLearner')

// The picture password alphabet. The client shows the same ids with these emoji.
const PICTURES = ['dog', 'cat', 'lion', 'frog', 'panda', 'unicorn', 'octopus', 'apple', 'star', 'rocket', 'rainbow', 'flower']
const PICTURE_LENGTH = 3
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O, 1/I
const CODE_LENGTH = 6
const DOMAIN = 'managed.learnigo.invalid'

const emailFor = (id) => `ml-${String(id)}@${DOMAIN}`
const isManagedEmail = (email) => String(email || '').toLowerCase().endsWith(`@${DOMAIN}`)

function newLoginCode() {
  let out = ''
  for (let i = 0; i < CODE_LENGTH; i++) out += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]
  return out
}

// What people type: lowercase, spaces, a dash. null if it can't be a code.
function cleanLoginCode(input) {
  const code = String(input || '').toUpperCase().replace(/[\s-]/g, '')
  if (code.length !== CODE_LENGTH) return null
  return [...code].every((c) => CODE_ALPHABET.includes(c)) ? code : null
}

const hashLoginCode = (code) => crypto.createHash('sha256').update(`managed|${code}`).digest('hex')

function newPicturePassword() {
  return Array.from({ length: PICTURE_LENGTH }, () => PICTURES[crypto.randomInt(PICTURES.length)])
}

// ['cat','star','dog'] or 'cat,star,dog' -> 'cat,star,dog', or null.
function cleanPictures(input) {
  const list = Array.isArray(input) ? input : String(input || '').split(',')
  const clean = list.map((p) => String(p).trim().toLowerCase())
  if (clean.length !== PICTURE_LENGTH || !clean.every((p) => PICTURES.includes(p))) return null
  return clean.join(',')
}

// A display code people can read out: 'ABC 234'.
const formatCode = (code) => `${code.slice(0, 3)} ${code.slice(3)}`

async function createManagedLearner({ name, age, avatar, createdByRole, createdById, orgId = null, batchId = null }) {
  const cleanName = String(name || '').trim().slice(0, 60)
  if (!cleanName) throw Object.assign(new Error('A name is required'), { status: 400 })
  if (!['parent', 'teacher', 'admin'].includes(createdByRole) || !createdById) throw Object.assign(new Error('Unknown creator'), { status: 400 })
  const picturePassword = newPicturePassword()
  const pictureHash = await bcrypt.hash(picturePassword.join(','), 10)
  const _id = new mongoose.Types.ObjectId()

  // A fresh code; retry on the (tiny) chance it is taken.
  for (let attempt = 0; attempt < 5; attempt++) {
    const loginCode = newLoginCode()
    try {
      const learner = await ManagedLearner.create({
        _id, name: cleanName, age: Number(age) || null, avatar: String(avatar || '').slice(0, 8),
        email: emailFor(_id), loginCodeHash: hashLoginCode(loginCode), pictureHash,
        createdByRole, createdById: String(createdById), orgId: orgId ? String(orgId) : null, batchId: batchId ? String(batchId) : null,
      })
      // A school learner also needs a roster row so the existing teacher and admin scopes see them.
      if (orgId) {
        const Student = require('../models/admin/Student')
        await Student.create({ name: cleanName, email: learner.email, age: Number(age) >= 3 ? Number(age) : null, orgId, batchIds: batchId ? [batchId] : [], status: 'active' })
      }
      return { learner, loginCode: formatCode(loginCode), picturePassword }
    } catch (err) {
      if (err.code === 11000 && /loginCodeHash/.test(err.message)) continue
      throw err
    }
  }
  throw new Error('Could not create a unique login code')
}

// New code and pictures for a learner whose card got lost. Old ones stop working.
async function resetManagedLogin(learnerId) {
  const learner = await ManagedLearner.findById(learnerId)
  if (!learner) throw Object.assign(new Error('Learner not found'), { status: 404 })
  const picturePassword = newPicturePassword()
  learner.pictureHash = await bcrypt.hash(picturePassword.join(','), 10)
  for (let attempt = 0; attempt < 5; attempt++) {
    const loginCode = newLoginCode()
    learner.loginCodeHash = hashLoginCode(loginCode)
    learner.failedLogins = 0
    learner.lockedUntil = null
    try {
      await learner.save()
      return { learner, loginCode: formatCode(loginCode), picturePassword }
    } catch (err) {
      if (err.code === 11000) continue
      throw err
    }
  }
  throw new Error('Could not create a unique login code')
}

// The same work whether or not the code exists, so timing doesn't reveal it.
const DUMMY_HASH = bcrypt.hashSync('dog,dog,dog', 10)
const MAX_FAILS = 5
const LOCK_MS = 15 * 60 * 1000

// -> the learner, or null. Never says which part was wrong.
async function verifyManagedLogin(loginCode, pictures) {
  const code = cleanLoginCode(loginCode)
  const pics = cleanPictures(pictures)
  const learner = code ? await ManagedLearner.findOne({ loginCodeHash: hashLoginCode(code) }) : null
  const ok = await bcrypt.compare(pics || 'x', learner?.pictureHash || DUMMY_HASH)
  if (!learner || learner.status !== 'active') return null
  if (learner.lockedUntil && learner.lockedUntil > new Date()) return null
  if (!ok || !pics) {
    learner.failedLogins = (learner.failedLogins || 0) + 1
    if (learner.failedLogins >= MAX_FAILS) { learner.lockedUntil = new Date(Date.now() + LOCK_MS); learner.failedLogins = 0 }
    await learner.save()
    return null
  }
  learner.failedLogins = 0
  learner.lockedUntil = null
  learner.lastLoginAt = new Date()
  await learner.save()
  return learner
}

module.exports = {
  createManagedLearner, resetManagedLogin, verifyManagedLogin,
  PICTURES, PICTURE_LENGTH, DOMAIN, emailFor, isManagedEmail, cleanLoginCode, cleanPictures, hashLoginCode, formatCode,
}
