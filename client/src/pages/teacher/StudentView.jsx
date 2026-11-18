// TCH-013 / TCH-054: one student, through the teacher's eyes. Shared analytics endpoints for
// the numbers, plus the teacher's private notes and the parent link status.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaThumbtack, FaTrash, FaLock } from "react-icons/fa";
import {
  TimeRangeBar, useTimeRange, StoryCard, KpiTile, ChartCard, EmptyState, Skeleton, Button,
  SubjectModuleMatrix, CalendarHeatmap, Timeline, toTable, fmtDuration, fmtPercent, fmtDate, moduleLabel, subjectLabel,
} from "../../components/dashboard";
import { useLoad, useTeacherApi } from "./teacherApi";
import { ParentStatus } from "./ParentsPanel";
import { groupStyle, rangeQuery, matrixCells } from "./teacherShared";
import s from "./teacher.module.css";

const KIND = { session: "session", round: "game", test: "test", answer: "session" };

function Notes({ studentId, initial }) {
  const { t } = useTranslation();
  const { send } = useTeacherApi();
  const [notes, setNotes] = useState(initial);
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");
  const add = async (e) => {
    e.preventDefault();
    const r = await send("POST", `/students/${studentId}/notes`, { body });
    if (!r.ok) return setErr(r.message);
    setNotes((n) => [r.note, ...n]); setBody(""); setErr("");
  };
  const pin = async (n) => {
    const r = await send("PATCH", `/students/${studentId}/notes/${n._id}`, { pinned: !n.pinned });
    if (r.ok) setNotes((list) => list.map((x) => (x._id === n._id ? r.note : x)).sort((a, b) => Number(b.pinned) - Number(a.pinned)));
  };
  const remove = async (n) => {
    if (!window.confirm(t("teacher.notes.deleteConfirm", { defaultValue: "Delete this note?" }))) return;
    const r = await send("DELETE", `/students/${studentId}/notes/${n._id}`);
    if (r.ok) setNotes((list) => list.filter((x) => x._id !== n._id));
  };
  return (
    <section className={s.card} aria-labelledby="notes-title">
      <h2 id="notes-title" className={s.h2}><FaLock aria-hidden="true" /> {t("teacher.notes.title", { defaultValue: "My private notes" })}</h2>
      <p className={`${s.muted} ${s.small}`} style={{ marginTop: -6 }}>{t("teacher.notes.private", { defaultValue: "Only you can see these. Not shared with the student, parents or your admin." })}</p>
      <form className={s.form} onSubmit={add}>
        <label className="d-sr-only" htmlFor="note-body">{t("teacher.notes.new", { defaultValue: "New note" })}</label>
        <textarea id="note-body" className={`${s.textarea} ${s.notesArea}`} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} placeholder={t("teacher.notes.ph", { defaultValue: "What helps, what to watch, what to try next…" })} />
        {err && <p className={s.error}>{err}</p>}
        <div><Button type="submit" size="sm" disabled={!body.trim()}>{t("teacher.notes.add", { defaultValue: "Save note" })}</Button></div>
      </form>
      <ul className={s.noteList} style={{ marginTop: 14 }}>
        {notes.map((n) => (
          <li key={n._id} className={`${s.noteItem} ${n.pinned ? s.notePinned : ""}`}>
            <p>{n.body}</p>
            <div className={s.noteFoot}>
              <span>{fmtDate(String(n.createdAt).slice(0, 10), { style: "short" })}{n.pinned ? ` · ${t("teacher.notes.pinned", { defaultValue: "Pinned" })}` : ""}</span>
              <span className={s.row}>
                <Button size="sm" variant="ghost" icon={FaThumbtack} onClick={() => pin(n)}>{n.pinned ? t("teacher.notes.unpin", { defaultValue: "Unpin" }) : t("teacher.notes.pin", { defaultValue: "Pin" })}</Button>
                <Button size="sm" variant="ghost" icon={FaTrash} onClick={() => remove(n)}>{t("teacher.notes.delete", { defaultValue: "Delete" })}</Button>
              </span>
            </div>
          </li>
        ))}
        {!notes.length && <li className={s.muted}>{t("teacher.notes.none", { defaultValue: "No notes yet." })}</li>}
      </ul>
    </section>
  );
}

function Analytics({ id, name }) {
  const { t } = useTranslation();
  const { get } = useTeacherApi();
  const tr = useTimeRange({ defaultRange: "month", defaultCmp: "prev" });
  const rq = rangeQuery(tr);
  const year = Number(tr.to.slice(0, 4));
  const ov = useLoad(() => get(`/students/${id}/analytics/overview?${rq}`), [id, rq]);
  const cal = useLoad(() => get(`/students/${id}/analytics/calendar?year=${year}`), [id, year]);
  const tl = useLoad(() => get(`/students/${id}/analytics/timeline?from=${tr.from}&to=${tr.to}&limit=150`), [id, tr.from, tr.to]);
  const o = ov.data;
  const cells = matrixCells(o?.matrix);
  const calData = (cal.data?.days || []).map((d) => ({ date: d.date, value: d.minutes }));
  const events = (tl.data?.events || []).filter((e) => e.kind !== "answer").map((e) => ({
    id: e._id, time: e.ts, kind: KIND[e.kind] || "session",
    title: [e.module && moduleLabel(t, e.module), e.subject && subjectLabel(t, e.subject)].filter(Boolean).join(" · ") || e.kind,
    subtitle: e.kind === "round" ? t("teacher.tl.round", { defaultValue: "Game round · {{stars}} stars", stars: e.stars ?? 0 }) : e.mode || "",
    minutes: e.minutes, subject: e.subject,
  }));
  return (
    <>
      <TimeRangeBar value={tr} ranges={["week", "month", "year", "custom"]} showCompare />
      {ov.loading ? <Skeleton variant="tile" /> : o && (
        <StoryCard sentence={o.story} chips={(o.insights || []).slice(0, 4).map((i) => ({ kind: ["alert", "celebrate", "nudge"].includes(i.kind) ? i.kind : "info", text: t(`dash.insight.${i.key}`, { defaultValue: i.text, ...i.params }) }))} />
      )}
      {ov.error && <EmptyState tone="error" title={t("teacher.loadError", { defaultValue: "We couldn't load this page" })} text={ov.error} actionLabel={t("teacher.retry", { defaultValue: "Try again" })} onAction={ov.reload} />}
      {o && (
        <div className={s.tiles}>
          <KpiTile label={t("teacher.kpi.time", { defaultValue: "Learning time" })} value={fmtDuration(o.totals.minutes)} sparkline={(o.series?.points || []).map((p) => p.minutes)} delta={o.previous ? { current: o.totals.minutes, previous: o.previous.minutes, mode: "duration" } : undefined} />
          <KpiTile label={t("teacher.kpi.accuracy", { defaultValue: "Accuracy" })} value={o.totals.accuracy == null ? null : fmtPercent(o.totals.accuracy / 100)} delta={o.previous?.accuracy != null && o.totals.accuracy != null ? { current: o.totals.accuracy / 100, previous: o.previous.accuracy / 100, mode: "points" } : undefined} />
          <KpiTile label={t("teacher.kpi.days", { defaultValue: "Active days" })} value={o.totals.activeDays} delta={o.previous ? { current: o.totals.activeDays, previous: o.previous.activeDays, mode: "number" } : undefined} />
          <KpiTile label={t("teacher.kpi.streak", { defaultValue: "Streak" })} value={o.streak ? t("teacher.kpi.streakDays", { defaultValue: "{{count}} days", count: o.streak.current }) : null} helpText={o.streak ? t("teacher.kpi.longest", { defaultValue: "Longest: {{count}} days", count: o.streak.longest }) : undefined} />
        </div>
      )}
      <div className={s.grid2}>
        <ChartCard title={t("teacher.stu.matrixTitle", { defaultValue: "How is {{name}} doing in each subject and skill?", name })} answer={t("teacher.subj.matrixAnswer", { defaultValue: "Colour shows mastery, the number is accuracy." })} loading={ov.loading} table={toTable.matrix(cells, t)}>
          <SubjectModuleMatrix cells={cells} />
        </ChartCard>
        <ChartCard title={t("teacher.stu.calTitle", { defaultValue: "How often does {{name}} learn?", name })} answer={t("teacher.stu.calAnswer", { defaultValue: "Minutes per day in {{year}}.", year })} loading={cal.loading} error={cal.error} onRetry={cal.reload} table={toTable.calendar(calData, t)}>
          <CalendarHeatmap data={calData} to={tr.to} />
        </ChartCard>
      </div>
      <ChartCard title={t("teacher.stu.tlTitle", { defaultValue: "What did {{name}} do?", name })} answer={events.length ? t("teacher.stu.tlAnswer", { defaultValue: "Sessions and game rounds, newest first." }) : ""} loading={tl.loading}
        empty={tl.data && !events.length && { title: t("teacher.stu.tlEmpty", { defaultValue: "Nothing in this period" }) }}>
        <Timeline events={events} />
      </ChartCard>
    </>
  );
}

export default function StudentView({ id, go }) {
  const { t } = useTranslation();
  const { get } = useTeacherApi();
  const q = useLoad(() => get(`/students/${id}/profile`), [id]);
  if (q.loading && !q.data) return <><Skeleton variant="text" lines={2} /><Skeleton variant="chart" /></>;
  if (q.error) return <EmptyState tone="error" title={t("teacher.stu.notFound", { defaultValue: "Student not found" })} text={q.error} actionLabel={t("teacher.groups.back", { defaultValue: "Back to my groups" })} onAction={() => go("groups")} />;
  const d = q.data;
  const st = d.student;
  const first = d.groups[0];
  return (
    <>
      <div className={s.pageHead}>
        <div>
          <Button variant="ghost" size="sm" icon={FaArrowLeft} onClick={() => (first ? go("group", { id: first.id, tab: "students" }) : go("groups"))}>{first ? first.name : t("teacher.groups.title", { defaultValue: "My groups" })}</Button>
          <h1 style={{ marginTop: 8 }}>{st.name}</h1>
          <p>{[st.grade, st.age ? t("teacher.stu.age", { defaultValue: "age {{age}}", age: st.age }) : null, st.email || t("teacher.noEmailYet", { defaultValue: "no email yet" })].filter(Boolean).join(" · ")}</p>
        </div>
        <div className={s.headActions}>
          {d.groups.map((g) => <Button key={g.id} size="sm" variant="soft" style={groupStyle(g)} onClick={() => go("group", { id: g.id })}>{g.emoji} {g.name}</Button>)}
        </div>
      </div>
      <div className={s.row}>
        <span>{t("teacher.stu.parent", { defaultValue: "Parent:" })}</span> <ParentStatus status={d.parents.status} />
        {d.parents.parents.map((p) => <span key={p.id} className={s.small}>{p.email}</span>)}
      </div>
      {d.hasAnalytics ? <Analytics id={id} name={st.name.split(" ")[0]} /> : (
        <EmptyState title={t("teacher.stu.noEmail", { defaultValue: "No learning data yet" })} text={t("teacher.stu.noEmailText", { defaultValue: "{{name}} has no sign-in yet, so there is no learning to show. Login cards for learners without email are coming.", name: st.name })} />
      )}
      <Notes studentId={id} initial={d.notes} />
    </>
  );
}
