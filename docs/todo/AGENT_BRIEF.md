# Working brief for building a role feature

Applies to anyone (person or agent) implementing items from `docs/todo/*.md`. Read
[FOUNDATION_API.md](FOUNDATION_API.md) and [DESIGN.md](DESIGN.md) first, plus [docs/design-guide.md](../design-guide.md).

## Setup (once, in your own git worktree)

```bash
git merge --no-edit roles-roadmap                         # foundations + docs (worktrees start from main)
ln -s /Users/sutirtha.chakraborty/Documents/experiment/easy_learning/server/node_modules server/node_modules
ln -s /Users/sutirtha.chakraborty/Documents/experiment/easy_learning/client/node_modules client/node_modules
```
No new npm dependencies (Recharts, framer-motion, exceljs, firebase etc. are there).

## Rules that keep this safe

1. **Every route is authenticated and scoped.** Role middleware first, then a scope or ownership check (`utils/scopes.js` pattern: check permission AND return only what that role may see), then `requireModule('...')` where the feature belongs to a plan module. Never trust ids, emails or roles from the body. Learner data: only via a scope.
2. **Another school's data must be unreachable.** Always filter by the caller's `orgId`; write a test where org B's admin/teacher tries to reach org A's item and gets 404/403.
3. **Sensitive actions call `audit()`** (exports, bulk imports, deletions, grade changes, permission changes, impersonation).
4. **Use the shared pieces:** analytics from `analytics/queries.js` via the shared handlers, `notify()`, `entitlementsFor`, the dashboard kit in `client/src/components/dashboard/`, the metrics dictionary. Do not recompute metrics your own way.
5. **Tests are not optional.** Add integration tests in `server/test/integration/<area>.test.js` using `harness.js` (look at `platform.test.js`). `cd server && npm test` must pass. Include the unhappy paths (wrong role, wrong org, unverified, locked module, bad input).
6. **Client:** pages go under `client/src/pages/<role>/`, shared components under `client/src/components/<area>/`. All strings through `useTranslation` with `defaultValue`. WCAG 2.2 AA, phone and desktop. `cd client && npx eslint <your files> && npx vite build` must pass.
7. **Look at it.** Run the demo server and the client with your own ports, sign in by setting a token in localStorage (see `server/test/integration/dev-server.js`; tokens are in `server/tmp/demo.json`; keys `parent_jwt`, `teacher_jwt`, `admin_jwt`, `superadmin_jwt`, `jwt_token`), take headless-Chrome screenshots at 390 and 1400 px, **read them**, and fix anything unclear or ugly. Kill your dev servers when done.
8. **Shared files** (`client/src/App.jsx`, `server/server.js`, `client/src/components/Navbar`) get minimal, line-level edits only (a route, a mount). Put real code in your own files. Do not reformat files you do not own.
9. **Keep the roadmap honest:** tick the item in `docs/todo/<ROLE>.md` (`- [x]`) with a one-line *Done:* note, or add a *Not done:* note saying why. Never tick what is not built and tested.
10. **Commit** on your worktree branch in small, clear commits, ending each message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Do not push and do not touch `main`.

## Priority

Do all `P0` items in your files first, then `P1`, then `P2` as time allows. Depth over breadth: a feature that works end to end, is tested and looks right beats ten stubs. If an item depends on something not built yet, build the part you can, and say so.

## Final report (your last message)

Branch name; what is DONE (item ids, tested); what is PARTIAL (what is missing); what is NOT done and why; any shared-file edits; any decision or risk the owner must know.
