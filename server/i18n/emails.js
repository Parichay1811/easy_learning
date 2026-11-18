// Server-side strings for emails (FND-061). English now; add a language by
// adding a block with the same keys (missing keys fall back to English).
// Placeholders: {name}. Keep the tone warm, short and specific.
const STRINGS = {
  en: {
    'common.open': 'Open Learnigo',
    'common.footer_why': 'You get this email because you have a Learnigo account.',
    'common.unsubscribe': 'Stop these emails',
    'common.settings': 'Email settings',
    'common.hi': 'Hi {name},',
    'common.hi_anon': 'Hello,',

    'notify.subject': '{title}',
    'notify.intro': 'You have a new update on Learnigo.',

    'daily.subject': 'Your Learnigo updates ({count})',
    'daily.intro': 'Here is what happened since yesterday.',

    'parent.subject_one': '{child}\'s week on Learnigo',
    'parent.subject_many': 'Your children\'s week on Learnigo',
    'parent.preheader': 'This week\'s learning, in one minute.',
    'parent.intro': 'Here is how the week went. It takes about a minute to read.',
    'parent.story_none': '{child} didn\'t learn on Learnigo this week. That\'s completely fine: a short session together is a lovely way to start again.',
    'parent.story_time': '{child} learned for {time} this week',
    'parent.story_more': ', {minutes} min more than last week',
    'parent.story_less': ', a little less than last week',
    'parent.story_answers': ' and answered {answered} questions, {accuracy} % of them right.',
    'parent.story_end': '.',
    'parent.tile_time': 'Time learning',
    'parent.tile_answered': 'Questions answered',
    'parent.tile_accuracy': 'Answers right',
    'parent.tile_days': 'Days active',
    'parent.tile_days_value': '{days} of 7',
    'parent.vs_last_week': 'vs last week',
    'parent.idea': 'One idea for the week ahead',
    'parent.button': 'See {child}\'s progress',
    'parent.why': 'You get this weekly email because {child} is linked to your Learnigo account.',
    'parent.why_many': 'You get this weekly email because {children} are linked to your Learnigo account.',
    'common.and': 'and',

    'idea.practise_next': 'Try a few {module} · {subject} questions together. It\'s the area with the most room to grow ({accuracy} % right).',
    'idea.no_activity': 'Pick a 10-minute slot, maybe after dinner on Monday, and do one round of Listen together.',
    'idea.time_down': 'Learning time dipped a little. A fixed daily slot (even 10 minutes) helps more than one long session.',
    'idea.accuracy_down': 'Accuracy dropped a bit. Revisiting last week\'s topics at an easier pace can rebuild confidence.',
    'idea.streak': 'A {days}-day streak! Tell {child} you noticed. Praise for effort keeps the habit going.',
    'idea.strongest': '{child} is strong in {module} · {subject} ({accuracy} %). Ask them to teach you one thing from it.',
    'idea.time_up': 'More learning time than last week. Ask {child} what they enjoyed most.',
    'idea.default': 'Ask {child} to show you their favourite game on Learnigo. Five minutes of interest from you goes a long way.',

    'teacher.subject': 'Your classes last week: {active} of {learners} learners active',
    'teacher.intro': 'Your Monday summary for last week.',
    'teacher.group_line': '{active} of {learners} active · {minutes} min in total · {accuracy} right',
    'teacher.nudge': 'Could use a nudge: {names}',
    'teacher.none_nudge': 'Nobody needs a nudge this week. Lovely.',
    'teacher.button': 'Open my classes',
    'teacher.empty': 'You have no groups yet.',

    'admin.subject': '{org}: {month} at a glance',
    'admin.intro': 'Your school\'s month on Learnigo.',
    'admin.tile_active': 'Learners active',
    'admin.tile_minutes': 'Minutes per learner',
    'admin.tile_accuracy': 'Answers right',
    'admin.tile_risk': 'Need a nudge',
    'admin.button': 'Open the school dashboard',

    'unsub.done_title': 'You\'re unsubscribed',
    'unsub.done_body': 'You won\'t get "{label}" emails any more. You can turn them back on any time in your notification settings.',
    'unsub.bad_title': 'This link didn\'t work',
    'unsub.bad_body': 'The unsubscribe link is incomplete or was changed. Please use the settings page in Learnigo instead.',

    'module.listen': 'Listen', 'module.read': 'Read', 'module.write': 'Write', 'module.speak': 'Speak',
    'subject.english': 'English', 'subject.maths': 'Maths', 'subject.science': 'Science',
  },
}

const LOCALES = Object.keys(STRINGS)

function t(locale, key, params = {}) {
  const base = String(locale || 'en').slice(0, 2)
  const s = STRINGS[base]?.[key] ?? STRINGS.en[key] ?? key
  return s.replace(/\{(\w+)\}/g, (m, k) => (params[k] == null ? '' : String(params[k])))
}

// "2 h 10 min" / "25 min" (same rule as the dashboards).
function duration(minutes) {
  const m = Math.round(minutes || 0)
  const h = Math.floor(m / 60)
  return h ? `${h} h ${m % 60} min` : `${m} min`
}

module.exports = { STRINGS, LOCALES, t, duration }
