import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChartCard, KpiTile } from "../dashboard";
import { words } from "../../pages/together/words";
import s from "./together.module.css";

// "A, B and C" in the reader's language.
function listOf(items, lng) {
  try { return new Intl.ListFormat(lng, { style: "long", type: "conjunction" }).format(items); } catch { return items.join(", "); }
}

/**
 * "What do they love to watch?" (G-530): one learner's Shorts interests, for a parent
 * or a teacher. `interests` is the summary from /children/:id/interests or
 * /students/:id/interests ({ hasData, picks, top, themes, liked, totals, weeks, trend }).
 * The answer comes first as a sentence, then the topics as bars, then the detail.
 */
export default function InterestsCard({ interests, name, loading, error, onRetry }) {
  const { t, i18n } = useTranslation();
  const w = useMemo(() => words(t), [t]);
  const T = (k, d, o) => t(`interests.${k}`, { defaultValue: d, ...o });
  const it = interests;
  const top = (it?.top || []).map((k) => w.theme(k).name);
  const answer = !it?.hasData ? null
    : top.length ? T("answer", "{{name}} keeps coming back to {{topics}}.", { name, topics: listOf(top, i18n.language) })
      : T("answerPicks", "{{name}} has picked some topics and is just getting started.", { name });
  const maxWeek = Math.max(1, ...(it?.weeks || []).map((x) => x.done));
  const rows = (it?.themes || []).filter((x) => x.score > 0 || x.picked);

  return (
    <ChartCard
      title={T("title", "What does {{name}} love to watch?", { name })}
      answer={answer}
      loading={loading} error={error} onRetry={onRetry}
      info={T("info", "From Shorts only: the topics {{name}} picked, the shorts they gave a heart, and the ones they watched to the end. Nothing else is tracked, and {{name}} is told that grown-ups can see this.", { name })}
      empty={it && !it.hasData && { title: T("emptyTitle", "Nothing to show yet"), text: T("emptyText", "When {{name}} watches Shorts, the topics they pick and the ones they heart show up here.", { name }) }}
      table={rows.length ? {
        columns: [{ key: "theme", label: T("colTopic", "Topic") }, { key: "done", label: T("colDone", "Watched to the end"), align: "right" }, { key: "likes", label: T("colLikes", "Hearts"), align: "right" }, { key: "picked", label: T("colPicked", "Picked it themselves") }],
        rows: rows.map((x) => ({ theme: w.theme(x.theme).name, done: x.done, likes: x.likes, picked: x.picked ? T("yes", "Yes") : "" })),
      } : undefined}
    >
      {it?.hasData && (
        <div className={s.interests}>
          <ul className={s.themes} aria-label={T("topics", "Favourite topics")}>
            {rows.slice(0, 6).map((x) => {
              const th = w.theme(x.theme);
              return (
                <li key={x.theme} className={s.theme} style={{ "--hue": th.hue }}>
                  <span className={s.themeEmoji} aria-hidden="true">{th.emoji}</span>
                  <span className={s.themeBody}>
                    <span className={s.themeTop}>
                      <b>{th.name}</b>
                      {x.picked && <span className={s.picked}>{T("picked", "their own pick")}</span>}
                      <span className={s.themeNum}>{T("counts", "{{done}} watched · {{likes}} ♥", { done: x.done, likes: x.likes })}</span>
                    </span>
                    <span className={s.track} aria-hidden="true"><span className={s.fill} style={{ transform: `scaleX(${Math.max(0.04, x.share)})` }} /></span>
                  </span>
                </li>
              );
            })}
          </ul>

          <div className={s.side}>
            <div className={s.kpis}>
              <KpiTile label={T("kpiDone", "Watched to the end")} value={it.totals.done} />
              <KpiTile label={T("kpiLikes", "Hearts given")} value={it.totals.likes} />
            </div>
            <div className={s.weeks} role="img" aria-label={T("weeksLabel", "Shorts watched to the end in each of the last six weeks: {{list}}", { list: it.weeks.map((x) => x.done).join(", ") })}>
              <span className={s.weeksTitle}>{T("weeks", "Last six weeks")} · {it.trend === "more" ? T("more", "more this week") : it.trend === "less" ? T("less", "fewer this week") : T("same", "about the same")}</span>
              <span className={s.weekBars} aria-hidden="true">{it.weeks.map((x) => <span key={x.week} title={`${x.week}: ${x.done}`}><i style={{ transform: `scaleY(${Math.max(0.06, x.done / maxWeek)})` }} /></span>)}</span>
            </div>
          </div>

          {it.liked.length > 0 && (
            <div className={s.liked}>
              <span className={s.likedTitle}>♥ {T("liked", "Shorts they gave a heart")}</span>
              <ul>{it.liked.slice(0, 8).map((x) => <li key={x.id}><span aria-hidden="true">{w.theme(x.theme).emoji}</span> {x.title}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </ChartCard>
  );
}

/** A whole group's favourite topics ("this class loves space"): counts of learners, never names. */
export function GroupInterestsCard({ interests, loading, error, onRetry }) {
  const { t, i18n } = useTranslation();
  const w = useMemo(() => words(t), [t]);
  const T = (k, d, o) => t(`interests.group.${k}`, { defaultValue: d, ...o });
  const it = interests;
  const rows = (it?.themes || []).slice(0, 6);
  const max = Math.max(1, ...rows.map((x) => x.learners));
  const top = rows.filter((x) => x.learners > 0).slice(0, 2).map((x) => w.theme(x.theme).name);
  return (
    <ChartCard
      title={T("title", "What does this group love to watch?")}
      answer={top.length ? T("answer", "This group loves {{topics}}.", { topics: listOf(top, i18n.language) }) : null}
      loading={loading} error={error} onRetry={onRetry}
      info={T("info", "From Shorts: how many learners have each topic among their three favourites. Use it to pick examples and stories the group cares about.")}
      empty={it && !rows.length && { title: T("emptyTitle", "No favourites yet"), text: T("emptyText", "When learners in this group watch Shorts, their favourite topics show here.") }}
      table={rows.length ? { columns: [{ key: "theme", label: T("colTopic", "Topic") }, { key: "learners", label: T("colLearners", "Learners who love it"), align: "right" }], rows: rows.map((x) => ({ theme: w.theme(x.theme).name, learners: x.learners })) } : undefined}
    >
      {rows.length > 0 && (
        <ul className={s.themes}>
          {rows.map((x) => {
            const th = w.theme(x.theme);
            return (
              <li key={x.theme} className={s.theme} style={{ "--hue": th.hue }}>
                <span className={s.themeEmoji} aria-hidden="true">{th.emoji}</span>
                <span className={s.themeBody}>
                  <span className={s.themeTop}><b>{th.name}</b><span className={s.themeNum}>{t("interests.group.learners", { defaultValue_one: "{{count}} learner", defaultValue_other: "{{count}} learners", count: x.learners })}</span></span>
                  <span className={s.track} aria-hidden="true"><span className={s.fill} style={{ transform: `scaleX(${Math.max(0.04, x.learners / max)})` }} /></span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {it && <p className={s.foot}>{T("watching", "{{watching}} of {{learners}} learners have watched Shorts.", { watching: it.watching, learners: it.learners })}</p>}
    </ChartCard>
  );
}
