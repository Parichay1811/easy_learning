// Small shared pieces for the teacher pages: modal, usage meter, avatar, QR, palettes.
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaTimes } from "react-icons/fa";
import { encodeQr, qrPath } from "../../components/teacher/qr";
import s from "./teacher.module.css";

export function Modal({ title, onClose, children, wide }) {
  const { t } = useTranslation();
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.querySelector("input, select, textarea, button")?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className={s.backdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className={`${s.modal} ${wide ? s.modalWide : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className={s.modalHead}>
          <h2>{title}</h2>
          <button type="button" className={s.iconBtn} onClick={onClose} aria-label={t("teacher.close", { defaultValue: "Close" })}><FaTimes aria-hidden="true" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Meter({ label, used, max }) {
  const { t } = useTranslation();
  const unlimited = max == null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, max)) * 100));
  return (
    <div className={s.meter}>
      <label>
        <span>{label}</span>
        <span>{unlimited ? t("teacher.usage.unlimited", { defaultValue: "{{used}} · no limit", used }) : t("teacher.usage.of", { defaultValue: "{{used}} of {{max}}", used, max })}</span>
      </label>
      {!unlimited && (
        <div className={s.meterTrack} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={used} aria-label={label}>
          <div className={`${s.meterFill} ${used >= max ? s.meterFull : ""}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export function Avatar({ name }) {
  const initials = String(name || "?").split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return <span className={s.avatar} aria-hidden="true">{initials}</span>;
}

export function QrCode({ text, label }) {
  const qr = useMemo(() => { try { return encodeQr(text); } catch { return null; } }, [text]);
  if (!qr) return null;
  const n = qr.size + 8;
  return (
    <svg className={s.qr} viewBox={`0 0 ${n} ${n}`} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect width={n} height={n} fill="#fff" />
      <path d={qrPath(qr.modules)} fill="#000" />
    </svg>
  );
}
