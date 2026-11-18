// Consent records (FND-070). Parent and Admin features call these helpers; the
// history is append-only so it can always be shown and audited.
//
//   await recordConsent(req, { subjectEmail, childId, purpose: 'learning', status: 'given', policyVersion: '2026-11', method: 'link_code' })
//   await currentConsent(email, 'learning')   -> latest record or null
//   await consentHistory(email)               -> newest first
const ConsentRecord = require('../models/comms/ConsentRecord')

const PURPOSES = ['learning', 'data_sharing', 'ai_teacher', 'media', 'marketing', 'school_dpa']
const BASES = ['consent', 'contract', 'public_task', 'legitimate_interest', 'legal_obligation']
const CURRENT_POLICY_VERSION = process.env.CONSENT_POLICY_VERSION || '2026-11'

// GDPR Art. 8: the age under which a guardian must consent, by country (default 16).
const DIGITAL_CONSENT_AGE = { AT: 14, BE: 13, BG: 14, CY: 14, CZ: 15, DE: 16, DK: 13, EE: 13, ES: 14, FI: 13, FR: 15, GR: 15, HR: 16, HU: 16, IE: 16, IT: 14, LT: 14, LU: 16, LV: 13, MT: 13, NL: 16, PL: 16, PT: 13, RO: 16, SE: 13, SI: 16, SK: 16, GB: 13, NO: 13, IS: 13 }
const needsGuardianConsent = (age, country) => age == null || age < (DIGITAL_CONSENT_AGE[String(country || '').toUpperCase()] || 16)

// Never throws a 500 into a feature: returns the record or { error }.
async function recordConsent(req, { subjectEmail, subjectName = '', childId = '', studentId = '', orgId = '', purpose, status = 'given', legalBasis = 'consent', policyVersion = CURRENT_POLICY_VERSION, method = '' }) {
  if (!subjectEmail) return { error: 'subjectEmail is required' }
  if (!PURPOSES.includes(purpose)) return { error: `purpose must be one of ${PURPOSES.join(', ')}` }
  if (!['given', 'withdrawn'].includes(status)) return { error: 'status must be given or withdrawn' }
  if (!BASES.includes(legalBasis)) return { error: `legalBasis must be one of ${BASES.join(', ')}` }
  const a = req?.actor || {}
  try {
    return await ConsentRecord.create({
      subjectEmail, subjectName, childId: String(childId || ''), studentId: String(studentId || ''), orgId: String(orgId || ''),
      purpose, status, legalBasis, policyVersion, method, byRole: a.role || 'system', byId: String(a.id || 'system'), byName: a.name || '', ip: req?.ip || '',
    })
  } catch (err) {
    console.error('recordConsent failed:', err.message)
    return { error: 'Could not save consent' }
  }
}

async function currentConsent(subjectEmail, purpose) {
  return ConsentRecord.findOne({ subjectEmail: String(subjectEmail).toLowerCase(), purpose }).sort({ createdAt: -1, _id: -1 }).lean()
}

const hasConsent = async (subjectEmail, purpose) => (await currentConsent(subjectEmail, purpose))?.status === 'given'

async function consentHistory(subjectEmail, { limit = 100 } = {}) {
  return ConsentRecord.find({ subjectEmail: String(subjectEmail).toLowerCase() }).sort({ createdAt: -1, _id: -1 }).limit(Math.min(limit, 500)).lean()
}

// What other people may see of a record (no IP; the person's name and role, not their email or id).
const publicView = (r) => ({ id: String(r._id), purpose: r.purpose, status: r.status, legalBasis: r.legalBasis, policyVersion: r.policyVersion, method: r.method, byRole: r.byRole, byName: r.byName, at: r.createdAt })

module.exports = { recordConsent, currentConsent, hasConsent, consentHistory, publicView, needsGuardianConsent, PURPOSES, BASES, CURRENT_POLICY_VERSION, DIGITAL_CONSENT_AGE }
