// Test results (TCH-052), live monitor (TCH-035), release (TCH-042) and
// practice suggestions after a test (TCH-061).
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaFileExport, FaBullhorn, FaPen, FaUnlock, FaPenNib, FaTimes, FaLeaf } from "react-icons/fa";
import { Button, KpiTile, ChartCard, ItemAnalysisTable, DataTable, Skeleton, EmptyState } from "../../../components/dashboard";
import { useTeacherApi, useT, fmtWhen, INTERACTION_LABELS } from "./api";
import { Locked } from "./TeacherTestsApp";
import s from "./tests.module.css";

const fmtAnswer = (a) => {
  if (a === null || a === undefined || a === "") return "—";
  if (typeof a === "string") return a;
  if (Array.isArray(a)) return a.map((x) => (Array.isArray(x) ? x.join(" → ") : x)).join(", ");
  if (typeof a === "object" && "transcript" in a) return `“${a.transcript}”`;
  if (typeof a === "object") return Object.entries(a).map(([k, v]) => `${k}: ${(v || []).join(", ")}`).join(" · ");
  return String(a);
};

function Distribution({ summary, passMark }) {
  const tt = useT();
  const max = Math.max(1, ...summary.buckets.map((b) => b.count));
  return (
    <ChartCard
      title={tt("res.distQ", "How did the class do?")}
      answer={summary.n ? tt("res.distA", "Average {{mean}} %, middle score {{median}} %. {{passed}} of {{n}} passed.", summary) : tt("res.distNone", "No finished attempts yet.")}
      summary={summary.buckets.map((b) => `${b.from}–${b.to} %: ${b.count}`).join(", ")}
      table={{ columns: [{ key: "range", label: tt("res.range", "Score") }, { key: "count", label: tt("res.students", "Students"), align: "end" }], rows: summary.buckets.map((b) => ({ range: `${b.from}–${b.to} %`, count: b.count })), getRowKey: (r) => r.range }}
    >
      <div className={s.bars} aria-hidden="true">
        {summary.buckets.map((b) => (
          <div key={b.from} className={s.bar}>
            <span className={s.barCount}>{b.count || ""}</span>
            <span className={`${s.barFill} ${b.from >= passMark ? s.barFillPass : ""}`} style={{ height: `${(b.count / max) * 100}%` }} />
            <span className={s.barLabel}>{b.from}</span>
          </div>
        ))}
      </div>
      <p className={s.small}>{tt("res.passKey", "Darker green bars are at or above the pass mark ({{p}} %).", { p: passMark })}</p>
    </ChartCard>
  );
}

function AttemptDrawer({ testId, attemptId, onClose }) {
  const api = useTeacherApi();
  const tt = useT();
  const [a, setA] = useState(null);
  useEffect(() => { api.get(`/tests/${testId}/attempts/${attemptId}`).then((r) => setA(r.ok ? r.attempt : false)); }, [api, testId, attemptId]);
  return (
    <div className={s.modalBack} role="presentation" onClick={onClose}>
      <div className={s.modal} role="dialog" aria-modal="true" aria-labelledby="att-h" onClick={(e) => e.stopPropagation()}>
        <div className={s.modalHead}>
          <h2 id="att-h">{a ? tt("att.title", "{{name}}, try {{n}}", { name: a.studentName, n: a.attemptNo }) : tt("att.loading", "Attempt")}</h2>
          <button type="button" className={s.iconBtn} onClick={onClose} aria-label={tt("close", "Close")}><FaTimes aria-hidden="true" /></button>
        </div>
        {a === null ? <Skeleton variant="text" lines={6} /> : !a ? <p>{tt("loadError", "Could not load. Try again.")}</p> : (
          <>
            <p className={s.muted}>{tt("att.score", "{{score}} of {{max}} points ({{pct}} %)", { score: a.score, max: a.maxScore, pct: a.percent })}{a.late ? ` · ${tt("att.late", "late")}` : ""}{a.events?.length ? ` · ${tt("att.events", "{{n}} integrity notes", { n: a.events.length })}` : ""}</p>
            <ol className={s.list}>
              {a.items.map((it, i) => (
                <li key={it.itemId} className={s.listRow} style={{ alignItems: "flex-start" }}>
                  <span className={s.itemNum}>{i + 1}</span>
                  <div className={s.grow}>
                    <div className={s.title}>{it.q?.instruction} {it.q?.prompt && <span className={s.muted}>· {it.q.prompt}</span>}</div>
                    <div className={s.small}>{tt(`type.${it.q?.interaction}`, INTERACTION_LABELS[it.q?.interaction] || "")}{it.timeMs ? ` · ${Math.round(it.timeMs / 1000)} s` : ""}</div>
                    <div style={{ marginTop: 4 }}>{tt("att.answer", "Answer")}: <strong>{fmtAnswer(it.response)}</strong></div>
                    {!it.correct && !it.needsMarking && <div className={s.small}>{tt("att.right", "Right answer")}: {fmtAnswer(it.q?.correct_answer)}</div>}
                    {it.manual?.comment && <div className={s.small}>💬 {it.manual.comment}</div>}
                  </div>
                  <span className={`${s.chip} ${it.needsMarking ? s.chipWarn : it.correct ? s.chipGood : it.score > 0 ? s.chipAccent : s.chipAlert}`}>
                    {it.needsMarking ? tt("att.toMark", "To mark") : `${it.score}/${it.points}`}
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}

function Monitor({ testId }) {
  const api = useTeacherApi();
  const tt = useT();
  const [m, setM] = useState(null);
  const [locked, setLocked] = useState(null);
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const r = await api.get(`/tests/${testId}/monitor`);
      if (!alive) return;
      if (r.locked) setLocked(r.locked); else if (r.ok) setM(r);
    };
    tick();
    const t = setInterval(tick, 10000);
    return () => { alive = false; clearInterval(t); };
  }, [api, testId]);
  if (locked) return <Locked module={locked} />;
  if (!m) return <Skeleton variant="chart" />;
  const label = { not_started: tt("mon.notStarted", "Not started"), working: tt("mon.working", "Working"), idle: tt("mon.idle", "Away"), stuck: tt("mon.stuck", "Stuck"), finished: tt("mon.finished", "Finished") };
  const tone = { stuck: s.chipAlert, idle: s.chipWarn, working: s.chipAccent, finished: s.chipGood };
  return (
    <div className={s.page}>
      <p className={s.small} aria-live="polite">{tt("mon.live", "Updates every 10 seconds. {{working}} working, {{stuck}} stuck, {{finished}} finished, {{notStarted}} not started.", m.counts)}</p>
      <section className={s.card}>
        <h2>{tt("mon.students", "Students")}</h2>
        <div className={s.monitorGrid}>
          {m.students.map((st) => (
            <div key={st.studentId} className={s.studentTile}>
              <div className={s.row} style={{ justifyContent: "space-between", alignItems: "center" }}><strong>{st.name}</strong><span className={`${s.chip} ${tone[st.status] || ""}`}>{label[st.status]}</span></div>
              {st.total ? (
                <>
                  <div className={s.progress} role="progressbar" aria-valuemin={0} aria-valuemax={st.total} aria-valuenow={st.answered} aria-label={tt("mon.progress", "{{name}}: {{a}} of {{t}} answered", { name: st.name, a: st.answered, t: st.total })}><span style={{ width: `${(st.answered / st.total) * 100}%` }} /></div>
                  <span className={s.small}>{tt("mon.answered", "{{a}} of {{t}} answered", { a: st.answered, t: st.total })}{st.status !== "finished" && st.secondsOnQuestion != null ? ` · ${tt("mon.onQ", "{{s}} s on question {{q}}", { s: st.secondsOnQuestion, q: st.currentQuestion })}` : ""}{st.tabSwitches ? ` · ${tt("mon.tabs", "left the tab {{n}}×", { n: st.tabSwitches })}` : ""}</span>
                </>
              ) : null}
            </div>
          ))}
        </div>
      </section>
      <section className={s.card}>
        <h2>{tt("mon.questions", "Right now, per question")}</h2>
        {m.questions.length === 0 ? <p className={s.muted}>{tt("mon.none", "No answers yet.")}</p> : (
          <ul className={s.list}>
            {m.questions.map((q) => (
              <li key={q.questionId} className={s.listRow}>
                <div className={s.grow}><div className={s.ellipsis}>{q.instruction}</div><div className={s.progress}><span style={{ width: `${q.percentCorrect || 0}%`, background: "var(--d-m3)" }} /></div></div>
                <strong>{q.percentCorrect == null ? "—" : `${q.percentCorrect} %`}</strong><span className={s.small}>({q.answered})</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Suggestions({ testId }) {
  const api = useTeacherApi();
  const tt = useT();
  const [sug, setSug] = useState(null);
  const [picked, setPicked] = useState([]);
  const [msg, setMsg] = useState("");
  useEffect(() => { api.get(`/tests/${testId}/practice-suggestions`).then((r) => { setSug(r.ok ? r.suggestions : []); setPicked((r.suggestions || []).map((x) => x.studentId)); }); }, [api, testId]);
  const approve = async () => {
    const r = await api.post(`/tests/${testId}/practice-suggestions/approve`, { studentIds: picked });
    setMsg(r.ok ? tt("sug.done", "Practice sent to {{n}} students.", { n: r.created.length }) : r.message);
  };
  if (!sug) return <Skeleton variant="text" lines={4} />;
  if (!sug.length) return <EmptyState compact title={tt("sug.none", "Nothing to practise")} text={tt("sug.noneText", "Everyone got everything right, or nobody has finished yet.")} />;
  return (
    <section className={s.card}>
      <h2>{tt("sug.title", "Practice on what they missed")}</h2>
      <p className={s.muted}>{tt("sug.text", "Each student gets a short practice set on the skills they missed. Check, then send in one click.")}</p>
      <ul className={s.list}>
        {sug.map((x) => (
          <li key={x.studentId} className={s.listRow}>
            <input type="checkbox" checked={picked.includes(x.studentId)} onChange={() => setPicked((p) => (p.includes(x.studentId) ? p.filter((y) => y !== x.studentId) : [...p, x.studentId]))} aria-label={x.name} style={{ width: 22, height: 22 }} />
            <div className={s.grow}><strong>{x.name}</strong> <span className={s.small}>{tt("sug.line", "{{p}} %, missed {{m}}", { p: x.percent, m: x.missed })}</span>
              <div className={s.small}>{x.skills.length ? x.skills.join(", ") : tt("sug.same", "the same questions again")} · {tt("sug.q", "{{n}} questions", { n: x.questions.length })}</div></div>
          </li>
        ))}
      </ul>
      {msg && <p className={`${s.notice} ${s.noticeGood}`} role="status">{msg}</p>}
      <div className={s.actions} style={{ marginTop: 12 }}><Button icon={FaLeaf} disabled={!picked.length} onClick={approve}>{tt("sug.send", "Send practice to {{n}}", { n: picked.length })}</Button></div>
    </section>
  );
}

export default function TestResults() {
  const api = useTeacherApi();
  const tt = useT();
  const { id } = useParams();
  const [r, setR] = useState(null);
  const [tab, setTab] = useState("results");
  const [attempt, setAttempt] = useState(null);
  const [msg, setMsg] = useState("");
  const [locked, setLocked] = useState(null);

  const load = useCallback(async () => {
    const x = await api.get(`/tests/${id}/results`);
    if (x.locked) setLocked(x.locked); else setR(x.ok ? x : { error: x.message });
  }, [api, id]);
  useEffect(() => { Promise.resolve().then(load); }, [load]);

  if (locked) return <Locked module={locked} />;
  if (!r) return <Skeleton variant="chart" />;
  if (r.error) return <p className={`${s.notice} ${s.noticeError}`} role="alert">{r.error}</p>;

  const { test, summary, students, items, attemptsCompare } = r;
  const release = async () => {
    const x = await api.post(`/tests/${id}/release`, {});
    setMsg(x.ok ? tt("res.released", "Results released. {{n}} students and their parents were told.", { n: x.notified }) : x.message);
    load();
  };
  const remind = async () => { const x = await api.post(`/tests/${id}/remind`, {}); setMsg(x.ok ? tt("res.reminded", "Reminder sent to {{n}} students.", { n: x.reminded }) : x.message); };
  const statusLabel = { done: tt("st.done", "Done"), needs_marking: tt("st.marking", "To mark"), in_progress: tt("st.progress", "Working"), not_started: tt("st.notStarted", "Not started") };
  const flagOf = (it) => (it.flags.includes("possibly_wrong_key") || it.flags.includes("confusing") ? "check" : it.flags.includes("too_hard") ? "hard" : it.flags.includes("too_easy") ? "easy" : undefined);

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1>{test.title}</h1>
          <p>{test.released ? tt("res.isReleased", "Results released {{when}}", { when: fmtWhen(test.resultsReleasedAt) }) : test.rules.release === "manual" ? tt("res.notReleased", "Students can't see results until you release them.") : tt(`res.fb_${test.rules.feedback}`, { immediate: "Students see right and wrong as they go.", after_submit: "Students see their result when they hand it in.", after_close: "Students see results after the test closes.", never: "Students see their score only when you release it." }[test.rules.feedback] || " ")}</p>
        </div>
        <div className={s.actions}>
          <Button variant="ghost" icon={FaPen} to={`/teacher/tests/${id}/edit`}>{tt("res.edit", "Edit")}</Button>
          <Button variant="ghost" icon={FaBullhorn} onClick={remind}>{tt("res.remind", "Remind")}</Button>
          <Button variant="ghost" icon={FaFileExport} onClick={() => api.download(`/tests/${id}/results.csv`, `results-${id}.csv`)}>{tt("res.export", "Export CSV")}</Button>
          {summary.needsMarking > 0 && <Button variant="soft" icon={FaPenNib} to={`/teacher/tests/marking?testId=${id}`}>{tt("res.mark", "Mark {{n}}", { n: summary.needsMarking })}</Button>}
          {!test.released && <Button icon={FaUnlock} onClick={release}>{tt("res.release", "Release results now")}</Button>}
        </div>
      </div>
      {msg && <p className={`${s.notice} ${s.noticeGood}`} role="status">{msg}</p>}

      <div className={s.tabs} role="tablist">
        {[["results", tt("res.tabResults", "Results")], ["monitor", tt("res.tabMonitor", "Live monitor")], ["practice", tt("res.tabPractice", "Practice next")]].map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={s.tab} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "monitor" ? <Monitor testId={id} /> : tab === "practice" ? <Suggestions testId={id} /> : (
        <>
          <div className={s.kpis}>
            <KpiTile label={tt("res.finished", "Finished")} value={`${summary.finished} / ${summary.assigned}`} helpText={tt("res.finishedHelp", "Students whose attempt counts, out of everyone assigned.")} />
            <KpiTile label={tt("res.average", "Average")} value={summary.mean == null ? null : `${summary.mean} %`} helpText={tt("res.averageHelp", "Mean of each student's counted attempt.")} />
            <KpiTile label={tt("res.median", "Middle score")} value={summary.median == null ? null : `${summary.median} %`} />
            <KpiTile label={tt("res.passed", "Passed")} value={summary.n ? `${summary.passed} / ${summary.n}` : null} tone={summary.n && summary.passed / summary.n < 0.5 ? "attention" : "neutral"} />
            <KpiTile label={tt("res.toMark", "To mark")} value={String(summary.needsMarking)} tone={summary.needsMarking ? "attention" : "good"} />
          </div>
          <Distribution summary={summary} passMark={test.rules.passMark ?? 50} />
          <ChartCard title={tt("res.itemsQ", "Which questions were hard or broken?")} answer={items.some((i) => flagOf(i) === "check") ? tt("res.itemsCheck", "Some questions need a look: strong students missed them, or most chose the same wrong answer.") : tt("res.itemsOk", "No question looks broken.")} info={tt("res.itemsInfo", "Separates strong from weak: the share right among the top 27 % minus the bottom 27 %. Below 0 means strong students did worse: check the answer key.")}>
            <ItemAnalysisTable items={items.map((it) => ({ id: it.questionId, question: `${it.instruction}${it.prompt ? ` · ${it.prompt}` : ""}`, attempts: it.marked, pctCorrect: it.percentCorrect == null ? null : it.percentCorrect / 100, discrimination: it.discrimination, avgSeconds: it.avgSeconds, commonWrong: it.commonWrong ? { answer: it.commonWrong.answer, pct: it.commonWrong.share / 100 } : null, flag: flagOf(it) }))} />
          </ChartCard>
          <section className={s.card}>
            <h2>{tt("res.perStudent", "Students")}</h2>
            <DataTable
              caption={tt("res.perStudentCap", "One row per student. Open a row to see their answers.")}
              getRowKey={(x) => x.studentId}
              onRowClick={(x) => x.countedAttemptId && setAttempt(x.countedAttemptId)}
              defaultSort={{ key: "name", dir: "asc" }}
              rows={students}
              columns={[
                { key: "name", label: tt("res.name", "Student"), sortable: true, render: (x) => <span>{x.name}{x.accommodations ? " ♿" : ""}</span> },
                { key: "status", label: tt("res.status", "Status"), sortable: true, render: (x) => statusLabel[x.status] },
                { key: "percent", label: tt("res.score", "Score"), align: "end", sortable: true, render: (x) => (x.percent == null ? "—" : `${x.percent} %`) },
                { key: "attempts", label: tt("res.tries", "Tries"), sortValue: (x) => x.attempts.length, sortable: true, render: (x) => x.attempts.filter((a) => a.percent != null).map((a) => `${a.percent}`).join(" → ") || "—" },
                { key: "minutes", label: tt("res.minutes", "Minutes"), align: "end", sortable: true, render: (x) => x.minutes ?? "—" },
                { key: "late", label: tt("res.late", "Late"), render: (x) => (x.late ? tt("res.lateYes", "Late") : "") },
                { key: "integrity", label: tt("res.integrity", "Notes"), sortValue: (x) => x.integrity.tabSwitches + x.integrity.pastes, sortable: true, render: (x) => [x.integrity.tabSwitches && tt("res.tabs", "left tab {{n}}×", { n: x.integrity.tabSwitches }), x.integrity.pastes && tt("res.pastes", "pasted {{n}}×", { n: x.integrity.pastes })].filter(Boolean).join(", ") },
              ]}
            />
          </section>
          {attemptsCompare.length > 1 && (
            <section className={s.card}>
              <h2>{tt("res.compare", "Compare tries")}</h2>
              <ul className={s.list}>{attemptsCompare.map((a) => <li key={a.attemptNo} className={s.listRow}><strong>{tt("res.tryN", "Try {{n}}", { n: a.attemptNo })}</strong><span className={s.grow}><span className={s.progress} style={{ display: "block" }}><span style={{ width: `${a.mean}%` }} /></span></span><span>{a.mean} % <span className={s.small}>({a.n})</span></span></li>)}</ul>
            </section>
          )}
        </>
      )}
      {attempt && <AttemptDrawer testId={id} attemptId={attempt} onClose={() => setAttempt(null)} />}
    </div>
  );
}
