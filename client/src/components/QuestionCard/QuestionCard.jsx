import { useEffect, useMemo, useRef, useState } from "react";
import * as FramerMotion from "framer-motion";
import { AnimatePresence, useAnimate, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FaVolumeUp, FaLightbulb, FaArrowRight, FaRedo, FaStar, FaFlagCheckered, FaBookReader, FaPause, FaPlay,
  FaShapes, FaShoePrints, FaKeyboard, FaListUl, FaMicrophone, FaForward, FaEye, FaChalkboardTeacher,
} from "react-icons/fa";
import { WIDGETS } from "../QuestionWidgets/widgetRegistry";
import Mascot from "../Mascot/Mascot";
import { checkAnswer } from "../../utils/scoreAnswer";
import { useSpeech } from "../../hooks/useSpeech";
import { sfx, haptic } from "../../utils/sounds";
import { onNarration, pauseNarration, resumeNarration, preloadNarration } from "../../utils/narrator";
import { getPrefs } from "../../utils/learnerPrefs";
import PictureMaths from "./PictureMaths";
import {
  findSmallSum, spokenAnswers, buildChoices, micProblem, nextStrategy, supportStepShown, messageArgs, isHiddenAudio, seedOf,
} from "./support";
import styles from "./QuestionCard.module.css";

function formatAnswer(correct_answer) {
  if (Array.isArray(correct_answer)) {
    if (Array.isArray(correct_answer[0])) return correct_answer.map((p) => p.join(" → ")).join(", ");
    return correct_answer.join(correct_answer.every((w) => String(w).length > 1) ? " " : ", ");
  }
  if (correct_answer && typeof correct_answer === "object") {
    return Object.entries(correct_answer).map(([bin, items]) => `${bin}: ${items.join(", ")}`).join(" · ");
  }
  return String(correct_answer ?? "");
}

// A little burst of stars from the mascot when an answer is right.
const BURST = [0, 45, 90, 135, 180, 225, 270, 315];
function StarBurst() {
  return (
    <span className={styles.burst} aria-hidden="true">
      {BURST.map((deg, i) => (
        <span key={deg} className={styles.burstStar} style={{ "--a": `${deg}deg`, "--d": `${(i % 3) * 40}ms` }}>
          <FaStar />
        </span>
      ))}
    </span>
  );
}

// The answer sheet: slides up at the bottom of the card (where a thumb is on
// a phone) with the mascot, what happened, and what comes next.
function ResultSheet({ tone, mood, children, action }) {
  const reduce = useReducedMotion();
  return (
    <FramerMotion.motion.div
      className={`${styles.sheet} ${styles[tone]}`}
      role="status"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: "60%" }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
    >
      <span className={styles.sheetMascot}>
        <Mascot size={56} mood={mood} butterfly={false} />
        {tone === "good" && <StarBurst />}
      </span>
      <div className={styles.sheetText}>{children}</div>
      {action}
    </FramerMotion.motion.div>
  );
}

function NextButton({ onNext, isLast }) {
  const { t } = useTranslation();
  if (!onNext) return null;
  return (
    <button
      type="button"
      className={styles.nextBtn}
      // Finishing the round lets the celebration make the sound.
      onClick={() => { if (!isLast) sfx.forward(); onNext(); }}
      data-sound={isLast ? "none" : undefined}
      autoFocus
    >
      {isLast ? <><FaFlagCheckered aria-hidden="true" /> {t("questionCard.finishRound")}</> : <>{t("questionCard.next", { defaultValue: "Next" })} <FaArrowRight aria-hidden="true" /></>}
    </button>
  );
}

// Generic fallback for questions stored under the old flat schema (e.g. a
// teacher-uploaded batch approved before this content migration) — no
// `interaction` field means we can't know which rich widget to render, so we
// degrade to a simple tap-to-select or self-report card instead of crashing.
function LegacyCard({ question, onAnswered, onNext, isLast, locked }) {
  const { t } = useTranslation();
  const text = question.sentence || question.text || question.content || question.character || question.title || "";
  const hasMcq = Array.isArray(question.options) && question.answer;
  const [result, setResult] = useState(null);

  const choose = (opt) => {
    const correct = opt === question.answer;
    setResult(correct ? "correct" : "wrong");
    (correct ? sfx.correct : sfx.wrong)();
    onAnswered({ status: correct ? "correct" : "incorrect", correct, timeTaken: 0, userAnswer: opt, firstTry: true, hintsUsed: 0 });
  };
  const markDone = () => {
    setResult("correct");
    sfx.correct();
    onAnswered({ status: "ungraded", correct: true, timeTaken: 0, userAnswer: "", firstTry: true, hintsUsed: 0 });
  };

  return (
    <div className={styles.card} data-layout="legacy">
      <div className={styles.stimulus}>
        {question.emoji && <div className={styles.emoji}>{question.emoji}</div>}
        {question.question && <p className={styles.instruction}>{question.question}</p>}
        {text && <p className={styles.promptBox}>{text}</p>}
      </div>
      <div className={styles.answer}>
        {hasMcq ? (
          <div className={styles.legacyOptions}>
            {question.options.map((opt, i) => (
              <button key={i} type="button" className={styles.legacyOption} disabled={!!result || locked} onClick={() => choose(opt)} data-hover-sound="">{opt}</button>
            ))}
          </div>
        ) : !result ? (
          <button type="button" className={styles.nextBtn} onClick={markDone} data-sound="none">{t("questionCard.markComplete")}</button>
        ) : null}
      </div>
      <AnimatePresence>
        {result && (
          <ResultSheet tone={result === "correct" ? "good" : "soft"} mood={result === "correct" ? "cheer" : "think"} action={<NextButton onNext={onNext} isLast={isLast} />}>
            {result === "wrong" && <p className={styles.revealText}>{t("questionCard.correctAnswer", { answer: question.answer })}</p>}
          </ResultSheet>
        )}
      </AnimatePresence>
    </div>
  );
}

// Only the reasons the learning engine knows (log-answer `reason`).
const REASONS = { no_speech: "no_speech", mic_blocked: "mic_blocked", spelling: "spelling", number_form: "number_form" };

// The distractor insight of the option a learner picked (sent to the engine,
// never shown: it is a note for teachers, not words for a child).
function misconceptionFor(question, answer) {
  const map = question?.distractor_insight;
  if (!map || typeof map !== "object" || typeof answer !== "string") return undefined;
  const hit = Object.entries(map).find(([opt]) => opt.trim().toLowerCase() === answer.trim().toLowerCase());
  return hit && typeof hit[1] === "string" ? hit[1] : undefined;
}

// "So close": what to look at, by the checker's reason.
function closeText(t, reason) {
  switch (reason) {
    case "number_form": return t("questionCard.close.number", "So close! Write it as a number and try again.");
    case "unit": return t("questionCard.close.unit", "So close! Add the unit and try again.");
    case "capitals": return t("questionCard.close.capitals", "So close! Check the capital letters and try again.");
    case "punctuation": return t("questionCard.close.punctuation", "So close! Check the punctuation and try again.");
    default: return t("questionCard.close.spelling", "So close! Check the spelling and try again.");
  }
}

// What went wrong with the microphone, said kindly, with how to fix it.
function micText(t, reason) {
  switch (reason) {
    case "mic_blocked":
      return [
        t("questionCard.mic.blockedTitle", "The microphone is switched off for Learnigo."),
        t("questionCard.mic.blockedHelp", "To turn it on: tap the lock or microphone sign next to the web address, choose Allow for the microphone, then press Say it again. Or answer another way below."),
      ];
    case "no_speech":
      return [
        t("questionCard.mic.noSpeechTitle", "I didn't hear anything that time."),
        t("questionCard.mic.noSpeechHelp", "Press Say it again and speak when you see \"Listening…\". Being a little closer helps."),
      ];
    case "unsupported":
      return [
        t("questionCard.mic.unsupportedTitle", "This browser can't listen to speech."),
        t("questionCard.mic.unsupportedHelp", "That's fine: you can answer another way below."),
      ];
    case "no_mic":
      return [
        t("questionCard.mic.noMicTitle", "No microphone was found."),
        t("questionCard.mic.noMicHelp", "Plug one in and press Say it again, or answer another way below."),
      ];
    default:
      return [
        t("questionCard.mic.errorTitle", "The microphone didn't work just now."),
        t("questionCard.mic.errorHelp", "It wasn't you. Press Say it again, or answer another way below."),
      ];
  }
}

const OFFER_TEXT = {
  pictures: ["questionCard.offer.pictures", "Would you like to see it with pictures?"],
  guided: ["questionCard.offer.guided", "Shall we do it together, one step at a time?"],
  hints: ["questionCard.offer.hints", "Would a hint help?"],
  worked: ["questionCard.offer.worked", "Would you like to see how it works?"],
};

/**
 * One question: the stimulus (instruction, picture, prompt, Listen / Read to
 * me / Hint), the interaction widget for its `interaction`, and the answer
 * sheet. Marks answers with checkAnswer (utils/scoreAnswer.js):
 *  - correct: praise (the server's personalised message when it comes back);
 *  - close (a spelling slip): "so close", another go that is not a miss;
 *  - incorrect: another go with the NEXT way of explaining offered (pictures,
 *    step by step, a hint, the worked example), then the answer after a second miss;
 *  - uncertain (the microphone was blocked, heard nothing, cannot listen):
 *    never counted; what happened is said kindly, with Say it again / Type it /
 *    Choose instead;
 *  - ungraded (open speaking or writing practice): a warm thank-you, no right or wrong.
 * Calls onAnswered(outcome) once per question:
 *   { status, correct, timeTaken, userAnswer, firstTry, hintsUsed (help the learner asked for),
 *     supportStep (the item's support.step), supportShown, misconception, uncertain, reason }
 * then the Next button calls onNext. `locked` (the Warrior clock ran out)
 * freezes the card. `learn` is the server's reply for this answer (message,
 * levelChange). `choicePool` holds other answers in the round (for "choose instead").
 * `oneTry` (the placement check-in): the answer is shown after one miss.
 */
export default function QuestionCard({ question, subject, module, onAnswered, onNext, isLast = false, locked = false, learn = null, choicePool = [], oneTry = false }) {
  const { t } = useTranslation();
  const speech = useSpeech(subject);
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState("open"); // open | correct | close | incorrect | revealed | uncertain | ungraded
  const [misses, setMisses] = useState(0);
  const [closes, setCloses] = useState(0);
  const [used, setUsed] = useState(() => new Set(question.support?.strategy === "guided" && question.hints?.length ? ["guided"] : []));
  // A strategy chosen by the learning engine for this skill: "guided" starts
  // with the first step showing, the rest one at a time.
  const startGuided = question.support?.strategy === "guided" && Array.isArray(question.hints) && question.hints.filter(Boolean).length > 0;
  const [hintsShown, setHintsShown] = useState(startGuided ? 1 : 0);
  const [showWorked, setShowWorked] = useState(false);
  const [showPictures, setShowPictures] = useState(false);
  const [guided, setGuided] = useState(startGuided);
  const [closeReason, setCloseReason] = useState(null);
  const [altMode, setAltMode] = useState(null); // null | "type" | "choose"
  const [micReason, setMicReason] = useState(null);
  const [listenFailed, setListenFailed] = useState(false);
  const [readInstead, setReadInstead] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reading, setReading] = useState(null); // null | "playing" | "paused" (Read to me)
  const [heard, setHeard] = useState("");
  const [speaking, setSpeaking] = useState("");
  const [reported, setReported] = useState(false);
  const [answerRef, animateAnswer] = useAnimate();
  // Parent keys this component by question id, so this remounts once per question.
  const startRef = useRef(0);
  const spokenRef = useRef("");
  const readIdRef = useRef(null);
  const judgedRef = useRef(null);

  const hints = useMemo(() => (Array.isArray(question.hints) ? question.hints.filter(Boolean) : []), [question.hints]);
  const sum = useMemo(
    () => (subject === "maths" ? findSmallSum(question.prompt, question.instruction, question.audio_text, question.worked_example) : null),
    [subject, question.prompt, question.instruction, question.audio_text, question.worked_example],
  );
  const hiddenAudio = isHiddenAudio(question);
  const isMic = question.interaction === "mic_record";
  const openPractice = question.graded === false;
  const altAnswers = useMemo(() => spokenAnswers(question), [question]);
  const choices = useMemo(() => (isMic && !openPractice ? buildChoices(question, choicePool, seedOf(question.id)) : null), [isMic, openPractice, question, choicePool]);
  const strategy = question.support?.strategy || "words";
  // Reading the text IS the exercise in an English reading round: the passage is read aloud only on request.
  const readingTask = subject === "english" && module === "read";

  // Words being spoken, for the "follow along" highlight on the card.
  useEffect(() => onNarration((e) => {
    if (e.type === "sentence") setSpeaking(e.text || "");
    else if (e.type === "end") {
      setSpeaking("");
      if (e.id === readIdRef.current) setReading(null);
    } else if (e.type === "pause" && e.id === readIdRef.current) setReading("paused");
    else if (e.type === "resume" && e.id === readIdRef.current) setReading("playing");
  }), []);

  // A new question: start its clock, read it aloud when the learner asked for
  // that (Comfort settings: "Read each question aloud"), and get its sound ready.
  useEffect(() => {
    startRef.current = performance.now();
    const prefs = getPrefs();
    if (question.audio_text && hiddenAudio && prefs.voice) preloadNarration(question.audio_text, { lang: speech.speechLangFor(question.audio_lang) });
    if (!prefs.autoRead) return undefined;
    const id = setTimeout(() => {
      const parts = [question.instruction, readingTask ? "" : question.prompt].filter(Boolean);
      if (parts.length) speech.speak(parts, { lang: question.audio_lang });
      if (question.audio_text && hiddenAudio) speech.speak(question.audio_text, { lang: question.audio_lang, queue: true, caption: false });
    }, 450);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Help the learner asked for (a hint, pictures, step by step, "show me how").
  // A first step the engine showed up front ("guided") is not counted.
  const [hintsUsed, setHintsUsed] = useState(0);
  const askedForHelp = () => setHintsUsed((n) => n + 1);

  const report = (status, extra = {}) => {
    if (reported) return;
    setReported(true);
    const j = judgedRef.current || {};
    onAnswered({
      status,
      correct: Boolean(extra.correct),
      timeTaken: (performance.now() - startRef.current) / 1000,
      userAnswer: extra.userAnswer,
      firstTry: misses === 0 && !extra.afterMiss,
      hintsUsed,
      // The support the engine chose for this item (round items carry it).
      supportStep: Number.isInteger(question.support?.step) ? question.support.step : undefined,
      supportShown: supportStepShown(used),
      // The picked option's distractor_insight, exactly as in the question.
      misconception: j.misconception || misconceptionFor(question, extra.userAnswer),
      uncertain: status === "uncertain",
      reason: REASONS[j.reason || extra.reason],
    });
  };

  const say = (text, opts = {}) => {
    const s = Array.isArray(text) ? text.filter(Boolean) : String(text || "").trim();
    if (!s || (Array.isArray(s) && !s.length)) return;
    speech.speak(s, { lang: question.audio_lang, ...opts });
  };

  // The question asked in another way (type it / choose it), for a speaking question.
  const altQuestion = useMemo(() => {
    if (!altMode) return null;
    const base = { ...question, accepted_answers: altAnswers, correct_answer: altAnswers[0] ?? question.correct_answer };
    if (altMode === "choose") return { ...base, interaction: "tap_mcq", options: choices || [] };
    return { ...base, interaction: "typed_short", validation: { method: "text", number_words: true, strip_articles: true } };
  }, [altMode, question, altAnswers, choices]);

  const judge = (answer, alt) => {
    if (isMic && !alt) {
      const prob = micProblem(answer);
      if (prob) return prob;
    }
    let j;
    try {
      j = checkAnswer(alt ? altQuestion : question, answer) || {};
    } catch {
      j = {};
    }
    if (!j.status) j = { ...j, status: j.correct ? "correct" : "incorrect" };
    if (openPractice && j.status !== "uncertain") {
      // Open speaking/writing practice is never marked right or wrong.
      const said = typeof answer === "string" ? answer : answer?.transcript;
      if (String(said || "").trim()) return { status: "ungraded", correct: true };
    }
    return j;
  };

  const handleSubmit = (userAnswer, { alt = false } = {}) => {
    if (locked || reported) return;
    const j = judge(userAnswer, alt);
    judgedRef.current = j;
    setHeard(typeof userAnswer === "object" && userAnswer?.transcript ? userAnswer.transcript : typeof userAnswer === "string" ? userAnswer : "");
    // Answered another way, or after reading a listening task's words: the
    // learner is told how it went, but the server never counts it.
    const notAssessed = alt || readInstead;
    switch (j.status) {
      case "uncertain": {
        sfx.notify();
        setMicReason(j.reason || "mic_error");
        setPhase("uncertain");
        // The learner's own choice (Comfort settings) goes straight to the other way.
        const pref = getPrefs().speakInstead;
        const way = pref === "type" && altAnswers.length ? "type" : pref === "choose" && choices ? "choose" : null;
        if (way && !alt) { setAltMode(way); setPhase("open"); }
        return;
      }
      case "ungraded":
        sfx.correct();
        haptic("success");
        setPhase("ungraded");
        report(notAssessed ? "uncertain" : "ungraded", { correct: true, userAnswer });
        return;
      case "correct":
        sfx.correct();
        haptic("success");
        setPhase("correct");
        report(notAssessed ? "uncertain" : "correct", { correct: true, userAnswer });
        return;
      case "close": {
        sfx.notify();
        setCloseReason(j.reason || "spelling");
        const c = closes + 1;
        setCloses(c);
        if (c >= 3) {
          setPhase("revealed");
          report(notAssessed ? "uncertain" : "close", { correct: false, userAnswer });
        } else {
          setPhase("close");
        }
        return;
      }
      default: {
        sfx.wrong();
        // A gentle shake: "not quite", never a jolt.
        if (!reduce && answerRef.current) {
          animateAnswer(answerRef.current, { x: [0, -7, 7, -5, 5, -2, 0] }, { duration: 0.45, ease: "easeInOut" });
        }
        const m = misses + 1;
        setMisses(m);
        if (m >= 2 || oneTry) {
          setPhase("revealed");
          report(notAssessed ? "uncertain" : "incorrect", { correct: false, userAnswer, afterMiss: true });
        } else {
          setPhase("incorrect");
        }
      }
    }
  };

  // Each new piece of help shown is read aloud (when the voice may speak by herself).
  const showHelp = (kind) => {
    askedForHelp();
    setUsed((u) => new Set(u).add(kind));
    if (kind === "pictures") {
      setShowPictures(true);
      say(t("questionCard.pictureSay", "Let's look at it with pictures. Count them with me."));
    } else if (kind === "guided") {
      setGuided(true);
      const n = Math.max(1, hintsShown);
      setHintsShown(n);
      say(hints[n - 1]);
    } else if (kind === "hints") {
      const n = Math.min(hints.length, hintsShown + 1);
      setHintsShown(n);
      say(hints[n - 1]);
    } else if (kind === "worked") {
      setShowWorked(true);
      say(question.worked_example);
    }
  };

  // The hint button: hint 1, hint 2… then the worked example.
  const nextHint = () => {
    sfx.pop();
    if (hintsShown < hints.length) {
      askedForHelp();
      const n = hintsShown + 1;
      setHintsShown(n);
      setUsed((u) => new Set(u).add(guided ? "guided" : "hints"));
      say(hints[n - 1]);
    } else if (question.worked_example && !showWorked) {
      showHelp("worked");
    }
  };

  const retry = (withHelp) => {
    sfx.tap();
    if (withHelp) showHelp(withHelp);
    setPhase("open");
  };

  const readToMe = () => {
    if (reading === "playing") { pauseNarration(); return; }
    if (reading === "paused") { resumeNarration(); return; }
    sfx.tap();
    const parts = [question.instruction, question.prompt].filter(Boolean);
    setReading("playing");
    // The narration's id comes with its first event (sent as it starts).
    const off = onNarration((e) => { if (e.type === "start") { readIdRef.current = e.id; off(); } });
    speech.speak(parts, { lang: question.audio_lang, user: true }).then(() => { off(); setReading(null); });
  };

  const playAudio = () => {
    if (!question.audio_text) return;
    sfx.tap();
    setIsPlaying(true);
    speech.speak(question.audio_text, {
      lang: question.audio_lang,
      user: true,
      caption: !hiddenAudio,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: () => { setIsPlaying(false); setListenFailed(true); },
    }).then((ok) => { if (!ok) setIsPlaying(false); });
  };

  // The server's personalised message, translated (contract §2), or null.
  const serverMessage = useMemo(() => {
    const args = messageArgs(learn?.message, (id, name) => t(`skills.${id}`, name));
    return args ? t(args[0], args[1]) : null;
  }, [learn, t]);
  const levelChange = learn?.levelChange && learn.levelChange.to > learn.levelChange.from ? learn.levelChange : null;

  // A level up: a gentle moment (a fanfare, the mascot cheers, a few words).
  useEffect(() => {
    if (!levelChange) return;
    sfx.levelUp();
    say(t("questionCard.levelUpSay", { defaultValue: "You've moved up to level {{to}}. Your practice is paying off!", to: levelChange.to }));
  }, [levelChange?.to]); // eslint-disable-line react-hooks/exhaustive-deps

  const offer = phase === "incorrect"
    ? nextStrategy({ canPicture: Boolean(sum), hintCount: hints.length, hasWorked: Boolean(question.worked_example), used: new Set([...used, ...(hintsShown >= hints.length && hints.length ? ["hints"] : [])]) })
    : null;

  function sheetSpeech() {
    switch (phase) {
      case "correct": return serverMessage || question.feedback?.correct || t("questionCard.wellDone", { defaultValue: "Well done!" });
      case "close": return closeText(t, closeReason);
      case "incorrect": return [question.feedback?.incorrect || t("questionCard.nearly", { defaultValue: "Nearly! Have another go." }), offer ? t(...OFFER_TEXT[offer]) : ""].filter(Boolean);
      case "revealed": return [serverMessage || question.feedback?.second_try || "", t("questionCard.answerWas", { defaultValue: "The answer is {{answer}}.", answer: formatAnswer(question.correct_answer) })].filter(Boolean);
      case "uncertain": return micText(t, micReason)[0];
      case "ungraded": return serverMessage || t("questionCard.thanksSharing", "Thank you for sharing that. Lovely speaking!");
      default: return "";
    }
  }

  // What the teacher says when the sheet appears (once per sheet). For a
  // finished answer she waits a moment for the server's personal message.
  useEffect(() => {
    if (phase === "open") return undefined;
    const key = `${phase}-${misses}-${closes}`;
    if (spokenRef.current === key) return undefined;
    const finished = phase === "correct" || phase === "revealed" || phase === "ungraded";
    const speakNow = () => {
      if (spokenRef.current === key) return;
      spokenRef.current = key;
      say(sheetSpeech());
    };
    const id = setTimeout(speakNow, finished && !serverMessage ? 900 : 250);
    return () => clearTimeout(id);
  }, [phase, misses, closes, serverMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!question.interaction) {
    return <LegacyCard question={question} onAnswered={onAnswered} onNext={onNext} isLast={isLast} locked={locked} />;
  }

  const Widget = WIDGETS[question.interaction] || WIDGETS.tap_mcq;
  const AltWidget = altMode === "choose" ? WIDGETS.tap_mcq : altMode === "type" ? WIDGETS.typed_short : null;
  const disabled = locked || phase !== "open";
  const resolved = reported || locked;

  const hasVisual = question.image?.url || question.image?.emoji;
  // A reading passage or long answers: smaller text so more of it fits at once.
  const longText = (question.prompt || "").length > 110
    || (question.options || []).some((o) => String(o).length > 40);
  const widgetPhase = phase === "correct" || phase === "ungraded" ? "correct" : phase === "incorrect" || phase === "close" || phase === "revealed" ? "wrong" : null;
  // When the clock runs out, the right answer is shown on the tiles too.
  const feedback = { result: widgetPhase, revealed: phase === "revealed" || (locked && phase !== "correct") };
  const isSpeaking = (text) => speaking.length > 2 && String(text || "").includes(speaking);

  const showHintBtn = !resolved && (hintsShown < hints.length || (question.worked_example && !showWorked && (hints.length === 0 || hintsShown >= hints.length)));
  const hintLabel = hintsShown === 0 && hints.length
    ? t("questionCard.hint")
    : hintsShown < hints.length
      ? (guided ? t("questionCard.nextStep", "Next step") : t("questionCard.anotherHint", "Another hint"))
      : t("questionCard.showMeHow", "Show me how");
  const showPictureBtn = Boolean(sum) && !showPictures && !resolved && (strategy === "visual" || misses > 0);
  const pictureCaption = !resolved;

  let sheet = null;
  const tryAgainBtn = (help) => (
    <button type="button" className={styles.retryBtn} onClick={() => retry(help)} data-sound="none" autoFocus>
      <FaRedo aria-hidden="true" /> {t("questionCard.tryAgain")}
    </button>
  );
  if (locked && phase !== "correct" && !reported) {
    sheet = (
      <ResultSheet key="timeup" tone="soft" mood="think">
        <p className={styles.sheetTitle}>{t("warriorTimer.timeUp", { defaultValue: "Time's up!" })}</p>
        <p className={styles.revealText}>{t("questionCard.correctAnswer", { answer: formatAnswer(question.correct_answer) })}</p>
      </ResultSheet>
    );
  } else if (phase === "correct") {
    sheet = (
      <ResultSheet key="good" tone="good" mood="cheer" action={<NextButton onNext={onNext} isLast={isLast} />}>
        {levelChange && (
          <p className={styles.levelUp}>
            <FaStar aria-hidden="true" /> {t("questionCard.levelUp", { defaultValue: "Level up! You're now on level {{to}}.", to: levelChange.to })}
          </p>
        )}
        <p className={`${styles.correctText} ${isSpeaking(serverMessage || question.feedback?.correct) ? styles.speaking : ""}`}>
          {serverMessage || question.feedback?.correct || t("questionCard.wellDone", { defaultValue: "Well done!" })}
        </p>
        {(altMode || readInstead) && !serverMessage && <p className={styles.note}>{t("questionCard.notCounted", "Thanks for answering another way. This one is just for practice.")}</p>}
      </ResultSheet>
    );
  } else if (phase === "ungraded") {
    sheet = (
      <ResultSheet key="ungraded" tone="good" mood="cheer" action={<NextButton onNext={onNext} isLast={isLast} />}>
        <p className={styles.correctText}>{serverMessage || t("questionCard.thanksSharing", "Thank you for sharing that. Lovely speaking!")}</p>
        {heard && <p className={styles.heard}>{t("questionCard.youSaid", { defaultValue: "You said: “{{text}}”", text: heard })}</p>}
      </ResultSheet>
    );
  } else if (phase === "close") {
    sheet = (
      <ResultSheet key={`close-${closes}`} tone="soft" mood="think" action={tryAgainBtn()}>
        <p className={styles.sheetTitle}>{closeText(t, closeReason)}</p>
        <p className={styles.note}>{t("questionCard.closeNote", "This doesn't count as a miss.")}</p>
      </ResultSheet>
    );
  } else if (phase === "incorrect") {
    const [offerKey, offerDef] = offer ? OFFER_TEXT[offer] : [];
    sheet = (
      <ResultSheet
        key="retry"
        tone="soft"
        mood="think"
        action={(
          <div className={styles.actions}>
            {offer && (
              <button type="button" className={styles.helpBtn} onClick={() => retry(offer)} data-sound="none">
                {offer === "pictures" ? <FaShapes aria-hidden="true" /> : offer === "guided" ? <FaShoePrints aria-hidden="true" /> : offer === "worked" ? <FaChalkboardTeacher aria-hidden="true" /> : <FaLightbulb aria-hidden="true" />}
                {offer === "pictures" ? t("questionCard.seePictures", "See it with pictures")
                  : offer === "guided" ? t("questionCard.stepByStep", "Step by step")
                    : offer === "worked" ? t("questionCard.showMeHow", "Show me how")
                      : t("questionCard.showHint", "Show me a hint")}
              </button>
            )}
            {tryAgainBtn()}
          </div>
        )}
      >
        <p className={styles.wrongText}>{question.feedback?.incorrect || t("questionCard.nearly", { defaultValue: "Nearly! Have another go." })}</p>
        {offer && <p className={styles.offerText}>{t(offerKey, offerDef)}</p>}
      </ResultSheet>
    );
  } else if (phase === "revealed") {
    sheet = (
      <ResultSheet key="reveal" tone="soft" mood="idle" action={<NextButton onNext={onNext} isLast={isLast} />}>
        <p className={styles.wrongText}>{serverMessage || question.feedback?.second_try || t("questionCard.letsSee", "Let's look at it together.")}</p>
        <p className={styles.revealText}>{t("questionCard.correctAnswer", { answer: formatAnswer(question.correct_answer) })}</p>
        {/* A new way of explaining, never the same one again. */}
        {sum && !showPictures ? <PictureMaths sum={sum} seed={seedOf(question.id)} /> : null}
        {question.worked_example && !showWorked && (!sum || showPictures) && <p className={styles.workedExample}>{question.worked_example}</p>}
      </ResultSheet>
    );
  } else if (phase === "uncertain") {
    const [title, help] = micText(t, micReason);
    sheet = (
      <ResultSheet
        key={`unsure-${micReason}`}
        tone="soft"
        mood="think"
        action={(
          <div className={styles.actions}>
            {micReason !== "unsupported" && micReason !== "insecure" && (
              <button type="button" className={styles.retryBtn} onClick={() => { setAltMode(null); retry(); }} data-sound="none" autoFocus>
                <FaMicrophone aria-hidden="true" /> {t("questionCard.sayAgain", "Say it again")}
              </button>
            )}
            {altAnswers.length > 0 && (
              <button type="button" className={styles.helpBtn} onClick={() => { setAltMode("type"); setPhase("open"); }} data-sound="none">
                <FaKeyboard aria-hidden="true" /> {t("questionCard.typeIt", "Type it")}
              </button>
            )}
            {choices && (
              <button type="button" className={styles.helpBtn} onClick={() => { setAltMode("choose"); setPhase("open"); }} data-sound="none">
                <FaListUl aria-hidden="true" /> {t("questionCard.chooseIt", "Choose it")}
              </button>
            )}
            <button type="button" className={styles.skipBtn} onClick={() => { report("uncertain", { correct: false }); onNext?.(); }} data-sound="forward">
              <FaForward aria-hidden="true" /> {t("questionCard.skip", "Skip")}
            </button>
          </div>
        )}
      >
        <p className={styles.sheetTitle}>{title}</p>
        <p className={styles.wrongText}>{help}</p>
        <p className={styles.note}>{t("questionCard.uncertainNote", "Nothing is marked wrong when the microphone can't hear you.")}</p>
      </ResultSheet>
    );
  }

  return (
    <div
      className={`${styles.card} ${sheet ? styles.hasSheet : ""}`}
      data-interaction={question.interaction}
      data-qid={question.id}
      data-long={longText ? "" : undefined}
      data-result={locked && !reported ? "timeup" : phase === "revealed" ? "revealed" : phase}
      data-strategy={strategy}
    >
      <div className={styles.stimulus}>
        <p className={`${styles.instruction} ${isSpeaking(question.instruction) ? styles.speaking : ""}`}>{question.instruction}</p>
        <div className={styles.stimRow}>
          {question.image?.url
            ? <img className={styles.picture} src={question.image.url} alt={question.image.alt || ""} />
            : question.image?.emoji && <div className={styles.emoji} aria-hidden="true">{question.image.emoji}</div>}
          {question.prompt && <p className={`${styles.promptBox} ${hasVisual ? "" : styles.promptWide} ${isSpeaking(question.prompt) ? styles.speaking : ""}`}>{question.prompt}</p>}
        </div>

        <div className={styles.toolRow}>
          {(question.instruction || question.prompt) && (
            <button
              type="button"
              className={`${styles.toolBtn} ${reading ? styles.playing : ""}`}
              onClick={readToMe}
              data-sound="none"
              aria-label={reading === "playing" ? t("questionCard.pauseReading", "Pause reading") : reading === "paused" ? t("questionCard.carryOn", "Carry on reading") : t("questionCard.readToMe", "Read to me")}
            >
              {reading === "playing" ? <FaPause aria-hidden="true" /> : reading === "paused" ? <FaPlay aria-hidden="true" /> : <FaBookReader aria-hidden="true" />}
              <span>{reading === "playing" ? t("questionCard.pause", "Pause") : reading === "paused" ? t("questionCard.carryOnShort", "Carry on") : t("questionCard.readToMe", "Read to me")}</span>
            </button>
          )}
          {question.audio_text && (
            <button type="button" className={`${styles.toolBtn} ${styles.listenBtn} ${isPlaying ? styles.playing : ""}`} disabled={isPlaying} onClick={playAudio} data-sound="none">
              <FaVolumeUp aria-hidden="true" />
              {isPlaying ? t("questionCard.playing") : t("questionCard.listen")}
            </button>
          )}
          {question.audio_text && hiddenAudio && listenFailed && !readInstead && (
            <button type="button" className={styles.toolBtn} onClick={() => { sfx.open(); setReadInstead(true); }} data-sound="none">
              <FaEye aria-hidden="true" /> {t("questionCard.readInstead", "Can't hear it? Read it instead")}
            </button>
          )}
          {showPictureBtn && (
            <button type="button" className={styles.toolBtn} onClick={() => { sfx.open(); showHelp("pictures"); }} data-sound="none">
              <FaShapes aria-hidden="true" /> {t("questionCard.seePictures", "See it with pictures")}
            </button>
          )}
          {showHintBtn && (
            <button type="button" className={styles.toolBtn} onClick={nextHint} data-sound="none">
              <FaLightbulb aria-hidden="true" /> {hintLabel}
            </button>
          )}
        </div>

        {readInstead && (
          <p className={styles.readInstead}>
            <span className={styles.readInsteadTag}>{t("questionCard.theWords", "The words:")}</span> {question.audio_text}
          </p>
        )}

        {(hintsShown > 0 || showWorked || showPictures) && (
          <div className={styles.helpArea} aria-live="polite">
            {guided && hintsShown > 0 && (
              <p className={styles.stepTag}>{t("questionCard.stepOf", { defaultValue: "Step {{n}} of {{total}}", n: Math.min(hintsShown, hints.length), total: hints.length })}</p>
            )}
            <AnimatePresence initial={false}>
              {hints.slice(0, hintsShown).map((h, i) => (
                <FramerMotion.motion.p
                  key={`hint-${i}`}
                  className={`${styles.hintBubble} ${isSpeaking(h) ? styles.speaking : ""} ${guided && i < hintsShown - 1 ? styles.hintDone : ""}`}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85, rotate: -4 }}
                  animate={{ opacity: 1, scale: 1, rotate: -1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22 }}
                >
                  {hints.length > 1 && <span className={styles.hintNum}>{i + 1}</span>} {h}
                </FramerMotion.motion.p>
              ))}
            </AnimatePresence>
            {showPictures && sum && <PictureMaths sum={pictureCaption ? { ...sum, result: "?" } : sum} seed={seedOf(question.id)} />}
            {showWorked && question.worked_example && (
              <p className={`${styles.workedBubble} ${isSpeaking(question.worked_example) ? styles.speaking : ""}`}>
                <FaChalkboardTeacher aria-hidden="true" /> {question.worked_example}
              </p>
            )}
          </div>
        )}
      </div>

      <div className={styles.answer} ref={answerRef}>
        {AltWidget && altQuestion ? (
          <>
            <p className={styles.altNote} aria-live="polite" hidden={phase !== "open"}>
              {micReason ? `${micText(t, micReason)[0]} ` : ""}
              {altMode === "type" ? t("questionCard.typeInstead", "Type your answer instead:") : t("questionCard.chooseInstead", "Choose your answer instead:")}
            </p>
            <AltWidget key={altMode} question={altQuestion} onSubmit={(a) => handleSubmit(a, { alt: true })} disabled={disabled} speech={speech} feedback={feedback} />
          </>
        ) : (
          <Widget question={question} onSubmit={handleSubmit} disabled={disabled} speech={speech} feedback={feedback} reportErrors />
        )}
      </div>

      <AnimatePresence mode="wait">{sheet}</AnimatePresence>
    </div>
  );
}
