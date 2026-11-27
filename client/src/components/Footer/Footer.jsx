import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { FaGlobe, FaShieldAlt, FaFileContract, FaTags, FaBrain, FaGift, FaUsers, FaQuestionCircle, FaEnvelope, FaHome } from "react-icons/fa";
import { useSeo } from "../../seo/useSeo";
import { DEFAULT_LANG, pageFor } from "../../seo/registry";
import { routeLang } from "../../seo/routeLocale";
import PageLink from "../SEO/PageLink";
import { COMPANY } from "../../config/company";
import EmailAddress from "../EmailAddress";
import styles from "./Footer.module.css";

// The game screens (Home, a subject, a question round, the games hubs, the
// student's dashboard, today's discovery, the AI teacher) are one screen each,
// with nothing below the fold, so the footer steps aside there (it would only
// sit hidden behind the fixed screen, its links still reachable by Tab).
// Its links stay one tap away in the navbar's menu and on every content page
// (FAQ, Policy, the guides…), which keep the full footer. About and Contact are
// one screen too (components/OnePage), with their own policy, terms and contact
// links, in every language (/es/about-us…).
const PLAY_PATHS = ["/home", "/games", "/games/ar", "/dashboard", "/discovery", "/ai-teacher", "/together", "/shorts"];
const PLAY_PREFIXES = ["/subject/", "/module/", "/together/"];
const ONE_SCREEN = /^(\/[a-z]{2})?\/(about-us|contact-us)\/?$/;

function isPlayPath(pathname) {
  return PLAY_PATHS.includes(pathname) || PLAY_PREFIXES.some((p) => pathname.startsWith(p)) || ONE_SCREEN.test(pathname);
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
          {/* Help at home is English only until it is translated (seo/registry.js). */}
          {pageFor("/help-at-home").langs.includes(routeLang || DEFAULT_LANG) && (
            <Link to="/help-at-home" className={styles.link}>
              <FaHome className={styles.icon} />
              {seo.ui?.nav?.questions}
            </Link>
          )}
          <Link to="/faq" className={styles.link}>
            <FaQuestionCircle className={styles.icon} />
            {seo.ui?.nav?.faq}
          </Link>
        </nav>
        <nav className={styles.links}>
          <PageLink to="/learning-support-by-country" className={styles.link}>
            <FaGlobe className={styles.icon} />
            {t("footer.learningSupport", { defaultValue: "Learning Support" })}
          </PageLink>
          <PageLink to="/pricing" className={styles.link}>
            <FaTags className={styles.icon} />
            {t("footer.pricing", { defaultValue: "Plans" })}
          </PageLink>
          <PageLink to="/policy" className={styles.link}>
            <FaShieldAlt className={styles.icon} />
            {t("navbar.policy", { defaultValue: "Policy" })}
          </PageLink>
          <PageLink to="/terms-and-conditions" className={styles.link}>
            <FaFileContract className={styles.icon} />
            {t("navbar.terms", { defaultValue: "T & C" })}
          </PageLink>
        </nav>

        <p className={styles.copyright}>
          © {new Date().getFullYear()} Learnigo. {t("footer.rights", { defaultValue: "All rights reserved." })}
        </p>

        {/* How to write to us (config/company.js). */}
        <div className={styles.company}>
          <span className={styles.mails}>
            <a href={`mailto:${COMPANY.emails.info}`} className={styles.link}>
              <FaEnvelope className={styles.icon} aria-hidden="true" /> <EmailAddress email={COMPANY.emails.info} />
            </a>
            <a href={`mailto:${COMPANY.emails.solutions}`} className={styles.link}>
              <FaEnvelope className={styles.icon} aria-hidden="true" /> <EmailAddress email={COMPANY.emails.solutions} />
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
