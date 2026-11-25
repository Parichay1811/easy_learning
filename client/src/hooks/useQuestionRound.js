import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchQuestions, resetQuestions, selectQuestionState, discardUnfinishedRound } from "../store/slices/questionsSlice";
import { logDashboardSession, logDashboardAnswer, logRoundResult } from "../store/slices/dashboardSlice";
import { getQuestionLang } from "../utils/questionLang";
import { noteWarriorBest, rescaleTimeLeft, warriorResult } from "../utils/warrior";
import { learnerTag } from "../components/journey/journeyApi";
import { onNarration, isNarrating } from "../utils/narrator";
import { usePrefs } from "../components/settings/usePrefs";
import { HOLD_CLOCK_EVENT } from "../components/settings/comfortEvents";
import { SOURCES } from "../components/journey/words";

const describe = (v) => (typeof v === "string" ? v : JSON.stringify(v ?? ""));

// The Warrior clock follows the learner's "Warrior clock" setting: normal,
// more time (double), or no clock at all (the default: a clock only when the
// learner turns one on). The clock never costs a star: when it runs out the
// question stays open ("take your time"), nothing is skipped or counted.
const CLOCK_FACTOR = { on: 1, relaxed: 2, off: 0 };
// The most minutes one answered question can add to the day (an idle tab does not count).
const ANSWER_MAX_MINUTES = 3;
// Minutes since `start` (ms; 0 or missing = none), at most `max`, to 2 decimals.
const minutesSince = (start, max) => (start ? Math.round(Math.min(max, Math.max(0, (Date.now() - start) / 60000)) * 100) / 100 : 0);
const nowMs = () => Date.now();

// Shared fetch/round/warrior/dashboard-logging state for all four question
// module pages. Each page only supplies {module, subject} and renders its own
// chrome around the returned state.
//
// Rounds come from the learning engine (/api/learn/round: the learner's level,
// reviews due, the support strategy per item) for a signed-in learner, or the
// question bank (10 at random) otherwise (store/slices/questionsSlice.js).
//
// Continuity (contract §2): the first fetch asks for the learner's unfinished
// round (resume=1). When there is one, `resumeOffer` ({ position, total }) is
// set and the page asks "Carry on from question N / Start fresh"
// (acceptResume / startFresh). Every answer is logged with the round's id and
// its position, so the server knows where the learner stopped.
//
// `?challenge=1` in the address plays a mini challenge (mode=challenge).
export function useQuestionRound({ module, subject, warriorSeconds: baseSeconds = 30 }) {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const prefs = usePrefs();
  const {
    questions: data, status, noOrgQuestions, adaptive, lang: roundLang, roundId = null, resume = null, resumeMode = null,
    requestId = null, mode: roundKind = null,
  } = useSelector((s) => selectQuestionState(s, module, subject));
  const clockFactor = CLOCK_FACTOR[prefs.timer] ?? 1;
  const warriorSeconds = Math.round(baseSeconds * (clockFactor || 1));
  const noClock = clockFactor === 0;
  // "Practise now" links from the dashboards name a skill (?skill=<id>).
  const [searchParams] = useSearchParams();
  const focusSkill = (searchParams.get("skill") || "").slice(0, 120) || undefined;
  const challenge = searchParams.get("challenge") === "1";
  // "Carry on with your round" links (?resume=1): the learner already chose to carry on.
  const resumeAsked = searchParams.get("resume") === "1";
  // Chosen on the Today hub (?source=welcome|next|…): told to the engine with the first round only.
  const source = SOURCES.includes(searchParams.get("source")) ? searchParams.get("source") : undefined;
  const wantKind = challenge ? "challenge" : null;
  // What to ask for. An unfinished round is looked for only on a plain round
  // (a chosen skill or a challenge is a new start the learner asked for).
  const argsFor = (resumeHow, { first = false } = {}) => ({
    module, subject, lang: getQuestionLang(i18n.language), skill: focusSkill,
    mode: wantKind || undefined,
    resume: !focusSkill && !challenge ? resumeHow : false,
    ...(first && source ? { source } : {}),
  });

  useEffect(() => {
    if (status === "idle") dispatch(fetchQuestions(argsFor(resumeAsked ? "auto" : "ask", { first: true })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, subject, status, dispatch]);

  // Arriving with a skill while an older round is cached: fetch the focused one.
  useEffect(() => {
    if (!focusSkill || status === "idle") return;
    dispatch(resetQuestions({ module, subject }));
    dispatch(fetchQuestions(argsFor(false, { first: true })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSkill]);

  // A challenge round cached where a plain round is wanted (or the other way round): fetch the right one.
  useEffect(() => {
    if (status !== "succeeded" || (roundKind || null) === wantKind) return;
    dispatch(resetQuestions({ module, subject }));
    dispatch(fetchQuestions(argsFor("ask")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantKind, roundKind, status]);

  // Leaving the round: forget it here. The server keeps the unfinished round,
  // so coming back (or signing in again) offers to carry on from there.
  useEffect(() => () => { dispatch(resetQuestions({ module, subject })); }, [dispatch, module, subject]);

  // A new language means translated questions: fetch again, but only when the
  // round on hand is in another language (not on a first load, which the
  // effect above covers: two fetches at once could swap the round mid-question).
  // The same round comes back in the new language at the same question
  // (resume, carried on at once); the narrator already stopped the old words.
  useEffect(() => {
    if (subject === "english" || status === "idle") return;
    if ((roundLang ?? null) === getQuestionLang(i18n.language)) return;
    dispatch(resetQuestions({ module, subject }));
    dispatch(fetchQuestions(argsFor("auto")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const [modeChoice, setModeState] = useState("practice");
  // A mini challenge is never a Warrior round (it is a few questions one step up, just to try).
  const mode = challenge ? "practice" : modeChoice;
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
  // total: the questions the result is out of; mode: how the round is shown when it ends.
  const [roundResult, setRoundResult] = useState({ stars: 0, bonusStars: 0, total: 0, mode: "practice" });
  const [totalScore, setTotalScore] = useState(0);
  // The server's reply per question (personal message, level change).
  const [learnById, setLearnById] = useState({});
  // "Carry on from question N?" while it is being asked: { position, total }.
  const [resumeOffer, setResumeOffer] = useState(null);
  // Explanations of an idea that keeps tripping the learner up, shown before a
  // question: from the round (support.strategy "misconception") or from the
  // last answer's reply (learn.explain, for the next question).
  const [extraExplain, setExtraExplain] = useState({}); // question id -> { text, skill }
  const [explained, setExplained] = useState(() => new Set()); // question ids already explained
  // Growth badges earned in this round (shown quietly when the round ends).
  const [newBadges, setNewBadges] = useState([]);

  // A round just arrived: an unfinished one is offered (or, fetched again in
  // another language, simply carried on). Adjusted during render, not in an
  // effect, so the first question never flashes before the offer.
  const [seenRequest, setSeenRequest] = useState(null);
  if (status === "succeeded" && requestId && requestId !== seenRequest) {
    setSeenRequest(requestId);
    setExtraExplain({});
    if (resume && resume.position > 0 && resume.position < data.length) {
      if (resumeMode === "auto") setIdx(resume.position);
      else setResumeOffer({ position: resume.position, total: data.length });
    } else {
      setResumeOffer(null);
    }
  }

  const roundStarsRef = useRef(0);
  // Warrior: open questions answered (speaking or writing with no right answer).
  // They are not scored there: no star, and left out of the pass mark.
  const roundUnscoredRef = useRef(0);
  const roundXpRef = useRef(0);
  const roundStartRef = useRef(0);
  const questionStartRef = useRef(new Date().toISOString());
  // A new round (or the same round fetched again): its clock for the round's real length starts now.
  useEffect(() => { roundStartRef.current = nowMs(); }, [requestId]);

  const current = data[idx];
  // The question on screen now, for replies that arrive later (noteReply).
  const idxRef = useRef(idx);
  useEffect(() => { idxRef.current = idx; }, [idx]);
  const ownExplain = current?.support?.strategy === "misconception" && current.support.explain?.text ? current.support.explain : null;
  const explainNow = current && !explained.has(current.id) ? ownExplain || extraExplain[current.id] || null : null;

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

  // The clock's length changed in the middle of a question (Normal to More
  // time in the clock menu or Comfort settings): the time left keeps its share
  // of the new length, so the ring does not jump. A clock that had run out
  // starts again: the learner asked for a different clock.
  const [prevSeconds, setPrevSeconds] = useState(warriorSeconds);
  if (warriorSeconds !== prevSeconds) {
    setPrevSeconds(warriorSeconds);
    if (timedOut) {
      setTimedOut(false);
      setTimeLeft(warriorSeconds);
    } else {
      setTimeLeft(rescaleTimeLeft(timeLeft, prevSeconds, warriorSeconds));
    }
  }

  useEffect(() => {
    const onVis = () => setPageHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // The clock never runs while the teacher is speaking. A read-aloud the
  // learner paused is not speaking (as in utils/sounds.js): the clock carries
  // on, instead of waiting for ever for a voice that may never be resumed.
  useEffect(() => onNarration((e) => {
    if (e.type === "start" || e.type === "sentence" || e.type === "resume") setVoiceBusy(true);
    else if (e.type === "end" || e.type === "pause") setVoiceBusy(false);
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

  const acceptResume = () => {
    if (!resumeOffer) return;
    setIdx(resumeOffer.position);
    setResumeOffer(null);
  };
  // "Start fresh": the server forgets the unfinished round, and a new one comes.
  // (`starting` keeps the old round off screen until the new one is asked for.)
  const [starting, setStarting] = useState(false);
  const startFresh = async () => {
    setStarting(true);
    setResumeOffer(null);
    setIdx(0);
    await discardUnfinishedRound({ module, subject });
    dispatch(fetchQuestions(argsFor(false)));
    setStarting(false);
  };
  const doneExplaining = () => {
    if (!current?.id) return;
    setExplained((s) => new Set(s).add(current.id));
  };

  // The round is one session with its real length (each answer already added
  // its own XP and minutes); new badges in the reply are shown with the round's.
  const finishRound = () => {
    const warriorRound = mode === "warrior";
    const unscored = warriorRound ? roundUnscoredRef.current : 0;
    // Warrior: the result is out of the questions that were scored. A round
    // with nothing to score (every question was open) has no Warrior result:
    // it is kept and shown as the practice round it was, a star for each answer.
    const result = warriorResult({ total: data.length, unscored, stars: roundStarsRef.current });
    const warrior = warriorRound && result.scored > 0;
    const s = warriorRound && !warrior ? unscored : roundStarsRef.current;
    const total = warrior ? result.scored : data.length;
    const shownMode = warrior ? "warrior" : warriorRound ? "practice" : mode;
    dispatch(logRoundResult({
      module, subject: subject || "general", mode: shownMode,
      stars: s, bonusStars: 0, totalStars: s,
      passed: warrior ? result.passed : undefined,
      questions: total,
      durationMinutes: Math.round(minutesSince(roundStartRef.current, 60) * 10) / 10,
      xpEarned: roundXpRef.current,
    })).then((action) => {
      const got = Array.isArray(action?.payload?.badges) ? action.payload.badges.filter((b) => b && b.id) : [];
      if (got.length) setNewBadges((list) => [...list, ...got.filter((b) => !list.some((x) => x.id === b.id))]);
    });
    // Warrior: beat your own best (kept on this device, per learner, module and subject).
    const pb = warrior ? noteWarriorBest(`${learnerTag()}|${module}|${subject || "general"}`, s, total) : null;
    setRoundResult({ stars: s, bonusStars: 0, total, mode: shownMode, best: pb?.best || null, newBest: Boolean(pb?.newBest) });
    setRoundDone(true);
  };

  const advance = () => {
    if (idx >= data.length - 1) finishRound();
    else setIdx((i) => i + 1);
  };

  /**
   * One answered question (QuestionCard's outcome):
   * { status, correct, timeTaken, userAnswer, firstTry, hintsUsed, supportStep, misconception, uncertain, reason, open }
   * Older callers pass (correct, timeTaken, userAnswer).
   */
  const recordAnswer = (outcomeOrCorrect, timeTakenArg, userAnswerArg) => {
    const o = typeof outcomeOrCorrect === "object" && outcomeOrCorrect !== null
      ? outcomeOrCorrect
      : { status: outcomeOrCorrect ? "correct" : "incorrect", correct: Boolean(outcomeOrCorrect), timeTaken: timeTakenArg, userAnswer: userAnswerArg };
    const q = current;
    setAnswered(true);
    const correct = Boolean(o.correct);
    const xp = correct ? (q?.points || 10) : 0;
    // The answer's XP and its real minutes (not a session: the round is one).
    dispatch(logDashboardSession({
      kind: "answer",
      module, subject: subject || "general",
      durationMinutes: minutesSince(Date.parse(questionStartRef.current), ANSWER_MAX_MINUTES),
      xpEarned: xp, score: correct ? 100 : 0, startTime: questionStartRef.current,
    }));
    roundXpRef.current += xp;
    const at = idx;
    dispatch(logDashboardAnswer({
      module, subject: subject || "general",
      question: q?.instruction || q?.prompt || "",
      userAnswer: describe(o.userAnswer),
      correctAnswer: describe(q?.correct_answer),
      // A mini challenge's answers say so (the engine never counts a challenge miss against the learner).
      correct, xpEarned: xp, timeTaken: o.timeTaken, mode: roundKind === "challenge" ? "challenge" : mode,
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
      // Where the learner is, so an unfinished round can be carried on later,
      // and the language an explanation should come back in.
      ...(roundId ? { roundId, position: at } : {}),
      lang: getQuestionLang(i18n.language),
    })).then((action) => {
      const learn = action?.payload?.learn;
      if (learn && q?.id) setLearnById((m) => ({ ...m, [q.id]: learn }));
      noteReply(learn, at);
    });
    // Warrior: an open question (nothing to mark: status "ungraded") is not
    // scored. It is no star and it is left out of the pass mark (finishRound).
    // In Practice it stays a star, as it always was.
    if (mode === "warrior" && (o.status === "ungraded" || o.open)) {
      roundUnscoredRef.current += 1;
    } else if (correct) {
      setTotalScore((s) => s + 1);
      roundStarsRef.current += 1;
    }
  };

  // What else the server's reply says: new growth badges (kept for the end of
  // the round) and an explanation due before the next question (given to the
  // next question on the same skill, else simply the next one).
  const noteReply = (learn, at) => {
    if (!learn) return;
    const badges = Array.isArray(learn.achievements) ? learn.achievements.filter((a) => a && a.id) : [];
    if (badges.length) setNewBadges((list) => [...list, ...badges.filter((b) => !list.some((x) => x.id === b.id))]);
    const ex = learn.explain;
    if (ex && typeof ex.text === "string" && ex.text.trim()) {
      // The reply can land after the learner has moved on (a slow connection, a
      // quick Next): the explanation then goes to a question after the one on
      // screen, never over a question the learner is already answering.
      const rest = data.slice(Math.max(at, idxRef.current) + 1);
      const target = rest.find((x) => x?.support?.skill && x.support.skill === ex.skill) || rest[0];
      if (target?.id && !(target.support?.strategy === "misconception" && target.support.explain?.text)) {
        setExtraExplain((m) => (m[target.id] ? m : { ...m, [target.id]: ex }));
      }
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
    setRoundResult({ stars: 0, bonusStars: 0, total: 0, mode: "practice" });
    roundStarsRef.current = 0;
    roundUnscoredRef.current = 0;
    roundXpRef.current = 0;
    roundStartRef.current = nowMs();
    setIdx(0);
    setTotalScore(0);
    setAnswered(false);
    setTimeLeft(warriorSeconds);
    setTimedOut(false);
    setUserPaused(false);
    setLearnById({});
    setNewBadges([]);
    setExplained(new Set());
    setResumeOffer(null);
    // An adaptive round is made fresh each time (the engine has just learned more).
    if (adaptive) dispatch(fetchQuestions(argsFor(false)));
  };

  const retry = () => dispatch(fetchQuestions(argsFor("ask")));

  // Warrior countdown. Runs only while a question is waiting for an answer,
  // the clock isn't paused, the page is visible, the teacher isn't speaking
  // and the round isn't over. With the "no clock" setting it never runs.
  const paused = userPaused || pageHidden || holds.size > 0;
  // Not while "Carry on?" or an explanation is on screen instead of the question.
  const clockRunning = mode === "warrior" && !noClock && !answered && !!current && !roundDone && !paused && !timedOut && !voiceBusy
    && !resumeOffer && !explainNow;
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

  // When the clock runs out (`timedOut`), the question stays open: the clock
  // stops at zero and says "take your time". Nothing is skipped, logged or lost.

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
    // Continuity, explanations, growth badges and challenges (contract §2-3).
    roundId, resumeOffer, acceptResume, startFresh, starting,
    explainNow, doneExplaining,
    newBadges, challenge: challenge && roundKind === "challenge",
  };
}
