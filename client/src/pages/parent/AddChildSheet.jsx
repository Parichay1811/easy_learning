import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/dashboard";
import { AVATARS, sendChildRequest } from "./parentApi";
import LoginCard from "./LoginCard";
import s from "./parent.module.css";
import x from "../../components/links/addChild.module.css";

// Three doors on one screen (PAR-001). The main one: type your child's Learnigo email,
// they get a request and tap Accept (services/linkRequests.js). The link code is the
// "other way" and says exactly where the child finds it. Also: create an account for a
// young child without email, or the school invite. `door` opens straight on one of them
// ("email" | "create" | "school"); Back still shows all three.
export default function AddChildSheet({ api, onClose, onDone, door: startDoor = null }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.add.${k}`, { defaultValue: d, ...o });
  const [door, setDoor] = useState(startDoor);
  const [form, setForm] = useState({ name: "", age: "", avatar: AVATARS[0], email: "", code: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [card, setCard] = useState(null);
  const [sent, setSent] = useState(null);
  const [errAt, setErrAt] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const first = form.name.trim().split(" ")[0] || T("yourChild", "your child");

  const create = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    const r = await api.post("/children/managed", { name: form.name.trim(), age: Number(form.age), avatar: form.avatar });
    setBusy(false);
    if (!r.success) return setError(r.message);
    setCard({ name: r.child.name, avatar: r.child.avatar, loginCode: r.loginCode, pictures: r.picturePassword });
    onDone?.();
  };

  // The main way: a request by email. The child taps Accept under My people.
  const request = async (e) => {
    e.preventDefault();
    setBusy(true); setError(""); setErrAt("request");
    const r = await sendChildRequest(api, { name: form.name.trim(), age: Number(form.age), email: form.email.trim() });
    setBusy(false);
    if (!r.success) return setError(r.message || r.errors?.[0]?.msg);
    onDone?.();
    if (r.linked) return onClose(T("linkedBySchool", "{{name}} is linked: your school had already confirmed it.", { name: r.child?.name || first }));
    setSent({ name: first, email: form.email.trim(), again: Boolean(r.duplicate) });
  };

  // The other way: the child's one-time link code.
  const link = async (e) => {
    e.preventDefault();
    setBusy(true); setError(""); setErrAt("code");
    const c = await api.post("/children", { name: form.name.trim(), age: Number(form.age), email: form.email.trim() });
    if (!c.success && c.status !== 409) { setBusy(false); return setError(c.message || c.errors?.[0]?.msg); }
    let child = c.child;
    if (!child) {
      const all = await api.get("/children");
      child = (all.children || []).find((k) => k.email === form.email.trim().toLowerCase());
      if (!child) { setBusy(false); return setError(c.message); }
    }
    if (child.linkStatus === "verified") { setBusy(false); onDone?.(); return onClose(T("linkedBySchool", "{{name}} is linked: your school had already confirmed it.", { name: child.name })); }
    const v = await api.post(`/children/${child._id}/verify`, { code: form.code });
    setBusy(false);
    onDone?.();
    if (!v.success) return setError(T("codeFailed", "{{msg}} {{name}} is saved as waiting: you can enter a new code from the Family page.", { msg: v.message, name: child.name }));
    onClose(T("linked", "{{name}} is linked. Their learning is on your Home page now.", { name: child.name }));
  };

  const school = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    const c = await api.post("/children", { name: form.name.trim(), age: Number(form.age), email: form.email.trim() });
    setBusy(false);
    if (!c.success) return setError(c.message || c.errors?.[0]?.msg);
    onDone?.();
    if (c.child.linkStatus === "verified") return onClose(T("linkedBySchool", "{{name}} is linked: your school had already confirmed it.", { name: c.child.name }));
    setError(T("noSchool2", "We couldn't find a school link for this email yet. {{name}} is saved as waiting: ask the school to add you as a parent, or send {{name}} a request by email.", { name: c.child.name }));
  };

  const back = () => { setDoor(null); setError(""); };
  const title = card ? T("cardTitle", "{{name}}'s login card", { name: card.name }) : sent ? T("sentTitle", "Request sent") : T("title", "Add a child");

  return (
    <div className={s.backdrop} role="presentation" onClick={() => onClose()}>
      <div className={s.sheet} role="dialog" aria-modal="true" aria-labelledby="add-h" onClick={(e) => e.stopPropagation()}>
        <div className={s.sheetHead}>
          <h2 id="add-h">{title}</h2>
          <button type="button" data-sound="close" className={s.iconBtn} aria-label={T("close", "Close")} onClick={() => onClose()}>✕</button>
        </div>

        {card ? (
          <>
            <LoginCard {...card} />
            <p className={s.muted}>{T("cardHelp", "On the child's device: open Learnigo, choose “I have a class code”, type the code and tap the three pictures in order. Keep this card somewhere safe. You can make a new one at any time.")}</p>
            <div className={s.row}><Button onClick={() => onClose()}>{T("done", "Done")}</Button></div>
          </>
        ) : sent ? (
          <div className={x.sent} role="status">
            <span className={x.sentIcon} aria-hidden="true">💌</span>
            <h3>{sent.again ? T("sentAgainT", "{{name}} already has your request", { name: sent.name }) : T("sentT", "We sent {{name}} a request", { name: sent.name })}</h3>
            <p>{T("sentD", "Ask {{name}} to open Learnigo, go to Dashboard → My people and tap Accept. We also emailed {{email}}. As soon as they accept, their learning shows up here.", { name: sent.name, email: sent.email })}</p>
            <p className={`${s.muted} ${s.small}`}>{T("sentWait", "The request waits for 14 days. You can cancel it on the Family page.")}</p>
            <Button onClick={() => onClose()}>{T("done", "Done")}</Button>
          </div>
        ) : !door ? (
          <div className={`${s.doors} ${x.doors}`}>
            <button type="button" data-sound="open" className={`${s.door} ${x.main}`} onClick={() => setDoor("email")}>
              <span className={s.doorIcon} aria-hidden="true">📧</span>
              <span className={x.text}>
                <strong>{T("emailT", "My child already uses Learnigo")}</strong>
                <span>{T("emailD", "Type their Learnigo email. They get a request and tap Accept. That's it.")}</span>
                <span className={x.badge}>{T("easiest", "Easiest")}</span>
              </span>
            </button>
            <button type="button" data-sound="open" className={s.door} onClick={() => setDoor("create")}>
              <span className={s.doorIcon} aria-hidden="true">🧒</span>
              <strong>{T("createT", "Create a child account")}</strong>
              <span>{T("createD", "For younger children without email. They sign in with a code and three pictures.")}</span>
            </button>
            <button type="button" data-sound="open" className={s.door} onClick={() => setDoor("school")}>
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
              <Button variant="ghost" type="button" data-sound="back" onClick={back}>{T("back", "Back")}</Button>
            </div>
          </form>
        ) : door === "email" ? (
          <div className={s.stack}>
            <ol className={x.how} aria-label={T("howT", "How it works")}>
              <li><span className={x.step}>1</span><span>{T("how1", "You type your child's Learnigo email.")}</span></li>
              <li><span className={x.step}>2</span><span>{T("how2", "They see your request under Dashboard → My people.")}</span></li>
              <li><span className={x.step}>3</span><span>{T("how3", "They tap Accept, and their learning shows up here.")}</span></li>
            </ol>
            <form onSubmit={request} className={s.stack}>
              <div className={s.formGrid}>
                <label className={s.field}>{T("name", "First name")}<input className={s.input} value={form.name} onChange={set("name")} required maxLength={60} autoComplete="off" /></label>
                <label className={s.field}>{T("age", "Age")}<input className={s.input} type="number" min={1} max={25} value={form.age} onChange={set("age")} required /></label>
                <label className={s.field} style={{ gridColumn: "1 / -1" }}>{T("email", "Their Learnigo email")}
                  <input className={s.input} type="email" inputMode="email" autoCapitalize="none" spellCheck={false} value={form.email} onChange={set("email")} required placeholder={T("emailPh", "the email they sign in with")} />
                </label>
              </div>
              {error && errAt === "request" && <p className={s.error} role="alert">{error}</p>}
              <div className={s.row}>
                <Button type="submit" disabled={busy}>{busy ? T("sending", "Sending…") : T("sendRequest", "Send request")}</Button>
                <Button variant="ghost" type="button" data-sound="back" onClick={back}>{T("back", "Back")}</Button>
              </div>
            </form>
            <details className={x.other}>
              <summary data-sound="toggle">{T("otherWays", "Other ways: my child gave me a link code")}</summary>
              <p className={x.where}>{T("codeWhere", "Where is the code? Ask your child to open")} <b>{T("codePath", "Dashboard → My people → Link code")}</b> {T("codeWhere2", "and tap “Show my link code”. It works once and lasts 24 hours.")}</p>
              <form onSubmit={link} className={s.row} style={{ alignItems: "flex-end" }}>
                <label className={s.field} style={{ flex: "1 1 180px" }}>{T("code", "Link code")}
                  <input className={s.input} value={form.code} onChange={set("code")} required minLength={6} maxLength={8} placeholder="K7P4XQ" autoCapitalize="characters" autoComplete="one-time-code" />
                </label>
                <Button type="submit" variant="soft" disabled={busy || !form.email.trim() || !form.name.trim() || !form.age}>{busy ? T("linking", "Linking…") : T("linkCode", "Link with code")}</Button>
              </form>
              <p className={`${s.muted} ${s.small}`}>{T("codeNeeds", "Fill in the name, age and email above first.")}</p>
              {error && errAt === "code" && <p className={s.error} role="alert">{error}</p>}
            </details>
          </div>
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
                <Button variant="ghost" type="button" data-sound="back" onClick={back}>{T("back", "Back")}</Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
