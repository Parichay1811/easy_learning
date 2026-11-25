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
- **Social (updated 25 Nov 2026):** learning together is a core part of the
  game at every age: friends, study circles, team matches and class cups.
  Competition is between **teams** and towards a **shared goal**, and
  **everybody who takes part wins something** (the rules are in Phase 5).
  Individual rank tables stay as they were: friendly leagues only for teens
  and adults who opt in. No public ranking of children.
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

## Phase 5: learning together, and competitions where everybody wins

Learners come back to a game when their friends, their team and their teacher
are in it. This phase adds group learning and group competition for every
age, built so that no child loses and every adult can see what is going on.

### The "everybody wins" rules (every item below follows them)

1. **Teams and shared goals, not children against children.** Boards show
   teams or the whole group. Inside a team each learner sees "what I added",
   never a list of team-mates from first to last.
2. **Points come from learning evidence:** right first time, a comeback after
   misses, a review remembered, a skill mastered, a discovery, a cheer given.
   Never from speed, minutes or how many days in a row.
3. **Fair by design.** Each learner plays questions at their own level, so a
   beginner adds as much to the team as the strongest learner. Teams are
   balanced by the engine and reshuffled each round.
4. **Every team that reaches the goal wins the trophy.** The first team there
   gets an extra ribbon, and that is the only difference.
5. **Every participant gets one award that is true,** worked out from their
   own evidence: Best comeback, Most improved, Steady explorer, Review
   champion, Kindest cheerer, Brave challenger, Team spark. Nobody leaves the
   ceremony without one.
6. **No last place, no penalties.** Nothing is lost by missing a day, sitting
   a match out or leaving a team. Every match has an end.
7. **No open chat between children.** Friends and team-mates talk with preset
   cheers and stickers only. No free text, voice, photos or links.
8. **Adults see everything and hold the switches.** A parent sees their
   child's friends, teams, matches, cheers and awards and can pause any of
   them. A teacher runs the groups. A school sets the policy.

### 5A. Friends and group learning

- [x] **G-501 (M) Class quests.**
  - *Done (Nov 2026): a class quest is a team match with one team (`kind: 'quest'`): one shared bar, no individual numbers (Team play tab of a group; the learner's Together page).*
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
- [x] **G-506 (M) Player card and safe friends.**
  - *Done (Nov 2026): `PlayerCard` (nickname from two word lists, avatar from a set, friend code), friends by code or from the learner's own class, both must agree, a grown-up's yes for under-13s (`Friendship.awaiting_adult`), parent view with approve and remove. `server/test/integration/together.test.js` asserts no endpoint returns another learner's email.*
  - Every learner gets a player card: a nickname they pick from friendly
    word pairs ("Brave Fox"), an avatar from a preset set, their trophies and
    their favourite world. Never their email, surname, school or photo.
  - Friends are added with a short friend code or a link, or suggested from
    the learner's own class. There is no search for other children.
  - For the `child` age band a parent or teacher approves each new friend
    (`server/models/LinkRequest.js` is the pattern). Teens and adults approve
    their own.
  - Files: new `server/models/social/`, `server/routes/social.js`, a
    "Friends" tab on the student dashboard
    (`client/src/pages/studentDashboard/`).
  - *Done when* two learners can become friends by code, an adult can see and
    remove the friendship, and no endpoint returns another learner's email.
- [x] **G-507 (S) Cheers between friends and team-mates.**
  - *Done (Nov 2026): `PeerCheer` (sticker + line from fixed lists, 5 a day, to friends and team-mates only). Shown on the Together page; a cheer to a team-mate adds one team-spirit star a day. The lines are in all 14 languages (machine translated, Nov 2026: a native reader should check them).*
  - Preset stickers and short preset lines ("Great comeback!", "You can do
    it!") in all 14 languages; a few per day, shown the next time the friend
    opens Learnigo (`client/src/components/family/FamilyLayer.jsx`).
  - Giving a cheer counts as team evidence (rule 2).
  - Reuses `server/models/Cheer.js` with a learner as the sender.
- [x] **G-508 (M) Study buddies: the same round, each in their own time.**
  - *Done (Nov 2026): buddy rounds and friendly matches (`BuddyMatch`, `/together/round/:id`): the same checkable questions at the lower of the two levels, no clock, a shared total or a ribbon and "Brave challenger", a draw gives both the ribbon.*
  - A learner invites a friend to a round. Both get the same questions and
    play when it suits them; neither sees a clock.
  - The result is one shared screen: "Together you earned 17 stars", who was
    right first time on what, and a "play again together" button.
  - A **friendly match** is the same round shown side by side: the higher
    score gets a match ribbon, the other gets "Brave challenger", a draw
    gives both the ribbon, and both keep all their stars.
  - Files: `server/services/learning/actions.js` (`round` already keeps the
    question ids of a round), `client/src/components/ModulePlayer/`.
  - *Done when* two friends can finish the same round on different days and
    both see the shared result.
- [ ] **G-509 (M) Study circles.**
  - A small group of 2 to 6 made by a teacher, a parent or (teens and adults)
    the learners themselves: a shared weekly goal, one progress bar, a shared
    discovery journal (G-205) and a team map where each skill a member masters
    lights a stop for everyone.
  - "Teach it to a friend" speaking items (transfer stage 5) are offered to
    circle members about skills a team-mate is working on.
  - *Done when* a circle's page shows its goal, its map and this week's
    contributions with no ranking.
- [ ] **G-510 (S) A family team.**
  - Parent, child and siblings as one team with a weekend family match
    (builds on G-502 and `server/services/parentFamily.js`).

- [ ] **G-519 (M) Learning pairs: a helper and a learner.**
  - A teacher pairs a learner who has mastered a skill with one who is working
    on it. The helper gets "teach it to a friend" items on that skill; the
    learner gets the engine's explanation and a buddy round on it (G-508).
  - When the learner masters the skill, both get the "Helping hand" award with
    the skill's name on it. Pairs change every week so everyone helps and is
    helped.

### 5B. Group competitions (teams, cups and matches)

- [x] **G-511 (M) Team matches inside a group.**
  - *Done (Nov 2026): Team play tab in a group; 2 to 4 balanced teams (snake draft on recent learning) or one team; stars are right answers capped at 20 a day; tests prove another group's or school's teacher and learners reach nothing.*
  - A teacher starts a match for a group: one lesson, three days or a week.
    The engine makes 2 to 4 balanced teams with fun names and colours.
  - Each learner plays their own rounds at their own level; every piece of
    learning evidence adds to the team. The board shows the teams climbing
    towards the flag.
  - Files: `server/routes/teacherClasses.js`, a "Competitions" tab in
    `client/src/pages/teacher/GroupView.jsx`, a team panel on the learner's
    Today hub.
  - *Done when* a teacher can start, watch and close a match, and the test
    suite proves a learner from another group or school cannot see it.
- [x] **G-512 (S) The closing ceremony.**
  - *Done (Nov 2026): `teams.end()` writes the trophies, the first-to-the-flag ribbon and one award per participant with its numbers (`SocialAward`); learners see it on their team card with confetti (still under less movement).*
  - When a match ends everyone sees the same celebration: trophies for every
    team that reached the goal, the "first to the flag" ribbon, and one true
    personal award each (rule 5), with confetti and the companion.
  - Awards are worked out on the server from evidence, and each award records
    the numbers behind it, like growth badges
    (`server/services/learning/achievements.js`).
- [ ] **G-513 (M) Class cups: group against group.**
  - Two or more groups of one teacher or one school play for a cup. The score
    is evidence per learner, so a small class is not at a disadvantage.
  - Every group that reaches the goal wins the cup; the school can show the
    cups on its page.
  - Governed by the school policy (G-518).
- [ ] **G-514 (M) Quiz party: a live game for the classroom.**
  - The teacher puts a join code on the projector. Everyone answers a
    question at their own level on their own device and the class fills one
    shared rocket; it takes off when the class goal is reached.
  - Ends with the ceremony (G-512). Uses polling like the rest of the app (no
    WebSockets).
- [x] **G-515 (S) Mystery explorer: a friendly match with someone new.**
  - *Done (Nov 2026): "Meet a mystery explorer": off until the learner switches it on, and for a supervised under-13 until a grown-up does; nickname and picture only; a learner can report a nickname and is never paired with it again.*
  - A learner can play a round already played by another learner at the same
    level, shown only as a nickname and avatar. Nothing is sent to the other
    learner except "someone played your round", and they cannot become
    friends or contact each other through it.
  - Both keep their stars; the result follows the friendly-match rules
    (G-508). A parent can switch it off; it is off by default in the `child`
    age band.
- [ ] **G-516 (M) Trophy room and seasons.**
  - *Partly done (Nov 2026): the prize shelf (ribbons, trophies, awards, jar stickers, each with its numbers). Seasons are not built.*
  - Team trophies, cups, personal awards and stickers live in one room on the
    player card (G-506), each with the evidence behind it.
  - A season follows the school term or the calendar month. A new season is a
    fresh start for teams and goals; nothing already earned is taken away.
- [ ] **G-517 (S) Quests for a team.**
  - The quest board (G-202) gets team quests: "five comebacks between us",
    "everyone remembers one review", "watch and answer three shorts" (G-520).
- [x] **G-518 (M) Safety switches and school policy.**
  - *Done (Nov 2026): `Child.together` switches (friends, ask me first, rounds and team matches, someone new, Shorts; the strictest guardian wins), `OrgPolicy.competitions` (off / teams) with the school setting, leave by removing a friend, report a nickname, data export and erase, start and end of a competition audited. Each has a test.*
  - **Parent:** friends on or off, matches on or off, mystery explorer on or
    off, per child (`server/models/Child.js`, next to `healthyUse`).
  - **School:** the `leaderboards` setting grows into `competitions`: off,
    teams, or teams plus the opt-in league for teens and adults
    (`server/models/admin/OrgPolicy.js`, `server/utils/orgPolicy.js`).
  - **Learner:** leave a team or a match at any time, remove a friend, report
    a nickname.
  - New collections join the data export and erase
    (`server/services/dataRights.js`), and starting or ending a competition is
    audited.
  - *Done when* each switch is enforced on the server and covered by a test.

- [ ] **G-524 (L) Houses: one team for the whole school year.**
  - Every learner in a school belongs to one of four houses that cut across
    classes and ages. Everything learned adds to the house, counted per learner
    so a small house is never behind.
  - Each term every house that reaches the term goal earns the house banner;
    the school's page shows the four banners, never a table of children.
  - Governed by the school policy (G-518).
- [ ] **G-525 (M) Festivals.**
  - A few times a year a week-long event for everyone on Learnigo with one
    theme (Space Week, Story Week): a shared world goal, a festival sticker for
    every learner who takes part, team quests on the theme (G-517) and themed
    shorts (G-520).
  - It starts and ends on fixed dates, and nothing is lost by missing it.

### 5C. Shorts: a feed of small lessons to swipe

- [x] **G-520 (M) Shorts.**
  - *Done (Nov 2026): `/shorts`: each short is drawn on the AI Teacher's own board and spoken, with captions, then one question. One board for the whole feed, off-screen shorts are not painted. Keyboard: arrows, space. Frame rate on a real phone is not measured yet.*
  - A full-screen feed of 20 to 60 second lessons from the AI Teacher: one
    idea, drawn on the board and spoken, then one "now you try" question. Swipe
    up for the next.
  - Built from the AI Teacher's topic packs for the learner's level
    (`server/ai-assistant/packs/`, the same lessons the AI Teacher gives) and
    its 3D loops (`server/ai-assistant/public/renders/`), with captions and the
    comfort settings. Topics marked sensitive are left out, and reviewed packs
    come first (3 of 4,308 are reviewed today, see G-701).
  - *Done when* the feed plays on a phone at 60 frames a second with the
    camera games' performance budget, and works with a keyboard and a screen
    reader.
- [x] **G-521 (S) A feed that follows what the learner likes.**
  - *Done (Nov 2026): "My topics" picks and hearts; half the feed from favourites, half from other themes in turn. Only picks, hearts and finished shorts are stored (`ShortsInterest`).*
  - The learner picks topics they like and can heart a short. The feed mixes
    those favourites, what they are learning now (`/api/learn/next`) and
    something new.
  - Only these signals are used: no tracking across the site and nothing sold
    or shared.
- [x] **G-522 (S) Shorts end.**
  - *Done (Nov 2026): a break card every 8 shorts (stretch, try a round, or stop), the next short never starts by itself, and quiet hours and the daily limit cover `/shorts` and `/together`.*
  - After a set number of shorts a break card suggests a stretch, a round on
    what was just watched or stopping for today, and the parent's healthy-use
    limits apply (`Child.healthyUse`). No endless autoplay.
- [ ] **G-523 (S) Shorts for a group.**
  - A teacher pins shorts for a group ("watch before Friday"), and a team
    quest can be "watch and answer" (G-517).

- [ ] **G-526 (M) Watch together.**
  - A teacher or a study circle (G-509) picks a short; everyone watches it on
    their own device or the projector, answers the "now you try" question, and
    the group sees how many got it (a number, never names) before the teacher
    explains.

### 5D. Easy to see for parents and teachers

- [x] **G-530 (M) "What they love" for parents and teachers.**
  - *Done (Nov 2026): `InterestsCard` on the parent's Together tab and the teacher's student page ("What they love"), and a group card in Team play. The picks sheet tells the learner their grown-ups and teacher can see their topics.*
  - One card answers "what is my child into?": favourite topics and subjects,
    shorts watched to the end and hearted, and how that changed this month,
    with a sentence on top ("Sam keeps coming back to space and animals").
  - Parents: `client/src/pages/parent/ParentLearning.jsx`. Teachers: the
    student view and a group summary ("this class loves volcanoes").
  - The learner is told that their grown-ups can see this.
- [x] **G-531 (M) A "Together" page for parents.**
  - *Done (Nov 2026): the parent dashboard's Together tab: a story sentence, friends waiting for a yes, friends, teams, rounds, prizes, what they love, and the switches.*
  - Friends, teams, matches played, cheers given and received, awards, and
    the switches from G-518, in the parent dashboard's story-first layout.
- [ ] **G-532 (M) Competitions for teachers.**
  - *Partly done (Nov 2026): start, watch and end a quest or match, who has joined in (name order), the awards. Not built: cups between groups, the projector view (G-538), the fairness note.*
  - Start a quest, match or cup in three taps; a projector view of the board;
    who has joined in and who has not yet (in name order, not ranked); the
    awards; a fairness note when teams are very different.
- [ ] **G-533 (S) Group learning in the teacher's insights.**
  - "Who needs a nudge?" (`server/services/learnerInsights.js`) also notices a
    learner with no team, no study buddy or no part in the last match, so
    nobody is left out quietly.
- [ ] **G-534 (S) The weekly digest tells the story.**
  - "Aanya's team reached the flag, she won Best comeback, and she watched
    six shorts about space" (`server/services/digests.js`).
- [ ] **G-535 (S) Competitions for the school.**
  - One page with every running quest, match and cup, taking part by grade,
    and the policy (G-518) (`client/src/pages/admin/school/`).

- [ ] **G-536 (S) Who is taking part: one picture for the teacher.**
  - A grid of learners by week showing whether each one took part in a team,
    a buddy round or a quest: filled or empty, in name order, with no scores.
    Empty rows are the learners to invite next.
- [ ] **G-537 (S) Safety notices for grown-ups.**
  - A parent hears when their child has a new friend request, a new friend, or
    reports a nickname, and a teacher when a learner leaves every team. Each
    notice opens the page where they can act on it
    (`server/utils/notify.js`).
- [ ] **G-538 (S) A projector view for the classroom.**
  - The board of a match, a cup or a quiz party full screen: big team bars, the
    flag, the time left and the ceremony, readable from the back of the room.
- [ ] **G-539 (S) A report to share.**
  - The parent report and the teacher's class summary gain a "Learning
    together" page: teams joined, awards, friends' rounds and favourite topics
    (`server/services/reportData.js`).

### 5E. A game learners want to come back to

"Addictive" here means learners choose to come back because it is good, not
because they are afraid of losing something. The guardrails at the top of this
file still hold.

- [ ] **G-540 (S) The team on the Today hub.**
  - *Partly done (Nov 2026): shortcuts on Home (a waiting round, the team's distance to its flag, a new award, friend requests, cheers) and a "waiting for you" banner first on the Together page. Not yet on the dashboard's Today tab.*
  - "Your team is 12 stars from the flag" and "Mia sent you a cheer" sit next
    to "what next". Friendly facts only: never "your team is waiting for you"
    or "don't let them down".
- [ ] **G-541 (S) A weekly rhythm.**
  - New teams and a new quest on Monday, a ceremony on Friday, shorts and
    discoveries every day. Something to look forward to that always ends.
- [ ] **G-542 (S) Things to collect together.**
  - Team stickers and album pages (G-516) that fill in from shared learning,
    with known rewards and no random boxes.
- [ ] **G-544 (S) A warm welcome back to the team.**
  - After days away the welcome message (`/api/learn/welcome`) says what the
    team did meanwhile and what is waiting ("Your team earned its trophy. A new
    quest starts Monday"), never what the learner missed.
- [ ] **G-545 (S) Celebrate each other.**
  - When a friend or team-mate earns a trophy or masters a skill, a learner
    can send a cheer in one tap from the Today hub (G-507).
- [ ] **G-543 (S) Measure the right thing.**
  - Learners who come back within 7 days, rounds they choose themselves,
    learners taking part in a team, learners left out, right-first-time
    growth. Never minutes on the app.

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

- [x] **G-607 (M) Show me where to tap.**
  - *Done (Nov 2026): `client/src/components/guide/`: a pointing hand and a glow on the one
    marked next step of a page, and the instruction said aloud once (after whatever is
    being said). It hides on any touch, returns after a quiet while, keeps still under
    less movement, and has its own comfort setting. Marked so far: Home, the subject
    sheet, the end of a round, the Today hub, Games, Together and its sheets, Shorts.*
  - A child who does not follow the words still sees where to go; every learner page
    marks ONE next step (`useGuide`).

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
