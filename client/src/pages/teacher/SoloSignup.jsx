// TCH-001 "I teach privately": a few details, Google sign-in, and a free Solo workspace.
// Drawn in the entry pages' frame (components/Entry/EntryShell): the meadow, the
// tutor's picture from the "/" card, the puppy, one card.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaCheck, FaEnvelopeOpenText } from "react-icons/fa";
import { signInWithGoogle } from "../../firebase/auth";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { apiCall } from "./teacherApi";
import TeacherHub from "../../components/links/TeacherHub";
import EntryShell, { GoogleButton, EntryError } from "../../components/Entry/EntryShell";
import e from "../../components/Entry/Entry.module.css";
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
          <button key={o} type="button" aria-pressed={value.includes(o)} className={`${s.chip} ${value.includes(o) ? s.chipOn : ""}`} onClick={() => toggle(o)}>
            {value.includes(o) && <FaCheck className={s.chipTick} aria-hidden="true" />}
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

// TCH-001 and connect-by-email: /teach is the teacher's front door. Start a free workspace,
// or (/teach?invite=1) see the schools that invited you and ask your school to add you.
export default function SoloSignup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const invites = params.get("invite") === "1";
  const setInvites = (on) => setParams((p) => { const n = new URLSearchParams(p); if (on) n.set("invite", "1"); else n.delete("invite"); return n; });
  const { teacherUseToken } = useAdminAuth();
  const [f, setF] = useState({ name: "", workspaceName: "", subjects: ["Maths"], other: "", grades: [], country: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const start = async (ev) => {
    ev.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const result = await signInWithGoogle();
      const idToken = await result.user.getIdToken();
      const subjects = [...f.subjects, ...f.other.split(/[,、，;；]/).map((x) => x.trim()).filter(Boolean)];
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

  const welcome = t("entry.tutor.welcome", "Welcome, tutors");

  if (invites) {
    return (
      <EntryShell
        role="tutor"
        long
        welcome={welcome}
        title={t("teacher.hub.title", { defaultValue: "Your invitations" })}
        subtitle={t("teacher.hub.lead", { defaultValue: "Schools that invited you, students who asked to join your class, and a quick way to ask your school to add you. Free, no approval needed." })}
        tip={t("entry.tutor.inviteTip", "Invited by a school? Sign in with the Google account they invited, then accept in one tap.")}
        footer={(
          <button type="button" className={e.link} data-sound="back" onClick={() => setInvites(false)}>
            {t("teacher.hub.back", { defaultValue: "Back to “I teach privately”" })}
          </button>
        )}
      >
        <div className={s.hubPanel}><TeacherHub onStartOwn={() => setInvites(false)} /></div>
      </EntryShell>
    );
  }

  return (
    <EntryShell
      role="tutor"
      long
      welcome={welcome}
      title={t("teacher.signup.title", { defaultValue: "I teach privately" })}
      subtitle={t("teacher.signup.lead", { defaultValue: "Start your own free tutoring workspace. Set up a class in five minutes and see who needs help, on what." })}
      tip={t("entry.tutor.tip", "A few details, then continue with Google. Your free workspace is ready straight away.")}
      error={err}
      footer={(
        <>
          <p className={e.note}>
            {t("teacher.signup.haveAccount", { defaultValue: "Your school added you already?" })}{" "}
            <Link to="/teacher-login" className={e.link} data-sound="forward">{t("teacher.signup.signIn", { defaultValue: "Teacher sign-in" })}</Link>
          </p>
          <p className={`${e.note} ${s.small}`}>
            {t("teacher.signup.terms", { defaultValue: "By continuing you agree to our" })} <Link to="/terms-and-conditions" className={s.inline}>{t("teacher.signup.termsLink", { defaultValue: "terms" })}</Link> {t("teacher.signup.and", { defaultValue: "and" })} <Link to="/policy" className={s.inline}>{t("teacher.signup.privacy", { defaultValue: "privacy policy" })}</Link>.
          </p>
        </>
      )}
    >
      <button type="button" className={s.inviteBanner} data-sound="open" onClick={() => setInvites(true)}>
        <FaEnvelopeOpenText className={s.inviteIcon} aria-hidden="true" />
        <span>
          <strong>{t("teacher.hub.bannerT", { defaultValue: "Invited by a school, or want to join yours?" })}</strong>
          <small>{t("teacher.hub.bannerD", { defaultValue: "See your invitations and accept in one tap" })}</small>
        </span>
        <span className={s.chev} aria-hidden="true">›</span>
      </button>

      <ul className={s.perks}>
        <li><FaCheck aria-hidden="true" /> {t("teacher.signup.perk1", { defaultValue: "Solo Free: 1 group and up to 15 students, free for ever" })}</li>
        <li><FaCheck aria-hidden="true" /> {t("teacher.signup.perk2", { defaultValue: "Students join with a code or QR, parents follow along" })}</li>
        <li><FaCheck aria-hidden="true" /> {t("teacher.signup.perk3", { defaultValue: "Already teach at a school on Learnigo? Same login, switch any time" })}</li>
      </ul>

      <form className={s.form} onSubmit={start}>
        <div className={s.row2}>
          <label className={s.field}>{t("teacher.signup.name", { defaultValue: "Your name" })}
            <input className={e.input + " " + s.input} value={f.name} onChange={(ev) => setF({ ...f, name: ev.target.value })} maxLength={60} placeholder={t("teacher.signup.namePh", { defaultValue: "Ms Rao" })} autoComplete="name" />
          </label>
          <label className={s.field}>{t("teacher.signup.wsName", { defaultValue: "Workspace name" })}
            <input className={e.input + " " + s.input} value={f.workspaceName} onChange={(ev) => setF({ ...f, workspaceName: ev.target.value })} maxLength={80} placeholder={t("teacher.signup.wsPh", { defaultValue: "Rao Maths Tutoring" })} />
          </label>
        </div>
        <Chips label={t("teacher.signup.subjects", { defaultValue: "Subjects you teach" })} options={SUBJECTS} value={f.subjects} onChange={(v) => setF({ ...f, subjects: v })} />
        <label className={s.field}>{t("teacher.signup.other", { defaultValue: "Other subjects (optional)" })}
          <input className={e.input + " " + s.input} value={f.other} onChange={(ev) => setF({ ...f, other: ev.target.value })} placeholder={t("teacher.signup.otherPh", { defaultValue: "Phonics, French…" })} />
          <small>{t("teacher.commaSep", { defaultValue: "Separate with commas" })}</small>
        </label>
        <Chips label={t("teacher.signup.grades", { defaultValue: "Grades or ages" })} options={GRADES} value={f.grades} onChange={(v) => setF({ ...f, grades: v })} />
        <label className={s.field}>{t("teacher.signup.country", { defaultValue: "Country" })}
          <input className={e.input + " " + s.input} value={f.country} onChange={(ev) => setF({ ...f, country: ev.target.value })} maxLength={60} autoComplete="country-name" />
        </label>
        {err && <EntryError>{err}</EntryError>}
        <GoogleButton main type="submit" disabled={busy}>
          {busy ? t("teacher.signup.creating", { defaultValue: "Creating your workspace…" }) : t("teacher.signup.google", { defaultValue: "Continue with Google" })}
        </GoogleButton>
      </form>
    </EntryShell>
  );
}
