/**
 * "A touch has to be a reach."
 *
 * Every touch game puts a target somewhere and waits for a fingertip to rest on
 * it. Nothing in that says the fingertip had to *travel*: a target that appears
 * underneath a hand that is already there completes itself. At the first level
 * that is not a rare accident — the reach envelope is a small central region
 * and the target is large, so the target lands on the same spot turn after
 * turn, and a child (or a tester) who simply leaves a hand in the middle of the
 * picture watches the whole round play itself. The recorded answers are then
 * about where the hand was parked, not about what the child understood.
 *
 * The gate fixes that without a clock and without a penalty:
 *
 *   - when targets appear, any target a pointer is already inside is *held*;
 *   - a held target cannot be chosen until its zone has been empty for a
 *     moment — the hand has to come away and come back;
 *   - nothing is counted against the child while it is held: no error, no
 *     lost time that matters, just a target that is waiting for a reach.
 *
 * It is deliberately not "the pointer must have moved N pixels": a child with a
 * small or slow movement must still be able to play, and leaving a zone is the
 * smallest movement that is unmistakably a new reach.
 *
 * Pure: no DOM, no clock of its own. `now` is game time, passed in.
 */
import { aspectDist } from './geometry.js'

export class ArrivalGate {
  /**
   * @param {object} [opts]
   * @param {number} [opts.zoneScale] the zone a hand must leave, as a multiple
   *   of the target radius. A little larger than the hit zone (1.15–1.2), so a
   *   hand hovering on the rim cannot flicker a target open.
   * @param {number} [opts.clearMs] how long the zone must stay empty. Rides
   *   over a single dropped tracking frame, which would otherwise look exactly
   *   like the hand leaving.
   * @param {number} [opts.lostMs] with no hand in view at all for this long,
   *   the hold lapses: whatever comes back into the picture is a new reach.
   */
  constructor(opts = {}) {
    this.zoneScale = opts.zoneScale ?? 1.3
    this.clearMs = opts.clearMs ?? 140
    this.lostMs = opts.lostMs ?? 700
    this.held = new Map() // targetId -> { since, clearSince, lostSince }
  }

  reset() {
    this.held.clear()
  }

  _inside(target, pointers, stageW, stageH) {
    const r = (target.radius ?? 0.1) * this.zoneScale
    for (const p of pointers) {
      if (p && aspectDist(p, target, stageW, stageH) <= r) return true
    }
    return false
  }

  /**
   * Call on the frame targets become visible. Replaces whatever was held.
   * @returns {number} how many targets are held
   */
  watch(targets, pointers, ctx) {
    this.held.clear()
    const { stageW, stageH, now } = ctx
    for (const t of targets) {
      if (!t || t.disabled) continue
      if (this._inside(t, pointers, stageW, stageH)) {
        this.held.set(t.id, { since: now, clearSince: null, lostSince: null })
      }
    }
    return this.held.size
  }

  /**
   * Call every frame. Releases any held target whose zone has been left.
   * @returns {string[]} ids released on this frame
   */
  step(targets, pointers, ctx) {
    const released = []
    if (!this.held.size) return released
    const { stageW, stageH, now } = ctx
    const seen = pointers.some(Boolean)
    for (const t of targets) {
      const h = t && this.held.get(t.id)
      if (!h) continue
      if (!seen) {
        // No hand in view. Not evidence that it left — tracking drops out — so
        // only a long absence lets go.
        h.clearSince = null
        if (h.lostSince == null) h.lostSince = now
        if (now - h.lostSince >= this.lostMs) {
          this.held.delete(t.id)
          released.push(t.id)
        }
        continue
      }
      h.lostSince = null
      if (this._inside(t, pointers, stageW, stageH)) {
        h.clearSince = null
        continue
      }
      if (h.clearSince == null) h.clearSince = now
      if (now - h.clearSince >= this.clearMs) {
        this.held.delete(t.id)
        released.push(t.id)
      }
    }
    // A held target that is no longer on screen is not held.
    if (this.held.size) {
      const ids = new Set(targets.filter(Boolean).map((t) => t.id))
      for (const id of [...this.held.keys()]) if (!ids.has(id)) this.held.delete(id)
    }
    return released
  }

  isHeld(id) {
    return this.held.has(id)
  }

  /** How long this target has been waiting for the hand to come away, in ms. */
  heldFor(id, now) {
    const h = this.held.get(id)
    return h ? now - h.since : 0
  }

  get any() {
    return this.held.size > 0
  }
}

/**
 * How far the nearest pointer is from the nearest slot, in short-side units.
 * Infinity when there is nothing to measure against.
 */
export function clearance(slots, pointers, stageW, stageH) {
  let best = Infinity
  for (const s of slots) {
    for (const p of pointers) {
      if (!p || !s) continue
      const d = aspectDist(p, s, stageW, stageH)
      if (d < best) best = d
    }
  }
  return best
}

/**
 * Picks, from a few candidate layouts, one in which no slot sits under a hand.
 *
 * The level's reach envelope is not touched: `makeLayout` is the engine's own
 * layout call, and this only chooses among the arrangements it would have
 * produced anyway. Where the envelope leaves no room (a single large target in
 * the small central region of level 1) every candidate is the same spot, the
 * best of them is returned, and `ArrivalGate` covers the rest.
 *
 * @param {() => Array<{x:number,y:number}>} makeLayout
 * @param {Array<{x:number,y:number}|null>} pointers where the hands are now
 * @param {{stageW:number, stageH:number, clear:number, tries?:number}} opts
 *   `clear` is the distance (short-side units) a slot must keep from a pointer.
 */
export function layoutClearOf(makeLayout, pointers, opts) {
  const { stageW, stageH, clear, tries = 8 } = opts
  let best = makeLayout()
  if (!pointers?.some(Boolean) || !stageW || !stageH) return best
  let bestGap = clearance(best, pointers, stageW, stageH)
  for (let i = 1; i < tries && bestGap < clear; i++) {
    const next = makeLayout()
    const gap = clearance(next, pointers, stageW, stageH)
    if (gap > bestGap) {
      best = next
      bestGap = gap
    }
  }
  return best
}
