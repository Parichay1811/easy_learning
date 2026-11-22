// Week-by-week counts: answers on their own vs with help, and spaced reviews
// remembered vs needing another look. Kit StackedBars (textures per series,
// keyboard-reachable tooltip, y axis from 0), counts rather than shares so a
// small week looks small.
import { useTranslation } from "react-i18next";
import { FaInfoCircle } from "react-icons/fa";
import { ChartCard, StackedBars, fmtPercent } from "../../dashboard";
import { SMALL_WEEK, latestIndependence } from "./model";
import c from "./evidence.module.css";

const ON_OWN = "var(--d-good-ink)";
const HELP = "var(--d-sky-ink)";
const AGAIN = "var(--d-neutral-ink)";

/** On their own vs with help, answers per week. */
export function IndependenceChart({ weeks, name, className = "" }) {
  const { t } = useTranslation();
  const unit = t("evidence.unit.rightAnswers", "right answers");
  const series = [
    { key: "independent", label: t("evidence.indep.own", "Right on their own"), color: ON_OWN },
    { key: "assisted", label: t("evidence.indep.help", "Right with a hint or help"), color: HELP },
  ];
  const last = latestIndependence(weeks);
  const first = weeks[0];
  const answer = last
    ? t("evidence.indep.answer", {
      defaultValue: "Week of {{d}}: {{own}} of {{total}} right answers came without help ({{pct}}).",
      d: last.x, own: last.independent, total: last.total, pct: fmtPercent(last.share),
    })
    : undefined;
  const summary = weeks.length ? t("evidence.indep.sr", {
    defaultValue: "Bar chart, one bar per week: right answers on their own and with help. First week ({{d1}}): {{o1}} of {{n1}} on their own. Latest week ({{d2}}): {{o2}} of {{n2}}.",
    d1: first.x, o1: first.independent, n1: first.total, d2: last.x, o2: last.independent, n2: last.total,
  }) : "";
  const table = {
    caption: t("evidence.indep.title", { defaultValue: "How much does {{name}} get right on their own?", name }),
    columns: [
      { key: "x", label: t("evidence.col.week", "Week of") },
      { key: "independent", label: series[0].label, align: "end" },
      { key: "assisted", label: series[1].label, align: "end" },
      { key: "total", label: t("evidence.col.rightAnswers", "Right answers"), align: "end" },
      { key: "share", label: t("evidence.col.shareOwn", "Share on their own"), align: "end", render: (r) => fmtPercent(r.total ? r.independent / r.total : null) },
    ],
    rows: weeks,
    getRowKey: (r) => r.key,
  };
  return (
    <ChartCard className={className}
      title={t("evidence.indep.title", { defaultValue: "How much does {{name}} get right on their own?", name })}
      answer={answer}
      info={t("evidence.indep.info", "Right answers per week. On their own: no hint, no worked example and no step-by-step help on that question. Help is a good thing: it is how new ideas start.")}
      summary={summary} table={table}
      empty={!weeks.length && { title: t("evidence.indep.emptyT", "No weeks to show yet"), text: t("evidence.indep.emptyD", { defaultValue: "After some practice you'll see what {{name}} answers alone and with help.", name }) }}>
      <StackedBars data={weeks} series={series} unit={unit} height={200} summary={summary} label={t("evidence.indep.label", "Right answers per week, on their own and with help")} />
      {last?.small && <p className={c.caveat}><FaInfoCircle aria-hidden="true" />{t("evidence.smallWeek", { defaultValue: "Fewer than {{n}} right answers in the latest week, so read the share with care.", n: SMALL_WEEK })}</p>}
    </ChartCard>
  );
}

/** Spaced reviews remembered, per week. */
export function RetentionChart({ retention, name, className = "" }) {
  const { t } = useTranslation();
  const { weeks, reviews, remembered, rate } = retention;
  const unit = t("evidence.unit.reviews", "reviews");
  const series = [
    { key: "remembered", label: t("evidence.ret.remembered", "Remembered"), color: ON_OWN },
    { key: "again", label: t("evidence.ret.again", "Needed another look"), color: AGAIN },
  ];
  const answer = reviews
    ? t("evidence.ret.answer", { defaultValue: "{{ok}} of {{total}} reviews remembered ({{pct}}).", ok: remembered, total: reviews, pct: fmtPercent(rate) })
    : undefined;
  const summary = weeks.length ? t("evidence.ret.sr", {
    defaultValue: "Bar chart, one bar per week of spaced reviews. In total {{ok}} of {{total}} remembered. {{rows}}",
    ok: remembered, total: reviews, rows: weeks.map((w) => `${w.x}: ${w.remembered}/${w.reviews}`).join(", "),
  }) : "";
  const table = {
    caption: t("evidence.ret.title", { defaultValue: "Does {{name}} remember what was learned?", name }),
    columns: [
      { key: "x", label: t("evidence.col.week", "Week of") },
      { key: "reviews", label: t("evidence.col.reviews", "Reviews"), align: "end" },
      { key: "remembered", label: series[0].label, align: "end" },
      { key: "share", label: t("evidence.col.share", "Share right"), align: "end", render: (r) => (r.reviews < SMALL_WEEK ? `${fmtPercent(r.remembered / r.reviews)} (${t("evidence.few", "few answers")})` : fmtPercent(r.remembered / r.reviews)) },
    ],
    rows: weeks,
    getRowKey: (r) => r.key,
  };
  return (
    <ChartCard className={className}
      title={t("evidence.ret.title", { defaultValue: "Does {{name}} remember what was learned?", name })}
      answer={answer}
      info={t("evidence.ret.info", "A spaced review comes back to a skill days or weeks after it was learned. Remembered: right on that review. Needing another look is normal: it is how memory gets stronger.")}
      summary={summary} table={table}
      empty={!reviews && { title: t("evidence.ret.emptyT", "No reviews yet"), text: t("evidence.ret.emptyD", "Reviews start a few days after something new is learned.") }}>
      {weeks.length > 0 && <StackedBars data={weeks} series={series} unit={unit} height={200} summary={summary} label={t("evidence.ret.label", "Spaced reviews per week")} />}
      {reviews > 0 && reviews < SMALL_WEEK * 2 && <p className={c.caveat}><FaInfoCircle aria-hidden="true" />{t("evidence.smallSample", "Only a few answers so far, so these numbers can still change a lot.")}</p>}
    </ChartCard>
  );
}
