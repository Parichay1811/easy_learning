// node --test client/src/ar/content/content.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  getSet, getSets, buildChoiceSet, buildSameKindChoiceSet, sameSetAs, isSwatch, asSwatch,
} from './index.js'
import { SETS } from './packs/index.js'
import { RULE_SWITCH_VARIANTS, plainPicture } from '../catalog/ruleVariants.js'
import { makeRng } from '../core/geometry.js'

const LEVELS = [
  { choices: 2, distractorKind: 'none' },
  { choices: 2, distractorKind: 'unrelated' },
  { choices: 3, distractorKind: 'related' },
  { choices: 4, distractorKind: 'similar' },
  { choices: 6, distractorKind: 'confusable' },
]

/** Two items a child cannot tell apart on screen: same outline, same fill. */
const lookAlike = (a, b) => a.id !== b.id && a.shape === b.shape && a.attrs?.color === b.attrs?.color

// ── Read & Find: "the circle is being called by its colour name" ─────────────
test('the cause: a colour swatch is a circle, and the circle shape is itself red', () => {
  const pool = getSets(['shapes', 'colors'])
  const circle = pool.find((i) => i.id === 'shape-circle')
  const red = pool.find((i) => i.id === 'colour-red')
  assert.equal(circle.label, 'Circle')
  assert.equal(red.label, 'Red')
  assert.ok(lookAlike(circle, red), 'one red circle answers to both words')
  // Every colour is drawn as a circle, so every one of them is "the circle" too.
  for (const c of getSet('colors')) assert.equal(c.shape, 'circle', c.id)
})

test('mixing the two sets did put a colour swatch on screen with the shapes', () => {
  const pool = getSets(['shapes', 'colors'])
  const rng = makeRng(4)
  let mixed = 0
  for (let i = 0; i < 300; i++) {
    const { target, options } = buildChoiceSet({ pool, choices: 4, distractorKind: 'related', rng })
    if (options.some((o) => o.set !== target.set)) mixed++
  }
  assert.ok(mixed > 50, `${mixed} of 300`)
})

test('Read & Find: a turn now shows one kind of thing, at every level, for every word', () => {
  const pool = getSets(['shapes', 'colors'])
  const rng = makeRng(21)
  for (const target of pool) {
    for (const lvl of LEVELS) {
      for (let k = 0; k < 20; k++) {
        const { target: answer, options } = buildSameKindChoiceSet({ pool, target, ...lvl, rng })
        assert.equal(answer.id, target.id)
        assert.ok(options.some((o) => o.id === target.id), 'the answer is on screen')
        for (const o of options) {
          assert.equal(o.set, target.set, `${target.label} shown with ${o.label}`)
          assert.ok(!lookAlike(o, target), `${o.label} looks the same as ${target.label}`)
        }
        // A shape word: no two shapes on screen are the same shape. A colour
        // word: no two swatches are the same colour. So the word has one answer.
        const key = (o) => (target.set === 'colors' ? o.attrs.color : o.shape)
        assert.equal(new Set(options.map(key)).size, options.length, options.map((o) => o.label).join(','))
      }
    }
  }
})

test('when no answer is given, one is picked and its own kind follows', () => {
  const pool = getSets(['shapes', 'colors'])
  const rng = makeRng(2)
  const kinds = new Set()
  for (let i = 0; i < 200; i++) {
    const { target, options } = buildSameKindChoiceSet({ pool, choices: 4, distractorKind: 'related', rng })
    kinds.add(target.set)
    assert.ok(options.every((o) => o.set === target.set))
  }
  assert.deepEqual([...kinds].sort(), ['colors', 'shapes'])
})

test('a colour is drawn as a drop of paint there, never as the circle; shapes are untouched', () => {
  for (const c of getSet('colors')) {
    assert.ok(isSwatch(c), c.id)
    assert.deepEqual(asSwatch(c).sprite, { kind: 'shape', value: 'drop' })
    assert.equal(asSwatch(c).label, c.label)
  }
  for (const s of getSet('shapes')) {
    assert.ok(!isSwatch(s), s.id)
    assert.equal(asSwatch(s), s)
  }
})

test('sameSetAs leaves a single-set pool alone and never returns nothing', () => {
  const shapes = getSet('shapes')
  assert.equal(sameSetAs(shapes, shapes[0]).length, shapes.length)
  assert.deepEqual(sameSetAs(shapes, null), shapes)
  assert.deepEqual(sameSetAs(shapes, { id: 'x', set: 'nowhere' }), shapes)
})

// ── the other "find" games named with it ─────────────────────────────────────
test('Find the Shape asks for the shape, never the colour', () => {
  for (const s of getSet('shapes')) {
    assert.equal(s.label.toLowerCase(), s.shape, s.id)
    assert.notEqual(s.label.toLowerCase(), s.attrs.color)
  }
})

test('Find & Touch asks for the colour of a swatch, and that is its fill', () => {
  for (const c of getSet('colors')) assert.equal(c.label.toLowerCase(), c.attrs.color, c.id)
})

test('Listen & Find: every animal and food has a name to say and a picture of its own', () => {
  const pool = getSets(['animals', 'food'])
  const pictures = new Map()
  for (const i of pool) {
    assert.ok(i.label && i.emoji, i.id)
    assert.ok(!pictures.has(i.emoji), `${i.id} shares ${i.emoji} with ${pictures.get(i.emoji)}`)
    pictures.set(i.emoji, i.id)
  }
})

// ── Safe Hands: "options are few for the unsafe things" ──────────────────────
const safety = () => getSet('safety')
const unsafe = () => safety().filter((i) => i.attrs.safety === 'unsafe')
const safe = () => safety().filter((i) => i.attrs.safety === 'safe')

test('there are sixteen unsafe things, twice what there were', () => {
  assert.equal(unsafe().length, 16)
  assert.equal(safe().length, 8)
})

test('every safety item is one or the other, with a name and one picture', () => {
  for (const i of safety()) {
    assert.ok(['safe', 'unsafe'].includes(i.attrs?.safety), i.id)
    assert.ok(i.label && i.speak && i.emoji, i.id)
    assert.ok(!i.text && !i.shape, `${i.id} has more than one visual`)
    assert.match(i.id, i.attrs.safety === 'unsafe' ? /^hazard-/ : /^safe-/)
  }
})

test('no two safety pictures are the same, so safe and unsafe never share one', () => {
  const seen = new Map()
  for (const i of safety()) {
    assert.ok(!seen.has(i.emoji), `${i.id} and ${seen.get(i.emoji)} both use ${i.emoji}`)
    seen.set(i.emoji, i.id)
  }
})

test('every hazard is a danger a child reads at a glance: fire, heat, sharp, or not to swallow', () => {
  const READABLE = ['fire', 'hot', 'sharp', 'electric', 'cleaning', 'health']
  for (const i of unsafe()) {
    assert.ok(i.cats.includes('hazard'), i.id)
    assert.ok(i.cats.some((c) => READABLE.includes(c)), `${i.id}: ${i.cats.join(',')}`)
  }
})

test('the pictures are single plain emoji: no joiners, no skin tones', () => {
  for (const i of safety()) {
    assert.ok(!/‍/.test(i.emoji), `${i.id} uses a ZWJ sequence`)
    assert.ok(!/[\u{1F3FB}-\u{1F3FF}]/u.test(i.emoji), `${i.id} uses a skin tone`)
    assert.ok([...i.emoji.replace(/️/g, '')].length === 1, `${i.id}: ${i.emoji}`)
  }
})

test('any room a safety item names has a bin to be sorted into', () => {
  const ROOMS = ['kitchen', 'bathroom', 'bedroom', 'livingroom', 'school']
  for (const i of safety()) if (i.attrs.room) assert.ok(ROOMS.includes(i.attrs.room), `${i.id}: ${i.attrs.room}`)
})

test('ids are unique across the whole library, and what a safety item calls confusable exists', () => {
  const ids = new Map()
  for (const [name, items] of Object.entries(SETS)) {
    for (const i of items) {
      assert.ok(!ids.has(i.id), `"${i.id}" is in both ${ids.get(i.id)} and ${name}`)
      ids.set(i.id, name)
    }
  }
  for (const i of safety()) for (const c of i.confusable || []) assert.ok(ids.has(c), `${i.id} → ${c}`)
})

// ── Rule Switch: "only one option for the opposite rule" ─────────────────────
/** The two pools exactly as goNoGoEngine.buildTrial makes them. */
function pools(v, switched = false) {
  const keep = v.only || (() => true)
  const isGo = (i) => {
    const base = v.goCats.some((c) => (i.cats || []).includes(c))
    return switched ? !base : base
  }
  return {
    go: getSets(v.goSets).filter(keep).filter(isGo),
    noGo: getSets(v.noGoSets).filter(keep).filter((i) => !isGo(i)),
  }
}

test('there is more than one rule pair now, and the first is still animals and vehicles', () => {
  assert.ok(RULE_SWITCH_VARIANTS.length >= 3)
  assert.equal(RULE_SWITCH_VARIANTS[0].goLabel, 'animals')
  assert.equal(RULE_SWITCH_VARIANTS[0].noGoLabel, 'vehicles')
  const pairs = RULE_SWITCH_VARIANTS.map((v) => [v.goLabel, v.noGoLabel].sort().join('/'))
  assert.equal(new Set(pairs).size, pairs.length, `a pair is listed twice: ${pairs.join(', ')}`)
})

test('each pair has plenty of pictures on both sides, before and after the switch', () => {
  for (const v of RULE_SWITCH_VARIANTS) {
    for (const switched of [false, true]) {
      const { go, noGo } = pools(v, switched)
      const name = `${v.goLabel}/${v.noGoLabel}${switched ? ' (switched)' : ''}`
      assert.ok(go.length >= 10, `${name}: ${go.length} to touch`)
      assert.ok(noGo.length >= 10, `${name}: ${noGo.length} to leave`)
      const goIds = new Set(go.map((i) => i.id))
      assert.ok(noGo.every((i) => !goIds.has(i.id)), `${name}: a picture is on both sides`)
    }
  }
})

test('the two sides of a pair are different sets, so a picture cannot belong to both', () => {
  for (const v of RULE_SWITCH_VARIANTS) {
    const { go, noGo } = pools(v)
    const goSets = new Set(go.map((i) => i.set))
    const noGoSets = new Set(noGo.map((i) => i.set))
    assert.equal(goSets.size, 1, `${v.goLabel}: ${[...goSets]}`)
    assert.equal(noGoSets.size, 1, `${v.noGoLabel}: ${[...noGoSets]}`)
    assert.notDeepEqual([...goSets], [...noGoSets])
  }
})

test('only pictures that say what they are without a caption are used', () => {
  const kept = (set) => getSet(set).filter(plainPicture).map((i) => i.id)
  // Food is fruit and vegetables: no grain stalk for cereal, no jar for yoghurt.
  for (const id of ['cereal', 'yoghurt', 'water', 'butter']) assert.ok(!kept('food').includes(id), id)
  for (const id of ['apple', 'banana', 'carrot']) assert.ok(kept('food').includes(id), id)
  // The pyjamas glyph is a person in bed.
  assert.ok(!kept('clothing').includes('pyjamas'))
  assert.ok(kept('clothing').includes('t-shirt'))
  // Animals and vehicles are all kept.
  assert.equal(kept('animals').length, getSet('animals').length)
  assert.equal(kept('vehicles').length, getSet('vehicles').length)
})
