// Stay signed in until sign-out (utils/session.js).
import test from "node:test";
import assert from "node:assert/strict";
import { activeSession, sessionFor, isValidToken, noteRoleForPath, renewSessions } from "./session.js";

const NOW = Date.UTC(2026, 10, 23, 12);
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const tok = (claims) => `${b64({ alg: "HS256" })}.${b64(claims)}.sig`;
const valid = (extra = {}) => tok({ id: "u1", iat: NOW / 1000 - 3600, exp: NOW / 1000 + 86400, ...extra });
const expired = () => tok({ id: "u1", iat: NOW / 1000 - 9e5, exp: NOW / 1000 - 10 });

function store(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
}

test("a valid token is recognised; expired, unreadable and support (view-as) tokens are not", () => {
  assert.equal(isValidToken(valid(), NOW), true);
  assert.equal(isValidToken(expired(), NOW), false);
  assert.equal(isValidToken("garbage", NOW), false);
  assert.equal(isValidToken(valid({ imp: { sid: "x" } }), NOW), false);
});

test("signed in as a student: the entry page and the student sign-in open Home", () => {
  const s = store({ jwt_token: valid() });
  assert.equal(activeSession(s, NOW).home, "/home");
  assert.equal(sessionFor("student", s, NOW).home, "/home");
  assert.equal(sessionFor("parent", s, NOW), null, "the parent sign-in still asks");
});

test("a Google sign-in learner counts too; an expired token does not", () => {
  assert.equal(activeSession(store({ firebase_jwt: valid() }), NOW).role, "student");
  assert.equal(activeSession(store({ jwt_token: expired() }), NOW), null);
});

test("a family device with a parent and a child: '/' opens the role used last", () => {
  const s = store({ jwt_token: valid(), parent_jwt: valid({ role: "parent" }) });
  assert.equal(activeSession(s, NOW).role, "student", "default order");
  noteRoleForPath("/parent-dashboard", s);
  assert.equal(activeSession(s, NOW).role, "parent");
  noteRoleForPath("/module/read/maths", s);
  assert.equal(activeSession(s, NOW).role, "student");
});

test("renewal: an old-enough valid token is swapped for the fresh one; a fresh token is left alone", async () => {
  const old = tok({ id: "u1", iat: NOW / 1000 - 8 * 3600, exp: NOW / 1000 + 86400 });
  const young = valid({ role: "parent" });
  const s = store({ jwt_token: old, parent_jwt: young });
  const calls = [];
  const fetchImpl = async (url, opts) => { calls.push([url, opts.headers.Authorization]); return { ok: true, status: 200, json: async () => ({ token: "NEW" }) }; };
  const done = await renewSessions({ store: s, fetchImpl, now: NOW });
  assert.deepEqual(done, ["student"]);
  assert.equal(s.getItem("jwt_token"), "NEW");
  assert.equal(s.getItem("parent_jwt"), young, "issued an hour ago: no call");
  assert.equal(calls.length, 1);
  assert.match(calls[0][0], /\/auth\/renew$/);
  assert.equal(calls[0][1], `Bearer ${old}`);
});

test("renewal: a removed account (401) is signed out; being offline changes nothing", async () => {
  const old = tok({ id: "t1", role: "teacher", iat: NOW / 1000 - 8 * 3600, exp: NOW / 1000 + 86400 });
  const s = store({ teacher_jwt: old });
  await renewSessions({ store: s, fetchImpl: async () => { throw new Error("offline"); }, now: NOW });
  assert.equal(s.getItem("teacher_jwt"), old);
  await renewSessions({ store: s, fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({}) }), now: NOW });
  assert.equal(s.getItem("teacher_jwt"), null);
});

test("renewal never touches expired tokens or super admin", async () => {
  let called = 0;
  const s = store({ jwt_token: expired(), superadmin_jwt: valid({ role: "superadmin", iat: NOW / 1000 - 9e4 }) });
  await renewSessions({ store: s, fetchImpl: async () => { called += 1; return { ok: true, json: async () => ({ token: "x" }) }; }, now: NOW });
  assert.equal(called, 0);
});
