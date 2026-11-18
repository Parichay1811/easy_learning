// Settings (admin only): ADM-060 policies, ADM-061 branding, ADM-012/062 years,
// terms, holidays and promotion, ADM-080 billing, ADM-081 data protection, ADM-082 audit log.
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaDownload, FaPlus, FaTrash, FaShieldAlt } from "react-icons/fa";
import { Button, Skeleton, PlanLockCard, DataTable, fmtDate } from "../../../components/dashboard";
import { api, useLoad, qs } from "./api";
import { useSchool } from "./context";
import { Tabs, Field, Result, StatusPill } from "./bits";
import s from "./school.module.css";

function Policies() {
  const data = useLoad("/policies");
  if (!data.data) return <Skeleton variant="text" lines={8} />;
  return <PoliciesForm initial={data.data.policy} />;
}

function PoliciesForm({ initial }) {
  const { t } = useTranslation();
  const [p, setP] = useState(initial);
  const [result, setResult] = useState(null);
  const save = async () => {
    const keys = ["messaging", "officeHours", "teachersCreateGroups", "parentsSeeClassAverage", "leaderboards", "aiTeacherInSchoolHours", "activityVisibility", "retentionYears", "holidaysKeepStreak", "reviewSlaDays"];
    try { const r = await api.put("/policies", Object.fromEntries(keys.map((k) => [k, p[k]]))); setP(r.policy); setResult({ ok: true, text: t("school.saved", { defaultValue: "Saved." }) }); }
    catch (e) { setResult({ ok: false, text: e.message }); }
  };
  const yes = (k, label, hint) => (
    <label className={s.check}><input type="checkbox" checked={Boolean(p[k])} onChange={(e) => setP({ ...p, [k]: e.target.checked })} /><span><span className={s.strong}>{label}</span>{hint && <><br /><span className={s.hint}>{hint}</span></>}</span></label>
  );
  return (
    <section className={s.card} aria-labelledby="pol-h">
      <h2 id="pol-h" className={s.cardTitle}>{t("school.pol.title", { defaultValue: "School policies" })}</h2>
      <p className={s.cardSub}>{t("school.pol.sub", { defaultValue: "These rules apply to every teacher, parent and student in your school." })}</p>
      {yes("teachersCreateGroups", t("school.pol.groups", { defaultValue: "Teachers may create their own groups" }))}
      {yes("parentsSeeClassAverage", t("school.pol.avg", { defaultValue: "Parents see class averages" }), t("school.pol.avgHint", { defaultValue: "Off: parents only see their own child compared with themselves." }))}
      {yes("aiTeacherInSchoolHours", t("school.pol.ai", { defaultValue: "AI Teacher available during school hours" }))}
      {yes("holidaysKeepStreak", t("school.pol.streak", { defaultValue: "Holidays in the school calendar don't break streaks" }))}
      <div className={s.formGrid} style={{ marginTop: 10 }}>
        <Field id="pol-msg" label={t("school.pol.messaging", { defaultValue: "Parent and teacher messages" })}>
          <select id="pol-msg" className={s.select} value={p.messaging} onChange={(e) => setP({ ...p, messaging: e.target.value })}>
            <option value="off">{t("school.pol.msgOff", { defaultValue: "Off" })}</option>
            <option value="parent_starts">{t("school.pol.msgParent", { defaultValue: "Parents can start a conversation" })}</option>
            <option value="both">{t("school.pol.msgBoth", { defaultValue: "Parents and teachers can start" })}</option>
          </select>
        </Field>
        <Field id="pol-hours" label={t("school.pol.hours", { defaultValue: "Office hours for messages" })}>
          <input id="pol-hours" className={s.input} value={p.officeHours} maxLength={120} placeholder="Mon-Fri 3-5 pm" onChange={(e) => setP({ ...p, officeHours: e.target.value })} />
        </Field>
        <Field id="pol-lb" label={t("school.pol.leader", { defaultValue: "Leaderboards" })}>
          <select id="pol-lb" className={s.select} value={p.leaderboards} onChange={(e) => setP({ ...p, leaderboards: e.target.value })}>
            <option value="off">{t("school.pol.lbOff", { defaultValue: "Off" })}</option>
            <option value="group">{t("school.pol.lbGroup", { defaultValue: "Within a group (first name and initial only)" })}</option>
          </select>
        </Field>
        <Field id="pol-vis" label={t("school.pol.vis", { defaultValue: "Activity the school sees" })}>
          <select id="pol-vis" className={s.select} value={p.activityVisibility} onChange={(e) => setP({ ...p, activityVisibility: e.target.value })}>
            <option value="assigned">{t("school.pol.visAssigned", { defaultValue: "Assigned work only" })}</option>
            <option value="school_hours">{t("school.pol.visHours", { defaultValue: "During school hours" })}</option>
            <option value="all">{t("school.pol.visAll", { defaultValue: "Everything, with parental consent" })}</option>
          </select>
        </Field>
        <Field id="pol-ret" label={t("school.pol.ret", { defaultValue: "Keep a leaver's data for (years)" })}>
          <input id="pol-ret" type="number" min={0} max={10} className={s.input} value={p.retentionYears} onChange={(e) => setP({ ...p, retentionYears: Number(e.target.value) })} />
        </Field>
        <Field id="pol-sla" label={t("school.pol.sla", { defaultValue: "Review questions within (days)" })}>
          <input id="pol-sla" type="number" min={1} max={30} className={s.input} value={p.reviewSlaDays} onChange={(e) => setP({ ...p, reviewSlaDays: Number(e.target.value) })} />
        </Field>
      </div>
      <div className={s.actions}><Button onClick={save}>{t("school.save", { defaultValue: "Save" })}</Button></div>
      <Result result={result} />
    </section>
  );
}

function Branding() {
  const { t } = useTranslation();
  const { has } = useSchool();
  const data = useLoad("/policies", { skip: !has("reports.branded") });
  if (!has("reports.branded")) return <PlanLockCard module="reports.branded" title={t("school.lock.brand", { defaultValue: "Your colours and logo on reports" })} />;
  if (!data.data) return <Skeleton variant="text" lines={6} />;
  return <BrandingForm initial={data.data.policy.branding} />;
}

function BrandingForm({ initial }) {
  const { t } = useTranslation();
  const { access } = useSchool();
  const [b, setB] = useState(initial);
  const [result, setResult] = useState(null);
  const save = async () => { try { const r = await api.put("/branding", b); setB(r.branding); setResult({ ok: true, text: t("school.saved", { defaultValue: "Saved." }) }); } catch (e) { setResult({ ok: false, text: e.message }); } };
  const color = (k, label) => (
    <Field id={`br-${k}`} label={label}>
      <span className={s.row}>
        <input type="color" className={s.swatch} value={b[k] || "#6c5ce7"} onChange={(e) => setB({ ...b, [k]: e.target.value })} aria-label={label} />
        <input id={`br-${k}`} className={s.input} value={b[k]} placeholder="#3d9bff" onChange={(e) => setB({ ...b, [k]: e.target.value })} style={{ width: 120 }} />
      </span>
    </Field>
  );
  return (
    <div className={s.grid2}>
      <section className={s.card} aria-labelledby="br-h">
        <h2 id="br-h" className={s.cardTitle}>{t("school.brand.title", { defaultValue: "Branding" })}</h2>
        <p className={s.cardSub}>{t("school.brand.sub", { defaultValue: "The logo comes from your organisation profile." })}</p>
        <div className={s.formGrid}>{color("primaryColor", t("school.brand.primary", { defaultValue: "Main colour" }))}{color("accentColor", t("school.brand.accent", { defaultValue: "Accent colour" }))}</div>
        <div style={{ height: 12 }} />
        <Field id="br-head" label={t("school.brand.header", { defaultValue: "Report header" })}><input id="br-head" className={s.input} maxLength={200} value={b.reportHeader} onChange={(e) => setB({ ...b, reportHeader: e.target.value })} /></Field>
        <div style={{ height: 12 }} />
        <Field id="br-foot" label={t("school.brand.footer", { defaultValue: "Report footer" })}><input id="br-foot" className={s.input} maxLength={200} value={b.reportFooter} onChange={(e) => setB({ ...b, reportFooter: e.target.value })} /></Field>
        <div style={{ height: 12 }} />
        <Field id="br-wel" label={t("school.brand.welcome", { defaultValue: "Welcome message for parents and students" })}><textarea id="br-wel" className={s.textarea} maxLength={400} value={b.welcomeMessage} onChange={(e) => setB({ ...b, welcomeMessage: e.target.value })} /></Field>
        <div className={s.actions}><Button onClick={save}>{t("school.save", { defaultValue: "Save" })}</Button></div>
        <Result result={result} />
      </section>
      <section className={s.card} aria-labelledby="brp-h">
        <h2 id="brp-h" className={s.cardTitle}>{t("school.brand.preview", { defaultValue: "Report preview" })}</h2>
        <div className={s.previewHeader} style={{ background: b.primaryColor || "#6c5ce7" }}>
          <span className={s.row}>{access.org.logoUrl && <img src={access.org.logoUrl} alt="" width="36" height="36" style={{ borderRadius: 8, background: "#fff" }} />}{b.reportHeader || access.org.name}</span>
        </div>
        <p className={s.muted} style={{ padding: "18px 4px" }}>{t("school.brand.body", { defaultValue: "Aanya learned 2 h 10 min this month and mastered 3 skills." })}</p>
        <div style={{ borderTop: `4px solid ${b.accentColor || "#43c0a0"}`, paddingTop: 8 }} className={`${s.small} ${s.muted}`}>{b.reportFooter || t("school.brand.footerPh", { defaultValue: "Footer text" })}</div>
      </section>
    </div>
  );
}

const blankYear = () => ({ name: "", start: "", end: "", terms: [], events: [] });

function SpanList({ label, items, onChange, withKind }) {
  const { t } = useTranslation();
  const set = (i, k, v) => onChange(items.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <fieldset style={{ border: 0, padding: 0, margin: "12px 0 0" }}>
      <legend className={s.label}>{label}</legend>
      {items.map((x, i) => (
        <div key={i} className={s.row} style={{ alignItems: "flex-end", marginTop: 8 }}>
          {withKind && (
            <Field id={`${label}-k-${i}`} label={t("school.cal.kind", { defaultValue: "Kind" })}>
              <select id={`${label}-k-${i}`} className={s.select} value={x.kind} onChange={(e) => set(i, "kind", e.target.value)}>
                <option value="holiday">{t("school.cal.holiday", { defaultValue: "Holiday" })}</option>
                <option value="exam">{t("school.cal.exam", { defaultValue: "Exam week" })}</option>
                <option value="event">{t("school.cal.event", { defaultValue: "Event" })}</option>
              </select>
            </Field>
          )}
          <Field id={`${label}-n-${i}`} label={t("school.tree.name", { defaultValue: "Name" })}><input id={`${label}-n-${i}`} className={s.input} value={x.name} onChange={(e) => set(i, "name", e.target.value)} /></Field>
          <Field id={`${label}-s-${i}`} label={t("school.cal.from", { defaultValue: "From" })}><input id={`${label}-s-${i}`} type="date" className={s.input} value={x.start} onChange={(e) => set(i, "start", e.target.value)} /></Field>
          <Field id={`${label}-e-${i}`} label={t("school.cal.to", { defaultValue: "To" })}><input id={`${label}-e-${i}`} type="date" className={s.input} value={x.end} onChange={(e) => set(i, "end", e.target.value)} /></Field>
          <button type="button" className={s.iconBtn} onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={t("school.cal.remove", { defaultValue: "Remove {{n}}", n: x.name || label })}><FaTrash /></button>
        </div>
      ))}
      <div className={s.actions} style={{ marginTop: 8 }}><Button size="sm" variant="ghost" icon={FaPlus} onClick={() => onChange([...items, withKind ? { kind: "holiday", name: "", start: "", end: "" } : { name: "", start: "", end: "" }])}>{t("school.add", { defaultValue: "Add" })}</Button></div>
    </fieldset>
  );
}

function Calendar() {
  const { t } = useTranslation();
  const years = useLoad("/years");
  const [edit, setEdit] = useState(null); // { _id?, ...year }
  const [result, setResult] = useState(null);
  const save = async () => {
    const body = { name: edit.name, start: edit.start, end: edit.end, terms: edit.terms.map(({ name, start, end }) => ({ name, start, end })), events: edit.events.map(({ kind, name, start, end }) => ({ kind, name, start, end })) };
    try { if (edit._id) await api.patch(`/years/${edit._id}`, body); else await api.post("/years", body); setEdit(null); setResult({ ok: true, text: t("school.saved", { defaultValue: "Saved." }) }); years.reload(); }
    catch (e) { setResult({ ok: false, text: e.message }); }
  };
  const makeCurrent = async (y) => { try { await api.patch(`/years/${y._id}`, { status: "current" }); years.reload(); } catch (e) { setResult({ ok: false, text: e.message }); } };
  return (
    <div className={s.page}>
      <section className={s.card} aria-labelledby="yr-h">
        <div className={s.head}><h2 id="yr-h" className={s.cardTitle}>{t("school.cal.title", { defaultValue: "Academic years, terms and holidays" })}</h2><Button size="sm" icon={FaPlus} onClick={() => setEdit(blankYear())}>{t("school.cal.newYear", { defaultValue: "New year" })}</Button></div>
        <ul className={s.list} style={{ marginTop: 12 }}>
          {(years.data?.years || []).map((y) => (
            <li key={y._id} className={s.listItem}>
              <span><span className={s.strong}>{y.name}</span> <span className={s.muted}>{fmtDate({ from: y.start, to: y.end })} · {t("school.cal.counts", { defaultValue: "{{t}} terms, {{h}} calendar entries", t: y.terms.length, h: y.events.length })}</span></span>
              <span className={s.row}>
                <StatusPill status={y.status === "current" ? "active" : y.status === "archived" ? "disabled" : "pending"} label={t(`school.cal.status.${y.status}`, { defaultValue: { current: "Current", archived: "Archived", planning: "Planning" }[y.status] })} />
                {y.status !== "current" && <Button size="sm" variant="ghost" onClick={() => makeCurrent(y)}>{t("school.cal.makeCurrent", { defaultValue: "Make current" })}</Button>}
                <Button size="sm" variant="ghost" onClick={() => setEdit({ ...y })}>{t("school.edit", { defaultValue: "Edit" })}</Button>
              </span>
            </li>
          ))}
          {years.data && !years.data.years.length && <li className={s.muted}>{t("school.cal.none", { defaultValue: "No academic year yet. Add one to compare terms and protect streaks over holidays." })}</li>}
        </ul>
      </section>
      {edit && (
        <section className={s.card} aria-labelledby="yr-edit">
          <h2 id="yr-edit" className={s.cardTitle}>{edit._id ? t("school.cal.editYear", { defaultValue: "Edit {{n}}", n: edit.name }) : t("school.cal.newYear", { defaultValue: "New year" })}</h2>
          <div className={s.formGrid}>
            <Field id="y-name" label={t("school.tree.name", { defaultValue: "Name" })}><input id="y-name" className={s.input} value={edit.name} placeholder="2026-27" onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field id="y-start" label={t("school.cal.from", { defaultValue: "From" })}><input id="y-start" type="date" className={s.input} value={edit.start} onChange={(e) => setEdit({ ...edit, start: e.target.value })} /></Field>
            <Field id="y-end" label={t("school.cal.to", { defaultValue: "To" })}><input id="y-end" type="date" className={s.input} value={edit.end} onChange={(e) => setEdit({ ...edit, end: e.target.value })} /></Field>
          </div>
          <SpanList label={t("school.cal.terms", { defaultValue: "Terms" })} items={edit.terms} onChange={(terms) => setEdit({ ...edit, terms })} />
          <SpanList label={t("school.cal.events", { defaultValue: "Holidays and exam weeks" })} items={edit.events} withKind onChange={(events) => setEdit({ ...edit, events })} />
          <div className={s.actions}><Button onClick={save}>{t("school.save", { defaultValue: "Save" })}</Button><Button variant="ghost" onClick={() => setEdit(null)}>{t("school.cancel", { defaultValue: "Cancel" })}</Button></div>
        </section>
      )}
      <Result result={result} />
    </div>
  );
}

function Promotion() {
  const { t } = useTranslation();
  const { has } = useSchool();
  const sug = useLoad("/promotion/suggest", { skip: !has("org.tree") });
  const units = useLoad("/units", { skip: !has("org.tree") });
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(null);
  const sections = useMemo(() => {
    const out = []; const walk = (ns, trail) => ns.forEach((n) => { if (n.type === "section") out.push({ id: n.id, label: [...trail, n.name].join(" › ") }); walk(n.children, [...trail, n.name]); });
    walk(units.data?.tree || [], []); return out;
  }, [units.data]);
  if (!has("org.tree")) return <PlanLockCard module="org.tree" title={t("school.lock.tree", { defaultValue: "Campus, grade and section structure" })} />;
  if (!sug.data) return <Skeleton variant="text" lines={6} />;
  return (
    <>
      <Result result={done} />
      <PromotionForm key={round} initial={sug.data.mapping} years={sug.data.years} sections={sections} onApplied={(text) => { setDone({ ok: true, text }); setRound((r) => r + 1); sug.reload(); units.reload(); }} />
    </>
  );
}

function PromotionForm({ initial, years, sections, onApplied }) {
  const { t } = useTranslation();
  const [mapping, setMapping] = useState(initial);
  const [toYearId, setToYearId] = useState("");
  const [archive, setArchive] = useState(true);
  const [exceptions, setExceptions] = useState({});
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const body = () => ({
    toYearId: toYearId || undefined, archiveGroups: archive,
    mapping: mapping.filter((m) => m.action !== "choose").map((m) => ({ fromUnitId: m.fromUnitId, toUnitId: m.toUnitId, action: m.action })),
    exceptions: Object.entries(exceptions).map(([studentId, action]) => ({ studentId, action })),
  });
  const run = async (apply) => {
    try {
      if (apply) {
        if (!window.confirm(t("school.promo.confirm", { defaultValue: "Promote now? Students move to their new sections and old groups are archived." }))) return;
        const r = await api.post("/promotion/apply", body());
        onApplied(t("school.promo.done", { defaultValue: "Done. {{p}} promoted, {{r}} repeating, {{l}} left. {{a}} groups archived.", p: r.summary.promote || 0, r: r.summary.repeat || 0, l: r.summary.leave || 0, a: r.archived }));
      } else setPreview(await api.post("/promotion/preview", body()));
    } catch (e) { setResult({ ok: false, text: e.message }); }
  };
  const setM = (i, patch) => setMapping((m) => m.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div className={s.page}>
      <section className={s.card} aria-labelledby="pr-h">
        <h2 id="pr-h" className={s.cardTitle}>{t("school.promo.title", { defaultValue: "End of year: promote everyone" })}</h2>
        <p className={s.cardSub}>{t("school.promo.sub", { defaultValue: "We matched each section to the next grade. Check it, preview, mark repeaters and leavers, then promote." })}</p>
        <div className={s.formGrid}>
          <Field id="pr-year" label={t("school.promo.year", { defaultValue: "New academic year" })}>
            <select id="pr-year" className={s.select} value={toYearId} onChange={(e) => setToYearId(e.target.value)}>
              <option value="">{t("school.promo.noYear", { defaultValue: "Don't change the year" })}</option>
              {(years || []).map((y) => <option key={y._id} value={y._id}>{y.name}</option>)}
            </select>
          </Field>
        </div>
        <label className={s.check}><input type="checkbox" checked={archive} onChange={(e) => setArchive(e.target.checked)} /><span>{t("school.promo.archive", { defaultValue: "Archive this year's groups (read-only, still in reports)" })}</span></label>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr><th scope="col">{t("school.promo.from", { defaultValue: "Section now" })}</th><th scope="col">{t("school.promo.do", { defaultValue: "What happens" })}</th><th scope="col">{t("school.promo.to", { defaultValue: "Goes to" })}</th></tr></thead>
            <tbody>
              {mapping.map((m, i) => (
                <tr key={m.fromUnitId}>
                  <th scope="row">{m.from}</th>
                  <td>
                    <label className="d-sr-only" htmlFor={`pa-${i}`}>{t("school.promo.do", { defaultValue: "What happens" })}</label>
                    <select id={`pa-${i}`} className={s.select} value={m.action} onChange={(e) => setM(i, { action: e.target.value })}>
                      <option value="promote">{t("school.promo.promote", { defaultValue: "Move up" })}</option>
                      <option value="leave">{t("school.promo.leave", { defaultValue: "Leave school (graduate)" })}</option>
                      <option value="stay">{t("school.promo.stay", { defaultValue: "Stay" })}</option>
                      {m.action === "choose" && <option value="choose">{t("school.choose", { defaultValue: "Choose…" })}</option>}
                    </select>
                  </td>
                  <td>
                    {m.action === "promote" && (
                      <>
                        <label className="d-sr-only" htmlFor={`pt-${i}`}>{t("school.promo.to", { defaultValue: "Goes to" })}</label>
                        <select id={`pt-${i}`} className={s.select} value={m.toUnitId || ""} onChange={(e) => setM(i, { toUnitId: e.target.value })}>
                          <option value="">{t("school.choose", { defaultValue: "Choose…" })}</option>
                          {sections.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                        </select>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={s.actions}><Button variant="soft" onClick={() => run(false)}>{t("school.promo.preview", { defaultValue: "Preview" })}</Button></div>
      </section>
      {preview && (
        <section className={s.card} aria-labelledby="pp-h">
          <h2 id="pp-h" className={s.cardTitle}>{t("school.promo.previewTitle", { defaultValue: "Preview: {{n}} students", n: preview.rows.length })}</h2>
          <p className={s.cardSub}>{Object.entries(preview.summary).map(([k, v]) => `${v} ${k}`).join(" · ")}{preview.groupsToArchive ? ` · ${t("school.promo.groups", { defaultValue: "{{n}} groups archived", n: preview.groupsToArchive })}` : ""}</p>
          <DataTable caption={t("school.promo.rows", { defaultValue: "Change a student's line for repeaters and leavers" })} rows={preview.rows} getRowKey={(r) => r.studentId}
            columns={[
              { key: "name", label: t("school.people.name", { defaultValue: "Name" }), sortable: true },
              { key: "from", label: t("school.promo.from", { defaultValue: "Section now" }), sortable: true },
              { key: "action", label: t("school.promo.do", { defaultValue: "What happens" }), render: (r) => (
                <select className={s.select} aria-label={t("school.promo.forX", { defaultValue: "What happens to {{n}}", n: r.name })} value={exceptions[r.studentId] || r.action}
                  onChange={(e) => setExceptions((x) => ({ ...x, [r.studentId]: e.target.value }))}>
                  {["promote", "repeat", "leave", "stay"].map((a) => <option key={a} value={a}>{t(`school.promo.a.${a}`, { defaultValue: { promote: "Move up", repeat: "Repeat the year", leave: "Leave", stay: "Stay" }[a] })}</option>)}
                </select>
              ) },
              { key: "to", label: t("school.promo.to", { defaultValue: "Goes to" }), render: (r) => r.to || "—" },
            ]} />
          <div className={s.actions}>
            <Button variant="soft" onClick={() => run(false)}>{t("school.promo.refresh", { defaultValue: "Update preview" })}</Button>
            <Button onClick={() => run(true)}>{t("school.promo.apply", { defaultValue: "Promote now" })}</Button>
          </div>
        </section>
      )}
      <Result result={result} />
    </div>
  );
}

function Billing() {
  const { t } = useTranslation();
  const data = useLoad("/billing");
  if (!data.data) return <Skeleton variant="text" lines={5} />;
  const b = data.data;
  return (
    <section className={s.card} aria-labelledby="bill-h">
      <h2 id="bill-h" className={s.cardTitle}>{t("school.bill.title", { defaultValue: "Plan and billing" })}</h2>
      <dl className={s.formGrid}>
        <div><dt className={s.hint}>{t("school.bill.plan", { defaultValue: "Plan" })}</dt><dd className={s.strong} style={{ margin: 0 }}>{b.plan.label} <StatusPill status={b.status === "active" ? "active" : "disabled"} label={b.status} /></dd></div>
        <div><dt className={s.hint}>{t("school.bill.seats", { defaultValue: "Seats" })}</dt><dd className={s.strong} style={{ margin: 0 }}>{b.seats.bought ? t("school.bill.seatsN", { defaultValue: "{{u}} of {{b}} used", u: b.seats.used, b: b.seats.bought }) : t("school.bill.unlimited", { defaultValue: "{{u}} active students (no limit)", u: b.seats.used })}</dd></div>
        <div><dt className={s.hint}>{t("school.bill.renews", { defaultValue: "Renews" })}</dt><dd className={s.strong} style={{ margin: 0 }}>{b.renewsAt ? fmtDate(String(b.renewsAt).slice(0, 10)) : "—"}</dd></div>
        <div><dt className={s.hint}>{t("school.bill.trial", { defaultValue: "Trial ends" })}</dt><dd className={s.strong} style={{ margin: 0 }}>{b.trialEndsAt ? fmtDate(String(b.trialEndsAt).slice(0, 10)) : "—"}</dd></div>
        <div><dt className={s.hint}>{t("school.bill.vat", { defaultValue: "VAT ID" })}</dt><dd className={s.strong} style={{ margin: 0 }}>{b.vatId || "—"}</dd></div>
      </dl>
      <p className={s.muted} style={{ marginTop: 16 }}>{t("school.bill.change", { defaultValue: "To add seats, change plan or ask for an invoice, message Learnigo support from the classic admin view." })}</p>
      <h3 className={s.label}>{t("school.bill.modules", { defaultValue: "Included" })}</h3>
      <p className={s.small}>{b.plan.modules.join(" · ")}</p>
    </section>
  );
}

function Privacy() {
  const { t } = useTranslation();
  const data = useLoad("/privacy");
  const [form, setForm] = useState({ signerName: "", signerRole: "", accept: false });
  const [result, setResult] = useState(null);
  if (!data.data) return <Skeleton variant="text" lines={6} />;
  const d = data.data;
  const sign = async () => {
    try { await api.post("/privacy/dpa", { ...form, version: d.dpa.currentVersion }); setResult({ ok: true, text: t("school.dpa.signed", { defaultValue: "Signed. A record is kept in your audit log." }) }); data.reload(); }
    catch (e) { setResult({ ok: false, text: e.message }); }
  };
  return (
    <div className={s.grid2}>
      <section className={s.card} aria-labelledby="dpa-h">
        <h2 id="dpa-h" className={s.cardTitle}><FaShieldAlt aria-hidden="true" /> {t("school.dpa.title", { defaultValue: "Data-processing agreement" })}</h2>
        {!d.dpa.needsSigning ? (
          <p className={s.okText}>{t("school.dpa.ok", { defaultValue: "Version {{v}} signed by {{n}} ({{r}}) on {{d}}.", v: d.dpa.version, n: d.dpa.signerName, r: d.dpa.signerRole, d: fmtDate(String(d.dpa.acceptedAt).slice(0, 10)) })}</p>
        ) : (
          <>
            <p className={s.cardSub}>{t("school.dpa.what", { defaultValue: "Learnigo processes your students' learning data only to provide the service to your school, in the EU, never for ads, and deletes it on request or after your retention period. Version {{v}}.", v: d.dpa.currentVersion })}</p>
            <div className={s.formGrid}>
              <Field id="dpa-n" label={t("school.dpa.name", { defaultValue: "Your full name" })}><input id="dpa-n" className={s.input} value={form.signerName} onChange={(e) => setForm({ ...form, signerName: e.target.value })} /></Field>
              <Field id="dpa-r" label={t("school.dpa.role", { defaultValue: "Your role" })}><input id="dpa-r" className={s.input} placeholder="Principal" value={form.signerRole} onChange={(e) => setForm({ ...form, signerRole: e.target.value })} /></Field>
            </div>
            <label className={s.check}><input type="checkbox" checked={form.accept} onChange={(e) => setForm({ ...form, accept: e.target.checked })} /><span>{t("school.dpa.accept", { defaultValue: "I accept the data-processing agreement on behalf of my school." })}</span></label>
            <div className={s.actions}><Button disabled={!form.accept} onClick={sign}>{t("school.dpa.sign", { defaultValue: "Sign" })}</Button></div>
          </>
        )}
        <Result result={result} />
      </section>
      <section className={s.card} aria-labelledby="cons-h">
        <h2 id="cons-h" className={s.cardTitle}>{t("school.consent.title", { defaultValue: "Consent and retention" })}</h2>
        <ul className={s.list}>
          <li className={s.listItem}><span>{t("school.consent.dpa", { defaultValue: "Students covered by the signed agreement" })}</span><span className={s.strong}>{d.consent.coveredByDpa} / {d.consent.students}</span></li>
          <li className={s.listItem}><span>{t("school.consent.guardian", { defaultValue: "Students with a guardian's consent on file" })}</span><span className={s.strong}>{d.consent.guardianConsent}</span></li>
          <li className={s.listItem}><span>{t("school.consent.records", { defaultValue: "Students with an individual consent record" })}</span><span className={s.strong}>{d.consent.withRecord}</span></li>
          <li className={s.listItem}><span>{t("school.consent.retention", { defaultValue: "Data kept after a student leaves" })}</span><span className={s.strong}>{t("school.consent.years", { defaultValue: "{{n}} years", n: d.retentionYears })}</span></li>
        </ul>
        <p className={`${s.small} ${s.muted}`} style={{ marginTop: 12 }}>{d.requests ? t("school.consent.requests", { defaultValue: "{{n}} data requests from parents.", n: d.requests.length }) : t("school.consent.noRequests", { defaultValue: "Parent data requests will show here once the privacy centre is live." })}</p>
      </section>
    </div>
  );
}

function Audit() {
  const { t } = useTranslation();
  const [f, setF] = useState({ action: "", from: "", to: "" });
  const data = useLoad(`/audit${qs(f)}`);
  const d = data.data;
  return (
    <section className={s.card} aria-labelledby="au-h">
      <div className={s.head}>
        <div>
          <h2 id="au-h" className={s.cardTitle}>{t("school.audit.title", { defaultValue: "Who changed what" })}</h2>
          {d && <p className={s.cardSub}>{d.integrity.intact ? <span className={`${s.pill} ${s.pillGood}`}>✓ {t("school.audit.intact", { defaultValue: "Log intact: no entry was changed or removed" })}</span> : <span className={`${s.pill} ${s.pillAlert}`}>✖ {t("school.audit.broken", { defaultValue: "Some entries don't match their seal. Contact Learnigo." })}</span>}</p>}
        </div>
        <Button size="sm" variant="ghost" icon={FaDownload} onClick={() => api.download(`/audit${qs({ ...f, format: "csv" })}`, "audit-log.csv")}>{t("school.audit.export", { defaultValue: "Export CSV" })}</Button>
      </div>
      <div className={s.row} style={{ alignItems: "flex-end", marginBottom: 12 }}>
        <Field id="au-a" label={t("school.audit.action", { defaultValue: "What" })}>
          <select id="au-a" className={s.select} value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })}>
            <option value="">{t("school.review.all", { defaultValue: "All" })}</option>
            {(d?.actions || []).map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
        <Field id="au-f" label={t("school.cal.from", { defaultValue: "From" })}><input id="au-f" type="date" className={s.input} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></Field>
        <Field id="au-t" label={t("school.cal.to", { defaultValue: "To" })}><input id="au-t" type="date" className={s.input} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></Field>
      </div>
      {data.loading ? <Skeleton variant="text" lines={6} /> : (
        <DataTable caption={t("school.audit.caption", { defaultValue: "Newest first" })} rows={d?.events || []} getRowKey={(r) => r._id}
          columns={[
            { key: "at", label: t("school.audit.when", { defaultValue: "When" }), render: (r) => new Date(r.at).toLocaleString() },
            { key: "actorEmail", label: t("school.audit.who", { defaultValue: "Who" }), render: (r) => <>{r.actorEmail || r.actorRole}<div className={`${s.small} ${s.muted}`}>{r.actorRole}</div></> },
            { key: "action", label: t("school.audit.action", { defaultValue: "What" }) },
            { key: "meta", label: t("school.audit.details", { defaultValue: "Details" }), render: (r) => <span className={s.small}>{r.reason || (r.meta ? JSON.stringify(r.meta).slice(0, 140) : "")}</span> },
          ]} />
      )}
    </section>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get("tab") || "policies";
  const tabs = [
    { key: "policies", label: t("school.set.policies", { defaultValue: "Policies" }) },
    { key: "calendar", label: t("school.set.calendar", { defaultValue: "Years & calendar" }) },
    { key: "promotion", label: t("school.set.promotion", { defaultValue: "Promotion" }) },
    { key: "branding", label: t("school.set.branding", { defaultValue: "Branding" }) },
    { key: "privacy", label: t("school.set.privacy", { defaultValue: "Data protection" }) },
    { key: "billing", label: t("school.set.billing", { defaultValue: "Billing" }) },
    { key: "audit", label: t("school.set.audit", { defaultValue: "Audit log" }) },
  ];
  return (
    <div className={s.page}>
      <div className={s.head}><div><h1 className={s.title}>{t("school.nav.settings", { defaultValue: "Settings" })}</h1></div></div>
      <Tabs label={t("school.nav.settings", { defaultValue: "Settings" })} tabs={tabs} value={tab} onChange={(k) => setSp({ tab: k }, { replace: true })} />
      <div role="tabpanel">
        {tab === "policies" && <Policies />}
        {tab === "calendar" && <Calendar />}
        {tab === "promotion" && <Promotion />}
        {tab === "branding" && <Branding />}
        {tab === "privacy" && <Privacy />}
        {tab === "billing" && <Billing />}
        {tab === "audit" && <Audit />}
      </div>
    </div>
  );
}
