const mongoose = require('mongoose')

// One message in a Thread (FND-051). Attachments live outside the public
// /uploads folder and are only served to the thread's participants.
const attachment = new mongoose.Schema({
  name: { type: String, required: true },
  file: { type: String, required: true },        // stored filename (never a path from the client)
  type: { type: String, required: true },
  size: { type: Number, required: true },
}, { _id: false })

const schema = new mongoose.Schema({
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true },
  orgId: { type: String, required: true },
  senderKey: { type: String, required: true },
  senderRole: { type: String, required: true },
  body: { type: String, default: '', maxlength: 4000 },
  attachments: { type: [attachment], default: [] },
  flagged: { type: Boolean, default: false },
  hidden: { type: Boolean, default: false },     // hidden by a moderator after a report
}, { timestamps: true })

schema.index({ threadId: 1, createdAt: -1 })
schema.index({ orgId: 1, createdAt: -1 })

module.exports = mongoose.model('Message', schema)
