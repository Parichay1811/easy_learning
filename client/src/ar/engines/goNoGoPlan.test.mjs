// node --test client/src/ar/engines/goNoGoPlan.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pickVariant, segmentOf, minNoGoFor, chooseGo, drawFresh } from './goNoGoPlan.js'
import { makeRng } from '../core/geometry.js'

/** Plays one round's go / no-go plan exactly as goNoGoEngine.buildTrial does. */
function planRound({ trials, flipAt = null, noGoRate, rng }) {
  const rules = []
  for (let index = 0; index < trials; index++) {
    const seg = segmentOf(index, trials, flipAt)
    const isGo = chooseGo({
      noGoRate,
      roll: rng(),
      recent: rules,
      remaining: seg.remaining,
      noGoSoFar: rules.slice(seg.start).filter((r) => r === 'noGo').length,
      minNoGo: minNoGoFor(seg.length),
    })
    rules.push(isGo ? 'go' : 'noGo')
  }
  return rules
}

const count = (rules, from, to) => rules.slice(from, to).filter((r) => r === 'noGo').length
const longestRun = (rules) => {
  let best = 0
  let run = 0
  for (const r of rules) {
    run = r === 'noGo' ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}

test('pickVariant never repeats the pair just played, and reaches every pair', () => {
  const rng = makeRng(1)
  const seen = new Set()
  let last = null
  for (let i = 0; i < 400; i++) {
    const v = pickVariant(4, last, rng)
    assert.notEqual(v, last)
    assert.ok(v >= 0 && v < 4)
    seen.add(v)
    last = v
  }
  assert.equal(seen.size, 4)
})

test('pickVariant with one variant, or none, is always the first', () => {
  assert.equal(pickVariant(1, 0), 0)
  assert.equal(pickVariant(0, null), 0)
  // An rng that returns exactly 1 must not run off the end.
  assert.equal(pickVariant(3, 2, () => 1), 1)
})

test('segmentOf splits a Rule Switch round at the flip and nowhere else', () => {
  // Rule Switch: 22 turns, the rule flips at floor(22 × 0.55) = 12.
  assert.deepEqual(segmentOf(0, 22, 12), { start: 0, length: 12, position: 0, remaining: 12 })
  assert.deepEqual(segmentOf(11, 22, 12), { start: 0, length: 12, position: 11, remaining: 1 })
  assert.deepEqual(segmentOf(12, 22, 12), { start: 12, length: 10, position: 0, remaining: 10 })
  assert.deepEqual(segmentOf(21, 22, 12), { start: 12, length: 10, position: 9, remaining: 1 })
  // No switch: the whole round is one stretch.
  assert.deepEqual(segmentOf(5, 18, null), { start: 0, length: 18, position: 5, remaining: 13 })
})

test('what used to happen: at level 1 the opposite rule was often met once, or never', () => {
  // The old draw — `rng() > noGoRate`, no floor — over the 10 turns after the switch.
  const rng = makeRng(42)
  let thin = 0
  const rounds = 4000
  for (let i = 0; i < rounds; i++) {
    let noGo = 0
    for (let k = 0; k < 10; k++) if (!(rng() > 0.15)) noGo++
    if (noGo <= 1) thin++
  }
  // 0.85^10 + 10 × 0.15 × 0.85^9 ≈ 54 %.
  assert.ok(thin / rounds > 0.45, `only ${thin} of ${rounds}`)
})

test('Rule Switch: both rules now get at least two "leave it alone" turns, at every level', () => {
  for (const noGoRate of [0.15, 0.22, 0.3, 0.38]) {
    const rng = makeRng(Math.round(noGoRate * 1000))
    for (let i = 0; i < 3000; i++) {
      const rules = planRound({ trials: 22, flipAt: 12, noGoRate, rng })
      assert.ok(count(rules, 0, 12) >= 2, `before the switch @${noGoRate}: ${rules.join(' ')}`)
      assert.ok(count(rules, 12, 22) >= 2, `after the switch @${noGoRate}: ${rules.join(' ')}`)
    }
  }
})

test('Safe Hands and Pets Only: at least two unsafe / wild pictures in a round', () => {
  for (const trials of [18, 20]) {
    const rng = makeRng(trials)
    for (let i = 0; i < 3000; i++) {
      const rules = planRound({ trials, noGoRate: 0.15, rng })
      assert.ok(count(rules, 0, trials) >= 2, rules.join(' '))
    }
  }
})

test('the floor holds even when the dice never roll a "leave it alone"', () => {
  const rules = planRound({ trials: 22, flipAt: 12, noGoRate: 0, rng: () => 0.999 })
  assert.equal(count(rules, 0, 12), 2)
  assert.equal(count(rules, 12, 22), 2)
})

test('it stays an inhibition task: opens on a "touch it", never three "leave it" running', () => {
  for (const noGoRate of [0.15, 0.38, 0.9]) {
    const rng = makeRng(7)
    for (let i = 0; i < 2000; i++) {
      const rules = planRound({ trials: 22, flipAt: 12, noGoRate, rng })
      assert.equal(rules[0], 'go')
      assert.ok(longestRun(rules) <= 2, rules.join(' '))
    }
  }
})

test('the floor does not turn level 1 into a harder level', () => {
  // Share of "leave it alone" turns at the level-1 rate, floor included.
  const rng = makeRng(99)
  let noGo = 0
  const rounds = 4000
  for (let i = 0; i < rounds; i++) noGo += count(planRound({ trials: 22, flipAt: 12, noGoRate: 0.15, rng }), 0, 22)
  const share = noGo / (rounds * 22)
  // Up from ~14 %, and still below the level-2 rate of 22 %.
  assert.ok(share > 0.15 && share < 0.22, `share ${share}`)
})

test('a short stretch asks for less, and a tiny one for nothing', () => {
  assert.equal(minNoGoFor(12), 2)
  assert.equal(minNoGoFor(6), 2)
  assert.equal(minNoGoFor(5), 1)
  assert.equal(minNoGoFor(3), 1)
  assert.equal(minNoGoFor(2), 0)
})

test('drawFresh shows every picture once before any comes round again', () => {
  const pool = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}` }))
  const used = new Set()
  const rng = makeRng(3)
  const first = []
  for (let i = 0; i < 8; i++) first.push(drawFresh(pool, used, rng, first.at(-1)?.id ?? null).id)
  assert.equal(new Set(first).size, 8)
  // The ninth starts the pool again, but not with the picture just shown.
  const ninth = drawFresh(pool, used, rng, first.at(-1))
  assert.notEqual(ninth.id, first.at(-1))
})

test('drawFresh never shows the same picture twice running, over a long run', () => {
  const pool = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  const used = new Set()
  const rng = makeRng(17)
  let last = null
  for (let i = 0; i < 500; i++) {
    const it = drawFresh(pool, used, rng, last)
    assert.notEqual(it.id, last)
    last = it.id
  }
})

test('drawFresh does not repeat the last picture even when its memory was just wiped', () => {
  // The rule switch clears what has been shown: the same pictures now mean the
  // opposite. The picture on screen a moment ago must still not come straight back.
  const pool = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
  for (let seed = 1; seed <= 200; seed++) {
    const rng = makeRng(seed)
    const used = new Set()
    const last = drawFresh(pool, used, rng).id
    used.clear()
    assert.notEqual(drawFresh(pool, used, rng, last).id, last)
  }
})

test('drawFresh keeps two pools apart in one memory, as the engine uses it', () => {
  const go = [{ id: 'g1' }, { id: 'g2' }]
  const noGo = [{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }]
  const used = new Set()
  const rng = makeRng(8)
  const seenNoGo = [drawFresh(noGo, used, rng).id]
  drawFresh(go, used, rng)
  drawFresh(go, used, rng)
  drawFresh(go, used, rng) // refills the go pool only
  seenNoGo.push(drawFresh(noGo, used, rng).id, drawFresh(noGo, used, rng).id)
  assert.equal(new Set(seenNoGo).size, 3)
})

test('drawFresh copes with one picture and with none', () => {
  assert.equal(drawFresh([], new Set()), null)
  const used = new Set()
  assert.equal(drawFresh([{ id: 'only' }], used, Math.random, 'only').id, 'only')
  assert.equal(drawFresh([{ id: 'only' }], used, Math.random, 'only').id, 'only')
})
