const mongoose = require('mongoose')

// Website visits, as daily totals (routes/visits.js). One document per day,
// page, language, source, channel and campaign, updated with $inc. Counts only:
// no IP address, browser details, cookie or anything else about a visitor is
// ever stored, so nothing here is personal data.
const schema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD, UTC
  path: { type: String, required: true }, // a public page (/faq) or a sign-in screen (/parent-login)
  lang: { type: String, required: true },
  source: { type: String, required: true }, // analytics/visitSource.js
  channel: { type: String, required: true },
  campaign: { type: String, default: '' }, // utm_campaign
  views: { type: Number, default: 0 }, // views of a public page
  entries: { type: Number, default: 0 }, // views that started a visit (the landing page)
  starts: { type: Number, default: 0 }, // arrivals on a sign-in screen
}, { versionKey: false })

schema.index({ date: 1, path: 1, lang: 1, source: 1, channel: 1, campaign: 1 }, { unique: true })

module.exports = mongoose.model('SiteVisitDay', schema)
