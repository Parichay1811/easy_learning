// Learning together in one group (G-511, G-512, G-532): the teacher starts a class quest
// or a team match, watches the teams climb, sees who has joined in (in name order, never
// ranked), ends it with the ceremony, and sees what the group loves to watch.
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaFlagCheckered, FaPlus, FaCheck } from "react-icons/fa";
import { Button, EmptyState, Skeleton, Sheet, KpiTile } from "../../components/dashboard";
import TeamBoard from "../../components/together/TeamBoard";
import { GroupInterestsCard } from "../../components/together/InterestsCard";
import { words } from "../together/words";
import { useLoad, useTeacherApi } from "./teacherApi";
import s from "./teacher.module.css";
import x from "./together.module.css";

const fmtDay = (d) => { try { return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(new Date(d)); } catch { return ""; } };

export default function GroupTogether({ group, go }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`teacher.together.${k}`, { defaultValue: d, ...o });
  const N = (k, one, many, o) => t(`teacher.together.${k}`, { defaultValue_one: one, defaultValue_other: many, ...o });
  const w = useMemo(() => words(t), [t]);
  const { get, send } = useTeacherApi();
  const q = useLoad(() => get(`/groups/${group._id}/competitions`), [group._id]);
  const it = useLoad(() => get(`/groups/${group._id}/interests`), [group._id]);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(null);
  const [note, setNote] = useState(null);
  const d = q.data;

  if (q.loading && !d) return <><Skeleton variant="rect" height={120} /><Skeleton variant="chart" /></>;
  if (q.error) return <EmptyState tone="error" title={t("teacher.loadError", { defaultValue: "We couldn't load this page" })} text={q.error} actionLabel={T("retry", "Try again")} onAction={q.reload} />;

  const end = async (c) => {
    const r = await send("POST", `/competitions/${c.id}/end`);
    setEnding(null);
    setNote(r.ok ? { text: T("ended", "Finished. Every learner now sees the ceremony and their award.") } : { bad: true, text: r.message });
    q.reload();
  };

  return (
    <>
      <section className={`${s.card} ${x.intro}`}>
        <div className={x.introText}>
          <h2>{T("title", "Play as a team")}</h2>
          <p className={s.muted}>{T("intro", "Set a shared goal for the whole group, or split it into balanced teams. Every right answer a learner gives, at their own level, adds a star. Every team that reaches its goal wins, and every learner gets an award that is true for them.")}</p>
          <ul className={x.rules}>
            <li><FaCheck aria-hidden="true" /> {T("rule1", "Teams are scored together: no table of children.")}</li>
            <li><FaCheck aria-hidden="true" /> {T("rule2", "Up to 20 stars a day count per learner, so steady practice wins, not long sessions.")}</li>
            <li><FaCheck aria-hidden="true" /> {T("rule3", "No clock, and nothing is lost by missing a day.")}</li>
          </ul>
        </div>
        <div className={x.introSide}>
          {d.enabled
            ? <Button variant="cta" icon={FaPlus} onClick={() => setStarting(true)} disabled={d.canJoin < 1}>{T("start", "Start a quest or match")}</Button>
            : <p className={x.off}>{T("off", "Your school has switched team matches off. Ask your school admin to turn them on in Settings.")}</p>}
          <p className={`${s.small} ${s.muted}`}>{d.canJoin < d.learners ? T("canJoinSome", "{{canJoin}} of {{learners}} learners can sign in and take part.", { canJoin: d.canJoin, learners: d.learners }) : T("canJoinAll", "All {{learners}} learners can take part.", { learners: d.learners })}</p>
        </div>
      </section>
      {note && <p className={note.bad ? x.bad : x.good} role="status">{note.text}</p>}

      {d.running.map((c) => (
        <section key={c.id} className={s.card} aria-label={c.title}>
          <div className={x.head}>
            <div>
              <h2>{c.kind === "quest" ? "🧭" : "🏁"} {c.title}</h2>
              <p className={s.muted}>{c.kind === "quest" ? T("kindQuest", "Class quest") : T("kindTeams", "Team match")} · {fmtDay(c.startsAt)} – {fmtDay(c.endsAt)} · {c.daysLeft <= 1 ? T("lastDay", "last day") : N("daysLeft", "{{count}} day to go", "{{count}} days to go", { count: c.daysLeft })}</p>
            </div>
            <Button variant="ghost" icon={FaFlagCheckered} onClick={() => setEnding(c)}>{T("endNow", "End now")}</Button>
          </div>
          <div className={s.tiles}>
            <KpiTile label={T("kJoined", "Learners who have joined in")} value={`${c.joinedIn} / ${c.learners}`} tone={c.joinedIn === c.learners ? "good" : "neutral"} />
            <KpiTile label={T("kStars", "Stars so far")} value={c.teams.reduce((a, tm) => a + tm.stars, 0)} />
            <KpiTile label={T("kReached", "Teams at their goal")} value={`${c.teams.filter((tm) => tm.reached).length} / ${c.teams.length}`} />
          </div>
          <TeamBoard teams={c.teams} />
          <Members comp={c} w={w} T={T} go={go} />
        </section>
      ))}

      {d.enabled && !d.running.length && (
        <section className={s.card}>
          <EmptyState icon="🏁" title={T("emptyTitle", "Nothing running in this group")} text={T("emptyText", "A class quest is the gentlest start: one shared bar for everyone. Try five days.")} actionLabel={T("start", "Start a quest or match")} onAction={() => setStarting(true)} compact />
        </section>
      )}

      {d.ended.map((c) => (
        <section key={c.id} className={`${s.card} ${x.endedCard}`} aria-label={c.title}>
          <div className={x.head}>
            <div>
              <h2>{c.kind === "quest" ? "🧭" : "🏁"} {c.title}</h2>
              <p className={s.muted}>{T("finishedOn", "Finished {{date}}", { date: fmtDay(c.endedAt) })} · {T("reachedCount", "{{n}} of {{total}} teams reached the goal", { n: c.teams.filter((tm) => tm.reached).length, total: c.teams.length })}</p>
            </div>
          </div>
          <TeamBoard teams={c.teams} />
          <Members comp={c} w={w} T={T} go={go} />
        </section>
      ))}

      <GroupInterestsCard interests={it.data?.interests} loading={it.loading && !it.data} error={it.error} onRetry={it.reload} />

      {starting && <StartSheet group={group} canJoin={d.canJoin} T={T} t={t} send={send} onClose={() => setStarting(false)} onMade={() => { setStarting(false); setNote({ text: T("started", "Started! Learners see their team on their Together page.") }); q.reload(); }} />}
      {ending && (
        <Sheet size="sm" title={T("endTitle", "End “{{title}}” now?", { title: ending.title })} text={T("endText", "Stars stop counting, and every learner sees the ceremony: trophies for teams that reached their goal and one award each.")} onClose={() => setEnding(null)}
          footer={<><Button variant="ghost" onClick={() => setEnding(null)}>{T("keep", "Keep it running")}</Button><Button onClick={() => end(ending)}>{T("endNow", "End now")}</Button></>} />
      )}
    </>
  );
}

// Who is in each team. While it runs: who has joined in so far (a tick, no number), so the
// teacher knows who to invite. After it ends: each learner's award.
function Members({ comp, w, T, go }) {
  const running = comp.status === "active";
  return (
    <details className={x.members} open={!running}>
      <summary>{running ? T("whoJoined", "Who has joined in so far") : T("whoAwards", "Everyone's award")}</summary>
      <div className={x.memberCols}>
        {comp.teams.map((tm) => (
          <div key={tm.key} className={x.memberTeam} style={{ "--team": tm.color }}>
            <b><span aria-hidden="true">{tm.emoji}</span> {comp.teams.length === 1 ? T("wholeGroup", "The whole group") : w.team(tm.key)} · {tm.size}</b>
            <ul>
              {tm.members.map((m, i) => (
                <li key={m.id || i}>
                  {m.id ? <button type="button" className={x.memberBtn} onClick={() => go("student", { id: m.id })}>{m.name}</button> : <span>{m.name}</span>}
                  {running
                    ? <span className={m.joinedIn ? x.inYes : x.inNo}>{m.joinedIn ? T("in", "joined in") : T("notYet", "not yet")}</span>
                    : <span className={x.awardTag}>{w.award(m.award).emoji} {w.award(m.award).name}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {running && <p className={x.memberNote}>{T("memberNote", "In name order. “Not yet” is an invitation to make, not a mark against anyone.")}</p>}
    </details>
  );
}

function StartSheet({ canJoin, T, t, send, group, onClose, onMade }) {
  const [form, setForm] = useState({ title: "", kind: "quest", teams: 2, days: 5, subject: "", perDay: 5 });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const maxTeams = Math.max(2, Math.min(4, Math.floor(canJoin / 2)));
  const teamCount = form.kind === "teams" ? Math.min(form.teams, maxTeams) : 1;
  const perTeam = Math.max(1, Math.round(canJoin / teamCount) * form.days * form.perDay);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "number" || e.target.type === "range" ? Number(e.target.value) : e.target.value });
  const save = async (e) => {
    e?.preventDefault();
    setBusy(true); setErr("");
    const r = await send("POST", `/groups/${group._id}/competitions`, { title: form.title.trim(), kind: form.kind, teams: teamCount, days: form.days, subject: form.subject, starsPerLearnerPerDay: form.perDay });
    setBusy(false);
    if (r.ok) onMade(); else setErr(r.message || T("oops", "That did not work. Please try again."));
  };
  const subjects = [["", T("anySubject", "Any subject")], ["english", t("subjectPage.english.label", { defaultValue: "English" })], ["maths", t("subjectPage.maths.label", { defaultValue: "Maths" })], ["science", t("subjectPage.science.label", { defaultValue: "Science" })]];
  return (
    <Sheet title={T("startTitle", "Start a quest or match")} text={T("startText", "Learners play their usual rounds at their own level. Every right answer adds a star for their team.")} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>{T("cancel", "Cancel")}</Button><Button variant="cta" onClick={save} disabled={busy || form.title.trim().length < 2}>{T("go", "Start")}</Button></>}>
      <form onSubmit={save} className={x.form}>
        <label className={x.field}><span>{T("fName", "Name")}</span>
          <input className={x.input} value={form.title} onChange={set("title")} maxLength={60} placeholder={T("fNameHint", "Fractions week")} required /></label>
        <fieldset className={x.field}><legend>{T("fKind", "How do they play?")}</legend>
          <div className={x.kinds}>
            <label className={`${x.kind} ${form.kind === "quest" ? x.kindOn : ""}`}><input type="radio" name="kind" value="quest" checked={form.kind === "quest"} onChange={set("kind")} /><span aria-hidden="true">🧭</span><span><b>{T("kindQuest", "Class quest")}</b><small>{T("kindQuestText", "One team, one shared bar. Everyone wins together.")}</small></span></label>
            <label className={`${x.kind} ${form.kind === "teams" ? x.kindOn : ""} ${canJoin < 4 ? x.kindOff : ""}`}><input type="radio" name="kind" value="teams" checked={form.kind === "teams"} onChange={set("kind")} disabled={canJoin < 4} /><span aria-hidden="true">🏁</span><span><b>{T("kindTeams", "Team match")}</b><small>{canJoin < 4 ? T("kindTeamsFew", "Needs at least 4 learners who can sign in.") : T("kindTeamsText", "Balanced teams, made for you. Every team that reaches the goal wins.")}</small></span></label>
          </div>
        </fieldset>
        <div className={x.formRow}>
          {form.kind === "teams" && <label className={x.field}><span>{T("fTeams", "Teams")}</span><select className={x.input} value={teamCount} onChange={set("teams")}>{[2, 3, 4].filter((n) => n <= maxTeams).map((n) => <option key={n} value={n}>{n}</option>)}</select></label>}
          <label className={x.field}><span>{T("fDays", "Days")}</span><select className={x.input} value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) })}>{[1, 2, 3, 5, 7, 10, 14].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
          <label className={x.field}><span>{T("fSubject", "Which answers count?")}</span><select className={x.input} value={form.subject} onChange={set("subject")}>{subjects.map(([k, label]) => <option key={k} value={k}>{label}</option>)}</select></label>
        </div>
        <label className={x.field}><span>{T("fGoal", "Goal: {{n}} stars a learner a day", { n: form.perDay })}</span>
          <input type="range" min={1} max={15} step={1} value={form.perDay} onChange={set("perDay")} /></label>
        <p className={x.preview}>{form.kind === "teams" ? T("previewTeams", "{{teams}} teams of about {{size}}. Each team's goal: about {{goal}} stars.", { teams: teamCount, size: Math.round(canJoin / teamCount), goal: perTeam }) : T("previewQuest", "The whole group's goal: {{goal}} stars in {{days}} days.", { goal: perTeam, days: form.days })}</p>
        {err && <p className={x.bad} role="alert">{err}</p>}
      </form>
    </Sheet>
  );
}
