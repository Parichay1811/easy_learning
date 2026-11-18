// TCH-010: my groups. Create, edit (colour, emoji, grade band, subjects), archive and restore,
// with usage against the plan's limits (FND-031).
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaPlus, FaPen, FaArchive, FaUndo, FaUsers, FaClock } from "react-icons/fa";
import { Button, EmptyState, Skeleton, PlanLockCard } from "../../components/dashboard";
import { dayLabel } from "../../utils/schedule";
import { useLoad, useTeacherApi } from "./teacherApi";
import { Modal, Meter } from "./teacherUi";
import { GROUP_COLORS, GROUP_EMOJIS, groupStyle, limitText } from "./teacherShared";
import s from "./teacher.module.css";

export function GroupEditor({ group, subjects, onClose, onSaved, go }) {
  const { t } = useTranslation();
  const { send } = useTeacherApi();
  const [f, setF] = useState(() => ({
    name: group?.name || "",
    emoji: group?.emoji || GROUP_EMOJIS[0],
    color: group?.color || GROUP_COLORS[0],
    gradeBand: group?.gradeBand || "",
    description: group?.description || "",
    maxStudents: group?.maxStudents ?? "",
    subjectIds: (group?.subjects || []).map((a) => String(a.subject?._id || a.subject)),
  }));
  const [err, setErr] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const toggleSubject = (id) => set("subjectIds", f.subjectIds.includes(id) ? f.subjectIds.filter((x) => x !== id) : [...f.subjectIds, id]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const body = { ...f, maxStudents: f.maxStudents === "" ? null : Number(f.maxStudents) };
    const r = group ? await send("PATCH", `/groups/${group._id}`, body) : await send("POST", "/groups", body);
    setSaving(false);
    if (!r.ok) return setErr(r);
    onSaved(r.group);
  };

  return (
    <Modal title={group ? t("teacher.group.edit", { defaultValue: "Edit group" }) : t("teacher.group.new", { defaultValue: "New group" })} onClose={onClose}>
      <form className={s.form} onSubmit={save}>
        <label className={s.field}>
          <span>{t("teacher.group.name", { defaultValue: "Group name" })}</span>
          <input className={s.input} value={f.name} onChange={(e) => set("name", e.target.value)} maxLength={80} required placeholder={t("teacher.group.namePh", { defaultValue: "For example: Year 5 Maths, Tuesday evening" })} />
        </label>
        <fieldset className={s.field} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className={s.fieldLabel}>{t("teacher.group.look", { defaultValue: "Emoji and colour" })}</legend>
          <div className={s.swatches} role="radiogroup" aria-label={t("teacher.group.emoji", { defaultValue: "Emoji" })}>
            {GROUP_EMOJIS.map((e) => (
              <button key={e} type="button" role="radio" aria-checked={f.emoji === e} className={`${s.emojiBtn} ${f.emoji === e ? s.emojiOn : ""}`} onClick={() => set("emoji", e)}>{e}</button>
            ))}
          </div>
          <div className={s.swatches} role="radiogroup" aria-label={t("teacher.group.colour", { defaultValue: "Colour" })} style={{ marginTop: 8 }}>
            {GROUP_COLORS.map((c, i) => (
              <button key={c} type="button" role="radio" aria-checked={f.color === c} aria-label={t("teacher.group.colourN", { defaultValue: "Colour {{n}}", n: i + 1 })} className={`${s.swatch} ${f.color === c ? s.swatchOn : ""}`} style={{ background: c }} onClick={() => set("color", c)} />
            ))}
          </div>
        </fieldset>
        <div className={s.grid2} style={{ gap: 14 }}>
          <label className={s.field}>
            <span>{t("teacher.group.grade", { defaultValue: "Grade or level" })}</span>
            <input className={s.input} value={f.gradeBand} onChange={(e) => set("gradeBand", e.target.value)} maxLength={40} placeholder={t("teacher.group.gradePh", { defaultValue: "Year 4-5, Grade 3…" })} />
          </label>
          <label className={s.field}>
            <span>{t("teacher.group.size", { defaultValue: "Class size (optional)" })}</span>
            <input className={s.input} type="number" min={1} max={500} value={f.maxStudents} onChange={(e) => set("maxStudents", e.target.value)} />
          </label>
        </div>
        {subjects?.length > 0 && (
          <fieldset className={s.field} style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className={s.fieldLabel}>{t("teacher.group.subjects", { defaultValue: "Subjects you teach this group" })}</legend>
            <div className={s.chips}>
              {subjects.map((sub) => (
                <button key={sub._id} type="button" aria-pressed={f.subjectIds.includes(String(sub._id))} className={`${s.chipToggle} ${f.subjectIds.includes(String(sub._id)) ? s.chipToggleOn : ""}`} onClick={() => toggleSubject(String(sub._id))}>{sub.name}</button>
              ))}
            </div>
            <small>{t("teacher.group.subjectsHelp", { defaultValue: "You can set weekly times for each subject on the group's Schedule tab." })}</small>
          </fieldset>
        )}
        <label className={s.field}>
          <span>{t("teacher.group.description", { defaultValue: "Note for yourself (optional)" })}</span>
          <input className={s.input} value={f.description} onChange={(e) => set("description", e.target.value)} maxLength={300} />
        </label>
        {err && (
          <div className={s.error} role="alert">
            {limitText(t, err)}
            {err.code === "PLAN_LIMIT" && go && <> <Button size="sm" variant="ghost" onClick={() => go("plan")}>{t("teacher.seePlans", { defaultValue: "See plans" })}</Button></>}
          </div>
        )}
        <div className={s.row} style={{ justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onClose}>{t("teacher.cancel", { defaultValue: "Cancel" })}</Button>
          <Button type="submit" disabled={saving || !f.name.trim()}>{saving ? t("teacher.saving", { defaultValue: "Saving…" }) : group ? t("teacher.save", { defaultValue: "Save" }) : t("teacher.group.create", { defaultValue: "Create group" })}</Button>
        </div>
      </form>
    </Modal>
  );
}

function scheduleSummary(g, t) {
  const slots = (g.subjects || []).flatMap((a) => a.schedule || []);
  if (!slots.length) return t("teacher.group.noSchedule", { defaultValue: "No weekly time yet" });
  return slots.slice(0, 3).map((x) => `${dayLabel(x.dayOfWeek).slice(0, 3)} ${x.startTime}`).join(", ") + (slots.length > 3 ? "…" : "");
}

export default function GroupsView({ go, params }) {
  const { t } = useTranslation();
  const { get, send } = useTeacherApi();
  const [archived, setArchived] = useState(false);
  const [editing, setEditing] = useState(params.get("create") === "1" ? "new" : null);
  const [msg, setMsg] = useState("");
  const q = useLoad(() => get(`/groups${archived ? "?archived=1" : ""}`), [archived]);
  const d = q.data;

  const archive = async (g) => {
    if (!window.confirm(t("teacher.group.archiveConfirm", { defaultValue: "Archive {{name}}? Students and results are kept; you can restore it any time.", name: g.name }))) return;
    const r = await send("POST", `/groups/${g._id}/archive`);
    setMsg(r.ok ? t("teacher.group.archived", { defaultValue: "{{name}} archived.", name: g.name }) : limitText(t, r));
    q.reload();
  };
  const restore = async (g) => {
    const r = await send("POST", `/groups/${g._id}/restore`);
    setMsg(r.ok ? t("teacher.group.restored", { defaultValue: "{{name}} is back.", name: g.name }) : limitText(t, r));
    q.reload();
  };

  const atLimit = d && d.limits.groups != null && d.usage.groups >= d.limits.groups;
  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>{archived ? t("teacher.groups.archivedTitle", { defaultValue: "Archived groups" }) : t("teacher.groups.title", { defaultValue: "My groups" })}</h1>
          <p>{t("teacher.groups.sub", { defaultValue: "Your classes, with their students, schedule and progress." })}</p>
        </div>
        <div className={s.headActions}>
          <Button variant="ghost" icon={archived ? FaUsers : FaArchive} onClick={() => setArchived((v) => !v)}>
            {archived ? t("teacher.groups.showActive", { defaultValue: "Active groups" }) : t("teacher.groups.showArchived", { defaultValue: "Archived ({{count}})", count: d?.archivedCount || 0 })}
          </Button>
          {d?.canCreateGroups && !archived && !atLimit && <Button icon={FaPlus} onClick={() => setEditing("new")}>{t("teacher.group.new", { defaultValue: "New group" })}</Button>}
        </div>
      </div>

      {msg && <p className={s.note} role="status">{msg}</p>}

      {d && (d.limits.groups != null || d.limits.students != null) && (
        <div className={`${s.card} ${s.usage}`}>
          <Meter label={t("teacher.usage.groups", { defaultValue: "Groups" })} used={d.usage.groups} max={d.limits.groups} />
          <Meter label={t("teacher.usage.students", { defaultValue: "Students" })} used={d.usage.students} max={d.limits.students} />
          <Button variant="soft" size="sm" onClick={() => go("plan")}>{t("teacher.usage.plan", { defaultValue: "Plan and limits" })}</Button>
        </div>
      )}

      {atLimit && !archived && d.canCreateGroups && (
        <PlanLockCard module="groups" title={t("teacher.groups.limitTitle", { defaultValue: "Want another group?" })}
          text={t("teacher.groups.limitText", { defaultValue: "Your plan includes {{max}} group. Solo Pro has unlimited groups, branding and deeper analytics.", max: d.limits.groups })}
          ctaLabel={t("teacher.seePlans", { defaultValue: "See plans" })} onUpgrade={() => go("plan")} />
      )}

      {q.loading && !d && <div className={s.groupGrid}>{[0, 1, 2].map((i) => <Skeleton key={i} variant="tile" height={180} />)}</div>}
      {q.error && <EmptyState tone="error" title={t("teacher.loadError", { defaultValue: "We couldn't load this page" })} text={q.error} actionLabel={t("teacher.retry", { defaultValue: "Try again" })} onAction={q.reload} />}
      {d && !d.groups.length && (
        archived
          ? <EmptyState title={t("teacher.groups.noArchived", { defaultValue: "Nothing archived" })} text={t("teacher.groups.noArchivedText", { defaultValue: "Groups you archive wait here, with all their results." })} />
          : d.canCreateGroups
            ? <EmptyState icon={FaUsers} title={t("teacher.groups.empty", { defaultValue: "Create your first group" })} text={t("teacher.groups.emptyText", { defaultValue: "A group is a class: give it a name and a colour, then add students with a code or a list." })} actionLabel={t("teacher.group.new", { defaultValue: "New group" })} onAction={() => setEditing("new")} />
            : <EmptyState icon={FaUsers} title={t("teacher.groups.noneAssigned", { defaultValue: "No groups yet" })} text={t("teacher.groups.noneAssignedText", { defaultValue: "Your school admin adds you to your classes. They will appear here." })} />
      )}

      {d && d.groups.length > 0 && (
        <div className={s.groupGrid}>
          {d.groups.map((g) => (
            <article key={g._id} className={s.groupCard} style={groupStyle(g)}>
              <div className={s.groupTitle}>
                <span className={s.groupEmoji} aria-hidden="true">{g.emoji || "👥"}</span>
                <div>
                  <h3>{g.name}</h3>
                  {g.gradeBand && <span className={s.muted}>{g.gradeBand}</span>}
                </div>
              </div>
              <div className={s.groupMeta}>
                <span className={s.badge}><FaUsers aria-hidden="true" /> {t("teacher.nStudents", { defaultValue: "{{count}} students", count: g.studentCount })}{g.maxStudents ? ` / ${g.maxStudents}` : ""}</span>
                {g.groupKind === "practice" && <span className={`${s.badge} ${s.badgeAccent}`}>{t("teacher.group.practice", { defaultValue: "Practice group" })}</span>}
                {!g.canManage && <span className={s.badge}>{t("teacher.group.school", { defaultValue: "From your school" })}</span>}
              </div>
              {g.subjects.length > 0 && <div className={s.groupMeta}>{g.subjects.map((a) => <span key={a._id} className={`${s.badge} ${s.badgeAccent}`}>{a.subject?.name}</span>)}</div>}
              <span className={`${s.muted} ${s.small}`}><FaClock aria-hidden="true" /> {scheduleSummary(g, t)}</span>
              <div className={s.groupActions}>
                {archived ? (
                  g.canManage && <Button size="sm" icon={FaUndo} onClick={() => restore(g)}>{t("teacher.group.restore", { defaultValue: "Restore" })}</Button>
                ) : (
                  <>
                    <Button size="sm" onClick={() => go("group", { id: g._id })}>{t("teacher.open", { defaultValue: "Open" })}<span className="d-sr-only"> {g.name}</span></Button>
                    {g.canManage && <Button size="sm" variant="ghost" icon={FaPen} onClick={() => setEditing(g)}>{t("teacher.edit", { defaultValue: "Edit" })}<span className="d-sr-only"> {g.name}</span></Button>}
                    {g.canManage && <Button size="sm" variant="ghost" icon={FaArchive} onClick={() => archive(g)}>{t("teacher.group.archive", { defaultValue: "Archive" })}<span className="d-sr-only"> {g.name}</span></Button>}
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && d && (
        <GroupEditor group={editing === "new" ? null : editing} subjects={d.subjects} go={go} onClose={() => setEditing(null)}
          onSaved={(g) => { setEditing(null); if (editing === "new") go("group", { id: g._id, tab: "students" }); else q.reload(); }} />
      )}
    </>
  );
}
