// The speech (BCP 47) tag for each language the site offers. Every
// supported language is listed, so no language silently falls back to an
// English voice reading foreign words (or the other way round).
const SPEECH_LANG_MAP = {
  en: 'en-US', es: 'es-ES', pt: 'pt-BR', fr: 'fr-FR', it: 'it-IT', de: 'de-DE',
  nl: 'nl-NL', ru: 'ru-RU', tr: 'tr-TR', zh: 'zh-CN', ja: 'ja-JP',
  ko: 'ko-KR', id: 'id-ID', vi: 'vi-VN', he: 'he-IL', ar: 'ar-SA', hi: 'hi-IN',
  pl: 'pl-PL', sv: 'sv-SE', da: 'da-DK', fi: 'fi-FI', el: 'el-GR', uk: 'uk-UA',
  cs: 'cs-CZ', ro: 'ro-RO', hu: 'hu-HU', bg: 'bg-BG', hr: 'hr-HR', sk: 'sk-SK',
}

/** 'de' or 'de-AT' -> 'de-DE' style tag; unknown languages -> English. */
export const getSpeechLang = (lang) => {
  const code = String(lang || 'en').trim()
  if (SPEECH_LANG_MAP[code]) return SPEECH_LANG_MAP[code]
  const base = code.split(/[-_]/)[0].toLowerCase()
  if (code.includes('-') && SPEECH_LANG_MAP[base]) return `${base}-${code.split(/[-_]/)[1].toUpperCase()}`
  return SPEECH_LANG_MAP[base] || 'en-US'
}
