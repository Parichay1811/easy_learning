import { useEffect, useState, useRef } from "react";
import * as FramerMotion from "framer-motion";
import { AnimatePresence, useAnimate, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaVolumeUp, FaLightbulb, FaArrowRight, FaRedo, FaStar, FaFlagCheckered } from "react-icons/fa";
import { WIDGETS } from "../QuestionWidgets/widgetRegistry";
import Mascot from "../Mascot/Mascot";
import { isCorrect } from "../../utils/scoreAnswer";
import { useSpeech } from "../../hooks/useSpeech";
import { sfx, haptic } from "../../utils/sounds";
import styles from "./QuestionCard.module.css";

function formatAnswer(correct_answer) {
  if (Array.isArray(correct_answer)) {
    if (Array.isArray(correct_answer[0])) return correct_answer.map((p) => p.join(" → ")).join(", ");
    return correct_answer.join(", ");
  }
  if (correct_answer && typeof correct_answer === "object") {
    return Object.entries(correct_answer).map(([bin, items]) => `${bin}: ${items.join(", ")}`).join(" · ");
  }
  return String(correct_answer);
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
// a phone) with the mascot, what happened, and the one button that comes next.
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
    onAnswered(correct, 0, opt);
  };
  const markDone = () => {
    setResult("correct");
    sfx.correct();
    onAnswered(true, 0, "");
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
              <button key={i} type="button" className={styles.legacyOption} disabled={!!result || locked} onClick={() => choose(opt)}>{opt}</button>
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

// Renders a question's stimulus (instruction/prompt/audio/emoji), the
// interaction widget matching its `interaction` field, a hint on demand, and
// up to one retry with feedback before revealing the answer. Calls
// onAnswered(correct, timeTakenSeconds, userAnswer) exactly once the question
// is resolved (correct, or revealed after a second wrong attempt); the Next
// button that then appears calls onNext. `locked` (the Warrior clock ran out)
// freezes the card and shows "time's up".
export default function QuestionCard({ question, subject, onAnswered, onNext, isLast = false, locked = false }) {
  const { t } = useTranslation();
  const speech = useSpeech(subject);
  const reduce = useReducedMotion();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null); // null | 'correct' | 'wrong'
  const [revealed, setRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [answerRef, animateAnswer] = useAnimate();
  // Parent keys this component by question id, so this remounts (and the
  // timer resets) once per question.
  const startRef = useRef(0);
  useEffect(() => { startRef.current = performance.now(); }, []);

  if (!question.interaction) {
    return <LegacyCard question={question} onAnswered={onAnswered} onNext={onNext} isLast={isLast} locked={locked} />;
  }

  const Widget = WIDGETS[question.interaction] || WIDGETS.tap_mcq;
  const disabled = locked || result === "correct" || revealed || (result === "wrong" && !revealed);

  const handleSubmit = (userAnswer) => {
    if (locked) return;
    const correct = isCorrect(question, userAnswer);
    const timeTaken = (performance.now() - startRef.current) / 1000;
    setShowHint(false);
    if (correct) {
      sfx.correct();
      haptic("success");
      setResult("correct");
      onAnswered(true, timeTaken, userAnswer);
      return;
    }
    sfx.wrong();
    setResult("wrong");
    // A gentle shake: "not quite", never a jolt.
    if (!reduce && answerRef.current) {
      animateAnswer(answerRef.current, { x: [0, -7, 7, -5, 5, -2, 0] }, { duration: 0.45, ease: "easeInOut" });
    }
    if (attempt >= 1) {
      setRevealed(true);
      onAnswered(false, timeTaken, userAnswer);
    }
  };

  const handleRetry = () => {
    sfx.tap();
    setAttempt(1);
    setResult(null);
  };

  const playAudio = () => {
    if (!question.audio_text) return;
    sfx.tap();
    speech.speak(question.audio_text, {
      lang: question.audio_lang,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  const toggleHint = () => {
    (showHint ? sfx.close : sfx.open)();
    setShowHint((h) => !h);
  };

  const hasVisual = question.image?.url || question.image?.emoji;
  // A reading passage or long answers: smaller text so more of it fits at once.
  const longText = (question.prompt || "").length > 110
    || (question.options || []).some((o) => String(o).length > 40);
  // When the clock runs out, the right answer is shown on the tiles too.
  const feedback = { result, revealed: revealed || (locked && result !== "correct") };

  let sheet = null;
  if (locked && result !== "correct" && !revealed) {
    sheet = (
      <ResultSheet key="timeup" tone="soft" mood="think">
        <p className={styles.sheetTitle}>{t("warriorTimer.timeUp", { defaultValue: "Time's up!" })}</p>
        <p className={styles.revealText}>{t("questionCard.correctAnswer", { answer: formatAnswer(question.correct_answer) })}</p>
      </ResultSheet>
    );
  } else if (result === "correct") {
    sheet = (
      <ResultSheet key="good" tone="good" mood="cheer" action={<NextButton onNext={onNext} isLast={isLast} />}>
        <p className={styles.correctText}>{question.feedback?.correct || t("questionCard.wellDone", { defaultValue: "Well done!" })}</p>
      </ResultSheet>
    );
  } else if (result === "wrong" && !revealed) {
    sheet = (
      <ResultSheet
        key="retry"
        tone="soft"
        mood="think"
        action={(
          <button type="button" className={styles.retryBtn} onClick={handleRetry} data-sound="none" autoFocus>
            <FaRedo aria-hidden="true" /> {t("questionCard.tryAgain")}
          </button>
        )}
      >
        <p className={styles.wrongText}>{question.feedback?.incorrect || t("questionCard.nearly", { defaultValue: "Nearly! Have another go." })}</p>
      </ResultSheet>
    );
  } else if (revealed) {
    sheet = (
      <ResultSheet key="reveal" tone="soft" mood="idle" action={<NextButton onNext={onNext} isLast={isLast} />}>
        {question.feedback?.second_try && <p className={styles.wrongText}>{question.feedback.second_try}</p>}
        <p className={styles.revealText}>{t("questionCard.correctAnswer", { answer: formatAnswer(question.correct_answer) })}</p>
        {question.worked_example && <p className={styles.workedExample}>{question.worked_example}</p>}
      </ResultSheet>
    );
  }

  return (
    <div
      className={`${styles.card} ${sheet ? styles.hasSheet : ""}`}
      data-interaction={question.interaction}
      data-long={longText ? "" : undefined}
      data-result={locked && !result ? "timeup" : revealed ? "revealed" : result || "open"}
    >
      <div className={styles.stimulus}>
        <p className={styles.instruction}>{question.instruction}</p>
        <div className={styles.stimRow}>
          {question.image?.url
            ? <img className={styles.picture} src={question.image.url} alt={question.image.alt || ""} />
            : question.image?.emoji && <div className={styles.emoji} aria-hidden="true">{question.image.emoji}</div>}
          {question.prompt && <p className={`${styles.promptBox} ${hasVisual ? "" : styles.promptWide}`}>{question.prompt}</p>}
        </div>

        {(question.audio_text || question.hints?.length > 0) && (
          <div className={styles.toolRow}>
            {question.audio_text && (
              <button type="button" className={`${styles.toolBtn} ${styles.listenBtn} ${isPlaying ? styles.playing : ""}`} disabled={isPlaying} onClick={playAudio} data-sound="none">
                <FaVolumeUp aria-hidden="true" />
                {isPlaying ? t("questionCard.playing") : t("questionCard.listen")}
              </button>
            )}
            {question.hints?.length > 0 && !disabled && (
              <button type="button" className={styles.toolBtn} onClick={toggleHint} aria-expanded={showHint} data-sound="none">
                <FaLightbulb aria-hidden="true" />
                {t("questionCard.hint")}
              </button>
            )}
          </div>
        )}

        <AnimatePresence>
          {showHint && !disabled && (
            <FramerMotion.motion.p
              className={styles.hintBubble}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, rotate: -1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
            >
              {question.hints[0]}
            </FramerMotion.motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className={styles.answer} ref={answerRef}>
        <Widget question={question} onSubmit={handleSubmit} disabled={disabled} speech={speech} feedback={feedback} />
      </div>

      <AnimatePresence mode="wait">{sheet}</AnimatePresence>
    </div>
  );
}
