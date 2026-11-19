import { useState } from "react";
import { useTranslation } from "react-i18next";
import { signInWithGoogle } from "../firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import EntryShell, { GoogleButton, EntryError } from "../components/Entry/EntryShell";
import { SchoolEmblem } from "../components/Entry/RoleEmblems";
import { sfx, haptic } from "../utils/sounds";
import e from "../components/Entry/Entry.module.css";

// School sign in (the "admin" role: a school administrator, or school staff).
// Google only. The first sign-in makes the admin account; a new school then
// registers itself from the dashboard: free, and ready at once (no approval wait).
const AdminLogin = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { adminGoogleSignIn } = useAdminAuth();

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      await adminGoogleSignIn(await result.user.getIdToken());
      sfx.enter();
      haptic("success");
      navigate("/admin-dashboard");
    } catch (err) {
      const cancelled = ["auth/popup-closed-by-user", "auth/cancelled-popup-request"];
      if (cancelled.includes(err.code)) {
        setError(t("login.googleCancelled", "Google sign-in was cancelled."));
      } else if (err.code === "auth/popup-blocked") {
        setError(t("login.popupBlocked", "Pop-up was blocked. Please allow pop-ups for this site."));
      } else if (err.code === "auth/network-request-failed") {
        setError(t("login.networkError", "Network error. Please check your connection."));
      } else {
        setError(err.message || t("entry.errors.signInFailed", "We couldn't sign you in. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <EntryShell
      role="school"
      emblem={SchoolEmblem}
      title={t("entry.school.title", "School sign in")}
      badge={t("roleSelect.roles.schoolSub", "School admin")}
      subtitle={t("entry.school.subtitle", "Run your school on Learnigo: teachers, classes and progress.")}
      tip={t("entry.school.tip", "For school admins and staff. Teachers and students have their own sign-in.")}
      error={error}
      footer={(
        <p className={e.note}>
          <strong>{t("entry.school.newQ", "New school?")}</strong>{" "}
          {t("entry.school.new", "Sign in with Google, then register your school from your dashboard. It is ready straight away: invite your teachers by email.")}{" "}
          <span className={e.free}>{t("entry.freeStart", "Free to start")}</span>
        </p>
      )}
    >
      <GoogleButton main onClick={handleGoogle} disabled={loading}>
        {loading ? t("entry.signingIn", "Signing in…") : t("login.continueGoogle", "Continue with Google")}
      </GoogleButton>
      {error && <EntryError>{error}</EntryError>}
    </EntryShell>
  );
};

export default AdminLogin;
