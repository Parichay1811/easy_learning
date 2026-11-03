import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import * as FramerMotion from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaTimes } from "react-icons/fa";
import { BsStars } from "react-icons/bs";
import AIAssistantOrb from "./AIAssistantOrb";
import { playSlide } from "../../utils/sounds";
import styles from "./AIAssistantWidget.module.css";

// The standalone "Learnigo live teacher" voice assistant runs as its own
// server (client/src/learnigo-ai-assistant) — not part of this React build.
// Local dev talks to it on its default port; production points this at the
// assistant's own subdomain (see DEPLOY.md). Until that env var is set for a
// given build, the widget stays hidden rather than linking to a dead/local URL.
const ASSISTANT_URL = import.meta.env.VITE_AI_ASSISTANT_URL;

// The AI voice assistant trigger. At 430px and up it floats bottom-right over
// the page; below that it sits inline in the navbar next to the hamburger,
// since a fixed circle would otherwise overlap small-screen content.
// Clicking it opens the live assistant (a separate app) in an embedded panel.
const COMPACT_QUERY = "(max-width: 429px)";

const AIAssistantWidget = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.(COMPACT_QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia?.(COMPACT_QUERY);
    if (!mql) return undefined;
    const handleChange = (e) => setIsCompact(e.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const handleOpen = () => { playSlide(); setOpen(true); };
  const handleClose = () => { playSlide(); setOpen(false); };

  if (!ASSISTANT_URL) return null;

  const trigger = (
    <button
      type="button"
      className={styles.fab}
      onClick={handleOpen}
      aria-label={t("aiAssistant.openLabel", { defaultValue: "Talk to your AI voice assistant" })}
    >
      {isCompact ? <BsStars className={styles.fabIcon} /> : <AIAssistantOrb size={56} />}
      <span className={styles.fabLabel}>
        {t("aiAssistant.askAiLabel", { defaultValue: "Ask AI" })}
      </span>
    </button>
  );

  return (
    <>
      {/* Below 430px the trigger sits inline in the navbar, next to the
          hamburger. At 430px and up it must float over the whole viewport,
          so it's portaled to the body — the navbar's backdrop-filter would
          otherwise make `.bar` the containing block for `position: fixed`,
          anchoring the button to the navbar strip instead of the page. */}
      {isCompact ? trigger : createPortal(trigger, document.body)}

      {createPortal(
        <FramerMotion.AnimatePresence>
          {open && (
            <FramerMotion.motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={handleClose}
            >
              <FramerMotion.motion.div
                className={styles.panel}
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.header}>
                  <div className={styles.headerBadge}>
                    <AIAssistantOrb size={32} />
                  </div>
                  <h2 className={styles.title}>
                    {t("aiAssistant.title", { defaultValue: "Learnigo AI Voice Assistant" })}
                  </h2>
                  <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={handleClose}
                    aria-label={t("aiAssistant.closeLabel", { defaultValue: "Close" })}
                  >
                    <FaTimes />
                  </button>
                </div>
                <iframe
                  className={styles.frame}
                  src={ASSISTANT_URL}
                  title={t("aiAssistant.title", { defaultValue: "Learnigo AI Voice Assistant" })}
                  allow="microphone; autoplay"
                />
              </FramerMotion.motion.div>
            </FramerMotion.motion.div>
          )}
        </FramerMotion.AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default AIAssistantWidget;
