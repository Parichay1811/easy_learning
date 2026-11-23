// TCH-050 "Today": today's classes, who needs attention, recent wins, and the getting-started
// checklist for a new Solo tutor (TCH-001).
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaRegCircle, FaUsers, FaUserPlus, FaClipboardList, FaChartLine, FaTrophy } from "react-icons/fa";
import { StoryCard, KpiTile, ChartCard, EmptyState, Skeleton, Button, SubTabs, SubPanel, usePane, fmtDuration, fmtPercent, fmtDate, today } from "../../components/dashboard";
import { useLoad, useTeacherApi } from "./teacherApi";
import { Avatar } from "./teacherUi";
import { TeacherRequests } from "../../components/links";
import { groupStyle, RISK_TEXT, useMedia, enoughToCompare } from "./teacherShared";
import s from "./teacher.module.css";

function greeting(t) {
  const h = new Date().getHours();
  if (h < 12) return t("teacher.today.morning", { defaultValue: "Good morning" });
  if (h < 18) return t("teacher.today.afternoon", { defaultValue: "Good afternoon" });
  return t("teacher.today.evening", { defaultValue: "Good evening" });
}

function Checklist({ data, workspace, go, onDismiss }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const c = data.checklist;
  const firstGroup = data.classes[0]?.groupId;
  const steps = [
    { key: "group", done: c.group, icon: FaUsers, title: t("teacher.check.group", { defaultValue: "Create a group" }), text: t("teacher.check.groupText", { defaultValue: "Name it, pick a colour and the subjects you teach." }), action: () => go("groups", { create: "1" }), label: t("teacher.check.groupBtn", { defaultValue: "Create group" }) },
    { key: "students", done: c.students, icon: FaUserPlus, title: t("teacher.check.students", { defaultValue: "Add students" }), text: t("teacher.check.studentsText", { defaultValue: "Share a join code, or paste your class list." }), action: () => go("groups", firstGroup ? {} : { create: "1" }), label: t("teacher.check.studentsBtn", { defaultValue: "Add students" }) },
    { key: "practice", done: c.practice, icon: FaClipboardList, title: t("teacher.check.practice", { defaultValue: "Assign first practice" }), text: t("teacher.check.practiceText", { defaultValue: "Set a short practice or a quiz for a group: pick questions from the bank, choose the rules, and assign it." }), action: () => navigate("/teacher/tests"), label: t("teacher.check.practiceBtn", { defaultValue: "Set practice" }) },
    { key: "results", done: c.results, icon: FaChartLine, title: t("teacher.check.results", { defaultValue: "See first results" }), text: t("teacher.check.resultsText", { defaultValue: "As soon as students learn, you see who needs help and on what." }), action: () => go("groups"), label: t("teacher.check.resultsBtn", { defaultValue: "Open my groups" }) },
  ];
  const done = steps.filter((x) => x.done).length;
  if (done === steps.length || workspace?.profile?.checklistDismissed) return null;
  return (
    <section className={s.card} aria-labelledby="getting-started">
      <div className={s.pageHead}>
        <div>
          <h2 id="getting-started" className={s.h2}>{t("teacher.check.title", { defaultValue: "Getting started" })}</h2>
          <p className={s.muted}>{t("teacher.check.progress", { defaultValue: "{{done}} of {{total}} done. Most tutors finish in under 15 minutes.", done, total: steps.length })}</p>
        </div>
        {workspace?.permissions?.canEditWorkspace && <Button variant="ghost" size="sm" onClick={onDismiss}>{t("teacher.check.hide", { defaultValue: "Hide" })}</Button>}
      </div>
      <div className={s.progressBar} aria-hidden="true"><span style={{ width: `${(done / steps.length) * 100}%` }} /></div>
      <ol className={s.checklist} style={{ marginTop: 14 }}>
        {steps.filter((st) => !st.done).map((st) => (
          <li key={st.key} className={`${s.checkItem} ${st.done ? s.checkDone : ""}`}>
            <span className={s.checkIcon} aria-hidden="true">{st.done ? <FaCheckCircle color="var(--d-good)" /> : <FaRegCircle />}</span>
            <div>
              <strong>{st.title}<span className="d-sr-only">{st.done ? ` (${t("teacher.check.done", { defaultValue: "done" })})` : ""}</span></strong>
              <p>{st.text}</p>
              {!st.done && st.action && <Button size="sm" variant="soft" icon={st.icon} onClick={st.action}>{st.label}</Button>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function TodayView({ teacher, workspace, go, onWorkspaceChange }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { get, send } = useTeacherApi();
  const q = useLoad(() => get("/today"), []);
  const d = q.data;
  // Wide screens: the three answers side by side (a HUD). Narrow: one at a time, as sub-tabs.
  const narrow = useMedia("(max-width: 1099px)");
  const [pane, setPane] = usePane(["classes", "nudge", "wins"]);

  const dismiss = async () => { await send("PATCH", "/workspace", { checklistDismissed: true }); onWorkspaceChange?.(); };

  const name = teacher?.name?.split(" ")[0] || "";
  const head = (
    <div className={s.headRow}>
      <div>
        <h1>{greeting(t)}{name ? `, ${name}` : ""}</h1>
        <p>{fmtDate(today(), { style: "long" })}</p>
      </div>
      <div className={s.headActions}>
        <Button variant="soft" icon={FaUsers} onClick={() => go("groups")}>{t("teacher.today.openGroups", { defaultValue: "Open my groups" })}</Button>
        <Button icon={FaClipboardList} onClick={() => navigate("/teacher/tests")}>{t("teacher.today.setTest", { defaultValue: "Set a test" })}</Button>
      </div>
    </div>
  );
  if (q.loading && !q.data) return <>{head}<Skeleton variant="tile" /><div className={s.tiles}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="tile" />)}</div><Skeleton variant="chart" /></>;
  if (q.error) return <>{head}<EmptyState tone="error" title={t("teacher.loadError", { defaultValue: "We couldn't load this page" })} text={q.error} actionLabel={t("teacher.retry", { defaultValue: "Try again" })} onAction={q.reload} /></>;

  const w = d.week;
  const showNudge = () => {
    if (narrow) setPane("nudge");
    requestAnimationFrame(() => document.getElementById("needs-attention")?.focus());
  };
  const chips = [];
  if (d.attentionCount) chips.push({ kind: "nudge", text: t("teacher.today.chipAttention", { defaultValue: "{{count}} need a nudge", defaultValue_one: "{{count}} needs a nudge", count: d.attentionCount }), onClick: showNudge });
  if (d.wins.length) chips.push({ kind: "celebrate", text: t("teacher.today.chipWins", { defaultValue: "{{count}} recent wins", count: d.wins.length }), onClick: narrow ? () => setPane("wins") : undefined });
  if (d.classes.length) chips.push({ kind: "info", text: t("teacher.today.chipClasses", { defaultValue: "{{count}} classes today", count: d.classes.length }), onClick: narrow ? () => setPane("classes") : undefined });

  const classes = (
    <ChartCard title={t("teacher.today.classes", { defaultValue: "What's on today?" })}
      answer={d.classes.length ? t("teacher.today.classesAnswer", { defaultValue: "{{count}} classes on your timetable.", count: d.classes.length }) : t("teacher.today.noClasses", { defaultValue: "No classes on your timetable today." })}
      empty={!d.classes.length && { title: t("teacher.today.noClassesTitle", { defaultValue: "A free day" }), text: t("teacher.today.noClassesText", { defaultValue: "Add a weekly time to a group and it shows up here." }), actionLabel: t("teacher.today.openGroups", { defaultValue: "Open my groups" }), onAction: () => go("groups") }}>
      <ul className={`${s.classList} ${s.hudList}`}>
        {d.classes.map((c, i) => (
          <li key={i} className={s.classItem} style={groupStyle(c)}>
            <span className={s.classTime}>{c.startTime}<span>{c.endTime}</span></span>
            <span>
              <span className={s.className}>{c.emoji} {c.groupName}</span>
              <span className={s.muted} style={{ display: "block", fontSize: "0.9rem" }}>{[c.subject, t("teacher.nStudents", { defaultValue: (c.studentCount) === 1 ? "1 student" : "{{count}} students", count: c.studentCount })].filter(Boolean).join(" · ")}</span>
            </span>
            <span className={s.row}>
              {c.state === "now" && <span className={`${s.badge} ${s.badgeGood}`}>{t("teacher.today.now", { defaultValue: "Now" })}</span>}
              {c.state === "done" && <span className={s.badge}>{t("teacher.today.done", { defaultValue: "Done" })}</span>}
              <Button size="sm" variant="ghost" onClick={() => go("group", { id: c.groupId })}>{t("teacher.open", { defaultValue: "Open" })}</Button>
            </span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );

  const attention = (
    <ChartCard title={t("teacher.today.attention", { defaultValue: "Who needs a nudge?" })}
      answer={d.attentionCount ? t("teacher.today.attentionAnswer", { defaultValue: "{{count}} students could use a check-in.", defaultValue_one: "{{count}} student could use a check-in.", count: d.attentionCount }) : t("teacher.today.attentionNone", { defaultValue: "Everyone is on track." })}
      info={t("insights.teacher.attentionInfo", { defaultValue: "No learning in the last 7 days, fewer right on the first try than the week before (only with enough answers to be sure), or a skill that stays tricky after several tries. The same rules as each group's check-ins." })}
      empty={!d.attentionCount && { title: t("teacher.today.allGood", { defaultValue: "All on track" }), text: d.counts.students ? t("teacher.today.allGoodText", { defaultValue: "Nobody needs a nudge right now." }) : t("teacher.today.noStudentsText", { defaultValue: "Add students to a group to see who needs help." }), actionLabel: d.counts.students ? undefined : t("teacher.add.btn", { defaultValue: "Add students" }), onAction: d.counts.students ? undefined : () => go("groups") }}>
      <ul className={`${s.personList} ${s.hudList}`} id="needs-attention" tabIndex={-1}>
        {d.attention.map((a) => (
          <li key={a.studentId} className={s.personRow}>
            <button type="button" className={s.personBtn} onClick={() => go("student", { id: a.studentId })}>
              <Avatar name={a.name} />
              <span className={s.personMain}>
                <strong>{a.name}</strong>
                <span>{t(`teacher.risk.${a.reason}`, { defaultValue: RISK_TEXT[a.reason] || "Needs a nudge", skill: a.skill })}{a.lastActive ? ` · ${t("teacher.lastActive", { defaultValue: "last active {{date}}", date: fmtDate(a.lastActive, { style: "short" }) })}` : ""}</span>
              </span>
            </button>
            <span className={`${s.badge} ${s.badgeAttention}`}>{a.groups[0]?.emoji} {a.groups[0]?.name}</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );

  const wins = (
    <ChartCard title={t("teacher.today.wins", { defaultValue: "What went well?" })}
      answer={d.wins.length ? t("teacher.today.winsAnswer", { defaultValue: "Celebrate these with your students." }) : t("teacher.today.noWins", { defaultValue: "Wins show up here as students learn." })}
      empty={!d.wins.length && { title: t("teacher.today.noWinsTitle", { defaultValue: "No wins yet this week" }), text: t("teacher.today.noWins", { defaultValue: "Wins show up here as students learn." }) }}>
      <ul className={`${s.personList} ${s.hudList}`}>
        {d.wins.map((wn) => (
          <li key={`${wn.studentId}-${wn.kind}`} className={s.personRow}>
            <button type="button" className={s.personBtn} onClick={() => go("student", { id: wn.studentId })}>
              <span className={s.avatar} aria-hidden="true"><FaTrophy /></span>
              <span className={s.personMain}>
                <strong>{wn.name}</strong>
                <span>
                  {wn.kind === "accuracy_up" && t("teacher.win.accuracy", { defaultValue: "Accuracy up {{value}} points this week", value: wn.value })}
                  {wn.kind === "consistent" && t("teacher.win.consistent", { defaultValue: "Learned on {{value}} of the last 7 days", value: wn.value })}
                  {wn.kind === "high_accuracy" && t("teacher.win.high", { defaultValue: "{{value}} % right this week", value: wn.value })}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </ChartCard>
  );

  return (
    <>
      {head}
      {/* "Connect by email" invitations and requests: only takes space when there are some. */}
      <TeacherRequests />
      <Checklist data={d} workspace={workspace} go={go} onDismiss={dismiss} />
      {d.counts.students > 0 && <StoryCard className={s.storyCompact} title={t("teacher.today.storyTitle", { defaultValue: "This week" })} sentence={w.story} chips={chips} />}

      {d.counts.students > 0 && (
        <div className={s.kpiRow}>
          <KpiTile label={t("teacher.kpi.active", { defaultValue: "Active students" })} value={`${w.totals.learners} / ${d.counts.students}`} helpText={t("teacher.kpi.activeHelp", { defaultValue: "Students with any learning in the last 7 days." })} />
          <KpiTile label={t("teacher.kpi.time", { defaultValue: "Learning time" })} value={fmtDuration(w.totals.minutes)} sparkline={w.series} delta={w.previous ? { current: w.totals.minutes, previous: w.previous.minutes, mode: "duration", vs: t("teacher.vsPrevWeek", { defaultValue: "the week before" }) } : undefined} />
          <KpiTile label={t("teacher.kpi.accuracy", { defaultValue: "Accuracy" })} value={w.totals.accuracy == null ? null : fmtPercent(w.totals.accuracy / 100)} delta={w.previous && w.previous.accuracy != null && w.totals.accuracy != null && enoughToCompare(w) ? { current: w.totals.accuracy / 100, previous: w.previous.accuracy / 100, mode: "points", vs: t("teacher.vsPrevWeek", { defaultValue: "the week before" }) } : undefined} />
          <KpiTile label={t("teacher.kpi.answered", { defaultValue: "Questions answered" })} value={w.totals.answered} delta={w.previous ? { current: w.totals.answered, previous: w.previous.answered, mode: "percent" } : undefined} />
        </div>
      )}

      {narrow ? (
        <>
          <SubTabs label={t("teacher.today.tabs", { defaultValue: "Today at a glance" })} value={pane} onChange={setPane} idBase="today"
            tabs={[
              { id: "classes", label: t("teacher.today.tabClasses", { defaultValue: "Classes" }) },
              { id: "nudge", label: t("teacher.today.tabNudge", { defaultValue: "Needs a nudge" }), badge: d.attentionCount || undefined },
              { id: "wins", label: t("teacher.today.tabWins", { defaultValue: "Wins" }) },
            ]} />
          <SubPanel id="classes" value={pane} idBase="today">{classes}</SubPanel>
          <SubPanel id="nudge" value={pane} idBase="today">{attention}</SubPanel>
          <SubPanel id="wins" value={pane} idBase="today">{wins}</SubPanel>
        </>
      ) : (
        <div className={s.hud}>{classes}{attention}{wins}</div>
      )}
    </>
  );
}
