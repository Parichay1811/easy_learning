# Design: how every dashboard looks, feels and navigates

[← Roadmap](README.md) · [Foundations](FOUNDATIONS.md) · [Parent](PARENT.md) · [Teacher](TEACHER.md) · [Admin](ADMIN.md) · [Super Admin](SUPER_ADMIN.md)

**Goal:** anyone, whether a busy parent on a phone, a tutor between lessons or a
principal in a meeting, understands their screen in **five seconds** and reaches any
detail in **three taps**. It should look as polished as the learning side of
Learnigo (Fredoka, the meadow, white rounded cards, chunky buttons, the
AI Teacher's wooden board) but calmer, because dashboards are for reading.

---

## D1. Principles

1. **Answer first, then evidence.** Every page opens with a one-sentence
   story ("Aanya learned 2 h 10 min this week, 25 min more than last week"),
   then the key numbers, then the charts, then the raw tables.
2. **Same controls everywhere.** The time-range bar, filters, drill-down and
   export button sit in the same place on every page for every role.
3. **Every number is a door.** Click any figure to see what's behind it:
   school → grade → class → student → session → the answer itself.
4. **Compare to yourself first.** Deltas compare with the previous period. Comparing a child with other children
   is opt-in, never the default for parents.
5. **Kind language.** "Practise next", not "Weak". "Needs a nudge", not
   "Failing". Celebrate effort as well as scores.
6. **Accessible and readable.** Dyslexia-friendly spacing (as on the site), colour never carries meaning alone,
   every chart has a text summary, works with a keyboard and a screen reader.

## D2. The shell: one frame for every role

```
┌───────────────────────────────────────────────────────────────────────────┐
│ ☰ LEARNIGO   [Sunrise School ▾ · Admin]   ⌘K Search everything…   🔔3  (S)│ ← top bar
├──────────────┬────────────────────────────────────────────────────────────┤
│ 🏠 Overview  │ Sunrise School › Grade 5 › 5B › Aanya R.        ⤓ Export   │ ← breadcrumb = the tree
│ 🌳 People    │ [Day][Week][Month][Year][Custom]  vs previous ▾  Filters ▾ │ ← time-range bar
│ 📊 Analytics │────────────────────────────────────────────────────────────│
│ 📝 Tests     │  STORY CARD  (one sentence + 3 insight chips)              │
│ ❓ Questions │  KPI TILES   (4–6, each with a sparkline and a delta)      │
│ 💬 Messages  │  MAIN CHART  (the one that answers this page's question)   │
│ 📣 Announce  │  DETAIL GRID (secondary charts, tables, timelines)         │
│ ⚙️ Settings  │                                                            │
└──────────────┴────────────────────────────────────────────────────────────┘
```

- [x] **DSN-001** Shared `DashboardShell` component `P0` `Platform`
  - *Done:* `client/src/components/dashboard/DashboardShell.jsx`, used by the Parent, Teacher, Admin (school) and Super Admin dashboards; bottom tabs on phones.
  - Collapsible sidebar (icons only at < 1280 px, bottom tab bar on phones). A context switcher for role / org / child (from FND-010 memberships). Breadcrumbs generated from the org tree (FND-017). A bell (FND-050) and an avatar menu.
  - It replaces the separate layouts in `pages/parent`, `pages/teacher`, `pages/admin` and `pages/superadmin`.
- [x] **DSN-002** Command palette (⌘K / Ctrl-K, the search icon on phones) `P1` `Platform`
  - *Done:* `CommandPalette` (Ctrl/Cmd+K, forgiving search, recents, keyboard and screen reader). It still has to be given items in each dashboard.
  - Search people, groups, tests, questions and pages, scoped by permissions. Recent items. Actions such as "Create test", "Invite parent" and "Open Grade 5".
- [x] **DSN-003** Time-range bar `P0` `Platform`
  - *Done:* `TimeRangeBar` + `useTimeRange` (Day/Week/Month/Year/Custom, compare, terms, state in the URL).
  - Day / Week / Month / Year / Custom, a "compare with" option (previous period, same period last year, none), and an academic-term picker for institutes. The state lives in the URL, so a link shares the exact view.
- [x] **DSN-004** Drill-down and "zoom" transitions `P1` `Platform`
  - *Done:* `DashboardShell` treats a new path, tab, view, section, id, org or child as a new level: its blocks ease in (story, then tiles, then charts, about 0.3 s). Browser Back restores the scroll position of the page you left. Reduced motion makes it instant. Built with CSS rather than shared-element animation, so it works with the app's declarative router.
  - Clicking a bar, cell or tile pushes the next level with a short shared-element animation (framer-motion, already in the client). Back returns to the same scroll position. Reduced motion means instant swaps.

## D3. Visual language for data

- [x] **DSN-010** Dashboard tokens `P0` `Platform`
  - *Done:* `tokens.css`: fixed subject and module colours, status and mastery scales, light and dark (the "Meadow" edition, see DSN-012).
  - Base: the site's Fredoka font, white cards with 24 px radius, a 2 px border and a 3D "lip". A pale sky canvas (`#f2f8ff` fading from `#dcefff`), plus a dusk dark mode.
  - **Fixed colours per subject and module, everywhere**, matching the subject worlds on the home page:
    - English `#8b5cf6` (English Kingdom purple) · Maths `#339af0` (Maths Galaxy blue) · Science `#40c057` (Science Lab green)
    - Listen `#4dc9ff` · Read `#ff9d3b` · Write `#ff6b9d` · Speak `#6bcf7f`
    - Status: good `#2f9e44`, attention `#f08c00`, alert `#e03131`, neutral `#868e96` (text uses the `-ink` variants)
  - Check every pair for colour-blind safety (deuteranopia/protanopia) and ≥ 4.5:1 text contrast. Patterns or labels back up colour on every chart.
- [x] **DSN-012** Brand look: the meadow, the puppy and toy-like controls `P1` `Platform`
  - *Done:* the dashboards no longer look like a generic admin template. Benchmarked against the site's own home page and playful education dashboards (Dribbble: "Kids Learning Dashboard: Learn, Play & Grow", "Nestly Learn", "Homeschool Dashboard"), then:
    - the real Learnigo logo and a role tag (Parent, Teacher, School, Console) in the sidebar, and the puppy alone when it is collapsed;
    - colourful icon bubbles in the menu, and the green 3D "you are here" pill from the site's top navigation;
    - the `StoryCard` became a welcome board in the meadow with the waving puppy (it dims to dusk in dark mode);
    - KPI tiles with coloured icon bubbles and a soft colour splash; mastery tiles with the castle, abacus and plant art;
    - chunky buttons (green primary, the orange "Start your adventure" CTA), chips, segmented controls and tables with a 3D lip;
    - empty states with the puppy; phones get a floating tab dock.
  - Assets: `client/src/assets/dash/` (logo 24 KB, mascot 35 KB, meadow 64 KB, all WebP). Contrast checked: white on green 4.66:1, muted text 5.4:1.
- [x] **DSN-011** Numbers `P0` `Platform`
  - *Done:* `format.js` (durations, deltas, percentages, "—" for missing data, locale-aware).
  - Locale-aware formatting. Durations as "2 h 10 min". Deltas as ▲ +12 % in green or ▼ −4 % in orange, with "vs last week" spelled out on hover and for screen readers. "—" with a tooltip when there is no data, never `NaN` or `0 %`.

## D4. Chart catalogue: the right picture for each question

Built on **Recharts** (already a client dependency) plus a few custom SVG pieces.

| Question the user asks | Component | Used by |
|---|---|---|
| "How much and how often over the year?" | **Calendar heatmap** (GitHub-style, 53 × 7, colour = active minutes) | Parent, Teacher (student), Admin (student) |
| "When do they learn best?" | **Hour × weekday heatmap** (24 × 7) | Parent, Teacher |
| "How are they doing in each subject and skill?" | **Subject × module matrix** (3 × 4 tiles: Listen/Read/Write/Speak × English/Maths/Science), colour = mastery, number = accuracy | Everyone |
| "Is it getting better?" | **Trend line** with a band for the previous period, annotated with milestones (tests, streak records) | Everyone |
| "What can they do now?" | **Skill map**: skills as chips grouped by topic, filled by mastery level, plus a "then vs now" toggle | Parent, Teacher |
| "How is the whole class spread?" | **Distribution strip / box plot** with each student as a dot (hover = name) | Teacher, Admin |
| "Who needs help on what?" | **Student × skill heatmap** (rows sortable, at-risk pinned on top) | Teacher, Admin |
| "Which questions were hard or broken?" | **Item analysis table**: % correct, discrimination, average time, most common wrong answer | Teacher, Admin, Super admin |
| "How is the school organised and doing?" | **Tree map / sunburst** of units, sized by students, coloured by engagement | Admin, Super admin |
| "Where do people drop off?" | **Funnel** (signup → first lesson → day 7 → paid) | Super admin |
| "Quick status" | **KPI tile**: big number, sparkline, delta, info tooltip from the metrics dictionary (FND-041) | Everyone |
| "What happened, in order?" | **Timeline** of sessions and events with icons, expandable to see answers | Parent, Teacher |
| "Progress towards a goal" | **Progress ring** (weekly minutes goal, test completion) | Parent, Student, Teacher |

- [x] **DSN-020** Chart kit `P0` `Platform`
  - *Done:* 13 charts plus `ChartCard` (question title, answer line, info, view as table, text summary, loading/empty/error).
  - Each chart: a title phrased as a question, a one-line answer under it, a legend only when needed, a hover/tap tooltip, an "ⓘ how is this calculated?" link to the metric definition, an accessible text summary (`aria-describedby`), a "view as table" toggle and empty/loading/error states.
- [x] **DSN-021** Story card `P1` `Platform` · needs FND-044
  - *Done:* `StoryCard`, fed by the shared insights engine.
  - The top of each overview. One sentence plus 2–4 insight chips (celebrate / info / nudge / alert). Each chip opens the chart that proves it.
- [x] **DSN-022** Celebrations `P2` `Family`
  - *Done:* `Celebration` + `useCelebrateOnce`; Parent milestones use it.
  - Milestones (first mastered skill, 7-day streak, 1,000 questions) appear as a soft confetti card for parents and a badge for the child. One per visit, never noisy. Respects reduced motion.

## D5. Layout by device

| Role | Designed first for | Notes |
|---|---|---|
| Parent | **Phone** (360–430 px) | Single column, swipeable child switcher, bottom tabs, story → tiles → charts that fit the width. |
| Teacher | **Tablet + laptop** | Two-pane: list on the left, detail on the right. Grading works on a tablet held sideways. |
| Admin | **Laptop / desktop** | Dense grids, tree on the left, multi-chart overview. Readable on a projector in meetings. |
| Super admin | **Desktop** | Data-dense console with tables and filters. Phone layout only for alerts. |

- [x] **DSN-030** States that teach `P0` `Platform`
  - *Done:* `EmptyState`, `Skeleton`, `PlanLockCard`, used across the dashboards.
  - Empty states explain the next step with one button ("Link your child to see their learning", "Create your first group"). Skeleton loaders shaped like the real content. Upgrade cards for locked modules show a preview of what you'd get (blurred sample data), never an error.
- [ ] **DSN-031** Print and PDF styles `P1` `Platform`
  - *Partly done:* the report pages (Parent report, Comms `ReportView`) print cleanly to A4 with black-and-white-safe charts and the school logo; dashboards themselves only hide the sidebar when printed.
  - Every report page prints cleanly on A4/Letter: no sidebar, charts in black-and-white-safe patterns, page breaks between sections, school logo on `reports.branded`.

## D6. Key screens (wireframes)

**Parent: phone home**
```
┌──────────────────────────┐
│ (A) Aanya ▾     🔔        │
│ ┌──────────────────────┐ │
│ │ ✨ This week Aanya    │ │  story card
│ │ learned 2 h 10 min   │ │
│ │ (+25 min) and        │ │
│ │ mastered 3 skills.   │ │
│ │ [🔥 9-day streak]    │ │
│ │ [🎯 Practise: Fractions]│
│ └──────────────────────┘ │
│ [Day][Week][Month][Year] │
│ ┌────┐┌────┐┌────┐┌────┐ │  KPI tiles
│ │2h10││ 86%││ 41 ││ 5/7│ │  time · accuracy · skills · days
│ └────┘└────┘└────┘└────┘ │
│ Subject × module matrix  │
│ ┌──┬──┬──┬──┐            │
│ │L │R │W │S │ English    │
│ │L │R │W │S │ Maths      │
│ │L │R │W │S │ Science    │
│ └──┴──┴──┴──┘            │
│ Year at a glance ▦▦▦▦▦▦▦ │  calendar heatmap
│ Activity log  ›          │
├──────────────────────────┤
│ 🏠  📊  📝  💬  ⚙️        │  bottom tabs
└──────────────────────────┘
```

**Teacher: group view (laptop)**
```
┌ Groups ─────────┬ Year 5 Maths · 24 students ──────── [Week ▾] [⤓] ┐
│ ● Year 5 Maths  │ Story: Class accuracy 78 % (+6). 3 need a nudge.   │
│ ○ Year 6 Eng    │ [Tiles: active 21/24 · tests done 92 % · mastery…] │
│ ○ Evening batch │ Student × skill heatmap (sortable, at-risk on top) │
│ + New group     │ ┌──────────┬──┬──┬──┬──┬──┐                       │
│                 │ │ Ravi  ⚠  │░░│▓▓│░░│▒▒│██│   click a cell →       │
│                 │ │ Aanya    │██│██│▓▓│██│▓▓│   that student's skill │
│                 │ └──────────┴──┴──┴──┴──┴──┘                       │
│                 │ Tests: [Fractions quiz · 18/24 done · avg 71 %] ›  │
└─────────────────┴────────────────────────────────────────────────────┘
```

**Admin: school overview (desktop)**
```
┌ 🌳 Tree ────────┬ Sunrise School · Term 2 ─────────────────────────────┐
│ ▾ Main campus   │ Story: 84 % of students active this week; Grade 4   │
│   ▾ Grade 4     │ Science dipped 7 pts. 12 students at risk.          │
│     4A  4B      │ [Active %][Avg mastery][Minutes/student][Tests][Risk]│
│   ▸ Grade 5     │ Sunburst of units   │ Grade × subject heatmap        │
│ ▸ City campus   │ Teacher activity table (tests, questions, class      │
│                 │ growth, reply time)          At-risk list ›          │
└─────────────────┴──────────────────────────────────────────────────────┘
```

**Super admin: platform console**
```
┌ Platform ─ Orgs ─ People ─ Content ─ Billing ─ Health ─ Support ─ Audit ┐
│ Live: 1,284 learners now · DAU 18.2k · MRR €42.1k · Server CPU 31 %     │
│ Funnel ▸ signup 100 → first lesson 71 → day-7 44 → paid 6.1            │
│ World map of learners │ Org table (plan, seats, health score, flags)   │
│ Alerts: 2 orgs over seat limit · AI teacher p95 1.9 s · 3 GDPR requests │
└─────────────────────────────────────────────────────────────────────────┘
```

## D7. Production-grade checklist (every new screen)

- [ ] Works at 360, 768, 1280 and 1920 px. No horizontal scroll. Touch targets ≥ 44 px.
- [ ] Light and dark mode. Prints cleanly.
- [ ] Every string translated. Dates, numbers and durations localised. Layout survives 30 % longer text (German) and right-to-left (Arabic).
- [ ] WCAG 2.2 AA: contrast, focus rings, keyboard order, chart text summaries, reduced motion.
- [ ] Loading skeletons, empty states with one clear next step, friendly errors with retry.
- [ ] Data from rollups only (FND-043). p95 < 300 ms. No more than 2,000 points per chart.
- [ ] Permissions enforced on the server (FND-020), UI hides what the user can't do, and the audit log records sensitive views.
- [ ] Screenshot tests at phone and desktop sizes using the demo data (FND-090).
