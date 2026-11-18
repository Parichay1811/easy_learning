// ADM-010/011 The school tree: campus -> grade -> section (+ departments).
// Drag to move (or use "Move to" for keyboard users), rename inline, bulk-create,
// counts and a 14-day engagement bar per node; click a node for its people.
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaGripVertical, FaPen, FaPlus, FaTrash, FaChartPie, FaCheck, FaTimes } from "react-icons/fa";
import { Button, EmptyState, PlanLockCard, Skeleton } from "../../../components/dashboard";
import { api, useLoad } from "./api";
import { useSchool, BASE } from "./context";
import { Health, Field, Result, Dialog } from "./bits";
import s from "./school.module.css";

const TYPES = ["campus", "grade", "section", "department"];
const CHILD_TYPE = { campus: "grade", grade: "section", department: null, section: null };
const flatten = (nodes, depth = 0, out = []) => { for (const n of nodes) { out.push({ ...n, depth }); flatten(n.children, depth + 1, out); } return out; };

function Node({ node, selected, onSelect, canEdit, onRename, onAddChild, onDelete, onDrop, dragId, setDragId }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(node.name);
  const [over, setOver] = useState(false);
  const c = node.counts || {};
  const save = async () => { if (name.trim() && name !== node.name) await onRename(node, name.trim()); setEditing(false); };
  return (
    <li>
      <div
        className={`${s.node} ${selected === node.id ? s.nodeSelected : ""} ${over ? s.nodeDrop : ""}`}
        onDragOver={canEdit ? (e) => { if (dragId && dragId !== node.id) { e.preventDefault(); setOver(true); } } : undefined}
        onDragLeave={() => setOver(false)}
        onDrop={canEdit ? (e) => { e.preventDefault(); setOver(false); onDrop(dragId, node.id); } : undefined}
      >
        {canEdit && (
          <span className={s.drag} draggable onDragStart={(e) => { setDragId(node.id); e.dataTransfer.setData("text/plain", node.id); e.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => setDragId(null)}
            title={t("school.tree.drag", { defaultValue: "Drag to move" })} aria-hidden="true"><FaGripVertical /></span>
        )}
        {editing ? (
          <span className={s.row}>
            <label className="d-sr-only" htmlFor={`rn-${node.id}`}>{t("school.tree.newName", { defaultValue: "New name" })}</label>
            <input id={`rn-${node.id}`} className={s.renameInput} value={name} autoFocus maxLength={80} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setName(node.name); setEditing(false); } }} />
            <button type="button" className={s.iconBtn} onClick={save} aria-label={t("school.save", { defaultValue: "Save" })}><FaCheck /></button>
            <button type="button" className={s.iconBtn} onClick={() => { setName(node.name); setEditing(false); }} aria-label={t("school.cancel", { defaultValue: "Cancel" })}><FaTimes /></button>
          </span>
        ) : (
          <button type="button" className={s.nodeName} onClick={() => onSelect(node.id)} aria-pressed={selected === node.id}
            onDoubleClick={canEdit ? () => setEditing(true) : undefined}>{node.name}</button>
        )}
        <span className={s.typeTag}>{t(`school.type.${node.type}`, { defaultValue: node.type })}</span>
        <span className={s.counts}>{t("school.tree.counts", { defaultValue: "{{s}} students · {{t}} teachers · {{g}} groups", s: c.students || 0, t: c.teachers || 0, g: c.groups || 0 })}</span>
        <Health value={node.health?.engagement} />
        <span className={s.nodeTools}>
          <Link className={s.iconBtn} to={`${BASE}/units/${node.id}`} aria-label={t("school.tree.open", { defaultValue: "Open the dashboard for {{name}}", name: node.name })} title={t("school.tree.openShort", { defaultValue: "Dashboard" })}><FaChartPie /></Link>
          {canEdit && <button type="button" className={s.iconBtn} onClick={() => setEditing(true)} aria-label={t("school.tree.rename", { defaultValue: "Rename {{name}}", name: node.name })}><FaPen /></button>}
          {canEdit && CHILD_TYPE[node.type] && <button type="button" className={s.iconBtn} onClick={() => onAddChild(node)} aria-label={t("school.tree.addIn", { defaultValue: "Add inside {{name}}", name: node.name })}><FaPlus /></button>}
          {canEdit && <button type="button" className={s.iconBtn} onClick={() => onDelete(node)} aria-label={t("school.tree.delete", { defaultValue: "Delete {{name}}", name: node.name })}><FaTrash /></button>}
        </span>
      </div>
      {node.children.length > 0 && (
        <ul className={s.tree}>
          {node.children.map((ch) => <Node key={ch.id} node={ch} {...{ selected, onSelect, canEdit, onRename, onAddChild, onDelete, onDrop, dragId, setDragId }} />)}
        </ul>
      )}
    </li>
  );
}

function UnitPanel({ unitId, all, canEdit, canMove, onChanged }) {
  const { t } = useTranslation();
  const people = useLoad(unitId ? `/units/${unitId}/people` : null, { skip: !unitId });
  const unplaced = useLoad("/people/students", { skip: !unitId || !canMove });
  const [picked, setPicked] = useState([]);
  const [moveTo, setMoveTo] = useState("");
  const [result, setResult] = useState(null);
  if (!unitId) return <div className={s.card}><p className={s.muted}>{t("school.tree.pick", { defaultValue: "Choose a unit to see its students, teachers and groups." })}</p></div>;
  if (people.loading) return <div className={s.card}><Skeleton variant="text" lines={6} /></div>;
  if (people.error) return <div className={s.card}><p className={s.errorText}>{people.error.message}</p></div>;
  const p = people.data;
  const free = (unplaced.data?.students || []).filter((x) => !x.unitId).slice(0, 300);
  const me = all.find((n) => n.id === unitId);
  const targets = all.filter((n) => n.id !== unitId && !(n.path || "").includes(`/${unitId}/`));
  const add = async () => {
    try { const r = await api.post(`/units/${unitId}/assign`, { studentIds: picked }); setResult({ ok: true, text: t("school.tree.added", { defaultValue: "{{n}} students placed.", n: r.students }) }); setPicked([]); people.reload(); unplaced.reload(); onChanged(); }
    catch (e) { setResult({ ok: false, text: e.message }); }
  };
  const move = async () => {
    try { await api.patch(`/units/${unitId}`, { parentId: moveTo === "__top" ? null : moveTo }); setResult({ ok: true, text: t("school.tree.moved", { defaultValue: "Moved." }) }); onChanged(); }
    catch (e) { setResult({ ok: false, text: e.message }); }
  };
  return (
    <section className={`${s.card} ${s.sticky}`} aria-labelledby="unit-h">
      <h2 id="unit-h" className={s.cardTitle}>{p.unit.label}</h2>
      <p className={s.cardSub}>{t("school.tree.panelSub", { defaultValue: "{{s}} students · {{t}} teachers · {{g}} groups", s: p.students.length, t: p.teachers.length, g: p.groups.length })}</p>
      <div className={s.actions} style={{ marginTop: 0 }}>
        <Button size="sm" to={`${BASE}/units/${unitId}`}>{t("school.tree.dashboard", { defaultValue: "Open dashboard" })}</Button>
        <Button size="sm" variant="soft" to={`${BASE}/people?unit=${unitId}`}>{t("school.tree.manage", { defaultValue: "Manage students" })}</Button>
      </div>
      {canEdit && me && (
        <div className={s.row} style={{ marginTop: 14, alignItems: "flex-end" }}>
          <Field id="move-to" label={t("school.tree.moveTo", { defaultValue: "Move this unit to" })}>
            <select id="move-to" className={s.select} value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
              <option value="">{t("school.choose", { defaultValue: "Choose…" })}</option>
              <option value="__top">{t("school.tree.top", { defaultValue: "Top of the school" })}</option>
              {targets.map((n) => <option key={n.id} value={n.id}>{"— ".repeat(n.depth)}{n.name}</option>)}
            </select>
          </Field>
          <Button size="sm" variant="soft" disabled={!moveTo} onClick={move}>{t("school.tree.move", { defaultValue: "Move" })}</Button>
        </div>
      )}
      <h3 className={s.label} style={{ marginTop: 18 }}>{t("school.tree.teachers", { defaultValue: "Teachers" })}</h3>
      <p className={s.small}>{p.teachers.map((x) => x.name).join(", ") || t("school.none", { defaultValue: "None yet" })}</p>
      <h3 className={s.label}>{t("school.tree.groups", { defaultValue: "Groups" })}</h3>
      <p className={s.small}>{p.groups.map((g) => `${g.name}${g.archived ? ` (${t("school.archived", { defaultValue: "archived" })})` : ""}`).join(", ") || t("school.none", { defaultValue: "None yet" })}</p>
      <h3 className={s.label}>{t("school.tree.students", { defaultValue: "Students" })}</h3>
      <ul className={s.list} style={{ maxHeight: 260, overflow: "auto" }}>
        {p.students.slice(0, 200).map((x) => (
          <li key={x._id} className={s.listItem}><Link to={`${BASE}/students/${x._id}`}>{x.name}</Link><span className={`${s.small} ${s.muted}`}>{x.unit}</span></li>
        ))}
        {!p.students.length && <li className={s.muted}>{t("school.none", { defaultValue: "None yet" })}</li>}
      </ul>
      {canMove && free.length > 0 && (
        <details style={{ marginTop: 14 }}>
          <summary className={s.link}>{t("school.tree.place", { defaultValue: "Place students without a class here ({{n}})", n: free.length })}</summary>
          <div style={{ maxHeight: 220, overflow: "auto", marginTop: 8 }}>
            {free.map((x) => (
              <label key={x._id} className={s.check}>
                <input type="checkbox" checked={picked.includes(x._id)} onChange={(e) => setPicked((pk) => (e.target.checked ? [...pk, x._id] : pk.filter((i) => i !== x._id)))} />
                <span>{x.name} <span className={s.muted}>{x.grade}</span></span>
              </label>
            ))}
          </div>
          <Button size="sm" disabled={!picked.length} onClick={add}>{t("school.tree.placeN", { defaultValue: "Place {{n}} here", n: picked.length })}</Button>
        </details>
      )}
      <Result result={result} />
    </section>
  );
}

export default function TreePage() {
  const { t } = useTranslation();
  const { has, can, isAdmin } = useSchool();
  const [params, setParams] = useSearchParams();
  const locked = !has("org.tree");
  const data = useLoad("/units", { skip: locked });
  const [dragId, setDragId] = useState(null);
  const [spec, setSpec] = useState("Grades 1-8, sections A-C");
  const [bulkParent, setBulkParent] = useState("");
  const [result, setResult] = useState(null);
  const [adding, setAdding] = useState(null); // { parent?, type }
  const [newName, setNewName] = useState("");
  const selected = params.get("unit");
  const all = useMemo(() => flatten(data.data?.tree || []), [data.data]);
  const canEdit = Boolean(isAdmin && data.data?.canEdit);

  if (locked) return <PlanLockCard module="org.tree" title={t("school.lock.tree", { defaultValue: "Campus, grade and section structure" })} text={t("school.lock.treeText", { defaultValue: "Organise your school as a tree and see every level's dashboard. Your school keeps working with plain groups without it." })} />;

  const run = async (fn, ok) => {
    setResult(null);
    try { const r = await fn(); setResult({ ok: true, text: ok(r) }); data.reload(); } catch (e) { setResult({ ok: false, text: e.message }); }
  };
  const onDrop = (from, to) => from && from !== to && run(() => api.patch(`/units/${from}`, { parentId: to }), () => t("school.tree.moved", { defaultValue: "Moved." }));
  const onRename = (node, name) => run(() => api.patch(`/units/${node.id}`, { name }), () => t("school.tree.renamed", { defaultValue: "Renamed." }));
  const onDelete = (node) => {
    if (!window.confirm(t("school.tree.confirmDelete", { defaultValue: "Delete {{name}}? Only empty units can be deleted.", name: node.name }))) return;
    run(() => api.del(`/units/${node.id}`), () => t("school.tree.deleted", { defaultValue: "Deleted." }));
  };
  const create = async () => {
    await run(() => api.post("/units", { type: adding.type, name: newName, parentId: adding.parent?.id || null }), () => t("school.tree.created", { defaultValue: "Added." }));
    setAdding(null); setNewName("");
  };
  const select = (id) => setParams((p) => { const n = new URLSearchParams(p); n.set("unit", id); return n; }, { replace: true });

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.title}>{t("school.tree.title", { defaultValue: "School tree" })}</h1>
          <p className={s.sub}>{t("school.tree.sub", { defaultValue: "Campus → grade → section. Drag to move, double-click a name to rename." })}</p>
        </div>
        {canEdit && (
          <div className={s.row}>
            <Button size="sm" variant="soft" icon={FaPlus} onClick={() => setAdding({ type: "campus" })}>{t("school.tree.addCampus", { defaultValue: "Campus" })}</Button>
            <Button size="sm" variant="soft" icon={FaPlus} onClick={() => setAdding({ type: "grade" })}>{t("school.tree.addGrade", { defaultValue: "Grade" })}</Button>
            <Button size="sm" variant="soft" icon={FaPlus} onClick={() => setAdding({ type: "department" })}>{t("school.tree.addDept", { defaultValue: "Department" })}</Button>
          </div>
        )}
      </div>
      {canEdit && (
        <section className={s.card} aria-labelledby="bulk-h">
          <h2 id="bulk-h" className={s.cardTitle}>{t("school.tree.bulkTitle", { defaultValue: "Create many at once" })}</h2>
          <div className={s.row} style={{ alignItems: "flex-end" }}>
            <div className={s.grow} style={{ minWidth: 240 }}>
              <Field id="bulk-spec" label={t("school.tree.bulkLabel", { defaultValue: "Grades and sections" })} hint={t("school.tree.bulkHint", { defaultValue: 'For example "Grades 1-8, sections A-C" or "Year 4-6, sections Red, Blue". Existing ones are kept.' })}>
                <input id="bulk-spec" className={s.input} value={spec} onChange={(e) => setSpec(e.target.value)} aria-describedby="bulk-spec-hint" />
              </Field>
            </div>
            {all.some((n) => n.type === "campus") && (
              <Field id="bulk-parent" label={t("school.tree.inCampus", { defaultValue: "In campus" })}>
                <select id="bulk-parent" className={s.select} value={bulkParent} onChange={(e) => setBulkParent(e.target.value)}>
                  <option value="">{t("school.tree.noCampus", { defaultValue: "No campus" })}</option>
                  {all.filter((n) => n.type === "campus").map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </Field>
            )}
            <Button onClick={() => run(() => api.post("/units/bulk", { spec, parentId: bulkParent || null }), (r) => t("school.tree.bulkDone", { defaultValue: "{{n}} units added.", n: r.created }))}>{t("school.tree.create", { defaultValue: "Create" })}</Button>
          </div>
        </section>
      )}
      <Result result={result} />
      <div className={s.treeLayout}>
        <section className={s.card} aria-labelledby="tree-h">
          <h2 id="tree-h" className="d-sr-only">{t("school.tree.title", { defaultValue: "School tree" })}</h2>
          {data.loading && <Skeleton variant="text" lines={8} />}
          {data.error && <p className={s.errorText}>{data.error.message}</p>}
          {data.data && !all.length && (
            <EmptyState title={t("school.tree.emptyTitle", { defaultValue: "No structure yet" })} text={canEdit ? t("school.tree.emptyText", { defaultValue: "Start with the bulk box above: it builds every grade and section in one go." }) : t("school.tree.emptyStaff", { defaultValue: "Your admin hasn't set up the structure yet." })} compact />
          )}
          {canEdit && dragId && (
            <div className={`${s.node} ${s.nodeDrop}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); run(() => api.patch(`/units/${dragId}`, { parentId: null }), () => t("school.tree.moved", { defaultValue: "Moved." })); }}>
              {t("school.tree.dropTop", { defaultValue: "Drop here to move to the top of the school" })}
            </div>
          )}
          <ul className={s.tree}>
            {(data.data?.tree || []).map((n) => (
              <Node key={n.id} node={n} selected={selected} onSelect={select} canEdit={canEdit} onRename={onRename} onAddChild={(p) => setAdding({ parent: p, type: CHILD_TYPE[p.type] })} onDelete={onDelete} onDrop={onDrop} dragId={dragId} setDragId={setDragId} />
            ))}
          </ul>
          {data.data?.unplaced && (data.data.unplaced.students > 0 || data.data.unplaced.groups > 0) && (
            <p className={`${s.small} ${s.muted}`} style={{ marginTop: 12 }}>
              {t("school.tree.unplaced", { defaultValue: "Not placed yet: {{s}} students, {{g}} groups.", s: data.data.unplaced.students, g: data.data.unplaced.groups })}
            </p>
          )}
        </section>
        <UnitPanel unitId={selected} all={all} canEdit={canEdit} canMove={can("people.move")} onChanged={data.reload} />
      </div>
      {adding && (
        <Dialog title={adding.parent ? t("school.tree.addInTitle", { defaultValue: "Add a {{type}} in {{name}}", type: adding.type, name: adding.parent.name }) : t("school.tree.addTitle", { defaultValue: "Add a {{type}}", type: adding.type })} onClose={() => setAdding(null)}>
          <Field id="unit-type" label={t("school.tree.type", { defaultValue: "Type" })}>
            <select id="unit-type" className={s.select} value={adding.type} onChange={(e) => setAdding({ ...adding, type: e.target.value })} disabled={Boolean(adding.parent)}>
              {TYPES.map((ty) => <option key={ty} value={ty}>{t(`school.type.${ty}`, { defaultValue: ty })}</option>)}
            </select>
          </Field>
          <div style={{ height: 12 }} />
          <Field id="unit-name" label={t("school.tree.name", { defaultValue: "Name" })}>
            <input id="unit-name" className={s.input} value={newName} maxLength={80} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) create(); }} />
          </Field>
          <div className={s.actions}>
            <Button disabled={!newName.trim()} onClick={create}>{t("school.add", { defaultValue: "Add" })}</Button>
            <Button variant="ghost" onClick={() => setAdding(null)}>{t("school.cancel", { defaultValue: "Cancel" })}</Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
