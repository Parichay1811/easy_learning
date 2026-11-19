import { useState } from "react";
import { signInWithGoogle } from "../firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useTranslation } from "react-i18next";
import { FaEnvelopeOpenText } from "react-icons/fa";
import { WorkspaceChooser } from "./teacher/WorkspaceSwitcher";
import EntryShell, { GoogleButton, EntryError } from "../components/Entry/EntryShell";
import { TeacherEmblem } from "../components/Entry/RoleEmblems";
import { sfx, haptic } from "../utils/sounds";
import e from "../components/Entry/Entry.module.css";
import "../components/dashboard/tokens.css";

// Teacher sign in: Google, with the account the school added. Someone who
// teaches in more than one place picks where, once; someone a school has
// invited (but not added yet) is sent to the invitation (/teach?invite=1);
// anyone else without a teacher account is offered a free private workspace.

// The server counts open school invitations with NO_TEACHER_ACCOUNT
// (`pendingInvites`). Read it from the error when the auth context passes it
// on; until then its message says so ("A school invited you…").
const hasInvites = (err) => Number(err?.pendingInvites ?? err?.data?.pendingInvites ?? 0) > 0
  || (err?.pendingInvites === undefined && /invited you/i.test(err?.message || ""));
const TeacherLogin = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const [noAccount, setNoAccount] = useState(false);
  const [invited, setInvited] = useState(false);
  const [workspaces, setWorkspaces] = useState(null);
  const navigate = useNavigate();
  const { teacherGoogleSignIn } = useAdminAuth();

  const enter = () => {
    sfx.enter();
    haptic("success");
    navigate("/teacher-dashboard");
  };

  const fail = (err) => {
    const cancelled = ["auth/popup-closed-by-user", "auth/cancelled-popup-request"];
    if (err.code === "NO_TEACHER_ACCOUNT" && hasInvites(err)) {
      // Good news, not a problem: a school is waiting for them.
      sfx.notify();
      haptic("success");
      setInvited(true);
    } else if (err.code === "NO_TEACHER_ACCOUNT") {
      setNoAccount(true);
      setError(t("entry.teacher.noAccount", "We couldn't find a teacher account for this Google account. Ask your school to add you with this email, or start your own free workspace below."));
    } else if (cancelled.includes(err.code)) {
      setError(t("login.googleCancelled", "Google sign-in was cancelled."));
    } else if (err.code === "auth/popup-blocked") {
      setError(t("login.popupBlocked", "Pop-up was blocked. Please allow pop-ups for this site."));
    } else if (err.code === "auth/network-request-failed") {
      setError(t("login.networkError", "Network error. Please check your connection."));
    } else {
      setError(err.message || t("entry.errors.signInFailed", "We couldn't sign you in. Please try again."));
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      setNoAccount(false);
      setInvited(false);
      const data = await teacherGoogleSignIn(await result.user.getIdToken());
      // Teaches in more than one place (TCH-003): ask where, once.
      if (data.needsChoice) {
        sfx.open();
        setWorkspaces(data.workspaces);
      } else enter();
    } catch (err) {
      fail(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <EntryShell
      role="teacher"
      emblem={TeacherEmblem}
      title={workspaces ? t("teacher.ws.choose", { defaultValue: "Where are you teaching now?" }) : t("entry.teacher.title", "Teacher sign in")}
      subtitle={workspaces
        ? t("teacher.ws.chooseLong", { defaultValue: "Where are you teaching now? You can switch any time from the top of your dashboard." })
        : t("entry.teacher.subtitle", "See your classes and who needs help today.")}
      tip={t("entry.teacher.tip", "Use the Google account your school added you with. Schools add teachers from their dashboard.")}
      error={error}
      footer={(
        <>
          <p className={e.note}>
            <strong>{t("teacher.login.teachPrivately", { defaultValue: "Teach privately?" })}</strong>{" "}
            {t("entry.teacher.soloNote", "Tutors can start on their own.")}{" "}
            <span className={e.free}>{t("entry.free", "Free")}</span>
          </p>
          <Link to="/teach" className={e.soft} data-sound="forward">
            {t("teacher.login.startOwn", { defaultValue: "Start your own free workspace" })}
          </Link>
        </>
      )}
    >
      {workspaces ? (
        <div className="dash" data-theme="light" style={{ background: "transparent" }}>
          <WorkspaceChooser workspaces={workspaces} onChosen={enter} />
        </div>
      ) : (
        <GoogleButton main onClick={handleGoogle} disabled={loading}>
          {loading ? t("entry.signingIn", "Signing in…") : t("login.continueGoogle", "Continue with Google")}
        </GoogleButton>
      )}

      {invited && (
        <>
          <p className={e.info} role="status">
            <FaEnvelopeOpenText className={e.infoIcon} aria-hidden="true" />
            <span>{t("entry.teacher.invited", "Good news: a school has invited you to teach on Learnigo. Open your invitation to accept it.")}</span>
          </p>
          <Link to="/teach?invite=1" className={e.primary} style={{ display: "grid", placeItems: "center", textDecoration: "none", textAlign: "center" }} data-sound="forward">
            {t("entry.teacher.openInvite", "Open my invitation")}
          </Link>
        </>
      )}
      {error && <EntryError>{error}</EntryError>}
      {noAccount && (
        <Link to="/teach" className={e.primary} style={{ display: "grid", placeItems: "center", textDecoration: "none", textAlign: "center" }} data-sound="forward">
          {t("teacher.login.startSolo", { defaultValue: "Start my free tutoring workspace" })}
        </Link>
      )}
    </EntryShell>
  );
};

export default TeacherLogin;
