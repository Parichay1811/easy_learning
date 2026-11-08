// The topics to make packs for: factory/topics.json (a snapshot of the
// curriculum brief's topic taxonomy, section 7, "| ID | Topic | Lv |
// Subtopics | Asked as |"), plus factory/topics-extra.json for topics beyond
// it. Refresh the snapshot from a brief with:
//   node factory/build-packs.mjs --import-brief <path to AGENTIC_CHANNEL_MASTER.md>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = path.join(HERE, 'topics.json');
const ROW = /^\|\s*([A-Z]{2,5}(?:-[A-Z0-9]{1,6})*-\d{2})\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/;

export function parseBrief(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const start = lines.findIndex((l) => l.startsWith('## 7. Topic Taxonomy'));
  const end = lines.findIndex((l, i) => i > start && l.startsWith('## 8.'));
  const topics = new Map();
  let area = '';
  let group = '';
  for (const line of lines.slice(start, end)) {
    if (line.startsWith('### ')) area = line.replace(/^###\s*[\d.]*\s*/, '').trim();
    else if (line.startsWith('#### ')) group = line.replace(/^####\s*/, '').trim();
    const m = line.match(ROW);
    if (!m || m[1] === 'ID' || topics.has(m[1])) continue;
    const [, id, title, lv, subtopics, askedAs] = m;
    topics.set(id, {
      id, title: title.replace(/[†⚑★]/g, '').trim(), area, group,
      levels: lv.replace(/[★†⚑]/g, ' ').split(/\s+/).filter(Boolean),
      core: lv.includes('★'), verify: lv.includes('†') || title.includes('†'), sensitive: lv.includes('⚑') || title.includes('⚑'),
      subtopics: subtopics.replace(/[†⚑]/g, '').trim(), askedAs: askedAs.trim(), source: 'brief',
    });
  }
  return [...topics.values()];
}

export function saveSnapshot(topics, source) {
  fs.writeFileSync(SNAPSHOT, `${JSON.stringify({ source, imported: new Date().toISOString().slice(0, 10), count: topics.length, topics }, null, 1)}\n`);
}

export function briefTopics() {
  return fs.existsSync(SNAPSHOT) ? JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8')).topics : [];
}

export function extraTopics() {
  const file = path.join(HERE, 'topics-extra.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).topics.map((t) => ({ core: false, verify: false, sensitive: false, source: 'beyond', ...t })) : [];
}

// Topics the factory leaves to people: sensitive ones need an owner sign-off
// (brief section 16), and exam-format facts change every year (TEST-*).
export function skipReason(t) {
  if (t.sensitive) return 'sensitive: needs a second fact-check and owner sign-off (brief §16)';
  if (t.id.startsWith('TEST-')) return 'exam format: verify_before_use facts change every year';
  return null;
}

export const domainOf = (id) => id.split('-')[0];
