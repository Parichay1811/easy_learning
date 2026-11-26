// Where the learner is, worked out on this device (content v5, docs/learning/TEACHING-STANDARDS.md
// "Regional rules"), so money in questions is their own and the site opens in their language.
// Nothing is sent anywhere to find out: the device's time zone (Europe/Dublin) first, because many
// devices say "en-US" wherever they are, then the region in the browser's language list (en-IE).
//
//   detectCountry()            "IE" | "GB" | "US" | … | null
//   currencyFor(country, lang) the country's currency when that language is spoken there (English
//                              is spoken everywhere), else the language's home currency; so the
//                              currency follows the language when the learner changes it
//   languageFor(country, browserLangs, supported)  the first-visit language
//   currentCurrency()          for the page's language now (sent as X-Currency on /api/ requests)
// The server keeps the same list of currencies per language (server/utils/currency.js LANG_CURRENCIES).

const EURO = ["IE", "DE", "FR", "ES", "IT", "NL", "PT", "AT", "BE", "FI", "GR", "LU", "MT", "CY", "SK", "SI", "EE", "LV", "LT", "HR"];
export const COUNTRY_CURRENCY = {
  ...Object.fromEntries(EURO.map((c) => [c, "EUR"])),
  GB: "GBP", US: "USD", CA: "CAD", AU: "AUD", NZ: "NZD", CH: "CHF", LI: "CHF", JP: "JPY", CN: "CNY", KR: "KRW",
  RU: "RUB", TR: "TRY", ID: "IDR", VN: "VND", BR: "BRL", IN: "INR", MX: "MXN",
};
// The site's languages spoken in each country (the first is the country's main one).
export const COUNTRY_LANGS = {
  IE: ["en"], GB: ["en"], US: ["en", "es"], CA: ["en", "fr"], AU: ["en"], NZ: ["en"], IN: ["en"], MT: ["en"], CY: ["en"],
  DE: ["de"], AT: ["de"], LI: ["de"], CH: ["de", "fr", "it"], LU: ["fr", "de"], BE: ["nl", "fr", "de"],
  FR: ["fr"], ES: ["es"], MX: ["es"], IT: ["it"], NL: ["nl"], PT: ["pt"], BR: ["pt"],
  RU: ["ru"], TR: ["tr"], CN: ["zh"], JP: ["ja"], KR: ["ko"], ID: ["id"], VN: ["vi"],
};
// A language's own currency, when the learner's country is not one where it is spoken.
export const LANG_HOME = { en: "EUR", de: "EUR", fr: "EUR", it: "EUR", es: "EUR", nl: "EUR", pt: "EUR", ru: "RUB", tr: "TRY", zh: "CNY", ja: "JPY", ko: "KRW", id: "IDR", vi: "VND" };

const TZ = {
  "Europe/Dublin": "IE", "Europe/London": "GB", "Europe/Belfast": "GB", "Europe/Berlin": "DE", "Europe/Busingen": "DE", "Europe/Vienna": "AT",
  "Europe/Zurich": "CH", "Europe/Vaduz": "LI", "Europe/Paris": "FR", "Europe/Madrid": "ES", "Atlantic/Canary": "ES", "Africa/Ceuta": "ES",
  "Europe/Rome": "IT", "Europe/Amsterdam": "NL", "Europe/Brussels": "BE", "Europe/Luxembourg": "LU", "Europe/Lisbon": "PT", "Atlantic/Azores": "PT",
  "Atlantic/Madeira": "PT", "Europe/Helsinki": "FI", "Europe/Athens": "GR", "Europe/Malta": "MT", "Asia/Nicosia": "CY", "Europe/Nicosia": "CY",
  "Europe/Bratislava": "SK", "Europe/Ljubljana": "SI", "Europe/Tallinn": "EE", "Europe/Riga": "LV", "Europe/Vilnius": "LT", "Europe/Zagreb": "HR",
  "Europe/Moscow": "RU", "Europe/Kaliningrad": "RU", "Europe/Samara": "RU", "Asia/Yekaterinburg": "RU", "Asia/Novosibirsk": "RU", "Asia/Vladivostok": "RU",
  "Europe/Istanbul": "TR", "Asia/Istanbul": "TR", "Asia/Tokyo": "JP", "Asia/Seoul": "KR", "Asia/Shanghai": "CN", "Asia/Chongqing": "CN",
  "Asia/Harbin": "CN", "Asia/Urumqi": "CN", "Asia/Jakarta": "ID", "Asia/Makassar": "ID", "Asia/Jayapura": "ID", "Asia/Pontianak": "ID",
  "Asia/Ho_Chi_Minh": "VN", "Asia/Saigon": "VN", "Asia/Kolkata": "IN", "Asia/Calcutta": "IN", "Pacific/Auckland": "NZ",
  "America/Sao_Paulo": "BR", "America/Bahia": "BR", "America/Fortaleza": "BR", "America/Recife": "BR", "America/Manaus": "BR", "America/Belem": "BR",
  "America/Mexico_City": "MX", "America/Cancun": "MX", "America/Monterrey": "MX", "America/Tijuana": "MX", "America/Merida": "MX", "America/Chihuahua": "MX",
  "America/Toronto": "CA", "America/Vancouver": "CA", "America/Edmonton": "CA", "America/Winnipeg": "CA", "America/Halifax": "CA", "America/St_Johns": "CA",
  "America/Regina": "CA", "America/Montreal": "CA",
  "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US", "America/Los_Angeles": "US", "America/Phoenix": "US", "America/Anchorage": "US",
  "America/Detroit": "US", "America/Boise": "US", "Pacific/Honolulu": "US",
};

/** The country from a time zone, then from a language list's regions ("en-IE"). */
export function countryFrom(timeZone, languages = []) {
  const tz = String(timeZone || "");
  if (TZ[tz]) return TZ[tz];
  if (/^America\/(Indiana|Kentucky|North_Dakota)\//.test(tz)) return "US";
  if (/^Australia\//.test(tz)) return "AU";
  for (const l of languages || []) {
    const region = String(l).split(/[-_]/)[1];
    if (region && /^[A-Za-z]{2}$/.test(region) && COUNTRY_CURRENCY[region.toUpperCase()]) return region.toUpperCase();
  }
  return null;
}

export function currencyFor(country, lang) {
  const base = String(lang || "en").split("-")[0].toLowerCase();
  const own = country && COUNTRY_CURRENCY[country];
  if (own && (base === "en" || (COUNTRY_LANGS[country] || []).includes(base))) return own;
  return LANG_HOME[base] || "EUR";
}

/** First-visit language: one the learner's browser has that is spoken in their country, else the country's own, else the browser's. */
export function languageFor(country, browserLangs = [], supported = []) {
  const ok = (l) => supported.includes(l);
  const bases = (browserLangs || []).map((l) => String(l).split("-")[0].toLowerCase()).filter(ok);
  const spoken = (country && COUNTRY_LANGS[country]) || [];
  const both = bases.find((l) => spoken.includes(l));
  if (both) return both;
  if (spoken[0] && ok(spoken[0])) return spoken[0];
  return bases[0] || null;
}

const zone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ""; } };
const langs = () => (typeof navigator !== "undefined" ? navigator.languages || [navigator.language] : []);
let country;
export function detectCountry() {
  if (country === undefined) country = countryFrom(zone(), langs());
  return country;
}

let pageLang = () => (typeof document !== "undefined" && document.documentElement.lang) || "en";
export function currentCurrency() {
  return currencyFor(detectCountry(), pageLang());
}

/**
 * Sends the learner's currency with every /api/ request (X-Currency), so questions come back with
 * their own money. getLang: the page's language now (the currency follows it when it changes).
 */
export function installRegionHeader(getLang) {
  if (typeof window === "undefined" || window.__learnigoRegion) return;
  window.__learnigoRegion = true;
  if (getLang) pageLang = getLang;
  const original = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url || String(input || "");
    if (!/\/api\//.test(url)) return original(input, init);
    const headers = new Headers(init.headers || (typeof input === "object" && input?.headers) || undefined);
    if (!headers.has("X-Currency")) headers.set("X-Currency", currentCurrency());
    return original(input, { ...init, headers });
  };
}
