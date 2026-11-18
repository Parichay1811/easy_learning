// Marking queue for typed and spoken answers (TCH-041): rubric, quick comments,
// keyboard shortcuts. Works with touch on a tablet too.
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaCheck, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Button, EmptyState, Skeleton } from "../../../components/dashboard";
import { useTeacherApi, useT, fmtWhen } from "./api";
import { Locked } from "./TeacherTestsApp";
import s from "./tests.module.css";

export default function MarkingQueue() {
  const api = useTeacherApi();
  const tt = useT();
  const [params] = useSearchParams();
  const testId = params.get("testId") || "";
  const [data, setData] = useState(null);
  const [i, setI] = useState(0);
  const [draft, setDraft] = useState({ key: "" });
  const [msg, setMsg] = useState(null);
  const [locked, setLocked] = useState(null);
  const commentRef = useRef(null);

  const load = useCallback(async () => {
    const r = await api.get(`/marking${testId ? `?testId=${testId}` : ""}`);
    if (r.locked) { setLocked(r.locked); return; }
    setData(r.ok ? r : { queue: [], quickComments: [] });
  }, [api, testId]);
  useEffect(() => { Promise.resolve().then(load); }, [load]);

  const cur = data?.queue[i];
  // The marks being entered belong to the current answer; moving on starts fresh.
  const curKey = cur ? `${cur.attemptId}:${cur.itemId}` : "";
  const d = draft.key === curKey ? draft : { key: curKey, levels: cur?.manual?.levels || [], score: cur?.manual?.score ?? "", comment: cur?.manual?.comment || "", crit: 0 };
  const { levels, score, comment, crit } = d;
  const patch = (p) => setDraft((x) => {
    const base = x.key === curKey ? x : d;
    return { ...base, ...(typeof p === "function" ? p(base) : p) };
  });
  const setLevels = (fn) => patch((b) => ({ levels: typeof fn === "function" ? fn(b.levels) : fn }));
  const setScore = (v) => patch({ score: v });
  const setComment = (fn) => patch((b) => ({ comment: typeof fn === "function" ? fn(b.comment) : fn }));
  const setCrit = (fn) => patch((b) => ({ crit: typeof fn === "function" ? fn(b.crit) : fn }));

  const rubricScore = cur?.rubric?.length ? cur.rubric.reduce((sum, c, ci) => sum + (levels[ci] != null ? Number(c.levels[levels[ci]]?.points) || 0 : 0), 0) : null;

  const save = useCallback(async () => {
    if (!cur) return;
    const body = cur.rubric?.length && levels.filter((l) => l != null).length === cur.rubric.length ? { levels, comment } : { score: Number(score), comment };
    if (body.score !== undefined && (score === "" || Number.isNaN(body.score))) { setMsg({ kind: "error", text: tt("mark.needScore", "Give a mark first.") }); return; }
    const r = await api.post(`/tests/${cur.testId}/attempts/${cur.attemptId}/items/${encodeURIComponent(cur.itemId)}/mark`, body);
    if (!r.ok) { setMsg({ kind: "error", text: r.message }); return; }
    setMsg({ kind: "good", text: tt("mark.saved", "Marked {{name}}: {{s}}/{{p}}", { name: cur.studentName, s: r.item.score, p: cur.points }) });
    setData((d) => ({ ...d, queue: d.queue.filter((_, j) => j !== i) }));
    setI((x) => Math.max(0, Math.min(x, (data?.queue.length || 1) - 2)));
  }, [api, cur, levels, score, comment, i, data, tt]);

  useEffect(() => {
    const onKey = (e) => {
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); save(); return; }
      if (typing || !data?.queue.length) return;
      if (e.key === "j" || e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(x + 1, data.queue.length - 1)); }
      else if (e.key === "k" || e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(x - 1, 0)); }
      else if (e.key === "c") { e.preventDefault(); commentRef.current?.focus(); }
      else if (e.key === "Enter") { e.preventDefault(); save(); }
      else if (/^[0-9]$/.test(e.key)) {
        const n = Number(e.key);
        if (cur?.rubric?.length) {
          const c = cur.rubric[crit];
          if (c && n >= 1 && n <= c.levels.length) {
            setLevels((l) => { const x = [...l]; x[crit] = n - 1; return x; });
            setCrit((k) => Math.min(k + 1, cur.rubric.length - 1));
          }
        } else if (n <= (cur?.points ?? 0)) setScore(String(n));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, cur, crit, save]); // eslint-disable-line react-hooks/exhaustive-deps -- the setters only depend on `cur`

  if (locked) return <Locked module={locked} />;
  if (!data) return <Skeleton variant="chart" />;

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1>{tt("mark.title", "Marking")}</h1>
          <p>{tt("mark.sub", "Typed and spoken answers waiting for you.")} <span className={s.small}>{tt("mark.keys", "Keys:")} <span className={s.kbd}>J</span>/<span className={s.kbd}>K</span> {tt("mark.keysNav", "next/previous")}, <span className={s.kbd}>1</span>–<span className={s.kbd}>9</span> {tt("mark.keysLevel", "level or mark")}, <span className={s.kbd}>C</span> {tt("mark.keysComment", "comment")}, <span className={s.kbd}>Enter</span> {tt("mark.keysSave", "save and next")}</span></p>
        </div>
      </div>
      {msg && <p role={msg.kind === "error" ? "alert" : "status"} className={`${s.notice} ${msg.kind === "error" ? s.noticeError : s.noticeGood}`}>{msg.text}</p>}
      {!data.queue.length ? (
        <EmptyState title={tt("mark.empty", "All marked")} text={tt("mark.emptyText", "Nothing is waiting. New typed and spoken answers appear here when students hand in.")} actionLabel={tt("mark.toTests", "Back to tests")} to="/teacher/tests" />
      ) : (
        <div className={s.markLayout}>
          <nav aria-label={tt("mark.queue", "Queue")} className={s.card} style={{ padding: 12 }}>
            <h2 className={s.small} style={{ margin: "0 0 8px" }}>{tt("mark.count", "{{n}} to mark", { n: data.queue.length })}</h2>
            <ul className={s.list} style={{ gap: 6, maxHeight: "60vh", overflow: "auto" }}>
              {data.queue.map((q, j) => (
                <li key={`${q.attemptId}-${q.itemId}`}>
                  <button type="button" className={s.queueBtn} aria-current={j === i} onClick={() => setI(j)}>
                    <strong>{q.studentName}</strong><br /><span className={s.small}>{q.testTitle}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          {cur && (
            <section className={s.card} aria-labelledby="mark-q">
              <div className={s.row} style={{ justifyContent: "space-between", alignItems: "center" }}>
                <span className={s.small}>{cur.testTitle} · {cur.studentName} · {fmtWhen(cur.submittedAt)}</span>
                <span className={s.actions}>
                  <button type="button" className={s.iconBtn} disabled={i === 0} onClick={() => setI(i - 1)} aria-label={tt("mark.prev", "Previous")}><FaChevronLeft aria-hidden="true" /></button>
                  <button type="button" className={s.iconBtn} disabled={i >= data.queue.length - 1} onClick={() => setI(i + 1)} aria-label={tt("mark.next", "Next")}><FaChevronRight aria-hidden="true" /></button>
                </span>
              </div>
              <h2 id="mark-q" style={{ marginTop: 10 }}>{cur.instruction}</h2>
              {cur.prompt && <p className={s.muted}>{cur.prompt}</p>}
              <h3>{cur.interaction === "mic_record" ? tt("mark.said", "What they said (speech to text)") : tt("mark.wrote", "What they wrote")}</h3>
              <div className={s.answerBox}>{typeof cur.response === "string" ? cur.response : cur.response?.transcript || "—"}</div>
              <details style={{ margin: "10px 0" }}>
                <summary className={s.small} style={{ cursor: "pointer" }}>{tt("mark.model", "Model answer")}</summary>
                <p>{cur.modelAnswer}{cur.keywords?.length ? ` · ${tt("mark.keywords", "key words")}: ${cur.keywords.join(", ")}` : ""}</p>
              </details>

              {cur.rubric?.length > 0 ? (
                <div className={s.page} style={{ gap: 12 }}>
                  {cur.rubric.map((c, ci) => (
                    <fieldset key={ci} style={{ border: 0, padding: 0, margin: 0 }}>
                      <legend className={s.fieldLabel}>{c.name} {crit === ci && <span className={s.chip}>{tt("mark.keysHere", "number keys")}</span>}</legend>
                      <div className={s.levels} role="radiogroup" aria-label={c.name}>
                        {c.levels.map((l, li) => (
                          <button key={li} type="button" role="radio" aria-checked={levels[ci] === li} className={s.tab} onClick={() => { setLevels((x) => { const y = [...x]; y[ci] = li; return y; }); setCrit(ci); }}>
                            <span className={s.kbd}>{li + 1}</span> {l.label} · {l.points}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                  <p><strong>{tt("mark.total", "Mark: {{s}} / {{p}}", { s: rubricScore ?? "—", p: cur.points })}</strong></p>
                </div>
              ) : (
                <label className={s.field} style={{ maxWidth: 200 }}>
                  <span>{tt("mark.score", "Mark (out of {{p}})", { p: cur.points })}</span>
                  <input type="number" min="0" max={cur.points} step="0.5" value={score} onChange={(e) => setScore(e.target.value)} />
                  {cur.autoScore != null && <small>{tt("mark.auto", "Automatic check suggested {{s}}", { s: cur.autoScore })}</small>}
                </label>
              )}

              <label className={s.field} style={{ marginTop: 12 }}>
                <span>{tt("mark.comment", "Comment for the student (and parent)")}</span>
                <textarea ref={commentRef} value={comment} onChange={(e) => setComment(e.target.value)} />
              </label>
              <div className={s.chips} style={{ marginTop: 8 }}>
                {data.quickComments.map((c) => <button type="button" key={c} className={s.tab} onClick={() => setComment((x) => (x ? `${x} ${c}` : c))}>{tt(`quick.${c}`, c)}</button>)}
              </div>
              <div className={s.actions} style={{ marginTop: 14 }}><Button icon={FaCheck} onClick={save}>{tt("mark.save", "Save and next")}</Button></div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
