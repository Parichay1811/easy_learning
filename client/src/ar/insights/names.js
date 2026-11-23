/**
 * Translated names for the findings' sentences: a skill area (domain) and a
 * game. Light on purpose (no game catalogue import), so the parent and teacher
 * dashboards can use it: a game's title falls back to the one the round itself
 * carried, then to the catalogue's when it has been loaded.
 */
import { DOMAIN_LABELS } from '../catalog/groups'
import { tDomain, tGame } from '../core/arText'

export function namesFor({ rows = [], catalog = [] } = {}) {
  const titles = new Map()
  for (const g of catalog) if (g?.id && g.title) titles.set(g.id, g.title)
  for (const r of rows) if (r?.gameId && r.title && !titles.has(r.gameId)) titles.set(r.gameId, r.title)
  return {
    skillName: (id) => tDomain(id, DOMAIN_LABELS[id] || id),
    gameName: (id) => tGame(id, 'title', titles.get(id) || id),
  }
}

/** All the rows of a findings input, both periods. */
export const rowsOf = (input) => [...(input?.rows?.previous || []), ...(input?.rows?.current || [])]
