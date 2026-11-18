# Foundations: the shared work every role needs

[← Roadmap](README.md) · [Design](DESIGN.md) · [Parent](PARENT.md) · [Teacher](TEACHER.md) · [Admin](ADMIN.md) · [Super Admin](SUPER_ADMIN.md)

The role plans assume the pieces below exist. Build them once here, never
per role. Today's architecture is in [docs/design-guide.md](../design-guide.md):
three MongoDB connections, three login systems, and student activity keyed by
email.

---

## F0. Must fix before selling

- [x] **FND-001** Close the parent → any-student data leak `P0` `Family` *(done: PR #86)*
  - **Today:** `POST /api/parent/children` ([parentController.js](../../server/controllers/parentController.js) `createChild`) accepts **any** email. Then `GET /children/:id/performance` and `/children/:id/dashboard/*` return that student's full learning history. A stranger can read any child's data by typing their email.
  - **Fix:** a new link starts as `pending` and shows no data until it is verified through one of the flows in FND-012. Existing `Child` rows are migrated to `pending`, except where the child's activity was created by that parent's own managed account.
  - **Accept when:** an automated test proves that an unverified link returns 403 on every child endpoint.
  - **Done:** `Child.linkStatus` (`pending` / `verified` / `revoked`, legacy rows read as pending). `childAccess()` in [guardianLink.js](../../server/utils/guardianLink.js) is the one rule, used by `parentChildAccess` and the performance route, and a test checks every `/children/:id/dashboard/*` route sits behind it. Changing a child's email resets the link to pending. Existing links are migrated with `server/scripts/migrate-verify-children.js` (dry run by default).
- [ ] **FND-002** Permission regression suite `P0` `Platform` · needs FND-020
  - *Started:* `server/test/guardian-link.test.js` covers parent → child access (16 tests, `npm test` in `server/`). The full route × role table is still to do.
  - An automated table test that calls every `/api/*` route as each role (anonymous, student, parent, solo teacher, institute teacher, admin of org A, admin of org B, super admin) and checks the expected 200/403/404. It runs in CI and blocks a merge on failure.

## F1. Accounts and identity

Today each role has its own login: students (Firebase or JWT), org admins (email/password), teachers (Google, matched to a `Tutor`), parents (`ParentAccount`, Firebase) and a single super admin from env vars. One person can't be a teacher **and** a parent without two logins.

- [ ] **FND-010** One account per person, many memberships `P1` `Platform`
  - New `Account` (uid, email(s), name, avatar, locale, timezone, auth providers) and `Membership {accountId, orgId?, role: learner|parent|teacher|admin|staff, unitIds[], status}`.
  - Role switcher in the dashboard shell (see [DESIGN.md](DESIGN.md#d2-the-shell-one-frame-for-every-role)): "Aanya's parent · Teacher at Sunrise School · My tutoring".
  - Migration: back-fill `Account` from `User`, `ParentAccount`, `OrgAdmin` and `Tutor` by email. Old JWT middlewares keep working during the transition, resolving to the same `Account`.
- [x] **FND-011** Learners without email (managed accounts) `P0` `Family` `Solo` `Institute`
  - *Done (Parent work):* `services/managedLearners.js` `createManagedLearner({ name, age, avatar, createdByRole, createdById, orgId, batchId })` -> `{ learner, loginCode, picturePassword }` (model `ManagedLearner`, synthetic email `ml-<id>@managed.learnigo.invalid` so all analytics work unchanged; with `orgId` it also creates the roster `Student`). Sign-in `POST /api/auth/managed-login { loginCode, picture }` (hashed code, bcrypt pictures, per-IP and per-code limits, lockout, one answer for every failure) and the "I have a class code" login. *Not done:* teacher QR cards and the class-code + "pick your name" flow (Teacher work), `learnerId` on the activity collections, graduating to an own login.
  - Young children rarely have email. A parent or teacher creates a **managed learner**: display name and avatar, sign-in by **class code + picture password**, or a QR card printed by the teacher.
  - Give each learner a stable `learnerId`. Activity collections (`StudentAnswer`, `StudentRound`, `StudentActivity`, `StudentAchievement`, `ARSession`) gain a `learnerId`. Keep `email` for compatibility, and back-fill.
  - A managed learner can later "graduate" to their own login without losing history.
- [ ] **FND-012** Verified linking flows `P0` `Family` `Solo` `Institute` · needs FND-011
  - *School-verified sign-in (ADMIN work):* `utils/parentLinks.linkSchoolChildren` runs on every parent sign-in: each active org `Parent` with the verified email becomes verified `Child` links (pending ones are verified, revoked ones untouched); `ParentInvite` tracks invited / linked / bounced.
  - *Parent work:* parent-created managed learners (verified as guardian), revoking a link, co-guardian invites. Teacher join codes are the Teacher work.
  - *Done so far (PR #86):* **school-verified** (an org `Parent` and `Student` with matching emails verify a link automatically) and **link code** (the learner makes a one-time 6-character code on their Dashboard, valid 24 h, stored hashed, rate-limited; the parent enters it). *Still to do:* parent-created managed learners, teacher join codes, revoking a link, co-guardian approval.
  - **School-verified:** the admin adds a parent to a student (the `admin/Parent` records that exist today), and the parent gets an email invite. When they sign in with that email they are linked and verified. *This also connects the two parent systems that are separate today.*
  - **Parent-created:** the parent creates a managed learner and is verified as its guardian.
  - **Link code:** an existing student generates a 6-character code or QR (valid 24 h). The parent enters it, and the student (or the guardian already linked) approves.
  - **Teacher join:** a group join code, invite link or QR, plus roster import (TCH-011). The student accepts, or for managed learners the teacher adds them.
  - Every link stores `{verifiedBy, method, at, consentVersion}`, and any linked guardian or the admin can revoke it.
- [x] **FND-013** Several guardians per child `P1` `Family`
  - *Done:* `GuardianInvite` (bound to the invited email, hashed token, 14 days, mail via the outbox), accept by link or from the kids page, main guardian removes co-guardians (not school-verified ones), notification preferences per guardian row.
  - Co-parent invite. Each guardian has their own notification settings. The primary guardian can remove others, except where a school verified the link.
- [ ] **FND-014** Multi-factor login for staff `P1` `Platform`
  - *Partial:* TOTP done for super admin staff (SUP-001, reusable `utils/totp.js`). Not done for org admins and teachers (they sign in with Google).
  - Required for admins and super admins, optional for teachers. TOTP first, passkeys later.

## F2. Organisation tree

- [x] **FND-015** `Organization.kind = 'solo' | 'institute'` `P0` `Solo` `Institute`
  - Solo self-signup creates an `Organization(kind: solo)` that is auto-approved, plus an `OrgAdmin` and a `Tutor` for the same account. All existing batch, question and approval code then works for solo tutors unchanged. Questions are auto-approved when `kind === 'solo'`.
  - Keep the adminDb and superAdminDb `Organization` copies in sync (design-guide §4). Better still, do FND-016.
  - *Done (Teacher work):* Solo self-signup creates both `Organization` copies (`kind: solo`, approved, `plan: solo_free`), an OrgAdmin and a Tutor (`services/teacherWorkspaces.js`). FND-016 still to do.
- [ ] **FND-016** One source of truth for `Organization` `P1` `Platform`
  - Replace the hand-synced duplicate with one collection, read by the super admin through a service. Remove the double-write sites listed in design-guide §5.4.
- [x] **FND-017** Org units `P1` `Institute`
  - *Done (ADMIN work):* `models/admin/OrgUnit.js` with id paths (`/<campus>/<grade>/<section>/`, renames are free), `utils/orgUnits.js` (create, bulk, rename, move subtree, delete-if-empty, `membersOf`, `unitCounts`), `Batch.unitId`, `Student.unitId`, `Tutor.unitIds`. Unit analytics sum `LearnerDay` for the unit's learners on demand (no `unitPath` rollup table needed: 500 students in ~220 ms).
  - `OrgUnit {orgId, parentId, type: campus|grade|section|department, name, path}` with a materialized `path` (`/campus1/grade5/5B`) for fast subtree queries. `Batch` gains `unitId`.
  - Moving a unit moves its subtree. Analytics rollups are keyed by `unitPath` so any level can be summed.
- [x] **FND-018** Academic years and terms `P1` `Institute`
  - *Done (ADMIN work):* `models/admin/AcademicYear.js` (terms, holidays, exam weeks), promotion with `StudentMove` history, `Batch.yearId` and `Batch.archivedAt` (read-only on admin routes). *Still to do:* tests belonging to a year (test models), teacher routes honouring `archivedAt`.
  - `AcademicYear {orgId, name, start, end, terms[]}`. Groups, tests and reports belong to a year, and old years stay readable (read-only).

## F3. Permissions: one rule engine

- [ ] **FND-020** `can(actor, action, resource)` used by every route `P0` `Platform`
  - *Partly done:* `utils/actors.js` (one actor shape for every role) and `utils/scopes.js` (checks permission and returns the learners a role may see) now guard all analytics routes. Older routes still use their own checks.
  - Replace the scattered org/tutor checks with one policy module, `server/utils/policy.js`, and an Express helper `authorize('tests.edit', loadTest)`.
  - Rules are resolved from membership role, unit scope (a coordinator sees `/grade5/*`), group assignment (teacher), guardianship (parent) and plan entitlements (FND-030).
  - The same rules are exposed to the client (`useCan('tests.edit', test)`), so the UI hides actions the user can't perform.

### Permission matrix (target)

| Resource → / Actor ↓ | Learner | Parent | Teacher | Coordinator | Admin | Super admin |
|---|---|---|---|---|---|---|
| Learner profile & analytics | self | verified children | students in their groups | students in their units | whole org | all, audited |
| Usage logs (sessions, devices, times) | self | verified children | own groups (in-workspace activity only) | units | org | all, audited |
| Questions | — | — | own; org bank read | units' bank | org bank, approve | global bank |
| Tests | take assigned | view children's | own; co-teach shared | units | all in org | templates |
| Groups | view own | view children's | own / assigned | units | all | read |
| Teachers | — | names of child's teachers | self | units | all | all |
| Org settings, billing | — | own family plan | own (solo) | — | ✓ | ✓ |

## F4. Visibility: who sees what

- [ ] **FND-021** Scope analytics to the viewer's workspace `P0` `Solo` `Institute`
  - A school sees activity that happens **in the school's context**: assigned tests and work, and activity during school hours if the org opts in. It does not see free home play or another tutor's tests. Parents see everything their child does.
  - Every event stores `orgId` (nullable) and `groupIds` at the time it happened (FND-040), so this filter is cheap.
- [x] **FND-022** Privacy settings per org `P1` `Institute`
  - *Done (ADMIN work):* `GET/PUT /api/admin/policies` with validation; `policyAllows` / `requirePolicy` in `utils/orgPolicy.js` for the features that must obey them (see FOUNDATION_API.md). *Not done:* a "teachers see each other's groups" setting.
  - Whether parents see class averages, whether leaderboards are on, whether parents can message teachers, and whether teachers can see each other's groups.

## F5. Plans, modules and entitlements

- [x] **FND-030** Entitlement service `P0` `Platform`
  - *Done:* plans and modules in `config/plans.js`; `entitlementsFor` / `requireModule` (402 with an upgrade payload); super admin overrides per org; `GET /api/entitlements`. Billing (FND-032) is separate.
  - `entitlements(account|org) → Set<moduleKey>` comes from the plan, plus add-ons, plus per-org overrides set by the super admin.
  - Server: `requireModule('tests')` middleware. Client: `useModule('tests')` drives UI gating with a friendly upgrade card (DSN-030), never a broken page.
  - Module keys: `core.learning`, `ai.teacher`, `family.link`, `analytics.basic`, `analytics.deep`, `groups`, `qbank.author`, `qbank.share`, `tests`, `tests.advanced`, `grading.manual`, `reports.branded`, `comms`, `comms.policy`, `org.tree`, `org.campus`, `org.analytics`, `staff.roles`, `sso`, `api.export`.
  - Migrate the existing `subscriptionPlan` enum (`free/basic/pro/enterprise` on superadmin `Organization`) to plan ids (`free`, `family_plus`, `solo_free`, `solo_pro`, `institute`, `enterprise`).
- [ ] **FND-031** Limits `P1` `Solo` `Institute`
  - *Seats done (ADMIN work):* `utils/seats.js` `seatInfo` / `assertSeats` (bought seats = superadmin `Organization.seats` or plan `limits.students`).
  - Seats (students per org), groups per solo plan, storage for media, tests per month (if needed). Show usage against each limit on billing pages.
  - *Partly done (Teacher work):* `groups` and `students` limits enforced for teachers (402 `PLAN_LIMIT`) with usage on the Groups and Plan pages; join links respect them. Admin-side creation and storage/tests limits are not enforced yet.
- [ ] **FND-032** Billing `P1` `Family` `Solo` `Institute`
  - Stripe Checkout and the Customer Portal for cards. Stripe Tax handles EU VAT. Schools can pay by invoice or purchase order with a manual "mark as paid" for the super admin.
  - Trials (14 days of Solo Pro or Institute), coupons, upgrade/downgrade with proration. A webhook writes `Subscription {ownerType, ownerId, plan, status, seats, periodEnd}`.
  - When a plan lapses: read-only, never data loss. Students can always keep learning on the free plan.

## F6. Analytics engine

The heart of the parent "wow" and every other dashboard. It must stay cheap on our 2-vCPU / 8 GB server, so **nothing heavy is computed when a page loads**.

- [x] **FND-040** One event shape `P0` `Platform`
  - *Done:* `LearningEvent` + `LearnerDay`, written by `analytics/record.js` from answer, session and round logging.
  - `LearningEvent {learnerId, ts, tz, orgId?, groupIds[], testId?, kind, module, subject, skillIds[], questionId?, correct?, firstTry?, timeMs?, hintsUsed?, listenPlays?, attempt?, xp?, stars?, device: {type, os, browser}, source: practice|warrior|test|homework|ar|ai_teacher}`.
  - Write events from the existing logging endpoints (`/api/dashboard/log-answer`, `log-round`, `log-session`), the AR telemetry ([ARSession](../../server/models/ARSession.js)) and the AI Teacher (FND-045). Keep the old collections working, and retire them later.
  - TTL: raw events are kept for 24 months (configurable). Rollups are kept forever.
- [x] **FND-041** Metrics dictionary `P0` `Platform`
  - *Done:* `utils/metrics.js` (definitions, mastery levels, engagement score), served at `GET /api/meta/metrics`.
  - One file (`shared/metrics.js`, used by both server and client) defines each metric's formula, label, unit and help text. Every dashboard uses it, so the numbers always agree across roles.

  | Metric | Definition |
  |---|---|
  | Active time | Sum of session durations (idle > 2 min excluded) |
  | Active days | Days with ≥ 1 answered question or ≥ 3 min active |
  | Streak | Consecutive active days, in the learner's timezone |
  | Accuracy | Correct ÷ answered |
  | First-try accuracy | Correct on first attempt ÷ answered |
  | Independence | Answers without hint ÷ answered |
  | Speed | Median time per question (by interaction type) |
  | Mastery (per skill) | Recency-weighted first-try accuracy over the last 20 attempts → Not started / Learning / Practising / Mastered (thresholds 0, 50 %, 80 %) |
  | Growth | Change in mastery or accuracy vs the previous equal period |
  | Consistency | Active days ÷ days in period |
  | Engagement | Weighted mix of active days, time and completion (documented weights) |
  | At risk | No activity for 7 days with assigned work, or accuracy falling > 15 points over 2 weeks, or 3 failed tests in a row |
- [ ] **FND-042** Skills and topics on every question `P0` `Platform`
  - Audit the question banks (Listen/Read/Write/Speak × English/Maths/Science) and add `skillIds[]`, `gradeBand` and `difficulty 1–5`. Optionally map to curricula (UK National Curriculum, Common Core, CBSE). A backfill script uses existing fields, plus a review UI for the content team (SUP-030).
  - *Partly done:* optional `skillIds`, `gradeBand`, `difficulty`, `curriculumCode`, `estimatedSeconds` (+ `orgId`, `version`) on the shared question schema; `scripts/backfill-question-tags.js` (dry run, `--apply`) fills difficulty, skills and time from `level`/`difficulty_band`/`academic.skill`/`telemetry`. *Not done:* curriculum mapping and the content-team review UI (SUP-030).
- [x] **FND-043** Pre-computed rollups `P0` `Platform` · needs FND-040
  - *Done:* `LearnerDay` upserts as events arrive; day/week/month series; `scripts/backfill-learner-days.js`. *Nightly group/unit rollup tables were deliberately skipped:* group and unit views sum `LearnerDay` for their learners on demand (indexed on `{email, date}`).
  - `LearnerDay {learnerId, date(local), minutes, sessions, answered, correct, firstTryCorrect, hints, xp, stars, byModuleSubject{}, bySkill{}, byHour[24], devices{}, firstAt, lastAt}`, updated with `$inc` upserts as each event arrives (no batch job on page load).
  - Weekly, monthly and yearly figures are summed from `LearnerDay` (at most 366 small docs per learner-year, so fast). Cache `LearnerPeriod` for closed periods.
  - `GroupDay` and `UnitDay` (keyed by `unitPath`) and `OrgDay` are filled by a nightly job in a low-priority child process (the same pattern as the AI assistant worker), so the API process is never slowed down.
  - Indexes: `{learnerId, date}`, `{groupId, date}`, `{orgId, unitPath, date}`.
- [x] **FND-044** Insights engine (plain-language findings) `P1` `Platform` · needs FND-041, FND-043
  - *Done:* rule-based `analytics/insights.js` (`buildInsights`, `buildStory`), no AI needed.
  - Rule-based and translatable templates. "Best learning time: weekday evenings, 6–7 pm." "Strongest: Listen · Maths (92 %)." "Practise next: fractions (Learning, 54 %)." "Up 12 points in Read · English since last month." "New record: 9-day streak!"
  - Each insight has a severity (celebrate / info / nudge / alert), the evidence behind it (a link to the chart) and a suggested action.
  - Optional AI wording: only when a language model is configured (the full server profile), never needed for the feature to work.
- [x] **FND-045** AI Teacher usage per learner `P1` `Family` `Platform`
  - *Done:* the AI Teacher page posts `POST /api/dashboard/ai-teacher-log { topic, title, subject, seconds }` when a learner token is in the browser (lesson id from the pack, never typed text); stored as LearningEvent `ai_teacher` and added to LearnerDay minutes. *Not done:* quiz results and question counts.
  - When a signed-in learner uses the AI Teacher, log topic id, subject, duration, quiz results and the number of questions asked. Store the **topic, not the free text** by default. Parents see topics; showing raw questions is an org/parent setting that is off by default.
  - The assistant today is anonymous ([server/ai-assistant](../../server/ai-assistant)). Pass the learner context through the existing `/api/ai-assistant/*` proxy.
- [ ] **FND-046** Usage logs `P1` `Family` `Platform`
  - A session timeline per learner: start/end, device, pages/modules visited, what was played, results and pauses. It drives the parent "Activity log" and teacher "Session replay lite". Raw logs older than 24 months collapse to rollups.

## F7. Notifications and messaging

- [x] **FND-050** Notification centre `P1` `Platform`
  - *Done:* `Notification` model, `notify()`, and the list / unread / read endpoints (paginated with `before`). Preferences per account and kind (`instant` / `digest` / `off`, `GET/PUT /api/notification-prefs`) that `notify()` respects; instant email for email-worthy kinds through `sendMail`, a daily digest email for `digest` kinds, one-tap signed unsubscribe. `NotificationBell` and `NotificationPrefs` in `client/src/components/comms/`. *Not done:* web push / PWA (`P2`).
  - `Notification {accountId, kind, title, body, link, readAt}`. A bell in the shell with an unread count uses the existing polling pattern (~25 s, design-guide §5.4: no WebSockets). Plus email, with web push via a progressive web app (PWA) later (`P2`).
  - Every account has preferences per kind (instant / daily digest / off).
- [x] **FND-051** Messaging, generalised `P1` `Institute` `Solo`
  - *Done:* `Thread` / `Message` (`models/comms/`), `/api/messages/*`. Who may write to whom comes only from real links (`services/commsLinks.js`: a parent and the teachers of their **verified** child in that child's school, parent and school office, teacher and school office), the school's `messaging` policy (off / parent_starts / both), office-hours notice and the `comms` module. Threads per child, read receipts, private attachments (images/PDF, 5 MB, 3 per message, served only to participants), abuse reports with admin/super admin review and hide, rate limits, `GET /api/admin/messaging/metrics` (counts and reply times only). `MessageCenter` component. Old admin/parent to super admin chats untouched.
  - Extend the existing admin↔super-admin and parent↔super-admin chat to threads between any two linked accounts: parent↔teacher, teacher↔admin, parent↔admin. Org policy decides who may start a thread (FND-022). Attachments and read receipts. Flag abusive messages (SUP-051).
- [x] **FND-052** Announcements `P1` `Institute` `Platform`
  - *Done:* `Announcement` + `AnnouncementReceipt`, `/api/announcements` (compose with dry-run reach, feed, read, sent list with read rates, report, cancel, audiences). Super admin: platform or segment (roles, org kind, plans); admin: school, groups, units (once `models/admin/OrgUnit.js` exists), parents of a grade, staff; teacher: own groups (+ verified parents). Scheduled send and expiry via the scheduler. `AnnouncementsPanel` and `AnnouncementComposer`. *Not done:* students as recipients (they have no stable notification id yet, FND-011).
  - Super admin → everyone or a segment. Admin → org, unit or group. Teacher → group (and its parents).

## F8. Reports and exports

- [x] **FND-060** Report generator `P1` `Platform`
  - *Done (browser PDF, no server PDF by design):* `/api/reports/{parent,teacher,admin,superadmin}/...` assemble learner / group / school reports from `analytics/queries.js` through the same scopes as the dashboards; `ReportView` (`client/src/components/reports/`) prints only the report on A4/Letter, black-and-white-safe patterns, school logo on `reports.branded`, "Print / Save as PDF". *Not done:* test-result report (needs the tests feature), term reports (need FND-018).
  - HTML template → PDF (headless Chrome in a worker process, queued, one at a time on the small server). Branded with the org logo on `reports.branded`.
  - Report types: learner weekly / monthly / term, group, unit, org and test result.
- [x] **FND-061** Scheduled digests `P1` `Family` `Institute`
  - *Done:* `services/scheduler.js` (one line in `server.js`, jittered, leased, `SCHEDULER=off`), `services/digests.js`: weekly parent email (Sunday from 18:00 local, verified children only: story, 4 tiles, one idea, button), Monday teacher summary, monthly admin summary, daily notification digest. Idempotent per period (each recipient claimed in `JobRun` before sending), small batches with yields, inline-styled table emails, strings in `server/i18n/emails.js`, one-tap unsubscribe. Super admin: `GET /api/jobs`, `POST /api/jobs/:name/run`. *Not done:* the monthly PDF attachment (parents can print `ReportView`).
  - A weekly parent email (Sunday evening, local time) and a monthly PDF. A weekly teacher summary on Monday morning. A monthly school summary for the admin.
- [x] **FND-062** CSV/XLSX export `P1` `Solo` `Institute`
  - *Done:* `utils/exporter.js` (streams CSV or XLSX, formula-injection safe, audits every export), used by the report learner tables (`.../learners.export?format=csv|xlsx`). API keys (`api.export`): `GET/POST/DELETE /api/admin/api-keys` (hashed, scoped, max 10, audited), `GET /api/v1/learners` and `/api/v1/daily-summaries` (org-only, paginated, 60 req/min per key). Role pages still need to call `exportRows` for their own tables.
  - Every table can be exported. `api.export` adds a read-only REST API with org-scoped API keys (`P2`).

## F9. Privacy, security, compliance (we serve children, from the EU)

- [ ] **FND-070** Consent records `P0` `Family` `Institute`
  - *Partly done:* `ConsentRecord` (append-only) and `utils/consent.js` (`recordConsent`, `currentConsent`, `hasConsent`, `consentHistory`, `needsGuardianConsent` with the GDPR Art. 8 age per country); `GET/POST /api/consents` for parents (own child), admins (own students, school DPA basis) and the super admin (read, audited). *Still to do:* the Parent and Admin flows must call `recordConsent` at link/sign-up time.
  - *Partly done:* parent links keep a `consentHistory` (who, what, policy version, when) shown in the privacy centre. Age-of-consent rules per country and the school DPA basis are not done.
  - Store who consented, for which child, the policy version and when. Under the GDPR Art. 8 age (13–16 depending on country) a guardian must consent. Schools consent through their data-processing agreement (DPA) and record the legal basis.
- [x] **FND-071** Data rights `P1` `Platform`
  - *Done:* `models/DataRequest.js`, `services/dataRights.js` (`exportLearner` JSON without secrets, `requestDeletion` with 30-day grace, cancel, `approveRequest`/`rejectRequest`, `runDueDeletions` -> `eraseLearner` cascade over the main DB, managed account, guardian links, cheers, shares, and anonymised school roster rows). Queue API `/api/superadmin/data-requests` (list, approve, reject, run-due) and `scripts/process-data-requests.js` for a daily job. *Not done:* PDF export, the Super Admin queue UI (SUP-060).
  - Export everything about a learner (JSON + PDF) and delete a learner, with a 30-day grace period and cascade across all three databases. The super admin handles requests in a queue (SUP-060).
- [x] **FND-072** Audit log `P0` `Platform`
  - *Done:* hash-chained `AuditEvent` + `audit()`. Viewer screens are in the Admin and Super Admin plans.
  - An append-only `AuditEvent {actor, action, target, orgId, ip, at, reason?}` for logins, permission changes, exports, deletions, "view as" and grade changes. Visible to the admin (their org) and the super admin.
- [ ] **FND-073** Data minimisation `P1` `Platform`
  - *Partly done:* `utils/minimise.js`: `firstNameInitial`, `leaderboardRows` (first name + initial, no ids/emails), `benchmark` / `benchmarks` (null under 20 learners). Weekly teacher emails already use first name + initial. *Still to do:* leaderboard and benchmark features must use them; the public "no ads, no trackers" statement.
  - No ads, no third-party trackers on learner pages, no selling of data (state it publicly). Leaderboards show first name + initial only. Benchmarks need ≥ 20 learners per bucket.
- [ ] **FND-074** Security hardening `P1` `Platform`
  - Rate limits on login and link-code endpoints, lockout, session revocation, httpOnly cookies for all roles (move tokens out of `localStorage`), secrets rotation (some were shared in chat), dependency scanning, backups with restore drills.

## F10. Performance and reliability on our server

- [ ] **FND-080** Performance budgets `P1` `Platform`
  - Dashboard reads p95 < 300 ms (served from rollups). First paint < 2 s on 4G. Charts render ≤ 2,000 points (aggregate first).
  - Heavy work (rollup jobs, PDFs, imports) runs in child processes at low priority, never inside the API process. We learned this when the in-process AI assistant starved every route.
- [ ] **FND-081** Monitoring `P1` `Platform`
  - Health endpoint per subsystem, PM2 restart counts, CPU steal alarm (a crash-looping process once pushed steal to 95 %), slow-query log, error tracking. All of it surfaces in SUP-040.

## F11. Quality and demo

- [ ] **FND-090** Demo data generator `P1` `Platform`
  - A script that seeds a realistic Solo tutor, a school (2 campuses, 6 grades, 600 learners, 30 teachers, 400 parents) and a family with 18 months of believable activity. It powers sales demos, screenshots and load tests.
- [ ] **FND-091** i18n and accessibility for every new screen `P0` `Platform`
  - Every string goes through i18next (the site already supports several languages). WCAG 2.2 AA, keyboard paths, screen-reader summaries for charts (see DSN-020).
- [ ] **FND-092** End-to-end tests per role journey `P1` `Platform`
  - Playwright scripts for each role: signup → link → first insight. Run at phone and desktop sizes.
