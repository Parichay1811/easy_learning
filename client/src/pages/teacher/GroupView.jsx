// TCH-051 group dashboard (story, tiles, student x skill heatmap, distribution, compare with my
// other groups), TCH-053 subject and module view, TCH-055 suggested practice groups, plus the
// roster (TCH-011 move/copy), parents (TCH-012) and weekly schedule (TCH-010).
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaUserPlus, FaPen, FaExchangeAlt, FaUserMinus, FaMagic, FaArrowLeft } from "react-icons/fa";
import {
  TimeRangeBar, useTimeRange, StoryCard, KpiTile, ChartCard, EmptyState, Skeleton, Button,
  StudentSkillHeatmap, DistributionStrip, SubjectModuleMatrix, TrendLine, toTable,
  SUBJECTS, MODULES, subjectLabel, moduleLabel, fmtDuration, fmtPercent,
} from "../../components/dashboard";
import ScheduleEditor from "../../components/Admin/ScheduleEditor";
import { useLoad, useTeacherApi, pctToFraction } from "./teacherApi";
import { Modal, Avatar } from "./teacherUi";
import { groupStyle, limitText, rangeQuery, matrixCells } from "./teacherShared";
import { GroupEditor } from "./GroupsView";
import AddStudentsPanel from "./AddStudentsPanel";
import ParentsPanel from "./ParentsPanel";
import s from "./teacher.module.css";

function Overview({ group, go }) {
  const { t } = useTranslation();
  const { get, send } = useTeacherApi();
  const tr = useTimeRange({ defaultRange: "week", defaultCmp: "prev" });
  const rq = rangeQuery(tr);
  const ov = useLoad(() => get(`/batches/${group._id}/analytics/overview?${rq}`), [group._id, rq]);
  const lr = useLoad(() => get(`/batches/${group._id}/analytics/learners?${rq}`), [group._id, rq]);
  const hm = useLoad(() => get(`/groups/${group._id}/heatmap?${rq}`), [group._id, rq]);
  const cmp = useLoad(() => get(`/groups/compare?${rq}`), [rq]);
  const sug = useLoad(() => get(`/groups/${group._id}/suggestions?${rq}`), [group._id, rq]);
  const [made, setMade] = useState("");

  const o = ov.data;
  const n = group.studentCount;
  const skills = SUBJECTS.flatMap((sub) => MODULES.map((m) => ({ id: `${m.key}_${sub.key}`, label: `${moduleLabel(t, m.key)} · ${subjectLabel(t, sub.key)}`, short: `${moduleLabel(t, m.key).slice(0, 1)}${subjectLabel(t, sub.key).slice(0, 1)}` })));
  const heatStudents = (hm.data?.rows || []).map((r) => ({
    id: r.studentId, name: r.name, atRisk: r.atRisk,
    scores: Object.fromEntries(Object.entries(r.cells).map(([k, c]) => [k, c.answered ? pctToFraction(c.accuracy) : null])),
  }));
  const usedSkills = skills.filter((sk) => (hm.data?.columns || []).find((c) => c.key === sk.id)?.touched > 0);
  const dist = (lr.data?.learners || []).filter((l) => l.accuracy != null).map((l) => ({ id: l.email, name: l.name, value: l.accuracy / 100 }));
  const studentIdByEmail = Object.fromEntries((hm.data?.rows || []).map((r) => [r.email, r.studentId]));
  const trend = (o?.series?.points || []).map((p) => ({ x: p.key, value: p.minutes }));

  const makeGroup = async (sg) => {
    const r = await send("POST", "/groups/suggested", { fromGroupId: group._id, studentIds: sg.students.map((x) => x.id), module: sg.module, subject: sg.subject });
    setMade(r.ok ? t("teacher.sug.made", { defaultValue: "Made the practice group “{{name}}”.", name: r.group.name }) : limitText(t, r));
  };

  if (!n) {
    return <EmptyState title={t("teacher.group.noStudents", { defaultValue: "No students yet" })} text={t("teacher.group.noStudentsText", { defaultValue: "Add students to see how the group is doing." })} actionLabel={t("teacher.add.btn", { defaultValue: "Add students" })} onAction={() => go("group", { id: group._id, tab: "students", add: "1" })} />;
  }
  return (
    <>
      <TimeRangeBar value={tr} ranges={["week", "month", "year", "custom"]} showCompare />
      {ov.loading ? <Skeleton variant="tile" /> : o && (
        <StoryCard sentence={o.story} chips={[
          lr.data?.atRisk ? { kind: "nudge", text: t("teacher.group.chipRisk", { defaultValue: "{{count}} need a nudge", count: lr.data.atRisk }) } : null,
          ...(o.insights || []).slice(0, 3).map((i) => ({ kind: ["alert", "celebrate", "nudge"].includes(i.kind) ? i.kind : "info", text: t(`dash.insight.${i.key}`, { defaultValue: i.text, ...i.params }) })),
        ].filter(Boolean).slice(0, 4)} />
      )}
      {o && (
        <div className={s.tiles}>
          <KpiTile label={t("teacher.kpi.active", { defaultValue: "Active students" })} value={`${o.totals.learners} / ${n}`} delta={o.previous ? { current: o.totals.learners, previous: o.previous.learners, mode: "number" } : undefined} />
          <KpiTile label={t("teacher.kpi.minutesPer", { defaultValue: "Minutes per student" })} value={fmtDuration(Math.round(o.totals.minutes / n))} sparkline={trend.map((p) => p.value)} delta={o.previous ? { current: o.totals.minutes / n, previous: o.previous.minutes / n, mode: "duration" } : undefined} />
          <KpiTile label={t("teacher.kpi.accuracy", { defaultValue: "Accuracy" })} value={o.totals.accuracy == null ? null : fmtPercent(o.totals.accuracy / 100)} delta={o.previous?.accuracy != null && o.totals.accuracy != null ? { current: o.totals.accuracy / 100, previous: o.previous.accuracy / 100, mode: "points" } : undefined} helpText={t("teacher.kpi.accuracyHelp", { defaultValue: "Correct answers divided by all answers." })} />
          <KpiTile label={t("teacher.kpi.consistency", { defaultValue: "Days with learning" })} value={o.totals.consistency == null ? null : fmtPercent(o.totals.consistency / 100)} helpText={t("teacher.kpi.consistencyHelp", { defaultValue: "Share of days in the period when someone in the group learned." })} />
        </div>
      )}

      <ChartCard title={t("teacher.group.heatTitle", { defaultValue: "Who needs help on what?" })}
        answer={hm.data ? t("teacher.group.heatAnswer", { defaultValue: "Students needing a nudge are pinned on top. Click a name to open their profile." }) : ""}
        info={t("teacher.group.heatInfo", { defaultValue: "Each cell is the student's accuracy in that module and subject for the period. Empty cells: not practised yet." })}
        loading={hm.loading} error={hm.error} onRetry={hm.reload}
        table={hm.data && toTable.studentSkills(heatStudents, usedSkills.length ? usedSkills : skills, t)}
        empty={hm.data && !usedSkills.length && { title: t("teacher.group.heatEmpty", { defaultValue: "No practice in this period" }), text: t("teacher.group.heatEmptyText", { defaultValue: "Pick a longer period, or check back once students have learned." }) }}>
        <StudentSkillHeatmap students={heatStudents} skills={usedSkills.length ? usedSkills : skills} onStudentClick={(st) => go("student", { id: st.id })} onCellClick={(st) => go("student", { id: st.id })} />
      </ChartCard>

      <div className={s.grid2}>
        <ChartCard title={t("teacher.group.distTitle", { defaultValue: "How is the class spread?" })}
          answer={dist.length ? t("teacher.group.distAnswer", { defaultValue: "Each dot is a student's accuracy." }) : ""}
          loading={lr.loading} error={lr.error} onRetry={lr.reload} table={toTable.distribution(dist, t)}
          empty={lr.data && !dist.length && { title: t("teacher.group.distEmpty", { defaultValue: "No answers yet in this period" }) }}>
          <DistributionStrip data={dist} onSelect={(item) => studentIdByEmail[item.id] && go("student", { id: studentIdByEmail[item.id] })} />
        </ChartCard>
        <ChartCard title={t("teacher.group.trendTitle", { defaultValue: "Is the group learning more?" })} answer={o ? t("teacher.group.trendAnswer", { defaultValue: "Minutes learned by the whole group." }) : ""}
          loading={ov.loading} error={ov.error} onRetry={ov.reload} table={toTable.trend(trend, t, { unit: "min" })}>
          <TrendLine data={trend} unit="min" height={200} />
        </ChartCard>
      </div>

      {cmp.data?.groups?.length > 1 && (
        <ChartCard title={t("teacher.group.cmpTitle", { defaultValue: "How does it compare with my other groups?" })} answer={t("teacher.group.cmpAnswer", { defaultValue: "Accuracy in each of your groups for the same period." })}
          table={{ columns: [{ key: "name", label: t("teacher.group.group", { defaultValue: "Group" }) }, { key: "accuracy", label: t("teacher.kpi.accuracy", { defaultValue: "Accuracy" }) }, { key: "minutes", label: t("teacher.kpi.minutesPer", { defaultValue: "Minutes per student" }) }], rows: cmp.data.groups.map((g) => ({ id: g.id, name: g.name, accuracy: g.accuracy == null ? "—" : `${g.accuracy} %`, minutes: g.minutesPerStudent ?? "—" })) }}>
          <div className={s.compare}>
            {cmp.data.groups.map((g) => (
              <div key={g.id} className={s.compareRow}>
                <span className={g.id === group._id ? s.compareMe : ""}>{g.emoji} {g.name}</span>
                <span className={s.compareBar} aria-hidden="true"><span style={{ width: `${g.accuracy || 0}%`, background: g.color || "var(--d-accent)" }} /></span>
                <span>{g.accuracy == null ? "—" : `${g.accuracy} %`}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {sug.data?.suggestions?.length > 0 && (
        <ChartCard title={t("teacher.sug.title", { defaultValue: "Who could practise together?" })} answer={t("teacher.sug.answer", { defaultValue: "Students below 60 % on the same skill. One tap makes a short-term practice group." })}>
          {made && <p className={s.note} role="status">{made}</p>}
          <ul className={s.personList}>
            {sug.data.suggestions.map((sg) => (
              <li key={sg.title} className={s.personRow}>
                <span className={s.avatar} aria-hidden="true"><FaMagic /></span>
                <span className={s.personMain}>
                  <strong>{t("teacher.sug.item", { defaultValue: "{{count}} students on {{skill}}", count: sg.students.length, skill: `${moduleLabel(t, sg.module)} · ${subjectLabel(t, sg.subject)}` })}</strong>
                  <span>{sg.students.map((x) => `${x.name} (${x.accuracy} %)`).join(", ")}</span>
                </span>
                <Button size="sm" variant="soft" onClick={() => makeGroup(sg)}>{t("teacher.sug.make", { defaultValue: "Make group" })}</Button>
              </li>
            ))}
          </ul>
        </ChartCard>
      )}
    </>
  );
}

function SubjectsTab({ group }) {
  const { t } = useTranslation();
  const { get } = useTeacherApi();
  const tr = useTimeRange({ defaultRange: "month", defaultCmp: "none" });
  const rq = rangeQuery(tr);
  const hm = useLoad(() => get(`/groups/${group._id}/heatmap?${rq}`), [group._id, rq]);
  const cells = matrixCells(hm.data?.matrix);
  const cols = hm.data?.columns || [];
  const untouched = cols.filter((c) => c.touched === 0);
  return (
    <>
      <TimeRangeBar value={tr} ranges={["week", "month", "year", "custom"]} />
      <div className={s.grid2}>
        <ChartCard title={t("teacher.subj.matrixTitle", { defaultValue: "How is the group doing in each subject and skill?" })} answer={t("teacher.subj.matrixAnswer", { defaultValue: "Colour shows mastery, the number is accuracy." })}
          loading={hm.loading} error={hm.error} onRetry={hm.reload} table={toTable.matrix(cells, t)}>
          <SubjectModuleMatrix cells={cells} />
        </ChartCard>
        <ChartCard title={t("teacher.subj.coverageTitle", { defaultValue: "What has been practised, and what is untouched?" })}
          answer={untouched.length ? t("teacher.subj.untouched", { defaultValue: "{{count}} of 12 areas not practised yet in this period.", count: untouched.length }) : t("teacher.subj.allTouched", { defaultValue: "Every area has been practised." })}
          loading={hm.loading}>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <caption className="d-sr-only">{t("teacher.subj.coverageCaption", { defaultValue: "Students who practised and mastered each area" })}</caption>
              <thead><tr><th>{t("teacher.subj.area", { defaultValue: "Area" })}</th><th>{t("teacher.subj.practised", { defaultValue: "Practised" })}</th><th>{t("teacher.subj.mastered", { defaultValue: "Mastered" })}</th></tr></thead>
              <tbody>
                {cols.map((c) => (
                  <tr key={c.key}>
                    <td>{moduleLabel(t, c.module)} · {subjectLabel(t, c.subject)}</td>
                    <td>{c.touched ? `${c.touched} / ${c.of}` : <span className={`${s.badge} ${s.badgeAttention}`}>{t("teacher.subj.notYet", { defaultValue: "Not yet" })}</span>}</td>
                    <td>{c.mastered} / {c.of}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </>
  );
}

function StudentsTab({ data, go, reload, openAdd }) {
  const { t } = useTranslation();
  const { send } = useTeacherApi();
  const [picked, setPicked] = useState([]);
  const [moving, setMoving] = useState(false);
  const [target, setTarget] = useState("");
  const [mode, setMode] = useState("move");
  const [msg, setMsg] = useState(null);
  const g = data.group;
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const transfer = async () => {
    const r = await send("POST", `/groups/${g._id}/students/transfer`, { toGroupId: target, studentIds: picked, mode });
    setMoving(false);
    setMsg(r.ok ? { ok: true, text: mode === "move" ? t("teacher.roster.moved", { defaultValue: "Moved {{count}} students.", count: r.count }) : t("teacher.roster.copied", { defaultValue: "Copied {{count}} students.", count: r.count }) } : { ok: false, text: limitText(t, r) });
    setPicked([]);
    reload();
  };
  const remove = async () => {
    if (!window.confirm(t("teacher.roster.removeConfirm", { defaultValue: "Remove {{count}} students from {{name}}? Their learning history is kept.", count: picked.length, name: g.name }))) return;
    for (const id of picked) await send("DELETE", `/batches/${g._id}/students/${id}`);
    setMsg({ ok: true, text: t("teacher.roster.removed", { defaultValue: "Removed {{count}} students.", count: picked.length }) });
    setPicked([]);
    reload();
  };

  return (
    <section className={s.card}>
      <div className={s.pageHead} style={{ marginBottom: 12 }}>
        <h2 className={s.h2} style={{ margin: 0 }}>{t("teacher.nStudents", { defaultValue: "{{count}} students", count: data.students.length })}</h2>
        <div className={s.headActions}>
          <Button icon={FaUserPlus} onClick={openAdd}>{t("teacher.add.btn", { defaultValue: "Add students" })}</Button>
        </div>
      </div>
      {msg && <p className={msg.ok ? s.success : s.error} role="status">{msg.text}</p>}
      {picked.length > 0 && (
        <div className={s.row} style={{ margin: "8px 0 12px" }}>
          <strong>{t("teacher.roster.selected", { defaultValue: "{{count}} selected", count: picked.length })}</strong>
          {data.otherGroups.length > 0 && <Button size="sm" variant="soft" icon={FaExchangeAlt} onClick={() => { setTarget(data.otherGroups[0].id); setMoving(true); }}>{t("teacher.roster.moveCopy", { defaultValue: "Move or copy" })}</Button>}
          <Button size="sm" variant="ghost" icon={FaUserMinus} onClick={remove}>{t("teacher.roster.remove", { defaultValue: "Remove from group" })}</Button>
        </div>
      )}
      {!data.students.length ? (
        <EmptyState compact title={t("teacher.group.noStudents", { defaultValue: "No students yet" })} text={t("teacher.roster.emptyText", { defaultValue: "Share the join code or paste your class list." })} actionLabel={t("teacher.add.btn", { defaultValue: "Add students" })} onAction={openAdd} />
      ) : (
        <ul className={s.personList}>
          {data.students.map((st) => (
            <li key={st.id} className={s.personRow}>
              <input type="checkbox" style={{ width: 22, height: 22 }} checked={picked.includes(st.id)} onChange={() => toggle(st.id)} aria-label={t("teacher.roster.select", { defaultValue: "Select {{name}}", name: st.name })} />
              <button type="button" className={s.personBtn} onClick={() => go("student", { id: st.id })}>
                <Avatar name={st.name} />
                <span className={s.personMain}>
                  <strong>{st.name}</strong>
                  <span>{[st.email || t("teacher.noEmailYet", { defaultValue: "no email yet" }), st.grade].filter(Boolean).join(" · ")}</span>
                </span>
              </button>
              {st.status !== "active" && <span className={s.badge}>{t("teacher.inactive", { defaultValue: "Inactive" })}</span>}
            </li>
          ))}
        </ul>
      )}
      {moving && (
        <Modal title={t("teacher.roster.moveCopy", { defaultValue: "Move or copy" })} onClose={() => setMoving(false)}>
          <div className={s.form}>
            <fieldset className={s.field} style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className={s.fieldLabel}>{t("teacher.roster.what", { defaultValue: "What should happen?" })}</legend>
              <label className={s.row}><input type="radio" name="mode" checked={mode === "move"} onChange={() => setMode("move")} /> {t("teacher.roster.moveText", { defaultValue: "Move: leave this group, join the other" })}</label>
              <label className={s.row}><input type="radio" name="mode" checked={mode === "copy"} onChange={() => setMode("copy")} /> {t("teacher.roster.copyText", { defaultValue: "Copy: stay here and also join the other" })}</label>
            </fieldset>
            <label className={s.field}>
              <span>{t("teacher.roster.to", { defaultValue: "To group" })}</span>
              <select className={s.select} value={target} onChange={(e) => setTarget(e.target.value)}>
                {data.otherGroups.map((o) => <option key={o.id} value={o.id}>{o.emoji} {o.name}</option>)}
              </select>
            </label>
            <div className={s.row} style={{ justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setMoving(false)}>{t("teacher.cancel", { defaultValue: "Cancel" })}</Button>
              <Button onClick={transfer}>{mode === "move" ? t("teacher.roster.moveN", { defaultValue: "Move {{count}}", count: picked.length }) : t("teacher.roster.copyN", { defaultValue: "Copy {{count}}", count: picked.length })}</Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

function ScheduleTab({ data, reload, onEdit }) {
  const { t } = useTranslation();
  const { send } = useTeacherApi();
  const post = (path, body) => send("POST", path, body);
  const del = (path) => send("DELETE", path);
  const g = data.group;
  const mine = g.subjects.filter((a) => (a.teacherIds || []).map(String).includes(data.tutorId));
  if (!g.subjects.length) {
    return <EmptyState title={t("teacher.sched.noSubjects", { defaultValue: "Add a subject first" })} text={t("teacher.sched.noSubjectsText", { defaultValue: "Weekly times belong to a subject. Edit the group and choose the subjects you teach." })} actionLabel={data.permissions.canManage ? t("teacher.group.edit", { defaultValue: "Edit group" }) : undefined} onAction={data.permissions.canManage ? onEdit : undefined} />;
  }
  return (
    <div className={s.grid2}>
      {g.subjects.map((a) => (
        <section key={a._id} className={s.card}>
          <h2 className={s.h2}>{a.subject?.name}</h2>
          {mine.includes(a) ? (
            <ScheduleEditor schedule={a.schedule || []} teacherIds={a.teacherIds.map(String)} post={post} del={del}
              addPath={`/batches/${g._id}/subjects/${a._id}/schedule`} deletePath={(slotId) => `/batches/${g._id}/subjects/${a._id}/schedule/${slotId}`} onChanged={reload} />
          ) : (
            <p className={s.muted}>{(a.schedule || []).length ? a.schedule.map((x) => `${x.startTime}–${x.endTime}`).join(", ") : t("teacher.sched.notYours", { defaultValue: "Another teacher sets this subject's times." })}</p>
          )}
        </section>
      ))}
    </div>
  );
}

export default function GroupView({ id, tab = "overview", go, params }) {
  const { t } = useTranslation();
  const { get } = useTeacherApi();
  const q = useLoad(() => get(`/groups/${id}`), [id]);
  const [adding, setAdding] = useState(params.get("add") === "1");
  const [editing, setEditing] = useState(false);
  const d = q.data;

  if (q.loading && !q.data) return <><Skeleton variant="text" lines={2} /><Skeleton variant="chart" /></>;
  if (q.error) return <EmptyState tone="error" title={q.status === 404 ? t("teacher.group.notFound", { defaultValue: "Group not found" }) : t("teacher.loadError", { defaultValue: "We couldn't load this page" })} text={q.error} actionLabel={t("teacher.groups.back", { defaultValue: "Back to my groups" })} onAction={() => go("groups")} />;

  const g = d.group;
  const TABS = [
    ["overview", t("teacher.tab.overview", { defaultValue: "Overview" })],
    ["subjects", t("teacher.tab.subjects", { defaultValue: "Subjects and skills" })],
    ["students", t("teacher.tab.students", { defaultValue: "Students" })],
    ["parents", t("teacher.tab.parents", { defaultValue: "Parents" })],
    ["schedule", t("teacher.tab.schedule", { defaultValue: "Schedule" })],
  ];
  const groupForPanels = { ...g, studentIdList: d.students.map((x) => x.id) };
  return (
    <>
      <div className={s.pageHead} style={groupStyle(g)}>
        <div>
          <Button variant="ghost" size="sm" icon={FaArrowLeft} onClick={() => go("groups")}>{t("teacher.groups.title", { defaultValue: "My groups" })}</Button>
          <h1 style={{ marginTop: 8 }}><span aria-hidden="true">{g.emoji || "👥"}</span> {g.name}</h1>
          <p>{[g.gradeBand, t("teacher.nStudents", { defaultValue: "{{count}} students", count: d.students.length }), g.subjects.map((a) => a.subject?.name).join(", ")].filter(Boolean).join(" · ")}</p>
        </div>
        <div className={s.headActions}>
          <Button icon={FaUserPlus} onClick={() => setAdding(true)}>{t("teacher.add.btn", { defaultValue: "Add students" })}</Button>
          {d.permissions.canManage && <Button variant="ghost" icon={FaPen} onClick={() => setEditing(true)}>{t("teacher.edit", { defaultValue: "Edit" })}</Button>}
        </div>
      </div>
      <div className={s.tabs} role="tablist" aria-label={t("teacher.group.sections", { defaultValue: "Group sections" })}>
        {TABS.map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={`${s.tab} ${tab === key ? s.tabOn : ""}`} onClick={() => go("group", { id, tab: key })}>{label}</button>
        ))}
      </div>
      {tab === "overview" && <Overview group={{ ...g, studentCount: d.students.length }} go={go} />}
      {tab === "subjects" && <SubjectsTab group={g} />}
      {tab === "students" && <StudentsTab data={d} go={go} reload={q.reload} openAdd={() => setAdding(true)} />}
      {tab === "parents" && <section className={s.card}><ParentsPanel groupId={id} /></section>}
      {tab === "schedule" && <ScheduleTab data={d} reload={q.reload} onEdit={() => setEditing(true)} />}
      {adding && <AddStudentsPanel group={groupForPanels} permissions={d.permissions} onClose={() => { setAdding(false); q.reload(); }} onChanged={q.reload} />}
      {editing && <GroupEditor group={g} subjects={d.subjects} go={go} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); q.reload(); }} />}
    </>
  );
}
