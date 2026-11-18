// TCH-012: invite parents in bulk; each child shows Linked / Invited / None.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaEnvelope, FaLink, FaHourglassHalf, FaMinusCircle } from "react-icons/fa";
import { Button, EmptyState, Skeleton } from "../../components/dashboard";
import { useLoad, useTeacherApi } from "./teacherApi";
import { limitText } from "./teacherShared";
import s from "./teacher.module.css";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ParentStatus({ status }) {
  const { t } = useTranslation();
  if (status === "linked") return <span className={`${s.badge} ${s.badgeGood}`}><FaLink aria-hidden="true" /> {t("teacher.parents.linked", { defaultValue: "Linked" })}</span>;
  if (status === "invited") return <span className={`${s.badge} ${s.badgeAccent}`}><FaHourglassHalf aria-hidden="true" /> {t("teacher.parents.invited", { defaultValue: "Invited" })}</span>;
  return <span className={s.badge}><FaMinusCircle aria-hidden="true" /> {t("teacher.parents.none", { defaultValue: "None" })}</span>;
}

export default function ParentsPanel({ groupId }) {
  const { t } = useTranslation();
  const { get, send } = useTeacherApi();
  const q = useLoad(() => get(`/groups/${groupId}/parents`), [groupId]);
  const [emails, setEmails] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);


  if (q.loading && !q.data) return <Skeleton variant="chart" />;
  if (q.error) return <EmptyState tone="error" title={t("teacher.loadError", { defaultValue: "We couldn't load this page" })} text={q.error} actionLabel={t("teacher.retry", { defaultValue: "Try again" })} onAction={q.reload} />;
  const d = q.data;
  if (!d.students.length) return <EmptyState title={t("teacher.parents.noStudents", { defaultValue: "No students yet" })} text={t("teacher.parents.noStudentsText", { defaultValue: "Add students first, then invite their parents." })} />;

  // Typed emails win; otherwise the parent the school or I already added.
  const emailOf = (st) => emails[st.studentId] ?? (st.parents.find((p) => p.status !== "linked")?.email || "");
  const ready = d.students.filter((st) => st.status !== "linked" && EMAIL.test(emailOf(st)));
  const invite = async (list) => {
    setBusy(true); setMsg(null);
    const r = await send("POST", `/groups/${groupId}/parents/invite`, { invites: list.map((st) => ({ studentId: st.studentId, email: emailOf(st) })) });
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: limitText(t, r) });
    const failed = r.results.filter((x) => x.status !== "invited");
    setMsg({ ok: !failed.length, text: t("teacher.parents.sent", { defaultValue: "{{count}} invites sent.", count: r.sent }) + (failed.length ? ` ${failed.map((f) => `${f.email}: ${f.message}`).join("; ")}` : "") });
    q.reload();
  };

  return (
    <div className={s.form}>
      <div className={s.row}>
        <ParentStatus status="linked" /> <strong>{d.counts.linked}</strong>
        <ParentStatus status="invited" /> <strong>{d.counts.invited}</strong>
        <ParentStatus status="none" /> <strong>{d.counts.none}</strong>
      </div>
      <p className={s.muted} style={{ margin: 0 }}>{t("teacher.parents.help", { defaultValue: "Parents get an email to sign in with Google. Once they add their child, the link is confirmed automatically because you invited them." })}</p>
      {msg && <p className={msg.ok ? s.success : s.error} role="status">{msg.text}</p>}
      <div className={s.tableWrap}>
        <table className={s.table}>
          <caption className="d-sr-only">{t("teacher.parents.caption", { defaultValue: "Parents of each student" })}</caption>
          <thead><tr><th>{t("teacher.student", { defaultValue: "Student" })}</th><th>{t("teacher.parents.status", { defaultValue: "Parent" })}</th><th>{t("teacher.parents.email", { defaultValue: "Parent email" })}</th></tr></thead>
          <tbody>
            {d.students.map((st) => (
              <tr key={st.studentId}>
                <td><strong>{st.name}</strong><br /><span className={s.small}>{st.email || t("teacher.noEmail", { defaultValue: "no email" })}</span></td>
                <td><ParentStatus status={st.status} />{st.parents.filter((p) => p.status === "linked").map((p) => <div key={p.id} className={s.small}>{p.email}</div>)}</td>
                <td>
                  {st.status === "linked" ? "—" : (
                    <div className={s.row} style={{ flexWrap: "nowrap" }}>
                      <input className={s.input} type="email" value={emailOf(st)} onChange={(e) => setEmails((m) => ({ ...m, [st.studentId]: e.target.value }))} placeholder="parent@example.com" aria-label={t("teacher.parents.emailFor", { defaultValue: "Parent email for {{name}}", name: st.name })} style={{ minWidth: 180 }} />
                      <Button size="sm" variant="ghost" icon={FaEnvelope} disabled={busy || !EMAIL.test(emailOf(st))} onClick={() => invite([st])}>
                        {st.status === "invited" ? t("teacher.parents.resend", { defaultValue: "Resend" }) : t("teacher.parents.invite", { defaultValue: "Invite" })}<span className="d-sr-only"> {st.name}</span>
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div><Button icon={FaEnvelope} disabled={busy || !ready.length} onClick={() => invite(ready)}>{t("teacher.parents.inviteAll", { defaultValue: "Invite {{count}} parents", count: ready.length })}</Button></div>
    </div>
  );
}
