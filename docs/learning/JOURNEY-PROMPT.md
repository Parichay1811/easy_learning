# Master prompt, adjusted to Learnigo (November 2026)

This is the "science-based, adaptive, personalised learning experience" brief,
rewritten for this codebase. It says what already exists (keep it and build
on it), what is missing (build it), and the project's own rules. The research
behind every decision is in [RESEARCH.md](RESEARCH.md).

## Your role

Act as an educational psychologist, a learning scientist, a child-UX
designer, a full-stack engineer (React 19 + Vite client, Express + Mongoose
server, `node --test`), and a multilingual voice specialist. Work in the
actual repository. Research first, then build, then test. Don't fabricate
research, results or test outcomes. Keep research findings separate from
product hypotheses.

## What Learnigo already has (keep it; don't rebuild it)

- **Levels 0-8 per subject**, independent of age. They're set by placement,
  by the learner, by a guardian or teacher (who can also lock them), or
  raised by the engine. A level is never lowered automatically; a lower
  level is only ever suggested. See `server/services/learning/levelPolicy.js`
  and [ADAPTIVE.md](ADAPTIVE.md).
- **Mastery per skill.** There are 90 skills with prerequisites in
  `server/data/skills.json`. The engine gives credit for answers
  (independent 1, assisted 0.75, close 0.5), schedules Leitner reviews at
  0/1/3/7/14/30 days, and raises a level only after at least 12 attempts on
  at least 2 days with at least 85% accuracy.
- **Support that changes approach.** When a skill keeps going wrong, the
  engine moves through words, then pictures, then step by step, then an
  easier prerequisite item, then a pause until the next day. What helped is
  remembered in `explanationPrefs`.
- **Rounds** that mix review, practice, prerequisite, stretch and new items
  across skills (interleaved), with an optional placement check-in.
- **What never counts against a learner:** time, uncertain speech,
  accommodations, and open practice items.
- **One checker for answers** on server and client, parity-tested over all
  1,922 questions in 14 languages. The QA gate is
  `server/scripts/content/audit.js --check`.
- **Truthful, varied feedback** (`learn.feedback.*`). Praise is about
  process, never intelligence labels.
- **One teacher voice everywhere** (`client/src/utils/narrator.js`). Maths
  is read as words in 14 languages, with speed, pause, replay and captions,
  and it never speaks in the wrong language. There are comfort settings for
  font, size, contrast, motion, focus, timer and answering mode.
- **Learning plans for parents and teachers**, with every change
  audit-logged. The AI Teacher's personal greeting comes from
  `/api/learn/companion`.
- **Privacy:** no raw voice is stored, data can be exported and erased, and
  there is no diagnosis field and no advertising profile.

## What to build now (the gaps)

1. **Research rationale.** Write `docs/learning/RESEARCH.md`. For each
   principle, give the source, the behaviour in Learnigo, the expected
   benefit, how to measure it, and the limits of the evidence. Every
   threshold (for example 85% to advance, or a 75-90% target band) is
   marked as a product hypothesis to validate.
2. **Stages 0-5 per question**, separate from level 0-8 (a level is how far
   into a subject; a stage is the kind of thinking asked for):
   - 0: everyday curiosity
   - 1: recognition
   - 2: understanding
   - 3: application
   - 4: reasoning
   - 5: transfer

   Derive stages from each item's existing Bloom tag and interaction, with
   reviewed overrides. Add an **everyday-curiosity pool** of relatable items
   ("Why do we use an umbrella when it rains?") with full translations.
   Stages adapt per skill, never per child as a whole.
3. **Diagnostics per skill.** The first contact with a new skill is a
   couple of accessible probe items. A confident start (right first time,
   no hints, past the recognition stage) skips beginner repetition.
4. **A target success band** (default 75-90%, configurable, a hypothesis).
   Recent success on graded items tilts the next round easier or harder.
5. **Mastery that needs real evidence.** Right answers on items with few
   choices (true/false) count for less. A skill is only mastered with right
   answers on at least 2 different items, including one beyond recognition
   where such items exist, plus a delayed recall (Leitner box 2 or higher).
6. **Targeted help for repeated misconceptions.** When the same
   misconception happens twice, the next item comes with a short
   explanation of that idea, taken from the item's own analysis, rather
   than a near-identical question.
7. **A decision log.** Every level change, suggestion, support step, probe
   result and band tilt is stored with a reason code and the numbers behind
   it. The log is short-lived (180 days), included in export and erase, and
   shown in plain language to guardians and teachers.
8. **Continuity.** An unfinished round can be resumed after logout, from
   the question where the learner stopped. There's a welcome-back message
   built only from stored history (unfinished, success, struggle, long
   break, first time, or calm style), with Continue, Review and Something
   new options. It never mentions missed days, guilt or invented
   achievements.
9. **"What next?"** A ranked list:
   1. unfinished activity
   2. reviews due
   3. prerequisites needing support
   4. the next concept
   5. a mini challenge (3 items one stage up, on a strong skill)
   6. today's quick discovery (one everyday-curiosity question per day)
   7. something new to explore

   Each item comes with a reason a child can understand. No notifications
   and no false urgency.
10. **Narration scripts.** Each question gets its own spoken script, stored
    in the bank and in the database, written to the child in a
    conversational style. It keeps the same facts, difficulty and options as
    the screen, and never gives the answer away. It never reads aloud the
    word a reading item tests, and never replaces a listening item's audio.
    Styles: curious, story, detective, adventure, calm, challenge. English
    scripts are written per item. Other languages use a natural template
    built from translated parts, marked `templated`, until a person reviews
    them. The narrator speaks the script in the chosen language and shows it
    as captions.
11. **Growth achievements.** These reward learning, not time:
    - First discovery
    - Concept explorer
    - Brilliant comeback
    - Three concepts mastered
    - Curious thinker
    - Problem-solving star
    - Review champion

    Each badge records the evidence behind it. There are no rankings and no
    streak penalties, and no new awards for studying late at night (Night
    Owl and Early Bird); badges already earned stay.
12. **A home screen for children.** A "Today" hub with:
    - a welcome-back card
    - the main recommendation
    - a Continue card
    - a learning-journey map (stages per subject)
    - today's discovery
    - a mini challenge
    - growth badges
13. **Learning evidence for parents** (and the same view for teachers).
    Show the baseline against now for each subject, the stage reached over
    time, success alone versus with help, retention on reviews,
    misconceptions resolved, and weekly insight sentences in which every
    claim cites recorded numbers. No screen time is presented as success,
    and there are no IQ-like scores.
14. **The landing page.** The tagline "Every day begins with curiosity.
    Every question builds confidence. Every step reveals real progress." A
    playable sample journey (stage 0 to 2, with the adaptive step
    explained), the difficulty ladder, a narration demo, a multilingual
    preview, a parent-dashboard example clearly labelled as example data,
    and privacy and safety. No testimonials, since none are authorised.

## Rules specific to this project

- **Keep the existing contracts.** These must keep working: the round API,
  the `log-answer` fields, the `checkAnswer` statuses, `qa.status` gating,
  question ids, the parent and teacher plan APIs, and the AI Teacher
  companion. New fields are only ever added. Content changes go through a
  dry-run, backed-up, reversible migration (`server/scripts/migrations`)
  and are never written to production without the owner's explicit go.
- **Response time** is never used to lower anything (an earlier explicit
  requirement). Speed alone never counts as mastery.
- **Language:** 14 locales (`client/public/locales`). Every new UI string
  goes through i18n, and new skills get names in `skills.*`. Speech is
  always in the selected language, or the text is shown with a note. It is
  never spoken in the wrong language.
- **Data:** keep the minimum. No raw answers or speech in profiles, a TTL on
  logs, export and erase cover everything new, guardian and teacher access
  only through existing scopes, and nothing public.
- **Tests and checks:**
  - unit tests for every rule;
  - integration tests through the in-memory harness;
  - the content QA gate, extended to stages and narration;
  - muted headless-browser end-to-end checks (new learner, confident
    learner, struggling learner, resume after logout, welcome accuracy,
    "next" relevance, narration script versus screen text, language switch
    for text and voice, parent data matching the engine, family
    isolation, phone, tablet and desktop, failures, keyboard and reduced
    motion).

  Report what ran, the real results, and what still needs people (real
  children, screen readers, pilots).
