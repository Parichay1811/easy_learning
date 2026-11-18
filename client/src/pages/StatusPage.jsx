// Public status page (SUP-043, P2): current state, active incidents and
// maintenance, and the recent incident log. No sign-in.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import s from "./StatusPage.module.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const fmt = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "");

export default function StatusPage() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    document.title = t("status.title", "Learnigo status");
    fetch(`${API}/api/status`).then((r) => r.json()).then(setData).catch(() => setError(true));
  }, [t]);
  const LABEL = {
    operational: t("status.operational", "All systems are working"),
    minor: t("status.minor", "Some features have minor issues"),
    degraded: t("status.degraded", "Some features are not working well"),
    maintenance: t("status.underMaintenance", "Planned maintenance in progress"),
    unknown: t("status.unknown", "Status unknown"),
  };
  const Incident = ({ i }) => (
    <li className={s.incident}>
      <div className={s.incHead}>
        <strong>{i.title}</strong>
        <span className={`${s.tag} ${s[i.status] || ""}`}>{t(`status.s.${i.status}`, i.status)}</span>
      </div>
      <p className={s.meta}>{i.kind === "maintenance" ? t("status.window", "Maintenance window: {{a}}{{b}}", { a: fmt(i.startsAt), b: i.endsAt ? ` – ${fmt(i.endsAt)}` : "" }) : t("status.started", "Started {{a}}", { a: fmt(i.startsAt) })}</p>
      {i.message && <p>{i.message}</p>}
      {i.updates?.length > 1 && (
        <ol className={s.updates}>
          {i.updates.slice().reverse().map((u, k) => <li key={k}><span className={s.meta}>{fmt(u.at)} · {u.status}</span> {u.message}</li>)}
        </ol>
      )}
    </li>
  );
  return (
    <main className={s.page}>
      <h1>{t("status.title", "Learnigo status")}</h1>
      {error && <p className={s.box}>{t("status.loadError", "We could not load the status right now.")}</p>}
      {data && (
        <>
          <p className={`${s.box} ${s[data.status] || ""}`} role="status"><span aria-hidden="true">{data.status === "operational" ? "✓ " : "! "}</span>{LABEL[data.status] || data.status}</p>
          <section>
            <h2>{t("status.now", "Now")}</h2>
            {data.active.length ? <ul className={s.list}>{data.active.map((i) => <Incident key={i.id} i={i} />)}</ul> : <p>{t("status.nothing", "Nothing ongoing.")}</p>}
          </section>
          <section>
            <h2>{t("status.history", "Recent incidents")}</h2>
            {data.recent.length ? <ul className={s.list}>{data.recent.map((i) => <Incident key={i.id} i={i} />)}</ul> : <p>{t("status.noHistory", "No incidents recently.")}</p>}
          </section>
        </>
      )}
    </main>
  );
}
