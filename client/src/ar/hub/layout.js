/**
 * Layout helpers for the Camera Games hub.
 *
 * useBalancedColumns — how many game cards go in a row. As many as fit at a
 * readable card width (measured in rem, so the learner's text size setting
 * gives fewer, wider cards), then nudged down one when that leaves a short
 * last row that would look broken: 7 games become 4 + 3 rather than 5 + 2,
 * 8 become 4 + 4 rather than 5 + 3. Whatever is left over is centred by the
 * CSS, so a last row of two reads as deliberate, not as missing cards.
 *
 * useMedia — a media query as a boolean that follows resizes.
 */
import { useCallback, useLayoutEffect, useState, useSyncExternalStore } from 'react'
import { onPrefsChange } from '../../utils/learnerPrefs'

export function balanceColumns(count, maxCols) {
  const max = Math.max(1, maxCols)
  if (count <= max) return Math.max(1, count)
  const empty = (c) => Math.ceil(count / c) * c - count
  const fewer = max - 1
  if (fewer >= 3 && empty(fewer) < empty(max) && (empty(fewer) === 0 || empty(max) > max / 2)) return fewer
  return max
}

export function useBalancedColumns(ref, count, { minRem = 16.5, maxCols = 5 } = {}) {
  const [cols, setCols] = useState(1)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const measure = () => {
      const w = el.clientWidth
      if (!w) return
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const gap = parseFloat(getComputedStyle(el).getPropertyValue('--gap')) || 16
      const fit = Math.floor((w + gap) / (minRem * rem + gap))
      const next = balanceColumns(count, Math.min(maxCols, Math.max(1, fit)))
      setCols((c) => (c === next ? c : next))
    }
    measure()
    // The text size setting changes the rem, not the box: listen for it too.
    const offPrefs = onPrefsChange(() => requestAnimationFrame(measure))
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => {
        offPrefs()
        window.removeEventListener('resize', measure)
      }
    }
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => {
      offPrefs()
      ro.disconnect()
    }
  }, [ref, count, minRem, maxCols])

  return cols
}

export function useMedia(query) {
  const subscribe = useCallback(
    (onChange) => {
      let mql = null
      try {
        mql = window.matchMedia(query)
        mql.addEventListener('change', onChange)
      } catch {
        mql = null
      }
      return () => mql?.removeEventListener('change', onChange)
    },
    [query]
  )
  const snapshot = () => {
    try {
      return window.matchMedia(query).matches
    } catch {
      return false
    }
  }
  return useSyncExternalStore(subscribe, snapshot, () => false)
}
