import { useTranslation } from "react-i18next";
import { FaInfoCircle } from "react-icons/fa";
import { ChartCard, fmtPercent, fmtDate } from "../../dashboard";
import { SUBJECT_META, subjectName, levelLabel } from "../levels";
import { SMALL_N } from "./model";
import c from "./evidence.module.css";

const day = (at) => (at ? fmtDate(String(at).slice(0, 10), { style: "day" }) : "");

function Line({ label, data, kind, t }) {
  if (!data) {
    return (
      <div className={c.line}>
        <span className={c.lineLabel}>{label}</span>
        <span className={c.none}>{t("evidence.thenNow.noData", "Not yet")}</span>
      </div>
    );
  }
  const acc = data.accuracy;
  return (
    <div className={c.line}>
      <span className={c.lineLabel}>{label}</span>
      <span className={c.lineText}>
        {data.level != null && <strong>{levelLabel(t, data.level)}</strong>}
        <span>{acc != null ? t("evidence.thenNow.right", { defaultValue: "{{pct}} right", pct: fmtPercent(acc) }) : "—"}</span>
        <span className={c.lineMeta}>{t("evidence.answers", { defaultValue: "{{count}} answers", defaultValue_one: "{{count}} answer", count: data.n })}</span>
      </span>
      <span className={c.meter} aria-hidden="true">
        {acc != null && <span className={`${c.fill} ${kind === "start" ? c.fillStart : ""}`} style={{ width: `${Math.max(0, Math.min(1, acc)) * 100}%` }} />}
      </span>
    </div>
  );
}

function sourceText(t, b) {
  if (!b) return "";
  if (b.source === "placement") return t("evidence.thenNow.placement", { defaultValue: "warm-up questions, {{d}}", d: day(b.at) });
  if (b.source === "first_attempts") return t("evidence.thenNow.firstAttempts", { defaultValue: "first {{count}} answers, {{d}}", defaultValue_one: "first answer, {{d}}", count: b.n, d: day(b.at) });
  return b.at ? day(b.at) : "";
}

function changeText(t, b, n) {
  if (b?.level == null || n?.level == null) return "";
  const d = n.level - b.level;
  if (d > 0) return t("evidence.thenNow.up", { defaultValue: "Up {{count}} levels", defaultValue_one: "Up {{count}} level", count: d });
  if (d === 0) return t("evidence.thenNow.same", "Same level");
  return t("evidence.thenNow.moved", { defaultValue: "Level {{from}} → {{to}}", from: b.level, to: n.level });
}

/** Where each subject started (placement or first answers) and where it is now, with how many answers each rests on. */
export default function ThenNow({ subjects, name, className = "" }) {
  const { t } = useTranslation();
  const rows = subjects.map((x) => ({ ...x, label: subjectName(t, x.key) }));
  const summary = rows.map((x) => t("evidence.thenNow.sr", {
    defaultValue: "{{subject}}: started {{from}} over {{n1}} answers; now {{to}} over {{n2}} answers.",
    subject: x.label,
    from: x.baseline ? `${x.baseline.level != null ? levelLabel(t, x.baseline.level) + ", " : ""}${fmtPercent(x.baseline.accuracy)}` : "—",
    n1: x.baseline?.n ?? 0,
    to: x.current ? `${x.current.level != null ? levelLabel(t, x.current.level) + ", " : ""}${fmtPercent(x.current.accuracy)}` : "—",
    n2: x.current?.n ?? 0,
  })).join(" ");
  const table = {
    caption: t("evidence.thenNow.title", { defaultValue: "Where did {{name}} start, and where are they now?", name }),
    columns: [
      { key: "label", label: t("evidence.col.subject", "Subject") },
      { key: "b", label: t("evidence.col.startLevel", "Start level"), render: (r) => r.baseline?.level ?? "—" },
      { key: "ba", label: t("evidence.col.startRight", "Start: right"), align: "end", render: (r) => fmtPercent(r.baseline?.accuracy) },
      { key: "bn", label: t("evidence.col.startN", "Start: answers"), align: "end", render: (r) => r.baseline?.n ?? "—" },
      { key: "bs", label: t("evidence.col.from", "Measured from"), render: (r) => sourceText(t, r.baseline) || "—" },
      { key: "c", label: t("evidence.col.nowLevel", "Level now"), render: (r) => r.current?.level ?? "—" },
      { key: "ca", label: t("evidence.col.nowRight", "Now: right"), align: "end", render: (r) => fmtPercent(r.current?.accuracy) },
      { key: "cn", label: t("evidence.col.nowN", "Now: answers"), align: "end", render: (r) => r.current?.n ?? "—" },
    ],
    rows,
    getRowKey: (r) => r.key,
  };
  return (
    <ChartCard className={className}
      title={t("evidence.thenNow.title", { defaultValue: "Where did {{name}} start, and where are they now?", name })}
      answer={t("evidence.thenNow.answer", "Level and share of right answers at the start and now, in each subject.")}
      info={t("evidence.thenNow.info", "Start: the warm-up questions, or the first 10 answers when there was no warm-up. Now: the recent answers at the current level. Levels 0 to 8 are learning stages, not ages or grades.")}
      summary={summary} table={table}>
      <div className={c.chart} tabIndex={0} role="group" aria-label={summary}>
        <div className={c.subjects}>
          {rows.map((x) => {
            const meta = SUBJECT_META[x.key];
            const Icon = meta?.Icon;
            const small = (x.baseline && x.baseline.n < SMALL_N) || (x.current && x.current.n < SMALL_N);
            const since = sourceText(t, x.baseline);
            return (
              <section key={x.key} className={c.subject} style={{ "--ev-ink": meta?.ink || "var(--d-accent-ink)" }} aria-label={x.label}>
                <h4 className={c.subjectHead}>
                  {Icon && <Icon aria-hidden="true" />}
                  {x.label}
                  <span className={c.change}>{changeText(t, x.baseline, x.current)}</span>
                </h4>
                <div className={c.pair}>
                  <Line t={t} label={t("evidence.thenNow.start", "Start")} data={x.baseline} kind="start" />
                  <Line t={t} label={t("evidence.thenNow.now", "Now")} data={x.current} kind="now" />
                </div>
                <div className={c.scale} aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>
                {since && <p className={c.fine} style={{ marginTop: 6 }}>{t("evidence.thenNow.since", { defaultValue: "Start measured from {{what}}.", what: since })}</p>}
                {small && (
                  <p className={c.caveat}><FaInfoCircle aria-hidden="true" />
                    {t("evidence.smallSample", "Only a few answers so far, so these numbers can still change a lot.")}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </div>
      <ul className={c.keys} aria-hidden="true">
        <li><span className={`${c.key} ${c.keyStart}`} />{t("evidence.thenNow.keyStart", "Start (striped)")}</li>
        <li><span className={`${c.key} ${c.keyNow}`} />{t("evidence.thenNow.keyNow", "Now (solid)")}</li>
      </ul>
    </ChartCard>
  );
}
