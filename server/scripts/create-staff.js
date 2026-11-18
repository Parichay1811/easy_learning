/**
 * create-staff.js: add a named console account from the command line (SUP-001),
 * e.g. the first owner on a fresh install. Prints a temporary password once; the
 * person must choose a new password and set up two-factor sign-in when they
 * first sign in at /superadmin-login. Owners can add everyone else in the console.
 *
 *   cd server
 *   node scripts/create-staff.js owner@learnigo.eu "Ada Owner" owner
 */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const crypto = require('crypto')
const bcrypt = require('bcryptjs')

async function main() {
  const [email, name, role = 'owner'] = process.argv.slice(2)
  const Staff = require('../models/superadmin/Staff')
  if (!email || !name || !Staff.STAFF_ROLES.includes(role)) {
    console.log(`Usage: node scripts/create-staff.js <email> "<name>" <${Staff.STAFF_ROLES.join('|')}>`)
    process.exit(1)
  }
  const db = require('../db/superAdminDb')
  await db.asPromise()
  if (await Staff.exists({ email: email.toLowerCase() })) { console.log('A staff account with this email already exists.'); process.exit(1) }
  const password = crypto.randomBytes(12).toString('base64url')
  await Staff.create({ email, name, role, passwordHash: await bcrypt.hash(password, 12), mustChangePassword: true, createdBy: 'cli' })
  console.log(`Created ${role} ${email}. Temporary password (shown once): ${password}`)
  await db.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
