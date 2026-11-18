# Teacher: for private tutors and school teachers

[← Roadmap](README.md) · [Foundations](FOUNDATIONS.md) · [Design](DESIGN.md) · [Parent](PARENT.md) · [Admin](ADMIN.md) · [Super Admin](SUPER_ADMIN.md)

**Who:** two kinds of teacher, one product.

| | **Solo teacher** (private tutor, home tuition, small coaching) | **Institute teacher** (school or coaching centre) |
|---|---|---|
| How they join | Signs up on their own → their own Solo workspace (FND-015) | Added by their admin, signs in with Google (works today) |
| Groups | Creates and manages their own | Teaches groups the admin assigns; may create sub-groups if the school allows (FND-022) |
| Questions | Auto-approved for their own students | Go to the admin's review queue (works today) |
| Students and parents | Invites them directly | Admin enrols them; teacher sees their groups |
| Pays | Solo Free → Solo Pro | The school pays |

A person can be both: a teacher at a school by day and a private tutor in the
evening, using one login and switching workspaces in the shell (FND-010, DSN-001).

**The promise:** *"I set up a class in five minutes, build a test in ten, and
the moment students finish I know who needs help and on what."*

---

## What exists today

- Google login for `Tutor` records an admin created ([teacherAuthController.js](../../server/controllers/teacherAuthController.js)).
- See assigned batches and students, add/remove students in assigned batches, per-student performance, edit the weekly schedule for subjects they teach ([teacherController.js](../../server/controllers/teacherController.js), [TeacherDashboard.jsx](../../client/src/pages/teacher/TeacherDashboard.jsx), [TeacherBatchDetail.jsx](../../client/src/pages/teacher/TeacherBatchDetail.jsx)).
- Upload questions with an `.xlsx` template, linked to batches. The admin approves them. The teacher edits pending uploads ([TeacherQuestionUpload.jsx](../../client/src/pages/teacher/TeacherQuestionUpload.jsx)).
- **Gaps:** no self-signup (Solo), no in-app question editor, no tests or rules, no grading, no group analytics, no parent connection.

---

## T1. Getting started

- [ ] **TCH-001** Solo signup `P0` `Solo` · needs FND-015, FND-030
  - "I teach privately" → name, subjects, grades and country → a Solo workspace is created on Solo Free. Guided checklist: create a group → add students → assign first practice → see first results.
- [ ] **TCH-002** Institute invite acceptance `P1` `Institute`
  - The admin's invite email names the school and the teacher's groups. First login lands on "Your classes" (today a missing `Tutor` row gives a 404 that says "ask your admin". Keep that, but make it friendlier).
- [ ] **TCH-003** Workspace switcher `P1` `Solo` `Institute` · needs FND-010, DSN-001

## T2. Groups and students

- [ ] **TCH-010** Create and manage groups `P0` `Solo` `Institute` · module `groups`
  - Name, subject(s), grade band, colour and emoji, schedule (reuse `ScheduleEditor`/`WeeklyScheduleGrid`), archive/restore. In Institutes: only if the policy allows, and the group sits under the teacher's unit.
- [ ] **TCH-011** Add students in every way `P0` `Solo` `Institute` · needs FND-011, FND-012
  - Join code or QR on the projector · invite link · CSV paste · create managed learners with printable login cards (picture password) · move or copy students between groups.
- [ ] **TCH-012** Invite parents `P1` `Solo` `Institute` · needs FND-012
  - Bulk "invite parents" for a group. Each child shows a parent status: Linked / Invited / None.
- [ ] **TCH-013** Student profile (teacher view) `P1` `Solo` `Institute`
  - The parent's in-depth views ([PARENT.md](PARENT.md) P3–P5) limited to this workspace's activity (FND-021), plus **private teacher notes**, accommodations (TCH-034) and test history.

## T3. Question bank

- [ ] **TCH-020** In-app question editor for every interaction type `P0` `Solo` `Institute` · module `qbank.author`
  - All 12 types from the registry ([widgetRegistry.js](../../client/src/components/QuestionWidgets/widgetRegistry.js)): tap, true/false, drag to blank, multi-select, order, tap sequence, letter bank, match pairs, sort bins, short and long typed answers, and voice recording.
  - Fields: instruction, prompt, picture/emoji/image upload, audio text (read aloud by the site's natural narrator), hints, feedback (correct / incorrect / second try) and worked example.
  - **Live preview** on the real wooden-board `QuestionCard`, at phone and desktop size, with a "try it as a student" mode.
- [ ] **TCH-021** Tags and metadata `P0` `Solo` `Institute` · needs FND-042
  - Module, subject, skill(s), grade band, difficulty 1–5, curriculum code (optional) and estimated time. Required tags power analytics.
- [ ] **TCH-022** Import and export `P1` `Solo` `Institute`
  - Keep the `.xlsx` template path. Add CSV, copy-paste from a document, and bulk edit in a grid.
- [ ] **TCH-023** Bank browser `P1` `Solo` `Institute`
  - Search and filter **my questions / my school's bank / Learnigo's bank**. Duplicate and adapt, collections ("Fractions starter set") and versioning (edits don't change past test results).
- [ ] **TCH-024** Approval flow by workspace `P0` `Solo` `Institute`
  - Solo: auto-approved. Institute: goes to the admin review queue (exists: [adminQuestionController.js](../../server/controllers/adminQuestionController.js)). The teacher sees status and the reviewer's notes.
- [ ] **TCH-025** Share to the public bank `P2` `Solo` `Institute` · module `qbank.share` · needs SUP-031
  - Opt in to share good questions with every Learnigo teacher, after a review by the Learnigo content team. Credited to the author.
- [ ] **TCH-026** AI-assisted drafting `P2` `Solo` `Institute`
  - "Make 5 questions on fractions for grade 4, mixed types" → drafts land as **unapproved** for the teacher to edit. Only when a language model is configured (never required).
- [ ] **TCH-027** Question quality stats `P1` `Solo` `Institute` · needs FND-043
  - Per question: times used, % correct, average time and the most common wrong answer. Flags: "too easy", "confusing", "possibly wrong key" (high-scorers miss it).

## T4. Tests and their rules

- [ ] **TCH-030** Test builder `P0` `Solo` `Institute` · module `tests`
  - Pick questions from the bank (filters + search), or use **random pools** ("8 from Fractions, difficulty 2–3"), with sections, reorder and points per question. Save as template, duplicate, and see the student preview.
- [ ] **TCH-031** Rules `P0` `Solo` `Institute` · module `tests` (advanced rules: `tests.advanced`)

  | Rule | Options |
  |---|---|
  | When | Opens at / closes at (timezone-aware), or "always open" for practice |
  | Time | No limit / total limit / per-question limit; what happens at time-up (auto-submit) |
  | Attempts | 1, N or unlimited; which attempt counts (best / last / average) |
  | Order | Shuffle questions, shuffle options, fixed order per section |
  | Help allowed | Hints on/off, "Listen" (read aloud) on/off, AI Teacher locked during the test |
  | Feedback | Show right/wrong immediately (practice style) / after submit / after the close date / never |
  | Style | Practice (calm) or Warrior (timer + stars), matching the site's modes |
  | Pass mark | % to pass, mastery credit on/off |
  | Late work | Not allowed / allowed with a mark / allowed until a date |
  | Integrity (light) | Full-screen request, log tab switches and paste events (shown to the teacher, never auto-penalised) |
- [ ] **TCH-032** Assign `P0` `Solo` `Institute`
  - To groups, to some students, or to a group minus some students. Reminders to students (and parents, optional) at open, 24 h before close and at close.
- [ ] **TCH-033** Student test player `P0` `Platform` · needs TCH-031
  - The student's side: a "To do" list on their home screen, a test intro card (rules in plain words, time, attempts), the familiar wooden-board question card, a progress bar, a timer when timed, saving offline and resuming after a dropped connection, and a calm submit/confirm screen.
- [ ] **TCH-034** Accommodations per student `P1` `Solo` `Institute` · module `tests.advanced`
  - Extra time (×1.25, ×1.5, ×2), read-aloud always on, fewer options, larger text, separate quiet window. Set once on the student and applied to every test automatically. This fits the dyslexia-friendly audience Learnigo serves.
- [ ] **TCH-035** Live monitor `P1` `Solo` `Institute`
  - During an open test: who has started, finished or is stuck (long time on one question), with a live % correct per question so the teacher can re-teach right away. Uses the polling pattern, no WebSockets.

## T5. Marking and feedback

- [ ] **TCH-040** Auto-marking `P0` `Solo` `Institute`
  - Reuses `scoreAnswer.js`. Partial credit for multi-select, order and match pairs (configurable).
- [ ] **TCH-041** Marking queue for typed and spoken answers `P1` `Solo` `Institute` · module `grading.manual`
  - Typed long answers and voice recordings land in a queue with a rubric (criteria × levels), quick comments, a voice comment, and mark with the keyboard (next/prev). Works on a tablet.
- [ ] **TCH-042** Release results `P1` `Solo` `Institute`
  - Release now or at close. Students see their score and feedback, parents see results with the teacher's comment (PAR-051), and corrections after release are recorded in the audit log.

## T6. Performance at every level

The same chart kit and time-range bar as the parents' (DSN-003, DSN-020), with
teacher-specific views. **Levels: test → group → subject → skill → student → session.**

- [ ] **TCH-050** "Today" home `P0` `Solo` `Institute`
  - Today's classes (from the schedule), tests open now, **Needs attention** (at-risk students, unmarked work, failed tests), recent highlights ("Ravi mastered fractions!").
- [ ] **TCH-051** Group dashboard `P0` `Solo` `Institute` · needs FND-043
  - Story card, tiles (active students, minutes per student, accuracy, mastery growth, test completion), **student × skill heatmap**, distribution strip, trend vs the previous period and compare with my other groups.
- [ ] **TCH-052** Test results `P0` `Solo` `Institute`
  - Score distribution, per-student table, **item analysis** (difficulty, discrimination, time, common wrong answers, "possibly wrong key" flag), compare attempts and export.
- [ ] **TCH-053** Subject and module views `P1` `Solo` `Institute`
  - Subject × module matrix for the group, a skill coverage map (skills taught vs mastered), and what's untouched.
- [ ] **TCH-054** Individual student `P0` `Solo` `Institute` · needs TCH-013
- [ ] **TCH-055** Suggested groups `P2` `Solo` `Institute` · needs FND-044
  - "These 5 students are all stuck on fractions": one tap creates a temporary practice group with a suggested set of questions.
- [ ] **TCH-056** My teaching summary `P1` `Solo` `Institute`
  - The teacher's own view of what the admin sees about them (ADM-041): tests created, questions contributed, class engagement and growth, reply time. Transparent by design.

## T7. Homework and practice sets

- [ ] **TCH-060** Practice sets `P1` `Solo` `Institute`
  - Lighter than tests: a set of questions or a module/subject ("15 min of Listen · Maths this week"), or an AI Teacher topic. They count towards mastery, not grades.
- [ ] **TCH-061** Auto-practice from results `P2` `Solo` `Institute`
  - After a test, each student gets practice on the skills they missed, built automatically and approved by the teacher in one click.

## T8. Communication and reports

- [ ] **TCH-070** Messages with parents and admin `P1` `Solo` `Institute` · needs FND-051
- [ ] **TCH-071** Group announcements `P1` `Solo` `Institute` · needs FND-052
- [ ] **TCH-072** Reports `P1` `Solo` `Institute` · needs FND-060
  - Student report for parent meetings (one page: progress, strengths, next steps, teacher comment), group report and test report. Branded with the workspace logo on `reports.branded`.
- [ ] **TCH-073** Weekly teacher digest `P1` `Solo` `Institute` · needs FND-061

## T9. Solo business tools

- [ ] **TCH-080** Solo plan and billing `P1` `Solo` · needs FND-032
  - Upgrade from Solo Free (1 group, 15 students), invoices and usage against limits.
- [ ] **TCH-081** Branding for tutors `P1` `Solo` · module `reports.branded`
  - Logo and colour on reports, invite emails and the student join page. Builds the tutor's brand with parents.
- [ ] **TCH-082** Public tutor page `P2` `Solo`
  - Optional profile page (subjects, grades, testimonials) with a "join my class" button. A growth loop for Learnigo.

---

## Done means

- A new Solo tutor goes from signup to a group with students and a first assigned test in **≤ 15 minutes**.
- A test with 30 students shows item analysis within 5 s of the last submission.
- Institute teachers can never see another teacher's private groups or out-of-school activity (permission suite FND-002).
- Every view works on a tablet. Marking works with keyboard and touch.

## Links to other roles

- **Admin:** assigns groups, approves questions (Institute), sets policies, sees teaching summaries ([ADMIN.md](ADMIN.md)).
- **Parent:** receives invites, results, comments and messages ([PARENT.md](PARENT.md)).
- **Super admin:** public question bank review, plans, support ([SUPER_ADMIN.md](SUPER_ADMIN.md)).
