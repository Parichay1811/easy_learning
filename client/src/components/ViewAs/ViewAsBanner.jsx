// The orange "you are viewing as" banner (SUP-002). Mounted once for the whole
// site; it shows while a view-as session is active in this browser, counts down
// the 30 minutes and ends the session (server-side too) on request or expiry.
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { clearActive, getActive } from "./viewAsStore";
import { useBannerSlot } from "../StatusBanner/bannerOffset";
import s from "./ViewAsBanner.module.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

export default function ViewAsBanner() {
  const { t } = useTranslation();
  const location = useLocation();
  const [now, setNow] = useState(() => Date.now());
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 15_000);
    window.addEventListener("storage", tick);
    return () => { clearInterval(id); window.removeEventListener("storage", tick); };
  }, []);
  // Re-read on every tick and page change (localStorage is the source of truth).
  const active = useMemo(() => (ended ? null : getActive()), [now, location.pathname, ended]); // eslint-disable-line react-hooks/exhaustive-deps

  const left = active ? new Date(active.expiresAt).getTime() - now : 0;
  const expired = active && left <= 0;

  useEffect(() => {
    if (expired) { clearActive(); }
  }, [expired]);

  useEffect(() => {
    document.documentElement.classList.toggle("viewAsActive", !!active && !expired);
    return () => document.documentElement.classList.remove("viewAsActive");
  }, [active, expired]);
  // Fixed at the very top: the status notice, the navbar and the page move down by its height.
  const slotRef = useBannerSlot("viewas");

  if (!active || location.pathname.startsWith("/superadmin")) return null;

  const end = async () => {
    const token = localStorage.getItem(active.storageKey);
    try { await fetch(`${API}/api/view-as/end`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }); } catch { /* it expires anyway */ }
    clearActive();
    setEnded(true);
    window.close();
    window.location.assign("/superadmin-dashboard");
  };

  if (expired) {
    return (
      <div ref={slotRef} className={s.banner} role="status">
        <strong>{t("viewAs.ended", "The read-only view has ended.")}</strong>
        <a className={s.btn} href="/superadmin-dashboard">{t("viewAs.back", "Back to the console")}</a>
      </div>
    );
  }
  const minutes = Math.max(1, Math.ceil(left / 60_000));
  const who = active.target?.name || active.target?.email || "";
  return (
    <div ref={slotRef} className={s.banner} role="region" aria-label={t("viewAs.label", "Viewing as another person")}>
      <span className={s.icon} aria-hidden="true">👁</span>
      <span>
        <strong>{t("viewAs.viewing", "Viewing as {{who}} ({{role}})", { who, role: active.target?.role })}</strong>
        {" · "}{t("viewAs.readOnly", "read-only, nothing can be changed")}
        {" · "}{t("viewAs.left", "{{n}} min left", { n: minutes })}
      </span>
      <button type="button" className={s.btn} onClick={end}>{t("viewAs.end", "End view")}</button>
    </div>
  );
}
