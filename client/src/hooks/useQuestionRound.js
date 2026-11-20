import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchQuestions, resetQuestions, selectQuestionState } from "../store/slices/questionsSlice";
import { logDashboardSession, logDashboardAnswer, logRoundResult } from "../store/slices/dashboardSlice";
import { getQuestionLang } from "../utils/questionLang";
import { getWarriorBonus } from "../utils/warriorBonus";
import { onNarration, isNarrating } from "../utils/narrator";
import { usePrefs } from "../components/settings/usePrefs";
import { HOLD_CLOCK_EVENT } from "../components/settings/comfortEvents";

const describe = (v) => (typeof v === "string" ? v : JSON.stringify(v ?? ""));

// The Warrior clock follows the learner's "Warrior clock" setting: normal,
// more time (double), or no clock at all.
const CLOCK_FACTOR = { on: 1, relaxed: 2, off: 0 };

// Shared fetch/round/warrior/dashboard-logging state for all four question
// module pages. Each page only supplies {module, subject} and renders its own
// chrome around the returned state.
//
// Rounds come from the learning engine (/api/learn/round: the learner's level,
// reviews due, the support strategy per item) for a signed-in learner, or the
// question bank (10 at random) otherwise (store/slices/questionsSlice.js).
export function useQuestionRound({ module, subject, warriorSeconds: baseSeconds = 30 }) {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const prefs = usePrefs();
  const { questions: data, status, noOrgQuestions, adaptive, lang: roundLang } = useSelector((s) => selectQuestionState(s, module, subject));
  const clockFactor = CLOCK_FACTOR[prefs.timer] ?? 1;
  const warriorSeconds = Math.round(baseSeconds * (clockFactor || 1));
  const noClock = clockFactor === 0;
  // "Practise now" links from the dashboards name a skill (?skill=<id>).
  const [searchParams] = useSearchParams();
  const focusSkill = (searchParams.get("skill") || "").slice(0, 120) || undefined;

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchQuestions({ module, subject, lang: getQuestionLang(i18n.language), skill: focusSkill }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, subject, status, dispatch]);

  // Arriving with a skill while an older round is cached: fetch the focused one.
  useEffect(() => {
    if (!focusSkill || status === "idle") return;
    dispatch(resetQuestions({ module, subject }));
    dispatch(fetchQuestions({ module, subject, lang: getQuestionLang(i18n.language), skill: focusSkill }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSkill]);

  // A new language means translated questions: fetch again, but only when the
  // round on hand is in another language (not on a first load, which the
  // effect above covers: two fetches at once could swap the round mid-question).
  useEffect(() => {
    if (subject === "english" || status === "idle") return;
    if ((roundLang ?? null) === getQuestionLang(i18n.language)) return;
    dispatch(resetQuestions({ module, subject }));
    dispatch(fetchQuestions({ module, subject, lang: getQuestionLang(i18n.language), skill: focusSkill }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const [mode, setModeState] = useState("practice");
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(warriorSeconds);
  // Warrior clock state: the child can pause it, it stops by itself while the
  // tab is hidden, while the teacher is reading, and while a settings sheet or
  // a break reminder is open; when it runs out the question shows "time's up"
  // for a moment before the round moves on (rather than jumping without a word).
  const [userPaused, setUserPaused] = useState(false);
  const [pageHidden, setPageHidden] = useState(() => typeof document !== "undefined" && document.hidden);
  const [voiceBusy, setVoiceBusy] = useState(() => isNarrating());
  const [holds, setHolds] = useState(() => new Set());
  const [timedOut, setTimedOut] = useState(false);
  const [roundDone, setRoundDone] = useState(false);
  const [roundResult, setRoundResult] = useState({ stars: 0, bonusStars: 0 });
  const [totalScore, setTotalScore] = useState(0);
  // The server's reply per question (personal message, level change).
  const [learnById, setLearnById] = useState({});

  const roundStarsRef = useRef(0);
  const roundBonusRef = useRef(0);
  const questionStartRef = useRef(new Date().toISOString());

  const current = data[idx];

  // Reset per-question state when `idx` changes. Done during render (React's
  // recommended "adjusting state when a prop changes" pattern) rather than in
  // an effect, so there's no stale-state frame between questions.
  const [prevIdx, setPrevIdx] = useState(idx);
  if (idx !== prevIdx) {
    setPrevIdx(idx);
    setAnswered(false);
    setTimeLeft(warriorSeconds);
    setTimedOut(false);
    setUserPaused(false);
  }

  useEffect(() => {
    const onVis = () => setPageHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // The clock never runs while the teacher is speaking.
  useEffect(() => onNarration((e) => {
    if (e.type === "start" || e.type === "sentence" || e.type === "resume") setVoiceBusy(true);
    else if (e.type === "end") setVoiceBusy(false);
  }), []);

  // ...nor while the Comfort settings sheet or a break reminder is open.
  useEffect(() => {
    const onHold = (e) => {
      const { source, on } = e.detail || {};
      setHolds((h) => {
        const next = new Set(h);
        if (on) next.add(source); else next.delete(source);
        return next;
      });
    };
    window.addEventListener(HOLD_CLOCK_EVENT, onHold);
    return () => window.removeEventListener(HOLD_CLOCK_EVENT, onHold);
  }, []);

  useEffect(() => {
    questionStartRef.current = new Date().toISOString();
  }, [idx]);

  const finishRound = () => {
    const s = roundStarsRef.current;
    const b = roundBonusRef.current;
    dispatch(logRoundResult({
      module, subject: subject || "general", mode,
      stars: s, bonusStars: b, totalStars: s + b,
      passed: mode === "warrior" ? s >= 6 : undefined,
    }));
    setRoundResult({ stars: s, bonusStars: b });
    setRoundDone(true);
  };

  const advance = () => {
    if (idx >= data.length - 1) finishRound();
    else setIdx((i) => i + 1);
  };

  /**
   * One answered question (QuestionCard's outcome):
   * { status, correct, timeTaken, userAnswer, firstTry, hintsUsed, supportStep, misconception, uncertain, reason }
   * Older callers pass (correct, timeTaken, userAnswer).
   */
  const recordAnswer = (outcomeOrCorrect, timeTakenArg, userAnswerArg) => {
    if (timedOut) return; // too late: the clock already ran out on this one
    const o = typeof outcomeOrCorrect === "object" && outcomeOrCorrect !== null
      ? outcomeOrCorrect
      : { status: outcomeOrCorrect ? "correct" : "incorrect", correct: Boolean(outcomeOrCorrect), timeTaken: timeTakenArg, userAnswer: userAnswerArg };
    const q = current;
    setAnswered(true);
    const correct = Boolean(o.correct);
    const xp = correct ? (q?.points || 10) : 0;
    dispatch(logDashboardSession({
      module, subject: subject || "general", durationMinutes: 1,
      xpEarned: xp, score: correct ? 100 : 0, startTime: questionStartRef.current,
    }));
    dispatch(logDashboardAnswer({
      module, subject: subject || "general",
      question: q?.instruction || q?.prompt || "",
      userAnswer: describe(o.userAnswer),
      correctAnswer: describe(q?.correct_answer),
      correct, xpEarned: xp, timeTaken: o.timeTaken, mode,
      // Which bank question and topic, so a parent can review the exact card (PAR-033).
      questionId: q?.id, topic: q?.academic?.curriculum_strand,
      // The learning engine (contract §2): how it went and what help was used.
      status: o.status,
      firstTry: o.firstTry,
      hintsUsed: o.hintsUsed ?? 0,
      ...(Number.isInteger(o.supportStep) ? { supportStep: o.supportStep } : {}),
      ...(o.misconception ? { misconception: o.misconception } : {}),
      uncertain: o.status === "uncertain",
      ...(o.reason ? { reason: o.reason } : {}),
      timedOut: Boolean(o.timedOut),
    })).then((action) => {
      const learn = action?.payload?.learn;
      if (learn && q?.id) setLearnById((m) => ({ ...m, [q.id]: learn }));
    });
    if (correct) {
      setTotalScore((s) => s + 1);
      roundStarsRef.current += 1;
      if (mode === "warrior" && !noClock) roundBonusRef.current += getWarriorBonus(o.timeTaken);
    }
  };

  const setMode = (m) => {
    setModeState(m);
    setTimeLeft(warriorSeconds);
    setTimedOut(false);
    setUserPaused(false);
  };
  const togglePause = () => setUserPaused((p) => !p);

  const handlePlayAgain = () => {
    setRoundDone(false);
    setRoundResult({ stars: 0, bonusStars: 0 });
    roundStarsRef.current = 0;
    roundBonusRef.current = 0;
    setIdx(0);
    setTotalScore(0);
    setAnswered(false);
    setTimeLeft(warriorSeconds);
    setTimedOut(false);
    setUserPaused(false);
    setLearnById({});
    // An adaptive round is made fresh each time (the engine has just learned more).
    if (adaptive) dispatch(fetchQuestions({ module, subject, lang: getQuestionLang(i18n.language), skill: focusSkill }));
  };

  const retry = () => dispatch(fetchQuestions({ module, subject, lang: getQuestionLang(i18n.language), skill: focusSkill }));

  // Warrior countdown. Runs only while a question is waiting for an answer,
  // the clock isn't paused, the page is visible, the teacher isn't speaking
  // and the round isn't over. With the "no clock" setting it never runs.
  const paused = userPaused || pageHidden || holds.size > 0;
  const clockRunning = mode === "warrior" && !noClock && !answered && !!current && !roundDone && !paused && !timedOut && !voiceBusy;
  useEffect(() => {
    if (!clockRunning) return undefined;
    const t = setTimeout(() => {
      if (timeLeft <= 1) {
        setTimeLeft(0);
        setTimedOut(true);
      } else {
        setTimeLeft(timeLeft - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [clockRunning, timeLeft]);

  // Time's up: noted for the grown-ups (never counted for or against the
  // learner: the engine ignores timed-out answers and an "uncertain" answer is
  // not stored as right or wrong), then a short pause on the "time's up" card
  // and the next question.
  useEffect(() => {
    if (!timedOut || !current) return;
    dispatch(logDashboardAnswer({
      module, subject: subject || "general",
      question: current.instruction || current.prompt || "",
      userAnswer: "", correctAnswer: describe(current.correct_answer),
      correct: false, xpEarned: 0, timeTaken: warriorSeconds, mode,
      questionId: current.id, topic: current.academic?.curriculum_strand,
      status: "uncertain", uncertain: true, timedOut: true, firstTry: false, hintsUsed: 0,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timedOut]);
  useEffect(() => {
    if (!timedOut || roundDone) return undefined;
    const t = setTimeout(() => advance(), 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timedOut, roundDone]);

  // Other answers in this round, for "choose your answer instead" on a speaking question.
  const choicePool = useMemo(() => data
    .map((q) => (typeof q?.correct_answer === "string" ? q.correct_answer : q?.speech_scoring?.sample_answer))
    .filter((a) => typeof a === "string" && a.trim()), [data]);

  return {
    data, status, noOrgQuestions, current, idx, mode, setMode,
    answered, timeLeft, warriorSeconds, noClock, roundDone, roundResult, totalScore,
    recordAnswer, advance, handlePlayAgain, retry,
    paused, userPaused, togglePause, clockRunning, timedOut, voiceBusy,
    learn: current?.id ? learnById[current.id] || null : null,
    choicePool, adaptive,
  };
}
