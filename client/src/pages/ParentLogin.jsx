import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { signInWithGoogle } from "../firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import EntryShell, { GoogleButton, EntryError } from "../components/Entry/EntryShell";
import { ParentEmblem } from "../components/Entry/RoleEmblems";
import { sfx, haptic } from "../utils/sounds";
import e from "../components/Entry/Entry.module.css";

// Parent sign in: Google only. The first sign-in makes the (free) parent
// account; children are added from the dashboard afterwards.
const ParentLogin = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { parentGoogleSignIn } = useAdminAuth();
  // A co-guardian invite link (/parent-login?invite=…) is kept until sign-in; the dashboard accepts it.
  useEffect(() => {
    try {
      const invite = new URLSearchParams(window.location.search).get("invite");
      if (invite) sessionStorage.setItem("parent_invite", invite);
    } catch { /* private mode */ }
  }, []);

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      await parentGoogleSignIn(await result.user.getIdToken());
      sfx.enter();
      haptic("success");
      navigate("/parent-dashboard");
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
      role="parent"
      emblem={ParentEmblem}
      title={t("entry.parent.title", "Parent sign in")}
      subtitle={t("entry.parent.subtitle", "Follow your child's learning, all in one place.")}
      tip={t("entry.parent.tip", "After signing in, add your child: make them a picture sign-in, or link the account they already use.")}
      error={error}
      footer={(
        <p className={e.note}>
          <strong>{t("entry.newHere", "New here?")}</strong>{" "}
          {t("entry.parent.new", "Just continue with Google: your parent account is made the first time.")}{" "}
          <span className={e.free}>{t("entry.freeFamilies", "Free for families")}</span>
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

export default ParentLogin;
