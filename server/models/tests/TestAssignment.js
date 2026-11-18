const mongoose = require('mongoose')
const adminDb = require('../../db/adminDb')

// Who a test is for (TCH-032): whole groups, some students, or a group minus some.
// Membership is resolved when read, so a student who joins the group later gets it too.
const schema = new mongoose.Schema({
  orgId: { type: String, required: true, index: true },
  testId: { type: String, required: true, index: true },
  ownerTutorId: { type: String, required: true },
  batchIds: { type: [String], default: [], index: true },
  studentIds: { type: [String], default: [], index: true },
  excludedStudentIds: { type: [String], default: [] },
  notifyParents: { type: Boolean, default: false },
  reminders: {
    openSentAt: { type: Date, default: null },
    dayBeforeSentAt: { type: Date, default: null },
    closeSentAt: { type: Date, default: null },
  },
  active: { type: Boolean, default: true },
}, { timestamps: true })

module.exports = adminDb.model('TestAssignment', schema)
