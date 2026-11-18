const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, default: '' },
  subject: { type: String, default: '' },
  subjectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  batchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
  studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  uid: { type: String, default: '' },
  photoURL: { type: String, default: '' },
  authStatus: { type: String, enum: ['unclaimed', 'active', 'disabled'], default: 'unclaimed' },
  lastLoginAt: { type: Date, default: null },
  // Units (sections, grades, departments) this teacher belongs to (ADM-010/020).
  unitIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrgUnit' }],
}, { timestamps: true })

schema.index({ orgId: 1, email: 1 }, { unique: true })
schema.index({ uid: 1 }, { unique: true, partialFilterExpression: { uid: { $type: 'string', $gt: '' } } })

module.exports = adminDb.model('Tutor', schema)
