import { useTranslation } from "react-i18next";
import {
  StackedBars, SubjectModuleMatrix, HourWeekdayHeatmap, CalendarHeatmap, MasteryChips, fmtDuration, fmtPercent, fmtDate, subjectLabel, moduleLabel,
} from "../../components/dashboard";
import { matrixCells, masteryKey, frac } from "./parentApi";
import r from "./report.module.css";

const LEVEL = { notStarted: 0, learning: 1, practising: 2, mastered: 3 };
const cap = (x) => (x ? x.charAt(0).toUpperCase() + x.slice(1) : "");
const ICON = { celebrate: "🎉", info: "💡", nudge: "🎯", alert: "⚠️" };

// The report body, shared by the parent's print page and the read-only shared link.
export default function ReportView({ report }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.report.${k}`, { defaultValue: d, ...o });
  const { child, range, totals: tot, previous: prev, series, matrix, patterns, skills, sources, aiTeacher, achievements, milestones, calendar, insights, streak } = report;
  const first = (child?.name || "").split(" ")[0];
  const cells = matrixCells(matrix);
  const daily = (series?.points || []).map((p) => ({ x: p.key, english: p.bySubject?.english || 0, maths: p.bySubject?.maths || 0, science: p.bySubject?.science || 0 }));
  // Long ranges read better (and fit a phone or an A4 page) as weekly bars: same minutes, summed per 7 days.
  const bars = daily.length <= 45 ? daily : daily.reduce((out, d, i) => {
    if (i % 7 === 0) out.push({ x: d.x, english: 0, maths: 0, science: 0 });
    const w = out[out.length - 1];
    w.english += d.english; w.maths += d.maths; w.science += d.science;
    return out;
  }, []);
  const heat = [];
  (patterns?.heat || []).forEach((row, w) => row.forEach((v, h) => { if (v) heat.push({ weekday: w, hour: h, value: v }); }));
  const skillChips = (skills?.groups || []).flatMap((g) => g.skills.filter((x) => x.answered || x.then?.answered).map((x) => ({
    id: x.key, label: `${skills.level === "topic" ? x.label : moduleLabel(t, x.module)} · ${subjectLabel(t, g.subject)}`, level: LEVEL[masteryKey(x.mastery)], prevLevel: LEVEL[masteryKey(x.then?.mastery)],
  })));
  const nextSteps = (insights || []).filter((i) => i.key === "practise_next");
  const diff = prev ? Math.round(tot.minutes - prev.minutes) : null;

  return (
    <>
      <header className={r.cover}>
        <span className={r.coverAvatar} aria-hidden="true">{child?.avatar || first.charAt(0)}</span>
        <div>
          <div className={r.coverBrand}>LEARNIGO</div>
          <h1>{T("title", "{{name}}'s learning report", { name: first })}</h1>
          <p>{fmtDate({ from: range.from, to: range.to }, { style: "long" })}{child?.grade ? ` · ${child.grade}` : ""}</p>
        </div>
      </header>

      <section className={r.section}>
        <h2>{T("summary", "Summary")}</h2>
        <p className={r.story}>{report.story}</p>
        {insights?.length > 0 && (
          <ul className={r.insights}>
            {insights.slice(0, 5).map((i) => <li key={i.key}><span aria-hidden="true">{ICON[i.kind] || "•"}</span> {t(`parent.insight.${i.key}`, { defaultValue: i.text, ...i.params, module: cap(i.params?.module), subject: cap(i.params?.subject) })}</li>)}
          </ul>
        )}
      </section>

      <section className={r.section}>
        <h2>{T("numbers", "In numbers")}</h2>
        <div className={r.tiles}>
          <div className={r.tile}><span>{T("time", "Learning time")}</span><strong>{fmtDuration(tot.minutes)}</strong>{diff != null && Math.abs(diff) >= 1 && <span>{diff > 0 ? "▲" : "▼"} {fmtDuration(Math.abs(diff))} {T("vsBefore", "vs the period before")}</span>}</div>
          <div className={r.tile}><span>{T("days", "Active days")}</span><strong>{tot.activeDays} / {range.days}</strong></div>
          <div className={r.tile}><span>{T("answered", "Questions answered")}</span><strong>{tot.answered}</strong></div>
          <div className={r.tile}><span>{T("acc", "Right answers")}</span><strong>{tot.accuracy != null ? fmtPercent(frac(tot.accuracy)) : "—"}</strong></div>
          <div className={r.tile}><span>{T("streak", "Longest streak")}</span><strong>{streak?.longest ?? "—"}</strong></div>
          <div className={r.tile}><span>{T("stars", "Stars")}</span><strong>{tot.stars}</strong></div>
          <div className={r.tile}><span>{T("badges", "Badges so far")}</span><strong>{achievements?.length ?? 0}</strong></div>
          <div className={r.tile}><span>{T("ai", "AI Teacher")}</span><strong>{fmtDuration(aiTeacher?.minutes || 0)}</strong></div>
        </div>
      </section>

      {bars.length > 0 && (
        <section className={r.section}>
          <h2>{daily.length > 45 ? T("whenWeekly", "Time spent each week, by subject") : T("when", "Time spent each day, by subject")}</h2>
          <StackedBars data={bars} unit="min" height={220} />
        </section>
      )}

      <section className={`${r.section} ${r.pageBreak}`}>
        <h2>{T("matrix", "Subjects and modules")}</h2>
        <SubjectModuleMatrix cells={cells} />
      </section>

      {skillChips.length > 0 && (
        <section className={r.section}>
          <h2>{T("skills", "Skill progress")}</h2>
          <p style={{ marginTop: 0, color: "var(--d-muted)" }}>{T("skillsHow", "Arrows show the change from the start of the period to now.")}</p>
          <MasteryChips skills={skillChips} showPrev />
        </section>
      )}

      <div className={r.two}>
        {heat.length > 0 && (
          <section className={r.section}>
            <h2>{T("patterns", "When {{name}} learns", { name: first })}</h2>
            <HourWeekdayHeatmap data={heat} unit={T("activities", "activities")} />
          </section>
        )}
        <section className={r.section}>
          <h2>{T("modes", "Practice, Warrior and tests")}</h2>
          <ul className={r.list}>
            {[["practice", T("practice", "Relaxed practice")], ["warrior", T("warrior", "Warrior (timed)")], ["test", T("tests", "Teacher tests")]].map(([k, l]) => (
              <li key={k}><span>{l}</span><strong>{sources?.[k]?.answered ? `${fmtPercent(frac(sources[k].accuracy))} · ${sources[k].answered}` : "—"}</strong></li>
            ))}
          </ul>
          {report.sourcesNote && <p style={{ color: "var(--d-muted)", fontSize: "0.9rem" }}>{report.sourcesNote}</p>}
        </section>
      </div>

      {calendar?.length > 0 && range.days > 62 && (
        <section className={r.section}>
          <h2>{T("calendar", "Learning days")}</h2>
          <CalendarHeatmap data={calendar.map((d) => ({ date: d.date, value: d.minutes }))} mode="year" to={range.to} />
        </section>
      )}

      <div className={r.two}>
        <section className={r.section}>
          <h2>{T("moments", "Achievements and milestones")}</h2>
          {(milestones?.length || achievements?.length) ? (
            <ul className={r.list}>
              {(milestones || []).map((m) => <li key={m.key}><span>{m.icon} {t(`parent.milestone.${m.key}`, { defaultValue: m.text })}</span><span>{fmtDate(m.date, { style: "short" })}</span></li>)}
              {(achievements || []).slice(0, 6).map((a) => <li key={a.id}><span>{a.icon || "🏅"} {t(`dash.badge.${a.id}`, { defaultValue: a.name || a.id.replace(/_/g, " ") })}</span><span>{fmtDate(String(a.earnedAt).slice(0, 10), { style: "short" })}</span></li>)}
            </ul>
          ) : <p style={{ color: "var(--d-muted)" }}>{T("noMoments", "No new milestones in this period.")}</p>}
        </section>
        <section className={r.section}>
          <h2>{T("next", "Next steps")}</h2>
          <ul className={r.list}>
            {nextSteps.map((n) => <li key={n.key}><span>🎯 {T("practise", "Practise {{m}} · {{s}} a little each day", { m: cap(n.params.module), s: cap(n.params.subject) })}</span></li>)}
            {aiTeacher?.topics?.[0] && <li><span>🧑‍🏫 {T("aiNext", "Talk about “{{topic}}”, explored with the AI Teacher", { topic: aiTeacher.topics[0].title })}</span></li>}
            <li><span>💬 {T("praise", "Praise the effort, not only the score")}</span></li>
          </ul>
          <p style={{ color: "var(--d-muted)", fontSize: "0.9rem" }}>{T("teacher", "Teacher comments appear here when {{name}} is linked to a school or tutor.", { name: first })}</p>
        </section>
      </div>
      <p className={r.foot}>{T("generated", "Made with Learnigo on {{d}}. Numbers come from {{name}}'s own learning; there are no comparisons with other children.", { d: fmtDate(String(report.generatedAt).slice(0, 10), { style: "long" }), name: first })}</p>
    </>
  );
}
