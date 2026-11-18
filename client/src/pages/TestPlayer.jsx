// The student's test player (TCH-033) at /test/:id: intro with the rules in
// plain words, the wooden-board question card, progress, timer, autosave that
// survives a dropped connection, and a calm hand-in. All timing and marking
// is decided by the server; this page only shows it.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaClock, FaArrowLeft, FaArrowRight, FaCheck, FaStar, FaHome, FaPaperPlane, FaWifi } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import TestQuestion from "../components/tests/TestQuestion";
import { sget, spost, sput } from "../components/tests/studentApi";
import s from "./TestPlayer.module.css";

const PENDING = (attemptId) => `learnigo.test.pending.${attemptId}`;
const readPending = (id) => { try { return JSON.parse(localStorage.getItem(PENDING(id)) || "{}"); } catch { return {}; } };
const writePending = (id, v) => { try { if (Object.keys(v).length) localStorage.setItem(PENDING(id), JSON.stringify(v)); else localStorage.removeItem(PENDING(id)); } catch { /* storage off */ } };
const answered = (v) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length) && !(typeof v === "object" && !Array.isArray(v) && !Object.values(v).some((x) => (Array.isArray(x) ? x.length : x)));
const mmss = (ms) => { const t = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };

function useTT() {
  const { t } = useTranslation();
  return useCallback((k, d, o = {}) => t(`tests.${k}`, { defaultValue: d, ...o }), [t]);
}

function RulesList({ test, accommodations }) {
  const tt = useTT();
  const r = test.rules;
  const when = (iso) => new Date(iso).toLocaleString(undefined, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  const lines = [];
  lines.push(tt("intro.questions", "{{count}} questions", { count: test.questionCount }));
  if (r.timeLimit === "total") lines.push(tt("intro.total", "You have {{m}} minutes. The clock keeps going if you leave.", { m: Math.round(r.totalMinutes * (accommodations?.extraTime || 1)) }));
  else if (r.timeLimit === "per_question") lines.push(tt("intro.perQ", "{{s}} seconds for each question. You can't go back.", { s: Math.round(r.perQuestionSeconds * (accommodations?.extraTime || 1)) }));
  else lines.push(tt("intro.noLimit", "No time limit. Take your time."));
  if (r.closesAt && !r.alwaysOpen) lines.push(tt("intro.closes", "Hand it in before {{when}}.", { when: when(r.closesAt) }));
  lines.push(r.attempts === 0 ? tt("intro.unlimited", "You can try as many times as you like.") : r.attempts === 1 ? tt("intro.once", "You get one go.") : tt("intro.tries", "You get {{n}} tries. Your {{which}} score counts.", { n: r.attempts, which: tt(`intro.count_${r.counts}`, r.counts) }));
  lines.push(r.feedback === "immediate" ? tt("intro.fbNow", "You'll see if you're right after each question.") : r.feedback === "after_submit" ? tt("intro.fbSubmit", "You'll see how you did when you hand it in.") : r.feedback === "after_close" ? tt("intro.fbClose", "You'll see how you did after the test closes.") : tt("intro.fbNever", "Your teacher will share your score."));
  lines.push(r.hints ? tt("intro.hints", "Hints are on.") : tt("intro.noHints", "No hints this time."));
  if (r.listen) lines.push(tt("intro.listen", "You can listen to every question."));
  if (r.aiTeacherLocked) lines.push(tt("intro.ai", "The AI Teacher takes a rest during this test."));
  if (accommodations?.extraTime > 1) lines.push(tt("intro.extra", "You have extra time (×{{m}}).", { m: accommodations.extraTime }));
  if (accommodations?.readAloud) lines.push(tt("intro.read", "Questions are read aloud for you."));
  if (r.integrity?.logTabSwitches || r.integrity?.logPaste) lines.push(tt("intro.integrity", "Your teacher can see if you leave this page."));
  return <ul className={s.rules}>{lines.map((l) => <li key={l}>{l}</li>)}</ul>;
}

function ResultView({ attempt, test }) {
  const tt = useTT();
  const res = attempt.result;
  return (
    <div className={s.panel}>
      <div className={s.doneIcon} aria-hidden="true">{res?.passed ? "🌟" : "🎉"}</div>
      <h1 className={s.h1}>{tt("done.title", "Handed in. Well done!")}</h1>
      {res ? (
        <>
          <p className={s.big}>{res.needsMarking ? tt("done.partial", "{{score}} points so far", { score: res.score }) : `${res.percent} %`}</p>
          <p className={s.lead}>{res.needsMarking ? tt("done.marking", "Your teacher is still marking some answers.") : res.passed ? tt("done.passed", "You passed. Great work!") : tt("done.keepGoing", "Keep practising: you're getting there.")}</p>
          {attempt.items.some((i) => i.result?.correct !== undefined) && (
            <ol className={s.reviewList}>
              {attempt.items.map((it, i) => (
                <li key={it.id} className={s.reviewItem}>
                  <span className={`${s.dot} ${it.result?.needsMarking ? s.dotWait : it.result?.correct ? s.dotGood : s.dotBad}`} aria-hidden="true">{it.result?.correct ? "✓" : it.result?.needsMarking ? "…" : "✗"}</span>
                  <span>{i + 1}. {it.instruction}</span>
                  <span className={s.srOnly}>{it.result?.needsMarking ? tt("done.toMark", "being marked") : it.result?.correct ? tt("done.right", "right") : tt("done.wrong", "not right")}</span>
                  {it.result?.comment && <span className={s.comment}>💬 {it.result.comment}</span>}
                </li>
              ))}
            </ol>
          )}
        </>
      ) : (
        <p className={s.lead}>{test?.rules?.feedback === "after_close" ? tt("done.afterClose", "Your teacher will share results after the test closes.") : tt("done.later", "Your teacher will share your result soon.")}</p>
      )}
      <div className={s.actionsRow}><Link to="/home" className={s.primary}><FaHome aria-hidden="true" /> {tt("done.home", "Back home")}</Link></div>
    </div>
  );
}

export default function TestPlayer() {
  const { id } = useParams();
  const { user } = useAuth();
  const tt = useTT();
  const [intro, setIntro] = useState(null);
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(null);
  const [idx, setIdx] = useState(0);
  const [values, setValues] = useState({});
  const [results, setResults] = useState({});
  const [status, setStatus] = useState("saved");
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [opened, setOpened] = useState({});
  const [confirm, setConfirm] = useState(false);
  const [hintsUsed, setHintsUsed] = useState({});
  const timers = useRef({});
  const submitting = useRef(false);
  const shownAt = useRef(0);

  const items = useMemo(() => attempt?.items || [], [attempt]);
  const attemptId = attempt?._id;
  const cur = items[idx];
  const rules = attempt?.rules || {};
  const acc = attempt?.accommodations || intro?.accommodations || {};

  // ── load / start ──
  const loadIntro = useCallback(async () => {
    const r = await sget(`/tests/${id}`);
    if (!r.ok) { setError(r.status === 401 ? "login" : r.message || tt("err.notFound", "We couldn't find this test.")); setPhase("error"); return; }
    setIntro(r);
    setPhase("intro");
  }, [id, tt]);
  useEffect(() => {
    Promise.resolve().then(() => { if (user) loadIntro(); else if (user === null) { setError("login"); setPhase("error"); } });
  }, [user, loadIntro]);

  const enter = useCallback((a) => {
    setAttempt(a);
    setOffset(new Date(a.serverNow).getTime() - Date.now());
    const v = {}, res = {}, op = {};
    a.items.forEach((it) => { if (it.response != null) v[it.id] = it.response; if (it.result) res[it.id] = it.result; if (it.openedAt) op[it.id] = it.openedAt; });
    Object.assign(v, readPending(a._id));
    setValues(v); setResults(res); setOpened(op);
    if (a.status !== "in_progress") { setPhase("done"); return; }
    const firstOpen = a.perQuestionMs ? a.currentIndex || 0 : Math.max(0, a.items.findIndex((it) => !it.answered));
    setIdx(firstOpen === -1 ? 0 : firstOpen);
    setPhase("playing");
  }, []);

  const start = async () => {
    setError("");
    if (rules?.integrity?.fullscreen || intro?.test?.rules?.integrity?.fullscreen) document.documentElement.requestFullscreen?.().catch(() => {});
    const r = await spost(`/tests/${id}/start`);
    if (!r.ok) { setError(r.message || tt("err.start", "We couldn't start the test.")); return; }
    enter(r.attempt);
  };
  const openPast = async (attemptId) => {
    const r = await sget(`/attempts/${attemptId}`);
    if (r.ok) { setAttempt(r.attempt); setPhase("done"); }
  };

  const finish = useCallback(async (a) => {
    if (a) { setAttempt(a); writePending(a._id, {}); setPhase("done"); return; }
    const r = await sget(`/attempts/${attemptId}`);
    if (r.ok) { setAttempt(r.attempt); setPhase("done"); }
  }, [attemptId]);

  // ── opening a question (per-question clocks start here) ──
  useEffect(() => {
    if (phase !== "playing" || !cur) return;
    shownAt.current = Date.now();
    (async () => {
      const r = await spost(`/attempts/${attempt._id}/open`, { itemId: cur.id });
      if (r.ok) setOpened((o) => (o[cur.id] ? o : { ...o, [cur.id]: r.openedAt }));
      else if (r.code === "TIME_UP" || r.code === "FINISHED") finish(r.attempt);
    })();
  }, [phase, cur?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── saving ──

  const send = useCallback(async (itemId, response, extra = {}) => {
    setStatus("saving");
    const r = await sput(`/attempts/${attemptId}/items/${encodeURIComponent(itemId)}`, { response, timeMs: Date.now() - shownAt.current, hintsUsed: hintsUsed[itemId] || 0, ...extra });
    if (r.offline) {
      writePending(attemptId, { ...readPending(attemptId), [itemId]: response });
      setStatus("offline");
      return null;
    }
    const pend = readPending(attemptId);
    delete pend[itemId];
    writePending(attemptId, pend);
    if (r.ok) { setStatus("saved"); if (r.result) setResults((x) => ({ ...x, [itemId]: r.result })); return r; }
    if (r.code === "TIME_UP" || r.code === "FINISHED") { finish(r.attempt); return null; }
    if (r.code === "QUESTION_TIME_UP") { setStatus("saved"); return null; }
    setStatus("error");
    return null;
  }, [attemptId, hintsUsed, finish]);

  const onChange = (value) => {
    if (!cur) return;
    setValues((v) => ({ ...v, [cur.id]: value }));
    if (rules.feedback === "immediate") return; // saved on "Check"
    clearTimeout(timers.current[cur.id]);
    const wait = ["typed_short", "typed_long"].includes(cur.interaction) ? 700 : 150;
    const itemId = cur.id;
    timers.current[itemId] = setTimeout(() => send(itemId, value), wait);
  };

  // Flush answers kept on the device when the connection comes back.
  useEffect(() => {
    if (phase !== "playing" || !attempt) return;
    const flush = async () => {
      const pend = readPending(attempt._id);
      for (const [itemId, response] of Object.entries(pend)) await send(itemId, response);
    };
    window.addEventListener("online", flush);
    const iv = setInterval(() => { if (Object.keys(readPending(attempt._id)).length) flush(); }, 8000);
    flush();
    return () => { window.removeEventListener("online", flush); clearInterval(iv); };
  }, [phase, attempt, send]);

  // ── clock ──
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [phase]);
  const serverNow = now + offset;
  const totalLeft = attempt?.deadlineAt ? new Date(attempt.deadlineAt).getTime() - serverNow : null;
  const qLeft = attempt?.perQuestionMs && cur && opened[cur.id] ? new Date(opened[cur.id]).getTime() + attempt.perQuestionMs - serverNow : null;

  const submit = useCallback(async () => {
    if (submitting.current || !attempt) return;
    submitting.current = true;
    Object.values(timers.current).forEach(clearTimeout);
    const pend = readPending(attempt._id);
    for (const [itemId, response] of Object.entries(pend)) await send(itemId, response);
    if (cur && rules.feedback !== "immediate" && values[cur.id] !== undefined) await send(cur.id, values[cur.id]);
    const r = await spost(`/attempts/${attempt._id}/submit`);
    submitting.current = false;
    if (r.ok) finish(r.attempt);
    else { setStatus(r.offline ? "offline" : "error"); setConfirm(false); }
  }, [attempt, send, finish, cur, values, rules.feedback]);

  const timeUp = phase === "playing" && totalLeft !== null && totalLeft <= 0;
  useEffect(() => { if (timeUp) Promise.resolve().then(submit); }, [timeUp, submit]);
  const questionUp = phase === "playing" && qLeft !== null && qLeft <= 0;
  useEffect(() => {
    if (!questionUp) return;
    Promise.resolve().then(() => { if (idx < items.length - 1) setIdx((i) => i + 1); else submit(); });
  }, [questionUp, idx, items.length, submit]);

  // ── light integrity log (never penalised) ──
  useEffect(() => {
    if (phase !== "playing" || !attempt) return;
    const integ = attempt.rules.integrity || {};
    const log = (type) => spost(`/attempts/${attempt._id}/events`, { type, itemId: cur?.id });
    const vis = () => { if (document.visibilityState === "hidden" && integ.logTabSwitches) log("tab_hidden"); };
    const paste = () => { if (integ.logPaste) log("paste"); };
    const fs = () => { if (!document.fullscreenElement && integ.fullscreen) log("fullscreen_exit"); };
    document.addEventListener("visibilitychange", vis);
    document.addEventListener("paste", paste);
    document.addEventListener("fullscreenchange", fs);
    return () => { document.removeEventListener("visibilitychange", vis); document.removeEventListener("paste", paste); document.removeEventListener("fullscreenchange", fs); };
  }, [phase, attempt, cur?.id]);

  const answeredCount = useMemo(() => items.filter((it) => answered(values[it.id])).length, [items, values]);
  const perQ = !!attempt?.perQuestionMs;
  const immediate = rules.feedback === "immediate";
  const locked = cur && (results[cur.id] && immediate);
  const stars = Object.values(results).filter((r) => r.correct).length;

  // ── render ──
  if (phase === "loading") return <div className={s.page}><div className={s.panel}><p className={s.lead}>{tt("loading", "Getting your test ready…")}</p></div></div>;
  if (phase === "error") return (
    <div className={s.page}><div className={s.panel}>
      <h1 className={s.h1}>{error === "login" ? tt("err.loginTitle", "Please sign in") : tt("err.title", "Hmm, that didn't work")}</h1>
      <p className={s.lead}>{error === "login" ? tt("err.login", "Sign in to see your tests.") : error}</p>
      <div className={s.actionsRow}><Link className={s.primary} to={error === "login" ? "/login?role=student" : "/home"}>{error === "login" ? tt("err.signIn", "Sign in") : tt("done.home", "Back home")}</Link></div>
    </div></div>
  );
  if (phase === "done") return <div className={s.page}><ResultView attempt={attempt} test={intro?.test} /></div>;

  if (phase === "intro") {
    const t = intro.test;
    const target = t.target;
    return (
      <div className={s.page}>
        <div className={s.panel}>
          <p className={s.kicker}>{t.kind === "practice" ? tt("intro.practice", "Practice") : tt("intro.test", "Test")}{t.teacher ? ` · ${t.teacher}` : ""}</p>
          <h1 className={s.h1}>{t.title}</h1>
          {t.description && <p className={s.lead}>{t.description}</p>}
          {target?.module && <p className={s.lead}>{tt("intro.target", "Practise {{module}} · {{subject}} for {{m}} minutes this week.", { module: target.module, subject: target.subject || "", m: target.minutes || "" })} <Link to={`/module/${target.module}/${target.subject || "english"}`}>{tt("intro.go", "Go")}</Link></p>}
          {t.questionCount > 0 && <RulesList test={t} accommodations={intro.accommodations} />}
          {error && <p className={s.error} role="alert">{error}</p>}
          <div className={s.actionsRow}>
            {intro.canStart && t.questionCount > 0 && <button type="button" className={s.primary} onClick={start}>{intro.inProgressId ? tt("intro.resume", "Carry on") : intro.attemptsUsed ? tt("intro.again", "Try again") : tt("intro.start", "Start")} <FaArrowRight aria-hidden="true" /></button>}
            {!intro.canStart && intro.phase === "upcoming" && <p className={s.lead}>{tt("intro.notYet", "This opens on {{when}}.", { when: new Date(t.rules.opensAt).toLocaleString() })}</p>}
            {!intro.canStart && intro.phase === "closed" && !intro.attemptsUsed && <p className={s.lead}>{tt("intro.closed", "This test has closed.")}</p>}
            <Link to="/home" className={s.secondary}>{tt("intro.later", "Not now")}</Link>
          </div>
          {intro.attempts.length > 0 && (
            <div className={s.past}>
              <h2 className={s.h2}>{tt("intro.yourTries", "Your tries")}</h2>
              <ul className={s.rules}>
                {intro.attempts.map((a) => (
                  <li key={a._id}>{tt("intro.tryN", "Try {{n}}", { n: a.attemptNo })}: {a.released ? <button type="button" className={s.linkBtn} onClick={() => openPast(a._id)}>{a.percent} % · {tt("intro.see", "see answers")}</button> : tt("intro.waiting", "waiting for your teacher")}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // playing
  const go = (i) => { if (i < 0 || i >= items.length || (perQ && i < idx)) return; setIdx(i); };
  const check = async () => { if (cur && answered(values[cur.id])) await send(cur.id, values[cur.id], { check: true }); };
  const statusText = { saving: tt("save.saving", "Saving…"), saved: tt("save.saved", "Saved"), offline: tt("save.offline", "No connection: saved on this device"), error: tt("save.error", "Not saved, try again") }[status];

  return (
    <div className={`${s.page} ${s.playing}`}>
      <header className={s.top}>
        <Link to="/home" className={s.leave} aria-label={tt("play.leaveLabel", "Leave for now (your answers are saved)")}><FaArrowLeft aria-hidden="true" /> <span className={s.hideSm}>{tt("play.leave", "Leave for now")}</span></Link>
        <div className={s.topTitle}>{intro?.test?.title}</div>
        <div className={s.topRight}>
          {rules.style === "warrior" && immediate && <span className={s.stars} aria-label={tt("play.stars", "{{n}} stars", { n: stars })}><FaStar aria-hidden="true" /> {stars}</span>}
          {totalLeft !== null && <span className={`${s.timer} ${totalLeft < 60000 ? s.timerLow : ""}`} role="timer" aria-label={tt("play.timeLeft", "Time left {{t}}", { t: mmss(totalLeft) })}><FaClock aria-hidden="true" /> {mmss(totalLeft)}</span>}
          <span className={`${s.save} ${status === "offline" ? s.saveOff : ""}`} role="status">{status === "offline" && <FaWifi aria-hidden="true" />} {statusText}</span>
        </div>
      </header>
      <div className={s.progressWrap}>
        <div className={s.progress} role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={answeredCount} aria-label={tt("play.progress", "{{a}} of {{t}} answered", { a: answeredCount, t: items.length })}>
          <span style={{ width: `${(answeredCount / Math.max(1, items.length)) * 100}%` }} />
        </div>
        <span className={s.count}>{tt("play.qOf", "Question {{n}} of {{t}}", { n: idx + 1, t: items.length })}</span>
      </div>
      {cur?.sectionTitle && <p className={s.section}>{cur.sectionTitle}</p>}
      {qLeft !== null && <p className={`${s.qTimer} ${qLeft < 10000 ? s.timerLow : ""}`} role="timer">{tt("play.qLeft", "{{t}} left for this question", { t: mmss(qLeft) })}</p>}

      <main className={s.stage}>
        {cur && (
          <TestQuestion
            key={cur.id}
            item={cur}
            subject={cur.subject || "english"}
            value={values[cur.id]}
            onChange={onChange}
            disabled={!!locked}
            result={immediate ? results[cur.id] : null}
            hints={rules.hints}
            listen={rules.listen || acc.readAloud}
            autoRead={!!acc.readAloud}
            largeText={!!acc.largerText}
            onHint={() => setHintsUsed((h) => ({ ...h, [cur.id]: (h[cur.id] || 0) + 1 }))}
          />
        )}
      </main>

      <nav className={s.nav} aria-label={tt("play.nav", "Questions")}>
        {!perQ && <button type="button" className={s.secondary} onClick={() => go(idx - 1)} disabled={idx === 0}><FaArrowLeft aria-hidden="true" /> {tt("play.back", "Back")}</button>}
        {immediate && !locked && <button type="button" className={s.primary} onClick={check} disabled={!answered(values[cur?.id])}><FaCheck aria-hidden="true" /> {tt("play.check", "Check")}</button>}
        {idx < items.length - 1 ? (
          <button type="button" className={immediate && !locked ? s.secondary : s.primary} onClick={() => go(idx + 1)}>{tt("play.next", "Next")} <FaArrowRight aria-hidden="true" /></button>
        ) : (
          <button type="button" className={s.primary} onClick={() => setConfirm(true)}><FaPaperPlane aria-hidden="true" /> {tt("play.finish", "Finish")}</button>
        )}
      </nav>
      {!perQ && items.length > 1 && (
        <div className={s.dots} role="list" aria-label={tt("play.jump", "Jump to a question")}>
          {items.map((it, i) => (
            <button key={it.id} type="button" role="listitem" className={`${s.qdot} ${answered(values[it.id]) ? s.qdotDone : ""} ${i === idx ? s.qdotCur : ""}`} onClick={() => go(i)} aria-label={tt("play.jumpTo", "Question {{n}}{{done}}", { n: i + 1, done: answered(values[it.id]) ? `, ${tt("play.answered", "answered")}` : "" })} aria-current={i === idx ? "step" : undefined}>{i + 1}</button>
          ))}
        </div>
      )}

      {confirm && (
        <div className={s.modalBack} role="presentation" onClick={() => setConfirm(false)}>
          <div className={s.modal} role="dialog" aria-modal="true" aria-labelledby="confirm-h" onClick={(e) => e.stopPropagation()}>
            <h2 id="confirm-h" className={s.h2}>{tt("confirm.title", "Ready to hand it in?")}</h2>
            <p className={s.lead}>{answeredCount === items.length ? tt("confirm.all", "You answered every question.") : tt("confirm.some", "You answered {{a}} of {{t}}. You can go back and finish the rest, or hand it in now.", { a: answeredCount, t: items.length })}</p>
            <div className={s.actionsRow}>
              <button type="button" className={s.secondary} onClick={() => setConfirm(false)} autoFocus>{tt("confirm.back", "Go back")}</button>
              <button type="button" className={s.primary} onClick={submit}><FaPaperPlane aria-hidden="true" /> {tt("confirm.go", "Hand it in")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
