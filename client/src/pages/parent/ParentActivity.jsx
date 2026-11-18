import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  TimeRangeBar, useTimeRange, KpiTile, ChartCard, StackedBars, Timeline, Button, toTable, fmtDuration,
} from "../../components/dashboard";
import { useLoad } from "./parentApi";
import { eventsToTimeline } from "./timelineMap";
import s from "./parent.module.css";

const DEVICE_LABEL = { phone: "Phone", tablet: "Tablet", desktop: "Computer", unknown: "Other" };

// Usage (PAR-040..042): screen time, the activity log, and gentle healthy-use settings.
export default function ParentActivity({ api, child, onChanged }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.act.${k}`, { defaultValue: d, ...o });
  const tr = useTimeRange({ defaultRange: "week", defaultCmp: "none" });
  const base = `/children/${child._id}`;
  const q = `from=${tr.from}&to=${tr.to}`;
  const st = useLoad(api.get, `${base}/analytics/screen-time?${q}`);
  const tl = useLoad(api.get, `${base}/analytics/timeline?${q}&limit=500`);
  const [subject, setSubject] = useState("all");
  const [device, setDevice] = useState("all");
  const [exporting, setExporting] = useState(false);
  const first = child.name.split(" ")[0];

  const rows = useMemo(() => (tl.data?.events || []).filter((e) => (subject === "all" || e.subject === subject) && (device === "all" || e.device === device)), [tl.data, subject, device]);
  const events = useMemo(() => eventsToTimeline(rows, t), [rows, t]);
  const d = st.data;
  const bars = (d?.series?.points || []).map((p) => ({ x: p.key, english: p.bySubject?.english || 0, maths: p.bySubject?.maths || 0, science: p.bySubject?.science || 0 }));
  const devices = Object.entries(d?.devices || {}).sort((a, b) => b[1] - a[1]);
  const deviceTotal = devices.reduce((a, [, n]) => a + n, 0);

  const exportCsv = async () => {
    setExporting(true);
    await api.download(`${base}/activity.csv?${q}`, "learnigo-activity.csv");
    setExporting(false);
  };

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>{T("title", "When and how {{name}} uses Learnigo", { name: first })}</h1>
          <p>{T("sub", "Screen time, every session, and gentle limits if you want them.")}</p>
        </div>
      </div>
      <TimeRangeBar value={tr} ranges={["day", "week", "month", "custom"]} showCompare={false} sticky />

      <div className={s.kpis}>
        <KpiTile loading={st.loading && !d} label={T("total", "Total time")} value={d ? fmtDuration(d.minutes) : null} />
        <KpiTile loading={st.loading && !d} label={T("perDay", "Per learning day")} value={d?.avgPerActiveDay != null ? fmtDuration(d.avgPerActiveDay) : null} helpText={T("perDayHelp", "Average on the days with learning.")} />
        <KpiTile loading={st.loading && !d} label={T("longestDay", "Longest day")} value={d?.longestDay != null ? fmtDuration(d.longestDay) : null} />
        <KpiTile loading={st.loading && !d} label={T("longestSession", "Longest session")} value={d?.longestSession ? fmtDuration(d.longestSession.minutes) : null} helpText={d?.longestSession?.what} />
        <KpiTile loading={st.loading && !d} label={T("late", "Late-evening days")} value={d ? d.lateEveningDays : null}
          tone={d?.lateEveningDays > 2 ? "attention" : "neutral"} helpText={T("lateHelp", "Days with learning after 9 pm or before 6 am.")} />
        <KpiTile loading={st.loading && !d} label={T("devices", "Devices")} value={devices.length ? devices.map(([k]) => T(`dev.${k}`, DEVICE_LABEL[k] || k)).join(", ") : null} />
      </div>

      <ChartCard title={T("dailyTitle", "How much time each day?")} answer={d ? T("dailyAnswer", "{{t}} over {{n}} learning days", { t: fmtDuration(d.minutes), n: d.activeDays }) : undefined}
        loading={st.loading} error={st.error} onRetry={st.reload} table={toTable.stacked(bars, t)}
        empty={d && !d.minutes && { title: T("none", "No learning in this period") }}>
        <StackedBars data={bars} unit="min" goal={child.healthyUse?.dailyLimitMin || undefined} />
      </ChartCard>

      {devices.length > 0 && (
        <section className={s.card} aria-labelledby="p-dev-h">
          <div className={s.cardHead}><h2 id="p-dev-h">{T("devTitle", "Which devices?")}</h2></div>
          <ul className={s.list}>
            {devices.map(([k, n]) => <li key={k}><span>{T(`dev.${k}`, DEVICE_LABEL[k] || k)}</span><strong>{Math.round((n / deviceTotal) * 100)} %</strong></li>)}
          </ul>
        </section>
      )}

      <ChartCard title={T("logTitle", "Activity log")} answer={tl.data ? T("logAnswer", "{{n}} activities, newest first", { n: events.length }) : undefined}
        loading={tl.loading} error={tl.error} onRetry={tl.reload}
        actions={<Button variant="ghost" size="sm" onClick={exportCsv} disabled={exporting}>{exporting ? T("exporting", "Preparing…") : T("csv", "Download CSV")}</Button>}
        empty={tl.data && !events.length && { title: T("logEmpty", "Nothing to show"), text: subject !== "all" || device !== "all" ? T("logEmptyFilter", "Try another filter.") : T("logEmptyText", "Sessions appear here as {{name}} learns.", { name: first }) }}>
        <div className={s.row} style={{ marginBottom: 12 }}>
          <label className={s.field} style={{ flex: "1 1 160px" }}>{T("fSubject", "Subject")}
            <select className={s.select} value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="all">{T("all", "All")}</option>
              <option value="english">English</option><option value="maths">Maths</option><option value="science">Science</option>
            </select>
          </label>
          <label className={s.field} style={{ flex: "1 1 160px" }}>{T("fDevice", "Device")}
            <select className={s.select} value={device} onChange={(e) => setDevice(e.target.value)}>
              <option value="all">{T("all", "All")}</option>
              {["phone", "tablet", "desktop"].map((k) => <option key={k} value={k}>{T(`dev.${k}`, DEVICE_LABEL[k])}</option>)}
            </select>
          </label>
        </div>
        <Timeline events={events} />
      </ChartCard>

      <HealthyUse api={api} child={child} onChanged={onChanged} />
    </>
  );
}

// PAR-042: optional, gentle. Applied on the child's devices when they are signed in.
function HealthyUse({ api, child, onChanged }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.healthy.${k}`, { defaultValue: d, ...o });
  const h = child.healthyUse || {};
  const [form, setForm] = useState({ dailyLimitMin: h.dailyLimitMin || 0, quietStart: h.quietStart || "", quietEnd: h.quietEnd || "", breakEveryMin: h.breakEveryMin || 0 });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const quietOn = Boolean(form.quietStart || form.quietEnd);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const r = await api.patch(`/children/${child._id}/settings`, { healthyUse: { ...form, dailyLimitMin: Number(form.dailyLimitMin) || 0, breakEveryMin: Number(form.breakEveryMin) || 0 } });
    setBusy(false);
    setMsg(r.success ? { ok: true, text: T("saved", "Saved. {{name}} will see it next time they open Learnigo.", { name: child.name.split(" ")[0] }) } : { ok: false, text: r.message });
    if (r.success) onChanged?.();
  };

  return (
    <form className={s.card} onSubmit={save} aria-labelledby="p-healthy-h">
      <div className={s.cardHead}><h2 id="p-healthy-h">{T("title", "Healthy use")}</h2></div>
      <p className={`${s.muted} ${s.small}`} style={{ marginTop: 0 }}>{T("why", "All optional. When a limit is reached your child sees a friendly “time for a break” screen, never a punishment.")}</p>
      <div className={s.formGrid}>
        <label className={s.field}>{T("limit", "Daily time limit")}
          <select className={s.select} value={form.dailyLimitMin} onChange={set("dailyLimitMin")}>
            <option value={0}>{T("noLimit", "No limit")}</option>
            {[15, 20, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{fmtDuration(m)}</option>)}
          </select>
        </label>
        <label className={s.field}>{T("break", "Break reminder")}
          <select className={s.select} value={form.breakEveryMin} onChange={set("breakEveryMin")}>
            <option value={0}>{T("off", "Off")}</option>
            {[10, 15, 20, 30, 45].map((m) => <option key={m} value={m}>{T("every", "Every {{t}}", { t: fmtDuration(m) })}</option>)}
          </select>
        </label>
        <label className={s.check} style={{ gridColumn: "1 / -1" }}>
          <input type="checkbox" checked={quietOn} onChange={(e) => setForm((f) => ({ ...f, quietStart: e.target.checked ? "20:00" : "", quietEnd: e.target.checked ? "07:00" : "" }))} />
          {T("quiet", "Quiet hours (no learning at night)")}
        </label>
        {quietOn && (
          <>
            <label className={s.field}>{T("from", "From")}<input className={s.input} type="time" value={form.quietStart} onChange={set("quietStart")} required /></label>
            <label className={s.field}>{T("to", "Until")}<input className={s.input} type="time" value={form.quietEnd} onChange={set("quietEnd")} required /></label>
          </>
        )}
      </div>
      <div className={s.row} style={{ marginTop: 14 }}>
        <Button type="submit" disabled={busy}>{busy ? T("saving", "Saving…") : T("save", "Save")}</Button>
        {msg && <p className={msg.ok ? s.ok : s.error} role="status">{msg.text}</p>}
      </div>
    </form>
  );
}
