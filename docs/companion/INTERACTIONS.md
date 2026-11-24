# What the companion does, and when

The rule is that a reaction has to be earned. Motion has a reason, reactions are rare and short, and the dog is calm while the learner reads. Everything here is implemented in `client/src/companion/brain.js` (unit tests in `brain.test.mjs`) and `stage.js`.

## Performances (filmed) and body motion (real-time)

| Clip | Length | Used for |
|---|---|---|
| idle | 4 s | breathing, a blink, an ear twitch (the default) |
| hello | 4 s | notices the learner, ears up, one paw wave |
| lookLeft / lookRight | 3 s | turns its head towards something and back |
| tilt | 3 s | a curious head tilt |
| cheer | 3 s | seated joy: ears bounce, tail wags, paws up |
| talk | 4 s | mouth moves in a talking rhythm, small nods |
| point | 4 s | looks right and lifts a paw: "over there" |
| comfort | 3 s | soft eyes, a slow nod, a warm smile |
| sleepy | 5 s | a slow yawn, eyes close, wakes and smiles |
| standUp | 1 s | gets up from sitting and turns to the right (the sit-down played backwards) |
| walk | 1.8 s, loops | a happy trot in place, facing right; the page moves the dog, mirrored when it goes left |
| sitDown | 1.8 s | stops, turns to face the learner and sits (ends on the resting pose) |
| play | 5 s | looks up at a butterfly, follows it with its eyes, lifts a paw to it, wiggles, settles |

Body motion runs on top of whatever clip is playing:
- hop, small or big, with anticipation, stretch and landing squash;
- lean, ±3° towards a target;
- travel along an arc, with a crouch before take-off and a squash on landing;
- enter (bounds up from below);
- exit (hops down and away).

## Events and responses

Priority, highest first: speak 7, celebrate 6, support 5, greet 4, guide 3, attend 2, ambient 1, idle 0. A higher-priority event interrupts the playing clip with a 180 ms cross-fade. A lower-priority one waits for the clip to end, and is dropped if it waited more than 2.5 s.

| What happens | Where it comes from | The dog | Limits |
|---|---|---|---|
| The dog arrives in a place (first time in a while) | stage | **hello** | at most once every 45 s; otherwise a **tilt** |
| The dog arrives in a place with mood `cheer` / `think` | `<Mascot mood>` (e.g. Round Complete) | **cheer** with a big hop / **tilt** | — |
| The AI teacher's voice starts / stops | `narrator.js` events | **talk** in a loop / back to idle at once | a cheer on screen finishes first |
| A right answer | `QuestionCard` phase `correct` | a **small hop** on the current clip (no clip change) | — |
| A right answer, what the teacher says | `QuestionCard` + `utils/feedbackLines.js` | one of **50 praise lines** (per language, `public/locales/<lang>/feedback.json`), then the server's personal message or the question's own words if there is one | shuffled bag: every line once before any repeats, never twice running; `{name}` lines only when the first name is known |
| A miss, what the teacher says | same | one of **50 kind, motivating lines** that invite another try, then the question's own words and the offered help | same; never "wrong", no comparisons |
| The round ends | `RoundComplete` + `feedbackLines.pickSummary` | a spoken and on-screen **summary** (one of 50 by score: perfect, 80%+, 50%+, under half) and a **next step** (50 by score: try something new / another go / a gentle retry), with the score in it | falls back to the short built-in sentence until the language file loads |
| A round finished, a badge | `<Mascot mood="cheer">` in the results, or `signal("success", {size: "big"})` | **cheer** with a big hop; the butterflies come and circle it | big cheer at most every 3.5 s |
| A miss, a near miss, a revealed answer, an error screen | `QuestionCard`, `ErrorBoundary` | **comfort** (never sad, never "wrong!") | at most every 6 s |
| A new question appears | `ModulePlayer` → `lookAt` | **lookLeft / lookRight** towards the card, with a lean | at most every 7 s; never while talking |
| The pointer comes within 90 px of a `data-companion-look` element, or keyboard focus lands on one | stage | **lookLeft / lookRight** towards it | same element at most every 15 s; not within 1.5 s of a scroll; never while talking |
| No click or key for 10 s after arriving, and a `data-companion-guide` element is fully in view | stage | **point** (target on its right) or **lookLeft** | once per arrival, at most every 30 s |
| Quiet for a while (no scroll, typing or reading in the last 6 s) | brain | a **tilt** or a glance | at most every 14 s, half the time, never the same one twice running |
| Nobody around for 75 s | brain | one **sleepy** yawn, then still | once until there is activity again |
| Scrolling, typing, wheel, touch-move | stage | nothing (stays calm) | blocks ambient moves for 6 s and looks for 1.5 s |
| A "door of light" transition opens (choosing a role on the entry page) | `Entry/door.js` → `signal("door")` | lifted above the light with a small hop, stays visible, lands in the next page's place | layer back to normal when it lands (or after 3 s) |
| The page with the dog goes away | spot removed | stays where it is on screen for up to 0.9 s, then **walks** to the next page's place: stands up, trots over facing the way it goes (cadence follows the distance; small bounds on a long, quick trip), turns and sits. With no place on the next page it trots off the nearer side | only on screens 700px wide or more (on a phone it hops, and pops out when the next page has no place, so it never trots across a narrow screen's header); the walk clips must be downloaded (until then it hops); while the voice speaks it hops instead, so it is there to talk; a sit after a walk is quicker if the voice started meanwhile |
| The dog's place appears while it was off screen | stage | trots in from the nearer side of the window and sits | only once the dog has been in a place this visit (a page opened straight into a lesson bounds up from below instead, so it never trots across the question card); walk clips downloaded |
| A move within the same page (into a lesson's answer sheet) | stage | a quick **hop** along an arc, never a walk | a reaction must not take three seconds |
| A butterfly heads for the dog | `butterflies.js` → `butterflyVisit` | if the dog is free: the butterfly flies to where the film's butterfly enters the picture, the dog performs **play**, and the butterfly flies the film's own path in time with it (the dog's eyes follow a real butterfly), then flutters off. If not, the butterfly rests somewhere else | at most every 90 s; only when calm (no reading or scrolling in the last 6 s), never while the voice speaks, never over a celebration, support or guide; a pointer coming close scares the butterfly off |
| A page's place is folded away (0 x 0 on a phone, like the lesson card's buddy corner) | stage | it does not count: the dog leaves instead of waiting, floating where it was lifted | — |
| A dialog opens with a place in it | spot in `[role=dialog]` | hops into the dialog | dialogs win over the page |
| The dog's place scrolls mostly out of view | stage | hops to the best visible place, or stays if none | keeps its place while 30% or more is visible |
| Tab hidden, or the dog's place off screen | stage | video paused (no decoding) | — |

## Sounds that go with the dog

Very quiet (about a quarter of a button press), made in the browser (`dogSfx` in `utils/sounds.js`), switched by the same interface-sounds setting and volume as every other sound, and dipped under the teacher's voice.

| What the dog does | Sound | When |
|---|---|---|
| stands up (`standUp`) | a small rising "hup" | clip start |
| trots (`walk`) | a footfall per step, two alternating pitches | every `250 ms / playback rate`, so it follows the filmed trot's rhythm (measured head bob 248 ms) |
| sits (`sitDown`) | a soft thump and settle | 70% into the clip, when the turn is over |
| any hop (reaction, door, settling in) | a boing, then a landing thump | take-off, and 78% into the hop |
| arc hop within a page | boing after the crouch, thump on landing | 150 ms in, and at the end |
| bounds in / hops out of a place | a tiny pop | with the move |
| `hello` | two tiny yips | 0.5 s in |
| `tilt` / `comfort` / `cheer` / `sleepy` / `point` | a curious "hm?" / a kind low "mm" / a sparkle / a slow yawn / a paw tap | in the clip |
| `play` (butterfly) | a paw tap as the paw goes up, a sparkle at the wiggle | 1.6 s and 2.4 s in |

## Places by page

| Page | Place | Size |
|---|---|---|
| Entry pages (`/`, sign-in pages) | beside the welcome bubble | `var(--pup)` |
| Home (`/home`) | welcome card | `WelcomeBack` size |
| Question round, 1180 px and wider | beside the card, bottom corner (right when the Speak side panel is open) | 116–168 px |
| Question round, narrower | in the answer sheet when it opens (`fallback`) | 56 px |
| Round complete | in the results dialog | 110 px |
| Discovery, dashboard empty states, error screen | their `<Mascot>` | 110–120 px |
| Toasts, chips, small sheets | still picture (not live) | < 96 px |

## Butterflies

- **How many.** One on phones, two on wider screens, drawn on a canvas under the navbar and dialogs. They fade out while a dialog is open, except to come and celebrate around the dog.
- **Flight.** A wandering heading driven by smooth noise, a bob on every wing beat, wing-beat rate that changes with speed, glides with wings held open, depth scale 0.8–1.1.
- **Where they go.** Each new destination is a point with nothing of the page under it (`elementFromPoint` is the page background), so they avoid text.
- **Resting.** Every 20–40 s one may rest for 3.5–7 s on a `data-butterfly-perch` element or on the dog's head, opening and closing its wings slowly. It takes off if the perch moves.
- **The pointer.** They move away when the pointer comes within 90 px.
