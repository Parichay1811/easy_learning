import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import * as FramerMotion from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaTimes } from "react-icons/fa";
import { BsStars } from "react-icons/bs";
import AIAssistantOrb from "./AIAssistantOrb";
import { playSlide } from "../../utils/sounds";
import styles from "./AIAssistantWidget.module.css";

// The AI voice assistant is part of this site: its page is served at
// /ai-assistant/ (client/scripts/ai-assistant-static.mjs) and it talks to the
// same API at /api/ai-assistant/* (server/ai-assistant/). Same origin, so the
// embedded page needs no separate host, CORS or env var.
const ASSISTANT_URL = "/ai-assistant/";

// The AI Teacher trigger. At 430px and up it floats bottom-right over
// the page; below that it sits inline in the navbar next to the hamburger,
// since a fixed circle would otherwise overlap small-screen content.
// Clicking it opens the AI Teacher in an embedded panel; on a phone,
// where that panel would fill the screen anyway, it opens the AI Teacher page
// instead (the site's navbar above, the whole lesson scrolling below).
const COMPACT_QUERY = "(max-width: 429px)";

// Closing the panel stops the teacher's voice at once (the panel takes a moment
// to animate away, and no lesson should go on talking in the background).
function silence(frameRef) {
  try {
    frameRef.current?.contentWindow?.teacher?.silence?.();
  } catch { /* not loaded yet: nothing is speaking */ }
}
const PHONE_QUERY = "(max-width: 720px)";

const AIAssistantWidget = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const frameRef = useRef(null);
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
    const handleKey = (e) => { if (e.key === "Escape") { silence(frameRef); setOpen(false); } };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // The AI Teacher page already is the assistant: no second way in on top of it.
  if (pathname === "/ai-teacher") return null;

  const handleOpen = () => {
    playSlide();
    if (window.matchMedia?.(PHONE_QUERY).matches) navigate("/ai-teacher");
    else setOpen(true);
  };
  const handleClose = () => { silence(frameRef); playSlide(); setOpen(false); };

  const trigger = (
    <button
      type="button"
      className={styles.fab}
      onClick={handleOpen}
      aria-label={t("aiAssistant.openLabel", { defaultValue: "Talk to your AI Teacher" })}
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
                    {t("aiAssistant.title", { defaultValue: "AI Teacher" })}
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
                  ref={frameRef}
                  className={styles.frame}
                  src={ASSISTANT_URL}
                  title={t("aiAssistant.title", { defaultValue: "AI Teacher" })}
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
