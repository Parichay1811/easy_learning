import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Languages that require RTL (right-to-left) text direction
export const RTL_LANGUAGES = ['he'];

// All supported language codes
export const SUPPORTED_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'zh', 'ja', 'ru', 'pt',
  'it', 'ko', 'tr', 'nl', 'id', 'vi',
];

i18n
  .use(Backend)           // loads translations lazily via HTTP from /public/locales/
  .use(LanguageDetector)  // detects browser language automatically on first visit
  .use(initReactI18next)  // binds i18next to React
  .init({
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    debug: false,

    interpolation: {
      escapeValue: false, // React already protects against XSS
    },

    // "translation": the app's interface. "seo": the public pages' copy
    // (guides, FAQ, page titles; see src/seo/registry.js), loaded up front with
    // it so those pages never wait on a second request.
    ns: ['translation', 'seo'],
    defaultNS: 'translation',

    backend: {
      // /public/locales/<lang>/<namespace>.json
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    detection: {
      // Priority order: the URL's language prefix (/es/...) → persisted choice
      // → browser language → html lang attr. A first path segment that is not
      // a language (/games) is skipped.
      order: ['path', 'localStorage', 'navigator', 'htmlTag'],
      lookupFromPathIndex: 0,
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    react: {
      useSuspense: true, // enables lazy loading via React Suspense
    },
  });

// Apply dir="rtl/ltr" and lang="<code>" to <html> on every language change
i18n.on('languageChanged', (lng) => {
  const isRTL = RTL_LANGUAGES.includes(lng);
  document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lng);
});

export default i18n;
