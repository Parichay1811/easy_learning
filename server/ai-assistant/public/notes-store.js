// The learner's own notes: several per topic, each with a name and its text,
// kept in this browser only (localStorage), never sent anywhere. Pure (the
// storage is handed in), so it can be checked in Node.
//
// One entry, NOTES_KEY, holds them all:
//   { v: 2, topics: [{ key, title, notes: [{ id, title, text, at }] }] }
// A topic's key is its lesson id ("PHYS-DYN-01"); an answer from Wikipedia or
// open data has no lesson, so it is filed under its title ("t:marie curie");
// with nothing on the board yet the notes are GENERAL.
//
// Before this there was one string per topic under "learnigo-notes:<id>".
// Each of those becomes the first note of its topic ("My notes"), and is
// removed only once the new entry is safely written. That runs every time the
// store is made, so a note left by an older copy of the page still open in
// another tab is picked up too.
export const NOTES_KEY = "learnigo-notebook";
export const OLD_PREFIX = "learnigo-notes:";
export const GENERAL = "general";
const MAX_NAME = 60;
const MAX_TEXT = 20000;

const fold = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 80);
const str = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");

/** Where a topic's notes are filed: by lesson id, else by title, else GENERAL. */
export const topicKey = (topic) => topic?.id || (fold(topic?.title) ? `t:${fold(topic.title)}` : GENERAL);
/** The lesson a key opens, or null for a title or the general notes. */
export const lessonOf = (key) => (key && key !== GENERAL && !key.startsWith("t:") ? key : null);
/** What a note is called in a list: its name, else how it begins. */
export function noteName(note) {
  const name = str(note?.title, MAX_NAME).trim();
  if (name) return name;
  const line = String(note?.text || "").split("\n").map((l) => l.trim()).find(Boolean) || "";
  return line.length > 40 ? `${line.slice(0, 39).trimEnd()}…` : line || "New note";
}

// Whatever was stored, as the shape above: anything else in it is dropped. A
// note is never dropped for its id: one without, or with another's, gets its own.
function tidy(data) {
  const topics = [];
  const seen = new Set();
  for (const t of Array.isArray(data?.topics) ? data.topics : []) {
    if (!t || typeof t.key !== "string" || !t.key || seen.has(t.key)) continue;
    const ids = new Set();
    const notes = [];
    for (const n of Array.isArray(t.notes) ? t.notes : []) {
      if (!n || typeof n !== "object" || !(str(n.title, MAX_NAME) || str(n.text, MAX_TEXT))) continue;
      let id = typeof n.id === "string" && n.id ? n.id : "note";
      while (ids.has(id)) id += "+";
      ids.add(id);
      notes.push({ id, title: str(n.title, MAX_NAME), text: str(n.text, MAX_TEXT), at: Number(n.at) || 0 });
    }
    if (!notes.length) continue;
    seen.add(t.key);
    topics.push({ key: t.key, title: str(t.title, 200), notes });
  }
  return { v: 2, topics };
}

/**
 * storage: localStorage, or anything with getItem, setItem, removeItem, key
 * and length. When it cannot be read or written (blocked, full) the notes
 * last until the page closes and `persistent` says so.
 */
export function createNotesStore(storage, { now = Date.now, makeId } = {}) {
  let memory = null; // this page's own copy, once the storage has failed
  let persistent = true;
  let n = 0;
  const newId = makeId || (() => `${now().toString(36)}-${(n++).toString(36)}${Math.random().toString(36).slice(2, 7)}`);

  // Read fresh each time: another tab may have written since.
  function read() {
    if (memory) return memory;
    let raw = null;
    try {
      raw = storage.getItem(NOTES_KEY);
    } catch {
      persistent = false;
      return (memory = tidy(null));
    }
    if (!raw) return tidy(null);
    try {
      return tidy(JSON.parse(raw));
    } catch {
      // Not ours, or cut off: set aside, never written over.
      try {
        storage.setItem(`${NOTES_KEY}.broken`, raw);
      } catch {
        /* nowhere to keep it */
      }
      return tidy(null);
    }
  }
  function write(data) {
    if (memory) return false;
    try {
      storage.setItem(NOTES_KEY, JSON.stringify(data));
      return true;
    } catch {
      persistent = false;
      memory = data;
      return false;
    }
  }
  const find = (data, key) => data.topics.find((t) => t.key === key);
  // An id no other note of the topic has.
  const freshId = (topic) => {
    let id = newId();
    while (topic.notes.some((x) => x.id === id)) id += "+";
    return id;
  };

  // The old single note of each topic: into the first note of the new list.
  function migrate() {
    const old = [];
    try {
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k?.startsWith(OLD_PREFIX)) old.push([k, storage.getItem(k)]);
      }
    } catch {
      return;
    }
    if (!old.length) return;
    const data = read();
    for (const [k, text] of old) {
      const key = k.slice(OLD_PREFIX.length) || GENERAL;
      if (typeof text !== "string" || !text.trim()) continue;
      let topic = find(data, key);
      if (!topic) data.topics.push((topic = { key, title: "", notes: [] }));
      // Already taken in (the old entry could not be removed that time): not twice.
      if (topic.notes.some((x) => x.text === text.slice(0, MAX_TEXT))) continue;
      topic.notes.unshift({ id: freshId(topic), title: "My notes", text: text.slice(0, MAX_TEXT), at: now() });
    }
    if (!write(data)) return; // not safely written: the old entries stay where they are
    for (const [k] of old) {
      try {
        storage.removeItem(k);
      } catch {
        /* it is taken in again next time, and skipped as a copy */
      }
    }
  }
  migrate();

  return {
    /** False when the notes could not be saved in this browser. */
    get persistent() {
      return persistent;
    },
    /** A topic's notes, in the order they were made. */
    notes(key) {
      return find(read(), key)?.notes || [];
    },
    /** Every topic that has notes, the one written in last first. */
    topics() {
      const last = (t) => Math.max(...t.notes.map((x) => x.at));
      return read().topics.sort((a, b) => last(b) - last(a));
    },
    /** Adds a note, or changes the one with this id. Returns it as stored. */
    save(key, topicTitle, { id = null, title = "", text = "" } = {}) {
      const data = read();
      let topic = find(data, key);
      if (!topic) data.topics.push((topic = { key, title: "", notes: [] }));
      if (topicTitle) topic.title = str(topicTitle, 200);
      let note = id && topic.notes.find((x) => x.id === id);
      if (!note) topic.notes.push((note = { id: id || freshId(topic) }));
      Object.assign(note, { title: str(title, MAX_NAME).trim(), text: str(text, MAX_TEXT), at: now() });
      write(data);
      return { ...note };
    },
    /** Deletes a note. Returns { note, index, title } to hand to restore(), or null. */
    remove(key, id) {
      const data = read();
      const topic = find(data, key);
      const index = topic ? topic.notes.findIndex((x) => x.id === id) : -1;
      if (index < 0) return null;
      const [note] = topic.notes.splice(index, 1);
      if (!topic.notes.length) data.topics.splice(data.topics.indexOf(topic), 1);
      write(data);
      return { note, index, title: topic.title };
    },
    /** Puts a deleted note back where it was. */
    restore(key, { note, index, title }) {
      const data = read();
      let topic = find(data, key);
      if (!topic) data.topics.push((topic = { key, title: title || "", notes: [] }));
      if (!topic.notes.some((x) => x.id === note.id)) topic.notes.splice(Math.min(index, topic.notes.length), 0, note);
      write(data);
    },
    /** The topic's title, once known (notes taken in from before have only its id). */
    nameTopic(key, title) {
      const data = read();
      const topic = find(data, key);
      if (!topic || !title || topic.title === title) return false;
      topic.title = str(title, 200);
      write(data);
      return true;
    },
  };
}
