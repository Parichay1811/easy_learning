// Small building blocks shared by the school pages.
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { NO_DATA } from "../../../components/dashboard";
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

// Accessible tabs bound to a value. tabs: [{ key, label }]
export function Tabs({ tabs, value, onChange, label }) {
  const refs = useRef({});
  const onKey = (e, i) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    onChange(next.key); refs.current[next.key]?.focus();
  };
  return (
    <div className={s.tabs} role="tablist" aria-label={label}>
      {tabs.map((tb, i) => (
        <button key={tb.key} ref={(el) => { refs.current[tb.key] = el; }} type="button" role="tab" className={s.tab}
          aria-selected={value === tb.key} tabIndex={value === tb.key ? 0 : -1} onClick={() => onChange(tb.key)} onKeyDown={(e) => onKey(e, i)}>
          {tb.label}
        </button>
      ))}
    </div>
  );
}

// A small modal dialog with focus on open and Escape to close.
export function Dialog({ title, onClose, children }) {
  const box = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    box.current?.querySelector("input,select,textarea,button")?.focus();
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("keydown", esc); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className={s.dlg} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={s.dlgBox} role="dialog" aria-modal="true" aria-labelledby="dlg-title" ref={box}>
        <h2 id="dlg-title" className={s.cardTitle} style={{ marginBottom: 14 }}>{title}</h2>
        {children}
      </div>
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
