// The topic catalogue behind the page's "Pick a topic" picker (GET /catalog):
// every lesson pack by subject area, then by group, as { id, title, levels }.
// Titles only, from memory, so a child can browse instead of typing.
//
// The areas for young children come first. A topic's levels say who it is for
// (factory/build-packs.mjs LEVELS: EY age 4 to 5, P1 6 to 7, P2 8 to 10, L 11
// to 14, then GCSE and up); an area's place is the average of how young its
// topics start, so "Early Years" and "For Kids" lead and the bachelor's
// courses come last.
const LEVEL_ORDER = ['EY', 'P1', 'P2', 'L', 'M', 'U', 'E', 'H', 'PRO'];
const YOUNG = { EY: 1, P1: 0.9, P2: 0.6, L: 0.2 };
const youngness = (levels) => Math.max(0, ...levels.map((l) => YOUNG[l] || 0));
const fold = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const inOrder = (levels) => LEVEL_ORDER.filter((l) => levels.includes(l));

// packs: Map(id -> pack). topicRows: the curriculum rows by id, for the few
// (reviewed) packs that carry no area, group or levels of their own, the way
// lessonCard falls back. Returns { total, areas: [{ name, count, levels }],
// byArea: Map(name -> { area, groups: [{ name, topics: [{ id, title, levels }] }] }) }.
export function buildCatalog(packs, topicRows = new Map()) {
  const areas = new Map();
  for (const p of packs.values()) {
    const row = topicRows.get(p.id) || {};
    // "Commerce: Economics, Business & Accounting" is the subject "Commerce", as on the lesson's card.
    const name = String(p.area || row.area || '').split(':')[0].trim() || p.id.split('-')[0];
    const [code, groupName] = String(p.group || row.group || '').split(/\s+—\s+/);
    const levels = inOrder([p.levels || row.levels || []].flat());
    const area = areas.get(name) || areas.set(name, { name, groups: new Map(), seen: new Map(), young: 0, count: 0, levels: {} }).get(name);
    // The same title twice in one area (a reviewed pack and a draft of it): the reviewed one.
    const key = fold(p.title);
    const twin = area.seen.get(key);
    if (twin && (twin.reviewed || p.status !== 'reviewed')) continue;
    const topic = { id: p.id, title: p.title, levels };
    if (twin) {
      Object.assign(twin.topic, topic);
      twin.reviewed = true;
      continue;
    }
    area.seen.set(key, { topic, reviewed: p.status === 'reviewed' });
    const group = groupName || code || '';
    const g = area.groups.get(group) || area.groups.set(group, { name: group, topics: [], young: 0 }).get(group);
    g.topics.push(topic);
    g.young += youngness(levels);
    area.young += youngness(levels);
    area.count++;
    for (const l of levels) area.levels[l] = (area.levels[l] || 0) + 1;
  }
  const byYoung = (a, b) => b.young / b.n - a.young / a.n;
  const list = [...areas.values()]
    .map((a) => ({ ...a, n: a.count }))
    .sort((a, b) => byYoung(a, b) || b.count - a.count || a.name.localeCompare(b.name));
  const byArea = new Map();
  for (const a of list) {
    // Groups keep the curriculum's order, the youngest first ("Primary maths" before "class 11–12").
    const groups = [...a.groups.values()]
      .map((g, i) => ({ ...g, n: g.topics.length, i }))
      .sort((x, y) => byYoung(x, y) || x.i - y.i)
      .map(({ name, topics }) => ({ name, topics }));
    byArea.set(a.name, { area: a.name, groups });
  }
  return {
    total: list.reduce((n, a) => n + a.count, 0),
    // An area's levels: those a fair share of its topics have, not one stray lesson.
    areas: list.map((a) => ({
      name: a.name,
      count: a.count,
      levels: LEVEL_ORDER.filter((l) => (a.levels[l] || 0) >= Math.max(1, a.count * 0.1)),
    })),
    byArea,
  };
}

// Built once per set of packs (a reload makes a new Map, and so a new catalogue).
const built = new WeakMap();
export function catalogOf(packs, topicRows) {
  if (!built.has(packs)) built.set(packs, buildCatalog(packs, topicRows));
  return built.get(packs);
}
