import * as FramerMotion from "framer-motion";
import { useTranslation, Trans } from "react-i18next";
import { MdSupportAgent } from "react-icons/md";
import { FaClock, FaSmileBeam, FaHeadset, FaEnvelope, FaSchool } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import VideoBackground from "../components/VideoBackground/VideoBackground";
import ContactForm from "../components/ContactForm/ContactForm";
import SEO from "../components/SEO/SEO";
import { COMPANY, companyOrganization } from "../config/company";
import EmailAddress from "../components/EmailAddress";
import styles from "./ContactUs.module.css";

// eslint-disable-next-line no-unused-vars -- used via <motion.*> JSX tags, which no-unused-vars doesn't track
const { motion } = FramerMotion;

const reassurances = [
  { key: "support", color: "purple", icon: FaHeadset },
  { key: "quick", color: "blue", icon: FaClock },
  { key: "noQuestion", color: "green", icon: FaSmileBeam },
];

const ContactUs = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <SEO
        title="Contact Learnigo | We're Here to Help"
        description="Questions, feedback or a bug to report? Get in touch with the Learnigo team and we'll usually reply within 24 hours."
        path="/contact-us"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact Learnigo",
          url: "https://www.learnigo.eu/contact-us",
          isPartOf: { "@type": "WebSite", name: "Learnigo", url: "https://www.learnigo.eu" },
          mainEntity: companyOrganization(),
        }}
      />
      <VideoBackground />

      <motion.section
        className={styles.hero}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className={styles.badge}><MdSupportAgent /> {t("contactUs.badge")}</span>
        <h1 className={styles.heroTitle}>{t("contactUs.heroTitle")}</h1>
        <p className={styles.heroSubtitle}>
          {t("contactUs.heroSubtitle")} Looking for a quick answer? Check our{" "}
          <a href="/faq" className={styles.faqLink}>FAQ</a>.
        </p>
      </motion.section>

      <motion.div
        className={styles.reassurances}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
        {reassurances.map((r) => (
          <div key={r.key} className={`${styles.reassureCard} ${styles[r.color]}`}>
            <span className={styles.reassureIconWrap}><r.icon className={styles.reassureIcon} /></span>
            <div>
              <h3>{t(`contactUs.reassurances.${r.key}.title`)}</h3>
              <p>{t(`contactUs.reassurances.${r.key}.text`)}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Write to us: two addresses, each saying what it is for (Learnigo is made by Futuresight Analytics). */}
      <motion.section
        className={styles.mailSection}
        aria-labelledby="contact-mail-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.11 }}
      >
        <h2 id="contact-mail-title" className={styles.mailTitle}>{t("contactUs.mail.title", "Write to us")}</h2>
        <div className={styles.mailCards}>
          <a className={styles.mailCard} href={`mailto:${COMPANY.emails.info}`}>
            <span className={styles.mailIcon} aria-hidden="true"><FaEnvelope /></span>
            <span className={styles.mailText}>
              <span className={styles.mailFor}>{t("contactUs.mail.info", "Questions, help and feedback")}</span>
              <span className={styles.mailAddr}><EmailAddress email={COMPANY.emails.info} /></span>
            </span>
          </a>
          <a className={styles.mailCard} href={`mailto:${COMPANY.emails.solutions}`}>
            <span className={styles.mailIcon} aria-hidden="true"><FaSchool /></span>
            <span className={styles.mailText}>
              <span className={styles.mailFor}>{t("contactUs.mail.solutions", "Schools, organisations and partnerships")}</span>
              <span className={styles.mailAddr}><EmailAddress email={COMPANY.emails.solutions} /></span>
            </span>
          </a>
        </div>
        <p className={styles.madeBy}>
          <Trans
            i18nKey="contactUs.mail.madeBy"
            defaults="Learnigo is made by <co>{{company}}</co>."
            values={{ company: COMPANY.name }}
            components={{ co: <a href={COMPANY.url} target="_blank" rel="noopener noreferrer" className={styles.madeByLink} /> }}
          />
        </p>
      </motion.section>

      <motion.div
        className={styles.panel}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.14 }}
      >
        <ContactForm defaultName={user?.name || ""} defaultEmail={user?.email || ""} />
      </motion.div>
    </div>
  );
};

export default ContactUs;
