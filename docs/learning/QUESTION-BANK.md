# Question bank: maintaining and extending it (content v4)

The bank lives in `server/data/` as 12 JSON files, one per subject × mode
(`english|math|science` × `listen|read|write|speak`), plus `skills.json`. The server seeds
these files into MongoDB. Never hand-edit the generated fields (listed below). Change the
sources and regenerate the files.

```
server/scripts/content/
  derive-metadata.js   builds the 12 files + skills.json (re-runnable, keeps the original formatting)
  patches.js           hand repairs to existing questions, each with a category and a reason;
                       stageOverrides: reviewed stage overrides, each with a reason
  stages.js            stage 0-5 per question (Bloom tag + interaction + overrides); run it for a report
  narration.js         narration scripts: merges authored English, builds templated translations
  lib/narration-rules.js  the narration rules (shared by narration.js, audit.js and the tests)
  narration/authored/  the authored English scripts, one file per bank (merged from the writers)
  translation-fixes.js text that was left in English inside a translation
  rules.js             per question type: skill, age band, graded, validation (+ keyword lists)
  skills-source.js     the skills catalogue (the source of skills.json)
  new-items/           level-0 foundation items, the maths 6-8 stretch set, the everyday pool
                       (everyday-source.js English + narration, everyday-translations.json 13 languages)
  audit.js             the audit and QA gate
  sync-checker.js      copies the answer checker's shared core to the client
  lib/bankio.js        load/save that preserves each file's JSON formatting
server/scripts/migrations/2026-11-20-content-v3.js   pushes v3 into an existing database
server/scripts/migrations/2026-11-21-content-v4.js   pushes v4 (stage, everyday, narration, the everyday pool)
server/data/narration-phrases.json                   the phrase bank for templated narration (14 languages)
```

## Everyday workflow

```bash
cd server
node scripts/content/derive-metadata.js        # regenerate data files + skills.json
node scripts/content/audit.js --check          # QA gate: exit 1 if a served item fails a blocking check
node scripts/content/sync-checker.js           # after editing utils/scoreAnswer.js
node scripts/content/stages.js                 # served items by stage per subject × mode
node scripts/content/narration.js --report     # rebuild + narration coverage per language
npm test                                       # includes answer-check, parity, content-*, narration tests
```

`derive-metadata.js --dry` reports what would change and writes nothing. A clean tree prints
`Would change: nothing`, and `test/content-bank.test.js` asserts this. Other useful commands:
`audit.js --id MA-WR-T02-Q01` (every finding for one question), `audit.js --verbose`, and
`audit.js --json report.json`.

**Ids are permanent.** Learners' answer history refers to question ids. Never renumber or
reuse an id. To take a question out, exclude it.

## Fields per question (v3 + v4)

| field | how it is set |
|---|---|
| `level` 0-8 | from the item. Repairs in `patches.js` can relabel it; `level_name` follows automatically |
| `skill` | `rules.js` (`SKILL` by question type, or a function such as `arithmetic()`); new items set `skill` in their spec |
| `age_band` | `"young"` for types in `YOUNG_TYPES` and for every `joy_flavor: "silly"` item; otherwise `"all"` |
| `graded` | `true` unless a patch or rule sets `false` (practice only) |
| `validation` | `rules.js` `deriveValidation()`; new items may give their own |
| `qa` | computed from the audit: `verified` if every blocking check passes; `excluded` if a patch excludes it. v4: `version: 4`, `reviewed: "2026-11-21"` |
| `stage` 0-5 | `stages.js`: the kind of thinking asked for (see Stages). v4 |
| `everyday` | `true` for the everyday-curiosity pool (`*-E00-*`), `false` for everything else. v4 |
| `narration` | `{ text, style, v: 1, status }` in English; `translations.<lang>.narration` in every translated language (see Narration). v4 |

**Levels are learning levels, not ages.** 0 is the starter step, with one clear idea and no
reading load beyond a short sentence. 1-5 are the original bands, relabelled where they were
clearly off. 6-8 exist for maths only: negative numbers and fractions/decimals/percentages
(6), ratio and simple equations (7), powers and roots (8).

**Age band.** `"all"` means plain, respectful and fine for a 6-year-old or an adult beginner.
`"young"` means themed for young children: silly or cartoon scenes, "tell a grown-up", kind
and unkind playground scenarios. The engine can prefer `"all"` items for teens and adults.

## Validation methods (what the checker does)

The checker is `checkAnswer(question, answer)` in `server/utils/scoreAnswer.js`. The client
copy is `client/src/utils/scoreAnswer.js`, and its shared core is byte-identical to the
server's. It returns `{ status, correct, score, reason?, misconception? }`:

| status | meaning | counts for mastery? |
|---|---|---|
| `correct` | right (synonyms, number words, articles, an echo of the question, typos where spelling is not the point) | yes |
| `close` | nearly: a one-letter slip where **spelling is tested**, a missing unit, the right number in the wrong form | no (score 0.5 is a hint only) |
| `incorrect` | wrong; `misconception` carries `distractor_insight` for the picked option | yes (as wrong) |
| `uncertain` | speech not heard or not available (`unsupported`, `mic_blocked`, `no_speech`) | never |
| `ungraded` | practice item (`graded:false`), or no reliable check in this language | never (`correct:true` so no one is told they are wrong) |

Methods and their options:

| method | used for | options |
|---|---|---|
| `choice` | tap_mcq, true_false, drag_to_blank | compared with `accepted_answers` ∪ `correct_answer`, ignoring case, whitespace, quote styles, emoji variation selectors and trailing punctuation |
| `set` | multi_select | order-free; partial `score` |
| `sequence` | drag_order, tap_sequence, letter_bank word tiles | exact order |
| `pairs`, `bins` | match_pairs, sort_bins | values, never positions |
| `text` | typed words | `spelling_strict` (one slip in a word of 4+ letters is `close`; otherwise it is accepted), `strip_articles`, `allow_echo` ("the sun is hot" for "sun"), `case_sensitive` + `punctuation_strict` (capitals/full-stop items), `tiles` (letter_bank built from letters), `equation: true` (number sentences: any order of the same terms; sides may swap) or `"any_true"` (equation tiles: any true equation) |
| `number` | typed numbers | `number_words` (default true; `false` = "type it as digits"), `unit_required`, `units`, `equivalent_forms` (`true` = any equal value such as 1/2 = 0.5 = 50%; `"fraction"` = equal fractions only), `final_answer` (the last number in "show your working") |
| `speech_keywords` | mic_record | `keywords`: list of groups, each a list of alternatives; `min` groups must match. Also `numbers` (+`number_final`, `ordered`, `min_numbers`), `compare` ({more, less}: "seven is bigger" or "three is smaller"), `time` ("4:30" accepts half past four, four thirty, 4:30), `not_prompt` (rhymes: saying the prompt word never counts), `graded_langs`/`ungraded_langs` |
| `speech_open` | open speech | any non-empty transcript is `ungraded` |
| `rubric` | written explanations, captions | `keywords` groups + `min`, `negation_fix` ("fish do not live on the moon" is a fair fix), `forbidden`; exact model answers count too. With no keywords in the learner's language the result is `ungraded` |

Numbers are read as digits or words in English and all 13 translation languages (0-100,
compounds such as einundzwanzig, quatre-vingt-dix-sept, dua puluh satu, 二十一, 이십일),
plus decimal commas, fractions and percentages, "minus five" / "menos cinco" / "负五",
English fraction words ("three quarters"), and the units cm, m, km, mm, l, ml, kg, g,
p, £, €, $, min, h, s and °C. In speech, "to/too" (2), "for" (4), "ate" (8) and "won" (1)
count as numbers in short answers. Keyword matching tolerates one slip per 4-6 letters and two
per 7+ (never in numbers). It handles English plurals and verb endings, accents, Korean
particles, Indonesian prefixes and Japanese/Chinese text without spaces.

**Translated questions.** The checker works on the question after
`applyQuestionTranslation` (lang set). English `validation.keywords` do not apply in another
language. The checker uses the translation's `speech_scoring.expected_keywords`, or a
`translations[lang].validation` block if one exists (it is merged and gets `keywords_lang`).
Number, comparison and time checks are language-neutral. Where the audit shows that a
translated item's sample answer cannot be checked reliably, `derive-metadata.js` adds that
language to `validation.ungraded_langs`. The item is then practice only in that language,
never marked wrong. AUDIT.md lists these items.

**Practice only (`graded:false`).** Use it when no automatic check is fair: opinions, open
writing, explanations given aloud, estimates, imitation sounds, letter sounds, syllables or
spelled-out letters (browser speech recognition cannot transcribe these reliably), and
"anything works" gap fills. Practice items still show, and still give feedback.

## The QA gate (audit.js)

The gate blocks a release when any check below fails for a served question.

| check | blocking | what it does |
|---|---|---|
| schema | yes | id pattern, interaction, instruction, level 0-8, v3 fields, skill exists |
| unique_id | yes | no duplicate ids across files |
| options | yes | the answer is among the options; sequences are permutations; letter tiles spell the answer with none left over; match_pairs options are the right-hand items; bins don't overlap; legacy `letter_tiles` / `word_tiles` / `number_tiles` can build the answer too (v4) |
| answer_key | yes | maths keys recomputed where the prompt or audio parses (expressions, missing numbers, operators, comparisons, counts, number words, patterns, "comes after/before", spoken sums); stated equations are true |
| round_trip | yes | builds **exactly what the widget would submit** for the right answer (and wrong options/distractors, wrong numbers, reversed comparisons, and (v4) just saying the card word on a speaking item whose card is not the answer, e.g. the word to rhyme with) and runs the checker: right must be `correct` (or `ungraded` for practice), wrong must not be correct; failed speech must be `uncertain` |
| translations | yes | all 13 languages present; same number of options; the answer is the same option as in English; numbers equal; spoken text present; the whole round trip again in every language |
| audio | yes | Listen items (and "Listen…" instructions) have `audio_text` |
| speech | yes | graded speech items have something to check and a sample answer |
| qa | yes | `needs_review` implies `graded:false`; exclusions have a reason |
| stage | yes | `stage` is an integer 0..5 and `everyday` a boolean; everyday items are stage 0, level 0-1 and graded; stage 0 only for everyday items (v4) |
| narration | yes | every served item has a narration in English and in every translated language, and each obeys every narration rule; same style in every language (v4) |
| badge | yes | on a listening item the picture badge never shows the answer: an emoji answer, or a word answer the bank pairs with that emoji ("🧼 soap") (v4) |
| duplicate_content, mode, level, untranslated, word_problem | warning | same content twice; the picture badge or the prompt gives the answer away; level heuristics; English left in a translation; a word problem whose key matches no one-step reading |

Some things cannot be automated: an option that is defensibly right, a picture that can be
named two ways, a science statement that is subtly wrong. A person (or a reviewing agent)
reads every new item, records any repair in `patches.js` with a category and reason, and
lists it in AUDIT.md.

## Stages (content v4)

A **level** (0-8) is how far into a subject an item is. A **stage** (0-5) is the kind of
thinking it asks for. Stages adapt per skill, never per child as a whole.

| stage | name | typical items |
|---|---|---|
| 0 | everyday curiosity | the everyday pool only (`everyday: true`): "It is raining outside. What do you take with you to stay dry?" |
| 1 | recognition | hear/see and pick the same word or number, name a picture, recall a fact |
| 2 | understanding | understand a sentence, true/false facts, comparing two named things |
| 3 | application | spell, calculate, apply a rule (rhyme, symbols, sorting into named groups) |
| 4 | reasoning | odd one out, patterns, inference, two-step problems, explaining why |
| 5 | transfer | use the idea in a new situation: plan an investigation, design a test, teach a method |

`stages.js` derives the stage from `cognition.bloom` (remember 1, understand 2, apply 3,
analyze/evaluate 4, create 4, or 5 for the transfer types in `TRANSFER_TYPES`) and the
interaction: a `true_false` item is at most 2, and a `sort_bins` item at most 3. The reviewed overrides
in `patches.js` (`stageOverrides`, each with a reason) win. They cover Bloom tags that are clearly
wrong (phonics "analyze" → 3, "which is bigger" → 2, two-step problems → 4, …) and the generated
starter and stretch items, whose builder tagged everything "remember". `derive-metadata.js` writes
`stage` into the bank. To change a stage, add or edit an override with a reason, never the number
in the file. `content-bank.test.js` checks that the bank equals the derivation and that every
override has a reason and matches an item. Run `node scripts/content/stages.js` to see the
distribution (in AUDIT.md).

## The everyday-curiosity pool (content v4)

There are 48 relatable daily-life questions (science 24, maths 12, English 12). Ids look like
`SCI-LIS-E00-Q01`. They are all `everyday: true`, stage 0, level 0-1, graded, `age_band: "all"`,
verified, with real skills. Six new skills were added for them: `science.materials`,
`science.heating-cooling`, `science.light-sound`, `science.colour-mixing`, `maths.sharing-equally`
and `english.signs-labels`. Like every item they have hints, process-praise feedback that
explains the "why", `distractor_insight`, `analysis.parent_note`, `teacher_action_if_missed`,
worked examples where useful, and an authored English narration.

- **Source:** `new-items/everyday-source.js` (English text, metadata and narration) →
  `new-items/everyday.js` (specs) → `build.js`. Maths and science items are translated in all 13
  languages in `new-items/everyday-translations.json` (prompt or spoken question, hint, feedback,
  worked example, gap-fill options). True/False and Yes/No buttons reuse the bank's own labels. Spoken answers have
  per-language word lists in `everyday.js` (`WORDS`). English-subject items are not translated,
  because they teach English.
- **Interactions:** mostly `tap_mcq` / `true_false`, plus a few `multi_select`, `drag_order`,
  `drag_to_blank`, `typed_short` (numbers, one English word) and `mic_record`.
- **To add one:** append to `everyday-source.js` (an unused `E00` number, a skill from
  `skills-source.js`, a narration that passes the rules). For maths/science, add its
  translations to `everyday-translations.json` (the builder throws if a language is missing).
  Then run `derive-metadata.js` and `audit.js --check`.

## Narration (content v4)

Each question has its own spoken script, read by the teacher voice and shown as captions:

```json
"narration": { "text": "Here's a little weather riddle. Listen to the clues, then tap the picture they describe.", "style": "curious", "v": 1, "status": "authored" }
"translations": { "de": { …, "narration": { "text": "…", "style": "curious", "v": 1, "status": "templated" } } }
```

`style` is one of curious, story, detective, adventure, calm or challenge. `status` is one of:
`authored` (written by a person for this item, in English), `templated` (built from the phrase
bank) or `reviewed` (a person has checked it). `applyQuestionTranslation(q, lang)` returns the
narration in `lang`. If a translation has no script of its own, it returns none, so English is
never read by another language's voice. English-subject items (not translated) carry English only.

**The rules** (`lib/narration-rules.js`, enforced by the QA gate on every served item in every
language):
- It speaks to the learner and is at most 50 words (35 on listening items, because the audio
  follows), with at most one "!" and no markup.
- It keeps the same facts, difficulty and options as the screen, and adds nothing new.
- It never gives the answer:
  - typed, spoken, tile and ordering items never contain an accepted answer, including the same
    number as digits or a number word (a lone "one" counts only as the digit 1). Ordering items
    never contain the whole sequence or every item;
  - choice items read all the options in order, or none, and never hint which is right;
  - speaking items never read the words the learner must say.
- It never reads what the item tests:
  - Read items (every subject): never the card text in `prompt` (the whole card or any sentence
    of 3+ words);
  - listening items: never the `audio_text` and never the word options;
  - English reading items: never the word options;
  - English Write items: never the target, said or spelled.
- A templated translation contains no English words.

**Authoring and reviewing English scripts.** Writers put `{ "<id>": { "text", "style" } }` in
a folder, one file per bank. Then:

```bash
node scripts/content/narration.js --from <folder>   # check every rule, store, rebuild the banks
```

Accepted scripts go into `scripts/content/narration/authored/<bank>.json` (the source the build
reads). A script that breaks a rule is listed as REJECTED and not stored, and that item gets a
templated English script until it is fixed. Re-running with the same text changes nothing. To mark
a script reviewed, set `"status": "reviewed"` on its entry in the store; a later merge of the same
text keeps it, and a changed text goes back to `authored`. The everyday items carry their script
in `everyday-source.js`; an entry in the store overrides it.

**Templated narration (other languages, and any English item without a script).**
`narration.js` builds an intro for the item's style, then the item's own translated instruction.
It adds the prompt (Write/Speak only, not English Write, no pictures, a gap read as "…"), the
options (choice items outside Listen/Read, read neutrally) and the Read framing line, then an
outro. It keeps the first variant that passes every rule, dropping parts in turn, down to a fixed
fallback line. The intro/outro variant is picked from the id, so it is the same in every language
and on every run. The style is the English script's style.

**The phrase bank** (`server/data/narration-phrases.json`) holds the following for each of the
14 languages:
- for each style, two intros and two outros;
- how to read a list of options (`frame`, `sep`, `last`; `frame_multi` for "tap all");
- the gap marker (`blank`);
- a framing line for Read items (`read`) and a `fallback`;
- the sentence `end` and the `join` (no spaces in Chinese/Japanese).

The phrases were written for each language, not translated word for word. They contain no "!",
and English never uses "one" as a pronoun (it would read as the number 1). `narration.test.js`
checks that every language and style is there and that no English is left. To improve a
language, edit its phrases and run `derive-metadata.js`. The gate re-checks every script.

## Adding or changing content

**Repair an existing question.** Add an entry to `patches.js`:

```js
{ ids: ['MA-RD-T05-Q08'], category: 'wrong_key', severity: 'blocking',
  reason: '6 + 3 = 9 and 4 + 4 = 8, so ...',
  apply(q, h) { h.forEachLang(q, (t) => { t.prompt = '6 + 3 ? 5 + 4' }) } },
```

`h.forEachLang` visits the English question and every translation. Set absolute values only,
because the script runs again and again. To take an item out, call
`h.exclude(q, 'reason')`; the item stays in the file with `qa.status: "excluded"`.

**Add new items.** Write a compact spec in `new-items/*.js` (see `foundation-maths.js`) and
register the file in `new-items/index.js`. `build.js` copies the 36-field structure from a
template question of the same file. It also reuses existing translations of the instruction
and second-try line. Maths and science items need every field that learners see in all 13
languages (`prompt`, `audio_text`, `options`, answers, `hint`, feedback). The builder throws
an error if one is missing. Use maths notation or pictures as options wherever you can, so
the key does not depend on the language. Give each item a `skill`, and a `validation` if the
default for its interaction does not fit. Speaking items need `keywords` and a `sample`
(per language), and either `validation.numbers` or a `validation_by_lang` for keyword lists.

**Add a question type.** Add the type to `rules.js`: add a `SKILL` entry and, if it is themed
for young children, a `YOUNG_TYPES` entry. Add a `deriveValidation` case if the default for
the interaction does not fit. If the type needs a new widget answer shape, add it to
`audit.js` `submissions()`, so the gate can build the right answer the way the widget would.

**Add a skill.** Add it to `skills-source.js` with these fields:
- `id` is `subject.kebab-name`.
- `name` is short, plain and friendly, and must read well in "Last time, ___ was tricky". It is shown to children, adults and parents.
- `objective` is one precise sentence.
- `level` is the typical level.
- `prerequisites` uses existing ids and must not form a cycle (`content-bank.test.js` checks this).

`modes` is filled in automatically. Each new name also needs translating:
`t("skills.<id>", name)`, where the key's dots become nested JSON keys.

**Add a subject.** Add the files to `lib/bankio.js` `BANKS` (and the model in the migration's
`MODULE_MODEL`/`SUBJECT_MODEL`). Add its skills, rules and starter items. Then extend the
`audit.js` id pattern (`ID_RE`) and the subject prefixes.

**Change the checker.** Edit only `server/utils/scoreAnswer.js` between the SHARED CORE
markers. Then run `sync-checker.js`, `derive-metadata.js` (qa results can change) and the
tests. `test/answer-check-parity.test.js` runs the whole bank, in every language, through
both copies.

## Database

The server seeds the files through `POST /api/<module>/<subject>/seed` and
`scripts/seed-all.js`. These replace the bank set and leave teacher uploads alone. To bring
an existing database up to v3 without touching history, run the migration:

Content v4 works the same way: `2026-11-21-content-v4.js` carries `stage`, `everyday`,
`narration` (+ translated scripts), the 48 everyday items, the v4 repairs and `qa.version` 4. It
prints a verify line after `--apply`. `test/content-migration-v4.test.js` runs it on the in-memory
harness (v3 state → dry run → up → verify → idempotent → the API serves stage, everyday and
localized narration → down). Run v4 alone on a database that never ran v3; it carries v3's changes
too.

```bash
node scripts/migrations/2026-11-21-content-v4.js                 # dry run
node scripts/migrations/2026-11-21-content-v4.js --apply         # backs up to server/backups/<timestamp>/ first
node scripts/migrations/2026-11-21-content-v4.js --down server/backups/<timestamp>
```

The v3 commands:

```bash
node scripts/migrations/2026-11-20-content-v3.js                 # dry run
node scripts/migrations/2026-11-20-content-v3.js --apply         # backs up to server/backups/<timestamp>/ first
node scripts/migrations/2026-11-20-content-v3.js --down server/backups/<timestamp>
```

The migration changes only bank documents: those matched by `id` with `uploadBatchId: null`
and no `orgId`. It updates changed fields in place (keeping `_id` and `createdAt`) and inserts
the new items. It never deletes on the way up. `--down` restores the exact documents and
removes the inserted ones. A second `--apply` changes nothing.
`test/content-migration.test.js` runs up → verify → idempotent → served filter → down on the
in-memory harness. `server/backups/` holds learner-free but full copies of content: keep it
out of git.
