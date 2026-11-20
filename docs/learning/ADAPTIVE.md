# Adaptive learning engine

How Learnigo decides what a learner practises next, how it notices progress and
difficulty, and what it never does. The code is in `server/services/learning/`
(pure rules, unit-tested) with storage in `server/models/learning/`; every
number below lives in `server/config/learning.js`.

## Levels (per subject, 0-8, not age)

Each learner has one level per subject (`english`, `maths`, `science`). A level
is about the content, never about age: an adult can be at level 1 and a child at
level 5. A new learner starts at `defaultLevel` (1). A level can be set by:

| source | how |
|---|---|
| `default` | nothing known yet |
| `baseline` | the optional placement check-in (below) |
| `self` | the learner picks a level, or accepts a suggestion |
| `guardian` / `teacher` | set (and optionally **locked**) in the learning plan |
| `engine` | an automatic step **up** |

### Level policy

Accuracy at a level = the mean credit of the last `levelWindow` (20) graded
attempts at that level:

| accuracy | status | what happens |
|---|---|---|
| ≥ 0.85 (`thresholds.advance`) | `advancing` | after ≥ 12 graded attempts at the level (`minAttemptsToAdvance`) on ≥ 2 different days (`minDaysToAdvance`), the level goes **up by one**, on a right answer, if there is content above (`ceiling`) |
| 0.60-0.84 | `practice` | stay, practise |
| < 0.60 (`thresholds.practice`) | `support` | stay; easier related items join the rounds; after ≥ 10 attempts over ≥ 2 days a `level_down` **suggestion** |
| < 5 attempts | `new` | no label from a handful of answers |

Which attempts count towards a level: items **at** the level; items **above**
it only when answered right (a stretch miss is expected and never counts
against); items **below** it (warm-ups, prerequisites) and items without a level
never count.

**A level is never lowered automatically.** Sustained difficulty only produces a
suggestion the learner (or a grown-up, via the learning plan) can accept or
decline. A declined suggestion is snoozed for `suggestionSnoozeDays` (7).

Each level also records **who last changed it and when** (`setAt`,
`setBy: { role, name }`, role `learner | guardian | teacher | engine`, the name a
short display name like "Priya R.", never an email) and, when locked,
`lockedBy` (`guardian | teacher`). Locking a level without changing it keeps its
`source` and records who locked it.

**Locked levels never move.** When a guardian or teacher locks a level, or sets
`hold_level`, the engine only suggests (`level_up`), and the learner cannot
change the level, accept a level suggestion or re-place themselves (409
`LEVEL_LOCKED`).

**The content ceiling.** A level never goes above the highest level that has
questions for this learner (`ceiling`, per subject, respecting school
visibility). Rounds serve `min(level, ceiling)`, moved to the nearest level with
content.

## What is never used to lower anything

* **Response time.** Time is not an input anywhere in the engine; it is not even
  stored in the learning profile. Timed games (`mode: "warrior"`) and timed-out
  answers are not counted at all.
* **Uncertain speech** (nothing heard, microphone blocked or unsupported):
  status `uncertain`, never right, never wrong, not stored as an answer.
* **Ungraded items** (open speech, opinions, free writing, `graded: false`,
  `qa.status: "needs_review"`): practice only.
* **Accommodations** (the learner's `supports`: read-aloud, no timer, bigger
  buttons, choosing instead of speaking, …): the engine never reads them for
  mastery or levels. They only shape which items are picked (e.g. no microphone
  items for someone who chose to type, outside the Speak module).
* **Help.** A right answer never lowers a skill's mastery, whatever help was
  used. (Help does count less towards *advancing*: see credit.)

## Mastery per skill

Each question has one skill (`question.skill`, else `skillIds[0]`, else
`slug(academic.skill)`, else `<subject>.<question_type>`; ids without a subject
prefix get one). Only **graded** attempts with status `correct`, `close` or
`incorrect` count. Credit per attempt (`credit`):

| outcome | credit | meaning |
|---|---|---|
| independent | 1.0 | right on the first try with no hint asked for (the scaffold a support strategy shows up front is not a hint) |
| assisted | 0.75 | right with a hint or on a later try |
| close | 0.5 | e.g. one letter off |
| incorrect | 0 | |

Mastery (0-1) is a moving average of the credit (`masteryRate`, independent
moves it most). A right answer never lowers it. A skill is **mastered** at
mastery ≥ 0.85 once it has been recalled on two separate days (Leitner box ≥ 2).
Skill states: `new`, `learning`, `mastered`, `review_due`.

## Spaced repetition (Leitner)

Boxes 0-5 with intervals `[0, 1, 3, 7, 14, 30]` days (`leitnerDays`):

* independent right: up one box, **only when the skill was due** (five right
  answers in one sitting do not jump five boxes);
* assisted right / close: same box, rescheduled from now;
* wrong: back to box 0 (due now);
* parked (escalation step 4): box 1, due tomorrow.

A skill in box ≥ 1 whose date has come is a **review** and gets a place in the
next round.

## Teaching escalation (per skill)

When something does not work the approach changes instead of repeating
(`supportStep`, `strategies`):

| step | strategy | what the client shows |
|---|---|---|
| 0 | `words` | words/numbers, hint 1 on request |
| 1 | `visual` | pictures/objects: visual + worked example up front |
| 2 | `guided` | step by step: all hints in order, read aloud |
| 3 | `simpler` | an easier related item first (a prerequisite from `skills.json`, else the same skill at an easier level, else the nearest easier level), then the skill again, guided |
| 4 | `reassess` | park the skill; it comes back as a review tomorrow |

Each miss moves one step up (`missesPerStep`); a near miss (`close`) changes
nothing. An independent right answer steps down one. After a park, a right
answer starts the ladder again (independent → step 0, with help → step 2); a
miss parks it again and adds a `review` suggestion ("look at it together").
The strategy that came right before a success **after a struggle** is counted in
`explanationPrefs` (and `helpedBy` on the skill), and the AI Teacher companion
summary reports the learner's preferred strategy.

## Rounds (`GET /api/learn/round`)

About 10 items (3-20), composed in this priority order, scaled by pace
(`round.mix`):

| slot | gentle | steady | brisk |
|---|---|---|---|
| prerequisite (only when something needs support) | 2 | 2 | 1 |
| review (due, most overdue first) | 3 | 2 | 2 |
| practice (focus skills, then weakest) | 4 (2 per weak skill) | 3 | 2 |
| stretch (next level; only when `advancing` and not held) | 1 | 1 | 2 |
| new (one per new skill first) | ~n/4 | ~n/3 | ~n/2 |

then filled from the level (gentle: practised skills before new ones), then from
unseen easier items, and only as a last resort with items seen lately.

* Parked skills rest until due; skipped skills (`skip_skill`) never appear;
  focus skills (`focus_skill`) get up to two extra practice places.
* Items answered in the last `round.recentHours` (12 h) are not repeated while
  others exist, except as reviews.
* Teens and adults (`ageBand`): items with `age_band: "young"` come last, so they
  only appear when there are not enough others.
* Order: a review first (a familiar start), each easier item right before the
  skill it prepares, the stretch item about two thirds in, never first or last.
* Each item carries `support: { step, strategy, skill, for? }` and `why`
  (`review | practice | new | stretch | prerequisite`).
* Questions come from the database exactly as `GET /api/<module>/<subject>`
  serves them (school learners see only their teachers' uploads; everyone else
  Learnigo's questions), never `qa.status: "excluded"` or archived, translated
  with `applyQuestionTranslation` (`?lang=`).
* Deterministic for a `seed` (tests, reloads); random otherwise.

**"Practise now" (`?skill=<id>`).** The round centres on that skill: first an
easier related item (as at step 3) when the skill needs support (support step ≥ 3,
or mastery below 0.60 after ≥ 3 attempts, or the level is in support), then the
skill's unseen items at the served level and easier ones, nearest first (the
nearest level above only when the skill has nothing at or below the level); the
normal mix tops up the rest. An unknown or skipped skill gives the normal round
(`focus: null`); a malformed id is a 400.

## Baseline placement (optional)

`GET /api/learn/baseline` gives one graded item per level 0..ceiling (verified
when any are; no microphone items outside Speak), easiest first. `POST` with the
results places the learner at the **highest level answered right before the
second miss** (close/uncertain/ungraded are neither). Levels are read from the
questions, not from the request. The learner can always pick a level instead.

## Feedback messages

Every logged answer returns one message `{ key, params, text }`
(`learn.feedback.<key>`; English texts in `services/learning/feedback.js`).
Messages are chosen from varied sets, never the same key twice in a row for a
learner, and only when true: "You remembered X from yesterday" needs a real miss
on that skill 20-48 h earlier (`rememberMinHours`); "Looking at it with pictures
worked" needs a success right after misses with that strategy. Praise is about
process (practice, persistence, strategy), never labels. Suggestions use
`learn.suggestion.<key>`.

## Guardians and educators

`GET/PUT /api/parent/children/:childId/learning` (a **verified** guardian link
only: `utils/guardianLink.childAccess`) and
`GET/PUT /api/teacher/students/:studentEmail/learning` (an active teacher of one
of the student's groups: `utils/scopes.forTeacherAll`; the student's id also
works). They see the profile, skills, needs-practice, difficulties and a weekly
history. Each difficulty has the misconception text (technical, from the
question's `distractor_insight`, for teachers) plus `parentNote` and
`teacherAction` in plain language, taken from `analysis.parent_note` and
`analysis.teacher_action_if_missed` of the question behind its most recent
occurrence. The learner's own profile has the same weekly `history`. Grown-ups may set levels (and lock them), pace, age band, supports,
goals and overrides (`hold_level`, `skip_skill`, `focus_skill`). Each role keeps
its own overrides. Every change is audit-logged (`learning.update`). Input is
validated strictly (levels are integers 0-8; supports only the known keys of
`client/src/utils/learnerPrefs.js` PREF_FIELDS, mirrored in `config/learning.js`
and checked by a test).

## Privacy and data use

* **Minimal data.** The profile keeps levels, the last 20 credits per level
  (0-1 and a date), settings, goals, suggestion texts, question ids answered in
  the last day or so, weekly counts. Skill rows keep mastery, counts, box, due
  date, support step and at most 3 misconception texts **taken from the question
  itself** (`distractor_insight`, checked server-side) with the id of the question
  they last came from. No raw answers, nothing
  the learner typed or said, no times, no device data.
* **No diagnosis.** There is no disability or diagnosis field anywhere;
  `supports` are comfort preferences, named by what they do.
* **The AI Teacher** (`GET /api/learn/companion`) gets first name, levels, skill
  ids/names, strategies and recent wins: no goals, no answers, no email, no
  misconception texts.
* **Export and erase.** Both collections (`learnerprofiles`, `skillmasteries`)
  are in the learner's data export and are erased with the learner
  (`services/dataRights.js`).
* **Reset.** `DELETE /api/learn/profile` forgets everything the engine learned
  (mastery, levels it or the learner set, strategies, suggestions) and keeps the
  answer history. Levels locked and overrides set by a guardian or teacher stay;
  `?settings=1` also clears pace, age band, supports and the learner's own goals.

## Tuning

Change `server/config/learning.js` and run `cd server && npm test`:
`test/learning-rules.test.js` (every policy rule), `test/learning-round.test.js`
(round mixes, baseline, validation, simulated learners over 30-40 days) and
`test/integration/learning.test.js` (the HTTP API). The simulations are the
quickest way to see the effect of a threshold change on how fast learners move.
