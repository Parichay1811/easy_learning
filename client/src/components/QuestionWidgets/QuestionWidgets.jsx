import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCheck, FaTimes, FaUndo } from "react-icons/fa";
import { sfx } from "../../utils/sounds";
import styles from "./QuestionWidgets.module.css";

// One component per interaction "family" (several new-schema interaction
// types share the same tap-based mechanic — see the registry at the bottom).
// Contract: every widget receives {question, onSubmit, disabled, speech,
// feedback} and calls onSubmit(userAnswer) once the student commits an
// answer. Shapes of userAnswer are documented per widget and matched by
// scoreAnswer.js, which compares VALUES (never positions), so shuffling the
// options on screen can never change what counts as right.
// `feedback` ({ result: null|"correct"|"wrong", revealed }) only changes how
// the tiles look once the card has judged the answer.

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

// tap_mcq, true_false, drag_to_blank — tap one option, compare to correct_answer.
export function SingleChoice({ question, onSubmit, disabled, feedback }) {
  const options = question.options || [];
  const order = useMemo(() => shuffledIndices(options.length), [question.id]); // eslint-disable-line react-hooks/exhaustive-deps
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
export function MultiSelect({ question, onSubmit, disabled, feedback }) {
  const { t } = useTranslation();
  const options = question.options || [];
  const order = useMemo(() => shuffledIndices(options.length), [question.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [selected, setSelected] = useState([]);
  const correct = useMemo(
    () => new Set((Array.isArray(question.correct_answer) ? question.correct_answer : []).map(norm)),
    [question],
  );
  const toggle = (opt) => setSelected((s) => (s.includes(opt) ? s.filter((x) => x !== opt) : [...s, opt]));
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
export function SequenceBuilder({ question, onSubmit, disabled }) {
  const { t } = useTranslation();
  const options = question.options || [];
  const order = useMemo(() => shuffledIndices(options.length), [question.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [picked, setPicked] = useState([]);
  const targetLen = Array.isArray(question.correct_answer) ? question.correct_answer.length : options.length;
  const remaining = order.filter((i) => !picked.includes(i));
  // Single letters or emoji become big square tiles; words flow as chips.
  const letters = options.length > 0 && options.every((o) => [...String(o)].length <= 2);

  const pick = (i) => {
    if (disabled || picked.length >= targetLen) return;
    const next = [...picked, i];
    setPicked(next);
    if (next.length === targetLen) onSubmit(next.map((idx) => options[idx]));
  };

  return (
    <div className={styles.sequence}>
      <div className={styles.builtRow} aria-live="polite">
        {picked.map((i, pos) => (
          <span key={pos} className={`${styles.builtChip} ${styles.pop}`}>{options[i]}</span>
        ))}
        {picked.length === 0 && <span className={styles.builtHint} aria-hidden="true">…</span>}
        {picked.length > 0 && !disabled && (
          <button type="button" className={styles.undoBtn} onClick={() => setPicked((p) => p.slice(0, -1))} data-sound="back">
            <FaUndo aria-hidden="true" /> {t("questionCard.undo")}
          </button>
        )}
      </div>
      <div className={`${styles.options} ${letters ? styles.tiles : styles.chips}`}>
        {remaining.map((i, position) => (
          <button key={i} type="button" className={`${styles.option} ${styles.pop}`} style={popStyle(position)} disabled={disabled} onClick={() => pick(i)}>
            <span className={styles.optText}>{options[i]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// match_pairs — tap a left item then a right item to attempt a pair.
export function MatchPairs({ question, onSubmit, disabled }) {
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
      if (next.length === leftItems.length) onSubmit(next);
      else sfx.select();
    } else {
      sfx.wrong();
      setWrongFlash({ left: selectedLeft, right: r });
      setTimeout(() => setWrongFlash(null), 450);
      setSelectedLeft(null);
    }
  };

  return (
    <div className={styles.matchGrid}>
      <div className={styles.matchCol}>
        {leftItems.map((l, position) => (
          <button
            key={l}
            type="button"
            disabled={disabled || solvedLefts.includes(l)}
            className={`${styles.matchItem} ${styles.pop} ${selectedLeft === l ? styles.matchSelected : ""} ${solvedLefts.includes(l) ? styles.matchSolved : ""} ${wrongFlash?.left === l ? styles.matchWrong : ""}`}
            style={popStyle(position)}
            aria-pressed={selectedLeft === l}
            onClick={() => pickLeft(l)}
          >
            {l}
          </button>
        ))}
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
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

// sort_bins — tap an item, then tap the bin it belongs in.
export function SortBins({ question, onSubmit, disabled }) {
  const bins = useMemo(() => Object.keys(question.correct_answer || {}), [question.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // Shuffle order is intentionally randomized per mount (this remounts once
  // per question via the parent's key={question.id}); see MatchPairs above.
  // eslint-disable-next-line react-hooks/purity
  const items = useMemo(() => [...(question.options || [])].sort(() => Math.random() - 0.5), [question.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [placed, setPlaced] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);

  const pool = items.filter((it) => !(it in placed));
  const label = (s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");

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
          >
            <span className={styles.optText}>{it}</span>
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
              {Object.entries(placed).filter(([, b]) => b === bin).map(([it]) => (
                <span key={it} className={styles.binChip} onClick={(e) => { e.stopPropagation(); unplace(it); }}>{it}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// typed_short, typed_long — free text compared against accepted_answers.
export function TypedAnswer({ question, onSubmit, disabled }) {
  const { t } = useTranslation();
  const multiline = question.interaction === "typed_long";
  const [value, setValue] = useState("");
  const submit = () => { if (value.trim()) onSubmit(value.trim()); };
  const onKey = (e) => {
    if (e.key.length === 1 || e.key === "Backspace") sfx.type();
    if (!multiline && e.key === "Enter") submit();
  };
  return (
    <div className={styles.typedWrap}>
      {multiline ? (
        <textarea
          className={styles.typedInput}
          rows={3}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          aria-label={question.instruction}
          spellCheck={false}
        />
      ) : (
        <input
          type="text"
          className={styles.typedInput}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          aria-label={question.instruction}
          autoComplete="off"
          spellCheck={false}
        />
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
export function MicRecord({ question, onSubmit, disabled, speech }) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [micError, setMicError] = useState(null);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") mediaRecorder.current.stop();
    setIsRecording(false);
  };

  const startRecording = async () => {
    if (!window.isSecureContext) { setMicError(t("questionCard.micInsecure")); return; }
    if (!navigator.mediaDevices?.getUserMedia) { setMicError(t("questionCard.micUnsupported")); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg"]
        .find((m) => MediaRecorder.isTypeSupported(m)) || "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorder.current = recorder;
      recorder.ondataavailable = (e) => chunks.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: recorder.mimeType || "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setIsRecording(true);
      setMicError(null);

      const result = await speech.recognizeSpeech(question?.audio_lang);
      stopRecording();
      onSubmit(result);
    } catch (err) {
      let msg = t("questionCard.micError");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") msg = t("questionCard.micPermission");
      else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") msg = t("questionCard.micNotFound");
      else if (err.name === "NotReadableError") msg = t("questionCard.micBusy");
      setMicError(msg);
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
      {micError && <p className={styles.voiceWarning}>{micError}</p>}
      {audioUrl && <audio src={audioUrl} controls className={styles.audioPlayer} />}
    </div>
  );
}
