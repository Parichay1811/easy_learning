import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaChevronRight, FaPlay, FaListOl } from "react-icons/fa";
import { msgText, actionHref, kindMeta, kindTitle } from "./words";
import s from "./journey.module.css";

/**
 * "What next?": the server's ranked list (GET /api/learn/next, at most 6):
 * continue, reviews due, a building block to strengthen, the next idea, a
 * mini challenge, today's discovery, something new. Each row says why, in
 * words a child understands. The first row is the main recommendation.
 *
 *   <NextUpList items={next.items} />
 */
export default function NextUpList({ items, headingId = "jr-next", className = "", listClassName = "", after = null }) {
  const { t } = useTranslation();
  const rows = (Array.isArray(items) ? items : [])
    .map((it) => ({ ...it, href: actionHref(it.action, it.kind) }))
    .filter((it) => it.href)
    .slice(0, 6);

  return (
    <section className={`${s.card} ${s.nextCard} ${className}`} aria-labelledby={headingId}>
      <h3 id={headingId} className={s.title}><FaListOl aria-hidden="true" /> {t("journey.next.title", "What next?")}</h3>
      {rows.length === 0 ? (
        <p className={s.empty}>{t("journey.next.empty", "Play any round and Learnigo will suggest what to do next.")}</p>
      ) : (
        <ol className={`${s.nextList} ${listClassName}`}>
          {rows.map((it, i) => {
            const meta = kindMeta(it.kind);
            const Icon = meta.Icon;
            const title = msgText(t, it.title, kindTitle(t, it.kind));
            const why = msgText(t, it.why);
            const main = i === 0;
            return (
              <li key={`${it.kind}-${i}`}>
                <Link
                  to={it.href}
                  className={s.nextRow}
                  data-kind={it.kind}
                  data-main={main || undefined}
                  style={{ "--k-bg": meta.bg, "--k-fg": meta.fg }}
                >
                  <span className={s.nextIcon} aria-hidden="true"><Icon /></span>
                  <span className={s.nextText}>
                    {main && <span className={s.kicker}>{t("journey.next.main", "Best next step")}</span>}
                    <span className={s.nextTitle}>{title}</span>
                    {why && <span className={s.nextWhy}>{why}</span>}
                  </span>
                  {main
                    ? <span className={s.startPill} aria-hidden="true"><FaPlay /> {t("journey.next.start", "Start")}</span>
                    : <FaChevronRight className={s.nextGo} aria-hidden="true" />}
                </Link>
              </li>
            );
          })}
          {after}
        </ol>
      )}
    </section>
  );
}
