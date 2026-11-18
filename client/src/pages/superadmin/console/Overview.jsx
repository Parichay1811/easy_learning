// Console home: the answer first (one sentence), then key numbers, the funnel,
// the trend and what needs a person today.
import { useTranslation } from "react-i18next";
import { ChartCard, Funnel, KpiTile, StoryCard, TrendLine, fmtNumber, toTable } from "../../../components/dashboard";
import { useLoad, money } from "./api";
import { Panel, Pill } from "./ui";
import s from "./console.module.css";

export default function Overview({ role, go, live }) {
  const { t } = useTranslation();
  const g = useLoad("/platform/growth?days=30");
  const health = useLoad("/ops/health", { skip: !["owner", "engineer"].includes(role), pollMs: 60_000 });
  const G = g.data?.growth;
  const series = G?.series || [];
  const last7 = series.slice(-7).reduce((a, p) => a + p.learners, 0);
  const prev7 = series.slice(-14, -7).reduce((a, p) => a + p.learners, 0);
  const steps = (G?.funnel?.steps || []).map((x) => ({ key: x.key, label: t(`sa.funnel.${x.key}`, { signup: "Signed up", first_lesson: "First lesson", day7: "Active on day 7+", linked_parent: "Parent linked", paid: "Paid" }[x.key]), value: x.n }));
  const alerts = health.data?.health?.alerts || [];

  const sentence = G
    ? t("sa.overview.story", "{{dau}} learners learned today; {{wau}} this week and {{mau}} this month. Learner-days this week are {{dir}} last week.", {
      dau: fmtNumber(G.active.learners.dau), wau: fmtNumber(G.active.learners.wau), mau: fmtNumber(G.active.learners.mau),
      dir: last7 >= prev7 ? t("sa.overview.up", "up on") : t("sa.overview.down", "down on"),
    })
    : "";
  const chips = [
    live?.pendingOrgs ? { kind: "nudge", text: t("sa.overview.chipApprovals", "Waiting for approval: {{n}}", { n: live.pendingOrgs }), onClick: () => go("approvals") } : null,
    live?.dataOverdue ? { kind: "alert", text: t("sa.overview.chipGdpr", "Data requests overdue: {{n}}", { n: live.dataOverdue }), onClick: () => go("privacy") } : null,
    live?.openSupport ? { kind: "info", text: t("sa.overview.chipSupport", "Open support conversations: {{n}}", { n: live.openSupport }), onClick: () => go("support") } : null,
    ...alerts.slice(0, 1).map((a) => ({ kind: "alert", text: a.text, onClick: () => go("health") })),
  ].filter(Boolean).slice(0, 4);

  return (
    <>
      <StoryCard title={t("sa.overview.title", "The platform today")} sentence={sentence} chips={chips} loading={g.loading && !G} />
      <div className={s.kpis}>
        <KpiTile loading={!G} label={t("sa.kpi.dau", "Learners today")} value={G?.active.learners.dau} sparkline={series.map((p) => p.learners)} helpText={t("sa.kpi.dauHelp", "Learners with at least one answer or 3 minutes of learning today.")} onClick={() => go("analytics")} />
        <KpiTile loading={!G} label={t("sa.kpi.wau", "Learners this week")} value={G?.active.learners.wau} delta={{ current: last7, previous: prev7, mode: "percent", vs: t("sa.vsLastWeek", "last week") }} onClick={() => go("analytics")} />
        <KpiTile loading={!G} label={t("sa.kpi.mau", "Learners this month")} value={G?.active.learners.mau} helpText={t("sa.kpi.stick", "Stickiness (weekly / monthly): {{v}} %", { v: G?.stickiness ?? "—" })} onClick={() => go("analytics")} />
        <KpiTile loading={!G} label={t("sa.kpi.teachers", "Teachers this week")} value={G?.active.teacher.wau} onClick={() => go("analytics")} />
        <KpiTile loading={!G} label={t("sa.kpi.parents", "Parents this week")} value={G?.active.parent.wau} onClick={() => go("analytics")} />
        {live?.mrrCents != null && ["owner", "finance", "analyst"].includes(role) && <KpiTile label="MRR" value={money(live.mrrCents, live.currency)} onClick={() => go("analytics", { tab: "revenue" })} />}
      </div>
      <div className={s.grid2}>
        <ChartCard
          title={t("sa.overview.trendQ", "Are more learners learning each day?")}
          answer={G ? t("sa.overview.trendA", "{{a}} learner-days in the last 7 days, {{b}} the week before.", { a: last7, b: prev7 }) : ""}
          info={t("sa.overview.trendInfo", "Daily count of learners with at least one answer or 3 minutes of learning (from learning rollups).")}
          loading={!G} error={g.error} onRetry={g.reload}
          table={G ? toTable.trend(series.map((p) => ({ x: p.key, value: p.learners })), t) : undefined}
        >
          <TrendLine data={series.map((p) => ({ x: p.key, value: p.learners }))} unit={t("sa.learners", "learners")} seriesLabel={t("sa.learners", "learners")} />
        </ChartCard>
        <ChartCard
          title={t("sa.overview.funnelQ", "Where do new learners drop off?")}
          answer={steps.length ? t("sa.overview.funnelA", "Of {{a}} new learners in 90 days, {{b}} came back after a week.", { a: steps[0].value, b: steps[2]?.value ?? 0 }) : ""}
          info={t("sa.overview.funnelInfo", "Learner accounts created in the last 90 days: first lesson, still active 7+ days after the first, a verified parent, on a paid plan.")}
          loading={!G} table={steps.length ? toTable.funnel(steps, t) : undefined}
        >
          <Funnel steps={steps} />
        </ChartCard>
      </div>
      {["owner", "engineer"].includes(role) && (
        <Panel title={t("sa.overview.alerts", "Alerts")} actions={<button type="button" className={s.linkBtn} onClick={() => go("health")}>{t("sa.openHealth", "Open health")}</button>}>
          {alerts.length ? (
            <ul className={s.list}>{alerts.map((a) => <li key={a.key} className={s.listItem}><span>{a.text}</span><Pill tone={a.level === "alert" ? "alert" : "attention"}>{a.level}</Pill></li>)}</ul>
          ) : <p className={s.muted}>{health.loading ? t("sa.loading", "Loading…") : t("sa.overview.noAlerts", "No alerts. CPU, latency, errors, databases and the AI Teacher look fine.")}</p>}
        </Panel>
      )}
    </>
  );
}
