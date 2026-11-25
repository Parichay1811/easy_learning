// The topic catalogue for "Pick a topic" (lib/catalog.mjs, GET /catalog) and
// the words the picker puts beside a subject (public/topic-picker.js).
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPacks } from "../lib/packs.mjs";
import { loadTopics } from "../lib/sims-meta.mjs";
import { buildCatalog, catalogOf } from "../lib/catalog.mjs";
import { ageLabel, areaLine } from "../public/topic-picker.js";

const pack = (id, title, extra = {}) => [id, { id, title, status: "draft", ...extra }];

test("topics are grouped by subject and group, the subjects for young children first", () => {
  const packs = new Map([
    pack("BEE-01", "Ohm's law", { area: "Electrical Engineering (Bachelor's)", group: "BEE-DC — DC circuits", levels: ["H"] }),
    pack("SCH-AMA-01", "Limits", { area: "School Explainers", group: "SCH-AMA — Advanced Maths (class 11–12)", levels: ["U"] }),
    pack("SCH-PMA-01", "Counting to 20", { area: "School Explainers", group: "SCH-PMA — Primary Maths (class 1–5)", levels: ["P1"] }),
    pack("KIDS-ANIM-01", "Dinosaurs", { area: "For Kids", group: "KIDS-ANIM — Animals", levels: ["P1", "P2"] }),
    pack("ACCT-01", "Accounting equation", { area: "Commerce: Economics, Business & Accounting", group: "ACCT — Accounting", levels: ["M", "U"] }),
  ]);
  const c = buildCatalog(packs);
  assert.deepEqual(c.areas.map((a) => a.name), ["For Kids", "School Explainers", "Commerce", "Electrical Engineering (Bachelor's)"]);
  assert.deepEqual(c.areas[0], { name: "For Kids", count: 1, levels: ["P1", "P2"] });
  assert.equal(c.total, 5);
  // Inside a subject the group for younger children comes first, whatever its code.
  assert.deepEqual(c.byArea.get("School Explainers").groups.map((g) => g.name), ["Primary Maths (class 1–5)", "Advanced Maths (class 11–12)"]);
  assert.deepEqual(c.byArea.get("For Kids"), { area: "For Kids", groups: [{ name: "Animals", topics: [{ id: "KIDS-ANIM-01", title: "Dinosaurs", levels: ["P1", "P2"] }] }] });
  // "Commerce: Economics, …" is the subject "Commerce", as on the lesson's card.
  assert.equal(c.byArea.get("Commerce").groups[0].name, "Accounting");
});

test("a pack without area, group or levels takes them from its curriculum row, else from its id", () => {
  const packs = new Map([pack("MATH-MENS-02", "Circles", { status: "reviewed" }), pack("ZZZ-01", "A stray lesson")]);
  const rows = new Map([["MATH-MENS-02", { area: "Mathematics", group: "MATH-MENS — Mensuration", levels: ["L", "M"] }]]);
  const c = buildCatalog(packs, rows);
  assert.deepEqual(c.byArea.get("Mathematics"), { area: "Mathematics", groups: [{ name: "Mensuration", topics: [{ id: "MATH-MENS-02", title: "Circles", levels: ["L", "M"] }] }] });
  assert.deepEqual(c.byArea.get("ZZZ").groups, [{ name: "", topics: [{ id: "ZZZ-01", title: "A stray lesson", levels: [] }] }]);
});

test("the same title twice in a subject is listed once, as the reviewed lesson", () => {
  const packs = new Map([
    pack("MATHX-09", "Circles", { area: "Mathematics", levels: ["L"] }),
    pack("MATH-MENS-02", "circles", { area: "Mathematics", levels: ["L"], status: "reviewed" }),
    pack("ART-01", "Circles", { area: "Art", levels: ["L"] }),
  ]);
  const c = buildCatalog(packs);
  assert.deepEqual(c.byArea.get("Mathematics").groups.flatMap((g) => g.topics.map((t) => t.id)), ["MATH-MENS-02"]);
  assert.equal(c.areas.find((a) => a.name === "Mathematics").count, 1);
  assert.equal(c.byArea.get("Art").groups[0].topics.length, 1);
});

test("the real packs: every lesson is in the catalogue once, small enough to send, built once per set of packs", () => {
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "packs");
  const packs = loadPacks(dir);
  const rows = loadTopics();
  const c = catalogOf(packs, rows);
  assert.equal(catalogOf(packs, rows), c, "the same packs give the same catalogue, not a new one");
  const ids = [...c.byArea.values()].flatMap((a) => a.groups.flatMap((g) => g.topics.map((t) => t.id)));
  assert.equal(new Set(ids).size, ids.length, "no lesson twice");
  assert.ok(ids.length > 0 && ids.length <= packs.size);
  assert.equal(c.total, ids.length);
  assert.equal(c.areas.reduce((n, a) => n + a.count, 0), ids.length);
  for (const id of ids) assert.ok(packs.has(id));
  // The reviewed packs carry no area of their own: they are still filed under their subject.
  assert.ok(c.byArea.get("Mathematics").groups.some((g) => g.topics.some((t) => t.id === "MATH-MENS-02")));
  assert.ok(!c.byArea.has(""), "no nameless subject");
  // Children's subjects lead; university courses do not.
  const first = c.areas.slice(0, 3).map((a) => a.name);
  assert.ok(first.includes("For Kids") && first.includes("Early Years & Foundations"), first.join(", "));
  assert.ok(c.areas.slice(0, 3).every((a) => a.levels.some((l) => ["EY", "P1"].includes(l))));
  assert.ok(!c.areas.slice(0, 10).some((a) => /Bachelor/.test(a.name)));
  // The list of subjects is a few KB; one subject's topics stay well under 100 KB.
  assert.ok(JSON.stringify(c.areas).length < 12000);
  for (const a of c.byArea.values()) assert.ok(JSON.stringify(a).length < 100000, a.area);
});

test("who a topic is for, in words", () => {
  assert.equal(ageLabel(["EY", "P1"]), "Ages 4–7");
  assert.equal(ageLabel(["P2", "L", "M"]), "Ages 8–16");
  assert.equal(ageLabel(["M", "U"]), "Ages 14+");
  assert.equal(ageLabel(["U", "H"]), "Ages 16+");
  assert.equal(ageLabel(["H"]), "University");
  assert.equal(ageLabel(["PRO"]), "For adults");
  assert.equal(ageLabel([]), "");
  assert.equal(ageLabel(), "");
  assert.equal(areaLine({ count: 139, levels: ["EY", "P1", "P2"] }), "139 topics · Ages 4–10");
  assert.equal(areaLine({ count: 1, levels: [] }), "1 topic");
});
