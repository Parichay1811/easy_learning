const mongoose = require('mongoose')

// How one account wants to hear about each kind of notification (FND-050).
// `owner` is "<role>:<id>" like Notification.to. A missing document, or a kind
// missing from `kinds`, means "use the kind's default" (utils/notifyPrefs.js).
const schema = new mongoose.Schema({
  owner: { type: String, required: true, unique: true },
  // kind -> 'instant' | 'digest' | 'off'. Stored as an array so ids with dots are safe.
  kinds: [{ _id: false, kind: { type: String, required: true }, mode: { type: String, enum: ['instant', 'digest', 'off'], required: true } }],
  // Emails can be paused completely (the bell still works).
  emailOff: { type: Boolean, default: false },
  locale: { type: String, default: 'en' },
  // IANA timezone for digests ("Sunday evening, your time"). Learned from X-Timezone.
  tz: { type: String, default: '' },
  lastDailyDigestAt: { type: Date, default: null },
}, { timestamps: true })

module.exports = mongoose.model('NotificationPref', schema)
