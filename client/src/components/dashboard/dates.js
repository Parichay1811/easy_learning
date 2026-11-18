// Small local-time date helpers. All ISO strings are LOCAL calendar dates
// (YYYY-MM-DD), never UTC, so "today" is the user's today. Dates are built at
// local midnight and moved with setDate so daylight-saving shifts never skip a day.

const pad = (n) => String(n).padStart(2, '0');

export function toISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISO(s) {
  if (s instanceof Date) return new Date(s.getFullYear(), s.getMonth(), s.getDate());
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export const isISODate = (s) => parseISO(s) !== null && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function today() {
  return parseISO(new Date());
}

export function addDays(d, n) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  r.setDate(r.getDate() + n);
  return r;
}

export function addMonths(d, n) {
  const r = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
  r.setDate(Math.min(d.getDate(), last));
  return r;
}

/** Monday of the week containing d (ISO weeks). */
export function startOfWeek(d) {
  const dow = (d.getDay() + 6) % 7; // Mon = 0
  return addDays(d, -dow);
}

export const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
export const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
export const startOfYear = (d) => new Date(d.getFullYear(), 0, 1);
export const endOfYear = (d) => new Date(d.getFullYear(), 11, 31);

/** Whole days from a to b (b - a). */
export function daysBetween(a, b) {
  const ms = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  return Math.round(ms / 86400000);
}

/** Monday = 0 … Sunday = 6 */
export const weekdayIndex = (d) => (d.getDay() + 6) % 7;
