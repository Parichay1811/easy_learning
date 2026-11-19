// TCH-011: every way to add students to a group. Join code + QR + invite link, a pasted or
// uploaded class list (checked first, then added), and students already in the school.
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaQrcode, FaFileCsv, FaSchool, FaIdCard, FaCopy, FaExpand, FaSyncAlt, FaTimes, FaEnvelope } from "react-icons/fa";
import { Button } from "../../components/dashboard";
import { useTeacherApi } from "./teacherApi";
import { Modal, QrCode } from "./teacherUi";
import { limitText } from "./teacherShared";
import { parseRoster, SAMPLE_CSV } from "./rosterCsv";
import { useLinks, RequestInbox, InviteByEmail } from "../../components/links";
import s from "./teacher.module.css";

// Connect by email (services/linkRequests.js): invite a learner into this group, and
// answer learners who asked to join (they join this group). Nothing is shared and
// nobody joins until the learner taps Join.
function EmailTab({ group, onDone }) {
  const { t } = useTranslation();
  const links = useLinks("teacher", { poll: 30000 });
  const mine = useMemo(() => {
    if (!links.data) return links;
    const outgoing = (links.data.outgoing || []).filter((r) => r.kind === "class" && r.group?.id === String(group._id));
    return { ...links, data: { ...links.data, outgoing } };
  }, [links, group._id]);
  return (
    <div className={s.form}>
      <InviteByEmail id={`invite-${group._id}`}
        label={t("teacher.email.label", { defaultValue: "Student's email" })}
        placeholder={t("teacher.email.ph", { defaultValue: "the email they sign in with" })}
        hint={t("teacher.email.hint", { defaultValue: "They get a request and join {{name}} when they tap Join. Nothing is shared before that.", name: group.name })}
        onSend={(email) => links.send({ to: "student", email, groupId: String(group._id) })}
        sentText={(email) => t("teacher.email.sent", { defaultValue: "Sent! {{email}} joins as soon as they tap Join.", email })} />
      <RequestInbox links={mine} viewer="teacher" kinds={["class"]} groups={[{ id: String(group._id), name: group.name, emoji: group.emoji || "" }]}
        title={t("teacher.email.wantToJoin", { defaultValue: "Students who want to join" })}
        outgoingTitle={t("teacher.email.invited", { defaultValue: "Invited to this group" })}
        onAccepted={() => onDone?.()} />
    </div>
  );
}

function JoinTab({ group }) {
  const { t } = useTranslation();
  const { get, send } = useTeacherApi();
  const [join, setJoin] = useState(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [projector, setProjector] = useState(false);

  useEffect(() => {
    let live = true;
    get(`/groups/${group._id}/join`).then((r) => { if (!live) return; if (r.ok) setJoin(r.join); else setErr(limitText(t, r)); });
    return () => { live = false; };
  }, [get, group._id, t]);

  // The link a learner opens: this site, whatever host the teacher is on.
  const url = join ? `${window.location.origin}/join/${join.code}` : "";
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); }
  };
  const update = async (body) => {
    const r = await send("POST", `/groups/${group._id}/join`, body);
    if (r.ok) setJoin(r.join); else setErr(limitText(t, r));
  };

  if (err) return <p className={s.note}>{err}</p>;
  if (!join) return <p className={s.muted}>{t("teacher.loading", { defaultValue: "Loading…" })}</p>;
  return (
    <div className={s.form}>
      <div className={s.joinBox}>
        <QrCode text={url} label={t("teacher.join.qrLabel", { defaultValue: "QR code that opens the join page for {{name}}", name: group.name })} />
        <div>
          <p className={s.muted} style={{ margin: 0 }}>{t("teacher.join.codeLabel", { defaultValue: "Join code" })}</p>
          <p className={s.code} aria-label={join.code.split("").join(" ")}>{join.code}</p>
          <p style={{ marginTop: 0 }}>{t("teacher.join.how", { defaultValue: "Students scan the code, or go to the link and sign in. Parents can sign in and add their child." })}</p>
          <div className={s.linkBox}>
            <input className={s.input} value={url} readOnly aria-label={t("teacher.join.link", { defaultValue: "Invite link" })} onFocus={(e) => e.target.select()} />
            <Button variant="soft" icon={FaCopy} onClick={copy}>{copied ? t("teacher.join.copied", { defaultValue: "Copied" }) : t("teacher.join.copy", { defaultValue: "Copy link" })}</Button>
          </div>
        </div>
      </div>
      {!join.enabled && <p className={s.note}>{t("teacher.join.off", { defaultValue: "Joining is turned off. Nobody can use this code until you turn it on." })}</p>}
      <div className={s.row}>
        <Button icon={FaExpand} onClick={() => setProjector(true)} disabled={!join.enabled}>{t("teacher.join.projector", { defaultValue: "Show on projector" })}</Button>
        <Button variant="ghost" icon={FaSyncAlt} onClick={() => window.confirm(t("teacher.join.resetConfirm", { defaultValue: "Make a new code? The old code and link stop working." })) && update({ reset: true })}>{t("teacher.join.reset", { defaultValue: "New code" })}</Button>
        <Button variant="ghost" onClick={() => update({ enabled: !join.enabled })}>{join.enabled ? t("teacher.join.disable", { defaultValue: "Turn joining off" }) : t("teacher.join.enable", { defaultValue: "Turn joining on" })}</Button>
      </div>
      {projector && (
        <div className={s.projector} role="dialog" aria-modal="true" aria-label={t("teacher.join.projector", { defaultValue: "Show on projector" })}>
          <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 3rem)", margin: 0 }}>{group.emoji} {t("teacher.join.projectorTitle", { defaultValue: "Join {{name}}", name: group.name })}</h2>
          <QrCode text={url} label={t("teacher.join.qrLabel", { defaultValue: "QR code that opens the join page for {{name}}", name: group.name })} />
          <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.6rem)", margin: 0 }}>{url.replace(/^https?:\/\//, "")}</p>
          <p className={s.code}>{join.code}</p>
          <Button variant="ghost" icon={FaTimes} onClick={() => setProjector(false)} autoFocus>{t("teacher.close", { defaultValue: "Close" })}</Button>
        </div>
      )}
    </div>
  );
}

const STATUS_TEXT = { new: "New", existing: "Will be added", in_group: "Already here", error: "Fix this" };

function ListTab({ group, onDone }) {
  const { t } = useTranslation();
  const { send } = useTeacherApi();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(null);
  const [inviteParents, setInviteParents] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);
  const parsed = useMemo(() => parseRoster(text), [text]);

  const readFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { setErr({ message: t("teacher.list.tooBig", { defaultValue: "That file is over 1 MB. Save it as CSV first." }) }); return; }
    const r = new FileReader();
    r.onload = () => { setText(String(r.result || "")); setPreview(null); };
    r.readAsText(file);
  };
  const check = async () => {
    setBusy(true); setErr(null); setDone(null);
    const r = await send("POST", `/groups/${group._id}/roster`, { rows: parsed.rows, dryRun: true });
    setBusy(false);
    if (r.ok) setPreview(r); else setErr(r);
  };
  const apply = async () => {
    setBusy(true); setErr(null);
    const r = await send("POST", `/groups/${group._id}/roster`, { rows: parsed.rows, dryRun: false, inviteParents });
    setBusy(false);
    if (!r.ok) return setErr(r);
    setDone(r); setPreview(null); setText("");
    onDone?.();
  };
  const adding = preview ? preview.summary.new + preview.summary.existing : 0;
  const parentCount = preview ? preview.rows.filter((r) => r.parentEmail && r.status !== "error").length : 0;

  return (
    <div className={s.form}>
      {done && <p className={s.success} role="status">{t("teacher.list.done", { defaultValue: "Added {{added}} students ({{created}} new). {{invited}} parent invites sent.", added: done.added, created: done.created, invited: done.invited })}</p>}
      <label className={s.field}>
        <span>{t("teacher.list.paste", { defaultValue: "Paste your class list" })}</span>
        <textarea className={s.textarea} value={text} onChange={(e) => { setText(e.target.value); setPreview(null); }} placeholder={SAMPLE_CSV} rows={6} />
        <small>{t("teacher.list.help", { defaultValue: "One student per line: name, email, grade, age, parent email, parent name. Copy straight from a spreadsheet, or use a header row." })}</small>
      </label>
      <div className={s.row}>
        <label className={s.chipToggle} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <FaFileCsv aria-hidden="true" /> {t("teacher.list.upload", { defaultValue: "Upload a CSV file" })}
          <input type="file" accept=".csv,.txt,text/csv,text/plain" onChange={readFile} className="d-sr-only" />
        </label>
        <Button onClick={check} disabled={busy || !parsed.rows.length}>{t("teacher.list.check", { defaultValue: "Check {{count}} rows", count: parsed.rows.length })}</Button>
      </div>
      {err && <p className={s.error} role="alert">{limitText(t, err)}</p>}
      {preview && (
        <>
          <p className={s.note} role="status">
            {t("teacher.list.summary", { defaultValue: "{{new}} new, {{existing}} already in your workspace, {{inGroup}} already in this group, {{error}} to fix.", new: preview.summary.new, existing: preview.summary.existing, inGroup: preview.summary.in_group, error: preview.summary.error })}
          </p>
          {preview.problems.map((p) => <p key={p.code} className={s.error}>{p.message}</p>)}
          <div className={s.tableWrap}>
            <table className={s.table}>
              <caption className="d-sr-only">{t("teacher.list.previewCaption", { defaultValue: "Preview of the students to add" })}</caption>
              <thead><tr><th>#</th><th>{t("teacher.name", { defaultValue: "Name" })}</th><th>{t("teacher.email", { defaultValue: "Email" })}</th><th>{t("teacher.list.parent", { defaultValue: "Parent email" })}</th><th>{t("teacher.list.status", { defaultValue: "Status" })}</th></tr></thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.row} className={r.status === "error" ? s.rowError : ""}>
                    <td>{r.row}</td><td>{r.name || "—"}</td><td>{r.email || "—"}</td><td>{r.parentEmail || "—"}</td>
                    <td><strong>{t(`teacher.list.st.${r.status}`, { defaultValue: STATUS_TEXT[r.status] })}</strong><br /><span className={s.small}>{r.message}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parentCount > 0 && (
            <label className={s.row}>
              <input type="checkbox" checked={inviteParents} onChange={(e) => setInviteParents(e.target.checked)} style={{ width: 22, height: 22 }} />
              {t("teacher.list.inviteParents", { defaultValue: "Email an invite to the parents in the list ({{count}}), so they can follow their child", count: parentCount })}
            </label>
          )}
          <div className={s.row}>
            <Button onClick={apply} disabled={busy || preview.summary.error > 0 || adding === 0 || preview.problems.length > 0}>{t("teacher.list.add", { defaultValue: "Add {{count}} students", defaultValue_one: "Add {{count}} student", count: adding })}</Button>
            {preview.summary.error > 0 && <span className={s.muted}>{t("teacher.list.fixFirst", { defaultValue: "Fix the red rows above, then check again." })}</span>}
          </div>
        </>
      )}
    </div>
  );
}

function SchoolTab({ group, onDone }) {
  const { t } = useTranslation();
  const { get, send } = useTeacherApi();
  const [all, setAll] = useState(null);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState([]);
  const [msg, setMsg] = useState(null);
  useEffect(() => { get("/students").then((r) => setAll(r.ok ? r.students : [])); }, [get]);
  const inGroup = new Set((group.studentIdList || []).map(String));
  const list = (all || []).filter((x) => !inGroup.has(String(x._id)) && x.name.toLowerCase().includes(search.toLowerCase())).slice(0, 100);
  const add = async () => {
    const r = await send("POST", `/batches/${group._id}/students`, { studentIds: picked });
    setMsg(r.ok ? { ok: true, text: t("teacher.school.added", { defaultValue: "Added {{count}} students.", defaultValue_one: "Added {{count}} student.", count: picked.length }) } : { ok: false, text: limitText(t, r) });
    if (r.ok) { setPicked([]); onDone?.(); }
  };
  return (
    <div className={s.form}>
      <input className={s.input} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("teacher.school.search", { defaultValue: "Search students in your school" })} aria-label={t("teacher.school.search", { defaultValue: "Search students in your school" })} />
      {all === null ? <p className={s.muted}>{t("teacher.loading", { defaultValue: "Loading…" })}</p> : (
        <ul className={s.personList} style={{ maxHeight: 320, overflow: "auto" }}>
          {list.map((x) => (
            <li key={x._id} className={s.personRow}>
              <label className={s.row} style={{ flex: 1 }}>
                <input type="checkbox" style={{ width: 22, height: 22 }} checked={picked.includes(x._id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, x._id] : p.filter((id) => id !== x._id)))} />
                <span className={s.personMain}><strong>{x.name}</strong><span>{x.email || "—"}</span></span>
              </label>
            </li>
          ))}
          {!list.length && <li className={s.muted}>{t("teacher.school.none", { defaultValue: "No other students found." })}</li>}
        </ul>
      )}
      {msg && <p className={msg.ok ? s.success : s.error}>{msg.text}</p>}
      <Button onClick={add} disabled={!picked.length}>{t("teacher.school.add", { defaultValue: "Add {{count}} to the group", count: picked.length })}</Button>
    </div>
  );
}

export default function AddStudentsPanel({ group, permissions, onClose, onChanged }) {
  const { t } = useTranslation();
  const tabs = [
    { key: "email", label: t("teacher.add.email", { defaultValue: "By email" }), icon: FaEnvelope },
    permissions.canAddNewStudents && { key: "join", label: t("teacher.add.join", { defaultValue: "Join code" }), icon: FaQrcode },
    permissions.canAddNewStudents && { key: "list", label: t("teacher.add.list", { defaultValue: "Paste or upload a list" }), icon: FaFileCsv },
    !permissions.isSolo && { key: "school", label: t("teacher.add.school", { defaultValue: "From your school" }), icon: FaSchool },
    { key: "cards", label: t("teacher.add.cards", { defaultValue: "No email? Login cards" }), icon: FaIdCard },
  ].filter(Boolean);
  const [tab, setTab] = useState(tabs[0].key);
  return (
    <Modal wide title={t("teacher.add.title", { defaultValue: "Add students to {{name}}", name: group.name })} onClose={onClose}>
      <div className={s.tabs} role="tablist" style={{ marginBottom: 16 }}>
        {tabs.map((x) => (
          <button key={x.key} type="button" role="tab" data-sound="tab" aria-selected={tab === x.key} className={`${s.tab} ${tab === x.key ? s.tabOn : ""}`} onClick={() => setTab(x.key)}>
            <x.icon aria-hidden="true" /> {x.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === "email" && <EmailTab group={group} onDone={onChanged} />}
        {tab === "join" && <JoinTab group={group} />}
        {tab === "list" && <ListTab group={group} onDone={onChanged} />}
        {tab === "school" && <SchoolTab group={group} onDone={onChanged} />}
        {tab === "cards" && (
          // TODO(FND-011, Parent work): services/managedLearners.js will create learners without
          // email (picture-password login cards). Hook "Create login cards" up to it here.
          <p className={s.note}>{t("teacher.add.cardsSoon", { defaultValue: "Young learners without an email will soon get printable login cards with a picture password. This isn't available yet. For now, add them by name in a list: they appear in your group and can sign in once cards arrive." })}</p>
        )}
      </div>
    </Modal>
  );
}
