// Settings (SUP-070): my account (password, recovery codes) for everyone, and
// the platform settings for owners: languages, default org policy, retention,
// legal versions, email templates, AI Teacher profile, canned support replies.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, usePane } from "../../../components/dashboard";
import { useConsoleApi, useLoad, dateTime } from "./api";
import { Field, Loadable, Modal, Notice, Panel, Pill, SecretBox, TabBody, Tabs } from "./ui";
import s from "./console.module.css";

function MyAccount({ me }) {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const info = useLoad("/auth/me");
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState(null);
  const [msg, setMsg] = useState({ tone: "good", text: "" });
  const run = async (fn, ok) => { try { await fn(); setMsg({ tone: "good", text: ok }); } catch (e) { setMsg({ tone: "alert", text: e.message }); } };
  const S = info.data?.staff;
  if (me.breakGlass) return <Panel title={t("sa.set.me", "My account")}><p className={s.muted}>{t("sa.set.bg", "You are signed in with the break-glass account. Its password lives in the server environment. Ask an owner for a named account.")}</p></Panel>;
  return (
    <Panel title={t("sa.set.me", "My account")} sub={S ? `${S.name} · ${S.email} · ${S.role}` : ""}>
      <Notice tone={msg.tone} onClose={() => setMsg({ text: "" })}>{msg.text}</Notice>
      <div className={s.grid2}>
        <form className={s.stack} onSubmit={(e) => { e.preventDefault(); run(async () => { await api.post("/auth/password", pw); setPw({ currentPassword: "", newPassword: "" }); }, t("sa.set.pwDone", "Password changed. Your other sessions were signed out.")); }}>
          <h3 className={s.label}>{t("sa.set.pw", "Change password")}</h3>
          <Field label={t("sa.set.current", "Current password")}><input type="password" autoComplete="current-password" className={s.input} value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
          <Field label={t("sa.set.new", "New password (12+ characters)")}><input type="password" autoComplete="new-password" className={s.input} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
          <Button type="submit" size="sm">{t("sa.set.pwBtn", "Change password")}</Button>
        </form>
        <form className={s.stack} onSubmit={(e) => { e.preventDefault(); run(async () => { const r = await api.post("/auth/2fa/recovery-codes", { code }); setCodes(r.recoveryCodes); setCode(""); info.reload({ quiet: true }); }, t("sa.set.codesDone", "New recovery codes made. The old ones no longer work.")); }}>
          <h3 className={s.label}>{t("sa.set.codes", "Recovery codes")}</h3>
          <p className={s.small}>{S ? t("sa.set.codesLeft", "{{n}} unused codes left. Each works once if you lose your phone.", { n: S.recoveryCodesLeft }) : ""}</p>
          <Field label={t("sa.set.code", "Code from your authenticator app")}><input className={s.input} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} /></Field>
          <Button type="submit" size="sm" variant="soft">{t("sa.set.newCodes", "Make new recovery codes")}</Button>
          {codes && <SecretBox label={t("sa.set.saveCodes", "Save these now: they are shown once")} value={codes.join("\n")} />}
        </form>
      </div>
      {S?.lastLoginAt && <p className={`${s.small} ${s.muted}`}>{t("sa.set.lastLogin", "Last sign-in: {{d}}", { d: dateTime(S.lastLoginAt) })}</p>}
    </Panel>
  );
}

// One JSON setting, edited in a dialog (the list shows a one-line preview).
function JsonSetting({ k, item, canEdit, onSave, onClose }) {
  const { t } = useTranslation();
  const [text, setText] = useState(() => JSON.stringify(item.value, null, 2));
  const [err, setErr] = useState("");
  const save = async () => {
    let value;
    try { value = JSON.parse(text); } catch { setErr(t("sa.set.json", "That is not valid JSON.")); return; }
    try { await onSave(k, value); setErr(""); onClose(); } catch (e) { setErr(e.message); }
  };
  return (
    <Modal wide title={item.label} onClose={onClose} footer={canEdit ? <>
      <Button variant="ghost" onClick={onClose}>{t("sa.cancel", "Cancel")}</Button>
      <Button onClick={save}>{t("sa.save", "Save")}</Button>
    </> : <Button variant="ghost" onClick={onClose}>{t("sa.close", "Close")}</Button>}>
      <Field label={<>{t("sa.set.value", "Value (JSON)")} {item.isDefault && <Pill>{t("sa.set.default", "default")}</Pill>}</>} hint={<span className={s.mono}>{k}</span>} error={err}>
        <textarea className={`${s.textarea} ${s.mono}`} rows={Math.min(18, text.split("\n").length + 1)} value={text} readOnly={!canEdit} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      </Field>
    </Modal>
  );
}

const JSON_KEYS = ["platform.retention", "platform.legal", "platform.defaultOrgPolicy", "platform.aiTeacher", "platform.emailTemplates", "support.cannedReplies"];
const preview = (v) => { const x = JSON.stringify(v); return x.length > 90 ? `${x.slice(0, 90)}…` : x; };

function Platform({ role }) {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const st = useLoad("/settings/platform");
  const legacy = useLoad("/settings", { skip: !["owner", "engineer", "support"].includes(role) });
  const [msg, setMsg] = useState({ tone: "good", text: "" });
  const [langs, setLangs] = useState(null);
  const [editing, setEditing] = useState(null);
  const canEdit = role === "owner";
  const S = st.data?.settings;
  const save = async (key, value) => { await api.put(`/settings/platform/${key}`, { value }); setMsg({ tone: "good", text: t("sa.set.saved", "Saved and recorded in the audit log.") }); st.reload({ quiet: true }); };
  const L = langs ?? (S ? S["platform.languages"].value.join(", ") : "");
  return (
    <Panel title={t("sa.set.platform", "Platform settings")} sub={canEdit ? t("sa.set.ownerOnly", "Owners can change these. Every change is audited.") : t("sa.set.readOnly", "Read-only for your role.")}>
      <Notice tone={msg.tone} onClose={() => setMsg({ text: "" })}>{msg.text}</Notice>
      <Loadable state={st}>
        {S && (
          <div className={s.stack}>
            <div className={s.row} style={{ alignItems: "flex-end" }}>
              <Field label={S["platform.languages"].label} hint={t("sa.set.langHint", "Language codes, comma separated (e.g. en, de, hi)")}><input className={`${s.input} ${s.search}`} value={L} readOnly={!canEdit} onChange={(e) => setLangs(e.target.value)} /></Field>
              {canEdit && <Button size="sm" variant="soft" onClick={() => save("platform.languages", L.split(",").map((x) => x.trim()).filter(Boolean)).catch((e) => setMsg({ tone: "alert", text: e.message }))}>{t("sa.save", "Save")}</Button>}
            </div>
            <ul className={s.list}>
              {JSON_KEYS.filter((k) => S[k]).map((k) => (
                <li key={k} className={s.listItem}>
                  <span style={{ minWidth: 0 }}>
                    <span className={s.strong}>{S[k].label}</span> {S[k].isDefault && <Pill>{t("sa.set.default", "default")}</Pill>}<br />
                    <span className={`${s.mono} ${s.muted} ${s.small}`}>{preview(S[k].value)}</span>
                  </span>
                  <Button size="sm" variant={canEdit ? "soft" : "ghost"} onClick={() => setEditing(k)}>{canEdit ? t("sa.edit", "Edit") : t("sa.view", "View")}</Button>
                </li>
              ))}
            </ul>
            {editing && S[editing] && <JsonSetting k={editing} item={S[editing]} canEdit={canEdit} onSave={save} onClose={() => setEditing(null)} />}
          </div>
        )}
      </Loadable>
      {legacy.data?.settings?.length > 0 && (
        <details style={{ marginTop: 16 }}>
          <summary className={s.label}>{t("sa.set.legacy", "Other key/value settings")}</summary>
          <ul className={s.list}>{legacy.data.settings.filter((x) => !String(x.key).startsWith("platform.") && !String(x.key).startsWith("ops.")).map((x) => <li key={x.key} className={s.listItem}><span className={s.mono}>{x.key}</span><span className={`${s.mono} ${s.small}`}>{JSON.stringify(x.value).slice(0, 80)}</span></li>)}</ul>
        </details>
      )}
    </Panel>
  );
}

export default function Settings({ role, me }) {
  const { t } = useTranslation();
  const [pane, setPane] = usePane(["me", "platform"]);
  return (
    <>
      <Tabs label={t("sa.nav.settings", "Settings")} value={pane} onChange={setPane} tabs={[
        { key: "me", label: t("sa.set.me", "My account") },
        { key: "platform", label: t("sa.set.platform", "Platform settings") },
      ]} />
      <TabBody value={pane}>
        {pane === "me" ? <MyAccount me={me} /> : <Platform role={role} />}
      </TabBody>
    </>
  );
}
