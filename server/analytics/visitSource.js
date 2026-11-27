// Names where a website visit came from (routes/visits.js), from the referring
// site's host name or the campaign tags (utm_*) in the address the visitor
// arrived on. Only these names are stored, never the full referring address.
//
// source:  google, chatgpt, youtube… a campaign's utm_source, a host name for
//          any other site, "direct" (no referrer) or "internal" (a full page
//          load from Learnigo's own pages).
// channel: search, ai, video, social, email, referral, direct, internal, or a
//          campaign's utm_medium.

// Most specific first: gemini.google.com is an AI assistant, google.ie a search engine.
const KNOWN = [
  [/^(chatgpt\.com|chat\.openai\.com)$/, 'chatgpt', 'ai'],
  [/^perplexity\.ai$/, 'perplexity', 'ai'],
  [/^gemini\.google\.com$/, 'gemini', 'ai'],
  [/^copilot\.microsoft\.com$/, 'copilot', 'ai'],
  [/^claude\.ai$/, 'claude', 'ai'],
  [/^chat\.deepseek\.com$/, 'deepseek', 'ai'],
  [/^(meta\.ai|you\.com|phind\.com)$/, (h) => h.split('.')[0], 'ai'],
  [/^mail\.google\.com$|^com\.google\.android\.gm$/, 'gmail', 'email'],
  [/^outlook\.(live|office|office365)\.com$/, 'outlook', 'email'],
  [/^(.+\.)?google\.[a-z.]+$|^com\.google\.android\.googlequicksearchbox$/, 'google', 'search'],
  [/^(.+\.)?bing\.com$/, 'bing', 'search'],
  [/^(.+\.)?duckduckgo\.com$/, 'duckduckgo', 'search'],
  [/^(.+\.)?yahoo\.[a-z.]+$/, 'yahoo', 'search'],
  [/^(.+\.)?yandex\.[a-z.]+$|^ya\.ru$/, 'yandex', 'search'],
  [/^(.+\.)?baidu\.com$/, 'baidu', 'search'],
  [/^(.+\.)?naver\.com$/, 'naver', 'search'],
  [/^(.+\.)?ecosia\.org$/, 'ecosia', 'search'],
  [/^(.+\.)?seznam\.cz$/, 'seznam', 'search'],
  [/^(.+\.)?qwant\.com$/, 'qwant', 'search'],
  [/^search\.brave\.com$/, 'brave', 'search'],
  [/^(.+\.)?startpage\.com$/, 'startpage', 'search'],
  [/^(.+\.)?(youtube\.com|youtu\.be)$/, 'youtube', 'video'],
  [/^(.+\.)?(linkedin\.com|lnkd\.in)$/, 'linkedin', 'social'],
  [/^(.+\.)?(facebook\.com|fb\.com|fb\.me)$/, 'facebook', 'social'],
  [/^(.+\.)?instagram\.com$/, 'instagram', 'social'],
  [/^(t\.co|(.+\.)?x\.com|(.+\.)?twitter\.com)$/, 'x', 'social'],
  [/^(.+\.)?reddit\.com$/, 'reddit', 'social'],
  [/^(.+\.)?pinterest\.[a-z.]+$|^pin\.it$/, 'pinterest', 'social'],
  [/^(.+\.)?tiktok\.com$/, 'tiktok', 'social'],
  [/^(.+\.)?whatsapp\.com$|^wa\.me$/, 'whatsapp', 'social'],
]

/** Lower case, safe characters only, at most `max` long. */
function tag(value, max = 40) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max)
}

function classify({ r, s, m } = {}) {
  const utmSource = tag(s)
  if (utmSource) return { source: utmSource, channel: tag(m, 30) || 'campaign' }
  if (r === '(internal)') return { source: 'internal', channel: 'internal' }
  const host = tag(r, 80).replace(/^(www|m|l|lm|mobile)\./, '')
  if (!host || !host.includes('.')) return { source: 'direct', channel: 'direct' }
  for (const [re, name, channel] of KNOWN) {
    if (re.test(host)) return { source: typeof name === 'function' ? name(host) : name, channel }
  }
  return { source: host.slice(0, 60), channel: 'referral' }
}

module.exports = { classify, tag }
