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
moves it most). A right answer never lowers it. Skill states: `new`, `learning`,
`mastered`, `review_due`.

**Guessing counts for less** (`chanceDiscount`, a hypothesis): a right answer on a
single-choice item with only 2 options (true/false, a 2-option tap or blank) moves
mastery with 0.6 of the usual step, with 3 options 0.8 (4 or more, typed, spoken,
ordering, multi-select: 1). It scales the *step*, never the target, so such items
still count and a skill made only of them can still be mastered; it just takes
more right answers (about 9 instead of 5 for true/false). Levels are not
discounted (the level window keeps plain credit).

**Mastered needs evidence** (`masteredAt`, `masteredMinBox`, `masteryEvidence`): mastery
≥ 0.85, recalled on two separate days (Leitner box ≥ 2), **and** right answers on at
least 2 different questions, one of them at stage ≥ 2 when the skill has questions at
stage ≥ 2 (`stageAvail`, recorded with each answer). The skill row keeps the last few
question ids answered right (`rightItems`), the highest stage answered right
(`topStage`) and counts per stage (`byStage`: attempts, right, right alone). Never
speed: time is not an input anywhere. Rows from before this rule (no `rightItems`) keep
the earlier rule while they are mastered (`legacyEvidence`), until their next miss, so
nobody loses a mastered skill because the rule changed.

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

## Stages 0-5 (per question)

A stage is the kind of thinking a question asks for, separate from the level (how far
into a subject): 0 everyday curiosity, 1 recognition, 2 understanding, 3 application,
4 reasoning, 5 transfer (`STAGES`). The engine uses the item's own `stage`; when an item
has none (teacher uploads, older content) it derives it the same way the content scripts
do: `everyday: true` → 0, else `cognition.bloom` remember 1, understand 2, apply 3,
analyze/evaluate 4, create 4 (`stageOfBloom`; 5 only by a reviewed override). No Bloom
tag → no stage (null): such items never count as "beyond recognition". Only **graded**
items count for stages (what a skill has at stage ≥ 2, the mini challenge, the journey map,
probes); practice-only items (e.g. the stage-5 transfer items) are still served but never
make the evidence rule or a challenge depend on them.

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
* Each item carries `stage`, `support: { step, strategy, skill, for? }` and `why`
  (`review | practice | new | probe | stretch | prerequisite`, and `challenge` /
  `discovery` in those modes).
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

## Adaptive journey

Everything in this section is configured in the "Adaptive journey" block of
`server/config/learning.js`. **Every number there is a starting hypothesis to validate
with real learners** (see [RESEARCH.md](RESEARCH.md)), not a proven value. The pure rules
are in `services/learning/{probe,band,roundState,decisions,achievements,journey,evidence,explain}.js`
and each has unit tests in `server/test/learning-journey.test.js`.

### Diagnostic probe per skill (`probe`)

The first contact with a skill is up to `probe.items` (2) probe items (`why: "probe"`):
the most accessible one first (lowest stage at the served level), then one at stage ≥ 2
when the skill has one, so a confident start can show. A skill with one probe answered
gets one more in the next round (stage ≥ 2) and is not practised meanwhile.

| result | when | what changes |
|---|---|---|
| `confident` | right first try, no hint, at stage ≥ `confidentStage` (2) | mastery at least `confidentMastery` (0.6), Leitner box 1 (back tomorrow as a review), support step 0; no beginner practice until it is due; its higher stages first |
| `gentle` | no right answer in the probe | support step ≥ `gentleStep` (1: pictures + worked example up front); its lowest stages first |
| `steady` | anything else | normal practice |

Every concluded probe is a `probe` decision (`n`, `right`, `stage`). Skill rows from
before probes existed are never probed.

### Target success band (`targetBand`)

The share of **right** answers (first try or with help; a close answer is not yet right)
over the last `window` (20) graded answers in a subject. Below `low` (0.75) the next round
tilts **easier**, above `high` (0.90) **harder**, inside it **holds**; no tilt before
`minAttempts` (8). A new level (by the engine, the learner, a grown-up or placement)
starts the count afresh. Once tilted it turns back to hold only `hysteresis` (0.05) inside
the band, so one answer does not flip it back and forth. A change of tilt is a
`band_tilt` decision (`acc`, `n`, `low`, `high`). The round shows it as
`target: { low, high, recent, n, tilt }`.

| tilt | round |
|---|---|
| easier | one warm-up item from the level below, no stretch, fewer new skills (as gentle pace), lower stages preferred |
| harder | one stretch item from the next level also at status `practice` (not when held or in support; +1 when advancing), more new skills (as brisk pace), higher stages preferred |
| hold | as before |

### Repeated misconceptions (`misconceptionRepeat`)

When the same misconception (the item's own `distractor_insight` text, checked
server-side) comes up `misconceptionRepeat` (2) times on a skill since it was last
explained, the log-answer reply carries `learn.explain` and the skill remembers it
(`explain`): the next round's first item of that skill gets
`support.strategy: "misconception"` and `support.explain`. The explanation is taken from
the question the misconception last came from, never invented: its `worked_example`
(translated with `applyQuestionTranslation` when the item has that language; English
items never), else `analysis.teacher_action_if_missed`, else the misconception text:
`{ text, skill, skillName, source: worked_example | teacher_action | insight, lang, lead: { key: learn.explain.lead_skill, params, text } }`.
The next answer on that skill clears it. Logged as `misconception_explained` (the count
only, never the text). A misconception counts as resolved (`resolvedAt`) after two right
answers in a row since its last occurrence.

### Continuity: resume a round

Every round has a `roundId`. The profile keeps, per subject+module, the last round handed
out and the unfinished one (question ids only, `rounds`). `POST /api/dashboard/log-answer`
with `roundId` (and `position`, the item's index) turns the handed-out round into the
unfinished one (replacing an older one) and the reply carries
`learn.round: { roundId, position, answered, total, done }`; the last answer removes it.
Unfinished rounds expire `resumeHours` (72) after their last answer.

* `GET /api/learn/round?subject=&module=&resume=1` → the unfinished round, same items in the
  same order (translated for the `lang` asked for now, support recomputed), with
  `{ resume: true, position (the first item still to answer), answered: [ids] }`; else
  `{ resume: false }` and a fresh round.
* `DELETE /api/learn/round/resume?subject=&module=` → `{ dropped }` ("Start fresh").

### Modes

* `mode=challenge` (optionally `&skill=`): 3 items (`challenge.items`) one stage above the
  highest stage answered right on a strong skill (mastery ≥ `challenge.minMastery` 0.8,
  mastered, or a confident probe), at most one level up; `challenge: { skill, stage }` or
  `null` with no items when there is no strong skill. A miss in a challenge never counts
  against anything (`notCounted: "challenge"`); a right answer counts as usual.
* `mode=discovery`: everyday-curiosity items of that subject and module (`why: "discovery"`).
* `source=next|welcome|journey|explore|challenge|discovery` (optional): the learner chose
  this round from there; its first answer counts once in the evidence `activity.chosen`.

### Journey endpoints (learner token; built only from stored history)

* `GET /api/learn/welcome?lang=[&calm=1]` → `{ kind, message: { key, params, text }, actions, calm }`.
  Kinds, first match wins: `first` (no answers ever), `unfinished` (a resumable round),
  `break` (≥ `welcome.breakDays` 14 days away; the number of days is in `params.days` but
  never said), `struggle` (the last skill practised, within `recentDays` 7, has ≥
  `struggleMisses` 2 misses in a row), `success` (a skill really mastered in the last 7
  days), `returning`. Keys `learn.welcome.<kind>.<a|b|calm|anon>` (a/b rotate by day;
  `calm` when the learner's comfort settings ask for reduced motion, as the calm and focus
  presets do, or `?calm=1`; `anon` when no name is known). Params only from stored
  history: `name` (first name), `skill`, `skillName`, `subject`, `subjectName`, `module`,
  `moduleName`, `days`. Never guilt, streak talk or invented wins. Actions (at most 3):
  `{ type: continue|review|new|start, key: learn.welcome.action.<type>, text, href, subject, module, skill?, source: "welcome" }`.
* `GET /api/learn/next?lang=` → `{ items: [{ kind, title, why, action: { href, subject, module, skill?, mode?, source: "next" } }] }`,
  at most `next.max` (6), in this order when they apply: `continue` (the unfinished round),
  `review` (the most overdue review), `support` (an unmastered catalogue prerequisite of the
  trickiest skill, else that skill a new way), `next` (the next concept after a mastered
  one, with content), `challenge`, `discovery` (today's, if not answered yet), `explore` (a
  subject, else a module, never tried). Keys `learn.next.<key>.title|why`.
* `GET /api/learn/discovery?lang=` → `{ item, date, answered, subject, module, mode: "discovery", message }`:
  one everyday item (graded, `everyday: true`), the same all day for a learner (a hash of
  learner + local date, `x-timezone`), never one answered in the `discovery.avoidDays` (7)
  days before today, microphone items only when nothing else is left; `item: null` when the
  learner's content has no everyday items. Answer it with log-answer `mode: "discovery"`.
* `GET /api/learn/journey` → `{ subjects: { english|maths|science: { level, ceiling, stages: [{ stage, name, skills, practiceOnly, attempted, mastered }], reached } } }`
  (the same objects are also at the top level by subject). `skills`: skills with **graded**
  questions at that stage the learner can see; `practiceOnly`: skills with only practice
  (ungraded) questions there (today all stage-5 transfer items: "nothing graded yet"); `attempted`/`mastered`: of the learner's skills, those
  answered / mastered at that stage; `reached`: the highest stage answered right first try
  without a hint.
* `GET /api/learn/decisions?limit=` (1-100, default 20) → `{ decisions: [{ at, type, subject, skill, reason: { key, params, text } }] }`.

### The decision log (`LearningDecision`, collection `learningdecisions`)

`{ email, at, type, subject, skill, from, to, reason, evidence }`, written when the engine
or a person decides something:

| type | when | reason codes (`learn.decision.<code>`) | evidence |
|---|---|---|---|
| `level_up` | the engine moves a level up | `level_up` | `acc`, `n`, `days` |
| `level_suggest` | a level suggestion is created | `level_suggest_up`, `level_suggest_down` | `acc`, `n`, `days` |
| `level_set` | the learner, a guardian, a teacher, the placement or an accepted suggestion sets a level | `set_by_learner`, `set_by_guardian`, `set_by_teacher`, `placement`, `accepted_suggestion` | (`right`, `n` for placement) |
| `support_step` | the teaching approach changes | `support_up`, `support_down`, `support_park` | `step`, `misses` |
| `probe` | a probe concludes | `probe_confident`, `probe_steady`, `probe_gentle` | `n`, `right`, `stage` |
| `band_tilt` | the band's tilt changes | `band_easier`, `band_harder`, `band_hold` | `acc`, `n`, `low`, `high` |
| `misconception_explained` | a repeated misconception gets an explanation | `misconception_explained` | `count` |
| `mastered` | a skill becomes mastered | `mastered` | `items`, `stage`, `box`, `mastery` |

No answers, nothing typed or said, no times: `evidence` holds small numbers only. A TTL
index deletes entries `decisionTtlDays` (180) days after `at`. Rendered in plain words
(English `text`, `key`, `params`; plural forms `<code>_one|_other` by `params.count`) for the
learner (`/api/learn/decisions`) and in the guardian/teacher `evidence.decisions`. In the
data export and erase (`services/dataRights.js`), the support footprint
(`learningdecisions`), and forgotten with "reset personalisation".

### Growth achievements (`achievements`)

Badges for learning, never for time, speed, streaks or rankings, defined in
`services/learning/achievements.js` and awarded from log-answer (the reply's
`learn.achievements: [{ id, icon, key, params, text, desc, evidence }]`), stored once in
`StudentAchievement` with their evidence (numbers only), listed with `category: "growth"` in
`GET /api/dashboard/achievements` (with `evidence` when earned). Keys
`learn.achievement.<id>.name|desc|evidence` (`desc` takes the threshold as `params.count`).

| id | needs |
|---|---|
| `growth_first_discovery` | a first discovery answered |
| `growth_concept_explorer` | `conceptExplorer` (5) different skills tried |
| `growth_comeback` | a right answer after ≥ `comebackMisses` (2) misses in a row on a skill |
| `growth_three_mastered` | `threeMastered` (3) skills mastered (with the evidence rule) |
| `growth_curious` | discoveries on `curious` (5) different days |
| `growth_problem_solver` | `problemSolver` (5) right first try without a hint at stage ≥ 3 |
| `growth_review_champion` | `reviewChampion` (10) due reviews remembered |

`night_owl` and `early_bird` are no longer awarded (learning is not rewarded for the hour
of the day); badges already earned stay visible, and unearned ones are no longer listed.

### Evidence for guardians and teachers

`GET /api/parent/children/:childId/learning` and `GET /api/teacher/students/:id/learning`
(same access rules as before) gain `evidence`, built only from stored counts:

* `baseline[subject]`: `{ level, accuracy, n, at, source }`: the placement result
  (`placement`), else the first `evidence.baselineAttempts` (10) graded answers
  (`first_attempts`: share right, the most common item level), stored once in the profile.
  For learners whose first answers came before baselines were kept it is computed from
  their answer history, and stored with their next answer.
* `current[subject]`: `{ level, accuracy, n }`: the share right over the last 20 graded answers.
* `byStage[0..5]`: `{ attempts, correct, independent }`.
* `stageReached`: `[{ week, subject, stage }]`: the highest stage answered right first try
  without a hint so far, per week (`week` = ISO date of its Monday).
* `independence`: `[{ week, independent, assisted }]` right answers alone / with help.
* `retention`: `{ reviews, correct, rate, byWeek }`: due reviews and how many were remembered.
* `misconceptions`: `{ seen, resolved, items: [{ skill, skillName, subject, count, parentNote, resolvedAt }] }`.
* `activity`: `{ rounds, days, discoveries, explored, chosen }` (counts, never time).
* `insights`: `[{ key: learn.insight.<code>, params, text }]`; every number in a sentence is
  in its `params`; countable ones have `_one|_other` forms by `params.count`.
* `decisions`: the last 20, as above.

No time-on-app as success, no IQ-like score, no comparison with other children. The
shared-link (public) report does not include it. Weekly counts behind it live in the
profile's `journal` (per week and subject: highest stage, right alone/with help, reviews,
discoveries, at most 26 weeks) and `growth` counters.

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
* **Export and erase.** All three collections (`learnerprofiles`, `skillmasteries`,
  `learningdecisions`) are in the learner's data export, in the support footprint, and
  are erased with the learner (`services/dataRights.js`). The decision log also expires
  on its own after 180 days. Unfinished rounds keep question ids only.
* **School learners** see only their teachers' questions; those carry no stage (unless
  they have a Bloom tag) and older uploads often no level or skill (they count as
  `<subject>.general`), and their numeric ids are matched too.
* **Reset.** `DELETE /api/learn/profile` forgets everything the engine learned
  (mastery, levels it or the learner set, strategies, suggestions) and keeps the
  answer history. Levels locked and overrides set by a guardian or teacher stay;
  `?settings=1` also clears pace, age band, supports and the learner's own goals.

## Tuning

Change `server/config/learning.js` and run `cd server && npm test`:
`test/learning-rules.test.js` (every policy rule), `test/learning-round.test.js`
(round mixes, baseline, validation, simulated learners over 30-40 days),
`test/learning-journey.test.js` (stages, probes, band, chance discount, mastery evidence,
misconceptions, decisions, resume, welcome, next, journey, discovery, badges, evidence),
`test/integration/learning.test.js` and `test/integration/learning-journey.test.js` (the
HTTP API). The simulations are the quickest way to see the effect of a threshold change on
how fast learners move. The demo server (`test/integration/dev-server.js`) plays about three
weeks of practice through the real engine for `sam.solo@demo.test` (also a child of the demo
parent) and a week for Aanya, so the journey screens have realistic data.

What each journey number is, and why it is only a starting point:

| setting | value | what it is | to validate |
|---|---|---|---|
| `targetBand` low/high | 0.75 / 0.90 | the share right a learner should mostly see | success rates vs. persistence and later retention |
| `targetBand.window` / `minAttempts` / `hysteresis` | 20 / 8 / 0.05 | how much evidence moves the tilt | how often tilts flip; whether 8 answers is enough |
| `probe.items` / `confidentStage` / `confidentMastery` | 2 / 2 / 0.6 | the first contact with a skill | do confident starters later need the beginner items? |
| `chanceDiscount` 2 / 3 options | 0.6 / 0.8 | how much a likely guess counts | mastery vs. delayed recall on few-choice items |
| `masteryEvidence` minItems / minStage | 2 / 2 | what "mastered" needs besides the average | false "mastered" rates on later reviews |
| `misconceptionRepeat` | 2 | when an explanation is due | whether explanations reduce repeats |
| `resumeHours` | 72 | how long an unfinished round waits | resume use vs. stale rounds |
| `decisionTtlDays` | 180 | how long the decision log is kept | what grown-ups need to look back on |
| `welcome.breakDays` / `recentDays` / `struggleMisses` | 14 / 7 / 2 | which welcome message applies | children's and parents' reactions |
| `challenge.items` / `minMastery` | 3 / 0.8 | the mini challenge | uptake and success in challenges |
| `discovery.avoidDays` | 7 | how soon a discovery may repeat | size of the everyday pool |
| `achievements.*` | see above | badge thresholds | motivation without over-rewarding |
| `evidence.baselineAttempts` | 10 | the baseline when there is no placement | stability of the baseline |
