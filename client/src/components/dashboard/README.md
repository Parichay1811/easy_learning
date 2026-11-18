# Learnigo dashboard kit

One shared UI kit for the Parent, Teacher, Admin and Super Admin dashboards
(`docs/todo/DESIGN.md`, DSN-001 to DSN-031). Import everything from the barrel:

```jsx
import { DashboardShell, TimeRangeBar, useTimeRange, StoryCard, KpiTile, ChartCard, TrendLine, toTable, fmtDuration } from '../../components/dashboard';
```

See it live: run the client in dev and open `/dev/dashboard-kit` (add `?theme=dark` for dark mode).
Sample data for demos and tests: `sample.js` (deterministic, same JSON shapes as the charts take).

## Ground rules

- **Tokens** live in `tokens.css` as CSS variables on `.dash` (the shell adds that class). Outside the shell wrap
  things in `<div className="dash">`. Light by default; dark follows the OS (`prefers-color-scheme`) and can be forced with
  `data-theme="dark" | "light"` on the shell (`theme` prop) or any ancestor.
- **Fixed colours.** English `#7b6dff`, Maths `#3d9bff`, Science `#43c0a0`; Listen `#4dc9ff`, Read `#ff9d3b`, Write `#ff6b9d`,
  Speak `#6bcf7f`. Use `SUBJECTS` / `MODULES` from `constants.js`, never your own colours. Status: `--d-good/-attention/-alert/-neutral`.
  Coloured TEXT must use the `-ink` variants (e.g. `--d-attention-ink`), the plain ones are for fills and strokes (contrast >= 4.5:1).
- **Colour never carries meaning alone.** Mastery has glyphs + words, subjects in stacked bars have textures, heatmap cells
  have tooltips, spoken labels and a readout line, KPI tones have an icon and a word, deltas have arrows and signs.
- **Percentages are fractions** (`0.86`), durations are minutes, dates are local ISO `YYYY-MM-DD`.
- **Missing data shows "—"**, never `NaN` or `0 %` (`fmt*` helpers do this for you).
- **Strings** go through `t('dash.…', { defaultValue })`. No locale files were added; English falls back via `defaultValue`.
  Kit keys are all under `dash.`. Add translations to `public/locales/*/translation.json` when you localise.
- **Max 2000 points** per chart (`capPoints` down-samples). Aggregate on the server first (D7).
- Everything is keyboard reachable, has focus rings, 44 px targets, and respects `prefers-reduced-motion`.
- `useTimeRange`, `DashboardShell` (links) and `KpiTile`/`StoryCard` (`to`) need to be inside a react-router `<Router>`.

## Frame and controls

### `DashboardShell`
```jsx
<DashboardShell
  brand={{ label: 'LEARNIGO', logo: <img src={logo} alt="" />, to: '/' }}   // or any node
  nav={[
    { key: 'home', label: 'Overview', icon: FaHome, to: '/parent-dashboard', badge: 2 },
    { key: 'tests', label: 'Tests', icon: FaClipboardList, onClick: openTests,
      children: [{ key: 'upcoming', label: 'Upcoming', to: '/tests/upcoming' }] },
  ]}
  active="home"
  breadcrumbs={[{ label: 'Sunrise School', to: '/admin' }, { label: 'Grade 5' }]}
  contextSwitcher={<ChildSwitcher />} topbar={<SearchButton />} bell={<Bell />} user={<AvatarMenu />}
  actions={<Button variant="ghost">Export</Button>}>
  <TimeRangeBar value={tr} />
  …page…
</DashboardShell>
```
Props: `brand`, `nav[]` `{key,label,icon (component or element),to | onClick,badge,children?}`, `active` (nav key; if omitted the URL
decides), `topbar`/`contextSwitcher`/`bell`/`user`/`actions` slots, `breadcrumbs[]` `{label,to?}`, `theme`, `fill`, `className`.
Sidebar is icons only under 1280 px (user can toggle, remembered in localStorage); under 700 px it becomes a bottom tab bar
(max 5 entries, 4 + "More" sheet when you pass more). Skip link, `<header>`, `<nav>`, `<main id="dash-main">` landmarks.
`fill` makes the shell `position: fixed` over the whole viewport: use it only while the page still sits under the site `Navbar`
(better: add the dashboard path to `hideNavbar` in `App.jsx`). `<main>` is a flex column with 18 px gap: just stack cards in it.

### `useTimeRange` + `TimeRangeBar`
```jsx
const tr = useTimeRange({ defaultRange: 'week', defaultCmp: 'prev', terms });  // terms: [{key,label,from,to}]
<TimeRangeBar value={tr} ranges={['week','month','year','custom']} showCompare sticky />
fetch(`/api/x?from=${tr.from}&to=${tr.to}&cmpFrom=${tr.prevFrom}&cmpTo=${tr.prevTo}`);
```
URL state: `?range=day|week|month|year|custom|term&from=YYYY-MM-DD&to=…&cmp=none|prev|yoy&term=key`.
Returns `{range, cmp, from, to, prevFrom, prevTo (null when cmp==='none'), days, isCurrent, term, terms,
setRange(r), setCustom(from,to), setTerm(key), setCmp(c), shift(-1|1), reset()}`. Weeks start Monday.
`yoy` = same dates one year earlier; `prev` = the period before (same length).

## Cards and states

| Component | Props |
|---|---|
| `KpiTile` | `label, value (string\|number\|null), unit, delta {current, previous, mode?: 'percent'\|'points'\|'duration'\|'number', vs?, lowerIsBetter?}, sparkline: number[], helpText, tone: 'neutral'\|'good'\|'attention'\|'alert', onClick, to, loading` |
| `Sparkline` | `data: number[] \| [{y}], width=96, height=32, tone, label` (decorative unless `label`) |
| `StoryCard` | `sentence (string\|JSX), chips: [{kind: 'celebrate'\|'info'\|'nudge'\|'alert', text, onClick?, to?}] (max 4), title, loading` |
| `ChartCard` | `title (a question), answer (one line), info (how calculated), summary (SR text), table {columns, rows, caption?, getRowKey?}, actions, legend, footer, loading, error (string\|true), onRetry, empty ({title,text,actionLabel,onAction,to}\|true), headingLevel=3` |
| `EmptyState` | `icon, title, text, actionLabel, onAction \| to, compact, tone: 'neutral'\|'error'` (one button) |
| `Skeleton` | `variant: 'text'\|'rect'\|'circle'\|'tile'\|'chart', width, height, lines` |
| `PlanLockCard` | `module, title, text, ctaLabel, onUpgrade, children (blurred preview, optional)` |
| `InfoTip` | `children (the explanation), label, align: 'start'\|'end'` |
| `Button` | `variant: 'primary'\|'soft'\|'ghost', to, icon, size: 'sm'` + button props |
| `DataTable` | `columns [{key,label,align?,sortable?,render?(row),sortValue?(row)}], rows, caption, getRowKey, onRowClick, defaultSort {key,dir}` (500 rows max, stacks into cards on phones) |

```jsx
<KpiTile label="Learning time" value={fmtDuration(130)} delta={{ current: 130, previous: 105, mode: 'duration', vs: 'last week' }}
         sparkline={last30} helpText="Minutes with at least one answered question." tone="good" onClick={openTime} />

<ChartCard title="Is it getting better?" answer="Up 18 % on the previous two weeks." info="Solid: this period. Dashed: before."
           table={toTable.trend(data, t)} loading={q.isLoading} error={q.isError && 'Could not load'} onRetry={q.refetch}
           empty={!q.isLoading && !data.length && { title: 'No lessons yet', text: 'Link your child.', actionLabel: 'Link', onAction }}>
  <TrendLine data={data} />
</ChartCard>
```
Every kit chart writes its own screen-reader summary. `ChartCard.summary` is only for charts you build yourself.
"View as table" appears when you pass `table`; build it with `toTable.<chart>(sameData, t, opts)`:
`calendar, hourWeekday, matrix, trend, stacked, distribution, studentSkills(students, skills, t), funnel, units, skills`.

## Charts (all plain JSON, responsive, text summary, <= 2000 points)

| Component | Props (data shape) |
|---|---|
| `CalendarHeatmap` | `data [{date:'YYYY-MM-DD', value:minutes}], mode: 'year'\|'month', to (ISO), unit='min', goal, onSelect(iso)` |
| `HourWeekdayHeatmap` | `data [{weekday: 0 (Mon)…6, hour: 0-23, value}], unit, onSelect(weekday, hour)` |
| `SubjectModuleMatrix` | `cells [{subject, module, accuracy: 0..1\|null, minutes, level?}], subjects?, modules?, onSelect(subject, module), showLegend` |
| `TrendLine` | `data [{x (ISO or label), value, prev?}], unit='min'\|'%'\|word, milestones [{x,label}], seriesLabel, prevLabel, height=260, yFormat, xFormat, color` |
| `StackedBars` | `data [{x, english, maths, science}], series? [{key,label,color}], unit, goal, height, xFormat, yFormat` (textures per series) |
| `ProgressRing` | `value, goal, unit ('min'\|'%'\|word\|''), label, size=132, thickness=13, color, centerText` |
| `DistributionStrip` | `data [{id,name,value}], domain=[0,1], format, highlightId, onSelect(item)` (median line, middle-half band) |
| `StudentSkillHeatmap` | `students [{id,name,atRisk?,scores:{[skillId]: 0..1\|null}}], skills [{id,label,short?}], onCellClick(student, skill), onStudentClick(student)` (at-risk pinned, sortable headers) |
| `Timeline` | `events [{id, time (ISO datetime), kind: 'session'\|'test'\|'game'\|'milestone'\|'message', title, subtitle?, minutes?, subject?, details?: [{label,value?,ok?}]}], max=200` |
| `SkillMap` / `MasteryChips` | `skills [{id, topic, label, level: 0-3, prevLevel?}], onSelect(skill), compare` ("then vs now" switch when `prevLevel` exists). `MasteryChips` is the flat chip list |
| `UnitSunburst` | `root {id, name, score 0..1, students? (leaf), children?}, scoreLabel, onSelect(node, pathIds), drills=true` (click drills, centre goes back, list beside it) |
| `Funnel` | `steps [{key,label,value}], onSelect(step), format` |
| `ItemAnalysisTable` | `items [{id, question, attempts?, pctCorrect: 0..1, discrimination?: -1..1, avgSeconds, commonWrong?: {answer,pct}, flag?}], onSelect(item)` |
| `MasteryLegend`, `MasteryGlyph`, `HeatLegend` | small building blocks if you make your own mastery/heat views |

Mastery levels: `MASTERY` = not started, learning, practising, mastered (`masteryFromScore(0..1)`: < 0.4 learning, < 0.75 practising, else mastered).
Kind wording ("Practise next", "Needs a nudge") is built in, keep it.

## Formatting (`format.js`)
`fmtDuration(130)` "2 h 10 min", `fmtDelta(cur, prev, {mode, vs, lowerIsBetter})` `{text:'+12 %', dir, tone, srText}`,
`fmtNumber(n, {compact})`, `fmtPercent(0.86)`, `fmtDate('2026-11-18' | {from,to}, {style: 'short'|'long'|'day'|'month'|'weekday'})`,
`weekdayNames()`, `monthNames()`. All read `i18n.language`; `useFormat()` returns the same functions bound to the language and re-renders on change.
Dates helpers: `dates.js` (`toISO`, `parseISO`, `today`, `addDays`, `startOfWeek` …).

## Print
`@media print` hides sidebar, bars and buttons (`data-print="hide"`), flattens shadows and avoids page breaks inside cards
(`data-print="section"`). Add `data-print="hide"` to anything that should not print.


## CommandPalette (DSN-002)
Search everything and jump. Ctrl/Cmd+K anywhere, or the trigger button (an icon on phones). Give it only what the person may open.

```jsx
<CommandPalette scope="teacher" items={[
  { id: 'new-test', label: 'Create a test', group: 'Actions', to: '/teacher/tests/new', keywords: ['quiz'] },
  { id: 'g-5b', label: 'Year 5 Maths', group: 'Groups', hint: '24 students', to: '/teacher/groups/5b' },
  { id: 'export', label: 'Export results', group: 'Actions', onSelect: () => exportCsv() },
]} />
```
Props: `{ items:[{id,label,group,hint,icon,keywords,to|onSelect}], scope, placeholder, open, onOpenChange, hideTrigger, hotkey }`. Put it in the shell's `topbar` slot. It remembers the last 5 choices per `scope` in localStorage. Forgiving search (`searchItems`): exact, prefix, word prefix, contains, keywords, letters-in-order. Needs a react-router `<Router>`.

## Celebration + useCelebrateOnce (DSN-022)
A calm milestone card with a little confetti (off for reduced motion). `const [show, dismiss] = useCelebrateOnce('streak-7-' + child.id)` (imported from the barrel) returns true only the first time; `<Celebration emoji title text actionLabel onAction onClose={dismiss} />`.
