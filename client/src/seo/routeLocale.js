/**
 * The language prefix of the current URL (/es/faq → "es") and the router
 * basename that follows from it.
 *
 * Every language except English has its own URLs, so search engines can index
 * and show each translation (see registry.js). The app's routes stay the same:
 * the router runs under the prefix as its basename, so <Link to="/faq"> on
 * /es/... goes to /es/faq.
 *
 * Choosing another language in the switcher moves the URL to that language's
 * prefix when the page has its own URL in it (public pages), or when a prefix
 * is already in use (it must change with the language). App pages without a
 * prefix (dashboards, games) keep their URL. App.jsx remounts the router under
 * the new basename; nothing reloads.
 */
import { localizedPath, pageFor, splitLocale, DEFAULT_LANG } from './registry'

const initial = typeof window === 'undefined' ? { lang: null } : splitLocale(window.location.pathname)

/** "es" on /es/..., null on an unprefixed (English or app) URL. */
export let routeLang = initial.lang

export function basenameFor(lang) {
  return lang ? `/${lang}` : undefined
}

const listeners = new Set()

/** Calls fn(newRouteLang) when the URL's language prefix changes. */
export function onRouteLangChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/**
 * Moves the current URL to `lang` when that is right for this page (see above).
 * Call after i18n.changeLanguage(lang).
 */
export function followLanguage(lang) {
  if (typeof window === 'undefined') return
  const { lang: current, path } = splitLocale(window.location.pathname)
  const page = pageFor(path)
  if (!current && !page) return
  const next = lang === DEFAULT_LANG || !page?.langs.includes(lang) ? null : lang
  if (next === current) return
  const { search, hash } = window.location
  window.history.replaceState(window.history.state, '', localizedPath(path, next || DEFAULT_LANG) + search + hash)
  routeLang = next
  listeners.forEach((fn) => fn(next))
}
