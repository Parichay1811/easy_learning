import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as FramerMotion from "framer-motion";
import { FaArrowLeft } from "react-icons/fa";
import VideoBackground from "../VideoBackground/VideoBackground";
import Mascot from "../Mascot/Mascot";
import { useCalmMotion } from "../../utils/useCalmMotion";
import { sfx } from "../../utils/sounds";
import styles from "./OnePage.module.css";

// A content page as one screen, in the site's game style (like the Game Zone):
// a glass header, the puppy in its own place beside a speech bubble, and the
// page's cards filling the rest. Nothing on the page scrolls; a card scrolls on
// its own only if its text cannot fit (very large text settings).
//
// On a phone or a narrow tablet the cards become tabs under the puppy, so each
// one gets the whole screen. Every card stays in the page (only hidden), so the
// words are there for search engines and for "find in page" on a wide screen.
//
//   <OnePage layout="about" icon={<FaHeart />} title="About Us" subtitle="Our Story"
//     greetTitle="Learning, reimagined…" greetText="…" greetTextNarrow={false}
//     sections={[{ id: "story", label: "Story", heading: "…", content: <…/> }, …]} />
//
// `layout` picks the wide arrangement in OnePage.module.css ("about": three cards
// in a row and a strip; "contact": the bubble and a card on the left, the form on
// the right). The first section is the one shown first on a phone.

function useNarrow(below) {
  const query = `(max-width: ${below - 1}px)`;
  const get = () => typeof window !== "undefined" && Boolean(window.matchMedia?.(query).matches);
  const [narrow, setNarrow] = useState(get);
  useEffect(() => {
    const m = window.matchMedia?.(query);
    if (!m) return undefined;
    const on = () => setNarrow(m.matches);
    on();
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, [query]);
  return narrow;
}

export default function OnePage({
  layout = "about",
  icon,
  tone = "orange",
  title,
  subtitle,
  greetTitle,
  greetText,
  greetExtra = null,
  mood = "wave",
  tabsLabel,
  sections = [],
  backTo = "/",
  narrowBelow = 900, // below this width the cards become tabs
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reduce = useCalmMotion();
  const narrow = useNarrow(narrowBelow);
  const [active, setActive] = useState(sections[0]?.id);
  const uid = useId();
  const tabRefs = useRef({});

  const back = () => {
    sfx.back();
    // Back to where the visitor came from inside the site, else to the start.
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(backTo);
  };

  const choose = (id, focus = false) => {
    if (id === active) return;
    sfx.tab();
    setActive(id);
    if (focus) tabRefs.current[id]?.focus();
  };
  const onTabKey = (e, i) => {
    const n = sections.length;
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    let j = null;
    if (step) j = (i + step + n) % n;
    if (e.key === "Home") j = 0;
    if (e.key === "End") j = n - 1;
    if (j === null) return;
    e.preventDefault();
    choose(sections[j].id, true);
  };

  const tabId = (id) => `${uid}-tab-${id}`;
  const panelId = (id) => `${uid}-panel-${id}`;

  return (
    <FramerMotion.motion.div
      className={styles.page}
      data-layout={layout}
      data-narrow={narrow ? "true" : "false"}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <VideoBackground />
      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.content}>
        <header className={styles.hud}>
          <button type="button" className={styles.backBtn} onClick={back} aria-label={t("gamesPage.back", { defaultValue: "Back" })} data-sound="none">
            <FaArrowLeft aria-hidden="true" />
            <span className={styles.backText}>{t("gamesPage.back", { defaultValue: "Back" })}</span>
          </button>
          <span className={`${styles.titleIcon} ${styles[tone] || ""}`} aria-hidden="true">{icon}</span>
          <span className={styles.titleText}>
            <span className={styles.title}>{title}</span>
            {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
          </span>
        </header>

        {/* The puppy's own place, and what it says: the page's opening words. */}
        <section className={styles.greet} aria-labelledby={`${uid}-h1`}>
          <Mascot size="var(--pup)" mood={mood} className={styles.pup} butterfly={false} />
          <div className={styles.bubble}>
            <h1 id={`${uid}-h1`} className={styles.bubbleTitle}>{greetTitle}</h1>
            {/* On a phone the long line moves into the first card (the page passes it there). */}
            {greetText && <p className={`${styles.bubbleText} ${styles.onlyWide}`}>{greetText}</p>}
            {greetExtra}
          </div>
        </section>

        {narrow && sections.length > 1 && (
          <div className={styles.tabs} role="tablist" aria-label={tabsLabel}>
            {sections.map((s, i) => (
              <button
                key={s.id}
                ref={(el) => { tabRefs.current[s.id] = el; }}
                type="button"
                role="tab"
                id={tabId(s.id)}
                aria-selected={active === s.id}
                aria-controls={panelId(s.id)}
                tabIndex={active === s.id ? 0 : -1}
                className={`${styles.tab} ${active === s.id ? styles.tabOn : ""}`}
                onClick={() => choose(s.id)}
                onKeyDown={(e) => onTabKey(e, i)}
                data-sound="none"
              >
                {s.icon && <span className={styles.tabIcon} aria-hidden="true">{s.icon}</span>}
                <span className={styles.tabLabel}>{s.label}</span>
              </button>
            ))}
          </div>
        )}

        {sections.map((s) => {
          const on = !narrow || active === s.id;
          return (
            <section
              key={s.id}
              id={panelId(s.id)}
              className={`${styles.card} ${styles[`area_${s.id}`] || ""} ${s.tone ? styles[s.tone] : ""}`}
              {...(narrow
                ? { role: "tabpanel", "aria-labelledby": tabId(s.id), hidden: !on, tabIndex: 0 }
                : { "aria-labelledby": `${uid}-${s.id}-h` })}
            >
              {s.heading && <h2 id={`${uid}-${s.id}-h`} className={styles.cardTitle}>{s.heading}</h2>}
              {s.content}
            </section>
          );
        })}
      </div>
    </FramerMotion.motion.div>
  );
}

