import { Link } from "react-router-dom";
import { crumbName, relatedPages } from "../../seo/registry";
import { useSeo } from "../../seo/useSeo";
import styles from "../../pages/GuidePages.module.css";

/**
 * "Keep exploring": links from this page to the related guides and app pages
 * (the link graph in seo/registry.js), in the URL's language. The build writes
 * the same links into the page's static HTML.
 */
export default function ExploreLinks({ path }) {
  const { seo, linkLang } = useSeo();
  const links = relatedPages(path, linkLang);
  if (!links.length) return null;
  return (
    <nav className={styles.explore} aria-label={seo.ui?.explore}>
      <h2>{seo.ui?.explore}</h2>
      <ul className={styles.exploreList}>
        {links.map((p) => (
          <li key={p.path}>
            <Link to={p.path}>{crumbName(seo, p)}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
