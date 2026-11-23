import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_LANG, mergeSeo } from './registry'
import { routeLang } from './routeLocale'

/**
 * The public pages' copy (public/locales/<lang>/seo.json) in the language
 * shown, with English filling any gaps, plus the URL's language (for links).
 */
export function useSeo() {
  const { i18n } = useTranslation('seo')
  const lang = i18n.resolvedLanguage || DEFAULT_LANG
  const seo = useMemo(
    () => mergeSeo(i18n.getResourceBundle(DEFAULT_LANG, 'seo') || {}, lang === DEFAULT_LANG ? {} : i18n.getResourceBundle(lang, 'seo')),
    [i18n, lang],
  )
  return { seo, lang, linkLang: routeLang || DEFAULT_LANG }
}
