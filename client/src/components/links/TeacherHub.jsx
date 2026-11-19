// A teacher's invitations and requests, on the /teach page (pages/teacher/SoloSignup.jsx).
//  - Signed in as a teacher already: the teacher API (school invitations, learners who
//    asked to join, "ask my school to add me").
//  - Not a teacher yet (a school invited them): Google sign-in only. Accepting a school's
//    invitation creates their teacher account in that school and signs them straight in.
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { auth, signInWithGoogle } from "../../firebase/auth";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useLinks, hubCall, API_ROOT } from "./useLinks";
import RequestInbox from "./RequestInbox";
import InviteByEmail from "./InviteByEmail";
import s from "./links.module.css";

const CANCELLED = ["auth/popup-closed-by-user", "auth/cancelled-popup-request"];

function validTeacherToken() {
  try {
    const tok = localStorage.getItem("teacher_jwt");
    if (!tok) return false;
    const p = JSON.parse(atob(tok.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return p.exp * 1000 > Date.now();
  } catch { return false; }
}

export default function TeacherHub({ onStartOwn }) {
  return validTeacherToken() ? <SignedInHub /> : <GoogleHub onStartOwn={onStartOwn} />;
}

function JoinSchool({ onSend }) {
  const { t } = useTranslation();
  return (
    <section className={s.box} aria-labelledby="join-school-h">
      <h3 id="join-school-h" className={s.title}>🏫 {t("links.teach.joinTitle", { defaultValue: "Teach at a school on Learnigo?" })}</h3>
      <InviteByEmail id="join-school-email" onSend={onSend}
        label={t("links.teach.adminEmail", { defaultValue: "Your school admin's email" })}
        placeholder={t("links.teach.adminPh", { defaultValue: "principal@yourschool.org" })}
        button={t("links.teach.ask", { defaultValue: "Ask to join" })}
        hint={t("links.teach.joinHint", { defaultValue: "The person who runs your school on Learnigo gets a request. When they accept, the school shows up in your workspace switcher." })}
        sentText={(email) => t("links.teach.asked", { defaultValue: "Sent! When {{email}} accepts, you can switch to your school.", email })} />
    </section>
  );
}

// Signed in as a teacher: everything through the teacher API.
function SignedInHub() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { teacherUseToken } = useAdminAuth();
  const links = useLinks("teacher", { poll: 30000 });
  const [switchTo, setSwitchTo] = useState(null);

  const onAccepted = (res, r) => {
    if (r.kind === "staff" && res.tutorId) setSwitchTo({ tutorId: res.tutorId, name: res.org?.name || r.org?.name || "" });
  };
  const doSwitch = async () => {
    const tok = localStorage.getItem("teacher_jwt");
    const res = await fetch(`${API_ROOT}/api/teacher/auth/switch`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` }, body: JSON.stringify({ tutorId: switchTo.tutorId }) }).then((x) => x.json()).catch(() => ({}));
    if (res.success) { teacherUseToken(res.token, res.adminToken); navigate("/teacher-dashboard?view=today"); }
  };

  const none = links.data && !(links.data.incoming || []).length;
  return (
    <div className={s.box} style={{ gap: 16 }}>
      {switchTo && (
        <div className={s.ok} role="status" style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <span style={{ flex: "1 1 200px" }}>{t("links.teach.joined", { defaultValue: "You're a teacher at {{name}} now.", name: switchTo.name })}</span>
          <button type="button" data-sound="forward" className={s.btn} onClick={doSwitch}>{t("links.teach.switch", { defaultValue: "Open {{name}}", name: switchTo.name })}</button>
        </div>
      )}
      {links.loading ? <p className={s.muted}>{t("links.loading", { defaultValue: "Loading…" })}</p> : links.error ? <p className={s.err}>{links.error}</p> : (
        <>
          <RequestInbox links={links} viewer="teacher" onAccepted={onAccepted} showOutgoing={false}
            title={t("links.teach.forYou", { defaultValue: "Invitations and requests for you" })} />
          {none && <p className={s.muted}>{t("links.teach.nothing", { defaultValue: "No invitations waiting right now." })}</p>}
        </>
      )}
      <JoinSchool onSend={(email) => links.send({ to: "school", email })} />
      <RequestInbox links={links} viewer="teacher" showIncoming={false}
        outgoingTitle={t("links.sentByYou", { defaultValue: "Requests you sent" })} />
      <button type="button" data-sound="forward" className={s.ghost} onClick={() => navigate("/teacher-dashboard")}>{t("links.teach.toDashboard", { defaultValue: "Go to my classes" })}</button>
    </div>
  );
}

// Not a teacher yet: Google identity only.
function GoogleHub({ onStartOwn }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { teacherUseToken } = useAdminAuth();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const idToken = useCallback(async (fresh = false) => {
    if (!fresh && auth?.currentUser) return auth.currentUser.getIdToken();
    const res = await signInWithGoogle();
    return res.user.getIdToken();
  }, []);

  const load = useCallback(async (fresh = false) => {
    setBusy(true); setErr("");
    try {
      const r = await hubCall("/invites", { idToken: await idToken(fresh) });
      if (!r.ok) throw new Error(r.message);
      setData(r);
    } catch (e) {
      if (!CANCELLED.includes(e.code)) setErr(e.message || t("links.failed", { defaultValue: "That didn't work. Please try again." }));
    } finally { setBusy(false); }
  }, [idToken, t]);

  // The same shape as useLinks(), so RequestInbox works unchanged.
  const links = useMemo(() => ({
    data: data && { ...data, incoming: (data.incoming || []).filter((r) => r.kind === "staff") },
    reload: () => load(),
    accept: async (id) => {
      const r = await hubCall(`/invites/${id}/accept`, { idToken: await idToken() });
      if (r.ok && r.token) { teacherUseToken(r.token, r.adminToken); navigate("/teacher-dashboard?view=today&welcome=school"); }
      return r;
    },
    decline: async (id) => { const r = await hubCall(`/invites/${id}/decline`, { idToken: await idToken() }); if (r.ok) load(); return r; },
    cancel: async (id) => { const r = await hubCall(`/join-school/${id}/cancel`, { idToken: await idToken() }); if (r.ok) load(); return r; },
    send: async (body) => { const r = await hubCall("/join-school", { idToken: await idToken(), email: body.email }); if (r.ok) load(); return r; },
  }), [data, idToken, load, navigate, teacherUseToken]);

  if (!data) {
    return (
      <div className={s.box} style={{ gap: 14 }}>
        <p className={s.muted} style={{ margin: 0 }}>{t("links.teach.signInWhy", { defaultValue: "Sign in with the Google account your school invited. We show the invitations waiting for that email." })}</p>
        <button type="button" className={`${s.btn} ${s.big}`} onClick={() => load(true)} disabled={busy}>
          <FcGoogle aria-hidden="true" /> {busy ? t("links.loading", { defaultValue: "Loading…" }) : t("links.teach.google", { defaultValue: "See my invitations" })}
        </button>
        {err && <p className={s.err} role="alert">{err}</p>}
      </div>
    );
  }
  const classAsks = (data.incoming || []).filter((r) => r.kind === "class").length;
  return (
    <div className={s.box} style={{ gap: 16 }}>
      <p className={s.fine}>{t("links.teach.signedAs", { defaultValue: "Signed in as {{email}}", email: data.me?.email })}</p>
      <RequestInbox links={links} viewer="teacher" showOutgoing={false}
        title={t("links.teach.invitations", { defaultValue: "Schools that invited you" })} />
      {!links.data.incoming.length && <p className={s.muted} style={{ margin: 0 }}>{t("links.teach.noInvites", { defaultValue: "No school has invited this email yet. Ask your school below, or start your own free workspace." })}</p>}
      {classAsks > 0 && <p className={s.fine}>{t("links.teach.classAsks", { defaultValue: "{{n}} students asked to join your class. Start your free workspace (or join your school) to accept them.", n: classAsks })}</p>}
      <JoinSchool onSend={(email) => links.send({ email })} />
      <RequestInbox links={links} viewer="teacher" showIncoming={false} outgoingTitle={t("links.sentByYou", { defaultValue: "Requests you sent" })} />
      {data.hasWorkspace
        ? <button type="button" className={s.ghost} onClick={() => navigate("/teacher-login")}>{t("links.teach.signIn", { defaultValue: "Teacher sign-in" })}</button>
        : onStartOwn && <button type="button" className={s.ghost} onClick={onStartOwn}>{t("links.teach.startOwn", { defaultValue: "Start my own free workspace instead" })}</button>}
    </div>
  );
}

// For the teacher's own inbox elsewhere (e.g. the dashboard's Today view): a ready-made block.
export function TeacherRequests() {
  const { t } = useTranslation();
  const links = useLinks("teacher", { poll: 45000 });
  return <RequestInbox links={links} viewer="teacher" showOutgoing={false} title={t("links.teach.forYou", { defaultValue: "Invitations and requests for you" })} />;
}
