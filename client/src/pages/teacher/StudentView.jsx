// TCH-013 / TCH-054: one student, through the teacher's eyes. Shared analytics endpoints for
// the numbers, plus the teacher's private notes and the parent link status.
import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaThumbtack, FaTrash, FaLock, FaPlus, FaChartPie, FaThLarge, FaCalendarAlt, FaStickyNote, FaSeedling, FaChartLine, FaCamera, FaHeart } from "react-icons/fa";
import InterestsCard from "../../components/together/InterestsCard";
import {
  TimeRangeBar, useTimeRange, StoryCard, KpiTile, ChartCard, EmptyState, Skeleton, Button, SubTabs, SubPanel, PanelHead, Sheet, usePane,
  SubjectModuleMatrix, CalendarHeatmap, Timeline, toTable, fmtDuration, fmtPercent, fmtDate, moduleLabel, subjectLabel,
} from "../../components/dashboard";
import { useLoad, useTeacherApi } from "./teacherApi";
import { ParentStatus } from "./ParentsPanel";
import TeacherPlan from "./TeacherPlan";
import { EvidencePanel } from "../../components/learning/evidence";
import { groupStyle, rangeQuery, matrixCells, enoughToCompare, solidInsights } from "./teacherShared";
import AdultFindings from "../../ar/insights/AdultFindings";
import { useFindings } from "../../ar/insights/useFindings";
import { periodLine } from "../../ar/insights/format.js";
import { useGlancePeriod } from "../../insights-dash/usePeriod";
import s from "./teacher.module.css";

// "At a glance" and the skill map (GET /teacher/students/:id/insights): their own chunks.
const GlancePanel = lazy(() => import("../../insights-dash/GlancePanel"));
const SkillMapPanel = lazy(() => import("../../insights-dash/SkillMapPanel"));

// The findings (going well / worth more practice / what changed / effort, each with an
// in-class next step), the period in numbers and the weekly trend, over rolling 7 / 28 days.
function Glance({ id, name, onSkills }) {
  const { t } = useTranslation();
  const { get } = useTeacherApi();
  const [days, setDays] = useGlancePeriod();
  const q = useLoad(() => get(`/students/${id}/insights?days=${days}`), [id, days]);
  return (
    <Suspense fallback={<Skeleton variant="rect" height={220} />}>
      <GlancePanel data={q.data?.insights} loading={q.loading} error={q.error} onRetry={q.reload} days={days} onDays={setDays} name={name} audience="teacher"
        actions={<Button variant="soft" onClick={onSkills}>{t("insights.glance.openSkills", { defaultValue: "See all skills" })}</Button>} />
    </Suspense>
  );
}

function Skills({ id, name }) {
  const { get } = useTeacherApi();
  const q = useLoad(() => get(`/students/${id}/insights?days=28`), [id]);
  return (
    <Suspense fallback={<Skeleton variant="chart" />}>
      <SkillMapPanel data={q.data?.insights} loading={q.loading} error={q.error} name={name} audience="teacher" headingLevel={2} />
    </Suspense>
  );
}

const KIND = { session: "session", round: "game", test: "test", answer: "session" };

// The same evidence of growth a parent sees (GET /teacher/students/:id/learning → evidence):
// baseline vs now, kind of thinking, on their own vs with help, reviews, tricky spots, decisions.
function Growth({ id, name }) {
  const { get } = useTeacherApi();
  const path = `/students/${encodeURIComponent(id)}/learning`;
  const q = useLoad(() => get(path), [path]);
  return <EvidencePanel key={id} evidence={q.data?.evidence} name={name} audience="teacher" loading={q.loading} error={q.error} onRetry={q.reload} />;
}

// Camera games (AR): the findings for this student, this period vs the one before, with an
// in-class activity for each. Served by the profile route (same "is this student in my
// groups" check); `?arDays=` picks the period, 28 days arrive with the profile itself.
const CAMERA_PERIODS = [14, 28, 90];
function CameraGames({ id, name, initial }) {
  const { t, i18n } = useTranslation();
  const { get } = useTeacherApi();
  const [days, setDays] = useState(28);
  const idle = () => Promise.resolve({ ok: true });
  const q = useLoad(() => (days === 28 ? idle() : get(`/students/${id}/profile?arDays=${days}`)), [id, days]);
  const input = days === 28 ? initial : q.data?.cameraGames;
  const { result, names } = useFindings(input);
  const played = (result?.totals.current.played || 0) + (result?.totals.previous.played || 0);
  return (
    <section className={s.card} aria-labelledby="stu-cam-h">
      <PanelHead
        title={<span id="stu-cam-h"><FaCamera aria-hidden="true" /> {t("teacher.stu.camera.title", { defaultValue: "Camera games" })}</span>}
        text={result ? periodLine(result, t, i18n.language) : ""}
        actions={(
          <label className={s.small} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            {t("teacher.stu.camera.period", { defaultValue: "Period" })}
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ minHeight: 40, borderRadius: 10, padding: "0 8px", font: "inherit" }}>
              {CAMERA_PERIODS.map((d) => <option key={d} value={d}>{t("ar.insights.glance.lastDays", { defaultValue: "Last {{n}} days", n: d })}</option>)}
            </select>
          </label>
        )} />
      <div style={{ marginTop: 12 }}>
        {days !== 28 && q.loading ? <Skeleton variant="text" lines={3} />
          : q.error ? <EmptyState tone="error" title={t("teacher.loadError", { defaultValue: "We couldn't load this page" })} text={q.error} actionLabel={t("teacher.retry", { defaultValue: "Try again" })} onAction={q.reload} />
          : !result || !played ? (
            <EmptyState title={t("teacher.stu.camera.none", { defaultValue: "No camera games yet" })}
              text={t("teacher.stu.camera.noneText", { defaultValue: "When {{name}} plays the camera games, what is going well, what is getting better and what is worth practising in class shows up here.", name })} />
          ) : (
            <>
              <AdultFindings result={result} names={names} where="class" />
              <p className={s.small} style={{ marginBottom: 0 }}>
                {t("teacher.stu.camera.how", { defaultValue: "Only {{name}}'s own play is compared, with the period before. Understanding and movement are kept apart, a change only counts when it is bigger than the normal ups and downs, and these describe play in the games, not a diagnosis.", name })}
              </p>
            </>
          )}
      </div>
    </section>
  );
}

function Notes({ studentId, initial, onChanged }) {
  const { t } = useTranslation();
  const { send } = useTeacherApi();
  const [notes, setNotes] = useState(initial);
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const add = async (e) => {
    e?.preventDefault?.();
    const r = await send("POST", `/students/${studentId}/notes`, { body });
    if (!r.ok) return setErr(r.message);
    setNotes((n) => [r.note, ...n]); setBody(""); setErr(""); setOpen(false); onChanged?.();
  };
  const pin = async (n) => {
    const r = await send("PATCH", `/students/${studentId}/notes/${n._id}`, { pinned: !n.pinned });
    if (r.ok) { setNotes((list) => list.map((x) => (x._id === n._id ? r.note : x)).sort((a, b) => Number(b.pinned) - Number(a.pinned))); onChanged?.(); }
  };
  const remove = async (n) => {
    if (!window.confirm(t("teacher.notes.deleteConfirm", { defaultValue: "Delete this note?" }))) return;
    const r = await send("DELETE", `/students/${studentId}/notes/${n._id}`);
    if (r.ok) { setNotes((list) => list.filter((x) => x._id !== n._id)); onChanged?.(); }
  };
  return (
    <section className={s.card} aria-labelledby="notes-title">
      <PanelHead
        title={<span id="notes-title"><FaLock aria-hidden="true" /> {t("teacher.notes.title", { defaultValue: "My private notes" })}</span>}
        text={t("teacher.notes.private", { defaultValue: "Only you can see these. Not shared with the student, parents or your admin." })}
        actions={<Button icon={FaPlus} onClick={() => setOpen(true)} aria-haspopup="dialog">{t("teacher.notes.addBtn", { defaultValue: "Add a note" })}</Button>} />
      <ul className={`${s.noteList} ${s.scrollArea}`} style={{ marginTop: 14 }}>
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
        {!notes.length && <li className={s.muted}>{t("teacher.notes.noneHelp", { defaultValue: "No notes yet. Jot down what helps, what to watch and what to try next." })}</li>}
      </ul>
      {open && (
        <Sheet title={t("teacher.notes.new", { defaultValue: "New note" })} text={t("teacher.notes.private", { defaultValue: "Only you can see these. Not shared with the student, parents or your admin." })}
          onClose={() => setOpen(false)}
          footer={<>
            <Button variant="ghost" onClick={() => setOpen(false)}>{t("teacher.cancel", { defaultValue: "Cancel" })}</Button>
            <Button type="submit" form="note-form" disabled={!body.trim()}>{t("teacher.notes.add", { defaultValue: "Save note" })}</Button>
          </>}>
          <form id="note-form" className={s.form} onSubmit={add}>
            <label className="d-sr-only" htmlFor="note-body">{t("teacher.notes.new", { defaultValue: "New note" })}</label>
            <textarea id="note-body" className={`${s.textarea} ${s.notesArea}`} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} placeholder={t("teacher.notes.ph", { defaultValue: "What helps, what to watch, what to try next…" })} />
            {err && <p className={s.error}>{err}</p>}
          </form>
        </Sheet>
      )}
    </section>
  );
}

function Analytics({ id, name, part, email, onSkills }) {
  const { t } = useTranslation();
  const { get } = useTeacherApi();
  const tr = useTimeRange({ defaultRange: "month", defaultCmp: "prev" });
  const rq = rangeQuery(tr);
  const year = Number(tr.to.slice(0, 4));
  // The calendar and the timeline load the first time "Activity" is opened.
  const [seenActivity, setSeenActivity] = useState(part === "activity");
  if (part === "activity" && !seenActivity) setSeenActivity(true);
  const idle = () => Promise.resolve({ ok: true });
  const ov = useLoad(() => get(`/students/${id}/analytics/overview?${rq}`), [id, rq]);
  const cal = useLoad(() => (seenActivity ? get(`/students/${id}/analytics/calendar?year=${year}`) : idle()), [id, year, seenActivity]);
  const tl = useLoad(() => (seenActivity ? get(`/students/${id}/analytics/timeline?from=${tr.from}&to=${tr.to}&limit=150`) : idle()), [id, tr.from, tr.to, seenActivity]);
  const o = ov.data;
  const cells = matrixCells(o?.matrix);
  const calData = (cal.data?.days || []).map((d) => ({ date: d.date, value: d.minutes }));
  const events = (tl.data?.events || []).filter((e) => e.kind !== "answer").map((e) => ({
    id: e._id, time: e.ts, kind: KIND[e.kind] || "session",
    title: [e.module && moduleLabel(t, e.module), e.subject && subjectLabel(t, e.subject)].filter(Boolean).join(" · ") || e.kind,
    subtitle: e.kind === "round" ? t("teacher.tl.round", { defaultValue: "Game round · {{stars}} stars", stars: e.stars ?? 0 }) : e.mode || "",
    minutes: e.minutes, subject: e.subject,
  }));
  const range = <TimeRangeBar value={tr} ranges={["week", "month", "year", "custom"]} showCompare compact="auto" />;
  const error = ov.error && <EmptyState tone="error" title={t("teacher.loadError", { defaultValue: "We couldn't load this page" })} text={ov.error} actionLabel={t("teacher.retry", { defaultValue: "Try again" })} onAction={ov.reload} />;

  if (part === "subjects") {
    return (
      <>
        {email && <Skills id={id} name={name} />}
        {range}
        {error}
        <ChartCard title={t("teacher.stu.matrixTitle", { defaultValue: "How is {{name}} doing in each subject and skill?", name })} answer={t("teacher.subj.matrixAnswer", { defaultValue: "Colour shows mastery, the number is accuracy." })} loading={ov.loading} table={toTable.matrix(cells, t)}>
          <SubjectModuleMatrix cells={cells} />
        </ChartCard>
      </>
    );
  }
  if (part === "activity") {
    return (
      <>
        {range}
        <div className={s.grid2wide}>
          <ChartCard title={t("teacher.stu.calTitle", { defaultValue: "How often does {{name}} learn?", name })} answer={t("teacher.stu.calAnswer", { defaultValue: "Minutes per day in {{year}}.", year })} loading={cal.loading} error={cal.error} onRetry={cal.reload} table={toTable.calendar(calData, t)}>
            <CalendarHeatmap data={calData} to={tr.to} />
          </ChartCard>
          <ChartCard title={t("teacher.stu.tlTitle", { defaultValue: "What did {{name}} do?", name })} answer={events.length ? t("teacher.stu.tlAnswer", { defaultValue: "Sessions and game rounds, newest first." }) : ""} loading={tl.loading}
            empty={tl.data && !events.length && { title: t("teacher.stu.tlEmpty", { defaultValue: "Nothing in this period" }), text: t("teacher.stu.tlEmptyText", { defaultValue: "Pick a longer period above." }) }}>
            <div className={s.scrollArea}><Timeline events={events} max={40} /></div>
          </ChartCard>
        </div>
      </>
    );
  }
  return (
    <>
      {email && <Glance id={id} name={name} onSkills={onSkills} />}
      <h2 className={s.h2} style={{ margin: "8px 0 0" }}>{t("insights.teacher.timeTitle", { defaultValue: "Time and activity" })}</h2>
      {range}
      {ov.loading ? <Skeleton variant="tile" /> : o && (
        <StoryCard className={s.storyCompact} sentence={o.story} chips={solidInsights(o).slice(0, 4).map((i) => ({ kind: ["alert", "celebrate", "nudge"].includes(i.kind) ? i.kind : "info", text: t(`dash.insight.${i.key}`, { defaultValue: i.text, ...i.params }) }))} />
      )}
      {error}
      {o && (
        <div className={s.kpiRow}>
          <KpiTile label={t("teacher.kpi.time", { defaultValue: "Learning time" })} value={fmtDuration(o.totals.minutes)} sparkline={(o.series?.points || []).map((p) => p.minutes)} delta={o.previous ? { current: o.totals.minutes, previous: o.previous.minutes, mode: "duration" } : undefined} />
          <KpiTile label={t("teacher.kpi.accuracy", { defaultValue: "Accuracy" })} value={o.totals.accuracy == null ? null : fmtPercent(o.totals.accuracy / 100)} delta={o.previous?.accuracy != null && o.totals.accuracy != null && enoughToCompare(o) ? { current: o.totals.accuracy / 100, previous: o.previous.accuracy / 100, mode: "points" } : undefined} />
          <KpiTile label={t("teacher.kpi.days", { defaultValue: "Active days" })} value={o.totals.activeDays} delta={o.previous ? { current: o.totals.activeDays, previous: o.previous.activeDays, mode: "number" } : undefined} />
          <KpiTile label={t("teacher.kpi.streak", { defaultValue: "Streak" })} value={o.streak ? t("teacher.kpi.streakDays", { defaultValue: "{{count}} days", defaultValue_one: "{{count}} day", count: o.streak.current }) : null} helpText={o.streak ? t("teacher.kpi.longest", { defaultValue: "Longest: {{count}} days", count: o.streak.longest }) : undefined} />
        </div>
      )}
    </>
  );
}

// What this learner loves to watch in Shorts (G-530): topics for examples and stories they will care about.
function Likes({ id, name }) {
  const { get } = useTeacherApi();
  const q = useLoad(() => get(`/students/${id}/interests`), [id]);
  return <InterestsCard interests={q.data?.interests} name={name} loading={q.loading && !q.data} error={q.error} onRetry={q.reload} />;
}

export default function StudentView({ id, go }) {
  const { t } = useTranslation();
  const { get } = useTeacherApi();
  const q = useLoad(() => get(`/students/${id}/profile`), [id]);
  const [pane, setPane] = usePane(["overview", "growth", "subjects", "activity", "likes", "camera", "plan", "notes"]);
  if (q.loading && !q.data) return <><Skeleton variant="text" lines={2} /><Skeleton variant="chart" /></>;
  if (q.error) return <EmptyState tone="error" title={t("teacher.stu.notFound", { defaultValue: "Student not found" })} text={q.error} actionLabel={t("teacher.groups.back", { defaultValue: "Back to my groups" })} onAction={() => go("groups")} />;
  const d = q.data;
  const st = d.student;
  const first = d.groups[0];
  const firstName = st.name.split(" ")[0];
  const tabs = d.hasAnalytics ? [
    { id: "overview", label: t("teacher.stu.tabOverview", { defaultValue: "Overview" }), icon: FaChartPie },
    ...(st.email ? [{ id: "growth", label: t("evidence.tab", "Growth"), icon: FaChartLine }] : []),
    { id: "subjects", label: t("teacher.stu.tabSubjects", { defaultValue: "Subjects" }), icon: FaThLarge },
    { id: "activity", label: t("teacher.stu.tabActivity", { defaultValue: "Activity" }), icon: FaCalendarAlt },
    ...(st.email ? [{ id: "likes", label: t("teacher.stu.tabLikes", { defaultValue: "What they love" }), short: t("teacher.stu.tabLikesShort", { defaultValue: "Loves" }), icon: FaHeart }] : []),
    ...(st.email ? [{ id: "camera", label: t("teacher.stu.tabCamera", { defaultValue: "Camera games" }), short: t("teacher.stu.tabCameraShort", { defaultValue: "Camera" }), icon: FaCamera }] : []),
    ...(st.email ? [{ id: "plan", label: t("teacher.stu.tabPlan", { defaultValue: "Learning plan" }), short: t("teacher.stu.tabPlanShort", { defaultValue: "Plan" }), icon: FaSeedling }] : []),
    { id: "notes", label: t("teacher.stu.tabNotes", { defaultValue: "My notes" }), icon: FaStickyNote, badge: d.notes.length || undefined },
  ] : [
    { id: "overview", label: t("teacher.stu.tabOverview", { defaultValue: "Overview" }), icon: FaChartPie },
    { id: "notes", label: t("teacher.stu.tabNotes", { defaultValue: "My notes" }), icon: FaStickyNote },
  ];
  const current = tabs.some((x) => x.id === pane) ? pane : "overview";
  return (
    <>
      <div className={s.titleRow}>
        <div className={s.titleMain}>
          <Button variant="ghost" size="sm" icon={FaArrowLeft} onClick={() => (first ? go("group", { id: first.id, tab: "students" }) : go("groups"))}>{first ? first.name : t("teacher.groups.title", { defaultValue: "My groups" })}</Button>
          <h1 style={{ marginTop: 6 }}>{st.name}</h1>
          <p>{[st.grade, st.age ? t("teacher.stu.age", { defaultValue: "age {{age}}", age: st.age }) : null, st.email || t("teacher.noEmailYet", { defaultValue: "no email yet" })].filter(Boolean).join(" · ")}</p>
          <div className={s.row} style={{ marginTop: 6, gap: 8 }}>
            <span className={s.small}>{t("teacher.stu.parent", { defaultValue: "Parent:" })}</span> <ParentStatus status={d.parents.status} />
            {d.parents.parents.map((p) => <span key={p.id} className={s.small}>{p.email}</span>)}
          </div>
        </div>
        <div className={s.headActions}>
          {d.groups.map((g) => <Button key={g.id} size="sm" variant="soft" style={groupStyle(g)} onClick={() => go("group", { id: g.id })}>{g.emoji} {g.name}</Button>)}
        </div>
      </div>
      <SubTabs label={t("teacher.stu.tabs", { defaultValue: "About {{name}}", name: firstName })} tabs={tabs} value={current} onChange={setPane} idBase="stu" />
      <SubPanel key={current} id={current} value={current} idBase="stu">
        {current === "notes" ? <Notes studentId={id} initial={d.notes} onChanged={q.reload} />
          : current === "plan" ? <TeacherPlan student={id} name={firstName} />
          : current === "growth" ? <Growth id={id} name={firstName} />
          : current === "likes" ? <Likes id={id} name={firstName} />
          : current === "camera" ? <CameraGames id={id} name={firstName} initial={d.cameraGames} />
          : d.hasAnalytics ? <Analytics id={id} name={firstName} part={current} email={st.email} onSkills={() => setPane("subjects")} />
            : <EmptyState title={t("teacher.stu.noEmail", { defaultValue: "No learning data yet" })} text={t("teacher.stu.noEmailText", { defaultValue: "{{name}} has no sign-in yet, so there is no learning to show. Login cards for learners without email are coming.", name: st.name })} actionLabel={t("teacher.stu.writeNote", { defaultValue: "Write a private note" })} onAction={() => setPane("notes")} />}
      </SubPanel>
    </>
  );
}
