// The learner's notes (public/notes-store.js): several per topic, kept in the
// browser's storage, with the old single note of each topic taken in.
import test from "node:test";
import assert from "node:assert/strict";
import { createNotesStore, topicKey, lessonOf, noteName, NOTES_KEY, OLD_PREFIX, GENERAL } from "../public/notes-store.js";

// localStorage, as far as the store uses it.
function fakeStorage(initial = {}, { failWrites = false, blocked = false } = {}) {
  const map = new Map(Object.entries(initial));
  const check = () => {
    if (blocked) throw new Error("storage blocked");
  };
  return {
    map,
    get length() { check(); return map.size; },
    key(i) { check(); return [...map.keys()][i] ?? null; },
    getItem(k) { check(); return map.has(k) ? map.get(k) : null; },
    setItem(k, v) { check(); if (failWrites) throw new Error("quota"); map.set(k, String(v)); },
    removeItem(k) { check(); map.delete(k); },
  };
}
let clock = 1000;
const opts = () => { let n = 0; return { now: () => ++clock, makeId: () => `n${++n}` }; };

test("where notes are filed: by lesson id, else by title, else general", () => {
  assert.equal(topicKey({ id: "PHYS-DYN-01", title: "Newton's laws" }), "PHYS-DYN-01");
  assert.equal(topicKey({ title: "  Marie   Curie " }), "t:marie curie");
  assert.equal(topicKey({ title: "" }), GENERAL);
  assert.equal(topicKey(null), GENERAL);
  assert.equal(lessonOf("PHYS-DYN-01"), "PHYS-DYN-01");
  assert.equal(lessonOf("t:marie curie"), null);
  assert.equal(lessonOf(GENERAL), null);
});

test("a note is called by its name, else by how it begins", () => {
  assert.equal(noteName({ title: " Words ", text: "x" }), "Words");
  assert.equal(noteName({ title: "", text: "\n  Force is mass times acceleration\nmore" }), "Force is mass times acceleration");
  assert.equal(noteName({ title: "", text: "a".repeat(60) }), `${"a".repeat(39)}…`);
  assert.equal(noteName({ title: "", text: "  " }), "New note");
});

test("several notes for a topic: added, renamed, changed, in the order they were made", () => {
  const storage = fakeStorage();
  const store = createNotesStore(storage, opts());
  assert.deepEqual(store.notes("BIO-01"), []);
  const a = store.save("BIO-01", "Photosynthesis", { text: "Plants make food from light." });
  const b = store.save("BIO-01", "Photosynthesis", { title: "Words", text: "chlorophyll" });
  assert.notEqual(a.id, b.id);
  store.save("BIO-01", "Photosynthesis", { id: a.id, title: "What it is", text: "Plants make sugar from light." });
  assert.deepEqual(store.notes("BIO-01").map((n) => [n.id, n.title, n.text]), [
    [a.id, "What it is", "Plants make sugar from light."],
    [b.id, "Words", "chlorophyll"],
  ]);
  assert.equal(store.persistent, true);
  // It is all in one entry of the storage, and a new store reads it back.
  assert.deepEqual([...storage.map.keys()], [NOTES_KEY]);
  assert.equal(createNotesStore(storage, opts()).notes("BIO-01").length, 2);
});

test("all notes by topic, the topic written in last first, each with its title", () => {
  const store = createNotesStore(fakeStorage(), opts());
  store.save("BIO-01", "Photosynthesis", { text: "one" });
  store.save("t:marie curie", "Marie Curie", { text: "two" });
  store.save(GENERAL, "", { text: "three" });
  const first = store.notes("BIO-01")[0];
  store.save("BIO-01", "Photosynthesis", { id: first.id, text: "one, changed" });
  assert.deepEqual(store.topics().map((t) => [t.key, t.title, t.notes.length]), [
    ["BIO-01", "Photosynthesis", 1],
    [GENERAL, "", 1],
    ["t:marie curie", "Marie Curie", 1],
  ]);
});

test("a deleted note can be put back where it was; a topic with no notes left is gone", () => {
  const store = createNotesStore(fakeStorage(), opts());
  const a = store.save("BIO-01", "Photosynthesis", { text: "one" });
  const b = store.save("BIO-01", "Photosynthesis", { text: "two" });
  const c = store.save("BIO-01", "Photosynthesis", { text: "three" });
  const removed = store.remove("BIO-01", b.id);
  assert.equal(removed.note.text, "two");
  assert.deepEqual(store.notes("BIO-01").map((n) => n.id), [a.id, c.id]);
  store.restore("BIO-01", removed);
  assert.deepEqual(store.notes("BIO-01").map((n) => n.id), [a.id, b.id, c.id]);
  store.restore("BIO-01", removed); // twice: still one copy
  assert.equal(store.notes("BIO-01").length, 3);
  assert.equal(store.remove("BIO-01", "nope"), null);
  // The last note of a topic: the topic leaves the list, and comes back with its title on undo.
  const only = store.save("CHEM-02", "Atoms", { text: "tiny" });
  const gone = store.remove("CHEM-02", only.id);
  assert.ok(!store.topics().some((t) => t.key === "CHEM-02"));
  store.restore("CHEM-02", gone);
  assert.deepEqual(store.topics().find((t) => t.key === "CHEM-02").title, "Atoms");
});

test("the old single note of each topic becomes its first note, and nothing is lost", () => {
  const storage = fakeStorage({
    [`${OLD_PREFIX}PHYS-DYN-01`]: "F = ma\nremember the units",
    [`${OLD_PREFIX}general`]: "ask about volcanoes",
    [`${OLD_PREFIX}BIO-01`]: "   ",
    "lt-sounds": "off",
  });
  const store = createNotesStore(storage, opts());
  assert.deepEqual(store.notes("PHYS-DYN-01").map((n) => [n.title, n.text]), [["My notes", "F = ma\nremember the units"]]);
  assert.deepEqual(store.notes(GENERAL).map((n) => n.text), ["ask about volcanoes"]);
  assert.deepEqual(store.notes("BIO-01"), [], "an empty old note makes no note");
  // The old entries are gone only now that the new one holds them; other settings are untouched.
  assert.deepEqual([...storage.map.keys()].sort(), [NOTES_KEY, "lt-sounds"].sort());
  // Its lesson's title is not known yet: filled in when the lesson is next opened.
  assert.equal(store.topics().find((t) => t.key === "PHYS-DYN-01").title, "");
  assert.equal(store.nameTopic("PHYS-DYN-01", "Newton's second law"), true);
  assert.equal(store.nameTopic("PHYS-DYN-01", "Newton's second law"), false);
  assert.equal(store.topics().find((t) => t.key === "PHYS-DYN-01").title, "Newton's second law");
  assert.equal(store.nameTopic("NO-NOTES-01", "Nothing here"), false);
});

test("an old note left later by an older copy of the page joins the notes already there", () => {
  const storage = fakeStorage();
  const first = createNotesStore(storage, opts());
  first.save("PHYS-DYN-01", "Newton's second law", { title: "Units", text: "newtons" });
  storage.setItem(`${OLD_PREFIX}PHYS-DYN-01`, "written in the other tab");
  const store = createNotesStore(storage, opts());
  assert.deepEqual(store.notes("PHYS-DYN-01").map((n) => n.text), ["written in the other tab", "newtons"]);
  assert.equal(store.topics()[0].title, "Newton's second law");
  assert.equal(storage.getItem(`${OLD_PREFIX}PHYS-DYN-01`), null);
});

test("if the new entry cannot be written, the old notes stay where they are and are still shown", () => {
  const storage = fakeStorage({ [`${OLD_PREFIX}PHYS-DYN-01`]: "F = ma" }, { failWrites: true });
  const store = createNotesStore(storage, opts());
  assert.equal(storage.getItem(`${OLD_PREFIX}PHYS-DYN-01`), "F = ma", "not removed");
  assert.equal(store.persistent, false);
  assert.deepEqual(store.notes("PHYS-DYN-01").map((n) => n.text), ["F = ma"]);
  // Once the storage works again, a new store takes it in, once.
  const working = fakeStorage(Object.fromEntries(storage.map));
  assert.deepEqual(createNotesStore(working, opts()).notes("PHYS-DYN-01").map((n) => n.text), ["F = ma"]);
  assert.deepEqual(createNotesStore(working, opts()).notes("PHYS-DYN-01").map((n) => n.text), ["F = ma"]);
  assert.equal(working.getItem(`${OLD_PREFIX}PHYS-DYN-01`), null);
});

test("storage blocked: notes last for this page, and the store says so", () => {
  const store = createNotesStore(fakeStorage({}, { blocked: true }), opts());
  const a = store.save("BIO-01", "Photosynthesis", { text: "light" });
  assert.equal(store.persistent, false);
  assert.deepEqual(store.notes("BIO-01").map((n) => n.text), ["light"]);
  store.remove("BIO-01", a.id);
  assert.deepEqual(store.topics(), []);
  // No storage at all (the page could not even reach localStorage).
  const none = createNotesStore(null, opts());
  none.save(GENERAL, "", { text: "kept in memory" });
  assert.equal(none.persistent, false);
  assert.equal(none.notes(GENERAL).length, 1);
});

test("two tabs: each reads what the other wrote before it writes", () => {
  const storage = fakeStorage();
  const one = createNotesStore(storage, opts());
  const two = createNotesStore(storage, { now: () => ++clock, makeId: () => `t${clock}` });
  one.save("BIO-01", "Photosynthesis", { text: "from tab one" });
  two.save("BIO-01", "Photosynthesis", { text: "from tab two" });
  assert.deepEqual(one.notes("BIO-01").map((n) => n.text), ["from tab one", "from tab two"]);
});

test("something else under the notes' entry is set aside, never written over, and bad shapes are dropped", () => {
  const storage = fakeStorage({ [NOTES_KEY]: "{not json" });
  const store = createNotesStore(storage, opts());
  assert.deepEqual(store.topics(), []);
  store.save(GENERAL, "", { text: "new" });
  assert.equal(storage.getItem(`${NOTES_KEY}.broken`), "{not json");
  const odd = fakeStorage({ [NOTES_KEY]: JSON.stringify({ v: 2, topics: [{ key: "A", title: 5, notes: [{ id: "x", text: "ok" }, { text: "no id" }, null, { id: "empty" }] }, { key: "B", notes: [] }, "junk"] }) });
  // A note with no id of its own (or another's) is kept and given one; only what is not a note goes.
  assert.deepEqual(createNotesStore(odd, opts()).topics(), [
    { key: "A", title: "", notes: [{ id: "x", title: "", text: "ok", at: 0 }, { id: "note", title: "", text: "no id", at: 0 }] },
  ]);
});
