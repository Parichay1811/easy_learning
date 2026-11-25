// node --test client/src/ar/core/arrival.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ArrivalGate, layoutClearOf, clearance } from './arrival.js'
import { layoutSlots, makeRng } from './geometry.js'

// A 4:3 camera picture, as on a laptop.
const STAGE = { stageW: 1200, stageH: 900 }
const at = (now) => ({ ...STAGE, now })
const target = (over = {}) => ({ id: 't', x: 0.5, y: 0.5, radius: 0.155, ...over })

test('a target that appears under a resting hand is held', () => {
  const gate = new ArrivalGate()
  const held = gate.watch([target()], [{ x: 0.5, y: 0.5 }], at(0))
  assert.equal(held, 1)
  assert.equal(gate.isHeld('t'), true)
  assert.equal(gate.any, true)
})

test('a target that appears away from the hand is open at once', () => {
  const gate = new ArrivalGate()
  gate.watch([target()], [{ x: 0.1, y: 0.9 }], at(0))
  assert.equal(gate.isHeld('t'), false)
  assert.equal(gate.any, false)
})

test('a hand that never moves keeps the target held, however long it waits', () => {
  const gate = new ArrivalGate()
  const hand = [{ x: 0.52, y: 0.49 }]
  gate.watch([target()], hand, at(0))
  for (let now = 16; now < 60000; now += 16) gate.step([target()], hand, at(now))
  assert.equal(gate.isHeld('t'), true)
  assert.ok(gate.heldFor('t', 60000) >= 59000)
})

test('coming away releases it; the reach back is then an ordinary touch', () => {
  const gate = new ArrivalGate({ clearMs: 140 })
  const t = target()
  gate.watch([t], [{ x: 0.5, y: 0.5 }], at(0))
  // Out of the zone, but not yet for long enough.
  assert.deepEqual(gate.step([t], [{ x: 0.9, y: 0.5 }], at(100)), [])
  assert.equal(gate.isHeld('t'), true)
  assert.deepEqual(gate.step([t], [{ x: 0.9, y: 0.5 }], at(180)), [])
  assert.deepEqual(gate.step([t], [{ x: 0.9, y: 0.5 }], at(260)), ['t'])
  assert.equal(gate.isHeld('t'), false)
  // Back on the target: nothing holds it now.
  assert.deepEqual(gate.step([t], [{ x: 0.5, y: 0.5 }], at(900)), [])
  assert.equal(gate.any, false)
})

test('hovering on the rim does not open it: the zone to leave is wider than the hit zone', () => {
  const gate = new ArrivalGate({ zoneScale: 1.3 })
  const t = target({ radius: 0.1 })
  gate.watch([t], [{ x: 0.5, y: 0.5 }], at(0))
  // 0.12 of the short side away: outside the 1.15 hit zone, inside the 1.3 zone.
  const rim = [{ x: 0.5 + (0.12 * 900) / 1200, y: 0.5 }]
  for (let now = 16; now < 3000; now += 16) gate.step([t], rim, at(now))
  assert.equal(gate.isHeld('t'), true)
})

test('one dropped tracking frame is not the hand leaving', () => {
  const gate = new ArrivalGate()
  const t = target()
  const hand = [{ x: 0.5, y: 0.5 }]
  gate.watch([t], hand, at(0))
  gate.step([t], hand, at(33))
  gate.step([t], [], at(66)) // tracker lost the hand for a frame
  gate.step([t], [], at(100))
  gate.step([t], hand, at(133))
  assert.equal(gate.isHeld('t'), true)
})

test('a hand gone from the picture for a while lets go: what returns is a new reach', () => {
  const gate = new ArrivalGate({ lostMs: 700 })
  const t = target()
  gate.watch([t], [{ x: 0.5, y: 0.5 }], at(0))
  for (let now = 16; now <= 600; now += 16) gate.step([t], [], at(now))
  assert.equal(gate.isHeld('t'), true)
  for (let now = 616; now <= 800; now += 16) gate.step([t], [], at(now))
  assert.equal(gate.isHeld('t'), false)
})

test('the other hand passing elsewhere does not free a target the first hand rests on', () => {
  const gate = new ArrivalGate()
  const t = target()
  gate.watch([t], [{ x: 0.5, y: 0.5 }, { x: 0.1, y: 0.2 }], at(0))
  for (let now = 16; now < 2000; now += 16) {
    gate.step([t], [{ x: 0.5, y: 0.5 }, { x: 0.1 + now / 10000, y: 0.2 }], at(now))
  }
  assert.equal(gate.isHeld('t'), true)
})

test('only the target under the hand is held; the others stay open', () => {
  const gate = new ArrivalGate()
  const a = target({ id: 'a', x: 0.3, y: 0.5, radius: 0.1 })
  const b = target({ id: 'b', x: 0.7, y: 0.5, radius: 0.1 })
  gate.watch([a, b], [{ x: 0.3, y: 0.5 }], at(0))
  assert.equal(gate.isHeld('a'), true)
  assert.equal(gate.isHeld('b'), false)
})

test('a new set of targets forgets the old holds', () => {
  const gate = new ArrivalGate()
  gate.watch([target({ id: 'old' })], [{ x: 0.5, y: 0.5 }], at(0))
  gate.watch([target({ id: 'new', x: 0.1, y: 0.1, radius: 0.05 })], [{ x: 0.5, y: 0.5 }], at(1000))
  assert.equal(gate.isHeld('old'), false)
  assert.equal(gate.isHeld('new'), false)
})

test('a disabled backdrop object is never held', () => {
  const gate = new ArrivalGate()
  gate.watch([target({ disabled: true })], [{ x: 0.5, y: 0.5 }], at(0))
  assert.equal(gate.any, false)
})

// ── the reported case, with the engine's own layout ──────────────────────────
// Level 1 of a touch game: one target of radius 0.155 inside the 0.4 reach
// envelope of the default reach box. This is what `tapEngine` asks for.
const LEVEL1_BOX = { minX: 0.332, maxX: 0.668, minY: 0.34, maxY: 0.66 }

test('level 1 really does put every target on the same central spot', () => {
  const rng = makeRng(11)
  for (let i = 0; i < 200; i++) {
    const [s] = layoutSlots(1, LEVEL1_BOX, 0.155, rng)
    assert.ok(Math.abs(s.x - 0.5) < 0.02 && Math.abs(s.y - 0.5) < 0.02, `${s.x},${s.y}`)
  }
})

test('so a hand parked in the middle is held on every turn of a level-1 round', () => {
  const rng = makeRng(5)
  const gate = new ArrivalGate()
  const parked = [{ x: 0.5, y: 0.52 }]
  let now = 0
  for (let turn = 0; turn < 12; turn++) {
    const [s] = layoutClearOf(() => layoutSlots(1, LEVEL1_BOX, 0.155, rng), parked, {
      ...STAGE,
      clear: 0.155 * 1.5,
    })
    const t = { id: `t${turn}`, x: s.x, y: s.y, radius: 0.155 }
    gate.watch([t], parked, at(now))
    // Two seconds of sitting still: a 260 ms dwell would have fired long ago.
    for (let k = 0; k < 120; k++) {
      now += 16
      gate.step([t], parked, at(now))
    }
    assert.equal(gate.isHeld(t.id), true, `turn ${turn} played itself`)
  }
})

test('where the level has room, the new layout keeps clear of the hand', () => {
  // Level 3 of the same game: radius 0.115 inside the 0.7 envelope.
  const box = { minX: 0.206, maxX: 0.794, minY: 0.22, maxY: 0.78 }
  const radius = 0.115
  const clear = radius * 1.5
  const hand = [{ x: 0.5, y: 0.5 }]
  let under = 0
  let underPlain = 0
  const a = makeRng(3)
  const b = makeRng(3)
  for (let i = 0; i < 400; i++) {
    const slots = layoutClearOf(() => layoutSlots(3, box, radius, a), hand, { ...STAGE, clear })
    if (clearance(slots, hand, STAGE.stageW, STAGE.stageH) < radius * 1.15) under++
    const plain = layoutSlots(3, box, radius, b)
    if (clearance(plain, hand, STAGE.stageW, STAGE.stageH) < radius * 1.15) underPlain++
  }
  assert.ok(underPlain > 40, `expected the plain layout to land under the hand often, got ${underPlain}`)
  assert.equal(under, 0)
})

test('with no hand in view the layout is whatever the engine would have made', () => {
  const a = makeRng(9)
  const b = makeRng(9)
  const box = { minX: 0.1, maxX: 0.9, minY: 0.1, maxY: 0.9 }
  const viaHelper = layoutClearOf(() => layoutSlots(3, box, 0.1, a), [], { ...STAGE, clear: 0.15 })
  assert.deepEqual(viaHelper, layoutSlots(3, box, 0.1, b))
})
