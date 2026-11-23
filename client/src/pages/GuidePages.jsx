import { Link, useParams } from "react-router-dom";
import SEO from "../components/SEO/SEO";
import ExploreLinks from "../components/SEO/ExploreLinks";
import { GUIDES, fill, guideHeading } from "../seo/registry";
import { useSeo } from "../seo/useSeo";
import styles from "./GuidePages.module.css";

/**
 * The guide collections: learning differences, learning tools and gift ideas,
 * who we help, and learning support by country. Each has an index page and one
 * page per item; the structure is in src/seo/registry.js and the words (in 14
 * languages) in public/locales/<lang>/seo.json under guides.<guide>.
 */
export default function GuidePages({ guide }) {
  const { slug } = useParams();
  const { seo } = useSeo();
  const g = seo.guides?.[guide] || {};
  const { root, items } = GUIDES[guide];

  if (slug) {
    const entry = items.find((it) => it.slug === slug);
    const item = entry && g.items?.[slug];
    if (!item) {
      return (
        <main className={styles.page}>
          <SEO title={g.notFound} description={g.lead} path={`${root}/${slug}`} noIndex />
          <h1>{g.notFound}</h1>
          <Link to={root} className={styles.link}>{g.browse}</Link>
        </main>
      );
    }
    const path = `${root}/${slug}`;
    return (
      <main className={styles.page}>
        <SEO path={path} type="article" />
        <Link to={root} className={styles.backLink}>&lt;- {g.back}</Link>
        <header className={styles.hero}>
          <span className={styles.eyebrow}>{fill(g.itemEyebrow, { code: entry.code, name: item.name })}</span>
          <h1>{guideHeading(g, item)}</h1>
          <p>{item.issue}</p>
        </header>
        <section className={styles.content}>
          <h2>{g.contextTitle}</h2>
          <p>{item.context}</p>
          <h2>{g.approachTitle}</h2>
          <ul>{item.approach?.map((line) => <li key={line}>{line}</li>)}</ul>
          <aside className={styles.note}>
            <strong>{fill(g.noteTitle, { name: item.name })}</strong>
            <p>{item.note || g.note || seo.ui?.note}</p>
          </aside>
          <Link to="/" className={styles.cta}>{seo.ui?.openApp} <span aria-hidden="true">-&gt;</span></Link>
        </section>
        <ExploreLinks path={path} />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <SEO path={root} />
      <header className={styles.hero}>
        <span className={styles.eyebrow}>{g.eyebrow}</span>
        <h1>{g.h1}</h1>
        <p>{g.lead}</p>
      </header>
      <section className={styles.intro}>
        <h2>{g.introTitle}</h2>
        <p>{g.intro}</p>
      </section>
      <section className={styles.grid} aria-label={g.gridLabel}>
        {items.map((entry) => {
          const item = g.items?.[entry.slug];
          if (!item) return null;
          return (
            <article key={entry.slug} className={styles.card}>
              <span className={styles.code}>{entry.code}</span>
              <h2>{item.name}</h2>
              <p>{item.issue}</p>
              <Link to={`${root}/${entry.slug}`} className={styles.link}>
                {fill(g.cardLink, { name: item.name })} <span aria-hidden="true">-&gt;</span>
              </Link>
            </article>
          );
        })}
      </section>
      <ExploreLinks path={root} />
    </main>
  );
}
