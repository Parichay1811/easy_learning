/**
 * Spoken instructions.
 *
 * Every AR game gives its instruction through an audio channel, a visual
 * channel, or both — `settings.instruction` decides, because "listen and find"
 * is a real skill for one child and an insurmountable barrier for another.
 *
 * Speaks through the site's narrator (the natural server voice, falling back to
 * the platform speech synthesiser offline), and follows the app's i18n
 * language. `speechRate` defaults below 1 — comprehension for this population
 * matters far more than pace.
 */
import { getSettings } from './settings'
import { narrate, stopNarration, isNarrating } from '../../utils/narrator'

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null

let unlocked = false

export function ttsSupported() {
  return Boolean(synth)
}

/**
 * iOS and some Android browsers only allow speech after a user gesture. The
 * Play button calls this; a zero-length utterance is enough to open the gate.
 */
export function unlockSpeech() {
  if (!synth || unlocked) return unlocked
  try {
    const u = new SpeechSynthesisUtterance(' ')
    u.volume = 0
    synth.speak(u)
    unlocked = true
  } catch {
    /* ignore */
  }
  return unlocked
}

/**
 * Speaks `text` and resolves when it finishes (or immediately when speech is
 * off, so callers can always `await` it without branching). It speaks through
 * the site's narrator (utils/narrator.js): the natural server voice, or the
 * browser's best voice for the language.
 *
 * @param {string} text
 * @param {{lang?: string, rate?: number, pitch?: number, interrupt?: boolean}} opts
 */
export function speak(text, opts = {}) {
  const s = getSettings()
  if (!s.speech || !text || s.instruction === 'visual') return Promise.resolve(false)
  const { lang = document.documentElement.lang || 'en' } = opts
  return narrate(String(text), {
    lang,
    rate: opts.rate ?? s.speechRate ?? 0.85,
    pitch: opts.pitch ?? 1.05,
    volume: Math.min(1, (s.volume ?? 0.7) + 0.25),
  })
}

/** Says a single letter as its *sound* rather than its name where possible. */
export function speakPhoneme(letter, opts = {}) {
  // Browser voices read "b" as "bee"; a short vowel-free syllable is closer to
  // the /b/ phoneme a phonics task needs.
  const map = {
    a: 'ah', b: 'buh', c: 'kuh', d: 'duh', e: 'eh', f: 'ff', g: 'guh',
    h: 'hh', i: 'ih', j: 'juh', k: 'kuh', l: 'll', m: 'mm', n: 'nn',
    o: 'oh', p: 'puh', q: 'kwuh', r: 'rr', s: 'sss', t: 'tuh', u: 'uh',
    v: 'vv', w: 'wuh', x: 'ks', y: 'yuh', z: 'zz',
  }
  const key = String(letter || '').toLowerCase()
  return speak(map[key] || key, { rate: 0.7, ...opts })
}

export function cancelSpeech() {
  stopNarration()
}

export function isSpeaking() {
  return isNarrating()
}
