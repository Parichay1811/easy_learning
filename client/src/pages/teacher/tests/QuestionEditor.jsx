// In-app question editor for all 12 interaction types (TCH-020/021/024/025/027)
// with a live preview on the real wooden-board QuestionCard.
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaMobileAlt, FaDesktop, FaRedo, FaCopy, FaShareAlt, FaImage, FaSave } from "react-icons/fa";
import QuestionCard from "../../../components/QuestionCard/QuestionCard";
import { Button, Skeleton } from "../../../components/dashboard";
import { useTeacherApi, useT, INTERACTION_LABELS, MODULE_KEYS, SUBJECT_KEYS, cap } from "./api";
import { EMPTY, fromQuestion, toPayload, toPreview, starterFor } from "./questionForm";
import { Locked } from "./TeacherTestsApp";
import s from "./tests.module.css";

const GRADE_BANDS = ["K-2", "3-5", "6-8", "9-10", "11-12", "adult"];

function TextList({ label, items, onChange, min = 0, max = 12, placeholder, reorder }) {
  const tt = useT();
  const set = (i, v) => onChange(items.map((x, j) => (j === i ? v : x)));
  const move = (i, d) => { const a = [...items]; [a[i], a[i + d]] = [a[i + d], a[i]]; onChange(a); };
  return (
    <fieldset className={s.field} style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className={s.fieldLabel}>{label}</legend>
      {items.map((v, i) => (
        <div key={i} className={s.row} style={{ alignItems: "center", flexWrap: "nowrap" }}>
          <input aria-label={`${label} ${i + 1}`} value={v} placeholder={placeholder} onChange={(e) => set(i, e.target.value)} style={{ flex: 1, minWidth: 0 }} />
          {reorder && <button type="button" className={s.iconBtn} disabled={i === 0} onClick={() => move(i, -1)} aria-label={tt("ed.up", "Move up")}><FaArrowUp aria-hidden="true" /></button>}
          {reorder && <button type="button" className={s.iconBtn} disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label={tt("ed.down", "Move down")}><FaArrowDown aria-hidden="true" /></button>}
          <button type="button" className={s.iconBtn} disabled={items.length <= min} onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={tt("ed.remove", "Remove {{label}} {{n}}", { label, n: i + 1 })}><FaTrash aria-hidden="true" /></button>
        </div>
      ))}
      {items.length < max && <div><Button size="sm" variant="ghost" icon={FaPlus} onClick={() => onChange([...items, ""])}>{tt("ed.add", "Add")}</Button></div>}
    </fieldset>
  );
}

function AnswerFields({ f, set }) {
  const tt = useT();
  const optionsFixed = f.interaction === "true_false";
  switch (f.interaction) {
    case "tap_mcq": case "true_false": case "drag_to_blank":
      return (
        <fieldset className={s.field} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className={s.fieldLabel}>{tt("ed.optionsPick", "Options (choose the right one)")}</legend>
          {f.options.map((o, i) => (
            <div key={i} className={s.row} style={{ alignItems: "center", flexWrap: "nowrap" }}>
              <label className={s.check} style={{ minHeight: 40 }}>
                <input type="radio" name="correct" checked={f.correctIndex === i} onChange={() => set({ correctIndex: i })} />
                <span className={s.srOnly}>{tt("ed.markRight", "Right answer")}</span>
              </label>
              <input aria-label={tt("ed.option", "Option {{n}}", { n: i + 1 })} value={o} onChange={(e) => set({ options: f.options.map((x, j) => (j === i ? e.target.value : x)) })} style={{ flex: 1, minWidth: 0 }} />
              {!optionsFixed && <button type="button" className={s.iconBtn} disabled={f.options.length <= 2} onClick={() => set({ options: f.options.filter((_, j) => j !== i), correctIndex: f.correctIndex >= i && f.correctIndex > 0 ? f.correctIndex - 1 : f.correctIndex })} aria-label={tt("ed.removeOption", "Remove option {{n}}", { n: i + 1 })}><FaTrash aria-hidden="true" /></button>}
            </div>
          ))}
          {!optionsFixed && f.options.length < 8 && <div><Button size="sm" variant="ghost" icon={FaPlus} onClick={() => set({ options: [...f.options, ""] })}>{tt("ed.addOption", "Add option")}</Button></div>}
        </fieldset>
      );
    case "multi_select":
      return (
        <fieldset className={s.field} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className={s.fieldLabel}>{tt("ed.optionsTick", "Options (tick every right one)")}</legend>
          {f.options.map((o, i) => (
            <div key={i} className={s.row} style={{ alignItems: "center", flexWrap: "nowrap" }}>
              <label className={s.check} style={{ minHeight: 40 }}>
                <input type="checkbox" checked={f.correctSet.includes(i)} onChange={(e) => set({ correctSet: e.target.checked ? [...f.correctSet, i] : f.correctSet.filter((x) => x !== i) })} />
                <span className={s.srOnly}>{tt("ed.markRight", "Right answer")}</span>
              </label>
              <input aria-label={tt("ed.option", "Option {{n}}", { n: i + 1 })} value={o} onChange={(e) => set({ options: f.options.map((x, j) => (j === i ? e.target.value : x)) })} style={{ flex: 1, minWidth: 0 }} />
              <button type="button" className={s.iconBtn} disabled={f.options.length <= 2} onClick={() => set({ options: f.options.filter((_, j) => j !== i), correctSet: f.correctSet.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)) })} aria-label={tt("ed.removeOption", "Remove option {{n}}", { n: i + 1 })}><FaTrash aria-hidden="true" /></button>
            </div>
          ))}
          {f.options.length < 8 && <div><Button size="sm" variant="ghost" icon={FaPlus} onClick={() => set({ options: [...f.options, ""] })}>{tt("ed.addOption", "Add option")}</Button></div>}
        </fieldset>
      );
    case "drag_order":
      return <TextList label={tt("ed.orderItems", "Items in the right order (students see them shuffled)")} items={f.order} min={2} reorder onChange={(order) => set({ order })} />;
    case "tap_sequence": {
      const opts = f.options.map((x) => x.trim()).filter(Boolean);
      return (
        <>
          <TextList label={tt("ed.tapOptions", "Things students can tap")} items={f.options} min={1} onChange={(options) => set({ options })} />
          <div className={s.field}>
            <span>{tt("ed.sequence", "The taps, in order")}</span>
            <div className={s.chips}>
              {f.sequence.map((x, i) => <button type="button" key={i} className={`${s.chip} ${s.chipAccent}`} onClick={() => set({ sequence: f.sequence.filter((_, j) => j !== i) })} aria-label={tt("ed.removeTap", "Remove tap {{n}}: {{x}}", { n: i + 1, x })}>{i + 1}. {x} ✕</button>)}
              {!f.sequence.length && <span className={s.small}>{tt("ed.sequenceHint", "Tap the buttons below in the right order.")}</span>}
            </div>
            <div className={s.chips}>{opts.map((o) => <Button key={o} size="sm" variant="ghost" onClick={() => set({ sequence: [...f.sequence, o] })}>{o}</Button>)}</div>
          </div>
        </>
      );
    }
    case "letter_bank":
      return (
        <label className={s.field}>
          <span>{tt("ed.word", "The word students build")}</span>
          <input value={f.word} onChange={(e) => set({ word: e.target.value })} />
          <small>{tt("ed.wordHint", "Each letter becomes a tile, shuffled for the student.")}</small>
        </label>
      );
    case "match_pairs":
      return (
        <fieldset className={s.field} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className={s.fieldLabel}>{tt("ed.pairs", "Pairs (left matches right)")}</legend>
          {f.pairs.map(([a, b], i) => (
            <div key={i} className={s.row} style={{ alignItems: "center", flexWrap: "nowrap" }}>
              <input aria-label={tt("ed.left", "Left {{n}}", { n: i + 1 })} value={a} onChange={(e) => set({ pairs: f.pairs.map((p, j) => (j === i ? [e.target.value, p[1]] : p)) })} style={{ flex: 1, minWidth: 0 }} />
              <span aria-hidden="true">↔</span>
              <input aria-label={tt("ed.right", "Right {{n}}", { n: i + 1 })} value={b} onChange={(e) => set({ pairs: f.pairs.map((p, j) => (j === i ? [p[0], e.target.value] : p)) })} style={{ flex: 1, minWidth: 0 }} />
              <button type="button" className={s.iconBtn} disabled={f.pairs.length <= 2} onClick={() => set({ pairs: f.pairs.filter((_, j) => j !== i) })} aria-label={tt("ed.removePair", "Remove pair {{n}}", { n: i + 1 })}><FaTrash aria-hidden="true" /></button>
            </div>
          ))}
          {f.pairs.length < 8 && <div><Button size="sm" variant="ghost" icon={FaPlus} onClick={() => set({ pairs: [...f.pairs, ["", ""]] })}>{tt("ed.addPair", "Add pair")}</Button></div>}
        </fieldset>
      );
    case "sort_bins":
      return (
        <fieldset className={s.field} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className={s.fieldLabel}>{tt("ed.bins", "Groups and what goes in each (comma separated)")}</legend>
          {f.bins.map((b, i) => (
            <div key={i} className={s.row} style={{ alignItems: "center", flexWrap: "nowrap" }}>
              <input aria-label={tt("ed.binName", "Group {{n}} name", { n: i + 1 })} placeholder={tt("ed.binNamePh", "animals")} value={b.name} onChange={(e) => set({ bins: f.bins.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} style={{ flex: "0 1 34%", minWidth: 0 }} />
              <input aria-label={tt("ed.binItems", "Group {{n}} items", { n: i + 1 })} placeholder={tt("ed.binItemsPh", "cat, dog, fish")} value={b.items} onChange={(e) => set({ bins: f.bins.map((x, j) => (j === i ? { ...x, items: e.target.value } : x)) })} style={{ flex: 1, minWidth: 0 }} />
              <button type="button" className={s.iconBtn} disabled={f.bins.length <= 2} onClick={() => set({ bins: f.bins.filter((_, j) => j !== i) })} aria-label={tt("ed.removeBin", "Remove group {{n}}", { n: i + 1 })}><FaTrash aria-hidden="true" /></button>
            </div>
          ))}
          {f.bins.length < 4 && <div><Button size="sm" variant="ghost" icon={FaPlus} onClick={() => set({ bins: [...f.bins, { name: "", items: "" }] })}>{tt("ed.addBin", "Add group")}</Button></div>}
        </fieldset>
      );
    case "typed_short": case "typed_long":
      return (
        <div className={s.grid2}>
          <label className={s.field}>
            <span>{f.interaction === "typed_long" ? tt("ed.model", "Model answer (for marking)") : tt("ed.answer", "Right answer")}</span>
            {f.interaction === "typed_long" ? <textarea value={f.answer} onChange={(e) => set({ answer: e.target.value })} /> : <input value={f.answer} onChange={(e) => set({ answer: e.target.value })} />}
          </label>
          <label className={s.field}>
            <span>{tt("ed.alternatives", "Also accept (comma separated)")}</span>
            <input value={f.alternatives} onChange={(e) => set({ alternatives: e.target.value })} placeholder="7, seven" />
            {f.interaction === "typed_long" && <small>{tt("ed.longHint", "In tests, long answers go to your marking queue.")}</small>}
          </label>
        </div>
      );
    case "mic_record":
      return (
        <div className={s.grid2}>
          <label className={s.field}>
            <span>{tt("ed.keywords", "Key words to listen for (comma separated)")}</span>
            <input value={f.keywords} onChange={(e) => set({ keywords: e.target.value })} placeholder="soap" />
            <small>{tt("ed.keywordsHint", "Half of them must be heard for a right answer.")}</small>
          </label>
          <label className={s.field}>
            <span>{tt("ed.sample", "Sample answer")}</span>
            <input value={f.sample} onChange={(e) => set({ sample: e.target.value })} />
          </label>
        </div>
      );
    default: return null;
  }
}

export default function QuestionEditor() {
  const api = useTeacherApi();
  const tt = useT();
  const navigate = useNavigate();
  const { module: pm, subject: ps, id } = useParams();
  const [f, setF] = useState(EMPTY);
  const [meta, setMeta] = useState(null);
  const [loaded, setLoaded] = useState(!id);
  const [errors, setErrors] = useState([]);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [device, setDevice] = useState("phone");
  const [tryKey, setTryKey] = useState(0);
  const [stats, setStats] = useState(null);
  const [groups, setGroups] = useState([]);
  const [locked, setLocked] = useState(null);

  useEffect(() => {
    (async () => {
      const g = await api.get("/test-groups");
      if (g.ok) setGroups(g.groups);
      if (!id) return;
      const r = await api.get(`/bank/questions/${pm}/${ps}/${id}`);
      if (r.locked) { setLocked(r.locked); return; }
      if (!r.ok) { setMsg({ kind: "error", text: r.message || tt("ed.notFound", "Question not found") }); setLoaded(true); return; }
      setF(fromQuestion(r.question));
      setMeta(r);
      setLoaded(true);
      const st = await api.get(`/bank/questions/${pm}/${ps}/${id}/stats`);
      if (st.ok) setStats(st.stats);
    })();
  }, [api, id, pm, ps, tt]);

  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const preview = useMemo(() => toPreview(f), [f]);
  const readOnly = !!meta && !meta.question.mine;
  const err = (field) => errors.filter((e) => e.field === field).map((e) => e.message).join(" ");

  const save = async () => {
    setSaving(true); setErrors([]); setMsg(null);
    const body = toPayload(f);
    const r = id ? await api.put(`/bank/questions/${pm}/${ps}/${id}`, body) : await api.post("/bank/questions", body);
    setSaving(false);
    if (r.locked) { setLocked(r.locked); return; }
    if (!r.ok) { setErrors(r.errors || []); setMsg({ kind: "error", text: r.message || tt("ed.saveError", "Could not save") }); return; }
    const pending = r.status === "pending";
    setMsg({ kind: pending ? "warn" : "good", text: pending ? tt("ed.savedPending", "Saved. It is waiting for your admin's review before students can see it.") : tt("ed.saved", "Saved and ready to use.") })
    if (!id) navigate(`/teacher/tests/bank/${f.module}/${f.subject}/${r.question._id}`, { replace: true });
    else setMeta((m) => (m ? { ...m, question: { ...m.question, status: r.status, version: r.version } } : m));
  };

  const duplicate = async () => {
    const r = await api.post(`/bank/questions/${pm}/${ps}/${id}/duplicate`, {});
    if (r.ok) navigate(`/teacher/tests/bank/${r.question.module}/${r.question.subject}/${r.question._id}`);
    else setMsg({ kind: "error", text: r.message });
  };
  const share = async () => {
    const r = await api.post(`/bank/questions/${pm}/${ps}/${id}/share`, {});
    if (r.locked) setMsg({ kind: "warn", text: tt("ed.shareLocked", "Sharing with the community is part of a bigger plan.") });
    else setMsg({ kind: r.ok ? "good" : "error", text: r.ok ? tt("ed.shared", "Sent to the Learnigo content team. You'll be credited if it's accepted.") : r.message });
  };
  const uploadImage = async (file) => {
    if (!file) return;
    const form = new FormData();
    form.append("image", file);
    const r = await api.upload("/bank/images", form);
    if (r.ok) set({ imageUrl: r.url });
    else setMsg({ kind: "error", text: r.message });
  };

  if (locked) return <Locked module={locked} />;
  if (!loaded) return <Skeleton variant="chart" />;

  const status = meta?.question.status;
  const review = meta?.review;

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1>{id ? tt("ed.editTitle", "Edit question") : tt("ed.newTitle", "New question")}</h1>
          <p>{tt("ed.sub", "What you see on the right is exactly what students get.")}</p>
        </div>
        <div className={s.actions}>
          {meta && <span className={`${s.chip} ${status === "approved" ? s.chipGood : status === "rejected" ? s.chipAlert : s.chipWarn}`}>{tt(`status.${status}`, cap(status))}</span>}
          {meta && <span className={s.chip}>{tt("ed.version", "Version {{v}}", { v: meta.question.version })}</span>}
          {id && <Button variant="ghost" icon={FaCopy} onClick={duplicate}>{readOnly ? tt("ed.copyToEdit", "Copy to my bank") : tt("ed.duplicate", "Duplicate")}</Button>}
          {id && !readOnly && status === "approved" && <Button variant="ghost" icon={FaShareAlt} onClick={share}>{tt("ed.share", "Share with all teachers")}</Button>}
          {!readOnly && <Button icon={FaSave} onClick={save} disabled={saving}>{saving ? tt("ed.saving", "Saving…") : tt("ed.save", "Save")}</Button>}
        </div>
      </div>

      {msg && <p role={msg.kind === "error" ? "alert" : "status"} className={`${s.notice} ${msg.kind === "error" ? s.noticeError : msg.kind === "warn" ? s.noticeWarn : s.noticeGood}`}>{msg.text}</p>}
      {readOnly && <p className={s.notice}>{tt("ed.readOnly", "This question belongs to someone else. Copy it to your bank to change it.")}</p>}
      {review?.status === "rejected" && <p className={`${s.notice} ${s.noticeError}`}>{tt("ed.rejected", "Your admin sent this back: {{reason}}. Edit and save to send it again.", { reason: review.rejectionReason || "—" })}</p>}
      {meta?.share && <p className={s.notice}>{tt("ed.shareStatus", "Community sharing: {{status}}", { status: meta.share.status })}</p>}

      <div className={s.split}>
        <fieldset disabled={readOnly} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }} className={s.page}>
          <section className={s.card}>
            <h2>{tt("ed.type", "Question type")}</h2>
            <div className={s.row}>
              <label className={s.field}><span>{tt("ed.kind", "Type")}</span>
                <select value={f.interaction} onChange={(e) => set({ interaction: e.target.value, ...starterFor(e.target.value) })}>
                  {Object.entries(INTERACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{tt(`type.${k}`, v)}</option>)}
                </select>
              </label>
              <label className={s.field}><span>{tt("ed.module", "Module")}</span>
                <select value={f.module} disabled={!!id} onChange={(e) => set({ module: e.target.value })}>
                  {MODULE_KEYS.map((m) => <option key={m} value={m}>{tt(`module.${m}`, cap(m))}</option>)}
                </select>
              </label>
              <label className={s.field}><span>{tt("ed.subject", "Subject")}</span>
                <select value={f.subject} disabled={!!id} onChange={(e) => set({ subject: e.target.value })}>
                  {SUBJECT_KEYS.map((m) => <option key={m} value={m}>{tt(`subject.${m}`, cap(m))}</option>)}
                </select>
              </label>
            </div>
          </section>

          <section className={s.card}>
            <h2>{tt("ed.question", "The question")}</h2>
            <div className={s.page} style={{ gap: 12 }}>
              <label className={s.field}><span>{tt("ed.instruction", "Instruction")}</span>
                <input value={f.instruction} onChange={(e) => set({ instruction: e.target.value })} placeholder={tt("ed.instructionPh", "Tap the word you hear.")} aria-invalid={!!err("instruction")} />
                {err("instruction") && <span className={s.fieldError}>{err("instruction")}</span>}
              </label>
              <label className={s.field}><span>{tt("ed.prompt", "Prompt (optional)")}</span>
                <textarea value={f.prompt} onChange={(e) => set({ prompt: e.target.value })} placeholder={tt("ed.promptPh", "4 + 3 = ___")} />
              </label>
              <div className={s.row}>
                <label className={s.field} style={{ flex: "0 1 140px" }}><span>{tt("ed.emoji", "Emoji")}</span>
                  <input value={f.emoji} onChange={(e) => set({ emoji: e.target.value })} placeholder="🍎" maxLength={16} />
                </label>
                <div className={s.field}>
                  <span>{tt("ed.picture", "Picture")}</span>
                  <div className={s.row} style={{ alignItems: "center" }}>
                    <label className={s.check} style={{ cursor: "pointer" }}>
                      <FaImage aria-hidden="true" /> <span>{f.imageUrl ? tt("ed.replacePicture", "Replace picture") : tt("ed.uploadPicture", "Upload a picture")}</span>
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className={s.srOnly} onChange={(e) => uploadImage(e.target.files?.[0])} />
                    </label>
                    {f.imageUrl && <Button size="sm" variant="ghost" onClick={() => set({ imageUrl: "", imageAlt: "" })}>{tt("ed.removePicture", "Remove")}</Button>}
                  </div>
                  {err("imageUrl") && <span className={s.fieldError}>{err("imageUrl")}</span>}
                </div>
              </div>
              {f.imageUrl && <label className={s.field}><span>{tt("ed.alt", "Describe the picture (for screen readers)")}</span><input value={f.imageAlt} onChange={(e) => set({ imageAlt: e.target.value })} /></label>}
              <label className={s.field}><span>{tt("ed.audio", "Read aloud (the narrator says this)")}</span>
                <input value={f.audio_text} onChange={(e) => set({ audio_text: e.target.value })} placeholder={tt("ed.audioPh", "soap")} />
              </label>
            </div>
          </section>

          <section className={s.card}>
            <h2>{tt("ed.answers", "Answers")}</h2>
            <AnswerFields f={f} set={set} />
            {["options", "correct_answer", "speech_scoring"].map((k) => err(k) && <p key={k} className={s.fieldError} role="alert">{err(k)}</p>)}
          </section>

          <section className={s.card}>
            <h2>{tt("ed.help", "Hints and feedback")}</h2>
            <div className={s.page} style={{ gap: 12 }}>
              <TextList label={tt("ed.hints", "Hints")} items={f.hints} max={5} onChange={(hints) => set({ hints })} />
              <div className={s.grid2}>
                <label className={s.field}><span>{tt("ed.fbCorrect", "When right")}</span><input value={f.feedback.correct} onChange={(e) => set({ feedback: { ...f.feedback, correct: e.target.value } })} /></label>
                <label className={s.field}><span>{tt("ed.fbIncorrect", "When wrong (first try)")}</span><input value={f.feedback.incorrect} onChange={(e) => set({ feedback: { ...f.feedback, incorrect: e.target.value } })} /></label>
                <label className={s.field}><span>{tt("ed.fbSecond", "After the second try")}</span><input value={f.feedback.second_try} onChange={(e) => set({ feedback: { ...f.feedback, second_try: e.target.value } })} /></label>
              </div>
              <label className={s.field}><span>{tt("ed.worked", "Worked example")}</span><textarea value={f.worked_example} onChange={(e) => set({ worked_example: e.target.value })} /></label>
            </div>
          </section>

          <section className={s.card}>
            <h2>{tt("ed.tags", "Tags")}</h2>
            <div className={s.row}>
              <label className={s.field} style={{ flexBasis: "100%" }}><span>{tt("ed.skills", "Skills (comma separated)")}</span><input value={f.skills} onChange={(e) => set({ skills: e.target.value })} placeholder={tt("ed.skillsPh", "fractions, adding fractions")} /></label>
              <label className={s.field}><span>{tt("ed.grade", "Grade band")}</span>
                <select value={f.gradeBand} onChange={(e) => set({ gradeBand: e.target.value })}>
                  <option value="">—</option>
                  {GRADE_BANDS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <label className={s.field}><span>{tt("ed.difficulty", "Difficulty (1 easy – 5 hard)")}</span>
                <select value={f.difficulty} onChange={(e) => set({ difficulty: Number(e.target.value) })}>{[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{d}</option>)}</select>
              </label>
              <label className={s.field}><span>{tt("ed.code", "Curriculum code")}</span><input value={f.curriculumCode} onChange={(e) => set({ curriculumCode: e.target.value })} placeholder="NC-Y4-F1" /></label>
              <label className={s.field}><span>{tt("ed.seconds", "Estimated seconds")}</span><input type="number" min="0" value={f.estimatedSeconds} onChange={(e) => set({ estimatedSeconds: e.target.value })} /></label>
              <label className={s.field}><span>{tt("ed.points", "Points")}</span><input type="number" min="1" max="100" value={f.points} onChange={(e) => set({ points: e.target.value })} /></label>
            </div>
            {["difficulty", "gradeBand", "estimatedSeconds", "points"].map((k) => err(k) && <p key={k} className={s.fieldError}>{err(k)}</p>)}
            {!id && groups.length > 0 && (
              <fieldset className={s.field} style={{ border: 0, padding: 0, margin: "12px 0 0" }}>
                <legend className={s.fieldLabel}>{tt("ed.practiceGroups", "Also add to module practice for (optional)")}</legend>
                <div className={s.chips}>
                  {groups.map((g) => (
                    <label key={g._id} className={s.check}>
                      <input type="checkbox" checked={f.batchIds.includes(g._id)} onChange={(e) => set({ batchIds: e.target.checked ? [...f.batchIds, g._id] : f.batchIds.filter((x) => x !== g._id) })} />
                      {g.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </section>

          {stats && (
            <section className={s.card}>
              <h2>{tt("ed.quality", "How it went in tests")}</h2>
              {stats.used ? (
                <div className={s.grid3}>
                  <div><div className={s.small}>{tt("ed.used", "Times used")}</div><strong>{stats.used}</strong></div>
                  <div><div className={s.small}>{tt("ed.pct", "Right")}</div><strong>{stats.percentCorrect} %</strong></div>
                  <div><div className={s.small}>{tt("ed.avgTime", "Average time")}</div><strong>{stats.avgSeconds ?? "—"} s</strong></div>
                  <div><div className={s.small}>{tt("ed.commonWrong", "Most common wrong answer")}</div><strong>{stats.commonWrong?.answer || "—"}</strong></div>
                </div>
              ) : <p className={s.muted}>{tt("ed.notUsed", "Not used in a test yet.")}</p>}
              {stats.flags?.length > 0 && <div className={s.chips} style={{ marginTop: 10 }}>{stats.flags.map((fl) => <span key={fl} className={`${s.chip} ${s.chipWarn}`}>{tt(`flag.${fl}`, fl.replace(/_/g, " "))}</span>)}</div>}
            </section>
          )}
        </fieldset>

        <aside className={s.previewWrap} aria-label={tt("ed.preview", "Live preview")}>
          <div className={s.row} style={{ justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{tt("ed.preview", "Live preview")}</h2>
            <div className={s.tabs} role="group" aria-label={tt("ed.device", "Preview size")}>
              <button type="button" className={s.tab} aria-pressed={device === "phone"} onClick={() => setDevice("phone")}><FaMobileAlt aria-hidden="true" /> {tt("ed.phone", "Phone")}</button>
              <button type="button" className={s.tab} aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}><FaDesktop aria-hidden="true" /> {tt("ed.desktop", "Desktop")}</button>
              <button type="button" className={s.tab} onClick={() => setTryKey((k) => k + 1)}><FaRedo aria-hidden="true" /> {tt("ed.tryAgain", "Try as a student")}</button>
            </div>
          </div>
          <div className={s.stage}>
            <div className={device === "phone" ? s.phone : s.desktop}>
              <div className={s.stageInner}>
                <QuestionCard key={`${preview.id}-${tryKey}`} question={preview} subject={f.subject} onAnswered={() => {}} />
              </div>
            </div>
          </div>
          <p className={s.small}>{tt("ed.tryHint", "Answer it on the board to check it behaves as you expect. \"Try as a student\" starts it again.")}</p>
        </aside>
      </div>
    </div>
  );
}
