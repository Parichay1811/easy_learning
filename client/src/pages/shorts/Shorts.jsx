import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as FramerMotion from "framer-motion";
import { FaArrowLeft, FaHeart, FaRegHeart, FaPlay, FaPause, FaRedo, FaChevronDown, FaChevronUp, FaSlidersH, FaCheck, FaChalkboardTeacher } from "react-icons/fa";
import "../../components/dashboard/tokens.css";
import Sheet from "../../components/dashboard/Sheet";
import Mascot from "../../components/Mascot/Mascot";
import { useVoiceBarHost } from "../../components/VoiceBar/useNarration";
import { narrate, stopNarration, pauseNarration, resumeNarration, onNarration } from "../../utils/narrator";
import { usePrefs } from "../../components/settings/usePrefs";
import { useCalmMotion } from "../../utils/useCalmMotion";
import { sfx, haptic } from "../../utils/sounds";
import { shortsApi, signedIn } from "../together/api";
import { words } from "../together/words";
import { getBoard, restBoard, sayDuration } from "./boardHost";
import s from "./Shorts.module.css";
import { useGuide } from "../../components/guide/useGuide";
import { nudgeGuide } from "../../components/guide/nudge";

const M = FramerMotion.motion;
const sleep = (ms, signal) => new Promise((res) => { const id = setTimeout(res, ms); signal?.addEventListener("abort", () => { clearTimeout(id); res(); }, { once: true }); });

/**
 * Shorts (/shorts): small lessons from the AI Teacher to swipe through. Each one is drawn
 * on the teacher's board and spoken, then asks one "now you try" question. The next short
 * never starts by itself: the learner swipes (or presses Next), and after a few in a row a
 * break card suggests a stretch. Hearts and the learner's own topic picks shape the feed.
 */
export default function Shorts() {
  const { t } = useTranslation();
  const w = useMemo(() => words(t), [t]);
  const navigate = useNavigate();
  useVoiceBarHost(true); // captions are shown in the short itself

  const [feed, setFeed] = useState(() => ({ items: [], status: signedIn() ? "loading" : "signin", breakEvery: 8, picks: [], themes: [] }));
  const [active, setActive] = useState(0);
  const [picking, setPicking] = useState(false);
  const scroller = useRef(null);
  const loadingMore = useRef(false);

  const load = useCallback(async (exclude = []) => {
    const r = await shortsApi(`/feed?limit=6${exclude.length ? `&exclude=${encodeURIComponent(exclude.slice(-50).join(","))}` : ""}`);
    if (!r.ok) { setFeed((f) => (f.items.length ? f : { ...f, status: r.code === "SHORTS_OFF" ? "off" : r.status === 401 ? "signin" : "error" })); return; }
    setFeed((f) => ({ items: [...f.items, ...r.items.filter((x) => !f.items.some((y) => y.id === x.id))], status: "ready", breakEvery: r.breakEvery || 8, picks: r.picks || [], themes: r.themes || [] }));
    if (!exclude.length && r.needsPicks) setPicking(true);
  }, []);
  // The first page of the feed (load() only sets state once its request has come back).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (signedIn()) load(); }, [load]);
  // Leaving Shorts: the voice stops and the board rests.
  useEffect(() => () => { stopNarration(); restBoard(); }, []);

  // The slides: shorts, with a break card after every few.
  const slides = useMemo(() => {
    const out = [];
    feed.items.forEach((it, i) => {
      out.push({ kind: "short", key: it.id, short: it });
      if ((i + 1) % feed.breakEvery === 0) out.push({ kind: "break", key: `break-${i}`, watched: i + 1 });
    });
    return out;
  }, [feed.items, feed.breakEvery]);

  // More shorts arrive before the end is reached.
  useEffect(() => {
    if (feed.status !== "ready" || loadingMore.current || active < slides.length - 2) return;
    loadingMore.current = true;
    load(feed.items.map((x) => x.id)).finally(() => { loadingMore.current = false; });
  }, [active, slides.length, feed.status, feed.items, load]);

  // Which slide is on screen (most of it): that one plays, the others rest.
  useEffect(() => {
    const root = scroller.current;
    if (!root) return undefined;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting && e.intersectionRatio >= 0.6) setActive(Number(e.target.dataset.i));
    }, { root, threshold: [0.6] });
    root.querySelectorAll("[data-i]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [slides.length]);

  const go = useCallback((delta) => {
    const root = scroller.current;
    const el = root?.querySelector(`[data-i="${Math.max(0, Math.min(slides.length - 1, active + delta))}"]`);
    el?.scrollIntoView({ behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }, [active, slides.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select, [role='dialog']")) return;
      if (e.key === "ArrowDown" || e.key === "PageDown") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); go(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const patchItem = (id, part) => setFeed((f) => ({ ...f, items: f.items.map((x) => (x.id === id ? { ...x, ...part } : x)) }));

  const frame = (children) => (
    <div className={`dash ${s.page}`} data-theme="light">
      <header className={s.top}>
        <button type="button" className={s.back} onClick={() => { sfx.back(); navigate("/home"); }} data-sound="none" aria-label={t("shorts.back", "Back")}><FaArrowLeft aria-hidden="true" /></button>
        <h1 className={s.title}>{t("shorts.title", "Shorts")}</h1>
        {feed.status === "ready" && <button type="button" className={s.topBtn} onClick={() => setPicking(true)} data-sound="open"><FaSlidersH aria-hidden="true" /> <span>{t("shorts.myTopics", "My topics")}</span></button>}
      </header>
      {children}
    </div>
  );

  if (feed.status !== "ready") {
    const text = {
      loading: t("shorts.loading", "Finding something good to watch…"),
      signin: t("shorts.signin", "Sign in to watch Shorts picked for you."),
      off: t("shorts.off", "A grown-up has switched Shorts off for now. There is plenty to play and learn on Home."),
      error: t("shorts.error", "We could not reach Learnigo just now."),
    }[feed.status];
    return frame(
      <div className={s.center} role="status">
        <Mascot size={120} mood={feed.status === "loading" ? "think" : "idle"} />
        <p>{text}</p>
        {feed.status === "signin" && <button type="button" className={s.cta} onClick={() => navigate("/login")}>{t("together.signin.cta", "Sign in")}</button>}
        {feed.status === "error" && <button type="button" className={s.cta} onClick={() => { setFeed((f) => ({ ...f, status: "loading" })); load(); }}>{t("together.retry", "Try again")}</button>}
        {feed.status === "off" && <button type="button" className={s.cta} onClick={() => navigate("/home")}>{t("shorts.goHome", "Go to Home")}</button>}
      </div>,
    );
  }

  return frame(
    <>
      <div className={s.feed} ref={scroller} aria-label={t("shorts.feedLabel", "Shorts. Swipe up for the next one.")}>
        {slides.map((sl, i) => (
          <section key={sl.key} data-i={i} className={s.slide} aria-roledescription={t("shorts.slide", "short")} aria-label={sl.kind === "short" ? sl.short.title : t("shorts.break.title", "Time for a stretch")}>
            {sl.kind === "short"
              ? <Short short={sl.short} active={i === active} near={Math.abs(i - active) <= 1} w={w} t={t} onNext={() => go(1)} onPrev={i > 0 ? () => go(-1) : null}
                  onLike={(liked) => { patchItem(sl.short.id, { liked }); shortsApi("/events", { method: "POST", body: { id: sl.short.id, kind: liked ? "like" : "unlike" } }); }} />
              : <BreakCard watched={sl.watched} active={i === active} t={t} onMore={() => go(1)} onHome={() => navigate("/home")} onPractise={() => navigate("/dashboard")} />}
          </section>
        ))}
      </div>
      {picking && <PickSheet w={w} t={t} themes={feed.themes} picks={feed.picks} onClose={() => setPicking(false)} onSaved={(picks) => { setFeed((f) => ({ ...f, picks })); setPicking(false); }} />}
    </>,
  );
}

// ── One short ────────────────────────────────────────────────────────────────
function Short({ short, active, near, w, t, onNext, onPrev, onLike }) {
  const calm = useCalmMotion();
  const prefs = usePrefs();
  const guide = useGuide();
  const theme = w.theme(short.theme);
  const stageRef = useRef(null);
  const [beat, setBeat] = useState(-1); // which step is being said (-1: not started)
  const [caption, setCaption] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | playing | paused | quiz | answered
  const [choice, setChoice] = useState(null);
  const [hasBoard, setHasBoard] = useState(false);
  const run = useRef(null); // the playback in progress: { ctrl, paused, resume }

  // Play the steps one after another: drawn on the board while they are said. Without a
  // voice (switched off, or none on this device) each step simply stays up to be read.
  const start = useCallback(async () => {
    run.current?.ctrl.abort();
    const ctrl = new AbortController();
    const me = { ctrl, paused: false, waiters: [] };
    run.current = me;
    setChoice(null);
    setPhase("playing");
    const board = await getBoard();
    if (ctrl.signal.aborted) return;
    if (board && stageRef.current) {
      board.start(); board.play(); board.clear();
      if (board.canvas.parentNode !== stageRef.current) stageRef.current.appendChild(board.canvas);
      setHasBoard(true);
    }
    for (let i = 0; i < short.steps.length; i++) {
      if (ctrl.signal.aborted) return;
      const step = short.steps[i];
      setBeat(i);
      setCaption(step.say);
      const dur = sayDuration(step.say, prefs.voiceRate || 0.9);
      board?.draw(step, dur);
      const began = Date.now();
      const heard = await narrate(step.say, { lang: "en-US" });
      if (ctrl.signal.aborted) return;
      // Not spoken (voice off, no voice here, or sound not allowed yet): leave time to read it.
      if (!heard) {
        let left = dur * 1000 * 1.15 - (Date.now() - began);
        while (left > 0 && !ctrl.signal.aborted) {
          if (me.paused) { await new Promise((res) => me.waiters.push(res)); continue; }
          const tick = Math.min(200, left);
          await sleep(tick, ctrl.signal);
          if (!me.paused) left -= tick;
        }
      } else await sleep(350, ctrl.signal);
    }
    if (ctrl.signal.aborted) return;
    setPhase("quiz");
    sfx.pop();
    shortsApi("/events", { method: "POST", body: { id: short.id, kind: "done" } });
  }, [short, prefs.voiceRate]);

  // Play or pause (a tap on the board, the side button, or the tab going away).
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  const toggle = useCallback(() => {
    const me = run.current;
    if (!me || (phaseRef.current !== "playing" && phaseRef.current !== "paused")) return;
    me.paused = !me.paused;
    getBoard().then((b) => (me.paused ? b?.pause() : b?.play()));
    if (me.paused) { pauseNarration(); setPhase("paused"); } else { resumeNarration(); me.waiters.splice(0).forEach((res) => res()); setPhase("playing"); }
  }, []);

  // No longer the short on screen: back to its poster (adjusted while rendering, so the
  // old caption never flashes).
  const [wasActive, setWasActive] = useState(active);
  if (active !== wasActive) {
    setWasActive(active);
    if (!active) { setPhase("idle"); setBeat(-1); setCaption(""); setHasBoard(false); }
  }

  // Becoming the short on screen starts it (after a moment, so a fast swipe past does not);
  // leaving it stops the voice and gives the board to the next one.
  useEffect(() => {
    if (!active) return undefined;
    const id = setTimeout(() => { shortsApi("/events", { method: "POST", body: { id: short.id, kind: "view" } }); start(); }, 450);
    return () => {
      clearTimeout(id);
      if (run.current) { run.current.ctrl.abort(); run.current = null; stopNarration(); }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, short.id]);

  // The question arrives, or is answered: the guide points at what to tap now.
  useEffect(() => { if (active && (phase === "quiz" || phase === "answered")) nudgeGuide(); }, [active, phase]);

  // The sentence being said, for the captions.
  useEffect(() => {
    if (!active) return undefined;
    return onNarration((e) => { if (e.type === "sentence" && e.text) setCaption(e.text); });
  }, [active]);

  // The tab goes away: pause. It stays paused until the learner presses play.
  useEffect(() => {
    if (!active) return undefined;
    const onVis = () => { if (document.hidden && run.current && !run.current.paused) toggle(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [active, toggle]);

  const answer = (i) => {
    if (phase !== "quiz") return;
    const right = i === short.quiz.answer;
    setChoice(i);
    setPhase("answered");
    if (right) { sfx.correct(); haptic("success"); } else sfx.wrong();
    shortsApi("/events", { method: "POST", body: { id: short.id, kind: "quiz", correct: right } });
    narrate(short.quiz.why, { lang: "en-US" });
  };

  const like = () => { const next = !short.liked; if (next) { sfx.star(); haptic("light"); } else sfx.tap(); onLike(next); };
  const playing = phase === "playing";
  const showQuiz = phase === "quiz" || phase === "answered";

  return (
    <div className={s.short} style={{ "--hue": theme.hue }}>
      <div className={s.head}>
        <span className={s.themeChip}><span aria-hidden="true">{theme.emoji}</span> {theme.name}</span>
        <h2 className={s.shortTitle}>{short.title}</h2>
      </div>

      <div className={s.frame}>
        <div className={s.board} ref={stageRef} onClick={toggle} role="button" tabIndex={active ? 0 : -1} aria-label={playing ? t("shorts.pause", "Pause") : t("shorts.play", "Play")}
          onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); } }}>
          {/* Until the board has arrived (or when it cannot): a poster for the topic. */}
          {!hasBoard && (
            <div className={s.poster}>
              {short.picture?.still && near ? <img src={short.picture.still} alt="" loading="lazy" decoding="async" /> : <span className={s.posterEmoji} aria-hidden="true">{theme.emoji}</span>}
            </div>
          )}
          {phase === "paused" && <span className={s.pausedBadge} aria-hidden="true"><FaPlay /></span>}
        </div>
        <div className={s.dots} aria-hidden="true">{short.steps.map((_, i) => <span key={i} className={i < beat ? s.dotDone : i === beat ? s.dotOn : ""} />)}<span className={showQuiz ? s.dotOn : ""}>?</span></div>
      </div>

      <div className={s.below}>
        <FramerMotion.AnimatePresence mode="wait" initial={false}>
          {showQuiz ? (
            <M.div key="quiz" className={s.quiz} initial={calm ? { opacity: 0 } : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}>
              <p className={s.quizAsk}><span className={s.quizTag}>{t("shorts.nowYou", "Now you try")}</span> {short.quiz.ask}</p>
              <div className={s.options} {...(phase === "quiz" ? guide("shorts.answer", "Now you try! Tap the answer you think is right.", { order: 1 }) : {})}>
                {short.quiz.options.map((o, i) => {
                  const picked = choice === i;
                  const right = i === short.quiz.answer;
                  const cls = phase === "answered" ? (right ? s.optRight : picked ? s.optWrong : s.optRest) : "";
                  return (
                    <button key={i} type="button" className={`${s.option} ${cls}`} onClick={() => answer(i)} disabled={phase === "answered"} data-sound="none" aria-pressed={picked}>
                      {phase === "answered" && right && <FaCheck aria-hidden="true" />} {o}
                    </button>
                  );
                })}
              </div>
              {phase === "answered" && (
                <M.div className={s.after} initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="status">
                  <p className={s.why}><b>{choice === short.quiz.answer ? t("shorts.right", "Yes!") : t("shorts.notQuite", "Good try!")}</b> {short.quiz.why}</p>
                  <div className={s.afterActions}>
                    <button type="button" className={s.next} onClick={onNext} data-sound="none" onPointerDown={() => sfx.forward()} {...guide("shorts.next", "Tap Next for another short, or swipe up.", { order: 1 })}>{t("shorts.next", "Next short")} <FaChevronDown aria-hidden="true" /></button>
                    <Link className={s.lesson} to="/ai-teacher"><FaChalkboardTeacher aria-hidden="true" /> {t("shorts.fullLesson", "Ask the AI Teacher more")}</Link>
                  </div>
                </M.div>
              )}
            </M.div>
          ) : (
            <M.p key="cap" className={s.caption} aria-live="polite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {caption || (active ? t("shorts.starting", "Here we go…") : short.steps[0].say)}
            </M.p>
          )}
        </FramerMotion.AnimatePresence>
      </div>

      <div className={s.rail}>
        <button type="button" className={`${s.railBtn} ${short.liked ? s.liked : ""}`} onClick={like} aria-pressed={Boolean(short.liked)} data-sound="none" aria-label={short.liked ? t("shorts.unlike", "Take my heart back") : t("shorts.like", "I like this one")}>
          <M.span key={String(short.liked)} initial={short.liked && !calm ? { scale: 0.4 } : false} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.6, duration: 0.5 }}>{short.liked ? <FaHeart /> : <FaRegHeart />}</M.span>
        </button>
        {(playing || phase === "paused") && <button type="button" className={s.railBtn} onClick={toggle} data-sound="none" aria-label={playing ? t("shorts.pause", "Pause") : t("shorts.play", "Play")}>{playing ? <FaPause /> : <FaPlay />}</button>}
        <button type="button" className={s.railBtn} onClick={() => { sfx.tap(); start(); }} data-sound="none" aria-label={t("shorts.again", "Watch again")}><FaRedo /></button>
        {onPrev && <button type="button" className={`${s.railBtn} ${s.railNav}`} onClick={onPrev} aria-label={t("shorts.prev", "The one before")}><FaChevronUp /></button>}
        <button type="button" className={`${s.railBtn} ${s.railNav}`} onClick={onNext} aria-label={t("shorts.next", "Next short")}><FaChevronDown /></button>
      </div>
    </div>
  );
}

// After a few shorts in a row: a pause, and a choice (the feed never rolls on by itself).
function BreakCard({ watched, active, t, onMore, onHome, onPractise }) {
  useEffect(() => { if (active) sfx.notify(); }, [active]);
  return (
    <div className={s.breakCard}>
      <Mascot size={120} mood="wave" />
      <h2>{t("shorts.break.title", "Time for a stretch")}</h2>
      <p>{t("shorts.break.text", { defaultValue: "You have watched {{count}} shorts. Stand up, wiggle, look out of the window. What would you like to do next?", count: watched })}</p>
      <div className={s.breakActions}>
        <button type="button" className={s.cta} onClick={onPractise}>{t("shorts.break.practise", "Try a round")}</button>
        <button type="button" className={s.ghost} onClick={onMore}>{t("shorts.break.more", "A few more")}</button>
        <button type="button" className={s.ghost} onClick={onHome}>{t("shorts.break.done", "That's enough for today")}</button>
      </div>
    </div>
  );
}

// "What do you like?": the learner's own picks. Says plainly who can see them.
function PickSheet({ w, t, themes, picks, onClose, onSaved }) {
  const [mine, setMine] = useState(() => new Set(picks));
  const [busy, setBusy] = useState(false);
  const flip = (k) => { const next = new Set(mine); if (next.has(k)) next.delete(k); else next.add(k); sfx.toggle(next.has(k)); setMine(next); };
  const save = async () => {
    setBusy(true);
    const r = await shortsApi("/picks", { method: "PUT", body: { themes: [...mine] } });
    setBusy(false);
    onSaved(r.ok ? r.picks : picks);
  };
  return (
    <Sheet theme="light" title={t("shorts.picks.title", "What do you like?")} text={t("shorts.picks.text", "Pick as many as you want. You will see more of these, and always something new too.")} onClose={onClose}
      footer={<><button type="button" className={s.ghost} onClick={onClose}>{t("shorts.picks.skip", "Not now")}</button><button type="button" className={s.cta} onClick={save} disabled={busy}>{t("shorts.picks.save", "Show me!")}</button></>}>
      <div className={s.pickGrid}>
        {themes.map((k) => { const th = w.theme(k); const on = mine.has(k); return (
          <button key={k} type="button" className={`${s.pick} ${on ? s.pickOn : ""}`} style={{ "--hue": th.hue }} aria-pressed={on} onClick={() => flip(k)} data-sound="none">
            <span aria-hidden="true">{th.emoji}</span>{th.name}{on && <FaCheck aria-hidden="true" className={s.pickTick} />}
          </button>
        ); })}
      </div>
      <p className={s.seen}>{t("shorts.picks.seen", "Your grown-ups and your teacher can see which topics you like, so they can find more of them for you.")}</p>
    </Sheet>
  );
}
