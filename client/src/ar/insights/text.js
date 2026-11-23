/**
 * Findings → words, for a child and for an adult.
 *
 * Pure: the caller passes i18next's `t` and two name lookups, so this runs in
 * the browser and in `node --test` alike. Every sentence is an i18n key with
 * its English text as the default (all of them are listed in TEXT, which is
 * also what the i18n key list is generated from).
 *
 * Wording rules: short sentences a screen reader (or the narrator) can read in
 * one breath; praise the process (practice, trying again, regular play), never
 * the person; no comparison with other children; nothing that sounds like a
 * diagnosis or a label. "Worth more practice" is where the next session is
 * worth spending, not a verdict.
 */

const K = 'ar.findings.'
const S = (key, text) => ({ key: K + key, text })
const P = (key, one, other) => ({ key: K + key, one, other })

export const TEXT = {
  // What kind of finding it is: always shown as a word, never as colour alone.
  kind: {
    gettingBetter: S('kind.gettingBetter', 'Getting better'),
    strength: S('kind.strength', 'Going well'),
    needsPractice: S('kind.needsPractice', 'Worth more practice'),
    independence: S('kind.independence', 'On their own'),
    consistency: S('kind.consistency', 'Regular play'),
    effort: S('kind.effort', 'Effort'),
    notEnough: S('kind.notEnough', 'Too early to tell'),
  },
  trend: {
    up: S('trend.up', 'up'),
    down: S('trend.down', 'down'),
    flat: S('trend.flat', 'about the same'),
    none: S('trend.none', 'nothing to compare with yet'),
    quicker: S('trend.quicker', 'quicker'),
    slower: S('trend.slower', 'slower'),
    upBy: S('trend.upBy', 'up {{n}} points'),
    downBy: S('trend.downBy', 'down {{n}} points'),
  },
  adult: {
    understandingUp: S('adult.understandingUp', '{{skill}}: understood {{now}}% of turns, up from {{before}}% in the period before.'),
    understandingStrong: S('adult.understandingStrong', '{{skill}}: going well, {{now}}% of turns understood.'),
    understandingLow: S('adult.understandingLow', '{{skill}}: worth more practice, {{now}}% of turns understood so far.'),
    understandingDip: S('adult.understandingDip', '{{skill}}: dipped to {{now}}% of turns understood, down from {{before}}%.'),
    harderLevels: S('adult.harderLevels', 'The levels got harder in this period, so a dip is expected.'),
    noEarlier: S('adult.noEarlier', 'Not enough play in the period before to compare.'),
    independenceUp: S('adult.independenceUp', 'Did more on their own: {{now}}% of turns needed no hint or demonstration, up from {{before}}%.'),
    independenceHigh: S('adult.independenceHigh', 'Mostly works on their own: {{now}}% of turns needed no hint or demonstration.'),
    independenceDown: S('adult.independenceDown', 'Used hints and demonstrations more: {{now}}% of turns on their own, was {{before}}%. Help is there to be used.'),
    directnessUp: S('adult.directnessUp', 'Movement: reaches went more directly to the target ({{now}}% direct, was {{before}}%). This is about movement, not understanding.'),
    directnessHigh: S('adult.directnessHigh', 'Movement: reaches are direct and steady ({{now}}% direct). This is about movement, not understanding.'),
    directnessLow: S('adult.directnessLow', 'Movement: reaches take a winding path ({{now}}% direct). Bigger targets or playing seated can help. This says nothing about understanding.'),
    directnessDown: S('adult.directnessDown', 'Movement: reaches were less direct than before ({{now}}% direct, was {{before}}%). Tiredness, a new room or the camera angle can do this too.'),
    movingQuicker: S('adult.movingQuicker', 'Movement: hands reached the target quicker (typically {{now}}, was {{before}}). Speed is kept apart from understanding.'),
    consistency: S('adult.consistency', 'Played on {{days}} of the last {{total}} days, in {{weeks}} of {{weeksTotal}} weeks.'),
    consistencyCompare: S('adult.consistencyCompare', 'Played on {{days}} of the last {{total}} days ({{weeks}} of {{weeksTotal}} weeks), compared with {{before}} days in the period before.'),
    effortRetries: P('adult.effortRetries', 'Kept going when it was hard: played again {{count}} time after a round that did not clear its level.', 'Kept going when it was hard: played again {{count}} times after a round that did not clear its level.'),
    effortTough: P('adult.effortTough', 'Finished {{count}} round that was hard for them, instead of stopping.', 'Finished {{count}} rounds that were hard for them, instead of stopping.'),
    effortRounds: P('adult.effortRounds', 'Put in {{minutes}} minutes of play over {{count}} round.', 'Put in {{minutes}} minutes of play over {{count}} rounds.'),
    effortClears: P('adult.effortClears', '{{count}} level opened through persistence.', '{{count}} levels opened through persistence.'),
    notEnough: S('adult.notEnough', 'Not enough play yet to tell how things are changing: {{rounds}} rounds and {{trials}} turns in this period. Findings start after about {{minRounds}} rounds and {{minTrials}} turns.'),
    pending: S('adult.pending', 'Too early to tell: {{list}}.'),
    pendingItem: P('adult.pendingItem', '{{skill}} ({{count}} turn)', '{{skill}} ({{count}} turns)'),
    games: S('adult.games', 'From: {{games}}.'),
  },
  child: {
    understandingUp: S('child.understandingUp', 'You got better at {{game}}!'),
    understandingStrong: S('child.understandingStrong', '{{game}} is going really well. Your practice shows!'),
    understandingLow: S('child.understandingLow', '{{game}} is your next challenge. Every try makes it easier.'),
    independenceUp: S('child.independenceUp', 'You did more all by yourself!'),
    independenceHigh: S('child.independenceHigh', 'You did most turns all by yourself!'),
    directnessUp: S('child.directnessUp', 'Your reaches got straighter!'),
    directnessHigh: S('child.directnessHigh', 'Your hands go straight to the target!'),
    directnessLow: S('child.directnessLow', 'Reaching straight to the target is fun to practise.'),
    movingQuicker: S('child.movingQuicker', 'Your hands got quicker!'),
    consistency: P('child.consistency', 'You played on {{count}} day. Come back soon!', 'You played on {{count}} days. What a habit!'),
    effortRetries: S('child.effortRetries', 'You kept trying, even when it was tricky!'),
    effortTough: S('child.effortTough', 'You finished hard rounds. That takes grit!'),
    effortRounds: P('child.effortRounds', 'You played {{count}} round. Every round is practice!', 'You played {{count}} rounds. That is real practice!'),
    notEnough: S('child.notEnough', 'Play a few more rounds and I will show you how you are growing!'),
  },
  next: {
    practise: S('next.practise', 'Keep practising {{game}}. A level lower is fine.'),
    new: S('next.new', 'A new game to try: {{game}}.'),
    nextLevel: S('next.nextLevel', 'Ready for the next level of {{game}}.'),
    more: S('next.more', 'Play {{game}} a few more times.'),
    childPractise: S('next.childPractise', 'Practise {{game}}'),
    childNew: S('next.childNew', 'Try {{game}}'),
    childNextLevel: S('next.childNextLevel', 'Next level of {{game}}'),
    childMore: S('next.childMore', 'Play {{game}} again'),
  },
  evidence: {
    turns: S('evidence.turns', '{{trials}} turns in {{rounds}} rounds, {{from}} to {{to}}'),
    before: S('evidence.before', 'period before: {{trials}} turns in {{rounds}} rounds'),
    beforeNone: S('evidence.beforeNone', 'period before: no play'),
    days: S('evidence.days', '{{days}} days with play, {{from}} to {{to}}'),
    rounds: S('evidence.rounds', '{{rounds}} rounds, {{minutes}} minutes, {{from}} to {{to}}'),
  },
  // The headline numbers, and what each one means.
  numbers: {
    understood: { label: S('numbers.understood.label', 'Understood'), meaning: S('numbers.understood.meaning', 'Turns where the right answer was chosen, even if the movement was slow or not precise. The understanding number.') },
    onTheirOwn: { label: S('numbers.onTheirOwn.label', 'On their own'), meaning: S('numbers.onTheirOwn.meaning', 'Turns done right with no highlight and no demonstration. The independence number.') },
    thinkingTime: { label: S('numbers.thinkingTime.label', 'Thinking time'), meaning: S('numbers.thinkingTime.meaning', 'Typical time from the instruction to the first deliberate movement. A decision measure, not a target to beat.') },
    movingTime: { label: S('numbers.movingTime.label', 'Moving time'), meaning: S('numbers.movingTime.meaning', 'Typical time from starting to move to touching the target. A movement measure, kept out of understanding.') },
    directness: { label: S('numbers.directness.label', 'Reach directness'), meaning: S('numbers.directness.meaning', 'How straight the hand travelled to the target. 100% is perfectly direct. A movement measure.') },
    daysPlayed: { label: S('numbers.daysPlayed.label', 'Days played'), meaning: S('numbers.daysPlayed.meaning', 'Days with at least one round. Short, regular play usually helps more than long, rare sessions.') },
    rounds: { label: S('numbers.rounds.label', 'Rounds played'), meaning: S('numbers.rounds.meaning', 'Rounds started in this period, finished or not.') },
  },
}

// A game title that ends in "!" or "?" ("Pets Only!") followed by the sentence's
// own full stop reads "Pets Only!." — keep only the title's mark.
const tidy = (text) => String(text ?? '').replace(/([!?])\./g, '$1')

/** i18next-style call with an English default (and plural defaults). */
function say(t, entry, params = {}) {
  if (!entry) return ''
  if (entry.one) {
    return tidy(t(entry.key, { defaultValue: entry.other, defaultValue_one: entry.one, defaultValue_other: entry.other, ...params }))
  }
  return tidy(t(entry.key, { defaultValue: entry.text, ...params }))
}

export const sayText = say

const fmtMs = (v) => (v == null ? '—' : v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${Math.round(v)} ms`)

/**
 * The finding's sentence.
 * @param {object} f a finding from buildFindings()
 * @param {'child'|'adult'} who
 * @param {{ t: Function, skillName: (id) => string, gameName: (id) => string }} ctx
 */
export function findingSentence(f, who, ctx) {
  const { t } = ctx
  const A = TEXT.adult
  const C = TEXT.child
  const child = who === 'child'
  const skill = f.subject?.type === 'domain' ? ctx.skillName(f.subject.id) : ''
  const game = f.subject?.games?.[0] ? ctx.gameName(f.subject.games[0]) : skill
  const now = f.value?.now
  const before = f.value?.before
  switch (f.kind) {
    case 'notEnough':
      return child ? say(t, C.notEnough) : say(t, A.notEnough, f.value)
    case 'gettingBetter':
    case 'strength':
    case 'needsPractice': {
      if (f.measure === 'understanding') {
        if (f.kind === 'gettingBetter') return child ? say(t, C.understandingUp, { game }) : say(t, A.understandingUp, { skill, now, before })
        if (f.kind === 'strength') return child ? say(t, C.understandingStrong, { game }) : say(t, A.understandingStrong, { skill, now })
        if (f.reason === 'dip' && before != null) return child ? say(t, C.understandingLow, { game }) : say(t, A.understandingDip, { skill, now, before })
        return child ? say(t, C.understandingLow, { game }) : say(t, A.understandingLow, { skill, now })
      }
      if (f.measure === 'directness') {
        if (f.variant === 'up') return child ? say(t, C.directnessUp) : say(t, A.directnessUp, { now, before })
        if (f.variant === 'high') return child ? say(t, C.directnessHigh) : say(t, A.directnessHigh, { now })
        if (f.variant === 'down') return child ? say(t, C.directnessLow) : say(t, A.directnessDown, { now, before })
        return child ? say(t, C.directnessLow) : say(t, A.directnessLow, { now })
      }
      if (f.measure === 'movingTime') return child ? say(t, C.movingQuicker) : say(t, A.movingQuicker, { now: fmtMs(now), before: fmtMs(before) })
      return ''
    }
    case 'independence':
      if (f.variant === 'up') return child ? say(t, C.independenceUp) : say(t, A.independenceUp, { now, before })
      if (f.variant === 'down') return child ? '' : say(t, A.independenceDown, { now, before })
      return child ? say(t, C.independenceHigh) : say(t, A.independenceHigh, { now })
    case 'consistency': {
      if (child) return say(t, C.consistency, { count: now })
      const p = { days: now, total: f.value.total, weeks: f.value.weeks, weeksTotal: f.value.weeksTotal, before }
      return before != null ? say(t, A.consistencyCompare, p) : say(t, A.consistency, p)
    }
    case 'effort': {
      const v = f.value
      if (child) {
        if (f.variant === 'retries') return say(t, C.effortRetries)
        if (f.variant === 'tough') return say(t, C.effortTough)
        return say(t, C.effortRounds, { count: v.now })
      }
      const main = f.variant === 'retries'
        ? say(t, A.effortRetries, { count: v.retries })
        : f.variant === 'tough'
          ? say(t, A.effortTough, { count: v.toughRounds })
          : say(t, A.effortRounds, { count: v.now, minutes: v.minutes })
      return v.effortClears ? `${main} ${say(t, A.effortClears, { count: v.effortClears })}` : main
    }
    default:
      return ''
  }
}

/**
 * Extra lines an adult should read with the finding: context (a harder level,
 * nothing to compare with) and which games the evidence came from.
 * @returns {{ kind: 'context'|'games', text: string }[]}
 */
export function findingNotes(f, ctx) {
  const { t } = ctx
  const out = []
  if (f.notes?.includes('harderLevels') && (f.kind === 'needsPractice' || (f.kind === 'independence' && f.variant === 'down'))) out.push({ kind: 'context', text: say(t, TEXT.adult.harderLevels) })
  if (f.notes?.includes('noEarlierPeriod') && f.kind !== 'consistency' && f.kind !== 'effort') out.push({ kind: 'context', text: say(t, TEXT.adult.noEarlier) })
  if (f.measure === 'understanding' && f.subject?.games?.length) {
    out.push({ kind: 'games', text: say(t, TEXT.adult.games, { games: f.subject.games.map((g) => ctx.gameName(g)).join(', ') }) })
  }
  return out
}

/** "up 12 points" / "quicker" / "about the same" / "nothing to compare with yet". */
export function trendWords(f, ctx) {
  const { t } = ctx
  const tr = f.trend || {}
  if (tr.dir == null) return say(t, TEXT.trend.none)
  if (f.measure === 'movingTime') return tr.dir === 'down' ? say(t, TEXT.trend.quicker) : tr.dir === 'up' ? say(t, TEXT.trend.slower) : say(t, TEXT.trend.flat)
  if (tr.dir === 'flat') return say(t, TEXT.trend.flat)
  const unitPts = f.value?.unit === '%'
  if (unitPts && tr.delta != null) return say(t, tr.dir === 'up' ? TEXT.trend.upBy : TEXT.trend.downBy, { n: Math.abs(Math.round(tr.delta)) })
  return say(t, TEXT.trend[tr.dir])
}

/** The numbers behind a finding: turns, rounds, period, and the period before. */
export function evidenceLine(f, ctx) {
  const { t, fmtDate = (d) => d } = ctx
  const e = f.evidence || {}
  const from = fmtDate(e.period?.from)
  const to = fmtDate(e.period?.to)
  if (f.kind === 'consistency') return say(t, TEXT.evidence.days, { days: f.value.now, from, to })
  if (f.kind === 'effort') return say(t, TEXT.evidence.rounds, { rounds: f.value.now, minutes: f.value.minutes, from, to })
  const main = say(t, TEXT.evidence.turns, { trials: e.trials, rounds: e.rounds, from, to })
  const prev = e.prevRounds ? say(t, TEXT.evidence.before, { trials: e.prevTrials, rounds: e.prevRounds }) : say(t, TEXT.evidence.beforeNone)
  return `${main} · ${prev}`
}

/** The suggested game, in words. */
export function nextSentence(next, who, ctx) {
  if (!next?.gameId) return ''
  const game = ctx.gameName(next.gameId)
  const N = TEXT.next
  const child = who === 'child'
  const entry = {
    practise: child ? N.childPractise : N.practise,
    new: child ? N.childNew : N.new,
    nextLevel: child ? N.childNextLevel : N.nextLevel,
    more: child ? N.childMore : N.more,
  }[next.mode] || (child ? N.childNew : N.new)
  return say(ctx.t, entry, { game })
}

/** "Too early to tell: Listening (8 turns), Both hands (5 turns)." */
export function pendingSentence(pending, ctx) {
  if (!pending?.length) return ''
  const list = pending.slice(0, 4).map((p) => say(ctx.t, TEXT.adult.pendingItem, { skill: ctx.skillName(p.domain), count: p.trials })).join(', ')
  return say(ctx.t, TEXT.adult.pending, { list })
}

export const kindLabel = (kind, t) => say(t, TEXT.kind[kind])
// The headline number each finding is measured in (for its sparkline's text alternative).
export const NUMBER_OF_MEASURE = { understanding: 'understood', independence: 'onTheirOwn', directness: 'directness', movingTime: 'movingTime', days: 'daysPlayed', rounds: 'rounds', thinkingTime: 'thinkingTime' }
export const numberLabel = (key, t) => say(t, TEXT.numbers[key]?.label)
export const numberMeaning = (key, t) => say(t, TEXT.numbers[key]?.meaning)
export const formatValue = (value, unit) => (value == null ? '—' : unit === 'ms' ? fmtMs(value) : unit === '%' ? `${Math.round(value)}%` : String(value))

/** A sparkline's text alternative: "Weekly understood: 55%, 60%, no play, 78%." */
export function seriesWords(series, unit, label, t) {
  const none = t('ar.findings.series.none', { defaultValue: 'no play' })
  const values = (series || []).map((p) => (p.value == null ? none : formatValue(p.value, unit))).join(', ')
  return t('ar.findings.series.label', { defaultValue: '{{label}}, oldest first: {{values}}.', label, values })
}

/** Every key with its English text, for the i18n list. */
export function allTextEntries() {
  const out = {}
  const walk = (node) => {
    if (!node || typeof node !== 'object') return
    if (typeof node.key === 'string') {
      if (node.one) { out[`${node.key}_one`] = node.one; out[`${node.key}_other`] = node.other } else out[node.key] = node.text
      return
    }
    for (const v of Object.values(node)) walk(v)
  }
  walk(TEXT)
  out['ar.findings.series.none'] = 'no play'
  out['ar.findings.series.label'] = '{{label}}, oldest first: {{values}}.'
  return out
}
