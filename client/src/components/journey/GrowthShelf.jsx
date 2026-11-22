import { useTranslation } from "react-i18next";
import { FaSeedling } from "react-icons/fa";
import { isGrowth, badgeName, badgeDesc, badgeEvidence, badgeIcon } from "./words";
import s from "./journey.module.css";

const RECENT_MS = 3 * 86400000;

/**
 * Growth badges: for how the learner learns (a first discovery, a comeback,
 * three ideas mastered, reviews kept up), never for time spent or rank. Each
 * earned one shows the evidence the server recorded; the others say plainly
 * what earns them.
 *
 *   <GrowthShelf achievements={list} onSeeAll={() => goTab("achievements")} />
 * Renders nothing when the server has no growth badges (an older server).
 */
export default function GrowthShelf({ achievements, onSeeAll, now, headingId = "jr-growth", className = "", limit = 4 }) {
  const { t } = useTranslation();
  const growth = (Array.isArray(achievements) ? achievements : []).filter(isGrowth);
  if (!growth.length) return null;
  const at = now ?? 0;
  const earned = growth.filter((a) => a.earned).sort((a, b) => new Date(b.earnedAt || 0) - new Date(a.earnedAt || 0));
  const notYet = growth.filter((a) => !a.earned);
  const shown = [...earned, ...notYet].slice(0, Math.max(limit, Math.min(earned.length, 6)));

  return (
    <section className={`${s.card} ${s.shelf} ${className}`} aria-labelledby={headingId}>
      <h3 id={headingId} className={s.title}><FaSeedling aria-hidden="true" /> {t("journey.growth.title", "Growth badges")}</h3>
      <p className={s.help}>
        {earned.length
          ? t("journey.growth.count", { defaultValue: "{{n}} of {{total}}: for how you learn, not how long.", n: earned.length, total: growth.length })
          : t("journey.growth.none", "These are for how you learn: exploring, coming back, keeping ideas fresh.")}
      </p>
      <ul className={s.badges}>
        {shown.map((a) => {
          const evidence = a.earned ? badgeEvidence(t, a) : "";
          const fresh = a.earned && at && a.earnedAt && at - new Date(a.earnedAt).getTime() < RECENT_MS;
          return (
            <li key={a.id} className={s.badge} data-earned={a.earned || undefined} data-badge={a.id}>
              <span className={s.medal} aria-hidden="true">{badgeIcon(a)}</span>
              <span className={s.badgeText}>
                <b>
                  {badgeName(t, a)}
                  {fresh && <span className={s.newTag}>{t("studentDash.badges.new", "NEW")}</span>}
                  <span className={s.srOnly}>{a.earned ? ` (${t("studentDash.badges.earned", "Earned")})` : ` (${t("studentDash.badges.locked", "Not won yet")})`}</span>
                </b>
                <span>{a.earned ? (evidence || badgeDesc(t, a)) : badgeDesc(t, a)}</span>
              </span>
            </li>
          );
        })}
      </ul>
      {onSeeAll && (
        <button type="button" className={s.linkBtn} onClick={onSeeAll}>{t("journey.growth.seeAll", "See all my badges")}</button>
      )}
    </section>
  );
}
