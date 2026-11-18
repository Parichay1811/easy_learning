import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import s from "./ManagedLogin.module.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
// Same ids as server/services/managedLearners.js PICTURES.
const PICTURES = [
  ["dog", "🐶", "Dog"], ["cat", "🐱", "Cat"], ["lion", "🦁", "Lion"], ["frog", "🐸", "Frog"], ["panda", "🐼", "Panda"], ["unicorn", "🦄", "Unicorn"],
  ["octopus", "🐙", "Octopus"], ["apple", "🍎", "Apple"], ["star", "⭐", "Star"], ["rocket", "🚀", "Rocket"], ["rainbow", "🌈", "Rainbow"], ["flower", "🌸", "Flower"],
];
const EMOJI = Object.fromEntries(PICTURES.map(([id, e]) => [id, e]));

// "I have a class code" (FND-011): a young child signs in with the code on their
// card and three pictures, tapped in order. No email, no typing a password.
export default function ManagedLogin({ onClose }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`managedLogin.${k}`, { defaultValue: d, ...o });
  const [code, setCode] = useState("");
  const [step, setStep] = useState("code");
  const [pics, setPics] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const toPictures = (e) => {
    e.preventDefault();
    if (clean.length !== 6) return setError(T("codeLen", "The code has 6 letters and numbers."));
    setError(""); setStep("pics");
  };

  const tap = async (id) => {
    if (busy || pics.length >= 3) return;
    const next = [...pics, id];
    setPics(next);
    if (next.length < 3) return;
    setBusy(true); setError("");
    try {
      const r = await fetch(`${API}/api/auth/managed-login`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ loginCode: clean, picture: next }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.token) {
        localStorage.setItem("jwt_token", d.token);
        window.location.assign("/home");
        return;
      }
      setError(d.message || T("fail", "That didn't match. Try again!"));
      setPics([]);
    } catch {
      setError(T("offline", "We couldn't reach Learnigo. Check the internet and try again."));
      setPics([]);
    }
    setBusy(false);
  };

  return (
    <div className={s.backdrop} role="presentation" onClick={onClose}>
      <div className={s.box} role="dialog" aria-modal="true" aria-labelledby="ml-h" onClick={(e) => e.stopPropagation()}>
        <button type="button" className={s.close} onClick={onClose} aria-label={T("close", "Close")}>✕</button>
        {step === "code" ? (
          <form onSubmit={toPictures} className={s.stack}>
            <div className={s.icon} aria-hidden="true">🎟️</div>
            <h2 id="ml-h">{T("title", "Type the code on your card")}</h2>
            <label className={s.label} htmlFor="ml-code">{T("label", "My code")}</label>
            <input id="ml-code" ref={input} className={s.code} value={code} onChange={(e) => setCode(e.target.value)} maxLength={8}
              autoComplete="off" autoCapitalize="characters" spellCheck={false} inputMode="text" placeholder="ABC 234" />
            {error && <p className={s.error} role="alert">{error}</p>}
            <button type="submit" className={s.go}>{T("next", "Next")} →</button>
            <p className={s.help}>{T("help", "No card? Ask your grown-up or your teacher.")}</p>
          </form>
        ) : (
          <div className={s.stack}>
            <h2 id="ml-h">{T("picsTitle", "Tap your 3 pictures in order")}</h2>
            <div className={s.slots} aria-live="polite" aria-label={T("chosen", "Chosen: {{n}} of 3", { n: pics.length })}>
              {[0, 1, 2].map((i) => <span key={i} className={`${s.slot} ${pics[i] ? s.slotOn : ""}`}>{pics[i] ? EMOJI[pics[i]] : i + 1}</span>)}
            </div>
            <div className={s.grid}>
              {PICTURES.map(([id, e, name]) => (
                <button key={id} type="button" className={s.pic} onClick={() => tap(id)} disabled={busy} aria-label={T(`pic.${id}`, name)}>{e}</button>
              ))}
            </div>
            {error && <p className={s.error} role="alert">{error}</p>}
            <div className={s.row}>
              <button type="button" className={s.ghost} onClick={() => { setStep("code"); setPics([]); setError(""); }}>← {T("back", "Change code")}</button>
              {pics.length > 0 && !busy && <button type="button" className={s.ghost} onClick={() => setPics(pics.slice(0, -1))}>{T("undo", "Undo")}</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
