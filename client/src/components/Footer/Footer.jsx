import { useTranslation, Trans } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { FaGlobe, FaShieldAlt, FaFileContract, FaTags, FaEnvelope } from "react-icons/fa";
import { COMPANY } from "../../config/company";
import EmailAddress from "../EmailAddress";
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
  const { pathname } = useLocation();

  if (isPlayPath(pathname)) return null;

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
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
          © {new Date().getFullYear()} {COMPANY.name}. {t("footer.rights", { defaultValue: "All rights reserved." })}
        </p>

        {/* Who makes Learnigo, and how to write to them (config/company.js). */}
        <div className={styles.company}>
          <span className={styles.madeBy}>
            <Trans
              i18nKey="footer.productOf"
              defaults="Learnigo is a product of <co>{{company}}</co>"
              values={{ company: COMPANY.name }}
              components={{ co: <a href={COMPANY.url} target="_blank" rel="noopener noreferrer" className={styles.companyLink} /> }}
            />
          </span>
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
