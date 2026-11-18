// One test question on the familiar wooden-board card (QuestionCard styles).
// Unlike practice, nothing is checked in the browser: the answer key never
// reaches it. Answers can be changed until the test is handed in (or, with
// instant feedback, until "Check").
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaVolumeUp, FaLightbulb, FaUndo } from "react-icons/fa";
import { MicRecord } from "../QuestionWidgets/QuestionWidgets";
import { useSpeech } from "../../hooks/useSpeech";
import card from "../QuestionCard/QuestionCard.module.css";
import w from "../QuestionWidgets/QuestionWidgets.module.css";
import s from "./TestQuestion.module.css";

function Choice({ options, value, onChange, disabled, label }) {
  return (
    <div className={w.options} role="radiogroup" aria-label={label}>
      {options.map((o, i) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} className={`${w.option} ${value === o ? w.selected : ""}`} disabled={disabled} onClick={() => onChange(o)}>
          <span className={w.letter}>{String.fromCharCode(65 + i)}</span>{o}
        </button>
      ))}
    </div>
  );
}

function Multi({ options, value = [], onChange, disabled, label }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div className={w.options} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o} type="button" aria-pressed={value.includes(o)} className={`${w.option} ${value.includes(o) ? w.selected : ""}`} disabled={disabled} onClick={() => toggle(o)}>{o}</button>
      ))}
    </div>
  );
}

// Tap tiles into a row (drag_order, tap_sequence, letter_bank).
function Sequence({ options, target, value = [], onChange, disabled }) {
  const { t } = useTranslation();
  const used = [...value];
  const remaining = options.map((o, i) => ({ o, i })).filter(({ o }) => { const k = used.indexOf(o); if (k >= 0) { used.splice(k, 1); return false; } return true; });
  return (
    <div>
      <div className={w.builtRow} aria-live="polite">
        {value.map((o, i) => <span key={i} className={w.builtChip}>{o}</span>)}
        {value.length > 0 && !disabled && <button type="button" className={w.undoBtn} onClick={() => onChange(value.slice(0, -1))}><FaUndo aria-hidden="true" /> {t("questionCard.undo")}</button>}
      </div>
      <div className={w.options}>
        {remaining.map(({ o, i }) => (
          <button key={i} type="button" className={w.option} disabled={disabled || value.length >= target} onClick={() => onChange([...value, o])}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function Match({ left, right, value = [], onChange, disabled }) {
  const { t } = useTranslation();
  const [sel, setSel] = useState(null);
  const pairedL = value.map((p) => p[0]);
  const pairedR = value.map((p) => p[1]);
  const pickRight = (r) => {
    if (disabled || !sel || pairedR.includes(r)) return;
    onChange([...value, [sel, r]]);
    setSel(null);
  };
  return (
    <div>
      <div className={w.matchGrid}>
        <div className={w.matchCol}>
          {left.map((l) => <button key={l} type="button" disabled={disabled || pairedL.includes(l)} aria-pressed={sel === l} className={`${w.matchItem} ${sel === l ? w.matchSelected : ""} ${pairedL.includes(l) ? w.matchSolved : ""}`} onClick={() => setSel(l)}>{l}</button>)}
        </div>
        <div className={w.matchCol}>
          {right.map((r) => <button key={r} type="button" disabled={disabled || pairedR.includes(r)} className={`${w.matchItem} ${pairedR.includes(r) ? w.matchSolved : ""}`} onClick={() => pickRight(r)}>{r}</button>)}
        </div>
      </div>
      {value.length > 0 && (
        <div className={w.builtRow}>
          {value.map(([l, r]) => (
            <button key={l} type="button" className={w.builtChip} disabled={disabled} onClick={() => onChange(value.filter((p) => p[0] !== l))} aria-label={t("tests.unpair", { defaultValue: "Undo {{l}} and {{r}}", l, r })}>{l} ↔ {r} ✕</button>
          ))}
        </div>
      )}
    </div>
  );
}

function Sort({ bins, items, value = {}, onChange, disabled }) {
  const [sel, setSel] = useState(null);
  const placed = Object.values(value).flat();
  const pool = items.filter((it) => !placed.includes(it));
  const label = (x) => x.charAt(0).toUpperCase() + x.slice(1).replace(/_/g, " ");
  const put = (bin) => {
    if (disabled || !sel) return;
    const next = Object.fromEntries(bins.map((b) => [b, (value[b] || []).filter((x) => x !== sel)]));
    next[bin] = [...next[bin], sel];
    onChange(next);
    setSel(null);
  };
  const remove = (bin, it) => !disabled && onChange({ ...value, [bin]: (value[bin] || []).filter((x) => x !== it) });
  return (
    <div>
      <div className={w.options}>
        {pool.map((it) => <button key={it} type="button" aria-pressed={sel === it} className={`${w.option} ${sel === it ? w.selected : ""}`} disabled={disabled} onClick={() => setSel(it)}>{it}</button>)}
      </div>
      <div className={w.binsRow}>
        {bins.map((b) => (
          <div key={b} className={w.bin}>
            <button type="button" className={s.binBtn} disabled={disabled || !sel} onClick={() => put(b)}>{label(b)}</button>
            <div className={w.binItems}>{(value[b] || []).map((it) => <button type="button" key={it} className={w.binChip} onClick={() => remove(b, it)}>{it}</button>)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Typed({ multiline, value = "", onChange, disabled, label }) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <div className={w.typedWrap}>
      <Tag className={w.typedInput} aria-label={label} rows={multiline ? 5 : undefined} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} spellCheck={false} autoComplete="off" />
    </div>
  );
}

export default function TestQuestion({ item, value, onChange, disabled, result, hints, listen, autoRead, largeText, subject, onHint }) {
  const { t } = useTranslation();
  const speech = useSpeech(subject);
  const [hintOpen, setHintOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const spoke = useRef(false);
  const readText = useMemo(() => [item.instruction, item.prompt, item.audio_text].filter(Boolean).join(". "), [item]);

  const play = (text) => speech.speak(text, { onStart: () => setPlaying(true), onEnd: () => setPlaying(false), onError: () => setPlaying(false) });
  useEffect(() => {
    if (autoRead && !spoke.current && readText) { spoke.current = true; play(readText); }
  }, [autoRead, readText]); // eslint-disable-line react-hooks/exhaustive-deps

  const label = item.instruction;
  let widget;
  switch (item.interaction) {
    case "tap_mcq": case "true_false": case "drag_to_blank":
      widget = <Choice options={item.options || []} value={value} onChange={onChange} disabled={disabled} label={label} />; break;
    case "multi_select":
      widget = <Multi options={item.options || []} value={value || []} onChange={onChange} disabled={disabled} label={label} />; break;
    case "drag_order": case "tap_sequence":
      widget = <Sequence options={item.options || []} target={item.targetLength || (item.options || []).length} value={value || []} onChange={onChange} disabled={disabled} />; break;
    case "letter_bank":
      widget = <Sequence options={item.options || []} target={item.targetLength || (item.options || []).length} value={typeof value === "string" ? [...value] : value || []} onChange={(v) => onChange(v.join(""))} disabled={disabled} />; break;
    case "match_pairs":
      widget = <Match left={item.left || []} right={item.options || []} value={value || []} onChange={onChange} disabled={disabled} />; break;
    case "sort_bins":
      widget = <Sort bins={item.bins || []} items={item.options || []} value={value || {}} onChange={onChange} disabled={disabled} />; break;
    case "typed_short": case "typed_long":
      widget = <Typed multiline={item.interaction === "typed_long"} value={value || ""} onChange={onChange} disabled={disabled} label={label} />; break;
    case "mic_record":
      widget = (
        <div>
          <MicRecord question={item} disabled={disabled} speech={speech} onSubmit={(r) => onChange({ transcript: r?.transcript || "" })} />
          {value?.transcript ? <p className={s.heard}>{t("tests.heard", { defaultValue: "We heard: “{{text}}”", text: value.transcript })}</p> : null}
        </div>
      ); break;
    default: widget = <p>{t("tests.unknownType", { defaultValue: "This question type can't be shown." })}</p>;
  }

  const fmt = (a) => (Array.isArray(a) ? a.map((x) => (Array.isArray(x) ? x.join(" → ") : x)).join(", ") : a && typeof a === "object" ? Object.entries(a).map(([k, v]) => `${k}: ${(v || []).join(", ")}`).join(" · ") : String(a ?? ""));

  return (
    <div className={`${card.card} ${largeText ? s.large : ""}`}>
      <div className={card.stimulus}>
        <p className={card.instruction}>{item.instruction}</p>
        {item.image?.url ? <img className={card.picture} src={item.image.url} alt={item.image.alt || ""} /> : item.image?.emoji && <div className={card.emoji} aria-hidden="true">{item.image.emoji}</div>}
        {item.prompt && <p className={card.promptBox}>{item.prompt}</p>}
        <div className={card.toolRow}>
          {(item.audio_text || (listen && readText)) && (
            <button type="button" className={card.toolBtn} disabled={playing} onClick={() => play(item.audio_text && !listen ? item.audio_text : readText)}>
              <FaVolumeUp style={{ marginRight: 6, verticalAlign: "middle" }} aria-hidden="true" />
              {playing ? t("questionCard.playing") : t("questionCard.listen")}
            </button>
          )}
          {hints && item.hints?.length > 0 && !disabled && (
            <button type="button" className={card.toolBtn} aria-expanded={hintOpen} onClick={() => { if (!hintOpen) onHint?.(); setHintOpen((h) => !h); }}>
              <FaLightbulb style={{ marginRight: 6, verticalAlign: "middle" }} aria-hidden="true" />
              {t("questionCard.hint")}
            </button>
          )}
        </div>
        {hintOpen && !disabled && <p className={card.hintBubble}>{item.hints[0]}</p>}
        {widget}
      </div>
      {result && (
        <div className={card.feedback} role="status">
          {result.needsMarking ? <p className={card.revealText}>{t("tests.teacherMarks", { defaultValue: "Your teacher will mark this one." })}</p> : (
            <>
              <p className={result.correct ? card.correctText : card.wrongText}>{result.feedback || (result.correct ? t("tests.right", { defaultValue: "That's right!" }) : t("tests.notQuite", { defaultValue: "Not quite." }))}</p>
              {!result.correct && result.workedExample && <p className={card.workedExample}>{result.workedExample}</p>}
              {!result.correct && result.correctAnswer != null && <p className={card.revealText}>{t("questionCard.correctAnswer", { answer: fmt(result.correctAnswer) })}</p>}
              {result.comment && <p className={card.revealText}>💬 {result.comment}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
