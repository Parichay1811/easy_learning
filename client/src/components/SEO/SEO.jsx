import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_LANG,
  LANGUAGES,
  SITE_URL,
  absoluteUrl,
  mergeSeo,
  normalizePath,
  pageFor,
  pageGraph,
  pageMeta,
} from "../../seo/registry";
import { routeLang } from "../../seo/routeLocale";

const DEFAULT_TITLE = "Learnigo | Learning Games & AI Teacher for Every Child";
const DEFAULT_DESCRIPTION = "Free learning games in 14 languages and an AI teacher for every child: reading, maths and science read aloud, designed with dyslexia and ADHD in mind.";
const DEFAULT_ROBOTS = "index, follow, max-image-preview:large";

function upsertMeta(attribute, value, content) {
  let element = document.head.querySelector(`meta[${attribute}="${value}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setCanonical(href) {
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", href);
}

// hreflang links: the build writes them into each page's HTML; this keeps them
// right as the app moves between pages.
function setAlternates(links) {
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
  for (const { hreflang, href } of links) {
    const link = document.createElement("link");
    link.rel = "alternate";
    link.hreflang = hreflang;
    link.href = href;
    document.head.appendChild(link);
  }
}

function setSchema(data) {
  let script = document.head.querySelector("script[data-learnigo-schema]");
  if (!data) {
    script?.remove();
    return;
  }
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.learnigoSchema = "true";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

/**
 * Sets the page's title, description, canonical URL, hreflang links, Open
 * Graph tags and JSON-LD.
 *
 * Public pages pass only `path`: their words come from public/locales/<lang>/
 * seo.json and their languages from src/seo/registry.js (the build writes the
 * same tags into each page's static HTML). Other pages pass title and
 * description themselves.
 */
export default function SEO({ title, description, path = "/", type = "website", structuredData, noIndex = false }) {
  const { i18n } = useTranslation("seo");
  const display = i18n.resolvedLanguage || DEFAULT_LANG;

  useEffect(() => {
    const page = pageFor(path);
    const canonicalPath = page ? page.path : normalizePath(path);
    const langs = page ? page.langs : [DEFAULT_LANG];
    // The URL's language decides the canonical; the language shown decides the words.
    const urlLang = routeLang && langs.includes(routeLang) ? routeLang : DEFAULT_LANG;
    const lang = langs.includes(display) ? display : DEFAULT_LANG;
    const seo = mergeSeo(i18n.getResourceBundle(DEFAULT_LANG, "seo") || {}, lang === DEFAULT_LANG ? {} : i18n.getResourceBundle(lang, "seo"));
    const meta = pageMeta(seo, canonicalPath) || {};
    const pageTitle = title || meta.title || DEFAULT_TITLE;
    const pageDescription = description || meta.description || DEFAULT_DESCRIPTION;
    const canonicalUrl = absoluteUrl(canonicalPath, urlLang);
    // A public page at a language URL it is not published in (/es/pricing): the
    // app draws it, but only the page's own URLs are for search engines.
    const strayLang = Boolean(page && routeLang && !langs.includes(routeLang));

    document.title = pageTitle;
    upsertMeta("name", "description", pageDescription);
    upsertMeta("name", "robots", noIndex ? "noindex, nofollow" : strayLang ? "noindex, follow" : DEFAULT_ROBOTS);
    upsertMeta("property", "og:title", pageTitle);
    upsertMeta("property", "og:description", pageDescription);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:locale", LANGUAGES.find((l) => l.code === urlLang)?.ogLocale || "en_US");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", pageTitle);
    upsertMeta("name", "twitter:description", pageDescription);
    if (noIndex) {
      // Not a page to index (a 404, an unknown guide): no canonical, which would
      // point search engines at a URL that is not a page either.
      document.head.querySelector('link[rel="canonical"]')?.remove();
      setAlternates([]);
      setSchema(null);
    } else {
      setCanonical(canonicalUrl);
      setAlternates(
        langs.length > 1
          ? [
              ...langs.map((l) => ({ hreflang: l, href: absoluteUrl(canonicalPath, l) })),
              { hreflang: "x-default", href: absoluteUrl(canonicalPath, DEFAULT_LANG) },
            ]
          : [],
      );
      setSchema(
        structuredData ||
          (page
            ? pageGraph(seo, canonicalPath, lang)
            : {
                "@context": "https://schema.org",
                "@type": "WebPage",
                name: pageTitle,
                description: pageDescription,
                url: canonicalUrl,
                isPartOf: { "@id": `${SITE_URL}/#website` },
              }),
      );
    }

    return () => {
      document.head.querySelector('link[rel="canonical"]')?.remove();
      setAlternates([]);
      setSchema(null);
      document.title = DEFAULT_TITLE;
      upsertMeta("name", "description", DEFAULT_DESCRIPTION);
      upsertMeta("name", "robots", DEFAULT_ROBOTS);
      upsertMeta("property", "og:title", DEFAULT_TITLE);
      upsertMeta("property", "og:description", DEFAULT_DESCRIPTION);
      upsertMeta("name", "twitter:title", DEFAULT_TITLE);
      upsertMeta("name", "twitter:description", DEFAULT_DESCRIPTION);
    };
  }, [description, path, structuredData, title, type, noIndex, display, i18n]);

  return null;
}

export { SITE_URL };
