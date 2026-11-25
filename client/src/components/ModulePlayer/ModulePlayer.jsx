import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";
import { useCalmMotion } from "../../utils/useCalmMotion";
import * as FramerMotion from "framer-motion";
import { FaArrowLeft, FaStar, FaRedo, FaTimes, FaHome, FaCompass, FaRegClock, FaChevronDown } from "react-icons/fa";
import { useQuestionRound } from "../../hooks/useQuestionRound";
import QuestionCard from "../QuestionCard/QuestionCard";
import ExplainCard from "../QuestionCard/ExplainCard";
import ResumePrompt from "./ResumePrompt";
import ClockMenu from "./ClockMenu";
import GrowthToast from "../journey/GrowthToast";
import RoundComplete from "../RoundComplete/RoundComplete";
import VideoBackground from "../VideoBackground/VideoBackground";
import ProgressBar from "../ProgressBar/ProgressBar";
import ModeToggle from "../ModeToggle/ModeToggle";
import WarriorTimer from "../WarriorTimer/WarriorTimer";
import Mascot from "../Mascot/Mascot";
import { companion } from "../../companion/bus";
import { ComfortSettingsButton } from "../settings/ComfortSettings";
import { fieldLabel } from "../settings/prefText";
import PlacementSheet from "../Placement/PlacementSheet";
import { needsPlacement } from "../Placement/placementApi";
import { useVoiceBarHost } from "../VoiceBar/useNarration";
import { sfx } from "../../utils/sounds";
import { backTargetFor } from "../../utils/navMemory";
import { signedIn } from "../journey/journeyApi";
import styles from "./ModulePlayer.module.css";

const COMPACT_QUERY = "(max-width: 359px), (orientation: landscape) and (max-height: 500px)";

function useCompactHud() {
  const [compact, setCompact] = useState(() => typeof window !== "undefined" && window.matchMedia?.(COMPACT_QUERY).matches);
  useEffect(() => {
    const mql = window.matchMedia?.(COMPACT_QUERY);
    if (!mql) return undefined;
    const on = (e) => setCompact(e.matches);
    mql.addEventListener("change", on);
    return () => mql.removeEventListener("change", on);
  }, []);
  return compact;
}

/**
 * One question round (Listen, Read, Write or Speak) as a game screen: a HUD
 * along the top (back, the module, Practice/Warrior, progress, the clock,
 * stars) and the question card filling the rest — one screen, no scrolling,
 * on every device.
 *
 * The Warrior clock is off until the learner turns it on. In Warrior the bar
 * shows it as a button ("No clock", or the running clock) that opens its menu
 * (ClockMenu.jsx: No clock / Normal / More time), so the choice is where the
 * clock is, not only in Comfort settings.
 *
 *   <ModulePlayer module="listen" warriorSeconds={30} icon={FaHeadphones} accent="#3d9bff" />
 *
 * `extra` adds an optional side panel ({ label, icon, render(reset) }): shown
 * beside the card on big screens and behind a HUD button elsewhere.
 */
export default function ModulePlayer({ module, warriorSeconds = 30, icon, accent = "#6c63ff", loadingKey = "modules.loadingQ", extra }) {
  const { subject } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  // Where Back goes: the page the learner came from (the dashboard, a discovery…), else Home.
  const [backTo] = useState(() => backTargetFor(pathname));
  const reduce = useCalmMotion();
  const compactHud = useCompactHud();
  const [extraOpen, setExtraOpen] = useState(false);
  const [extraKey, setExtraKey] = useState(0);

  const round = useQuestionRound({ module, subject, warriorSeconds });
  const [query] = useSearchParams();
  const wantsChallenge = query.get("challenge") === "1";
  const {
    data, status, noOrgQuestions, current, idx, mode, setMode, timeLeft, roundDone, roundResult,
    totalScore, recordAnswer, advance, handlePlayAgain, retry, paused, userPaused, togglePause, clockRunning, timedOut,
    warriorSeconds: clockSeconds, noClock, learn, choicePool, voiceBusy, answered,
    resumeOffer, acceptResume, startFresh, starting, explainNow, doneExplaining, newBadges, challenge,
  } = round;
  // Badges earned in the round are shown quietly when it ends (never mid-question):
  // how many have been shown, so badges arriving a moment later still get theirs.
  const [badgesSeen, setBadgesSeen] = useState(0);
  // The question card shows the teacher's words in place (and has its own
  // Read to me / pause), so the floating caption bar steps aside here.
  useVoiceBarHost(true);

  // The first time in a subject (when it was not already asked on Home):
  // "Where would you like to start?". A new level fetches a new round.
  const [placementOpen, setPlacementOpen] = useState(false);
  // The question waits until we know: it is not read aloud behind the sheet.
  const [placementChecked, setPlacementChecked] = useState(false);
  useEffect(() => {
    let alive = true;
    needsPlacement(subject)
      .then((v) => { if (alive) setPlacementOpen(v); })
      .catch(() => {})
      .finally(() => { if (alive) setPlacementChecked(true); });
    return () => { alive = false; };
  }, [subject]);
  const placement = placementOpen && (
    <PlacementSheet
      subject={subject}
      module={module}
      onDone={(lv) => { setPlacementOpen(false); if (lv != null) retry(); }}
      onClose={() => setPlacementOpen(false)}
    />
  );

  // The Warrior clock's menu (open from the clock in the bar; Warrior only).
  const [clockMenu, setClockMenu] = useState(false);
  const clockSlotRef = useRef(null);
  const closeClockMenu = useCallback(() => setClockMenu(false), []);
  const clockOpen = clockMenu && mode === "warrior" && !roundDone;
  // Left Warrior or finished the round with the menu open: it does not come back by itself.
  if (clockMenu && !clockOpen) setClockMenu(false);

  // The stars counter gives a little hop when it goes up.
  const [bumpKey, setBumpKey] = useState(0);
  const lastScore = useRef(totalScore);
  useEffect(() => {
    if (totalScore > lastScore.current) {
      const id = setTimeout(() => setBumpKey((k) => k + 1), 350);
      lastScore.current = totalScore;
      return () => clearTimeout(id);
    }
    lastScore.current = totalScore;
    return undefined;
  }, [totalScore]);

  // A new question: the companion turns to look at it (when it sits beside the card).
  const slotRef = useRef(null);
  const questionKey = current?.id || idx;
  useEffect(() => {
    const id = setTimeout(() => { if (slotRef.current) companion.signal("lookAt", { el: slotRef.current }); }, 700);
    return () => clearTimeout(id);
  }, [questionKey]);

  const leave = () => (backTo ? navigate(backTo) : navigate("/home", { state: { openSubject: subject } }));
  const goBack = () => { sfx.back(); leave(); };
  const moduleLabel = challenge
    ? t("journey.challenge.title", "Mini challenge")
    : t(`subjectPage.modules.${module}.label`, { defaultValue: module });
  const subjectLabel = t(`subjectPage.${subject}.label`, { defaultValue: subject });
  const Icon = icon;

  const backButton = (
    <button type="button" className={styles.backBtn} onClick={goBack} data-sound="none" aria-label={t("modules.back")}>
      <FaArrowLeft aria-hidden="true" />
      <span className={styles.backText}>{t("modules.back")}</span>
    </button>
  );

  const shell = (children) => (
    <FramerMotion.motion.div
      className={styles.stage}
      style={{ "--accent": accent }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: -60 }}
      transition={{ duration: 0.35 }}
    >
      <VideoBackground />
      <div className={styles.shade} aria-hidden="true" />
      {children}
      {placement}
    </FramerMotion.motion.div>
  );

  if (starting || status === "loading" || status === "idle" || status === "failed" || data.length === 0 || !current) {
    const failed = status === "failed";
    const empty = !failed && status !== "loading" && status !== "idle" && data.length === 0;
    return shell(
      <div className={styles.message}>
        <Mascot size={120} mood={failed || empty ? "think" : "idle"} />
        <p className={styles.messageText} role="status">
          {failed
            ? t("modules.serverErr")
            : empty
              ? (wantsChallenge
                ? t("journey.challenge.none", "There's no mini challenge ready right now. Keep exploring and one will come.")
                : t(noOrgQuestions ? "modules.noOrgQuestions" : "modules.noQuestions"))
              : t(loadingKey)}
        </p>
        <div className={styles.messageActions}>
          {(failed || empty) && backButton}
          {/* Nothing here: somewhere else to go, not only Back. */}
          {empty && signedIn() && (
            <button type="button" className={styles.retryBtn} onClick={() => { sfx.tap(); navigate("/dashboard"); }} data-sound="none">
              <FaHome aria-hidden="true" /> {t("journey.backToday", "Back to Today")}
            </button>
          )}
          {empty && (
            <button type="button" className={styles.retryBtn} onClick={() => { sfx.tap(); navigate("/home"); }} data-sound="none">
              <FaCompass aria-hidden="true" /> {t("journey.exploreMore", "Explore something new")}
            </button>
          )}
          {failed && (
            <button type="button" className={styles.retryBtn} onClick={() => { sfx.tap(); retry(); }} data-sound="none">
              <FaRedo aria-hidden="true" /> {t("modules.retry")}
            </button>
          )}
        </div>
      </div>
    );
  }

  const isLast = idx === data.length - 1;
  const ExtraIcon = extra?.icon;

  return shell(
    <>
      <header className={`${styles.hud} ${mode === "warrior" ? styles.hudWarrior : ""}`}>
        {backButton}
        <div className={styles.title}>
          <span className={styles.titleIcon} aria-hidden="true">{Icon && <Icon />}</span>
          <span className={styles.titleText}>
            <span className={styles.moduleName}>{moduleLabel}</span>
            <span className={styles.subjectName}>{subjectLabel}</span>
          </span>
        </div>
        {/* A mini challenge is never a Warrior round: no switch there. */}
        {!challenge && !wantsChallenge && (
          <div className={styles.modeSlot}>
            <ModeToggle mode={mode} onChange={setMode} compact={compactHud} />
          </div>
        )}
        <div className={styles.progressSlot}>
          <ProgressBar current={resumeOffer ? resumeOffer.position + 1 : idx + 1} total={data.length} />
        </div>
        {/* The Warrior clock: off until the learner turns it on. Either way it is a
            button that opens the clock's own menu (no clock / normal / more time). */}
        {mode === "warrior" && (
          <div className={styles.timerSlot} ref={clockSlotRef}>
            {noClock ? (
              <button
                type="button"
                className={styles.clockOff}
                onClick={() => setClockMenu((o) => !o)}
                aria-haspopup="dialog"
                aria-expanded={clockOpen}
                aria-label={`${fieldLabel(t, "timer")}: ${t("modules.noClock", "No clock")}`}
                title={`${fieldLabel(t, "timer")}: ${t("modules.noClock", "No clock")}`}
                data-sound={clockOpen ? "close" : "open"}
              >
                <FaRegClock className={styles.clockIcon} aria-hidden="true" />
                <span>{t("modules.noClock", "No clock")}</span>
                <FaChevronDown className={styles.clockCaret} aria-hidden="true" />
              </button>
            ) : (
              <WarriorTimer
                total={clockSeconds}
                left={timeLeft}
                running={clockRunning}
                // While its menu is open the clock simply waits (the number stands still);
                // "Paused" is for a clock the learner paused, or a hidden page.
                paused={clockOpen ? userPaused : paused}
                timedOut={timedOut}
                waiting={voiceBusy && !timedOut}
                onTogglePause={togglePause}
                onOpenMenu={() => setClockMenu((o) => !o)}
                menuOpen={clockOpen}
              />
            )}
          </div>
        )}
        {extra && (
          <button
            type="button"
            className={styles.extraBtn}
            onClick={() => setExtraOpen((o) => !o)}
            aria-expanded={extraOpen}
            aria-label={extra.label}
            title={extra.label}
            data-sound={extraOpen ? "close" : "open"}
          >
            {ExtraIcon && <ExtraIcon aria-hidden="true" />}
          </button>
        )}
        <ComfortSettingsButton variant="hud" className={styles.settingsBtn} />
        <div className={styles.stars} aria-label={t("modules.starsLabel", { defaultValue: "{{count}} stars", count: totalScore })}>
          <span key={bumpKey} className={bumpKey ? styles.bump : ""}><FaStar className={styles.starIcon} aria-hidden="true" /></span>
          <span className={styles.starCount}>{totalScore}</span>
        </div>
      </header>

      <main className={`${styles.arena} ${extra ? styles.withExtra : ""}`}>
        {clockOpen && (
          <ClockMenu
            baseSeconds={warriorSeconds}
            anchorRef={clockSlotRef}
            onClose={closeClockMenu}
            canPause={!noClock && !answered && !timedOut && !resumeOffer && !explainNow}
            paused={userPaused}
            left={timeLeft}
            onTogglePause={togglePause}
          />
        )}
        {extra && (
          <aside className={`${styles.extra} ${extraOpen ? styles.extraOpen : ""}`} aria-label={extra.label}>
            <button type="button" className={styles.extraClose} onClick={() => setExtraOpen(false)} aria-label={t("modules.close", { defaultValue: "Close" })} data-sound="close">
              <FaTimes aria-hidden="true" />
            </button>
            {extra.render(extraKey)}
          </aside>
        )}
        {/* Wide screens: the companion sits beside the card, watches and reacts (companion/). */}
        <div className={`${styles.buddy} ${extra ? styles.buddyRight : ""}`} aria-hidden="true">
          <Mascot size="var(--buddy-size)" butterfly={false} priority={1} />
        </div>
        <div className={styles.slot} ref={slotRef}>
          <AnimatePresence mode="wait" initial={false}>
            <FramerMotion.motion.div
              key={resumeOffer ? "resume" : explainNow ? `explain-${current.id || idx}` : current.id || idx}
              className={styles.cardWrap}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 36, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -28, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* An unfinished round first asks "carry on?"; an idea that keeps
                  tripping the learner up is explained before its question. */}
              {!placementChecked || placementOpen ? null : resumeOffer ? (
                <ResumePrompt position={resumeOffer.position} total={resumeOffer.total} onCarryOn={acceptResume} onFresh={startFresh} />
              ) : explainNow ? (
                <ExplainCard explain={explainNow} lang={current.lang} onReady={doneExplaining} />
              ) : (
                <QuestionCard
                  question={current}
                  subject={subject}
                  module={module}
                  onAnswered={recordAnswer}
                  onNext={advance}
                  isLast={isLast}
                  learn={learn}
                  choicePool={choicePool}
                />
              )}
            </FramerMotion.motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {roundDone && (
          <RoundComplete
            module={module} subject={subject || "general"} mode={roundResult.mode || mode}
            stars={roundResult.stars} total={roundResult.total || data.length} challenge={challenge}
            best={roundResult.best} newBest={roundResult.newBest}
            onPlayAgain={() => { handlePlayAgain(); setExtraKey((k) => k + 1); setBadgesSeen(0); }}
            onBack={leave}
          />
        )}
      </AnimatePresence>
      {roundDone && newBadges.length > badgesSeen && (
        <GrowthToast key={badgesSeen} badges={newBadges.slice(badgesSeen)} onDone={() => setBadgesSeen(newBadges.length)} />
      )}
    </>
  );
}
