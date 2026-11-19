// Accommodations per student (TCH-034): set once, applied to every test.
import { useCallback, useEffect, useState } from "react";
import { FaPen } from "react-icons/fa";
import { Button, Skeleton, EmptyState, Sheet } from "../../../components/dashboard";
import { useMedia } from "../teacherShared";
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
  const [editing, setEditing] = useState(null);
  const discard = () => { setEdits((e) => { const n = { ...e }; delete n[editing?._id]; return n; }); setEditing(null); };
  // Phones and small tablets: a short list (one line per student) and an Edit sheet, instead of a seven-column table.
  const phone = useMedia("(max-width: 900px)");

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
      {!data.students.length ? <EmptyState title={tt("acc.empty", "No students yet")} text={tt("acc.emptyText", "Students in your groups appear here.")} /> : phone ? (
        <section className={s.card} style={{ padding: 12 }}>
          <ul className={s.list}>
            {data.students.map((st) => {
              const v = val(st);
              const on = [
                v.extraTime > 1 && tt("acc.extraShort", "Extra time ×{{m}}", { m: v.extraTime }),
                v.readAloud && tt("acc.read", "Read aloud"),
                v.largerText && tt("acc.large", "Larger text"),
                v.fewerOptions && tt("acc.fewer", "Fewer options"),
              ].filter(Boolean);
              return (
                <li key={st._id} className={s.listRow}>
                  <div className={s.grow}>
                    <div className={s.title}>{st.name}</div>
                    <div className={s.chips} style={{ marginTop: 4 }}>
                      {on.length ? on.map((x) => <span key={x} className={`${s.chip} ${s.chipAccent}`}>{x}</span>) : <span className={s.small}>{tt("acc.noneSet", "Nothing set")}</span>}
                      {saved[st._id] && <span className={s.small} role="status">{saved[st._id]}</span>}
                    </div>
                  </div>
                  <Button size="sm" variant="soft" icon={FaPen} aria-haspopup="dialog" onClick={() => setEditing(st)}>{tt("acc.edit", "Edit")}<span className={s.srOnly}> {st.name}</span></Button>
                </li>
              );
            })}
          </ul>
          <p className={s.small}>{tt("acc.note2", "\"Fewer options\" keeps the right answer and two others on choice questions. A separate quiet window is not available yet.")}</p>
          {editing && (() => {
            const st = data.students.find((x) => x._id === editing._id) || editing;
            const v = val(st);
            return (
              <Sheet title={st.name} text={tt("acc.sheetText", "Applied to every test automatically.")} size="sm" onClose={discard}
                footer={<>
                  <Button variant="ghost" onClick={discard}>{tt("cancel", "Cancel")}</Button>
                  <Button onClick={async () => { await save(st); setEditing(null); }} disabled={!edits[st._id]}>{tt("acc.save", "Save")}</Button>
                </>}>
                <label className={s.field}><span>{tt("acc.extra", "Extra time")}</span>
                  <select value={v.extraTime} onChange={(e) => change(st, { extraTime: Number(e.target.value) })}>{[1, 1.25, 1.5, 2].map((m) => <option key={m} value={m}>{m === 1 ? tt("acc.none", "None") : `×${m}`}</option>)}</select>
                </label>
                <label className={s.check}><input type="checkbox" checked={v.readAloud} onChange={(e) => change(st, { readAloud: e.target.checked })} />{tt("acc.read", "Read aloud")}</label>
                <label className={s.check}><input type="checkbox" checked={v.largerText} onChange={(e) => change(st, { largerText: e.target.checked })} />{tt("acc.large", "Larger text")}</label>
                <label className={s.check}><input type="checkbox" checked={v.fewerOptions} onChange={(e) => change(st, { fewerOptions: e.target.checked })} />{tt("acc.fewer", "Fewer options")}</label>
                <label className={s.field}><span>{tt("acc.note", "Note")}</span>
                  <input value={v.note} maxLength={300} onChange={(e) => change(st, { note: e.target.value })} />
                </label>
              </Sheet>
            );
          })()}
        </section>
      ) : (
        <section className={s.card}>
          <div className={`${s.tableWrap} ${s.scrollArea}`}>
            <table className={s.table}>
              <caption className={s.srOnly}>{tt("acc.caption", "Accommodations per student")}</caption>
              <thead><tr><th>{tt("acc.student", "Student")}</th><th>{tt("acc.extra", "Extra time")}</th><th>{tt("acc.read", "Read aloud")}</th><th>{tt("acc.large", "Larger text")}</th><th>{tt("acc.fewer", "Fewer options")}</th><th>{tt("acc.note", "Note")}</th><th><span className={s.srOnly}>{tt("acc.save", "Save")}</span></th></tr></thead>
              <tbody>
                {data.students.map((st) => {
                  const v = val(st);
                  return (
                    <tr key={st._id} className={edits[st._id] ? s.dirty : ""}>
                      <td data-label={tt("acc.student", "Student")}><strong>{st.name}</strong></td>
                      <td data-label={tt("acc.extra", "Extra time")}><select aria-label={tt("acc.extraFor", "Extra time for {{name}}", { name: st.name })} value={v.extraTime} onChange={(e) => change(st, { extraTime: Number(e.target.value) })}>{[1, 1.25, 1.5, 2].map((m) => <option key={m} value={m}>{m === 1 ? tt("acc.none", "None") : `×${m}`}</option>)}</select></td>
                      <td data-label={tt("acc.read", "Read aloud")}><input type="checkbox" aria-label={tt("acc.readFor", "Read aloud for {{name}}", { name: st.name })} checked={v.readAloud} onChange={(e) => change(st, { readAloud: e.target.checked })} style={{ width: 22, height: 22 }} /></td>
                      <td data-label={tt("acc.large", "Larger text")}><input type="checkbox" aria-label={tt("acc.largeFor", "Larger text for {{name}}", { name: st.name })} checked={v.largerText} onChange={(e) => change(st, { largerText: e.target.checked })} style={{ width: 22, height: 22 }} /></td>
                      <td data-label={tt("acc.fewer", "Fewer options")}><input type="checkbox" aria-label={tt("acc.fewerFor", "Fewer options for {{name}}", { name: st.name })} checked={v.fewerOptions} onChange={(e) => change(st, { fewerOptions: e.target.checked })} style={{ width: 22, height: 22 }} /></td>
                      <td data-label={tt("acc.note", "Note")} style={{ minWidth: 160 }}><input aria-label={tt("acc.noteFor", "Note for {{name}}", { name: st.name })} value={v.note} maxLength={300} onChange={(e) => change(st, { note: e.target.value })} /></td>
                      <td data-label="">{edits[st._id] ? <Button size="sm" onClick={() => save(st)}>{tt("acc.save", "Save")}</Button> : <span className={s.small} role="status">{saved[st._id]}</span>}</td>
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
