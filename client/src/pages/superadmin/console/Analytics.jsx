// Platform analytics (SUP-020..023): growth, learning, revenue and organisation
// health. Server numbers come from rollups and are cached for a few minutes.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChartCard, DataTable, Funnel, KpiTile, StackedBars, SubjectModuleMatrix, TrendLine, fmtDuration, fmtNumber, fmtPercent, toTable,
} from "../../../components/dashboard";
import { useLoad, money, dateOnly } from "./api";
import { Loadable, Panel, Pill, Tabs } from "./ui";
import { HealthBar, FlagPills } from "./orgBits";
import s from "./console.module.css";

const ROLE_SERIES = [
  { key: "student", label: "Learners", color: "#8b5cf6" }, { key: "parent", label: "Parents", color: "#40c057" },
  { key: "teacher", label: "Teachers", color: "#3d9bff" }, { key: "admin", label: "Admins", color: "#ff9d3b" },
];
const cellsOf = (matrix) => Object.entries(matrix || {}).flatMap(([subject, row]) => Object.entries(row).map(([module, c]) => ({ subject, module, accuracy: c.answered ? c.accuracy / 100 : null, minutes: c.minutes, answered: c.answered })));
const heat = (v) => (v == null ? "transparent" : `color-mix(in srgb, var(--d-accent) ${Math.round(Math.min(100, v))}%, var(--d-card))`);

function Growth({ days, go }) {
  const { t } = useTranslation();
  const g = useLoad(`/platform/growth?days=${days}`);
  const G = g.data?.growth;
  const steps = (G?.funnel?.steps || []).map((x) => ({ key: x.key, label: t(`sa.funnel.${x.key}`, { signup: "Signed up", first_lesson: "First lesson", day7: "Active on day 7+", linked_parent: "Parent linked", paid: "Paid" }[x.key]), value: x.n }));
  const roles = G ? [["learners", t("sa.learners", "Learners")], ["teacher", t("sa.teachers", "Teachers")], ["parent", t("sa.parents", "Parents")], ["admin", t("sa.admins", "Admins")]].map(([k, label]) => ({ key: k, label, ...G.active[k] })) : [];
  return (
    <Loadable state={g}>
      {G && (
        <>
          <div className={s.kpis}>
            <KpiTile label={t("sa.kpi.dau", "Learners today")} value={G.active.learners.dau} sparkline={G.series.map((p) => p.learners)} />
            <KpiTile label={t("sa.kpi.wau", "Learners this week")} value={G.active.learners.wau} />
            <KpiTile label={t("sa.kpi.mau", "Learners this month")} value={G.active.learners.mau} />
            <KpiTile label={t("sa.kpi.stickiness", "Stickiness (WAU / MAU)")} value={G.stickiness == null ? null : fmtPercent(G.stickiness / 100)} helpText={t("sa.kpi.stickinessHelp", "Share of this month's learners who also learned this week.")} />
            <KpiTile label={t("sa.kpi.minutes", "Learning time")} value={fmtDuration(G.series.reduce((a, p) => a + p.minutes, 0))} helpText={t("sa.kpi.inRange", "In the last {{d}} days", { d: days })} />
          </div>
          <div className={s.grid2}>
            <ChartCard title={t("sa.an.dailyQ", "How many learners learn each day?")} info={t("sa.an.dailyInfo", "Learners with at least one answer or 3 minutes of learning that day.")} table={toTable.trend(G.series.map((p) => ({ x: p.key, value: p.learners })), t, { unit: "" })}>
              <TrendLine data={G.series.map((p) => ({ x: p.key, value: p.learners }))} unit={t("sa.learners", "learners")} />
            </ChartCard>
            <ChartCard title={t("sa.an.minutesQ", "How many minutes are learned each day?")} table={toTable.trend(G.series.map((p) => ({ x: p.key, value: p.minutes })), t)}>
              <TrendLine data={G.series.map((p) => ({ x: p.key, value: p.minutes }))} unit="min" />
            </ChartCard>
          </div>
          <div className={s.grid2}>
            <Panel title={t("sa.an.byRole", "Active people by role")} sub={G.notes.roles}>
              <DataTable caption={t("sa.an.byRole", "Active people by role")} rows={roles} getRowKey={(r) => r.key} columns={[
                { key: "label", label: t("sa.col.role", "Role") }, { key: "dau", label: "DAU", align: "end" }, { key: "wau", label: "WAU", align: "end" }, { key: "mau", label: "MAU", align: "end" },
              ]} />
            </Panel>
            <ChartCard title={t("sa.an.funnelQ", "Where do new learners drop off?")} answer={t("sa.an.funnelA", "Learner accounts created in the last {{d}} days.", { d: G.funnel.cohortDays })} table={toTable.funnel(steps, t)}>
              <Funnel steps={steps} />
            </ChartCard>
          </div>
          <ChartCard title={t("sa.an.signupsQ", "Who is signing up each week?")} answer={t("sa.an.signupsA", "{{s}} learners, {{p}} parents, {{t}} teachers and {{a}} admins in the last {{d}} days.", { s: G.signups.totals.student, p: G.signups.totals.parent, t: G.signups.totals.teacher, a: G.signups.totals.admin, d: days })}
            table={toTable.stacked(G.signups.weekly.map((w) => ({ x: w.key, ...w })), t, { series: ROLE_SERIES, unit: "" })}
            empty={!G.signups.weekly.length && { title: t("sa.an.noSignups", "No sign-ups in this period.") }}>
            <StackedBars data={G.signups.weekly.map((w) => ({ x: w.key, ...w }))} series={ROLE_SERIES.map((r) => ({ ...r, label: t(`sa.an.${r.key}`, r.label) }))} unit="" yFormat={(v) => fmtNumber(v)} />
          </ChartCard>
          <div className={s.grid2}>
            <Panel title={t("sa.an.cohorts", "Weekly retention")} sub={t("sa.an.cohortsSub", "Each row: learners whose first lesson was that week. Cells: % active in week 0, 1, 2…")}>
              {G.cohorts.rows.length ? (
                <div className={s.tableWrap}>
                  <table className={s.cohort}>
                    <caption className={s.srOnly}>{t("sa.an.cohorts", "Weekly retention")}</caption>
                    <thead><tr><th scope="col">{t("sa.an.cohort", "First week")}</th><th scope="col">{t("sa.an.size", "Learners")}</th>{Array.from({ length: G.cohorts.weeks }, (_, i) => <th key={i} scope="col">{t("sa.an.week", "W{{n}}", { n: i })}</th>)}</tr></thead>
                    <tbody>{G.cohorts.rows.map((r) => <tr key={r.cohort}><th scope="row" className={s.nowrap}>{new Date(`${r.cohort}T12:00:00Z`).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</th><td>{r.size}</td>{r.retention.map((v, i) => <td key={i} className={s.nowrap} style={{ background: heat(v), color: v != null && v >= 50 ? "var(--d-on-accent)" : undefined }}>{v == null ? "" : `${v}%`}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              ) : <p className={s.muted}>{t("sa.an.noCohorts", "No new learners in the last 8 weeks.")}</p>}
            </Panel>
            <Panel title={t("sa.an.where", "Where are learners?")} sub={t("sa.an.whereSub", "From each learner's timezone (no location is stored). Organisations by country are below.")}>
              <DataTable caption={t("sa.an.regions", "Learners by region")} rows={G.regions} getRowKey={(r) => r.region} columns={[{ key: "region", label: t("sa.an.region", "Region") }, { key: "learners", label: t("sa.learners", "Learners"), align: "end" }]} />
              {G.signups.orgsByCountry.length > 0 && <p className={`${s.small} ${s.muted}`}>{t("sa.an.orgCountries", "New organisations: {{list}}", { list: G.signups.orgsByCountry.map((c) => `${c.country} ${c.orgs}`).join(" · ") })}</p>}
              <button type="button" className={s.linkBtn} onClick={() => go("orgs")}>{t("sa.an.openOrgs", "Open organisations")}</button>
            </Panel>
          </div>
        </>
      )}
    </Loadable>
  );
}

function Learning({ days }) {
  const { t } = useTranslation();
  const l = useLoad(`/platform/learning?days=${days}`);
  const L = l.data?.learning;
  const cells = cellsOf(L?.matrix);
  return (
    <Loadable state={l}>
      {L && (
        <>
          <div className={s.kpis}>
            <KpiTile label={t("sa.learners", "Learners")} value={L.totals.learners} />
            <KpiTile label={t("sa.kpi.minutes", "Learning time")} value={fmtDuration(L.totals.minutes)} />
            <KpiTile label={t("sa.f.answers", "Answers")} value={L.totals.answered} />
            <KpiTile label={t("sa.f.accuracy", "Accuracy")} value={L.totals.accuracy == null ? null : fmtPercent(L.totals.accuracy / 100)} />
            <KpiTile label={t("sa.an.ar", "AR game sessions")} value={L.ar.sessions} />
          </div>
          <ChartCard title={t("sa.an.matrixQ", "Which subjects and skills are used, and how well?")} answer={L.top[0] ? t("sa.an.matrixA", "Most used: {{m}} {{s}}. Not used at all: {{n}}.", { m: L.top[0].module, s: L.top[0].subject, n: L.unused.length }) : ""} table={toTable.matrix(cells, t)}>
            <SubjectModuleMatrix cells={cells} />
          </ChartCard>
          <div className={s.grid3}>
            <Panel title={t("sa.an.sources", "Where learning happens")}>
              <DataTable caption={t("sa.an.sources", "Where learning happens")} rows={L.sources} getRowKey={(r) => r.source} columns={[{ key: "source", label: t("sa.an.source", "Source") }, { key: "events", label: t("sa.an.events", "Events"), align: "end" }]} />
            </Panel>
            <Panel title={t("sa.an.devices", "Devices")}>
              <DataTable caption={t("sa.an.devices", "Devices")} rows={L.devices} getRowKey={(r) => r.device} columns={[{ key: "device", label: t("sa.an.device", "Device") }, { key: "events", label: t("sa.an.events", "Events"), align: "end" }]} />
            </Panel>
            <Panel title={t("sa.an.arGames", "AR games")}>
              {L.ar.games.length ? <DataTable caption={t("sa.an.arGames", "AR games")} rows={L.ar.games} getRowKey={(r) => r.game} columns={[{ key: "game", label: t("sa.an.game", "Game") }, { key: "sessions", label: t("sa.an.sessions", "Sessions"), align: "end" }, { key: "learners", label: t("sa.learners", "Learners"), align: "end" }]} /> : <p className={s.muted}>{t("sa.an.noAr", "No AR sessions in this period.")}</p>}
            </Panel>
          </div>
          <div className={s.grid2}>
            <Panel title={t("sa.an.ai", "AI Teacher")} sub={L.ai.available ? t("sa.an.aiSub", "From the assistant's own log of recent questions.") : L.ai.message}>
              {L.ai.available ? (
                <>
                  <p>{t("sa.an.aiAsks", "{{n}} recent questions. By how they were answered: {{tiers}}", { n: L.ai.asks, tiers: Object.entries(L.ai.byTier).map(([k, v]) => `${k} ${v}`).join(" · ") || "—" })}</p>
                  <h3 className={s.label}>{t("sa.an.topTopics", "Top topics")}</h3>
                  <ul className={s.list}>{L.ai.topTopics.map((x) => <li key={x.topic} className={s.listItem}><span>{x.topic}</span><span className={s.num}>{x.n}</span></li>)}</ul>
                  <h3 className={s.label}>{t("sa.an.missing", "Asked for, but no lesson yet")}</h3>
                  <ul className={s.list}>{L.ai.missingTopics.map((x) => <li key={x.text} className={s.listItem}><span>{x.text}</span><Pill tone="attention">{x.count}×</Pill></li>)}</ul>
                </>
              ) : <p className={s.muted}>{t("sa.an.aiOff", "The AI Teacher is not running on this server.")}</p>}
            </Panel>
            <Panel title={t("sa.an.notLogged", "Not measured yet")}>
              <ul className={s.list}>
                <li className={s.listItem}><span><span className={s.strong}>{t("sa.an.languages", "Languages")}</span><br /><span className={`${s.small} ${s.muted}`}>{L.notes.languages}</span></span></li>
                <li className={s.listItem}><span><span className={s.strong}>{t("sa.an.a11y", "Accessibility features")}</span><br /><span className={`${s.small} ${s.muted}`}>{L.notes.accessibility}</span></span></li>
              </ul>
            </Panel>
          </div>
        </>
      )}
    </Loadable>
  );
}

function Revenue() {
  const { t } = useTranslation();
  const r = useLoad("/platform/revenue");
  const R = r.data?.revenue;
  const m = (c) => money(c, R?.currency);
  return (
    <Loadable state={r}>
      {R && (
        <>
          <div className={s.kpis}>
            <KpiTile label="MRR" value={m(R.mrrCents)} helpText={t("sa.rev.mrrHelp", "Monthly value of active and past-due subscriptions (yearly plans divided by 12).")} />
            <KpiTile label="ARR" value={m(R.arrCents)} />
            <KpiTile label={t("sa.rev.subs", "Paying customers")} value={R.subscribers} helpText={t("sa.rev.family", "+ {{n}} Family Plus parents", { n: R.familyPlus })} />
            <KpiTile label={t("sa.rev.trials", "Trials")} value={R.trials.active} helpText={t("sa.rev.trialsHelp", "{{n}} end within 7 days. Conversion: {{c}}", { n: R.trials.endingIn7d, c: R.trials.conversion == null ? "—" : `${R.trials.conversion} %` })} />
            <KpiTile label={t("sa.rev.churn", "Cancelled (30 d)")} value={R.churn.last30d} tone={R.churn.last30d ? "attention" : "neutral"} />
            <KpiTile label={t("sa.rev.failed", "Failed payments")} value={R.failedPayments} tone={R.failedPayments ? "alert" : "neutral"} />
            <KpiTile label={t("sa.rev.open", "Invoices awaiting payment")} value={R.invoices.open} helpText={`${m(R.invoices.openCents)} · ${t("sa.rev.overdue", "{{n}} overdue", { n: R.invoices.overdue })}`} />
            <KpiTile label={t("sa.rev.seats", "Seats added (30 d)")} value={R.seatGrowth30d} />
          </div>
          {!R.stripe && <p className={`${s.small} ${s.muted}`}>{t("sa.rev.noStripe", "Card payments (Stripe) are not configured: subscriptions here are managed by hand (invoices, purchase orders).")}</p>}
          <div className={s.grid2}>
            <Panel title={t("sa.rev.mix", "Plan mix")}>
              <DataTable caption={t("sa.rev.mix", "Plan mix")} rows={R.planMix} getRowKey={(x) => x.plan} columns={[
                { key: "plan", label: t("sa.col.plan", "Plan") }, { key: "active", label: t("sa.status.active", "Active"), align: "end" }, { key: "trialing", label: t("sa.status.trialing", "Trial"), align: "end" },
                { key: "past_due", label: t("sa.status.past_due", "Past due"), align: "end" }, { key: "cancelled", label: t("sa.status.cancelled", "Cancelled"), align: "end" }, { key: "mrrCents", label: "MRR", align: "end", render: (x) => m(x.mrrCents) },
              ]} />
            </Panel>
            <Panel title={t("sa.rev.reasons", "Why customers leave (30 d)")}>
              {R.churn.reasons.length ? <ul className={s.list}>{R.churn.reasons.map((x) => <li key={x.reason} className={s.listItem}><span>{x.reason}</span><span className={s.num}>{x.n}</span></li>)}</ul> : <p className={s.muted}>{t("sa.rev.noChurn", "No cancellations in 30 days.")}</p>}
            </Panel>
          </div>
          <div className={s.grid2}>
            <Panel title={t("sa.rev.invoices", "Invoices awaiting payment")}>
              {R.invoices.list.length ? <DataTable caption={t("sa.rev.invoices", "Invoices awaiting payment")} rows={R.invoices.list} getRowKey={(x) => x.number} columns={[
                { key: "number", label: "#" }, { key: "plan", label: t("sa.col.plan", "Plan") }, { key: "amountCents", label: t("sa.amount", "Amount"), align: "end", render: (x) => money(x.amountCents, x.currency) }, { key: "dueAt", label: t("sa.due", "Due"), render: (x) => dateOnly(x.dueAt) },
              ]} /> : <p className={s.muted}>{t("sa.rev.noInvoices", "None.")}</p>}
            </Panel>
            <Panel title={t("sa.rev.vat", "VAT by country (12 months)")} sub={R.notes.vat}>
              {R.vatByCountry.length ? <DataTable caption={t("sa.rev.vat", "VAT by country")} rows={R.vatByCountry} getRowKey={(x) => x.country} columns={[
                { key: "country", label: t("sa.col.country", "Country") }, { key: "invoicedCents", label: t("sa.rev.invoiced", "Invoiced"), align: "end", render: (x) => m(x.invoicedCents) }, { key: "vatCents", label: t("sa.rev.vatCol", "VAT"), align: "end", render: (x) => m(x.vatCents) },
              ]} /> : <p className={s.muted}>{t("sa.rev.noVat", "No paid invoices yet.")}</p>}
            </Panel>
          </div>
        </>
      )}
    </Loadable>
  );
}

function OrgHealth({ go }) {
  const { t } = useTranslation();
  const d = useLoad("/directory?sort=health&limit=50&status=approved");
  return (
    <Panel title={t("sa.oh.title", "Organisation health")} sub={t("sa.oh.sub", "Score 0–100: engagement 40 %, teacher activity 25 %, parents linked 20 %, open support 15 %. Lowest first. Support is alerted when a score drops 15 points in a day.")}>
      <Loadable state={d}>
        {d.data && <DataTable caption={t("sa.oh.title", "Organisation health")} rows={d.data.rows} getRowKey={(r) => r.id} onRowClick={(r) => go("orgs", { org: r.id })} columns={[
          { key: "name", label: t("sa.col.name", "Name") }, { key: "kind", label: t("sa.col.kind", "Kind") },
          { key: "health", label: t("sa.col.health", "Health"), render: (r) => <HealthBar value={r.health} /> },
          { key: "active7", label: t("sa.col.active7", "Active 7 d"), align: "end", render: (r) => `${r.active7} / ${r.learners}` },
          { key: "activeTutors", label: t("sa.col.teachersActive", "Teachers active"), align: "end", render: (r) => `${r.activeTutors} / ${r.tutors}` },
          { key: "linkedParents", label: t("sa.col.parentsLinked", "Parents linked"), align: "end" },
          { key: "openTickets", label: t("sa.col.tickets", "Open tickets"), align: "end" },
          { key: "flags", label: t("sa.col.flags", "Flags"), render: (r) => <FlagPills flags={r.flags} /> },
        ]} />}
      </Loadable>
    </Panel>
  );
}

export default function Analytics({ role, params, setParams, go }) {
  const { t } = useTranslation();
  const tab = params.get("tab") || "growth";
  const [days, setDays] = useState(30);
  const tabs = [
    { key: "growth", label: t("sa.an.growth", "Growth") }, { key: "learning", label: t("sa.an.learning", "Learning") },
    ...(["owner", "finance", "analyst"].includes(role) ? [{ key: "revenue", label: t("sa.an.revenue", "Revenue") }] : []),
    { key: "health", label: t("sa.an.orgHealth", "Organisation health") },
  ];
  return (
    <>
      <div className={s.row}>
        <Tabs label={t("sa.an.tabs", "Analytics")} value={tab} onChange={(k) => setParams(new URLSearchParams({ section: "analytics", tab: k }))} tabs={tabs} />
        <span className={s.spacer} />
        {["growth", "learning"].includes(tab) && (
          <div className={s.chipsRow} role="group" aria-label={t("sa.an.range", "Range")}>
            {[30, 90, 180].map((d) => <button key={d} type="button" className={s.chipBtn} aria-pressed={days === d} onClick={() => setDays(d)}>{t("sa.an.days", "{{n}} days", { n: d })}</button>)}
          </div>
        )}
      </div>
      {tab === "growth" && <Growth days={days} go={go} />}
      {tab === "learning" && <Learning days={days} />}
      {tab === "revenue" && <Revenue />}
      {tab === "health" && <OrgHealth go={go} />}
    </>
  );
}
