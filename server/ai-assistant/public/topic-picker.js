// "Pick a topic": the list under the subject card. A child who cannot spell a
// topic yet can browse instead of typing: the subjects as big rows (GET
// /catalog, those for young children first), then the topics of the one
// picked (GET /catalog?area=), with a row back. With a lesson open it shows
// the topics like it, as before, and a row to browse them all.
//
// It is a button that opens a list of buttons, so Tab and Enter work as on
// any page; the arrow keys, Home and End move along the rows as well, and
// Escape closes it and returns to the button.

// Who a topic is for, from its levels (factory/build-packs.mjs LEVELS).
const AGES = { EY: [4, 5], P1: [6, 7], P2: [8, 10], L: [11, 14], M: [14, 16], U: [16, 18], E: [16, 18] };
/** ["EY", "P1"] -> "Ages 4–7"; with university or adult levels "Ages 16+". "" when unknown. */
export function ageLabel(levels = []) {
  const spans = levels.map((l) => AGES[l]).filter(Boolean);
  const older = levels.includes("H") || levels.includes("PRO");
  if (!spans.length) return levels.includes("H") ? "University" : levels.includes("PRO") ? "For adults" : "";
  const from = Math.min(...spans.map((s) => s[0]));
  const to = Math.max(...spans.map((s) => s[1]));
  return older || to >= 18 ? `Ages ${from}+` : `Ages ${from}–${to}`;
}
/** "139 topics · Ages 4–10" under a subject's name. */
export function areaLine(area) {
  const ages = ageLabel(area.levels);
  return `${area.count} ${area.count === 1 ? "topic" : "topics"}${ages ? ` · ${ages}` : ""}`;
}

const API = "/api/ai-assistant/catalog";
const el = (tag, props = {}, ...kids) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...kids);
  return node;
};
// A picture or arrow beside a row's words: not read out.
const deco = (className, textContent) => {
  const node = el("span", { className, textContent });
  node.setAttribute("aria-hidden", "true");
  return node;
};

/**
 * button: the subject card. list: the <ul> it opens. iconFor(name): an emoji
 * for a subject. onPick(id, title): open that lesson.
 */
export function createTopicPicker({ button, list, iconFor = () => "✨", onPick }) {
  let related = []; // topics like the open lesson
  let view = null; // null: the related topics, or the subjects when there are none; "areas"; { area }
  let areas = null; // a promise of the subjects, asked for once
  const topics = new Map(); // a subject's name -> a promise of its groups
  let seq = 0; // only the newest view is drawn
  const json = async (url) => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`catalog ${r.status}`);
    return r.json();
  };

  const note = (text, cls = "empty") => el("li", { className: cls, textContent: text });
  function rowButton(cls, onClick, ...kids) {
    const b = el("button", { type: "button", className: cls }, ...kids);
    b.addEventListener("click", onClick);
    return el("li", {}, b);
  }
  const topicRow = (t) => {
    const kids = [el("span", { className: "pk-title", textContent: t.title })];
    const ages = ageLabel(t.levels);
    if (ages) kids.push(el("span", { className: "pk-ages", textContent: ages }));
    return rowButton("pk-topic", () => {
      toggle(false);
      onPick(t.id, t.title);
    }, ...kids);
  };
  // After a tap on a row the row is gone: the first row of the new list takes the focus.
  function show(label, rows, focus) {
    list.setAttribute("aria-label", label);
    list.replaceChildren(...rows);
    list.scrollTop = 0;
    if (focus) (list.querySelector("button") || button).focus();
  }
  const failed = (again) => [
    note("The topics did not load. You can type a topic in the question bar."),
    rowButton("pk-back", again, "Try again"),
  ];

  async function showAreas(focus) {
    view = "areas";
    const mine = ++seq;
    const back = related.length ? [rowButton("pk-back", () => showRelated(true), "‹ Topics like this lesson")] : [];
    if (!areas) show("Subjects", [...back, note("Finding the topics…")], focus);
    areas ||= json(API);
    let data;
    try {
      data = await areas;
    } catch {
      areas = null;
      if (mine === seq) show("Subjects", [...back, ...failed(() => showAreas(true))], focus);
      return;
    }
    if (mine !== seq) return;
    show("Subjects", [
      ...back,
      note("Pick a subject", "pk-head"),
      ...data.areas.map((a) =>
        rowButton(
          "pk-area",
          () => showArea(a.name, true),
          deco("pk-icon", iconFor(a.name)),
          el("span", { className: "pk-text" }, el("b", { textContent: a.name }), el("small", { textContent: areaLine(a) })),
          deco("pk-go", "›"),
        ),
      ),
    ], focus);
  }

  async function showArea(name, focus) {
    view = { area: name };
    const mine = ++seq;
    const back = rowButton("pk-back", () => showAreas(true), "‹ All subjects");
    if (!topics.has(name)) show(`Topics in ${name}`, [back, note(name, "pk-head"), note("Finding the topics…")], focus);
    if (!topics.has(name)) topics.set(name, json(`${API}?area=${encodeURIComponent(name)}`));
    let data;
    try {
      data = await topics.get(name);
    } catch {
      topics.delete(name);
      if (mine === seq) show(`Topics in ${name}`, [back, ...failed(() => showArea(name, true))], focus);
      return;
    }
    if (mine !== seq) return;
    const many = data.groups.length > 1;
    show(`Topics in ${name}`, [
      back,
      note(name, "pk-head"),
      ...data.groups.flatMap((g) => [...(many && g.name ? [note(g.name, "pk-group")] : []), ...g.topics.map(topicRow)]),
    ], focus);
  }

  function showRelated(focus) {
    view = null;
    seq++;
    show("Topics like this lesson", [
      rowButton("pk-browse", () => showAreas(true), deco("pk-icon", "🧭"), el("span", { className: "pk-text" }, el("b", { textContent: "Browse all topics" }))),
      note("More like this lesson", "pk-head"),
      ...related.map(topicRow),
    ], focus);
  }

  // Draws the view it is on: the related topics, the subjects or one subject's topics.
  function draw(focus = false) {
    if (view?.area) showArea(view.area, focus);
    else if (view === "areas" || !related.length) showAreas(focus);
    else showRelated(focus);
  }
  function toggle(open = list.hidden) {
    if (open === !list.hidden) return;
    list.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    if (open) draw();
  }

  button.addEventListener("click", () => toggle());
  document.addEventListener("pointerdown", (e) => {
    if (!list.hidden && !button.parentElement.contains(e.target)) toggle(false);
  });
  button.parentElement.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !list.hidden) {
      // Closes the list only: on the page Escape would stop the teacher.
      e.preventDefault();
      e.stopPropagation();
      toggle(false);
      return button.focus();
    }
    const move = { ArrowDown: 1, ArrowUp: -1, Home: "first", End: "last" }[e.key];
    if (!move) return;
    if (list.hidden) {
      if (e.key !== "ArrowDown" || e.target !== button) return;
      toggle(true);
    }
    const rows = [...list.querySelectorAll("button")];
    if (!rows.length) return;
    e.preventDefault();
    const at = rows.indexOf(document.activeElement);
    const next = move === "first" ? 0 : move === "last" ? rows.length - 1 : at < 0 ? (move > 0 ? 0 : rows.length - 1) : (at + move + rows.length) % rows.length;
    rows[next].focus();
  });

  return {
    toggle,
    /** The open lesson's own neighbours ([{ id, title }]); none for an answer from the web. */
    setRelated(next = []) {
      related = next;
      view = null;
      if (!list.hidden) draw(list.contains(document.activeElement));
    },
  };
}
