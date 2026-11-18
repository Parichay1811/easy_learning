import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/dashboard";
import { AVATARS } from "./parentApi";
import LoginCard from "./LoginCard";
import s from "./parent.module.css";

// Three doors on one screen (PAR-001): create a child account, enter a link code, or a school invite.
export default function AddChildSheet({ api, onClose, onDone }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.add.${k}`, { defaultValue: d, ...o });
  const [door, setDoor] = useState(null);
  const [form, setForm] = useState({ name: "", age: "", avatar: AVATARS[0], email: "", code: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [card, setCard] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const create = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    const r = await api.post("/children/managed", { name: form.name.trim(), age: Number(form.age), avatar: form.avatar });
    setBusy(false);
    if (!r.success) return setError(r.message);
    setCard({ name: r.child.name, avatar: r.child.avatar, loginCode: r.loginCode, pictures: r.picturePassword });
    onDone?.();
  };

  const link = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    const c = await api.post("/children", { name: form.name.trim(), age: Number(form.age), email: form.email.trim() });
    if (!c.success) { setBusy(false); return setError(c.message || c.errors?.[0]?.msg); }
    if (c.child.linkStatus === "verified") { setBusy(false); onDone?.(); return onClose(T("linkedBySchool", "{{name}} is linked: your school had already confirmed it.", { name: c.child.name })); }
    const v = await api.post(`/children/${c.child._id}/verify`, { code: form.code });
    setBusy(false);
    onDone?.();
    if (!v.success) return setError(T("codeFailed", "{{msg}} {{name}} is saved as waiting: you can enter a new code from the Family page.", { msg: v.message, name: c.child.name }));
    onClose(T("linked", "{{name}} is linked. Their learning is on your Home page now.", { name: c.child.name }));
  };

  const school = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    const c = await api.post("/children", { name: form.name.trim(), age: Number(form.age), email: form.email.trim() });
    setBusy(false);
    if (!c.success) return setError(c.message || c.errors?.[0]?.msg);
    onDone?.();
    if (c.child.linkStatus === "verified") return onClose(T("linkedBySchool", "{{name}} is linked: your school had already confirmed it.", { name: c.child.name }));
    setError(T("noSchool", "We couldn't find a school link for this email yet. {{name}} is saved as waiting: ask the school to add you as a parent, or use a link code.", { name: c.child.name }));
  };

  return (
    <div className={s.backdrop} role="presentation" onClick={() => onClose()}>
      <div className={s.sheet} role="dialog" aria-modal="true" aria-labelledby="add-h" onClick={(e) => e.stopPropagation()}>
        <div className={s.sheetHead}>
          <h2 id="add-h">{card ? T("cardTitle", "{{name}}'s login card", { name: card.name }) : T("title", "Add a child")}</h2>
          <button type="button" className={s.iconBtn} aria-label={T("close", "Close")} onClick={() => onClose()}>✕</button>
        </div>

        {card ? (
          <>
            <LoginCard {...card} />
            <p className={s.muted}>{T("cardHelp", "On the child's device: open Learnigo, choose “I have a class code”, type the code and tap the three pictures in order. Keep this card somewhere safe. You can make a new one at any time.")}</p>
            <div className={s.row}><Button onClick={() => onClose()}>{T("done", "Done")}</Button></div>
          </>
        ) : !door ? (
          <div className={s.doors}>
            <button type="button" className={s.door} onClick={() => setDoor("create")}>
              <span className={s.doorIcon} aria-hidden="true">🧒</span>
              <strong>{T("createT", "Create a child account")}</strong>
              <span>{T("createD", "For younger children without email. They sign in with a code and three pictures.")}</span>
            </button>
            <button type="button" className={s.door} onClick={() => setDoor("code")}>
              <span className={s.doorIcon} aria-hidden="true">🔑</span>
              <strong>{T("codeT", "I have a link code")}</strong>
              <span>{T("codeD", "Your child already uses Learnigo: they make a code under “Link a parent” on their dashboard.")}</span>
            </button>
            <button type="button" className={s.door} onClick={() => setDoor("school")}>
              <span className={s.doorIcon} aria-hidden="true">🏫</span>
              <strong>{T("schoolT", "My school invited me")}</strong>
              <span>{T("schoolD", "If the school added you with this email, your child is linked automatically.")}</span>
            </button>
          </div>
        ) : door === "create" ? (
          <form onSubmit={create} className={s.stack}>
            <div className={s.formGrid}>
              <label className={s.field}>{T("name", "First name")}<input className={s.input} value={form.name} onChange={set("name")} required maxLength={60} autoComplete="off" /></label>
              <label className={s.field}>{T("age", "Age")}<input className={s.input} type="number" min={2} max={18} value={form.age} onChange={set("age")} required /></label>
            </div>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className={s.field}>{T("avatar", "Pick an avatar")}</legend>
              <div className={s.choices}>
                {AVATARS.map((a) => <button key={a} type="button" className={s.choice} aria-pressed={form.avatar === a} aria-label={a} onClick={() => setForm((f) => ({ ...f, avatar: a }))}>{a}</button>)}
              </div>
            </fieldset>
            <p className={`${s.muted} ${s.small}`}>{T("consent", "By creating the account you confirm you are the child's parent or guardian and agree to the privacy policy for them. We store only a first name, age and their learning, never an email.")}</p>
            {error && <p className={s.error} role="alert">{error}</p>}
            <div className={s.row}>
              <Button type="submit" disabled={busy}>{busy ? T("creating", "Creating…") : T("create", "Create account")}</Button>
              <Button variant="ghost" type="button" onClick={() => setDoor(null)}>{T("back", "Back")}</Button>
            </div>
          </form>
        ) : door === "code" ? (
          <form onSubmit={link} className={s.stack}>
            <div className={s.formGrid}>
              <label className={s.field}>{T("name", "First name")}<input className={s.input} value={form.name} onChange={set("name")} required minLength={2} maxLength={100} /></label>
              <label className={s.field}>{T("age", "Age")}<input className={s.input} type="number" min={1} max={25} value={form.age} onChange={set("age")} required /></label>
              <label className={s.field}>{T("email", "Their Learnigo email")}<input className={s.input} type="email" value={form.email} onChange={set("email")} required /></label>
              <label className={s.field}>{T("code", "Link code")}<input className={s.input} value={form.code} onChange={set("code")} required minLength={6} maxLength={8} placeholder="K7P4XQ" autoCapitalize="characters" autoComplete="one-time-code" /></label>
            </div>
            <p className={`${s.muted} ${s.small}`}>{T("codeHelp", "The code works once and lasts 24 hours.")}</p>
            {error && <p className={s.error} role="alert">{error}</p>}
            <div className={s.row}>
              <Button type="submit" disabled={busy}>{busy ? T("linking", "Linking…") : T("link", "Link")}</Button>
              <Button variant="ghost" type="button" onClick={() => setDoor(null)}>{T("back", "Back")}</Button>
            </div>
          </form>
        ) : (
          <div className={s.stack}>
            <p>{T("schoolHelp", "When your child's school or tutor adds you as a parent with the email you signed in with, your child appears here as linked, with nothing else to do. If you have their Learnigo email, add it below and we check with the school straight away.")}</p>
            <form onSubmit={school} className={s.formGrid}>
              <label className={s.field}>{T("name", "First name")}<input className={s.input} value={form.name} onChange={set("name")} required minLength={2} /></label>
              <label className={s.field}>{T("age", "Age")}<input className={s.input} type="number" min={1} max={25} value={form.age} onChange={set("age")} required /></label>
              <label className={s.field} style={{ gridColumn: "1 / -1" }}>{T("email", "Their Learnigo email")}<input className={s.input} type="email" value={form.email} onChange={set("email")} required /></label>
              {error && <p className={s.error} role="alert" style={{ gridColumn: "1 / -1" }}>{error}</p>}
              <div className={s.row} style={{ gridColumn: "1 / -1" }}>
                <Button type="submit" disabled={busy}>{T("check", "Check with the school")}</Button>
                <Button variant="ghost" type="button" onClick={() => setDoor(null)}>{T("back", "Back")}</Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
