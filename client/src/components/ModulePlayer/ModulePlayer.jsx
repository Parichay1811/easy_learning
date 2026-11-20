import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import * as FramerMotion from "framer-motion";
import { FaArrowLeft, FaStar, FaRedo, FaTimes } from "react-icons/fa";
import { useQuestionRound } from "../../hooks/useQuestionRound";
import QuestionCard from "../QuestionCard/QuestionCard";
import RoundComplete from "../RoundComplete/RoundComplete";
import VideoBackground from "../VideoBackground/VideoBackground";
import ProgressBar from "../ProgressBar/ProgressBar";
import ModeToggle from "../ModeToggle/ModeToggle";
import WarriorTimer from "../WarriorTimer/WarriorTimer";
import Mascot from "../Mascot/Mascot";
import { ComfortSettingsButton } from "../settings/ComfortSettings";
import PlacementSheet from "../Placement/PlacementSheet";
import { needsPlacement } from "../Placement/placementApi";
import { useVoiceBarHost } from "../VoiceBar/useNarration";
import { sfx } from "../../utils/sounds";
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
 *   <ModulePlayer module="listen" warriorSeconds={30} icon={FaHeadphones} accent="#3d9bff" />
 *
 * `extra` adds an optional side panel ({ label, icon, render(reset) }): shown
 * beside the card on big screens and behind a HUD button elsewhere.
 */
export default function ModulePlayer({ module, warriorSeconds = 30, icon, accent = "#6c63ff", loadingKey = "modules.loadingQ", extra }) {
  const { subject } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const compactHud = useCompactHud();
  const [extraOpen, setExtraOpen] = useState(false);
  const [extraKey, setExtraKey] = useState(0);

  const round = useQuestionRound({ module, subject, warriorSeconds });
  const {
    data, status, noOrgQuestions, current, idx, mode, setMode, timeLeft, roundDone, roundResult,
    totalScore, recordAnswer, advance, handlePlayAgain, retry, paused, togglePause, clockRunning, timedOut,
    warriorSeconds: clockSeconds, noClock, learn, choicePool, voiceBusy,
  } = round;
  // The question card shows the teacher's words in place (and has its own
  // Read to me / pause), so the floating caption bar steps aside here.
  useVoiceBarHost(true);

  // The first time in a subject (when it was not already asked on Home):
  // "Where would you like to start?". A new level fetches a new round.
  const [placementOpen, setPlacementOpen] = useState(false);
  useEffect(() => {
    let alive = true;
    needsPlacement(subject).then((v) => { if (alive) setPlacementOpen(v); });
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

  const leave = () => navigate("/home", { state: { openSubject: subject } });
  const goBack = () => { sfx.back(); leave(); };
  const moduleLabel = t(`subjectPage.modules.${module}.label`, { defaultValue: module });
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

  if (status === "loading" || status === "idle" || status === "failed" || data.length === 0 || !current) {
    const failed = status === "failed";
    const empty = !failed && status !== "loading" && status !== "idle" && data.length === 0;
    return shell(
      <div className={styles.message}>
        <Mascot size={120} mood={failed || empty ? "think" : "idle"} />
        <p className={styles.messageText} role="status">
          {failed
            ? t("modules.serverErr")
            : empty
              ? t(noOrgQuestions ? "modules.noOrgQuestions" : "modules.noQuestions")
              : t(loadingKey)}
        </p>
        <div className={styles.messageActions}>
          {(failed || empty) && backButton}
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
        <div className={styles.modeSlot}>
          <ModeToggle mode={mode} onChange={setMode} compact={compactHud} />
        </div>
        <div className={styles.progressSlot}>
          <ProgressBar current={idx + 1} total={data.length} />
        </div>
        {mode === "warrior" && noClock && (
          <div className={styles.timerSlot}>
            <span className={styles.noClock} title={t("modules.noClockHelp", "No clock: you chose to play without one (Comfort settings).")}>
              {t("modules.noClock", "No clock")}
            </span>
          </div>
        )}
        {mode === "warrior" && !noClock && (
          <div className={styles.timerSlot}>
            <WarriorTimer
              total={clockSeconds}
              left={timeLeft}
              running={clockRunning}
              paused={paused}
              timedOut={timedOut}
              waiting={voiceBusy && !timedOut}
              onTogglePause={togglePause}
            />
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
        {extra && (
          <aside className={`${styles.extra} ${extraOpen ? styles.extraOpen : ""}`} aria-label={extra.label}>
            <button type="button" className={styles.extraClose} onClick={() => setExtraOpen(false)} aria-label={t("modules.close", { defaultValue: "Close" })} data-sound="close">
              <FaTimes aria-hidden="true" />
            </button>
            {extra.render(extraKey)}
          </aside>
        )}
        <div className={styles.slot}>
          <AnimatePresence mode="wait" initial={false}>
            <FramerMotion.motion.div
              key={current.id || idx}
              className={styles.cardWrap}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 36, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -28, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <QuestionCard
                question={current}
                subject={subject}
                module={module}
                onAnswered={recordAnswer}
                onNext={advance}
                isLast={isLast}
                locked={timedOut}
                learn={learn}
                choicePool={choicePool}
              />
            </FramerMotion.motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {roundDone && (
          <RoundComplete
            module={module} subject={subject || "general"} mode={mode}
            stars={roundResult.stars} bonusStars={roundResult.bonusStars} total={data.length}
            onPlayAgain={() => { handlePlayAgain(); setExtraKey((k) => k + 1); }}
            onBack={leave}
          />
        )}
      </AnimatePresence>
    </>
  );
}
