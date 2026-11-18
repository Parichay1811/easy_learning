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

- [x] **TCH-001** Solo signup `P0` `Solo` · needs FND-015, FND-030
  - "I teach privately" → name, subjects, grades and country → a Solo workspace is created on Solo Free. Guided checklist: create a group → add students → assign first practice → see first results.
  - *Done:* `/teach` page and `POST /api/teacher/auth/solo` (verified Firebase token): approved Solo org in both databases (`plan: solo_free`), OrgAdmin + Tutor, default + custom subjects, `TeacherProfile`; idempotent, cleans up on failure; returns teacher + admin tokens. Getting-started checklist on Today (the "assign first practice" step waits for practice sets/tests). Tests: `test/integration/teacher-classes.test.js`.
- [x] **TCH-002** Institute invite acceptance `P1` `Institute`
  - The admin's invite email names the school and the teacher's groups. First login lands on "Your classes" (today a missing `Tutor` row gives a 404 that says "ask your admin". Keep that, but make it friendlier).
  - *Done:* sign-in 404 now has `code: NO_TEACHER_ACCOUNT` and a friendlier message; the login page offers a Solo workspace. `POST /api/admin/tutors/:id/invite` emails the teacher naming the school and their groups (Admin UI button not wired yet: ADMIN plan). First login lands on Today.
- [x] **TCH-003** Workspace switcher `P1` `Solo` `Institute` · needs FND-010, DSN-001
  - *Done:* sign-in returns `workspaces` + `needsChoice` and takes an optional `tutorId`; `GET /api/teacher/auth/workspaces`, `POST /api/teacher/auth/switch`; chooser after login and a switcher in the shell. `Tutor.uid` is now unique per organisation (old global `uid_1` index dropped once, lazily). Full Account/Membership (FND-010) still to do.

## T2. Groups and students

- [x] **TCH-010** Create and manage groups `P0` `Solo` `Institute` · module `groups`
  - Name, subject(s), grade band, colour and emoji, schedule (reuse `ScheduleEditor`/`WeeklyScheduleGrid`), archive/restore. In Institutes: only if the policy allows, and the group sits under the teacher's unit.
  - *Done:* `/api/teacher/groups` create/edit/archive/restore with colour, emoji, grade band, subjects, class size; weekly schedule through the existing `ScheduleEditor`; institutes need `teachersCreateGroups`, and teachers only manage groups they created. Plan limits (FND-031) give a friendly 402 `PLAN_LIMIT` and usage meters. "Sits under the teacher's unit" waits for FND-017.
- [x] **TCH-011** Add students in every way `P0` `Solo` `Institute` · needs FND-011, FND-012
  - Join code or QR on the projector · invite link · CSV paste · create managed learners with printable login cards (picture password) · move or copy students between groups.
  - *Done:* join code + QR (own SVG encoder, `components/teacher/qr.js`, checked with OpenCV), invite link `/join/:code` (students join themselves, parents add a verified child), projector view, CSV paste/upload with preview and dry run, move/copy between groups, add from the school list. *Not done:* managed learners and login cards (FND-011, Parent work; TODO left in the Add students panel).
- [x] **TCH-012** Invite parents `P1` `Solo` `Institute` · needs FND-012
  - Bulk "invite parents" for a group. Each child shows a parent status: Linked / Invited / None.
  - *Done:* per-group Linked / Invited / None and bulk invites (org `Parent` record + email through `sendMail`); invited parents are verified by the school-link rule when they add their child.
- [x] **TCH-013** Student profile (teacher view) `P1` `Solo` `Institute`
  - The parent's in-depth views ([PARENT.md](PARENT.md) P3–P5) limited to this workspace's activity (FND-021), plus **private teacher notes**, accommodations (TCH-034) and test history.
  - *Done:* teacher student profile on the shared `/students/:id/analytics/*` endpoints plus private notes (`TeacherNote`, author-only) and parent status. *Not done:* limiting analytics to this workspace's activity (FND-021), accommodations (TCH-034), test history (tests not built).

## T3. Question bank

- [x] **TCH-020** In-app question editor for every interaction type `P0` `Solo` `Institute` · module `qbank.author`
  - All 12 types from the registry ([widgetRegistry.js](../../client/src/components/QuestionWidgets/widgetRegistry.js)): tap, true/false, drag to blank, multi-select, order, tap sequence, letter bank, match pairs, sort bins, short and long typed answers, and voice recording.
  - Fields: instruction, prompt, picture/emoji/image upload, audio text (read aloud by the site's natural narrator), hints, feedback (correct / incorrect / second try) and worked example.
  - **Live preview** on the real wooden-board `QuestionCard`, at phone and desktop size, with a "try it as a student" mode.
  - *Done:* `/teacher/tests/bank/new` edits all 12 types (fields, emoji or uploaded picture, read-aloud text, hints, three feedbacks, worked example) with a live `QuestionCard` preview at phone/desktop width and "try as a student"; server validation in `utils/questionShape.js`. *Not done:* storing the student's voice recording itself (mic answers keep the transcript).
- [x] **TCH-021** Tags and metadata `P0` `Solo` `Institute` · needs FND-042
  - Module, subject, skill(s), grade band, difficulty 1–5, curriculum code (optional) and estimated time. Required tags power analytics.
  - *Done:* skills, grade band, difficulty 1-5, curriculum code, estimated time, points (FND-042 fields).
- [x] **TCH-022** Import and export `P1` `Solo` `Institute`
  - Keep the `.xlsx` template path. Add CSV, copy-paste from a document, and bulk edit in a grid.
  - *Done:* `.xlsx` path untouched; CSV / spreadsheet paste / plain text from a document with a dry-run check (`/bank/import`), CSV export (audited), grid edit (`PATCH /bank/bulk`).
- [x] **TCH-023** Bank browser `P1` `Solo` `Institute`
  - Search and filter **my questions / my school's bank / Learnigo's bank**. Duplicate and adapt, collections ("Fractions starter set") and versioning (edits don't change past test results).
  - *Done:* mine / school / Learnigo scopes with search and filters, duplicate, collections (private or shared in the workspace), versioning (`QuestionRevision`; attempts snapshot the question, so edits never change past results).
- [x] **TCH-024** Approval flow by workspace `P0` `Solo` `Institute`
  - Solo: auto-approved. Institute: goes to the admin review queue (exists: [adminQuestionController.js](../../server/controllers/adminQuestionController.js)). The teacher sees status and the reviewer's notes.
  - *Done:* solo workspaces auto-approve; institute questions open a `QuestionUploadBatch` (source `editor`/`csv`) in the existing admin review queue; content edits go back for review, tag-only edits don't; the editor shows status and the reviewer's note. Publishing a test with unapproved questions is refused.
- [x] **TCH-025** Share to the public bank `P2` `Solo` `Institute` · module `qbank.share` · needs SUP-031
  - Opt in to share good questions with every Learnigo teacher, after a review by the Learnigo content team. Credited to the author.
  - *Done (submission record only):* `POST /bank/questions/:m/:s/:id/share` creates a `PublicQuestionSubmission` (superAdminDb) with a content snapshot and credit; review UI is SUP-031.
- [ ] **TCH-026** AI-assisted drafting `P2` `Solo` `Institute`
  - "Make 5 questions on fractions for grade 4, mixed types" → drafts land as **unapproved** for the teacher to edit. Only when a language model is configured (never required).
  - *Not done:* no language model is configured in this build; skipped by design.
- [x] **TCH-027** Question quality stats `P1` `Solo` `Institute` · needs FND-043
  - Per question: times used, % correct, average time and the most common wrong answer. Flags: "too easy", "confusing", "possibly wrong key" (high-scorers miss it).
  - *Done:* times used, % correct, average time, most common wrong answer, flags (too easy, confusing, possibly wrong key) from test attempts, on the editor and the bank list.

## T4. Tests and their rules

- [x] **TCH-030** Test builder `P0` `Solo` `Institute` · module `tests`
  - Pick questions from the bank (filters + search), or use **random pools** ("8 from Fractions, difficulty 2–3"), with sections, reorder and points per question. Save as template, duplicate, and see the student preview.
  - *Done:* `Test` model; builder with bank picker, random pools (tests.advanced), sections, reorder, points, rubrics, templates (presets + "keep as template"), duplicate, student preview.
- [x] **TCH-031** Rules `P0` `Solo` `Institute` · module `tests` (advanced rules: `tests.advanced`)
  - *Done:* every rule in the table, enforced on the server (`utils/testRules.js`): timezone-aware window, total/per-question limits with auto hand-in, attempts + which counts, shuffles, hints/listen/AI lock, feedback timing, release auto/manual, style, pass mark, late work, light integrity log (never penalised). Advanced rules need `tests.advanced`.

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
- [x] **TCH-032** Assign `P0` `Solo` `Institute`
  - To groups, to some students, or to a group minus some students. Reminders to students (and parents, optional) at open, 24 h before close and at close.
  - *Done:* groups, some students, or a group minus some (`TestAssignment`, membership resolved live); notifications on assign, at open, 24 h before close and at close to students and (opt-in) linked parents. Reminders run on a 5-minute timer plus whenever lists are opened (no cron in the app).
- [x] **TCH-033** Student test player `P0` `Platform` · needs TCH-031
  - The student's side: a "To do" list on their home screen, a test intro card (rules in plain words, time, attempts), the familiar wooden-board question card, a progress bar, a timer when timed, saving offline and resuming after a dropped connection, and a calm submit/confirm screen.
  - *Done:* To do card on `/home`, player at `/test/:id`: rules in plain words, wooden-board card, progress, timer, autosave with an on-device queue that flushes when the connection returns, resume, calm hand-in. The answer key never reaches the browser; every answer goes through `recordAnswer({ testId, source: 'test' | 'homework', orgId })`.
- [x] **TCH-034** Accommodations per student `P1` `Solo` `Institute` · module `tests.advanced`
  - Extra time (×1.25, ×1.5, ×2), read-aloud always on, fewer options, larger text, separate quiet window. Set once on the student and applied to every test automatically. This fits the dyslexia-friendly audience Learnigo serves.
  - *Done:* extra time ×1.25/×1.5/×2, read-aloud always on, larger text, fewer options; set on the `Student`, applied at attempt start. *Not done:* a separate quiet window.
- [x] **TCH-035** Live monitor `P1` `Solo` `Institute`
  - During an open test: who has started, finished or is stuck (long time on one question), with a live % correct per question so the teacher can re-teach right away. Uses the polling pattern, no WebSockets.
  - *Done:* polling monitor (10 s): not started / working / away / stuck per student, live % correct per question.

## T5. Marking and feedback

- [x] **TCH-040** Auto-marking `P0` `Solo` `Institute`
  - Reuses `scoreAnswer.js`. Partial credit for multi-select, order and match pairs (configurable).
  - *Done:* `server/utils/scoreAnswer.js` (same rules as the client) with partial credit for multi-select, order, sequence, match pairs and sort bins.
- [x] **TCH-041** Marking queue for typed and spoken answers `P1` `Solo` `Institute` · module `grading.manual`
  - Typed long answers and voice recordings land in a queue with a rubric (criteria × levels), quick comments, a voice comment, and mark with the keyboard (next/prev). Works on a tablet.
  - *Done:* marking queue with rubric levels, quick comments, keyboard (J/K, 1-9, C, Enter) and touch. *Not done:* voice comments.
- [x] **TCH-042** Release results `P1` `Solo` `Institute`
  - Release now or at close. Students see their score and feedback, parents see results with the teacher's comment (PAR-051), and corrections after release are recorded in the audit log.
  - *Done:* release now or by rule; students and linked parents notified; corrections after release are audited (`test.mark.correct`) and the student is told.

## T6. Performance at every level

The same chart kit and time-range bar as the parents' (DSN-003, DSN-020), with
teacher-specific views. **Levels: test → group → subject → skill → student → session.**

- [x] **TCH-050** "Today" home `P0` `Solo` `Institute`
  - Today's classes (from the schedule), tests open now, **Needs attention** (at-risk students, unmarked work, failed tests), recent highlights ("Ravi mastered fractions!").
  - *Done:* `GET /api/teacher/today`: today's classes from schedules, needs attention (at-risk from `perLearner`), recent wins, week story and tiles. "Tests open now / unmarked work" wait for tests.
- [x] **TCH-051** Group dashboard `P0` `Solo` `Institute` · needs FND-043
  - Story card, tiles (active students, minutes per student, accuracy, mastery growth, test completion), **student × skill heatmap**, distribution strip, trend vs the previous period and compare with my other groups.
  - *Done:* group dashboard: story, tiles, student x (module x subject) heatmap (`GET /groups/:id/heatmap`), distribution strip, trend, comparison with my other groups (`GET /groups/compare`). Test completion tile waits for tests; skills are the 12 module x subject areas until FND-042.
- [ ] **TCH-052** Test results `P0` `Solo` `Institute`
  - Score distribution, per-student table, **item analysis** (difficulty, discrimination, time, common wrong answers, "possibly wrong key" flag), compare attempts and export.
- [x] **TCH-053** Subject and module views `P1` `Solo` `Institute`
- [x] **TCH-052** Test results `P0` `Solo` `Institute`
  - Score distribution, per-student table, **item analysis** (difficulty, discrimination, time, common wrong answers, "possibly wrong key" flag), compare attempts and export.
  - *Done:* distribution, per-student table, item analysis (difficulty, discrimination top-27 % vs bottom-27 %, time, common wrong answer, possibly-wrong-key flag), compare tries, CSV export (audited). 30 students in about 0.1 s in the integration test.
- [ ] **TCH-053** Subject and module views `P1` `Solo` `Institute`
  - Subject × module matrix for the group, a skill coverage map (skills taught vs mastered), and what's untouched.
  - *Done:* Subjects and skills tab: subject x module matrix and practised/mastered coverage per area.
- [x] **TCH-054** Individual student `P0` `Solo` `Institute` · needs TCH-013
  - *Done:* see TCH-013 (story, tiles, matrix, calendar, timeline, notes).
- [x] **TCH-055** Suggested groups `P2` `Solo` `Institute` · needs FND-044
  - "These 5 students are all stuck on fractions": one tap creates a temporary practice group with a suggested set of questions.
  - *Done:* `GET /groups/:id/suggestions` (students under 60 % on the same area) and one-tap practice groups (`POST /groups/suggested`, `groupKind: practice`, not counted against the group limit). Suggested question sets wait for practice sets.
- [x] **TCH-056** My teaching summary `P1` `Solo` `Institute`
  - The teacher's own view of what the admin sees about them (ADM-041): tests created, questions contributed, class engagement and growth, reply time. Transparent by design.
  - *Done:* `GET /api/teacher/summary`: groups, students, active, minutes per student, accuracy and growth, engagement, questions contributed (from uploads). `testsCreated` is 0 and `replyTimeHours` null until tests and messaging exist (explained in `notes`).

## T7. Homework and practice sets

- [x] **TCH-060** Practice sets `P1` `Solo` `Institute`
  - Lighter than tests: a set of questions or a module/subject ("15 min of Listen · Maths this week"), or an AI Teacher topic. They count towards mastery, not grades.
  - *Done:* practice sets (question sets with instant feedback, unlimited tries, recorded as `homework`) or a module target ("15 min of Listen · Maths") with progress from `LearnerDay`. The AI Teacher topic is stored but not yet linked into the AI Teacher.
- [x] **TCH-061** Auto-practice from results `P2` `Solo` `Institute`
  - After a test, each student gets practice on the skills they missed, built automatically and approved by the teacher in one click.
  - *Done:* after a test, per-student suggestions from missed skills (or the missed questions), sent as practice sets in one click.

## T8. Communication and reports

- [ ] **TCH-070** Messages with parents and admin `P1` `Solo` `Institute` · needs FND-051
- [ ] **TCH-071** Group announcements `P1` `Solo` `Institute` · needs FND-052
- [ ] **TCH-072** Reports `P1` `Solo` `Institute` · needs FND-060
  - Student report for parent meetings (one page: progress, strengths, next steps, teacher comment), group report and test report. Branded with the workspace logo on `reports.branded`.
- [ ] **TCH-073** Weekly teacher digest `P1` `Solo` `Institute` · needs FND-061

## T9. Solo business tools

- [x] **TCH-080** Solo plan and billing `P1` `Solo` · needs FND-032
  - Upgrade from Solo Free (1 group, 15 students), invoices and usage against limits.
  - *Done:* Plan page with plan, limits and usage and what Solo Pro adds; Upgrade shows "online payment coming soon, contact us". *Not done:* invoices and real upgrade (FND-032 billing).
- [x] **TCH-081** Branding for tutors `P1` `Solo` · module `reports.branded`
  - Logo and colour on reports, invite emails and the student join page. Builds the tutor's brand with parents.
  - *Done:* brand colour and logo on the org (both copies), gated by `reports.branded`; used in parent invite emails, the join page and the tutor page. Reports use it once FND-060 exists.
- [x] **TCH-082** Public tutor page `P2` `Solo`
  - Optional profile page (subjects, grades, testimonials) with a "join my class" button. A growth loop for Learnigo.
  - *Done:* optional public page `/tutor/:slug` (headline, bio, subjects, testimonials, "Join my class"), off until published; no email shown.

---

## Done means

- A new Solo tutor goes from signup to a group with students and a first assigned test in **≤ 15 minutes**.
- A test with 30 students shows item analysis within 5 s of the last submission.
- Institute teachers can never see another teacher's private groups or out-of-school activity (permission suite FND-002).
- Every view works on a tablet. Marking works with keyboard and touch.

## Tests API for other roles

- **Parent (for PAR-051):** `GET /api/parent/children/:id/tests` (verified links only, `childAccess`) returns
  `{ child: { name }, assigned: [{ testId, title, kind, teacher, opensAt, closesAt, phase, status: 'not_started'|'in_progress'|'waiting_for_result' }], upcoming: [...same], results: [{ testId, title, kind, teacher, submittedAt, percent, passed, late, needsMarking, attempts, comments: [string] }] }`.
  Results appear only once released to the student (`utils/testRules.isReleased`).
- **Student:** `/api/student/tests` (To do), `/tests/:id`, `/tests/:id/start`, `/attempts/:id` (+ `/open`, `/items/:itemId`, `/events`, `/submit`).
- **Teacher:** `/api/teacher/bank/*`, `/tests/*`, `/marking`, `/accommodations`, `/test-groups` (`routes/teacherTests.js`).
- Demo data: `scripts/seed-demo-tests.js` (`seedDemoTests(app, demo)` after `seedDemo`).

## Links to other roles

- **Admin:** assigns groups, approves questions (Institute), sets policies, sees teaching summaries ([ADMIN.md](ADMIN.md)).
- **Parent:** receives invites, results, comments and messages ([PARENT.md](PARENT.md)).
- **Super admin:** public question bank review, plans, support ([SUPER_ADMIN.md](SUPER_ADMIN.md)).
