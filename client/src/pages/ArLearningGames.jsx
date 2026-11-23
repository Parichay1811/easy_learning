import { Link } from "react-router-dom";
import SEO from "../components/SEO/SEO";
import ExploreLinks from "../components/SEO/ExploreLinks";
import { useSeo } from "../seo/useSeo";
import styles from "./GuidePages.module.css";

const pageUrl = "/ar-learning-games";

// Copy in public/locales/<lang>/seo.json (arGames), in 14 languages.
export default function ArLearningGames() {
  const { seo } = useSeo();
  const ar = seo.arGames || {};
  return (
    <main className={styles.page}>
      <SEO path={pageUrl} />
      <header className={styles.hero}>
        <span className={styles.eyebrow}>{ar.eyebrow}</span>
        <h1>{ar.h1}</h1>
        <p>{ar.lead}</p>
      </header>
      <section className={styles.intro}>
        <h2>{ar.howTitle}</h2>
        <p>{ar.how}</p>
      </section>
      <section className={styles.grid} aria-label={ar.gridLabel}>
        {(ar.groups || []).map((g) => (
          <article key={g.code} className={styles.card}>
            <span className={styles.code}>{g.code}</span>
            <h2>{g.name}</h2>
            <p>{g.blurb}</p>
          </article>
        ))}
      </section>
      <section className={styles.content} style={{ marginTop: 28 }}>
        <h2>{ar.domainsTitle}</h2>
        <p>{ar.domains}</p>
        <aside className={styles.note}>
          <strong>{ar.noteTitle}</strong>
          <p>{seo.ui?.note}</p>
        </aside>
        <Link to="/who-we-help/therapists" className={styles.cta} style={{ display: "block", marginTop: 8 }}>{seo.ui?.cta?.therapists} <span aria-hidden="true">-&gt;</span></Link>
        <Link to="/games" className={styles.cta}>{seo.ui?.cta?.games} <span aria-hidden="true">-&gt;</span></Link>
      </section>
      <ExploreLinks path={pageUrl} />
    </main>
  );
}
