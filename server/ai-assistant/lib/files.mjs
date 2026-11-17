// Files written whole or not at all: the new contents go to a temporary file
// beside the old one, which is then renamed over it (one step on every file
// system), so a crash or a Ctrl-C mid-write never leaves half a file that
// stops the server starting or wipes the student's corrections.
import fs from 'node:fs';

let n = 0;
const temp = (file) => `${file}.${process.pid}.${n++}.tmp`;

export function writeWholeSync(file, data) {
  const t = temp(file);
  try {
    fs.writeFileSync(t, data);
    fs.renameSync(t, file);
  } catch (e) {
    fs.rmSync(t, { force: true });
    throw e;
  }
}

export async function writeWhole(file, data) {
  const t = temp(file);
  try {
    await fs.promises.writeFile(t, data);
    await fs.promises.rename(t, file);
  } catch (e) {
    await fs.promises.rm(t, { force: true });
    throw e;
  }
}

// A JSON file's contents, or the fallback when it is missing or unreadable
// (a broken file is set aside as .broken, not silently lost).
export function readJson(file, fallback) {
  if (!file || !fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    try { fs.renameSync(file, `${file}.broken`); } catch { /* read-only: leave it */ }
    return fallback;
  }
}

// A cache of { key: { at, value } } without what has expired (nothing is
// kept longer than a month) and with at most `max` entries, newest kept.
const MONTH = 31 * 24 * 3600 * 1000;
export function prune(cache, max = 20000) {
  const now = Date.now();
  for (const k of Object.keys(cache)) if (!(now - (cache[k]?.at ?? 0) < MONTH)) delete cache[k];
  const keys = Object.keys(cache);
  if (keys.length > max) keys.sort((a, b) => cache[a].at - cache[b].at).slice(0, keys.length - max).forEach((k) => delete cache[k]);
  return cache;
}
