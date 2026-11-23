// "At a glance" for ONE learner, for a parent (Home) or a teacher (student view):
// 3-5 plain-language findings (going well / worth more practice / what changed / effort), each
// with its evidence and one concrete next step, then the period in numbers and the weekly trend.
// Data: GET …/insights?days=7|28 (server/services/learnerInsights.js). Lazy-loaded by the pages.
//
//   <GlancePanel data={q.data?.insights} loading={q.loading} error={q.error} onRetry={q.reload}
//                days={days} onDays={setDays} name="Sam" audience="parent" actions={<Button…/>} />
import { useId, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaStar, FaBullseye, FaArrowUp, FaArrowDown, FaEquals, FaHourglassHalf, FaCalendarCheck, FaHome, FaChalkboardTeacher, FaRedo } from "react-icons/fa";
import Button from "../components/dashboard/Button";
import Skeleton from "../components/dashboard/Skeleton";
import EmptyState from "../components/dashboard/EmptyState";
import { subjectLabel } from "../components/dashboard/constants";
import { fmtDate } from "../components/dashboard/format";
import { tx } from "./strings.js";
import { renderer, shareMeasure, countStatus } from "./render.js";
import { PeriodToggle, Measure, WeeklyTrends } from "./parts.jsx";
import { day, listOf } from "./fmt.js";
import s from "./insights.module.css";

const KIND_ICON = { win: FaStar, practice: FaBullseye, early: FaHourglassHalf, effort: FaCalendarCheck };
const TONE_ICON = { up: FaArrowUp, down: FaArrowDown, steady: FaEquals };

function Finding({ f }) {
  const Icon = f.kind === "change" ? TONE_ICON[f.tone] || FaEquals : KIND_ICON[f.kind] || FaStar;
  const NextIcon = f.nextLabel && f.audience === "teacher" ? FaChalkboardTeacher : FaHome;
  return (
    <li className={s.finding} data-kind={f.kind}>
      <span className={s.kind} data-kind={f.kind}><Icon aria-hidden="true" />{f.kindLabel}{f.toneLabel && f.kind === "change" ? ` · ${f.toneLabel}` : ""}</span>
      <p className={s.fTitle}>{f.title}</p>
      {f.evidence.length > 0 && <ul className={s.evidence}>{f.evidence.map((e) => <li key={e}>{e}</li>)}</ul>}
      {f.next && (
        <p className={s.next}>
          <span className={s.nextLabel}><NextIcon aria-hidden="true" />{f.nextLabel}</span>
          <span>{f.next}</span>
          {f.note && <span className={s.note}>{f.noteLabel}: {f.note}</span>}
        </p>
      )}
    </li>
  );
}

export function Measures({ m, period, rules }) {
  const { t } = useTranslation();
  const id = useId();
  if (!m) return null;
  const before = (v) => (v == null ? null : tx(t, "measure.before", { value: v }));
  const need = rules?.minAnswers ?? 20;
  const ft = shareMeasure(t, m.firstTry, need), ind = shareMeasure(t, m.independent, need);
  const dStatus = countStatus(m.activeDays.cur, m.activeDays.prev);
  const aStatus = countStatus(m.answered.cur, m.answered.prev);
  const rev = m.reviews;
  const newSecure = Math.max(0, (m.secure?.now || 0) - (m.secure?.atStart || 0));
  return (
    <section className={s.card} aria-labelledby={id}>
      <h3 id={id} className={s.h3}>{tx(t, "measure.title")}</h3>
      <p className={s.sub}>{fmtDate({ from: period.from, to: period.to }, { style: "day" })}</p>
      <ul className={`${s.measures} ${s.measures6}`}>
        <Measure label={tx(t, "measure.days")} value={tx(t, "measure.daysValue", { cur: m.activeDays.cur, of: m.activeDays.of })}
          status={dStatus} statusLabel={dStatus && tx(t, `measure.${dStatus}`)} before={before(m.activeDays.prev)} />
        <Measure label={tx(t, "measure.answered")} value={m.answered.cur}
          status={aStatus} statusLabel={aStatus && tx(t, `measure.${aStatus}`)} before={before(m.answered.prev)} />
        <Measure label={tx(t, "measure.firstTry")} value={ft.value == null ? null : `${ft.value}%`} status={ft.status} statusLabel={ft.statusLabel}
          before={ft.prev != null ? before(`${ft.prev}%`) : null} why={ft.why} />
        <Measure label={tx(t, "measure.independent")} value={ind.value == null ? null : `${ind.value}%`} status={ind.status} statusLabel={ind.statusLabel}
          before={ind.prev != null ? before(`${ind.prev}%`) : null} why={ind.why} />
        <Measure label={tx(t, "measure.reviews")} value={rev.cur.n ? tx(t, "measure.reviewsValue", { k: rev.cur.k, n: rev.cur.n }) : null}
          status={rev.status === "early" ? "early" : null} statusLabel={rev.status === "early" ? tx(t, "measure.early") : null}
          why={rev.status === "early" ? tx(t, "measure.fewReviews", { count: rev.cur.n }) : null}
          before={rev.status !== "early" && rev.prev.n ? before(tx(t, "measure.reviewsValue", { k: rev.prev.k, n: rev.prev.n })) : null} />
        <Measure label={tx(t, "measure.secure")} value={m.secure?.now ?? 0}
          status={newSecure ? "more" : "same"} statusLabel={newSecure ? tx(t, "measure.secureMore", { count: newSecure }) : tx(t, "measure.secureSame")} />
      </ul>
    </section>
  );
}

export default function GlancePanel({ data, loading, error, onRetry, days = 7, onDays, name = "", audience = "parent", actions = null, wide = true, showTrends = true }) {
  const { t, i18n } = useTranslation();
  const headId = useId();
  const first = String(name || "").split(" ")[0];
  const r = useMemo(() => renderer({ t, day, list: (a) => listOf(a, i18n.language), audience, subject: (k) => subjectLabel(t, k) }), [t, i18n.language, audience]);
  const findings = useMemo(() => (data?.findings || []).map((f) => ({ ...r.finding(f), audience, noteLabel: tx(t, audience === "teacher" ? "glance.noteClass" : "glance.note") })), [data, r, audience, t]);
  const P = data?.period;
  const rules = data?.rules;

  let body;
  if (loading && !data) body = <div aria-busy="true" style={{ marginTop: 14 }}><Skeleton variant="text" lines={2} /><Skeleton variant="rect" height={120} /></div>;
  else if (error && !data) {
    body = (
      <div role="alert" style={{ marginTop: 12 }}>
        <EmptyState compact tone="error" title={tx(t, "glance.loadError")} text={error} />
        {onRetry && <Button variant="soft" icon={FaRedo} onClick={onRetry}>{tx(t, "glance.retry")}</Button>}
      </div>
    );
  } else if (data && !data.measures.answered.cur && !data.measures.answered.prev && !data.skills?.total) {
    body = <EmptyState compact icon="🌱" title={tx(t, "glance.none")} text={tx(t, "glance.noneText", { name: first || "" })} />;
  } else if (data) {
    body = (
      <>
        <p className={s.headline}>{r.headline(data.headline)}</p>
        <h3 className="d-sr-only">{tx(t, "glance.findings")}</h3>
        <ol className={`${s.findings} ${wide ? s.findingsWide : ""}`}>
          {findings.map((f) => <Finding key={f.id} f={f} />)}
        </ol>
        <details className={s.details}>
          <summary>{tx(t, "glance.how")}</summary>
          <p>{tx(t, "glance.howText", { name: first || "", minAnswers: rules?.minAnswers, minPoints: rules?.minChangePoints, minTries: rules?.minSkillTries })}</p>
        </details>
        {actions && <div className={s.foot}>{actions}</div>}
      </>
    );
  }

  return (
    <div className={s.stack}>
      <section className={s.card} aria-labelledby={headId} aria-busy={loading || undefined}>
        <div className={s.head}>
          <div>
            <p className={s.eyebrow}>{tx(t, "glance.eyebrow")}</p>
            <h2 id={headId} className={s.title}>{first ? tx(t, "glance.title", { name: first, count: days }) : tx(t, "glance.titleNoName", { count: days })}</h2>
            {P && <p className={s.sub}>{tx(t, "glance.compared", { range: fmtDate({ from: P.from, to: P.to }, { style: "day" }), prev: fmtDate({ from: P.prev.from, to: P.prev.to }, { style: "day" }) })}</p>}
          </div>
          {onDays && <PeriodToggle value={days} onChange={onDays} />}
        </div>
        {body}
      </section>
      {data && (data.measures.answered.cur > 0 || data.measures.answered.prev > 0) && <Measures m={data.measures} period={P} rules={rules} />}
      {showTrends && data && data.trend?.some((w) => w.answered > 0) && <WeeklyTrends weeks={data.trend} rules={rules} />}
    </div>
  );
}
