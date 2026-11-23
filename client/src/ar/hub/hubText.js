/**
 * Words and ids shared by the hub's parts (kept out of the component files so
 * those export components only).
 *
 * groupLine — what each game group practises, in a few plain words, short
 * enough to sit under the group's name on its tab. (The longer `blurb` in
 * catalog/groups.js is shown for the chosen group, in the panel head.)
 *
 * levelWords — where a child is on a game's five levels, as a sentence
 * ("Level 4 of 5, 3 cleared"): the words beside the level pips.
 */
import i18n from '../../i18n/i18n'
import { LEVELS } from '../core/journey'

export const tabId = (id) => `arhub-tab-${id}`
export const PANEL_ID = 'arhub-panel'

const LINES = {
  body: 'Reach and aim',
  look: 'Spot and listen',
  stop: 'Wait and stop',
  remember: 'Hold it in mind',
  learn: 'Read, spell, count',
  move: 'Copy and move',
  day: 'Everyday jobs',
  together: 'Talk and feelings',
}

export const groupLine = (id) => i18n.t(`ar.hub.groupLine.${id}`, { defaultValue: LINES[id] || '' })

export function levelWords(t, p) {
  if (!p) return t('ar.hub.setupNote', 'Set-up · no levels')
  if (p.complete) return t('ar.hub.levelAllCleared', 'All {{total}} levels cleared', { total: LEVELS })
  if (!p.plays && !p.cleared) return t('ar.hub.levelNotStarted', 'Level {{n}} of {{total}}, not started yet', { n: p.level, total: LEVELS })
  if (!p.cleared) return t('ar.hub.levelStarted', 'Level {{n}} of {{total}}, started', { n: p.level, total: LEVELS })
  return t('ar.hub.levelSummary', 'Level {{n}} of {{total}}, {{cleared}} cleared', { n: p.level, total: LEVELS, cleared: p.cleared })
}
