# Super Admin: the platform console

[← Roadmap](README.md) · [Foundations](FOUNDATIONS.md) · [Design](DESIGN.md) · [Parent](PARENT.md) · [Teacher](TEACHER.md) · [Admin](ADMIN.md)

**Who:** us, the Learnigo team. Owners, support, content, finance and
engineering.

**The promise:** *"From one console we see the whole platform live (every
organisation, solo tutor, family and learner), act on anything safely, and
every powerful action is recorded."*

---

## What exists today

- A single super admin account from env vars (`SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD`) with JWT ([superadminController.js](../../server/controllers/superadminController.js), [SuperAdminDashboard.jsx](../../client/src/pages/superadmin/SuperAdminDashboard.jsx)).
- Platform stats. List organisations; approve/reject (reversible, with history); set subscription plan/status. Drill into an org's admin, students (full dashboards) and tutors.
- Chats with org admins and with parents, unread counts (polling). Global settings. Contact messages inbox.
- **Gaps:**
  - One shared login with no staff roles or 2FA.
  - No view of solo tutors or families.
  - No platform analytics, billing, content tools, health monitoring, audit log, feature flags or data-rights handling.

---

## S1. Staff accounts and safety

- [x] **SUP-001** Staff accounts with roles `P0` `Platform` · needs FND-010, FND-014
  - *Done:* `Staff` model (owner/support/content/finance/engineer/analyst), bcrypt + TOTP (RFC 6238, node crypto, sealed secrets, hashed one-time recovery codes, replays refused), forced password change and 2FA set-up at first sign-in, lockout after 5 failures, IP throttle, revocable `StaffSession`s, `requireStaffRole()` on every console route; the env account stays as an audited break-glass owner (optional `SUPER_ADMIN_TOTP_SECRET`). `scripts/create-staff.js` adds the first owner. Tests: `test/integration/superadmin.test.js`, `test/totp.test.js`.
  - Replace the single env login with named staff accounts. The env account stays only as a break-glass owner. Roles:
    - **Owner:** everything.
    - **Support:** orgs, people, chats, view-as.
    - **Content:** question banks, translations.
    - **Finance:** plans, invoices.
    - **Engineer:** health, flags, jobs.
    - **Analyst:** read-only analytics.
  - 2FA is required for all staff.
- [x] **SUP-002** "View as" (read-only impersonation) `P1` `Platform` · needs FND-072
  - *Done:* 30-min token signed for the target role with an `imp` claim; `middleware/platformGuard.js` refuses every non-GET (and side-effecting GETs) for it, and ended sessions; audited under the org (`support.view_as.*`), org admins notified; orange `ViewAsBanner`; tested for admin, teacher and parent.
  - See exactly what an admin, teacher or parent sees, to help with support. Requires a reason. Read-only. A persistent orange banner. Auto-expires after 30 min. Always audited and visible to that org's admin.
- [x] **SUP-003** Audit log, platform-wide `P0` `Platform` · needs FND-072
  - *Done:* console audit log with filters (actor, org, learner/target, action, dates), CSV export (owners, audited), a full hash-chain check that names the first altered event; `audit()` writes are now serialised and meta normalised so the chain always verifies.
  - Every staff action and every sensitive action in any org. Search by actor, org or learner. Exportable. Tamper-evident (hash chain).

## S2. Everyone on the platform

- [x] **SUP-010** Organisations directory `P0` `Platform` (exists: extend)
  - *Done:* `services/orgDirectory.js` (cached 3 min): kind, country, plan, seats used/bought, learners active 7 d, health, flags (over limit, payment failed, low engagement, admin inactive, trial ending, suspended), last admin sign-in; server-side filters, sort and paging, saved views per staff member, audited CSV export.
  - One table for **Institutes and Solo workspaces**: kind, country, plan, seats used/bought, learners active (7 d), health score, created, last admin login and flags (over limit, payment failed, low engagement). Filters, saved views, export.
- [x] **SUP-011** Organisation detail `P1` `Platform`
  - *Done:* profile and approval history, groups/units (read-only), people counts, 30-day usage via the shared analytics, billing, support threads, recent audit, feature overrides with the effective modules and why.
  - Profile and approval history (exists), the org tree (read-only), people counts, usage trends, billing, support threads, audit and feature overrides (SUP-042).
- [x] **SUP-012** People search `P1` `Platform`
  - *Done:* search admins, teachers, learners, school parents, parent accounts and own-account learners by name, email or id; profile with links, last activity and security; actions: sign out everywhere (any role, `SessionRevocation`), reset a teacher's Google sign-in, resend invite; profile views audited.
  - Find any account by name, email or learner ID across roles and orgs, with memberships, links (guardians, groups), last activity and security status. Actions per role: reset login, unlock, revoke sessions, resend invite.
- [x] **SUP-013** Families and independent learners `P1` `Family`
  - *Done:* learners outside any org with their parents and link status, counts, monthly growth, and the shared analytics drill-down behind a reason (audited).
  - Learners not in any org, with their linked parents. Counts, growth, and the same profile drill-down (audited).
- [x] **SUP-014** Approval queue `P0` `Institute` (exists: improve)
  - *Done:* queue with verification hints (free-mail vs organisation domain, domain vs name/website, phone, address, duplicates, past rejections), 48 h SLA timer, editable rejection templates; suspend/unsuspend any org (solo included) with a reason and appeal note, enforced at once by the platform guard; approvals attributed to the staff member.
  - New institutes awaiting approval with verification hints (domain matches email, website, phone), SLA timers and templated rejection reasons. Solo workspaces don't need approval but can be suspended for abuse.

## S3. Platform analytics

- [x] **SUP-020** Growth dashboard `P1` `Platform` · needs FND-043
  - *Done:* DAU/WAU/MAU for learners (rollups) and admins/teachers/parents (new `ActorDay` sign-in activity), learners and minutes per day, weekly sign-ups by role, activation funnel (cumulative), weekly retention cohorts, learners by timezone region. *Partial:* no drawn world map (a region table instead); sign-ups by country only for organisations (people have no country).
  - DAU / WAU / MAU by role. New signups by role and country. Activation funnel (signup → first lesson → day 7 → linked parent → paid). Retention cohorts (weekly curves). Learner minutes per day. A world map of learners.
- [ ] **SUP-021** Learning dashboard `P1` `Platform`
  - *Partial:* module x subject usage and accuracy (shared `matrix()`), sources, devices, AR games, AI Teacher asks, topics and missing topics. *Not done:* languages and accessibility use are not logged anywhere yet (shown as "not measured").
  - Module × subject usage and accuracy platform-wide, AI Teacher sessions and topics, AR game usage, top and least-used content, languages used, and accessibility feature use (read-aloud, dyslexia font).
- [x] **SUP-022** Revenue dashboard `P1` `Platform` · needs FND-032
  - *Done:* MRR/ARR, plan mix, trials and conversion, churn and reasons, seat growth, failed payments, open and overdue invoices, VAT by country from invoices.
  - MRR/ARR, plan mix, trials and conversion, churn and reasons, seat expansion, failed payments, invoices awaiting payment, and VAT by country.
- [x] **SUP-023** Organisation health score `P2` `Platform`
  - *Done:* score 0-100 (engagement 40, teacher activity 25, parents linked 20, support load 15) in the directory and analytics; the daily `orgHealth.snapshot` job tells support about a 15-point drop.
  - Combines engagement, teacher activity, parents linked and support tickets into a score per org. Alerts customer success when it drops.

## S4. Health and operations

- [x] **SUP-040** System health `P0` `Platform` · needs FND-081
  - *Done:* in-process request metrics (p50/p95/p99, error rate, slowest routes), CPU busy and steal from `/proc/stat` (null on macOS), memory (MemAvailable on Linux), uptime, DB sizes and biggest collections, AI Teacher `/health`, PM2 if present, recorded backups; the `health.sample` job alerts engineers every minute. *Not done:* MongoDB slow-query log.
  - API p50/p95 and error rate. AI Teacher health (`/api/ai-assistant/health`: voice, knowledge base, latency), memory, CPU and **steal** (a crash-looping process once pushed steal to 95 %). PM2 processes and restart counts. Disk, DB sizes and slow queries. Rollup and report job queues. Last backup and restore test.
- [x] **SUP-041** Jobs `P1` `Platform`
  - *Done:* `services/jobs.js` registry (anyone can `register()`), `JobRun` history with progress and errors, run-now from the console; jobs: analytics warm-up, health sample, org health, data-rights due dates, outbox send, rollup backfill (child process).
  - See and re-run nightly rollups, digests, PDF batches and imports, with progress and errors.
- [x] **SUP-042** Feature flags and entitlement overrides `P0` `Platform` · needs FND-030
  - *Done:* `FeatureFlag` (module switches per platform or plan; features with per-org rules and a stable % rollout via `services/featureFlags.isOn()`), applied in `entitlementsFor` (platform off = kill switch), org overrides on the org page, a "who gets what" preview; every change audited.
  - Turn any module on/off for the platform, a plan or one org (e.g. a pilot school gets `tests.advanced`). Percentage rollouts for new features. Every change is audited.
- [x] **SUP-043** Maintenance and incidents `P1` `Platform`
  - *Done:* incidents and maintenance windows with updates, site-wide `StatusBanner`, public `GET /api/status` and a `/status` page.
  - Status banner on all sites, maintenance windows and an incident log with a public status page (`P2`).

## S5. Content

- [ ] **SUP-030** Global question bank `P1` `Platform` · needs FND-042
  - *Partial:* browse/search the built-in banks only, edit text and level, staff tags, translation coverage per language with a "missing translation" filter, edits audited. *Not done:* skill/difficulty backfill review and item-analysis quality flags (need FND-042 and test item analysis).
  - Browse, edit and tag the built-in Listen/Read/Write/Speak × English/Maths/Science banks. Skill/difficulty/grade backfill review. Translation coverage per language. Quality flags from item analysis across all orgs (likely wrong key, too easy, confusing).
- [ ] **SUP-031** Public bank submissions `P2` `Platform` · needs TCH-025
  - *Not done:* no public-share model exists yet (TCH-025); the tab says so.
  - Review questions teachers choose to share publicly (accept / edit / reject with a note). This is the Learnigo bank only. **Org question approval stays with the org admin** (design-guide §5.4: don't reintroduce super admin review of org uploads).
- [x] **SUP-032** AI Teacher content `P1` `Platform`
  - *Done:* AI Teacher readiness, packs (reviewed/draft), knowledge cards, voice cache, most asked topics, asked-for-but-no-lesson list with "covered", heard-fix list, all read through the assistant's existing endpoints.
  - Lesson packs and topic coverage, the "heard" fixes queue (exists in the assistant admin page `/ai-assistant/admin.html`), topics students ask for that have no lesson yet, and voice cache stats.
- [ ] **SUP-033** Templates `P2` `Platform`
  - *Not done (P2).*
  - Starter test templates, practice sets and report templates offered to every org.

## S6. Plans and billing

- [x] **SUP-050** Plan catalogue `P1` `Platform` · needs FND-030, FND-032
  - *Done:* `PlanOverride` versions on top of `config/plans.js` (modules, limits, EUR prices, trial days, open/grandfathered, coupons); subscribers keep their `planSnapshot` until renewal unless the change is forced. *Note:* prices are placeholders until set; coupons are stored, only Stripe promotion codes apply them.
  - Define plans as module lists plus limits and prices per currency. Coupons, trials and grandfathered plans. Changes don't affect existing subscribers until renewal unless forced.
- [x] **SUP-051** Customer actions `P1` `Platform`
  - *Done:* `Subscription` with start, change plan (now or at renewal), seats, extend/end trial, credit, invoice, mark paid (PO), pause/resume, cancel (now or at period end), renew; each needs a reason and is audited. Stripe Checkout/Portal/webhook in `services/billing/stripe.js` behind env flags, **untested against live Stripe** (webhook tested with locally signed events). Org usage at `GET /api/billing/usage`.
  - Change plan or seats, extend a trial, apply a credit, mark an invoice as paid (school POs), pause or cancel. Every action is audited.

## S7. Support, trust and safety

- [x] **SUP-060** Unified support inbox `P1` `Platform` (exists: merge)
  - *Done:* one inbox (contact form, admin chats, parent chats) with assignment, status, tags, canned replies (a setting), internal notes, email replies to contact messages, links to the org or person.
  - Contact messages, admin chats and parent chats in one inbox with assignment, status, canned replies, internal notes and links to the person/org profile.
- [ ] **SUP-061** Data-rights queue `P1` `Platform` · needs FND-071
  - *Partial:* queue on the shared `DataRequest` schema with due dates and overdue, the footprint across all three databases, JSON export download, and "done" refused for a deletion until every count is 0 (proof hash saved). *Not done here:* the deletion itself runs through the Parent work's `services/dataRights.js` ("Run deletion" says so until it exists).
  - Export and delete requests from parents, schools and adults with due dates (GDPR: 30 days), progress across all databases and proof of completion.
- [ ] **SUP-062** Moderation `P2` `Platform`
  - *Partial:* suspend/unsuspend organisations with a reason and appeal note. *Not done:* reported messages, questions and profiles (no report model yet).
  - Reported messages, shared questions and profile content. Suspend accounts or orgs with a reason and an appeal note.
- [ ] **SUP-063** Platform announcements `P1` `Platform` · needs FND-052
  - Banners or emails to segments (all admins, Solo tutors in Germany, parents with Family Plus…), scheduled, with read rates.

## S8. Settings

- [x] **SUP-070** Global settings `P1` `Platform` (exists: extend)
  - *Done:* typed platform settings (languages, default org policy, retention, legal versions, email templates, AI Teacher profile, canned replies), owners only, audited. *Note:* email templates are stored but not yet used by the mailer.
  - Supported languages, default policies for new orgs, retention defaults, email templates, legal document versions (terms, privacy, data-processing agreement), and AI Teacher profile settings.

---

## Done means

- Every staff action is attributable to a named person with 2FA, and the audit log answers "who saw this child's data and why?" in seconds.
- The console opens in < 2 s with live counters. Every list is paginated and filterable on the server.
- An incident (e.g. the AI Teacher down or CPU steal high) appears on the health page and in an alert within 2 minutes.

## Links to other roles

- **Admin:** approval, plans and seats, support chat, data-processing agreement ([ADMIN.md](ADMIN.md)).
- **Teacher:** Solo workspaces, public bank, plans ([TEACHER.md](TEACHER.md)).
- **Parent:** support chat (exists), data-rights requests, Family Plus ([PARENT.md](PARENT.md)).
