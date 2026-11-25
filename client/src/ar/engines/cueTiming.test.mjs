// node --test client/src/ar/engines/cueTiming.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  greenMs, amberMs, greenGraceMs, lightWords, introMs, trafficLightBox,
  GREEN_MIN_MS, GREEN_SPREAD_MS, GREEN_MAX_MS, AMBER_MS, AMBER_MAX_MS,
} from './cueTiming.js'

test('green always lasts long enough to hear it, start, and keep moving', () => {
  for (let index = 0; index < 12; index++) {
    for (const roll of [0, 0.25, 0.5, 0.999]) {
      const ms = greenMs({ index, roll })
      assert.ok(ms >= GREEN_MIN_MS, `turn ${index} roll ${roll}: ${ms}`)
      assert.ok(ms <= GREEN_MIN_MS + GREEN_SPREAD_MS)
    }
  }
})

test('the first green is the longest: it is the one the game is learnt on', () => {
  assert.equal(greenMs({ index: 0, roll: 0 }), GREEN_MIN_MS + GREEN_SPREAD_MS)
  assert.equal(greenMs({ index: 0, roll: 0.9 }), GREEN_MIN_MS + GREEN_SPREAD_MS)
})

test('later greens vary, so the change to red cannot be counted in', () => {
  const a = greenMs({ index: 3, roll: 0.1 })
  const b = greenMs({ index: 3, roll: 0.8 })
  assert.ok(b - a > 1500)
})

test('amber outlasts the sentence that announces it', () => {
  // It was a flat 1100 ms.
  assert.ok(amberMs() >= 2000)
  assert.equal(amberMs(), AMBER_MS)
})

test('the extra-time setting stretches green and amber like every other window', () => {
  assert.equal(greenMs({ index: 2, roll: 0, extraTimeX: 2 }), GREEN_MIN_MS * 2)
  assert.equal(amberMs({ extraTimeX: 2 }), AMBER_MS * 2)
  assert.ok(greenMs({ index: 2, roll: 0.5, extraTimeX: 1.5 }) > greenMs({ index: 2, roll: 0.5 }))
  // …up to a ceiling, and never below the standard length.
  assert.equal(greenMs({ index: 0, roll: 1, extraTimeX: 4 }), GREEN_MAX_MS)
  assert.equal(amberMs({ extraTimeX: 4 }), AMBER_MAX_MS)
  assert.equal(greenMs({ index: 2, roll: 0, extraTimeX: 0.5 }), GREEN_MIN_MS)
  assert.equal(greenMs({ index: 2, roll: 0, extraTimeX: undefined }), GREEN_MIN_MS)
  assert.equal(amberMs({ extraTimeX: NaN }), AMBER_MS)
})

test('reaction time at the start of green is left out, but never most of the green', () => {
  assert.equal(greenGraceMs({ green: 4000 }), 1200)
  assert.equal(greenGraceMs({ green: 8000, extraTimeX: 2 }), 2400)
  assert.equal(greenGraceMs({ green: 3000, extraTimeX: 4 }), 1000)
})

test('the instruction stays up long enough to be heard once, then gets out of the way', () => {
  assert.ok(introMs({ index: 0 }) >= 6000)
  assert.ok(introMs({ index: 0, amber: true }) > introMs({ index: 0 }))
  assert.ok(introMs({ index: 1 }) <= 2000)
})

test('every light says what to do with your body, in the same words throughout', () => {
  for (const amber of [false, true]) {
    const w = lightWords(amber)
    for (const key of ['green', 'red', ...(amber ? ['amber'] : [])]) {
      for (const field of ['banner', 'main', 'sub', 'speak']) {
        assert.ok(w[key][field], `${amber ? 'traffic' : 'red/green'} ${key}.${field}`)
      }
    }
    // Green names a movement, red names stillness — not just "move" and "freeze".
    assert.match(`${w.intro.main} ${w.intro.sub}`, /wave your arms|walk on the spot/i)
    assert.match(`${w.intro.main} ${w.intro.sub}`, /freeze like a statue/i)
    assert.match(w.intro.speak, /green/i)
    assert.match(w.intro.speak, /red/i)
    assert.match(w.green.sub, /arms/i)
    assert.match(w.red.sub, /statue/i)
    assert.ok(w.didNotMove)
  }
  assert.equal(lightWords(false).amber, null)
  assert.match(lightWords(true).intro.speak, /amber/i)
})

// ── where the light is drawn ─────────────────────────────────────────────────
// Canvas sizes are the picture sizes from docs/AR-GAMES.md §2; `safeTop` is how
// far the instruction bar reaches down the canvas in each.
const view = (w, h, safeTop = 0) => ({ w, h, short: Math.min(w, h), safeTop })

test('laptop: the light starts below the instruction bar, not under it', () => {
  // 1440×900 window, 1200×900 picture from the top of the screen. The bar ends
  // around 135 px down. The light used to start at 10 % = 90 px.
  for (const lamps of [2, 3]) {
    const box = trafficLightBox(view(1200, 900, 135), lamps)
    assert.ok(box.y >= 135 + 8, `top ${box.y}`)
    // The red lamp is the top one; its upper edge is what was hidden.
    const redTop = box.y + box.r * 0.9 - box.r
    assert.ok(redTop >= 135, `red lamp top ${redTop}`)
    assert.ok(box.y + box.boxH < 900 * 0.62)
  }
})

test('phone held upright: the picture is letterboxed, so the light keeps its usual place', () => {
  // 390×844 window, 390×520 picture starting 162 px down — below the bar.
  const box = trafficLightBox(view(390, 520, 0), 3)
  assert.equal(box.y, 52)
  assert.equal(box.r, 390 * 0.042)
})

test('phone on its side: below the bar, and shrunk rather than pushed down over the child', () => {
  // 844×390 window, 520×390 picture from the top; the bar ends around 105 px.
  const box = trafficLightBox(view(520, 390, 105), 3)
  assert.ok(box.y >= 105 + 5)
  assert.ok(box.y + box.boxH <= 390 * 0.62 + 0.5, `bottom ${box.y + box.boxH}`)
  assert.ok(box.r < 390 * 0.042)
  assert.ok(box.r >= 390 * 0.026)
})

test('with nothing over the picture the light is where it always was', () => {
  const box = trafficLightBox(view(1200, 900), 2)
  assert.equal(box.y, 90)
  assert.equal(box.x, 600 - box.boxW / 2)
  assert.equal(box.boxH, box.gap * 2 + box.r)
})

test('the box is always fully on the picture', () => {
  for (const [w, h] of [[1200, 900], [390, 520], [520, 390], [820, 1093], [320, 427]]) {
    for (const safeTop of [0, 60, 140, 200]) {
      for (const lamps of [2, 3]) {
        const b = trafficLightBox(view(w, h, safeTop), lamps)
        assert.ok(b.x >= 0 && b.x + b.boxW <= w)
        assert.ok(b.y >= 0 && b.y + b.boxH <= h, `${w}×${h} safeTop ${safeTop}: ${b.y}+${b.boxH}`)
      }
    }
  }
})
