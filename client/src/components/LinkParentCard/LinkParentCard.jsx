import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCopy, FaCheck } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useLinks, linkCall, RequestInbox, InviteByEmail } from "../links";
import { sfx } from "../../utils/sounds";
import styles from "./LinkParentCard.module.css";

const BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, "");

function authHeaders() {
  let token = "";
  try { token = localStorage.getItem("jwt_token") || localStorage.getItem("firebase_jwt") || ""; } catch { /* private mode */ }
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// The learner's "My people" (FND-012): requests from grown-ups, teachers and schools
// to answer, a way to ask someone by email, the one-time link code as the other way,
// and everyone who is connected now. Rendered as-is in the dashboard's My people tab.
export default function LinkParentCard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const links = useLinks("student", { poll: 30000 });
  const [people, setPeople] = useState(null);
  const managed = /@managed\.learnigo\.invalid$/.test(String(user?.email || ""));

  const [peopleTick, setPeopleTick] = useState(0);
  const loadPeople = useCallback(() => setPeopleTick((n) => n + 1), []);
  useEffect(() => {
    let live = true;
    (async () => {
      const r = await linkCall("student", "/people");
      if (live && r.ok) setPeople(r);
    })();
    return () => { live = false; };
  }, [peopleTick]);

  return (
    <section className={styles.wrap} aria-labelledby="my-people-title">
      <header className={styles.head}>
        <span className={styles.headIcon} aria-hidden="true">🤝</span>
        <div>
          <h2 id="my-people-title">{t("links.people.title", { defaultValue: "My people" })}</h2>
          <p>{t("links.people.sub", { defaultValue: "The grown-ups and teachers who cheer on your learning." })}</p>
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.col}>
          <RequestInbox links={links} viewer="student" audience="kid" showOutgoing={false}
            title={t("links.people.newRequests", { defaultValue: "New requests" })}
            onAccepted={loadPeople} />
          {!managed && <Connect links={links} />}
        </div>
        <div className={styles.col}>
          {!managed && <LinkCode />}
          <People people={people} onChanged={loadPeople} managed={managed} />
        </div>
      </div>
    </section>
  );
}

// Ask a grown-up or a teacher by email.
function Connect({ links }) {
  const { t } = useTranslation();
  const [to, setTo] = useState("parent");
  const pick = (v) => { setTo(v); };
  return (
    <div className={styles.card}>
      <h3>{t("links.people.connectTitle", { defaultValue: "Connect with a grown-up or teacher by email" })}</h3>
      <div className={styles.seg} role="group" aria-label={t("links.people.who", { defaultValue: "Who do you want to connect with?" })}>
        <button type="button" data-sound="toggle" aria-pressed={to === "parent"} onClick={() => pick("parent")}><span aria-hidden="true">🏠</span> {t("links.people.grownup", { defaultValue: "A grown-up at home" })}</button>
        <button type="button" data-sound="toggle" aria-pressed={to === "teacher"} onClick={() => pick("teacher")}><span aria-hidden="true">🍎</span> {t("links.people.teacher", { defaultValue: "My teacher" })}</button>
      </div>
      <InviteByEmail key={to} id={`kid-invite-${to}`} audience="kid"
        label={to === "parent" ? t("links.people.parentEmail", { defaultValue: "Your grown-up's email" }) : t("links.people.teacherEmail", { defaultValue: "Your teacher's email" })}
        hint={to === "parent"
          ? t("links.people.parentHint", { defaultValue: "They get a message. When they tap Accept, they can see how your learning is going." })
          : t("links.people.teacherHint", { defaultValue: "Your teacher gets a message. When they say yes, you join their class. Got a class code instead? Ask your teacher for the join link." })}
        onSend={(email) => links.send({ to, email })}
        sentText={(email) => t("links.people.sent", { defaultValue: "Sent! When {{email}} says yes, you'll see them here.", email })} />
      <RequestInbox links={links} viewer="student" audience="kid" showIncoming={false}
        outgoingTitle={t("links.people.waiting", { defaultValue: "Waiting for an answer" })} maxOutgoing={4} />
    </div>
  );
}

// The other way: a one-time code the learner reads out to their grown-up.
function LinkCode() {
  const { t } = useTranslation();
  const [state, setState] = useState({ status: "idle", code: "", error: "" });
  const [copied, setCopied] = useState(false);

  const makeCode = async () => {
    setState((s) => ({ ...s, status: "loading", error: "" }));
    setCopied(false);
    try {
      const res = await fetch(`${BASE}/dashboard/link-code`, { method: "POST", credentials: "include", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "failed");
      sfx.star();
      setState({ status: "ready", code: data.code, error: "" });
    } catch (err) {
      setState({ status: "error", code: "", error: err.message && err.message !== "failed" ? err.message : t("linkParent.error", { defaultValue: "Couldn't make a code. Please try again." }) });
    }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(state.code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* the code is on screen */ }
  };

  return (
    <div className={styles.card}>
      <h3>{t("linkParent.codeLabel", { defaultValue: "Your link code" })}</h3>
      <p className={styles.muted}>{t("links.code.explain", { defaultValue: "Another way to connect a grown-up: show them this code. They type it on their Learnigo parent page under Family → Add a child." })}</p>
      {state.status === "ready" ? (
        <div className={styles.codeRow}>
          <output className={styles.code} aria-live="polite" aria-label={state.code.split("").join(" ")}>
            {state.code.slice(0, 3)} {state.code.slice(3)}
          </output>
          <button type="button" data-sound="select" className={styles.copy} onClick={copy}>
            {copied ? <FaCheck aria-hidden="true" /> : <FaCopy aria-hidden="true" />} {copied ? t("linkParent.copied", { defaultValue: "Copied" }) : t("linkParent.copy", { defaultValue: "Copy" })}
          </button>
          <small>{t("linkParent.once", { defaultValue: "Works once · lasts {{hours}} hours", hours: 24 })}</small>
        </div>
      ) : (
        <button type="button" data-sound="open" className={styles.make} onClick={makeCode} disabled={state.status === "loading"}>
          🔑 {t("links.code.show", { defaultValue: "Show my link code" })}
        </button>
      )}
      {state.status === "ready" && (
        <button type="button" className={styles.linkBtn} onClick={makeCode}>{t("linkParent.another", { defaultValue: "New code" })}</button>
      )}
      {state.error && <p className={styles.error} role="alert">{state.error}</p>}
    </div>
  );
}

// Who is connected now: grown-ups (the learner can stop sharing) and classes.
function People({ people, onChanged, managed }) {
  const { t } = useTranslation();
  const [confirm, setConfirm] = useState(null);
  const [msg, setMsg] = useState("");
  const remove = async (type, id) => {
    const r = await linkCall("student", "/people/unlink", { method: "POST", body: { type, id } });
    setConfirm(null);
    setMsg(r.ok ? t("links.people.removed", { defaultValue: "Done. They can't see your learning any more." }) : r.message);
    if (r.ok) { sfx.close(); onChanged(); }
  };
  const g = people?.guardians || [];
  const c = people?.classes || [];
  return (
    <div className={styles.card}>
      <h3>{t("links.people.connected", { defaultValue: "Connected with you" })}</h3>
      {msg && <p className={styles.note} role="status">{msg}</p>}
      {people && !g.length && !c.length && <p className={styles.muted}>{t("links.people.none", { defaultValue: "Nobody yet. Send a request or show your link code to get started!" })}</p>}
      <ul className={styles.people}>
        {g.map((p) => (
          <li key={`g${p.id}`}>
            <span className={styles.face} aria-hidden="true">🏠</span>
            <span className={styles.personText}><strong>{p.name}</strong><small>{t("links.people.followsYou", { defaultValue: "Follows your learning" })}</small></span>
            {p.canRemove && !managed && (confirm === p.id ? (
              <span className={styles.confirm}>
                <button type="button" data-sound="none" className={styles.smallDanger} onClick={() => remove("parent", p.id)}>{t("links.people.yesRemove", { defaultValue: "Yes, remove" })}</button>
                <button type="button" data-sound="back" className={styles.smallBtn} onClick={() => setConfirm(null)}>{t("links.people.keep", { defaultValue: "Keep" })}</button>
              </span>
            ) : <button type="button" className={styles.smallBtn} onClick={() => setConfirm(p.id)}>{t("links.people.remove", { defaultValue: "Remove" })}</button>)}
          </li>
        ))}
        {c.map((k) => (
          <li key={`c${k.id}`}>
            <span className={styles.face} aria-hidden="true">{k.emoji || "🍎"}</span>
            <span className={styles.personText}><strong>{k.name}</strong><small>{[k.teacher, k.org].filter(Boolean).join(" · ")}</small></span>
            {k.canLeave && (confirm === `c${k.id}` ? (
              <span className={styles.confirm}>
                <button type="button" data-sound="none" className={styles.smallDanger} onClick={() => remove("class", k.id)}>{t("links.people.yesLeave", { defaultValue: "Yes, leave" })}</button>
                <button type="button" data-sound="back" className={styles.smallBtn} onClick={() => setConfirm(null)}>{t("links.people.keep", { defaultValue: "Keep" })}</button>
              </span>
            ) : <button type="button" className={styles.smallBtn} onClick={() => setConfirm(`c${k.id}`)}>{t("links.people.leave", { defaultValue: "Leave" })}</button>)}
          </li>
        ))}
      </ul>
    </div>
  );
}
