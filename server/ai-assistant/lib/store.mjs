// What the admin panel shows: questions the teacher could not answer (the
// TODO list, counted by how often students ask) and a log of every question
// with how it was answered and how long it took.
import fs from 'node:fs';
import path from 'node:path';
import { readJson, writeWhole, writeWholeSync } from './files.mjs';

const keyOf = (text) => text.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

export function createStore(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const todoFile = path.join(dataDir, 'todos.json');
  const logFile = path.join(dataDir, 'asks.jsonl');
  // No prototype: a question that is just "constructor" or "__proto__" is a
  // key like any other.
  const todos = Object.assign(Object.create(null), readJson(todoFile, {}));
  const recent = [];
  let timer = null;
  const text = () => JSON.stringify(todos, null, 1);
  const save = () => { clearTimeout(timer); timer = setTimeout(() => { timer = null; writeWhole(todoFile, text()).catch(() => {}); }, 300); };

  return {
    // answered: the teacher gave a quick spoken answer, but there is no lesson.
    addTodo(text, { answered = false } = {}) {
      const key = keyOf(text);
      if (!key) return;
      const now = new Date().toISOString();
      const t = todos[key] || (todos[key] = { text, count: 0, first: now, done: false });
      t.count++;
      t.last = now;
      t.done = false;
      t.answered = answered;
      save();
    },
    doneTodo(key) { if (Object.hasOwn(todos, key)) { todos[key].done = true; save(); } },
    // A save still waiting is written now (the server is stopping).
    flush() { if (timer) { clearTimeout(timer); timer = null; try { writeWholeSync(todoFile, text()); } catch { /* nothing to lose but this */ } } },
    todos: () => Object.entries(todos).map(([key, t]) => ({ key, ...t })).sort((a, b) => a.done - b.done || b.count - a.count),
    log(entry) {
      const row = { at: new Date().toISOString(), ...entry };
      recent.unshift(row);
      if (recent.length > 200) recent.pop();
      fs.appendFile(logFile, JSON.stringify(row) + '\n', () => {});
    },
    recent: () => recent,
    stats() {
      const byTier = {};
      for (const r of recent) byTier[r.tier] = (byTier[r.tier] || 0) + 1;
      return { total: recent.length, byTier };
    },
  };
}
