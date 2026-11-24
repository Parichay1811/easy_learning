import { useTranslation, Trans } from "react-i18next";
import { FaClock, FaSmileBeam, FaHeadset, FaEnvelope, FaSchool, FaPaperPlane } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import ContactForm from "../components/ContactForm/ContactForm";
import SEO from "../components/SEO/SEO";
import OnePage from "../components/OnePage/OnePage";
import s from "../components/OnePage/OnePage.module.css";
import { COMPANY } from "../config/company";
import EmailAddress from "../components/EmailAddress";
import { useSeo } from "../seo/useSeo";

// Contact, as one screen in the site's game style (components/OnePage): the puppy
// says hello; the message form on one side; how we answer and the two addresses
// (config/company.js) on the other. On a phone the two are tabs, the form first.

const reassurances = [
  { key: "support", icon: FaHeadset, tone: "purple" },
  { key: "quick", icon: FaClock, tone: "blue" },
  { key: "noQuestion", icon: FaSmileBeam, tone: "green" },
];

const ContactUs = () => {
  const { user } = useAuth() || {};
  const { t } = useTranslation();
  const { seo } = useSeo();
  const nav = seo?.ui?.nav || {};

  const email = (
    <>
      {/* The two addresses first: they are why this tab is opened. */}
      <h3 className={s.rowTitle}>{t("contactUs.mail.title", "Write to us")}</h3>
      <div className={s.mails}>
        <a className={s.mail} href={`mailto:${COMPANY.emails.info}`}>
          <span className={s.mailIcon} aria-hidden="true"><FaEnvelope /></span>
          <span className={s.mailText}>
            <span className={s.mailFor}>{t("contactUs.mail.info", "Questions, help and feedback")}</span>
            <span className={s.mailAddr}><EmailAddress email={COMPANY.emails.info} /></span>
          </span>
        </a>
        <a className={s.mail} href={`mailto:${COMPANY.emails.solutions}`}>
          <span className={s.mailIcon} aria-hidden="true"><FaSchool /></span>
          <span className={s.mailText}>
            <span className={s.mailFor}>{t("contactUs.mail.solutions", "Schools, organisations and partnerships")}</span>
            <span className={s.mailAddr}><EmailAddress email={COMPANY.emails.solutions} /></span>
          </span>
        </a>
      </div>
      <ul className={s.rows}>
        {reassurances.map((r) => (
          <li key={r.key} className={s.row}>
            <span className={`${s.rowIcon} ${s[r.tone]}`} aria-hidden="true"><r.icon /></span>
            <div>
              <h3 className={s.rowTitle}>{t(`contactUs.reassurances.${r.key}.title`)}</h3>
              <p className={s.rowText}>{t(`contactUs.reassurances.${r.key}.text`)}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className={`${s.p} ${s.onlyNarrow}`}>{t("contactUs.heroSubtitle")}</p>
      <p className={s.inlineLinks}>
        <Trans
          i18nKey="contactUs.mail.madeBy"
          defaults="Learnigo is made by <co>{{company}}</co>."
          values={{ company: COMPANY.name }}
          components={{ co: <a href={COMPANY.url} target="_blank" rel="noopener noreferrer" /> }}
        />
        {" "}<span className={s.dot} aria-hidden="true">·</span>{" "}<a href="/faq">{nav.faq || "FAQ"}</a>
        {" "}<span className={s.dot} aria-hidden="true">·</span>{" "}<a href="/policy">{t("navbar.policy", "Policy")}</a>
        {" "}<span className={s.dot} aria-hidden="true">·</span>{" "}<a href="/terms-and-conditions">{t("navbar.terms", "T & C")}</a>
      </p>
    </>
  );

  return (
    <>
      <SEO path="/contact-us" />
      <OnePage
        layout="contact"
        icon={<FaEnvelope />}
        tone="blue"
        title={t("navbar.contact", "Contact Us")}
        subtitle={t("contactUs.badge")}
        greetTitle={t("contactUs.heroTitle")}
        greetText={t("contactUs.heroSubtitle")}
        greetExtra={(
          <p className={`${s.bubbleText} ${s.onlyWide}`}>
            {t("contactUs.faqLine", "Looking for a quick answer? Check our")}{" "}
            <a href="/faq" className={s.bubbleLink}>{nav.faq || "FAQ"}</a>.
          </p>
        )}
        mood="wave"
        tabsLabel={t("contactUs.tabs.label", "Ways to reach us")}
        sections={[
          {
            id: "message",
            label: t("contactUs.tabs.message", "Message"),
            icon: <FaPaperPlane />,
            heading: t("contactForm.sendMessage", "Send a message"),
            content: <ContactForm dense defaultName={user?.name || ""} defaultEmail={user?.email || ""} />,
          },
          { id: "email", label: t("contactUs.tabs.email", "Email us"), icon: <FaEnvelope />, heading: t("contactUs.badge"), content: email },
        ]}
      />
    </>
  );
};

export default ContactUs;
