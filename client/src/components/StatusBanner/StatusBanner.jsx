// Site-wide maintenance / incident banner (SUP-043). Reads the public
// GET /api/status every 5 minutes; a person can hide one banner (remembered
// per incident in this browser). Links to the public status page.
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import s from "./StatusBanner.module.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const HIDDEN = "learnigo_status_hidden";

export default function StatusBanner() {
  const { t } = useTranslation();
  const location = useLocation();
  const [banner, setBanner] = useState(null);
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(HIDDEN) || ""; } catch { return ""; } });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`${API}/api/status`);
        const d = await r.json();
        if (alive) setBanner(d.banner || null);
      } catch { /* status unknown: show nothing */ }
    };
    load();
    const id = setInterval(() => { if (!document.hidden) load(); }, 5 * 60_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // Camera games own the whole screen; the status page shows it already.
  if (!banner || hidden === banner.id || location.pathname.startsWith("/games/ar/") || location.pathname === "/status") return null;
  const maintenance = banner.kind === "maintenance";
  const when = maintenance && banner.startsAt ? new Date(banner.startsAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";
  return (
    <div className={`${s.banner} ${maintenance ? s.maintenance : s[banner.severity] || ""}`} role="status">
      <span className={s.text}>
        <strong>{maintenance ? t("status.maintenance", "Planned maintenance") : t("status.incident", "Service notice")}:</strong>{" "}
        {banner.title}{when ? ` (${when})` : ""}{banner.message ? `. ${banner.message}` : ""}
      </span>
      <Link className={s.link} to="/status">{t("status.details", "Details")}</Link>
      <button type="button" className={s.close} aria-label={t("status.hide", "Hide this notice")} onClick={() => { try { localStorage.setItem(HIDDEN, banner.id); } catch { /* fine */ } setHidden(banner.id); }}>×</button>
    </div>
  );
}
