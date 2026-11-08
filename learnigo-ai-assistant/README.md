# Learnigo live teacher

A website where a student talks and a teacher answers at once with a drawn,
narrated mini-lesson. The student can talk over the teacher at any time: it
stops mid-sentence, listens, and carries on, repeats, or answers the new
question. It talks back like a person: small talk, half-finished sentences,
"Do you mean…?" when it is unsure. It asks questions only when the student
asks for a test ("quiz me on circles", "test me for GCSE maths"): it confirms
how many, asks them one by one, marks each with the reason, and ends with
the score and the topics to look at again.

A standalone project with its own repository: it needs Node.js 20.11 or
newer and nothing else. The small language model runs inside the server
(llama.cpp through node-llama-cpp, prebuilt for macOS, Linux and Windows), so
`npm install && npm start` is the whole setup on any server.

**The look:** a dark, technical 2.5D scene (a particle network, a perspective
grid floor and aurora glows at different depths, drifting against the mouse
or the phone's tilt), a glass "holo" board that tilts in 3D with neon line
work, and the teacher as a WebGL plasma orb that listens, thinks and speaks
in its own colours and pulses with the voice. The screen edge glows while the
student talks. It is one screen that never scrolls, on any device and either
way round: the board keeps 16:9 and takes the largest size that fits above its
caption, the side panel and chat fit what is left, and phones stack them in a
column. Every moment that matters has a haptic: vibration patterns on
Android, the switch trick on iPhone (iOS 17.4+; reported patched in 26.5),
and a visual pulse for everyone. Motion uses GSAP (free licence) and stays
still for "reduce motion".

Everything runs on a CPU, free and small enough for an ordinary CPU server:

| Part | Model | Size | Speed measured here (busy M3 Max CPU) |
|---|---|---|---|
| Hearing | Moonshine base (fp32), 4 guesses checked against the lessons | ~250 MB | ~320 ms for a question with the checks; 94% of hard lesson words (73% before) |
| Voice | Supertonic 3 (5 steps) | ~400 MB | ~1.5 s for 7 s of speech, about 2x Kokoro |
| Finding answers | bge-small embeddings + BM25 | 33 MB | ~6 ms; 20/20 on `eval.json` |
| Talking outside the packs | Qwen3.5 0.8B Q4_K_M in-process (node-llama-cpp) | 533 MB | first words ~0.4–1 s on CPU |

```bash
cd learnigo-live-teacher
npm install
npm start
```

Open http://localhost:4173 in Chrome, press **Start the lesson** and allow the
microphone (headphones work best). The admin panel is http://localhost:4173/admin,
the MCP server http://localhost:4173/mcp. The first start downloads the
Moonshine, Supertonic, bge-small and Qwen3.5 0.8B models (about 1.2 GB) into
`~/.cache/learnigo-teacher/models` (`LT_CACHE` to move it). New packs are
picked up within a minute, without a restart.

## How a question is answered

```
mic → voice detection (browser) → Moonshine (server, own process): its 4 best guesses,
      checked against the lessons and the sound (lib/heard.mjs, below)
    → router (lib/router.mjs), cheapest first, each step only if the one before has no answer:
        rules       controls ("stop", "go on", "repeat"), answers to the question on screen,
                    numbers + a shape → a maths template, small talk, half sentences   ~5 ms
        open data   a word's meaning, a formula, a picture, earthquakes, weather,
                    a country's figures over time (lib/opendata.mjs)          ~0.3–1.5 s
        knowledge   hybrid search over every pack's cards (common questions and
                    their other phrasings, lessons, quizzes, maths tools)            ~6 ms
                    score ≥ 0.6: teach that card
        open data   a fact a lesson does not hold: a number, a date, a person, a place
                    score ≥ 0.47: "Do you mean …?"
        Wikipedia   the article on the question, read out or given to the small LLM
        small LLM   the teacher says "Ooh, volcanoes. Let me think." at once, and Qwen3.5
                    answers in a few sentences, streamed, grounded on the article or
                    the nearest cards, labelled a quick answer
        videos      nothing checked to go on: the best YouTube videos, drawn on the
                    board as cards to tap; the question goes to the admin TODO list
    → plan: steps of { say, draw }; each sentence's voice is started on the server
      the moment it is known; the board (public/board.js) draws each op on its word
```

The maths is code (`shared/solvers.js` for shapes and vectors,
`shared/arith.js` for plain sums: "7 times 8", "20% of 150", "3/4 + 1/8" in
exact fractions with the easy way to see it), the answers are checked text in
the packs. Models only find (embeddings), hear and speak, plus the small LLM
for what is not in the packs yet. So the bigger the packs, the less any model
matters. On the first test set a 0.5B chat model asked to pick the right card
got 3 in 14 right, Qwen3.5 0.8B got 11 in 14 in 9 s, and hybrid search 20 in
20 in 6 ms. With 4,300 packs and questions from the bachelor's courses added,
hybrid search finds 28 in 30 in about 80 ms (`eval-kb.mjs`; a question can
have several right cards now that more packs answer it).

**Sturdy by design:** a crashed speech model is started again and the
teacher carries on; files are written whole (temp file, then rename), so a
crash never leaves half a file; a broken pack or a cut-off cache file is set
aside, never fatal; POSTs from other websites are refused; a failed answer
stream ends with a line instead of leaving the teacher thinking.

## Pops on the board, voice kept clear

The board makes a little sound for each thing it draws, on the frame it
appears and panned to where it is: a whoosh as a picture slides in, a pop for
each row or node (rows climb a pentatonic scale, so a list sounds like
do-re-mi), a sparkle for a title or a big number, a soft tick for a line of
text, and the quiz sounds for right and wrong. They are made in code
(`public/voice.js`, `SYNTH`), each under a third of a second.

The voice stays easy to follow:

- it goes through a clarity chain: rumble off below 75 Hz, +3 dB around 3 kHz
  where consonants live, a gentle compressor so quiet words are not lost;
- pops are on a bus of their own, about 23 dB under the voice and 6 dB lower
  still while the teacher talks; two pops never land within 70 ms;
- a limiter at the end keeps the mix from clipping.

Checked by sending lesson sentences through the recogniser with a sound every
0.3 s on top (far busier than a lesson): no extra mistakes, even with the
ducking off. The clarity chain on its own took word errors from 5.9% to 4.4%.
The Sounds button turns the pops off (remembered per device); the voice is the
same either way.

## Hearing the lesson's words

A speech model writes what words sound like, and it has never seen the
lessons: "explain seven and theorem" (Thevenin), "why does a conqueror kill
himself" (Okonkwo), "Portugal and spawn" (Spain), "what is face" (phase). So
hearing is told what the student is learning and checks its guesses against
the lessons:

1. **Best of several.** The recogniser keeps its 4 best guesses (a beam
   search written in `lib/hearing.mjs`, since transformers.js keeps one).
2. **Sound-alike lesson phrases.** In each guess, spans of 1–4 words are
   compared by sound (a Metaphone-like key: "the venom" 0FNM, "Thevenin"
   0FNN) with the phrases of the lessons: keywords, short titles, names.
   The open lesson, its module and the questions on screen come first
   (the page sends them with the recording).
3. **Checked twice.** Every version is searched in the knowledge base
   (one embedding batch against a shortlist of cards) and scored against
   the recording itself (the decoder reads each sentence back). A version
   replaces what was heard only when it finds a lesson clearly better and
   the sound supports it ("happens" → "hollow bones" finds a lesson about
   birds, but sounds nothing like it). Commands, quiz answers and numbers are
   never reworded.
4. **Whisper reads the lesson first.** With `LT_ASR=whisper` the lesson's
   title, keywords and the questions on screen are given as Whisper's prompt
   (the text "said just before"), so it spells the lesson's words itself.
5. **Tap to fix, remembered.** What the teacher heard is shown in the chat:
   tap it to correct it, or tap one of the other guesses under it. The
   question is asked again and the change ("the venom" → "Thevenin") is kept
   in `data/heard-fixes.json`, applied to everything heard from then on and
   added to Whisper's prompt. The admin page lists them, with Forget.

Measured with `node test/asr-eval.mjs` on 81 recorded questions from the
bachelor's lessons (45 asked out of the blue, 30 inside the open lesson, 6
mishearings from the question log) in Indian, British, American, Australian
and Irish English voices with a little noise, plus 12 everyday questions that
must come out as said:

| Hearing | Hard lesson words right | Right lesson found | Everyday kept | ms a question |
|---|---|---|---|---|
| Moonshine alone (before) | 90/123 (73%) | 60/80 (75%) | 12/12 | 51 |
| **Moonshine + all of the above (default)** | **116/123 (94%)** | **71/80 (89%)** | 12/12 | 312 |
| Whisper base alone | 97/123 (79%) | 63/80 (79%) | 12/12 | 272 |
| Whisper + the lesson as its prompt | 107/123 (87%) | 65/80 (81%) | 12/12 | 285 |
| Whisper + prompt + all of the above (`LT_ASR=whisper`) | 116/123 (94%) | 70/80 (88%) | 12/12 | 738 |

Moonshine stays the default: as accurate overall at under half the time.
Whisper with the prompt is the best inside an open lesson (41 of 41 hard
words, 29 of 30 right lessons, against 39 and 28) and slower on a CPU;
Whisper small (`LT_ASR=whisper-small`) was 94% and 88% at about 1.1 s. The
checks still slip on a word that sounds like another lesson's ("current law"
→ "Carnot law"), which is what tap to fix is for. Synthetic voices are only
a stand-in: real students' corrections show up on the admin page.

## Every topic has its picture

Each lesson opens on the picture that shows what its topic is
(`shared/topic-visuals.js`, chosen from the curriculum row's title and
subtopics): an animated simulation for physics and maths concepts
(411 of them, including the 26 explainer engines, the newest three for
engineering lessons: `x-circuit` a solved schematic with moving current,
`x-beam` a loaded beam with its reactions, shear, moment and deflection
diagrams, and `x-plot` a true graph with numbered axes; `public/sims-physics.js` 45, `public/sims-maths.js` 44,
`public/sims-more.js` 43 for computing, biology, chemistry, geography,
economics and English, `sims-engineering.js` 18 (pulleys, gears, bridges,
a four-stroke engine, a wing's lift, hydraulics, a dam, the power grid,
maglev…), `sims-body.js` 19 (the skeleton, the eye, the ear, a reflex arc,
the immune system, vaccines, an X-ray, the ECG, sleep stages…),
`sims-kids.js` 23 (life cycles, day and night, seasons, dinosaur sizes,
ocean zones, rainbows, shadows, moon phases…), `sims-kids2.js` 17 (a chick
hatching, an insect's body, a spider's web, an ant colony, seeds travelling,
ice to steam, snowflakes, the planets in a row, a trip to the Moon, habitats,
fossils, a whale breathing…), `sims-kids3.js` 19 (mixing colours, an alphabet
train, adding apples, taking away, halves and quarters, odd and even, coins,
scales, symmetry, traffic lights, ways to travel, instruments, feelings,
people who help us…), `sims-faith.js` 20 (world religions and sacred books:
when each began, their symbols, the sacred books on a shelf, the Gita's
chariot, Rama's journey, the Five Pillars, the Eightfold Path, the ten Sikh
Gurus, festivals of light, places of worship, the Golden Rule; no faith's
God, prophets or founders are ever drawn as figures), `sims-bio2.js` 20 (the
tree of life, peppered moths, a zoom from body to DNA, protein synthesis,
meiosis, CRISPR, Dolly, mass extinctions…), `sims-philo2.js` 20 (Plato's
Forms, the first-cause and design arguments, the problem of evil, Pascal's
wager, Nagasena's chariot…), `sims-history.js` 20 (the Great Pyramid,
Mohenjo-daro, Gutenberg, the trenches, Apollo 11, the Berlin Wall, India's
independence…), `sims-arts.js` 18 (the treble stave, chords, the colour
wheel, perspective, punctuation, iambic pentameter, the Globe…) and
`sims-space.js` 18 (eclipses, tides, a black hole, the Milky Way, the ISS,
light-years, a deep field…), `sims-philosophy.js` 22
(Plato's cave, the trolley problem, the ship of Theseus, Zeno, Kant, Rawls,
the prisoner's dilemma, the Chinese room, the Stoics…) and
`sims-mindtech.js` 19 (Pavlov, Skinner, Asch, Milgram, Piaget, a chatbot
predicting the next word, GPS, passwords, qubits…); every brief maths and
physics topic has one, and so does every engineering, medicine, body,
kids, philosophy and technology topic (some as a flow, tree or table);
`node test/visual-coverage.mjs` lists the
rest, which open on a Wikimedia picture; `/dev/sims.html?file=sims-maths.js`
shows them side by side), the real shapes for geometry (2-D shapes
with equal sides ticked, right angles and lines of symmetry; 3-D solids that
turn, with faces, edges and vertices), orbits for the solar system, a map for
places, an atom for an element. Chat answers and short answers pick a
simulation from the concept they name.

**Answers for everything else** come from Wikipedia's public API
(`lib/wiki.mjs`; no key; text CC BY-SA 4.0, which allows commercial use with
credit). Simple English Wikipedia, written for learners, is read out as it
is; an English article is rewritten simply by the small model, which is
given its facts. Every such answer says "From Wikipedia" on the board and
links the article under **Learn more**. Lookups are cached for a month in
`data/wiki.json` (`LT_WIKI=off` turns this off). Google Images has no free,
key-less API and its terms forbid scraping, so pictures come from Wikimedia
Commons instead: only files whose licence allows commercial use (public
domain, CC0, CC BY, CC BY-SA), each credited with its author and licence
under the picture.

The question is cut to its subject before searching ("Come on, show me what
is bubble sorting" → "bubble sort"). The article named exactly that comes
first, so "bubble" is not "AI bubble". A word with several meanings is asked
back ("Which bubble?"), with a tap-able button for each meaning; a meaning
the board can animate comes first. "Why", "how", "who", "when" and "where"
questions are answered from the whole article, not just its summary: the
sentences that give the reason, the person, the year or the place. The small
model is never allowed to refuse a fair question. If its first sentence is
"I can't answer that", it is stopped and the article is read out instead.

**Your own articles (optional):** a [Wiki.js](https://js.wiki/) site can hold
the school's own pages; they are searched before Wikipedia and read as
written. Set `LT_WIKIJS_URL` (the site), `LT_WIKIJS_TOKEN` (an API key with
read access) and optionally `LT_WIKIJS_NAME` (shown as the source). Wiki.js
is AGPL and runs as its own server, so it is not part of this one.
`wikipedia-js` (kenshiro-o) was looked at for scraping and left out: it has
no licence, is 10 years old, and its full-page parser is a beta that pulls in
old dependencies. Wikipedia's own extract API gives the same clean text with
no scraping.

**A real conversation** (`lib/followup.mjs`). Every answer remembers what it
was about, so follow-ups work the way people ask them:

| Said after… | Understood as |
|---|---|
| "When was **he** born?" (Einstein) | When was Albert Einstein born? → 14 March 1879, in Ulm |
| "Who climbed **it** first?" (Everest) | the article's own sentence: Edmund Hillary and Tenzing Norgay, 1953 |
| "How many people live **there**?" (France) | France's population, as a chart since 1990 |
| "**When?**" (after "Who invented the telephone?") | When was the telephone invented? |
| "**Tell me more**" | the article's next sentences, not the same answer again |
| "Explain it **simpler**", "give me an **example**" | the model rewrites it, with the article as its notes |
| "**Show me a picture**" | a picture of what was being talked about |

A question that names its own thing ("the capital of France and its
population") is left as it is, and so is an answer to a quiz question.
Who, when and where questions are answered with the article's own sentence
that says it (scored by the question's verb, names, years and numbers; a
record like "first to climb it 30 times" does not count as "first"), never
by the small model's guess. After each answer, the buttons under the board
offer what to ask next about it ("When was Marie Curie born?", "What is
she famous for?", "Show me a picture of a volcano", "Tell me more").

**At a glance:** answers about a person, a place or a thing get a card of
key facts from Wikidata beside them (born, where, died, work, known for;
capital, population, area; what it is, who made it), drawn a moment after
the answer starts.

**900 interactive explainers** (`packs/HOWN` 300 on how and why things
happen in nature, `packs/ENGX` 400 on how machines and structures work,
`packs/BODA` 200 on the human body and animals). Each is a full lesson
(narrated steps, five ready questions, a quiz) drawn by one of 16 explainer
engines (`public/sims-explain.js`, spec in `packs/EXPLAINERS.md`): a process
chain, a cycle, a "why" ladder, a cutaway, a working machine, an energy
flow, forces, an anatomy map (24 silhouettes), a graph, a zoom, particles, a
flow network, a wave, a balance, sizes and a side-by-side, with about 100
drawn icons. They are interactive: every labelled part is a button, and a
tap asks the teacher about that part, answered from the lesson itself (its
own question about the part, else its own sentence that names it). Check
them with `node test/explainer-check.mjs` (the spec) and `node
test/explainer-render.mjs` (every op drawn through the engines).

**950 more explainers, taught one-to-one** (round 2, all `draft`):

- **`packs/SCH`, 600 school lessons for class 1–12:** following CBSE, Common Core, England's key stages, GCSE/IGCSE, IB and AP.
  - Primary maths, maths for class 6–10 and class 11–12.
  - Primary science, physics, chemistry and biology.
  - Geography and world history.
  - Civics and economics.
  - English and world languages and scripts.
  - Computing, and art, music and design.
- **`packs/GK`, 100 lessons:** everyday knowledge and our world.
- **`packs/SOCU`, 150 lessons:** social and human understanding, covering feelings and me, friends and family, and people and society.
- **`packs/LDS`, 100 learning-support lessons:** for children who learn differently, to use themselves.
  - Reading, writing and numbers made easier (dyslexia, dysgraphia, dyscalculia).
  - Focus and routines.
  - Social stories.
  - Calm body, calm mind.
  - "I learn my way".

Every lesson talks to one learner as "you", in very easy words with one idea per step. The narration points at what lights up on the board, asks a small check-in question, and ends with praise and a wow fact or a challenge. Seven new engines draw them:
- `x-story`: social stories with the same drawn child and a mood face in each panel.
- `x-steps`: checklists, now/next and first/then cards.
- `x-feelings`: a feelings thermometer with calm-down tools.
- `x-count`: ten frames, base-ten blocks that regroup, number-line hops, arrays, sharing into groups, fraction bars and pies, and a clock with the time in words.
- `x-word`: letter tiles that split into sounds, syllables or word parts and blend back.
- `x-timeline`
- `x-sort`: items fly into bins.

`x-balance` also has a weighing-scale mode: `pan: true`, with `hide: true` for an unknown, so an equation's answer is not given away. Learning-support lessons never use "suffer", "broken" or "slow". They name a condition only in their keywords, so grown-ups can find them, and they give no medical advice.

**400 bachelor's-course lessons** (round 3, all `draft`, level `H`): five
university courses, each eight modules of ten lessons that follow a typical
first degree.

- **`packs/BEE`, Electrical Engineering:** DC circuit analysis, AC circuits, electromagnetics, analog electronics, digital electronics, electrical machines, power systems and power electronics, signals and control.
- **`packs/BME`, Mechanical Engineering:** statics, dynamics and vibration, mechanics of materials, thermodynamics, fluid mechanics, heat transfer, machine design, materials and manufacturing.
- **`packs/BCE`, Civil Engineering:** structural analysis, concrete and steel design, geotechnics, hydraulics and water resources, environmental engineering, transportation, surveying, construction and management.
- **`packs/BLIT`, English Literature:** literary theory, Old and Middle English, the Renaissance, the eighteenth century and Romanticism, the Victorians, modernism, postcolonial and world literatures in English, genres and forms.
- **`packs/BHIS`, History:** historiography and method, the ancient, medieval and early modern worlds, the age of revolutions, the world wars, the Cold War and decolonisation, themes in modern history.

They teach hard ideas in easy words, one-to-one. Each engineering lesson
shows its key formula in the right-hand column and works one example with
real numbers that match the picture. Three engines were added for them:
- `x-circuit`: textbook schematics with current dots whose speed follows the solved current, and preset op-amp and transistor stages.
- `x-beam`: loaded beams; the engine works out the reactions, shear force, bending moment and deflected shape (`solveBeam` in the spec).
- `x-plot`: true graphs from formulas or points, including closed P–V cycles with their work and Mohr's circle on equal axes.

Literature lessons retell scenes with `x-story`, map characters with
`x-network` and compare readings with `x-compare`. They quote only short
phrases from works out of copyright and paraphrase modern texts. History
lessons put events on the world map (`map`, with 51 more historic places in
`shared/places.js`), set historians' debates side by side and mark estimates
as estimates. 66 of them open with a Blender render as their second step.

**World religions and sacred books** (`packs/RELIG`, `FAITH`, and three
older belief topics): 45 lessons with 12 to 14 checked questions each, on the
world's faiths, their sacred books and epics (the Gita, Ramayana, Mahabharata,
Vedas, Bible, Torah, Quran, Guru Granth Sahib, Tripitaka, Tao Te Ching,
Analects), shared themes (pilgrimage, festivals, symbols, the Golden Rule,
numbers from Pew Research 2020) and philosophy of religion (first cause,
design, the problem of evil, Pascal's wager, Euthyphro). Belief topics are
kept from the small local model; these were written carefully, neutrally
("Muslims believe…"), with arguments and objections side by side, and are
drafts for a person to review in the admin panel before marking reviewed.

**Learn more, on the board:** when no drawn picture fits an answer ("Tell me
something about Narendra Modi"), the board shows the sources themselves,
each one a button that opens it in a new tab: the Wikipedia article (its
picture when freely licensed, what it is, its first lines), the official
website (Wikidata's "official website", with the site's own title and
description read from its page head, like any link preview), and the two best
YouTube explainers with their thumbnails. Google results are never scraped
(its terms forbid it, and its search API needs a key). "Tell me about / who
is / what is" questions are answered with the encyclopedia's own summary;
the small model never speaks about itself ("I am sorry", "as an AI", "I will
answer your question" are dropped), and an article qualified by something not
asked ("Aeroplane (musician)") is never chosen.

**Exact answers from open data** (`lib/opendata.mjs`) for the questions a
paragraph answers badly. Every source is free, needs no key and allows
commercial use; each answer names its source and licence on the board and
links it under **Learn more**:

| Question | Source | Licence | On the board |
|---|---|---|---|
| "What does ecosystem mean?", "define gravity" | Wiktionary | CC BY-SA | the meanings, the science sense first |
| "Formula of caffeine?", "What is water made of?" | PubChem (NIH) | open data | the structure, the atoms, molar mass |
| "Population of Nigeria?", "GDP of India", "CO2 emissions of China", life expectancy, literacy, inflation… (14 kinds) | World Bank | CC BY 4.0 | a line chart since 1990 and the latest figure |
| "How tall is Everest?", "When was Newton born?", "Capital of Kenya?", "Who painted the Mona Lisa?", "Where is the Eiffel Tower?", "Who is the prime minister of Canada?" … | Wikidata | CC0 | the number or date, a picture, a map pin |
| "Show me a picture of a tiger / the Milky Way", "paintings by Monet" | Commons (via Wikidata), Art Institute of Chicago, NASA | free licences, CC0, public domain | the picture, credited |
| "Any recent earthquakes?" | USGS | public domain | this week's quakes on the world map |
| "What's the weather in Kolkata?" | MET Norway | CC BY 4.0 | the next 12 hours as a chart |

Names are found through Wikipedia, which knows a word's main meaning
("Jupiter" is the planet, not a ship once called that), then read from
Wikidata. Answers are cached in `data/opendata.json` (facts for weeks,
weather and quakes for half an hour). `LT_DATA_SOURCES=off` turns this off.
Looked at and left out: Open-Meteo (free for non-commercial use only), the
Met Museum's search (retired), DuckDuckGo's answers (unclear terms), Google
Images (no free API).

**Nothing to go on:** when no lesson, article or open data covers a question,
the small model is not asked to guess. The board shows the best videos on it
instead: one big card with a play button and two small ones, each a button
that opens the video on YouTube. A quick answer built only on lesson notes
ends with the same cards.

**Speech that spells by sound** ("photosinthesis", "pythagorus") is matched to
the curriculum's own words before searching (`lib/heard.mjs`), and a
misheard first word ("Flynn me about…") is read as "tell me about…".

**Watch next:** under the answer, up to three YouTube videos on the topic
(`lib/videos.mjs`, searched with yt-search-lib, MIT, no API key; one search a
topic a week, cached in `data/videos.json`; `LT_VIDEOS=off` turns it off).
Links open on YouTube in a new tab.

## Every answer is drawn

Every kind of answer puts a picture on the board with the words beside it,
not only tests:

- **Lessons** draw a diagram per step, from 31 kinds of figure:
  - ideas: flow, cycle, timeline, compare, venn, labelled parts, tree of
    kinds, pyramid, bullet points, big number, quotation;
  - data: bar chart, line chart, pie chart, table;
  - geography and history: a **world map** (`public/map.js`) that lights up
    the countries named, drops pins on cities, landmarks, rivers and
    mountains, and draws routes along great circles (the Silk Road, an
    explorer's voyage);
  - maths: graph of a function (`y = x^2 - 4`, parsed safely by
    `shared/expr.js`), number line, fraction, angle, balance for equations,
    and the rectangles, triangles, circles and vectors of the worked examples;
  - physics: free-body forces, a travelling wave, a series circuit with
    current flowing, orbits; chemistry: an atom with its electron shells;
    early years: counting dots.
  The board turns the page for each new diagram and keeps the title.
- **Short answers** (a pack's common questions) show the lesson diagram that
  fits the answer best, with the question and answer card beside it.
- **Chat answers** show the diagram of the pack the notes came from, or one
  made from the first sentences as they arrive.
- **Anything without a picture** gets one from `shared/autoviz.js`: plain
  rules, no model, instant. Places become a map (a journey a route), an
  equation a graph, an element an atom, percentages a pie, a fraction or an
  angle its figure, famous words a quotation, steps a flow, two named things
  a compare panel, a conversion "from, times, to", several numbers bars, one
  number a big number, anything else a concept map round the topic. Bullet
  points in older lessons give way to a map, graph or atom when the words
  call for one.
- **The map's data** is world-atlas (ISC licence; Natural Earth, public
  domain): 1:110m for the world (108 KB, loaded on the first map), 1:50m for a
  close-up of a region. `shared/places.js` holds every country's label point
  and box, other names for them (UK, USA, Persia), and about 250 cities,
  landmarks, rivers, mountains, seas and historic places.
- **Fast on any device:** everything moves on the compositor or in canvas;
  there is no live blur behind moving content (a backdrop blur or a blurred
  layer that moves costs a repaint every frame). The board measured 55 fps
  with the map animating, where the blurred version managed 10 to 16.
- **Unit conversions** ("how much is 3000 metres in centimetres") are worked
  out by `shared/convert.js`, never guessed, and drawn as a flow.

The chat panel keeps the newest message at the bottom and scrolls to it,
unless the student has scrolled back to read.

## 3D pictures made in Blender

When a lesson needs the real thing (a heart, a cell, a volcano, an engine),
the board shows a Blender render from `public/renders/` with glowing pins on
its parts. Each pin has a leader line to a tag at the picture's edge; tapping
a pin or a tag asks the teacher "Tell me about the left ventricle" (or the
part's own `ask`). The lit part's note runs along the bottom.

325 lessons whose title names a render's subject show it as their second
step ("Now let me show you the real thing in 3D: the human heart. Look at the
right atrium, the right ventricle and the left atrium. Tap any part, and I
will tell you what it does."). The pairs were picked by hand and are listed in
`factory/render-steps.json`; `node factory/add-render-steps.mjs` puts any lost
step back, for example after a writer's generator rewrote a pack.

```json
{ "op": "image", "render": "heart" }
{ "op": "image", "render": "heart", "focus": 3 }
{ "op": "image", "render": "volcano", "parts": ["Magma chamber", "Main vent", 4] }
{ "op": "image", "render": "eye", "parts": ["Lens", { "label": "Look here", "x": 0.5, "y": 0.4 }] }
```

- `render` names an entry of `shared/renders.js`; the picture, its loop, title
  and parts come from there. A plain `src` image still works as before.
- `focus` (0-based part index) keeps one part lit with a pulsing ring;
  without it the parts light up in turn.
- `parts` picks some of the render's parts (by index or label) or gives new
  ones (`label` up to 22 characters, `x`/`y` as 0 to 1 fractions of the
  picture, `note` up to 70).
- Renders with a `loop` play a muted, looping video in the canvas (the still
  shows until it can play; it pauses with the board). Parts that move in the
  loop (planets, a pendulum's bob) carry a `track` and their pins follow.
- `test/explainer-check.mjs` checks every pack's render ops
  (`imageProblems` in `shared/explainer-spec.js`): the render must exist and
  `focus` must be a part index. `/dev/renders.html?render=heart&focus=2`
  shows any render on the real board.

**The library: 87 subjects, 29 with loops** (about 14 MB in all). Science:
heart (beating), lungs (breathing), animal cell, plant cell, DNA (turning),
neuron (signal), eye, ear, tooth, skeleton, digestive system, flower, inside
a leaf, seed germination, tree and roots, butterfly life cycle (wings),
food web. Earth and space: Earth's layers, volcano (magma), plate boundary,
river course (flowing), water cycle (rain), rock cycle, solar system
(orbits), seasons, moon phases, the Sun (boiling surface), rocket stages,
satellite orbit. Physics, chemistry and engineering: atom (electrons), water
molecule, salt lattice, states of matter (particles), lever, pulleys, gears
(turning), circuit (current), bar magnet, prism, convex lens, piston engine
(four strokes), wind turbine (turning), truss bridge, pendulum (swinging).
Maths: 3D shapes, base-ten blocks, fraction pie, clock, 3D coordinates.
History, geography and society: pyramids of Giza, Roman aqueduct, Great
Wall, globe with latitude and longitude, compass (needle), printing press,
countryside to city. Daily life: a calm bedroom, packing a school bag, a
healthy plate, a classroom.

For the bachelor's-level courses: Electrical engineering: transformer
(laminated core, primary and secondary), induction motor cutaway (rotor
turning), DC motor (armature and commutator turning), the electricity grid
(power station to homes), printed circuit board, steam turbine and generator
(shaft turning). Mechanical engineering: centrifugal pump cutaway (impeller
and water), shell-and-tube heat exchanger, ball bearing, steam power plant on
the Rankine cycle (fluid going round), bending I-beam coloured by stress,
centre lathe (chuck spinning), refrigeration cycle (refrigerant going round).
Civil engineering: reinforced concrete beam, pile foundation through soil
layers, concrete gravity dam (water over the spillway), road pavement layers,
suspension bridge, water treatment plant (water, paddles and settling flocs),
total station on its tripod. English literature: Shakespeare's Globe theatre,
an illuminated manuscript. History: the Colosseum, a caravel, a Watt steam
engine (running), a First World War trench in section, the Berlin Wall and
its death strip.

**How they are made** (`factory/blender/`, Blender 5.2, EEVEE):

- `common.py` is the kit: an empty scene with EEVEE, Standard colour and a
  bloom glow (compositor RLayers → Glare → output), the site's deep-blue
  backdrop (a radial gradient for camera rays, dim blue ambient light), a
  camera, three-point lights placed from the camera, materials from the
  site's palette (hex is sRGB, converted to linear), a soft rim glow, and
  shapes: spheres, organic blobs, boxes, cylinders, tori, lathes, extruded
  outlines, tubes along curves, terrain, booleans for cutaways, and one-mesh
  swarms (thousands of objects with `bpy.ops` is slow). `finish()` renders
  the still (1200×1050, the board's 8:7 picture, WebP quality 82), renders
  the loop (120 to 144 frames at 24 fps, H.264 under 2 MB through ffmpeg),
  projects every part through the camera with `world_to_camera_view` and
  writes `meta/<name>.json`.
- `scenes/<name>.py` is one subject each.
- `render-all.sh` renders all scenes or the ones named, one at a time, then
  `build-manifest.mjs` writes `shared/renders.js` from `meta/`.

```sh
factory/blender/render-all.sh                     # everything (about 35 minutes)
factory/blender/render-all.sh heart volcano       # some
ARGS=--no-loop factory/blender/render-all.sh eye  # the still only, keep the loop
ARGS=--fast factory/blender/render-all.sh eye     # a quick half-size look
```

**Adding a render:** copy a scene of the same kind, build the subject from
the kit, name 3 to 8 parts with `P(label, at, note)` (`at` is a point, an
object, or an object and an offset, so pins follow animated objects), and
pass `anim=fn(t)` to `finish()` for a loop (`t` runs 0 to 1; make it
seamless). Run `render-all.sh <name>`, look at `factory/blender/out/<name>.png`,
and check it on `/dev/renders.html?render=<name>`. Accuracy comes first:
parts the right shape, in the right place and proportion.

## The database for all subjects

`packs/<SUBJECT>/<ID>.json`, one per topic; the format is in
[packs/SCHEMA.md](packs/SCHEMA.md). Every pack is checked by `lib/schema.mjs`
when it loads; a broken file is reported and skipped, never fatal.

**The pack factory** writes a draft pack for every topic in
`factory/topics.json` (the 1,379 topics of the curriculum brief, snapshotted
here) and `factory/topics-extra.json` (1,677 topics beyond it, for children to
adults: the human body, medicine, planet Earth, nature, everyday physics and chemistry,
engineering, little engineers for kids, space, data, philosophy, art, music, film, myths and stories,
world history, famous lives, geography, technology and AI, coding, words and
languages (Spanish, French, German, Italian, Portuguese, Mandarin, Hindi,
Japanese, Korean, Arabic, Swahili, sign language), money, law for life,
business, cooking, sport and games, the mind, citizenship, skills, making and
fixing, the environment, architecture and careers), with a local model
through Ollama, free and unattended:

```bash
npm run packs                                   # all topics; resumable
node factory/build-packs.mjs --only MATH-TRIG,BIO-CELL --limit 20
node factory/build-packs.mjs --import-brief <path to AGENTIC_CHANNEL_MASTER.md>
node factory/build-packs.mjs --spread           # one topic per subject in turn
node factory/build-packs.mjs --add-visuals      # pictures for packs made without them
node factory/build-packs.mjs --enrich           # pictures, plus an everyday example and the common mistake
```

- The model writes the correct answer as text and the factory places it, so
  an answer index can never point at the wrong option.
- Every question is then solved again independently without the answer key;
  a disagreement is retried, and a question that still fails is dropped (a
  pack keeps at least two). In the first runs this caught every wrong answer
  that got past generation.
- Generated packs are `"status": "draft"`; a person sets `"reviewed"`.
  `LT_DRAFTS=off` serves reviewed packs only. Sensitive topics (brief §16)
  and exam-format topics (facts that change yearly) are never generated.
- Progress shows in the admin panel; `factory/report.jsonl` has every result.
- Every lesson step gets a picture as well as its words: a flow for a
  process, a cycle, a timeline, a compare panel, bullet points or a big
  number. The factory hints at the kind from the step's words (dates, "unlike",
  "first ... then"), keeps only facts from the step, and `--add-visuals` adds
  them to packs made before.
- Lessons have 4 to 6 steps: the subtopics, then an everyday example and
  the most common mistake. `--enrich` adds those two steps to older packs; a
  second model call checks each one and any problem it names drops the step.
- The site and the factory share one Ollama, which here keeps one model in
  memory: while students are asking (the server touches `data/site-active`),
  the factory cancels its request and waits until the site is quiet, and
  the site asks whichever model is already loaded rather than wait for a swap
  (`lib/warm.mjs`), with the context size it was loaded with.
- About 1.5 to 3 minutes a pack with gemma4:e4b, two at a time, on an M3 Max
  shared with other work.
Give every common question the ways students really ask it (`asks`, taken
from the admin question log), add a few to `eval.json`, and run:

```bash
node eval-kb.mjs
```

Card embeddings are cached in `data/` by their text, so a big database is
embedded once.

## Tools and MCP

`lib/tools.mjs` is one registry of tools with JSON schemas: `ask_teacher`,
`search_knowledge`, `use_card`, `list_topics`, `explain_topic`,
`practice_question` and a `solve_*` per maths template. The router uses the
same pieces, and `/mcp` serves them over MCP (Streamable HTTP, JSON replies),
so Claude, ChatGPT, VS Code or any MCP client can use the teacher. Requests
from other web origins are refused.

## Files

| File | What it does |
|---|---|
| `server.mjs` | HTTP: `/api/ask` (streams ack, plan, sentences), `/api/asr` (with the lesson as context), `/api/heard` (corrections), `/api/tts`, `/mcp`, `/api/admin`, static files; reloads packs when they change |
| `lib/test.mjs`, `shared/test.js` | tests: scope (topic, subject, exam level), how many, questions, score |
| `lib/schema.mjs`, `lib/packs.mjs` | the pack check; loading packs from subject folders |
| `factory/` | topic snapshot, topics beyond the brief, the pack factory |
| `lib/router.mjs` | the steps above |
| `lib/converse.mjs` | small talk, yes/no, "I don't know", half sentences, mumbles |
| `lib/knowledge.mjs`, `lib/embed.mjs` | cards, BM25, embeddings, hybrid search |
| `lib/opendata.mjs` | exact answers from Wikidata, World Bank, PubChem, Wiktionary, NASA, Art Institute, USGS, MET Norway |
| `lib/llm.mjs`, `lib/fast.mjs` | the small LLM: streamed grounded answers; the topic for the first line (checked to be the student's own words) |
| `lib/speech.mjs`, `lib/speech-worker.mjs`, `lib/models.mjs` | Moonshine and Supertonic in their own processes, queue, cache; the model cache path |
| `lib/hearing.mjs`, `lib/heard.mjs` | the recogniser's beam search, Whisper's lesson prompt and scoring sentences against the sound; sound-alike lesson phrases, the knowledge-base check, the student's corrections |
| `lib/tools.mjs`, `lib/mcp.mjs` | the tool registry and the MCP server |
| `lib/files.mjs`, `lib/store.mjs` | whole-file writes, safe JSON loads and cache pruning; the TODO list and question log |
| `lib/vendor/supertonic.js` | Supertonic's Node inference code (MIT, unchanged) |
| `shared/` | templates, plain arithmetic (`arith.js`), numbers, unit conversion, voice detection, echo check (server and browser) |
| `public/` | the page (`app.js`, `board.js`, `voice.js` the voice and the board's pops, `orb.js` the WebGL orb, `scene.js` the 2.5D scene, `haptics.js`) and the admin panel |
| `factory/blender/`, `public/renders/`, `shared/renders.js` | the Blender kit and scenes, the 3D pictures and loops they make, and their manifest (parts projected through the camera) |
| `bench.mjs`, `eval-kb.mjs`, `test/asr-eval.mjs` | speed, how well search finds answers, how well hard lesson words are heard |

## Settings

`PORT` (4173), `HOST` (127.0.0.1), `LT_LLM` (`local`, the default: the model
inside the server; `ollama` to use an Ollama server; `off` for packs only),
`LT_LOCAL_MODEL` (a GGUF on Hugging Face, default
`hf:unsloth/Qwen3.5-0.8B-GGUF:Q4_K_M`), `LT_LLM_MODEL` (for Ollama),
`LT_VIDEOS=off`, `LT_WIKI=off`, `LT_DATA_SOURCES=off`, `LT_WIKIJS_URL` / `LT_WIKIJS_TOKEN` /
`LT_WIKIJS_NAME` (your own Wiki.js articles),
`LT_LLM_CPU=1`, `LT_FAST_MODEL` (the LLM's model, `off` for a generic first
line), `LT_TTS` (supertonic or kokoro), `LT_TTS_STEPS` (5; 3 is faster),
`LT_VOICE` (F1, F2, M1, M2), `LT_ASR` (moonshine, moonshine-tiny, whisper (base.en, reads the lesson
as a prompt) or whisper-small),
`LT_EMBED=off` (word search only), `LT_DRAFTS=off` (reviewed packs only),
`LT_CACHE` (model cache), `LT_DATA`.

## Not done yet

- Answers outside the packs come from a 0.8B model: fast, but it slips on
  details ("hot springs" for volcanoes). They are labelled and logged as TODOs;
  the real fix is a pack.
- The board is a small canvas renderer: text, formulas, simple maths figures
  and the six diagram kinds. The model still picks bullet points more often
  than the step needs.
- Barge-in with speakers depends on the browser's echo cancellation;
  headphones are the reliable setup.
- Generated packs are unreviewed drafts: the checks catch wrong answers, not
  every weak sentence. Review them, most-asked topics first (admin log).
- Health and belief topics are listed but marked sensitive: a person writes
  them, not the factory.
