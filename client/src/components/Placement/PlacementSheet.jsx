import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { FaCompass, FaListOl, FaSeedling, FaArrowLeft, FaArrowRight, FaTimes, FaCheck } from "react-icons/fa";
import Mascot from "../Mascot/Mascot";
import QuestionCard from "../QuestionCard/QuestionCard";
import { sfx } from "../../utils/sounds";
import { narrate, stopNarration } from "../../utils/narrator";
import { getSpeechLang } from "../../utils/speechLang";
import { getQuestionLang } from "../../utils/questionLang";
import { holdClock } from "../settings/comfortEvents";
import { logDashboardAnswer } from "../../store/slices/dashboardSlice";
import {
  chooseLevel, fetchBaseline, sendBaseline, placeLocally, markPlacementSeen, signedIn, fetchLearnProfile,
} from "./placementApi";
import { levelText, MAX_LEVEL } from "./levels";
import styles from "./PlacementSheet.module.css";

/**
 * "Where would you like to start?" — offered the first time a learner opens a
 * subject. Three ways, all optional:
 *  - Find my level (about 2 minutes): one question per level, easiest first,
 *    stopping after two misses or whenever the learner likes (POST /api/learn/baseline);
 *  - Choose my level: levels 0-8 described in plain words (never ages);
 *  - Start from the beginning.
 * "Not now" skips it. Never framed as a test of how clever anyone is.
 *
 *   {open && <PlacementSheet subject="maths" module="write" onDone={() => go()} onClose={() => setOpen(false)} />}
 * onDone(level|null) is called when the learner is ready to play.
 */
export default function PlacementSheet({ subject, module = "read", onDone, onClose }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const titleId = useId();
  const [step, setStep] = useState("intro"); // intro | choose | check | done | locked
  const [picked, setPicked] = useState(null);
  const [ceiling, setCeiling] = useState(5); // levels 0-5 have questions today; the profile says when there are more
  const [items, setItems] = useState(null);
  const [idx, setIdx] = useState(0);
  const [level, setLevel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [canCheck, setCanCheck] = useState(signedIn());
  const results = useRef([]);
  const misses = useRef(0);
  const [missCount, setMissCount] = useState(0);
  const panelRef = useRef(null);
  const subjectName = t(`subjectPage.${subject}.label`, { defaultValue: subject });

  // The level list stops where there are questions (the profile's ceiling).
  useEffect(() => {
    let alive = true;
    fetchLearnProfile().then((data) => {
      if (!alive) return;
      const c = data?.profile?.levels?.[subject]?.ceiling;
      if (Number.isInteger(c) && c >= 0) setCeiling(Math.min(MAX_LEVEL, c));
      if (!data) setCanCheck(false);
    });
    return () => { alive = false; };
  }, [subject]);

  const finish = (lv) => { stopNarration(); onDone?.(lv); };
  const skip = () => { sfx.close(); stopNarration(); markPlacementSeen(subject); onClose?.(); };

  // Warrior clocks wait; the teacher says hello; Escape closes.
  useEffect(() => {
    holdClock("placement", true);
    sfx.open();
    const id = setTimeout(() => narrate(t("placement.say", { defaultValue: "Where would you like to start in {{subject}}? You can change it any time.", subject: subjectName }), { lang: getSpeechLang(i18n.language || "en") }), 400);
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); skip(); } };
    window.addEventListener("keydown", onKey, true);
    panelRef.current?.querySelector("button")?.focus({ preventScroll: true });
    return () => {
      clearTimeout(id);
      holdClock("placement", false);
      window.removeEventListener("keydown", onKey, true);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const startFromBeginning = async () => {
    setBusy(true);
    const r = await chooseLevel(subject, 0);
    setBusy(false);
    if (r.locked) { setStep("locked"); return; }
    finish(0);
  };

  const confirmChoice = async () => {
    if (picked == null) return;
    setBusy(true);
    const r = await chooseLevel(subject, picked);
    setBusy(false);
    if (r.locked) { setStep("locked"); return; }
    setLevel(picked);
    finish(picked);
  };

  const startCheck = async () => {
    setBusy(true);
    // Speaking needs a microphone: the check-in listens instead.
    const list = await fetchBaseline(subject, module === "speak" ? "listen" : module, getQuestionLang(i18n.language));
    setBusy(false);
    if (!list) { setCanCheck(false); setStep("choose"); return; }
    results.current = [];
    misses.current = 0;
    setMissCount(0);
    setItems(list);
    setIdx(0);
    setStep("check");
  };

  const endCheck = async () => {
    setBusy(true);
    const out = await sendBaseline(subject, results.current.map(({ questionId, level: lv, status }) => ({ questionId, level: lv, status })));
    setBusy(false);
    if (out?.error === 409) { setStep("locked"); return; }
    const lv = Number.isInteger(out?.level) ? out.level : placeLocally(results.current);
    setLevel(lv);
    setStep("done");
    sfx.levelUp();
    narrate(t("placement.doneSay", { defaultValue: "Thank you! We'll start you at level {{level}}.", level: lv }), { lang: getSpeechLang(i18n.language || "en") });
  };

  const onAnswered = (o) => {
    const q = items[idx];
    // A check-in counts the first try: help is welcome, but then it's practice.
    const status = o.status === "correct" && o.firstTry && !o.hintsUsed ? "correct" : o.status === "uncertain" || o.status === "ungraded" ? o.status : "incorrect";
    results.current.push({ questionId: q.id, level: Number.isFinite(q.level) ? q.level : idx, status });
    // Kept in the learner's history as a check-in (mode "baseline": never counted for mastery).
    if (signedIn()) {
      dispatch(logDashboardAnswer({
        module: module === "speak" ? "listen" : module, subject,
        question: q.instruction || q.prompt || "", userAnswer: typeof o.userAnswer === "string" ? o.userAnswer : JSON.stringify(o.userAnswer ?? ""),
        correctAnswer: typeof q.correct_answer === "string" ? q.correct_answer : JSON.stringify(q.correct_answer ?? ""),
        correct: Boolean(o.correct), xpEarned: 0, timeTaken: o.timeTaken, mode: "baseline",
        questionId: q.id, status: o.status, firstTry: o.firstTry, hintsUsed: o.hintsUsed || 0,
        uncertain: o.status === "uncertain", ...(o.reason ? { reason: o.reason } : {}), timedOut: false,
      }));
    }
    if (status === "incorrect") { misses.current += 1; setMissCount(misses.current); }
  };
  const onNext = () => {
    if (misses.current >= 2 || idx >= items.length - 1) endCheck();
    else setIdx((i) => i + 1);
  };

  const levels = Array.from({ length: ceiling + 1 }, (_, i) => i);

  let body;
  if (step === "intro") {
    body = (
      <>
        <div className={styles.head}>
          <Mascot size={72} mood="wave" butterfly={false} />
          <div>
            <h2 id={titleId} className={styles.title}>{t("placement.title", { defaultValue: "Where would you like to start in {{subject}}?", subject: subjectName })}</h2>
            <p className={styles.lead}>{t("placement.lead", "It's not a test. It just helps us choose questions that feel right. You can change it any time.")}</p>
          </div>
        </div>
        <div className={styles.options}>
          {canCheck && (
            <button type="button" className={styles.option} onClick={startCheck} disabled={busy} data-hover-sound="" data-sound="select">
              <FaCompass className={styles.optIcon} aria-hidden="true" />
              <span className={styles.optText}>
                <span className={styles.optTitle}>{t("placement.find", "Find my level")}</span>
                <span className={styles.optHelp}>{t("placement.findHelp", "About 2 minutes: a few questions from easy to harder. Stop whenever you like.")}</span>
              </span>
            </button>
          )}
          <button type="button" className={styles.option} onClick={() => setStep("choose")} disabled={busy} data-hover-sound="" data-sound="select">
            <FaListOl className={styles.optIcon} aria-hidden="true" />
            <span className={styles.optText}>
              <span className={styles.optTitle}>{t("placement.choose", "Choose my level")}</span>
              <span className={styles.optHelp}>{t("placement.chooseHelp", "Pick from a list of what each level is about.")}</span>
            </span>
          </button>
          <button type="button" className={styles.option} onClick={startFromBeginning} disabled={busy} data-hover-sound="" data-sound="select">
            <FaSeedling className={styles.optIcon} aria-hidden="true" />
            <span className={styles.optText}>
              <span className={styles.optTitle}>{t("placement.beginning", "Start from the beginning")}</span>
              <span className={styles.optHelp}>{t("placement.beginningHelp", "Begin with the first steps and move up as you go.")}</span>
            </span>
          </button>
        </div>
        <button type="button" className={styles.link} onClick={skip} data-sound="none">{t("placement.notNow", "Not now, just play")}</button>
      </>
    );
  } else if (step === "choose") {
    body = (
      <>
        <h2 id={titleId} className={styles.title}>{t("placement.chooseTitle", "Choose where to start")}</h2>
        <p className={styles.lead}>{t("placement.chooseLead", "Levels are steps, not ages. If it feels too easy or too hard, you'll move.")}</p>
        <div className={styles.levelList} role="radiogroup" aria-labelledby={titleId}>
          {levels.map((lv) => (
            <label key={lv} className={`${styles.level} ${picked === lv ? styles.levelOn : ""}`} data-hover-sound="">
              <input type="radio" name={`${titleId}-level`} className={styles.radio} checked={picked === lv} onChange={() => setPicked(lv)} />
              <span className={styles.levelNum}>{lv}</span>
              <span className={styles.levelText}>{levelText(t, subject, lv)}</span>
              {picked === lv && <FaCheck className={styles.levelCheck} aria-hidden="true" />}
            </label>
          ))}
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => setStep("intro")} data-sound="back"><FaArrowLeft aria-hidden="true" /> {t("placement.back", "Back")}</button>
          <button type="button" className={styles.primary} onClick={confirmChoice} disabled={picked == null || busy} data-sound="forward">
            {t("placement.startHere", "Start here")} <FaArrowRight aria-hidden="true" />
          </button>
        </div>
      </>
    );
  } else if (step === "check" && items) {
    body = (
      <>
        <div className={styles.checkHead}>
          <h2 id={titleId} className={styles.titleSmall}>{t("placement.checkTitle", { defaultValue: "Finding your level: {{n}} of {{total}}", n: idx + 1, total: items.length })}</h2>
          <button type="button" className={styles.secondary} onClick={endCheck} disabled={busy} data-sound="close">{t("placement.stopHere", "Stop here")}</button>
        </div>
        <div className={styles.arena}>
          <QuestionCard
            key={items[idx].id || idx}
            question={items[idx]}
            subject={subject}
            module={module === "speak" ? "listen" : module}
            onAnswered={onAnswered}
            onNext={onNext}
            isLast={missCount >= 2 || idx >= items.length - 1}
            oneTry
          />
        </div>
      </>
    );
  } else if (step === "done") {
    body = (
      <>
        <div className={styles.head}>
          <Mascot size={84} mood="cheer" butterfly={false} />
          <div>
            <h2 id={titleId} className={styles.title}>{t("placement.doneTitle", { defaultValue: "We'll start you at level {{level}}", level })}</h2>
            <p className={styles.lead}>{levelText(t, subject, level)}</p>
            <p className={styles.note}>{t("placement.doneNote", "Thank you for trying those. Your level moves with you as you practise.")}</p>
          </div>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => setStep("choose")} data-sound="tap">{t("placement.changeIt", "Choose a different level")}</button>
          <button type="button" className={styles.primary} onClick={() => finish(level)} data-sound="forward" autoFocus>{t("placement.letsGo", "Let's go")} <FaArrowRight aria-hidden="true" /></button>
        </div>
      </>
    );
  } else {
    body = (
      <>
        <h2 id={titleId} className={styles.title}>{t("placement.lockedTitle", "Your level is already set")}</h2>
        <p className={styles.lead}>{t("placement.lockedLead", "A grown-up or teacher has chosen where you start in this subject. Let's play!")}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => finish(null)} data-sound="forward" autoFocus>{t("placement.letsGo", "Let's go")} <FaArrowRight aria-hidden="true" /></button>
        </div>
      </>
    );
  }

  return createPortal(
    <div className={styles.backdrop} onMouseDown={(e) => { if (e.target === e.currentTarget && step !== "check") skip(); }}>
      <div ref={panelRef} className={`${styles.panel} ${step === "check" ? styles.panelWide : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button type="button" className={styles.close} onClick={skip} aria-label={t("placement.close", "Close")} data-sound="none"><FaTimes aria-hidden="true" /></button>
        {body}
      </div>
    </div>,
    document.body,
  );
}
