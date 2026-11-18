// TCH-001 "I teach privately": a few details, Google sign-in, and a free Solo workspace.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaChalkboardTeacher, FaCheck } from "react-icons/fa";
import { signInWithGoogle } from "../../firebase/auth";
import { useAdminAuth } from "../../context/AdminAuthContext";
import RoboticBackground from "../../components/RoboticBackground/RoboticBackground";
import { apiCall } from "./teacherApi";
import loginStyles from "../Login.module.css";
import teacherLoginStyles from "../TeacherLogin.module.css";
import s from "./SoloSignup.module.css";

const SUBJECTS = ["English", "Maths", "Science"];
const GRADES = ["Ages 4-6", "Ages 7-9", "Ages 10-12", "Ages 13+"];

function Chips({ options, value, onChange, label }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <fieldset className={s.fieldset}>
      <legend className={s.legend}>{label}</legend>
      <div className={s.chips}>
        {options.map((o) => (
          <button key={o} type="button" aria-pressed={value.includes(o)} className={`${s.chip} ${value.includes(o) ? s.chipOn : ""}`} onClick={() => toggle(o)}>{o}</button>
        ))}
      </div>
    </fieldset>
  );
}

export default function SoloSignup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { teacherUseToken } = useAdminAuth();
  const [f, setF] = useState({ name: "", workspaceName: "", subjects: ["Maths"], other: "", grades: [], country: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const start = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const result = await signInWithGoogle();
      const idToken = await result.user.getIdToken();
      const subjects = [...f.subjects, ...f.other.split(",").map((x) => x.trim()).filter(Boolean)];
      const r = await apiCall("/teacher/auth/solo", { method: "POST", body: { idToken, name: f.name, workspaceName: f.workspaceName, subjects, grades: f.grades, country: f.country } });
      if (!r.ok) throw new Error(r.message || t("teacher.signup.failed", { defaultValue: "We could not create your workspace. Please try again." }));
      teacherUseToken(r.token, r.adminToken);
      navigate(r.created ? "/teacher-dashboard?view=today" : "/teacher-dashboard?view=today&welcomeBack=1");
    } catch (error) {
      const cancelled = ["auth/popup-closed-by-user", "auth/cancelled-popup-request"];
      setErr(cancelled.includes(error.code) ? t("teacher.signup.cancelled", { defaultValue: "Sign-in cancelled." }) : error.code === "auth/popup-blocked" ? t("teacher.signup.popup", { defaultValue: "The sign-in window was blocked. Please allow pop-ups for this site." }) : error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={loginStyles.page}>
      <RoboticBackground />
      <div className={loginStyles.content}>
        <form className={`${loginStyles.card} ${s.card}`} onSubmit={start}>
          <div style={{ fontSize: "3rem", color: "#22c55e", textAlign: "center" }} aria-hidden="true"><FaChalkboardTeacher /></div>
          <h1 className={`${loginStyles.title} ${teacherLoginStyles.title} ${s.title}`}>{t("teacher.signup.title", { defaultValue: "I teach privately" })}</h1>
          <p className={s.lead}>{t("teacher.signup.lead", { defaultValue: "Start your own free tutoring workspace. Set up a class in five minutes and see who needs help, on what." })}</p>
          <ul className={s.perks}>
            <li><FaCheck aria-hidden="true" /> {t("teacher.signup.perk1", { defaultValue: "Solo Free: 1 group and up to 15 students, free for ever" })}</li>
            <li><FaCheck aria-hidden="true" /> {t("teacher.signup.perk2", { defaultValue: "Students join with a code or QR, parents follow along" })}</li>
            <li><FaCheck aria-hidden="true" /> {t("teacher.signup.perk3", { defaultValue: "Already teach at a school on Learnigo? Same login, switch any time" })}</li>
          </ul>
          <div className={s.row2}>
            <label className={s.field}>{t("teacher.signup.name", { defaultValue: "Your name" })}
              <input className={s.input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={60} placeholder={t("teacher.signup.namePh", { defaultValue: "Ms Rao" })} autoComplete="name" />
            </label>
            <label className={s.field}>{t("teacher.signup.wsName", { defaultValue: "Workspace name" })}
              <input className={s.input} value={f.workspaceName} onChange={(e) => setF({ ...f, workspaceName: e.target.value })} maxLength={80} placeholder={t("teacher.signup.wsPh", { defaultValue: "Rao Maths Tutoring" })} />
            </label>
          </div>
          <Chips label={t("teacher.signup.subjects", { defaultValue: "Subjects you teach" })} options={SUBJECTS} value={f.subjects} onChange={(v) => setF({ ...f, subjects: v })} />
          <label className={s.field}>{t("teacher.signup.other", { defaultValue: "Other subjects (optional)" })}
            <input className={s.input} value={f.other} onChange={(e) => setF({ ...f, other: e.target.value })} placeholder={t("teacher.signup.otherPh", { defaultValue: "Phonics, French…" })} />
            <small>{t("teacher.commaSep", { defaultValue: "Separate with commas" })}</small>
          </label>
          <Chips label={t("teacher.signup.grades", { defaultValue: "Grades or ages" })} options={GRADES} value={f.grades} onChange={(v) => setF({ ...f, grades: v })} />
          <label className={s.field}>{t("teacher.signup.country", { defaultValue: "Country" })}
            <input className={s.input} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} maxLength={60} autoComplete="country-name" />
          </label>
          {err && <p className={s.error} role="alert">{err}</p>}
          <button type="submit" className={loginStyles.googleBtn} disabled={busy}>
            <FcGoogle className={loginStyles.googleIcon} />
            {busy ? t("teacher.signup.creating", { defaultValue: "Creating your workspace…" }) : t("teacher.signup.google", { defaultValue: "Continue with Google" })}
          </button>
          <p className={s.small}>{t("teacher.signup.terms", { defaultValue: "By continuing you agree to our" })} <Link to="/terms-and-conditions">{t("teacher.signup.termsLink", { defaultValue: "terms" })}</Link> {t("teacher.signup.and", { defaultValue: "and" })} <Link to="/policy">{t("teacher.signup.privacy", { defaultValue: "privacy policy" })}</Link>.</p>
          <p className={s.small}>{t("teacher.signup.haveAccount", { defaultValue: "Your school added you already?" })} <Link to="/teacher-login">{t("teacher.signup.signIn", { defaultValue: "Teacher sign-in" })}</Link></p>
        </form>
      </div>
    </div>
  );
}
