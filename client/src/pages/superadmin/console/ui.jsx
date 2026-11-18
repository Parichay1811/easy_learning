// Small building blocks shared by the console sections. Data-dense, calm,
// keyboard friendly; colours come from the dashboard kit tokens.
import { cloneElement, isValidElement, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, EmptyState, Skeleton } from "../../../components/dashboard";
import s from "./console.module.css";
import { STATUS_TONE } from "./labels";

export function Panel({ title, sub, actions, children, id, className = "" }) {
  const hid = useId();
  return (
    <section className={`${s.panel} ${className}`} aria-labelledby={title ? hid : undefined} id={id} data-print="section">
      {(title || actions) && (
        <header className={s.panelHead}>
          <div>
            {title && <h2 id={hid} className={s.panelTitle}>{title}</h2>}
            {sub && <p className={s.panelSub}>{sub}</p>}
          </div>
          {actions && <div className={s.panelActions}>{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

// Status pill: always a word, colour only supports it.
const TONES = { good: s.toneGood, attention: s.toneAttention, alert: s.toneAlert, neutral: s.toneNeutral, accent: s.toneAccent };
export function Pill({ tone = "neutral", children, title }) {
  return <span className={`${s.pill} ${TONES[tone] || ""}`} title={title}>{children}</span>;
}

export function StatusPill({ status, label }) {
  const { t } = useTranslation();
  return <Pill tone={STATUS_TONE[status] || "neutral"}>{label || t(`sa.status.${status}`, String(status || "—").replace(/_/g, " "))}</Pill>;
}

export function Modal({ title, onClose, children, footer, wide }) {
  const ref = useRef(null);
  const hid = useId();
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const prev = document.activeElement;
    const el = ref.current;
    const first = el?.querySelector("input, textarea, select, button:not([data-close])");
    (first || el)?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab" && el) {
        const f = [...el.querySelectorAll("a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex='-1'])")];
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, []);
  return (
    <div className={s.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className={`${s.modal} ${wide ? s.modalWide : ""}`} role="dialog" aria-modal="true" aria-labelledby={hid} tabIndex={-1}>
        <header className={s.modalHead}>
          <h2 id={hid}>{title}</h2>
          <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Close" data-close>×</button>
        </header>
        <div className={s.modalBody}>{children}</div>
        {footer && <footer className={s.modalFoot}>{footer}</footer>}
      </div>
    </div>
  );
}

export function Field({ label, hint, children, error }) {
  const id = useId();
  const child = typeof children === "function" ? children(id) : children;
  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.label}>{label}</label>
      {hint && <p className={s.hint}>{hint}</p>}
      {isValidElement(child) ? cloneElement(child, { id, "aria-invalid": !!error || undefined }) : child}
      {error && <p className={s.fieldError} role="alert">{error}</p>}
    </div>
  );
}

// Every powerful action asks "why?" first. The reason goes to the audit log.
export function ReasonDialog({ title, intro, min = 5, confirmLabel, templates = [], extra, onConfirm, onClose, danger }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const short = reason.trim().length < min;
  const submit = async (e) => {
    e?.preventDefault();
    if (short) { setErr(t("sa.reason.short", "Please give a reason of at least {{n}} characters.", { n: min })); return; }
    setBusy(true); setErr("");
    try { await onConfirm(reason.trim()); onClose(); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <Modal title={title} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={onClose}>{t("sa.cancel", "Cancel")}</Button>
      <Button onClick={submit} disabled={busy} className={danger ? s.dangerBtn : ""}>{busy ? t("sa.working", "Working…") : confirmLabel || t("sa.confirm", "Confirm")}</Button>
    </>}>
      <form onSubmit={submit}>
        {intro && <p className={s.muted}>{intro}</p>}
        {templates.length > 0 && (
          <div className={s.chipsRow} role="group" aria-label={t("sa.reason.templates", "Templates")}>
            {templates.map((tp) => <button key={tp.key} type="button" className={s.chipBtn} onClick={() => setReason(tp.text)}>{tp.key.replace(/_/g, " ")}</button>)}
          </div>
        )}
        <Field label={t("sa.reason.label", "Reason (saved in the audit log)")} error={err}>
          <textarea className={s.textarea} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        {extra}
      </form>
    </Modal>
  );
}

export function Pager({ page, limit, total, onPage }) {
  const { t } = useTranslation();
  const pages = Math.max(1, Math.ceil((total || 0) / (limit || 1)));
  if (pages <= 1) return <p className={s.pagerInfo}>{t("sa.pager.count", "{{n}} in total", { n: total || 0 })}</p>;
  return (
    <nav className={s.pager} aria-label={t("sa.pager.label", "Pages")}>
      <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>{t("sa.pager.prev", "Previous")}</Button>
      <span className={s.pagerInfo}>{t("sa.pager.of", "Page {{page}} of {{pages}} · {{total}} in total", { page, pages, total })}</span>
      <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>{t("sa.pager.next", "Next")}</Button>
    </nav>
  );
}

export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div className={s.tabs} role="tablist" aria-label={label}>
      {tabs.map((tb) => (
        <button key={tb.key} type="button" role="tab" aria-selected={value === tb.key} className={s.tab} onClick={() => onChange(tb.key)}>
          {tb.label}{tb.badge ? <span className={s.tabBadge}>{tb.badge}</span> : null}
        </button>
      ))}
    </div>
  );
}

// Loading skeleton, friendly error with retry, or the content.
export function Loadable({ state, children, empty, rows = 4 }) {
  const { t } = useTranslation();
  if (state.loading && !state.data) return <div className={s.stack}>{Array.from({ length: rows }, (_, i) => <Skeleton key={i} variant="rect" height={28} />)}</div>;
  if (state.error && !state.data) return <EmptyState compact tone="error" title={t("sa.loadError", "Could not load this.")} text={state.error} actionLabel={t("sa.retry", "Try again")} onAction={() => state.reload()} />;
  if (empty) return <EmptyState compact title={empty.title} text={empty.text} actionLabel={empty.actionLabel} onAction={empty.onAction} />;
  return children;
}

export function Notice({ tone = "neutral", children, onClose }) {
  if (!children) return null;
  return (
    <div className={`${s.notice} ${TONES[tone] || ""}`} role={tone === "alert" ? "alert" : "status"}>
      <span>{children}</span>
      {onClose && <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Dismiss">×</button>}
    </div>
  );
}

// A row of label/value pairs.
export function Facts({ items }) {
  return (
    <dl className={s.facts}>
      {items.filter(Boolean).map(([k, v]) => (
        <div key={k} className={s.fact}><dt>{k}</dt><dd>{v ?? "—"}</dd></div>
      ))}
    </dl>
  );
}

// Shows a secret once with a copy button (temporary passwords, recovery codes).
export function SecretBox({ label, value }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  return (
    <div className={s.secret}>
      <p className={s.label}>{label}</p>
      <pre className={s.secretValue}>{value}</pre>
      <Button size="sm" variant="soft" onClick={async () => { try { await navigator.clipboard.writeText(value); setCopied(true); } catch { /* no clipboard */ } }}>
        {copied ? t("sa.copied", "Copied") : t("sa.copy", "Copy")}
      </Button>
    </div>
  );
}
