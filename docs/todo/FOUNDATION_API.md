# Foundation API: what the role features build on

Built (see [FOUNDATIONS.md](FOUNDATIONS.md) for the plan). Read this before adding a role feature.
Run `cd server && npm test`: unit tests plus integration tests that boot the real server on an in-memory MongoDB.

## Identity

- **Sign-in is verified.** Every Google sign-in sends a Firebase **ID token** (`{ idToken }`); [utils/firebaseToken.js](../../server/utils/firebaseToken.js) verifies it. Never take uid/email from a request body.
- **Student session cookie is signed** (`req.signedCookies.user_session`). Never read `req.cookies` for identity.
- [utils/actors.js](../../server/utils/actors.js): `anyAuth` sets `req.actor = { role: student|parent|admin|teacher|superadmin, id, email, name, orgId }` from whichever token is present. `requireRole('admin','teacher')`.
- Existing per-role middlewares still set `req.parent`, `req.admin`, `req.teacher`, `req.superadmin`, `req.user` (student).

## Learning events and rollups

- [analytics/record.js](../../server/analytics/record.js): `recordAnswer`, `recordSession`, `recordRound` (never throw). They write a `LearningEvent` (raw, 24 months) and `$inc` the learner's `LearnerDay` (`models/analytics/`): one doc per learner per **local** day with minutes, answers, correct, accuracy inputs, `byModuleSubject`, `byHour`, `devices`, `sources`. `contextFrom(req)` adds timezone (`X-Timezone` header) and device.
- Tests/homework must call `recordAnswer({ email, module, subject, correct, timeMs, testId, source: 'test', orgId })` so they show up everywhere.
- Backfill existing history once after deploy: `node scripts/backfill-learner-days.js --apply`.

## Shared analytics (the same numbers for every role)

- [analytics/queries.js](../../server/analytics/queries.js) `overview, series, matrix, patterns, streak, calendar, perLearner, timeline`, all from `LearnerDay`. [analytics/insights.js](../../server/analytics/insights.js) `buildInsights`, `buildStory`. Definitions: [utils/metrics.js](../../server/utils/metrics.js) (also `GET /api/meta/metrics`).
- HTTP: [controllers/analyticsController.js](../../server/controllers/analyticsController.js) handlers read `req.analyticsScope = { emails, who, names, tz }`. [utils/scopes.js](../../server/utils/scopes.js) resolves **who may be looked at** per role (`forParentChild, forTeacherBatch, forTeacherAll, forTeacherStudent, forAdmin, forSuperadminOrg`) and `scoped(resolver)` is the middleware. [routes/analyticsMounts.js](../../server/routes/analyticsMounts.js) mounts them:

| Role | Endpoints (all `GET`, query: `from`, `to` (YYYY-MM-DD), `cmp=prev\|lastyear\|none`, `tz`) |
|---|---|
| Parent | `/api/parent/children/:id/analytics/{overview,calendar,matrix,patterns,timeline}` |
| Teacher | `/api/teacher/batches/:id/analytics/{overview,calendar,matrix,patterns,timeline,learners}`, `/api/teacher/students/:id/analytics/...`, `/api/teacher/analytics/...` (all my students) |
| Admin | `/api/admin/analytics/{overview,...,learners}?batchId=`, `/api/admin/students/:id/analytics/...` |
| Super admin | `/api/superadmin/organizations/:id/analytics/{...,learners}`, `.../students/:studentId/analytics/...` |

`overview` returns `{ range, totals, previous, deltas, streak, series, matrix, patterns, story, insights }`. `learners` returns one row per learner with `atRisk` and `riskReason`.

To add a new scope (a school unit, a test's takers), write a resolver in `utils/scopes.js` that **checks the permission and returns emails**, then mount the same handlers.

## Plans and modules

- [config/plans.js](../../server/config/plans.js): `MODULES`, `PLANS` (`free, family_plus, solo_free, solo_pro, institute, enterprise`). [utils/entitlements.js](../../server/utils/entitlements.js): `entitlementsFor(actor)`, `requireModule('tests')` (answers **402** `{ code: 'MODULE_LOCKED', module }`). Per-org overrides: super admin sets `featureOverrides` (`'tests.advanced'` adds, `'-sso'` removes) on the superadmin `Organization`. `Organization.kind` is `institute` or `solo`.
- `GET /api/me`, `GET /api/entitlements` (any signed-in role).
- Put `anyAuth` before `requireModule` on shared routes; role routers that already authenticate set `req.actor` themselves via `anyAuth` or build it from their `req.<role>`.

## Notifications and audit

- `notify({ role, id } | [...], { kind, title, body, link })` ([utils/notify.js](../../server/utils/notify.js)); `GET /api/notifications`, `/unread-count`, `POST /:id/read`, `POST /read-all`.
- `audit(req, action, { targetType, targetId, orgId, reason, meta })` ([utils/audit.js](../../server/utils/audit.js)): hash-chained `AuditEvent`. Call it for exports, "view as", deletions, grade changes, permission changes, bulk imports.

## Parent links

Only `linkStatus: 'verified'` links expose data ([utils/guardianLink.js](../../server/utils/guardianLink.js) `childAccess`). See design-guide §5.3.1.

## Testing pattern

`test/integration/harness.js`: `const app = await start()`; `app.tokens.parent(id)`, `.teacher(id, orgId)`, `.admin(id, orgId, uid)`, `.student(email)`, `.superadmin()`; `app.call(method, route, { token, body, headers })`; seed with `app.db.admin|main|superadmin.collection(...)`. Note: superadmin `Organization.adminOrgId` is a **string**.

## Mail and organisation policy

- `sendMail({ to, subject, html, text, kind })` ([utils/mailer.js](../../server/utils/mailer.js)): never throws. With `SMTP_URL` (or `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`) and `MAIL_FROM` it sends; without them the message stays `queued` in the `Outbox` collection (`models/Outbox.js`), so nothing is lost and tests can read it.
- `getOrgPolicy(orgId)` ([utils/orgPolicy.js](../../server/utils/orgPolicy.js)): the organisation's policy with defaults (`messaging`, `teachersCreateGroups`, `parentsSeeClassAverage`, `leaderboards`, `aiTeacherInSchoolHours`, `activityVisibility`, `retentionYears`, DPA acceptance). Stored in `models/admin/OrgPolicy.js`. Features that a policy governs must call it.
- `DataRequest` (shared by Parent privacy centre and the Super Admin queue; owned by the Parent work): `{ subjectEmail, subjectName, requestedByRole, requestedById, orgId?, kind: 'export'|'delete', status: 'pending'|'processing'|'done'|'rejected', dueAt, resolvedAt, resolvedBy, note }` in `models/DataRequest.js`.
