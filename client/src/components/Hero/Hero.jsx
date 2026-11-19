import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import * as FramerMotion from "framer-motion";
import Cards from "../Cards/Cards";
import SubjectOverlay from "../SubjectOverlay/SubjectOverlay";
import TodoCard from "../tests/TodoCard";
import Mascot, { FloatingButterflies } from "../Mascot/Mascot";
import styles from "./Hero.module.css";
import {
  FaVolumeUp, FaPlay, FaClipboardList, FaTimes,
  FaHeadphones, FaBookOpen, FaPencilAlt, FaMicrophone, FaCompass,
} from "react-icons/fa";
import { sfx } from "../../utils/sounds";
import { narrate } from "../../utils/narrator";
import { welcome } from "../../utils/greetings";
import { getSpeechLang } from "../../utils/speechLang";
import { useAuth } from "../../context/AuthContext";
import { fetchRounds, fetchModuleStars } from "../../store/slices/dashboardSlice";
import { SUBJECT_ICON_IMAGES } from "../../data/subjectIcons";

const MODULE_ICONS = {
  listen: FaHeadphones, read: FaBookOpen, write: FaPencilAlt, speak: FaMicrophone,
};

// Where "Continue Adventure" should send the student, based on their most
// recently completed round (module + subject).
function getContinueRoute(round) {
  if (!round) return "/home";
  const { module: mod, subject } = round;
  if (["listen", "read", "write", "speak"].includes(mod) && subject) {
    return `/module/${mod}/${subject}`;
  }
  return "/home";
}

// Home as a game's world map: the mascot greets the child in a speech bubble
// (and, once per visit, out loud in the AI teacher's voice), one big button
// carries on the adventure, and the three subject worlds wait below — all on
// one screen, on every device.
const Hero = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const reduce = useReducedMotion();

  const rounds = useSelector((state) => state.dashboard.rounds);
  const [roundsLoaded, setRoundsLoaded] = useState(false);
  const [activeSubject, setActiveSubject] = useState(location.state?.openSubject || null);
  const [spoken, setSpoken] = useState(null); // the line the teacher said this visit
  const [greeting, setGreeting] = useState(true); // mascot waves while greeting
  const [todoOpen, setTodoOpen] = useState(false);
  const [todoCount, setTodoCount] = useState(0);
  const todoRef = useRef(null);
  const greeted = useRef(false);
  const spokenRef = useRef(null);

  // Coming back from a module page reopens the subject overlay instead of
  // landing on a blank Home — then clear the state so it doesn't reopen again.
  useEffect(() => {
    if (location.state?.openSubject) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const fullName = user?.name || user?.email?.split("@")[0];
  const firstName = fullName?.split(" ")[0];

  // The welcome, once per visit: spoken in the AI teacher's voice and shown
  // in the mascot's bubble. (Guarded: React runs effects twice in development.)
  useEffect(() => {
    if (user === undefined) return undefined;
    if (!greeted.current) {
      greeted.current = true;
      spokenRef.current = welcome({ name: firstName, place: "home" });
    }
    const line = spokenRef.current;
    const id = setTimeout(() => { if (line) setSpoken(line); }, 0);
    const stop = setTimeout(() => setGreeting(false), 4200);
    return () => { clearTimeout(id); clearTimeout(stop); };
  }, [user, firstName]);

  useEffect(() => {
    let active = true;
    if (!user) {
      Promise.resolve().then(() => { if (active) setRoundsLoaded(true); });
      return () => { active = false; };
    }
    Promise.all([dispatch(fetchRounds(1)), dispatch(fetchModuleStars())])
      .finally(() => { if (active) setRoundsLoaded(true); });
    return () => { active = false; };
  }, [user, dispatch]);

  // The "To do" list (tests and practice from a teacher) lives in a sheet;
  // its button shows only when there is something on it.
  useEffect(() => {
    const el = todoRef.current;
    if (!el) return undefined;
    const count = () => setTodoCount(el.querySelectorAll("li").length);
    const mo = new MutationObserver(count);
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    if (!todoOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") { sfx.close(); setTodoOpen(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [todoOpen]);

  const lastRound = rounds?.[0] || null;
  const isReturningStudent = roundsLoaded && !!user && !!lastRound;

  const ctaLabel = isReturningStudent
    ? t("hero.continueAdventure", { defaultValue: "Start where you left off" })
    : t("hero.startAdventure", { defaultValue: "Start Your Adventure" });

  const handleCTA = () => {
    sfx.forward();
    if (isReturningStudent) {
      navigate(getContinueRoute(lastRound));
      return;
    }
    // New students start their first adventure in Listen/English.
    navigate("/module/listen/english");
  };

  const bubbleText = spoken || [
    firstName ? t("hero.greeting", { name: firstName }) : "",
    t("hero.readyForAdventure", { defaultValue: "Ready for your next adventure?" }),
  ].filter(Boolean).join(" ");

  const handleListen = () => {
    sfx.tap();
    setGreeting(true);
    setTimeout(() => setGreeting(false), 3000);
    narrate(bubbleText, { lang: getSpeechLang(i18n.language) });
  };

  const ModuleIcon = lastRound ? (MODULE_ICONS[lastRound.module] || FaCompass) : FaCompass;
  const subjectImage = lastRound?.subject && SUBJECT_ICON_IMAGES[lastRound.subject];
  const subjectLabel = subjectImage
    ? t(`subjectPage.${lastRound.subject}.label`)
    : null;
  const moduleLabel = lastRound && ["listen", "read", "write", "speak"].includes(lastRound.module)
    ? t(`subjectPage.modules.${lastRound.module}.label`)
    : null;

  const openTodo = () => { sfx.open(); setTodoOpen(true); };
  const closeTodo = () => { sfx.close(); setTodoOpen(false); };

  return (
    <section className={styles.hero}>
      <h1 className={styles.srOnly}>Learnigo — Gamified English, Maths and Science Practice</h1>
      <FloatingButterflies count={3} />

      <div className={styles.world}>
        <div className={styles.greet}>
          <Mascot size={140} mood={greeting ? "wave" : "idle"} className={styles.mascot} />
          <FramerMotion.motion.div
            className={styles.bubble}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 18 }}
          >
            <p className={styles.bubbleText} aria-live="polite">{bubbleText}</p>
            <button
              type="button"
              className={styles.listenBtn}
              onClick={handleListen}
              aria-label={t("hero.listen", { defaultValue: "Listen" })}
              title={t("hero.listen", { defaultValue: "Listen" })}
              data-sound="none"
            >
              <FaVolumeUp aria-hidden="true" />
            </button>
          </FramerMotion.motion.div>
        </div>

        <div className={styles.quest}>
          <FramerMotion.motion.button
            type="button"
            className={styles.ctaBtn}
            onClick={handleCTA}
            data-sound="none"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.35 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className={styles.ctaPlay} aria-hidden="true"><FaPlay /></span>
            <span className={styles.ctaText}>
              <span className={styles.ctaLabel}>{ctaLabel}</span>
              {isReturningStudent && lastRound ? (
                <span className={styles.ctaSub}>
                  {subjectImage
                    ? <img src={subjectImage} alt="" className={styles.resumeIconImg} />
                    : <ModuleIcon aria-hidden="true" />}
                  {subjectLabel && moduleLabel
                    ? `${subjectLabel} • ${moduleLabel}`
                    : moduleLabel || t("hero.keepGoing", { defaultValue: "Keep going!" })}
                </span>
              ) : (
                <span className={styles.ctaSub}>{t("hero.chooseWorldHint", { defaultValue: "Choose a world below to begin your first adventure!" })}</span>
              )}
            </span>
          </FramerMotion.motion.button>

          {todoCount > 0 && (
            <button type="button" className={styles.todoBtn} onClick={openTodo} aria-haspopup="dialog" data-sound="none">
              <FaClipboardList aria-hidden="true" />
              <span className={styles.todoText}>{t("tests.todo.title", { defaultValue: "To do" })}</span>
              <span className={styles.todoCount}>{todoCount}</span>
            </button>
          )}
        </div>

        <nav className={styles.worlds} aria-label={t("hero.chooseWorld", { defaultValue: "Choose Your World" })}>
          <Cards onSelect={setActiveSubject} />
        </nav>
      </div>

      {/* Always rendered (so its button knows whether there's anything to do);
          shown as a sheet when opened. */}
      <div className={`${styles.todoLayer} ${todoOpen ? styles.todoLayerOpen : ""}`} onClick={closeTodo} aria-hidden={!todoOpen}>
        <div className={styles.todoSheet} role="dialog" aria-modal="true" aria-label={t("tests.todo.title", { defaultValue: "To do" })} onClick={(e) => e.stopPropagation()}>
          <button type="button" className={styles.todoClose} onClick={closeTodo} aria-label={t("modules.close", { defaultValue: "Close" })} data-sound="none">
            <FaTimes aria-hidden="true" />
          </button>
          <div ref={todoRef} className={styles.todoBody}>
            <TodoCard />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeSubject && (
          <SubjectOverlay
            subject={activeSubject}
            onClose={() => setActiveSubject(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default Hero;
