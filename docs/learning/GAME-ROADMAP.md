# Game roadmap: making the whole learning experience a game

This is the todo list for turning Learnigo into one game, for young
children, teens and adults. It comes from a full check of the site in
November 2026: the learner's rounds, the dashboards, the camera games, the
AI Teacher, the engine's data, the visuals and the performance.

Each item has an id, a size (S = a day or two, M = about a week, L = several
weeks), why it matters, where the code is, and when it counts as done.
Tick the box when an item is finished and verified.

## Where we start

Learnigo already has a lot of game pieces:
- three named worlds (English Kingdom, Maths Galaxy, Science Lab);
- a Today hub with "what next", a daily discovery and mini challenges;
- a journey map of stages 0-5 and growth badges with evidence;
- 69 polished camera games with levels, ranks and badges;
- an AI Teacher that draws lessons and runs quizzes;
- an engine that knows each learner's level, mastery, reviews and misconceptions.

What's missing is one game that ties these together:
- **Rewards:** three reward systems that don't agree (dashboard XP and streak,
  camera-game points and rank, growth badges), and five unrelated ideas of
  "level" (XP level, subject level 0-8, stage 0-5, camera-game level 1-5,
  AI Teacher level codes).
- **End of a round:** a dead end, with only "Play again" and "Back".
- **Counting:** bugs that make the numbers untrue.
- **Age:** the same child-style look for every age.
- **Disconnected parts:** camera games and AI Teacher quizzes don't count
  towards learning progress.

## Decisions already made

- **Ages:** one game with three looks (Playful for young children, Quest for
  teens, Focus for adults) on today's content. New teen and adult content
  comes later (G-701).
- **Social:** co-op only for children (class quests, family quests, beating
  your own best). Friendly leagues only for teens and adults who opt in. No
  public ranking of children.
- **Rewards:** things unlock from real learning milestones. No coins, no
  shop, no random reward boxes.

## Guardrails: the game must never

- **Money:** charge money or sell anything inside the game.
- **Currency or random rewards:** use random or loot-box rewards, or an
  in-between currency. The European Commission's July 2025 guidelines on
  protecting minors (DSA Article 28) name virtual currencies and paid loot
  boxes as risks for children.
- **Punishing absence:** no lost streaks, no sad or hungry pet, no "you'll
  lose…" messages.
- **Rankings:** rank children against each other in public.
- **Clocks:** let a clock cost a learner score or stars. This is a project
  rule.
- **Playing longer:** push young people to play longer. The UK Children's
  Code (standard 13) asks services to nudge children towards breaks instead.
- **Rewarding time:** reward time spent. Rewards follow learning evidence:
  right first time, mastery, reviews remembered, misconceptions cleared.

**Research basis:**
- Sailer & Homner (2020) found gamification helps learning (g = .49 for
  cognitive outcomes). A story or "game fiction", and collaboration combined
  with competition, made the effects on behaviour stronger.
- Points and badges on their own do little.
- Deci, Koestner & Ryan (1999) found that expected tangible rewards undermine
  interest.

More in [RESEARCH.md](RESEARCH.md) §10.

---

## Phase 0: fix what breaks any game layer (do first)

These are mostly small bug fixes. A game on top of untrue numbers would
teach learners the numbers don't mean anything.

**Done (November 2026).** Every item below is finished and checked:
server, client and browser tests, including
`server/test/integration/dashboard-counting.test.js`,
`client/src/utils/warrior.test.mjs`, `client/src/utils/navMemory.test.mjs`
and `client/src/components/QuestionWidgets/marks.test.mjs`. Also in the same
change:
- **The natural voice everywhere.** The site's narrator waits for the AI
  Teacher's voice instead of switching to the browser's robotic voice when the
  server is busy. It asks again when a sentence fails, never uses the robotic
  voice because a page may not play sound yet, and fetches upcoming sentences
  at low priority (`client/src/utils/narrator.js`, tested in
  `client/src/utils/narrator-voice.test.mjs`). Only Chinese, which the voice
  model does not speak, still uses the browser's voice.
- **Multi-select retries.** On another try, the wrong picks are cleared and the
  right ones stay.

- [x] **G-001 (S) XP, minutes and sessions are counted twice.**
  - Every answer logs a 1-minute session with its XP
    (`client/src/hooks/useQuestionRound.js`, `recordAnswer`).
  - `logRound` in `server/controllers/dashboardController.js` then adds
    another 5 minutes, another session and the XP again.
  - So the daily goal ring and "lessons completed" are inflated.
  - *Done when* one round is one session with its real minutes, and XP is
    counted once. A test covers it.
- [x] **G-002 (S) Older badges are awarded silently.**
  - `log-round` and `log-session` return `newAchievements`, but no client code
    reads them. Learners only find these badges later on the Badges tab.
  - *Done when* they appear in the same toast as growth badges
    (`client/src/components/journey/GrowthToast.jsx`).
- [x] **G-003 (S) Match-the-pairs always scores "correct".**
  - `MatchPairs` in `client/src/components/QuestionWidgets/QuestionWidgets.jsx`
    only submits once every pair is right, and wrong tries vanish. Trial and
    error therefore counts as mastery.
  - *Done when* misses are sent with the answer and only a clean first try
    counts as "right first time".
- [x] **G-004 (M) Some question types never show what was right or wrong.**
  - SequenceBuilder, MatchPairs, SortBins and TypedAnswer ignore the
    `feedback` prop.
  - `drag_to_blank` and `true_false` are drawn as plain taps
    (`client/src/components/QuestionWidgets/widgetRegistry.js`).
  - *Done when* every widget marks right and wrong pieces after an answer.
- [x] **G-005 (M) Warrior mode breaks the "time is never used against a
  learner" rule.**
  - Fast answers earn bonus stars (`client/src/utils/warriorBonus.js`) and a
    timed-out question loses its star.
  - The pass mark is a fixed 6 (`finishRound` in `useQuestionRound.js`, and
    `client/src/components/RoundComplete/RoundComplete.jsx`), so a 3-question
    challenge can never pass. The Warrior switch still shows during
    challenges.
  - *Done when* it is an optional "beat your best" mode with no clock unless
    the learner turns one on, a pass mark that scales with round length, and
    no Warrior switch in challenges or discoveries.
- [x] **G-006 (S) The two badge systems contradict each other.**
  - `ACHIEVEMENTS` in `dashboardController.js` still awards streak and XP
    badges, while the growth rules say never.
  - *Done when* no new streak or XP badges are awarded (badges already earned
    stay), and the streak shows as "days you learned this week" with nothing
    lost.
- [x] **G-007 (S) The maintenance and "view as" banners cover the navbar.**
  - `client/src/components/StatusBanner/StatusBanner.module.css` sits in
    normal flow with a high z-index, while the navbar is fixed at the top.
  - *Done when* a `--banner-h` variable on `:root` moves the navbar and the
    fixed game screens down while a banner shows.
- [x] **G-008 (S) Text size is applied twice.**
  - The page font already scales with `--lp-text-scale`
    (`client/src/index.css`), and some rules multiply again (for example
    `RoundComplete.module.css`). The 1.5× setting becomes 2.25×.
  - *Done when* the inner multiply is removed and the 1.5× setting looks 1.5×
    everywhere.
- [x] **G-009 (S) Reduced motion isn't always respected.**
  - Framer's `useReducedMotion()` reads only the device setting, not
    Learnigo's own comfort setting.
  - `client/src/pages/DashboardView.jsx` wraps the page in
    `MotionConfig reducedMotion="user"`, which overrides it.
  - The background video keeps playing.
  - *Done when* one hook reads the learner's setting everywhere and the video
    pauses under reduced motion.
- [x] **G-010 (S) "Back" from a round always goes to Home**
  (`client/src/components/ModulePlayer/ModulePlayer.jsx`), even when the
  learner came from the dashboard.
  - *Done when* it returns to where the learner came from.
- [x] **G-011 (S) Small untruths and dead ends.**
  - Module tiles show made-up "30/20/15/10 XP" labels
    (`client/src/components/SubjectOverlay/SubjectOverlay.jsx`).
  - The number of camera games is given three ways (50 on the games page, 75
    on the camera-games page, 69 in the catalogue).
  - The "No questions so far" screen offers only Back.
  - *Done when* the labels are true and the empty screen suggests something
    else to do.
- [x] **G-012 (S) No error boundaries.**
  - Any error while drawing a page leaves a blank white screen.
  - *Done when* each group of pages has a friendly mascot error screen with
    "try again" and "go home".

## Phase 1: one game spine

- [ ] **G-101 (M) One progression model, with a glossary.**
  - **Player level:** comes from learning XP only (right first time, skills
    mastered, reviews remembered, discoveries), never from minutes.
  - **Existing pieces get one game name each:** subject level 0-8 becomes
    "world level", stage 0-5 becomes "zone", module stars become "area stars",
    growth badges become "trophies".
  - **New `GET /api/learn/player`:** brings together `StudentActivity`,
    `LearnerProfile`, `SkillMastery` and `StudentAchievement`.
  - Duplicate counters are retired.
  - *Done when* every screen uses these names and numbers, and a one-page
    glossary explains them to learners, parents and teachers.
- [ ] **G-102 (M) The results screen becomes the reward moment.**
  - It shows the XP bar filling, stars landing with `sfx.star` (in
    `client/src/utils/sounds.js`, not used in rounds yet), level and mastery
    progress, and new badges in place (instead of a separate toast).
  - It offers a "next quest" from `/api/learn/next` and a link to the Today
    hub.
  - It keeps keyboard focus inside and closes with Escape.
  - Files: `client/src/components/RoundComplete/`, `ModulePlayer.jsx`.
- [ ] **G-103 (M) Momentum inside a round.**
  - A positive-only combo ("3 in a row!"); a miss never shows a penalty.
  - The rising pitch and particles from the camera games
    (`client/src/ar/core/feedback.js`, `client/src/ar/core/ARStage.jsx`).
  - A special last question (a stage-up item), and a progress bar that
    celebrates when full.
- [ ] **G-104 (M) One companion character.**
  - *Partly done (Nov 2026): one live puppy across the app that sits in the layout, travels between
    pages, reacts to answers, talks with the voice and looks at what the learner reaches for
    (docs/companion/). Still to do: a name, and the robot in the AI Teacher page.*
  - The puppy gets a name and more moods than today's four (idle, wave,
    cheer, think): proud, surprised, thinking with you, and a gentle "oops".
  - It stays on screen while a question is open, and its mouth moves while
    the voice speaks.
  - The AI Teacher's robot and the separate narrator voice become this same
    companion.
  - Files: `client/src/components/Mascot/Mascot.jsx`,
    `client/src/utils/narrator.js`, `server/ai-assistant/public/`.
- [ ] **G-105 (S) Sound pass.**
  - Use `sfx.star` in rounds.
  - Optional music for each world, with its own volume and quieter while the
    voice speaks. Off by default in the Focus look.

## Phase 2: the world (the story layer)

- [ ] **G-201 (L) Explorable world maps.**
  - Each of Home's three world cards opens a map: zones are stages 0-5, stops
    are skills, and the engine opens new stops (`/api/learn/journey`,
    `/api/learn/next`).
  - `client/src/components/journey/JourneyMap.jsx` becomes clickable.
  - The old `/subject/:s` page folds into the map.
- [ ] **G-202 (M) Quest board.**
  - Today hub items become quests: carry on = main quest, review = "keep it
    fresh", discovery = daily discovery, challenge = mini boss.
  - Weekly quest chains of 3-5 steps are built on the server from engine
    signals (`server/services/learning/journey.js`,
    `server/services/learning/actions.js`).
- [ ] **G-203 (M) A light story for each world.**
  - Short chapter cards with the companion. Always skippable, in all 14
    languages, with a different tone for each look.
- [ ] **G-204 (L) Unlocks, with no currency.**
  - Companion and avatar items, map decorations and titles unlock from
    milestones: skills mastered, reviews remembered, discoveries,
    misconceptions cleared.
  - The rules live in `server/config/learning.js`. Unlocks are stored on
    `server/models/StudentAchievement.js` or a small new model, and learners
    get a screen to dress up their companion.
- [ ] **G-205 (M) Collections.**
  - A discovery journal that collects the everyday questions.
  - Skill cards for mastered skills, each showing the evidence
    (`server/services/learning/evidence.js`).
- [ ] **G-206 (M) The companion grows with mastery, never with time.**
  - It is never sad or hungry when the learner is away.

## Phase 3: three looks for three ages

- [ ] **G-301 (S) Set the age band.**
  - `ageBand` in `server/models/learning/LearnerProfile.js` exists, but
    nothing sets it.
  - Work it out from `Child.age` or `ManagedLearner.age`, or ask once at
    onboarding.
  - Learners can pick their look themselves; their choice wins, and a parent
    can also set it.
- [ ] **G-302 (L) Three looks on shared design tokens.**
  - **Playful** (young children): today's meadow, Fredoka font and puppy.
  - **Quest** (teens): darker and sleeker, "missions", a smaller companion.
  - **Focus** (adults): clean, little motion, progress numbers, companion
    optional.
  - Copy changes by look through i18n context (`t(key, { context: band })`),
    and narration style changes too.
- [ ] **G-303 (S) A theme switch, and dark mode for learner pages.**
  - The student dashboard stops forcing the light theme.

## Phase 4: connect everything to the spine

- [ ] **G-401 (M) Camera games count towards learning.**
  - Map the phonics and counting games to skills, and send their results as
    low-weight practice evidence.
  - Move camera-game badges and rank from the browser to the server, and use
    the same player level.
  - Files: `client/src/ar/core/journey.js`,
    `server/controllers/arController.js`.
- [ ] **G-402 (S) Hand-offs between learning and games.**
  - After a round, offer a related camera game as a bonus level.
  - "What next" can include game items.
- [ ] **G-403 (M) AI Teacher quiz results count.**
  - "Test me" results on topics that match a skill go to the engine and earn
    XP, and a quiz can complete a quest step.
  - Files: `server/ai-assistant/shared/test.js`,
    `client/src/pages/AITeacher.jsx`.
- [ ] **G-404 (S) Teacher-set tests use the game look and rewards**
  (`client/src/pages/TestPlayer.jsx`).

## Phase 5: co-op and safe social play

- [ ] **G-501 (M) Class quests.**
  - A teacher sets a shared goal for a group (`server/routes/teacherClasses.js`).
  - Everyone sees one shared progress bar, with no individual ranking.
- [ ] **G-502 (S) Family quests.**
  - The parent's weekly goal (`server/services/parentFamily.js`) becomes a
    quest that parent and child both see.
- [ ] **G-503 (S) Teachers can celebrate.**
  - Send a sticker to a student from the "wins" list (reuse
    `server/models/Cheer.js`).
- [ ] **G-504 (S) Beat your own best**, for everyone: race your own personal
  best, never other people.
- [ ] **G-505 (M) Friendly leagues for teens and adults only.**
  - Opt-in and off by default, limited by each country's age of consent.
  - Adds the screens behind the existing `leaderboards` school setting
    (`server/models/admin/OrgPolicy.js`).

## Phase 6: visual system, accessibility, performance

- [ ] **G-601 (L) One design system.**
  - Promote `client/src/components/dashboard/tokens.css` to the whole site.
  - Shared Button and Card components replace hundreds of hard-coded colours
    and repeated button styles.
- [x] **G-602 (M) One background system.**
  - *Done (Nov 2026): clean meadow loops of 0.5 MB, down from 7-10 MB, without the painted dog or
    butterflies, with posters; a still poster under reduced motion and focus mode (docs/companion/PIPELINE.md).*
  - Compress the 7-10 MB background videos, add poster images, and pause them
    under reduced motion.
  - Retire the 3D bricks (`client/src/components/Background3D/`) behind pages
    that cover them.
- [ ] **G-603 (M) A smaller download.**
  - Load routes and the three.js AI orb only when needed (the main bundle is
    2.8 MB).
  - Convert the subject icons to WebP (about 1.3 MB each as PNGs).
  - Delete unused images and videos.
- [ ] **G-604 (S) The splash shows on the first visit only and can be
  skipped**; page transitions get shorter.
- [ ] **G-605 (M) Keyboard and drag.**
  - Real drag in the widgets, with a keyboard alternative. Focus stays in
    place in SequenceBuilder, and SortBins chips become buttons.
  - Dialogs keep keyboard focus inside.
  - Scrollbars become visible again, and dashboard tab labels are at least
    0.75rem on phones.
- [ ] **G-606 (M) Consistency.**
  - Merge the two school-admin screens and drop `/superadmin-classic`.
  - Give the information pages, the test player and the AI Teacher the shared
    look.
  - Translate the FAQ, policy, terms and 404 pages.
  - Fix the crowded top bar of the question player below 900px.

## Phase 7: later

- [ ] **G-701 (L) Content for older learners.**
  - Extend levels and stage 5 upward; today most of the bank is for ages
    5-10.
  - Review the AI Teacher's teen and adult topic packs (3 of 4,308 are
    reviewed).

---

## How we'll know it works

For each phase, compare with the numbers before it:
- rounds learners choose themselves (`activity.chosen`);
- learners who come back within 7 days;
- right-first-time rate and mastery growth (not minutes);
- rounds that end at a natural break;
- what parents and teachers say.

Record what we learn in [RESEARCH.md](RESEARCH.md) under "What still needs
real-world testing".

## Sources

- Sailer, M. & Homner, L. (2020). [The gamification of learning: a meta-analysis](https://link.springer.com/article/10.1007/s10648-019-09498-w). *Educational Psychology Review* 32, 77-112.
- Deci, E. L., Koestner, R. & Ryan, R. M. (1999). [A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation](https://pubmed.ncbi.nlm.nih.gov/10589297/). *Psychological Bulletin* 125(6), 627-668.
- European Commission (14 July 2025). [Guidelines on the protection of minors under the Digital Services Act](https://digital-strategy.ec.europa.eu/en/library/commission-publishes-guidelines-protection-minors).
- Information Commissioner's Office. [Age appropriate design code, standard 13: nudge techniques](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/13-nudge-techniques/).
