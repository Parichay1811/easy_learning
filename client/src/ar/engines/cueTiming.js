/**
 * How long each light stays on in the traffic-light games, and what each light
 * tells the child to do.
 *
 * Pure, so it can be tested: the lengths were the bug. Green was meant to last
 * 2–5 s but the timer it was measured from was never started, so from the second
 * turn on it ended the instant it began, and amber was a flat 1.1 s — shorter
 * than the sentence that announced it. Only red, which lasts until the child has
 * held still, was long enough to do anything in. A child was being asked to
 * move on a light they never got.
 *
 * The rule now: a light stays on long enough to hear what it means, start doing
 * it, and keep doing it for a while. Every length is multiplied by the "extra
 * time" setting, like every other window in the games. Longer is never worse
 * here — nothing in these games is scored on speed.
 */

/** Shortest green, before extra time. Hear "green", start, and move for a few seconds. */
export const GREEN_MIN_MS = 4000
/** Green varies by up to this much, so the change to red cannot be counted in. */
export const GREEN_SPREAD_MS = 3000
/** Amber: long enough to hear "get ready" and actually get ready. */
export const AMBER_MS = 2200
/** Ceilings, so a ×4 extra-time setting does not leave a child marching for half a minute. */
export const GREEN_MAX_MS = 14000
export const AMBER_MAX_MS = 6000
/**
 * The start of green is reaction time. It is not counted when deciding whether
 * the child moved on green: being slow to start is not standing still.
 */
export const GREEN_GRACE_MS = 1200

const timeX = (x) => (Number.isFinite(x) && x > 0 ? Math.min(Math.max(x, 1), 4) : 1)

/**
 * @param {object} p
 * @param {number} p.index which turn of the round (0 = the first)
 * @param {number} p.roll a uniform random number in [0, 1)
 * @param {number} [p.extraTimeX] the "extra time" setting (1–4)
 * @returns {number} milliseconds of green
 */
export function greenMs({ index = 0, roll = 0.5, extraTimeX = 1 } = {}) {
  // The first green is the longest: it is the one the child learns the game on.
  const spread = index === 0 ? GREEN_SPREAD_MS : Math.min(Math.max(roll, 0), 1) * GREEN_SPREAD_MS
  const ms = (GREEN_MIN_MS + spread) * timeX(extraTimeX)
  return Math.round(Math.min(ms, GREEN_MAX_MS))
}

/** @returns {number} milliseconds of amber */
export function amberMs({ extraTimeX = 1 } = {}) {
  return Math.round(Math.min(AMBER_MS * timeX(extraTimeX), AMBER_MAX_MS))
}

/** @returns {number} how much of the start of green is left out of "did they move" */
export function greenGraceMs({ green, extraTimeX = 1 }) {
  // Never more than a third of the green itself, or nothing would be left to judge.
  return Math.round(Math.min(GREEN_GRACE_MS * timeX(extraTimeX), green / 3))
}

/**
 * The words for each light. One place, so the instruction at the start, the
 * prompt while a light is on and the voice all say the same thing in the same
 * plain words: what to do with your body, not what the game is called.
 *
 * @param {boolean} amber true for the three-light game (Traffic Light Game)
 */
export function lightWords(amber = false) {
  return amber
    ? {
        intro: {
          main: 'Green light: walk on the spot!',
          sub: 'Amber: get ready to stop · Red: freeze like a statue',
          speak:
            'Green light: walk on the spot. Amber light: get ready to stop. Red light: freeze like a statue.',
        },
        again: { main: 'Get ready — green is coming', sub: 'Green: walk · Amber: get ready · Red: freeze' },
        green: {
          banner: 'WALK!',
          main: 'Green light — walk!',
          sub: 'Walk on the spot and swing your arms',
          speak: 'Green! Walk on the spot!',
        },
        amber: {
          banner: 'GET READY',
          main: 'Amber light — get ready',
          sub: 'Slow down. Red is coming',
          speak: 'Amber. Get ready to stop.',
        },
        red: {
          banner: 'FREEZE!',
          main: 'Red light — freeze!',
          sub: 'Stand still like a statue',
          speak: 'Red! Freeze!',
        },
        didNotMove: 'Next time, walk on the spot when it is green!',
      }
    : {
        intro: {
          main: 'Green light: wave your arms and march!',
          sub: 'Red light: freeze like a statue',
          speak: 'Green light: wave your arms and march. Red light: freeze like a statue.',
        },
        again: { main: 'Get ready — green is coming', sub: 'Green: move · Red: freeze' },
        green: {
          banner: 'MOVE!',
          main: 'Green light — move!',
          sub: 'Wave your arms and march on the spot',
          speak: 'Green! Wave your arms and march!',
        },
        amber: null,
        red: {
          banner: 'FREEZE!',
          main: 'Red light — freeze!',
          sub: 'Stand still like a statue',
          speak: 'Red! Freeze!',
        },
        didNotMove: 'Next time, wave your arms when it is green!',
      }
}

/** How long the instruction stays up before the first green, and before later ones. */
export function introMs({ index = 0, amber = false } = {}) {
  // The first one has to outlast the spoken instruction, which is read slowly.
  if (index === 0) return amber ? 9000 : 7000
  return 1500
}

/**
 * Where to draw the traffic light so nothing covers it.
 *
 * The instruction bar is HTML laid over the top of the picture; the light is
 * drawn on the canvas at a fixed 10 % from the top. On a laptop or a phone held
 * sideways the picture fills the screen height, so those two were the same
 * place and the bar sat on the red lamp. `safeTop` is how far down the canvas
 * the bar reaches, measured by the stage.
 *
 * @param {{w:number, h:number, short:number, safeTop?:number}} view
 * @param {number} lamps how many lamps (2 or 3)
 * @returns {{x:number, y:number, r:number, gap:number, boxW:number, boxH:number}}
 */
export function trafficLightBox(view, lamps) {
  const safeTop = Math.max(0, view.safeTop || 0)
  let r = view.short * 0.042
  const margin = Math.max(8, view.short * 0.015)
  const top = Math.max(view.h * 0.1, safeTop + margin)
  // On a very short picture the light must still end well above the child's
  // middle, so it shrinks rather than slide down over them.
  const room = view.h * 0.62 - top
  const need = (lampsN, rad) => rad * 2.5 * lampsN + rad
  if (room > 0 && need(lamps, r) > room) r = Math.max(view.short * 0.026, room / (2.5 * lamps + 1))
  const gap = r * 2.5
  const boxW = r * 3
  const boxH = need(lamps, r)
  return { x: view.w / 2 - boxW / 2, y: top, r, gap, boxW, boxH }
}
