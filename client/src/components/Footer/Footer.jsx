import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { FaGlobe, FaShieldAlt, FaFileContract, FaTags, FaBrain, FaGift, FaUsers, FaQuestionCircle } from "react-icons/fa";
import { useSeo } from "../../seo/useSeo";
import styles from "./Footer.module.css";

// The game screens (Home, a subject, a question round, the games hubs, the
// student's dashboard, today's discovery, the AI teacher) are one screen each,
// with nothing below the fold, so the footer steps aside there (it would only
// sit hidden behind the fixed screen, its links still reachable by Tab).
// Its links stay one tap away in the navbar's menu and on every content page
// (About, Contact, FAQ, Policy…), which keep the full footer.
const PLAY_PATHS = ["/home", "/games", "/games/ar", "/dashboard", "/discovery", "/ai-teacher"];
const PLAY_PREFIXES = ["/subject/", "/module/"];

function isPlayPath(pathname) {
  return PLAY_PATHS.includes(pathname) || PLAY_PREFIXES.some((p) => pathname.startsWith(p));
}

const Footer = () => {
  const { t } = useTranslation();
  const { seo } = useSeo();
  const { pathname } = useLocation();

  if (isPlayPath(pathname)) return null;

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* The guide hubs: every content page links into the guides (seo/registry.js). */}
        <nav className={styles.links} aria-label={seo.ui?.footer?.more}>
          <Link to="/learning-differences" className={styles.link}>
            <FaBrain className={styles.icon} />
            {seo.ui?.nav?.differences}
          </Link>
          <Link to="/learning-tools" className={styles.link}>
            <FaGift className={styles.icon} />
            {seo.ui?.nav?.tools}
          </Link>
          <Link to="/who-we-help" className={styles.link}>
            <FaUsers className={styles.icon} />
            {seo.ui?.nav?.audiences}
          </Link>
          <Link to="/faq" className={styles.link}>
            <FaQuestionCircle className={styles.icon} />
            {seo.ui?.nav?.faq}
          </Link>
        </nav>
        <nav className={styles.links}>
          <Link to="/learning-support-by-country" className={styles.link}>
            <FaGlobe className={styles.icon} />
            {t("footer.learningSupport", { defaultValue: "Learning Support" })}
          </Link>
          <Link to="/pricing" className={styles.link}>
            <FaTags className={styles.icon} />
            {t("footer.pricing", { defaultValue: "Plans" })}
          </Link>
          <Link to="/policy" className={styles.link}>
            <FaShieldAlt className={styles.icon} />
            {t("navbar.policy", { defaultValue: "Policy" })}
          </Link>
          <Link to="/terms-and-conditions" className={styles.link}>
            <FaFileContract className={styles.icon} />
            {t("navbar.terms", { defaultValue: "T & C" })}
          </Link>
        </nav>

        <p className={styles.copyright}>
          © {new Date().getFullYear()} Learnigo. {t("footer.rights", { defaultValue: "All rights reserved." })}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
