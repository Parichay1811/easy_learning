# Learnigo learning companion: how it fits together

"One AI Teacher. A different learning journey for everyone." This folder
describes the system that makes that true, and how to keep it working.

| Document | What it covers |
|---|---|
| [AUDIT.md](AUDIT.md) | What was wrong with the question bank, what was repaired, replaced or excluded, and the verified inventory |
| [QUESTION-BANK.md](QUESTION-BANK.md) | How to maintain and extend the bank: fields, validation methods, the QA gate, adding a subject or question type, the database migration |
| [ADAPTIVE.md](ADAPTIVE.md) | The adaptive engine: levels 0-8, stages 0-5, mastery, the level policy, the target band, probes, spaced repetition, teaching escalation, misconception explanations, rounds, continuity, "what next", growth badges, the decision log, guardians and educators, privacy, tuning |
| [RESEARCH.md](RESEARCH.md) | The evidence behind each design decision, what Learnigo does with it, how to measure it, its limits, and which numbers are product hypotheses |
| [JOURNEY-PROMPT.md](JOURNEY-PROMPT.md) | The "adaptive journey" brief adjusted to this codebase: what already existed, what was built, the project's rules |
| this file | The architecture, the voice, sound and accessibility logic, privacy, testing, and what is not done yet |

## Architecture

```
 server/data/*.json (12 bank files, content v3)          server/data/skills.json (90 skills, prerequisites)
        │  audit.js --check (QA gate)                                   │
        ▼                                                               ▼
 MongoDB question collections ──► questionController (old endpoint)   services/learning/catalog
        │   (never serves qa.status "excluded")                         │
        ▼                                                               ▼
 services/learning/store ──► round / baseline / level policy / mastery / spacing / support / feedback (pure rules)
        │                                    ▲
        ▼                                    │  POST /api/dashboard/log-answer  (status, firstTry, hintsUsed,
 GET /api/learn/round ──► client round ──► QuestionCard ──► checkAnswer()        supportStep, misconception, reason)
                               │                 │              (same rules on server and client)
                               │                 └── narrator (one voice) ── speakMath ── /api/ai-assistant/tts
                               ▼
              Student "My learning", parent/teacher "Learning plan", AI Teacher personal start
```

* **Content** (`server/data`, `server/scripts/content`): every question has a
  level (0-8), one skill, an age band, a validation method, `graded`, and a QA
  status. Only items that pass every blocking check are served. Ids never
  change, so answer history stays valid.
* **Marking** (`server/utils/scoreAnswer.js`, generated copy in
  `client/src/utils/scoreAnswer.js`, parity-tested over the whole bank in every
  language): `checkAnswer` returns `correct`, `close`, `incorrect`, `uncertain`
  or `ungraded`. Uncertain (no speech heard, microphone blocked, no recognition)
  and ungraded (open practice) never count for or against a learner.
* **Engine** (`server/services/learning`, `server/models/learning`): per-subject
  levels, per-skill mastery, Leitner review, a teaching approach that changes
  after repeated difficulty (words → pictures → step by step → an easier related
  item → come back later), varied feedback grounded in real history,
  guardian/teacher plans and overrides.
* **Client**: the round player (`hooks/useQuestionRound`, `components/QuestionCard`),
  the comfort settings (`utils/learnerPrefs`, `components/settings`), the voice
  (`utils/narrator`, `utils/speakMath`, `components/VoiceBar`), placement
  (`components/Placement`), and the dashboards (`components/learning`,
  `pages/studentDashboard/LearningView`, `pages/parent/ParentPlan`,
  `pages/teacher/TeacherPlan`).
* **AI Teacher** (`server/ai-assistant`): gets a short summary of the signed-in
  learner (`GET /api/learn/companion`, via `postMessage`) and opens with something
  real ("Last time, taking away was tricky, so shall we try it with pictures?").

## The adaptive journey (November 2026)

What a learner, a parent and a visitor now see, and where it lives:

| Feature | What it does | Where |
|---|---|---|
| **Stages 0-5** | Every question has a stage (0 everyday curiosity, 1 recognition, 2 understanding, 3 application, 4 reasoning, 5 transfer), separate from its level. There are 48 new everyday-curiosity questions. | `server/data`, `server/scripts/content/stages.js` |
| **Narration scripts** | Each question has its own spoken script: 1,959 written by hand in English, templated in 13 languages for maths and science (marked `templated` until a person reviews them). A script never gives the answer and never reads what the item tests. | `narration` in the bank; `server/scripts/content/narration.js`; `QuestionCard` |
| **Smarter engine** | A short check on first meeting a skill; a target success band (a hypothesis); guess-aware mastery that needs varied evidence; an explanation when the same misconception repeats; every change written to the decision log | `server/services/learning` |
| **Continuity** | An unfinished round is resumed after logout. The welcome-back message is built only from real history (the home mascot says it). "What next?" is ranked, and there's a daily discovery and mini challenges. | `/api/learn/welcome`, `/next`, `/discovery`, `/journey`; `components/journey`, `pages/studentDashboard/TodayHub.jsx`, `pages/Discovery.jsx` |
| **Growth badges** | First discovery, Concept explorer, Brilliant comeback, Three concepts mastered, Curious thinker, Problem-solving star, Review champion. Each records its evidence. No new late-night or early-morning badges. | `server/services/learning/achievements.js` |
| **Evidence for grown-ups** | Baseline vs now, stage growth, success alone vs with help, retention, misconceptions resolved, insight sentences that cite their numbers, decisions in plain language | `components/learning/evidence`, the parent "Growth" tab, the teacher student view, the parent report |
| **Landing page** | The tagline, a playable sample journey, the stage ladder, a narration demo, a multilingual preview, an example parent dashboard (labelled), privacy | `components/landing`, `pages/Home.jsx` (visitors only) |
| **Wrong-language guard** | With no voice for a language, nothing is spoken and the words are shown with a note | `utils/narrator.js` |

## Database migration plan

Content v4 (`2026-11-21-content-v4.js`: stages, everyday items, narration)
supersedes v3 for a database that has not had v3 yet; it uses the same steps.

1. Back up the production database (the usual backup), then run the migration in
   dry-run mode: `cd server && node scripts/migrations/2026-11-21-content-v4.js`.
   It prints what would change.
2. `--apply` first writes every document it will touch to
   `server/backups/<timestamp>/<collection>.json` (git-ignored), then upserts the
   v3 content by question `id`. It touches only built-in questions
   (`uploadBatchId: null`), never teacher uploads, and never deletes answers or
   progress. Running it twice changes nothing.
3. `--down <backupDir>` restores the backed-up documents.
4. The learner collections (`learnerprofiles`, `skillmasteries`) are new and are
   created on first use; they need no migration. Existing answer history
   (`studentanswers`) is kept and still read by every dashboard.

The migration is covered by `server/test/content-migration.test.js` (up, verify,
idempotent, serving filter, down) against an in-memory database. It has **not**
been run against production.

## The voice (one teacher everywhere)

`client/src/utils/narrator.js` is the only way the site speaks: question audio,
instructions ("Read to me", or automatically with the Read-aloud setting),
hints, worked examples, feedback, greetings, the AI Teacher's welcome and the
camera games. It uses the AI Teacher's own server voice (Supertonic, cached by
sentence), and the browser's best voice for that language when the server voice
is missing or slow; a voice of another language is never used.

* Maths is made speakable first (`utils/speakMath.js`): "3 + 5 = ?" is read
  "three plus five equals what?", fractions, decimals, money, times and units
  too, with operator words in all 14 languages.
* The learner can change the speed, pause, carry on, replay and stop, and turn
  captions on or off. With the voice turned off the teacher never speaks by
  herself, but buttons the learner presses still speak.
* If no voice is available, the words are still on screen and nothing waits.
  A listening item whose sound cannot play offers "Read it instead" (when the
  learner asks), and that answer is logged as uncertain, never as a pass.

## Sound and touch

`client/src/utils/sounds.js`: short synthesised sounds that match what happens
(tap, open/close, forward/back, correct, wrong…). Cards marked
`data-hover-sound` give a very soft, 32 ms "glass tap" when a mouse or pen
**enters** them (never while moving inside, never on touch, at most one every
90 ms, silent while the teacher is speaking). Every sound is ducked while the
teacher speaks. Interface sounds, hover sounds, their volume and vibration are
separate settings from the teacher's voice.

## Accessibility and comfort settings

No diagnosis is ever asked. `client/src/utils/learnerPrefs.js` holds every
setting, applied to the whole site by `components/settings/PrefsProvider.jsx`:
readable or dyslexia-friendly font, text size up to 150 %, wide letter/line
spacing, high contrast, reduced motion (also for framer-motion), "fewer
distractions" (no background video, butterflies or confetti), bigger buttons
(56 px), the Warrior clock on/relaxed/off, break reminders, and how to answer a
speaking item instead (type it, choose it). Presets are named by what they do:
Calm & quiet, Reading support, Fewer distractions, Captions & pictures, Bigger
buttons, More time. Settings are saved in the browser and, when signed in, in
the learner's profile, and a parent or teacher can set them in the learning
plan. Using a setting never lowers a level.

What is checked: keyboard use of every new control, visible focus, aria-live
for results and saves, text contrast of at least 4.5:1, no sideways scrolling
from 360 px phones to 1920 px screens, 200 % zoom and 150 % text size on the
dashboards. **Not yet done:** testing with real screen readers (VoiceOver,
NVDA, TalkBack) and with learners, and a formal WCAG 2.2 AA audit.

## Privacy and safety

* No raw voice recordings are stored. Speaking items use the browser's speech
  recognition; the AI Teacher's own recogniser keeps audio in memory for the
  request only (it keeps derived features of the last 24 requests in memory,
  never on disk).
* The learner profile stores only what the engine needs (no raw answers, no
  typed or spoken words, no response times, no diagnosis), is included in the
  data export, erased with the learner, and can be reset by the learner.
* Only a verified guardian of the child, or a teacher who has the student in
  scope, can read or change a learning plan; every change is audit-logged with
  a role and a short display name, never an email.
* The AI Teacher receives a first name, levels, skill names and strategies
  only.
* The question bank can be re-seeded or wiped only by the platform owner
  (these routes had no authentication before this change).

Note for the team: Chrome's speech recognition sends audio to Google to
transcribe it. If that is not acceptable for a school, the AI Teacher's own
recogniser (`POST /api/ai-assistant/asr`, English) could be used for the
English speaking items instead; that is not wired up yet.

## Testing

| Suite | Command |
|---|---|
| Server (unit + integration, in-memory MongoDB) | `cd server && npm test` |
| AI Teacher | `npm --prefix server/ai-assistant test` |
| Client pure helpers (speakMath, support strategies, narrator, evidence model) | `node --test client/src/utils/speakMath.test.mjs client/src/components/QuestionCard/support.test.mjs client/src/utils/narrator.test.mjs client/src/components/learning/evidence/model.test.mjs` |
| Question bank QA gate | `node server/scripts/content/audit.js --check` |
| Lint / build | `cd client && npx eslint . && npm run build` |

The question bank tests run **every** question (in every language) through the
checker: the right answer, built exactly as the widget submits it, must be
correct and every wrong option must not be. Browser end-to-end checks (muted
headless Chrome against the in-memory demo server, `server/test/integration/dev-server.js`)
played a full round of every subject × mode, plus slow connection, reload
mid-round, empty question pool, an adult learner with comfort settings, a
denied microphone and no voice at all.

Results on 2026-11-20:

* **Rounds:** all 12 subject × mode rounds passed, 120 questions in all.
  * Every right answer was accepted, and every wrong one was refused and followed by "Try again".
  * All 120 answers were logged with the new fields, and there were no page errors.
  * Open speaking items were logged and not counted, as intended.
* **Edge cases:** all 12 checks passed.
* **Bugs these runs found, both fixed:**
  * After a wrong spelling, "Try again" left the letter tiles used up.
  * On a slow connection, a second, slower round request could replace the round in the middle of a question. Now only the newest request counts, and the round is fetched again only when its language really changes.

## Not done yet (honest list)

From the adaptive-journey round:

* **Templated narration needs review.** The narration in the 13 languages other than English is built from a phrase bank and marked `templated`. No native speaker has reviewed it, and the same goes for the 568 new interface strings and the everyday items' translations.
* **The thresholds are untested hypotheses.** The target band (75-90%), the probe rules, the chance discount and the badge thresholds are documented as hypotheses (see RESEARCH.md). They need a pilot with real learners and consent.
* **Stage 5 has no graded items.** All 30 transfer items are practice-only.
* **A language change on the first question gets a new round.** Switching language before the first answer fetches a new round, because only an answered round can be resumed.
* **The maintenance banner covers the navbar.** The status banner (shown only when staff post a notice) covers the navbar and pushes fixed-height pages down. It can be closed, and it predates this work.
* **Not checked with real people or devices.** Nothing here has been tested with real screen readers, real phones and voices, or real learners.

* Content ceilings: science stops at level 4-5 (science speaking has no graded
  items above level 3), maths speaking at level 5; there is no content at levels
  6-8 except 27 maths items, and no multiplication skill yet. Adult-specific
  content is limited: most of the bank was written for ages 5-10; items themed
  for young children are tagged `young` and avoided for teens and adults where
  possible.
* Written explanations and captions are marked by keyword rubrics in English
  only; in other languages they are practice (not counted).
* The AI Teacher's lesson router does not yet change a lesson by the learner's
  preferred explanation style (the greeting and lesson choice do); what it
  needs is described in `server/ai-assistant/public/companion.js`.
* The teacher's class view of skills many students find hard needs a group
  endpoint.
* Not tested with real screen readers, real microphones on phones, or real
  learners; the thresholds in `server/config/learning.js` are a starting policy
  to validate with real use.
