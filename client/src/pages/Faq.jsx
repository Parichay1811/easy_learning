import VideoBackground from "../components/VideoBackground/VideoBackground";
import { Link } from "react-router-dom";
import SEO from "../components/SEO/SEO";
import ExploreLinks from "../components/SEO/ExploreLinks";
import { useSeo } from "../seo/useSeo";
import styles from "./Faq.module.css";

// The questions live in public/locales/<lang>/seo.json (faq), in 14 languages;
// the FAQPage JSON-LD is built from the same list (seo/registry.js).
const Faq = () => {
  const { seo } = useSeo();
  const faq = seo.faq || {};
  return (
    <div className={styles.page}>
      <SEO path="/faq" />
      <VideoBackground />

      <div className={styles.hero}>
        <span className={styles.badge}>{faq.badge}</span>
        <h1 className={styles.title}>{faq.h1}</h1>
        <p className={styles.subtitle}>{faq.lead}</p>
      </div>

      <div className={styles.panel}>
        {(faq.items || []).map((item) => (
          <details key={item.q} className={styles.item}>
            <summary className={styles.question}>{item.q}</summary>
            <p className={styles.answer}>{item.a}</p>
          </details>
        ))}
      </div>

      <p className={styles.footerNote}>
        {faq.more} <Link to="/contact-us" className={styles.link}>{faq.contact}</Link> — {faq.reply}
      </p>
      <ExploreLinks path="/faq" />
    </div>
  );
};

export default Faq;
