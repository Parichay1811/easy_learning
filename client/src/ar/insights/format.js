/** Small display helpers shared by the findings views. Pure. */

/** 'YYYY-MM-DD' → "23 Nov" in the reader's language (UTC, like the periods). */
export function shortDate(iso, lang = 'en') {
  if (!iso) return ''
  try {
    return new Date(`${iso}T12:00:00Z`).toLocaleDateString(lang, { day: 'numeric', month: 'short', timeZone: 'UTC' })
  } catch {
    return iso
  }
}

/** The arrow that goes with a trend direction (the words always go with it). */
export const arrowOf = (dir) => (dir === 'up' ? 'up' : dir === 'down' ? 'down' : dir === 'flat' ? 'flat' : 'none')

/** The periods a grown-up can pick. */
export const PERIOD_CHOICES = [14, 28, 90]

/** "27 Oct to 23 Nov, compared with the 28 days before. 14 rounds on 9 days." */
export function periodLine(result, t, lang) {
  const totals = result.totals.current
  return t('ar.insights.glance.period', {
    defaultValue: '{{from}} to {{to}}, compared with the {{days}} days before. {{rounds}} rounds on {{played}} days.',
    from: shortDate(result.period.from, lang),
    to: shortDate(result.period.to, lang),
    days: result.period.days,
    rounds: totals.played,
    played: totals.days,
  })
}
