# Learnigo learning companion: how it fits together

"One AI Teacher. A different learning journey for everyone." This folder
describes the system that makes that true, and how to keep it working.

| Document | What it covers |
|---|---|
| [AUDIT.md](AUDIT.md) | What was wrong with the question bank, what was repaired, replaced or excluded, and the verified inventory |
| [QUESTION-BANK.md](QUESTION-BANK.md) | How to maintain and extend the bank: fields, validation methods, the QA gate, adding a subject or question type, the database migration |
| [ADAPTIVE.md](ADAPTIVE.md) | The adaptive engine: levels 0-8, mastery, the level policy, spaced repetition, teaching escalation, rounds, guardians and educators, privacy, tuning |
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

## Database migration plan

1. Back up the production database (the usual backup), then run the migration in
   dry-run mode: `cd server && node scripts/migrations/2026-11-20-content-v3.js`.
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
| Client pure helpers (speakMath, support strategies) | `node --test client/src/utils/speakMath.test.mjs client/src/components/QuestionCard/support.test.mjs` |
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
