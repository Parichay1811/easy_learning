// CSV / paste import (TCH-022). The .xlsx template upload stays on the teacher home.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheck, FaFileDownload, FaFileImport } from "react-icons/fa";
import { Button } from "../../../components/dashboard";
import { useTeacherApi, useT, MODULE_KEYS, SUBJECT_KEYS, INTERACTION_LABELS, cap } from "./api";
import { Locked } from "./TeacherTestsApp";
import s from "./tests.module.css";

const TEMPLATE = [
  "interaction,instruction,prompt,emoji,audio_text,options,correct_answer,accepted_answers,hints,feedback_correct,feedback_incorrect,feedback_second_try,worked_example,keywords,skills,grade_band,difficulty,curriculum_code,estimated_seconds,points",
  'tap_mcq,Pick the sum,3 + 4,🔢,,6|7|8,7,,Count on from 3,Well done!,Try counting on.,,"3, then 4, 5, 6, 7",,addition,3-5,2,,20,10',
  "match_pairs,Match each word to its picture,,,,,cat=🐱|dog=🐶|bus=🚌,,,,,,,,animals,K-2,1,,,10",
  'sort_bins,Sort the words,,,,,"animals: cat, dog | vehicles: car, bus",,,,,,,,sorting,K-2,2,,,10',
  "typed_short,Spell the word you hear,,,,,cat,,,,,,,,spelling,K-2,1,,,10",
  "mic_record,Say the word,,🧼,soap,,soap,,,,,,,soap,speaking,K-2,1,,,10",
].join("\r\n");

export default function ImportQuestions() {
  const api = useTeacherApi();
  const tt = useT();
  const navigate = useNavigate();
  const [module, setModule] = useState("read");
  const [subject, setSubject] = useState("maths");
  const [format, setFormat] = useState("auto");
  const [text, setText] = useState("");
  const [check, setCheck] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(null);

  const readFile = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => { setText(String(r.result || "")); setCheck(null); };
    r.readAsText(file);
  };
  const template = () => {
    const url = URL.createObjectURL(new Blob([`\uFEFF${TEMPLATE}`], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "learnigo-questions-template.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const run = async (dryRun) => {
    setBusy(true); setMsg(null);
    const r = await api.post("/bank/import", { module, subject, format, text, dryRun });
    setBusy(false);
    if (r.locked) { setLocked(r.locked); return; }
    if (dryRun) { if (r.ok) setCheck(r); else setMsg({ kind: "error", text: r.message }); return; }
    if (!r.ok) { setMsg({ kind: "error", text: r.message }); setCheck((c) => ({ ...c, rowErrors: r.rowErrors || c?.rowErrors || [] })); return; }
    setMsg({ kind: r.status === "pending" ? "warn" : "good", text: r.status === "pending" ? tt("imp.donePending", "{{n}} questions imported. They are waiting for your admin's review.", { n: r.inserted }) : tt("imp.done", "{{n}} questions imported and ready to use.", { n: r.inserted }) });
    setText(""); setCheck(null);
  };

  if (locked) return <Locked module={locked} />;

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1>{tt("imp.title", "Import questions")}</h1>
          <p>{tt("imp.sub", "Paste from a spreadsheet or a document, or choose a CSV file. Check first, then import.")}</p>
        </div>
        <div className={s.actions}>
          <Button variant="ghost" icon={FaFileDownload} onClick={template}>{tt("imp.template", "CSV template")}</Button>
          <Button variant="ghost" to="/teacher-dashboard">{tt("imp.xlsx", "Use the .xlsx upload")}</Button>
        </div>
      </div>
      {msg && <p role={msg.kind === "error" ? "alert" : "status"} className={`${s.notice} ${msg.kind === "error" ? s.noticeError : msg.kind === "warn" ? s.noticeWarn : s.noticeGood}`}>{msg.text} {msg.kind !== "error" && <Button size="sm" variant="ghost" onClick={() => navigate("/teacher/tests/bank")}>{tt("imp.toBank", "Open the bank")}</Button>}</p>}

      <section className={s.card}>
        <div className={s.row}>
          <label className={s.field}><span>{tt("ed.module", "Module")}</span><select value={module} onChange={(e) => setModule(e.target.value)}>{MODULE_KEYS.map((m) => <option key={m} value={m}>{tt(`module.${m}`, cap(m))}</option>)}</select></label>
          <label className={s.field}><span>{tt("ed.subject", "Subject")}</span><select value={subject} onChange={(e) => setSubject(e.target.value)}>{SUBJECT_KEYS.map((m) => <option key={m} value={m}>{tt(`subject.${m}`, cap(m))}</option>)}</select></label>
          <label className={s.field}><span>{tt("imp.format", "Format")}</span>
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="auto">{tt("imp.auto", "Work it out")}</option>
              <option value="csv">CSV</option>
              <option value="tsv">{tt("imp.tsv", "Copied from a spreadsheet")}</option>
              <option value="text">{tt("imp.text", "Plain text from a document")}</option>
            </select>
          </label>
          <label className={s.field}><span>{tt("imp.file", "CSV file")}</span><input type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" onChange={(e) => readFile(e.target.files?.[0])} /></label>
        </div>
        <label className={s.field} style={{ marginTop: 12 }}>
          <span>{tt("imp.paste", "Questions")}</span>
          <textarea rows={12} value={text} onChange={(e) => { setText(e.target.value); setCheck(null); }} placeholder={"What is 3 + 4?\na) 6\nb) 7 *\nc) 8\n\nSpell the word cat\nAnswer: cat"} style={{ fontFamily: "ui-monospace, monospace" }} />
          <small>{tt("imp.textHelp", "Plain text: one question per paragraph, options on their own lines, mark the right one with *. Or \"Answer: …\" for a typed answer.")}</small>
        </label>
        <div className={s.actions} style={{ marginTop: 12 }}>
          <Button variant="soft" icon={FaCheck} onClick={() => run(true)} disabled={!text.trim() || busy}>{tt("imp.check", "Check")}</Button>
          <Button icon={FaFileImport} onClick={() => run(false)} disabled={!check?.valid || busy}>{tt("imp.go", "Import {{n}} questions", { n: check?.valid || 0 })}</Button>
        </div>
      </section>

      {check && (
        <section className={s.card} aria-live="polite">
          <h2>{tt("imp.result", "{{valid}} ready · {{bad}} problems", { valid: check.valid, bad: check.rowErrors.length })}</h2>
          {check.rowErrors.length > 0 && (
            <ul className={s.list} style={{ marginBottom: 14 }}>
              {check.rowErrors.slice(0, 50).map((e, i) => <li key={i} className={`${s.notice} ${s.noticeWarn}`}>{tt("imp.rowErr", "Row {{row}}: {{msg}}", { row: e.row, msg: e.message })}</li>)}
            </ul>
          )}
          <div className={s.tableWrap}>
            <table className={s.table}>
              <caption className={s.srOnly}>{tt("imp.preview", "Preview")}</caption>
              <thead><tr><th>{tt("imp.row", "Row")}</th><th>{tt("ed.kind", "Type")}</th><th>{tt("ed.instruction", "Instruction")}</th><th>{tt("ed.answer", "Right answer")}</th><th>{tt("ed.skills", "Skills")}</th></tr></thead>
              <tbody>
                {check.preview.map((q) => (
                  <tr key={q.line}><td>{q.line}</td><td>{tt(`type.${q.interaction}`, INTERACTION_LABELS[q.interaction])}</td><td>{q.instruction}</td>
                    <td>{typeof q.correct_answer === "string" ? q.correct_answer : JSON.stringify(q.correct_answer)}</td><td>{(q.skillIds || []).join(", ")}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
