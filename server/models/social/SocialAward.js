const mongoose = require('mongoose')

// What a learner has won by learning with others (G-516): ribbons from friendly matches,
// team trophies and the personal award of each ceremony. Each one keeps the numbers behind
// it (`evidence`: small numbers only), like growth badges. Nothing here is ever taken away.
const schema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  // ribbon (match), brave (match), together (buddy round), trophy (team reached its goal),
  // first_flag (the first team there), award (the personal award of a ceremony), jar (friends' star jar)
  kind: { type: String, enum: ['ribbon', 'brave', 'together', 'trophy', 'first_flag', 'award', 'jar'], required: true },
  award: { type: String, default: '' }, // config/social.js AWARDS for kind 'award'
  sourceType: { type: String, enum: ['match', 'team', 'jar'], required: true },
  sourceId: { type: String, required: true },
  title: { type: String, default: '', maxlength: 80 }, // the match's title or the team's name key
  evidence: { type: mongoose.Schema.Types.Mixed, default: {} },
  earnedAt: { type: Date, default: Date.now },
  seenAt: { type: Date, default: null },
}, { versionKey: false })

schema.index({ email: 1, earnedAt: -1 })
schema.index({ email: 1, kind: 1, sourceType: 1, sourceId: 1 }, { unique: true })

module.exports = mongoose.model('SocialAward', schema)
