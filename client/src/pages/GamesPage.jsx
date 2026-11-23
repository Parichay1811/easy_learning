import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as FramerMotion from "framer-motion";
import { useCalmMotion } from "../utils/useCalmMotion";
import VideoBackground from "../components/VideoBackground/VideoBackground";
import SEO from "../components/SEO/SEO";
import Mascot from "../components/Mascot/Mascot";
import { GROUPS } from "../ar/catalog/groups";
import { GAMES, gamesInGroup } from "../ar/catalog/games";
import { tGroup } from "../ar/core/arText";
import styles from "./GamesPage.module.css";
import { sfx } from "../utils/sounds";
import { FaGamepad, FaArrowLeft, FaCamera, FaHandPaper, FaChevronRight } from "react-icons/fa";

// The Game Zone as a game's mode-select: one big way in (Camera Games) and
// its eight worlds as tiles that open the hub straight on that world. One
// screen on every device.
const GamesPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const reduce = useCalmMotion();

  // Opening Games starts the hand model's download in the background, so the
  // first camera game finds it already here instead of waiting on 12-19 MB.
  // It waits for the page to paint and the browser to be idle; download only.
  useEffect(() => {
    // The camera games' code too (it loads on demand), so the hub opens at once.
    const go = () => {
      import("../ar/core/vision").then((m) => m.prefetchVisionFiles()).catch(() => {});
      import("../ar/pages/ARHub").catch(() => {});
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(go, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = window.setTimeout(go, 400);
    return () => window.clearTimeout(timer);
  }, []);

  const openHub = (groupId) => {
    if (groupId) {
      try { localStorage.setItem("ar_last_group", groupId); } catch { /* private mode */ }
    }
    sfx.forward();
    navigate("/games/ar");
  };

  return (
    <FramerMotion.motion.div
      className={styles.page}
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: -60 }}
      transition={{ duration: 0.35 }}
    >
      <SEO path="/games" />
      <VideoBackground />
      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.content}>
        <header className={styles.hud}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => { sfx.back(); navigate("/home"); }}
            aria-label={t("gamesPage.back", { defaultValue: "Back" })}
            data-sound="none"
          >
            <FaArrowLeft aria-hidden="true" />
            <span className={styles.backText}>{t("gamesPage.back", { defaultValue: "Back" })}</span>
          </button>
          <span className={styles.titleIcon} aria-hidden="true"><FaGamepad /></span>
          <span className={styles.titleText}>
            <h1 className={styles.title}>{t("gamesPage.title", { defaultValue: "Game Zone" })}</h1>
            <span className={styles.subtitle}>{t("gamesPage.subtitle", { defaultValue: "Step in front of the camera and start playing!" })}</span>
          </span>
        </header>

        <div className={styles.arena}>
          <FramerMotion.motion.button
            type="button"
            className={styles.arCard}
            onClick={() => openHub()}
            data-sound="none"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            whileTap={{ scale: 0.98 }}
          >
            <Mascot size={110} mood="wave" butterfly={false} className={styles.arMascot} />
            <span className={styles.arText}>
              <span className={styles.arIconBadge} aria-hidden="true"><FaCamera /></span>
              <span className={styles.arCardTitle}>{t("gamesPage.ar.title", { defaultValue: "Camera Games" })}</span>
              <span className={styles.arCardDesc}>
                {t("gamesPage.ar.desc", {
                  defaultValue:
                    "See yourself on screen and reach out to play. Over 50 games for moving, looking, remembering and everyday skills.",
                })}
              </span>
              <span className={styles.arCta}>
                <FaHandPaper aria-hidden="true" />
                {t("gamesPage.ar.cta", { defaultValue: "Open Camera Games" })}
              </span>
            </span>
          </FramerMotion.motion.button>

          <section className={styles.groupsWrap} aria-labelledby="games-groups-title">
            <h2 id="games-groups-title" className={styles.groupsTitle}>
              {t("gamesPage.pickWorld", { defaultValue: "Pick a world · {{count}} games", count: GAMES.length })}
            </h2>
            <div className={styles.groups}>
              {GROUPS.map((gr, i) => {
                const Icon = gr.icon;
                const n = gamesInGroup(gr.id).length;
                return (
                  <FramerMotion.motion.button
                    key={gr.id}
                    type="button"
                    className={`${styles.group} ${styles[gr.color] || ""}`}
                    onClick={() => openHub(gr.id)}
                    title={tGroup(gr.id, "blurb", gr.blurb)}
                    data-sound="none"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.05, type: "spring", stiffness: 300, damping: 18 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className={styles.groupIcon} aria-hidden="true"><Icon /></span>
                    <span className={styles.groupName}>{tGroup(gr.id, "title", gr.title)}</span>
                    <span className={styles.groupCount}>
                      {n === 1
                        ? t("ar.hub.footCountSingular", "{{count}} game", { count: n })
                        : t("ar.hub.footCountPlural", "{{count}} games", { count: n })}
                      <FaChevronRight aria-hidden="true" />
                    </span>
                  </FramerMotion.motion.button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </FramerMotion.motion.div>
  );
};

export default GamesPage;
