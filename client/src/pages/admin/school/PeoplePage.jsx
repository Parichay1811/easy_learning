// ADM-020..025 People: students (moves, leavers), bulk import, parent invitations,
// staff roles and leavers. Each tab only shows what the caller's role may do.
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaEnvelope, FaExchangeAlt, FaSignOutAlt, FaUndo, FaUserPlus } from "react-icons/fa";
import { Button, DataTable, EmptyState, PlanLockCard, Skeleton, fmtDate } from "../../../components/dashboard";
import { api, useLoad, qs } from "./api";
import { useSchool, BASE } from "./context";
import { Tabs, StatusPill, Dialog, Field, Result } from "./bits";
import ImportWizard from "./ImportWizard";
import s from "./school.module.css";

const flatten = (nodes, depth = 0, out = []) => { for (const n of nodes || []) { out.push({ ...n, depth }); flatten(n.children, depth + 1, out); } return out; };

function useUnits(enabled) {
  const tree = useLoad("/units", { skip: !enabled });
  return useMemo(() => flatten(tree.data?.tree), [tree.data]);
}

function SeatsLine() {
  const { t } = useTranslation();
  const seats = useLoad("/seats");
  const st = seats.data?.seats;
  if (!st) return null;
  if (st.state === "unlimited") return <span className={s.pill}>{t("school.seats.unlimited", { defaultValue: "{{n}} active students", n: st.used })}</span>;
  const tone = st.state === "full" ? s.pillAlert : st.state === "warning" ? s.pillAttention : s.pillGood;
  return <span className={`${s.pill} ${tone}`}>{t("school.seats.line", { defaultValue: "Seats: {{used}} of {{bought}} used", ...st })}</span>;
}

function MoveDialog({ student, units, onClose, onDone }) {
  const { t } = useTranslation();
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [result, setResult] = useState(null);
  const places = units.filter((u) => u.type === "section" || u.type === "grade");
  const go = async () => {
    try { await api.post(`/students/${student._id}/move`, { toUnitId: to, reason }); onDone(); onClose(); }
    catch (e) { setResult({ ok: false, text: e.message }); }
  };
  return (
    <Dialog title={t("school.people.moveTitle", { defaultValue: "Move {{name}}", name: student.name })} onClose={onClose}>
      <p className={s.cardSub}>{t("school.people.moveNow", { defaultValue: "Now in: {{u}}. Their history moves with them.", u: student.unit || t("school.people.noClass", { defaultValue: "no class" }) })}</p>
      <Field id="mv-to" label={t("school.people.moveTo", { defaultValue: "New class" })}>
        <select id="mv-to" className={s.select} value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">{t("school.choose", { defaultValue: "Choose…" })}</option>
          {places.map((u) => <option key={u.id} value={u.id}>{"— ".repeat(u.depth)}{u.name}</option>)}
        </select>
      </Field>
      <div style={{ height: 12 }} />
      <Field id="mv-reason" label={t("school.people.reason", { defaultValue: "Reason (optional)" })}>
        <input id="mv-reason" className={s.input} value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <Result result={result} />
      <div className={s.actions}>
        <Button disabled={!to} onClick={go}>{t("school.people.move", { defaultValue: "Move" })}</Button>
        <Button variant="ghost" onClick={onClose}>{t("school.cancel", { defaultValue: "Cancel" })}</Button>
      </div>
    </Dialog>
  );
}

function LeaveDialog({ student, onClose, onDone }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [result, setResult] = useState(null);
  const go = async () => {
    try { await api.post(`/students/${student._id}/leave`, { reason }); onDone(); onClose(); } catch (e) { setResult({ ok: false, text: e.message }); }
  };
  return (
    <Dialog title={t("school.people.leaveTitle", { defaultValue: "{{name}} is leaving", name: student.name })} onClose={onClose}>
      <p className={s.cardSub}>{t("school.people.leaveText", { defaultValue: "They leave their groups and free a seat. Their learning history is kept for your retention period and stays in reports." })}</p>
      <Field id="lv-reason" label={t("school.people.reason", { defaultValue: "Reason (optional)" })}>
        <input id="lv-reason" className={s.input} value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <Result result={result} />
      <div className={s.actions}>
        <Button onClick={go}>{t("school.people.markLeft", { defaultValue: "Mark as left" })}</Button>
        <Button variant="ghost" onClick={onClose}>{t("school.cancel", { defaultValue: "Cancel" })}</Button>
      </div>
    </Dialog>
  );
}

function StudentsTab() {
  const { t } = useTranslation();
  const { can, has } = useSchool();
  const [params, setParams] = useSearchParams();
  const unit = params.get("unit") || "";
  const [q, setQ] = useState("");
  const list = useLoad(`/people/students${qs({ unitId: unit, q })}`);
  const units = useUnits(has("org.tree"));
  const [moving, setMoving] = useState(null);
  const [leaving, setLeaving] = useState(null);
  const [result, setResult] = useState(null);
  const invite = async (ids) => {
    try { const r = await api.post("/invites", { studentIds: ids }); setResult({ ok: true, text: t("school.people.invited", { defaultValue: "{{n}} parents invited.", n: r.invited }) }); list.reload(); }
    catch (e) { setResult({ ok: false, text: e.message }); }
  };
  const rows = list.data?.students || [];
  const columns = [
    { key: "name", label: t("school.people.name", { defaultValue: "Name" }), sortable: true, render: (r) => (can("analytics.read") ? <Link to={`${BASE}/students/${r._id}`}>{r.name}</Link> : r.name) },
    { key: "unit", label: t("school.people.class", { defaultValue: "Class" }), sortable: true, render: (r) => r.unit || r.grade || "—" },
    { key: "groups", label: t("school.people.groups", { defaultValue: "Groups" }), render: (r) => r.groups.join(", ") || "—" },
    { key: "parents", label: t("school.people.parents", { defaultValue: "Parents" }), render: (r) => (r.parents.length ? <span className={s.row}>{r.parents.map((p) => <StatusPill key={p.email} status={p.status} label={undefined} />)}</span> : <span className={s.muted}>{t("school.people.noParents", { defaultValue: "none" })}</span>) },
    { key: "act", label: t("school.people.actions", { defaultValue: "Actions" }), render: (r) => (
      <span className={s.row}>
        {can("people.move") && has("org.tree") && <button type="button" className={s.iconBtn} onClick={() => setMoving(r)} aria-label={t("school.people.moveX", { defaultValue: "Move {{name}}", name: r.name })} title={t("school.people.move", { defaultValue: "Move" })}><FaExchangeAlt /></button>}
        {can("people.write") && <button type="button" className={s.iconBtn} onClick={() => setLeaving(r)} aria-label={t("school.people.leaveX", { defaultValue: "{{name}} is leaving", name: r.name })} title={t("school.people.markLeft", { defaultValue: "Mark as left" })}><FaSignOutAlt /></button>}
        {can("parents.invite") && r.parents.length > 0 && <button type="button" className={s.iconBtn} onClick={() => invite([r._id])} aria-label={t("school.people.inviteX", { defaultValue: "Invite {{name}}'s parents", name: r.name })} title={t("school.people.invite", { defaultValue: "Invite parents" })}><FaEnvelope /></button>}
      </span>
    ) },
  ];
  return (
    <div className={s.page}>
      <div className={s.row} style={{ alignItems: "flex-end" }}>
        {units.length > 0 && (
          <Field id="pf-unit" label={t("school.people.inUnit", { defaultValue: "Class" })}>
            <select id="pf-unit" className={s.select} value={unit} onChange={(e) => setParams((p) => { const n = new URLSearchParams(p); if (e.target.value) n.set("unit", e.target.value); else n.delete("unit"); return n; })}>
              <option value="">{t("school.people.allUnits", { defaultValue: "Everyone I can see" })}</option>
              {units.map((u) => <option key={u.id} value={u.id}>{"— ".repeat(u.depth)}{u.name}</option>)}
            </select>
          </Field>
        )}
        <Field id="pf-q" label={t("school.people.search", { defaultValue: "Search" })}>
          <input id="pf-q" className={s.input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("school.people.searchPh", { defaultValue: "Name or email" })} />
        </Field>
        <span className={s.grow} />
        <SeatsLine />
      </div>
      <Result result={result} />
      {list.loading ? <Skeleton variant="chart" /> : list.error ? <p className={s.errorText}>{list.error.message}</p> : rows.length === 0 ? (
        <EmptyState title={t("school.people.empty", { defaultValue: "No students here yet" })} text={t("school.people.emptyText", { defaultValue: "Import your roster from a spreadsheet: it takes a few minutes." })} actionLabel={can("people.import") ? t("school.people.toImport", { defaultValue: "Import students" }) : undefined} to={can("people.import") ? `${BASE}/people/import` : undefined} />
      ) : (
        <DataTable caption={t("school.people.caption", { defaultValue: "{{n}} students", n: list.data.total })} columns={columns} rows={rows} getRowKey={(r) => r._id} defaultSort={{ key: "name", dir: "asc" }} />
      )}
      {moving && <MoveDialog student={moving} units={units} onClose={() => setMoving(null)} onDone={list.reload} />}
      {leaving && <LeaveDialog student={leaving} onClose={() => setLeaving(null)} onDone={list.reload} />}
    </div>
  );
}

function ParentsTab() {
  const { t } = useTranslation();
  const list = useLoad("/invites");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const send = async (body) => {
    setBusy(true); setResult(null);
    try {
      const r = await api.post("/invites", body);
      setResult({ ok: true, text: t("school.invites.sent", { defaultValue: "{{n}} invitations sent. {{l}} parents were linked straight away.", n: r.invited, l: r.linked }) });
      list.reload();
    } catch (e) { setResult({ ok: false, text: e.message }); }
    setBusy(false);
  };
  const c = list.data?.counts || {};
  const columns = [
    { key: "name", label: t("school.people.name", { defaultValue: "Name" }), sortable: true },
    { key: "email", label: t("school.invites.email", { defaultValue: "Email" }), sortable: true },
    { key: "children", label: t("school.invites.children", { defaultValue: "Children" }), render: (r) => r.children.join(", ") || "—" },
    { key: "status", label: t("school.invites.status", { defaultValue: "Status" }), sortable: true, render: (r) => <StatusPill status={r.status} /> },
    { key: "lastSentAt", label: t("school.invites.last", { defaultValue: "Last sent" }), render: (r) => (r.lastSentAt ? fmtDate(r.lastSentAt.slice(0, 10)) : "—") },
    { key: "act", label: "", render: (r) => r.status !== "linked" && <Button size="sm" variant="ghost" onClick={() => send({ parentIds: [r.parentId] })}>{r.sends ? t("school.invites.resend", { defaultValue: "Resend" }) : t("school.invites.send", { defaultValue: "Invite" })}</Button> },
  ];
  return (
    <div className={s.page}>
      <div className={s.banner}>
        <FaEnvelope className={s.bannerIcon} aria-hidden="true" />
        <p className={s.grow}>{t("school.invites.how", { defaultValue: "Parents get an email. When they sign in with that same address they are linked to their children straight away. No codes." })}</p>
      </div>
      <div className={s.row}>
        <span className={s.pill}>{t("school.invites.total", { defaultValue: "{{n}} parents", n: list.data?.total ?? 0 })}</span>
        <StatusPill status="linked" label={t("school.invites.linkedN", { defaultValue: "{{n}} linked", n: c.linked || 0 })} />
        <StatusPill status="invited" label={t("school.invites.invitedN", { defaultValue: "{{n}} invited", n: c.invited || 0 })} />
        <StatusPill status="bounced" label={t("school.invites.bouncedN", { defaultValue: "{{n}} bounced", n: c.bounced || 0 })} />
        <StatusPill status="not_invited" label={t("school.invites.notN", { defaultValue: "{{n}} not invited", n: c.not_invited || 0 })} />
        <span className={s.grow} />
        <Button disabled={busy || !(c.not_invited || c.bounced)} onClick={() => send({ all: true, onlyNew: true })}>{t("school.invites.all", { defaultValue: "Invite everyone not yet invited" })}</Button>
      </div>
      <Result result={result} />
      {list.loading ? <Skeleton variant="chart" /> : list.data?.parents?.length ? (
        <DataTable caption={t("school.invites.caption", { defaultValue: "Parents and their invitation status" })} columns={columns} rows={list.data.parents} getRowKey={(r) => r.parentId} defaultSort={{ key: "status", dir: "desc" }} />
      ) : <EmptyState title={t("school.invites.empty", { defaultValue: "No parents yet" })} text={t("school.invites.emptyText", { defaultValue: "Add parent emails in your student import and they appear here." })} />}
    </div>
  );
}

const ROLE_HELP = {
  coordinator: "Everything inside the chosen units (or subjects): analytics, students, question review.",
  office: "Students, teachers, parents and imports. No analytics.",
  viewer: "Read-only analytics, for example a board member.",
};

function StaffTab() {
  const { t } = useTranslation();
  const { has } = useSchool();
  const list = useLoad("/staff", { skip: !has("staff.roles") });
  const units = useUnits(has("org.tree"));
  const [form, setForm] = useState({ email: "", name: "", role: "coordinator", unitIds: [], subjects: [] });
  const [result, setResult] = useState(null);
  if (!has("staff.roles")) return <PlanLockCard module="staff.roles" title={t("school.lock.staff", { defaultValue: "Coordinators and staff roles" })} text={t("school.lock.staffText", { defaultValue: "Give coordinators, office staff and board members their own access." })} />;
  const add = async () => {
    try { await api.post("/staff", form); setResult({ ok: true, text: t("school.staff.added", { defaultValue: "Added. They sign in with Google at the admin login using {{e}}.", e: form.email }) }); setForm({ email: "", name: "", role: "coordinator", unitIds: [], subjects: [] }); list.reload(); }
    catch (e) { setResult({ ok: false, text: e.message }); }
  };
  const update = async (id, body) => { try { await api.patch(`/staff/${id}`, body); list.reload(); } catch (e) { setResult({ ok: false, text: e.message }); } };
  const remove = async (st) => { if (window.confirm(t("school.staff.confirm", { defaultValue: "Remove {{e}}? Their access ends at once.", e: st.email }))) { await api.del(`/staff/${st._id}`); list.reload(); } };
  const toggle = (key, v) => setForm((f) => ({ ...f, [key]: f[key].includes(v) ? f[key].filter((x) => x !== v) : [...f[key], v] }));
  return (
    <div className={s.page}>
      <section className={s.card} aria-labelledby="staff-add">
        <h2 id="staff-add" className={s.cardTitle}>{t("school.staff.addTitle", { defaultValue: "Add a staff member" })}</h2>
        <div className={s.formGrid}>
          <Field id="st-email" label={t("school.staff.email", { defaultValue: "Google email" })}><input id="st-email" type="email" className={s.input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="off" /></Field>
          <Field id="st-name" label={t("school.staff.name", { defaultValue: "Name" })}><input id="st-name" className={s.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field id="st-role" label={t("school.staff.role", { defaultValue: "Role" })} hint={t(`school.staff.help.${form.role}`, { defaultValue: ROLE_HELP[form.role] })}>
            <select id="st-role" className={s.select} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} aria-describedby="st-role-hint">
              {(list.data?.roles || []).map((r) => <option key={r.key} value={r.key}>{t(`school.role.${r.key}`, { defaultValue: r.label })}</option>)}
            </select>
          </Field>
        </div>
        {units.length > 0 && (
          <fieldset style={{ border: 0, padding: 0, margin: "14px 0 0" }}>
            <legend className={s.label}>{t("school.staff.units", { defaultValue: "Limit to these units (none = whole school)" })}</legend>
            <div className={s.row}>{units.filter((u) => u.type !== "section").map((u) => (
              <label key={u.id} className={s.check}><input type="checkbox" checked={form.unitIds.includes(u.id)} onChange={() => toggle("unitIds", u.id)} /><span>{u.name}</span></label>
            ))}</div>
          </fieldset>
        )}
        {form.role === "coordinator" && (
          <fieldset style={{ border: 0, padding: 0, margin: "8px 0 0" }}>
            <legend className={s.label}>{t("school.staff.subjects", { defaultValue: "Head of department for (question review)" })}</legend>
            <div className={s.row}>{["english", "maths", "science"].map((sub) => (
              <label key={sub} className={s.check}><input type="checkbox" checked={form.subjects.includes(sub)} onChange={() => toggle("subjects", sub)} /><span>{t(`dash.subject.${sub}`, { defaultValue: sub[0].toUpperCase() + sub.slice(1) })}</span></label>
            ))}</div>
          </fieldset>
        )}
        <div className={s.actions}><Button icon={FaUserPlus} disabled={!form.email} onClick={add}>{t("school.staff.add", { defaultValue: "Add staff member" })}</Button></div>
        <Result result={result} />
      </section>
      <section className={s.card} aria-labelledby="staff-list">
        <h2 id="staff-list" className={s.cardTitle}>{t("school.staff.listTitle", { defaultValue: "Staff with access" })}</h2>
        {list.data?.staff?.length ? (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead><tr><th scope="col">{t("school.staff.who", { defaultValue: "Who" })}</th><th scope="col">{t("school.staff.role", { defaultValue: "Role" })}</th><th scope="col">{t("school.staff.scope", { defaultValue: "Limited to" })}</th><th scope="col">{t("school.staff.last", { defaultValue: "Last sign-in" })}</th><th scope="col">{t("school.people.actions", { defaultValue: "Actions" })}</th></tr></thead>
              <tbody>
                {list.data.staff.map((st) => (
                  <tr key={st._id}>
                    <td><div className={s.strong}>{st.name || st.email}</div><div className={`${s.small} ${s.muted}`}>{st.email}</div></td>
                    <td>
                      <label className="d-sr-only" htmlFor={`role-${st._id}`}>{t("school.staff.role", { defaultValue: "Role" })}</label>
                      <select id={`role-${st._id}`} className={s.select} value={st.role} onChange={(e) => update(st._id, { role: e.target.value })}>
                        {(list.data.roles || []).map((r) => <option key={r.key} value={r.key}>{t(`school.role.${r.key}`, { defaultValue: r.label })}</option>)}
                      </select>
                    </td>
                    <td className={s.small}>{[...st.units.map((u) => u.label), ...(st.subjects || [])].join(", ") || t("school.staff.whole", { defaultValue: "Whole school" })}</td>
                    <td className={s.small}>{st.lastLoginAt ? fmtDate(st.lastLoginAt.slice(0, 10)) : t("school.staff.never", { defaultValue: "Not yet" })}</td>
                    <td><span className={s.row}>
                      <StatusPill status={st.status} />
                      <Button size="sm" variant="ghost" onClick={() => update(st._id, { status: st.status === "active" ? "disabled" : "active" })}>{st.status === "active" ? t("school.staff.disable", { defaultValue: "Pause" }) : t("school.staff.enable", { defaultValue: "Resume" })}</Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(st)}>{t("school.staff.remove", { defaultValue: "Remove" })}</Button>
                    </span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className={s.muted}>{t("school.staff.none", { defaultValue: "Only you so far." })}</p>}
      </section>
    </div>
  );
}

function LeaversTab() {
  const { t } = useTranslation();
  const { can } = useSchool();
  const list = useLoad("/people/students?status=left");
  const [result, setResult] = useState(null);
  const rejoin = async (r) => { try { await api.post(`/students/${r._id}/rejoin`); list.reload(); } catch (e) { setResult({ ok: false, text: e.message }); } };
  const rows = list.data?.students || [];
  return (
    <div className={s.page}>
      <Result result={result} />
      {rows.length ? (
        <DataTable caption={t("school.leavers.caption", { defaultValue: "Students who left" })} rows={rows} getRowKey={(r) => r._id}
          columns={[
            { key: "name", label: t("school.people.name", { defaultValue: "Name" }), sortable: true },
            { key: "leftAt", label: t("school.leavers.when", { defaultValue: "Left on" }), sortable: true, render: (r) => (r.leftAt ? fmtDate(r.leftAt.slice(0, 10)) : "—") },
            { key: "leaveReason", label: t("school.leavers.why", { defaultValue: "Reason" }), render: (r) => r.leaveReason || "—" },
            { key: "act", label: "", render: (r) => can("people.write") && <Button size="sm" variant="ghost" icon={FaUndo} onClick={() => rejoin(r)}>{t("school.leavers.rejoin", { defaultValue: "Rejoin" })}</Button> },
          ]} />
      ) : <p className={s.muted}>{list.loading ? "" : t("school.leavers.none", { defaultValue: "Nobody has left." })}</p>}
    </div>
  );
}

export default function PeoplePage() {
  const { t } = useTranslation();
  const { can, isAdmin } = useSchool();
  const navigate = useNavigate();
  const location = useLocation();
  const sub = location.pathname.split("/people/")[1]?.split("/")[0] || "students";
  const tabs = [
    { key: "students", label: t("school.people.tabStudents", { defaultValue: "Students" }) },
    can("people.import") && { key: "import", label: t("school.people.tabImport", { defaultValue: "Import" }) },
    can("parents.invite") && { key: "parents", label: t("school.people.tabParents", { defaultValue: "Parents" }) },
    isAdmin && { key: "staff", label: t("school.people.tabStaff", { defaultValue: "Staff roles" }) },
    { key: "leavers", label: t("school.people.tabLeavers", { defaultValue: "Leavers" }) },
  ].filter(Boolean);
  const go = (k) => navigate(`${BASE}/people${k === "students" ? "" : `/${k}`}${location.search}`);
  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.title}>{t("school.people.title", { defaultValue: "People" })}</h1>
          <p className={s.sub}>{t("school.people.sub", { defaultValue: "Students, parents and staff: import, invite, move and manage." })}</p>
        </div>
      </div>
      <Tabs label={t("school.people.title", { defaultValue: "People" })} tabs={tabs} value={sub} onChange={go} />
      <div role="tabpanel">
        {sub === "students" && <StudentsTab />}
        {sub === "import" && can("people.import") && <ImportWizard />}
        {sub === "parents" && can("parents.invite") && <ParentsTab />}
        {sub === "staff" && isAdmin && <StaffTab />}
        {sub === "leavers" && <LeaversTab />}
      </div>
    </div>
  );
}
