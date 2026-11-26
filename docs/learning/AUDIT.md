# Question bank audit: content v5 (2026-11-26), v4 (2026-11-21) and v3 (2026-11-20)

## Content v5 (2026-11-26): the clinician and educator review

Every question was reviewed as a paediatric speech and language therapist, a special-education
teacher and a subject specialist would review it, against the rubric in
[TEACHING-STANDARDS.md](TEACHING-STANDARDS.md). Each skill is also mapped to the curricula
([STANDARDS.md](STANDARDS.md)).

| | count |
|---|---|
| Questions | 1,970 |
| Served | **1,952**: 1,774 graded, 178 practice-only |
| Excluded | 18 (11 from v3, 7 new: listed below) |
| Review findings applied | **965** on 848 questions (192 blocking, 773 improvements), in `scripts/content/review-v5/*.json` |
| Findings held back | 4 improvements to everyday-pool prompts, until they are translated (listed by `review-v5.js`) |
| English narration | **1,952 authored v2 scripts**: on average 10.1 words (was 16.9). Levels 0-2: 9.0 words on average, 12 at most |
| Translated narration | v2 in all 13 languages, built from each item's own instruction, with the English cues |
| Money items | 24, now tokens filled per learner (euro, pound, dollar, yen …) |
| QA gate (`audit.js --check`) | **passes**. New blocking checks: `money` (every language × the currencies a learner of that language can meet), v2 narration required |

### What the review found and fixed

| finding | applied | examples |
|---|---|---|
| Instruction not literal or not what the screen shows | 174 | "Tell the story using the pictures" with only words (EN-SPK-T14, now emoji steps); "Put the pictures in order" with words only (EN-RD-T10); "for this picture" on a written story (MA-WR-T10) |
| Developmental order | 127 | clapping syllables (level 3) came after rhyme and first sounds (2): now syllables, then rhyme, then sounds; teen numbers and bridging 10 moved up; o'clock and half past before quarter past/to; simple AB patterns down to level 1 |
| Picture problems | 108 | the badge showed the answer (🥶 for "cold", ⬇️ for "down", 🔵 for the shape asked for); 🧺 labelled "towel"; a bird's nest 🪺 as a butterfly stage |
| Reading load that is not the point | 52 | a 19-word written problem at level 3: the problem is now also heard; cards that printed the finished sentence above its own word tiles |
| Speech checking | 32 | "counting in fives" and "it goes up in twos" marked wrong (MA-SPK-T10); "five, because…" marked wrong (MA-SPK-T14): reviewed checking rules |
| Ambiguous or two defensible answers | 42 | ☂️ and 🌂; purse and pocket; "silly to say" as a graded odd one out |
| Listening item answerable without listening | 31 | the only kind or sensible option keyed (EN-LIS-T15) |
| Science accuracy | 31 | cocoon → chrysalis (12 items, in every language); "buds" keyed Spring *or* Autumn; amphibian defined so that it fits seals and ducks |
| Spelling load in science | 23 | free typing of microscope, caterpillar and volcano at level 1: letter tiles, in each language from its own answer; vertebrate and extinction moved up |
| Negation at levels 0-2 | 18 | "Fire is safe to touch" spoken as a statement to young children; "which is not…" questions moved up or written positively |
| Wellbeing, health and safety | 12 | "healthy snacks" → everyday snacks; "stranger danger" → check with a trusted grown-up; the real and fake pills planning task → how scientists test a medicine (level 5) |
| Answer format and wrong keys | 23 | "1.25 kg" marked wrong; < > = needed a symbol keyboard (now dragged into the gap); the hint said "lock" has four sounds |
| Money | 20 + the 24 token items | 20p coins do not exist in dollars, yen or won: coin cards show 10, 5 and 1 |
| Translation errors found on the way | 9 | French, Chinese and Japanese clock options showed 10:45 while the clock shows 10:30; Japanese counting prompts left in English; Chinese cloud and shell cards swapped |

### Excluded in v5

| id | reason |
|---|---|
| EN-RD-T12-Q09 | an exact duplicate of EN-RD-T15-Q09 |
| MA-LIS-T03-Q09, MA-LIS-T03-Q10 | the key depends on a second clause the picture cannot show (hats, a handstand) |
| MA-LIS-T09-Q07 | the audio mixes up pairs and shoes, so a careful listener finds no right option |
| SCI-WR-T09-Q04 | maths shapes in a science item |
| SCI-SPK-T09-Q06 | asks "bigger, heavier or faster" when the answer is "hotter"; the card cannot ask for "hotter" without giving it away |
| SCI-SPK-T09-Q09 | a maths item in the science bank |

### Narration v2 (served items)

| cue | items | cue | items |
|---|---|---|---|
| tap | 857 | look | 315 |
| read | 736 | drag | 136 |
| listen | 603 | count | 124 |
| say | 473 | order | 104 |
| type | 385 | match | 40 |
| think | 349 | sort | 30 |

### Reproduce (v5)

```bash
cd server
node scripts/content/derive-metadata.js --dry            # "Would change: nothing"
node scripts/content/audit.js --check                    # QA gate passed
node scripts/content/standards.js --check                # STANDARDS.md and the client copy are current
node scripts/content/narration.js --report --dry         # 1,952 authored English v2 scripts
npm test && npm run test:ai-assistant
node ai-assistant/lib/pack-lint.mjs --young              # the children's lesson packs: to fix 0
```

The rest of this file is the content v4 audit (2026-11-21) and the v3 audit (2026-11-20). Their counts describe those versions.

---


## Content v4 (2026-11-21)

What v4 adds to every question: `stage` (0-5), `everyday`, and a `narration` script in English and
in every translated language. It also adds the everyday-curiosity pool (48 items), the repairs
found while writing narration, and a QA gate extended to stages, narration and badges.

| | count |
|---|---|
| Questions | **1,970** (1,922 v3 + 48 everyday) |
| Served | **1,959**: 1,781 graded, 178 practice-only (11 excluded, unchanged) |
| QA gate (`audit.js --check`) | **passes**: 0 served items fail a blocking check (schema, unique_id, options, answer_key, round_trip, translations, audio, speech, qa, stage, narration, badge) |
| Stage set by | 48 everyday (stage 0) · 1,603 derived from Bloom + interaction · 308 reviewed overrides (with reasons, `patches.js` `stageOverrides`) |
| English narration | **1,959 authored** (1,911 by the narration writers, merged and checked against every rule, 0 rejected; 48 for the everyday pool), 0 templated |
| Translated narration | **1,316 per language × 13 languages = 17,108 scripts, all templated** (maths and science; English-subject items are not translated) |
| Skills | 96 (6 new for the everyday pool) |

### Served items by stage × subject × mode

Stages: 0 everyday curiosity · 1 recognition · 2 understanding · 3 application · 4 reasoning · 5 transfer.
Reproduce with `node scripts/content/stages.js`.

| subject × mode | S0 | S1 | S2 | S3 | S4 | S5 | total |
|---|---|---|---|---|---|---|---|
| English listen | 5 | 11 | 47 | 79 | 20 | 0 | 162 |
| English read | 5 | 10 | 68 | 50 | 30 | 0 | 163 |
| English write | 1 | 2 | 0 | 126 | 30 | 0 | 159 |
| English speak | 1 | 44 | 32 | 72 | 10 | 0 | 159 |
| Maths listen | 4 | 41 | 21 | 74 | 30 | 0 | 170 |
| Maths read | 5 | 22 | 33 | 82 | 29 | 0 | 171 |
| Maths write | 3 | 2 | 0 | 126 | 40 | 0 | 171 |
| Maths speak | 0 | 25 | 28 | 63 | 30 | 10 | 156 |
| Science listen | 9 | 28 | 50 | 50 | 26 | 0 | 163 |
| Science read | 10 | 10 | 77 | 40 | 28 | 0 | 165 |
| Science write | 3 | 12 | 10 | 115 | 20 | 0 | 160 |
| Science speak | 2 | 37 | 30 | 41 | 30 | 20 | 160 |
| **all** | **48** | **244** | **396** | **918** | **323** | **30** | **1,959** |

What the table shows:
- The write modules are almost all application (3): spelling, calculating, completing. Maths
  write and English write have no understanding-stage (2) items.
- Transfer (5) exists only in speaking: 10 "teach it to a friend" items and 20 investigation /
  fair-test plans. These are all practice-only, so for mastery the highest graded stage is 4.
- The main stage overrides:
  - phonics "analyze" → 3 (60 items);
  - "which is bigger" → 2 (40);
  - choosing <, > or = → 3 (20);
  - spotting a named word → 1 (10);
  - selecting a named category → 3 (30);
  - two-step problems → 4 (30);
  - explaining why → 4 (10);
  - designing a test → 5 (10);
  - captions → 3 (10);
  - the generated starter and stretch items, reviewed by type (88).

### Narration coverage (served items)

Reproduce with `node scripts/content/narration.js --report`.

| language | authored | reviewed | templated | missing |
|---|---|---|---|---|
| en | 1,959 | 0 | 0 | 0 |
| es, fr, pt, it, de, nl, ru, tr, zh, ja, ko, id, vi (each) | 0 | 0 | 1,316 | 0 |

English by subject: English 643, maths 668, science 648 (all authored). Every script passes every
rule (`narration.test.js` checks 18,000+ scripts). In 2 of the 17,108 translated scripts, the
built variant drops the intro because the intro contains the spoken number word: MA-LIS-T01-Q02
(vi) and MA-LIS-T01-Q06 (ja). Templated scripts are `status: "templated"` until a person
reviews them.

### Repairs in v4 (all in `patches.js` or the builders, with reasons)

| what | items | fix |
|---|---|---|
| The picture badge on a listening item showed the answer (🧼 next to "soap", ⛑️ for "helmet", 📏 for "ruler"): it could be answered without listening | EN-LIS-T01 (10), EN-LIS-T09 (10), MA-LIS-T13 (10) | badge is now 👂. New blocking gate check `badge` (emoji answers, and word answers the bank pairs with that emoji) |
| Generated items copied the template item's own widget data (`letter_tiles`, `word_tiles` …), e.g. EN-WR-F00-Q04 "sun" carried `letter_tiles` c,a,t,d,s. The widgets use `options` (s,u,n), so it was answerable, but the data was misleading | all generated items (EN-WR-F00-Q04/Q05 affected) | `build.js` keeps only the standard fields. New gate rule: legacy tile lists must be able to build the answer |
| `speech_scoring.expected_keywords` held the card word (the word to rhyme with; the category). `validation` decides, so the card word was never accepted (verified on server and client). Another reader of `expected_keywords` would have accepted it | EN-SPK-T06 (10), EN-SPK-T12 (10) | they now list real rhymes or examples, never the card word. New round-trip rule: just saying the card word on a speaking item (where the card is not the answer) must not be correct. Test in `content-bank.test.js` |
| An everyday item duplicated SCI-WR-T07-Q08 ("Ice ___ when it gets warm.") | SCI-WR-E00-Q01 | rewritten: "Chocolate ___ in a hot car." |

### The everyday-curiosity pool (48 items)

| subject | listen | read | write | speak | skills |
|---|---|---|---|---|---|
| science (24) | 9 | 10 | 3 | 2 | weather-seasons, heating-cooling (new), materials (new), light-sound (new), colour-mixing (new), living-things, life-cycles, observation, facts |
| maths (12) | 4 | 5 | 3 | – | sharing-equally (new), money, counting, time, compare-numbers, subtraction/addition-within-10, measures, multiplication (its first items) |
| English (12) | 5 | 5 | 1 | 1 | signs-labels (new), understanding-sentences, inference, reading-comprehension, missing-word, answering-aloud |

All 48 items are:
- stage 0, level 0 (21 items) or 1 (27 items);
- graded, verified, `age_band: "all"`;
- built with 29 tap_mcq, 7 true_false, 3 drag_to_blank, 1 multi_select, 1 drag_order,
  4 typed_short and 3 mic_record;
- given an authored English narration.

Examples: an umbrella in the rain, ice melting on a warm plate, mixing red and yellow paint, which
tool tells the time, sharing six sweets with a friend, coins left after buying a snack, a CLOSED
shop sign, a WET FLOOR warning. Maths and science items are translated in all 13 languages. The
answer checker accepts the right answer and rejects the wrong ones in every language, on server
and client (`content-bank.test.js`, `answer-check-parity.test.js`). A reviewer read every item.
Defensible-answer checks:
- "Which one floats": a leaf vs a stone and a key.
- "Which one gives off its own light": a bulb vs a mirror and a spoon.
- "We wear a coat when it is ___": cold / hot / warm, so no second right answer.

### Served items by level in v4 (graded + practice-only)

| subject × mode | L0 | L1 | L2 | L3 | L4 | L5 | L6 | L7 | L8 | total |
|---|---|---|---|---|---|---|---|---|---|---|
| English listen | 10 | 35 | 51 | 33 | 21 + 1 | 10 + 1 | – | – | – | 160 + 2 |
| English read | 10 | 23 | 40 | 30 | 40 | 20 | – | – | – | 163 |
| English write | 9 | 20 | 30 | 30 | 37 + 3 | 18 + 12 | – | – | – | 144 + 15 |
| English speak | 9 | 20 + 10 | 30 | 18 + 12 | 23 + 17 | 10 + 10 | – | – | – | 110 + 49 |
| Maths listen | 10 | 42 | 43 | 39 | 20 | 8 | 4 | 2 | 2 | 170 |
| Maths read | 10 | 27 | 43 | 52 | 20 | 10 | 4 | 3 | 2 | 171 |
| Maths write | 9 | 20 | 45 | 36 | 31 | 20 | 4 | 3 | 3 | 171 |
| Maths speak | 8 | 32 | 36 | 32 | 8 + 20 | 10 + 10 | – | – | – | 126 + 30 |
| Science listen | 13 | 50 | 38 | 41 | 21 | – | – | – | – | 163 |
| Science read | 9 | 31 | 36 | 64 | 17 | 8 | – | – | – | 165 |
| Science write | 9 | 21 | 50 | 40 + 10 | 20 | 0 + 10 | – | – | – | 140 + 20 |
| Science speak | 10 | 20 + 10 | 30 + 10 | 38 + 12 | 0 + 20 | 0 + 10 | – | – | – | 98 + 62 |
| **all** | 116 | 341 + 20 | 472 + 10 | 453 + 34 | 258 + 61 | 114 + 53 | 12 | 8 | 7 | **1,781 + 178 = 1,959** |

Age bands (served): English 487 all / 156 young; maths 468 all / 200 young; science 463 all / 185 young.

### Reproduce (v4)

```bash
cd server
node scripts/content/derive-metadata.js --dry     # "Would change: nothing"
node scripts/content/audit.js --check             # QA gate passed
node scripts/content/stages.js                    # the stage table above
node scripts/content/narration.js --dry --report  # the narration coverage above
npm test                                          # content-bank, narration, content-migration(-v4), parity, …
```

The rest of this file is the content v3 audit (2026-11-20). Its counts describe v3.

---

## Content v3 audit (2026-11-20)


Scope: all 1,800 questions in `server/data/` (12 files, English, maths and science ×
listen/read/write/speak) and every translation of the maths and science questions (13
languages). Method:

1. An automated audit (`server/scripts/content/audit.js`) that builds **exactly what each
   widget submits** and runs it through the answer checker.
2. A full human-style read of every item. Three independent reviewers read the listen/read
   files, re-computing every count and sum. I read the write and speak files myself.

Every repair is recorded with a category and reason in `server/scripts/content/patches.js`.
`derive-metadata.js` regenerates the files from those repairs.

## Summary

| | count |
|---|---|
| Questions audited | 1,800 (+ 1,200 maths/science items × 13 languages) |
| Questions with a question-specific **blocking** problem in the original bank | **456**, plus all 450 speaking items, where unheard speech counted as correct |
| Questions repaired (content, key, widget, level, picture or translation changed) | **494** |
| …of which the task itself was replaced (new answer key or new interaction) | **56** |
| Questions whose checking was repaired (keywords, synonyms, validation rules; content unchanged) | **≈ 250** |
| Excluded (kept in the file, never served) | **11** |
| Added: level-0 starter items | **95** (8 per subject × mode; 7 in science write) |
| Added: maths stretch items, levels 6-8 | **27** |
| Final bank | **1,922** questions; **1,911 served**: 1,733 graded, 178 practice-only |
| QA gate (`audit.js --check`) | **passes**: 0 served items fail a blocking check |

## What was found

### 1. The answer checker marked right answers wrong (blocking)

The audit submitted the canonical right answer through the old `scoreAnswer.js`, exactly as
each widget would. The old checker marked it wrong for **212 questions** in English. In the
translated questions it did so for **2,827 question × language pairs**.

| cause | items | examples |
|---|---|---|
| letter_bank word tiles were joined without spaces ("Iwashwithsoap") | 10 (+10 equation tiles "3+4=7" ≠ "3 + 4 = 7") | EN-WR-T06-*, MA-WR-T08-* |
| speech items with **no keywords** (open answers) | 42 | EN-SPK-T13-Q09, EN-SPK-T15-*, SCI-SPK-T06-*, SCI-SPK-T13-* |
| speech keywords the learner never says: the category name ("animal" while naming animals), syllables ("wa", "ter") that recognisers never return, spelled letters, clock text | 47 | EN-SPK-T12-*, EN-SPK-T07-*, EN-SPK-T10-*, MA-SPK-T09-* |
| typed_long / typed_short answers keyed "open", or exact match against one or two sample answers | 62 | SCI-WR-T12/T13/T14/T15-*, EN-WR-T14-*, EN-WR-T15-* (free writing compared exactly with a sample paragraph) |
| typed answers in another form: "five" for 5, "3 apples", "the sun", trailing punctuation, "2 + 3 = 5" for "3 + 2 = 5", 6/8 vs 3/4 | most typed items | MA-WR-T11-*, MA-WR-T10-*, MA-WR-T14-Q05 |

### 2. Wrong answers counted as right (blocking)

- **Failed or unsupported speech recognition counted as correct.** This affected all 450
  speaking items and inflated mastery. The result is now `uncertain` and is never counted.
- **"Half the keywords" accepted wrong answers.** "three is bigger" passed for 3 vs 7
  (MA-SPK-T06-*), "add two" for +1 (MA-SPK-T10-*), "the mouse is bigger" (SCI-SPK-T09-*):
  30 items. The comparison or rule itself is now checked.
- **Rhymes keyed to the prompt word.** Saying "cat" was right and "hat" was wrong
  (EN-SPK-T06-*, 10 items). Now any listed rhyme counts and the prompt word never does.

### 3. Items that could not be answered or finished (blocking, 62 items)

| problem | items |
|---|---|
| `match_pairs` with a flat two-item answer: the widget split the emoji and could never finish | EN-RD-T06-* (10), SCI-RD-T04-* (10) → now multi_select |
| match_pairs whose right-hand column repeated the left (numbers vs numbers, terms vs terms) | MA-RD-T08-* (10), SCI-RD-T12-* (10) → options are now the picture groups / definitions |
| match_pairs with a text answer ("tied A and C", "Neither") that was not an option | MA-RD-T09-* (10) → tap_mcq / multi_select with labelled groups; Q01 excluded |
| "Drag the word into the blank" built as letter_bank: the widget waited for all three word tiles | SCI-WR-T07-* (10) → drag_to_blank |
| tap_sequence for a one-tap or order-free instruction ("the silliest hat", "everything except the shoe") | EN-LIS-T13-Q09, Q05 |

### 4. Wrong answer keys (blocking, 17 items)

- MA-RD-T05-Q08 and MA-WR-T07-Q08: "6 + 3 ? 4 + 4" keyed "=". The answer is ">". The right side is now 5 + 4.
- MA-LIS-T13-Q10: X = 2Y and Y = Z/2 give X = Z, so "not enough information" was wrong. The second fact is now "Z holds more than Y".
- Clock emoji that show a different time from the key (🕓 keyed 4:30; 🕘 keyed 8:15; 🕙 keyed 10:45; and more):
  - MA-RD-T14-Q05/Q07/Q09 now use 🕟 4:30, 🕣 8:30 and 🕥 10:30.
  - MA-SPK-T09-Q05 now uses 🕟.
  - MA-SPK-T09-Q06/Q08/Q09/Q10 now show the time on a digital clock (⏰ 8:15).
- Statements that needed a picture that was never shown ("There are three apples" with only one badge emoji): MA-LIS-T03-Q01 to Q04. The objects are now in the prompt.
- Science:
  - SCI-RD-T02-Q08: butterflies form a chrysalis, not a cocoon. Fixed in 10 languages.
  - SCI-LIS-T05-Q10 (key 💎 but feedback "rock") is excluded.
  - SCI-RD-T03-Q06 ("chrysalis" keyed to a nest picture) is excluded.

### 5. Ambiguous items: more than one defensible answer (blocking, 33 items)

| item | problem | resolution |
|---|---|---|
| MA-LIS-T14-Q09 | options 1/2 and 3/6 are equal | 3/6 → 1/6 |
| MA-LIS-T11-Q06 | "reads 15, then 8, stops 5 pages before 30" gives both 23 and 25 | story rewritten in 14 languages |
| MA-LIS-T05-Q05, MA-RD-T07-Q05 | a square is a rectangle | ⬛ → ⚪ |
| EN-LIS-T08-Q07 | cat, hat, dog: "hat" is odd by meaning | prompt asks which does not rhyme |
| EN-RD-T07-Q08 | water, sleep, sweets: three defensible odd ones out | the rule is now stated |
| EN-RD-T09-* (10) | the word to find was never shown; "dog (1st)" and "dog (4th)" were both right | instruction names the word; options are the words in the line |
| EN-LIS-T13-Q03 | "biggest ball": the emoji are drawn the same size | "smallest ball" (tennis ball) |
| EN-WR-T13-Q08 | two misspelled words, one key | one misspelling |
| SCI-LIS-T04-Q07 | "Buzz" fits bee, mosquito and fly | the other options are now a cow and a fish |
| SCI-LIS-T14-Q04/Q10, SCI-RD-T07-Q07, SCI-RD-T04-Q05 | two defensible odd ones out or pairs; the feedback in every language depends on the old words | excluded |
| EN-LIS-T13-Q06 | "the second star" depends on screen order, which is shuffled | excluded |
| EN-WR-T12-Q09/Q10, EN-WR-T14-Q09/Q10, EN-WR-T11-Q07, EN-LIS-T12-Q10, EN-LIS-T13-Q09, EN-SPK-T08-Q09/Q10, EN-SPK-T11-Q08 | open or matter-of-taste answers | practice only |

### 6. Mode mismatches: the answer was given away (mostly warnings)

- **The picture badge was the answer** on 144 Listen/Read items. For example, EN-LIS-T02 showed 🧼 and the answer was 🧼. These badges now show 👂/📖 (🔊 where the answer is an ear). On 44 maths items the badge was the counted object, which read as one extra; it is now 🔢.
- The voice skipped "___", so the learner heard "I wash my before dinner" (EN-LIS-T09, EN-RD-T04, EN-SPK-T08; 30 items). The gap is now spoken as "beep".
- The audio named the answers ("Tap all the animals. Cat. Cow."): EN-LIS-T12-*.
- The prompt printed the answer:
  - "(clock showing 3 o'clock)": MA-RD-T14 and MA-SPK-T09.
  - The sentences printed in order: EN-RD-T14. EN-RD-T14-Q04 also printed them in a different order from the key.
  - The numbers to order: MA-LIS-T15.
- The question was missing: "Answer the question" with no question.
  - EN-RD-T11, EN-RD-T12 and EN-RD-T15-Q08/Q09 (22 items): questions written.
  - SCI-RD-T14-* (10): the question, which only existed in the hint, now follows the passage in every language.
- EN-WR-T01 says "look at the picture", but the audio speaks the word. The instruction now says to listen too; without the audio, 😄 = "giggle" is ambiguous.

### 7. Levels clearly off (warnings, 111 items relabelled)

Examples:
- A single "Tap the apple" at level 5 (EN-LIS-T13-Q01 → 1).
- "Do fish need umbrellas?" yes/no questions at level 5 (EN-LIS-T14 → 2).
- 17 + 6, 24 − 9, 28 − 15 and 45 − 19 at level 1 (MA-WR-T02/T04, MA-RD-T03 → 2-3).
- Adding two coins at level 4 (MA-LIS-T12-Q01..Q06 → 2).
- Ordering three numbers at level 5 (MA-LIS-T15 → 2-3).
- Fibonacci among +1 patterns at level 3 (→ 4).
- Science trick items (a candle flame is non-living) at level 1 (→ 2-3).

### 8. Translations (warnings, 98 items fixed)

- Yes/No and True/False labels left in English: German in MA-LIS-T03; Russian and Korean in MA-RD-T03; Russian in SCI-RD-T02.
- Japanese word problems left entirely in English: MA-WR-T08 to T15, 64 prompts. Also a few Turkish/Japanese prompts in MA-SPK-T06/T07. All are now written in Japanese/Turkish.
- Every translated key sits at the same option index as the English one, and all numbers match (checked for all 13 languages).

### 9. Other repairs

- Opposites, synonyms and gap fills gained the other right answers (cool/chilly; mean/nasty; sleep; street; piggy bank…), so EN-WR-T10/T12 no longer reject valid words.
- "Missing letters" items accept the whole word as well as the letter (EN-WR-T03).
- Butterflies: "chrysalis" and "pupa" are accepted wherever "cocoon" was typed.
- Story wording: the incoherent egg recipe is now "a box of 12 eggs" in 14 languages (MA-LIS-T11-Q05, MA-WR-T12-Q05, MA-SPK-T14-Q05).
- Emoji labels: 🧺 is a basket, not a towel; 🦺 is a safety vest; 🧴 reads as liquid soap.

## Graded vs practice-only

178 served items are `graded:false`. They are still shown and give feedback, but every
answer is "ungraded": the learner is never told they are wrong, and mastery never counts the
item. They are practice-only because no automatic check is fair:

| why | items |
|---|---|
| open opinions, open writing, observations, "teach it back", investigations, explanations aloud | EN-SPK-T15, EN-WR-T15, SCI-WR-T13, SCI-WR-T15, SCI-SPK-T06/T12/T13/T14/T15, MA-SPK-T12/T15 (≈ 120) |
| estimates (any sensible number is right) | MA-SPK-T11 (10) |
| things browser speech recognition cannot transcribe reliably: single letter sounds, syllables, spelled-out letters, animal-sound imitations | EN-SPK-T02, T07, T10, SCI-SPK-T03 (40) |
| "anything works" gap fills and silly or taste questions | EN-WR-T12-Q09/Q10, EN-SPK-T08-Q09/Q10, EN-SPK-T13-Q09/Q10, EN-LIS-T12-Q10, EN-LIS-T13-Q09, … |

These items are graded:
- Written explanations (EN-WR-T14, SCI-WR-T06/T10/T11/T12/T14) and captions (EN-WR-T11): graded with a keyword rubric of synonyms (any one key idea; both picture elements for captions). In languages without rubric words they are ungraded.
- 38 science speaking items: graded in English only (`graded_langs: ["en"]`), because their synonym lists are English (SCI-SPK-T07/T08/T09/T11). They are ungraded in other languages.
- 20 translated speaking items: practice-only in specific languages (`ungraded_langs`). In these, the translation's own sample answer could not be matched reliably, for three reasons: Japanese keywords written in kana while recognisers return kanji, Dutch/German separable verbs, and an explanation that contains both comparatives. The items:
  - MA-SPK-T06-Q09 (ja, tr, zh)
  - MA-SPK-T10-Q01 to Q10 (mostly nl; also de, ru, id; Q09 in 12 languages)
  - MA-SPK-T13-Q06 (tr)
  - SCI-SPK-T05-Q01 to Q09 (ja; zh/it in one each)

## Excluded (11)

| id | reason |
|---|---|
| EN-LIS-T13-Q06 | "the second star" depends on the on-screen order (shuffled); the star emoji are not distinct |
| MA-RD-T09-Q01 | broken widget, and an instruction that contradicts the key; the other same/different items replace it |
| MA-SPK-T13-Q07, Q10 | story retell with no maths, in the maths module |
| SCI-LIS-T05-Q10 | the key contradicts its own feedback; contains a science error |
| SCI-LIS-T14-Q04, Q10; SCI-RD-T07-Q07 | two defensible odd ones out; the feedback in all 14 languages is written around the old words |
| SCI-LIS-T15-Q08 | the stimulus states a false fact (all polar ice is fresh water) |
| SCI-RD-T03-Q06 | no option shows a chrysalis (the key is a nest) |
| SCI-RD-T04-Q05 | two defensible pairs (sun + plant, sun + moon) |

## Added content

- **Starter items, level 0 (95).** There are eight per subject × mode (seven in science write), all `age_band: "all"`, graded and verified. Examples:
  - Hear "The cat is sleeping." and pick which animal is sleeping.
  - Read "The sun is hot." and answer: what is hot?
  - "I ___ happy." (answer: am)
  - Say "apple".
  - 2 + 2, "What is four minus one?", "What number comes after six?"
  - "Sam has two apples and gets one more…"
  - Which one do we see with? Plants need water to grow, so what do plants need? Type the word for 🐄. Say what you see: 🐝.

  The maths and science starters are fully translated into all 13 languages, including spoken text, options, answers, hints, keywords and sample answers.
- **Maths stretch, levels 6-8 (27).** Negative numbers, fractions/decimals/percentages, ratio, one- and two-step equations, powers and roots, in Listen, Read and Write. Every key is recomputed from its definition by `test/content-stretch.test.js`. Maths Speak has no stretch items yet, so its content ceiling is level 5.

## Remaining warnings (not fixed, judged minor)

- MA-LIS-T10-Q07: "His sister washes 5 more" could be read as 5 more than Leo. That total (17) is not an option, so the item still works.
- MA-LIS-T09-Q07: the audio is muddled ("2 pairs, 4 pairs…").
- MA-RD-T13-Q03: "weather this week" adds up to 9 days.
- SCI-RD-T10-Q01: the options say "(bigger)" for a sentence about weight.
- Some science items still say "cocoon" for butterflies, in MCQ options where no "chrysalis" option competes.
- EN-LIS-T08 and EN-LIS-T11: Listen items whose options are printed words, so listening is not strictly needed. EN-LIS-T11 duplicates EN-RD-T05 (now both at level 2).
- Translated science explanations (rubric) and English-only synonym lists: the items are practice-only in other languages rather than graded.
- Coverage gaps the engine will report as a content ceiling:
  - Science speak has no graded items above level 3.
  - Science write has none at level 5 (it is open writing).
  - Science listen tops out at level 4.
  - `maths.multiplication` has no items yet.

## Final verified inventory

Served items (verified, not excluded) by level, as graded + practice-only. Every served item
has `qa.status: "verified"`.

| subject × mode | L0 | L1 | L2 | L3 | L4 | L5 | L6 | L7 | L8 | total |
|---|---|---|---|---|---|---|---|---|---|---|
| English listen | 8 | 32 | 51 | 33 | 21 + 1 | 10 + 1 | – | – | – | 155 + 2 |
| English read | 8 | 20 | 40 | 30 | 40 | 20 | – | – | – | 158 |
| English write | 8 | 20 | 30 | 30 | 37 + 3 | 18 + 12 | – | – | – | 143 + 15 |
| English speak | 8 | 20 + 10 | 30 | 18 + 12 | 23 + 17 | 10 + 10 | – | – | – | 109 + 49 |
| Maths listen | 8 | 40 | 43 | 39 | 20 | 8 | 4 | 2 | 2 | 166 |
| Maths read | 8 | 24 | 43 | 52 | 20 | 10 | 4 | 3 | 2 | 166 |
| Maths write | 8 | 18 | 45 | 36 | 31 | 20 | 4 | 3 | 3 | 168 |
| Maths speak | 8 | 32 | 36 | 32 | 8 + 20 | 10 + 10 | – | – | – | 126 + 30 |
| Science listen | 8 | 46 | 38 | 41 | 21 | – | – | – | – | 154 |
| Science read | 8 | 22 | 36 | 64 | 17 | 8 | – | – | – | 155 |
| Science write | 7 | 20 | 50 | 40 + 10 | 20 | 0 + 10 | – | – | – | 137 + 20 |
| Science speak | 8 | 20 + 10 | 30 + 10 | 38 + 12 | 0 + 20 | 0 + 10 | – | – | – | 96 + 62 |
| **all** | 95 | 314 + 20 | 472 + 10 | 453 + 34 | 258 + 61 | 114 + 53 | 12 | 8 | 7 | **1,733 + 178 = 1,911** |

Age bands (served): English 475 all / 156 young; maths 456 all / 200 young; science 439 all /
185 young. "young" covers the silly/cartoon items (`joy_flavor: "silly"`) and the types
themed for young children.

## How to reproduce

```bash
cd server
node scripts/content/derive-metadata.js --dry     # "Would change: nothing"
node scripts/content/audit.js --check             # QA gate passed
node scripts/content/audit.js --json /tmp/audit.json --verbose
npm test                                          # answer-check, parity, content-bank, content-stretch, content-migration
```
