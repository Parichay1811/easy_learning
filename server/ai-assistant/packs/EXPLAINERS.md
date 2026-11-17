# Interactive explainers

Hundreds of "how and why" lessons drawn from data by 26 explainer
engines (`public/sims-explain.js`). A lesson pack (format: `SCHEMA.md`)
puts an engine on the board with a draw op:

```json
{ "op": "sim", "name": "x-chain", "stages": [ … ], "focus": 1 }
```

Every field of the op reaches the engine. All engines share these rules:

- **Interactive.** Every labelled element is a button: tapping it asks the
  teacher its `ask` text (or, if none, "Tell me about the <label>"), and the
  answer comes from the lesson's own FAQs when one matches. So give important
  parts an `ask` that matches one of the pack's FAQ questions.
- **`focus`** (optional, a 0-based index) highlights one element for that
  step; without it the engine cycles through them. Use it to walk a lesson
  through a diagram step by step: the same engine in every step, a
  different `focus`.
- **`icon`** names come only from the icon list below (closest match if
  yours is missing).
- **Labels** are short (1–3 words, at most 22 characters); **notes** are one
  short sentence (at most 70 characters).
- Coordinates (`x`, `y`) are fractions of the drawing area, 0 to 1, from the
  top left.

## Engines

| name | for | fields |
|---|---|---|
| `x-chain` | a process in order (how X happens) | `stages`: 3–7 of `{label, icon, note?, ask?}`; `loop`: false |
| `x-cycle` | a cycle that repeats | `stages`: 3–7 of `{label, icon, note?, ask?}` |
| `x-why` | why something happens: a question and its chain of "because" | `question` (≤ 60 chars), `because`: 2–5 of `{label, icon, note?, ask?}`, `answer` (≤ 70 chars) |
| `x-layers` | a cutaway of layers (earth, skin, atmosphere, soil, ocean, a wall) | `layers`: 3–7 of `{label, note?, color?, size?, ask?}` top to bottom (`size` relative thickness, default 1), `radial`: true for a sphere/onion, `flow`: optional `{label, from, to}` (layer indexes) |
| `x-machine` | a working machine or mechanism | `parts`: 2–10 of `{id, kind, x, y, size?, label, motion?, speed?, ask?}`; `links`: 0–10 of `{from, to, kind, label?}` (ids) |
| `x-energy` | energy in and where it goes (efficiency) | `input`: `{label, amount}`, `outputs`: 2–5 of `{label, amount, useful}` (amounts in the same unit, usually %) |
| `x-forces` | forces on an object and the motion they cause | `object` (icon), `forces`: 1–5 of `{label, dir, size}` (`dir`: up, down, left, right or degrees; `size` 1–5), `motion`: still, up, down, left, right, or float |
| `x-anatomy` | a labelled body, animal, plant or organ | `body` (silhouette, list below), `parts`: 3–8 of `{label, x, y, note?, ask?}` |
| `x-graph` | how one thing changes with another | `x`: `{label}`, `y`: `{label}`, `shape`: rise, fall, peak, s-curve, exponential, decay, wave or linear, `marks`: 0–4 of `{at, label}` (`at` 0–1 along x) |
| `x-zoom` | zooming in or out through levels of size | `levels`: 3–7 of `{label, icon, note?}` from biggest to smallest |
| `x-particles` | particles: states of matter, heating, dissolving, diffusion | `state`: solid, liquid, gas, melting, boiling, freezing, condensing, dissolving or diffusion, `label`? |
| `x-network` | things linked by flows (blood, water, power, food, data) | `nodes`: 3–8 of `{id, label, icon, x, y, ask?}`, `links`: 2–12 of `{from, to, kind, label?}` |
| `x-wave` | waves: sound, light, water, earthquake | `kind`: transverse, longitudinal, water or light, `labels`: 0–3 of wavelength, amplitude, frequency, `note`? |
| `x-balance` | moments, levers and seesaws; with `pan: true` a weighing scale for equations | `left`: 1–3 of `{label, weight, dist, hide?}`, `right`: 1–3 of the same (`dist` 1–5, `weight` 1–10; `hide: true` shows "?" instead of the weight, for an unknown like x) |
| `x-sizes` | comparing sizes or amounts | `items`: 2–7 of `{label, size, icon}` (`size` a number, compared to each other), `unit`? |
| `x-compare` | two things side by side | `left`: `{title, icon, points: 2–4 short strings}`, `right`: the same, `verdict`? |
| `x-story` | a social story or short scene: a child meets a situation, feels, copes | `who`? (a name, ≤ 14 chars), `panels`: 3–6 of `{label, note?, icon?, mood?, ask?}` in order |
| `x-steps` | a routine or visual schedule: what to do, one step at a time | `mode`: checklist (3–8 steps, ticked off), now-next or first-then (exactly 2 steps); `steps`: `{label, icon, note?, ask?}` |
| `x-feelings` | a feelings meter: from calm to big feelings, and tools that help | `zones`: 2–5 of `{label, mood, note?, color?, ask?}` calm first, `level`? (the zone the needle points to), `tools`: 0–4 of `{label, icon, ask?}` |
| `x-count` | counting and number pictures (blocks, frames, hops, arrays, fractions, clocks) | `kind` (below), `a`, `b`, `sign` (+ - × ÷), `label`?, `step`?, `compare`? |
| `x-word` | reading and spelling: a word splits into sounds, syllables or parts, then blends | `word` (1–14 letters), `parts`: 1–7 chunks that spell the word exactly, `mode`: sounds, syllables or build (prefix + root + suffix), `icon`?, `note`? |
| `x-timeline` | events in time order (history, a life, a story, a day) | `events`: 3–8 of `{label, when (≤ 14 chars), note?, icon?, ask?}` oldest first |
| `x-sort` | sorting things into groups (living or not, nouns and verbs, needs and wants) | `question`? (≤ 60 chars), `groups`: 2–4 of `{label, icon?, items: 2–5 strings ≤ 18 chars}` |
| `x-circuit` | a real circuit diagram with moving current: series, parallel, meters, op-amp and transistor stages | `parts`: 2–8 of `{kind, label, value?, branch?, open?, note?, ask?}` (the first is the source, `cell` or `ac`), `readouts`: 0–3 strings ≤ 24 chars, `flow`?, `layout`? |
| `x-beam` | a loaded beam: supports, reactions, shear force, bending moment, deflection (worked out by the engine) | `length` (m), `supports`: 1–2 of `{kind, at}`, `loads`: 1–4 of `{kind, at, to?, size, label?}`, `show`: beam, shear, moment, deflection or a list of up to 3 |
| `x-plot` | a true graph with numbers: real curves drawn from a formula or from points | `x`: `{label, max, min?}`, `y`: `{label, max, min?}`, `curves`: 1–3 of `{label, type, a?, k?, c?, phase?, tau?, points?, closed?}`, `marks`: 0–4 of `{x, label}` |

`x-machine` part `kind`: gear, wheel, piston, lever, spring, pipe, box,
motor, fan, belt, weight, valve, magnet, battery, bulb, coil, tank,
propeller, axle. `motion`: spin, slide, swing, pulse, flow or none.
`links` `kind` (in x-machine and x-network): energy, fluid, force, signal,
heat, blood, food, power, data.

`x-anatomy` `body`: human, human-head, skeleton, heart, lungs, eye, ear,
tooth, skin, cell, plant-cell, neuron, quadruped, bird, fish, insect,
spider, reptile, frog, whale, plant, flower, leaf, tree.

`x-count` `kind` and what `a` and `b` mean:

| kind | a | b | notes |
|---|---|---|---|
| `ten-frame` | counters, 0–20 | added (`sign: "+"`) or taken away (`"-"`), optional | answer 0–20; two frames above 10 |
| `base-ten` | a number 1–999 shown as hundreds, tens and ones | optional, with `sign` `+` or `-` | answer 0–999; regrouping is animated |
| `number-line` | start, −50 to 100 | hop size total, 0–50, with `sign` `+` or `-` | `step` (1–25) makes equal hops: skip counting |
| `array` | rows 1–10 | columns 1–12 | multiplication as rows of dots |
| `groups` | groups 1–6 | in each group 1–10 | `sign` `×` makes groups, `÷` shares out |
| `fraction-bar`, `fraction-pie` | numerator | denominator 1–12 | `compare`: `{a, b}` a second fraction below |
| `clock` | hour 1–12 | minutes 0–59 | an analogue clock with the time in words |

`mood` (x-story, x-feelings): happy, calm, sad, worried, angry, proud,
surprised, scared, tired, excited, confused, frustrated. Faces are simple
and friendly; x-story draws the same child in every panel.

`x-circuit`: part `kind` is cell, ac, resistor, capacitor, inductor, bulb,
switch (`open: true` breaks the loop), diode, led, motor, fuse, ammeter,
voltmeter or block (a labelled box such as "Rectifier" or "Op-amp ×10").
`value` is a short reading ("12 V", "4 Ω", "100 µF"). `branch` 0 (or none)
is the main loop with the source; parts with `branch` 1, 2, 3 sit in side
branches in parallel with each other (each branch's parts in series), so a
series circuit uses only branch 0 and a parallel one numbers its branches
1, 2 (and 3). Dots show the current moving (conventional current, + to −),
faster where more current flows; an open switch on the main loop stops it
(or set `flow: false`). `readouts` are shown beside the circuit ("I = 2 A").
A voltmeter is drawn across the part listed just before it (the source if
it comes first); a branch holding only a voltmeter is a meter in parallel.

`layout` (x-circuit) draws a textbook stage instead of a loop: `inverting`,
`non-inverting`, `follower`, `transistor` or `common-emitter` (default
`loop`, as above). Kinds `opamp`, `npn` and `nmos` exist only in these
layouts. The parts are matched by role, in this order (? = optional), with
no `branch` fields; `focus` still counts parts in the order written:

| layout | parts in order |
|---|---|
| `inverting` | input source (cell/ac), input resistor R_in, feedback resistor R_f, opamp, load? (resistor/bulb/led/voltmeter) |
| `non-inverting` | input source, resistor to ground R_g, feedback resistor R_f, opamp, load? |
| `follower` | input source, opamp, load? |
| `transistor` | supply cell, collector/drain load (resistor/bulb/motor/led), npn or nmos, base/gate resistor, input? (cell/ac, or a switch from the supply; none ties the resistor to the supply), ammeter? (in the collector) |
| `common-emitter` | supply cell, R1 (supply to base), R2 (base to ground), R_C (resistor/bulb/motor/led), npn or nmos, R_E (emitter to ground), signal input? (cell/ac, through a coupling capacitor) |

The engine works the stage out from the values: the op-amp's output (−R_f/R_in
× V_in, 1 + R_f/R_g, or ×1) is tagged at the output node; current flows
through R_in and R_f but never into the op-amp's inputs; a BJT shows a thin
base current and a big collector current (β from a value like "β = 100"); a
MOSFET's gate draws no current and shows as charged instead. A transistor is
off with `flow: false`, an open input switch, or an input below 0.7 V (npn)
or 2 V (nmos).

`x-beam`: `supports` are a `pin` and a `roller` (or two pins) anywhere
along the beam, or one `fixed` wall at 0 or 1 (a cantilever). `loads`:
`point` at `at` with `size` in kN, or `udl` (spread evenly) from `at` to
`to` with `size` in kN per metre. The engine works out the reactions and
draws them with their values, and `show` adds the shear force diagram, the
bending moment diagram or the deflected shape below the beam. Writers can
get the same numbers from `solveBeam(op)` in `shared/explainer-spec.js`
(reactions, `maxShear`, `maxMoment`, `maxDeflection`; moment negative means
hogging) so the narration says exactly what the board shows.

`x-plot` curve `type` and its numbers (`plotValue` in the spec computes
them): `sine` c + a·sin(2π·k·x + phase°) (k cycles per x unit); `rise`
c + a(1 − e^(−x/k)) (k the time constant); `decay` c + a·e^(−x/k); `line`
c + k·x; `power` c + a·x^k; `damped` c + a·e^(−x/tau)·cos(2π·k·x);
`points` straight lines through 2–16 `[x, y]` pairs (`closed: true` joins
the last to the first: a P–V cycle; `smooth: true` rounds the corners).
`marks` draw a dashed line at `x` with a dot on the first curve.
`equal: true` scales both axes the same, so a circle (Mohr's circle) stays
round.

`x-word` example: `{ "word": "rainbow", "parts": ["rain", "bow"], "mode":
"syllables", "icon": "rainbow" }`; sounds mode uses one part per sound
(`["sh", "i", "p"]` for ship); joined parts must spell the word.

## Icons

sun, moon, star, cloud, rain, snow, lightning, wind, rainbow, drop, wave,
ice, fire, smoke, steam, thermometer, mountain, volcano, rock, sand, soil,
cave, river, ocean, tree, leaf, seed, flower, root, grass, cactus,
mushroom, fish, bird, bee, butterfly, ant, spider, frog, snake, dog, cat,
horse, whale, elephant, egg, bone, heart, lung, brain, stomach, kidney,
eye, ear, nose, tongue, hand, tooth, muscle, blood, cell, dna, germ,
person, baby, atom, molecule, magnet, battery, bulb, plug, wire, switch,
gear, wheel, spring, lever, pulley, piston, pipe, pump, valve, fan,
turbine, motor, engine, car, bike, train, plane, ship, rocket, satellite,
house, bridge, tower, factory, crane, computer, chip, phone, antenna,
robot, sensor, camera, clock, scale, ruler, light, sound, arrow, book,
pencil, school, bed, bath, plate, apple, ball, music, speech, family, toy,
bag, shoe, cup, toothbrush, timer, calendar, globe, flag, coin, puzzle,
paint, scissors, bus, shop, doctor, castle, compass, flask, microscope,
smile, headphones, door, chair, hat, shirt, map, crown, scroll, mail, key,
gift, umbrella.

`node test/explainer-check.mjs [packs/…]` checks every explainer op against
this list.

## How the engines read some fields

- `dir` in degrees is a maths angle: 0 is right, 90 is up, anticlockwise.
- `x-machine` without `motion`: gears, wheels, fans, propellers, motors and
  axles spin; pipes, belts, coils and tanks flow; pistons slide; levers
  swing; springs, bulbs, magnets and batteries pulse; boxes, valves and
  weights stay still. Gears placed close together snap into mesh and turn
  the opposite way at their gear ratio; spinning parts joined by a force,
  power or energy link turn the same way (a belt or chain).
- `x-anatomy` coordinates are fractions of the silhouette's own box. Side
  views of animals face right (head on the right); parts drawn for a
  left-facing animal are mirrored automatically.
- `x-energy`: `unit` is optional ("%" when the input is 100).
- `focus` counts: x-balance left items then right; x-energy outputs;
  x-compare 0 = left, 1 = right; x-particles 0 = before, 1 = after a change;
  x-zoom the level to zoom into; radial x-layers list outside to inside;
  x-story panels; x-steps steps; x-feelings zones; x-timeline events;
  x-cycle and x-chain stages; x-sort groups; x-word parts; x-graph marks (in the order listed);
  x-circuit parts; x-beam loads then supports; x-plot curves;
  x-count ignores it.
- `node test/explainer-render.mjs` draws every explainer op of every pack
  through the engines and reports any that fail.
