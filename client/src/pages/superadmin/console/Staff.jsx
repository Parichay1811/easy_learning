// Staff accounts (SUP-001), owners only: add people with a role, change roles,
// disable, unlock, reset two-factor sign-in, and end sessions.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, DataTable } from "../../../components/dashboard";
import { useConsoleApi, useLoad, ago, dateTime } from "./api";
import { Field, Loadable, Modal, Notice, Panel, Pill, ReasonDialog, SecretBox, StatusPill } from "./ui";
import s from "./console.module.css";

const ROLE_HELP = {
  owner: "Everything, including staff and audit export",
  support: "Organisations, people, chats, view-as, data rights",
  content: "Question banks, translations, AI Teacher content",
  finance: "Plans, subscriptions, invoices",
  engineer: "Health, jobs, flags, incidents",
  analyst: "Read-only analytics",
};

export default function Staff({ me }) {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const list = useLoad("/staff", { pollMs: 60_000 });
  const [adding, setAdding] = useState(null);
  const [secret, setSecret] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [msg, setMsg] = useState({ tone: "good", text: "" });
  const L = list.data;
  const run = async (fn, ok) => { try { await fn(); setMsg({ tone: "good", text: ok }); list.reload({ quiet: true }); } catch (e) { setMsg({ tone: "alert", text: e.message }); } };

  return (
    <>
      <Panel title={t("sa.st.title", "Staff")} sub={t("sa.st.sub", "Every console action is recorded under a named person. Everyone signs in with a password and an authenticator app.")} actions={<Button size="sm" onClick={() => setAdding({ name: "", email: "", role: "support" })}>{t("sa.st.add", "Add staff member")}</Button>}>
        <Notice tone={msg.tone} onClose={() => setMsg({ text: "" })}>{msg.text}</Notice>
        <Loadable state={list}>
          {L && <DataTable caption={t("sa.st.title", "Staff")} rows={L.staff} getRowKey={(x) => x.id} columns={[
            { key: "name", label: t("sa.col.name", "Name"), render: (x) => <span><span className={s.strong}>{x.name}</span><br /><span className={`${s.small} ${s.muted}`}>{x.email}</span></span> },
            { key: "role", label: t("sa.col.role", "Role"), render: (x) => (
              <select className={s.select} aria-label={t("sa.st.roleFor", "Role for {{n}}", { n: x.name })} value={x.role} disabled={x.id === me.staffId} onChange={(e) => run(() => api.patch(`/staff/${x.id}`, { role: e.target.value }), t("sa.st.roleChanged", "Role changed. It applies at once."))}>
                {L.roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            ) },
            { key: "status", label: t("sa.col.status", "Status"), render: (x) => <span className={s.row}><StatusPill status={x.status} />{x.locked && <Pill tone="alert">{t("sa.st.locked", "locked")}</Pill>}</span> },
            { key: "totp", label: t("sa.st.2fa", "Two-factor"), render: (x) => (x.totpEnabled ? <Pill tone="good">{t("sa.st.on", "On · {{n}} recovery codes", { n: x.recoveryCodesLeft })}</Pill> : <Pill tone="attention">{t("sa.st.setupDue", "Set-up at first sign-in")}</Pill>) },
            { key: "lastLoginAt", label: t("sa.st.last", "Last sign-in"), render: (x) => (x.lastLoginAt ? `${ago(x.lastLoginAt)}${x.lastLoginIp ? ` · ${x.lastLoginIp}` : ""}` : "—") },
            { key: "actions", label: "", render: (x) => (
              <span className={s.row}>
                {x.locked && <Button size="sm" variant="ghost" onClick={() => run(() => api.post(`/staff/${x.id}/unlock`), t("sa.st.unlocked", "Unlocked."))}>{t("sa.st.unlock", "Unlock")}</Button>}
                <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: "reset", x })}>{t("sa.st.reset", "Reset 2FA")}</Button>
                <Button size="sm" variant="ghost" onClick={() => run(() => api.post(`/staff/${x.id}/revoke-sessions`), t("sa.st.signedOut", "Signed out everywhere."))}>{t("sa.st.signOut", "Sign out")}</Button>
                {x.id !== me.staffId && <Button size="sm" variant="ghost" onClick={() => run(() => api.patch(`/staff/${x.id}`, { status: x.status === "active" ? "disabled" : "active" }), t("sa.st.updated", "Updated."))}>{x.status === "active" ? t("sa.st.disable", "Disable") : t("sa.st.enable", "Enable")}</Button>}
              </span>
            ) },
          ]} />}
        </Loadable>
        <ul className={`${s.list} ${s.small}`} style={{ marginTop: 12 }}>{Object.entries(ROLE_HELP).map(([r, h]) => <li key={r}><span className={s.strong}>{r}</span>: {t(`sa.st.help.${r}`, h)}</li>)}</ul>
      </Panel>

      <Panel title={t("sa.st.sessions", "Signed-in sessions")}>
        {L && !L.sessions.length && <p className={s.muted}>{t("sa.st.noSessions", "No named staff are signed in. (Break-glass tokens from before this console have no session record.)")}</p>}
        {L && L.sessions.length > 0 && <DataTable caption={t("sa.st.sessions", "Signed-in sessions")} rows={L.sessions} getRowKey={(x) => x.id} columns={[
          { key: "email", label: t("sa.st.who", "Who"), render: (x) => <span>{x.name || x.email}{x.breakGlass && <> <Pill tone="alert">{t("sa.breakGlass", "break-glass owner")}</Pill></>}<br /><span className={`${s.small} ${s.muted}`}>{x.role}</span></span> },
          { key: "ip", label: "IP" }, { key: "lastSeenAt", label: t("sa.st.seen", "Last seen"), render: (x) => ago(x.lastSeenAt) },
          { key: "createdAt", label: t("sa.st.since", "Since"), render: (x) => dateTime(x.createdAt) },
          { key: "end", label: "", render: (x) => (x.id === me.sid ? <Pill>{t("sa.st.this", "this session")}</Pill> : <Button size="sm" variant="ghost" onClick={() => run(() => api.del(`/staff/sessions/${x.id}`), t("sa.st.ended", "Session ended."))}>{t("sa.st.end", "End")}</Button>) },
        ]} />}
      </Panel>

      <Panel title={t("sa.st.bg", "Break-glass account")} sub={t("sa.st.bgSub", "The account from the server's environment (SUPER_ADMIN_EMAIL). For emergencies only: every use is audited and owners are notified.")} actions={<Button size="sm" variant="ghost" onClick={() => setDialog({ kind: "bg" })}>{t("sa.st.bgRevoke", "End all break-glass sessions")}</Button>}>
        <p className={s.small}>{L ? (L.breakGlassTotp ? t("sa.st.bgTotp", "Protected with a code (SUPER_ADMIN_TOTP_SECRET).") : t("sa.st.bgNoTotp", "Not protected with a code. Set SUPER_ADMIN_TOTP_SECRET on the server to require one.")) : ""}</p>
      </Panel>

      {adding && (
        <Modal title={t("sa.st.add", "Add staff member")} onClose={() => setAdding(null)} footer={<Button onClick={() => run(async () => { const r = await api.post("/staff", adding); setAdding(null); setSecret({ email: r.staff.email, password: r.temporaryPassword }); }, t("sa.st.added", "Added."))}>{t("sa.st.create", "Create account")}</Button>}>
          <Field label={t("sa.col.name", "Name")}><input className={s.input} value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })} /></Field>
          <Field label={t("sa.f.email", "Email")}><input type="email" className={s.input} value={adding.email} onChange={(e) => setAdding({ ...adding, email: e.target.value })} /></Field>
          <Field label={t("sa.col.role", "Role")} hint={t(`sa.st.help.${adding.role}`, ROLE_HELP[adding.role])}>
            <select className={s.select} value={adding.role} onChange={(e) => setAdding({ ...adding, role: e.target.value })}>{Object.keys(ROLE_HELP).map((r) => <option key={r}>{r}</option>)}</select>
          </Field>
        </Modal>
      )}
      {secret && (
        <Modal title={t("sa.st.tempTitle", "Temporary password for {{e}}", { e: secret.email })} onClose={() => setSecret(null)} footer={<Button onClick={() => setSecret(null)}>{t("sa.st.handed", "I have handed it over")}</Button>}>
          <p>{t("sa.st.tempText", "Shown only now. Give it to them in person or by a separate channel (it is not emailed). At first sign-in they choose a new password and set up an authenticator app.")}</p>
          <SecretBox label={t("sa.st.temp", "Temporary password")} value={secret.password} />
        </Modal>
      )}
      {dialog?.kind === "reset" && <ReasonDialog danger title={t("sa.st.resetTitle", "Reset two-factor for {{n}}", { n: dialog.x.name })} intro={t("sa.st.resetIntro", "For a lost phone. Their codes stop working, all their sessions end and they get a new temporary password. Verify who they are first.")} onClose={() => setDialog(null)} onConfirm={async (reason) => { const r = await api.post(`/staff/${dialog.x.id}/reset-2fa`, { reason }); setSecret({ email: dialog.x.email, password: r.temporaryPassword }); list.reload(); }} />}
      {dialog?.kind === "bg" && <ReasonDialog danger title={t("sa.st.bgRevoke", "End all break-glass sessions")} onClose={() => setDialog(null)} onConfirm={async () => { await api.post("/staff/break-glass/revoke"); setMsg({ tone: "good", text: t("sa.st.bgDone", "All break-glass sessions ended.") }); }} />}
    </>
  );
}
