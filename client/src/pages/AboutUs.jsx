import { Link, useNavigate } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import {
  FaBook, FaCalculator, FaMicroscope, FaHeart, FaStar, FaShieldAlt, FaGlobeAmericas, FaChartLine,
  FaArrowRight, FaEnvelope, FaUsers, FaSchool, FaBookOpen,
} from "react-icons/fa";
import SEO from "../components/SEO/SEO";
import OnePage from "../components/OnePage/OnePage";
import s from "../components/OnePage/OnePage.module.css";
import { COMPANY } from "../config/company";
import EmailAddress from "../components/EmailAddress";
import { useSeo } from "../seo/useSeo";
import { playSlide } from "../utils/sounds";

// About Learnigo, as one screen in the site's game style (components/OnePage):
// the puppy says what Learnigo is; three cards (our story, the worlds, what we
// care about) and a strip about who makes it. On a phone the four are tabs.

const worlds = [
  { key: "english", color: "purple", icon: FaBook },
  { key: "maths", color: "blue", icon: FaCalculator },
  { key: "science", color: "green", icon: FaMicroscope },
];

const values = [
  { key: "care", icon: FaHeart, tone: "pink" },
  { key: "playful", icon: FaStar, tone: "" },
  { key: "safe", icon: FaShieldAlt, tone: "green" },
  { key: "language", icon: FaGlobeAmericas, tone: "blue" },
  { key: "progress", icon: FaChartLine, tone: "purple" },
];

const AboutUs = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { seo } = useSeo();
  const nav = seo?.ui?.nav || {};

  const start = () => {
    playSlide();
    setTimeout(() => navigate("/home"), 300);
  };

  const story = (
    <>
      <p className={`${s.p} ${s.onlyNarrow}`}>{t("aboutUs.heroSubtitle")}</p>
      <p className={s.p}>{t("aboutUs.paragraph")}</p>
      <button type="button" className={s.cta} onClick={start} data-companion-guide data-companion-look data-sound="none">
        {t("aboutUs.startAdventure")} <FaArrowRight aria-hidden="true" />
      </button>
      {/* Who Learnigo is for, every feature and the curriculum map (content v5). */}
      <Link to="/about-us/why-learnigo" className={s.whyLink}>{seo.why?.aboutLink || "Why Learnigo: who it is for and every feature"} <FaArrowRight aria-hidden="true" /></Link>
    </>
  );

  const worldTiles = (
    <div className={s.tiles}>
      {worlds.map((w) => (
        <div key={w.key} className={`${s.tile} ${s[w.color]}`}>
          <span className={s.tileIcon} aria-hidden="true"><w.icon /></span>
          <div>
            <h3 className={s.tileTitle}>{t(`aboutUs.worlds.${w.key}.title`)}</h3>
            <p className={s.tileText}>{t(`aboutUs.worlds.${w.key}.text`)}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const valueRows = (
    <ul className={s.rows}>
      {values.map((v) => (
        <li key={v.key} className={s.row}>
          <span className={`${s.rowIcon} ${v.tone ? s[v.tone] : ""}`} aria-hidden="true"><v.icon /></span>
          <div>
            <h3 className={s.rowTitle}>{t(`aboutUs.values.${v.key}.title`)}</h3>
            <p className={s.rowText}>{t(`aboutUs.values.${v.key}.text`)}</p>
          </div>
        </li>
      ))}
    </ul>
  );

  // Who supports Learnigo (config/company.js), how to write to us, and the small print.
  // This is the only place on the site that names the company.
  const team = (
    <>
      <p className={`${s.p} ${s.teamText}`}>
        <Trans
          i18nKey="aboutUs.supportedBy.text"
          defaults="Supported by <co>{{company}}</co>"
          values={{ company: COMPANY.name }}
          components={{ co: <a href={COMPANY.url} target="_blank" rel="noopener noreferrer" className={s.link} /> }}
        />
      </p>
      <div className={s.chips}>
        <a href={`mailto:${COMPANY.emails.info}`} className={s.chip} title={t("contactUs.mail.info", "Questions, help and feedback")}>
          <FaEnvelope aria-hidden="true" /> <EmailAddress email={COMPANY.emails.info} />
        </a>
        <a href={`mailto:${COMPANY.emails.solutions}`} className={s.chip} title={t("contactUs.mail.solutions", "Schools, organisations and partnerships")}>
          <FaSchool aria-hidden="true" /> <EmailAddress email={COMPANY.emails.solutions} />
        </a>
      </div>
      {/* The guides, the FAQ and the small print, as a line of links (as the footer would). */}
      <p className={s.inlineLinks}>
        <a href="/about-us/why-learnigo">{seo.pages?.["/about-us/why-learnigo"]?.name || "Why Learnigo"}</a>{" "}<span className={s.dot} aria-hidden="true">·</span>{" "}
        <a href="/learning-differences">{nav.differences || "Learning differences"}</a>{" "}<span className={s.dot} aria-hidden="true">·</span>{" "}
        <a href="/who-we-help">{nav.audiences || "Who we help"}</a>{" "}<span className={s.dot} aria-hidden="true">·</span>{" "}
        <a href="/faq">{nav.faq || "FAQ"}</a>{" "}<span className={s.dot} aria-hidden="true">·</span>{" "}
        <a href="/policy">{t("navbar.policy", "Policy")}</a>{" "}<span className={s.dot} aria-hidden="true">·</span>{" "}
        <a href="/terms-and-conditions">{t("navbar.terms", "T & C")}</a>
      </p>
    </>
  );

  return (
    <>
      <SEO path="/about-us" />
      <OnePage
        layout="about"
        narrowBelow={1100}
        icon={<FaHeart />}
        tone="pink"
        title={t("navbar.about", "About Us")}
        subtitle={t("aboutUs.badge")}
        greetTitle={t("aboutUs.heroTitle")}
        greetText={t("aboutUs.heroSubtitle")}
        mood="wave"
        tabsLabel={t("aboutUs.tabs.label", "About Learnigo")}
        sections={[
          { id: "story", label: t("aboutUs.tabs.story", "Story"), icon: <FaBookOpen />, heading: t("aboutUs.badge"), content: story },
          { id: "worlds", label: t("aboutUs.tabs.worlds", "Worlds"), icon: <FaGlobeAmericas />, heading: t("aboutUs.worldsTitle"), content: worldTiles },
          { id: "values", label: t("aboutUs.tabs.values", "Values"), icon: <FaHeart />, heading: t("aboutUs.valuesTitle"), content: valueRows },
          { id: "team", label: t("aboutUs.tabs.team", "Team"), icon: <FaUsers />, heading: t("aboutUs.supportedBy.title", "Who supports Learnigo"), content: team },
        ]}
      />
    </>
  );
};

export default AboutUs;
