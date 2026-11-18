// Test and practice-set builder (TCH-030/031/032/060): questions or random pools
// in sections, points, rules, student preview, assign and publish.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaDice, FaEye, FaSave, FaPaperPlane, FaTimes, FaChartBar } from "react-icons/fa";
import QuestionCard from "../../../components/QuestionCard/QuestionCard";
import { Button, Skeleton } from "../../../components/dashboard";
import { useTeacherApi, useT, INTERACTION_LABELS, MODULE_KEYS, SUBJECT_KEYS, cap, toLocalInput } from "./api";
import BankPicker from "./BankPicker";
import { Locked } from "./TeacherTestsApp";
import s from "./tests.module.css";

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const MANUAL_OK = ["typed_long", "typed_short", "mic_record"];

function rulesToForm(r = {}) {
  const tz = r.timezone || TZ;
  return {
    ...r, timezone: tz, integrity: { fullscreen: false, logTabSwitches: false, logPaste: false, ...(r.integrity || {}) },
    opensAtLocal: toLocalInput(r.opensAt, tz), closesAtLocal: toLocalInput(r.closesAt, tz), lateUntilLocal: toLocalInput(r.lateUntil, tz),
  };
}
function formToRules(f) {
  const { opensAt, closesAt, lateUntil, ...rest } = f; // eslint-disable-line no-unused-vars
  return { ...rest, opensAtLocal: f.opensAtLocal || undefined, closesAtLocal: f.closesAtLocal || undefined, lateUntilLocal: f.lateUntilLocal || undefined };
}

function Check({ label, checked, onChange, hint }) {
  return (
    <label className={s.check}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}{hint && <><br /><span className={s.small}>{hint}</span></>}</span>
    </label>
  );
}

function RulesPanel({ r, set, advanced }) {
  const tt = useT();
  const up = (patch) => set({ ...r, ...patch });
  return (
    <section className={s.card} aria-labelledby="rules-h">
      <h2 id="rules-h">{tt("rules.title", "Rules")}</h2>
      <div className={s.page} style={{ gap: 18 }}>
        <div>
          <h3>{tt("rules.when", "When")}</h3>
          <Check label={tt("rules.alwaysOpen", "Always open (good for practice)")} checked={r.alwaysOpen} onChange={(v) => up({ alwaysOpen: v })} />
          {!r.alwaysOpen && (
            <div className={s.row}>
              <label className={s.field}><span>{tt("rules.opens", "Opens")}</span><input type="datetime-local" value={r.opensAtLocal || ""} onChange={(e) => up({ opensAtLocal: e.target.value })} /></label>
              <label className={s.field}><span>{tt("rules.closes", "Closes")}</span><input type="datetime-local" value={r.closesAtLocal || ""} onChange={(e) => up({ closesAtLocal: e.target.value })} /></label>
              <label className={s.field}><span>{tt("rules.tz", "Time zone")}</span><input value={r.timezone} onChange={(e) => up({ timezone: e.target.value })} list="tz-list" /></label>
              <datalist id="tz-list">{[TZ, "UTC", "Europe/London", "Asia/Kolkata", "America/New_York", "Asia/Singapore", "Australia/Sydney"].map((z) => <option key={z} value={z} />)}</datalist>
            </div>
          )}
        </div>
        <div>
          <h3>{tt("rules.time", "Time")}</h3>
          <div className={s.row}>
            <label className={s.field}><span>{tt("rules.limit", "Time limit")}</span>
              <select value={r.timeLimit || "none"} onChange={(e) => up({ timeLimit: e.target.value })}>
                <option value="none">{tt("rules.noLimit", "No limit")}</option>
                <option value="total">{tt("rules.total", "For the whole test")}</option>
                <option value="per_question" disabled={!advanced}>{tt("rules.perQ", "Per question")}{!advanced ? ` (${tt("rules.advanced", "advanced plan")})` : ""}</option>
              </select>
            </label>
            {r.timeLimit === "total" && <label className={s.field}><span>{tt("rules.minutes", "Minutes")}</span><input type="number" min="1" max="600" value={r.totalMinutes || ""} onChange={(e) => up({ totalMinutes: Number(e.target.value) })} /></label>}
            {r.timeLimit === "per_question" && <label className={s.field}><span>{tt("rules.seconds", "Seconds per question")}</span><input type="number" min="5" max="3600" value={r.perQuestionSeconds || ""} onChange={(e) => up({ perQuestionSeconds: Number(e.target.value) })} /></label>}
          </div>
          {r.timeLimit !== "none" && <p className={s.small}>{tt("rules.timeUp", "When time is up, answers are handed in automatically. Students with extra time get it added.")}</p>}
        </div>
        <div className={s.row}>
          <label className={s.field}><span>{tt("rules.attempts", "Tries")}</span>
            <select value={r.attempts ?? 1} onChange={(e) => up({ attempts: Number(e.target.value) })}>
              {[1, 2, 3, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              <option value={0}>{tt("rules.unlimited", "Unlimited")}</option>
            </select>
          </label>
          <label className={s.field}><span>{tt("rules.counts", "Which try counts")}</span>
            <select value={r.counts || "best"} onChange={(e) => up({ counts: e.target.value })}>
              <option value="best">{tt("rules.best", "Best")}</option><option value="last">{tt("rules.last", "Last")}</option><option value="average">{tt("rules.average", "Average")}</option>
            </select>
          </label>
          <label className={s.field}><span>{tt("rules.pass", "Pass mark (%)")}</span><input type="number" min="0" max="100" value={r.passMark ?? 50} onChange={(e) => up({ passMark: Number(e.target.value) })} /></label>
          <label className={s.field}><span>{tt("rules.style", "Style")}</span>
            <select value={r.style || "practice"} onChange={(e) => up({ style: e.target.value })}>
              <option value="practice">{tt("rules.practice", "Practice (calm)")}</option><option value="warrior">{tt("rules.warrior", "Warrior (timer and stars)")}</option>
            </select>
          </label>
        </div>
        <div className={s.grid2}>
          <div>
            <h3>{tt("rules.order", "Order")}</h3>
            <Check label={tt("rules.shuffleQ", "Shuffle questions")} checked={r.shuffleQuestions} onChange={(v) => up({ shuffleQuestions: v })} />
            <Check label={tt("rules.shuffleO", "Shuffle options")} checked={r.shuffleOptions !== false} onChange={(v) => up({ shuffleOptions: v })} />
          </div>
          <div>
            <h3>{tt("rules.help", "Help allowed")}</h3>
            <Check label={tt("rules.hints", "Hints")} checked={r.hints} onChange={(v) => up({ hints: v })} />
            <Check label={tt("rules.listen", "Listen (read the question aloud)")} checked={r.listen !== false} onChange={(v) => up({ listen: v })} />
            <Check label={tt("rules.aiLock", "Lock the AI Teacher during the test")} checked={r.aiTeacherLocked !== false} onChange={(v) => up({ aiTeacherLocked: v })} />
          </div>
        </div>
        <div className={s.row}>
          <label className={s.field}><span>{tt("rules.feedback", "Show right and wrong")}</span>
            <select value={r.feedback || "after_submit"} onChange={(e) => up({ feedback: e.target.value })}>
              <option value="immediate">{tt("rules.fbNow", "Straight away, question by question")}</option>
              <option value="after_submit">{tt("rules.fbSubmit", "After they hand it in")}</option>
              <option value="after_close">{tt("rules.fbClose", "After the test closes")}</option>
              <option value="never">{tt("rules.fbNever", "Never (score only)")}</option>
            </select>
          </label>
          <label className={s.field}><span>{tt("rules.release", "Release results")}</span>
            <select value={r.release || "auto"} onChange={(e) => up({ release: e.target.value })}>
              <option value="auto">{tt("rules.relAuto", "Automatically, as above")}</option>
              <option value="manual">{tt("rules.relManual", "When I press Release")}</option>
            </select>
          </label>
          <label className={s.field}><span>{tt("rules.late", "Late work")}</span>
            <select value={r.lateWork || "none"} onChange={(e) => up({ lateWork: e.target.value })}>
              <option value="none">{tt("rules.lateNone", "Not allowed")}</option>
              <option value="marked">{tt("rules.lateMarked", "Allowed, marked late")}</option>
              <option value="until" disabled={!advanced}>{tt("rules.lateUntil", "Allowed until a date")}</option>
            </select>
          </label>
          {r.lateWork === "until" && <label className={s.field}><span>{tt("rules.lateDate", "Late until")}</span><input type="datetime-local" value={r.lateUntilLocal || ""} onChange={(e) => up({ lateUntilLocal: e.target.value })} /></label>}
        </div>
        <Check label={tt("rules.mastery", "Counts towards mastery")} checked={r.masteryCredit !== false} onChange={(v) => up({ masteryCredit: v })} />
        <div>
          <h3>{tt("rules.integrity", "Light integrity checks")} {!advanced && <span className={s.chip}>{tt("rules.advanced", "advanced plan")}</span>}</h3>
          <p className={s.small}>{tt("rules.integrityText", "Shown to you only, never used to take marks away.")}</p>
          <fieldset disabled={!advanced} style={{ border: 0, padding: 0, margin: 0 }}>
            <Check label={tt("rules.fullscreen", "Ask for full screen")} checked={r.integrity?.fullscreen} onChange={(v) => up({ integrity: { ...r.integrity, fullscreen: v } })} />
            <Check label={tt("rules.tabs", "Note when they leave the test tab")} checked={r.integrity?.logTabSwitches} onChange={(v) => up({ integrity: { ...r.integrity, logTabSwitches: v } })} />
            <Check label={tt("rules.paste", "Note pasted answers")} checked={r.integrity?.logPaste} onChange={(v) => up({ integrity: { ...r.integrity, logPaste: v } })} />
          </fieldset>
        </div>
      </div>
    </section>
  );
}

function AssignPanel({ test, assignment, onPublished }) {
  const api = useTeacherApi();
  const tt = useT();
  const [groups, setGroups] = useState(null);
  const [batchIds, setBatchIds] = useState(assignment?.batchIds || []);
  const [studentIds, setStudentIds] = useState(assignment?.studentIds || []);
  const [excluded, setExcluded] = useState(assignment?.excludedStudentIds || []);
  const [parents, setParents] = useState(!!assignment?.notifyParents);
  const [msg, setMsg] = useState(null);
  useEffect(() => { api.get("/test-groups").then((r) => setGroups(r.ok ? r.groups : [])); }, [api]);
  const toggle = (list, setList, id) => setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const count = useMemo(() => {
    if (!groups) return 0;
    const ids = new Set(studentIds);
    groups.filter((g) => batchIds.includes(g._id)).forEach((g) => g.students.forEach((st) => ids.add(st._id)));
    excluded.forEach((x) => ids.delete(x));
    return ids.size;
  }, [groups, batchIds, studentIds, excluded]);

  const publish = async () => {
    setMsg(null);
    const r = await api.post(`/tests/${test._id}/publish`, { batchIds, studentIds, excludedStudentIds: excluded, notifyParents: parents });
    if (r.ok) { setMsg({ kind: "good", text: tt("assign.done", "Assigned to {{n}} students. They'll find it in their To do list.", { n: r.students }) }); onPublished(); }
    else setMsg({ kind: "error", text: r.code === "QUESTIONS_NOT_APPROVED" ? tt("assign.notApproved", "Some questions are still waiting for your admin's review. Remove them or wait for approval.") : r.message });
  };

  return (
    <section className={s.card} aria-labelledby="assign-h">
      <h2 id="assign-h">{tt("assign.title", "Who is it for?")}</h2>
      {!groups ? <Skeleton variant="text" lines={3} /> : groups.length === 0 ? <p className={s.muted}>{tt("assign.noGroups", "You don't have any groups yet.")}</p> : (
        <div className={s.page} style={{ gap: 12 }}>
          {groups.map((g) => {
            const whole = batchIds.includes(g._id);
            return (
              <details key={g._id} className={s.listRow} style={{ display: "block" }}>
                <summary style={{ cursor: "pointer", listStyle: "revert" }}>
                  <label className={s.check} style={{ display: "inline-flex" }} onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={whole} onChange={() => toggle(batchIds, setBatchIds, g._id)} />
                    <strong>{g.name}</strong> <span className={s.small}>({tt("assign.students", "{{count}} students", { count: g.students.length, defaultValue_one: "{{count}} student" })})</span>
                  </label>
                </summary>
                <div className={s.chips} style={{ marginTop: 8 }}>
                  {g.students.map((st) => whole ? (
                    <label key={st._id} className={s.check}><input type="checkbox" checked={!excluded.includes(st._id)} onChange={() => toggle(excluded, setExcluded, st._id)} />{st.name}</label>
                  ) : (
                    <label key={st._id} className={s.check}><input type="checkbox" checked={studentIds.includes(st._id)} onChange={() => toggle(studentIds, setStudentIds, st._id)} />{st.name}</label>
                  ))}
                </div>
                <p className={s.small}>{whole ? tt("assign.untick", "Untick anyone who should not get it.") : tt("assign.pick", "Or pick some students only.")}</p>
              </details>
            );
          })}
          <Check label={tt("assign.parents", "Also remind parents")} checked={parents} onChange={setParents} />
          {msg && <p role={msg.kind === "error" ? "alert" : "status"} className={`${s.notice} ${msg.kind === "error" ? s.noticeError : s.noticeGood}`}>{msg.text}</p>}
          <div className={s.actions}>
            <Button icon={FaPaperPlane} disabled={!count} onClick={publish}>{test.status === "published" ? tt("assign.update", "Update ({{n}} students)", { n: count }) : tt("assign.publish", "Assign to {{n}} students", { n: count })}</Button>
          </div>
        </div>
      )}
    </section>
  );
}

function PoolForm({ onAdd, onCancel }) {
  const tt = useT();
  const [p, setP] = useState({ source: "mine", module: "", subject: "", skillIds: "", difficultyMin: 1, difficultyMax: 5, count: 5 });
  return (
    <div className={s.card} style={{ background: "var(--d-card-alt)" }}>
      <h3>{tt("pool.title", "Random pool")}</h3>
      <p className={s.small}>{tt("pool.text", "Each student gets a different random draw, for example \"5 on fractions, difficulty 2–3\".")}</p>
      <div className={s.row}>
        <label className={s.field}><span>{tt("pool.from", "From")}</span><select value={p.source} onChange={(e) => setP({ ...p, source: e.target.value })}><option value="mine">{tt("bank.mine", "My questions")}</option><option value="school">{tt("bank.school", "My school's")}</option><option value="learnigo">{tt("bank.learnigo", "Learnigo's")}</option></select></label>
        <label className={s.field}><span>{tt("ed.module", "Module")}</span><select value={p.module} onChange={(e) => setP({ ...p, module: e.target.value })}><option value="">{tt("all", "All")}</option>{MODULE_KEYS.map((m) => <option key={m} value={m}>{tt(`module.${m}`, cap(m))}</option>)}</select></label>
        <label className={s.field}><span>{tt("ed.subject", "Subject")}</span><select value={p.subject} onChange={(e) => setP({ ...p, subject: e.target.value })}><option value="">{tt("all", "All")}</option>{SUBJECT_KEYS.map((m) => <option key={m} value={m}>{tt(`subject.${m}`, cap(m))}</option>)}</select></label>
        <label className={s.field}><span>{tt("pool.skills", "Skills")}</span><input value={p.skillIds} onChange={(e) => setP({ ...p, skillIds: e.target.value })} placeholder="fractions" /></label>
        <label className={s.field}><span>{tt("pool.diff", "Difficulty from")}</span><select value={p.difficultyMin} onChange={(e) => setP({ ...p, difficultyMin: Number(e.target.value) })}>{[1, 2, 3, 4, 5].map((d) => <option key={d}>{d}</option>)}</select></label>
        <label className={s.field}><span>{tt("pool.to", "to")}</span><select value={p.difficultyMax} onChange={(e) => setP({ ...p, difficultyMax: Number(e.target.value) })}>{[1, 2, 3, 4, 5].map((d) => <option key={d}>{d}</option>)}</select></label>
        <label className={s.field}><span>{tt("pool.count", "How many")}</span><input type="number" min="1" max="50" value={p.count} onChange={(e) => setP({ ...p, count: Number(e.target.value) })} /></label>
      </div>
      <div className={s.actions} style={{ marginTop: 10 }}>
        <Button variant="ghost" onClick={onCancel}>{tt("cancel", "Cancel")}</Button>
        <Button onClick={() => onAdd({ ...p, module: p.module || undefined, subject: p.subject || undefined, skillIds: p.skillIds.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean) })}>{tt("pool.add", "Add pool")}</Button>
      </div>
    </div>
  );
}

function PreviewModal({ testId, onClose }) {
  const api = useTeacherApi();
  const tt = useT();
  const [items, setItems] = useState(null);
  const [i, setI] = useState(0);
  useEffect(() => { api.get(`/tests/${testId}/preview`).then((r) => setItems(r.ok ? r.items : [])); }, [api, testId]);
  const cur = items?.[i];
  return (
    <div className={s.modalBack} role="presentation" onClick={onClose}>
      <div className={s.modal} role="dialog" aria-modal="true" aria-labelledby="prev-h" onClick={(e) => e.stopPropagation()}>
        <div className={s.modalHead}>
          <h2 id="prev-h">{tt("prev.title", "Student preview")}</h2>
          <button type="button" className={s.iconBtn} onClick={onClose} aria-label={tt("close", "Close")}><FaTimes aria-hidden="true" /></button>
        </div>
        {!items ? <Skeleton variant="chart" /> : !items.length ? <p className={s.empty}>{tt("prev.none", "Add questions to see a preview.")}</p> : (
          <>
            <p className={s.muted}>{tt("prev.of", "Question {{n}} of {{total}}", { n: i + 1, total: items.length })} · {tt("prev.points", "{{p}} points", { p: cur.points })}{cur.marking === "manual" ? ` · ${tt("prev.manual", "you mark this one")}` : ""}</p>
            <div className={s.stage}><QuestionCard key={`${cur.itemId}-${i}`} question={{ ...cur.question, id: cur.itemId }} subject={cur.subject} onAnswered={() => {}} /></div>
            <div className={s.actions} style={{ justifyContent: "space-between" }}>
              <Button variant="ghost" disabled={i === 0} onClick={() => setI(i - 1)}>{tt("prev.back", "Back")}</Button>
              <Button variant="soft" disabled={i === items.length - 1} onClick={() => setI(i + 1)}>{tt("prev.next", "Next")}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TestBuilder() {
  const api = useTeacherApi();
  const tt = useT();
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [sections, setSections] = useState([]);
  const [rules, setRules] = useState(rulesToForm({}));
  const [summaries, setSummaries] = useState({});
  const [assignment, setAssignment] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [picker, setPicker] = useState(null);
  const [poolFor, setPoolFor] = useState(null);
  const [preview, setPreview] = useState(false);
  const [msg, setMsg] = useState(null);
  const [locked, setLocked] = useState(null);
  const [advanced, setAdvanced] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    const [r, m] = await Promise.all([api.get(`/tests/${id}`), api.get("/bank/meta")]);
    if (r.locked) { setLocked(r.locked); return; }
    if (!r.ok) { setMsg({ kind: "error", text: r.message }); return; }
    setTest(r.test);
    setSections(r.test.sections.map((sec) => ({ ...sec, items: sec.items.map((it) => ({ ...it })) })));
    setRules(rulesToForm(r.test.rules));
    setSummaries(r.questions || {});
    setAssignment(r.assignment);
    setAttempts(r.attempts);
    setAdvanced((m.entitlements || []).includes("tests.advanced"));
    setDirty(false);
  }, [api, id]);
  useEffect(() => { Promise.resolve().then(load); }, [load]);

  const touch = (fn) => { fn(); setDirty(true); };
  const setSec = (si, patch) => touch(() => setSections((ss) => ss.map((x, i) => (i === si ? { ...x, ...patch } : x))));
  const setItem = (si, ii, patch) => setSec(si, { items: sections[si].items.map((x, j) => (j === ii ? { ...x, ...patch } : x)) });
  const moveItem = (si, ii, d) => { const items = [...sections[si].items]; [items[ii], items[ii + d]] = [items[ii + d], items[ii]]; setSec(si, { items }); };
  const already = sections.flatMap((x) => x.items.map((it) => it.questionId)).filter(Boolean);

  const addQuestions = (si, qs) => {
    const extra = qs.map((q) => ({ kind: "question", module: q.module, subject: q.subject, questionId: q._id, points: 1, partialCredit: true, marking: ["typed_long", "mic_record"].includes(q.interaction) ? "manual" : "auto", rubric: [], _summary: q }));
    setSec(si, { items: [...sections[si].items, ...extra] });
    setPicker(null);
  };

  const save = async () => {
    setMsg(null);
    const body = {
      title: test.title, description: test.description, isTemplate: test.isTemplate, target: test.target,
      sections: sections.map((sec) => ({ _id: sec._id, title: sec.title, fixedOrder: sec.fixedOrder, items: sec.items.map(({ _summary, ...it }) => it) })), // eslint-disable-line no-unused-vars
      rules: formToRules(rules),
    };
    const r = await api.put(`/tests/${id}`, body);
    if (r.locked) { setMsg({ kind: "error", text: r.message }); return false; }
    if (!r.ok) { setMsg({ kind: "error", text: r.message }); return false; }
    setMsg({ kind: "good", text: tt("build.saved", "Saved.") });
    await load();
    return true;
  };

  if (locked) return <Locked module={locked} />;
  if (!test) return msg ? <p className={`${s.notice} ${s.noticeError}`}>{msg.text}</p> : <Skeleton variant="chart" />;
  const total = sections.reduce((n, sec) => n + sec.items.reduce((m, it) => m + (it.kind === "pool" ? it.pool?.count || 1 : 1), 0), 0);
  const points = sections.reduce((n, sec) => n + sec.items.reduce((m, it) => m + (Number(it.points) || 0) * (it.kind === "pool" ? it.pool?.count || 1 : 1), 0), 0);
  const practice = test.kind === "practice";

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div style={{ flex: "1 1 320px" }}>
          <label className={s.field}>
            <span className={s.srOnly}>{tt("build.titleLabel", "Title")}</span>
            <input value={test.title} onChange={(e) => touch(() => setTest({ ...test, title: e.target.value }))} style={{ fontSize: "1.4rem", fontWeight: 700 }} aria-label={tt("build.titleLabel", "Title")} />
          </label>
          <p className={s.muted}>{practice ? tt("build.practice", "Practice set") : tt("build.test", "Test")} · {tt("build.summary", "{{count}} questions, {{points}} points", { count: total, points })}{attempts ? ` · ${tt("build.attempts", "{{n}} attempts so far (they keep the version they took)", { n: attempts })}` : ""}</p>
        </div>
        <div className={s.actions}>
          <Button variant="ghost" icon={FaEye} onClick={async () => { if (dirty && !(await save())) return; setPreview(true); }}>{tt("build.preview", "Student preview")}</Button>
          {test.status === "published" && <Button variant="ghost" icon={FaChartBar} to={`/teacher/tests/${id}`}>{tt("home.results", "Results")}</Button>}
          <Button icon={FaSave} onClick={save}>{dirty ? tt("build.save", "Save") : tt("build.savedBtn", "Saved")}</Button>
        </div>
      </div>
      {msg && <p role={msg.kind === "error" ? "alert" : "status"} className={`${s.notice} ${msg.kind === "error" ? s.noticeError : s.noticeGood}`}>{msg.text}</p>}

      <div className={s.split}>
        <div className={s.page}>
          <section className={s.card}>
            <label className={s.field}><span>{tt("build.desc", "Note for students (optional)")}</span>
              <textarea value={test.description || ""} onChange={(e) => touch(() => setTest({ ...test, description: e.target.value }))} />
            </label>
            <Check label={tt("build.template", "Keep as a template (can't be assigned; copy it to use)")} checked={test.isTemplate} onChange={(v) => touch(() => setTest({ ...test, isTemplate: v }))} />
          </section>

          {practice && (
            <section className={s.card}>
              <h2>{tt("build.targetTitle", "Or practise a module")}</h2>
              <p className={s.small}>{tt("build.targetText", "Instead of (or as well as) questions: \"15 min of Listen · Maths this week\". Progress comes from their normal practice.")}</p>
              <div className={s.row}>
                <label className={s.field}><span>{tt("ed.module", "Module")}</span><select value={test.target?.module || ""} onChange={(e) => touch(() => setTest({ ...test, target: { ...test.target, module: e.target.value || undefined } }))}><option value="">—</option>{MODULE_KEYS.map((m) => <option key={m} value={m}>{tt(`module.${m}`, cap(m))}</option>)}</select></label>
                <label className={s.field}><span>{tt("ed.subject", "Subject")}</span><select value={test.target?.subject || ""} onChange={(e) => touch(() => setTest({ ...test, target: { ...test.target, subject: e.target.value || undefined } }))}><option value="">—</option>{SUBJECT_KEYS.map((m) => <option key={m} value={m}>{tt(`subject.${m}`, cap(m))}</option>)}</select></label>
                <label className={s.field}><span>{tt("build.minutes", "Minutes")}</span><input type="number" min="1" max="600" value={test.target?.minutes || ""} onChange={(e) => touch(() => setTest({ ...test, target: { ...test.target, minutes: Number(e.target.value) || undefined } }))} /></label>
              </div>
            </section>
          )}

          {sections.map((sec, si) => (
            <section key={sec._id || si} className={s.card} aria-label={tt("build.section", "Section {{n}}", { n: si + 1 })}>
              <div className={s.row} style={{ alignItems: "center" }}>
                <label className={s.field} style={{ flex: "1 1 240px" }}><span>{tt("build.sectionTitle", "Section {{n}} title (optional)", { n: si + 1 })}</span><input value={sec.title || ""} onChange={(e) => setSec(si, { title: e.target.value })} /></label>
                <Check label={tt("build.fixed", "Keep this order")} checked={sec.fixedOrder} onChange={(v) => setSec(si, { fixedOrder: v })} />
                {sections.length > 1 && <button type="button" className={s.iconBtn} onClick={() => touch(() => setSections(sections.filter((_, j) => j !== si)))} aria-label={tt("build.removeSection", "Remove section {{n}}", { n: si + 1 })}><FaTrash aria-hidden="true" /></button>}
              </div>
              <ol className={s.list} style={{ marginTop: 12 }}>
                {sec.items.map((it, ii) => {
                  const q = it._summary || summaries[it._id];
                  return (
                    <li key={it._id || `${it.questionId}-${ii}`} className={s.itemRow}>
                      <span className={s.itemNum} aria-hidden="true">{it.kind === "pool" ? <FaDice /> : ii + 1}</span>
                      <div className={s.grow}>
                        {it.kind === "pool" ? (
                          <>
                            <div className={s.title}>{tt("pool.line", "{{count}} random questions", { count: it.pool?.count })}</div>
                            <div className={s.small}>{[tt(`bank.${it.pool?.source}`, it.pool?.source), it.pool?.module && cap(it.pool.module), it.pool?.subject && cap(it.pool.subject), it.pool?.skillIds?.join(", "), `${tt("bank.difficulty", "Difficulty")} ${it.pool?.difficultyMin || 1}–${it.pool?.difficultyMax || 5}`].filter(Boolean).join(" · ")}</div>
                          </>
                        ) : (
                          <>
                            <div className={s.title}>{q?.emoji} {q?.instruction || tt("build.missing", "Question")}{q?.prompt ? <span className={s.muted}> · {q.prompt}</span> : null}</div>
                            <div className={s.chips}>
                              <span className={`${s.chip} ${s.chipAccent}`}>{tt(`type.${q?.interaction}`, INTERACTION_LABELS[q?.interaction] || "")}</span>
                              {q && q.status !== "approved" && <span className={`${s.chip} ${s.chipWarn}`}>{tt("status.pending", "Waiting for review")}</span>}
                              {it.marking === "manual" && <span className={s.chip}>{tt("build.youMark", "You mark it")}</span>}
                            </div>
                          </>
                        )}
                        {it.marking === "manual" && (
                          <details style={{ marginTop: 6 }}>
                            <summary className={s.small} style={{ cursor: "pointer" }}>{tt("build.rubric", "Rubric ({{n}} criteria)", { n: it.rubric?.length || 0 })}</summary>
                            <RubricEditor rubric={it.rubric || []} onChange={(rubric) => setItem(si, ii, { rubric })} />
                          </details>
                        )}
                      </div>
                      <div className={s.itemTools}>
                        <label className={s.small}>{tt("build.points", "Points")} <input className={s.points} type="number" min="0" max="100" value={it.points} onChange={(e) => setItem(si, ii, { points: Number(e.target.value) })} /></label>
                        {it.kind !== "pool" && MANUAL_OK.includes(q?.interaction) && (
                          <select className={s.points} style={{ width: 120 }} aria-label={tt("build.marking", "Marking")} value={it.marking} onChange={(e) => setItem(si, ii, { marking: e.target.value })}>
                            <option value="auto">{tt("build.auto", "Auto mark")}</option><option value="manual">{tt("build.manual", "I'll mark")}</option>
                          </select>
                        )}
                        <button type="button" className={s.iconBtn} disabled={ii === 0} onClick={() => moveItem(si, ii, -1)} aria-label={tt("ed.up", "Move up")}><FaArrowUp aria-hidden="true" /></button>
                        <button type="button" className={s.iconBtn} disabled={ii === sec.items.length - 1} onClick={() => moveItem(si, ii, 1)} aria-label={tt("ed.down", "Move down")}><FaArrowDown aria-hidden="true" /></button>
                        <button type="button" className={s.iconBtn} onClick={() => setSec(si, { items: sec.items.filter((_, j) => j !== ii) })} aria-label={tt("build.removeItem", "Remove question {{n}}", { n: ii + 1 })}><FaTrash aria-hidden="true" /></button>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {sec.items.length === 0 && <p className={s.muted}>{tt("build.emptySection", "No questions yet.")}</p>}
              {poolFor === si && <PoolForm onCancel={() => setPoolFor(null)} onAdd={(pool) => { setSec(si, { items: [...sec.items, { kind: "pool", pool, points: 1, partialCredit: true, marking: "auto", rubric: [] }] }); setPoolFor(null); }} />}
              <div className={s.actions} style={{ marginTop: 12 }}>
                <Button variant="soft" icon={FaPlus} onClick={() => setPicker(si)}>{tt("build.addQuestions", "Add from the bank")}</Button>
                <Button variant="ghost" icon={FaDice} onClick={() => (advanced ? setPoolFor(si) : setMsg({ kind: "error", text: tt("build.poolLocked", "Random pools are part of the advanced tests plan.") }))}>{tt("build.addPool", "Add a random pool")}</Button>
              </div>
            </section>
          ))}
          <div><Button variant="ghost" icon={FaPlus} onClick={() => touch(() => setSections([...sections, { title: "", fixedOrder: false, items: [] }]))}>{tt("build.addSection", "Add a section")}</Button></div>
        </div>

        <div className={s.page}>
          <RulesPanel r={rules} set={(r) => touch(() => setRules(r))} advanced={advanced} />
          {!test.isTemplate && (dirty ? <p className={`${s.notice} ${s.noticeWarn}`}>{tt("build.saveFirst", "Save your changes, then assign.")}</p> : <AssignPanel key={assignment?._id || "new"} test={test} assignment={assignment} onPublished={load} />)}
        </div>
      </div>

      {picker !== null && <BankPicker already={already} onClose={() => setPicker(null)} onAdd={(qs) => addQuestions(picker, qs)} />}
      {preview && <PreviewModal testId={id} onClose={() => setPreview(false)} />}
      {dirty && <div className={s.srOnly} aria-live="polite">{tt("build.unsaved", "Unsaved changes")}</div>}
    </div>
  );
}

function RubricEditor({ rubric, onChange }) {
  const tt = useT();
  const add = () => onChange([...rubric, { name: "", levels: [{ label: tt("rub.l0", "Not yet"), points: 0 }, { label: tt("rub.l1", "Some"), points: 1 }, { label: tt("rub.l2", "Clear"), points: 2 }] }]);
  return (
    <div className={s.page} style={{ gap: 8, marginTop: 8 }}>
      {rubric.map((c, ci) => (
        <div key={ci} className={s.listRow} style={{ flexDirection: "column", alignItems: "stretch" }}>
          <div className={s.row} style={{ alignItems: "center", flexWrap: "nowrap" }}>
            <input aria-label={tt("rub.criterion", "Criterion {{n}}", { n: ci + 1 })} placeholder={tt("rub.criterionPh", "Ideas")} value={c.name} onChange={(e) => onChange(rubric.map((x, j) => (j === ci ? { ...x, name: e.target.value } : x)))} style={{ flex: 1, minHeight: 40, borderRadius: 10, border: "1.5px solid var(--d-control)", padding: "4px 10px" }} />
            <button type="button" className={s.iconBtn} onClick={() => onChange(rubric.filter((_, j) => j !== ci))} aria-label={tt("rub.remove", "Remove criterion")}><FaTrash aria-hidden="true" /></button>
          </div>
          <div className={s.chips}>
            {c.levels.map((l, li) => (
              <span key={li} className={s.row} style={{ gap: 4, alignItems: "center", flexWrap: "nowrap" }}>
                <input aria-label={tt("rub.level", "Level {{n}} name", { n: li + 1 })} value={l.label} onChange={(e) => onChange(rubric.map((x, j) => (j === ci ? { ...x, levels: x.levels.map((y, k) => (k === li ? { ...y, label: e.target.value } : y)) } : x)))} style={{ width: 90, minHeight: 36, borderRadius: 8, border: "1.5px solid var(--d-control)", padding: "2px 6px" }} />
                <input aria-label={tt("rub.levelPts", "Level {{n}} points", { n: li + 1 })} type="number" min="0" value={l.points} onChange={(e) => onChange(rubric.map((x, j) => (j === ci ? { ...x, levels: x.levels.map((y, k) => (k === li ? { ...y, points: Number(e.target.value) } : y)) } : x)))} style={{ width: 56, minHeight: 36, borderRadius: 8, border: "1.5px solid var(--d-control)", padding: "2px 6px" }} />
              </span>
            ))}
          </div>
        </div>
      ))}
      <div><Button size="sm" variant="ghost" icon={FaPlus} onClick={add}>{tt("rub.add", "Add a criterion")}</Button></div>
      <p className={s.small}>{tt("rub.note", "The mark is the sum of the chosen levels, up to the question's points.")}</p>
    </div>
  );
}
