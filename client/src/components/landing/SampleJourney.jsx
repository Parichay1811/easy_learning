import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaCheck, FaTimes, FaVolumeUp, FaStop, FaRoute, FaRedo, FaArrowRight, FaFlask } from "react-icons/fa";
import Mascot from "../Mascot/Mascot";
import { sfx } from "../../utils/sounds";
import { getSpeechLang } from "../../utils/speechLang";
import { JOURNEY, STAGES } from "./journeyData";
import { useDemoVoice, shownLang } from "./useDemoVoice";
import board from "./Board.module.css";
import shell from "./Landing.module.css";
import styles from "./SampleJourney.module.css";

const LETTERS = ["A", "B", "C", "D"];
const LAST = JOURNEY.length - 1;
const START = { step: 0, phase: "main", attempt: 1, picked: null, outcome: null, history: [], done: false };

// Outcomes: right (first try) · miss (first try: a picture hint, then try
// again) · rightHint / missAgain (second try) · easyRight / easyMiss (the
// easier related question).
const GOOD = new Set(["right", "rightHint", "easyRight"]);
const REVEAL = new Set(["missAgain", "easyMiss"]);

/**
 * A playable sample of the adaptive journey, on the real chalkboard card: one
 * idea (melting) from stage 0 to stage 2. After every answer a plain line says
 * what Learnigo's engine would do next. Runs in the browser with sample data;
 * nothing is sent or saved.
 */
export default function SampleJourney() {
  const { t, i18n } = useTranslation();
  const voice = useDemoVoice();
  const [s, setS] = useState(START);
  const focusNext = useRef(null); // "action" | "question" | "summary", set by a press
  const actionRef = useRef(null);
  const questionRef = useRef(null);
  const summaryRef = useRef(null);
  const uid = useId();

  useEffect(() => {
    const target = focusNext.current;
    if (!target) return;
    focusNext.current = null;
    const el = target === "action" ? actionRef.current : target === "summary" ? summaryRef.current : questionRef.current;
    el?.focus();
  });

  const main = JOURNEY[s.step];
  const item = s.phase === "main" ? main : main.easier;
  const base = `landing.journey.items.${item.id}`;
  const tx = (field) => t(`${base}.${field}`, item.en[field]);
  const options = item.en.options.map((o, i) => t(`${base}.options.${i}`, o));
  const stageName = (n) => t(`landing.stage.${n}`, STAGES[n].name);

  const answered = s.outcome !== null && s.outcome !== undefined;
  // The picture hint: in the answer sheet right after a miss (where the eyes
  // are), then above the answers for the second try.
  const showHint = s.phase === "main" && s.attempt === 2;

  const choose = (i) => {
    if (answered) return;
    voice.stop();
    const right = i === item.correct;
    let outcome;
    if (s.phase === "easier") outcome = right ? "easyRight" : "easyMiss";
    else if (s.attempt === 1) outcome = right ? "right" : "miss";
    else outcome = right ? "rightHint" : "missAgain";
    if (right) sfx.correct(); else sfx.wrong();
    let history = s.history;
    if (outcome === "right" || outcome === "rightHint" || outcome === "missAgain") {
      history = [...history, { step: s.step, result: outcome === "right" ? "first" : outcome === "rightHint" ? "hint" : "shown", easier: null }];
    } else if (outcome === "easyRight" || outcome === "easyMiss") {
      history = history.map((h) => (h.step === s.step ? { ...h, easier: outcome === "easyRight" ? "right" : "miss" } : h));
    }
    focusNext.current = "action";
    setS({ ...s, picked: i, outcome, history });
  };

  const advance = () => {
    voice.stop();
    sfx.forward();
    if (s.outcome === "miss") {
      focusNext.current = "question";
      setS({ ...s, attempt: 2, picked: null, outcome: null });
      return;
    }
    if (s.outcome === "rightHint" || s.outcome === "missAgain") {
      focusNext.current = "question";
      setS({ ...s, phase: "easier", attempt: 1, picked: null, outcome: null });
      return;
    }
    if (s.step >= LAST) {
      focusNext.current = "summary";
      setS({ ...s, done: true });
      return;
    }
    focusNext.current = "question";
    setS({ ...s, step: s.step + 1, phase: "main", attempt: 1, picked: null, outcome: null });
  };

  const restart = () => {
    voice.stop();
    sfx.back();
    focusNext.current = "question";
    setS(START);
  };

  const readAloud = () => {
    if (voice.speaking && voice.key === item.id) { voice.stop(); return; }
    sfx.tap();
    voice.play(tx("script"), { lang: getSpeechLang(shownLang(i18n, `${base}.script`)), key: item.id });
  };
  const reading = voice.speaking && voice.key === item.id;

  // What happened, and what the adaptive engine would do next.
  const last = s.step >= LAST;
  const feedback = {
    right: {
      title: t("landing.journey.fb.right", "That's it. You used what you know about warm things."),
      engine: last
        ? t("landing.journey.next.rightLast", "Right first time, with no hint. Next in Learnigo would be stage 3: using the idea in a new situation.")
        : t("landing.journey.next.right", "Right first time, with no hint. The adaptive engine would now ask a slightly deeper question on the same idea."),
      action: last ? t("landing.journey.btn.summary", "See what happened") : t("landing.journey.btn.deeper", "Next: a deeper question"),
    },
    miss: {
      title: t("landing.journey.fb.miss", "Not quite yet. Here's a picture hint."),
      engine: t("landing.journey.next.miss", "A miss: the engine would first explain it another way (here, a picture), then give an easier related question before going deeper."),
      action: t("landing.journey.btn.retry", "Try again with the hint"),
    },
    rightHint: {
      title: t("landing.journey.fb.rightHint", "You got there with the hint."),
      engine: t("landing.journey.next.rightHint", "Right with a hint. That counts as learning with help, a little less than on your own, so the engine would add an easier related question to make the idea solid."),
      action: t("landing.journey.btn.easier", "Next: an easier related question"),
    },
    missAgain: {
      title: t("landing.journey.fb.missAgain", "This one is tricky. Here's the answer."),
      engine: t("landing.journey.next.missAgain", "Still tricky, so the answer is shown. The engine would now give an easier related question on the same idea."),
      action: t("landing.journey.btn.easier", "Next: an easier related question"),
    },
    easyRight: {
      title: t("landing.journey.fb.easyRight", "That's right. Step by step, it adds up."),
      engine: last
        ? t("landing.journey.next.easyRightLast", "The easier step is done. In a real round the engine would come back to this idea later, as a short review, to check it has stuck.")
        : t("landing.journey.next.easyRight", "The easier step is done, so the engine would go back to the main path, one stage up."),
      action: last ? t("landing.journey.btn.summary", "See what happened") : t("landing.journey.btn.back", "Back to the main path"),
    },
    easyMiss: {
      title: t("landing.journey.fb.easyMiss", "Not this time. Here's the answer."),
      engine: t("landing.journey.next.easyMiss", "Still tricky. In a real round the engine would try step-by-step help next, and if the idea keeps going wrong, rest it until another day. In this sample, we move on."),
      action: last ? t("landing.journey.btn.summary", "See what happened") : t("landing.journey.btn.back", "Back to the main path"),
    },
  }[s.outcome];

  const good = GOOD.has(s.outcome);
  const showExplain = answered && s.outcome !== "miss";
  const announce = feedback
    ? [feedback.title, s.outcome === "miss" ? t(`${base}.hint`, main.en.hint) : "", showExplain ? tx("explain") : "", feedback.engine].filter(Boolean).join(" ")
    : "";

  const hintNote = s.phase === "main" ? (
    <p className={board.hint}>
      <span className={board.hintPic} role="img" aria-label={t(`landing.journey.items.${main.id}.hintAlt`, main.en.hintAlt)}>{main.hintPicture}</span>
      <span><strong>{t("landing.journey.hintLabel", "Hint:")}</strong> {t(`landing.journey.items.${main.id}.hint`, main.en.hint)}</span>
    </p>
  ) : null;

  const optionClass = (i) => {
    if (!answered) return board.option;
    if (i === s.picked) return `${board.option} ${i === item.correct ? board.right : board.wrongPick}`;
    if (REVEAL.has(s.outcome) && i === item.correct) return `${board.option} ${board.reveal}`;
    return board.option;
  };

  const resultLine = (h) => {
    const first = {
      first: t("landing.journey.sum.first", "Right first time, so the next question went one stage deeper."),
      hint: t("landing.journey.sum.hint", "Right with a picture hint, then an easier related question."),
      shown: t("landing.journey.sum.shown", "The answer was shown after a hint, then an easier related question."),
    }[h.result];
    const easier = h.easier === "right"
      ? t("landing.journey.sum.easyRight", "The easier question: right.")
      : h.easier === "miss" ? t("landing.journey.sum.easyMiss", "The easier question: still tricky, so it would come back another day.") : "";
    return [first, easier].filter(Boolean).join(" ");
  };

  return (
    <section id="landing-journey" className={`${shell.section} ${shell.rise}`} aria-labelledby={`${uid}-title`}>
      <div className={shell.head}>
        <p className={shell.eyebrow}><FaRoute aria-hidden="true" /> {t("landing.journey.eyebrow", "Try it")}</p>
        <h2 id={`${uid}-title`} className={shell.title}>{t("landing.journey.title", "A sample journey: from curiosity to understanding")}</h2>
        <p className={shell.lead}>
          {t("landing.journey.lead", "Three questions on one idea, melting, climbing from everyday curiosity to understanding. Answer them however you like, right or wrong, and after each answer you'll see what Learnigo's adaptive engine would do next.")}
        </p>
        <p className={shell.sampleTag}><FaFlask aria-hidden="true" /> {t("landing.journey.sample", "Sample questions · runs in your browser · nothing is saved")}</p>
      </div>

      <ol className={styles.steps} aria-label={t("landing.journey.stepsLabel", "Stages in this sample")}>
        {JOURNEY.map((q, i) => {
          const doneStep = s.done || i < s.step;
          const current = !s.done && i === s.step;
          return (
            <li key={q.id} className={`${styles.step} ${current ? styles.stepNow : ""} ${doneStep ? styles.stepDone : ""}`} aria-current={current ? "step" : undefined}>
              <span className={styles.stepNum} aria-hidden="true">{doneStep ? <FaCheck /> : q.stage}</span>
              <span className={styles.stepText}>
                <span className={styles.stepStage}>{t("landing.journey.stageN", { defaultValue: "Stage {{n}}", n: q.stage })}</span>
                <span className={styles.stepName}>{stageName(q.stage)}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <p className={shell.srOnly} aria-live="polite">{announce}</p>

      {s.done ? (
        <div className={`${board.board} ${styles.summary}`}>
          <h3 ref={summaryRef} tabIndex={-1} className={board.instruction}>{t("landing.journey.sum.title", "That was the sample journey")}</h3>
          <ul className={styles.sumList}>
            {s.history.map((h) => (
              <li key={h.step} className={styles.sumRow}>
                <span className={board.chip}>{t("landing.journey.stageN", { defaultValue: "Stage {{n}}", n: JOURNEY[h.step].stage })} · {stageName(JOURNEY[h.step].stage)}</span>
                <span className={styles.sumText}>{resultLine(h)}</span>
              </li>
            ))}
          </ul>
          <p className={styles.sumNote}>
            {t("landing.journey.sum.note", "In Learnigo, questions on this idea would carry on up the ladder below, at the learner's own pace, and come back later as short reviews to check the idea has stuck.")}
          </p>
          <div className={styles.sumActions}>
            <button type="button" className={board.retryBtn} onClick={restart} data-sound="none">
              <FaRedo aria-hidden="true" /> {t("landing.journey.btn.again", "Try the sample again")}
            </button>
            <Link to="/" className={board.nextBtn} data-sound="forward">
              {t("landing.journey.btn.start", "Start learning for real")} <FaArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : (
        <div className={`${board.board} ${styles.card}`}>
          <div className={board.topRow}>
            <span className={board.chip}>
              {t("landing.journey.stageN", { defaultValue: "Stage {{n}}", n: main.stage })} · {stageName(main.stage)}
            </span>
            {s.phase === "easier" && <span className={`${board.chip} ${board.chipSoft}`}>{t("landing.journey.easierTag", "Easier related question")}</span>}
            {s.phase === "main" && s.attempt === 2 && <span className={`${board.chip} ${board.chipSoft}`}>{t("landing.journey.secondTry", "Second try, with a hint")}</span>}
          </div>

          <h3 ref={questionRef} tabIndex={-1} className={board.instruction}>{tx("instruction")}</h3>
          {item.emojiAlt ? (
            <div className={board.emoji} role="img" aria-label={t(`${base}.emojiAlt`, item.emojiAlt)}>
              <span aria-hidden="true">{item.emoji}</span>
            </div>
          ) : (
            <div className={board.emoji} aria-hidden="true">{item.emoji}</div>
          )}
          <p id={`${uid}-prompt`} className={board.promptBox}>{tx("prompt")}</p>

          <div className={board.toolRow}>
            <button type="button" className={board.toolBtn} onClick={readAloud} aria-pressed={reading} data-sound="none">
              {reading ? <FaStop aria-hidden="true" /> : <FaVolumeUp aria-hidden="true" />}
              {reading ? t("landing.voice.stop", "Stop") : t("landing.journey.readToMe", "Read to me")}
            </button>
          </div>
          {reading && voice.sentence ? <p className={board.caption}>{voice.sentence}</p> : null}
          {voice.key === item.id && voice.noVoice && !voice.speaking ? (
            <p className={board.caption}>{t("landing.voice.noVoiceShort", "No voice for this language on this device, so the words stay on screen.")}</p>
          ) : null}

          {showHint && hintNote}

          <div className={board.options} role="group" aria-labelledby={`${uid}-prompt`}>
            {options.map((o, i) => (
                <button key={`${item.id}-${s.attempt}-${i}`} type="button" className={optionClass(i)} onClick={() => choose(i)} disabled={answered} data-sound="none">
                  <span className={board.letter} aria-hidden="true">{LETTERS[i]}</span>
                  <span className={board.optText}>{o}</span>
                  {answered && i === s.picked && (
                    <>
                      <span className={board.mark} aria-hidden="true">{i === item.correct ? <FaCheck /> : <FaTimes />}</span>
                      <span className={shell.srOnly}>{i === item.correct ? t("landing.journey.srRight", "(your answer, right)") : t("landing.journey.srWrong", "(your answer, not right)")}</span>
                    </>
                  )}
                  {answered && i !== s.picked && REVEAL.has(s.outcome) && i === item.correct && (
                    <>
                      <span className={board.mark} aria-hidden="true"><FaCheck /></span>
                      <span className={shell.srOnly}>{t("landing.journey.srReveal", "(the right answer)")}</span>
                    </>
                  )}
                </button>
            ))}
          </div>

          {feedback && (
            <div className={`${board.sheet} ${good ? board.good : board.soft}`}>
              <Mascot size={64} mood={good ? "cheer" : "think"} butterfly={false} className={board.sheetMascot} />
              <div className={board.sheetText}>
                <p className={board.sheetTitle}>{feedback.title}</p>
                {s.outcome === "miss" && hintNote}
                {showExplain && <p className={board.explain}>{tx("explain")}</p>}
                <p className={board.engine}>
                  <FaRoute className={board.engineIcon} aria-hidden="true" />
                  <span>
                    <span className={board.engineLabel}>{t("landing.journey.engineLabel", "What the engine would do next")}</span>
                    {feedback.engine}
                  </span>
                </p>
              </div>
              <div className={board.actions}>
                <button ref={actionRef} type="button" className={s.outcome === "miss" ? board.retryBtn : board.nextBtn} onClick={advance} data-sound="none">
                  {feedback.action} <FaArrowRight aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
