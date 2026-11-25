import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import * as FramerMotion from "framer-motion";
import { FaArrowLeft, FaStar, FaHeart, FaRedo, FaUserFriends } from "react-icons/fa";
import "../../components/dashboard/tokens.css";
import VideoBackground from "../../components/VideoBackground/VideoBackground";
import QuestionCard from "../../components/QuestionCard/QuestionCard";
import ProgressBar from "../../components/ProgressBar/ProgressBar";
import Mascot from "../../components/Mascot/Mascot";
import { useVoiceBarHost } from "../../components/VoiceBar/useNarration";
import { logDashboardAnswer, logDashboardSession, logRoundResult } from "../../store/slices/dashboardSlice";
import { getQuestionLang } from "../../utils/questionLang";
import { useCalmMotion } from "../../utils/useCalmMotion";
import { sfx, haptic } from "../../utils/sounds";
import mp from "../../components/ModulePlayer/ModulePlayer.module.css";
import { tg } from "./api";
import { Avatar } from "./Together";
import { STICKERS, words } from "./words";
import s from "./MatchRound.module.css";
import { useGuide } from "../../components/guide/useGuide";
import { nudgeGuide } from "../../components/guide/nudge";

const M = FramerMotion.motion;
const describe = (v) => (typeof v === "string" ? v : JSON.stringify(v ?? ""));

/**
 * A round played together (/together/round/:id): the same questions as a friend, each in
 * their own time, on the same screen as any other round. There is no clock. When it ends
 * the stars are sent once, and the result shows as soon as both have played.
 */
export default function MatchRound() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const w = useMemo(() => words(t), [t]);
  const calm = useCalmMotion();
  useVoiceBarHost(true);

  const [match, setMatch] = useState(null);
  const [items, setItems] = useState(null);
  const [state, setState] = useState("loading"); // loading | playing | result | gone
  const [idx, setIdx] = useState(0);
  const [stars, setStars] = useState(0);
  const results = useRef([]);
  const startedAt = useRef(0);
  const questionAt = useRef(0);
  const xp = useRef(0);

  useEffect(() => {
    let live = true;
    (async () => {
      const r = await tg(`/matches/${id}`);
      if (!live) return;
      if (!r.ok) { setState("gone"); return; }
      setMatch(r.match);
      if (r.match.status !== "your_turn") { setState("result"); return; }
      const p = await tg(`/matches/${id}/play?lang=${encodeURIComponent(getQuestionLang(i18n.language))}`);
      if (!live) return;
      if (!p.ok || !p.items?.length) { setState(p.code === "PLAYED" ? "result" : "gone"); return; }
      setItems(p.items);
      startedAt.current = Date.now();
      questionAt.current = Date.now();
      setState("playing");
    })();
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => { if (state === "result") nudgeGuide(); }, [state]);

  const current = items?.[idx];
  const subject = match?.subject;
  const module = match?.module;

  // One answer: counted for the round, and logged like any other answer so it counts for
  // the learner's own learning (and their team's stars).
  const onAnswered = (o) => {
    const q = current;
    const correct = Boolean(o.correct);
    const pts = correct ? (q?.points || 10) : 0;
    xp.current += pts;
    results.current.push({ id: q.id, correct, firstTry: Boolean(o.firstTry) });
    if (correct) setStars((n) => n + 1);
    const minutes = Math.round(Math.min(3, Math.max(0, (Date.now() - questionAt.current) / 60000)) * 100) / 100;
    dispatch(logDashboardSession({ kind: "answer", module, subject, durationMinutes: minutes, xpEarned: pts, score: correct ? 100 : 0, startTime: new Date(questionAt.current).toISOString() }));
    dispatch(logDashboardAnswer({
      module, subject, question: q?.instruction || q?.prompt || "", userAnswer: describe(o.userAnswer), correctAnswer: describe(q?.correct_answer),
      correct, xpEarned: pts, timeTaken: o.timeTaken, mode: "practice", questionId: q?.id, topic: q?.academic?.curriculum_strand,
      status: o.status, firstTry: o.firstTry, hintsUsed: o.hintsUsed ?? 0, uncertain: o.status === "uncertain", lang: getQuestionLang(i18n.language),
    }));
  };

  const finish = async () => {
    setState("sending");
    const total = items.length;
    const got = results.current.filter((r) => r.correct).length;
    dispatch(logRoundResult({ module, subject, mode: "practice", stars: got, bonusStars: 0, totalStars: got, questions: total, durationMinutes: Math.round(Math.min(60, (Date.now() - startedAt.current) / 60000) * 10) / 10, xpEarned: xp.current }));
    const r = await tg(`/matches/${id}/result`, { method: "POST", body: { results: results.current } });
    if (r.ok) setMatch(r.match);
    else setMatch((m) => ({ ...m, status: "waiting", me: { stars: got, total } }));
    sfx.levelUp();
    haptic("success");
    setState("result");
  };

  const onNext = () => {
    if (idx >= items.length - 1) { finish(); return; }
    questionAt.current = Date.now();
    setIdx((i) => i + 1);
  };

  const leave = () => { sfx.back(); navigate("/together?tab=play"); };
  const friend = match?.with;
  const title = !match ? "" : match.kind === "buddy" ? t("together.round.buddy", "Buddy round") : match.kind === "mystery" ? t("together.play.mysteryCta", "Meet a mystery explorer") : t("together.round.friendly", "Friendly match");

  const shell = (children) => (
    <M.div className={mp.stage} style={{ "--accent": "linear-gradient(135deg, #f06595, #c2255c)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <VideoBackground />
      <div className={mp.shade} aria-hidden="true" />
      {children}
    </M.div>
  );

  if (state === "loading" || state === "sending") {
    return shell(<div className={mp.message}><Mascot size={120} mood="think" /><p className={mp.messageText} role="status">{state === "sending" ? t("together.round.counting", "Counting your stars…") : t("together.round.loading", "Getting your round ready…")}</p></div>);
  }
  if (state === "gone" || !match) {
    return shell(
      <div className={mp.message}>
        <Mascot size={120} mood="think" />
        <p className={mp.messageText} role="status">{t("together.round.gone", "This round is not here any more. Start a new one with your friend!")}</p>
        <div className={mp.messageActions}><button type="button" className={mp.retryBtn} onClick={leave} data-sound="none"><FaArrowLeft aria-hidden="true" /> {t("together.round.backTo", "Back to Together")}</button></div>
      </div>,
    );
  }

  if (state === "playing" && current) {
    return shell(
      <>
        <header className={mp.hud}>
          <button type="button" className={mp.backBtn} onClick={leave} data-sound="none" aria-label={t("modules.back")}><FaArrowLeft aria-hidden="true" /><span className={mp.backText}>{t("modules.back")}</span></button>
          <div className={mp.title}>
            <span className={mp.titleIcon} aria-hidden="true"><FaUserFriends /></span>
            <span className={mp.titleText}>
              <span className={mp.moduleName}>{title}</span>
              <span className={mp.subjectName}>{friend ? t("together.round.with", { defaultValue: "with {{name}}", name: w.who(friend) }) : w.subject(subject)}</span>
            </span>
          </div>
          <div className={mp.progressSlot}><ProgressBar current={idx + 1} total={items.length} /></div>
          <div className={mp.stars} aria-label={t("modules.starsLabel", { defaultValue: "{{count}} stars", count: stars })}><span><FaStar className={mp.starIcon} aria-hidden="true" /></span><span className={mp.starCount}>{stars}</span></div>
        </header>
        <main className={mp.arena}>
          <div className={mp.slot}>
            <FramerMotion.AnimatePresence mode="wait" initial={false}>
              <M.div key={current.id || idx} className={mp.cardWrap} initial={calm ? { opacity: 0 } : { opacity: 0, y: 36, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={calm ? { opacity: 0 } : { opacity: 0, y: -28, scale: 0.98 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                <QuestionCard question={current} subject={subject} module={module} onAnswered={onAnswered} onNext={onNext} isLast={idx === items.length - 1} />
              </M.div>
            </FramerMotion.AnimatePresence>
          </div>
        </main>
      </>,
    );
  }

  return shell(<Result match={match} w={w} t={t} calm={calm} onBack={leave} onAgain={async () => {
    if (match.kind === "mystery") { const r = await tg("/matches/mystery", { method: "POST", body: { subject, module } }); if (r.ok) navigate(`/together/round/${r.match.id}`); return; }
    const r = await tg("/matches", { method: "POST", body: { friendId: friend?.id, kind: match.kind, subject, module } });
    if (r.ok) navigate(`/together/round/${r.match.id}`);
  }} />);
}

// A row of stars that land one by one (each with its own little sound).
function StarRow({ got, total, calm, delay = 0 }) {
  useEffect(() => {
    if (calm) return undefined;
    const ids = Array.from({ length: got }, (_, i) => setTimeout(() => sfx.star(), (delay + 0.25 + i * 0.16) * 1000));
    return () => ids.forEach(clearTimeout);
  }, [got, calm, delay]);
  return (
    <span className={s.starRow} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <M.span key={i} className={i < got ? s.starOn : s.starOff} initial={calm || i >= got ? false : { scale: 0, rotate: -60 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.5, duration: 0.5, delay: delay + 0.25 + i * 0.16 }}>★</M.span>
      ))}
    </span>
  );
}

function Result({ match, w, t, calm, onBack, onAgain }) {
  const guide = useGuide();
  const friend = match.with;
  const name = friend ? w.who(friend) : t("together.play.mystery", "Mystery Explorer");
  const done = match.status === "done";
  const [cheered, setCheered] = useState(false);
  const cheer = async (sticker, line) => {
    const r = await tg("/cheers", { method: "POST", body: { to: friend.id, sticker, line } });
    if (r.ok) { setCheered(true); sfx.star(); }
  };
  return (
    <div className={`dash ${s.resultWrap}`} data-theme="light">
      <M.section className={s.result} role="status" initial={calm ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}>
        {done && match.kind === "buddy" && (
          <>
            <span className={s.badge} aria-hidden="true">🤝</span>
            <h1 className={s.big}>{t("together.result.together", { defaultValue: "Together you earned {{stars}} stars!", stars: match.result.together })}</h1>
            <p className={s.sub}>{t("together.result.togetherSub", { defaultValue: "You and {{name}} share this one. Well done, both of you.", name })}</p>
          </>
        )}
        {done && match.kind !== "buddy" && (
          <>
            <span className={s.badge} aria-hidden="true">{w.prize(match.result.prize).emoji}</span>
            <h1 className={s.big}>{match.result.draw ? t("together.result.draw", "A draw! A ribbon for you both.") : match.result.prize === "ribbon" ? t("together.result.ribbon", "You earned the match ribbon!") : t("together.result.brave", "Brave challenger! Great playing.")}</h1>
            <p className={s.sub}>{t("together.result.keep", "You both keep every star you earned.")}</p>
          </>
        )}
        {!done && (
          <>
            <span className={s.badge} aria-hidden="true">⭐</span>
            <h1 className={s.big}>{t("together.result.mine", { defaultValue: "You got {{stars}} of {{total}}!", stars: match.me?.stars ?? 0, total: match.me?.total ?? match.size })}</h1>
            <p className={s.sub}>{friend ? t("together.result.waitFriend", { defaultValue: "Now it is {{name}}'s turn. You will see how you did together when they have played.", name }) : t("together.result.waitMystery", "Your round is waiting for a mystery explorer. You will see the result when someone has played it.")}</p>
          </>
        )}

        <div className={s.sides}>
          <div className={s.side}>
            <Avatar who={match.you || { avatar: "star" }} size={56} />
            <b>{t("together.result.you", "You")}</b>
            <StarRow got={match.me?.stars ?? 0} total={match.me?.total ?? match.size} calm={calm} />
            {done && match.kind !== "buddy" && <span className={s.prizeTag}>{w.prize(match.result.prize).emoji} {w.prize(match.result.prize).name}</span>}
          </div>
          {friend && (
            <div className={s.side}>
              <Avatar who={friend} size={56} />
              <b>{name}</b>
              {done ? <StarRow got={match.them.stars} total={match.them.total} calm={calm} delay={0.5} /> : <span className={s.waitTag}>{t("together.play.theirTurn", "Their turn")}</span>}
              {done && match.kind !== "buddy" && <span className={s.prizeTag}>{w.prize(match.result.theirPrize).emoji} {w.prize(match.result.theirPrize).name}</span>}
            </div>
          )}
        </div>

        {friend && match.kind !== "mystery" && (
          cheered ? <p className={s.sent}>{t("together.result.cheered", "Cheer sent!")}</p> : (
            <div className={s.cheerRow}>
              <button type="button" className={s.cheerBtn} onClick={() => cheer("highfive", "well_played")} data-sound="none"><span aria-hidden="true">{STICKERS.highfive}</span> {w.line("well_played")}</button>
              <button type="button" className={s.cheerBtn} onClick={() => cheer("heart", "again")} data-sound="none"><FaHeart aria-hidden="true" /> {w.line("again")}</button>
            </div>
          )
        )}

        <div className={s.actions}>
          <button type="button" className={s.again} onClick={onAgain} {...guide("together.again", "Tap the orange button to play again together.", { order: 2 })}><FaRedo aria-hidden="true" /> {match.kind === "mystery" ? t("together.result.another", "Another mystery round") : t("together.result.again", "Play again together")}</button>
          <button type="button" className={s.backBtn} onClick={onBack} data-sound="none"><FaArrowLeft aria-hidden="true" /> {t("together.round.backTo", "Back to Together")}</button>
        </div>
      </M.section>
    </div>
  );
}
