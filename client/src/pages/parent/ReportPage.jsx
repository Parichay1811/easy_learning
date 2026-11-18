import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, EmptyState, PlanLockCard, Skeleton, fmtDate } from "../../components/dashboard";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { API_ROOT, TZ, useParentApi } from "./parentApi";
import ReportView from "./ReportView";
import r from "./report.module.css";

const iso = (d) => d.toISOString().slice(0, 10);
const monthAgo = () => { const d = new Date(); d.setDate(d.getDate() - 29); return iso(d); };

// /parent/report?child=&from=&to= : the print-optimised report (PAR-071). "Save as PDF" uses the browser.
export function ParentReportPage() {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.report.${k}`, { defaultValue: d, ...o });
  const { parentUser, getParentToken } = useAdminAuth();
  const api = useParentApi(getParentToken());
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const child = params.get("child");
  const from = params.get("from") || monthAgo();
  const to = params.get("to") || iso(new Date());
  const [state, setState] = useState({ loading: true });

  useEffect(() => { if (!parentUser && parentUser !== undefined) navigate("/parent-login"); }, [parentUser, navigate]);
  useEffect(() => {
    if (!child) return;
    let live = true;
    (async () => {
      setState({ loading: true });
      const d = await api.get(`/children/${child}/report?from=${from}&to=${to}`);
      if (live) setState({ loading: false, report: d.success ? d.report : null, error: d.success ? null : d.message, code: d.code });
    })();
    return () => { live = false; };
  }, [api, child, from, to]);
  useEffect(() => { if (state.report) document.title = `${state.report.child.name} · ${fmtDate({ from, to }, { style: "short" })} · Learnigo`; }, [state.report, from, to]);

  const setRange = (k, v) => setParams((p) => { const n = new URLSearchParams(p); n.set(k, v); return n; });

  return (
    <div className={`dash ${r.page}`}>
      <div className={r.bar} data-print="hide">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/parent-dashboard?tab=reports&child=${child || ""}`)}>{T("back", "← Back")}</Button>
        <span style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <label>{T("from", "From")}<input type="date" value={from} max={to} onChange={(e) => e.target.value && setRange("from", e.target.value)} /></label>
          <label>{T("to", "To")}<input type="date" value={to} min={from} onChange={(e) => e.target.value && setRange("to", e.target.value)} /></label>
        </span>
        <Button onClick={() => window.print()} disabled={!state.report}>{T("pdf", "Save as PDF / Print")}</Button>
      </div>
      <main className={r.doc}>
        {state.loading && <><Skeleton variant="rect" height={140} /><Skeleton variant="chart" /></>}
        {!state.loading && state.code === "MODULE_LOCKED" && (
          <PlanLockCard module="analytics.deep" title={T("lockT", "Reports are part of Family Plus")}
            text={T("lockD", "A beautiful monthly or term report you can print or share with a tutor or grandparent.")} ctaLabel={T("lockCta", "Ask us about Family Plus")} onUpgrade={() => navigate("/parent-dashboard?tab=support")} />
        )}
        {!state.loading && state.error && state.code !== "MODULE_LOCKED" && <EmptyState tone="error" title={T("error", "We couldn't make this report")} text={state.error} />}
        {state.report && <ReportView report={state.report} />}
      </main>
    </div>
  );
}

// /shared-report/:token : the read-only page a tutor or grandparent opens (PAR-072).
export function SharedReportPage() {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.report.${k}`, { defaultValue: d, ...o });
  const { token } = useParams();
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_ROOT}/api/public/report/${encodeURIComponent(token)}`, { headers: { "X-Timezone": TZ } });
        const d = await res.json();
        setState({ loading: false, ...(res.ok ? { report: d.report, expiresAt: d.expiresAt } : { error: d.message }) });
      } catch {
        setState({ loading: false, error: T("offline", "We couldn't reach Learnigo.") });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  useEffect(() => {
    const m = document.createElement("meta"); m.name = "robots"; m.content = "noindex"; document.head.appendChild(m);
    return () => m.remove();
  }, []);

  return (
    <div className={`dash ${r.page}`}>
      <main className={r.doc}>
        {state.loading && <Skeleton variant="rect" height={140} />}
        {state.error && <EmptyState icon="🔒" title={T("sharedGone", "This link isn't available")} text={state.error} />}
        {state.report && (
          <>
            <p className={r.banner} data-print="hide">
              {T("sharedBanner", "A parent shared this report with you. It is read-only and the link works until {{d}}.", { d: fmtDate(String(state.expiresAt).slice(0, 10), { style: "long" }) })}
              {" "}<Button variant="ghost" size="sm" onClick={() => window.print()}>{T("print", "Print")}</Button>
            </p>
            <ReportView report={state.report} />
          </>
        )}
      </main>
    </div>
  );
}
