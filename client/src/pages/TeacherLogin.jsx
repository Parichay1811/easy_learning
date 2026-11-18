import { useState } from "react";
import * as FramerMotion from "framer-motion";
import { signInWithGoogle } from "../firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { FaChalkboardTeacher } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useAdminAuth } from "../context/AdminAuthContext";
import RoboticBackground from "../components/RoboticBackground/RoboticBackground";
import styles from "./Login.module.css";
import teacherStyles from "./TeacherLogin.module.css";
import { useTranslation } from "react-i18next";
import { WorkspaceChooser } from "./teacher/WorkspaceSwitcher";
import "../components/dashboard/tokens.css";

const TeacherLogin = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const [noAccount, setNoAccount] = useState(false);
  const [workspaces, setWorkspaces] = useState(null);
  const navigate = useNavigate();
  const { teacherGoogleSignIn } = useAdminAuth();

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      setNoAccount(false);
      const data = await teacherGoogleSignIn(await result.user.getIdToken());
      // Teaches in more than one place (TCH-003): ask where, once.
      if (data.needsChoice) setWorkspaces(data.workspaces);
      else navigate("/teacher-dashboard");
    } catch (err) {
      const cancelled = ["auth/popup-closed-by-user", "auth/cancelled-popup-request"];
      if (err.code === "NO_TEACHER_ACCOUNT") {
        setNoAccount(true);
        setError(err.message);
      } else if (cancelled.includes(err.code)) {
        setError("Sign-in cancelled.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Popup was blocked. Please allow popups for this site.");
      } else {
        setError(err.message || "Sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <FramerMotion.motion.div
      className={styles.page}
      initial={{ opacity: 0, x: -80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ duration: 0.4 }}
    >
      <RoboticBackground />
      <div className={styles.content}>
        <div className={`${styles.card} ${teacherStyles.card}`}>
          <div className={teacherStyles.iconWrap}>
            <FaChalkboardTeacher />
          </div>
          <h1 className={`${styles.title} ${teacherStyles.title}`}>Teacher Login</h1>
          <p className={styles.subtitle}>
            Sign in with the Google account your organization admin has on file to access your batches.
          </p>

          <button
            className={`${styles.googleBtn} ${teacherStyles.googleBtn}`}
            onClick={handleGoogle}
            disabled={loading}
            type="button"
          >
            <FcGoogle className={styles.googleIcon} />
            {loading ? "Signing in…" : "Continue with Google"}
          </button>

          {workspaces && (
            <div className="dash" style={{ width: "100%", textAlign: "left", background: "transparent" }}>
              <p className={styles.subtitle}>{t("teacher.ws.chooseLong", { defaultValue: "Where are you teaching now? You can switch any time from the top of your dashboard." })}</p>
              <WorkspaceChooser workspaces={workspaces} onChosen={() => navigate("/teacher-dashboard")} />
            </div>
          )}

          {error && <p className={styles.error} role="alert">{error}</p>}
          {noAccount && (
            <Link to="/teach" className={`${styles.googleBtn} ${teacherStyles.googleBtn}`} style={{ textDecoration: "none", justifyContent: "center" }}>
              {t("teacher.login.startSolo", { defaultValue: "Start my free tutoring workspace" })}
            </Link>
          )}

          <p className={styles.subtitle} style={{ marginTop: 4 }}>
            {t("teacher.login.teachPrivately", { defaultValue: "Teach privately?" })} <Link to="/teach" style={{ color: "#86efac", fontWeight: 700 }}>{t("teacher.login.startOwn", { defaultValue: "Start your own free workspace" })}</Link>
          </p>

          <button
            className={teacherStyles.backBtn}
            onClick={() => navigate("/")}
            type="button"
          >
            Back to Role Selection
          </button>
        </div>
      </div>
    </FramerMotion.motion.div>
  );
};

export default TeacherLogin;
