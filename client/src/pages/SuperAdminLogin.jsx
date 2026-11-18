// Console sign-in (SUP-001): password, then a code from an authenticator app.
// First sign-in: choose a new password, add Learnigo to the app (key shown),
// confirm with a code and save the recovery codes.
import { useState } from "react";
import * as FramerMotion from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaCrown, FaEnvelope, FaLock, FaKey } from "react-icons/fa";
import { useAdminAuth } from "../context/AdminAuthContext";
import RoboticBackground from "../components/RoboticBackground/RoboticBackground";
import styles from "./Login.module.css";
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

  const guard = async (fn) => {
    setError(""); setLoading(true);
    try { await fn(); } catch (err) {
      setError(err.message || t("saLogin.failed", "Sign-in failed."));
      if (err.code === "CHALLENGE_EXPIRED") { setStep("password"); setCode(""); }
    } finally { setLoading(false); }
  };

  const submitPassword = (e) => {
    e.preventDefault();
    guard(async () => {
      const d = await superAdminLogin(email, password);
      if (d.step === "totp") { setChallenge(d.challengeToken); setStep("totp"); return; }
      if (d.step === "setup") {
        setChallenge(d.setupToken); setMustChange(!!d.mustChangePassword);
        setSetup(await post("/2fa/setup", { setupToken: d.setupToken }));
        setStep("setup"); return;
      }
      navigate("/superadmin-dashboard");
    });
  };

  const submitCode = (e) => {
    e.preventDefault();
    guard(async () => {
      const d = await post("/2fa/verify", useRecovery ? { challengeToken: challenge, recoveryCode: code } : { challengeToken: challenge, code });
      superAdminCompleteLogin(d);
      navigate("/superadmin-dashboard");
    });
  };

  const submitSetup = (e) => {
    e.preventDefault();
    guard(async () => {
      const d = await post("/2fa/enable", { setupToken: challenge, code, ...(mustChange ? { newPassword } : {}) });
      setCodes({ list: d.recoveryCodes, data: d });
      setStep("codes");
    });
  };

  const title = { password: t("saLogin.title", "Learnigo console"), totp: t("saLogin.codeTitle", "Enter your code"), setup: t("saLogin.setupTitle", "Set up two-factor sign-in"), codes: t("saLogin.codesTitle", "Save your recovery codes") }[step];

  return (
    <FramerMotion.motion.div className={styles.page} initial={{ opacity: 0, x: -80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 80 }} transition={{ duration: 0.4 }}>
      <RoboticBackground />
      <div className={styles.content}>
        <div className={`${styles.card} ${saStyles.card}`}>
          <div className={saStyles.iconWrap}><FaCrown aria-hidden="true" /></div>
          <h1 className={`${styles.title} ${saStyles.title}`}>{title}</h1>

          {step === "password" && (
            <>
              <p className={styles.subtitle}>{t("saLogin.subtitle", "Learnigo staff only. Every action is recorded under your name.")}</p>
              <form onSubmit={submitPassword} className={`${styles.form} ${saStyles.form}`}>
                <div className={styles.inputGroup}>
                  <FaEnvelope className={styles.inputIcon} aria-hidden="true" />
                  <input type="email" autoComplete="username" aria-label={t("saLogin.email", "Email")} placeholder={t("saLogin.email", "Email")} value={email} onChange={(e) => setEmail(e.target.value)} className={`${styles.input} ${saStyles.input}`} required />
                </div>
                <div className={styles.inputGroup}>
                  <FaLock className={styles.inputIcon} aria-hidden="true" />
                  <input type="password" autoComplete="current-password" aria-label={t("saLogin.password", "Password")} placeholder={t("saLogin.password", "Password")} value={password} onChange={(e) => setPassword(e.target.value)} className={`${styles.input} ${saStyles.input}`} required />
                </div>
                {error && <p className={styles.error} role="alert">{error}</p>}
                <button type="submit" className={saStyles.submitBtn} disabled={loading}>{loading ? t("saLogin.signingIn", "Signing in…") : t("saLogin.next", "Continue")}</button>
              </form>
            </>
          )}

          {step === "totp" && (
            <form onSubmit={submitCode} className={`${styles.form} ${saStyles.form}`}>
              <p className={styles.subtitle}>{useRecovery ? t("saLogin.recoveryHelp", "Type one of your recovery codes. Each works once.") : t("saLogin.codeHelp", "Open your authenticator app and type the 6-digit code for Learnigo.")}</p>
              <div className={styles.inputGroup}>
                <FaKey className={styles.inputIcon} aria-hidden="true" />
                <input autoFocus inputMode={useRecovery ? "text" : "numeric"} autoComplete="one-time-code" aria-label={useRecovery ? t("saLogin.recovery", "Recovery code") : t("saLogin.code", "6-digit code")} placeholder={useRecovery ? "abcde-fghij" : "123456"} value={code} onChange={(e) => setCode(e.target.value)} className={`${styles.input} ${saStyles.input}`} required />
              </div>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <button type="submit" className={saStyles.submitBtn} disabled={loading}>{loading ? t("saLogin.checking", "Checking…") : t("saLogin.signIn", "Sign in")}</button>
              <button type="button" className={saStyles.backBtn} onClick={() => { setUseRecovery(!useRecovery); setCode(""); setError(""); }}>{useRecovery ? t("saLogin.useApp", "Use a code from the app") : t("saLogin.lostPhone", "Lost your phone? Use a recovery code")}</button>
            </form>
          )}

          {step === "setup" && setup && (
            <form onSubmit={submitSetup} className={`${styles.form} ${saStyles.form}`}>
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
                <div className={styles.inputGroup}>
                  <FaLock className={styles.inputIcon} aria-hidden="true" />
                  <input type="password" autoComplete="new-password" aria-label={t("saLogin.newPassword", "New password (12+ characters)")} placeholder={t("saLogin.newPassword", "New password (12+ characters)")} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`${styles.input} ${saStyles.input}`} minLength={12} required />
                </div>
              )}
              <div className={styles.inputGroup}>
                <FaKey className={styles.inputIcon} aria-hidden="true" />
                <input inputMode="numeric" autoComplete="one-time-code" aria-label={t("saLogin.code", "6-digit code")} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} className={`${styles.input} ${saStyles.input}`} required />
              </div>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <button type="submit" className={saStyles.submitBtn} disabled={loading}>{loading ? t("saLogin.checking", "Checking…") : t("saLogin.turnOn", "Turn on and sign in")}</button>
            </form>
          )}

          {step === "codes" && codes && (
            <div className={`${styles.form} ${saStyles.form}`}>
              <p className={styles.subtitle}>{t("saLogin.codesHelp", "If you lose your phone, each of these codes signs you in once. Store them somewhere safe now: they are not shown again.")}</p>
              <pre className={saStyles.codes}>{codes.list.join("\n")}</pre>
              <button type="button" className={saStyles.backBtn} onClick={() => navigator.clipboard?.writeText(codes.list.join("\n"))}>{t("saLogin.copy", "Copy codes")}</button>
              <button type="button" className={saStyles.submitBtn} onClick={() => { superAdminCompleteLogin(codes.data); navigate("/superadmin-dashboard"); }}>{t("saLogin.saved", "I saved them, continue")}</button>
            </div>
          )}

          {step === "password" && <button className={saStyles.backBtn} onClick={() => navigate("/")} type="button">{t("saLogin.back", "Back to Role Selection")}</button>}
          {step !== "password" && step !== "codes" && <button className={saStyles.backBtn} onClick={() => { setStep("password"); setCode(""); setError(""); }} type="button">{t("saLogin.restart", "Start again")}</button>}
        </div>
      </div>
    </FramerMotion.motion.div>
  );
};

export default SuperAdminLogin;
