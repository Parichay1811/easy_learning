// The editor's form state <-> the question shape the widgets, scoreAnswer and
// the server (server/utils/questionShape.js) use.

const list = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);

export const EMPTY = {
  module: "read", subject: "english", interaction: "tap_mcq",
  instruction: "", prompt: "", emoji: "", imageUrl: "", imageAlt: "", audio_text: "",
  hints: [""], feedback: { correct: "", incorrect: "", second_try: "" }, worked_example: "",
  options: ["", ""], correctIndex: 0, correctSet: [], order: ["", "", ""], sequence: [],
  word: "", pairs: [["", ""], ["", ""]], bins: [{ name: "", items: "" }, { name: "", items: "" }],
  answer: "", alternatives: "", keywords: "", sample: "",
  skills: "", gradeBand: "", difficulty: 2, curriculumCode: "", estimatedSeconds: "", points: 10,
  batchIds: [],
};

// Sensible starting content when the type changes, so the preview is never blank.
export function starterFor(interaction) {
  switch (interaction) {
    case "true_false": return { options: ["True", "False"], correctIndex: 0 };
    case "multi_select": return { options: ["", "", ""], correctSet: [] };
    case "drag_order": return { order: ["", "", ""] };
    case "tap_sequence": return { options: ["", "", ""], sequence: [] };
    default: return {};
  }
}

export function fromQuestion(q) {
  const f = { ...EMPTY, module: q.module || "read", subject: q.subject || "english", interaction: q.interaction || "tap_mcq" };
  f.instruction = q.instruction || "";
  f.prompt = q.prompt || "";
  f.emoji = q.image?.emoji || "";
  f.imageUrl = q.image?.url || "";
  f.imageAlt = q.image?.alt || "";
  f.audio_text = q.audio_text || "";
  f.hints = Array.isArray(q.hints) && q.hints.length ? [...q.hints] : [""];
  f.feedback = { correct: q.feedback?.correct || "", incorrect: q.feedback?.incorrect || "", second_try: q.feedback?.second_try || "" };
  f.worked_example = q.worked_example || "";
  const opts = Array.isArray(q.options) ? [...q.options] : [];
  const ca = q.correct_answer;
  switch (f.interaction) {
    case "tap_mcq": case "true_false": case "drag_to_blank":
      f.options = opts.length ? opts : ["", ""];
      f.correctIndex = Math.max(0, opts.findIndex((o) => String(o).toLowerCase() === String(ca).toLowerCase()));
      break;
    case "multi_select":
      f.options = opts; f.correctSet = (ca || []).map((c) => opts.findIndex((o) => o === c)).filter((i) => i >= 0);
      break;
    case "drag_order": f.order = Array.isArray(ca) ? [...ca] : opts; break;
    case "tap_sequence": f.options = opts; f.sequence = Array.isArray(ca) ? [...ca] : []; break;
    case "letter_bank": f.word = String(ca || ""); break;
    case "match_pairs": f.pairs = Array.isArray(ca) ? ca.map((p) => [p[0], p[1]]) : EMPTY.pairs; break;
    case "sort_bins": f.bins = ca && typeof ca === "object" ? Object.entries(ca).map(([name, items]) => ({ name, items: (items || []).join(", ") })) : EMPTY.bins; break;
    case "typed_short": case "typed_long":
      f.answer = String(ca || "");
      f.alternatives = (q.accepted_answers || []).filter((a) => a !== ca).join(", ");
      break;
    case "mic_record":
      f.keywords = (q.speech_scoring?.expected_keywords || []).join(", ");
      f.sample = q.speech_scoring?.sample_answer || "";
      break;
    default: break;
  }
  f.skills = (q.skillIds || []).join(", ");
  f.gradeBand = q.gradeBand || "";
  f.difficulty = q.difficulty || q.level || 2;
  f.curriculumCode = q.curriculumCode || "";
  f.estimatedSeconds = q.estimatedSeconds ?? "";
  f.points = q.points || 10;
  return f;
}

// The body sent to the server.
export function toPayload(f) {
  const clean = (arr) => arr.map((x) => String(x).trim()).filter(Boolean);
  const p = {
    module: f.module, subject: f.subject, interaction: f.interaction,
    instruction: f.instruction, prompt: f.prompt, emoji: f.emoji, imageUrl: f.imageUrl, imageAlt: f.imageAlt, audio_text: f.audio_text,
    hints: clean(f.hints), feedback: f.feedback, worked_example: f.worked_example,
    skillIds: list(f.skills), gradeBand: f.gradeBand || undefined, difficulty: Number(f.difficulty) || 2,
    curriculumCode: f.curriculumCode, estimatedSeconds: f.estimatedSeconds === "" ? undefined : Number(f.estimatedSeconds), points: Number(f.points) || 10,
    batchIds: f.batchIds,
  };
  switch (f.interaction) {
    case "tap_mcq": case "true_false": case "drag_to_blank": {
      p.options = f.options.map((o) => o.trim());
      p.correct_answer = p.options[f.correctIndex] || "";
      p.options = p.options.filter(Boolean);
      break;
    }
    case "multi_select":
      p.correct_answer = f.correctSet.map((i) => (f.options[i] || "").trim()).filter(Boolean);
      p.options = clean(f.options);
      break;
    case "drag_order": p.correct_answer = clean(f.order); p.options = p.correct_answer; break;
    case "tap_sequence": p.options = clean(f.options); p.correct_answer = f.sequence.filter((x) => p.options.includes(x)); break;
    case "letter_bank": p.correct_answer = f.word.trim(); p.options = [...f.word.replace(/\s+/g, "")]; break;
    case "match_pairs": p.correct_answer = f.pairs.map(([a, b]) => [a.trim(), b.trim()]).filter(([a, b]) => a && b); break;
    case "sort_bins": p.correct_answer = Object.fromEntries(f.bins.filter((b) => b.name.trim()).map((b) => [b.name.trim(), list(b.items)])); break;
    case "typed_short": case "typed_long": p.correct_answer = f.answer.trim(); p.accepted_answers = list(f.alternatives); break;
    case "mic_record": p.speech_scoring = { expected_keywords: list(f.keywords), sample_answer: f.sample }; p.correct_answer = f.sample; break;
    default: break;
  }
  return p;
}

// What the real QuestionCard renders in the live preview.
export function toPreview(f) {
  const p = toPayload(f);
  const q = {
    interaction: p.interaction, instruction: p.instruction || "…", prompt: p.prompt, audio_text: p.audio_text || null,
    image: p.imageUrl ? { mode: "image", url: p.imageUrl, alt: p.imageAlt } : p.emoji ? { mode: "emoji", emoji: p.emoji } : null,
    options: p.options || null, correct_answer: p.correct_answer, accepted_answers: p.accepted_answers,
    hints: p.hints, feedback: p.feedback, worked_example: p.worked_example, speech_scoring: p.speech_scoring,
  };
  if (["tap_mcq", "true_false", "drag_to_blank"].includes(q.interaction)) q.accepted_answers = [q.correct_answer];
  if (q.interaction === "match_pairs") q.options = (q.correct_answer || []).map((x) => x[1]);
  if (q.interaction === "sort_bins") q.options = Object.values(q.correct_answer || {}).flat();
  if (q.interaction === "typed_short" || q.interaction === "typed_long" || q.interaction === "letter_bank") q.accepted_answers = [q.correct_answer, ...(p.accepted_answers || [])];
  q.id = JSON.stringify([q.interaction, q.options, q.correct_answer]).slice(0, 400);
  return q;
}
