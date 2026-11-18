// Health and operations (SUP-040, SUP-041, SUP-043, Outbox): live server
// numbers with alerts, background jobs, incidents and maintenance, queued email.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ChartCard, DataTable, KpiTile, TrendLine, toTable } from "../../../components/dashboard";
import { useConsoleApi, useLoad, qs, dateTime, ago } from "./api";
import { Facts, Field, Loadable, Modal, Notice, Pager, Panel, Pill, StatusPill, Tabs } from "./ui";
import s from "./console.module.css";

const dur = (sec) => (sec == null ? "—" : sec < 3600 ? `${Math.round(sec / 60)} min` : sec < 86400 ? `${Math.round(sec / 3600)} h` : `${Math.round(sec / 86400)} d`);
const ms = (v) => (v == null ? null : `${Math.round(v)} ms`);
const pct = (v) => (v == null ? null : `${v} %`);

function Live() {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const h = useLoad("/ops/health", { pollMs: 30_000 });
  const [backup, setBackup] = useState(null);
  const H = h.data?.health;
  const tone = (v, warn, bad) => (v == null ? "neutral" : v >= bad ? "alert" : v >= warn ? "attention" : "good");
  return (
    <Loadable state={h}>
      {H && (
        <>
          {H.alerts.length > 0 && <Notice tone="alert">{H.alerts.map((a) => a.text).join(" · ")}</Notice>}
          <div className={s.kpis}>
            <KpiTile label={t("sa.h.p50", "API p50 (5 min)")} value={ms(H.api.p50)} helpText={t("sa.h.reqs", "{{n}} requests, {{m}} per minute", { n: H.api.requests, m: H.api.perMinute })} />
            <KpiTile label={t("sa.h.p95", "API p95 (5 min)")} value={ms(H.api.p95)} tone={tone(H.api.p95, 1000, H.limits.p95Ms)} sparkline={H.history.map((x) => x.p95 || 0)} />
            <KpiTile label={t("sa.h.errors", "Error rate (5 min)")} value={pct(H.api.errorRate)} tone={tone(H.api.errorRate, 1, H.limits.errorRatePct)} helpText={t("sa.h.errorsHelp", "Share of API answers with a 5xx status.")} />
            <KpiTile label={t("sa.h.cpu", "CPU busy")} value={pct(H.cpu?.busyPct)} tone={tone(H.cpu?.busyPct, 70, H.limits.cpuPct)} sparkline={H.history.map((x) => x.cpu || 0)} helpText={`${t("sa.h.load", "Load")} ${H.host.loadavg.join(" / ")} · ${H.host.cpus} CPU`} />
            <KpiTile label={t("sa.h.steal", "CPU steal")} value={H.cpu?.stealPct == null ? null : pct(H.cpu.stealPct)} tone={tone(H.cpu?.stealPct, 5, H.limits.stealPct)} helpText={H.cpu?.stealPct == null ? t("sa.h.noSteal", "Only measured on Linux (from /proc/stat).") : t("sa.h.stealHelp", "Time the host took this machine's CPU for others. A crash-looping process once pushed it to 95 %.")} />
            <KpiTile label={t("sa.h.mem", "Memory used")} value={pct(H.mem.usedPct)} tone={H.mem.approximate ? "neutral" : tone(H.mem.usedPct, 80, H.limits.memPct)} helpText={`${t("sa.h.memHelp", "API process: {{r}} MB (heap {{h}} MB) of {{t}} MB", { r: H.mem.rssMb, h: H.mem.heapUsedMb, t: H.mem.totalMb })}${H.mem.approximate ? ` ${t("sa.h.memApprox", "(includes the file cache on this system)")}` : ""}`} />
            <KpiTile label={t("sa.h.uptime", "API up for")} value={dur(H.process.uptimeSec)} helpText={`${H.process.node} · pid ${H.process.pid}`} />
            <KpiTile label={t("sa.h.ai", "AI Teacher")} value={H.ai.ok ? t("sa.h.ready", "Ready") : t("sa.h.notReady", "Not ready")} tone={H.ai.ok ? "good" : H.ai.disabled ? "neutral" : "attention"} helpText={H.ai.ok ? `${H.ai.latencyMs} ms · ${H.ai.voice || ""} · ${H.ai.packCount ?? "?"} packs` : H.ai.message} />
          </div>
          {H.history.length > 1 && (
            <ChartCard title={t("sa.h.trendQ", "Is the API getting slower?")} answer={t("sa.h.trendA", "p95 latency, one sample per minute (last 2 hours).")} table={toTable.trend(H.history.map((x) => ({ x: x.at.slice(11, 16), value: x.p95 || 0 })), t, { unit: "ms" })}>
              <TrendLine data={H.history.map((x) => ({ x: x.at.slice(11, 16), value: x.p95 || 0 }))} unit="ms" xFormat={(x) => x} />
            </ChartCard>
          )}
          <div className={s.grid2}>
            <Panel title={t("sa.h.dbs", "Databases")}>
              <DataTable caption={t("sa.h.dbs", "Databases")} rows={H.dbs} getRowKey={(d) => d.name} columns={[
                { key: "name", label: t("sa.h.db", "Database"), render: (d) => <span><span className={s.strong}>{d.name}</span><br /><span className={`${s.small} ${s.muted}`}>{(d.top || []).slice(0, 3).map((c) => `${c.name} ${c.count.toLocaleString()}`).join(" · ")}</span></span> },
                { key: "state", label: t("sa.col.status", "Status"), render: (d) => <StatusPill status={d.state} /> },
                { key: "dataMb", label: t("sa.h.data", "Data MB"), align: "end" }, { key: "storageMb", label: t("sa.h.disk", "On disk MB"), align: "end" }, { key: "collections", label: t("sa.h.cols", "Collections"), align: "end" },
              ]} />
            </Panel>
            <Panel title={t("sa.h.slow", "Slowest routes (5 min)")}>
              {H.api.slowest.length ? <DataTable caption={t("sa.h.slow", "Slowest routes")} rows={H.api.slowest} getRowKey={(r) => r.route} columns={[{ key: "route", label: t("sa.h.route", "Route"), render: (r) => <span className={s.mono}>{r.route}</span> }, { key: "count", label: "n", align: "end" }, { key: "avgMs", label: t("sa.h.avg", "Avg ms"), align: "end" }, { key: "maxMs", label: t("sa.h.max", "Max ms"), align: "end" }]} /> : <p className={s.muted}>{t("sa.h.noTraffic", "No traffic in the last 5 minutes.")}</p>}
            </Panel>
          </div>
          <div className={s.grid2}>
            <Panel title={t("sa.h.pm2", "Processes (PM2)")}>
              {H.pm2 ? <DataTable caption="PM2" rows={H.pm2} getRowKey={(p) => p.name} columns={[{ key: "name", label: t("sa.col.name", "Name") }, { key: "status", label: t("sa.col.status", "Status"), render: (p) => <StatusPill status={p.status === "online" ? "active" : "failed"} label={p.status} /> }, { key: "restarts", label: t("sa.h.restarts", "Restarts"), align: "end" }, { key: "memMb", label: "MB", align: "end" }, { key: "cpu", label: "CPU %", align: "end" }]} /> : <p className={s.muted}>{t("sa.h.noPm2", "PM2 is not available on this machine.")}</p>}
            </Panel>
            <Panel title={t("sa.h.backup", "Backups")} actions={<Button size="sm" variant="ghost" onClick={() => setBackup({ note: H.lastBackup?.note || "", at: new Date().toISOString().slice(0, 16), restoreTestedAt: "" })}>{t("sa.h.record", "Record a backup")}</Button>}>
              {H.lastBackup ? <Facts items={[[t("sa.h.lastBackup", "Last backup"), dateTime(H.lastBackup.at)], [t("sa.h.restore", "Last restore test"), H.lastBackup.restoreTestedAt ? dateTime(H.lastBackup.restoreTestedAt) : "—"], [t("sa.h.note", "Note"), H.lastBackup.note || "—"], [t("sa.h.by", "Recorded by"), H.lastBackup.by]]} /> : <p className={s.muted}>{t("sa.h.noBackup", "No backup recorded yet. Record the last backup and restore test here.")}</p>}
            </Panel>
          </div>
          {backup && (
            <Modal title={t("sa.h.record", "Record a backup")} onClose={() => setBackup(null)} footer={<Button onClick={async () => { await api.put("/ops/backup", { ...backup, at: new Date(backup.at).toISOString(), restoreTestedAt: backup.restoreTestedAt ? new Date(backup.restoreTestedAt).toISOString() : null }); setBackup(null); h.reload(); }}>{t("sa.save", "Save")}</Button>}>
              <Field label={t("sa.h.when", "When")}><input type="datetime-local" className={s.input} value={backup.at} onChange={(e) => setBackup({ ...backup, at: e.target.value })} /></Field>
              <Field label={t("sa.h.restore", "Last restore test")}><input type="datetime-local" className={s.input} value={backup.restoreTestedAt} onChange={(e) => setBackup({ ...backup, restoreTestedAt: e.target.value })} /></Field>
              <Field label={t("sa.h.note", "Note")}><input className={s.input} value={backup.note} onChange={(e) => setBackup({ ...backup, note: e.target.value })} placeholder="mongodump to S3, 3 databases" /></Field>
            </Modal>
          )}
        </>
      )}
    </Loadable>
  );
}

function Jobs() {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const j = useLoad("/ops/jobs", { pollMs: 5000 });
  const [msg, setMsg] = useState("");
  return (
    <Panel title={t("sa.jobs.title", "Background jobs")} sub={t("sa.jobs.sub", "Scheduled work and one-off runs. Heavy jobs run in their own process.")}>
      <Notice tone="good" onClose={() => setMsg("")}>{msg}</Notice>
      <Loadable state={j}>
        <ul className={s.list}>
          {(j.data?.jobs || []).map((job) => {
            const last = job.runs[0];
            return (
              <li key={job.name} className={s.listItem}>
                <span style={{ minWidth: 0 }}>
                  <span className={`${s.strong} ${s.mono}`}>{job.name}</span> {job.everyMs ? <Pill>{t("sa.jobs.every", "every {{d}}", { d: dur(job.everyMs / 1000) })}</Pill> : <Pill tone="accent">{t("sa.jobs.manual", "manual")}</Pill>}<br />
                  <span className={`${s.small} ${s.muted}`}>{job.description}</span><br />
                  {last && <span className={s.small}><StatusPill status={last.status} /> {ago(last.startedAt)} · {last.trigger}{last.by ? ` · ${last.by}` : ""}{last.status === "running" ? ` · ${last.progress} % ${last.message || ""}` : ""}{last.error ? ` · ${last.error}` : ""}</span>}
                </span>
                <Button size="sm" variant="soft" disabled={job.running} onClick={async () => { try { await api.post(`/ops/jobs/${job.name}/run`); setMsg(t("sa.jobs.started", "{{n}} started.", { n: job.name })); j.reload({ quiet: true }); } catch (e) { setMsg(e.message); } }}>{job.running ? t("sa.jobs.running", "Running…") : t("sa.jobs.run", "Run now")}</Button>
              </li>
            );
          })}
        </ul>
      </Loadable>
    </Panel>
  );
}

function Incidents() {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const list = useLoad("/ops/incidents");
  const [form, setForm] = useState(null);
  const [upd, setUpd] = useState(null);
  const [err, setErr] = useState("");
  const create = async () => {
    try {
      await api.post("/ops/incidents", { ...form, startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined, endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined });
      setForm(null); list.reload();
    } catch (e) { setErr(e.message); }
  };
  return (
    <Panel title={t("sa.inc.title", "Incidents and maintenance")} sub={t("sa.inc.sub", "Active items with a banner show on every page of the site and on the public status page (/status).")} actions={<>
      <Button size="sm" variant="ghost" onClick={() => setForm({ kind: "maintenance", title: "", severity: "minor", message: "", banner: true, startsAt: "", endsAt: "" })}>{t("sa.inc.planMaint", "Plan maintenance")}</Button>
      <Button size="sm" onClick={() => setForm({ kind: "incident", title: "", severity: "major", message: "", banner: true })}>{t("sa.inc.new", "Report incident")}</Button>
    </>}>
      <Loadable state={list} empty={list.data && !list.data.incidents.length ? { title: t("sa.inc.none", "No incidents recorded.") } : null}>
        {list.data && <DataTable caption={t("sa.inc.title", "Incidents")} rows={list.data.incidents} getRowKey={(i) => i.id} onRowClick={(i) => setUpd({ id: i.id, title: i.title, status: i.status, update: "", banner: i.banner })} columns={[
          { key: "title", label: t("sa.inc.what", "What"), render: (i) => <span><span className={s.strong}>{i.title}</span><br /><span className={`${s.small} ${s.muted}`}>{i.message}</span></span> },
          { key: "kind", label: t("sa.col.kind", "Kind"), render: (i) => <Pill tone={i.kind === "maintenance" ? "accent" : "alert"}>{i.kind}</Pill> },
          { key: "severity", label: t("sa.inc.sev", "Severity") }, { key: "status", label: t("sa.col.status", "Status"), render: (i) => <StatusPill status={i.status} /> },
          { key: "banner", label: t("sa.inc.banner", "Banner"), render: (i) => (i.banner && i.status !== "resolved" ? t("sa.on", "On") : t("sa.off", "Off")) },
          { key: "startsAt", label: t("sa.inc.start", "Start"), render: (i) => dateTime(i.startsAt) },
        ]} />}
      </Loadable>
      {form && (
        <Modal title={form.kind === "maintenance" ? t("sa.inc.planMaint", "Plan maintenance") : t("sa.inc.new", "Report incident")} onClose={() => setForm(null)} footer={<Button onClick={create}>{t("sa.inc.publish", "Publish")}</Button>}>
          <Notice tone="alert">{err}</Notice>
          <Field label={t("sa.inc.titleF", "Title (shown to everyone)")}><input className={s.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label={t("sa.inc.message", "Message")}><textarea className={s.textarea} rows={2} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field>
          <Field label={t("sa.inc.sev", "Severity")}><select className={s.select} value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>{["minor", "major", "critical"].map((x) => <option key={x}>{x}</option>)}</select></Field>
          {form.kind === "maintenance" && <div className={s.grid2}>
            <Field label={t("sa.inc.start", "Start")}><input type="datetime-local" className={s.input} value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></Field>
            <Field label={t("sa.inc.end", "End")}><input type="datetime-local" className={s.input} value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></Field>
          </div>}
          <label className={s.check}><input type="checkbox" checked={form.banner} onChange={(e) => setForm({ ...form, banner: e.target.checked })} /> {t("sa.inc.showBanner", "Show a banner on the site")}</label>
        </Modal>
      )}
      {upd && (
        <Modal title={upd.title} onClose={() => setUpd(null)} footer={<Button onClick={async () => { await api.patch(`/ops/incidents/${upd.id}`, { status: upd.status, update: upd.update, banner: upd.banner }); setUpd(null); list.reload(); }}>{t("sa.inc.post", "Post update")}</Button>}>
          <Field label={t("sa.col.status", "Status")}><select className={s.select} value={upd.status} onChange={(e) => setUpd({ ...upd, status: e.target.value })}>{["scheduled", "investigating", "identified", "monitoring", "resolved"].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label={t("sa.inc.update", "Update (public)")}><textarea className={s.textarea} rows={2} value={upd.update} onChange={(e) => setUpd({ ...upd, update: e.target.value })} /></Field>
          <label className={s.check}><input type="checkbox" checked={upd.banner} onChange={(e) => setUpd({ ...upd, banner: e.target.checked })} /> {t("sa.inc.showBanner", "Show a banner on the site")}</label>
        </Modal>
      )}
    </Panel>
  );
}

function Outbox() {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const [f, setF] = useState({ status: "", q: "", page: 1 });
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const o = useLoad(`/ops/outbox${qs({ ...f, limit: 25 })}`);
  const O = o.data;
  return (
    <Panel title={t("sa.ob.title", "Outbox")} sub={O ? (O.smtp ? t("sa.ob.smtp", "Email sending is on.") : t("sa.ob.noSmtp", "Email sending (SMTP) is not configured: messages wait here as 'queued'.")) : ""}>
      <form className={s.toolbar} role="search" onSubmit={(e) => { e.preventDefault(); setF({ ...f, q, page: 1 }); }}>
        <Field label={t("sa.search", "Search")}><input className={`${s.input} ${s.search}`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("sa.ob.ph", "Recipient or subject")} /></Field>
        <Field label={t("sa.col.status", "Status")}><select className={s.select} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value, page: 1 })}><option value="">{t("sa.all", "All")}</option>{["queued", "sent", "failed"].map((x) => <option key={x} value={x}>{x}{O?.counts?.[x] != null ? ` (${O.counts[x]})` : ""}</option>)}</select></Field>
        <Button type="submit" size="sm">{t("sa.apply", "Search")}</Button>
      </form>
      <Loadable state={o} empty={O && !O.rows.length ? { title: t("sa.ob.none", "No messages.") } : null}>
        {O && <>
          <DataTable caption={t("sa.ob.title", "Outbox")} rows={O.rows} getRowKey={(r) => r.id} onRowClick={setOpen} columns={[
            { key: "to", label: t("sa.ob.to", "To") }, { key: "subject", label: t("sa.ob.subject", "Subject") }, { key: "kind", label: t("sa.col.kind", "Kind"), render: (r) => <Pill>{r.kind}</Pill> },
            { key: "status", label: t("sa.col.status", "Status"), render: (r) => <StatusPill status={r.status} /> }, { key: "createdAt", label: t("sa.ob.when", "When"), render: (r) => dateTime(r.createdAt) },
          ]} />
          <Pager page={O.page} limit={25} total={O.total} onPage={(p) => setF({ ...f, page: p })} />
        </>}
      </Loadable>
      {open && <Modal wide title={open.subject} onClose={() => setOpen(null)} footer={O.smtp && open.status !== "sent" && <Button onClick={async () => { await api.post(`/ops/outbox/${open.id}/retry`); setOpen(null); o.reload(); }}>{t("sa.ob.retry", "Send again")}</Button>}>
        <Facts items={[[t("sa.ob.to", "To"), open.to], [t("sa.col.kind", "Kind"), open.kind], [t("sa.col.status", "Status"), open.status], open.error && [t("sa.ob.error", "Error"), open.error]]} />
        <pre className={s.secretValue}>{open.text}</pre>
      </Modal>}
    </Panel>
  );
}

export default function Health({ params, setParams }) {
  const { t } = useTranslation();
  const tab = params.get("tab") || "live";
  return (
    <>
      <Tabs label={t("sa.nav.health", "Health & ops")} value={tab} onChange={(k) => setParams(new URLSearchParams({ section: "health", tab: k }))} tabs={[
        { key: "live", label: t("sa.h.live", "System health") }, { key: "jobs", label: t("sa.jobs.title", "Background jobs") }, { key: "incidents", label: t("sa.inc.short", "Incidents") }, { key: "outbox", label: t("sa.ob.title", "Outbox") },
      ]} />
      {tab === "live" && <Live />}
      {tab === "jobs" && <Jobs />}
      {tab === "incidents" && <Incidents />}
      {tab === "outbox" && <Outbox />}
    </>
  );
}
