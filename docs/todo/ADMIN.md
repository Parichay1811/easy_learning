# Admin: the principal's view of the whole school

[← Roadmap](README.md) · [Foundations](FOUNDATIONS.md) · [Design](DESIGN.md) · [Parent](PARENT.md) · [Teacher](TEACHER.md) · [Super Admin](SUPER_ADMIN.md)

**Who:** the principal, owner or coordinator of a school, coaching centre or
tutoring business: the **Institute** workspace. (In a Solo workspace the tutor
is their own admin, and these screens collapse into the teacher's settings.)

**The promise:** *"I set up my whole school in an afternoon, everyone is in the
right place, and in one screen I see how every grade, class, teacher and student is
doing, then drill into any of them."*

---

## What exists today

- Org registration → super admin approval/rejection (reversible), editing and resubmission, logo upload ([adminController.js](../../server/controllers/adminController.js), design-guide §5.4).
- CRUD for tutors (teachers), students, parents, subjects and batches. Batches have subjects, teachers per subject and weekly schedules with conflict checks ([BatchDetail.jsx](../../client/src/components/Admin/BatchDetail.jsx)).
- Student dashboards and performance, tutor performance and schedule, question upload review (approve/reject/edit), chat with the super admin, stats ([AdminDashboard.jsx](../../client/src/pages/admin/AdminDashboard.jsx)).
- **Gaps:**
  - The structure is flat (no campus/grade/section).
  - No bulk import, staff roles, school-wide analytics, teacher performance overview, academic years, policies, reports, billing or seats.
  - School-added parents can't log in as parents (FND-012).

---

## A1. Set up the school

- [x] **ADM-001** Setup wizard `P1` `Institute`
  - Org profile (exists) → **structure** (ADM-010) → **import people** (ADM-020) → **assign** teachers to groups → **invite parents** → **policies** (ADM-060). A progress meter shows what's left. It can be paused and resumed.
  - *Done:* `/admin-school/setup` (SetupPage) computes 7 steps from what exists (approval, tree, people, teachers on groups, parent invites, policies, DPA) with a progress meter; nothing to save, so it can be left and resumed. `GET /api/admin/setup`. A nudge card shows on the overview until done.
- [x] **ADM-002** Approval status and plan `P0` `Institute` · needs FND-030
  - Clear banners for pending / approved / rejected (with the reason and a resubmit button: exists), the current plan, trial days left, and seats used vs bought.
  - *Done:* `GET /api/admin/status` + banners in the school app: pending / rejected (reason, link to resubmit), plan, trial days left (`trialEndsAt` on the superadmin Organization, set by billing) and seats (90 % warning, 100 % full). Tested.

## A2. The school tree

- [x] **ADM-010** Structure builder `P1` `Institute` · module `org.tree` · needs FND-017
  - A visual tree: **Campus (optional) → Grade/Year → Section/Class → Groups**. Drag to move, rename inline, bulk-create ("Grades 1–8, sections A–C"). Departments (Maths, Science) can be set up as a second view of the same people.
  - *Done:* `OrgUnit` (adminDb) with id paths, subtree moves, inline rename, bulk create ("Grades 1-8, sections A-C", idempotent), delete only when empty; `Batch.unitId`, `Tutor.unitIds`, `Student.unitId`. Tree builder with drag and drop plus a keyboard "Move this unit to". Gated by `requireModule('org.tree')`; schools without it keep working flat (tested). Departments are units of type `department` (teachers via `unitIds`). *Not done:* a separate "department view" screen beyond the tree.
- [x] **ADM-011** People in the tree `P1` `Institute`
  - Every node shows its counts (students, teachers, groups) and a mini health bar (engagement). Click to open that node's dashboard (ADM-040).
  - *Done:* every node shows students/teachers/groups (subtree) and a 14-day engagement bar; click opens its people panel or its dashboard (`/admin-school/units/:id`, from `/api/admin/units/:id/analytics/*` and `/school/overview?unitId=`).
- [x] **ADM-012** Academic years and promotion `P1` `Institute` · needs FND-018
  - Create the next year and **promote** students (Grade 4A → 5A in bulk, with exceptions for repeaters and leavers). Archive last year's groups and tests (read-only, still reportable).
  - *Done:* `AcademicYear` (terms, holidays, exam weeks), years UI, promotion wizard (`/promotion/suggest|preview|apply`): 4A -> 5A mapping suggested, top grade leaves, per-student exceptions (repeat / leave / stay), archives the old groups (`Batch.archivedAt`, read-only on the admin routes with 409 `GROUP_ARCHIVED`, still reportable), sets the new year current, writes `StudentMove` history. Tested. *Not done:* archiving tests (no test models yet); teacher routes don't check `archivedAt` yet (TEACHER work).

## A3. People

- [x] **ADM-020** Bulk import `P0` `Institute`
  - CSV/XLSX for students (name, grade, section, optional email, parent emails) and teachers (name, email, subjects, units). Mapping screen, validation preview (duplicates, bad emails, missing grades), dry run, then import. Re-importing updates rather than duplicating. Google Classroom / Microsoft School Data Sync import is `P2`.
  - *Done:* upload CSV/XLSX (`/import/upload`, kept 24 h in `ImportSession`), automatic column mapping + mapping screen, dry run (`/import/:id/preview`: duplicates in file, bad/duplicate emails, missing names/grades, units that will be created, seat check), import (`/commit`); re-import matches by school id, email, then name+grade and updates. Teachers by email with subjects and units. Parents created from parent-email columns. Audited (`people.import`). Tested. *Not done:* Google Classroom / SDS (P2).
- [ ] **ADM-021** Managed student logins `P1` `Institute` · needs FND-011
  - For young students without email: printable login cards per class (picture password / QR) and a one-click reset.
- [x] **ADM-022** Parent invitations `P0` `Institute` · needs FND-012
  - Invite from student rows or in bulk. Track status (invited / linked / bounced). Resend. The invite is the verified link, so no codes are needed.
  - *Done:* bulk/row invites (`POST /invites`) through `sendMail` (Outbox when no SMTP), status invited / linked / bounced in `ParentInvite`, resend. Parent sign-in (`parentAuthController.googleSignIn` -> `utils/parentLinks.linkSchoolChildren`) turns every active org `Parent` with that verified email into verified `Child` links (pending ones are verified; revoked stay revoked); a parent who already has a login is linked at invite time. Tested end to end with real signed ID tokens.
- [x] **ADM-023** Staff roles `P1` `Institute` · module `staff.roles` · needs FND-020
  - **Admin** (everything), **Coordinator / Head of department** (everything inside chosen units or subjects), **Teacher**, **Office staff** (people management, no analytics), **Viewer** (read-only analytics, e.g. for a board member). Custom roles `P2`.
  - *Done:* `OrgStaff` (coordinator / office / viewer, `unitIds`, `subjects`), matched by verified email on the admin Google sign-in (token role `org_staff`, actor role `staff`, never `admin`). `utils/orgAccess.js`: one permission table, re-checks the staff row on every request (removal is immediate), unit-scoped queries, deny-by-default for older admin routes. Coordinators review only their subjects. Staff UI under People. Tested (coordinator can never see outside their units; office has no analytics; viewer read-only). *Not done:* custom roles (P2).
- [x] **ADM-024** Moves and leavers `P1` `Institute`
  - Move a student between sections (history follows them), mark a leaver (keeps data per the retention policy) and transfer a teacher's groups to another teacher.
  - *Done:* move between sections/groups with history (`StudentMove`), leavers (leave groups, free the seat, data kept), rejoin (needs a seat), hand a teacher's groups to another teacher. All audited and tested.
- [x] **ADM-025** Seats `P1` `Institute` · needs FND-031
  - Active students count as seats. A warning at 90 %, then adding is blocked at 100 % with "buy more seats". The learning itself is never blocked.
  - *Done:* `utils/seats.js`: active students = seats; bought = superadmin `Organization.seats` (billing) or plan `limits.students`; 90 % warning, 100 % blocks adding (legacy create, reactivation, import, rejoin) with 409 `SEATS_FULL` and a clear message. Learning routes never check seats (tested).

## A4. Analytics at every level

The same shell, time-range bar and chart kit as everyone else ([DESIGN.md](DESIGN.md)).
**Levels: school → campus → grade → section → group → subject → teacher → student.**
Every level has the same five blocks: story · tiles · main chart · comparisons · lists.

- [x] **ADM-040** School overview `P0` `Institute` · module `org.analytics` · needs FND-043
  - Story card ("84 % active this week; Grade 4 Science dipped 7 points; 12 at risk"). Tiles: active students %, minutes per student, average mastery, tests completed, at-risk count, parents linked %. A **unit sunburst** coloured by engagement. A **grade × subject heatmap**. Trends vs the previous term.
  - *Done:* `GET /api/admin/school/overview` (`org.analytics`): story, tiles (active %, minutes/student, accuracy, practising-or-mastered %, tests (feature-detected: "—" until test models exist), at-risk, parents linked %), unit sunburst by engagement, grade x subject heatmap with change vs the previous period, trend vs previous period or previous term (`?termId=`). New rollups in `analytics/queries.js` (`perEmailTotals`, `perEmailSubjects`, `rollupGroups`, `subjectGrid`, `growthRows`, `featureUse`, `activeSeries`) with tests. 500 students x 90 days: overview ~220 ms, unit drill-down ~20 ms (perf test).
- [x] **ADM-041** Teacher overview `P1` `Institute` · module `org.analytics`
  - For each teacher: groups and students, tests and practice sets created, questions contributed (approval rate), class engagement, **class growth** (mastery change of their students), marking turnaround, parent reply time and last active.
  - Framed as **support, not ranking:** default sort by name, with context (class size, starting level). Teachers see the same numbers about themselves (TCH-056).
  - *Done:* `/school/teachers`: groups, students, engagement, minutes/student, class growth (accuracy change of their students vs the previous period, with starting level), questions contributed and approval rate, tests (feature detection), last active; sorted by name with a support-not-ranking note. *Not done:* marking turnaround and parent reply time (need tests and messaging).
- [x] **ADM-042** Compare `P1` `Institute`
  - Any two or more units, groups, teachers or periods side by side (e.g. 5A vs 5B in Maths this term), with normalised metrics and a fairness note when group sizes differ.
  - *Done:* `/school/compare?items=unit:..,batch:..,teacher:..,school` (2-6), each optionally with its own period (`@from..to`); per-student figures and subject accuracy; fairness notes for very different or small groups.
- [x] **ADM-043** At-risk and wins lists `P0` `Institute` · needs FND-041
  - Students meeting the at-risk rule, grouped by unit, with their teacher and the reason. One click opens the student or messages the teacher/parent. "Wins" lists the biggest improvers to celebrate.
  - *Done:* `/school/lists`: at-risk grouped by section with teachers and reason; wins = biggest accuracy improvers, then biggest time gains (at-risk excluded). One click opens the student. *Not done:* "message the teacher/parent" button (messaging is COMMS work).
- [x] **ADM-044** Usage and adoption `P1` `Institute`
  - Logins by role over time, devices, peak hours, feature use (tests, AI Teacher, AR games) and parents linked/active. Shows where training is needed.
  - *Done:* `/school/usage`: learners active per day, hour x weekday heatmap, devices, feature use (from LearnerDay `sources`), teachers signed in / active (7/30 days, who never signed in), parents invited/linked/bounced, staff active. *Not done:* logins by role over time (no login log for teachers/parents yet).
- [ ] **ADM-045** Test and question analytics, school-wide `P1` `Institute`
  - Common assessments compared across sections, an item bank health view (questions flagged as confusing or wrong key) and curriculum coverage by grade.
  - *Partial:* `/school/tests` returns the question-bank health by subject/module/status today and `testsAvailable` by feature detection. *Not done:* common assessments and item analysis: the test models don't exist yet.
- [x] **ADM-046** Student profile (admin view) `P0` `Institute`
  - Today's per-student dashboards (exists) moved into the shared in-depth profile, with school-context activity plus the teacher notes the school can see.
  - *Done:* `/admin-school/students/:id`: school context (`/students/:id/profile`: section, groups and teachers, parents with link status, move history, consent) plus the shared analytics (`/students/:id/analytics/*`): story, tiles, subject x module matrix, calendar, trend. School holidays keep streaks if the school chose that. *Not done:* teacher notes (no notes model yet).

## A5. Content and quality

- [x] **ADM-050** Question review queue `P0` `Institute` (exists: improve)
  - Keep the approve/reject flow and add a side-by-side preview on the wooden board, reviewer notes, bulk approve and an SLA counter. Coordinators review their own departments.
  - *Done:* review queue (`/api/admin/review*`) with SLA counter (`OrgPolicy.reviewSlaDays`, overdue flag), preview of each question on the wooden chalkboard (QuestionCard styles), reviewer notes, approve / send back with reason, bulk approve; coordinators see only their subjects. Tested. The old approve/reject routes are unchanged.
- [ ] **ADM-051** School question bank `P1` `Institute`
  - Approved questions become a shared school bank with tags, collections and ownership. Teachers can reuse them (TCH-023).
  - *Partial:* approved uploads form the school bank (`/api/admin/bank`) with tags and tag filter. *Not done:* collections, per-question ownership and teacher reuse (TCH-023).
- [ ] **ADM-052** Common tests `P1` `Institute`
  - The admin or a coordinator builds a test once and assigns it to many sections (same rules), then compares results (ADM-042).
  - *Not done:* needs the test models (TEACHER work).

## A6. Policies and settings

- [x] **ADM-060** Policies `P1` `Institute` · module `comms.policy` · needs FND-022
  - Teachers may create their own groups (y/n). Parent ↔ teacher messaging (off / parent starts / both), office hours. Parents see class averages (y/n). Leaderboards (off / within group). AI Teacher during school hours (on/off). Which activity the school sees (assigned work only / school hours / all with parental consent).
  - *Done:* `GET/PUT /api/admin/policies` with validation, audited; settings UI. Enforcement helpers for other features: `policyAllows(orgId, rule)` and `requirePolicy(rule)` in `utils/orgPolicy.js` (403 `POLICY_BLOCKED`), unit-tested. Enforced in this agent's code: streak holidays, review SLA, retention value. *Not enforced here (other owners):* teacher group creation (TEACHER: mount `requirePolicy('teachersCreateGroups')`), messaging/office hours (COMMS), class averages/leaderboards (PARENT), AI Teacher in school hours, activity visibility (needs `orgId` on rollups). Saving needs `comms.policy`.
- [x] **ADM-061** Branding `P1` `Institute` · module `reports.branded`
  - Logo (exists), colours, report header and footer, and a custom welcome message on the join page.
  - *Done:* colours, report header/footer and welcome message in `OrgPolicy.branding` (`PUT /api/admin/branding`, module `reports.branded`), with a live preview. Logo stays in the org profile. *Not done:* using them in reports/join page (COMMS reports work).
- [x] **ADM-062** Calendar `P2` `Institute`
  - Terms, holidays and exam weeks. Used by streak logic (holidays don't break streaks if the school wishes) and the analytics comparisons.
  - *Done:* terms, holidays and exam weeks on `AcademicYear`; `queries.streak(email, tz, { skipDates })` (holidays bridge a streak without counting), used for students in the school view when `holidaysKeepStreak` is on; terms drive "vs previous term". Tested.

## A7. Communication and reports

- [ ] **ADM-070** Announcements `P1` `Institute` · needs FND-052
  - To the whole school, a unit, all parents of a grade, or staff only. Schedule them, see read rates.
- [ ] **ADM-071** Messages `P1` `Institute` · needs FND-051
  - Admin ↔ teachers, admin ↔ parents, admin ↔ Learnigo support (exists). With the right staff role, the admin can see messaging **activity** (counts, reply times) but not the content, unless policy and law allow it.
- [ ] **ADM-072** Reports `P1` `Institute` · needs FND-060
  - Term report cards per student (bulk PDF per section), section/grade/school reports for meetings and board packs, scheduled monthly summary email to the admin.
- [ ] **ADM-073** Export `P1` `Institute` · needs FND-062
  - Any table to CSV/XLSX. Full school export (for moving systems or audits) on request, logged in the audit log.

## A8. Billing, privacy, audit

- [x] **ADM-080** Billing `P1` `Institute` · needs FND-032
  - Plan, seats, invoices, pay by card or request an invoice/PO, renewal date, VAT ID.
  - *Done (read-only):* `/api/admin/billing`: plan, modules, status, seats, renewal (`periodEnd`/`renewalAt`), trial end, VAT id, invoices if the billing work stores them on the superadmin Organization. Actions are SUPER_ADMIN work.
- [x] **ADM-081** Data protection `P1` `Institute` · needs FND-070, FND-071
  - Sign the data-processing agreement in the app. Records of consent for each student. Retention settings (keep data N years after leaving). Handle parent data requests for the school's students.
  - *Done:* sign the DPA in the app (name, role, version; stored on `OrgPolicy`, audited), consent records per student (`ConsentRecord`, record/withdraw), retention years in policies, counts. *Not done:* the retention enforcement job; parent data requests list shows once `models/DataRequest.js` exists (feature-detected).
- [x] **ADM-082** Audit log `P1` `Institute` · needs FND-072
  - Who changed what in the school: imports, role changes, grade changes, exports, deletions, sensitive views. Filter and export.
  - *Done:* `/api/admin/audit`: this school's `AuditEvent`s, filter by action/date/actor, CSV export (itself audited), integrity check (each event's hash and the existence of its predecessor, so other schools' events are never read). Tested including tampering.

---

## Done means

- A 500-student school is set up (tree, import, teachers assigned, parents invited) in **under 2 hours** using the wizard and CSV import.
- The school overview loads in < 2 s and any drill-down in < 500 ms, from rollups.
- A coordinator sees only their units. Verified by the permission suite (FND-002).
- In a meeting, the principal answers "Which section needs help in Maths this term, and why?" in under a minute.

## Links to other roles

- **Teacher:** groups, policies, question review, teaching summaries ([TEACHER.md](TEACHER.md)).
- **Parent:** invites, announcements, reports, privacy ([PARENT.md](PARENT.md)).
- **Super admin:** approval, plan and seats, support, data-processing agreement and data requests ([SUPER_ADMIN.md](SUPER_ADMIN.md)).
