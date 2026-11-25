// Feedback after an answer: one message, chosen from a varied set and grounded
// in what really happened (never "You remembered this from yesterday" unless
// there was a real miss at least 20 h earlier). Process praise only: effort,
// strategy, practice, persistence; never "clever" or "smart". Pure.
//
// The client shows t("learn.feedback." + key, { ...params, defaultValue: text });
// params holding { id, name } are skills (translated with t("skills." + id, name)).
// All keys and English texts are listed in MESSAGES (and in the i18n file).
const cfg = require('../../config/learning')

const MESSAGES = {
  // Level and skill milestones
  levelUp: "You've moved up to level {{level}}. Your steady practice got you here.",
  correctNextSkill: '{{skill}} is looking solid. Next up: {{next}}.',
  masteredSkill: '{{skill}} is looking solid now. That came from your practice.',
  // Real memory: a miss at least 20 hours ago, right now
  rememberedYesterday: 'You remembered this from yesterday.',
  cameBack: '{{skill}} came back today, and you got it.',
  // A new approach worked after a struggle
  picturesHelped: 'Looking at it with pictures worked.',
  stepsHelped: 'Going step by step worked.',
  warmUpHelped: 'Starting with an easier one helped you get there.',
  fixedIt: 'You spotted what to change and got it right.',
  secondTry: 'Checking again paid off.',
  // Specific, grounded praise
  firstCorrect: '{{skill}}: your first one, and you got it.',
  noHintThisTime: 'You did that one without a hint.',
  onARoll: '{{skill}}: that makes {{count}} in a row.',
  practiceAddsUp: '{{skill}}: your practice is adding up.',
  wellBuilt: 'Well built: every piece in the right place.',
  hintHelped: 'Using the hint helped you get there.',
  // Plain acknowledgements (rotated)
  rightAnswer: "That's right.",
  thatsIt: "Yes, that's it.",
  nicelyDone: 'Nicely done.',
  // Close
  closeSpelling: 'So close. Check the spelling once more.',
  closeCapitals: 'So close. Check the capital letters once more.',
  closePunctuation: 'So close. Check the full stop and the other marks once more.',
  closeCapitalsPunctuation: 'So close. Check the capital letters and the full stop once more.',
  closeNumber: 'The number is right, just written a different way.',
  closeGeneric: 'Very close. Have another look.',
  // A different approach next time (the escalation)
  tryPictures: "Not quite. Next time this comes up, we'll look at it with pictures.",
  tryTogether: "Not quite. Next time we'll go through it together, step by step.",
  easierFirst: "Let's warm up with an easier one first, then come back to this.",
  parkIt: "Let's leave this one for today and come back to it tomorrow.",
  // A miss
  newSkillTricky: "{{skill}} is new, so it's fine to find it tricky at first.",
  notYet: "Not quite this time. Let's look at it again.",
  lookAgain: 'Not this one. The hint can show you where to look.',
  keepGoing: "That one didn't work out. Each try shows what to practise next.",
  // Not counted either way
  noSpeech: "I didn't catch that, so it doesn't count either way. Try again when you're ready.",
  noSpeechAgain: "Still nothing heard. Try speaking a little closer to the microphone. This one doesn't count.",
  micBlocked: "The microphone is off, so this one doesn't count. You can type or choose instead.",
  notChecked: "I couldn't check that one, so it doesn't count either way.",
  practiceOnly: "Thanks for answering. This one is just for practice, so there's no wrong answer.",
  sharedIdea: 'Thanks for sharing your idea.',
  // The same in a Warrior round: said as it is (not scored), never "there is no wrong answer"
  warriorNotScored: "Thanks for sharing your idea. This one isn't scored, so it doesn't change your Warrior result.",
  warriorOpen: "Thank you for that. Open questions like this one aren't scored in Warrior.",
}

const SUGGESTIONS = {
  levelUp: 'Level {{level}} is going well. Ready to try level {{next}}?',
  levelDown: 'Level {{level}} has been tricky lately. Would some time at level {{to}} help? You can move up again any time.',
  review: '{{skill}} needs a different approach. It may help to look at it together.',
  takeBreak: "You've been working hard. A short break can help, then come back fresh.",
}

const BUILD = new Set(['letter_bank', 'drag_order', 'match_pairs', 'sort_bins', 'tap_sequence', 'drag_to_blank'])
const HOUR = 3600000

function render(template, params = {}) {
  return String(template).replace(/\{\{(\w+)\}\}/g, (_, k) => {
    const v = params[k]
    if (v && typeof v === 'object') return v.name ?? v.id ?? ''
    return v == null ? '' : String(v)
  })
}

const message = (key, params = {}) => ({ key, params, text: render(MESSAGES[key], params) })
const suggestionText = (key, params = {}) => render(SUGGESTIONS[key], params)

// Pick one key from ordered groups: the first group with a usable key wins;
// inside a group keys rotate (counter) and the learner's last key is skipped.
function pickKey(groups, lastKey, counter = 0) {
  for (const group of groups) {
    const usable = group.filter((k) => k && k !== lastKey)
    if (usable.length) return usable[counter % usable.length]
  }
  // Everything equals the last key: use it rather than say nothing.
  return groups.flat().find(Boolean) || 'rightAnswer'
}

// "So close": what to look at again, by the checker's reason (utils/scoreAnswer.js).
const CLOSE_KEY = { spelling: 'closeSpelling', number_form: 'closeNumber', capitals: 'closeCapitals', punctuation: 'closePunctuation', capitals_punctuation: 'closeCapitalsPunctuation' }
const closeGroups = (reason) => [...(CLOSE_KEY[reason] ? [[CLOSE_KEY[reason]]] : []), ['closeGeneric']]

// ctx: {
//   status, reason, outcome, firstTry, hintsUsed, interaction,
//   skill: { id, name }, next: { id, name } | null, levelChange: { to } | null,
//   events (from mastery.updateSkill) | null, graded, now,
//   mode ('practice' | 'warrior' | 'challenge' | …): a Warrior round says an open answer is not scored
// }
function chooseMessage(ctx, { lastKey = '', counter = 0 } = {}) {
  const { status, reason, events: ev, skill, now = new Date() } = ctx
  const groups = []

  if (status === 'uncertain') {
    if (reason === 'no_speech' || reason === 'no-speech') groups.push(['noSpeech', 'noSpeechAgain'])
    else if (reason === 'mic_blocked' || reason === 'not-allowed') groups.push(['micBlocked'])
    groups.push(['notChecked'])
  } else if (status === 'ungraded' || ctx.graded === false) {
    // Warrior has a result (a pass mark, a best to beat): an open answer is left out of it, and says so.
    groups.push(ctx.mode === 'warrior' ? ['warriorNotScored', 'warriorOpen'] : ['practiceOnly', 'sharedIdea'])
  } else if (!ev) {
    // Not counted by the engine (e.g. a timed game): a plain, honest reply.
    if (status === 'correct') groups.push(['rightAnswer', 'thatsIt', 'nicelyDone'])
    else if (status === 'close') groups.push(...closeGroups(reason))
    else groups.push(['notYet', 'lookAgain', 'keepGoing'])
  } else if (ev.outcome === 'close') {
    groups.push(...closeGroups(reason))
  } else if (ev.outcome === 'incorrect') {
    if (ev.parked) groups.push(['parkIt'])
    else if (ev.stepUp && ev.strategy === 'simpler') groups.push(['easierFirst'])
    else if (ev.stepUp && ev.strategy === 'guided') groups.push(['tryTogether'])
    else if (ev.stepUp && ev.strategy === 'visual') groups.push(['tryPictures'])
    if (ev.before.attempts === 0) groups.push(['newSkillTricky'])
    groups.push(['notYet', 'lookAgain', 'keepGoing'])
  } else {
    // Right (independent or with help)
    const b = ev.before
    if (ctx.levelChange) groups.push(['levelUp'])
    if (ev.newlyMastered) groups.push(ctx.next ? ['correctNextSkill'] : ['masteredSkill'])
    const missAgo = b.lastMissAt ? now.getTime() - new Date(b.lastMissAt).getTime() : null
    if (b.lastOutcome === 'incorrect' && missAgo != null && missAgo >= cfg.rememberMinHours * HOUR) {
      groups.push(missAgo <= cfg.rememberYesterdayMaxHours * HOUR ? ['rememberedYesterday'] : ['cameBack'])
    }
    if (ev.recovered) {
      const s = ev.strategyCredited
      groups.push([s === 'visual' ? 'picturesHelped' : s === 'guided' ? 'stepsHelped' : s === 'simpler' ? 'warmUpHelped' : null, 'fixedIt'].filter(Boolean))
    }
    if (ctx.firstTry === false) groups.push(['secondTry'])
    const specific = []
    if (b.attempts === 0) specific.push('firstCorrect')
    if (ev.outcome === 'independent' && b.lastOutcome === 'assisted') specific.push('noHintThisTime')
    if (b.streak + 1 >= 3) specific.push('onARoll')
    if (b.attempts >= 4 && ev.masteryDelta > 0) specific.push('practiceAddsUp')
    if (ev.outcome === 'independent' && BUILD.has(ctx.interaction)) specific.push('wellBuilt')
    if (ev.outcome === 'assisted' && Number(ctx.hintsUsed) > 0) specific.push('hintHelped')
    if (specific.length) groups.push(specific)
    groups.push(['rightAnswer', 'thatsIt', 'nicelyDone'])
  }

  const key = pickKey(groups, lastKey, counter)
  // The skill is always in params (the client may show it), even when the text does not name it.
  const params = {}
  if (skill && !['noSpeech', 'noSpeechAgain', 'micBlocked', 'notChecked'].includes(key)) params.skill = { id: skill.id, name: skill.name }
  if (key === 'correctNextSkill' && ctx.next) params.next = { id: ctx.next.id, name: ctx.next.name }
  if (key === 'levelUp' && ctx.levelChange) params.level = ctx.levelChange.to
  if (key === 'onARoll') params.count = (ev?.before?.streak || 0) + 1
  return message(key, params)
}

module.exports = { MESSAGES, SUGGESTIONS, chooseMessage, pickKey, render, message, suggestionText }
