// Small building blocks shared by the console sections. Data-dense, calm,
// keyboard friendly; colours come from the dashboard kit tokens.
import { cloneElement, isValidElement, useEffect, useId, useRef, useState } from "react";
import { sfx } from "../../../utils/sounds";
import { useTranslation } from "react-i18next";
import { Button, EmptyState, Sheet, Skeleton } from "../../../components/dashboard";
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

// Dialogs use the kit's Sheet: centred on wide screens, a sheet from the bottom
// on phones, with the open / close sounds. `wide` makes it the large size.
export function Modal({ title, onClose, children, footer, wide }) {
  return <Sheet title={title} onClose={onClose} footer={footer} size={wide ? "lg" : "md"}>{children}</Sheet>;
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

// The parts of one page (underline tabs under the page's pill row): role=tablist,
// arrow keys / Home / End, scrolls sideways instead of wrapping. Pair with
// <TabBody idBase value> so each panel is labelled by its tab.
export function Tabs({ tabs, value, onChange, label, idBase = "part", end }) {
  const ref = useRef(null);
  const list = tabs.filter(Boolean);
  useEffect(() => {
    const el = ref.current?.querySelector('[aria-selected="true"]');
    if (el && ref.current.scrollWidth > ref.current.clientWidth) el.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [value]);
  const onKey = (e) => {
    const i = list.findIndex((tb) => tb.key === value);
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    let j = null;
    if (e.key === (rtl ? "ArrowLeft" : "ArrowRight")) j = (i + 1) % list.length;
    else if (e.key === (rtl ? "ArrowRight" : "ArrowLeft")) j = (i - 1 + list.length) % list.length;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = list.length - 1;
    if (j == null) return;
    e.preventDefault();
    sfx.tab();
    onChange(list[j].key);
    requestAnimationFrame(() => ref.current?.querySelector(`[data-key="${CSS.escape(String(list[j].key))}"]`)?.focus());
  };
  return (
    <div className={s.tabsRow}>
      <div ref={ref} className={s.tabs} role="tablist" aria-label={label} onKeyDown={onKey}>
        {list.map((tb) => {
          const on = value === tb.key;
          return (
            <button key={tb.key} data-key={tb.key} id={`${idBase}-tab-${tb.key === "" ? "_" : tb.key}`} type="button" role="tab" aria-selected={on} aria-controls={`${idBase}-panel`} tabIndex={on ? 0 : -1} className={s.tab} onClick={() => { if (!on) onChange(tb.key); }}>
              {tb.label}{tb.badge ? <span className={s.tabBadge}>{tb.badge}</span> : null}
            </button>
          );
        })}
      </div>
      {end && <div className={s.tabsEnd}>{end}</div>}
    </div>
  );
}

// The panel of the open part (only one is rendered at a time).
export function TabBody({ idBase = "part", value, children }) {
  return <div id={`${idBase}-panel`} role="tabpanel" aria-labelledby={`${idBase}-tab-${value === "" ? "_" : value}`} className={s.tabBody}>{children}</div>;
}

// A filter (not navigation): a row of pressable chips, one chosen.
export function Segmented({ options, value, onChange, label }) {
  return (
    <div className={s.seg} role="group" aria-label={label}>
      {options.filter(Boolean).map((o) => (
        <button key={`k-${o.key}`} type="button" className={s.segBtn} aria-pressed={value === o.key} onClick={() => onChange(o.key)}>
          {o.label}{o.badge ? <span className={s.tabBadge}>{o.badge}</span> : null}
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
