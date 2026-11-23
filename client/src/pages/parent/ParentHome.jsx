import { lazy, Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  TimeRangeBar, useTimeRange, ChartCard, Skeleton, StackedBars, TrendLine, CalendarHeatmap,
  SubjectModuleMatrix, HourWeekdayHeatmap, ProgressRing, Timeline, Button, toTable, fmtDuration, fmtDate,
  SubTabs, SubPanel, usePane,
} from "../../components/dashboard";
import { useLoad, rangeQuery, matrixCells } from "./parentApi";
import { eventsToTimeline } from "./timelineMap";
import { useGlancePeriod } from "../../insights-dash/usePeriod";
import s from "./parent.module.css";

// "At a glance" (findings, numbers, weekly trend) is its own chunk: loaded with the Summary.
const GlancePanel = lazy(() => import("../../insights-dash/GlancePanel"));

const hourLabel = (h) => new Intl.DateTimeFormat(undefined, { hour: "numeric" }).format(new Date(2026, 0, 1, h));
const DAY_LETTERS = (lang) => Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(lang, { weekday: "narrow" }).format(new Date(2026, 0, 5 + i)));

// Home (PAR-010..013, PAR-020..022), in four sub-tabs that each fit a screen:
// Summary (at a glance: findings with evidence and a next step, the period in numbers and the
// weekly trend, over ROLLING 7 / 28 days so a Monday is never set against a whole week; then the
// goal) · Learning time · Subjects · Habits (these three follow the time-range bar).
const HOME_PANES = ["summary", "time", "subjects", "habits"];
export default function ParentHome({ api, child, go }) {
  const { t, i18n } = useTranslation();
  const T = (k, d, o) => t(`parent.home.${k}`, { defaultValue: d, ...o });
  const tr = useTimeRange({ defaultRange: "week", defaultCmp: "prev" });
  const [pane, setPane] = usePane(HOME_PANES);
  const base = `/children/${child._id}`;
  const ov = useLoad(api.get, `${base}/analytics/overview?${rangeQuery(tr)}`);
  const prevOv = useLoad(api.get, tr.prevFrom && tr.range !== "day" && tr.range !== "year" ? `${base}/analytics/overview?from=${tr.prevFrom}&to=${tr.prevTo}&cmp=none` : null);
  const goal = useLoad(api.get, `${base}/goal`);
  const year = Number(tr.to.slice(0, 4));
  const cal = useLoad(api.get, `${base}/analytics/calendar?year=${year}`);
  const day = useLoad(api.get, tr.range === "day" ? `${base}/analytics/timeline?from=${tr.from}&to=${tr.to}&limit=300` : null);
  const ms = useLoad(api.get, `${base}/analytics/milestones`);
  const [glanceDays, setGlanceDays] = useGlancePeriod();
  const glance = useLoad(api.get, pane === "summary" ? `${base}/insights?days=${glanceDays}` : null);
  const [celebrated, setCelebrated] = useState(false);
  const [now] = useState(() => Date.now());

  const d = ov.data;
  const first = child.name.split(" ")[0];
  const vs = tr.cmp === "yoy" ? T("vsLastYear", "the same time last year") : T("vsPrev", "the previous period");
  const points = d?.series?.points || [];
  const prevPoints = prevOv.data?.series?.points || [];
  const cells = useMemo(() => matrixCells(d?.matrix), [d]);
  const mastered = cells.filter((c) => c.level === "mastered").length;

  // "What to do next" (PAR-013): concrete, kind, with links the child can open.
  const next = useMemo(() => {
    // (Skill-level next steps, with their evidence, are in "At a glance" above.)
    const out = [];
    const g = goal.data?.goal ? goal.data.progress : null;
    if (g && !g.reached) {
      const left = g.daysPerWeek - g.daysMet;
      out.push({ icon: "📅", title: T("next.goal", "{{n}} more learning days to reach this week's goal", { n: left, count: left }), text: T("next.goalWhy", "{{min}} minutes a day counts as a goal day.", { min: g.minutesPerDay }), to: "/home" });
    }
    if (!d || d.totals.answered === 0) out.push({ icon: "🌱", title: T("next.start", "A short session today"), text: T("next.startWhy", "Even five minutes keeps the habit going."), to: "/home" });
    out.push({ icon: "🧑‍🏫", title: T("next.ai", "Ask the AI Teacher a question together"), text: T("next.aiWhy", "Try “Why is the sky blue?” and watch the lesson."), to: "/ai-teacher" });
    return out.slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, goal.data, i18n.language]);

  // One soft celebration per visit for a milestone in the last 7 days (DSN-022).
  const recent = (ms.data?.milestones || []).filter((m) => (now - new Date(`${m.date}T12:00:00`)) / 86400000 <= 7).pop();

  const stacked = points.map((p) => ({ x: p.key, english: p.bySubject?.english || 0, maths: p.bySubject?.maths || 0, science: p.bySubject?.science || 0 }));
  const trend = points.map((p, i) => ({ x: p.key, value: p.minutes, prev: prevPoints[i]?.minutes }));
  const heat = [];
  (d?.patterns?.heat || []).forEach((row, w) => row.forEach((v, h) => { if (v) heat.push({ weekday: w, hour: h, value: v }); }));
  const avgSession = d?.totals?.sessions ? Math.round(d.totals.minutes / d.totals.sessions) : null;
  const rangeWord = { day: T("r.day", "today"), week: T("r.week", "this week"), month: T("r.month", "this month"), year: T("r.year", "this year") }[tr.range] || T("r.custom", "in this period");
  const goalProg = goal.data?.goal ? goal.data.progress : null;
  const letters = DAY_LETTERS(i18n.language);

  let main;
  if (tr.range === "day") {
    const evs = eventsToTimeline(day.data?.events, t);
    main = (
      <ChartCard title={T("dayTitle", "What did {{name}} do today?", { name: first })} answer={evs.length ? T("dayAnswer", "{{n}} activities", { n: evs.length }) : undefined}
        loading={day.loading} error={day.error} onRetry={day.reload}
        empty={!day.loading && !evs.length && { title: T("dayEmpty", "Nothing yet today"), text: T("dayEmptyText", "Learning shows up here a moment after it happens.") }}>
        <Timeline events={evs} />
      </ChartCard>
    );
  } else if (tr.range === "year") {
    main = (
      <ChartCard title={T("yearTitle", "How much and how often this year?")} answer={d ? T("yearAnswer", "{{days}} learning days, {{time}} in total", { days: d.totals.activeDays, time: fmtDuration(d.totals.minutes) }) : undefined}
        loading={cal.loading} error={cal.error} onRetry={cal.reload} table={toTable.calendar((cal.data?.days || []).map((x) => ({ date: x.date, value: x.minutes })), t)}>
        <CalendarHeatmap data={(cal.data?.days || []).map((x) => ({ date: x.date, value: x.minutes }))} mode="year" to={tr.to} goal={goalProg?.minutesPerDay} />
      </ChartCard>
    );
  } else if (tr.cmp !== "none" && prevPoints.length) {
    main = (
      <ChartCard title={T("trendTitle", "Is {{name}} learning more than before?", { name: first })}
        answer={d?.deltas?.minutes != null ? (d.deltas.minutes >= 0 ? T("more", "{{t}} more than {{vs}}.", { t: fmtDuration(d.deltas.minutes), vs }) : T("less", "{{t}} less than {{vs}}.", { t: fmtDuration(-d.deltas.minutes), vs })) : undefined}
        info={T("trendInfo", "Solid line: minutes in this period. Dashed: the period you compare with.")}
        loading={ov.loading} error={ov.error} onRetry={ov.reload} table={toTable.trend(trend, t)}>
        <TrendLine data={trend} unit="min" seriesLabel={T("thisPeriod", "This period")} prevLabel={T("before", "Before")} />
      </ChartCard>
    );
  } else {
    main = (
      <ChartCard title={T("barsTitle", "When and what did {{name}} learn?", { name: first })} answer={d ? T("barsAnswer", "{{time}} {{when}}", { time: fmtDuration(d.totals.minutes), when: rangeWord }) : undefined}
        loading={ov.loading} error={ov.error} onRetry={ov.reload} table={toTable.stacked(stacked, t)}>
        <StackedBars data={stacked} unit="min" goal={goalProg?.minutesPerDay} />
      </ChartCard>
    );
  }

  return (
    <>
      {recent && !celebrated && (
        <div className={s.card} role="status" style={{ background: "var(--d-good-soft)" }}>
          <div className={s.spread}>
            <span style={{ fontSize: "1.1rem" }}><span aria-hidden="true" style={{ fontSize: "1.6rem", marginRight: 8 }}>{recent.icon}</span>
              {T("celebrate", "{{name}} reached a milestone: {{what}}!", { name: first, what: t(`parent.milestone.${recent.key}`, { defaultValue: recent.text }) })}</span>
            <Button variant="ghost" size="sm" onClick={() => setCelebrated(true)}>{T("nice", "Lovely!")}</Button>
          </div>
        </div>
      )}

      <SubTabs label={T("tabs", "{{name}}'s learning", { name: first })} value={pane} onChange={setPane}
        tabs={[
          { id: "summary", label: T("tab.summary", "Summary") },
          { id: "time", label: T("tab.time", "Learning time"), short: T("tab.timeShort", "Time") },
          { id: "subjects", label: T("tab.subjects", "Subjects") },
          { id: "habits", label: T("tab.habits", "Habits") },
        ]}
        actions={pane === "summary" ? null : <TimeRangeBar value={tr} ranges={["day", "week", "month", "year", "custom"]} showCompare compact />} />

      <SubPanel id="summary" value={pane}>
        <Suspense fallback={<Skeleton variant="rect" height={220} />}>
          <GlancePanel data={glance.data?.insights} loading={glance.loading} error={glance.error} onRetry={glance.reload}
            days={glanceDays} onDays={setGlanceDays} name={first} audience="parent"
            actions={(
              <>
                <Button variant="soft" onClick={() => go("learning", { pane: "skills" })}>{t("insights.glance.openSkills", { defaultValue: "See all skills" })}</Button>
                <Button variant="ghost" onClick={() => go("reports")}>{t("insights.glance.openReport", { defaultValue: "Open the report" })}</Button>
              </>
            )} />
        </Suspense>

        <div className={s.grid2}>
          <section className={s.card} aria-labelledby="p-goal-h">
            <div className={s.cardHead}>
              <h2 id="p-goal-h">{T("goal.title", "This week's goal")}</h2>
              <Button variant="ghost" size="sm" onClick={() => go("family", { edit: "goal" })}>{goalProg ? T("goal.edit", "Change") : T("goal.set", "Set a goal")}</Button>
            </div>
            {goalProg ? (
              <>
                <div className={s.goal}>
                  <ProgressRing value={goalProg.daysMet} goal={goalProg.daysPerWeek} unit="" label={T("goal.ring", "Goal days this week")}
                    centerText={`${goalProg.daysMet}/${goalProg.daysPerWeek}`} color={goalProg.reached ? "var(--d-good)" : "var(--d-accent)"} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{goalProg.reached ? T("goal.reached", "Goal reached. Wonderful!") : T("goal.progress", "{{met}} of {{n}} days done", { met: goalProg.daysMet, n: goalProg.daysPerWeek })}</p>
                    <p className={`${s.muted} ${s.small}`} style={{ margin: "4px 0 0" }}>{T("goal.rule", "A goal day is {{min}} minutes or more.", { min: goalProg.minutesPerDay })}</p>
                  </div>
                </div>
                <ol className={s.ticks} aria-label={T("goal.days", "Days this week")}>
                  {goalProg.days.map((x, i) => (
                    <li key={x.date} className={s.tick}>
                      <span className={`${s.tickDot} ${x.met ? s.tickMet : ""} ${x.today ? s.tickToday : ""}`} aria-hidden="true">{x.met ? "✓" : ""}</span>
                      <span aria-hidden="true">{letters[i]}</span>
                      <span className={s.srOnly}>{fmtDate(x.date, { style: "weekday" })}: {x.met ? T("goal.met", "goal met") : x.future ? T("goal.future", "still to come") : T("goal.notMet", "{{m}} minutes", { m: Math.round(x.minutes) })}</span>
                    </li>
                  ))}
                </ol>
                {goal.data.goal?.reward && (
                  <p className={s.reward}>{goal.data.goal.rewardEmoji || "🎁"} {goalProg.reached ? T("goal.rewardWon", "Reward earned: {{r}}", { r: goal.data.goal.reward }) : T("goal.reward", "When the goal is reached: {{r}}", { r: goal.data.goal.reward })}</p>
                )}
              </>
            ) : (
              <p className={s.muted}>{T("goal.none", "A small weekly goal, like 20 minutes on 5 days, helps a habit grow. {{name}} sees it on their home screen.", { name: first })}</p>
            )}
          </section>

          <section className={s.card} aria-labelledby="p-next-h">
            <div className={s.cardHead}><h2 id="p-next-h">{T("next.title", "What to do next")}</h2></div>
            <ul className={s.next}>
              {next.map((n) => (
                <li key={n.title} className={s.nextItem}>
                  <span className={s.nextIcon} aria-hidden="true">{n.icon}</span>
                  <span className={s.nextBody}><strong>{n.title}</strong><span>{n.text}</span></span>
                  <Button variant="soft" size="sm" to={n.to}>{T("next.open", "Open")}</Button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </SubPanel>

      <SubPanel id="time" value={pane}>
        {main}
        {tr.range !== "year" && (
          <ChartCard title={T("glance", "{{y}} at a glance", { y: year })} loading={cal.loading} error={cal.error} onRetry={cal.reload}
            table={toTable.calendar((cal.data?.days || []).map((x) => ({ date: x.date, value: x.minutes })), t)}
            actions={<Button variant="ghost" size="sm" onClick={() => go("activity")}>{T("log", "Activity log")}</Button>}>
            <CalendarHeatmap data={(cal.data?.days || []).map((x) => ({ date: x.date, value: x.minutes }))} mode="year" to={tr.to} goal={goalProg?.minutesPerDay} />
          </ChartCard>
        )}
      </SubPanel>

      <SubPanel id="subjects" value={pane}>
        <ChartCard title={T("matrixTitle", "How is {{name}} doing in each subject?", { name: first })}
          answer={cells.some((c) => c.answered) ? T("matrixAnswer", "{{n}} of 12 areas mastered {{when}}. Tap a tile to see the questions.", { n: mastered, when: rangeWord }) : undefined}
          info={T("matrixInfo", "Colour shows mastery, the number is the share of right answers.")}
          loading={ov.loading && !d} error={ov.error} onRetry={ov.reload} table={toTable.matrix(cells, t)}
          empty={d && !cells.some((c) => c.answered) && { title: T("matrixEmpty", "No answers in this period"), text: T("matrixEmptyText", "Pick a longer range, or check back after the next session.") }}>
          <SubjectModuleMatrix cells={cells} onSelect={(subject, module) => go("learning", { subject, module, pane: "questions" })} />
        </ChartCard>
      </SubPanel>

      <SubPanel id="habits" value={pane}>
        <div className={s.grid2}>
          <ChartCard title={T("patternsTitle", "When does {{name}} learn?", { name: first })}
            answer={d?.patterns?.bestHour != null ? T("patternsAnswer", "Most often around {{h}}.", { h: hourLabel(d.patterns.bestHour) }) : undefined}
            loading={ov.loading && !d} table={toTable.hourWeekday(heat, t)}
            empty={d && !heat.length && { title: T("patternsEmpty", "Not enough learning yet to see a pattern") }}>
            <HourWeekdayHeatmap data={heat} unit={T("activities", "activities")} />
          </ChartCard>
          <section className={s.card} aria-labelledby="p-habit-h">
            <div className={s.cardHead}><h2 id="p-habit-h">{T("habits", "Learning habits")}</h2></div>
            <ul className={s.list}>
              <li><span>{T("weekday", "Average on a school day")}</span><strong>{d?.patterns?.weekdayAvgMinutes != null ? fmtDuration(d.patterns.weekdayAvgMinutes) : "—"}</strong></li>
              <li><span>{T("weekend", "Average on a weekend day")}</span><strong>{d?.patterns?.weekendAvgMinutes != null ? fmtDuration(d.patterns.weekendAvgMinutes) : "—"}</strong></li>
              <li><span>{T("session", "Average session")}</span><strong>{avgSession != null ? fmtDuration(avgSession) : "—"}</strong></li>
              <li><span>{T("longest", "Longest streak")}</span><strong>{d?.streak ? T("k.streakVal", "{{n}} days", { n: d.streak.longest, count: d.streak.longest }) : "—"}</strong></li>
            </ul>
          </section>
        </div>
      </SubPanel>
    </>
  );
}
