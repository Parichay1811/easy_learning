// ADM-050 Question review: queue with an SLA counter, side-by-side preview on the
// wooden board learners see, reviewer notes, bulk approve. ADM-051: the school bank.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaChevronLeft, FaChevronRight, FaCheck, FaTimes } from "react-icons/fa";
import { Button, Skeleton, EmptyState, fmtDate, subjectLabel, moduleLabel } from "../../../components/dashboard";
import board from "../../../components/QuestionCard/QuestionCard.module.css";
import { api, useLoad, qs } from "./api";
import { Tabs, StatusPill, Field, Result } from "./bits";
import s from "./school.module.css";

// One uploaded question, drawn the way a learner sees it (read-only).
function BoardPreview({ q, module }) {
  const { t } = useTranslation();
  const instruction = q.question || q.title || (module === "write" ? t("school.review.write", { defaultValue: "Write this:" }) : module === "speak" ? t("school.review.speak", { defaultValue: "Say this out loud:" }) : module === "listen" ? t("school.review.listen", { defaultValue: "Listen and repeat:" }) : "");
  const prompt = q.content || q.sentence || q.text || q.character || "";
  const options = [q.option1, q.option2, q.option3, ...(Array.isArray(q.options) ? q.options : [])].filter(Boolean);
  const answer = q.answer ?? q.correct_answer;
  return (
    <div className={board.card} style={{ maxWidth: "100%" }}>
      <div className={board.stimulus}>
        {q.emoji && <div className={board.emoji} aria-hidden="true">{q.emoji}</div>}
        {instruction && <p className={board.instruction}>{instruction}</p>}
        {prompt && <p className={board.promptBox}>{prompt}</p>}
        {options.length > 0 && (
          <div className={s.boardOptions}>
            {options.map((o, i) => (
              <span key={i} className={`${s.boardOption} ${String(o) === String(answer) ? s.boardOptionRight : ""}`}>
                {o}{String(o) === String(answer) && <span className="d-sr-only"> ({t("school.review.right", { defaultValue: "the right answer" })})</span>}
              </span>
            ))}
          </div>
        )}
        {q.hint && <p className={board.hintBubble || s.note}>{q.hint}</p>}
        <p className={s.boardMeta}>{[q.type, q.level != null && t("school.review.level", { defaultValue: "Level {{n}}", n: q.level }), q.category].filter(Boolean).join(" · ")}</p>
      </div>
    </div>
  );
}

function Detail({ id, onChanged }) {
  const { t } = useTranslation();
  const data = useLoad(`/review/${id}`);
  const [i, setI] = useState(0);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [result, setResult] = useState(null);
  if (data.loading) return <div className={s.card}><Skeleton variant="chart" /></div>;
  if (data.error) return <div className={s.card}><p className={s.errorText}>{data.error.message}</p></div>;
  const { batch, rows } = data.data;
  const q = rows[Math.min(i, rows.length - 1)];
  const act = async (action) => {
    try { await api.post("/review/bulk", { ids: [id], action, reason }); setResult({ ok: true, text: action === "approve" ? t("school.review.approved", { defaultValue: "Approved. Learners in the chosen groups see these now." }) : t("school.review.rejected", { defaultValue: "Sent back to the teacher with your reason." }) }); data.reload(); onChanged(); }
    catch (e) { setResult({ ok: false, text: e.message }); }
  };
  const addNote = async () => {
    try { await api.post(`/review/${id}/notes`, { text: note }); setNote(""); data.reload(); } catch (e) { setResult({ ok: false, text: e.message }); }
  };
  return (
    <section className={`${s.card} ${s.sticky}`} aria-labelledby="rv-h">
      <h2 id="rv-h" className={s.cardTitle}>{subjectLabel(t, batch.subject)} · {moduleLabel(t, batch.module)} <StatusPill status={batch.status} /></h2>
      <p className={s.cardSub}>{t("school.review.by", { defaultValue: "{{n}} questions from {{who}}, {{d}}", n: batch.rowCount, who: batch.submittedByName, d: fmtDate(batch.createdAt.slice(0, 10)) })}</p>
      {q ? (
        <div className={s.boardWrap}>
          <BoardPreview q={q} module={batch.module} />
          <div className={s.row} role="group" aria-label={t("school.review.nav", { defaultValue: "Question" })}>
            <button type="button" className={s.iconBtn} disabled={i === 0} onClick={() => setI(i - 1)} aria-label={t("school.review.prev", { defaultValue: "Previous question" })}><FaChevronLeft /></button>
            <span aria-live="polite">{t("school.review.of", { defaultValue: "{{a}} of {{b}}", a: i + 1, b: rows.length })}</span>
            <button type="button" className={s.iconBtn} disabled={i >= rows.length - 1} onClick={() => setI(i + 1)} aria-label={t("school.review.next", { defaultValue: "Next question" })}><FaChevronRight /></button>
          </div>
        </div>
      ) : <p className={s.muted}>{t("school.review.noRows", { defaultValue: "No questions in this upload." })}</p>}
      <h3 className={s.label} style={{ marginTop: 16 }}>{t("school.review.notes", { defaultValue: "Reviewer notes (only your school sees these)" })}</h3>
      <ul className={s.list}>
        {(batch.reviewNotes || []).map((n, k) => <li key={k} className={s.note}><strong>{n.by}</strong> · {fmtDate(String(n.at).slice(0, 10))}<br />{n.text}</li>)}
      </ul>
      <div className={s.row} style={{ marginTop: 8, alignItems: "flex-end" }}>
        <div className={s.grow}><Field id="rv-note" label={t("school.review.addNote", { defaultValue: "Add a note" })}><input id="rv-note" className={s.input} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} /></Field></div>
        <Button size="sm" variant="soft" disabled={!note.trim()} onClick={addNote}>{t("school.review.save", { defaultValue: "Save note" })}</Button>
      </div>
      <div style={{ marginTop: 14 }}>
        <Field id="rv-reason" label={t("school.review.reason", { defaultValue: "Reason, if you send it back" })}><input id="rv-reason" className={s.input} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} /></Field>
      </div>
      <div className={s.actions}>
        <Button icon={FaCheck} onClick={() => act("approve")}>{t("school.review.approve", { defaultValue: "Approve" })}</Button>
        <Button variant="ghost" icon={FaTimes} disabled={reason.trim().length < 3} onClick={() => act("reject")}>{t("school.review.reject", { defaultValue: "Send back" })}</Button>
      </div>
      <Result result={result} />
    </section>
  );
}

function Queue() {
  const { t } = useTranslation();
  const [status, setStatus] = useState("pending");
  const [subject, setSubject] = useState("");
  const data = useLoad(`/review${qs({ status, subject })}`);
  const [open, setOpen] = useState(null);
  const [picked, setPicked] = useState([]);
  const [result, setResult] = useState(null);
  const items = data.data?.items || [];
  const bulk = async () => {
    try { const r = await api.post("/review/bulk", { ids: picked, action: "approve" }); setResult({ ok: true, text: t("school.review.bulkDone", { defaultValue: "{{n}} uploads approved.", n: r.updated }) }); setPicked([]); data.reload(); }
    catch (e) { setResult({ ok: false, text: e.message }); }
  };
  return (
    <div className={s.page}>
      {data.data && (
        <div className={`${s.banner} ${data.data.overdue ? s.attention : s.good}`}>
          <p className={s.grow}>{t("school.review.sla", { defaultValue: "{{p}} waiting for review · {{o}} waiting longer than {{d}} days", p: data.data.pending, o: data.data.overdue, d: data.data.slaDays })}</p>
        </div>
      )}
      <div className={s.row} style={{ alignItems: "flex-end" }}>
        <Field id="rv-status" label={t("school.review.status", { defaultValue: "Status" })}>
          <select id="rv-status" className={s.select} value={status} onChange={(e) => { setStatus(e.target.value); setOpen(null); setPicked([]); }}>
            <option value="pending">{t("school.status.pending", { defaultValue: "Waiting" })}</option>
            <option value="approved">{t("school.status.approved", { defaultValue: "Approved" })}</option>
            <option value="rejected">{t("school.status.rejected", { defaultValue: "Sent back" })}</option>
            <option value="">{t("school.review.all", { defaultValue: "All" })}</option>
          </select>
        </Field>
        <Field id="rv-subject" label={t("school.review.subject", { defaultValue: "Subject" })}>
          <select id="rv-subject" className={s.select} value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">{t("school.review.all", { defaultValue: "All" })}</option>
            {["english", "maths", "science"].map((x) => <option key={x} value={x}>{subjectLabel(t, x)}</option>)}
          </select>
        </Field>
        <span className={s.grow} />
        {status === "pending" && <Button disabled={!picked.length} onClick={bulk}>{t("school.review.bulk", { defaultValue: "Approve {{n}} selected", n: picked.length })}</Button>}
      </div>
      <Result result={result} />
      <div className={s.reviewLayout}>
        <section className={s.card} aria-label={t("school.review.queue", { defaultValue: "Uploads" })}>
          {data.loading ? <Skeleton variant="text" lines={6} /> : !items.length ? <EmptyState compact title={t("school.review.empty", { defaultValue: "Nothing waiting" })} text={t("school.review.emptyText", { defaultValue: "When teachers upload questions they appear here." })} /> : (
            <ul className={s.list}>
              {items.map((b) => (
                <li key={b._id} className={s.listItem} style={open === b._id ? { outline: "3px solid var(--d-accent)" } : undefined}>
                  {b.status === "pending" && (
                    <label className={s.check} style={{ padding: 0, minHeight: 0 }}>
                      <input type="checkbox" checked={picked.includes(b._id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, b._id] : p.filter((x) => x !== b._id)))} />
                      <span className="d-sr-only">{t("school.review.select", { defaultValue: "Select" })}</span>
                    </label>
                  )}
                  <button type="button" className={s.link} style={{ flex: 1 }} onClick={() => setOpen(b._id)}>
                    {subjectLabel(t, b.subject)} · {moduleLabel(t, b.module)} · {b.rowCount} {t("school.review.qs", { defaultValue: "questions" })}
                  </button>
                  <span className={`${s.small} ${s.muted}`}>{b.submittedByName}</span>
                  {b.waitingDays != null && <span className={`${s.pill} ${b.overdue ? s.pillAlert : ""}`}>{t("school.review.days", { defaultValue: "{{n}} d waiting", n: b.waitingDays })}</span>}
                  {b.reviewNotes?.length > 0 && <span className={s.pill}>{t("school.review.nNotes", { defaultValue: "{{n}} notes", n: b.reviewNotes.length })}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
        {open ? <Detail key={open} id={open} onChanged={data.reload} /> : <div className={s.card}><p className={s.muted}>{t("school.review.pick", { defaultValue: "Choose an upload to preview it on the board, exactly as learners will see it." })}</p></div>}
      </div>
    </div>
  );
}

function Bank() {
  const { t } = useTranslation();
  const [tag, setTag] = useState("");
  const data = useLoad(`/bank${qs({ tag })}`);
  const [edit, setEdit] = useState({});
  const [result, setResult] = useState(null);
  const save = async (id) => {
    try { await api.put(`/bank/${id}/tags`, { tags: String(edit[id] || "").split(",").map((x) => x.trim()).filter(Boolean) }); setEdit((e) => ({ ...e, [id]: undefined })); data.reload(); }
    catch (e) { setResult({ ok: false, text: e.message }); }
  };
  return (
    <div className={s.page}>
      <p className={s.muted}>{t("school.bank.sub", { defaultValue: "Approved questions form your school's bank. Tag them so teachers can find and reuse them." })}</p>
      {data.data?.tags?.length > 0 && (
        <div className={s.row} role="group" aria-label={t("school.bank.tags", { defaultValue: "Tags" })}>
          <Button size="sm" variant={tag ? "ghost" : "soft"} onClick={() => setTag("")}>{t("school.review.all", { defaultValue: "All" })}</Button>
          {data.data.tags.map((x) => <Button key={x} size="sm" variant={tag === x ? "soft" : "ghost"} onClick={() => setTag(x)}>#{x}</Button>)}
        </div>
      )}
      <Result result={result} />
      <ul className={s.list}>
        {(data.data?.items || []).map((b) => (
          <li key={b._id} className={s.listItem}>
            <span><span className={s.strong}>{subjectLabel(t, b.subject)} · {moduleLabel(t, b.module)}</span> · {b.rowCount} {t("school.review.qs", { defaultValue: "questions" })} · <span className={s.muted}>{b.submittedByName}</span></span>
            {edit[b._id] !== undefined ? (
              <span className={s.row}>
                <label className="d-sr-only" htmlFor={`tags-${b._id}`}>{t("school.bank.tags", { defaultValue: "Tags" })}</label>
                <input id={`tags-${b._id}`} className={s.input} value={edit[b._id]} onChange={(e) => setEdit({ ...edit, [b._id]: e.target.value })} placeholder="fractions, grade 4" />
                <Button size="sm" onClick={() => save(b._id)}>{t("school.save", { defaultValue: "Save" })}</Button>
              </span>
            ) : (
              <span className={s.row}>
                {(b.tags || []).map((x) => <span key={x} className={s.pill}>#{x}</span>)}
                <Button size="sm" variant="ghost" onClick={() => setEdit({ ...edit, [b._id]: (b.tags || []).join(", ") })}>{t("school.bank.tag", { defaultValue: "Tags" })}</Button>
              </span>
            )}
          </li>
        ))}
      </ul>
      {data.data && !data.data.items.length && <p className={s.muted}>{t("school.bank.empty", { defaultValue: "No approved questions yet." })}</p>}
    </div>
  );
}

export default function ReviewPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("queue");
  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.title}>{t("school.review.title", { defaultValue: "Questions" })}</h1>
          <p className={s.sub}>{t("school.review.subtitle", { defaultValue: "Check what teachers upload before learners see it." })}</p>
        </div>
      </div>
      <Tabs label={t("school.review.title", { defaultValue: "Questions" })} tabs={[{ key: "queue", label: t("school.review.tabQueue", { defaultValue: "Review queue" }) }, { key: "bank", label: t("school.review.tabBank", { defaultValue: "School bank" }) }]} value={tab} onChange={setTab} />
      <div role="tabpanel">{tab === "queue" ? <Queue /> : <Bank />}</div>
    </div>
  );
}
