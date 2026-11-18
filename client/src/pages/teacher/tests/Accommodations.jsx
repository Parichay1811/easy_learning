// Accommodations per student (TCH-034): set once, applied to every test.
import { useCallback, useEffect, useState } from "react";
import { Button, Skeleton, EmptyState } from "../../../components/dashboard";
import { useTeacherApi, useT } from "./api";
import { Locked } from "./TeacherTestsApp";
import s from "./tests.module.css";

const DEFAULT = { extraTime: 1, readAloud: false, largerText: false, fewerOptions: false, note: "" };

export default function Accommodations() {
  const api = useTeacherApi();
  const tt = useT();
  const [data, setData] = useState(null);
  const [batchId, setBatchId] = useState("");
  const [edits, setEdits] = useState({});
  const [saved, setSaved] = useState({});
  const [locked, setLocked] = useState(null);

  const load = useCallback(async () => {
    const r = await api.get(`/accommodations${batchId ? `?batchId=${batchId}` : ""}`);
    if (r.locked) { setLocked(r.locked); return; }
    setData(r.ok ? r : { students: [], groups: [] });
  }, [api, batchId]);
  useEffect(() => { Promise.resolve().then(load); }, [load]);

  const val = (st) => ({ ...DEFAULT, ...(st.accommodations || {}), ...(edits[st._id] || {}) });
  const change = (st, patch) => { setEdits((e) => ({ ...e, [st._id]: { ...val(st), ...patch } })); setSaved((x) => ({ ...x, [st._id]: "" })); };
  const save = async (st) => {
    const r = await api.put(`/accommodations/${st._id}`, val(st));
    setSaved((x) => ({ ...x, [st._id]: r.ok ? tt("acc.saved", "Saved") : r.message }));
    if (r.ok) setEdits((e) => { const n = { ...e }; delete n[st._id]; return n; });
    if (r.ok) setData((d) => ({ ...d, students: d.students.map((x) => (x._id === st._id ? { ...x, accommodations: r.student.accommodations } : x)) }));
  };

  if (locked) return <Locked module={locked} />;
  if (!data) return <Skeleton variant="chart" />;

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1>{tt("acc.title", "Accommodations")}</h1>
          <p>{tt("acc.sub", "Set once per student. Every test applies them automatically: extra time is added to the timer, read-aloud starts on its own.")}</p>
        </div>
        <label className={s.field} style={{ minWidth: 200 }}><span>{tt("acc.group", "Group")}</span>
          <select value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            <option value="">{tt("acc.allGroups", "All my groups")}</option>
            {data.groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>
        </label>
      </div>
      {!data.students.length ? <EmptyState title={tt("acc.empty", "No students yet")} text={tt("acc.emptyText", "Students in your groups appear here.")} /> : (
        <section className={s.card}>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <caption className={s.srOnly}>{tt("acc.caption", "Accommodations per student")}</caption>
              <thead><tr><th>{tt("acc.student", "Student")}</th><th>{tt("acc.extra", "Extra time")}</th><th>{tt("acc.read", "Read aloud")}</th><th>{tt("acc.large", "Larger text")}</th><th>{tt("acc.fewer", "Fewer options")}</th><th>{tt("acc.note", "Note")}</th><th><span className={s.srOnly}>{tt("acc.save", "Save")}</span></th></tr></thead>
              <tbody>
                {data.students.map((st) => {
                  const v = val(st);
                  return (
                    <tr key={st._id} className={edits[st._id] ? s.dirty : ""}>
                      <td><strong>{st.name}</strong></td>
                      <td><select aria-label={tt("acc.extraFor", "Extra time for {{name}}", { name: st.name })} value={v.extraTime} onChange={(e) => change(st, { extraTime: Number(e.target.value) })}>{[1, 1.25, 1.5, 2].map((m) => <option key={m} value={m}>{m === 1 ? tt("acc.none", "None") : `×${m}`}</option>)}</select></td>
                      <td><input type="checkbox" aria-label={tt("acc.readFor", "Read aloud for {{name}}", { name: st.name })} checked={v.readAloud} onChange={(e) => change(st, { readAloud: e.target.checked })} style={{ width: 22, height: 22 }} /></td>
                      <td><input type="checkbox" aria-label={tt("acc.largeFor", "Larger text for {{name}}", { name: st.name })} checked={v.largerText} onChange={(e) => change(st, { largerText: e.target.checked })} style={{ width: 22, height: 22 }} /></td>
                      <td><input type="checkbox" aria-label={tt("acc.fewerFor", "Fewer options for {{name}}", { name: st.name })} checked={v.fewerOptions} onChange={(e) => change(st, { fewerOptions: e.target.checked })} style={{ width: 22, height: 22 }} /></td>
                      <td style={{ minWidth: 160 }}><input aria-label={tt("acc.noteFor", "Note for {{name}}", { name: st.name })} value={v.note} maxLength={300} onChange={(e) => change(st, { note: e.target.value })} /></td>
                      <td>{edits[st._id] ? <Button size="sm" onClick={() => save(st)}>{tt("acc.save", "Save")}</Button> : <span className={s.small} role="status">{saved[st._id]}</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className={s.small}>{tt("acc.note2", "\"Fewer options\" keeps the right answer and two others on choice questions. A separate quiet window is not available yet.")}</p>
        </section>
      )}
    </div>
  );
}
