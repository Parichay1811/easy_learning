import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCheck, FaTimes, FaUndo } from "react-icons/fa";
import { sfx } from "../../utils/sounds";
import { sequenceMarks, targetSequence, binHomes, binMark, homeOf, partnerOf, expectedAnswer, keyboardHelp } from "./marks";
import styles from "./QuestionWidgets.module.css";

// One component per interaction "family" (several new-schema interaction
// types share the same tap-based mechanic — see the registry at the bottom).
// Contract: every widget receives {question, onSubmit, disabled, speech,
// feedback} and calls onSubmit(userAnswer) once the student commits an
// answer. Shapes of userAnswer are documented per widget and matched by
// scoreAnswer.js, which compares VALUES (never positions), so shuffling the
// options on screen can never change what counts as right.
// `feedback` ({ result: null|"correct"|"wrong", revealed }) only changes how
// the tiles look once the card has judged the answer: every widget marks its
// right pieces (green, a tick) and wrong ones (soft orange, a cross), with the
// same words for screen readers, and shows the right answer when `revealed`.
// A widget that lets the learner try pieces before the answer is whole
// (match_pairs) also reports those wrong tries: onSubmit(userAnswer, { misses }).
// Choice widgets also report the order they show the options in (onOrder), so the
// card's "Hear the choices" reads them as the learner sees them.

function shuffledIndices(length) {
  const idx = Array.from({ length }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

const norm = (v) => String(v).trim().toLowerCase();

// The accepted answers for a single-choice question, normalised.
function acceptedSet(question) {
  const list = Array.isArray(question.accepted_answers) && question.accepted_answers.length
    ? question.accepted_answers
    : [question.correct_answer];
  return new Set(list.map(norm));
}

// The letter a tile shows is its place ON SCREEN (A, B, C… top to bottom),
// never its index in the original, unshuffled list.
const letterFor = (position) => String.fromCharCode(65 + position);

// Options pop in one after another; the stagger comes from --i.
const popStyle = (position) => ({ "--i": position });

// The mark on a piece once the answer is judged: a tick or a cross (never
// colour alone) and the same words for screen readers. `ok`: true | false | null.
function PieceMark({ ok, rightText, wrongText }) {
  if (ok == null) return null;
  return (
    <>
      {ok ? <FaCheck className={styles.mark} aria-hidden="true" /> : <FaTimes className={styles.mark} aria-hidden="true" />}
      <span className={styles.srOnly}>{`, ${ok ? rightText : wrongText}`}</span>
    </>
  );
}

// tap_mcq, true_false, drag_to_blank — tap one option, compare to correct_answer.
export function SingleChoice({ question, onSubmit, disabled, feedback, onOrder }) {
  const options = question.options || [];
  const order = useMemo(() => shuffledIndices(options.length), [question.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // The card reads the choices in the order they are shown ("A, seven. B, nine.").
  useEffect(() => { onOrder?.(order); }, [order]); // eslint-disable-line react-hooks/exhaustive-deps
  const [picked, setPicked] = useState(null);
  const accepted = useMemo(() => acceptedSet(question), [question]);
  const judged = feedback?.result;
  const two = options.length >= 4 && options.every((o) => String(o).length <= 18);
  return (
    <div className={`${styles.options} ${two ? styles.twoUp : ""}`} role="group">
      {order.map((i, position) => {
        const value = options[i];
        const isPicked = picked === value;
        const isRight = accepted.has(norm(value));
        const state = isPicked && judged === "correct" ? styles.right
          : isPicked && judged === "wrong" ? styles.wrongPick
          : feedback?.revealed && isRight ? styles.reveal
          : "";
        return (
          <button
            key={i}
            type="button"
            className={`${styles.option} ${styles.pop} ${state}`}
            style={popStyle(position)}
            disabled={disabled}
            onClick={() => { setPicked(value); onSubmit(value); }}
            data-hover-sound=""
          >
            <span className={styles.letter} aria-hidden="true">{letterFor(position)}</span>
            <span className={styles.optText}>{value}</span>
            {state === styles.right || state === styles.reveal ? <FaCheck className={styles.mark} aria-hidden="true" /> : null}
            {state === styles.wrongPick ? <FaTimes className={styles.mark} aria-hidden="true" /> : null}
          </button>
        );
      })}
    </div>
  );
}

// multi_select — toggle several options, then submit; compared as a set.
export function MultiSelect({ question, onSubmit, disabled, feedback, onOrder }) {
  const { t } = useTranslation();
  const options = question.options || [];
  const order = useMemo(() => shuffledIndices(options.length), [question.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { onOrder?.(order); }, [order]); // eslint-disable-line react-hooks/exhaustive-deps
  const [selected, setSelected] = useState([]);
  const correct = useMemo(
    () => new Set((Array.isArray(question.correct_answer) ? question.correct_answer : []).map(norm)),
    [question],
  );
  const toggle = (opt) => setSelected((s) => (s.includes(opt) ? s.filter((x) => x !== opt) : [...s, opt]));
  // Another go after a miss: the wrong picks (already marked) are cleared and the
  // right ones stay, so the learner fixes the answer instead of hunting for a stale tick.
  const [wasDisabled, setWasDisabled] = useState(disabled);
  if (wasDisabled !== disabled) {
    setWasDisabled(disabled);
    if (!disabled && selected.some((v) => !correct.has(norm(v)))) setSelected(selected.filter((v) => correct.has(norm(v))));
  }
  const judged = feedback?.result;
  return (
    <>
      <div className={styles.options} role="group">
        {order.map((i, position) => {
          const value = options[i];
          const on = selected.includes(value);
          const isRight = correct.has(norm(value));
          const state = judged && on ? (isRight ? styles.right : styles.wrongPick)
            : feedback?.revealed && isRight ? styles.reveal : "";
          return (
            <button
              key={i}
              type="button"
              aria-pressed={on}
              className={`${styles.option} ${styles.pop} ${on ? styles.selected : ""} ${state}`}
              style={popStyle(position)}
              disabled={disabled}
              onClick={() => toggle(value)}
              data-sound="toggle"
              data-hover-sound=""
            >
              <span className={styles.letter} aria-hidden="true">{on ? <FaCheck /> : letterFor(position)}</span>
              <span className={styles.optText}>{value}</span>
            </button>
          );
        })}
      </div>
      {!disabled && (
        <button type="button" className={styles.submitBtn} disabled={selected.length === 0} onClick={() => onSubmit(selected)}>
          {t("questionCard.check")}
        </button>
      )}
    </>
  );
}

// drag_order, tap_sequence, letter_bank — tap items into a built sequence.
// scoreAnswer.js compares the array directly (drag_order/tap_sequence) or
// joins it into a string (letter_bank), so this one component covers all three.
export function SequenceBuilder({ question, onSubmit, disabled, feedback }) {
  const { t } = useTranslation();
  const options = question.options || [];
  const order = useMemo(() => shuffledIndices(options.length), [question.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [picked, setPicked] = useState([]);
  const targetLen = Array.isArray(question.correct_answer) ? question.correct_answer.length : options.length;
  // "Try again" after a full answer: give the tiles back so they can be placed
  // again (otherwise every tile is used up and nothing can be checked).
  const [wasDisabled, setWasDisabled] = useState(disabled);
  if (wasDisabled !== disabled) {
    setWasDisabled(disabled);
    if (!disabled && picked.length >= targetLen) setPicked([]);
  }
  const remaining = order.filter((i) => !picked.includes(i));
  // Single letters or emoji become big square tiles; words flow as chips.
  const letters = options.length > 0 && options.every((o) => [...String(o)].length <= 2);

  const pick = (i) => {
    if (disabled || picked.length >= targetLen) return;
    const next = [...picked, i];
    setPicked(next);
    if (next.length === targetLen) onSubmit(next.map((idx) => options[idx]));
  };

  // After the answer is judged (or shown when the clock ran out): each placed
  // tile is marked by whether it is in the right place; the right order is
  // shown once the card reveals the answer.
  const judged = feedback?.result;
  const revealed = Boolean(feedback?.revealed) && judged !== "correct";
  const marks = judged || revealed ? sequenceMarks(question, picked.map((i) => options[i]), judged) : null;
  const rightOrder = revealed ? targetSequence(question) : null;
  // No fair piece-by-piece comparison (an equation from tiles): the row as a whole is marked.
  const rowMark = judged && marks && marks.every((m) => m == null) ? judged === "correct" : null;

  return (
    <div className={styles.sequence}>
      <div className={`${styles.builtRow} ${rowMark === true ? styles.builtRight : rowMark === false ? styles.builtWrong : ""}`} aria-live="polite">
        {picked.map((i, pos) => {
          const ok = marks ? marks[pos] : null;
          return (
            <span key={pos} className={`${styles.builtChip} ${styles.pop} ${ok === true ? styles.right : ok === false ? styles.wrongPick : ""}`}>
              {options[i]}
              <PieceMark ok={ok} rightText={t("questions.feedback.rightPlace", "in the right place")} wrongText={t("questions.feedback.wrongPlace", "not in the right place")} />
            </span>
          );
        })}
        {rowMark != null && (
          <span className={`${styles.rowMark} ${rowMark ? styles.right : styles.wrongPick}`}>
            <PieceMark ok={rowMark} rightText={t("questions.feedback.right", "right")} wrongText={t("questions.feedback.notRight", "not quite right")} />
          </span>
        )}
        {picked.length === 0 && <span className={styles.builtHint} aria-hidden="true">…</span>}
        {picked.length > 0 && !disabled && (
          <button type="button" className={styles.undoBtn} onClick={() => setPicked((p) => p.slice(0, -1))} data-sound="back">
            <FaUndo aria-hidden="true" /> {t("questionCard.undo")}
          </button>
        )}
      </div>
      <div className={`${styles.options} ${letters ? styles.tiles : styles.chips}`}>
        {remaining.map((i, position) => (
          <button key={i} type="button" className={`${styles.option} ${styles.pop}`} style={popStyle(position)} disabled={disabled} onClick={() => pick(i)} data-hover-sound="">
            <span className={styles.optText}>{options[i]}</span>
          </button>
        ))}
      </div>
      {rightOrder && (
        <div className={styles.revealRow}>
          <span className={styles.revealLabel}>{t("questions.feedback.rightOrder", "The right order:")}</span>
          {rightOrder.map((v, pos) => (
            <span key={pos} className={`${styles.builtChip} ${styles.reveal}`}>{v}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// match_pairs — tap a left item then a right item to attempt a pair. The
// board finishes once every pair is right, so the wrong pairs tried on the
// way are counted and sent with the answer (onSubmit(pairs, { misses })):
// trial and error is still right, but not right first time.
export function MatchPairs({ question, onSubmit, disabled, feedback }) {
  const { t } = useTranslation();
  const pairs = question.correct_answer || [];
  // Shuffle order is intentionally randomized per mount (this remounts once
  // per question via the parent's key={question.id}) and re-randomizing on
  // every retry is the point, so a deterministic/pure shuffle isn't used here.
  const leftItems = useMemo(() => {
    const items = pairs.map((p) => p[0]);
    // eslint-disable-next-line react-hooks/purity
    return [...items].sort(() => Math.random() - 0.5);
  }, [question.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/purity
  const rightItems = useMemo(() => [...(question.options || [])].sort(() => Math.random() - 0.5), [question.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [selectedLeft, setSelectedLeft] = useState(null);
  const [solved, setSolved] = useState([]);
  const [wrongFlash, setWrongFlash] = useState(null);
  // Wrong pairs tried on the way (kept out of render: only sent with the answer).
  const missesRef = useRef(0);

  const solvedLefts = solved.map((p) => p[0]);
  const solvedRights = solved.map((p) => p[1]);
  const isPairCorrect = (l, r) => pairs.some((p) => p[0] === l && p[1] === r);

  const pickLeft = (l) => { if (disabled || solvedLefts.includes(l)) return; setSelectedLeft(l); };
  const pickRight = (r) => {
    if (disabled || !selectedLeft || solvedRights.includes(r)) return;
    if (isPairCorrect(selectedLeft, r)) {
      const next = [...solved, [selectedLeft, r]];
      setSolved(next);
      setSelectedLeft(null);
      // The last pair finishes the question, which makes its own sound.
      if (next.length === leftItems.length) onSubmit(next, { misses: missesRef.current });
      else sfx.select();
    } else {
      missesRef.current += 1;
      sfx.wrong();
      setWrongFlash({ left: selectedLeft, right: r });
      setTimeout(() => setWrongFlash(null), 450);
      setSelectedLeft(null);
    }
  };

  // Matched pairs are marked as they are made; when the answer is shown (the
  // clock ran out) each unmatched item on the left shows its partner.
  const revealed = Boolean(feedback?.revealed);
  const matchedText = t("questions.feedback.matched", "matched");

  return (
    <div className={styles.matchGrid}>
      <div className={styles.matchCol}>
        {leftItems.map((l, position) => {
          const isSolved = solvedLefts.includes(l);
          const partner = revealed && !isSolved ? partnerOf(pairs, l) : null;
          return (
            <button
              key={l}
              type="button"
              disabled={disabled || isSolved}
              className={`${styles.matchItem} ${styles.pop} ${selectedLeft === l ? styles.matchSelected : ""} ${isSolved ? styles.matchSolved : ""} ${partner != null ? styles.matchReveal : ""} ${wrongFlash?.left === l ? styles.matchWrong : ""}`}
              style={popStyle(position)}
              aria-pressed={selectedLeft === l}
              onClick={() => pickLeft(l)}
              data-hover-sound=""
            >
              {l}
              {isSolved && <PieceMark ok rightText={matchedText} />}
              {partner != null && (
                <span className={styles.matchPartner}>
                  <span aria-hidden="true">→ </span>
                  <span className={styles.srOnly}>{`${t("questions.feedback.goesWith", "goes with")} `}</span>
                  {partner}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className={styles.matchCol}>
        {rightItems.map((r, position) => (
          <button
            key={r}
            type="button"
            disabled={disabled || solvedRights.includes(r)}
            className={`${styles.matchItem} ${styles.pop} ${solvedRights.includes(r) ? styles.matchSolved : ""} ${wrongFlash?.right === r ? styles.matchWrong : ""}`}
            style={popStyle(position + leftItems.length)}
            onClick={() => pickRight(r)}
            data-sound={selectedLeft ? "none" : undefined}
            data-hover-sound=""
          >
            {r}
            {solvedRights.includes(r) && <PieceMark ok rightText={matchedText} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// sort_bins — tap an item, then tap the bin it belongs in.
export function SortBins({ question, onSubmit, disabled, feedback }) {
  const { t } = useTranslation();
  const bins = useMemo(() => Object.keys(question.correct_answer || {}), [question.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // Shuffle order is intentionally randomized per mount (this remounts once
  // per question via the parent's key={question.id}); see MatchPairs above.
  // eslint-disable-next-line react-hooks/purity
  const items = useMemo(() => [...(question.options || [])].sort(() => Math.random() - 0.5), [question.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [placed, setPlaced] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);

  const pool = items.filter((it) => !(it in placed));
  const label = (s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
  // After the answer is judged: each sorted item is marked by whether it is in
  // a right bin; when the answer is shown, a misplaced (or unsorted) item says where it belongs.
  const homes = useMemo(() => binHomes(question), [question]);
  const judged = feedback?.result;
  const revealed = Boolean(feedback?.revealed) && judged !== "correct";
  const belongsIn = (it) => {
    const home = revealed ? homeOf(homes, it) : null;
    return home == null ? null : (
      <span className={styles.binHome}>
        <span aria-hidden="true">→ </span>
        <span className={styles.srOnly}>{`${t("questions.feedback.belongsIn", "belongs in")} `}</span>
        {label(home)}
      </span>
    );
  };

  const pickBin = (bin) => {
    if (disabled || !selectedItem) return;
    const next = { ...placed, [selectedItem]: bin };
    setPlaced(next);
    setSelectedItem(null);
    if (Object.keys(next).length === items.length) {
      const result = {};
      bins.forEach((b) => { result[b] = []; });
      Object.entries(next).forEach(([item, b]) => result[b].push(item));
      onSubmit(result);
    } else {
      sfx.select();
    }
  };
  const unplace = (it) => {
    if (disabled) return;
    sfx.tap();
    const next = { ...placed };
    delete next[it];
    setPlaced(next);
  };

  return (
    <div className={styles.sortWrap}>
      <div className={`${styles.options} ${styles.chips}`}>
        {pool.map((it, position) => (
          <button
            key={it}
            type="button"
            aria-pressed={selectedItem === it}
            className={`${styles.option} ${styles.pop} ${selectedItem === it ? styles.selected : ""}`}
            style={popStyle(position)}
            disabled={disabled}
            onClick={() => setSelectedItem(it)}
            data-hover-sound=""
          >
            <span className={styles.optText}>{it}</span>
            {belongsIn(it)}
          </button>
        ))}
      </div>
      <div className={styles.binsRow}>
        {bins.map((bin) => (
          <div
            key={bin}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled || !selectedItem}
            className={`${styles.bin} ${selectedItem ? styles.binReady : ""}`}
            onClick={() => pickBin(bin)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickBin(bin); } }}
            data-sound="none"
          >
            <div className={styles.binLabel}>{label(bin)}</div>
            <div className={styles.binItems}>
              {Object.entries(placed).filter(([, b]) => b === bin).map(([it]) => {
                const ok = judged === "correct" ? true : judged || revealed ? binMark(homes, it, bin) : null;
                return (
                  <span key={it} className={`${styles.binChip} ${ok === true ? styles.right : ok === false ? styles.wrongPick : ""}`} onClick={(e) => { e.stopPropagation(); unplace(it); }}>
                    {it}
                    <PieceMark ok={ok} rightText={t("questions.feedback.rightBin", "in the right group")} wrongText={t("questions.feedback.wrongBin", "not in this group")} />
                    {ok === false && belongsIn(it)}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// typed_short, typed_long — free text compared against accepted_answers.
export function TypedAnswer({ question, onSubmit, disabled, feedback }) {
  const { t } = useTranslation();
  const multiline = question.interaction === "typed_long";
  const [value, setValue] = useState("");
  const submit = () => { if (value.trim()) onSubmit(value.trim()); };
  const onKey = (e) => {
    if (e.key.length === 1 || e.key === "Backspace") sfx.type();
    if (!multiline && e.key === "Enter") submit();
  };
  // After the answer is judged: the box shows right or not (open writing
  // practice is never marked), and the expected answer once it is revealed.
  const judged = question.graded === false ? null : feedback?.result;
  const ok = judged === "correct" ? true : judged === "wrong" ? false : null;
  const expected = feedback?.revealed && judged !== "correct" && question.graded !== false ? expectedAnswer(question) : "";
  const field = {
    className: `${styles.typedInput} ${ok === true ? styles.typedRight : ok === false ? styles.typedWrong : ""}`,
    value,
    disabled,
    onChange: (e) => setValue(e.target.value),
    onKeyDown: onKey,
    "aria-label": question.instruction,
    "aria-invalid": ok === false ? true : undefined,
    spellCheck: false,
    // A phone must not rewrite a checked answer (autocorrect: Ana to Anna) or
    // add the capital letter the learner was asked to add (marks.js keyboardHelp).
    ...keyboardHelp(question),
  };
  return (
    <div className={styles.typedWrap}>
      <div className={styles.typedField}>
        {multiline ? <textarea rows={3} {...field} /> : <input type="text" {...field} autoComplete="off" />}
        {ok != null && (
          <span className={`${styles.typedMark} ${ok ? styles.right : styles.wrongPick}`}>
            <PieceMark ok={ok} rightText={t("questions.feedback.right", "right")} wrongText={t("questions.feedback.notRight", "not quite right")} />
          </span>
        )}
      </div>
      {expected && (
        <p className={styles.typedReveal}>
          {t("questions.feedback.answerIs", { defaultValue: "The answer: {{answer}}", answer: expected })}
        </p>
      )}
      {!disabled && (
        <button type="button" className={styles.submitBtn} disabled={!value.trim()} onClick={submit}>{t("questionCard.check")}</button>
      )}
    </div>
  );
}

// mic_record — record + transcribe via the shared speech hook, scored by
// scoreAnswer.js against speech_scoring.expected_keywords. Listens in the
// language the question's spoken text is in (`audio_lang`, from the server).
// onSubmit gets { transcript, alternatives, confidence }, { unsupported: true }
// or (with `reportErrors`) { error: "not-allowed" | "no-speech" | … } so the
// card can be kind about a microphone that did not work instead of marking it.
export function MicRecord({ question, onSubmit, disabled, speech, reportErrors = false }) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [micError, setMicError] = useState(null);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") mediaRecorder.current.stop();
    speech?.stopRecognition?.();
    setIsRecording(false);
  };

  const fail = (code, message) => {
    setIsRecording(false);
    if (reportErrors) onSubmit({ error: code });
    else setMicError(message);
  };

  const startRecording = async () => {
    setMicError(null);
    let stream = null;
    if (!window.isSecureContext) { fail("insecure", t("questionCard.micInsecure")); return; }
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError" || err.name === "SecurityError") fail("not-allowed", t("questionCard.micPermission"));
        else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") fail("audio-capture", t("questionCard.micNotFound"));
        else if (err.name === "NotReadableError") fail("audio-busy", t("questionCard.micBusy"));
        else fail("mic-error", t("questionCard.micError"));
        return;
      }
    } else if (!reportErrors) {
      setMicError(t("questionCard.micUnsupported"));
      return;
    }
    try {
      if (stream && typeof MediaRecorder !== "undefined") {
        chunks.current = [];
        const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg", "audio/mp4"]
          .find((m) => MediaRecorder.isTypeSupported?.(m)) || "";
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
        mediaRecorder.current = recorder;
        recorder.ondataavailable = (e) => chunks.current.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks.current, { type: recorder.mimeType || "audio/webm" });
          if (blob.size) setAudioUrl(URL.createObjectURL(blob));
          stream.getTracks().forEach((tr) => tr.stop());
        };
        recorder.start();
      }
      setIsRecording(true);
      const result = await speech.recognizeSpeech(question?.audio_lang);
      stopRecording();
      if (stream && !mediaRecorder.current) stream.getTracks().forEach((tr) => tr.stop());
      onSubmit(result);
    } catch {
      stopRecording();
      fail("mic-error", t("questionCard.micError"));
    }
  };

  return (
    <div className={styles.micWrap}>
      {!isRecording ? (
        <button type="button" className={`${styles.recordBtn} ${styles.pop}`} disabled={disabled} onClick={startRecording} data-sound="select">{t("questionCard.record")}</button>
      ) : (
        <button type="button" className={styles.stopBtn} onClick={stopRecording}>
          <span className={styles.recDot} aria-hidden="true" /> {t("questionCard.stop")}
        </button>
      )}
      <p className={styles.listening} aria-live="polite">{isRecording ? t("questionCard.listening", "Listening… say your answer now.") : ""}</p>
      {micError && <p className={styles.voiceWarning}>{micError}</p>}
      {audioUrl && <audio src={audioUrl} controls className={styles.audioPlayer} />}
    </div>
  );
}
