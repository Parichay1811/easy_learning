import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaLightbulb, FaMountain, FaCompass, FaHome, FaRedo } from "react-icons/fa";
import QuestionCard from "../components/QuestionCard/QuestionCard";
import ExplainCard from "../components/QuestionCard/ExplainCard";
import VideoBackground from "../components/VideoBackground/VideoBackground";
import ProgressBar from "../components/ProgressBar/ProgressBar";
import Mascot from "../components/Mascot/Mascot";
import { ComfortSettingsButton } from "../components/settings/ComfortSettings";
import GrowthToast from "../components/journey/GrowthToast";
import { journeyFetch, signedIn, markDiscoveryDone } from "../components/journey/journeyApi";
import { SUBJECTS, MODULES, SOURCES, subjectLabel } from "../components/journey/words";
import { useVoiceBarHost } from "../components/VoiceBar/useNarration";
import { logDashboardAnswer, logDashboardSession, logRoundResult } from "../store/slices/dashboardSlice";
import { getQuestionLang } from "../utils/questionLang";
import { sfx } from "../utils/sounds";
import mp from "../components/ModulePlayer/ModulePlayer.module.css";
import s from "./Discovery.module.css";

const describe = (v) => (typeof v === "string" ? v : JSON.stringify(v ?? ""));

// "Science" / "Math" / "maths" -> "science" / "maths".
function subjectOf(x) {
  const v = String(x || "").toLowerCase();
  if (v.startsWith("math")) return "maths";
  return SUBJECTS.includes(v) ? v : null;
}
function moduleOf(x) {
  const v = String(x || "").toLowerCase();
  return MODULES.includes(v) ? v : null;
}

/**
 * /discovery: today's quick discovery, one friendly everyday question
 * (GET /api/learn/discovery, answered through the normal log-answer with
 * mode "discovery"). /discovery?challenge=1&subject=&module=&skill= plays a
 * mini challenge instead: a few items one stage up on a skill the learner is
 * strong in (GET /api/learn/round?mode=challenge).
 *
 * Calm on purpose: one question (or three), no clock, no stars to chase; the
 * same question card, voice and comfort settings as every round.
 */

// Minutes since `start` (ms; 0 = none), at most `max`, to 2 decimals.
const nowMs = () => Date.now();
const minutesSince = (start, max) => (start ? Math.round(Math.min(max, Math.max(0, (nowMs() - start) / 60000)) * 100) / 100 : 0);
export default function Discovery() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const challenge = params.get("challenge") === "1";
  const askSubject = subjectOf(params.get("subject"));
  const askModule = moduleOf(params.get("module"));
  const askSkill = (params.get("skill") || "").slice(0, 120) || null;
  const askSource = params.get("source");
  const lang = getQuestionLang(i18n.language);
  useVoiceBarHost(true);

  // { status: loading | ready | empty | failed | guest, items, roundId, date, subject, module }
  const [round, setRound] = useState({ status: signedIn() ? "loading" : "guest", items: [] });
  const [idx, setIdx] = useState(0);
  const [finished, setFinished] = useState(false);
  const [learnById, setLearnById] = useState({});
  const [badges, setBadges] = useState([]);
  const [explained, setExplained] = useState(() => new Set());
  const [nonce, setNonce] = useState(0);
  // Once the learner has answered, the round stays as it is (a new language
  // changes the words around it, not the question they just answered).
  const startedRef = useRef(false);
  const fetchedRef = useRef(null);
  // The activity's own clock and score: each answer adds its XP and real minutes;
  // the finished discovery or challenge is one session (docs/learning/GAME-ROADMAP.md G-001).
  const tallyRef = useRef({ start: 0, questionStart: 0, stars: 0, xp: 0 });
  useEffect(() => { tallyRef.current.questionStart = nowMs(); }, [idx]);

  useEffect(() => {
    if (!signedIn()) return undefined;
    const wanted = `${challenge}|${askSubject}|${askModule}|${askSkill}|${nonce}`;
    if (startedRef.current && fetchedRef.current === wanted) return undefined;
    fetchedRef.current = wanted;
    const ctrl = new AbortController();
    (async () => {
      if (challenge) {
        const qs = new URLSearchParams({ mode: "challenge", size: "3", lang, source: SOURCES.includes(askSource) ? askSource : "challenge" });
        if (askSubject) qs.set("subject", askSubject);
        if (askModule) qs.set("module", askModule);
        if (askSkill) qs.set("skill", askSkill);
        const r = await journeyFetch(`/learn/round?${qs}`, { signal: ctrl.signal });
        if (ctrl.signal.aborted) return;
        const items = Array.isArray(r.items) ? r.items : [];
        if (!r.ok) setRound({ status: r.status === 404 || r.status === 400 ? "empty" : "failed", items: [] });
        else setRound({ status: items.length ? "ready" : "empty", items, roundId: typeof r.roundId === "string" ? r.roundId : null, subject: subjectOf(r.subject) || askSubject, module: moduleOf(r.module) || askModule });
      } else {
        const r = await journeyFetch(`/learn/discovery?lang=${encodeURIComponent(lang)}`, { signal: ctrl.signal });
        if (ctrl.signal.aborted) return;
        if (!r.ok || !r.item) setRound({ status: r.ok || r.status === 404 ? "empty" : "failed", items: [] });
        else if (r.answered) setRound({ status: "answered", items: [], date: r.date || null });
        else setRound({ status: "ready", items: [r.item], date: r.date || null, subject: subjectOf(r.subject || r.item.subject), module: moduleOf(r.module || r.item.module) });
      }
      setIdx(0);
      setFinished(false);
      setLearnById({});
      startedRef.current = false;
      tallyRef.current = { start: nowMs(), questionStart: nowMs(), stars: 0, xp: 0 };
    })();
    return () => ctrl.abort();
  }, [challenge, askSubject, askModule, askSkill, askSource, lang, nonce]);

  const items = round.items;
  const current = items[idx];
  const subject = subjectOf(current?.subject) || round.subject || "science";
  const module = moduleOf(current?.module) || round.module || "read";
  const isLast = idx >= items.length - 1;
  const explain = current && !explained.has(current.id) && current.support?.strategy === "misconception" && current.support.explain?.text
    ? current.support.explain : null;

  const recordAnswer = (o) => {
    const q = current;
    if (!q) return;
    startedRef.current = true;
    const correct = Boolean(o.correct);
    const xp = correct ? (q.points || 10) : 0;
    const at = idx;
    const tally = tallyRef.current;
    dispatch(logDashboardSession({ kind: "answer", module, subject, durationMinutes: minutesSince(tally.questionStart, 3), xpEarned: xp, score: correct ? 100 : 0, startTime: new Date(tally.questionStart || nowMs()).toISOString() }));
    tally.xp += xp;
    if (correct) tally.stars += 1;
    dispatch(logDashboardAnswer({
      module, subject,
      question: q.instruction || q.prompt || "",
      userAnswer: describe(o.userAnswer),
      correctAnswer: describe(q.correct_answer),
      correct, xpEarned: xp, timeTaken: o.timeTaken,
      mode: challenge ? "challenge" : "discovery",
      questionId: q.id, topic: q.academic?.curriculum_strand,
      status: o.status, firstTry: o.firstTry, hintsUsed: o.hintsUsed ?? 0,
      ...(Number.isInteger(o.supportStep) ? { supportStep: o.supportStep } : {}),
      ...(o.misconception ? { misconception: o.misconception } : {}),
      uncertain: o.status === "uncertain",
      ...(o.reason ? { reason: o.reason } : {}),
      ...(round.roundId ? { roundId: round.roundId, position: at } : {}),
      lang,
    })).then((action) => {
      const learn = action?.payload?.learn;
      if (learn && q.id) setLearnById((m) => ({ ...m, [q.id]: learn }));
      const got = Array.isArray(learn?.achievements) ? learn.achievements.filter((a) => a && a.id) : [];
      if (got.length) setBadges((list) => [...list, ...got.filter((b) => !list.some((x) => x.id === b.id))]);
    });
    if (!challenge) markDiscoveryDone(q.id, round.date || undefined);
  };

  const next = () => {
    if (isLast) {
      setFinished(true);
      sfx.levelUp?.();
      // The whole discovery or challenge is one session; new badges come back with it.
      const tally = tallyRef.current;
      dispatch(logRoundResult({
        module, subject, mode: challenge ? "challenge" : "discovery",
        stars: tally.stars, bonusStars: 0, totalStars: tally.stars,
        questions: items.length,
        durationMinutes: Math.round(minutesSince(tally.start, 60) * 10) / 10,
        xpEarned: tally.xp,
      })).then((action) => {
        const got = Array.isArray(action?.payload?.badges) ? action.payload.badges.filter((b) => b && b.id) : [];
        if (got.length) setBadges((list) => [...list, ...got.filter((b) => !list.some((x) => x.id === b.id))]);
      });
    } else setIdx((i) => i + 1);
  };
  const toToday = () => { sfx.back(); navigate("/dashboard"); };

  const Icon = challenge ? FaMountain : FaLightbulb;
  const title = challenge ? t("journey.challenge.title", "Mini challenge") : t("journey.discovery.title", "Today's quick discovery");
  const sub = challenge
    ? (round.subject ? subjectLabel(t, round.subject) : t("journey.challenge.sub", "One step up, just to try"))
    : t("journey.discovery.sub", "One everyday question");

  let body;
  if (round.status === "guest") {
    body = (
      <div className={mp.message}>
        <Mascot size={110} mood="wave" />
        <p className={mp.messageText}>{t("journey.discovery.signIn", "Sign in to get a new discovery every day.")}</p>
        <Link to="/login" className={s.go}>{t("navbar.login", "Log in")}</Link>
      </div>
    );
  } else if (round.status === "loading") {
    body = (
      <div className={mp.message}>
        <Mascot size={110} mood="think" />
        <p className={mp.messageText} role="status">{t("journey.discovery.loading", "Finding something to wonder about…")}</p>
      </div>
    );
  } else if (round.status === "answered") {
    body = (
      <div className={mp.message} data-discovery-answered="">
        <Mascot size={110} mood="idle" />
        <p className={mp.messageText} role="status">{t("journey.discovery.done", "You explored today's discovery. A new one will be waiting tomorrow.")}</p>
        <div className={mp.messageActions}>
          <button type="button" className={s.go} onClick={toToday} data-sound="none" autoFocus><FaHome aria-hidden="true" /> {t("journey.backToday", "Back to Today")}</button>
          <Link to="/home" className={mp.backBtn}><FaCompass aria-hidden="true" /> {t("journey.exploreMore", "Explore something new")}</Link>
        </div>
      </div>
    );
  } else if (round.status !== "ready" || !current) {
    const failed = round.status === "failed";
    body = (
      <div className={mp.message}>
        <Mascot size={110} mood="idle" />
        <p className={mp.messageText} role="status">
          {failed
            ? t("journey.discovery.failed", "We couldn't load this just now. It wasn't you.")
            : challenge
              ? t("journey.challenge.none", "There's no mini challenge ready right now. Keep exploring and one will come.")
              : t("journey.discovery.none", "There's no new discovery right now. Come back tomorrow, or explore something new.")}
        </p>
        <div className={mp.messageActions}>
          <button type="button" className={mp.backBtn} onClick={toToday} data-sound="none"><FaHome aria-hidden="true" /> {t("journey.backToday", "Back to Today")}</button>
          {failed && <button type="button" className={mp.retryBtn} onClick={() => { setRound({ status: "loading", items: [] }); setNonce((n) => n + 1); }} data-sound="tap"><FaRedo aria-hidden="true" /> {t("modules.retry", "Try again")}</button>}
          {!failed && <Link to="/home" className={s.go}><FaCompass aria-hidden="true" /> {t("journey.exploreMore", "Explore something new")}</Link>}
        </div>
      </div>
    );
  } else if (finished) {
    body = (
      <div className={mp.message} data-discovery-done="">
        <Mascot size={120} mood="cheer" />
        <h2 className={s.doneTitle}>
          {challenge ? t("journey.challenge.doneTitle", "Challenge finished!") : t("journey.discovery.doneTitle", "Thanks for wondering with me!")}
        </h2>
        <p className={mp.messageText}>
          {challenge
            ? t("journey.challenge.doneText", "Trying something a step harder is how brains grow. Well done for having a go.")
            : t("journey.discovery.doneText", "A new discovery will be waiting tomorrow.")}
        </p>
        <div className={mp.messageActions}>
          <button type="button" className={s.go} onClick={toToday} data-sound="none" autoFocus><FaHome aria-hidden="true" /> {t("journey.backToday", "Back to Today")}</button>
          <Link to="/home" className={mp.backBtn}><FaCompass aria-hidden="true" /> {t("journey.exploreMore", "Explore something new")}</Link>
        </div>
      </div>
    );
  } else {
    body = (
      <main className={mp.arena}>
        <div className={mp.slot}>
          <div className={mp.cardWrap} key={explain ? `explain-${current.id}` : current.id || idx}>
            {explain ? (
              <ExplainCard explain={explain} lang={current.lang} onReady={() => setExplained((x) => new Set(x).add(current.id))} />
            ) : (
              <QuestionCard
                question={current}
                subject={subject}
                module={module}
                onAnswered={recordAnswer}
                onNext={next}
                isLast={isLast}
                learn={current.id ? learnById[current.id] || null : null}
              />
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className={`${mp.stage} ${s.stage}`} style={{ "--accent": challenge ? "linear-gradient(135deg, #9775fa, #6741d9)" : "linear-gradient(135deg, #ffd43b, #f59f00)" }} data-discovery={challenge ? "challenge" : "discovery"}>
      <VideoBackground />
      <div className={mp.shade} aria-hidden="true" />
      <header className={`${mp.hud} ${s.hud}`}>
        <button type="button" className={mp.backBtn} onClick={toToday} data-sound="none" aria-label={t("journey.backToday", "Back to Today")}>
          <FaArrowLeft aria-hidden="true" />
          <span className={mp.backText}>{t("journey.backToday", "Back to Today")}</span>
        </button>
        <div className={mp.title}>
          <span className={mp.titleIcon} aria-hidden="true"><Icon /></span>
          <span className={mp.titleText}>
            <h1 className={`${mp.moduleName} ${s.h1}`}>{title}</h1>
            <span className={mp.subjectName}>{sub}</span>
          </span>
        </div>
        {challenge && items.length > 1 && round.status === "ready" && !finished && (
          <div className={`${mp.progressSlot} ${s.progress}`}>
            <ProgressBar current={idx + 1} total={items.length} />
          </div>
        )}
        <ComfortSettingsButton variant="hud" className={mp.settingsBtn} />
      </header>
      {body}
      {finished && badges.length > 0 && <GrowthToast badges={badges} onDone={() => setBadges([])} />}
    </div>
  );
}
