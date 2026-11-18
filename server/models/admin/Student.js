const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String, default: '', lowercase: true, trim: true,
    match: [/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
  },
  age: { type: Number, default: null, min: 3, max: 25 },
  grade: { type: String, default: '' },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  tutorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tutor' }],
  batchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
  parentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  // Test accommodations (TCH-034), applied to every test automatically.
  accommodations: {
    extraTime: { type: Number, enum: [1, 1.25, 1.5, 2], default: 1 },
    readAloud: { type: Boolean, default: false },
    largerText: { type: Boolean, default: false },
    fewerOptions: { type: Boolean, default: false },
    note: { type: String, default: '', maxlength: 300 },
  },
}, { timestamps: true })

module.exports = adminDb.model('Student', schema)
