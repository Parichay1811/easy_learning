// Console sign-in (SUP-001): password, then a code from an authenticator app.
// First sign-in: choose a new password, add Learnigo to the app (key shown),
// confirm with a code and save the recovery codes.
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaEnvelope, FaLock, FaKey } from "react-icons/fa";
import { useAdminAuth } from "../context/AdminAuthContext";
import EntryShell, { EntryError } from "../components/Entry/EntryShell";
import { TeamEmblem } from "../components/Entry/RoleEmblems";
import { sfx, haptic } from "../utils/sounds";
import e from "../components/Entry/Entry.module.css";
import saStyles from "./SuperAdminLogin.module.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const post = async (path, body) => {
  const r = await fetch(`${API}/api/superadmin/auth${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.success) throw Object.assign(new Error(d.message || "Something went wrong."), { code: d.code });
  return d;
};

const SuperAdminLogin = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState("password"); // password | totp | setup | codes
  const [challenge, setChallenge] = useState(null);
  const [setup, setSetup] = useState(null);
  const [mustChange, setMustChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [codes, setCodes] = useState(null);
  const [error, setError] = useState(params.get("expired") ? t("saLogin.expired", "Your session ended. Please sign in again.") : "");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { superAdminLogin, superAdminCompleteLogin } = useAdminAuth();

  const enter = () => {
    sfx.enter();
    haptic("success");
    navigate("/superadmin-dashboard");
  };

  const guard = async (fn) => {
    setError(""); setLoading(true);
    try { await fn(); } catch (err) {
      setError(err.message || t("saLogin.failed", "Sign-in failed."));
      if (err.code === "CHALLENGE_EXPIRED") { setStep("password"); setCode(""); }
    } finally { setLoading(false); }
  };

  const submitPassword = (ev) => {
    ev.preventDefault();
    guard(async () => {
      const d = await superAdminLogin(email, password);
      if (d.step === "totp") { setChallenge(d.challengeToken); setStep("totp"); return; }
      if (d.step === "setup") {
        setChallenge(d.setupToken); setMustChange(!!d.mustChangePassword);
        setSetup(await post("/2fa/setup", { setupToken: d.setupToken }));
        setStep("setup"); return;
      }
      enter();
    });
  };

  const submitCode = (ev) => {
    ev.preventDefault();
    guard(async () => {
      const d = await post("/2fa/verify", useRecovery ? { challengeToken: challenge, recoveryCode: code } : { challengeToken: challenge, code });
      superAdminCompleteLogin(d);
      enter();
    });
  };

  const submitSetup = (ev) => {
    ev.preventDefault();
    guard(async () => {
      const d = await post("/2fa/enable", { setupToken: challenge, code, ...(mustChange ? { newPassword } : {}) });
      setCodes({ list: d.recoveryCodes, data: d });
      setStep("codes");
    });
  };

  const restart = () => { setStep("password"); setCode(""); setError(""); };

  const title = { password: t("entry.team.title", "Staff sign in"), totp: t("saLogin.codeTitle", "Enter your code"), setup: t("saLogin.setupTitle", "Set up two-factor sign-in"), codes: t("saLogin.codesTitle", "Save your recovery codes") }[step];
  const subtitle = {
    password: t("saLogin.subtitle", "Learnigo staff only. Every action is recorded under your name."),
    totp: useRecovery ? t("saLogin.recoveryHelp", "Type one of your recovery codes. Each works once.") : t("saLogin.codeHelp", "Open your authenticator app and type the 6-digit code for Learnigo."),
    setup: null,
    codes: t("saLogin.codesHelp", "If you lose your phone, each of these codes signs you in once. Store them somewhere safe now: they are not shown again."),
  }[step];

  return (
    <EntryShell
      role="team"
      emblem={TeamEmblem}
      title={title}
      badge={step === "password" ? t("roleSelect.roles.teamSub", "Super admin") : null}
      subtitle={subtitle}
      tip={t("entry.team.tip", "Two steps: your password, then a 6-digit code from your authenticator app.")}
      error={error}
    >
      {step === "password" && (
        <form onSubmit={submitPassword} className={e.form}>
          <div className={e.field}>
            <FaEnvelope className={e.fieldIcon} aria-hidden="true" />
            <input type="email" autoComplete="username" aria-label={t("saLogin.email", "Email")} placeholder={t("saLogin.email", "Email")} value={email} onChange={(ev) => setEmail(ev.target.value)} className={e.input} required />
          </div>
          <div className={e.field}>
            <FaLock className={e.fieldIcon} aria-hidden="true" />
            <input type="password" autoComplete="current-password" aria-label={t("saLogin.password", "Password")} placeholder={t("saLogin.password", "Password")} value={password} onChange={(ev) => setPassword(ev.target.value)} className={e.input} required />
          </div>
          {error && <EntryError>{error}</EntryError>}
          <button type="submit" className={e.primary} disabled={loading}>{loading ? t("saLogin.signingIn", "Signing in…") : t("saLogin.next", "Continue")}</button>
        </form>
      )}

      {step === "totp" && (
        <form onSubmit={submitCode} className={e.form}>
          <div className={e.field}>
            <FaKey className={e.fieldIcon} aria-hidden="true" />
            <input autoFocus inputMode={useRecovery ? "text" : "numeric"} autoComplete="one-time-code" aria-label={useRecovery ? t("saLogin.recovery", "Recovery code") : t("saLogin.code", "6-digit code")} placeholder={useRecovery ? "abcde-fghij" : "123456"} value={code} onChange={(ev) => setCode(ev.target.value)} className={e.input} required />
          </div>
          {error && <EntryError>{error}</EntryError>}
          <button type="submit" className={e.primary} disabled={loading}>{loading ? t("saLogin.checking", "Checking…") : t("saLogin.signIn", "Sign in")}</button>
          <div className={saStyles.row}>
            <button type="button" className={e.link} data-sound="toggle" onClick={() => { setUseRecovery(!useRecovery); setCode(""); setError(""); }}>{useRecovery ? t("saLogin.useApp", "Use a code from the app") : t("saLogin.lostPhone", "Lost your phone? Use a recovery code")}</button>
            <button type="button" className={e.link} data-sound="back" onClick={restart}>{t("saLogin.restart", "Start again")}</button>
          </div>
        </form>
      )}

      {step === "setup" && setup && (
        <form onSubmit={submitSetup} className={e.form}>
          <ol className={saStyles.steps}>
            <li>{t("saLogin.s1", "Open an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…) and add an account.")}</li>
            <li>
              {t("saLogin.s2", "Choose \"enter a setup key\" and type this key (time-based):")}
              <code className={saStyles.secret} aria-label={t("saLogin.key", "Setup key")}>{setup.secret.replace(/(.{4})/g, "$1 ").trim()}</code>
              <a className={saStyles.otpLink} href={setup.otpauthUri}>{t("saLogin.openApp", "On this phone? Open in your authenticator app")}</a>
            </li>
            <li>{t("saLogin.s3", "Type the 6-digit code the app shows.")}</li>
          </ol>
          {mustChange && (
            <div className={e.field}>
              <FaLock className={e.fieldIcon} aria-hidden="true" />
              <input type="password" autoComplete="new-password" aria-label={t("saLogin.newPassword", "New password (12+ characters)")} placeholder={t("saLogin.newPassword", "New password (12+ characters)")} value={newPassword} onChange={(ev) => setNewPassword(ev.target.value)} className={e.input} minLength={12} required />
            </div>
          )}
          <div className={e.field}>
            <FaKey className={e.fieldIcon} aria-hidden="true" />
            <input inputMode="numeric" autoComplete="one-time-code" aria-label={t("saLogin.code", "6-digit code")} placeholder="123456" value={code} onChange={(ev) => setCode(ev.target.value)} className={e.input} required />
          </div>
          {error && <EntryError>{error}</EntryError>}
          <button type="submit" className={e.primary} disabled={loading}>{loading ? t("saLogin.checking", "Checking…") : t("saLogin.turnOn", "Turn on and sign in")}</button>
          <div className={saStyles.row}>
            <button type="button" className={e.link} data-sound="back" onClick={restart}>{t("saLogin.restart", "Start again")}</button>
          </div>
        </form>
      )}

      {step === "codes" && codes && (
        <div className={e.form}>
          <pre className={saStyles.codes}>{codes.list.join("\n")}</pre>
          <button type="button" className={e.ghost} onClick={() => navigator.clipboard?.writeText(codes.list.join("\n"))}>{t("saLogin.copy", "Copy codes")}</button>
          <button type="button" className={e.primary} data-sound="none" onClick={() => { superAdminCompleteLogin(codes.data); enter(); }}>{t("saLogin.saved", "I saved them, continue")}</button>
        </div>
      )}
    </EntryShell>
  );
};

export default SuperAdminLogin;
