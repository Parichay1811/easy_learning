# How every Learnigo question is written (content v5)

This is the rubric every question, narration script, hint and lesson-pack quiz follows. It is
written so that a paediatrician, a speech and language therapist, an educational psychologist or
a special-education teacher can check our work against it. The QA gate (`audit.js --check`) and
the tests enforce the rules that a machine can check. People review the rest.

Learnigo is for children who find reading, writing or maths hard. That includes dyslexia, DLD
(developmental language disorder), ADHD, autism, dyscalculia and dyspraxia, and children who
simply have not got there yet. It is also for teens and adults who are beginners. We never ask
for a diagnosis and never name a condition to the learner.

## The 12 rules for every question

| # | Rule | Why | Source |
|---|---|---|---|
| 1 | **One idea per sentence, short sentences, everyday words.** Levels 0-2: at most 8 words per sentence. | Short sentences lower the load on working memory. Easy-to-Read is the European standard for readers with intellectual and learning disabilities. | Inclusion Europe, *Information for all* (2010); ISO 24495-1:2023 Plain language; BDA *Dyslexia Style Guide* (2023); NALA plain English guidance (Ireland) |
| 2 | **Literal language. No idioms, metaphors or riddles in the instruction.** "Listen to the word", never "catch it with your ears". | Autistic learners and learners with DLD often take language literally, and figurative phrases cost them processing time. | Vulchanova et al. (2015), *Frontiers in Human Neuroscience* 9:24; Bishop et al. (2017), CATALISE, *JCPP* 58(10) |
| 3 | **The action comes first, with the same verb every time.** Listen, Look, Read, Count, Tap, Drag, Type, Say, Put in order, Match, Sort, Think. | A small, fixed instruction vocabulary is predictable. Seeing the same word with the same icon, while hearing it, builds sight-word recognition without teaching it. | Ehri (2014), *Scientific Studies of Reading* 18(1); Paivio, dual coding; Mayer (2021), signalling principle |
| 4 | **At most two steps in one instruction at levels 0-2, three after that.** | Instructions longer than a child's working memory span are lost part-way through. This is the most common reason a capable child "fails" an item. | Gathercole & Alloway (2008), *Working Memory and Learning* |
| 5 | **Pictures before symbols.** In maths, objects, then pictures, then numerals. Emoji and counters carry the meaning wherever they can. | The concrete-pictorial-abstract sequence (Bruner) underpins Ireland's Primary Mathematics Curriculum (2023) and the Singapore approach. | Bruner (1966); NCCA PMC (2023); Clements & Sarama (2014), learning trajectories |
| 6 | **Test one thing.** A science question never becomes a spelling test. A maths question never needs reading beyond the learner's level. | Universal Design for Learning: give several ways to show what you know, and keep barriers that are not the point of the task out of the way. | CAST, *UDL Guidelines 3.0* (2024) |
| 7 | **Follow the developmental order.** Sounds: syllables, then rhyme and onset, then single sounds (first, last, middle), then blending, then changing sounds. | Phonological awareness develops from large units to small ones. Skipping steps produces failure that looks like inability. | Anthony, Lonigan, Driscoll, Phillips & Burgess (2003), *Reading Research Quarterly* 38(4); National Reading Panel (2000); IDA Structured Literacy |
| 8 | **Two or three choices at levels 0-2.** Three is the norm, and more only for teens and adults. | Each extra option adds reading and comparison load, and young learners guess more as options grow. *Product decision.* | Hick-Hyman law (choice time grows with the number of options) |
| 9 | **No negation at levels 0-2.** "Which one is NOT…" only from level 3, and the word NOT is in capitals. | Negated sentences take young children longer to understand, and they mislead children with language difficulties. | Nordmeyer & Frank (2014), *Journal of Memory and Language* 77 |
| 10 | **Never give the answer away.** The narration, the picture badge and the prompt never contain the answer or what the item tests. | Otherwise the item measures nothing, and mastery is inflated. | Existing QA gate (`narration`, `badge`, `round_trip`) |
| 11 | **Kind, true and safe content.** No food shaming, no frightening scenes, no "stranger danger", and diverse names and families. | Paediatric guidance: food is "everyday" or "sometimes", never "bad". Children learn to check with a trusted adult. | HSE/safefood healthy eating guidance for children; NSPCC "talk PANTS" approach |
| 12 | **Local and fair.** Money appears in the learner's currency, measures are metric, and the spelling is Irish/UK English. | A child in Dublin should not count pence, and a child in Berlin should not read "Pence". | Ireland PMC (2023); content v5 money tokens (see *Regional rules*) |

## Narration v2: the spoken script

Each question has one spoken script (`narration`). Captions show it word by word, and the
**action strip** shows its steps as icons with their words. Version 2 replaces the longer,
story-styled scripts of v4.

| Level | Most words | Most sentences | Most words per sentence |
|---|---|---|---|
| 0-2 | 12 | 3 | 8 |
| 3-5 | 18 | 3 | 10 |
| 6-8 | 24 | 3 | 12 |

The rules:
- **Shape.** Every sentence starts with an action verb or is a short question ("Which animal is sleeping?").
- **Tone.** No "!", no "Let's", no "Time to…", no story or game framing such as detective, adventure, mission, riddle, secret or magic.
- **Options.** The narration never reads the options. Pictures carry them, and on maths and science items a child can tap 🔊 beside a written option to hear it. On English items the written words are what is taught, so they are not read out.
- **Cues.** `narration.cues` lists 1-3 action keys, in order. The strip on screen shows them as icon and word: 👂 Listen, 👀 Look, 📖 Read, 🔢 Count, 💭 Think, 👆 Tap, ✋ Drag, ⌨️ Type, 🗣️ Say, 🔀 Order, 🔗 Match, 🗂️ Sort.
- **Unchanged.** Every v4 rule still applies: it never gives the answer, never reads the audio of a listening item, and never reads the card text of a reading item.

| Before (v4) | After (v2) | Cues |
|---|---|---|
| "A word is hiding inside the sound you're about to hear. Catch it with your ears, then tap the word on the screen that matches." | "Listen to the word. Tap the word you hear." | listen, tap |
| "Time to be a sound detective. Listen to the word, then check each choice on the screen." | "Listen. Tap the word that sounds the same." | listen, tap |
| "Spelling adventure. Look at the picture, work out what it is, and type the word." | "Look at the picture. Type its name." | look, type |
| "Let's begin. Read the sum on the card, work it out, and tap your answer." | "Read the sum. Tap the answer." | read, tap |

Translations are built from the item's own translated instruction, with no story intro or outro,
so they are just as short. The same cue keys apply in every language. The strip's words are
translated in the interface files (`questions.cue.*`).

## The difficulty staircase

**Levels** (0-8) say how far into a subject an item is. **Stages** (0-5) say what kind of thinking
it asks for: everyday curiosity, recognition, understanding, application, reasoning, transfer.
Within a skill, the engine climbs both slowly. It starts each skill with recognition and two or
three choices, moves to recall (typing, saying), then to using the idea, then to explaining it.

| Subject | The order we follow |
|---|---|
| English: sounds | listening for words → syllables (clap the beats) → rhyme → first sound → last sound → middle sound → blending → segmenting → changing a sound |
| English: reading | picture-word match → letter sounds → short regular words (CVC) → word families (cat, hat, mat) → sight words → sentences → short texts → inference |
| English: writing | letter tiles → short regular words → word endings → sentences with capitals and full stops → two or three sentences |
| Maths: number | subitising (seeing small amounts at a glance) and counting to 5, then to 10 → one more and one less → adding and taking away within 10 → within 20 → place value and to 100 → multiplying → fractions → negative numbers, ratio, equations, powers |
| Maths: shape, time, money | name shapes → o'clock and half past → quarter past and quarter to → coins and simple totals → change |
| Science | notice and name → sort and compare → cause and effect → predict → plan a fair test → explain |

## Wellbeing, health and safety wording (the paediatric review)

- **Food.** Foods are "everyday foods" or "sometimes foods". We never say "bad" or "junk", and never mention weight or calories to children.
- **Bodies and feelings.** All feelings are allowed. Questions ask what helps (a slow breath, telling someone), never what is "wrong" with a feeling.
- **Safety.** The safe choice is to stop and tell a trusted adult. There is no "stranger danger" framing, and no injury described in detail. Medicines come only from a trusted adult.
- **Fear and loss.** No death, abandonment or punishment scenes in children's items.
- **Inclusion.** Names from many backgrounds (Aoife, Sam, Amira, Kofi, Mei, Lukas), different family shapes, and no gender stereotypes about jobs, colours or toys.

## Regional rules

- **Money** is written as tokens in the bank: `[[m:20]]` (20 of the small unit) and `[[M:45]]`
  (45 of the main unit). The server fills them in for the learner's currency. Symbols go on
  screen (20c, 20p, 20¢, €45, £45, $45) and words in what is spoken ("20 cent", "20 pence",
  "20 cents"). Currencies with no small coin in daily use (yen, won, rupiah, dong) show the
  amount in the main unit. The currency comes from the learner's country, and follows the
  language when the learner changes it (see `client/src/utils/region.js`).
- **Measures** are metric everywhere.
- **Spelling** is Irish/UK English (colour, maths, centre).

## Standards alignment

Each skill is mapped to the Irish curricula (Primary Language Curriculum 2019, Primary Mathematics
Curriculum 2023, the Science, Technology and Engineering specification 2025 / Primary Science
1999, Junior Cycle Mathematics), the National Curriculum in England, the US Common Core and NGSS,
the CEFR for English, and adult levels (NFQ 1-3, CCRS). See [STANDARDS.md](STANDARDS.md). The
mappings are `proposed` until a qualified teacher has reviewed them.

## What we do not claim

Learnigo is a learning tool. It is not a diagnosis, an assessment of a condition, a therapy or a
treatment, and it is not endorsed by any curriculum body. "Mapped to" means we chose the
curriculum outcome each skill practises. Research is cited for why each rule exists. The
thresholds marked *product decision* are ours to test with real learners (see RESEARCH.md).
