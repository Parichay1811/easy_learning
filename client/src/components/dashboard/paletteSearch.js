// Forgiving search for the command palette (DSN-002). Pure, so it is easy to test.
// Score: exact label > label starts with > a word starts with > contains >
// keywords > letters in order ("sgrp" finds "Student groups").
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function inOrder(needle, hay) {
  let i = 0;
  for (const ch of hay) if (ch === needle[i] && ++i === needle.length) return true;
  return false;
}

export function scoreItem(item, query) {
  const q = norm(query).trim();
  if (!q) return 1;
  const label = norm(item.label);
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.split(/[\s/·\-–>]+/).some((w) => w.startsWith(q))) return 60;
  if (label.includes(q)) return 40;
  if (norm([item.hint, item.group, ...(item.keywords || [])].join(' ')).includes(q)) return 30;
  if (q.length >= 2 && inOrder(q, label.replace(/\s+/g, ''))) return 10;
  return 0;
}

// Best matches first; stable within equal scores. `recent` ids float up when nothing is typed.
export function searchItems(items, query, { limit = 30, recent = [] } = {}) {
  const q = norm(query).trim();
  if (!q) {
    const byId = new Map(items.map((i) => [i.id, i]));
    const first = recent.map((id) => byId.get(id)).filter(Boolean).map((i) => ({ ...i, recent: true }));
    const rest = items.filter((i) => !recent.includes(i.id));
    return [...first, ...rest].slice(0, limit);
  }
  return items
    .map((item, index) => ({ item, index, score: scoreItem(item, q) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((r) => r.item);
}
