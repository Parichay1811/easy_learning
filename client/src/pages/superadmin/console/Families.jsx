// Families and independent learners (SUP-013): learners outside any
// organisation, their linked parents, growth, and the same analytics
// drill-down as everywhere else (asks for a reason; audited).
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ChartCard, DataTable, KpiTile, SubjectModuleMatrix, TrendLine, fmtDuration, fmtPercent, toTable } from "../../../components/dashboard";
import { useLoad, qs, dateOnly } from "./api";
import { Field, Loadable, Modal, Pager, Panel, Pill, ReasonDialog, StatusPill } from "./ui";
import s from "./console.module.css";

const cellsOf = (matrix) => Object.entries(matrix || {}).flatMap(([subject, row]) => Object.entries(row).map(([module, c]) => ({ subject, module, accuracy: c.answered ? c.accuracy / 100 : null, minutes: c.minutes })));

function LearnerView({ email, reason, onClose }) {
  const { t } = useTranslation();
  const [from] = useState(() => new Date(Date.now() - 29 * 86400_000).toISOString().slice(0, 10));
  const ov = useLoad(`/families/learners/${encodeURIComponent(email)}/analytics/overview?from=${from}&reason=${encodeURIComponent(reason)}`);
  const O = ov.data;
  return (
    <Modal wide title={email} onClose={onClose}>
      <Loadable state={ov}>
        {O && (
          <>
            <p>{O.story}</p>
            <div className={s.kpis}>
              <KpiTile label={t("sa.f.minutes", "Learning time (30 d)")} value={fmtDuration(O.totals.minutes)} />
              <KpiTile label={t("sa.f.answers", "Answers")} value={O.totals.answered} />
              <KpiTile label={t("sa.f.accuracy", "Accuracy")} value={O.totals.accuracy == null ? null : fmtPercent(O.totals.accuracy / 100)} />
              <KpiTile label={t("sa.f.days", "Active days")} value={O.totals.activeDays} />
            </div>
            <ChartCard title={t("sa.fam.trendQ", "When did they learn?")} table={toTable.trend(O.series.points.map((p) => ({ x: p.key, value: p.minutes })), t)}>
              <TrendLine data={O.series.points.map((p) => ({ x: p.key, value: p.minutes }))} unit="min" />
            </ChartCard>
            <ChartCard title={t("sa.fam.matrixQ", "Which subjects and skills?")} table={toTable.matrix(cellsOf(O.matrix), t)}>
              <SubjectModuleMatrix cells={cellsOf(O.matrix)} />
            </ChartCard>
          </>
        )}
      </Loadable>
    </Modal>
  );
}

export default function Families() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const f = useLoad(`/families${qs({ page, q: search, limit: 25 })}`);
  const [asking, setAsking] = useState(null);
  const [viewing, setViewing] = useState(null);
  const F = f.data;
  return (
    <>
      <div className={s.kpis}>
        <KpiTile loading={!F} label={t("sa.fam.learners", "Independent learners")} value={F?.counts.learners} />
        <KpiTile loading={!F} label={t("sa.fam.verified", "With a verified parent")} value={F?.counts.withVerifiedGuardian} />
        <KpiTile loading={!F} label={t("sa.fam.active", "Active in 30 days")} value={F?.counts.active30} />
        <KpiTile loading={!F} label={t("sa.fam.parents", "Parent accounts")} value={F?.counts.parents} helpText={t("sa.fam.plus", "{{n}} on Family Plus", { n: F?.counts.familyPlus ?? 0 })} />
      </div>
      {F?.growth?.length > 1 && (
        <ChartCard title={t("sa.fam.growthQ", "How fast are families joining?")} answer={t("sa.fam.growthA", "New independent learners per month.")} table={toTable.trend(F.growth.map((g) => ({ x: g.month, value: g.n })), t, { unit: "" })}>
          <TrendLine data={F.growth.map((g) => ({ x: g.month, value: g.n }))} unit={t("sa.learners", "learners")} xFormat={(x) => x} />
        </ChartCard>
      )}
      <Panel title={t("sa.fam.title", "Families and independent learners")} sub={t("sa.fam.sub", "Learners who are not in any school or tutor's workspace.")}>
        <form className={s.toolbar} role="search" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q); }}>
          <Field label={t("sa.search", "Search")}><input className={`${s.input} ${s.search}`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("sa.fam.ph", "Learner email or name")} /></Field>
          <Button type="submit" size="sm">{t("sa.apply", "Search")}</Button>
        </form>
        <Loadable state={f} empty={F && !F.rows.length ? { title: t("sa.fam.none", "No independent learners yet.") } : null}>
          {F && (
            <>
              <DataTable
                caption={t("sa.fam.caption", "Independent learners")}
                rows={F.rows}
                getRowKey={(r) => r.email}
                onRowClick={(r) => setAsking(r.email)}
                columns={[
                  { key: "email", label: t("sa.col.learner", "Learner"), render: (r) => <span><span className={s.strong}>{r.name || "—"}</span><br /><span className={`${s.small} ${s.muted}`}>{r.email}</span></span> },
                  { key: "source", label: t("sa.col.source", "Joined via"), render: (r) => <Pill>{r.source === "self" ? t("sa.fam.self", "own account") : t("sa.fam.family", "a parent")}</Pill> },
                  { key: "guardians", label: t("sa.col.guardians", "Parents"), render: (r) => (r.guardians.length ? r.guardians.map((g) => <span key={g.parentId} className={s.row}>{g.parent?.name || g.parent?.email || "—"} <StatusPill status={g.linkStatus === "verified" ? "active" : "pending"} label={g.linkStatus} />{g.parent?.plan === "family_plus" && <Pill tone="accent">Family Plus</Pill>}</span>) : "—") },
                  { key: "minutes30", label: t("sa.col.min30", "Minutes (30 d)"), align: "end" },
                  { key: "lastActive", label: t("sa.col.lastActive", "Last active"), render: (r) => r.lastActive || "—" },
                  { key: "createdAt", label: t("sa.col.created", "Created"), render: (r) => dateOnly(r.createdAt) },
                ]}
              />
              <Pager page={F.page} limit={F.limit} total={F.total} onPage={setPage} />
            </>
          )}
        </Loadable>
      </Panel>
      {asking && <ReasonDialog title={t("sa.fam.why", "Why do you need to see {{e}}'s learning?", { e: asking })} intro={t("sa.fam.whyIntro", "This is a child's data. The reason is saved in the audit log.")} confirmLabel={t("sa.open", "Open")} onClose={() => setAsking(null)} onConfirm={async (reason) => setViewing({ email: asking, reason })} />}
      {viewing && <LearnerView email={viewing.email} reason={viewing.reason} onClose={() => setViewing(null)} />}
    </>
  );
}
