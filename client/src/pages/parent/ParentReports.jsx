import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, PlanLockCard, fmtDate } from "../../components/dashboard";
import { useLoad } from "./parentApi";
import YearInReview from "./YearInReview";
import s from "./parent.module.css";

const iso = (d) => d.toISOString().slice(0, 10);
function presets(t) {
  const now = new Date();
  const d = (n) => { const x = new Date(now); x.setDate(x.getDate() - n); return iso(x); };
  const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1), lmEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  return [
    { key: "30", label: t("parent.rep.p30", { defaultValue: "Last 30 days" }), from: d(29), to: iso(now) },
    { key: "month", label: t("parent.rep.pMonth", { defaultValue: "This month" }), from: iso(mStart), to: iso(now) },
    { key: "last", label: t("parent.rep.pLast", { defaultValue: "Last month" }), from: iso(lmStart), to: iso(lmEnd) },
    { key: "term", label: t("parent.rep.pTerm", { defaultValue: "Last 3 months" }), from: d(89), to: iso(now) },
  ];
}

// Reports and sharing (PAR-071, PAR-072) and the Year in Learnigo (PAR-080..082).
export default function ParentReports({ api, child }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.rep.${k}`, { defaultValue: d, ...o });
  const P = presets(t);
  const [pick, setPick] = useState(P[0]);
  const shares = useLoad(api.get, `/children/${child._id}/report-shares`);
  const [msg, setMsg] = useState(null);
  const [link, setLink] = useState(null);
  const [locked, setLocked] = useState(false);
  const [year, setYear] = useState(null);
  const first = child.name.split(" ")[0];

  const share = async () => {
    setMsg(null); setLink(null);
    const r = await api.post(`/children/${child._id}/report-shares`, { from: pick.from, to: pick.to, label: pick.label });
    if (r.code === "MODULE_LOCKED") return setLocked(true);
    if (!r.success) return setMsg({ ok: false, text: r.message });
    const url = `${window.location.origin}${r.path}`;
    setLink(url);
    try { await navigator.clipboard.writeText(url); setMsg({ ok: true, text: T("copied", "Link copied. It works for 7 days.") }); } catch { setMsg({ ok: true, text: T("made", "Link ready. It works for 7 days.") }); }
    shares.reload();
  };
  const revoke = async (sh) => { await api.del(`/children/${child._id}/report-shares/${sh.id}`); shares.reload(); };
  const openYear = async () => {
    const y = await api.get(`/children/${child._id}/analytics/year`);
    if (y.code === "MODULE_LOCKED") return setLocked(true);
    if (y.success) setYear(y);
  };

  return (
    <>
      <div className={s.pageHead}><div><h1>{T("title", "Reports")}</h1><p>{T("sub", "A report to keep, print or share, and {{name}}'s year in Learnigo.", { name: first })}</p></div></div>

      {locked && (
        <PlanLockCard module="analytics.deep" title={T("lockT", "Reports and the Year in Learnigo are part of Family Plus")}
          text={T("lockD", "Print a beautiful report, share it with a tutor or grandparent, and watch the year's story together.")} ctaLabel={T("lockCta", "Ask us about Family Plus")} />
      )}

      <section className={s.card} aria-labelledby="rep-h">
        <div className={s.cardHead}><h2 id="rep-h">{T("report", "Learning report")}</h2></div>
        <div className={s.filters} role="group" aria-label={T("period", "Period")}>
          {P.map((p) => <button key={p.key} type="button" className={s.filterBtn} aria-pressed={pick.key === p.key} onClick={() => setPick(p)}>{p.label}</button>)}
        </div>
        <p className={s.muted}>{fmtDate({ from: pick.from, to: pick.to }, { style: "long" })}</p>
        <div className={s.row}>
          <Button to={`/parent/report?child=${child._id}&from=${pick.from}&to=${pick.to}`}>{T("open", "Open the report")}</Button>
          <Button variant="soft" onClick={share}>{T("share", "Share a read-only link")}</Button>
        </div>
        {link && <p className={s.notice} style={{ marginTop: 12, overflowWrap: "anywhere" }}>{link}</p>}
        {msg && <p className={msg.ok ? s.ok : s.error} role="status" style={{ marginTop: 8 }}>{msg.text}</p>}
        {shares.data?.shares?.length > 0 && (
          <>
            <h3 style={{ margin: "16px 0 4px", fontSize: "1rem" }}>{T("links", "Shared links")}</h3>
            <ul className={s.list}>
              {shares.data.shares.map((sh) => (
                <li key={sh.id}>
                  <span>{sh.label || fmtDate({ from: sh.from, to: sh.to }, { style: "short" })}<br />
                    <span className={`${s.muted} ${s.small}`}>
                      {sh.active ? T("until", "Works until {{d}}", { d: fmtDate(String(sh.expiresAt).slice(0, 10), { style: "short" }) }) : sh.revokedAt ? T("off", "Turned off") : T("expired", "Expired")}
                      {" · "}{T("views", "{{n}} views", { n: sh.views, count: sh.views })}
                    </span>
                  </span>
                  {sh.active && <Button size="sm" variant="ghost" onClick={() => revoke(sh)}>{T("revoke", "Turn off")}</Button>}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className={s.card} aria-labelledby="yr-h" style={{ background: "linear-gradient(135deg, var(--d-accent-soft), var(--d-card))" }}>
        <div className={s.cardHead}><h2 id="yr-h">✨ {T("year", "{{name}}'s year in Learnigo", { name: first })}</h2></div>
        <p className={s.muted} style={{ marginTop: 0 }}>{T("yearD", "A short animated story to watch together: time learned, favourite subject, best month, milestones and a certificate to print.")}</p>
        <Button onClick={openYear}>{T("watch", "Watch the story")}</Button>
      </section>

      {year && <YearInReview data={year} onClose={() => setYear(null)} />}
    </>
  );
}
