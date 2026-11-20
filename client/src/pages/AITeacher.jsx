import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import * as FramerMotion from "framer-motion";
import VideoBackground from "../components/VideoBackground/VideoBackground";
import SEO from "../components/SEO/SEO";
import styles from "./AITeacher.module.css";

const BASE = import.meta.env.VITE_API_BASE_URL;

// Only what the teacher needs to greet the learner: never free text the learner wrote.
function summary(d) {
  if (!d || typeof d !== "object") return null;
  const str = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");
  return {
    name: str(d.name, 40),
    focus: (Array.isArray(d.focus) ? d.focus : []).slice(0, 3).map((f) => ({ skill: str(f?.skill, 80), name: str(f?.name, 60), strategy: str(f?.strategy, 12) })),
    wins: (Array.isArray(d.wins) ? d.wins : []).slice(0, 2).map((w) => ({ name: str(typeof w === "string" ? w : w?.name, 60) })),
    prefers: str(d.prefers, 12),
  };
}

// The AI teacher as a page of the site: the site's navbar, background and
// footer around it, the teacher itself filling the rest. Its own page (plain
// ES modules, served at /ai-assistant/ by client/scripts/ai-assistant-static.mjs)
// is embedded from the same origin; it hides its own logo when embedded.
//
// A signed-in learner: the learning engine's short summary (GET /api/learn/companion:
// first name, skills to work on, wins, how they like things explained) is passed
// to the teacher with postMessage, to this origin only, so it can say hello by
// name and offer those skills. Not signed in, or an older server: nothing is sent.
const AITeacher = () => {
  const { t } = useTranslation();
  const title = t("aiTeacher.title", { defaultValue: "AI Teacher" });
  const frame = useRef(null);
  const handshake = useRef({ ready: false, sent: false, data: null });

  useEffect(() => {
    let token = null;
    try { token = localStorage.getItem("jwt_token") || localStorage.getItem("firebase_jwt"); } catch { /* storage off */ }
    if (!token) return undefined;
    let live = true;
    const origin = window.location.origin;
    const hs = handshake.current;
    const send = () => {
      const win = frame.current?.contentWindow;
      if (!live || hs.sent || !hs.ready || !hs.data || !win) return;
      hs.sent = true;
      win.postMessage({ type: "learnigo:companion", companion: hs.data }, origin);
    };
    // The teacher says when it is listening (its own origin, from the frame only).
    const onMessage = (e) => {
      if (e.origin !== origin || e.source !== frame.current?.contentWindow) return;
      if (e.data?.type === "learnigo:teacher-ready") { hs.ready = true; send(); }
    };
    window.addEventListener("message", onMessage);
    hs.send = send;
    fetch(`${BASE}/learn/companion`, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (live && d) { hs.data = summary(d.companion || d); send(); } })
      .catch(() => { /* no learning engine here: the teacher greets as usual */ });
    return () => { live = false; window.removeEventListener("message", onMessage); };
  }, []);

  // The frame finished loading: its scripts are running, so it is listening too.
  const onLoad = () => {
    const hs = handshake.current;
    hs.ready = true;
    hs.send?.();
  };

  return (
    <FramerMotion.motion.div
      className={styles.page}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35 }}
    >
      <SEO
        title="AI Teacher | Ask Out Loud, Learn with Pictures | Learnigo"
        description="Learnigo's AI teacher answers questions out loud with a drawn, narrated mini-lesson, then tests you — dyslexia-friendly, voice-first help with maths, science, English and more."
        path="/ai-teacher"
      />
      <VideoBackground />
      <div className={styles.frameWrap}>
        <iframe
          ref={frame}
          className={styles.frame}
          src="/ai-assistant/"
          title={title}
          allow="microphone; autoplay"
          onLoad={onLoad}
        />
      </div>
    </FramerMotion.motion.div>
  );
};

export default AITeacher;
