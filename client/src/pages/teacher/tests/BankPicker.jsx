// "Pick questions from the bank" dialog used by the test builder.
import { useCallback, useEffect, useRef, useState } from "react";
import { FaTimes, FaSearch } from "react-icons/fa";
import { Button, Skeleton } from "../../../components/dashboard";
import { useTeacherApi, useT, MODULE_KEYS, SUBJECT_KEYS, INTERACTION_LABELS, cap } from "./api";
import { QuestionLine } from "./BankBrowser";
import s from "./tests.module.css";
import { sfx } from "../../../utils/sounds";

export default function BankPicker({ onAdd, onClose, already = [] }) {
  useEffect(() => { sfx.open(); }, []);
  const api = useTeacherApi();
  const tt = useT();
  const [scope, setScope] = useState("mine");
  const [f, setF] = useState({ module: "", subject: "", interaction: "", q: "" });
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [picked, setPicked] = useState({});
  const ref = useRef(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ scope, limit: "50", ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)) });
    const r = await api.get(`/bank/questions?${qs}`);
    setData(r.ok ? r : { questions: [], total: 0 });
  }, [api, scope, f]);
  useEffect(() => { Promise.resolve().then(() => { setData(null); return load(); }); }, [load]);
  useEffect(() => {
    ref.current?.focus();
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const toggle = (q) => setPicked((p) => { const n = { ...p }; if (n[q._id]) delete n[q._id]; else n[q._id] = q; return n; });
  const count = Object.keys(picked).length;

  return (
    <div className={s.modalBack} role="presentation" onClick={onClose}>
      <div className={s.modal} role="dialog" aria-modal="true" aria-labelledby="picker-h" onClick={(e) => e.stopPropagation()} ref={ref} tabIndex={-1}>
        <div className={s.modalHead}>
          <h2 id="picker-h">{tt("pick.title", "Add questions")}</h2>
          <button type="button" className={s.iconBtn} onClick={onClose} aria-label={tt("close", "Close")}><FaTimes aria-hidden="true" /></button>
        </div>
        <div className={s.tabs} role="tablist">
          {[["mine", tt("bank.mine", "My questions")], ["school", tt("bank.school", "My school's")], ["learnigo", tt("bank.learnigo", "Learnigo's")]].map(([k, l]) => (
            <button key={k} type="button" role="tab" className={s.tab} aria-selected={scope === k} onClick={() => setScope(k)}>{l}</button>
          ))}
        </div>
        <form className={s.row} onSubmit={(e) => { e.preventDefault(); setF({ ...f, q: search }); }}>
          <label className={s.field} style={{ flex: "2 1 200px" }}><span>{tt("bank.search", "Search")}</span><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
          <label className={s.field}><span>{tt("ed.module", "Module")}</span><select value={f.module} onChange={(e) => setF({ ...f, module: e.target.value })}><option value="">{tt("all", "All")}</option>{MODULE_KEYS.map((m) => <option key={m} value={m}>{tt(`module.${m}`, cap(m))}</option>)}</select></label>
          <label className={s.field}><span>{tt("ed.subject", "Subject")}</span><select value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })}><option value="">{tt("all", "All")}</option>{SUBJECT_KEYS.map((m) => <option key={m} value={m}>{tt(`subject.${m}`, cap(m))}</option>)}</select></label>
          <label className={s.field}><span>{tt("ed.kind", "Type")}</span><select value={f.interaction} onChange={(e) => setF({ ...f, interaction: e.target.value })}><option value="">{tt("all", "All")}</option>{Object.entries(INTERACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{tt(`type.${k}`, v)}</option>)}</select></label>
          <Button type="submit" icon={FaSearch} variant="soft">{tt("bank.go", "Search")}</Button>
        </form>
        {!data ? <Skeleton variant="text" lines={5} /> : data.questions.length === 0 ? <p className={s.empty}>{tt("pick.none", "No questions here. Try another tab or fewer filters.")}</p> : (
          <ul className={s.list}>
            {data.questions.map((q) => {
              const inTest = already.includes(q._id);
              return (
                <li key={q._id}>
                  <label style={{ display: "block", cursor: inTest ? "default" : "pointer" }}>
                    <QuestionLine q={q} right={inTest ? <span className={s.chip}>{tt("pick.inTest", "In the test")}</span> : <input type="checkbox" checked={!!picked[q._id]} onChange={() => toggle(q)} style={{ width: 22, height: 22 }} aria-label={tt("pick.choose", "Choose: {{q}}", { q: q.instruction })} />} />
                  </label>
                  {q.mine && q.status !== "approved" && <p className={s.small} style={{ margin: "4px 0 0 12px" }}>{tt("pick.pending", "Waiting for review: students can't get it until your admin approves it.")}</p>}
                </li>
              );
            })}
          </ul>
        )}
        <div className={s.actions} style={{ justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onClose}>{tt("cancel", "Cancel")}</Button>
          <Button disabled={!count} onClick={() => onAdd(Object.values(picked))}>{tt("pick.add", "Add {{n}}", { n: count })}</Button>
        </div>
      </div>
    </div>
  );
}
