import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { fetchQuestions, resetQuestions, selectQuestionState } from "../store/slices/questionsSlice";
import { logDashboardSession, logDashboardAnswer, logRoundResult } from "../store/slices/dashboardSlice";
import { getQuestionLang } from "../utils/questionLang";
import { getWarriorBonus } from "../utils/warriorBonus";

const describe = (v) => (typeof v === "string" ? v : JSON.stringify(v ?? ""));

// Shared fetch/round/warrior/dashboard-logging state for all four question
// module pages — this was ~90% byte-identical across Listen/Read/Write/Speak
// before this migration, so it's centralized here. Each page only supplies
// {module, subject} and renders its own chrome around the returned state.
export function useQuestionRound({ module, subject, warriorSeconds = 30 }) {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const { questions: data, status, noOrgQuestions } = useSelector((s) => selectQuestionState(s, module, subject));

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchQuestions({ module, subject, lang: getQuestionLang(i18n.language) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, subject, status, dispatch]);

  useEffect(() => {
    if (subject === "english") return;
    dispatch(resetQuestions({ module, subject }));
    dispatch(fetchQuestions({ module, subject, lang: getQuestionLang(i18n.language) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const [mode, setModeState] = useState("practice");
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(warriorSeconds);
  // Warrior clock state: the child can pause it, it stops by itself while the
  // tab is hidden, and when it runs out the question shows "time's up" for a
  // moment before the round moves on (rather than jumping without a word).
  const [userPaused, setUserPaused] = useState(false);
  const [pageHidden, setPageHidden] = useState(() => typeof document !== "undefined" && document.hidden);
  const [timedOut, setTimedOut] = useState(false);
  const [roundDone, setRoundDone] = useState(false);
  const [roundResult, setRoundResult] = useState({ stars: 0, bonusStars: 0 });
  const [totalScore, setTotalScore] = useState(0);

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

  const recordAnswer = (correct, timeTaken, userAnswer) => {
    if (timedOut) return; // too late: the clock already ran out on this one
    setAnswered(true);
    const xp = correct ? (current?.points || 10) : 0;
    dispatch(logDashboardSession({
      module, subject: subject || "general", durationMinutes: 1,
      xpEarned: xp, score: correct ? 100 : 0, startTime: questionStartRef.current,
    }));
    dispatch(logDashboardAnswer({
      module, subject: subject || "general",
      question: current?.instruction || current?.prompt || "",
      userAnswer: describe(userAnswer),
      correctAnswer: describe(current?.correct_answer),
      correct, xpEarned: xp, timeTaken, mode,
      // Which bank question and topic, so a parent can review the exact card (PAR-033).
      questionId: current?.id, topic: current?.academic?.curriculum_strand,
    }));
    if (correct) {
      setTotalScore((s) => s + 1);
      roundStarsRef.current += 1;
      if (mode === "warrior") roundBonusRef.current += getWarriorBonus(timeTaken);
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
  };

  const retry = () => dispatch(fetchQuestions({ module, subject, lang: getQuestionLang(i18n.language) }));

  // Warrior countdown. Runs only while a question is waiting for an answer,
  // the clock isn't paused, the page is visible and the round isn't over.
  const paused = userPaused || pageHidden;
  const clockRunning = mode === "warrior" && !answered && !!current && !roundDone && !paused && !timedOut;
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

  // Time's up: a short pause on the "time's up" card, then the next question.
  useEffect(() => {
    if (!timedOut || roundDone) return undefined;
    const t = setTimeout(() => advance(), 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timedOut, roundDone]);

  return {
    data, status, noOrgQuestions, current, idx, mode, setMode,
    answered, timeLeft, warriorSeconds, roundDone, roundResult, totalScore,
    recordAnswer, advance, handlePlayAgain, retry,
    paused, userPaused, togglePause, clockRunning, timedOut,
  };
}
