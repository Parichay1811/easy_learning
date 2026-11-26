import { FaCheck } from "react-icons/fa";
import PageLink from "../SEO/PageLink";
import { crumbName, pageFor, pageMeta } from "../../seo/registry";
import { useSeo } from "../../seo/useSeo";
import styles from "./StartAbout.module.css";

// The guides and the main parts of the app, each with a line on what it is.
const CARDS = [
  { path: "/learning-differences", text: (seo) => seo.guides?.differences?.lead },
  { path: "/learning-tools", text: (seo) => seo.guides?.tools?.lead },
  { path: "/who-we-help", text: (seo) => seo.guides?.audiences?.lead },
  { path: "/ai-teacher", text: (seo) => pageMeta(seo, "/ai-teacher")?.description },
  { path: "/games", text: (seo) => pageMeta(seo, "/games")?.description },
  { path: "/faq", text: (seo) => pageMeta(seo, "/faq")?.description },
];

const MORE = [
  ["/about-us", "about"],
  ["/contact-us", "contact"],
  ["/pricing", "pricing"],
  ["/learning-support-by-country", "countries"],
  ["/policy", "privacy"],
  ["/terms-and-conditions", "terms"],
];

/**
 * Under the sign-in cards of the start page ("/", "/es/"…): what Learnigo is,
 * and the way into the guides and the app. The first screen stays the sign-in
 * choice; this is the start page's words for a visitor who scrolls, and for
 * search engines, which otherwise find only "choose how you want to sign in"
 * on the site's most important page and no links onward. The words are the
 * start page's own (public/locales/<lang>/seo.json, pages["/"]), in every
 * language.
 */
export default function StartAbout() {
  const { seo } = useSeo();
  const meta = pageMeta(seo, "/") || {};
  const footer = seo.ui?.footer || {};

  return (
    <div className={styles.wrap}>
      <section className={styles.panel} aria-labelledby="start-about-title">
        <h2 id="start-about-title" className={styles.title}>{meta.h1}</h2>
        <p className={styles.lead}>{meta.lead}</p>
        {meta.points?.length > 0 && (
          <ul className={styles.points}>
            {meta.points.map((line) => (
              <li key={line}>
                <FaCheck className={styles.tick} aria-hidden="true" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className={styles.panel} aria-labelledby="start-explore-title">
        <h2 id="start-explore-title" className={styles.title}>{seo.ui?.explore}</h2>
        <ul className={styles.cards}>
          {CARDS.map(({ path, text }) => {
            const page = pageFor(path);
            return (
              <li key={path}>
                <PageLink to={path} className={styles.card}>
                  <strong className={styles.cardName}>
                    {crumbName(seo, page)}{" "}<span aria-hidden="true">→</span>
                  </strong>
                  <span className={styles.cardText}>{text(seo)}</span>
                </PageLink>
              </li>
            );
          })}
        </ul>
        <p className={styles.more}>
          {MORE.map(([path, key], i) => (
            <span key={path}>
              {i > 0 && <span className={styles.dot} aria-hidden="true"> · </span>}
              <PageLink to={path} className={styles.moreLink}>{footer[key]}</PageLink>
            </span>
          ))}
        </p>
      </nav>
    </div>
  );
}
