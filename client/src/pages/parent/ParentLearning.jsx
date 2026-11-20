import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  TimeRangeBar, useTimeRange, ChartCard, SubjectModuleMatrix, SkillMap, TrendLine, Button, toTable,
  fmtDuration, fmtPercent, fmtDate, subjectLabel, moduleLabel, SubTabs, SubPanel, usePane,
} from "../../components/dashboard";
import { useLoad, rangeQuery, matrixCells, masteryKey, frac } from "./parentApi";
import QuestionReview from "./QuestionReview";
import ParentPlan from "./ParentPlan";
import s from "./parent.module.css";

const LEVEL = { notStarted: 0, learning: 1, practising: 2, mastered: 3 };
// Trend values are whole percentages (0-100), as the server sends them.
const pctFmt = (v) => (v == null ? "—" : `${Math.round(v)} %`);
const cap = (x) => (x ? x.charAt(0).toUpperCase() + x.slice(1) : "");

// Learning in depth (PAR-030..036): subjects, skills, trends, modes, the exact questions, AI Teacher, games,
// one sub-tab each so every view fits a screen. A tile opens "Questions" filtered to that area.
const PANES = ["subjects", "skills", "progress", "questions", "extras", "plan"];
export default function ParentLearning({ api, child, go }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.learn.${k}`, { defaultValue: d, ...o });
  const tr = useTimeRange({ defaultRange: "month", defaultCmp: "prev" });
  const [pane, setPane] = usePane(PANES);
  const [params] = useSearchParams();
  const subject = params.get("subject");
  const module = params.get("module");
  const base = `/children/${child._id}`;
  const q = rangeQuery(tr);
  const mx = useLoad(api.get, `${base}/analytics/matrix?${q}`);
  const sk = useLoad(api.get, `${base}/analytics/skills?${q}`);
  const trn = useLoad(api.get, `${base}/analytics/trends?${q}`);
  const src = useLoad(api.get, `${base}/analytics/sources?${q}`);
  const ai = useLoad(api.get, `${base}/analytics/ai-teacher?${q}`);
  const ar = useLoad(api.get, `${base}/analytics/ar?${q}`);
  const first = child.name.split(" ")[0];

  const cells = useMemo(() => matrixCells(mx.data?.matrix), [mx.data]);
  const skills = useMemo(() => (sk.data?.groups || []).flatMap((g) => g.skills.map((x) => ({
    id: x.key,
    topic: subjectLabel(t, g.subject),
    label: sk.data.level === "topic" ? x.label : moduleLabel(t, x.module),
    level: LEVEL[masteryKey(x.mastery)],
    prevLevel: LEVEL[masteryKey(x.then?.mastery)],
    subject: g.subject, module: x.module,
  }))), [sk.data, t]);

  const trendPts = (trn.data?.points || []).map((p) => ({ x: p.key, value: p.firstTryAccuracy }));
  const speedPts = (trn.data?.points || []).map((p) => ({ x: p.key, value: p.avgTimeSec }));
  const indepPts = (trn.data?.points || []).map((p) => ({ x: p.key, value: p.independence }));
  const cur = trn.data?.current;

  const srcRows = src.data ? [
    { key: "practice", icon: "🌿", label: T("src.practice", "Relaxed practice"), ...src.data.sources.practice },
    { key: "warrior", icon: "⏱️", label: T("src.warrior", "Warrior (timed)"), ...src.data.sources.warrior },
    { key: "test", icon: "📝", label: T("src.test", "Teacher tests"), ...src.data.sources.test },
  ] : [];

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>{T("title", "{{name}}'s learning", { name: first })}</h1>
          <p>{T("sub", "Subjects, skills and the questions behind every number.")}</p>
        </div>
      </div>
      <SubTabs label={T("tabs", "Learning in depth")} value={pane} onChange={setPane}
        tabs={[
          { id: "subjects", label: T("tab.subjects", "Subjects") },
          { id: "skills", label: T("tab.skills", "Skills") },
          { id: "progress", label: T("tab.progress", "Progress") },
          { id: "questions", label: T("tab.questions", "Questions") },
          { id: "extras", label: T("tab.extras", "AI Teacher and games"), short: T("tab.extrasShort", "AI & games") },
          { id: "plan", label: T("tab.plan", "Learning plan"), short: T("tab.planShort", "Plan") },
        ]}
        actions={pane === "plan" ? null : <TimeRangeBar value={tr} ranges={["week", "month", "year", "custom"]} showCompare compact />} />

      <SubPanel id="subjects" value={pane}>
        <ChartCard title={T("matrix", "Which areas are strong, and which need practice?")}
          answer={cells.some((c) => c.answered) ? T("matrixAnswer", "Tap a tile to see the questions from that area.") : undefined}
          info={T("matrixInfo", "Colour: mastery level. Number: share of right answers. Mastered = 80 % or more over at least 5 answers.")}
          loading={mx.loading} error={mx.error} onRetry={mx.reload} table={toTable.matrix(cells, t)}
          empty={mx.data && !cells.some((c) => c.answered) && { title: T("matrixEmpty", "No answers in this period") }}>
          <SubjectModuleMatrix cells={cells} onSelect={(sub, mod) => go("learning", { subject: sub, module: mod, pane: "questions" })} />
        </ChartCard>
      </SubPanel>

      <SubPanel id="skills" value={pane}>
        <ChartCard title={T("skills", "What can {{name}} do now?", { name: first })}
          answer={sk.data ? (sk.data.level === "topic"
            ? T("skillsTopic", "Grouped by topic. Switch on “then vs now” to compare with the start of the period.")
            : T("skillsModule", "Shown per area (module and subject) until our question bank carries individual skills.")) : undefined}
          info={T("skillsInfo", "Now: the last 30 days. Then: the 30 days before the period started.")}
          loading={sk.loading} error={sk.error} onRetry={sk.reload} table={toTable.skills(skills, t)}>
          <SkillMap skills={skills} onSelect={(x) => go("learning", { subject: x.subject, module: x.module, pane: "questions" })} />
        </ChartCard>
      </SubPanel>

      <SubPanel id="progress" value={pane}>
        <div className={s.grid3}>
          <ChartCard title={T("firstTry", "Right on the first try?")} answer={cur?.firstTryAccuracy != null ? fmtPercent(cur.firstTryAccuracy / 100) : undefined}
            info={T("firstTryInfo", "Answers right on the first attempt, divided by all answers.")} loading={trn.loading} table={toTable.trend(trendPts, t, { unit: "pts" })}
            empty={trn.data && !trendPts.length && true}>
            <TrendLine data={trendPts} unit="%" yFormat={pctFmt} height={180} />
          </ChartCard>
          <ChartCard title={T("speed", "How long per question?")} answer={cur?.avgTimeSec != null ? T("secs", "{{n}} seconds on average", { n: cur.avgTimeSec }) : undefined}
            info={T("speedInfo", "Average time from seeing a question to answering it. Faster is not always better: careful is good too.")} loading={trn.loading} table={toTable.trend(speedPts, t, { unit: "s" })}
            empty={trn.data && !speedPts.length && true}>
            <TrendLine data={speedPts} unit="s" height={180} />
          </ChartCard>
          <ChartCard title={T("indep", "Working without hints?")} answer={cur?.independence != null ? fmtPercent(cur.independence / 100) : undefined}
            info={T("indepInfo", "Answers given without asking for a hint.")} loading={trn.loading} table={toTable.trend(indepPts, t, { unit: "pts" })}
            empty={trn.data && !indepPts.length && true}>
            <TrendLine data={indepPts} unit="%" yFormat={pctFmt} height={180} />
          </ChartCard>
        </div>
        {trn.data?.summary && <p className={s.notice}><strong>{first}</strong> {trn.data.summary.charAt(0).toLowerCase() + trn.data.summary.slice(1)}</p>}

        <section className={s.card} aria-labelledby="p-src-h">
          <div className={s.cardHead}><h2 id="p-src-h">{T("srcTitle", "Practice, Warrior rounds and tests")}</h2></div>
          <p className={`${s.muted} ${s.small}`} style={{ marginTop: 0 }}>{T("srcWhy", "Kept apart so a timed score never looks like a drop in ability.")}</p>
          <div className={s.grid3}>
            {srcRows.map((r) => (
              <div key={r.key} className={s.src}>
                <span aria-hidden="true" style={{ fontSize: "1.4rem" }}>{r.icon}</span>
                <strong>{r.label}</strong>
                <span className={s.srcBig}>{r.accuracy != null ? fmtPercent(frac(r.accuracy)) : "—"}</span>
                <span className={s.muted}>{r.answered ? T("srcN", "{{n}} answers · {{s}} s each", { n: r.answered, s: r.avgTimeSec ?? "—" }) : r.key === "test" ? T("srcTestNone", "No teacher tests yet") : T("srcNone", "None in this period")}</span>
              </div>
            ))}
          </div>
          {src.data?.note && <p className={s.notice} style={{ marginBottom: 0 }}>{T("srcNote", src.data.note)}</p>}
        </section>
      </SubPanel>

      <SubPanel id="questions" value={pane}>
        <QuestionReview api={api} child={child} subject={subject} module={module} onClear={() => go("learning", { subject: null, module: null })} />
      </SubPanel>

      <SubPanel id="extras" value={pane}>
        <div className={s.grid2}>
          <section className={s.card} aria-labelledby="p-ai-h">
            <div className={s.cardHead}>
              <h2 id="p-ai-h">{T("ai", "AI Teacher")}</h2>
              {ai.data?.minutes > 0 && <span className={s.pill}>{fmtDuration(ai.data.minutes)}</span>}
            </div>
            {ai.data?.topics?.length ? (
              <>
                <p className={`${s.muted} ${s.small}`} style={{ marginTop: 0 }}>{T("aiWhy", "Topics explored. We keep the topic only, never what your child typed or said.")}</p>
                <ul className={s.list}>
                  {ai.data.topics.slice(0, 8).map((x) => (
                    <li key={x.topic}><span>{x.title}<br /><span className={`${s.muted} ${s.small}`}>{x.subject} · {fmtDate(String(x.lastAt).slice(0, 10), { style: "short" })}</span></span><strong>{fmtDuration(x.minutes)}</strong></li>
                  ))}
                </ul>
              </>
            ) : (
              <p className={s.muted}>{T("aiNone", "No AI Teacher lessons in this period. Try asking it a question together!")}</p>
            )}
          </section>

          <section className={s.card} aria-labelledby="p-ar-h">
            <div className={s.cardHead}>
              <h2 id="p-ar-h">{T("ar", "Movement and focus games")}</h2>
              {ar.data?.sessions > 0 && <span className={s.pill}>{T("arN", "{{n}} games", { n: ar.data.sessions })}</span>}
            </div>
            {ar.data?.sessions ? (
              <>
                <ul className={s.list}>
                  {ar.data.notes.map((n) => <li key={n.key}><span>✨ {t(`parent.ar.${n.key}`, { defaultValue: n.text })}</span></li>)}
                  {(() => { const w = ar.data.weeks[ar.data.weeks.length - 1]; return w ? (
                    <>
                      <li><span>{T("arAcc", "Hit the right target")}</span><strong>{w.accuracy != null ? `${Math.round(w.accuracy)} %` : "—"}</strong></li>
                      <li><span>{T("arReact", "Typical reaction time")}</span><strong>{w.reactionMs != null ? T("arSec", "{{n}} s", { n: (w.reactionMs / 1000).toFixed(1) }) : "—"}</strong></li>
                      <li><span>{T("arSteady", "Steady, direct movements")}</span><strong>{w.steadiness != null ? `${w.steadiness} %` : "—"}</strong></li>
                    </>) : null; })()}
                  {ar.data.games.slice(0, 3).map((g) => <li key={g.gameId}><span>🎮 {g.title}</span><span className={s.muted}>{g.sessions === 1 ? T("arOnce", "once") : T("arPlays", "{{n}} times", { n: g.sessions })}</span></li>)}
                </ul>
                <p className={`${s.muted} ${s.small}`}>{T("arDisclaimer", ar.data.disclaimer)}</p>
              </>
            ) : (
              <p className={s.muted}>{T("arNone", "No camera games in this period.")}</p>
            )}
            <Button variant="ghost" size="sm" to="/games/ar">{T("arOpen", "Open the games")}</Button>
          </section>
        </div>
      </SubPanel>
      <SubPanel id="plan" value={pane}>
        <ParentPlan api={api} child={child} />
      </SubPanel>
      {pane !== "plan" && <p className={`${s.muted} ${s.small}`}>{cap(T("periodNote", "showing {{from}} to {{to}}", { from: fmtDate(tr.from, { style: "short" }), to: fmtDate(tr.to, { style: "short" }) }))}</p>}
    </>
  );
}
