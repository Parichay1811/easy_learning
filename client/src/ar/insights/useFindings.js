/**
 * Runs the findings engine on a findings input (from a server route or from
 * the device) with the game catalogue, plus the name lookups its sentences need.
 *
 *   const { result, names } = useFindings(arInsights?.findings)
 */
import { useMemo } from 'react'
import { buildFindings } from './findings.js'
import { namesFor, rowsOf } from './names'
import { CATALOG } from './catalog'

export function useFindings(input) {
  const result = useMemo(() => (input?.rows ? buildFindings(input, { catalog: CATALOG }) : null), [input])
  // The lookups translate at call time, so they follow a language switch on their own.
  const names = useMemo(() => namesFor({ rows: rowsOf(input), catalog: CATALOG }), [input])
  return { result, names }
}
