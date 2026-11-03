import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FaGlobe, FaShieldAlt, FaFileContract } from "react-icons/fa";
import styles from "./Footer.module.css";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <nav className={styles.links}>
          <Link to="/learning-support-by-country" className={styles.link}>
            <FaGlobe className={styles.icon} />
            {t("footer.learningSupport", { defaultValue: "Learning Support" })}
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
