import { useState } from "react";
import ManagedLogin from "../components/family/ManagedLogin";
import { useTranslation } from "react-i18next";
import { signInWithGoogle } from "../firebase/auth";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaUser, FaKey } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import EntryShell, { GoogleButton, EntryError, EntryDivider } from "../components/Entry/EntryShell";
import { StudentEmblem } from "../components/Entry/RoleEmblems";
import { sfx, haptic } from "../utils/sounds";
import e from "../components/Entry/Entry.module.css";

const OFFLINE = /failed to fetch|networkerror|load failed|network request failed/i;

// Student sign in (and "create an account"): Google, or email + password, or
// a class code with picture password for young learners (ManagedLogin).
const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [classCode, setClassCode] = useState(false); // young learners: code + picture password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginManual, registerManual } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) {
        await registerManual(name, email, password);
      } else {
        await loginManual(email, password);
      }
      sfx.enter();
      haptic("success");
      navigate("/home");
    } catch (err) {
      const msg = err?.message || "";
      setError(OFFLINE.test(msg) ? t("login.networkError") : msg || t("login.errorDefault"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      sfx.enter();
      haptic("success");
      navigate("/home");
    } catch (err) {
      const cancelled = [
        "auth/popup-closed-by-user",
        "auth/cancelled-popup-request",
      ];
      if (cancelled.includes(err.code)) {
        setError(t("login.googleCancelled"));
      } else if (err.code === "auth/popup-blocked") {
        setError(t("login.popupBlocked"));
      } else if (err.code === "auth/network-request-failed") {
        setError(t("login.networkError"));
      } else if (err.code === "auth/operation-not-allowed") {
        setError(t("login.operationNotAllowed"));
      } else if (err.code === "auth/not-configured") {
        setError(t("entry.errors.googleOffStudent", "Google sign-in isn't available right now. You can use your email and password instead."));
      } else {
        setError(t("login.errorDefault"));
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignup((prev) => !prev);
    setError("");
  };

  const footer = (
    <>
      <div className={e.footRow}>
        <span>{isSignup ? t("login.alreadyAccount") : t("entry.newHere", "New here?")}</span>
        <button className={e.link} onClick={switchMode} type="button" data-sound="tab">
          {isSignup ? t("login.signInBtn") : t("entry.student.create", "Create an account")}
        </button>
      </div>
      <button className={e.soft} onClick={() => { sfx.open(); setClassCode(true); }} type="button" data-sound="none">
        <FaKey aria-hidden="true" />
        {t("login.classCode", { defaultValue: "I have a class code" })}
      </button>
    </>
  );

  return (
    <>
      <EntryShell
        role="student"
        emblem={StudentEmblem}
        title={isSignup ? t("entry.student.signupTitle", "Create your student account") : t("entry.student.title", "Student sign in")}
        subtitle={isSignup ? t("login.createAccountSubtitle") : t("login.continueJourneySubtitle")}
        tip={isSignup
          ? t("entry.student.signupTip", "Ask a grown-up to help you make your account. It's free!")
          : t("entry.student.tip", "Got a class code from your teacher or a grown-up? Tap “I have a class code”.")}
        footer={footer}
        error={error}
      >
        <GoogleButton onClick={handleGoogle} disabled={loading}>
          {t("login.continueGoogle")}
        </GoogleButton>

        <EntryDivider>{t("entry.orEmail", "or use your email")}</EntryDivider>

        <form onSubmit={handleSubmit} className={e.form}>
          {isSignup && (
            <div className={e.field}>
              <FaUser className={e.fieldIcon} aria-hidden="true" />
              <input
                type="text"
                placeholder={t("login.namePlaceholder")}
                aria-label={t("login.namePlaceholder")}
                autoComplete="name"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                className={e.input}
                required
              />
            </div>
          )}

          <div className={e.field}>
            <FaEnvelope className={e.fieldIcon} aria-hidden="true" />
            <input
              type="email"
              placeholder={t("login.emailPlaceholder")}
              aria-label={t("login.emailPlaceholder")}
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className={e.input}
              required
            />
          </div>

          <div className={e.field}>
            <FaLock className={e.fieldIcon} aria-hidden="true" />
            <input
              type="password"
              placeholder={t("login.passwordPlaceholder")}
              aria-label={t("login.passwordPlaceholder")}
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className={e.input}
              required
            />
          </div>

          {error && <EntryError>{error}</EntryError>}

          <button type="submit" className={e.primary} disabled={loading} data-sound="none">
            {loading
              ? t("login.loading")
              : isSignup
              ? t("login.createAccountBtn")
              : t("login.signInBtn")}
          </button>
        </form>
      </EntryShell>
      {classCode && <ManagedLogin onClose={() => setClassCode(false)} />}
    </>
  );
};

export default Login;
