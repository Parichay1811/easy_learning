// Small shared helpers for the student dashboard tabs.
import { FaHeadphones, FaBookOpen, FaPen, FaMicrophone, FaCamera, FaPuzzlePiece } from 'react-icons/fa'
import { tGame } from '../../ar/core/arText'

export const TAB_KEYS = ['overview', 'progress', 'achievements', 'history', 'people']

export const SUBJECT_KEYS = ['english', 'maths', 'science']
export const MODULE_KEYS = ['listen', 'read', 'write', 'speak']

// Fixed identities, the same as the dashboard kit (components/dashboard/constants.js).
export const SUBJECT_META = {
  english: { color: '#8b5cf6', ink: 'var(--d-english-ink)', world: 'English Kingdom' },
  maths: { color: '#339af0', ink: 'var(--d-maths-ink)', world: 'Maths Galaxy' },
  science: { color: '#40c057', ink: 'var(--d-science-ink)', world: 'Science Lab' },
}
export const MODULE_META = {
  listen: { color: '#4dc9ff', ink: 'var(--d-listen-ink)', Icon: FaHeadphones, label: 'Listen' },
  read: { color: '#ff9d3b', ink: 'var(--d-read-ink)', Icon: FaBookOpen, label: 'Read' },
  write: { color: '#ff6b9d', ink: 'var(--d-write-ink)', Icon: FaPen, label: 'Write' },
  speak: { color: '#6bcf7f', ink: 'var(--d-speak-ink)', Icon: FaMicrophone, label: 'Speak' },
}

// A child plays about 15 minutes a day unless a grown-up set their own goal.
export const DEFAULT_DAILY_GOAL = 15

/** 75 -> "1h 15m", 0 -> "0m" */
export function fmtMinutes(mins) {
  const n = Math.round(Number(mins) || 0)
  if (!n) return '0m'
  const h = Math.floor(n / 60)
  const m = n % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function fmtMs(v) {
  if (v == null) return '—'
  return v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${Math.round(v)}ms`
}

export function fmtDay(date, lang) {
  try { return new Date(date).toLocaleDateString(lang || undefined, { day: 'numeric', month: 'short' }) } catch { return '' }
}

export function fmtDayTime(date, lang) {
  try {
    return new Date(date).toLocaleString(lang || undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

export function fmtNumber(n, lang) {
  try { return new Intl.NumberFormat(lang || undefined).format(Math.round(Number(n) || 0)) } catch { return String(n) }
}

/** Local YYYY-MM-DD of a date. */
export function localDateStr(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Translated label for a subject / module key (falls back to a tidy English word). */
export function subjectName(t, key) {
  if (!key || key === 'general') return t('studentDash.general', 'Mixed')
  return t(`subjectPage.${key}.label`, { defaultValue: key.charAt(0).toUpperCase() + key.slice(1) })
}
export function moduleName(t, key) {
  if (!key) return ''
  if (key.startsWith('ar:')) return tGame(key.slice(3), 'title', t('studentDash.cameraGame', 'Camera game'))
  return t(`subjectPage.modules.${key}.label`, { defaultValue: MODULE_META[key]?.label || key.charAt(0).toUpperCase() + key.slice(1) })
}
export function moduleIcon(key) {
  if (key?.startsWith('ar:')) return FaCamera
  return MODULE_META[key]?.Icon || FaPuzzlePiece
}
export function moduleColor(key) {
  if (key?.startsWith('ar:')) return '#20c997'
  return MODULE_META[key]?.color || '#8b5cf6'
}

export function worldName(t, key) {
  return t(`cards.${key}.title`, { defaultValue: SUBJECT_META[key]?.world || key })
}

/** Where "Continue playing" goes: the last round's game, else the home page. */
export function playTarget(rounds) {
  for (const r of rounds || []) {
    if (r?.module?.startsWith('ar:')) return { to: `/games/ar/${r.module.slice(3)}`, module: r.module, subject: null }
    if (MODULE_KEYS.includes(r?.module) && SUBJECT_KEYS.includes(r?.subject)) {
      return { to: `/module/${r.module}/${r.subject}`, module: r.module, subject: r.subject }
    }
  }
  return null
}

/** Earned in the last `days` days. */
export function isRecent(dateish, now, days = 3) {
  if (!dateish) return false
  const t = new Date(dateish).getTime()
  return Number.isFinite(t) && now - t < days * 86400000
}

const SEEN_KEY = 'studentDash_seenBadges'
export function readSeenBadges(who) {
  try { return new Set(JSON.parse(localStorage.getItem(`${SEEN_KEY}_${who}`) || '[]')) } catch { return new Set() }
}
export function writeSeenBadges(who, ids) {
  try { localStorage.setItem(`${SEEN_KEY}_${who}`, JSON.stringify([...ids].slice(-50))) } catch { /* storage off */ }
}

export function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}
