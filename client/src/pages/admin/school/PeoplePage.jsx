// ADM-020..025 People, one sub-tab per task so each fits a screen: Students (moves, leavers,
// invite by email) · Parents (invitations) · Staff (roles) · Requests & invites (connect by
// email) · Import · Leavers. Each tab only shows what the caller's role may do. The tab is
// ?pane=…; old links (/people/import, /people/parents, …) are turned into it.
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaEnvelope, FaExchangeAlt, FaSignOutAlt, FaUndo, FaUserPlus } from "react-icons/fa";
import { Button, DataTable, EmptyState, PlanLockCard, Skeleton, SubTabs, SubPanel, usePane, fmtDate } from "../../../components/dashboard";
import { api, useLoad, qs } from "./api";
import { useSchool, BASE } from "./context";
import { StatusPill, Dialog, Field, Result } from "./bits";
import ImportWizard from "./ImportWizard";
import { useLinks, RequestInbox, InviteByEmail } from "../../../components/links";
import s from "./school.module.css";

// A long list keeps to the screen and scrolls inside its box (tall screens only, see .listFit):
// sets --fit-h on the wrapper to the height left between it and the bottom of the page.
function useFitHeight() {
  const [el, setEl] = useState(null);
  useEffect(() => {
    if (!el) return undefined;
    const root = el.closest("[data-scroll-root]");
    const main = el.closest("main");
    let raf = 0;
    const fit = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const top = el.getBoundingClientRect().top - (root ? root.getBoundingClientRect().top - root.scrollTop : 0);
        const pad = main ? parseFloat(getComputedStyle(main).paddingBottom) || 0 : 0;
        el.style.setProperty("--fit-h", `${Math.floor((root ? root.clientHeight : window.innerHeight) - top - pad - 6)}px`);
      });
    };
    fit();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    if (main) ro?.observe(main);
    window.addEventListener("resize", fit);
    return () => { cancelAnimationFrame(raf); ro?.disconnect(); window.removeEventListener("resize", fit); };
  }, [el]);
  return setEl; // a callback ref: works for lists that appear later too
}

// Connect by email (services/linkRequests.js): the school invites a learner (into a group,
// if chosen). They join only after tapping Join; a seat is used then, not before.
function InviteStudentDialog({ links, onClose, onChanged }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [groupId, setGroupId] = useState("");
  const groups = links.data?.groups || [];
  return (
    <Dialog title={t("school.people.inviteStudentT", { defaultValue: "Invite a student by email" })} onClose={onClose}>
      <p className={s.cardSub}>{t("school.people.inviteStudentD", { defaultValue: "They get a request and tap Join. Nothing is shared before that. For young learners without email, use the import or login cards." })}</p>
      <InviteByEmail id="invite-student"
        label={t("school.people.studentEmail", { defaultValue: "Student's email" })}
        button={t("school.people.sendInvite", { defaultValue: "Send invitation" })}
        onSend={async (email) => { const r = await links.send({ to: "student", email, name: name.trim(), ...(groupId ? { groupId } : {}) }); if (r.ok) { setName(""); onChanged?.(); } return r; }}
        sentText={(email) => t("school.people.inviteSent", { defaultValue: "Invitation sent to {{email}}. They join as soon as they tap Join.", email })}>
        <div className={s.formGrid}>
          <Field id="inv-st-name" label={t("school.people.nameOpt", { defaultValue: "Name (optional)" })}>
            <input id="inv-st-name" className={s.input} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
          </Field>
          {groups.length > 0 && (
            <Field id="inv-st-group" label={t("school.people.groupOpt", { defaultValue: "Group (optional)" })}>
              <select id="inv-st-group" className={s.select} value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                <option value="">{t("school.people.noGroup", { defaultValue: "No group yet" })}</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.emoji ? `${g.emoji} ` : ""}{g.name}</option>)}
              </select>
            </Field>
          )}
        </div>
      </InviteByEmail>
      <div style={{ marginTop: 14 }}>
        <RequestInbox links={links} viewer="admin" kinds={["enrol"]} showIncoming={false}
          outgoingTitle={t("school.people.invitesSent", { defaultValue: "Invitations sent" })} />
      </div>
    </Dialog>
  );
}

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

function StudentsTab({ links, inviting, onCloseInvite }) {
  const { t } = useTranslation();
  const { can, has } = useSchool();
  const [params, setParams] = useSearchParams();
  const unit = params.get("unit") || "";
  const [q, setQ] = useState("");
  const list = useLoad(`/people/students${qs({ unitId: unit, q })}`);
  const units = useUnits(has("org.tree"));
  const fit = useFitHeight();
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
      <span className={`${s.row} ${s.rowTools}`}>
        {can("people.move") && has("org.tree") && <button type="button" className={s.iconBtn} onClick={() => setMoving(r)} aria-label={t("school.people.moveX", { defaultValue: "Move {{name}}", name: r.name })} title={t("school.people.move", { defaultValue: "Move" })}><FaExchangeAlt /></button>}
        {can("people.write") && <button type="button" className={s.iconBtn} onClick={() => setLeaving(r)} aria-label={t("school.people.leaveX", { defaultValue: "{{name}} is leaving", name: r.name })} title={t("school.people.markLeft", { defaultValue: "Mark as left" })}><FaSignOutAlt /></button>}
        {can("parents.invite") && r.parents.length > 0 && <button type="button" className={s.iconBtn} onClick={() => invite([r._id])} aria-label={t("school.people.inviteX", { defaultValue: "Invite {{name}}'s parents", name: r.name })} title={t("school.people.invite", { defaultValue: "Invite parents" })}><FaEnvelope /></button>}
      </span>
    ) },
  ];
  return (
    <>
      <div className={s.peopleBar}>
        {units.length > 0 && (
          <Field id="pf-unit" label={t("school.people.inUnit", { defaultValue: "Class" })}>
            <select id="pf-unit" className={s.select} value={unit} onChange={(e) => setParams((p) => { const n = new URLSearchParams(p); if (e.target.value) n.set("unit", e.target.value); else n.delete("unit"); return n; })}>
              <option value="">{t("school.people.allUnits", { defaultValue: "Everyone I can see" })}</option>
              {units.map((u) => <option key={u.id} value={u.id}>{"— ".repeat(u.depth)}{u.name}</option>)}
            </select>
          </Field>
        )}
        <Field id="pf-q" label={t("school.people.search", { defaultValue: "Search" })}>
          <input id="pf-q" type="search" className={s.input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("school.people.searchPh", { defaultValue: "Name or email" })} />
        </Field>
        <span className={s.peopleBarEnd}><SeatsLine /></span>
      </div>
      <Result result={result} />
      <div ref={fit} className={s.listFit}>
        {list.loading ? <Skeleton variant="chart" /> : list.error ? <p className={s.errorText}>{list.error.message}</p> : rows.length === 0 ? (
          <EmptyState title={t("school.people.empty", { defaultValue: "No students here yet" })} text={t("school.people.emptyText", { defaultValue: "Import your roster from a spreadsheet: it takes a few minutes." })} actionLabel={can("people.import") ? t("school.people.toImport", { defaultValue: "Import students" }) : undefined} to={can("people.import") ? `${BASE}/people?pane=import` : undefined} />
        ) : (
          <DataTable className={`${s.rows} ${s.rowsAct}`} caption={t("school.people.caption", { defaultValue: "{{n}} students", n: list.data.total })} columns={columns} rows={rows} getRowKey={(r) => r._id} defaultSort={{ key: "name", dir: "asc" }} />
        )}
      </div>
      {moving && <MoveDialog student={moving} units={units} onClose={() => setMoving(null)} onDone={list.reload} />}
      {leaving && <LeaveDialog student={leaving} onClose={() => setLeaving(null)} onDone={list.reload} />}
      {inviting && <InviteStudentDialog links={links} onClose={() => { onCloseInvite(); list.reload(); }} />}
    </>
  );
}

// Parent invitations (ADM-022). Loaded by the page, so the tab's "Invite everyone" button
// knows whether anyone is left to invite.
function useParentInvites(enabled) {
  const { t } = useTranslation();
  const list = useLoad("/invites", { skip: !enabled });
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
  return { list, result, busy, send, counts: c, canInviteAll: Boolean(c.not_invited || c.bounced) };
}

function ParentsTab({ invites }) {
  const { t } = useTranslation();
  const { list, result, send, counts: c } = invites;
  const fit = useFitHeight();
  const columns = [
    { key: "name", label: t("school.people.name", { defaultValue: "Name" }), sortable: true },
    { key: "email", label: t("school.invites.email", { defaultValue: "Email" }), sortable: true },
    { key: "children", label: t("school.invites.children", { defaultValue: "Children" }), render: (r) => r.children.join(", ") || "—" },
    { key: "status", label: t("school.invites.status", { defaultValue: "Status" }), sortable: true, render: (r) => <StatusPill status={r.status} /> },
    { key: "lastSentAt", label: t("school.invites.last", { defaultValue: "Last sent" }), render: (r) => (r.lastSentAt ? fmtDate(r.lastSentAt.slice(0, 10)) : "—") },
    { key: "act", label: "", render: (r) => r.status !== "linked" && <Button size="sm" variant="ghost" onClick={() => send({ parentIds: [r.parentId] })}>{r.sends ? t("school.invites.resend", { defaultValue: "Resend" }) : t("school.invites.send", { defaultValue: "Invite" })}</Button> },
  ];
  return (
    <>
      <p className={`${s.small} ${s.muted} ${s.helpLine}`}>
        <FaEnvelope aria-hidden="true" /> {t("school.invites.how", { defaultValue: "Parents get an email. When they sign in with that same address they are linked to their children straight away. No codes." })}
      </p>
      <div className={s.row}>
        <span className={s.pill}>{t("school.invites.total", { defaultValue: "{{n}} parents", n: list.data?.total ?? 0 })}</span>
        <StatusPill status="linked" label={t("school.invites.linkedN", { defaultValue: "{{n}} linked", n: c.linked || 0 })} />
        <StatusPill status="invited" label={t("school.invites.invitedN", { defaultValue: "{{n}} invited", n: c.invited || 0 })} />
        <StatusPill status="bounced" label={t("school.invites.bouncedN", { defaultValue: "{{n}} bounced", n: c.bounced || 0 })} />
        <StatusPill status="not_invited" label={t("school.invites.notN", { defaultValue: "{{n}} not invited", n: c.not_invited || 0 })} />
      </div>
      <Result result={result} />
      <div ref={fit} className={s.listFit}>
        {list.loading ? <Skeleton variant="chart" /> : list.data?.parents?.length ? (
          <DataTable className={`${s.rows} ${s.rowsAct}`} caption={t("school.invites.caption", { defaultValue: "Parents and their invitation status" })} columns={columns} rows={list.data.parents} getRowKey={(r) => r.parentId} defaultSort={{ key: "status", dir: "desc" }} />
        ) : <EmptyState title={t("school.invites.empty", { defaultValue: "No parents yet" })} text={t("school.invites.emptyText", { defaultValue: "Add parent emails in your student import and they appear here." })} />}
      </div>
    </>
  );
}

const ROLE_HELP = {
  coordinator: "Everything inside the chosen units (or subjects): analytics, students, question review.",
  office: "Students, teachers, parents and imports. No analytics.",
  viewer: "Read-only analytics, for example a board member.",
};

// Add a coordinator, office member or board viewer (a sheet from the tab's main button).
function AddStaffSheet({ roles, units, onClose, onDone }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: "", name: "", role: "coordinator", unitIds: [], subjects: [] });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const toggle = (key, v) => setForm((f) => ({ ...f, [key]: f[key].includes(v) ? f[key].filter((x) => x !== v) : [...f[key], v] }));
  const add = async (e) => {
    e?.preventDefault();
    setBusy(true);
    try { await api.post("/staff", form); onDone(t("school.staff.added", { defaultValue: "Added. They sign in with Google at the admin login using {{e}}.", e: form.email })); onClose(); }
    catch (err) { setResult({ ok: false, text: err.message }); }
    setBusy(false);
  };
  return (
    <Dialog title={t("school.staff.addTitle", { defaultValue: "Add a staff member" })} onClose={onClose}>
      <form onSubmit={add}>
        <div className={s.formGrid}>
          <Field id="st-email" label={t("school.staff.email", { defaultValue: "Google email" })}><input id="st-email" type="email" className={s.input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="off" required /></Field>
          <Field id="st-name" label={t("school.staff.name", { defaultValue: "Name" })}><input id="st-name" className={s.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field id="st-role" label={t("school.staff.role", { defaultValue: "Role" })} hint={t(`school.staff.help.${form.role}`, { defaultValue: ROLE_HELP[form.role] })}>
            <select id="st-role" className={s.select} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} aria-describedby="st-role-hint">
              {(roles || []).map((r) => <option key={r.key} value={r.key}>{t(`school.role.${r.key}`, { defaultValue: r.label })}</option>)}
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
        <Result result={result} />
        <div className={s.actions}>
          <Button type="submit" icon={FaUserPlus} disabled={!form.email || busy}>{t("school.staff.add", { defaultValue: "Add staff member" })}</Button>
          <Button variant="ghost" data-sound="close" onClick={onClose}>{t("school.cancel", { defaultValue: "Cancel" })}</Button>
        </div>
      </form>
    </Dialog>
  );
}

function StaffTab({ adding, onCloseAdd }) {
  const { t } = useTranslation();
  const { has } = useSchool();
  const list = useLoad("/staff", { skip: !has("staff.roles") });
  const units = useUnits(has("org.tree"));
  const fit = useFitHeight();
  const [result, setResult] = useState(null);
  if (!has("staff.roles")) return <PlanLockCard module="staff.roles" title={t("school.lock.staff", { defaultValue: "Coordinators and staff roles" })} text={t("school.lock.staffText", { defaultValue: "Give coordinators, office staff and board members their own access." })} />;
  const update = async (id, body) => { try { await api.patch(`/staff/${id}`, body); list.reload(); } catch (e) { setResult({ ok: false, text: e.message }); } };
  const remove = async (st) => { if (window.confirm(t("school.staff.confirm", { defaultValue: "Remove {{e}}? Their access ends at once.", e: st.email }))) { await api.del(`/staff/${st._id}`); list.reload(); } };
  const roles = list.data?.roles || [];
  const columns = [
    { key: "who", label: t("school.staff.who", { defaultValue: "Who" }), sortable: true, sortValue: (st) => (st.name || st.email).toLowerCase(), render: (st) => <><div className={s.strong}>{st.name || st.email}</div><div className={`${s.small} ${s.muted}`}>{st.email}</div></> },
    { key: "role", label: t("school.staff.role", { defaultValue: "Role" }), render: (st) => (
      <select aria-label={t("school.staff.roleOf", { defaultValue: "Role of {{name}}", name: st.name || st.email })} className={s.select} value={st.role} onChange={(e) => update(st._id, { role: e.target.value })}>
        {roles.map((r) => <option key={r.key} value={r.key}>{t(`school.role.${r.key}`, { defaultValue: r.label })}</option>)}
      </select>
    ) },
    { key: "scope", label: t("school.staff.scope", { defaultValue: "Limited to" }), render: (st) => [...st.units.map((u) => u.label), ...(st.subjects || [])].join(", ") || t("school.staff.whole", { defaultValue: "Whole school" }) },
    { key: "last", label: t("school.staff.last", { defaultValue: "Last sign-in" }), render: (st) => (st.lastLoginAt ? fmtDate(st.lastLoginAt.slice(0, 10)) : t("school.staff.never", { defaultValue: "Not yet" })) },
    { key: "act", label: t("school.people.actions", { defaultValue: "Actions" }), render: (st) => (
      <span className={s.row}>
        <StatusPill status={st.status} />
        <Button size="sm" variant="ghost" onClick={() => update(st._id, { status: st.status === "active" ? "disabled" : "active" })}>{st.status === "active" ? t("school.staff.disable", { defaultValue: "Pause" }) : t("school.staff.enable", { defaultValue: "Resume" })}</Button>
        <Button size="sm" variant="ghost" onClick={() => remove(st)}>{t("school.staff.remove", { defaultValue: "Remove" })}</Button>
      </span>
    ) },
  ];
  return (
    <>
      <p className={`${s.small} ${s.muted} ${s.helpLine}`}>{t("school.staff.intro", { defaultValue: "Coordinators, office staff and board members, each with their own access. They sign in with Google at the admin login." })}</p>
      <Result result={result} />
      <div ref={fit} className={s.listFit}>
        {list.loading ? <Skeleton variant="chart" /> : list.data?.staff?.length ? (
          <DataTable className={s.rows} caption={t("school.staff.listTitle", { defaultValue: "Staff with access" })} columns={columns} rows={list.data.staff} getRowKey={(st) => st._id} defaultSort={{ key: "who", dir: "asc" }} />
        ) : <EmptyState compact title={t("school.staff.listTitle", { defaultValue: "Staff with access" })} text={t("school.staff.none", { defaultValue: "Only you so far." })} />}
      </div>
      {adding && <AddStaffSheet roles={roles} units={units} onClose={onCloseAdd} onDone={(text) => { setResult({ ok: true, text }); list.reload(); }} />}
    </>
  );
}

// Connect by email: teachers who asked to join, and every invitation the school sent
// (students and teachers), with Accept / Cancel. The teacher side also lives on Teachers.
function RequestsTab({ links }) {
  const { t } = useTranslation();
  const incoming = links.data?.incoming || [];
  const sent = (links.data?.outgoing || []).filter((r) => r.status !== "cancelled");
  return (
    <>
      <p className={`${s.small} ${s.muted} ${s.helpLine}`}>{t("school.requests.help", { defaultValue: "Nobody joins until they say yes. A seat is used only when a student taps Join." })}</p>
      <RequestInbox links={links} viewer="admin" showOutgoing={false}
        title={t("school.teachers.asking", { defaultValue: "Teachers who want to join" })} />
      <RequestInbox links={links} viewer="admin" showIncoming={false} maxOutgoing={30}
        outgoingTitle={t("school.requests.sent", { defaultValue: "Invitations you sent" })} />
      {links.data && !incoming.length && !sent.length && (
        <EmptyState icon="💌" title={t("school.requests.none", { defaultValue: "No requests or invitations yet" })}
          text={t("school.requests.noneText", { defaultValue: "Invite a student by email here, or a teacher on the Teachers page. Teachers can also ask to join by typing your email." })} />
      )}
      {links.error && <p className={s.errorText}>{links.error}</p>}
    </>
  );
}

function LeaversTab() {
  const { t } = useTranslation();
  const { can } = useSchool();
  const list = useLoad("/people/students?status=left");
  const fit = useFitHeight();
  const [result, setResult] = useState(null);
  const rejoin = async (r) => { try { await api.post(`/students/${r._id}/rejoin`); list.reload(); } catch (e) { setResult({ ok: false, text: e.message }); } };
  const rows = list.data?.students || [];
  return (
    <>
      <Result result={result} />
      <div ref={fit} className={s.listFit}>
        {rows.length ? (
          <DataTable className={`${s.rows} ${s.rowsAct}`} caption={t("school.leavers.caption", { defaultValue: "Students who left" })} rows={rows} getRowKey={(r) => r._id}
            columns={[
              { key: "name", label: t("school.people.name", { defaultValue: "Name" }), sortable: true },
              { key: "leftAt", label: t("school.leavers.when", { defaultValue: "Left on" }), sortable: true, render: (r) => (r.leftAt ? fmtDate(r.leftAt.slice(0, 10)) : "—") },
              { key: "leaveReason", label: t("school.leavers.why", { defaultValue: "Reason" }), render: (r) => r.leaveReason || "—" },
              { key: "act", label: "", render: (r) => can("people.write") && <Button size="sm" variant="ghost" icon={FaUndo} onClick={() => rejoin(r)}>{t("school.leavers.rejoin", { defaultValue: "Rejoin" })}</Button> },
            ]} />
        ) : list.loading ? <Skeleton variant="chart" /> : (
          <EmptyState compact title={t("school.leavers.none", { defaultValue: "Nobody has left." })} />
        )}
      </div>
    </>
  );
}

const PANES = ["students", "parents", "staff", "requests", "import", "leavers"];

export default function PeoplePage() {
  const { t } = useTranslation();
  const { can, has, isAdmin } = useSchool();
  const navigate = useNavigate();
  const location = useLocation();
  const allowed = { parents: can("parents.invite"), staff: isAdmin, requests: can("people.write"), import: can("people.import") };
  const ids = PANES.filter((k) => allowed[k] ?? true);
  const [pane0, setPane] = usePane(ids);
  // Old links (/people/import, /people/parents, …) keep working: the segment becomes ?pane=.
  const seg = location.pathname.split("/people/")[1]?.split("/")[0] || "";
  const pane = ids.includes(seg) ? seg : pane0;
  const idKey = ids.join("|");
  useEffect(() => {
    if (!seg) return;
    const n = new URLSearchParams(location.search);
    if (seg !== "students" && idKey.split("|").includes(seg)) n.set("pane", seg); else n.delete("pane");
    const q = n.toString();
    navigate(`${BASE}/people${q ? `?${q}` : ""}`, { replace: true });
  }, [seg, idKey, location.search, navigate]);

  // Connect-by-email requests (for the Requests tab, its count and the student invite sheet).
  const links = useLinks("admin", { poll: 30000, enabled: allowed.requests });
  const asking = (links.data?.incoming || []).length;
  const invites = useParentInvites(pane === "parents" && allowed.parents);
  const [sheet, setSheet] = useState(null); // "student" | "staff"
  const close = () => setSheet(null);

  const tabs = [
    { id: "students", label: t("school.people.tabStudents", { defaultValue: "Students" }) },
    allowed.parents && { id: "parents", label: t("school.people.tabParents", { defaultValue: "Parents" }) },
    allowed.staff && { id: "staff", label: t("school.people.tabStaff", { defaultValue: "Staff roles" }), short: t("school.people.tabStaffShort", { defaultValue: "Staff" }) },
    allowed.requests && { id: "requests", label: t("school.people.tabRequests", { defaultValue: "Requests & invites" }), short: t("school.people.tabRequestsShort", { defaultValue: "Requests" }), badge: asking || undefined },
    allowed.import && { id: "import", label: t("school.people.tabImport", { defaultValue: "Import" }) },
    { id: "leavers", label: t("school.people.tabLeavers", { defaultValue: "Leavers" }) },
  ];
  const inviteStudent = <Button icon={FaUserPlus} data-sound="open" onClick={() => setSheet("student")}>{t("school.people.inviteStudent", { defaultValue: "Invite by email" })}</Button>;
  const action = {
    students: can("people.write") ? inviteStudent : null,
    parents: <Button icon={FaEnvelope} disabled={invites.busy || !invites.canInviteAll} onClick={() => invites.send({ all: true, onlyNew: true })}>{t("school.invites.all", { defaultValue: "Invite everyone not yet invited" })}</Button>,
    staff: has("staff.roles") ? <Button icon={FaUserPlus} data-sound="open" onClick={() => setSheet("staff")}>{t("school.staff.add", { defaultValue: "Add staff member" })}</Button> : null,
    requests: inviteStudent,
  }[pane] || null;

  return (
    <div className={`${s.page} ${s.pageTight}`}>
      <div className={s.head}>
        <div>
          <h1 className={s.title}>{t("school.people.title", { defaultValue: "People" })}</h1>
          <p className={`${s.sub} ${s.subOptional}`}>{t("school.people.sub", { defaultValue: "Students, parents and staff: import, invite, move and manage." })}</p>
        </div>
      </div>
      <SubTabs label={t("school.people.title", { defaultValue: "People" })} value={pane} onChange={setPane} tabs={tabs} actions={action} />
      <SubPanel id="students" value={pane}>
        <StudentsTab links={links} inviting={sheet === "student" && pane === "students"} onCloseInvite={close} />
      </SubPanel>
      {allowed.parents && <SubPanel id="parents" value={pane}><ParentsTab invites={invites} /></SubPanel>}
      {allowed.staff && <SubPanel id="staff" value={pane}><StaffTab adding={sheet === "staff"} onCloseAdd={close} /></SubPanel>}
      {allowed.requests && (
        <SubPanel id="requests" value={pane}>
          <RequestsTab links={links} />
          {sheet === "student" && <InviteStudentDialog links={links} onClose={close} />}
        </SubPanel>
      )}
      {allowed.import && <SubPanel id="import" value={pane}><ImportWizard /></SubPanel>}
      <SubPanel id="leavers" value={pane}><LeaversTab /></SubPanel>
    </div>
  );
}
