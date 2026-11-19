// "Type their email, we send them a request." One small form for every role.
// `onSend(email)` does the call (usually links.send({...})) and returns its result.
// Extra fields (a name, an age, a group) go in as children, above the button.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { sfx } from "../../utils/sounds";
import s from "./links.module.css";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InviteByEmail({
  onSend, label, placeholder, button, hint, sentText, audience = "grownup", children, disabled = false, id = "invite-email", canSend = true,
}) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const kid = audience === "kid";

  const submit = async (e) => {
    e.preventDefault();
    const clean = email.trim();
    if (!EMAIL.test(clean)) { sfx.error(); return setMsg({ ok: false, text: t("links.badEmail", { defaultValue: "Please type a whole email address, like name@example.com." }) }); }
    setBusy(true); setMsg(null);
    const r = await onSend(clean);
    setBusy(false);
    if (!r?.ok) { sfx.error(); return setMsg({ ok: false, text: r?.message || t("links.failed", { defaultValue: "That didn't work. Please try again." }) }); }
    sfx.select();
    setEmail("");
    setMsg({
      ok: true,
      text: typeof sentText === "function" ? sentText(clean, r) : sentText || (r.linked
        ? t("links.linkedNow", { defaultValue: "Linked straight away." })
        : r.duplicate
          ? t("links.already", { defaultValue: "You already asked {{email}}. The request is still waiting for them.", email: clean })
          : t("links.sent", { defaultValue: "Sent! When {{email}} taps Accept, you're connected.", email: clean })),
    });
  };

  return (
    <form className={`${s.box} ${s.form}`} onSubmit={submit} noValidate>
      {children}
      <div className={s.row}>
        <label className={s.field} htmlFor={id}>
          {label || t("links.theirEmail", { defaultValue: "Their email" })}
          <input id={id} className={s.input} type="email" inputMode="email" autoComplete="off" autoCapitalize="none" spellCheck={false}
            value={email} onChange={(e) => { setEmail(e.target.value); if (msg && !msg.ok) setMsg(null); }}
            placeholder={placeholder || t("links.emailPh", { defaultValue: "name@example.com" })} maxLength={200} required />
        </label>
        <button type="submit" className={`${s.btn} ${kid ? s.big : ""}`} disabled={busy || disabled || !email.trim() || !canSend}>
          <span aria-hidden="true">✉️</span> {busy ? t("links.sending", { defaultValue: "Sending…" }) : button || t("links.send", { defaultValue: "Send request" })}
        </button>
      </div>
      {hint && <p className={s.fine}>{hint}</p>}
      {msg && <p className={msg.ok ? s.ok : s.err} role={msg.ok ? "status" : "alert"}>{msg.text}</p>}
    </form>
  );
}
