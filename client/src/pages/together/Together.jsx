import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as FramerMotion from "framer-motion";
import { FaArrowLeft, FaUserFriends, FaGamepad, FaFlag, FaTrophy, FaCopy, FaCheck, FaPen, FaPlus, FaHeart, FaPlay, FaHourglassHalf, FaShareAlt, FaUserSecret } from "react-icons/fa";
import "../../components/dashboard/tokens.css";
import VideoBackground from "../../components/VideoBackground/VideoBackground";
import Mascot from "../../components/Mascot/Mascot";
import Sheet from "../../components/dashboard/Sheet";
import TabBar from "../studentDashboard/TabBar";
import { useCalmMotion } from "../../utils/useCalmMotion";
import { sfx, haptic } from "../../utils/sounds";
import { tg, useTogether, signedIn } from "./api";
import { AVATARS, STICKERS, CHEER_LINES, SUBJECTS, MODULES, avatarHue, words } from "./words";
import s from "./Together.module.css";
import { useGuide } from "../../components/guide/useGuide";
import { nudgeGuide } from "../../components/guide/nudge";

const TABS = ["friends", "play", "team", "prizes"];
const M = FramerMotion.motion;

/** A learner's picture: an emoji from the fixed set on a soft coloured disc. */
export function Avatar({ who, size = 56, ring = false }) {
  const key = who?.avatar || "star";
  return (
    <span className={`${s.avatar} ${ring ? s.avatarRing : ""}`} style={{ "--size": `${size}px`, "--hue": avatarHue(key) }} aria-hidden="true">
      {AVATARS[key] || "⭐"}
    </span>
  );
}

// A bar that fills with a transform (never the width), so it stays smooth on phones.
function Bar({ value, color, label, flag = false }) {
  const calm = useCalmMotion();
  const p = Math.max(0, Math.min(1, value || 0));
  return (
    <span className={s.bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)} aria-label={label}>
      <M.span className={s.barFill} style={{ background: color, originX: 0 }} initial={calm ? false : { scaleX: 0 }} animate={{ scaleX: p }} transition={{ type: "spring", bounce: 0.15, duration: 0.9 }} />
      {flag && <span className={`${s.barFlag} ${p >= 1 ? s.barFlagOn : ""}`} aria-hidden="true">🚩</span>}
    </span>
  );
}

export default function Together() {
  const { t } = useTranslation();
  const w = useMemo(() => words(t), [t]);
  const navigate = useNavigate();
  const calm = useCalmMotion();
  const [params, setParams] = useSearchParams();
  const { data, loading, error, reload, patch } = useTogether();
  const guide = useGuide();
  // Without a tab in the address the page opens on whatever is waiting: a round to play,
  // then a new team award, then friends. One tap less to the thing a learner came for.
  const waitingTab = data?.matches?.yourTurn?.length ? "play" : data?.teams?.some((x) => x.ceremony?.isNew) ? "team" : "friends";
  const tab = TABS.includes(params.get("tab")) ? params.get("tab") : waitingTab;
  const setTab = (k) => setParams({ tab: k }, { replace: true });
  const [sheet, setSheet] = useState(null); // { kind: 'card' | 'cheer' | 'round' | 'add', ... }
  const [note, setNote] = useState(null); // a short line of feedback: { text, tone }
  const noteTimer = useRef(0);
  const say = (text, tone = "good") => {
    setNote({ text, tone });
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(null), 4200);
  };
  useEffect(() => () => clearTimeout(noteTimer.current), []);

  // A sheet opens or closes, or the page has loaded: the guide looks for the next step.
  const loaded = Boolean(data);
  useEffect(() => { nudgeGuide(); }, [sheet, loaded]);

  // New cheers and new prizes announce themselves once, with a sound.
  const greeted = useRef(false);
  useEffect(() => {
    if (!data || greeted.current) return;
    greeted.current = true;
    if (data.cheers?.length) sfx.notify();
  }, [data]);

  const tabs = [
    { key: "friends", label: t("together.tabs.friends", "Friends"), Icon: FaUserFriends, badge: data?.friends?.incoming?.length || 0 },
    { key: "play", label: t("together.tabs.play", "Play"), Icon: FaGamepad, badge: data?.matches?.yourTurn?.length || 0 },
    { key: "team", label: t("together.tabs.team", "My team"), Icon: FaFlag, badge: data?.teams?.filter((x) => x.ceremony?.isNew).length || 0 },
    { key: "prizes", label: t("together.tabs.prizes", "Prizes"), Icon: FaTrophy, badge: data?.trophies?.awards?.filter((a) => a.isNew).length || 0 },
  ];

  const shell = (children) => (
    <M.div className={`dash ${s.page}`} data-theme="light" initial={calm ? { opacity: 0 } : { opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={calm ? { opacity: 0 } : { opacity: 0, x: -60 }} transition={{ duration: 0.3 }}>
      <VideoBackground />
      <div className={s.shade} aria-hidden="true" />
      <div className={s.scroll}>
        <div className={s.column}>
          <header className={s.hud}>
            <button type="button" className={s.back} onClick={() => { sfx.back(); navigate("/home"); }} data-sound="none" aria-label={t("together.back", "Back")}>
              <FaArrowLeft aria-hidden="true" /><span className={s.backText}>{t("together.back", "Back")}</span>
            </button>
            <span className={s.hudIcon} aria-hidden="true"><FaUserFriends /></span>
            <span className={s.hudText}>
              <h1 className={s.title}>{t("together.title", "Together")}</h1>
              <span className={s.subtitle}>{t("together.subtitle", "Learn with friends and your team. Everybody wins.")}</span>
            </span>
          </header>
          {children}
        </div>
      </div>
    </M.div>
  );

  if (!signedIn() || error === "signin") {
    return shell(
      <section className={`${s.card} ${s.center}`}>
        <Mascot size={120} mood="wave" />
        <h2 className={s.h2}>{t("together.signin.title", "Sign in to play together")}</h2>
        <p className={s.muted}>{t("together.signin.text", "Your friends, your team and your prizes are waiting inside.")}</p>
        <button type="button" className={s.cta} onClick={() => navigate("/login")}>{t("together.signin.cta", "Sign in")}</button>
      </section>,
    );
  }
  if (loading && !data) {
    return shell(<section className={`${s.card} ${s.center}`} role="status"><Mascot size={110} mood="think" /><p className={s.muted}>{t("together.loading", "Finding your friends…")}</p></section>);
  }
  if (!data) {
    return shell(
      <section className={`${s.card} ${s.center}`}>
        <Mascot size={110} mood="think" />
        <p className={s.muted}>{t("together.offline", "We could not reach Learnigo just now.")}</p>
        <button type="button" className={s.soft} onClick={reload}>{t("together.retry", "Try again")}</button>
      </section>,
    );
  }

  const { me } = data;
  const act = async (fn, okText) => {
    const r = await fn();
    if (r.ok) { if (okText) say(okText); return r; }
    sfx.error();
    say(r.message || t("together.oops", "That did not work. Please try again."), "alert");
    return r;
  };

  return shell(
    <>
      <NextUp data={data} w={w} t={t} guide={guide}
        onPlay={(m) => { sfx.forward(); navigate(`/together/round/${m.id}`); }}
        onAward={() => setTab("team")} />

      <PlayerCard me={me} jar={data.jar} w={w} t={t} onEdit={() => setSheet({ kind: "card" })} say={say} />

      <AnimatedCheers cheers={data.cheers} w={w} t={t} onSeen={async (ids) => { await tg("/cheers/seen", { method: "POST", body: { ids } }); patch({ cheers: [] }); }} />

      <TabBar tabs={tabs} active={tab} onChange={setTab} idPrefix="tg" label={t("together.title", "Together")} variant="seg" className={s.tabs} />

      <section className={s.panel} role="tabpanel" id={`tg-panel-${tab}`} aria-labelledby={`tg-tab-${tab}`}>
        {tab === "friends" && (
          <FriendsPanel data={data} w={w} t={t} guide={guide}
            onAdd={() => setSheet({ kind: "add" })}
            onAccept={(f) => act(() => tg(`/friends/${f.id}/accept`, { method: "POST" })).then((r) => { if (r.ok) { patch({ friends: pickFriends(r) }); sfx.correct(); say(r.status === "awaiting_adult" ? t("together.friends.askedAdult", "Nice! A grown-up will say yes first.") : t("together.friends.nowFriends", "You are friends now!")); } })}
            onRemove={(f) => act(() => tg(`/friends/${f.id}`, { method: "DELETE" })).then((r) => { if (r.ok) patch({ friends: pickFriends(r) }); })}
            onSuggest={(p) => act(() => tg("/friends", { method: "POST", body: { cardId: p.id } }), t("together.friends.asked", "Asked! They will see it next time.")).then((r) => { if (r.ok) patch({ friends: pickFriends(r), suggested: data.suggested.filter((x) => x.id !== p.id) }); })}
            onCheer={(f) => setSheet({ kind: "cheer", to: f })}
            onPlay={(f) => setSheet({ kind: "round", friend: f })}
          />
        )}
        {tab === "play" && (
          <PlayPanel data={data} w={w} t={t} guide={guide}
            onOpen={(m) => { sfx.forward(); navigate(`/together/round/${m.id}`); }}
            onNew={() => setSheet({ kind: "round" })}
            onMystery={() => setSheet({ kind: "round", mystery: true })}
            onSwitchMystery={() => act(() => tg("/me", { method: "PATCH", body: { mystery: true } })).then((r) => { if (r.ok) patch({ me: r.me }); })}
          />
        )}
        {tab === "team" && <TeamPanel teams={data.teams} w={w} t={t} onCheer={(p) => setSheet({ kind: "cheer", to: { ...p, cardId: p.id } })} onSeen={() => tg("/trophies/seen", { method: "POST" })} />}
        {tab === "prizes" && <PrizePanel trophies={data.trophies} w={w} t={t} onSeen={() => tg("/trophies/seen", { method: "POST" })} />}
      </section>

      <FramerMotion.AnimatePresence>
        {note && (
          <M.p key={note.text} className={`${s.note} ${note.tone === "alert" ? s.noteAlert : ""}`} role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}>
            {note.text}
          </M.p>
        )}
      </FramerMotion.AnimatePresence>

      {sheet?.kind === "card" && <CardSheet me={me} w={w} t={t} onClose={() => setSheet(null)} onSaved={(next) => { patch({ me: next }); setSheet(null); say(t("together.card.saved", "Looking good!")); }} />}
      {sheet?.kind === "add" && <AddSheet t={t} onClose={() => setSheet(null)} onDone={(r) => { patch({ friends: pickFriends(r) }); setSheet(null); sfx.correct(); say(r.status === "active" ? t("together.friends.nowFriends", "You are friends now!") : r.status === "awaiting_adult" ? t("together.friends.askedAdult", "Nice! A grown-up will say yes first.") : t("together.friends.asked", "Asked! They will see it next time.")); }} />}
      {sheet?.kind === "cheer" && <CheerSheet to={sheet.to} w={w} t={t} onClose={() => setSheet(null)} onSent={(left) => { setSheet(null); sfx.star(); haptic("light"); say(t("together.cheer.sent", { defaultValue_one: "Cheer sent! {{count}} left today.", defaultValue_other: "Cheer sent! {{count}} left today.", count: left })); }} />}
      {sheet?.kind === "round" && <RoundSheet friends={data.friends.friends} preset={sheet.friend} mystery={sheet.mystery} w={w} t={t} onClose={() => setSheet(null)} onMade={(m) => { setSheet(null); sfx.forward(); navigate(`/together/round/${m.id}`); }} />}
    </>,
  );
}

// What is waiting for this learner, first on the page and one tap away: a round a friend
// has played, or a team award that has just arrived.
function NextUp({ data, w, t, guide, onPlay, onAward }) {
  const turn = data.matches.yourTurn[0];
  const award = data.teams.find((x) => x.ceremony?.isNew);
  if (!turn && !award) return null;
  if (turn) {
    const name = turn.with ? w.who(turn.with) : t("together.play.mystery", "Mystery Explorer");
    return (
      <M.section className={`${s.card} ${s.nextUp}`} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} aria-label={t("together.next.label", "Waiting for you")}>
        <Avatar who={turn.with || { avatar: "star" }} size={52} />
        <span className={s.nextText}><b>{t("together.next.turn", { defaultValue: "{{name}} has played. Your turn!", name })}</b><small>{w.subject(turn.subject)} · {w.module(turn.module)}</small></span>
        <button type="button" className={s.cta} onClick={() => onPlay(turn)} data-sound="none" {...guide("together.turnTop", "{{name}} has played a round for you. Tap Play!", { order: 1, name })}><FaPlay aria-hidden="true" /> {t("together.play.go", "Play")}</button>
      </M.section>
    );
  }
  return (
    <M.section className={`${s.card} ${s.nextUp} ${s.nextGold}`} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} aria-label={t("together.next.label", "Waiting for you")}>
      <span className={s.nextEmoji} aria-hidden="true">🏆</span>
      <span className={s.nextText}><b>{t("together.next.award", { defaultValue: "“{{title}}” has finished. Your award is here!", title: award.title })}</b></span>
      <button type="button" className={s.cta} onClick={onAward} {...guide("together.award", "Your team has finished. Tap to see your award!", { order: 1 })}>{t("together.next.see", "See it")}</button>
    </M.section>
  );
}

const pickFriends = (r) => ({ friends: r.friends, incoming: r.incoming, outgoing: r.outgoing, awaiting: r.awaiting });

// ── The player card: who I am to others, my friend code, and the friends' star jar ──
function PlayerCard({ me, jar, w, t, onEdit, say }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(me.code); setCopied(true); sfx.select(); setTimeout(() => setCopied(false), 1800); } catch { say(me.code); }
  };
  const share = async () => {
    const text = t("together.card.shareText", { defaultValue: "Be my friend on Learnigo! My friend code is {{code}}.", code: me.code });
    try { if (navigator.share) await navigator.share({ text }); else await copy(); } catch { /* closed the share sheet */ }
  };
  return (
    <section className={`${s.card} ${s.player}`} aria-label={t("together.card.label", "My player card")}>
      <div className={s.playerMe}>
        <Avatar who={me} size={76} ring />
        <div className={s.playerText}>
          <span className={s.playerName}>{me.name || w.nick(me.nick)}</span>
          {me.name && <span className={s.playerNick}>{w.nick(me.nick)}</span>}
          <button type="button" className={s.linkBtn} onClick={onEdit} data-sound="open"><FaPen aria-hidden="true" /> {t("together.card.edit", "Change my look")}</button>
        </div>
      </div>
      {me.can.friends ? (
        <div className={s.code}>
          <span className={s.codeLabel}>{t("together.card.code", "My friend code")}</span>
          <span className={s.codeValue} aria-label={me.code.split("").join(" ")}>{me.code.split("").map((ch, i) => <span key={i} className={s.codeCh}>{ch}</span>)}</span>
          <span className={s.codeActions}>
            <button type="button" className={s.chip} onClick={copy} data-sound="none">{copied ? <FaCheck aria-hidden="true" /> : <FaCopy aria-hidden="true" />} {copied ? t("together.card.copied", "Copied") : t("together.card.copy", "Copy")}</button>
            {typeof navigator !== "undefined" && navigator.share && <button type="button" className={s.chip} onClick={share}><FaShareAlt aria-hidden="true" /> {t("together.card.share", "Share")}</button>}
          </span>
        </div>
      ) : (
        <p className={s.offNote}>{me.off.friends === "adult" ? t("together.off.friendsAdult", "A grown-up has switched friends off for now. You can still play and learn.") : t("together.off.friendsMe", "You switched friends off. Change it in “Change my look”.")}</p>
      )}
      <Jar jar={jar} t={t} />
    </section>
  );
}

// The friends' star jar: one shared total this week, and the next mark.
function Jar({ jar, t }) {
  const calm = useCalmMotion();
  const top = jar.marks[jar.marks.length - 1].at;
  const fill = Math.min(1, jar.stars / top);
  const alone = jar.friends === 0;
  return (
    <div className={s.jar} title={t("together.jar.title", "Every star you and your friends earn this week goes in the jar.")}>
      <span className={s.jarGlass} aria-hidden="true">
        <M.span className={s.jarFill} style={{ originY: 1 }} initial={calm ? false : { scaleY: 0 }} animate={{ scaleY: Math.max(0.04, fill) }} transition={{ type: "spring", bounce: 0.2, duration: 1.1 }} />
        <span className={s.jarStar}>⭐</span>
      </span>
      <span className={s.jarText}>
        <span className={s.jarCount}>{jar.stars}</span>
        <span className={s.jarLabel}>
          {alone ? t("together.jar.alone", "stars this week. Add a friend to fill the jar together!")
            : jar.next ? t("together.jar.next", { defaultValue: "stars in our jar. {{left}} more for the next sticker!", left: jar.next - jar.stars })
              : t("together.jar.full", "stars in our jar. The jar is full this week!")}
        </span>
      </span>
    </div>
  );
}

// Cheers that arrived since last time: one card each, then "Thanks!".
function AnimatedCheers({ cheers, w, t, onSeen }) {
  if (!cheers?.length) return null;
  return (
    <M.section className={`${s.card} ${s.cheers}`} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} aria-label={t("together.cheer.inbox", "Cheers for you")}>
      <ul className={s.cheerList}>
        {cheers.slice(0, 6).map((c, i) => (
          <M.li key={c.id} className={s.cheerIn} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}>
            <span className={s.cheerSticker} aria-hidden="true">{STICKERS[c.sticker] || "⭐"}</span>
            <span><b>{w.who(c.from)}</b> {t("together.cheer.says", "says")} “{w.line(c.line)}”</span>
          </M.li>
        ))}
      </ul>
      <button type="button" className={s.soft} onClick={() => onSeen(cheers.map((c) => c.id))}><FaHeart aria-hidden="true" /> {t("together.cheer.thanks", "Thanks!")}</button>
    </M.section>
  );
}

// ── Friends ──────────────────────────────────────────────────────────────────
function FriendsPanel({ data, w, t, guide, onAdd, onAccept, onRemove, onSuggest, onCheer, onPlay }) {
  const { friends, incoming, outgoing, awaiting } = data.friends;
  const can = data.me.can;
  const [confirm, setConfirm] = useState(null);
  return (
    <div className={s.stack}>
      {incoming.length > 0 && (
        <div className={`${s.card} ${s.block}`}>
          <h2 className={s.h2}>{t("together.friends.requests", "Wants to be your friend")}</h2>
          <ul className={s.rows}>
            {incoming.map((f) => (
              <li key={f.id} className={s.row}>
                <Avatar who={f} /><span className={s.rowName}><b>{w.who(f)}</b><small>{w.nick(f.nick)}</small></span>
                <span className={s.rowActions}>
                  <button type="button" className={s.soft} onClick={() => onAccept(f)} {...guide("together.yes", "{{name}} wants to be your friend. Tap Yes!", { order: 1, name: w.who(f) })}>{t("together.friends.yes", "Yes!")}</button>
                  <button type="button" className={s.ghost} onClick={() => onRemove(f)}>{t("together.friends.notNow", "Not now")}</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`${s.card} ${s.block}`}>
        <div className={s.blockHead}>
          <h2 className={s.h2}>{t("together.friends.mine", { defaultValue: "My friends ({{count}})", count: friends.length })}</h2>
          {can.friends && <button type="button" className={s.cta} onClick={onAdd} data-sound="open" {...(friends.length ? {} : guide("together.add", "Tap Add a friend. Then type your friend's code.", { order: 3 }))}><FaPlus aria-hidden="true" /> {t("together.friends.add", "Add a friend")}</button>}
        </div>
        {friends.length === 0 ? (
          <div className={s.empty}>
            <Mascot size={96} mood="wave" butterfly={false} />
            <p>{can.friends ? t("together.friends.empty", "Tell a friend your code, or type theirs. Then you can play the same round and send each other cheers.") : t("together.friends.offEmpty", "Friends are switched off for now.")}</p>
          </div>
        ) : (
          <ul className={s.grid}>
            {friends.map((f, i) => (
              <M.li key={f.id} className={s.friend} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(0.3, i * 0.04) }}>
                <Avatar who={f} size={64} />
                <b className={s.friendName}>{w.who(f)}</b>
                <small className={s.friendNick}>{w.nick(f.nick)}</small>
                <span className={s.friendActions}>
                  {can.matches && <button type="button" className={s.soft} onClick={() => onPlay(f)} data-sound="open" {...(i === 0 ? guide("together.playFriend", "Tap Play to start a round with {{name}}.", { order: 4, name: w.who(f) }) : {})}><FaPlay aria-hidden="true" /> {t("together.friends.play", "Play")}</button>}
                  <button type="button" className={s.chip} onClick={() => onCheer(f)} data-sound="open" aria-label={t("together.cheer.to", { defaultValue: "Send {{name}} a cheer", name: w.who(f) })}><FaHeart aria-hidden="true" /> {t("together.cheer.cta", "Cheer")}</button>
                </span>
                <button type="button" className={s.tiny} onClick={() => setConfirm(f)}>{t("together.friends.remove", "Remove")}</button>
              </M.li>
            ))}
          </ul>
        )}
        {(awaiting.length > 0 || outgoing.length > 0) && (
          <ul className={s.waitList}>
            {awaiting.map((f) => <li key={f.id}><FaHourglassHalf aria-hidden="true" /> {f.mine ? t("together.friends.waitMine", { defaultValue: "{{name}}: waiting for your grown-up to say yes.", name: w.who(f) }) : t("together.friends.waitTheirs", { defaultValue: "{{name}}: waiting for their grown-up to say yes.", name: w.who(f) })}</li>)}
            {outgoing.map((f) => <li key={f.id}><FaHourglassHalf aria-hidden="true" /> {t("together.friends.waitAnswer", { defaultValue: "{{name}}: asked. Waiting for their answer.", name: w.who(f) })} <button type="button" className={s.tiny} onClick={() => onRemove(f)}>{t("together.friends.cancel", "Cancel")}</button></li>)}
          </ul>
        )}
      </div>

      {data.suggested?.length > 0 && (
        <div className={`${s.card} ${s.block}`}>
          <h2 className={s.h2}>{t("together.friends.class", "From your class")}</h2>
          <ul className={s.suggest}>
            {data.suggested.map((p) => (
              <li key={p.id}><Avatar who={p} size={44} /><span className={s.rowName}><b>{p.name}</b></span>
                <button type="button" className={s.chip} onClick={() => onSuggest(p)}><FaPlus aria-hidden="true" /> {t("together.friends.ask", "Ask")}</button></li>
            ))}
          </ul>
        </div>
      )}

      <p className={s.safe}>{t("together.safe", "Friends see your first name, your nickname and your picture. You talk with stickers and ready-made cheers only. Your grown-ups can see your friends.")}</p>

      {confirm && (
        <Sheet theme="light" size="sm" title={t("together.friends.removeTitle", { defaultValue: "Stop being friends with {{name}}?", name: w.who(confirm) })} text={t("together.friends.removeText", "You can add each other again later with a code.")} onClose={() => setConfirm(null)}
          footer={<><button type="button" className={s.ghost} onClick={() => setConfirm(null)}>{t("together.keep", "Keep")}</button><button type="button" className={s.soft} onClick={() => { onRemove(confirm); setConfirm(null); }}>{t("together.friends.remove", "Remove")}</button></>} />
      )}
    </div>
  );
}

// ── Play: rounds together ────────────────────────────────────────────────────
function PlayPanel({ data, w, t, guide, onOpen, onNew, onMystery, onSwitchMystery }) {
  const { yourTurn, waiting, done } = data.matches;
  const { can, off } = data.me;
  const place = (m) => `${SUBJECTS[m.subject]?.emoji || ""} ${w.subject(m.subject)} · ${w.module(m.module)}`;
  const withWho = (m) => (m.with ? w.who(m.with) : t("together.play.mystery", "Mystery Explorer"));
  if (!can.matches) {
    return <div className={`${s.card} ${s.center}`}><Mascot size={96} mood="idle" butterfly={false} /><p className={s.muted}>{off.matches === "adult" ? t("together.off.matchesAdult", "A grown-up has switched playing together off for now.") : t("together.off.matchesMe", "You switched playing together off. Change it in “Change my look”.")}</p></div>;
  }
  return (
    <div className={s.stack}>
      <div className={s.starts}>
        <button type="button" className={`${s.start} ${s.startFriend}`} onClick={onNew} data-sound="open" disabled={!data.friends.friends.length} {...(yourTurn.length ? {} : guide("together.new", "Tap the green button to play a round with a friend.", { order: 3 }))}>
          <span className={s.startEmoji} aria-hidden="true">🤝</span>
          <span><b>{t("together.play.friend", "Play with a friend")}</b><small>{data.friends.friends.length ? t("together.play.friendText", "The same round for you both. Play when it suits you.") : t("together.play.needFriend", "Add a friend first, then play the same round.")}</small></span>
        </button>
        {can.mystery ? (
          <button type="button" className={`${s.start} ${s.startMystery}`} onClick={onMystery} data-sound="open">
            <span className={s.startEmoji} aria-hidden="true">🕵️</span>
            <span><b>{t("together.play.mysteryCta", "Meet a mystery explorer")}</b><small>{t("together.play.mysteryText", "A round with someone new at your level. Nicknames only.")}</small></span>
          </button>
        ) : (
          <div className={`${s.start} ${s.startOff}`}>
            <span className={s.startEmoji} aria-hidden="true"><FaUserSecret /></span>
            <span><b>{t("together.play.mysteryCta", "Meet a mystery explorer")}</b>
              <small>{off.mystery === "adult" ? t("together.off.mysteryAdult", "A grown-up can switch this on for you.") : t("together.off.mysteryMe", "Play a round with someone new. They only ever see your nickname.")}</small></span>
            {off.mystery === "me" && <button type="button" className={s.chip} onClick={onSwitchMystery}>{t("together.play.switchOn", "Switch on")}</button>}
          </div>
        )}
      </div>

      {yourTurn.length > 0 && (
        <div className={`${s.card} ${s.block}`}>
          <h2 className={s.h2}>{t("together.play.yourTurn", "Your turn")}</h2>
          <ul className={s.rows}>
            {yourTurn.map((m, i) => (
              <li key={m.id} className={s.row}>
                <Avatar who={m.with || { avatar: "star" }} />
                <span className={s.rowName}><b>{m.kind === "buddy" ? t("together.play.buddyWith", { defaultValue: "Buddy round with {{name}}", name: withWho(m) }) : t("together.play.matchWith", { defaultValue: "Friendly match with {{name}}", name: withWho(m) })}</b><small>{place(m)} · {t("together.play.questions", { defaultValue_one: "{{count}} question", defaultValue_other: "{{count}} questions", count: m.size })}</small></span>
                <button type="button" className={s.cta} onClick={() => onOpen(m)} data-sound="none" {...(i === 0 ? guide("together.turn", "It is your turn! Tap Play.", { order: 2 }) : {})}><FaPlay aria-hidden="true" /> {t("together.play.go", "Play")}</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {waiting.length > 0 && (
        <div className={`${s.card} ${s.block}`}>
          <h2 className={s.h2}>{t("together.play.waiting", "Waiting for your friend")}</h2>
          <ul className={s.rows}>
            {waiting.map((m) => (
              <li key={m.id} className={s.row}>
                <Avatar who={m.with || { avatar: "star" }} />
                <span className={s.rowName}><b>{withWho(m)}</b><small>{place(m)} · {t("together.play.youGot", { defaultValue: "You got {{stars}} of {{total}}", stars: m.me.stars, total: m.me.total })}</small></span>
                <span className={s.pillWait}><FaHourglassHalf aria-hidden="true" /> {t("together.play.theirTurn", "Their turn")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {done.length > 0 && (
        <div className={`${s.card} ${s.block}`}>
          <h2 className={s.h2}>{t("together.play.done", "Finished together")}</h2>
          <ul className={s.rows}>
            {done.map((m) => (
              <li key={m.id} className={s.row}>
                <Avatar who={m.with || { avatar: "star" }} />
                <span className={s.rowName}><b>{withWho(m)}</b><small>{place(m)}</small></span>
                <button type="button" className={s.result} onClick={() => onOpen(m)} data-sound="none">
                  {m.kind === "buddy"
                    ? <>🤝 {t("together.play.together", { defaultValue: "{{stars}} stars together", stars: m.result.together })}</>
                    : <>{w.prize(m.result.prize).emoji} {m.me.stars} · {m.them.stars} {w.prize(m.result.theirPrize).emoji}</>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!yourTurn.length && !waiting.length && !done.length && (
        <div className={`${s.card} ${s.center}`}><Mascot size={96} mood="wave" butterfly={false} /><p className={s.muted}>{t("together.play.empty", "No rounds yet. Start one with a friend: you both get the same questions and all your stars.")}</p></div>
      )}
      <p className={s.safe}>{t("together.play.rules", "There is no clock. You both keep every star you earn. A draw means a ribbon for both.")}</p>
    </div>
  );
}

// ── My team ──────────────────────────────────────────────────────────────────
function TeamPanel({ teams, w, t, onCheer, onSeen }) {
  const calm = useCalmMotion();
  const hasNew = teams.some((x) => x.ceremony?.isNew);
  useEffect(() => {
    if (!hasNew) return undefined;
    sfx.levelUp();
    const id = setTimeout(onSeen, 1500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNew]);
  if (!teams.length) {
    return <div className={`${s.card} ${s.center}`}><Mascot size={110} mood="idle" /><h2 className={s.h2}>{t("together.team.emptyTitle", "No team match right now")}</h2><p className={s.muted}>{t("together.team.empty", "When your teacher starts a team match or a class quest, your team shows up here. Every right answer adds a star for your team.")}</p></div>;
  }
  return (
    <div className={s.stack}>
      {teams.map((m) => {
        const mine = m.teams.find((x) => x.key === m.myTeam);
        const ended = m.status === "ended";
        return (
          <article key={m.id} className={`${s.card} ${s.block} ${s.match}`} style={{ "--team": mine.color }}>
            <div className={s.blockHead}>
              <h2 className={s.h2}>{m.kind === "quest" ? "🧭" : "🏁"} {m.title}</h2>
              <span className={ended ? s.pillDone : s.pillLive}>{ended ? t("together.team.ended", "Finished") : m.daysLeft <= 1 ? t("together.team.lastDay", "Last day") : t("together.team.daysLeft", { defaultValue_one: "{{count}} day to go", defaultValue_other: "{{count}} days to go", count: m.daysLeft })}</span>
            </div>

            {ended && m.ceremony && (
              <M.div className={s.ceremony} initial={calm ? false : { scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.35, duration: 0.7 }}>
                {m.ceremony.isNew && !calm && <span className={s.confetti} aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ "--i": i }} />)}</span>}
                <span className={s.ceremonyPrizes}>
                  {m.ceremony.trophy && <span className={s.bigPrize} title={w.prize("trophy").name}>🏆</span>}
                  {m.ceremony.firstFlag && <span className={s.bigPrize} title={w.prize("first_flag").name}>🚩</span>}
                  <span className={s.bigPrize}>{w.award(m.ceremony.award).emoji}</span>
                </span>
                <span className={s.ceremonyText}>
                  <b>{t("together.team.yourAward", { defaultValue: "Your award: {{name}}", name: w.award(m.ceremony.award).name })}</b>
                  <span>{w.awardText(m.ceremony.award, m.ceremony.evidence)}</span>
                  {m.ceremony.trophy && <span>{t("together.team.trophy", { defaultValue: "{{team}} reached the goal. A trophy for everyone on the team!", team: w.team(m.myTeam) })}</span>}
                </span>
              </M.div>
            )}

            <ul className={s.teamBars}>
              {m.teams.map((tm) => (
                <li key={tm.key} className={`${s.teamRow} ${tm.key === m.myTeam ? s.teamMine : ""}`}>
                  <span className={s.teamName}><span aria-hidden="true">{tm.emoji}</span> {m.teams.length === 1 ? t("together.team.class", "Our class") : w.team(tm.key)}{tm.key === m.myTeam && m.teams.length > 1 && <em>{t("together.team.mine", "my team")}</em>}</span>
                  <Bar value={tm.progress} color={tm.color} flag label={`${w.team(tm.key)}: ${tm.stars} / ${tm.goal}`} />
                  <span className={s.teamStars}>{tm.reached ? <>🏆 {t("together.team.reached", "Goal reached!")}</> : <>⭐ {tm.stars} / {tm.goal}</>}</span>
                </li>
              ))}
            </ul>

            {!ended && (
              <p className={s.added}>
                {m.iAdded > 0 ? t("together.team.added", { defaultValue_one: "You have added {{count}} star. Thank you!", defaultValue_other: "You have added {{count}} stars. Thank you!", count: m.iAdded }) : t("together.team.addFirst", "Play any round: every right answer adds a star for your team.")}
              </p>
            )}

            {m.mates?.length > 0 && (
              <div className={s.mates}>
                <span className={s.matesLabel}>{t("together.team.mates", "Team-mates")}</span>
                <ul>
                  {m.mates.map((p) => (
                    <li key={p.id}><button type="button" className={s.mate} onClick={() => onCheer(p)} data-sound="open" aria-label={t("together.cheer.to", { defaultValue: "Send {{name}} a cheer", name: w.who(p) })}><Avatar who={p} size={40} /><span>{w.who(p)}</span><FaHeart aria-hidden="true" /></button></li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        );
      })}
      <p className={s.safe}>{t("together.team.rules", "Every team that reaches its goal wins a trophy, and everyone gets an award. Up to 20 stars a day count, so a little each day is the best way to help.")}</p>
    </div>
  );
}

// ── Prizes ───────────────────────────────────────────────────────────────────
function PrizePanel({ trophies, w, t, onSeen }) {
  const hasNew = trophies.awards.some((a) => a.isNew);
  useEffect(() => {
    if (!hasNew) return undefined;
    const id = setTimeout(onSeen, 1200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNew]);
  if (!trophies.awards.length) {
    return <div className={`${s.card} ${s.center}`}><Mascot size={110} mood="idle" /><h2 className={s.h2}>{t("together.prizes.emptyTitle", "Your prize shelf")}</h2><p className={s.muted}>{t("together.prizes.empty", "Ribbons, team trophies and awards land here when you learn with friends and your team. Nothing is ever taken away.")}</p></div>;
  }
  const fmt = (d) => { try { return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(new Date(d)); } catch { return ""; } };
  return (
    <div className={`${s.card} ${s.block}`}>
      <h2 className={s.h2}>{t("together.prizes.title", { defaultValue: "My prizes ({{count}})", count: trophies.total })}</h2>
      <ul className={s.prizes}>
        {trophies.awards.map((a, i) => {
          const isAward = a.kind === "award";
          const head = isAward ? w.award(a.award) : w.prize(a.kind);
          const text = isAward ? w.awardText(a.award, a.evidence) : w.prizeText(a.kind, a.evidence);
          return (
            <M.li key={a.id} className={`${s.prize} ${a.isNew ? s.prizeNew : ""}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(0.4, i * 0.03), type: "spring", bounce: 0.3, duration: 0.5 }}>
              <span className={s.prizeEmoji} aria-hidden="true">{head.emoji}</span>
              <b>{head.name}</b>
              <small>{text}</small>
              <time dateTime={a.earnedAt}>{fmt(a.earnedAt)}</time>
            </M.li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Sheets ───────────────────────────────────────────────────────────────────
function Switch({ on, onChange, label, hint, locked, t }) {
  return (
    <label className={`${s.switch} ${locked ? s.switchLocked : ""}`}>
      <input type="checkbox" checked={Boolean(on) && !locked} disabled={locked} onChange={(e) => { sfx.toggle(e.target.checked); onChange(e.target.checked); }} />
      <span><b>{label}</b><small>{locked ? t("together.card.locked", "A grown-up has switched this off.") : hint}</small></span>
    </label>
  );
}

function CardSheet({ me, w, t, onClose, onSaved }) {
  const [opts, setOpts] = useState(null);
  const [draft, setDraft] = useState({ nickA: me.nick.a, nickN: me.nick.n, avatar: me.avatar, friends: me.switches.friends, matches: me.switches.matches, mystery: me.switches.mystery });
  const [busy, setBusy] = useState(false);
  useEffect(() => { tg("/options").then((r) => { if (r.ok) setOpts(r); }); }, []);
  const save = async () => {
    setBusy(true);
    const r = await tg("/me", { method: "PATCH", body: draft });
    setBusy(false);
    if (r.ok) onSaved(r.me);
  };
  return (
    <Sheet theme="light" title={t("together.card.editTitle", "My player card")} text={t("together.card.editText", "This is what friends see. Pick a picture and two words.")} onClose={onClose}
      footer={<><button type="button" className={s.ghost} onClick={onClose}>{t("together.cancel", "Cancel")}</button><button type="button" className={s.soft} onClick={save} disabled={busy}>{t("together.save", "Save")}</button></>}>
      <div className={s.preview}><Avatar who={{ avatar: draft.avatar }} size={72} ring /><b>{w.nick({ a: draft.nickA, n: draft.nickN, text: `${draft.nickA} ${draft.nickN}` })}</b></div>
      {!opts ? <p className={s.muted} role="status">{t("together.loadingShort", "Loading…")}</p> : (
        <>
          <fieldset className={s.field}>
            <legend>{t("together.card.picture", "My picture")}</legend>
            <div className={s.avatarGrid}>
              {opts.avatars.map((a) => (
                <button key={a} type="button" className={`${s.avatarPick} ${draft.avatar === a ? s.avatarOn : ""}`} aria-pressed={draft.avatar === a} aria-label={a} onClick={() => setDraft({ ...draft, avatar: a })} data-sound="none" onPointerDown={() => sfx.pop()}>
                  <Avatar who={{ avatar: a }} size={44} />
                </button>
              ))}
            </div>
          </fieldset>
          <div className={s.two}>
            <label className={s.field}><span>{t("together.card.word1", "First word")}</span>
              <select value={draft.nickA} onChange={(e) => setDraft({ ...draft, nickA: e.target.value })}>{opts.nickA.map((a) => <option key={a} value={a}>{t(`together.nick.a.${a}`, a.charAt(0).toUpperCase() + a.slice(1))}</option>)}</select></label>
            <label className={s.field}><span>{t("together.card.word2", "Second word")}</span>
              <select value={draft.nickN} onChange={(e) => setDraft({ ...draft, nickN: e.target.value })}>{opts.nickN.map((n) => <option key={n} value={n}>{t(`together.nick.n.${n}`, n.charAt(0).toUpperCase() + n.slice(1))}</option>)}</select></label>
          </div>
          <fieldset className={s.field}>
            <legend>{t("together.card.switches", "What I want to do")}</legend>
            <Switch on={draft.friends} onChange={(v) => setDraft({ ...draft, friends: v })} t={t} label={t("together.card.swFriends", "Friends")} hint={t("together.card.swFriendsHint", "Add friends with a code and send cheers.")} locked={me.off.friends === "adult"} />
            <Switch on={draft.matches} onChange={(v) => setDraft({ ...draft, matches: v })} t={t} label={t("together.card.swMatches", "Play together")} hint={t("together.card.swMatchesHint", "Play the same round as a friend.")} locked={me.off.matches === "adult"} />
            <Switch on={draft.mystery} onChange={(v) => setDraft({ ...draft, mystery: v })} t={t} label={t("together.card.swMystery", "Meet a mystery explorer")} hint={t("together.card.swMysteryHint", "A round with someone new. They only see my nickname.")} locked={me.off.mystery === "adult"} />
          </fieldset>
        </>
      )}
    </Sheet>
  );
}

function AddSheet({ t, onClose, onDone }) {
  const guide = useGuide();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const send = async (e) => {
    e?.preventDefault();
    if (clean.length < 6) return;
    setBusy(true); setErr("");
    const r = await tg("/friends", { method: "POST", body: { code: clean } });
    setBusy(false);
    if (r.ok) onDone(r);
    else { sfx.wrong(); setErr(r.code === "OWN_CODE" ? t("together.add.own", "That is your own code. Share it with a friend!") : r.code === "FRIENDS_FULL" ? r.message : r.status === 429 ? t("together.add.slow", "Wait a minute, then check the code with your friend.") : t("together.add.none", "That code did not match anyone. Check it with your friend.")); }
  };
  return (
    <Sheet theme="light" size="sm" title={t("together.add.title", "Add a friend")} text={t("together.add.text", "Ask your friend for their code. It has 6 letters and numbers.")} onClose={onClose}
      footer={<><button type="button" className={s.ghost} onClick={onClose}>{t("together.cancel", "Cancel")}</button><button type="button" className={s.soft} onClick={send} disabled={busy || clean.length < 6}>{t("together.add.cta", "Ask to be friends")}</button></>}>
      <form onSubmit={send}>
        <label className={s.field}><span>{t("together.add.label", "Friend code")}</span>
          <input className={s.codeInput} {...guide("together.code", "Type your friend's code here. It has 6 letters and numbers.", { order: 1 })} value={clean} onChange={(e) => { setCode(e.target.value); setErr(""); }} inputMode="text" autoCapitalize="characters" autoCorrect="off" autoComplete="off" spellCheck={false} maxLength={8} placeholder="ABC234" aria-invalid={Boolean(err)} aria-describedby={err ? "tg-add-err" : undefined} />
        </label>
        {err && <p id="tg-add-err" className={s.err} role="alert">{err}</p>}
      </form>
    </Sheet>
  );
}

function CheerSheet({ to, w, t, onClose, onSent }) {
  const guide = useGuide();
  const [sticker, setSticker] = useState("star");
  const [line, setLine] = useState("great_job");
  const [err, setErr] = useState("");
  const send = async () => {
    const r = await tg("/cheers", { method: "POST", body: { to: to.cardId || to.id, sticker, line } });
    if (r.ok) onSent(r.left);
    else setErr(r.code === "CHEER_LIMIT" ? t("together.cheer.limit", "You have sent all of today's cheers. More tomorrow!") : r.message || t("together.oops", "That did not work. Please try again."));
  };
  return (
    <Sheet theme="light" size="sm" title={t("together.cheer.title", { defaultValue: "A cheer for {{name}}", name: w.who(to) })} onClose={onClose}
      footer={<><button type="button" className={s.ghost} onClick={onClose}>{t("together.cancel", "Cancel")}</button><button type="button" className={s.soft} onClick={send} {...guide("together.send", "Pick a sticker and what to say. Then tap Send.", { order: 1 })}>{STICKERS[sticker]} {t("together.cheer.send", "Send")}</button></>}>
      <fieldset className={s.field}><legend>{t("together.cheer.pickSticker", "Pick a sticker")}</legend>
        <div className={s.stickers}>{Object.entries(STICKERS).map(([k, e]) => <button key={k} type="button" className={`${s.stickerPick} ${sticker === k ? s.stickerOn : ""}`} aria-pressed={sticker === k} aria-label={k} onClick={() => setSticker(k)} data-sound="none" onPointerDown={() => sfx.pop()}>{e}</button>)}</div>
      </fieldset>
      <fieldset className={s.field}><legend>{t("together.cheer.pickLine", "Pick what to say")}</legend>
        <div className={s.lines}>{Object.keys(CHEER_LINES).map((k) => <button key={k} type="button" className={`${s.linePick} ${line === k ? s.lineOn : ""}`} aria-pressed={line === k} onClick={() => setLine(k)}>{w.line(k)}</button>)}</div>
      </fieldset>
      {err && <p className={s.err} role="alert">{err}</p>}
    </Sheet>
  );
}

function RoundSheet({ friends, preset, mystery, w, t, onClose, onMade }) {
  const guide = useGuide();
  const [friend, setFriend] = useState(preset?.cardId || friends[0]?.cardId || "");
  const [kind, setKind] = useState("buddy");
  const [subject, setSubject] = useState("maths");
  const [module, setModule] = useState("read");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const make = async () => {
    setBusy(true); setErr("");
    const r = mystery ? await tg("/matches/mystery", { method: "POST", body: { subject, module } }) : await tg("/matches", { method: "POST", body: { friendId: friend, kind, subject, module } });
    setBusy(false);
    if (r.ok) onMade(r.match); else setErr(r.message || t("together.oops", "That did not work. Please try again."));
  };
  return (
    <Sheet theme="light" title={mystery ? t("together.play.mysteryCta", "Meet a mystery explorer") : t("together.play.friend", "Play with a friend")} text={t("together.round.text", "You both get the same questions. No clock: play when it suits you.")} onClose={onClose}
      footer={<><button type="button" className={s.ghost} onClick={onClose}>{t("together.cancel", "Cancel")}</button><button type="button" className={s.cta} onClick={make} disabled={busy || (!mystery && !friend)} {...guide("together.start", "Pick a world. Then tap Start.", { order: 1 })}><FaPlay aria-hidden="true" /> {t("together.round.start", "Start")}</button></>}>
      {!mystery && (
        <>
          <fieldset className={s.field}><legend>{t("together.round.who", "Who with?")}</legend>
            <div className={s.pickRow}>{friends.map((f) => <button key={f.cardId} type="button" className={`${s.pick} ${friend === f.cardId ? s.pickOn : ""}`} aria-pressed={friend === f.cardId} onClick={() => setFriend(f.cardId)}><Avatar who={f} size={40} /> {w.who(f)}</button>)}</div>
          </fieldset>
          <fieldset className={s.field}><legend>{t("together.round.how", "How?")}</legend>
            <div className={s.pickRow}>
              <button type="button" className={`${s.pick} ${s.pickTall} ${kind === "buddy" ? s.pickOn : ""}`} aria-pressed={kind === "buddy"} onClick={() => setKind("buddy")}><span aria-hidden="true">🤝</span><span><b>{t("together.round.buddy", "Buddy round")}</b><small>{t("together.round.buddyText", "Add your stars together.")}</small></span></button>
              <button type="button" className={`${s.pick} ${s.pickTall} ${kind === "friendly" ? s.pickOn : ""}`} aria-pressed={kind === "friendly"} onClick={() => setKind("friendly")}><span aria-hidden="true">🎀</span><span><b>{t("together.round.friendly", "Friendly match")}</b><small>{t("together.round.friendlyText", "Side by side. Prizes for both.")}</small></span></button>
            </div>
          </fieldset>
        </>
      )}
      <fieldset className={s.field}><legend>{t("together.round.subject", "Which world?")}</legend>
        <div className={s.pickRow}>{Object.entries(SUBJECTS).map(([k, v]) => <button key={k} type="button" className={`${s.pick} ${subject === k ? s.pickOn : ""}`} style={{ "--pick": v.color }} aria-pressed={subject === k} onClick={() => setSubject(k)}><span aria-hidden="true">{v.emoji}</span> {w.subject(k)}</button>)}</div>
      </fieldset>
      <fieldset className={s.field}><legend>{t("together.round.module", "What kind?")}</legend>
        <div className={s.pickRow}>{Object.entries(MODULES).map(([k, v]) => <button key={k} type="button" className={`${s.pick} ${module === k ? s.pickOn : ""}`} aria-pressed={module === k} onClick={() => setModule(k)}><span aria-hidden="true">{v.emoji}</span> {w.module(k)}</button>)}</div>
      </fieldset>
      {err && <p className={s.err} role="alert">{err}</p>}
    </Sheet>
  );
}
