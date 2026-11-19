const mongoose = require('mongoose')

// One "connect with me" request between two people (services/linkRequests.js).
// Somebody types the other person's email; that person sees the request in their
// inbox and taps Accept or Decline. Nothing is shared before Accept. The request
// is bound to the email it was sent to: only someone signed in with that email,
// in the right role, can answer it. If nobody has an account with that email yet,
// the request waits and shows up once they sign up.
//
//   kind     from -> to                 what Accept does
//   family   parent  -> student         the parent's Child link becomes verified
//            student -> parent          a verified Child link for that parent
//   class    teacher -> student         the learner joins the teacher's group
//            student -> teacher         the teacher picks a group; the learner joins it
//   staff    admin   -> teacher         a Tutor in the school
//            teacher -> admin           a Tutor in the admin's school
//   enrol    admin   -> student         the learner joins the school (and a group, if chosen)
const ROLES = ['student', 'parent', 'teacher', 'admin']

const schema = new mongoose.Schema({
  kind: { type: String, enum: ['family', 'class', 'staff', 'enrol'], required: true },
  fromRole: { type: String, enum: ROLES, required: true },
  fromId: { type: String, required: true },          // parent / tutor / admin id; a learner's or a not-yet-teacher's email
  fromEmail: { type: String, required: true, lowercase: true, trim: true },
  fromName: { type: String, default: '', trim: true, maxlength: 80 },
  toRole: { type: String, enum: ROLES, required: true },
  toEmail: { type: String, required: true, lowercase: true, trim: true },
  toName: { type: String, default: '', trim: true, maxlength: 80 },  // what the sender called them

  // Where it leads: the school / workspace and group, or the parent's child row.
  orgId: { type: String, default: null },
  orgName: { type: String, default: '' },
  groupId: { type: String, default: null },
  groupName: { type: String, default: '' },
  childId: { type: String, default: null },
  childName: { type: String, default: '', maxlength: 60 },
  childAge: { type: Number, default: null, min: 1, max: 25 },

  status: { type: String, enum: ['pending', 'accepted', 'declined', 'cancelled'], default: 'pending' },
  expiresAt: { type: Date, required: true },
  respondedAt: { type: Date, default: null },
  result: { type: mongoose.Schema.Types.Mixed, default: null },
  // Old answered or expired requests are removed after a while (TTL).
  purgeAt: { type: Date, required: true },
}, { timestamps: true })

schema.index({ toEmail: 1, toRole: 1, status: 1 })
schema.index({ fromRole: 1, fromEmail: 1, createdAt: -1 })
schema.index({ fromRole: 1, fromId: 1, createdAt: -1 })
schema.index({ orgId: 1, fromRole: 1, createdAt: -1 })
schema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('LinkRequest', schema)
module.exports.ROLES = ROLES
