// Question bank browser (TCH-022/023/027): my questions, my school's, Learnigo's;
// search and filters, duplicate, collections, CSV export and bulk grid edit.
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaFileImport, FaFileExport, FaTable, FaCopy, FaArchive, FaFolderPlus, FaSearch } from "react-icons/fa";
import { Button, EmptyState, Skeleton } from "../../../components/dashboard";
import { useTeacherApi, useT, INTERACTION_LABELS, MODULE_KEYS, SUBJECT_KEYS, cap } from "./api";
import { Locked } from "./TeacherTestsApp";
import s from "./tests.module.css";

const GRADE_BANDS = ["K-2", "3-5", "6-8", "9-10", "11-12", "adult"];

export function QuestionLine({ q, stats, right }) {
  const tt = useT();
  return (
    <div className={`${s.listRow} ${s.qline}`}>
      <span aria-hidden="true" style={{ fontSize: 26, width: 36, textAlign: "center" }}>{q.emoji || "❓"}</span>
      <div className={s.grow}>
        <div className={s.title}>{q.instruction || tt("bank.untitled", "(no instruction)")}{q.prompt ? <span className={s.muted}> · {q.prompt}</span> : null}</div>
        <div className={s.chips} style={{ marginTop: 4 }}>
          <span className={`${s.chip} ${s.chipAccent}`}>{tt(`type.${q.interaction}`, INTERACTION_LABELS[q.interaction] || q.interaction)}</span>
          <span className={s.chip}>{tt(`module.${q.module}`, cap(q.module))} · {tt(`subject.${q.subject}`, cap(q.subject))}</span>
          {q.difficulty && <span className={s.chip}>{tt("bank.diff", "Difficulty {{d}}", { d: q.difficulty })}</span>}
          {q.skillIds?.slice(0, 3).map((k) => <span key={k} className={s.chip}>{k}</span>)}
          {q.mine && q.status !== "approved" && <span className={`${s.chip} ${q.status === "rejected" ? s.chipAlert : s.chipWarn}`}>{tt(`status.${q.status}`, cap(q.status))}</span>}
          {stats?.used ? <span className={s.chip}>{tt("bank.statsLine", "Used {{n}}× · {{p}} % right", { n: stats.used, p: stats.percentCorrect })}</span> : null}
          {stats?.flags?.map((f) => <span key={f} className={`${s.chip} ${s.chipWarn}`}>{tt(`flag.${f}`, f.replace(/_/g, " "))}</span>)}
        </div>
      </div>
      {right}
    </div>
  );
}

function BulkGrid({ rows, onDone }) {
  const api = useTeacherApi();
  const tt = useT();
  const [edits, setEdits] = useState({});
  const [msg, setMsg] = useState("");
  const val = (q, k) => (edits[q._id]?.[k] ?? (k === "skillIds" ? q.skillIds.join(", ") : q[k] ?? ""));
  const change = (q, k, v) => setEdits((e) => ({ ...e, [q._id]: { ...e[q._id], [k]: v } }));
  const save = async () => {
    const updates = Object.entries(edits).map(([id, set]) => {
      const q = rows.find((r) => r._id === id);
      const out = { ...set };
      if ("skillIds" in out) out.skillIds = String(out.skillIds).split(",").map((x) => x.trim()).filter(Boolean);
      if ("difficulty" in out) out.difficulty = Number(out.difficulty);
      if ("points" in out) out.points = Number(out.points);
      return { module: q.module, subject: q.subject, id, set: out };
    });
    if (!updates.length) return onDone(false);
    const r = await api.patch("/bank/bulk", { updates });
    const failed = (r.results || []).filter((x) => !x.ok).length;
    setMsg(failed ? tt("bulk.partial", "{{saved}} saved, {{failed}} could not be saved.", { saved: r.saved, failed }) : tt("bulk.saved", "{{n}} saved.", { n: r.saved }));
    if (!failed) onDone(true);
  };
  return (
    <section className={s.card}>
      <div className={s.head}><h2 style={{ margin: 0 }}>{tt("bulk.title", "Edit many at once")}</h2>
        <div className={s.actions}><Button variant="ghost" onClick={() => onDone(false)}>{tt("cancel", "Cancel")}</Button><Button onClick={save}>{tt("bulk.save", "Save changes ({{n}})", { n: Object.keys(edits).length })}</Button></div>
      </div>
      {msg && <p className={s.notice} role="status">{msg}</p>}
      <div className={s.tableWrap}>
        <table className={s.table}>
          <caption className={s.srOnly}>{tt("bulk.caption", "Your questions, editable")}</caption>
          <thead><tr><th>{tt("bulk.instruction", "Instruction")}</th><th>{tt("bulk.prompt", "Prompt")}</th><th>{tt("bulk.skills", "Skills")}</th><th>{tt("bulk.grade", "Grade")}</th><th>{tt("bulk.difficulty", "Difficulty")}</th><th>{tt("bulk.code", "Code")}</th><th>{tt("bulk.points", "Points")}</th></tr></thead>
          <tbody>
            {rows.filter((q) => !q.legacy).map((q) => (
              <tr key={q._id} className={edits[q._id] ? s.dirty : ""}>
                <td style={{ minWidth: 200 }}><input aria-label={tt("bulk.instruction", "Instruction")} value={val(q, "instruction")} onChange={(e) => change(q, "instruction", e.target.value)} /></td>
                <td style={{ minWidth: 140 }}><input aria-label={tt("bulk.prompt", "Prompt")} value={val(q, "prompt")} onChange={(e) => change(q, "prompt", e.target.value)} /></td>
                <td style={{ minWidth: 140 }}><input aria-label={tt("bulk.skills", "Skills")} value={val(q, "skillIds")} onChange={(e) => change(q, "skillIds", e.target.value)} /></td>
                <td><select aria-label={tt("bulk.grade", "Grade")} value={val(q, "gradeBand")} onChange={(e) => change(q, "gradeBand", e.target.value)}><option value="">—</option>{GRADE_BANDS.map((g) => <option key={g}>{g}</option>)}</select></td>
                <td><select aria-label={tt("bulk.difficulty", "Difficulty")} value={val(q, "difficulty") || 2} onChange={(e) => change(q, "difficulty", e.target.value)}>{[1, 2, 3, 4, 5].map((d) => <option key={d}>{d}</option>)}</select></td>
                <td style={{ minWidth: 90 }}><input aria-label={tt("bulk.code", "Code")} value={val(q, "curriculumCode")} onChange={(e) => change(q, "curriculumCode", e.target.value)} /></td>
                <td style={{ width: 80 }}><input aria-label={tt("bulk.points", "Points")} type="number" min="1" max="100" value={val(q, "points") || 10} onChange={(e) => change(q, "points", e.target.value)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={s.small}>{tt("bulk.note", "Changing the wording sends a school question back for review. Tags never do.")}</p>
    </section>
  );
}

export default function BankBrowser() {
  const api = useTeacherApi();
  const tt = useT();
  const navigate = useNavigate();
  const [scope, setScope] = useState("mine");
  const [filters, setFilters] = useState({ module: "", subject: "", interaction: "", difficulty: "", q: "" });
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({});
  const [locked, setLocked] = useState(null);
  const [bulk, setBulk] = useState(false);
  const [cols, setCols] = useState([]);
  const [colView, setColView] = useState(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async (p = 1) => {
    const qs = new URLSearchParams({ scope, page: String(p), limit: "30", ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) })
    const r = await api.get(`/bank/questions?${qs}`);
    if (r.locked) { setLocked(r.locked); return; }
    if (!r.ok) { setData({ total: 0, questions: [] }); return; }
    setData((d) => (p > 1 && d ? { ...r, questions: [...d.questions, ...r.questions] } : r));
    setPage(p);
    const st = await api.post("/bank/stats", { ids: r.questions.map((q) => q._id) });
    if (st.ok) setStats((x) => ({ ...x, ...st.stats }));
  }, [api, scope, filters]);

  const loadCols = useCallback(async () => { const r = await api.get("/bank/collections"); if (r.ok) setCols(r.collections); }, [api]);

  useEffect(() => { Promise.resolve().then(() => { setData(null); return load(1); }); }, [load]);
  useEffect(() => { Promise.resolve().then(loadCols); }, [loadCols]);

  const openCollection = async (c) => {
    const r = await api.get(`/bank/collections/${c._id}`);
    if (r.ok) setColView(r);
  };
  const newCollection = async () => {
    const name = window.prompt(tt("col.namePrompt", "Name the collection, e.g. \"Fractions starter set\""));
    if (!name) return;
    await api.post("/bank/collections", { name });
    loadCols();
  };
  const addTo = async (q, colId) => {
    if (!colId) return;
    const r = await api.patch(`/bank/collections/${colId}`, { add: [{ module: q.module, subject: q.subject, questionId: q._id }] });
    setMsg(r.ok ? tt("col.added", "Added to {{name}}.", { name: r.collection.name }) : r.message);
    loadCols();
  };
  const duplicate = async (q) => {
    const r = await api.post(`/bank/questions/${q.module}/${q.subject}/${q._id}/duplicate`, {});
    if (r.ok) navigate(`/teacher/tests/bank/${r.question.module}/${r.question.subject}/${r.question._id}`);
    else setMsg(r.message);
  };
  const archive = async (q) => {
    if (!window.confirm(tt("bank.archiveConfirm", "Archive this question? Tests that already used it keep their copy."))) return;
    await api.del(`/bank/questions/${q.module}/${q.subject}/${q._id}`);
    load(1);
  };
  const exportCsv = () => api.download(`/bank/export.csv?scope=${scope === "learnigo" ? "mine" : scope}${filters.module ? `&module=${filters.module}` : ""}${filters.subject ? `&subject=${filters.subject}` : ""}`, `questions-${scope}.csv`);

  if (locked) return <Locked module={locked} />;

  const row = (q) => (
    <QuestionLine key={`${q.module}-${q._id}`} q={q} stats={stats[q._id]} right={
      <div className={s.itemTools}>
        <Button size="sm" variant="soft" to={`/teacher/tests/bank/${q.module}/${q.subject}/${q._id}`}>{q.mine ? tt("bank.edit", "Edit") : tt("bank.view", "View")}</Button>
        <button type="button" className={s.iconBtn} onClick={() => duplicate(q)} aria-label={tt("bank.duplicate", "Duplicate")} title={tt("bank.duplicate", "Duplicate")}><FaCopy aria-hidden="true" /></button>
        {cols.filter((c) => c.mine).length > 0 && (
          <select className={s.points} style={{ width: 150 }} aria-label={tt("col.addTo", "Add to collection")} value="" onChange={(e) => addTo(q, e.target.value)}>
            <option value="">{tt("col.addTo", "Add to collection")}</option>
            {cols.filter((c) => c.mine).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        )}
        {q.mine && <button type="button" className={s.iconBtn} onClick={() => archive(q)} aria-label={tt("bank.archive", "Archive")} title={tt("bank.archive", "Archive")}><FaArchive aria-hidden="true" /></button>}
      </div>
    } />
  );

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1>{tt("bank.title", "Question bank")}</h1>
          <p>{tt("bank.sub", "Your questions, your school's and Learnigo's. Use any of them in tests.")}</p>
        </div>
        <div className={s.actions}>
          <Button variant="ghost" icon={FaFileImport} to="/teacher/tests/bank/import">{tt("bank.import", "Import")}</Button>
          <Button variant="ghost" icon={FaFileExport} onClick={exportCsv} disabled={scope === "learnigo"}>{tt("bank.export", "Export CSV")}</Button>
          <Button icon={FaPlus} to="/teacher/tests/bank/new">{tt("bank.new", "New question")}</Button>
        </div>
      </div>
      {msg && <p className={s.notice} role="status">{msg}</p>}

      <div className={s.tabs} role="tablist" aria-label={tt("bank.scope", "Whose questions")}>
        {[["mine", tt("bank.mine", "My questions")], ["school", tt("bank.school", "My school's")], ["learnigo", tt("bank.learnigo", "Learnigo's")]].map(([k, l]) => (
          <button key={k} type="button" role="tab" className={s.tab} aria-selected={scope === k && !colView} onClick={() => { setScope(k); setColView(null); setBulk(false); }}>{l}</button>
        ))}
      </div>

      <section className={s.card} aria-label={tt("bank.filters", "Filters")}>
        <form className={s.row} onSubmit={(e) => { e.preventDefault(); setFilters((f) => ({ ...f, q: search })); }}>
          <label className={s.field} style={{ flex: "2 1 220px" }}><span>{tt("bank.search", "Search")}</span>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tt("bank.searchPh", "Words, skills or a curriculum code")} />
          </label>
          <label className={s.field}><span>{tt("ed.module", "Module")}</span>
            <select value={filters.module} onChange={(e) => setFilters({ ...filters, module: e.target.value })}><option value="">{tt("all", "All")}</option>{MODULE_KEYS.map((m) => <option key={m} value={m}>{tt(`module.${m}`, cap(m))}</option>)}</select>
          </label>
          <label className={s.field}><span>{tt("ed.subject", "Subject")}</span>
            <select value={filters.subject} onChange={(e) => setFilters({ ...filters, subject: e.target.value })}><option value="">{tt("all", "All")}</option>{SUBJECT_KEYS.map((m) => <option key={m} value={m}>{tt(`subject.${m}`, cap(m))}</option>)}</select>
          </label>
          <label className={s.field}><span>{tt("ed.kind", "Type")}</span>
            <select value={filters.interaction} onChange={(e) => setFilters({ ...filters, interaction: e.target.value })}><option value="">{tt("all", "All")}</option>{Object.entries(INTERACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{tt(`type.${k}`, v)}</option>)}</select>
          </label>
          <label className={s.field}><span>{tt("bank.difficulty", "Difficulty")}</span>
            <select value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}><option value="">{tt("all", "All")}</option>{[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{d}</option>)}</select>
          </label>
          <Button icon={FaSearch} type="submit">{tt("bank.go", "Search")}</Button>
        </form>
      </section>

      <div className={s.splitSide}>
        <div className={s.page}>
          {bulk && data ? <BulkGrid rows={data.questions.filter((q) => q.mine)} onDone={(saved) => { setBulk(false); if (saved) load(1); }} /> : (
            <section className={s.card} aria-live="polite">
              {colView ? (
                <>
                  <div className={s.head}><h2 style={{ margin: 0 }}>{colView.collection.name}</h2><Button size="sm" variant="ghost" onClick={() => setColView(null)}>{tt("col.close", "Back to the bank")}</Button></div>
                  {colView.questions.length ? <div className={s.list} style={{ marginTop: 12 }}>{colView.questions.map(row)}</div> : <p className={s.muted}>{tt("col.empty", "Empty. Add questions with \"Add to collection\".")}</p>}
                </>
              ) : !data ? <Skeleton variant="text" lines={6} /> : (
                <>
                  <div className={s.head}>
                    <h2 style={{ margin: 0 }}>{tt("bank.count", "{{count}} questions", { count: data.total, defaultValue_one: "{{count}} question" })}</h2>
                    {scope === "mine" && data.questions.some((q) => q.mine) && <Button size="sm" variant="ghost" icon={FaTable} onClick={() => setBulk(true)}>{tt("bank.bulk", "Edit as a grid")}</Button>}
                  </div>
                  {data.questions.length === 0 ? (
                    <EmptyState compact title={scope === "mine" ? tt("bank.emptyMine", "No questions yet") : tt("bank.emptyOther", "Nothing matches")} text={scope === "mine" ? tt("bank.emptyMineText", "Write one, import a CSV, or copy one from your school or Learnigo.") : tt("bank.emptyOtherText", "Try fewer filters.")} actionLabel={scope === "mine" ? tt("bank.new", "New question") : undefined} to={scope === "mine" ? "/teacher/tests/bank/new" : undefined} />
                  ) : (
                    <div className={s.list} style={{ marginTop: 12 }}>{data.questions.map(row)}</div>
                  )}
                  {data.questions.length < data.total && <div style={{ marginTop: 12 }}><Button variant="ghost" onClick={() => load(page + 1)}>{tt("bank.more", "Show more")}</Button></div>}
                </>
              )}
            </section>
          )}
        </div>
        <aside className={s.card} aria-labelledby="cols-h">
          <div className={s.head}><h2 id="cols-h" style={{ margin: 0 }}>{tt("col.title", "Collections")}</h2>
            <button type="button" className={s.iconBtn} onClick={newCollection} aria-label={tt("col.new", "New collection")}><FaFolderPlus aria-hidden="true" /></button>
          </div>
          {cols.length === 0 ? <p className={s.small}>{tt("col.none", "Group questions into sets like \"Fractions starter set\" and use them as test pools.")}</p> : (
            <ul className={s.list} style={{ marginTop: 10 }}>
              {cols.map((c) => (
                <li key={c._id}><button type="button" className={s.queueBtn} aria-current={colView?.collection._id === c._id} onClick={() => openCollection(c)}>
                  <strong>{c.name}</strong><br /><span className={s.small}>{tt("col.count", "{{count}} questions", { count: c.count, defaultValue_one: "{{count}} question" })}{!c.mine && ` · ${tt("col.shared", "shared")}`}</span>
                </button></li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
