// Data-minimisation guardrails (FND-073). Small, pure helpers so every
// feature applies the same rule.

// "Aanya Rao" -> "Aanya R."; "aanya" -> "Aanya"; "  " -> "Learner"
function firstNameInitial(name, fallback = 'Learner') {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return fallback
  const cap = (s) => s.charAt(0).toLocaleUpperCase() + s.slice(1)
  const first = cap(parts[0])
  if (parts.length === 1) return first
  return `${first} ${parts[parts.length - 1].charAt(0).toLocaleUpperCase()}.`
}

// Leaderboard rows: keep only the display name, the score and rank. Drops
// email, ids and anything else. Two people with the same short name stay apart by rank.
function leaderboardRows(rows, { scoreKey = 'score', nameKey = 'name', limit = 10, meKey = null } = {}) {
  return [...rows]
    .filter((r) => r && typeof r[scoreKey] === 'number')
    .sort((a, b) => b[scoreKey] - a[scoreKey])
    .slice(0, limit)
    .map((r, i) => ({ rank: i + 1, name: firstNameInitial(r[nameKey]), score: r[scoreKey], ...(meKey && r[meKey] ? { me: true } : {}) }))
}

const BENCHMARK_MIN = 20

// A comparison figure ("learners like yours average 74 %") is only shown when
// the bucket has at least 20 learners, so nobody can be singled out.
// values: one number per learner. -> { n, mean, median, p25, p75 } or null
function benchmark(values, { min = BENCHMARK_MIN } = {}) {
  const xs = (values || []).filter((v) => typeof v === 'number' && Number.isFinite(v)).sort((a, b) => a - b)
  if (xs.length < Math.max(min, BENCHMARK_MIN)) return null
  const q = (p) => { const i = (xs.length - 1) * p; const lo = Math.floor(i), hi = Math.ceil(i); return Math.round((xs[lo] + (xs[hi] - xs[lo]) * (i - lo)) * 10) / 10 }
  return { n: xs.length, mean: Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10, median: q(0.5), p25: q(0.25), p75: q(0.75) }
}

// Several buckets at once ({ 'Year 4': [..], 'Year 5': [..] }): small ones become null.
const benchmarks = (buckets, opts) => Object.fromEntries(Object.entries(buckets || {}).map(([k, v]) => [k, benchmark(v, opts)]))

module.exports = { firstNameInitial, leaderboardRows, benchmark, benchmarks, BENCHMARK_MIN }
