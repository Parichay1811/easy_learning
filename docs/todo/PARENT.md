# Parent: see your child's learning, in depth

[← Roadmap](README.md) · [Foundations](FOUNDATIONS.md) · [Design](DESIGN.md) · [Teacher](TEACHER.md) · [Admin](ADMIN.md) · [Super Admin](SUPER_ADMIN.md)

**Who:** a parent or guardian, usually on a phone, with a few minutes. They may
have one child or several, and their child may also be in a school or with a
private tutor on Learnigo.

**The promise:** *"I know exactly how my child is learning: today, this week,
this month, this year. What they're good at, what to practise next, and when
and how they use Learnigo. It's beautiful, and I trust it."*

**Free for every family.** Deep history and PDF reports may become a
Family Plus option (decision in [README § 4](README.md#4-selling-it-plans-built-from-feature-modules)).

---

## What exists today

- Parent login with Google (Firebase) → `ParentAccount` ([ParentLogin.jsx](../../client/src/pages/ParentLogin.jsx), [parentAuthController.js](../../server/controllers/parentAuthController.js)).
- Add/edit/remove children by name, email and age (`Child`), and view a child's performance and the student dashboard data (`/api/parent/children/:id/dashboard/{stats,activity,achievements,performance,answers,rounds}`) in [ParentDashboard.jsx](../../client/src/pages/parent/ParentDashboard.jsx).
- Chat with Learnigo support (parent ↔ super admin).
- **Gaps:**
  - Linking is not verified (**FND-001**, a data leak).
  - Parents that schools add (`admin/Parent`) are not connected to parent logins.
  - No week/month/year views, skills, usage logs, insights, reports or teacher connection.

## The experience we want

1. **Sign up in a minute.** Add a child by creating their account, entering a link
   code, or accepting the school's invite.
2. **Open the app:** a warm one-sentence story about the child, 3 insight chips and
   4 big numbers, with Day / Week / Month / Year one tap away.
3. **Tap anything to go deeper:** subject → skill → the exact questions → the
   session where it happened.
4. **Sunday evening:** a short email: "Aanya's week", with a highlight, a
   suggestion and a button to the full report.
5. **End of term or year:** a beautiful PDF and an animated "Year in Learnigo"
   that parents want to share.

---

## P1. Onboarding and linking

- [ ] **PAR-001** Verified child linking (replaces add-by-email) `P0` `Family` · needs FND-001, FND-012
  - *Partly done (PR #86):* the parent's kids list shows each link's status and an "Enter link code" action, and the learner's Dashboard has a "Link a parent" card. Still to do: the "create a child account" door and revoking a link.
  - Three doors on one screen: **Create a child account** (managed learner, picture password), **I have a link code** (from the child's profile), **My school invited me** (auto-detected from the email).
  - The link status is visible on each child card: Verified ✓ / Waiting for approval ⏳ / Revoked.
- [ ] **PAR-002** Accept school / tutor invitations `P0` `Institute` `Solo` · needs FND-012
  - The invite email from the admin or solo tutor ("Sunrise School added you as Aanya's parent") opens Learnigo with the child already linked and the school's name and logo shown.
- [ ] **PAR-003** Several children, several guardians `P1` `Family` · needs FND-013
  - A child switcher (avatars) at the top and an "All children" overview with one row per child. Invite a co-parent. Each guardian chooses their own notifications.
- [ ] **PAR-004** First-run setup `P1` `Family`
  - Child's age/grade, weekly goal (e.g. 20 min × 5 days), preferred language, notification preferences. Three skippable steps that end on the dashboard with sample tips.

## P2. Home: the story first

- [ ] **PAR-010** Story card `P1` `Family` · needs FND-044, DSN-021
  - One sentence for the chosen range plus insight chips: 🎉 celebrate, 💡 info, 🎯 practise next, ⚠️ needs attention. Each chip opens the chart that proves it.
- [ ] **PAR-011** KPI tiles `P0` `Family` · needs FND-041, FND-043
  - Active time · Active days (of 7, 30 …) · Accuracy · Skills mastered · Streak · Stars/XP. Each tile has a sparkline, a delta vs the previous period and a definition tooltip.
- [ ] **PAR-012** Goal ring `P1` `Family`
  - Progress towards the weekly goal set in PAR-004. Days met are shown as ticks Mon–Sun.
- [ ] **PAR-013** "What to do next" `P1` `Family` · needs FND-044
  - 1–3 concrete suggestions with deep links the child can open: "10 minutes of Listen · Maths: fractions", "Try the AI Teacher on 'Why is the sky blue?'".

## P3. Daily, weekly, monthly, yearly analysis

The same time-range bar (DSN-003) on every page. What each range emphasises:

| Range | Main view | Questions it answers |
|---|---|---|
| **Day** | Session timeline (start/end, device, what was played, results) + hour strip | What did they do today, and when? |
| **Week** | 7-day bars (minutes, coloured by subject) + goal ticks + skills touched | Did they meet the goal? Which days slipped? |
| **Month** | Daily line for minutes and accuracy + calendar heatmap for the month + skill changes | Are they improving? Any patterns (weekends, school days)? |
| **Year** | 53-week calendar heatmap + monthly bars + mastery growth curve + milestones on a timeline | How far have they come? What were the big moments? |
| **Custom / Term** | Any range, compared with any other | How was this term compared with the last one? |

- [ ] **PAR-020** Range-aware overview built on `LearnerDay` rollups `P0` `Family` · needs FND-043, DSN-003
- [ ] **PAR-021** Compare mode `P1` `Family`
  - Previous period, same period last year, or a chosen range, as ghost lines/bars behind the current ones, with deltas in every tile.
- [ ] **PAR-022** Learning-time patterns `P1` `Family`
  - Hour × weekday heatmap with "best focus time" (highest accuracy per minute), weekday vs weekend split and average session length.

## P4. Learning in depth

- [ ] **PAR-030** Subject × module matrix `P0` `Family` · needs DSN-020
  - Listen/Read/Write/Speak × English/Maths/Science tiles showing mastery colour, accuracy % and time spent. Tap a tile to open that subject–module page.
- [ ] **PAR-031** Skill map `P1` `Family` · needs FND-042
  - All skills in the child's grade band grouped by topic, each with a mastery level (Not started / Learning / Practising / Mastered), the date it was mastered and a "then vs now" toggle showing the start of the range against today.
- [ ] **PAR-032** Accuracy, speed and independence trends `P1` `Family`
  - First-try accuracy, median time per question by interaction type (tap, type, speak, order…), hint use and "Listen again" plays, read in plain language: "Answers faster and needs fewer hints than last month."
- [ ] **PAR-033** Question-level review `P1` `Family`
  - The most recent answers with the question card exactly as the child saw it (the wooden board), their answer, the right answer, time taken and attempts. Filter by wrong / needed a hint / slow.
- [ ] **PAR-034** Practice vs Warrior vs tests `P1` `Family`
  - Separate results for relaxed practice, timed Warrior rounds and teacher tests, so a timed score never looks like a drop in ability.
- [ ] **PAR-035** Movement and focus games (AR) in plain words `P2` `Family`
  - From the rich `ARSession` metrics: reaction time, accuracy, both-hands use and steadiness, shown as gentle trends with "what this means" notes. **No medical or diagnostic claims.** Wording is reviewed by an educator.
- [ ] **PAR-036** AI Teacher usage `P1` `Family` · needs FND-045
  - Topics explored, time, quiz results from AI lessons and favourite subjects. Raw questions are hidden unless the parent turns them on.

## P5. Usage logs

- [ ] **PAR-040** Activity log `P1` `Family` · needs FND-046
  - A reverse-chronological timeline grouped by day. Each session shows device, duration, what was played (module/game/AI topic), results and pauses. Filter by subject or device. Exportable to CSV.
- [ ] **PAR-041** Screen-time summary `P1` `Family`
  - Daily/weekly totals, longest session, late-evening use and devices used.
- [ ] **PAR-042** Healthy-use controls `P2` `Family`
  - Optional daily time limit, quiet hours and a gentle break reminder for the child. These are parent settings, applied on the child's devices when signed in.

## P6. School and tutor connection

- [ ] **PAR-050** "My child's classes" `P1` `Institute` `Solo` · needs FND-012, FND-021
  - The schools and tutors the child belongs to, their groups and teachers (names, subjects), each with the school's logo.
- [ ] **PAR-051** Tests and homework `P1` `Institute` `Solo` · needs TCH-030
  - Upcoming tests (date, subject, rules such as time limit), assigned practice and results once the teacher releases them, with the teacher's comments. Calendar view and reminders.
- [ ] **PAR-052** Message the teacher `P1` `Institute` `Solo` · needs FND-051
  - Only when the school's policy allows it. Threads are tied to the child. Office-hours notice. Read receipts.
- [ ] **PAR-053** School announcements `P1` `Institute` · needs FND-052
- [ ] **PAR-054** Class context, only if the school allows it `P2` `Institute` · needs FND-022, FND-073
  - "Class average this week" as a soft band on the child's chart. Never another child's data, and only with ≥ 20 students.

## P7. Motivation together

- [ ] **PAR-060** Goals and rewards `P1` `Family`
  - The parent sets a goal and the child sees it on their home screen. The parent can attach a family reward ("pizza night!") that the child sees when they reach it.
- [ ] **PAR-061** Cheer button `P2` `Family`
  - Send a sticker or a recorded voice "Well done!" that appears the next time the child opens Learnigo.
- [ ] **PAR-062** Achievements wall `P1` `Family`
  - All badges (streaks, mastery, milestones) with dates, plus the ones coming next.

## P8. Reports and sharing

- [ ] **PAR-070** Weekly email digest `P1` `Family` · needs FND-061
  - Subject line with the highlight. Inside: the story, 4 tiles, one chart image, one suggestion and a button. Localised, with one-tap unsubscribe.
- [ ] **PAR-071** Monthly / term PDF report `P1` `Family` · module `analytics.deep` · needs FND-060
  - Cover with the child's avatar, summary, subject × module matrix, skill progress, time patterns, achievements, teacher comments (if linked) and next steps. School-branded when linked to an Institute with `reports.branded`.
- [ ] **PAR-072** Share a report `P2` `Family`
  - A time-limited, read-only link (7 days) to send to a tutor or grandparent. The parent can revoke it, and it is audited.

## P9. The wow layer

- [ ] **PAR-080** "Year in Learnigo" `P2` `Family` · module `analytics.deep`
  - An animated story (like a music app's year in review): total minutes, top subject, skills mastered, longest streak, favourite AI Teacher topic, best month and a printable certificate. Made for the parent and the child to watch together.
- [ ] **PAR-081** Then vs now `P2` `Family`
  - A side-by-side of the same skill months apart: accuracy, speed and hints. "In March Aanya needed 3 hints for this, now she needs none."
- [ ] **PAR-082** Milestone moments `P2` `Family` · needs DSN-022
  - Celebrations for firsts (first mastered skill, first 100 questions, first test passed) with a share card that hides personal data.

## P10. Privacy centre

- [ ] **PAR-090** Privacy centre `P1` `Family` · needs FND-070, FND-071, FND-072
  - What we store about my child, who can see it (the school, teachers, other guardians, with the date each link was made) and the consent history. Download all data, delete the child's account and revoke a school's link (after confirming with the school when the school created the account).

---

## Done means

- A parent links a child in ≤ 60 s, and an unverified link never shows data (automated test).
- The phone home loads in < 2 s on 4G. Every range (Day/Week/Month/Year) answers in < 300 ms from rollups.
- In usability tests 4 of 5 parents can answer "What should my child practise next?" and "When does my child learn best?" within 30 s.
- Success metrics: % of parents opening the weekly digest; parents returning weekly; children with a linked parent who stay active longer (track in SUP-020).

## Links to other roles

- **Teacher:** test results, comments, messages and the group a child is in ([TEACHER.md](TEACHER.md)).
- **Admin:** school invites, privacy policy, announcements and branding ([ADMIN.md](ADMIN.md)).
- **Super admin:** support chat (exists), data-rights requests and plan changes ([SUPER_ADMIN.md](SUPER_ADMIN.md)).
