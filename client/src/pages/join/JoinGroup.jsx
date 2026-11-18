// Public /join/:code (TCH-011): a learner signs in and joins the group, or a parent signs in
// and adds one of their (verified) children. Learners without email can't join this way yet.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { FcGoogle } from "react-icons/fc";
import { FaUserGraduate, FaUserFriends, FaCheckCircle } from "react-icons/fa";
import { auth, googleProvider } from "../../firebase/auth";
import { useAuth } from "../../context/AuthContext";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { authHeaders } from "../../utils/authHeaders";
import { API_ROOT, apiCall } from "../teacher/teacherApi";
import "../../components/dashboard/tokens.css";
import s from "./join.module.css";

async function joinAs(code, headers, body) {
  try {
    const r = await fetch(`${API_ROOT}/api/join/${encodeURIComponent(code)}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body || {}) });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok && j.success !== false, ...j };
  } catch {
    return { ok: false, message: "Could not reach Learnigo. Check your connection and try again." };
  }
}

export default function JoinGroup() {
  const { code } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { parentUser, parentGoogleSignIn, getParentToken } = useAdminAuth();
  const [info, setInfo] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [children, setChildren] = useState(null);

  useEffect(() => {
    apiCall(`/join/${encodeURIComponent(code)}`).then((r) => (r.ok ? setInfo(r) : setErr(r.message)));
  }, [code]);

  const finish = (r) => {
    if (r.ok) setDone(r);
    else setErr(r.message || t("join.failed", { defaultValue: "We couldn't add you. Please try again." }));
  };

  const asStudent = async () => {
    setBusy(true); setErr("");
    try {
      let headers = authHeaders();
      if (!headers.Authorization && !user) {
        const res = await signInWithPopup(auth, googleProvider);
        const s2 = await fetch(`${API_ROOT}/api/auth/session`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: await res.user.getIdToken() }) });
        const data = await s2.json().catch(() => ({}));
        if (data.token) { localStorage.setItem("firebase_jwt", data.token); headers = { Authorization: `Bearer ${data.token}` }; }
      }
      finish(await joinAs(code, headers));
    } catch (e) {
      if (!["auth/popup-closed-by-user", "auth/cancelled-popup-request"].includes(e.code)) setErr(e.message);
    } finally { setBusy(false); }
  };

  const loadChildren = async (token) => {
    const r = await apiCall("/parent/children", { token });
    setChildren(r.ok ? r.children : []);
  };
  const asParent = async () => {
    setBusy(true); setErr("");
    try {
      if (!parentUser) {
        const res = await signInWithPopup(auth, googleProvider);
        await parentGoogleSignIn(await res.user.getIdToken());
      }
      await loadChildren(getParentToken());
    } catch (e) {
      if (!["auth/popup-closed-by-user", "auth/cancelled-popup-request"].includes(e.code)) setErr(e.message);
    } finally { setBusy(false); }
  };
  const addChild = async (child) => {
    setBusy(true); setErr("");
    finish(await joinAs(code, { Authorization: `Bearer ${getParentToken()}` }, { childId: child._id }));
    setBusy(false);
  };

  const brand = info?.org?.brandColor || "#5b4fd6";
  const verified = (children || []).filter((c) => c.linkStatus === "verified" && c.email);
  return (
    <main className={`dash ${s.page}`}>
      <div className={s.card}>
        <div className={s.head} style={{ background: brand }}>
          {info?.org?.logoUrl && <img src={info.org.logoUrl} alt="" className={s.logo} />}
          <span>{info?.org?.name || "Learnigo"}</span>
        </div>
        <div className={s.body}>
          {!info && !err && <p>{t("join.loading", { defaultValue: "Looking up your class…" })}</p>}
          {!info && err && (
            <>
              <h1 className={s.title}>{t("join.notFound", { defaultValue: "We couldn't find that class" })}</h1>
              <p>{err}</p>
              <Link to="/" className={s.secondary}>{t("join.home", { defaultValue: "Go to Learnigo" })}</Link>
            </>
          )}
          {info && done && (
            <>
              <FaCheckCircle className={s.bigIcon} aria-hidden="true" />
              <h1 className={s.title}>{done.alreadyMember ? t("join.already", { defaultValue: "Already in {{name}}", name: done.group.name }) : t("join.joined", { defaultValue: "You're in {{name}}!", name: done.group.name })}</h1>
              <p>{t("join.next", { defaultValue: "Your teacher can now see how the learning is going and help with what comes next." })}</p>
              <Link to={parentUser && children ? "/parent-dashboard" : "/home"} className={s.primary} style={{ background: brand }}>{t("join.start", { defaultValue: "Start learning" })}</Link>
            </>
          )}
          {info && !done && (
            <>
              <p className={s.kicker}>{t("join.invited", { defaultValue: "You're invited to join" })}</p>
              <h1 className={s.title}><span aria-hidden="true">{info.group.emoji}</span> {info.group.name}</h1>
              <p className={s.muted}>{[info.teacher?.name && t("join.with", { defaultValue: "with {{name}}", name: info.teacher.name }), info.group.gradeBand].filter(Boolean).join(" · ")}</p>
              {info.group.full && <p className={s.error}>{t("join.full", { defaultValue: "This class is full. Ask your teacher to make room." })}</p>}
              {err && <p className={s.error} role="alert">{err}</p>}
              {children === null ? (
                <div className={s.choices}>
                  <button type="button" className={s.choice} onClick={asStudent} disabled={busy || info.group.full}>
                    <FaUserGraduate aria-hidden="true" />
                    <span><strong>{user ? t("join.asMe", { defaultValue: "Join as {{name}}", name: user.name || user.email }) : t("join.student", { defaultValue: "I'm a student" })}</strong>
                      <small>{user ? t("join.signedIn", { defaultValue: "You're signed in" }) : <><FcGoogle aria-hidden="true" /> {t("join.studentHow", { defaultValue: "Sign in with Google to join" })}</>}</small></span>
                  </button>
                  <button type="button" className={s.choice} onClick={asParent} disabled={busy || info.group.full}>
                    <FaUserFriends aria-hidden="true" />
                    <span><strong>{t("join.parent", { defaultValue: "I'm a parent" })}</strong><small>{t("join.parentHow", { defaultValue: "Sign in and choose your child" })}</small></span>
                  </button>
                </div>
              ) : (
                <div className={s.choices}>
                  {verified.map((c) => (
                    <button key={c._id} type="button" className={s.choice} onClick={() => addChild(c)} disabled={busy}>
                      <FaUserGraduate aria-hidden="true" /><span><strong>{t("join.addChild", { defaultValue: "Add {{name}}", name: c.name })}</strong><small>{c.email}</small></span>
                    </button>
                  ))}
                  {!verified.length && (
                    <p className={s.note}>{t("join.noChildren", { defaultValue: "To add a child, first connect them in your parent dashboard (their email and a link code), then open this link again." })} <Link to="/parent-dashboard">{t("join.parentDash", { defaultValue: "Open parent dashboard" })}</Link></p>
                  )}
                </div>
              )}
              <p className={s.small}>{t("join.managed", { defaultValue: "Young learner without an email? Joining with a link isn't available for them yet. Your teacher can add them by name." })}</p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
