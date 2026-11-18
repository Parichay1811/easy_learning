// Number, duration, delta and date formatting for every dashboard (DSN-011).
//
// Rules: locale-aware through Intl using i18n.language, and NEVER print NaN,
// Infinity or a fake 0 % for missing data: those return the em dash "—".
// Percentages are FRACTIONS (0.86 -> "86%") everywhere in the kit.
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import { parseISO } from './dates';

export const NO_DATA = '—';
const MINUS = '−';

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const lang = (o) => (o && o.lang) || i18n.language || 'en';
const safeLang = (l) => {
  try {
    return Intl.NumberFormat.supportedLocalesOf([l]).length ? l : 'en';
  } catch {
    return 'en';
  }
};

// Short hour abbreviation per language. Minutes come from Intl ("min", "Min.", "分").
const HOUR_UNIT = {
  en: 'h', es: 'h', fr: 'h', pt: 'h', it: 'h', de: 'Std.', nl: 'u', ru: 'ч',
  tr: 'sa', zh: '小时', ja: '時間', ko: '시간', id: 'j', vi: 'giờ',
};
const baseLang = (l) => String(l).split('-')[0];

function minuteLabel(l) {
  try {
    const parts = new Intl.NumberFormat(l, { style: 'unit', unit: 'minute', unitDisplay: 'short' }).formatToParts(2);
    return parts.find((p) => p.type === 'unit')?.value || 'min';
  } catch {
    return 'min';
  }
}

/** 130 -> "2 h 10 min", 45 -> "45 min", 120 -> "2 h", null -> "—" */
export function fmtDuration(minutes, opts) {
  if (!isNum(minutes) || minutes < 0) return NO_DATA;
  const l = safeLang(lang(opts));
  const nf = new Intl.NumberFormat(l, { maximumFractionDigits: 0 });
  const total = Math.round(minutes);
  const hLabel = HOUR_UNIT[baseLang(l)] || 'h';
  const mLabel = minuteLabel(l);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${nf.format(m)} ${mLabel}`;
  if (m === 0 || h >= 100) return `${nf.format(h)} ${hLabel}`;
  return `${nf.format(h)} ${hLabel} ${nf.format(m)} ${mLabel}`;
}

/** fmtNumber(12840) -> "12,840"; { compact: true } -> "12.8K" */
export function fmtNumber(n, opts = {}) {
  if (!isNum(n)) return NO_DATA;
  const l = safeLang(lang(opts));
  return new Intl.NumberFormat(l, {
    notation: opts.compact ? 'compact' : 'standard',
    maximumFractionDigits: opts.digits ?? (opts.compact ? 1 : 2),
    minimumFractionDigits: opts.minDigits ?? 0,
  }).format(n);
}

/** fmtPercent(0.857) -> "86%". Input is a fraction. null/NaN -> "—". */
export function fmtPercent(fraction, opts = {}) {
  if (!isNum(fraction)) return NO_DATA;
  const l = safeLang(lang(opts));
  return new Intl.NumberFormat(l, {
    style: 'percent',
    maximumFractionDigits: opts.digits ?? 0,
  }).format(fraction);
}

function signed(text, sign) {
  return sign === 0 ? `±${text}` : `${sign > 0 ? '+' : MINUS}${text}`;
}

/**
 * Compare a value with the previous period.
 *
 *   fmtDelta(130, 105, { mode: 'duration' }) -> { text: '+25 min', dir: 'up', tone: 'good', srText: 'Up 25 min compared with the previous period' }
 *   fmtDelta(0.82, 0.76, { mode: 'points' }) -> '+6 pts'
 *   fmtDelta(1200, 1000)                      -> '+20%'  (mode 'percent', the default)
 *
 * opts: { mode: 'percent'|'points'|'duration'|'number', vs: 'last week',
 *         lowerIsBetter: false, lang }
 * `dir` is the arithmetic direction; `tone` says whether it is good news
 * (good) or worth a look (attention), flipped by lowerIsBetter. Missing data
 * returns { text: '—', dir: 'flat', tone: 'neutral' }.
 */
export function fmtDelta(cur, prev, opts = {}) {
  const mode = opts.mode || 'percent';
  const vs = opts.vs || i18n.t('dash.delta.previous', { defaultValue: 'the previous period' });
  const none = {
    text: NO_DATA,
    dir: 'flat',
    tone: 'neutral',
    value: null,
    srText: i18n.t('dash.delta.none', { defaultValue: 'No comparison available' }),
  };
  if (!isNum(cur) || !isNum(prev)) return none;
  const l = safeLang(lang(opts));
  let diff = cur - prev;
  let body;
  if (mode === 'percent') {
    if (prev === 0) return none; // a percentage of nothing is meaningless
    diff = ((cur - prev) / Math.abs(prev)) * 100;
    body = `${new Intl.NumberFormat(l, { maximumFractionDigits: 0 }).format(Math.abs(diff))}\u202f%`;
  } else if (mode === 'points') {
    diff = (cur - prev) * 100;
    body = `${new Intl.NumberFormat(l, { maximumFractionDigits: 0 }).format(Math.abs(diff))} ${i18n.t('dash.delta.pts', { defaultValue: 'pts' })}`;
  } else if (mode === 'duration') {
    body = fmtDuration(Math.abs(diff), { lang: l });
  } else {
    body = fmtNumber(Math.abs(diff), { lang: l });
  }
  const rounded = Math.round(Math.abs(diff) * (mode === 'duration' || mode === 'number' ? 100 : 1)) === 0;
  const dir = rounded ? 'flat' : diff > 0 ? 'up' : 'down';
  const sign = dir === 'flat' ? 0 : diff > 0 ? 1 : -1;
  const text = signed(body, sign);
  const good = dir === 'flat' ? null : (dir === 'up') !== !!opts.lowerIsBetter;
  const tone = dir === 'flat' ? 'neutral' : good ? 'good' : 'attention';
  const srText =
    dir === 'flat'
      ? i18n.t('dash.delta.srFlat', { defaultValue: 'No change compared with {{vs}}', vs })
      : i18n.t(dir === 'up' ? 'dash.delta.srUp' : 'dash.delta.srDown', {
          defaultValue: dir === 'up' ? 'Up {{value}} compared with {{vs}}' : 'Down {{value}} compared with {{vs}}',
          value: body,
          vs,
        });
  return { text, dir, tone, value: diff, srText };
}

/**
 * fmtDate('2026-11-18')                 -> "18 Nov 2026"
 * fmtDate({ from, to })                 -> "12 – 18 Nov 2026"
 * fmtDate(date, { style: 'long' })      -> "Wednesday, 18 November 2026"
 * fmtDate(date, { style: 'day' })       -> "18 Nov"  |  'month' -> "November 2026"
 */
export function fmtDate(input, opts = {}) {
  if (!input) return NO_DATA;
  const l = safeLang(lang(opts));
  const styles = {
    short: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    day: { day: 'numeric', month: 'short' },
    month: { month: 'long', year: 'numeric' },
    weekday: { weekday: 'short', day: 'numeric', month: 'short' },
  };
  const o = styles[opts.style || 'short'];
  const toDate = (v) => parseISO(v);
  const isRange = typeof input === 'object' && !(input instanceof Date) && ('from' in input || 'to' in input);
  const f = new Intl.DateTimeFormat(l, o);
  if (!isRange) {
    const d = toDate(input);
    return d ? f.format(d) : NO_DATA;
  }
  const a = toDate(input.from);
  const b = toDate(input.to || input.from);
  if (!a || !b) return NO_DATA;
  if (a.getTime() === b.getTime()) return f.format(a);
  return f.formatRange(a, b);
}

/** Weekday names, Monday first, localised. */
export function weekdayNames(opts = {}) {
  const l = safeLang(lang(opts));
  const f = new Intl.DateTimeFormat(l, { weekday: opts.style || 'short' });
  return Array.from({ length: 7 }, (_, i) => f.format(new Date(2024, 0, 1 + i))); // 1 Jan 2024 is a Monday
}

export function monthNames(opts = {}) {
  const l = safeLang(lang(opts));
  const f = new Intl.DateTimeFormat(l, { month: opts.style || 'short' });
  return Array.from({ length: 12 }, (_, i) => f.format(new Date(2024, i, 1)));
}

/** Hook version: returns the same functions, re-rendering on language change. */
export function useFormat() {
  const { i18n: inst } = useTranslation();
  const language = inst.language;
  return useMemo(
    () => ({
      lang: language,
      fmtDuration: (m, o) => fmtDuration(m, { lang: language, ...o }),
      fmtNumber: (n, o) => fmtNumber(n, { lang: language, ...o }),
      fmtPercent: (n, o) => fmtPercent(n, { lang: language, ...o }),
      fmtDelta: (c, p, o) => fmtDelta(c, p, { lang: language, ...o }),
      fmtDate: (d, o) => fmtDate(d, { lang: language, ...o }),
      weekdayNames: (o) => weekdayNames({ lang: language, ...o }),
      monthNames: (o) => monthNames({ lang: language, ...o }),
    }),
    [language],
  );
}
