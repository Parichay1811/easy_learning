import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from './helpers'

/**
 * A number that counts up from where it was to `target` (ease-out), like a
 * game score. Shows the final value at once for people who want less motion.
 */
export function useCountUp(target, { duration = 900, delay = 0 } = {}) {
  const goal = Number.isFinite(Number(target)) ? Number(target) : 0
  const [shown, setShown] = useState(0)
  const from = useRef(0)

  useEffect(() => {
    const reduced = prefersReducedMotion()
    let raf = 0
    let start = null
    const begin = from.current
    const step = (now) => {
      if (start == null) start = now + (reduced ? 0 : delay)
      const p = reduced ? 1 : Math.min(1, Math.max(0, (now - start) / duration))
      const eased = 1 - (1 - p) ** 3
      setShown(Math.round(begin + (goal - begin) * eased))
      if (p < 1) raf = requestAnimationFrame(step)
      else from.current = goal
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [goal, duration, delay])

  return shown
}

/** True while a CSS media query matches. */
export function useMedia(query) {
  const [match, setMatch] = useState(() => {
    try { return window.matchMedia(query).matches } catch { return false }
  })
  useEffect(() => {
    let mql
    try { mql = window.matchMedia(query) } catch { return undefined }
    const on = () => setMatch(mql.matches)
    on()
    mql.addEventListener('change', on)
    return () => mql.removeEventListener('change', on)
  }, [query])
  return match
}

/**
 * How far the site's fixed navbar's bottom edge is from the 80px the page is
 * padded by: positive when it wraps taller, negative when it is slimmer (short
 * landscape phones). The dashboard shifts by that much so nothing hides under
 * the bar and no space is wasted below it.
 */
export function useNavOverlap(enabled = true) {
  const [extra, setExtra] = useState(0)
  useLayoutEffect(() => {
    if (!enabled) return undefined
    const nav = [...document.querySelectorAll('nav')].find((n) => getComputedStyle(n).position === 'fixed')
    if (!nav) return undefined
    const measure = () => setExtra(Math.max(-80, Math.round(nav.getBoundingClientRect().bottom) - 80))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(nav)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [enabled])
  return extra
}
