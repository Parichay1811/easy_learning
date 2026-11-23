/**
 * "What to try next", away from the screen: one short activity at home and one
 * in class for every skill area the camera games work on.
 *
 * Plain data (an i18n key and its English text) so the findings engine stays
 * pure and the screens translate it. Every activity is everyday, cheap, takes a
 * few minutes and can be done by any adult: no equipment, no therapy jargon, no
 * suggestion that anything is wrong.
 */

const A = (id, home, inClass) => ({
  home: { key: `ar.findings.activity.${id}.home`, text: home },
  class: { key: `ar.findings.activity.${id}.class`, text: inClass },
})

export const ACTIVITIES = {
  visualDiscrimination: A(
    'visualDiscrimination',
    'Play “I spy” with colours and shapes around the house, then with two clues at once (“something red and round”).',
    'Sorting tray: sort counters by colour, then by shape, then by both.'
  ),
  auditoryComprehension: A(
    'auditoryComprehension',
    'Give one-step instructions in play (“touch something blue”), then two steps. Say it once, calmly, and wait.',
    'Simon says with one, then two instructions. Pause, and repeat it the same way when asked.'
  ),
  readingSymbol: A(
    'readingSymbol',
    'Spot letters and numbers on signs, packets and number plates on the way somewhere.',
    'Letter or number hunt: cards around the room to find and touch.'
  ),
  reactionSpeed: A(
    'reactionSpeed',
    'Catch-and-drop games with a balloon or a soft ball, at a calm, steady pace.',
    'Clap-when-you-hear-it: a short game with a clear signal and a steady rhythm.'
  ),
  reachAccuracy: A(
    'reachAccuracy',
    'Put stickers around a door frame at different heights and take turns touching them.',
    'Target dots on the whiteboard to touch: big and near first, then smaller and further.'
  ),
  sustainedAttention: A(
    'sustainedAttention',
    'Spot-the-difference pictures or a short jigsaw: three to five minutes, then a break.',
    'Listening walk: count the sounds you hear in one minute, then share them.'
  ),
  workingMemory: A(
    'workingMemory',
    'Shopping-list game: remember two things to fetch from the kitchen, then three.',
    'Kim’s game: look at a tray of objects, cover it, and say what was there.'
  ),
  sequencing: A(
    'sequencing',
    'Photograph the steps of a routine (washing hands, getting dressed) and put them in order together.',
    'Story cards to put in first, next, last order, then retell the story.'
  ),
  inhibition: A(
    'inhibition',
    'Musical statues or “red light, green light” in the garden or the hallway.',
    'Freeze games: move to the music, stop when it stops. Start with long pauses.'
  ),
  cognitiveFlexibility: A(
    'cognitiveFlexibility',
    'Sort the same toys two ways: first by colour, then by size. Say the new rule out loud.',
    'Switch-the-rule game: clap on red, then stamp on red. Show the rule on a card.'
  ),
  bilateralCoordination: A(
    'bilateralCoordination',
    'Two-hand jobs: carrying a tray, tearing paper for a collage, rolling dough.',
    'Threading beads, clapping patterns or catching a big ball with both hands.'
  ),
  motorPlanning: A(
    'motorPlanning',
    'A cushion obstacle course: over, under, around. Let them plan the route first.',
    'Copy-my-move warm-ups: three moves in a row, then let a child lead.'
  ),
  spatialConcepts: A(
    'spatialConcepts',
    'Hide a toy and give position clues: on, under, behind, next to.',
    'Position-word hunt: “put the pencil under the book”, then swap roles.'
  ),
  socialReasoning: A(
    'socialReasoning',
    'Look at faces in picture books together: how might this person be feeling, and why?',
    'Feelings check-in with picture cards at circle time.'
  ),
  independence: A(
    'independence',
    'Let them lead one everyday routine step by step while you only point or nod.',
    'A picture checklist for one classroom routine that they tick off themselves.'
  ),
  movement: A(
    'movement',
    'Reach for stickers on a wall at different heights: slowly, straight, and back to the middle.',
    'Seated reaching games: a big target first, then smaller. Movement and understanding are practised separately.'
  ),
  consistency: A(
    'consistency',
    'Pick two or three set times a week for a short game, for example after school. Short and regular beats long and rare.',
    'A five-minute camera-game warm-up at the same point of the week helps it become a routine.'
  ),
  effort: A(
    'effort',
    'Praise the trying, not the result: “You kept going even when it was tricky.”',
    'Name the effort you saw: “You tried again after that hard round.” Avoid comparing with others.'
  ),
}

/** The activity pair for a finding's skill area, falling back to a general one. */
export function activityFor(key) {
  return ACTIVITIES[key] || null
}
