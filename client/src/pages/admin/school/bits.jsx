// Small building blocks shared by the school pages.
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCalendarAlt, FaChevronDown, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { NO_DATA, Sheet, TimeRangeBar, Button, fmtDate, parseISO, today } from "../../../components/dashboard";
import { RANGE_COMPACT, useMedia } from "./useMedia";
import { sfx } from "../../../utils/sounds";
import st from "../../../components/dashboard/subtabs.module.css";
import s from "./school.module.css";

// One heatmap cell: the number is always printed, the tint only backs it up.
export function HeatCell({ cell }) {
  const { t } = useTranslation();
  if (!cell || cell.accuracy == null) {
    return <div className={`${s.heatCell} ${s.heatEmpty}`} title={t("school.heat.noData", { defaultValue: "No answers yet" })}>{NO_DATA}</div>;
  }
  const p = Math.round(Math.max(0, Math.min(100, cell.accuracy)) * 0.45);
  const delta = cell.delta;
  return (
    <div className={s.heatCell} style={{ background: `color-mix(in srgb, var(--d-score-hi) ${p}%, var(--d-card))`, color: "var(--d-ink)" }}
      title={t("school.heat.cellTip", { defaultValue: "{{a}} % correct from {{n}} answers", a: cell.accuracy, n: cell.answered })}>
      {cell.accuracy} %
      <small>
        {delta == null ? t("school.heat.answers", { defaultValue: "{{n}} answers", n: cell.answered })
          : delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : "= 0"}
        {delta != null && <span className="d-sr-only"> {t("school.heat.pointsVs", { defaultValue: "points vs before" })}</span>}
      </small>
    </div>
  );
}

// Engagement 0-100 as a short bar plus the number (never colour alone).
export function Health({ value, label }) {
  const { t } = useTranslation();
  if (value == null) return <span className={`${s.small} ${s.muted}`}>{t("school.health.none", { defaultValue: "no activity" })}</span>;
  return (
    <span className={s.health} title={label || t("school.engagement", { defaultValue: "Engagement" })}>
      <span className={s.healthTrack} aria-hidden="true"><span className={s.healthFill} style={{ width: `${value}%`, "--p": `${value}%` }} /></span>
      <span className={s.small}>{value}<span className="d-sr-only"> / 100 {t("school.engagement", { defaultValue: "engagement" })}</span></span>
    </span>
  );
}

const STATUS_TONE = { linked: "pillGood", invited: "pillAttention", bounced: "pillAlert", not_invited: "", active: "pillGood", disabled: "pillAlert", pending: "pillAttention", approved: "pillGood", rejected: "pillAlert" };
export function StatusPill({ status, label }) {
  const { t } = useTranslation();
  const words = { linked: "Linked", invited: "Invited", bounced: "Bounced", not_invited: "Not invited", active: "Active", disabled: "Disabled", pending: "Waiting", approved: "Approved", rejected: "Rejected" };
  return <span className={`${s.pill} ${s[STATUS_TONE[status]] || ""}`}>{label || t(`school.status.${status}`, { defaultValue: words[status] || status })}</span>;
}

// Accessible tabs bound to a value, drawn like the kit's sub-tabs (a tray with the
// green pill). tabs: [{ key, label, badge? }]. Arrow keys, Home and End move between them.
export function Tabs({ tabs, value, onChange, label, sticky = true }) {
  const refs = useRef({});
  useEffect(() => {
    const el = refs.current[value];
    const list = el?.parentElement;
    if (el && list && list.scrollWidth > list.clientWidth) el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [value]);
  const onKey = (e, i) => {
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    let j = null;
    if (e.key === (rtl ? "ArrowLeft" : "ArrowRight")) j = (i + 1) % tabs.length;
    else if (e.key === (rtl ? "ArrowRight" : "ArrowLeft")) j = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = tabs.length - 1;
    if (j == null) return;
    e.preventDefault();
    sfx.tab();
    onChange(tabs[j].key);
    refs.current[tabs[j].key]?.focus();
  };
  return (
    <div className={`${st.bar} ${sticky ? st.sticky : ""}`} data-print="hide">
      <div className={st.list} role="tablist" aria-label={label}>
        {tabs.map((tb, i) => {
          const on = value === tb.key;
          return (
            <button key={tb.key} ref={(el) => { refs.current[tb.key] = el; }} type="button" role="tab" className={`${st.tab} ${on ? st.on : ""}`}
              aria-selected={on} tabIndex={on ? 0 : -1} onClick={() => { if (!on) onChange(tb.key); }} onKeyDown={(e) => onKey(e, i)}>
              <span className={st.label}>{tb.label}</span>
              {tb.badge ? <span className={st.badge}>{tb.badge}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// A small dialog (the kit Sheet: centred on wide screens, a bottom sheet on phones),
// focus on open, Escape or a tap outside to close, with the open / close sounds.
export function Dialog({ title, text, onClose, children, size }) {
  return <Sheet title={title} text={text} onClose={onClose} size={size}>{children}</Sheet>;
}

// The time range. Wide, tall screens get the full bar; phones, tablets and short screens a
// one-line pill (earlier · the period · later) that opens the full bar in a sheet.
export function RangeControl({ tr, ranges = ["week", "month", "year", "custom"], showCompare = true }) {
  const { t } = useTranslation();
  const compact = useMedia(RANGE_COMPACT);
  const [open, setOpen] = useState(false);
  if (!compact) return <TimeRangeBar value={tr} ranges={ranges} showCompare={showCompare} />;
  const period = fmtDate({ from: tr.from, to: tr.to }, { style: tr.range === "month" ? "month" : "short" });
  // Short words on the pill; the sheet shows the full range.
  const short = tr.range === "month" ? fmtDate(tr.from, { style: "month" })
    : tr.range === "year" ? String(parseISO(tr.from)?.getFullYear() ?? period)
      : tr.range === "custom" || tr.range === "term" ? period : fmtDate({ from: tr.from, to: tr.to }, { style: "day" });
  const canNext = tr.range === "custom" || tr.range === "term" ? true : parseISO(tr.to) < today();
  const word = t(`dash.range.${tr.range}`, { defaultValue: { day: "Day", week: "Week", month: "Month", year: "Year", custom: "Custom", term: "Term" }[tr.range] || tr.range });
  return (
    <div className={s.rangeRow} data-print="hide">
      <button type="button" className={s.iconBtn} onClick={() => tr.shift(-1)} aria-label={t("dash.range.back", { defaultValue: "Earlier period" })}><FaChevronLeft aria-hidden="true" /></button>
      <button type="button" className={s.rangePill} aria-haspopup="dialog" onClick={() => setOpen(true)}
        aria-label={t("school.range.change", { defaultValue: "Time range: {{period}}. Change it", period })}>
        <FaCalendarAlt aria-hidden="true" />
        <span className={s.rangeText}>{short}</span>
        <span className={s.rangeWord}>{word}</span>
        <FaChevronDown aria-hidden="true" />
      </button>
      <button type="button" className={s.iconBtn} onClick={() => tr.shift(1)} disabled={!canNext} aria-label={t("dash.range.forward", { defaultValue: "Later period" })}><FaChevronRight aria-hidden="true" /></button>
      {open && (
        <Sheet title={t("school.range.title", { defaultValue: "Time range" })} text={t("school.range.text", { defaultValue: "Which days to show, and what to compare them with." })}
          onClose={() => setOpen(false)} footer={<Button onClick={() => setOpen(false)}>{t("school.range.done", { defaultValue: "Done" })}</Button>}>
          <TimeRangeBar value={tr} ranges={ranges} showCompare={showCompare} />
        </Sheet>
      )}
    </div>
  );
}

export function Field({ label, hint, children, id }) {
  return (
    <div className={s.field}>
      <label className={s.label} htmlFor={id}>{label}</label>
      {children}
      {hint && <span className={s.hint} id={`${id}-hint`}>{hint}</span>}
    </div>
  );
}

// "Saved" / error line under a form.
export function Result({ result }) {
  if (!result) return null;
  return <p role="status" className={result.ok ? s.okText : s.errorText}>{result.text}</p>;
}
