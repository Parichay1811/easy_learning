# The living companion

Learnigo's puppy is now one character that lives in the page, not a picture with a dance loop. It sits in the layout, notices the learner, looks at what they reach for, talks when the AI teacher's voice speaks, hops for a right answer, gives a kind look after a miss, and travels between pages along an arc instead of reappearing. Butterflies fly like butterflies, rest on new things and on the dog's head, and keep out of the way.

- Code: `client/src/companion/` (stage, brain, player, motion, butterflies, geometry, bus) and `components/Mascot` (the places the dog may sit).
- Assets: `client/public/companion/` (10 clips, poster, manifest) and `client/src/assets/videos/meadow-*` (background without the painted dog).
- Pipeline: `tools/companion/` ([PIPELINE.md](PIPELINE.md)).
- Behaviour spec: [INTERACTIONS.md](INTERACTIONS.md).
- Verification, performance, limits: [REPORT.md](REPORT.md).

## How it fits together

```
 <Mascot> in a page ──registers a "spot"──▶ bus.js ◀── companion.signal("success" | "support" | "curious" | "lookAt")
                                              │              (QuestionCard, ModulePlayer, ErrorBoundary …)
                                              ▼
 narrator.js events ──speakStart/End──▶  stage.js  ──picks spot (geometry.pickSpot), moves the dog INTO it,
 pointer / focus / scroll ─────────────▶     │        or lifts it and hops it to a new one (motion.travel)
                                              │
                                   brain.js ◀─┴─▶ AlphaVideo.js (WebGL, stacked-alpha H.264 clips)
                          (which beat next)         motion.js (hop, lean, enter, exit: Web Animations)
```

- **One dog.** The dog's element is moved into the chosen `<Mascot>` box, so it scrolls with the page natively and sits under dialogs and cards like any element. Between spots it is lifted into a fixed layer (z-index 1500) and hops along an arc to the new spot. It never takes a click (`pointer-events: none`).
- **Which spot.** Spots in an open dialog win, then priority, then size. The current spot is kept while 30% or more of it is on screen, so the dog does not hop back and forth while the learner scrolls. `fallback` spots (the answer sheet on a phone) fold away while the dog is in a main spot.
- **Off when it should be.** With "less movement", "fewer distractions", the device's reduced-motion setting or Save-Data on, nothing starts: every `<Mascot>` shows the still picture with its CSS motion, and the background shows a still poster (no video download). It also stays off on staff tools (school, teacher, super admin) and during a camera game. If WebGL is missing, the manifest fails or the video errors, it stops itself and the still pictures come back.
- **Cheap when idle.** Clips are decoded only while the dog is on screen and the tab is visible (IntersectionObserver plus visibilitychange). The first paint needs the 30 KB poster. The idle clip (246 KB) follows, and three likely next clips are fetched when the browser is idle. The others load on first use.

## Using it in a page

```jsx
<Mascot size={140} mood="idle" />                 // a place the live dog may sit (>= 96px, or any CSS size)
<Mascot size={56} />                              // a still picture (toasts, chips)
<Mascot size={56} live fallback />                // used only when no main place is on screen
<Mascot size="var(--buddy-size)" priority={1} />  // prefer this place
<button data-companion-look>Play</button>         // the dog glances at it when the learner reaches for it
<button data-companion-guide>Start</button>       // after 10 s of hesitation, the dog points or looks at it (once)
<span data-butterfly-perch>New</span>             // butterflies may rest here
companion.signal("success", { size: "big" })      // a finished round, a badge (a cheer and a big hop)
companion.signal("success")                       // one right answer (a small hop)
companion.signal("support")                       // a miss, an error (a kind look, rate-limited)
companion.signal("lookAt", { el })                // look at new content
```

`mood` still works: for the live dog, `cheer` means celebrate, `think` means curious and `wave` means hello.

Debugging: `localStorage.learnigo_companion_debug = "1"` logs what the brain hears and decides. `<html data-companion-live data-companion-clip data-companion-beat>` shows the current state.
