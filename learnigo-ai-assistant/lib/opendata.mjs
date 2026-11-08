// Exact answers from open data, for the questions an encyclopedia paragraph
// answers badly: a number, a date, a formula, a word's meaning, a picture,
// live data. Every source is free, needs no key and allows commercial use:
//
//   Wikidata        facts and numbers about anything      CC0
//   World Bank      country statistics over time          CC BY 4.0
//   PubChem (NIH)   chemical formulas and structures      US government, public
//   Wiktionary      what a word means                     CC BY-SA 4.0
//   NASA Images     space pictures                        not copyrighted (NASA)
//   Art Institute   public-domain artworks                CC0
//   USGS            earthquakes this week                 public domain
//   MET Norway      weather now and today                 CC BY 4.0
//   Commons         pictures of anything (Wikidata's)     free licences, credited
//
// answer(question) picks the source from the question's shape and returns
// { title, say: [sentences], figures: [board ops], more: [ops for later
// steps], source: { title, url, site } }, or null when it is not that kind
// of question (Wikipedia and the lessons answer the rest). Cached on disk.
import fs from 'node:fs';
import path from 'node:path';
import { readJson, writeWhole, prune } from './files.mjs';
import { findPlace } from '../shared/places.js';
import { element } from '../shared/elements.js';

const UA = 'LearnigoLiveTeacher/0.3 (free education website; https://www.learnigo.eu)';
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

// ---- Formatting numbers and dates for speech and the board ----
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
const round = (n, d = 3) => +n.toPrecision(d);
// 1438069596 -> "1.44 billion"; 8848.86 -> "8,848.86"; 5.97e24 -> "5.97 × 10²⁴".
export function words(n) {
  const a = Math.abs(n);
  if (a >= 1e15) { const e = Math.floor(Math.log10(a)); return `${round(n / 10 ** e)} × 10${String(e).replace(/./g, (c) => SUP[c])}`; }
  if (a >= 1e12) return `${round(n / 1e12)} trillion`;
  if (a >= 1e9) return `${round(n / 1e9)} billion`;
  if (a >= 1e6) return `${round(n / 1e6)} million`;
  return n.toLocaleString('en-US', { maximumFractionDigits: a < 10 ? 2 : a < 1000 ? 1 : 0 });
}
// The same, said aloud: "5.97 times 10 to the power 24".
const spoken = (s) => s.replace(/ × 10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/, (m, e) => ` times 10 to the power ${[...e].map((c) => Object.keys(SUP).find((k) => SUP[k] === c)).join('')}`);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// Wikidata time: "+1879-03-14T00:00:00Z" at a precision (11 day, 10 month, 9 year).
function date(v) {
  const m = String(v?.time || '').match(/^([+-])(\d+)-(\d\d)-(\d\d)/);
  if (!m) return null;
  const n = Number(m[2]);
  const bc = m[1] === '-' ? ' BC' : '';
  const year = bc ? -n : n;
  const p = v.precision ?? 11;
  if (p >= 11 && m[4] !== '00') return { text: `${Number(m[4])} ${MONTHS[Number(m[3]) - 1]} ${n}${bc}`, year, day: true };
  if (p === 10 && m[3] !== '00') return { text: `${MONTHS[Number(m[3]) - 1]} ${n}${bc}`, year };
  if (p === 8) return { text: `the ${Math.floor(n / 10) * 10}s${bc}`, year };
  if (p <= 7) { const c = Math.ceil(n / 100); return { text: `the ${c}${c % 10 === 1 && c !== 11 ? 'st' : c % 10 === 2 && c !== 12 ? 'nd' : c % 10 === 3 && c !== 13 ? 'rd' : 'th'} century${bc}`, year }; }
  return { text: `${n}${bc}`, year };
}
const plural = (unit, n) => {
  if (!unit || n === 1) return unit;
  if (/^degree /.test(unit)) return unit.replace(/^degree/, 'degrees');
  if (/ per /.test(unit)) return unit.replace(/^(.*?)(\S+)( per .*)$/, (m, a, w, b) => `${a}${/s$/.test(w) ? w : `${w}s`}${b}`);
  if (/(s|kelvin|hertz)$/.test(unit)) return unit;
  return `${unit}s`;
};
const SHORT = { metre: 'm', kilometre: 'km', 'square kilometre': 'km²', kilogram: 'kg', 'degree Celsius': '°C', kelvin: 'K', 'light-year': 'ly', 'astronomical unit': 'AU', centimetre: 'cm', millimetre: 'mm', tonne: 't', 'kilometre per hour': 'km/h', 'metre per second': 'm/s', gram: 'g', 'gram per mole': 'g/mol' };
const article = (w) => (/^[aeiou]/i.test(w) && !/^(uni|eu|one)/i.test(w) ? 'an' : 'a');
const clean = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d))).replace(/\s+/g, ' ').trim();
const firstSentence = (s, max = 220) => { const m = clean(s).match(/^.{20,}?[.!?](?=\s+[A-Z]|$)/); const x = m ? m[0] : clean(s); return x.length > max ? '' : x; };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// "Volcano", "Telephone" are words, said "a volcano", "the telephone";
// "Jupiter", "Paris", "the Moon" are names. The system word list keeps names
// capitalised, so a title found there only in lower case is a common noun.
let WORDS = null;
const NAMES = new Set(['Moon', 'Sun', 'Earth']);
function common(label) {
  if (!/^[A-Z][a-z]+( [a-z]+)*$/.test(label) || NAMES.has(label)) return false;
  if (!WORDS) { try { WORDS = new Set(fs.readFileSync('/usr/share/dict/words', 'utf8').split('\n')); } catch { WORDS = new Set(); } }
  const first = label.split(' ')[0];
  return WORDS.has(first.toLowerCase()) && !WORDS.has(first);
}
const noun = (label) => (common(label) ? label.toLowerCase() : label);
// "Fifth planet from the Sun" -> "the fifth planet from the Sun"; "Species of
// large cat" -> "a species of large cat"; "German-born physicist" stays German.
function describe(desc) {
  let d = String(desc || '').replace(/\s*\([^)]*\)/g, '').trim();
  if (!d) return '';
  const w = d.split(/[\s-]/)[0];
  if (!/^[A-Z][a-z]+(an|ian|ese|ish|ic|i)$/.test(w) && !/[A-Z]/.test(w.slice(1)) && !/^[A-Z][a-z]+'s$/.test(w)) d = d.charAt(0).toLowerCase() + d.slice(1);
  if (/^(the |a |an |[a-z]+'s |[A-Z][a-z]+'s )/.test(d)) return d;
  if (/^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|only|capital|largest|smallest|highest|longest|tallest|biggest|deepest|oldest|main|\w+est)\b/i.test(d)) return `the ${d}`;
  return `${article(d)} ${d}`;
}
const subjectOf = (m) => String(m.slice(1).find(Boolean) || '').replace(/[?!.]+$/, '').replace(/^(the|a|an)\s+/i, '').replace(/\s+(located|situated|found)$/i, '').trim();

// ---- Wikidata facts: the question shape, the properties that answer it, and how to say it ----
const FACTS = [
  { re: /^(?:what is |what's )?(?:the )?population of (.+)|^how many people (?:live|are there) in (.+)/, p: ['P1082'], kind: 'number', what: 'population', history: true, say: (s, v, d) => `${s} has a population of ${v}${d ? ` (${d})` : ''}.` },
  { re: /^(?:what is |what's )?(?:the )?capital(?: city)? of (.+)|^what is (.+?)'s capital/, p: ['P36'], kind: 'place', say: (s, v) => `The capital of ${s} is ${v}.` },
  { re: /(?:currency|money) (?:of|in|used in|do they use in) (.+)/, p: ['P38'], say: (s, v) => `${s} uses the ${v}.` },
  { re: /^(?:what (?:is|are) )?(?:the )?(?:official |main )?languages? (?:of|spoken in|do (?:they|people) speak in) (.+)|^what languages? (?:do|does) (?:they|people) speak in (.+)/, p: ['P37'], say: (s, v, d, n) => `The official language${n > 1 ? 's' : ''} of ${s} ${n > 1 ? 'are' : 'is'} ${v}.` },
  { re: /^how high is (.+)|^(?:what is )?(?:the )?(?:elevation|altitude) of (.+)/, p: ['P2044', 'P2048'], kind: 'number', what: 'height', prefer: 'Q11573', say: (s, v) => `${s} is ${v} high.` },
  { re: /^how tall is (.+)|^(?:what is )?(?:the )?height of (.+)/, p: ['P2048', 'P2044'], kind: 'number', what: 'height', prefer: 'Q11573', say: (s, v) => `${s} is ${v} tall.` },
  { re: /^how long is (.+)|^(?:what is )?(?:the )?length of (.+)/, p: ['P2043'], kind: 'number', what: 'length', prefer: 'Q828224', say: (s, v) => `${s} is ${v} long.` },
  { re: /^how (?:big|large) is (.+)|^(?:what is )?(?:the )?(?:size|area) of (.+)/, p: ['P2046', 'P2120'], kind: 'number', what: 'area', say: (s, v, d, n, prop) => (prop === 'P2120' ? `${s} has a radius of ${v}.` : `${s} covers ${v}.`) },
  { re: /^how deep is (.+)|^(?:what is )?(?:the )?depth of (.+)/, p: ['P4511'], kind: 'number', what: 'depth', say: (s, v) => `${s} is ${v} deep.` },
  { re: /^how wide is (.+)|^(?:what is )?(?:the )?width of (.+)/, p: ['P2049', 'P2120'], kind: 'number', what: 'width', say: (s, v, d, n, prop) => (prop === 'P2120' ? `${s} has a radius of ${v}.` : `${s} is ${v} wide.`) },
  { re: /^(?:what is )?(?:the )?radius of (.+)/, p: ['P2120'], kind: 'number', what: 'radius', say: (s, v) => `${s} has a radius of ${v}.` },
  { re: /^how (?:heavy|massive) is (.+)|^(?:what is )?(?:the )?(?:mass|weight) of (.+)/, p: ['P2067'], kind: 'number', what: 'mass', prefer: 'Q11570', say: (s, v) => `${s} has a mass of ${v}.` },
  { re: /^how far (?:away )?is (.+?)(?: from (?:the )?earth| from us)?$|^(?:what is )?(?:the )?distance (?:from (?:the )?earth )?to (.+)/, p: ['P2583'], kind: 'number', what: 'distance', prefer: 'Q828224', say: (s, v) => `${s} is about ${v} from Earth.` },
  { re: /^(?:what is )?(?:the )?(?:surface )?temperature (?:of|on) (.+)|^how hot is (.+)/, p: ['P2076'], kind: 'number', what: 'temperature', prefer: 'Q25267', say: (s, v) => `The temperature of ${s} is about ${v}.` },
  { re: /^(?:what is )?(?:the )?boiling point of (.+)|^at what temperature does (.+?) boil/, p: ['P2102'], kind: 'number', what: 'boiling point', prefer: 'Q25267', say: (s, v) => `${s} boils at ${v}.` },
  { re: /^(?:what is )?(?:the )?(?:melting|freezing) point of (.+)|^at what temperature does (.+?) (?:melt|freeze)/, p: ['P2101'], kind: 'number', what: 'melting point', prefer: 'Q25267', say: (s, v) => `${s} melts at ${v}.` },
  { re: /^(?:what is )?(?:the )?speed of (.+)|^how fast is (.+)/, p: ['P2052'], kind: 'number', what: 'speed', say: (s, v) => `The speed of ${s} is ${v}.` },
  { re: /^when (?:was|were) (.+?) born|^(?:what is |when is )?(.+?)'s (?:birthday|date of birth)|^when is (.+?)'s birthday/, p: ['P569'], also: 'P19', kind: 'date', person: true, say: (s, v, d, n, prop, place) => `${s} was born ${/\d \w+ \d/.test(v) ? 'on' : 'in'} ${v}${place ? ` in ${place}` : ''}.` },
  { re: /^when did (.+?) die|^how did (.+?) die/, p: ['P570'], also: 'P20', kind: 'date', person: true, say: (s, v, d, n, prop, place) => `${s} died ${/\d \w+ \d/.test(v) ? 'on' : 'in'} ${v}${place ? ` in ${place}` : ''}.` },
  { re: /^(?:when|what year) (?:was|were|did) (.+?) (?:built|founded|made|created|established|formed|start|started|begin|began|opened|completed|discovered|invented|happen)\b|^how old is (.+)/, p: ['P571', 'P1619', 'P580', 'P585', 'P575'], kind: 'date', say: (s, v, d, n, prop, place, q) => { const verb = (q.match(/\b(built|founded|made|created|established|formed|opened|completed|discovered|invented)\b/) || [])[1]; return /^how old/.test(q) && d ? `${s} dates from ${v}, so it is about ${new Date().getFullYear() - d} years old.` : verb ? `${s} was ${verb} in ${v}.` : prop === 'P580' ? `${s} began in ${v}.` : `${s} dates from ${v}.`; } },
  { re: /^who (?:wrote|is the author of|was the author of) (.+)/, p: ['P50'], say: (s, v) => `${s} was written by ${v}.` },
  { re: /^who (?:painted|made the painting) (.+)/, p: ['P170'], say: (s, v) => `${s} was painted by ${v}.` },
  { re: /^who (?:composed|wrote the music (?:for|of)) (.+)/, p: ['P86'], say: (s, v) => `${s} was composed by ${v}.` },
  { re: /^who (?:built|designed|was the architect of) (.+)/, p: ['P84', 'P287', 'P176'], say: (s, v) => `${s} was designed by ${v}.` },
  { re: /^who (?:directed) (.+)/, p: ['P57'], say: (s, v) => `${s} was directed by ${v}.` },
  { re: /^who (?:is|was) the (?:president|king|queen|head of state|monarch) of (.+)/, p: ['P35'], current: true, who: true, say: (s, v) => `The head of state of ${s} is ${v}.` },
  { re: /^who (?:is|was) the (?:prime minister|head of (?:the )?government|chancellor|mayor) of (.+)/, p: ['P6'], current: true, who: true, say: (s, v) => `The head of government of ${s} is ${v}.` },
  { re: /^(?:what is )?(?:the )?atomic number of (.+)/, p: ['P1086'], kind: 'number', what: 'atomic number', say: (s, v) => `The atomic number of ${s} is ${v}.` },
  { re: /^where (?:is|are) (.+?)(?: located| situated| found)?$|^where can i find (.+)/, p: ['P625'], kind: 'where', say: () => '' },
];
const MEDIA = /\b(film|album|song|single|band|novel|episode|video game|television|tv series|musical group|rapper|disambiguation|wikimedia|family name|given name|surname)\b/i;

// ---- World Bank indicators ----
const INDICATORS = [
  { re: /\bgdp per (?:capita|person|head)|income per person|average income/, id: 'NY.GDP.PCAP.CD', what: 'GDP per person', unit: 'US dollars' },
  { re: /\bgdp\b|gross domestic product|size of (?:the )?economy|how rich/, id: 'NY.GDP.MKTP.CD', what: 'GDP', unit: 'US dollars', of: true },
  { re: /life expectancy|how long do people live/, id: 'SP.DYN.LE00.IN', what: 'life expectancy', unit: 'years', short: 'years' },
  { re: /\bco2\b|carbon(?: dioxide)? emissions|greenhouse gas/, id: 'EN.GHG.CO2.MT.CE.AR5', what: 'CO₂ emissions', unit: 'million tonnes', short: 'Mt', of: true },
  { re: /literacy/, id: 'SE.ADT.LITR.ZS', what: 'adult literacy rate', unit: '%' },
  { re: /unemployment/, id: 'SL.UEM.TOTL.ZS', what: 'unemployment rate', unit: '%' },
  { re: /inflation/, id: 'FP.CPI.TOTL.ZG', what: 'inflation rate', unit: '%' },
  { re: /internet/, id: 'IT.NET.USER.ZS', what: 'share of people using the internet', unit: '%' },
  { re: /forest/, id: 'AG.LND.FRST.ZS', what: 'share of land covered by forest', unit: '%' },
  { re: /birth rate/, id: 'SP.DYN.CBRT.IN', what: 'birth rate', unit: 'births per 1,000 people' },
  { re: /electricity/, id: 'EG.ELC.ACCS.ZS', what: 'share of people with electricity', unit: '%' },
  { re: /urban|living in cities/, id: 'SP.URB.TOTL.IN.ZS', what: 'share of people living in cities', unit: '%' },
  { re: /poverty|poor people/, id: 'SI.POV.DDAY', what: 'share of people in extreme poverty', unit: '%' },
  { re: /population|how many people/, id: 'SP.POP.TOTL', what: 'population', unit: 'people', of: true },
];
const COUNTRY_ALIASES = { usa: 'US', us: 'US', america: 'US', 'united states of america': 'US', uk: 'GB', britain: 'GB', 'great britain': 'GB', england: 'GB', scotland: 'GB', wales: 'GB', russia: 'RU', 'south korea': 'KR', korea: 'KR', 'north korea': 'KP', iran: 'IR', egypt: 'EG', turkey: 'TR', vietnam: 'VN', venezuela: 'VE', syria: 'SY', laos: 'LA', yemen: 'YE', 'dr congo': 'CD', 'democratic republic of the congo': 'CD', congo: 'CG', gambia: 'GM', bahamas: 'BS', 'ivory coast': 'CI', slovakia: 'SK', kyrgyzstan: 'KG', 'hong kong': 'HK', macau: 'MO', micronesia: 'FM', 'the world': 'WLD', world: 'WLD', 'the whole world': 'WLD', earth: 'WLD' };
const NICE = { KR: 'South Korea', KP: 'North Korea', RU: 'Russia', IR: 'Iran', EG: 'Egypt', TR: 'Turkey', VN: 'Vietnam', VE: 'Venezuela', SY: 'Syria', LA: 'Laos', YE: 'Yemen', CD: 'DR Congo', CG: 'Congo', GM: 'The Gambia', BS: 'The Bahamas', SK: 'Slovakia', KG: 'Kyrgyzstan', HK: 'Hong Kong', US: 'the United States', GB: 'the United Kingdom', WLD: 'the world' };

// ---- Pictures ----
const SPACE = /\b(planet|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|moon|sun|star|stars|galaxy|galaxies|nebula|comet|asteroid|black hole|milky way|universe|space|astronaut|rocket|iss|space station|satellite|apollo|hubble|webb|eclipse|aurora|supernova|earth from space)\b/i;
const ART = /\b(painting|paintings|artwork|art by|sculpture|portrait|still life|landscape painting|impressionis\w*|by (?:van gogh|monet|picasso|rembrandt|renoir|cezanne|cézanne|seurat|degas|hokusai|da vinci|leonardo))\b/i;

export function createOpenData({ dataDir, log = () => {} } = {}) {
  const file = path.join(dataDir, 'opendata.json');
  let cache = {};
  cache = readJson(file, {});
  let saving = null;
  const save = () => { clearTimeout(saving); saving = setTimeout(() => writeWhole(file, JSON.stringify(prune(cache))).catch(() => {}), 2000); };
  const get = (url, ms = 3500) => fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(ms) }).then((r) => (r.ok ? r.json() : null));
  // A fetch remembered for a while (facts change slowly; weather and quakes do not).
  async function kept(key, ms, fn) {
    const hit = cache[key];
    if (hit && Date.now() - hit.at < ms) return hit.value;
    const value = await fn();
    if (value != null) { cache[key] = { at: Date.now(), value }; save(); }
    return value;
  }

  // ---- Wikidata ----
  const labelCache = new Map();
  async function labels(ids) {
    const need = [...new Set(ids)].filter((id) => /^Q\d+$/.test(id) && !labelCache.has(id));
    for (let i = 0; i < need.length; i += 40) {
      const r = await get(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${need.slice(i, i + 40).join('|')}&props=labels&languages=en&format=json`).catch(() => null);
      for (const [id, e] of Object.entries(r?.entities || {})) labelCache.set(id, e.labels?.en?.value || id);
    }
    return ids.map((id) => labelCache.get(id) || id);
  }
  // The item a name means. Wikipedia knows a name's main meaning ("Jupiter"
  // is the planet, not a ship once called that), and its article names the
  // Wikidata item; Wikidata's own search is the fallback.
  async function item(name, question) {
    return kept(`wd:item2:${name.toLowerCase()}`, 30 * DAY, async () => {
      const summary = (t) => get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cap(t).replace(/\s+/g, '_'))}`).catch(() => null);
      let page = await summary(name);
      if (!page?.wikibase_item || page.type !== 'standard' || (MEDIA.test(page.description || '') && !MEDIA.test(question))) {
        const found = await get(`https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(name)}&limit=3`).catch(() => null);
        const first = (found?.pages || []).find((x) => !MEDIA.test(x.description || '') || MEDIA.test(question));
        page = first ? await summary(first.key) : null;
      }
      if (page?.wikibase_item && page.type === 'standard') return { id: page.wikibase_item, label: page.title, description: page.description || '' };
      const r = await get(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&uselang=en&format=json&type=item&limit=7`);
      const hits = (r?.search || []).filter((h) => !MEDIA.test(h.description || '') || MEDIA.test(question));
      const h = hits.find((x) => x.match?.type === 'label' && (x.label || '').toLowerCase() === name.toLowerCase()) || hits[0];
      return h ? { id: h.id, label: h.label || name, description: h.description || '' } : null;
    });
  }
  const statements = (id, prop) => kept(`wd:st:${id}:${prop}`, 7 * DAY, async () => {
    const r = await get(`https://www.wikidata.org/w/rest.php/wikibase/v1/entities/items/${id}/statements?property=${prop}`);
    return (r?.[prop] || []).filter((s) => s.rank !== 'deprecated').map((s) => ({
      rank: s.rank, type: s.value?.type, v: s.value?.content,
      when: date(s.qualifiers?.find((q) => q.property.id === 'P585')?.value?.content)?.year ?? null,
      ended: !!s.qualifiers?.some((q) => q.property.id === 'P582'),
    }));
  });
  // The statement to use: preferred rank, else the latest dated, else the first.
  function pick(list, { current, prefer } = {}) {
    let l = list.filter((s) => s.type === 'value');
    if (current) l = l.filter((s) => !s.ended);
    if (prefer) { const p = l.filter((s) => s.v?.unit?.endsWith(`/${prefer}`)); if (p.length) l = p; }
    const pref = l.filter((s) => s.rank === 'preferred');
    if (pref.length) l = pref;
    const dated = l.filter((s) => s.when != null).sort((a, b) => b.when - a.when);
    return dated.length ? [dated[0]] : l;
  }
  // Where someone was born or died, as a town: Wikidata sometimes names the
  // street or the house ("Freta Street"), so that one's town is used instead.
  async function town(id, prop) {
    const s = pick(await statements(id, prop).catch(() => []))[0];
    const at = s && await value(s);
    if (!at?.text) return null;
    if (at.id && /\b(street|road|avenue|square|lane|hospital|house|manor|palace|castle|farm|estate|building)\b/i.test(at.text)) {
      // Up the "located in" chain (street, district, city) to the first city, town or village.
      const CITY = new Set(['Q515', 'Q1549591', 'Q5119', 'Q3957', 'Q532', 'Q1637706', 'Q200250', 'Q486972', 'Q1093829']);
      let id2 = at.id;
      for (let hop = 0; hop < 3; hop++) {
        const up = pick(await statements(id2, 'P131').catch(() => []))[0];
        if (typeof up?.v !== 'string') break;
        id2 = up.v;
        const kinds = await statements(id2, 'P31').catch(() => []);
        if (kinds.some((k) => CITY.has(k.v))) return (await labels([id2]))[0];
      }
    }
    return at.text;
  }
  async function image(id) {
    const st = await statements(id, 'P18').catch(() => []);
    const name = st.find((s) => s.type === 'value')?.v;
    if (!name) return null;
    return commonsPicture(name);
  }
  // A Commons file with its author and licence (Commons hosts free licences only; NC/ND never).
  const commonsPicture = (name) => kept(`commons:${name}`, 30 * DAY, async () => {
    const r = await get(`https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(name)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=900&format=json`);
    const info = Object.values(r?.query?.pages || {})[0]?.imageinfo?.[0];
    if (!info) return null;
    const meta = info.extmetadata || {};
    const licence = clean(meta.LicenseShortName?.value);
    if (/\b(NC|ND|non-free|fair use)\b/i.test(licence)) return null;
    const author = clean(meta.Artist?.value).slice(0, 60) || 'Unknown author';
    return { src: info.thumburl || info.url, credit: `${author}, ${licence || 'free licence'} via Wikimedia Commons` };
  });
  async function value(s) {
    if (s.type !== 'value') return null;
    const v = s.v;
    if (typeof v === 'string' && /^Q\d+$/.test(v)) return { text: (await labels([v]))[0], id: v };
    if (v?.amount != null) {
      let n = Number(v.amount);
      const unitId = String(v.unit || '').split('/').pop();
      let unit = unitId && unitId !== '1' ? (await labels([unitId]))[0] : '';
      // Units students know: yottagrams of a planet in kilograms.
      const TO = { yottagram: [1e21, 'kilogram'], zettagram: [1e18, 'kilogram'], exagram: [1e15, 'kilogram'], petagram: [1e12, 'kilogram'], teragram: [1e9, 'kilogram'], 'gram': [1e-3, 'kilogram'] };
      if (TO[unit] && n * TO[unit][0] >= 1) { n *= TO[unit][0]; unit = TO[unit][1]; }
      const num = words(n);
      return { text: `${num}${unit ? ` ${plural(unit, n)}` : ''}`, short: `${num.replace(/ (million|billion|trillion)/, (m, w) => ({ million: 'M', billion: 'bn', trillion: 'tn' })[w])}${unit ? ` ${SHORT[unit] || plural(unit, n)}` : ''}`, n, unit };
    }
    if (v?.time) { const d = date(v); return d && { text: d.text, year: d.year }; }
    if (v?.latitude != null) return { lat: v.latitude, lon: v.longitude };
    if (typeof v === 'string') return { text: v };
    return null;
  }

  async function factAnswer(rule, name, q) {
    const it = await item(name, q);
    if (!it) return null;
    let prop = null; let chosen = []; let all = [];
    for (const p of rule.p) {
      all = await statements(it.id, p).catch(() => []);
      chosen = pick(all, rule);
      if (chosen.length) { prop = p; break; }
    }
    if (!chosen.length) return null;
    const vals = (await Promise.all(chosen.slice(0, rule.kind === 'number' ? 1 : 4).map(value))).filter(Boolean);
    if (!vals.length) return null;
    const source = { title: `Wikidata: ${it.label}`, url: `https://www.wikidata.org/wiki/${it.id}`, site: 'Wikidata' };
    // "the Moon", "the Nile": the way the question named it.
    const label = new RegExp(`\\bthe ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(q) && !/^the /i.test(it.label) ? `the ${noun(it.label)}` : noun(it.label);
    const about = it.description && !/\d{3,4}\s*[–-]\s*\d{3,4}/.test(it.description) ? `${label} is ${describe(it.description)}.` : '';
    const pic = await image(it.id).catch(() => null);

    if (rule.kind === 'where') {
      const at = vals[0];
      if (at?.lat == null) return null;
      const [country, region] = await Promise.all([statements(it.id, 'P17').then((l) => pick(l)[0]).then((s) => s && value(s)).catch(() => null), statements(it.id, 'P131').then((l) => pick(l)[0]).then((s) => s && value(s)).catch(() => null)]);
      const where = [region?.text, country?.text].filter((x, i, a) => x && a.indexOf(x) === i).join(', ');
      return {
        title: `Where is ${label}?`, source,
        say: [where ? `${label} is in ${where}.` : `${label} is at ${Math.abs(at.lat).toFixed(1)}° ${at.lat >= 0 ? 'north' : 'south'}, ${Math.abs(at.lon).toFixed(1)}° ${at.lon >= 0 ? 'east' : 'west'}.`, about].filter(Boolean),
        figures: [{ op: 'map', pins: [{ lat: at.lat, lon: at.lon, label }], highlight: country?.text ? [country.text] : [] }],
        more: pic ? [{ op: 'image', ...pic, caption: label }] : [],
      };
    }
    const n = vals.length;
    const text = n > 1 ? `${vals.slice(0, -1).map((x) => x.text).join(', ')} and ${vals[n - 1].text}` : vals[0].text;
    let place = null;
    if (rule.also) place = await town(it.id, rule.also);
    const when = chosen[0].when;
    const line = rule.say(label, text, when ?? vals[0].year, n, prop, place, q).replace(/\.{2,}$/, '.'); // "Washington, D.C."
    const say = [cap(spoken(line)), ...(rule.person || !about ? [] : [cap(about)])];
    const figures = [];
    const more = [];
    if (rule.history) {
      // Every dated count Wikidata keeps: the population over the years.
      const series = new Map();
      for (const s of all) if (s.when != null && s.v?.amount != null && (!series.has(s.when) || s.rank === 'preferred')) series.set(s.when, Number(s.v.amount));
      const pts = [...series].sort((a, b) => a[0] - b[0]).filter(([y]) => y >= 1800);
      if (pts.length >= 3) {
        const step = Math.max(1, Math.ceil(pts.length / 10));
        const keep = pts.filter((p, i) => i % step === 0 || i === pts.length - 1);
        const scale = Math.max(...keep.map((p) => p[1])) >= 2e6 ? [1e6, 'millions'] : Math.max(...keep.map((p) => p[1])) >= 2e4 ? [1e3, 'thousands'] : [1, ''];
        figures.push({ op: 'line', items: keep.map(([y, v]) => `${y}: ${round(v / scale[0], 3)}`), label: `Population of ${label}${scale[1] ? ` (${scale[1]})` : ''}` });
        const [y0, v0] = keep[0];
        say.splice(1, 0, `In ${y0} it was ${words(v0)}.`);
      }
    }
    if (rule.kind === 'number') {
      const big = { op: 'bignum', value: vals[0].short || vals[0].text, label: `${cap(rule.what)} of ${label}` };
      if (figures.length) more.push(big); else if (pic) { figures.push({ op: 'image', ...pic, caption: label }); figures.push(big); } else figures.push(big);
    } else if (rule.kind === 'place' && vals[0].id) {
      const at = pick(await statements(vals[0].id, 'P625').catch(() => []))[0];
      if (at?.v?.latitude != null) figures.push({ op: 'map', pins: [{ lat: at.v.latitude, lon: at.v.longitude, label: vals[0].text }], highlight: [label] });
      else if (pic) figures.push({ op: 'image', ...pic, caption: label });
    } else {
      // A person, a work, a date: the picture of what was asked about, else of the answer.
      // ("Who is the prime minister": the person, not the country.)
      const answerPic = (rule.who || !pic) && vals[0].id ? await image(vals[0].id).catch(() => null) : null;
      const shown = rule.who ? answerPic || pic : pic || answerPic;
      if (shown) figures.push({ op: 'image', ...shown, caption: shown === answerPic ? vals[0].text : it.label });
      if (rule.kind === 'date' && vals[0].year) figures.push({ op: 'bignum', value: vals[0].text.length <= 12 ? vals[0].text.replace(/^the /, '') : String(vals[0].year < 0 ? `${-vals[0].year} BC` : vals[0].year), label: cap(line.replace(/\.$/, '').replace(/, so it is .*$/, '')) });
    }
    return { title: label, say, figures, more, source };
  }

  // ---- World Bank ----
  const countries = () => kept('wb:countries', 30 * DAY, async () => {
    const r = await get('https://api.worldbank.org/v2/country?format=json&per_page=400', 6000);
    return (r?.[1] || []).filter((c) => c.region?.value !== 'Aggregates' || c.id === 'WLD').map((c) => ({ id: c.iso2Code === '1W' ? 'WLD' : c.iso2Code, name: c.name }));
  });
  async function country(q) {
    const list = await countries().catch(() => null);
    if (!list) return null;
    const names = new Map();
    for (const c of list) { names.set(c.name.toLowerCase().replace(/,.*$/, ''), c.id); names.set(c.name.toLowerCase(), c.id); }
    for (const [a, id] of Object.entries(COUNTRY_ALIASES)) names.set(a, id);
    const found = [...names.keys()].filter((n) => n.length >= 2 && new RegExp(`(?<![a-z])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z])`).test(q)).sort((a, b) => b.length - a.length)[0];
    if (!found) return null;
    const id = names.get(found);
    const c = list.find((x) => x.id === id);
    return { id, name: NICE[id] || (c ? c.name.replace(/,.*$/, '') : found) };
  }
  async function stats(ind, place) {
    const r = await kept(`wb:${place.id}:${ind.id}`, 7 * DAY, () => get(`https://api.worldbank.org/v2/country/${place.id === 'WLD' ? 'WLD' : place.id}/indicator/${ind.id}?format=json&date=1990:2030&per_page=60`, 6000));
    const rows = (r?.[1] || []).filter((x) => x.value != null).map((x) => [Number(x.date), Number(x.value)]).sort((a, b) => a[0] - b[0]);
    if (rows.length < 2) return null;
    const [yN, vN] = rows[rows.length - 1];
    const step = Math.max(1, Math.ceil(rows.length / 10));
    const keep = rows.filter((p, i) => i % step === (rows.length - 1) % step);
    const [y0, v0] = keep[0];
    const pct = ind.unit === '%';
    const fmt = (v) => (pct ? `${round(v, 3)}%` : ind.unit === 'US dollars' ? `${words(v)} US dollars` : ind.unit === 'people' ? words(v) : `${words(v)} ${ind.unit}`);
    const top = Math.max(...keep.map((p) => p[1]));
    const scale = pct ? [1, '%'] : top >= 2e12 ? [1e12, 'trillions'] : top >= 2e9 ? [1e9, 'billions'] : top >= 2e6 ? [1e6, 'millions'] : top >= 2e4 ? [1e3, 'thousands'] : [1, ''];
    const change = v0 ? ((vN - v0) / Math.abs(v0)) * 100 : 0;
    const Name = cap(place.name);
    const were = /s$/.test(ind.what) ? 'were' : 'was';
    const how = change > 200 ? `so it is now ${round(vN / v0, 2)} times as ${ind.unit === 'US dollars' ? 'big' : 'high'}` : `so it has ${change > 0 ? 'grown' : 'fallen'} by ${Math.round(Math.abs(change))}%`;
    const it = were === 'were' ? 'they' : 'it';
    const trend = pct ? `In ${y0} ${it} ${were} ${fmt(v0)}.` : Math.abs(change) < 2 ? `In ${y0} ${it} ${were} ${fmt(v0)}, about the same.` : `In ${y0} ${it} ${were} ${fmt(v0)}, ${how.replace('it is', `${it} ${it === 'they' ? 'are' : 'is'}`)}.`;
    return {
      title: `${cap(ind.what)}: ${Name}`, watch: `${ind.what} of ${place.name}`,
      say: [spoken(`In ${yN}, the ${ind.what} ${ind.of ? 'of' : 'in'} ${place.name} ${were} ${fmt(vN)}.`), spoken(trend)],
      figures: [{ op: 'line', items: keep.map(([y, v]) => `${y}: ${round(v / scale[0], 3)}${pct ? '%' : ''}`), label: `${cap(ind.what)}, ${place.name}${scale[1] && !pct ? ` (${scale[1]}${ind.unit === 'US dollars' ? ' of US$' : ind.unit === 'people' ? '' : ` ${ind.unit}`})` : pct ? ' (%)' : ind.unit === 'people' ? '' : ` (${ind.unit})`}` }],
      more: [{ op: 'bignum', value: pct ? `${round(vN, 3)}%` : `${ind.unit === 'US dollars' ? '$' : ''}${words(vN).replace(/ (million|billion|trillion)/, (m, w) => ({ million: 'M', billion: 'bn', trillion: 'tn' })[w])}${ind.short ? ` ${ind.short}` : ''}`, label: `${cap(ind.what)} ${ind.of ? 'of' : 'in'} ${place.name}, ${yN}` }],
      source: { title: `World Bank Open Data: ${ind.what}`, url: `https://data.worldbank.org/indicator/${ind.id}?locations=${place.id === 'WLD' ? '1W' : place.id}`, site: 'World Bank' },
    };
  }

  // ---- PubChem ----
  async function chemical(name) {
    const props = await kept(`pc:${name.toLowerCase()}`, 30 * DAY, async () => {
      const r = await get(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/MolecularFormula,MolecularWeight,IUPACName,Title/JSON`);
      const p = r?.PropertyTable?.Properties?.[0];
      if (!p) return null;
      const d = await get(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${p.CID}/description/JSON`).catch(() => null);
      const description = (d?.InformationList?.Information || []).map((x) => x.Description).find((x) => x && x.length < 600) || '';
      return { ...p, description };
    });
    if (!props?.MolecularFormula) return null;
    const f = props.MolecularFormula;
    const atoms = [...f.matchAll(/([A-Z][a-z]?)(\d*)/g)].map(([, sym, k]) => ({ sym, k: Number(k || 1), name: element(sym)?.name || sym }));
    const atomWords = atoms.map((a) => `${a.k} ${a.name.toLowerCase()}`);
    const list = atomWords.length > 1 ? `${atomWords.slice(0, -1).join(', ')} and ${atomWords[atomWords.length - 1]}` : atomWords[0];
    const title = props.Title || cap(name);
    const pretty = f.replace(/\d/g, (c) => SUB[c]);
    const desc = firstSentence(props.description);
    return {
      title: `${title}: ${pretty}`, watch: title,
      say: [`The chemical formula of ${/^[A-Z][a-z]+$/.test(title) ? title.toLowerCase() : title} is ${pretty}.`, `Each molecule has ${list} atom${atoms.length === 1 && atoms[0].k === 1 ? '' : 's'}.`, `Its molar mass is ${props.MolecularWeight} grams per mole.`, ...(desc && desc.split(' ').length < 30 ? [desc] : [])].slice(0, 3),
      figures: [{ op: 'image', src: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${props.CID}/PNG?image_size=600x600`, caption: `${title} (${pretty})`, credit: 'PubChem, US National Library of Medicine' },
        { op: 'bullets', items: atoms.map((a) => `${a.k} × ${a.name} (${a.sym})`) }],
      source: { title: `PubChem: ${title}`, url: `https://pubchem.ncbi.nlm.nih.gov/compound/${props.CID}`, site: 'PubChem' },
    };
  }

  // ---- Wiktionary ----
  async function define(word) {
    const r = await kept(`wkt:${word.toLowerCase()}`, 30 * DAY, () => get(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word.replace(/\s+/g, '_'))}`));
    // Per part of speech, the sense a student most likely means: one marked
    // with a school subject ("(physics)") first, never a heading or an obsolete one.
    const SCHOOL = /\b(physics|chemistry|biology|mathematics|geometry|algebra|arithmetic|astronomy|geography|geology|computing|science|anatomy|botany|zoology|economics|grammar|music)\b/i;
    const senses = [];
    for (const part of r?.en || []) {
      const all = (part.definitions || []).map((x) => {
        const text = clean(String(x.definition || '').replace(/<style[\s\S]*?<\/style>/g, '')).replace(/\.mw-parser-output[^}]*}/g, '').replace(/\{[^}]*\}/g, '').trim();
        const tag = (text.match(/^\(([^)]*)\)/) || [])[1] || '';
        // "Synonym of gravitation (“the force of attraction…”)": the meaning inside.
        const body = text.replace(/^\([^)]*\)\s*/, '').replace(/^(?:synonym|short) (?:of|for) [^(]*\(“([^”]+)”?\)?.*$/i, '$1');
        const cut = (body.match(/^.{15,170}?[.;](?=\s|$)/) || [body.length <= 170 ? body : body.slice(0, 170).lastIndexOf(', ') > 60 ? body.slice(0, body.slice(0, 170).lastIndexOf(', ')) : body.slice(0, 170).replace(/[,\s]+\S*$/, '')])[0].replace(/[;.]$/, '');
        const short = cut.charAt(0).toUpperCase() + cut.slice(1);
        const ex = clean(x.examples?.[0] || '');
        return { text: short, tag, ex: ex.split(/\s+/).length >= 5 ? ex : '', school: SCHOOL.test(tag) };
      }).filter((x) => x.text.length > 3 && !/^(obsolete|archaic|plural of|alternative (form|spelling) of|misspelling|senses? relating to)/i.test(x.text) && !/\b(obsolete|archaic|dated)\b/i.test(x.tag));
      const SCIENCE = /\b(force|energy|mass|matter|particles?|atoms?|molecules?|cells?|organisms?|plants?|animals?|numbers?|quantity|shape|angle|earth|planet|light|heat|electric\w*|chemical|process|measure\w*|equation|liquid|gas|solid|body|bodies)\b/i;
      const score = (x) => (x.school ? 3 : 0) + (SCIENCE.test(x.text) ? 1 : 0) - (/^of (an?|the) /i.test(x.text) ? 1 : 0);
      const d = all.reduce((best, x) => (!best || score(x) > score(best) ? x : best), null);
      if (d) senses.push({ pos: part.partOfSpeech.toLowerCase(), ...d });
      if (senses.length >= 3) break;
    }
    if (!senses.length) return null;
    const first = senses[0];
    const say = [`"${cap(word)}" is ${article(first.pos)} ${first.pos}${first.tag && first.school ? ` in ${first.tag.split(/,\s*/)[0]}` : ''}. It means: ${first.text.replace(/\.$/, '')}.`];
    if (first.ex && first.ex.length < 140) say.push(`For example: ${first.ex.replace(/\.$/, '')}.`);
    if (senses[1]) say.push(`As ${article(senses[1].pos)} ${senses[1].pos}, it can also mean: ${senses[1].text.replace(/\.$/, '')}.`);
    return {
      title: `"${word}"`, watch: word, say: say.slice(0, 3),
      figures: [{ op: 'bullets', items: senses.map((x) => `${x.pos}${x.tag ? ` (${x.tag})` : ''}: ${x.text}`.slice(0, 140)) }],
      source: { title: `Wiktionary: ${word}`, url: `https://en.wiktionary.org/wiki/${encodeURIComponent(word.replace(/\s+/g, '_'))}`, site: 'Wiktionary' },
    };
  }

  // ---- Pictures: the Art Institute for art, else Wikidata's own picture
  // (Commons), else NASA's library for anything in space ----
  async function picture(thing, q, asked = thing) {
    if (ART.test(q)) {
      const what = thing.replace(/\b(painting|paintings|artwork|art|picture|sculpture)\b/gi, ' ').replace(/\s+/g, ' ').trim();
      const r = await kept(`aic:${what.toLowerCase()}`, 30 * DAY, () => get(`https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(what)}&fields=id,title,image_id,artist_title,date_display,is_public_domain&limit=15`, 5000));
      const free = (r?.data || []).filter((x) => x.is_public_domain && x.image_id);
      const key = what.toLowerCase().split(' ').filter((w) => w.length > 3 && !/^by$/.test(w));
      const named = free.find((x) => key.some((k) => x.title.toLowerCase().includes(k.replace(/s$/, ''))));
      const art = named || free.find((x) => key.some((k) => String(x.artist_title || '').toLowerCase().includes(k))) || free[0];
      if (art) {
        return { title: art.title, say: [`${named ? 'This is' : 'Here is a painting from the Art Institute of Chicago:'} ${art.title}${art.artist_title ? ` by ${art.artist_title}` : ''}${art.date_display ? `, from ${art.date_display}` : ''}.`, 'Its picture is in the public domain, free for everyone to share.'],
          figures: [{ op: 'image', src: `https://www.artic.edu/iiif/2/${art.image_id}/full/843,/0/default.jpg`, caption: art.title.slice(0, 60), credit: `${art.artist_title || 'Unknown artist'}, Art Institute of Chicago (CC0)` }],
          source: { title: `Art Institute of Chicago: ${art.title}`, url: `https://www.artic.edu/artworks/${art.id}`, site: 'Art Institute of Chicago' } };
      }
    }
    const it = await item(thing, q);
    const pic = it && await image(it.id).catch(() => null);
    if (pic) {
      const named = /^the /i.test(asked) && !/^the /i.test(it.label) ? `the ${noun(it.label)}` : common(it.label) ? `${article(it.label)} ${noun(it.label)}` : it.label;
      return { title: it.label, say: [`Here is ${/^(a|an|some) /i.test(asked) ? asked : named}.`, ...(it.description ? [`${cap(named)} is ${describe(it.description)}.`] : [])], figures: [{ op: 'image', ...pic, caption: it.label }],
        source: { title: `Wikidata: ${it.label}`, url: `https://www.wikidata.org/wiki/${it.id}`, site: 'Wikidata' } };
    }
    if (SPACE.test(thing)) {
      const r = await kept(`nasa:${thing.toLowerCase()}`, 30 * DAY, () => get(`https://images-api.nasa.gov/search?q=${encodeURIComponent(thing)}&media_type=image&page_size=30`, 5000));
      const items = (r?.collection?.items || []).filter((x) => x.links?.[0]?.href && x.data?.[0]?.title && !/(chart|graph|diagram|logo|patch|portrait|press conference|briefing)/i.test(`${x.data[0].title} ${(x.data[0].keywords || []).join(' ')}`));
      const hit = items.find((x) => x.data[0].title.toLowerCase().includes(thing.toLowerCase())) || items[0];
      if (hit) {
        const d = hit.data[0];
        const desc = firstSentence(d.description_508 || d.description);
        return { title: d.title, say: [`Here is ${asked}, photographed by NASA: ${d.title.replace(/\.$/, '')}.`, ...(desc && desc !== d.title ? [desc] : [])],
          figures: [{ op: 'image', src: hit.links[0].href.replace('~thumb', '~medium'), caption: d.title.slice(0, 60), credit: `NASA${d.center ? `/${d.center}` : ''}${d.photographer ? `, ${d.photographer}` : ''}` }],
          source: { title: `NASA Image Library: ${d.title}`, url: `https://images.nasa.gov/details/${encodeURIComponent(d.nasa_id)}`, site: 'NASA' } };
      }
    }
    return null;
  }

  // ---- USGS: earthquakes of magnitude 4.5 and more in the past week ----
  async function quakes() {
    const r = await kept('usgs:week', HOUR / 2, () => get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson', 6000));
    const all = (r?.features || []).map((f) => ({ mag: f.properties.mag, place: f.properties.place || 'at sea', time: f.properties.time, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] })).filter((q) => q.mag != null);
    if (!all.length) return null;
    const big = [...all].sort((a, b) => b.mag - a.mag);
    const top = big[0];
    const days = Math.max(0, Math.round((Date.now() - top.time) / DAY));
    return {
      title: 'Earthquakes this week', watch: 'earthquakes',
      say: [`In the past week there were ${all.length} earthquakes of magnitude 4.5 or more.`, `The strongest was magnitude ${top.mag}, ${top.place.replace(/^(\d+ km) ([NSEW]{1,3}) of/, (m, d, c) => `${d} ${COMPASS[c] || c} of`)}, ${days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`}.`, 'Most happen along the edges of tectonic plates, like the Pacific Ring of Fire.'],
      figures: [{ op: 'map', region: 'world', pins: big.slice(0, 30).map((q, i) => ({ lat: q.lat, lon: q.lon, label: i < 4 ? `M${q.mag}` : '', size: q.mag })) }],
      source: { title: 'USGS: earthquakes of magnitude 4.5+, past week', url: 'https://earthquake.usgs.gov/earthquakes/map/', site: 'USGS' },
    };
  }

  const COMPASS = { N: 'north', S: 'south', E: 'east', W: 'west', NE: 'northeast', NW: 'northwest', SE: 'southeast', SW: 'southwest', NNE: 'north-northeast', ENE: 'east-northeast', ESE: 'east-southeast', SSE: 'south-southeast', SSW: 'south-southwest', WSW: 'west-southwest', WNW: 'west-northwest', NNW: 'north-northwest' };

  // ---- MET Norway: the weather in a place now and over the next 12 hours ----
  const SKY = { clearsky: 'clear skies', fair: 'fair weather', partlycloudy: 'some clouds', cloudy: 'clouds', fog: 'fog', lightrain: 'light rain', rain: 'rain', heavyrain: 'heavy rain', lightrainshowers: 'light showers', rainshowers: 'showers', heavyrainshowers: 'heavy showers', lightsnow: 'light snow', snow: 'snow', heavysnow: 'heavy snow', sleet: 'sleet', lightsleet: 'light sleet', rainandthunder: 'rain and thunder', snowshowers: 'snow showers', sleetshowers: 'sleet showers' };
  async function weather(placeName, q) {
    let at = findPlace(placeName);
    let name = at?.name || cap(placeName);
    if (!at || at.lat == null || at.kind === 'country') {
      const it = await item(placeName, q);
      const s = it && pick(await statements(it.id, 'P625').catch(() => []))[0];
      if (!s?.v?.latitude) return null;
      at = { lat: s.v.latitude, lon: s.v.longitude };
      name = it.label;
    }
    const lat = at.lat.toFixed(2); const lon = at.lon.toFixed(2);
    const r = await kept(`met:${lat},${lon}`, HOUR / 2, () => get(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`, 5000));
    const series = r?.properties?.timeseries || [];
    if (!series.length) return null;
    const now = series[0].data;
    const t = now.instant.details.air_temperature;
    const sky = String(now.next_1_hours?.summary?.symbol_code || now.next_6_hours?.summary?.symbol_code || '').replace(/_(day|night|polartwilight)$/, '');
    const next = series.slice(0, 13);
    const temps = next.map((x) => x.data.instant.details.air_temperature);
    const hour = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    return {
      title: `Weather in ${name}`, watch: null,
      say: [`Right now in ${name} it is ${Math.round(t)} degrees Celsius${SKY[sky] ? ` with ${SKY[sky]}` : ''}.`, `Over the next 12 hours it will be between ${Math.round(Math.min(...temps))} and ${Math.round(Math.max(...temps))} degrees, with wind of about ${Math.round(now.instant.details.wind_speed)} metres per second.`],
      figures: [{ op: 'line', items: next.filter((x, i) => i % 2 === 0).map((x) => `${hour(x.time)}: ${x.data.instant.details.air_temperature}`), label: `Temperature in ${name}, next 12 hours (°C, UTC times)` }],
      more: [{ op: 'bignum', value: `${Math.round(t)}°C`, label: `${name} now${SKY[sky] ? `: ${SKY[sky]}` : ''}` }],
      source: { title: 'Weather data from MET Norway', url: 'https://api.met.no/', site: 'MET Norway' },
    };
  }

  // ---- Which source answers this question? ----
  // match() reads only the question's shape (no fetch): which source, and
  // whether it goes before the lessons (first: a word's meaning, a formula,
  // a picture, live data and country figures, which no lesson holds) or
  // after them (a fact a lesson may already answer).
  const LICENCE = { Wikidata: 'CC0', 'World Bank': 'CC BY 4.0', PubChem: 'open data (NIH)', Wiktionary: 'CC BY-SA', NASA: 'public domain', 'Art Institute of Chicago': 'CC0', USGS: 'public domain', 'MET Norway': 'CC BY 4.0' };
  function factFor(q) {
    if (/\d/.test(q) && !/world war \d|\b\d{3,4}\b/.test(q)) return null; // sums are the maths rules' job
    for (const rule of FACTS) {
      const m = q.match(rule.re);
      if (!m) continue;
      const name = subjectOf(m);
      return name && name.split(/\s+/).length <= 6 ? { rule, name } : null;
    }
    return null;
  }
  function match(question) {
    const q = String(question || '').trim().toLowerCase().replace(/^(?:(?:hey|ok|okay|so|um+|uh+|teacher|please|can you|could you|tell me|do you know|i want to know|i wonder)[\s,]+)+/g, '').replace(/[?!.]+$/, '').trim();
    if (q.length < 4) return null;
    // A word's meaning.
    let m = q.match(/^what does (?:the word )?["']?(.+?)["']? mean$|^(?:what is |what's )?the meaning of (?:the word )?["']?(.+?)["']?$|^define (?:the word )?(.+)$|^(?:what is )?the definition of (.+)$/);
    if (m) return { first: true, go: () => define(subjectOf(m)) };
    // Live data: earthquakes, weather.
    if (/\bearthquakes?\b/.test(q) && /\b(recent|latest|today|this week|last week|now|happening|where (?:are|were|have|did)|any)\b/.test(q)) return { first: true, go: quakes };
    m = q.match(/\b(?:weather|temperature|forecast|raining|snowing|sunny)\b.*?\b(?:in|at|for) ([a-z][a-z .'-]+?)(?: today| now| right now| tomorrow| this week)?$/);
    if (m && /\b(weather|forecast|raining|snowing|sunny|temperature (?:in|at|outside))\b/.test(q)) return { first: true, go: () => weather(m[1].replace(/^the /, ''), q) };
    // A chemical formula.
    m = q.match(/^(?:what is |what's )?(?:the )?(?:chemical |molecular )?(?:formula|structure|molar mass|molecular (?:weight|mass)) (?:of|for) (.+)$|^what is (.+?) made of$/);
    if (m) return { first: true, go: () => chemical(subjectOf(m)) };
    // A picture.
    m = q.match(/^(?:show me |can i see |let me see |show )?(?:a |an |some |the )?(?:picture|photo|image|pic|photograph)s? of (.+)$|^what (?:does|do|did) (.+?) look like$|^(?:show me |can i see |let me see |show )?(?:a |an |some |the )?((?:paintings?|artworks?|art|sculptures?) by .+)$/);
    if (m) return { first: true, go: () => picture(subjectOf(m), q, String(m[1] || m[2] || m[3]).replace(/[?!.]+$/, '')) };
    // Country figures over time (World Bank); a city's population from Wikidata.
    const fact = factFor(q);
    const ind = !/\d{3,}/.test(q) && INDICATORS.find((i) => i.re.test(q));
    if (ind && (ind.id !== 'SP.POP.TOTL' || /\bpopulation\b|how many people/.test(q))) {
      return { first: true, go: async () => { const place = await country(q); return (place && await stats(ind, place)) || (fact ? factAnswer(fact.rule, fact.name, q) : null); } };
    }
    // A fact about anything: a number, a date, a person, a place.
    return fact ? { first: false, go: () => factAnswer(fact.rule, fact.name, q) } : null;
  }
  async function run(m) {
    try {
      const r = m ? await m.go() : null;
      if (r?.source) r.source.licence = LICENCE[r.source.site] || '';
      return r || null;
    } catch (e) {
      log(`opendata: ${e.message}`);
      return null;
    }
  }
  const answer = (question) => run(match(question));

  // "At a glance": a few key facts about what an answer is about, for a card
  // beside it. A person: born, died, country, work; a place: country,
  // capital, population, area; anything else: what it is, who made it, when.
  const GLANCE = {
    person: [['P569', 'Born', 'P19'], ['P570', 'Died'], ['P106', 'Work'], ['P800', 'Known for'], ['P101', 'Field']],
    place: [['P17', 'Country'], ['P36', 'Capital'], ['P1082', 'Population'], ['P2046', 'Area'], ['P2044', 'Height']],
    thing: [['P279', 'A kind of'], ['P31', 'A kind of'], ['P61', 'Made or found by'], ['P571', 'Since'], ['P186', 'Made of'], ['P361', 'Part of']],
  };
  async function facts(name) {
    return kept(`glance4:${String(name).toLowerCase()}`, 7 * DAY, async () => {
      const it = await item(name, name);
      if (!it) return null;
      const [kinds, coords] = await Promise.all([statements(it.id, 'P31').catch(() => []), statements(it.id, 'P625').catch(() => [])]);
      const kind = kinds.some((x) => x.v === 'Q5') ? 'person' : coords.length ? 'place' : 'thing';
      const rows = [];
      const done = new Set();
      const lists = await Promise.all(GLANCE[kind].map(([prop]) => statements(it.id, prop).catch(() => [])));
      for (const [i, [prop, label, also]] of GLANCE[kind].entries()) {
        if (rows.length >= 4 || done.has(label)) continue;
        // Several people credited (the telephone): name up to three, never just one of them.
        const chosen = pick(lists[i], { current: prop === 'P36' }).slice(0, prop === 'P106' ? 2 : prop === 'P61' ? 3 : 1);
        const vals = (await Promise.all(chosen.map(value))).filter((v) => v?.text);
        if (!vals.length) continue;
        let text = vals.map((v) => v.text).join(', ');
        if (text.toLowerCase() === it.label.toLowerCase()) continue;
        if (also) { const at = await town(it.id, also); if (at) text += `, ${at}`; }
        rows.push(`${label} | ${text.length > 64 ? `${text.slice(0, 63)}…` : text}`);
        done.add(label);
      }
      return rows.length >= 2 ? { kind, title: it.label, rows } : null;
    });
  }
  // The official website of a person, a place or an organisation (Wikidata
  // P856), with the site's own title and description, read from its page head
  // like any link preview (no search engine scraped, no image copied).
  async function website(name) {
    return kept(`site:${String(name).toLowerCase()}`, 30 * DAY, async () => {
      const it = await item(name, name);
      if (!it) return null;
      const st = pick(await statements(it.id, 'P856').catch(() => []))[0];
      const url = typeof st?.v === 'string' && /^https?:\/\//.test(st.v) ? st.v : null;
      if (!url) return null;
      const meta = await preview(url).catch(() => null);
      return { url, domain: new URL(url).hostname.replace(/^www\./, ''), title: meta?.title || `${it.label}: official website`, description: meta?.description || '' };
    });
  }
  async function preview(url) {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(3000) });
    if (!r.ok || !/html/i.test(r.headers.get('content-type') || '')) return null;
    // Just the head of the page: the title and the description tags.
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let html = '';
    while (html.length < 80000) { const { value, done } = await reader.read(); if (done) break; html += dec.decode(value, { stream: true }); if (/<\/head>/i.test(html)) break; }
    reader.cancel().catch(() => {});
    const tag = (n) => (html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${n}["'][^>]*content=["']([^"']*)`, 'i')) || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${n}["']`, 'i')) || [])[1];
    const title = clean(tag('og:title') || (html.match(/<title[^>]*>([^<]*)/i) || [])[1] || '');
    const description = clean(tag('og:description') || tag('description') || '');
    return { title: title.slice(0, 90), description: description.slice(0, 220) };
  }

  return { match, run, answer, facts, website, words };
}
