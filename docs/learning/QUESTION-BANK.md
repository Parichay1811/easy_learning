# Question bank: maintaining and extending it (content v3)

The bank lives in `server/data/` as 12 JSON files, one per subject × mode
(`english|math|science` × `listen|read|write|speak`), plus `skills.json`. The server seeds
these files into MongoDB. Never hand-edit the generated fields (listed below). Change the
sources and regenerate the files.

```
server/scripts/content/
  derive-metadata.js   builds the 12 files + skills.json (re-runnable, keeps the original formatting)
  patches.js           hand repairs to existing questions, each with a category and a reason
  translation-fixes.js text that was left in English inside a translation
  rules.js             per question type: skill, age band, graded, validation (+ keyword lists)
  skills-source.js     the skills catalogue (the source of skills.json)
  new-items/           level-0 foundation items and the maths 6-8 stretch set
  audit.js             the audit and QA gate
  sync-checker.js      copies the answer checker's shared core to the client
  lib/bankio.js        load/save that preserves each file's JSON formatting
server/scripts/migrations/2026-11-20-content-v3.js   pushes v3 into an existing database
```

## Everyday workflow

```bash
cd server
node scripts/content/derive-metadata.js        # regenerate data files + skills.json
node scripts/content/audit.js --check          # QA gate: exit 1 if a served item fails a blocking check
node scripts/content/sync-checker.js           # after editing utils/scoreAnswer.js
npm test                                       # includes answer-check, parity, content-* tests
```

`derive-metadata.js --dry` reports what would change and writes nothing. A clean tree prints
`Would change: nothing`, and `test/content-bank.test.js` asserts this. Other useful commands:
`audit.js --id MA-WR-T02-Q01` (every finding for one question), `audit.js --verbose`, and
`audit.js --json report.json`.

**Ids are permanent.** Learners' answer history refers to question ids. Never renumber or
reuse an id. To take a question out, exclude it.

## Fields per question (v3)

| field | how it is set |
|---|---|
| `level` 0-8 | from the item. Repairs in `patches.js` can relabel it; `level_name` follows automatically |
| `skill` | `rules.js` (`SKILL` by question type, or a function such as `arithmetic()`); new items set `skill` in their spec |
| `age_band` | `"young"` for types in `YOUNG_TYPES` and for every `joy_flavor: "silly"` item; otherwise `"all"` |
| `graded` | `true` unless a patch or rule sets `false` (practice only) |
| `validation` | `rules.js` `deriveValidation()`; new items may give their own |
| `qa` | computed from the audit: `verified` if every blocking check passes; `excluded` if a patch excludes it |

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
| options | yes | the answer is among the options; sequences are permutations; letter tiles spell the answer with none left over; match_pairs options are the right-hand items; bins don't overlap |
| answer_key | yes | maths keys recomputed where the prompt or audio parses (expressions, missing numbers, operators, comparisons, counts, number words, patterns, "comes after/before", spoken sums); stated equations are true |
| round_trip | yes | builds **exactly what the widget would submit** for the right answer (and wrong options/distractors, wrong numbers, reversed comparisons) and runs the checker: right must be `correct` (or `ungraded` for practice), wrong must not be correct; failed speech must be `uncertain` |
| translations | yes | all 13 languages present; same number of options; the answer is the same option as in English; numbers equal; spoken text present; the whole round trip again in every language |
| audio | yes | Listen items (and "Listen…" instructions) have `audio_text` |
| speech | yes | graded speech items have something to check and a sample answer |
| qa | yes | `needs_review` implies `graded:false`; exclusions have a reason |
| duplicate_content, mode, level, untranslated, word_problem | warning | same content twice; the picture badge or the prompt gives the answer away; level heuristics; English left in a translation; a word problem whose key matches no one-step reading |

Some things cannot be automated: an option that is defensibly right, a picture that can be
named two ways, a science statement that is subtly wrong. A person (or a reviewing agent)
reads every new item, records any repair in `patches.js` with a category and reason, and
lists it in AUDIT.md.

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
