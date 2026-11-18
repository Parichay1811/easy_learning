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

- [ ] **SUP-001** Staff accounts with roles `P0` `Platform` · needs FND-010, FND-014
  - Replace the single env login with named staff accounts. The env account stays only as a break-glass owner. Roles:
    - **Owner:** everything.
    - **Support:** orgs, people, chats, view-as.
    - **Content:** question banks, translations.
    - **Finance:** plans, invoices.
    - **Engineer:** health, flags, jobs.
    - **Analyst:** read-only analytics.
  - 2FA is required for all staff.
- [ ] **SUP-002** "View as" (read-only impersonation) `P1` `Platform` · needs FND-072
  - See exactly what an admin, teacher or parent sees, to help with support. Requires a reason. Read-only. A persistent orange banner. Auto-expires after 30 min. Always audited and visible to that org's admin.
- [ ] **SUP-003** Audit log, platform-wide `P0` `Platform` · needs FND-072
  - Every staff action and every sensitive action in any org. Search by actor, org or learner. Exportable. Tamper-evident (hash chain).

## S2. Everyone on the platform

- [ ] **SUP-010** Organisations directory `P0` `Platform` (exists: extend)
  - One table for **Institutes and Solo workspaces**: kind, country, plan, seats used/bought, learners active (7 d), health score, created, last admin login and flags (over limit, payment failed, low engagement). Filters, saved views, export.
- [ ] **SUP-011** Organisation detail `P1` `Platform`
  - Profile and approval history (exists), the org tree (read-only), people counts, usage trends, billing, support threads, audit and feature overrides (SUP-042).
- [ ] **SUP-012** People search `P1` `Platform`
  - Find any account by name, email or learner ID across roles and orgs, with memberships, links (guardians, groups), last activity and security status. Actions per role: reset login, unlock, revoke sessions, resend invite.
- [ ] **SUP-013** Families and independent learners `P1` `Family`
  - Learners not in any org, with their linked parents. Counts, growth, and the same profile drill-down (audited).
- [ ] **SUP-014** Approval queue `P0` `Institute` (exists: improve)
  - New institutes awaiting approval with verification hints (domain matches email, website, phone), SLA timers and templated rejection reasons. Solo workspaces don't need approval but can be suspended for abuse.

## S3. Platform analytics

- [ ] **SUP-020** Growth dashboard `P1` `Platform` · needs FND-043
  - DAU / WAU / MAU by role. New signups by role and country. Activation funnel (signup → first lesson → day 7 → linked parent → paid). Retention cohorts (weekly curves). Learner minutes per day. A world map of learners.
- [ ] **SUP-021** Learning dashboard `P1` `Platform`
  - Module × subject usage and accuracy platform-wide, AI Teacher sessions and topics, AR game usage, top and least-used content, languages used, and accessibility feature use (read-aloud, dyslexia font).
- [ ] **SUP-022** Revenue dashboard `P1` `Platform` · needs FND-032
  - MRR/ARR, plan mix, trials and conversion, churn and reasons, seat expansion, failed payments, invoices awaiting payment, and VAT by country.
- [ ] **SUP-023** Organisation health score `P2` `Platform`
  - Combines engagement, teacher activity, parents linked and support tickets into a score per org. Alerts customer success when it drops.

## S4. Health and operations

- [ ] **SUP-040** System health `P0` `Platform` · needs FND-081
  - API p50/p95 and error rate. AI Teacher health (`/api/ai-assistant/health`: voice, knowledge base, latency), memory, CPU and **steal** (a crash-looping process once pushed steal to 95 %). PM2 processes and restart counts. Disk, DB sizes and slow queries. Rollup and report job queues. Last backup and restore test.
- [ ] **SUP-041** Jobs `P1` `Platform`
  - See and re-run nightly rollups, digests, PDF batches and imports, with progress and errors.
- [ ] **SUP-042** Feature flags and entitlement overrides `P0` `Platform` · needs FND-030
  - Turn any module on/off for the platform, a plan or one org (e.g. a pilot school gets `tests.advanced`). Percentage rollouts for new features. Every change is audited.
- [ ] **SUP-043** Maintenance and incidents `P1` `Platform`
  - Status banner on all sites, maintenance windows and an incident log with a public status page (`P2`).

## S5. Content

- [ ] **SUP-030** Global question bank `P1` `Platform` · needs FND-042
  - Browse, edit and tag the built-in Listen/Read/Write/Speak × English/Maths/Science banks. Skill/difficulty/grade backfill review. Translation coverage per language. Quality flags from item analysis across all orgs (likely wrong key, too easy, confusing).
- [ ] **SUP-031** Public bank submissions `P2` `Platform` · needs TCH-025
  - Review questions teachers choose to share publicly (accept / edit / reject with a note). This is the Learnigo bank only. **Org question approval stays with the org admin** (design-guide §5.4: don't reintroduce super admin review of org uploads).
- [ ] **SUP-032** AI Teacher content `P1` `Platform`
  - Lesson packs and topic coverage, the "heard" fixes queue (exists in the assistant admin page `/ai-assistant/admin.html`), topics students ask for that have no lesson yet, and voice cache stats.
- [ ] **SUP-033** Templates `P2` `Platform`
  - Starter test templates, practice sets and report templates offered to every org.

## S6. Plans and billing

- [ ] **SUP-050** Plan catalogue `P1` `Platform` · needs FND-030, FND-032
  - Define plans as module lists plus limits and prices per currency. Coupons, trials and grandfathered plans. Changes don't affect existing subscribers until renewal unless forced.
- [ ] **SUP-051** Customer actions `P1` `Platform`
  - Change plan or seats, extend a trial, apply a credit, mark an invoice as paid (school POs), pause or cancel. Every action is audited.

## S7. Support, trust and safety

- [ ] **SUP-060** Unified support inbox `P1` `Platform` (exists: merge)
  - Contact messages, admin chats and parent chats in one inbox with assignment, status, canned replies, internal notes and links to the person/org profile.
- [ ] **SUP-061** Data-rights queue `P1` `Platform` · needs FND-071
  - Export and delete requests from parents, schools and adults with due dates (GDPR: 30 days), progress across all databases and proof of completion.
- [ ] **SUP-062** Moderation `P2` `Platform`
  - Reported messages, shared questions and profile content. Suspend accounts or orgs with a reason and an appeal note.
- [ ] **SUP-063** Platform announcements `P1` `Platform` · needs FND-052
  - Banners or emails to segments (all admins, Solo tutors in Germany, parents with Family Plus…), scheduled, with read rates.

## S8. Settings

- [ ] **SUP-070** Global settings `P1` `Platform` (exists: extend)
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
