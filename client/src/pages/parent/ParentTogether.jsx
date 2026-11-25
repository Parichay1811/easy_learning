import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StoryCard, KpiTile, Button, EmptyState, Skeleton } from "../../components/dashboard";
import InterestsCard from "../../components/together/InterestsCard";
import TeamBoard from "../../components/together/TeamBoard";
import { AVATARS, avatarHue, words } from "../together/words";
import { useLoad } from "./parentApi";
import s from "./parent.module.css";
import x from "./together.module.css";

const SWITCHES = [
  { key: "friends", emoji: "🤝", def: "Friends", hint: "Add friends with a code or from their class, and send ready-made cheers. There is no chat." },
  { key: "friendApproval", emoji: "✅", def: "Ask me before each new friend", hint: "A new friend waits here for your yes. Applies while your child is under 13.", needs: "friends" },
  { key: "matches", emoji: "🎯", def: "Rounds together and team matches", hint: "The same questions as a friend, each in their own time, and their class's team matches." },
  { key: "mystery", emoji: "🕵️", def: "A round with someone new", hint: "Paired with a learner at the same level. Only nicknames and pictures are shown, and they cannot contact each other.", needs: "matches" },
  { key: "shorts", emoji: "🎬", def: "Shorts", hint: "A feed of small lessons to swipe. It pauses for a break after a few and follows your healthy-use limits." },
];

function Face({ who, size = 40 }) {
  const key = who?.avatar || "star";
  return <span className={x.face} style={{ "--size": `${size}px`, "--hue": avatarHue(key) }} aria-hidden="true">{AVATARS[key] || "⭐"}</span>;
}

// Learning together for one child (G-530, G-531): the answer first, then anything waiting
// for the parent, then friends, teams, rounds, prizes, what they love, and the switches.
export default function ParentTogether({ api, child, onChanged }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.together.${k}`, { defaultValue: d, ...o });
  // A sentence with a number in it: its one and many forms.
  const N = (k, one, many, o) => t(`parent.together.${k}`, { defaultValue_one: one, defaultValue_other: many, ...o });
  const w = useMemo(() => words(t), [t]);
  const base = `/children/${child._id}`;
  const tg = useLoad(api.get, `${base}/together`);
  const it = useLoad(api.get, `${base}/interests`);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState(null);
  const first = child.name.split(" ")[0];
  const d = tg.data;

  const act = async (key, fn, ok) => {
    setBusy(key); setNote(null);
    const r = await fn();
    setBusy("");
    if (r.success === false) { setNote({ bad: true, text: r.message || T("oops", "That did not work. Please try again.") }); return; }
    if (ok) setNote({ text: ok });
    await tg.reload();
  };
  const flip = (key, value) => act(`sw-${key}`, async () => { const r = await api.patch(`${base}/settings`, { together: { [key]: value } }); if (r.success !== false) await onChanged?.(); return r; });

  if (tg.loading && !d) return <><Skeleton variant="rect" height={140} /><Skeleton variant="chart" /></>;
  if (!d || d.success === false) {
    return <div className={s.card}><EmptyState tone="error" title={T("error", "We couldn't load this page")} text={tg.error || d?.message} actionLabel={T("retry", "Try again")} onAction={tg.reload} /></div>;
  }

  const running = d.teams.filter((m) => m.status === "active");
  const ended = d.teams.filter((m) => m.status === "ended");
  const doneRounds = d.matches.filter((m) => m.status === "done");
  const waiting = d.friends.waitingForYou;
  const top = (it.data?.interests?.top || []).map((k) => w.theme(k).name);
  const sentence = (
    <>
      {d.friends.friends.length
        ? N("storyFriends", "{{name}} has {{count}} friend on Learnigo", "{{name}} has {{count}} friends on Learnigo", { name: first, count: d.friends.friends.length })
        : T("storyNoFriends", "{{name}} has no friends on Learnigo yet", { name: first })}
      {running[0] ? <>{", "}{T("storyTeam", "is in {{team}} for “{{title}}”", { team: running[0].teams.length === 1 ? T("theClass", "the class team") : w.team(running[0].myTeam), title: running[0].title })}</> : null}
      {top.length ? <>{" "}{T("storyLoves", "and loves {{topics}}", { topics: top.slice(0, 2).join(" · ") })}</> : null}.
    </>
  );
  const chips = [
    waiting.length && { kind: "nudge", text: N("chipWaiting", "{{count}} friend waiting for your yes", "{{count}} friends waiting for your yes", { count: waiting.length }) },
    d.trophies.total > 0 && { kind: "celebrate", text: N("chipPrizes", "{{count}} prize earned together", "{{count}} prizes earned together", { count: d.trophies.total }) },
    ended[0]?.ceremony?.award && { kind: "celebrate", text: T("chipAward", "Award: {{name}}", { name: w.award(ended[0].ceremony.award).name }) },
    { kind: "info", text: T("chipSafe", "No chat: ready-made cheers only") },
  ].filter(Boolean);

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <h1>{T("title", "Together")}</h1>
          <p className={s.muted}>{T("subtitle", "Who {{name}} learns with, how their team is doing, and what they love to watch.", { name: first })}</p>
        </div>
      </div>

      <StoryCard sentence={sentence} chips={chips} />
      {note && <p className={note.bad ? s.error : s.ok} role="status">{note.text}</p>}

      {waiting.length > 0 && (
        <section className={`${s.card} ${x.waiting}`} aria-labelledby="pt-wait">
          <h2 id="pt-wait">{T("waitTitle", "Waiting for your yes")}</h2>
          <p className={s.muted}>{T("waitText", "{{name}} and these learners both asked to be friends. Friends can play the same round and send ready-made cheers. They cannot write to each other.", { name: first })}</p>
          <ul className={x.people}>
            {waiting.map((f) => (
              <li key={f.id} className={x.person}>
                <Face who={f} size={48} />
                <span className={x.personName}><b>{f.name || w.nick(f.nick)}</b><small>{w.nick(f.nick)}</small></span>
                <span className={s.row}>
                  <Button onClick={() => act(`ok-${f.id}`, () => api.post(`${base}/together/friends/${f.id}/approve`), T("approved", "They are friends now."))} disabled={busy === `ok-${f.id}`}>{T("approve", "Yes, they can be friends")}</Button>
                  <Button variant="ghost" onClick={() => act(`no-${f.id}`, () => api.del(`${base}/together/friends/${f.id}`), T("declined", "Request removed."))}>{T("decline", "No")}</Button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={`${s.kpis} ${x.kpis}`}>
        <KpiTile label={T("kFriends", "Friends")} value={d.friends.friends.length} />
        <KpiTile label={T("kRounds", "Rounds played together")} value={doneRounds.length} />
        <KpiTile label={T("kCheers", "Cheers this month")} value={`${d.cheers.given} · ${d.cheers.received}`} helpText={T("kCheersHelp", "Sent · received in the last 30 days. Cheers are a sticker and a ready-made line.")} />
        <KpiTile label={T("kPrizes", "Prizes")} value={d.trophies.total} />
      </div>

      <div className={x.cols}>
        <section className={s.card} aria-labelledby="pt-teams">
          <h2 id="pt-teams">{T("teamsTitle", "How is the team doing?")}</h2>
          {!d.teams.length && <p className={s.muted}>{T("noTeams", "No team match right now. When {{name}}'s teacher starts one, it shows here.", { name: first })}</p>}
          {d.teams.map((m) => (
            <div key={m.id} className={x.match}>
              <div className={s.spread}>
                <b>{m.kind === "quest" ? "🧭" : "🏁"} {m.title}</b>
                <span className={`${s.pill} ${m.status === "active" ? s.pillGood : ""}`}>{m.status === "active" ? N("daysLeft", "{{count}} day to go", "{{count}} days to go", { count: m.daysLeft }) : T("finished", "Finished")}</span>
              </div>
              <TeamBoard teams={m.teams} mine={m.myTeam} />
              {m.status === "active"
                ? <p className={s.small}>{N("added", "{{name}} has added {{count}} star so far. Up to 20 a day count, so a little each day helps most.", "{{name}} has added {{count}} stars so far. Up to 20 a day count, so a little each day helps most.", { name: first, count: m.iAdded || 0 })}</p>
                : m.ceremony && <p className={s.small}>{w.award(m.ceremony.award).emoji} <b>{T("award", "{{name}}'s award: {{award}}.", { name: first, award: w.award(m.ceremony.award).name })}</b> {w.awardText(m.ceremony.award, m.ceremony.evidence)}{m.ceremony.trophy ? ` ${T("trophy", "Their team reached the goal: a trophy for everyone.")}` : ""}</p>}
            </div>
          ))}
          <p className={`${s.small} ${s.muted}`}>{T("teamsNote", "Teams are scored together. There is no table of children, and every team that reaches its goal wins.")}</p>
        </section>

        <section className={s.card} aria-labelledby="pt-friends">
          <h2 id="pt-friends">{T("friendsTitle", "Friends")}</h2>
          {!d.friends.friends.length && <p className={s.muted}>{T("noFriends", "No friends yet. Friends are added with a 6-character code or from their own class.")}</p>}
          <ul className={x.people}>
            {d.friends.friends.map((f) => (
              <li key={f.id} className={x.person}>
                <Face who={f} />
                <span className={x.personName}><b>{f.name || w.nick(f.nick)}</b><small>{w.nick(f.nick)}</small></span>
                <Button variant="ghost" size="sm" onClick={() => act(`rm-${f.id}`, () => api.del(`${base}/together/friends/${f.id}`), T("removed", "Friendship ended."))} disabled={busy === `rm-${f.id}`}>{T("remove", "Remove")}</Button>
              </li>
            ))}
          </ul>
          {d.friends.waitingForOthers.length > 0 && <p className={`${s.small} ${s.muted}`}>{N("pending", "{{count}} more request is waiting for the other child or their grown-up.", "{{count}} more requests are waiting for the other child or their grown-up.", { count: d.friends.waitingForOthers.length })}</p>}

          {d.matches.length > 0 && (
            <>
              <h3 className={x.h3}>{T("roundsTitle", "Rounds together")}</h3>
              <ul className={x.rounds}>
                {d.matches.slice(0, 6).map((m) => (
                  <li key={m.id}>
                    <span>{m.kind === "buddy" ? "🤝" : m.kind === "mystery" ? "🕵️" : "🎀"} {w.subject(m.subject)} · {w.module(m.module)} {m.with ? T("withWho", "with {{name}}", { name: m.with.name || w.nick(m.with.nick) }) : ""}</span>
                    <span className={s.muted}>
                      {m.status === "done" ? (m.kind === "buddy" ? T("rTogether", "{{stars}} stars together", { stars: m.result.together }) : T("rScore", "{{mine}} · {{theirs}} of {{total}}", { mine: m.me.stars, theirs: m.them.stars, total: m.me.total }))
                        : m.status === "waiting" ? T("rWaiting", "played, waiting for the other") : T("rTurn", "not played yet")}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <InterestsCard interests={it.data?.interests} name={first} loading={it.loading && !it.data} error={it.error} onRetry={it.reload} />

      <section className={s.card} aria-labelledby="pt-switches">
        <h2 id="pt-switches">{T("switchTitle", "What {{name}} can do", { name: first })}</h2>
        <p className={s.muted}>{T("switchText", "You hold the switches. When grown-ups choose differently, the more careful choice applies.")}</p>
        <ul className={x.switches}>
          {SWITCHES.map((sw) => {
            const on = Boolean(d.switches[sw.key]);
            const blocked = sw.needs && !d.switches[sw.needs];
            return (
              <li key={sw.key} className={`${x.switchRow} ${blocked ? x.blocked : ""}`}>
                <span className={x.switchEmoji} aria-hidden="true">{sw.emoji}</span>
                <span className={x.switchText}><b id={`pt-sw-${sw.key}`}>{T(`sw.${sw.key}`, sw.def)}</b><small>{T(`sw.${sw.key}Hint`, sw.hint)}</small></span>
                <button type="button" role="switch" aria-checked={on && !blocked} aria-labelledby={`pt-sw-${sw.key}`} className={`${x.toggle} ${on && !blocked ? x.toggleOn : ""}`} disabled={blocked || busy === `sw-${sw.key}`} onClick={() => flip(sw.key, !on)}>
                  <span className={x.knob} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
