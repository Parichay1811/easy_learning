// The notes card (index.html #notes): the notes of the topic on the board,
// every note by topic ("All my notes", with a way back to each lesson), and
// the note being written. What is typed is saved as it is typed, in this
// browser only (notes-store.js). A deleted note can be put back for a moment.
import { GENERAL, lessonOf, noteName } from "./notes-store.js";

const UNDO_MS = 8000;
const el = (tag, props = {}, ...kids) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...kids);
  return node;
};
const BIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6"/></svg>';

/**
 * root: the #notes card. store: createNotesStore(). onToggle(open): the card
 * opened or closed. openTopic(key, title): back to that topic's lesson.
 * titleOf(lessonId): a promise of a lesson's title, for notes taken in from
 * before, which only know its id.
 */
export function createNotesPanel(root, { store, onToggle = () => {}, openTopic = () => {}, titleOf = null } = {}) {
  const $ = (id) => root.querySelector(`#${id}`);
  const ui = {
    back: $("notes-back"), x: $("notes-x"), topic: $("notes-topic"), tabs: $("notes-tabs"),
    tabTopic: $("notes-tab-topic"), tabAll: $("notes-tab-all"), list: $("notes-list"), edit: $("notes-edit"),
    name: $("notes-name"), text: $("notes-text"), undo: $("notes-undo"), undoText: $("notes-undo-text"),
    undoBtn: $("notes-undo-btn"), add: $("notes-new"), del: $("notes-delete"), done: $("notes-close"), hint: $("notes-hint"),
  };
  let topic = { key: GENERAL, title: "" }; // what is on the board
  let view = "topic"; // "topic" | "all" | "edit"
  let editing = null; // { key, title, id (null until something is typed), from }
  let undo = null; // { key, removed, timer }
  const asked = new Set(); // lessons whose title was asked for
  // A lesson's title arrives a moment after it opens; notes taken in from before know only its id.
  const topicName = (t) => t.title || (t.key === GENERAL ? "General notes" : t.key === topic.key ? "This lesson" : "A lesson from before");

  function hint() {
    ui.hint.textContent = store.persistent
      ? "Saved on this device only."
      : "This browser cannot save notes: they last until you close the page.";
  }

  // One note in a list: its name (opens it) and a delete button.
  function row(key, title, note) {
    const name = noteName(note);
    const rest = note.title ? note.text.replace(/\s+/g, " ").trim().slice(0, 60) : "";
    const open = el("button", { type: "button", className: "note-open" }, el("b", { textContent: name }));
    if (rest) open.append(el("small", { textContent: rest }));
    open.addEventListener("click", () => edit({ key, title, id: note.id, from: view }));
    const del = el("button", { type: "button", className: "notes-icon note-del", title: "Delete", innerHTML: BIN });
    del.setAttribute("aria-label", `Delete the note “${name}”`);
    del.addEventListener("click", () => remove(key, note.id));
    return el("li", {}, open, del);
  }

  function render() {
    const isEdit = view === "edit";
    ui.back.hidden = !isEdit;
    ui.tabs.hidden = isEdit;
    ui.list.hidden = isEdit;
    ui.edit.hidden = !isEdit;
    ui.add.hidden = isEdit;
    ui.del.hidden = !isEdit;
    ui.tabTopic.setAttribute("aria-pressed", String(view === "topic"));
    ui.tabAll.setAttribute("aria-pressed", String(view === "all"));
    hint();
    if (isEdit) {
      ui.topic.textContent = topicName(editing);
      return;
    }
    if (view === "topic") {
      ui.topic.textContent = topicName(topic);
      const notes = store.notes(topic.key);
      ui.list.replaceChildren(
        notes.length
          ? el("ul", { className: "notes-items" }, ...notes.map((n) => row(topic.key, topic.title, n)))
          : el("p", { className: "notes-empty", textContent: "No notes for this topic yet. Press New note to write one." }),
      );
      return;
    }
    const topics = store.topics();
    ui.topic.textContent = topics.length ? "From every topic" : "";
    ui.list.replaceChildren(
      ...(topics.length
        ? topics.map((t) => {
            const name = el("h4", { textContent: topicName(t) });
            const head = el("div", { className: "notes-group-head" }, name);
            // Back to that lesson (or, for an answer from the web, asked again by its title).
            let go = null;
            if (t.key !== GENERAL && t.key !== topic.key && (t.title || lessonOf(t.key))) {
              go = el("button", { type: "button", className: "notes-go", textContent: "Open lesson" });
              go.setAttribute("aria-label", `Open the lesson ${topicName(t)}`);
              go.addEventListener("click", () => {
                close();
                openTopic(t.key, t.title);
              });
              head.append(go);
            } else if (t.key === topic.key) head.append(el("span", { className: "notes-here", textContent: "On the board" }));
            nameLater(t, name, go);
            return el("section", { className: "notes-group" }, head, el("ul", { className: "notes-items" }, ...t.notes.map((n) => row(t.key, t.title, n))));
          })
        : [el("p", { className: "notes-empty", textContent: "You have no notes yet. Press New note to write your first one." })]),
    );
  }

  // Notes taken in from the old single note know their lesson's id, not its
  // title: it is looked up once and written into the heading where it stands
  // (the list is not drawn again, so the focus stays where it is).
  function nameLater(t, name, go) {
    const id = lessonOf(t.key);
    if (t.title || !id || !titleOf || asked.has(id)) return;
    asked.add(id);
    Promise.resolve(titleOf(id))
      .then((title) => {
        if (!title) return asked.delete(id);
        store.nameTopic(t.key, title);
        t.title = title;
        name.textContent = title;
        go?.setAttribute("aria-label", `Open the lesson ${title}`);
      })
      .catch(() => asked.delete(id));
  }

  // What is in the two boxes, saved; a new note exists from its first letter.
  function flush() {
    if (!editing) return;
    const title = ui.name.value;
    const text = ui.text.value;
    if (!editing.id && !title.trim() && !text.trim()) return;
    editing.id = store.save(editing.key, editing.title, { id: editing.id, title, text }).id;
    hint();
  }
  // Leaving a note: one left with nothing in it is not kept.
  function leave() {
    if (!editing) return;
    flush();
    if (editing.id && !ui.name.value.trim() && !ui.text.value.trim()) store.remove(editing.key, editing.id);
    editing = null;
  }

  function edit({ key, title, id = null, from = "topic" }) {
    leave();
    const note = id ? store.notes(key).find((n) => n.id === id) : null;
    editing = { key, title, id: note ? id : null, from: from === "edit" ? "topic" : from };
    ui.name.value = note?.title || "";
    ui.text.value = note?.text || "";
    view = "edit";
    render();
    ui.text.focus();
  }

  function list(which = editing?.from || "topic", focus = true) {
    leave();
    view = which;
    render();
    if (focus) (ui.list.querySelector("button") || ui.add).focus();
  }

  function remove(key, id) {
    const removed = store.remove(key, id);
    if (!removed) return render();
    forget();
    undo = { key, removed, timer: setTimeout(forget, UNDO_MS) };
    ui.undo.hidden = false;
    ui.undoText.textContent = `“${noteName(removed.note)}” was deleted.`;
    render();
    ui.undoBtn.focus();
  }
  // The moment to undo has passed (or it was used): the bar goes.
  function forget() {
    if (!undo) return;
    clearTimeout(undo.timer);
    undo = null;
    const had = ui.undo.contains(document.activeElement);
    ui.undo.hidden = true;
    ui.undoText.textContent = "";
    if (had) (ui.list.querySelector("button") || ui.add).focus();
  }

  function open() {
    if (!root.hidden) return;
    root.hidden = false;
    onToggle(true);
    // Nothing written on this topic yet: straight to a new note, as it always was.
    if (store.notes(topic.key).length) list("topic");
    else edit({ ...topic });
  }
  function close() {
    if (root.hidden) return;
    const had = root.contains(document.activeElement);
    leave();
    forget();
    view = "topic";
    root.hidden = true;
    onToggle(false, had);
  }

  ui.name.addEventListener("input", flush);
  ui.text.addEventListener("input", flush);
  ui.back.addEventListener("click", () => list());
  ui.x.addEventListener("click", close);
  ui.done.addEventListener("click", close);
  ui.add.addEventListener("click", () => edit({ ...topic, from: view }));
  ui.tabTopic.addEventListener("click", () => list("topic"));
  ui.tabAll.addEventListener("click", () => list("all"));
  ui.del.addEventListener("click", () => {
    const { key, id, from } = editing;
    // Never saved (nothing typed): there is nothing to delete or to undo.
    ui.name.value = ui.text.value = "";
    editing.id = null;
    list(from, !id);
    if (id) remove(key, id);
  });
  ui.undoBtn.addEventListener("click", () => {
    if (!undo) return;
    store.restore(undo.key, undo.removed);
    forget();
    render();
    (ui.list.querySelector("button") || ui.add).focus();
  });
  // Escape closes the card (what was typed is saved already) and goes no further:
  // on the page it would stop the teacher.
  root.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    close();
  });
  // Another tab changed the notes: show them.
  window.addEventListener("storage", () => {
    if (!root.hidden && view !== "edit") render();
  });
  hint();

  return {
    open,
    close,
    toggle: () => (root.hidden ? open() : close()),
    get isOpen() {
      return !root.hidden;
    },
    /** The topic on the board changed: its notes show, and a note not yet begun is filed under it. */
    setTopic(key, title = "") {
      if (title) store.nameTopic(key, title);
      const same = key === topic.key && title === topic.title;
      topic = { key, title };
      if (same || root.hidden) return;
      if (view === "edit" && !editing.id && !ui.name.value.trim() && !ui.text.value.trim()) {
        Object.assign(editing, topic);
        render();
      } else if (view !== "edit") render();
    },
  };
}
