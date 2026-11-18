// Friendly relative times for feeds and conversations ("just now", "5 min ago", "Tue 14:05").
export function relTime(iso, lang = 'en') {
  if (!iso) return '';
  const d = new Date(iso);
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto', style: 'short' });
  if (s < 45) return rtf.format(0, 'second');
  if (s < 3600) return rtf.format(-Math.round(s / 60), 'minute');
  if (s < 86400) return rtf.format(-Math.round(s / 3600), 'hour');
  if (s < 7 * 86400) return new Intl.DateTimeFormat(lang, { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(d);
  return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: s > 300 * 86400 ? 'numeric' : undefined }).format(d);
}

export const fullTime = (iso, lang = 'en') => (iso ? new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) : '');
