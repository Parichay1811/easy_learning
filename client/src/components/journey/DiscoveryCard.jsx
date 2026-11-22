import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaLightbulb, FaArrowRight, FaCheckCircle } from "react-icons/fa";
import { msgText } from "./words";
import s from "./journey.module.css";

// The question as a teaser: one line, never the answer (it is the question itself).
function teaser(item) {
  const text = String(item?.instruction || item?.prompt || "").replace(/\s+/g, " ").trim();
  return text.length > 110 ? `${text.slice(0, 107).trimEnd()}…` : text;
}

/**
 * Today's quick discovery (GET /api/learn/discovery): one everyday question a
 * day ("Why do we use an umbrella when it rains?"), opened at /discovery.
 * `done` (answered today on this device): a calm "see you tomorrow".
 *
 *   <DiscoveryCard discovery={{ item, date }} done={false} />
 */
export default function DiscoveryCard({ discovery, done = false, headingId = "jr-discovery", className = "" }) {
  const { t } = useTranslation();
  const item = discovery?.item;
  if (!item && !done) return null;
  return (
    <section className={`${s.card} ${s.discovery} ${className}`} aria-labelledby={headingId}>
      <h3 id={headingId} className={s.title}><FaLightbulb aria-hidden="true" /> {t("journey.discovery.title", "Today's quick discovery")}</h3>
      {!done && discovery?.message && <p className={s.help}>{msgText(t, discovery.message)}</p>}
      {done ? (
        <div className={s.discoveryRow}>
          <span className={s.discoveryEmoji} aria-hidden="true"><FaCheckCircle /></span>
          <p className={s.discoveryQ}>{t("journey.discovery.done", "You explored today's discovery. A new one will be waiting tomorrow.")}</p>
        </div>
      ) : (
        <>
          <div className={s.discoveryRow}>
            <span className={s.discoveryEmoji} aria-hidden="true">{item.image?.emoji || "🔎"}</span>
            <p className={s.discoveryQ}>{teaser(item) || t("journey.discovery.teaser", "A quick everyday question to wonder about.")}</p>
          </div>
          <Link to="/discovery" className={s.primary} data-discovery-go="">
            {t("journey.discovery.go", "Let's find out")} <FaArrowRight aria-hidden="true" />
          </Link>
        </>
      )}
    </section>
  );
}
