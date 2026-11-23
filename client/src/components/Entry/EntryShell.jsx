// The frame every sign-in page shares: the sunny meadow, a back button, the
// Learnigo letters, the puppy with a speech bubble that answers the obvious
// question for this kind of player, and one card with the sign-in itself.
// Fits one screen on phones (portrait and landscape), tablets and desktops.
//
// Pages keep their own auth logic; they pass the pieces in:
//   <EntryShell role="parent" emblem={ParentEmblem} title="Parent sign in"
//     subtitle="…" tip="…" footer={<…/>} error={error}>
//     <GoogleButton main onClick={…}>Continue with Google</GoogleButton>
//     {error && <EntryError>{error}</EntryError>}
//   </EntryShell>
//
// Sounds and motion: arriving through the role page's door of light the card
// zooms in as the light fades; an error plays sfx.error() with a gentle
// shake; "Back" plays sfx.back() and the card steps back out; any other way
// out (a successful sign-in) zooms forward, "stepping inside".
import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import * as FramerMotion from "framer-motion";
import { useCalmMotion } from "../../utils/useCalmMotion";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FcGoogle } from "react-icons/fc";
import Mascot from "../Mascot/Mascot";
import EntryScene from "./EntryScene";
import { ROLE_THEME, roleVars } from "./roles";
import { sfx, haptic } from "../../utils/sounds";
import s from "./Entry.module.css";

const SHAKE = [
  { transform: "translateX(0)" },
  { transform: "translateX(-9px)" },
  { transform: "translateX(8px)" },
  { transform: "translateX(-5px)" },
  { transform: "translateX(3px)" },
  { transform: "translateX(0)" },
];

export default function EntryShell({ role = "student", emblem: Emblem, title, badge, subtitle, tip, footer, error, children }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const reduce = useCalmMotion();
  const viaDoor = Boolean(location.state?.door);
  const [leaving, setLeaving] = useState("in");
  const shakeRef = useRef(null);
  const firstError = useRef(error);
  const titleId = useId();
  const theme = ROLE_THEME[role] || ROLE_THEME.student;

  // A problem: a low, kind "uh-oh" and a little shake (not for a message the
  // page opened with, like "your session ended").
  useEffect(() => {
    if (!error || error === firstError.current) return;
    sfx.error();
    haptic("error");
    if (!reduce) shakeRef.current?.animate?.(SHAKE, { duration: 420, easing: "ease-in-out" });
  }, [error, reduce]);

  const goBack = () => {
    flushSync(() => setLeaving("back"));
    sfx.back();
    navigate("/");
  };

  const stage = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.25 } }, exit: { opacity: 0, transition: { duration: 0.15 } } }
    : {
        initial: viaDoor ? { opacity: 0, scale: 0.88 } : { opacity: 0, y: 16 },
        animate: {
          opacity: 1,
          scale: 1,
          y: 0,
          transition: viaDoor ? { duration: 0.55, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 } : { duration: 0.35, ease: "easeOut" },
        },
        exit: leaving === "back"
          ? { opacity: 0, scale: 0.92, transition: { duration: 0.22, ease: "easeIn" } }
          : { opacity: 0, scale: 1.08, transition: { duration: 0.28, ease: "easeIn" } },
      };

  return (
    <div className={s.page} style={roleVars(role)}>
      <EntryScene tint={theme.color} butterflies={2} />

      <header className={s.top}>
        <button type="button" className={s.back} data-sound="none" onClick={goBack} aria-label={t("entry.backAria", "Back: choose who you are")}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
            <path d="M14.5 5 L7.5 12 L14.5 19" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className={s.backText}>{t("entry.back", "Back")}</span>
        </button>
        <img className={s.word} src="/brand/logo-wordmark.webp" alt="Learnigo" draggable="false" />
        <span className={s.topEnd} aria-hidden="true" />
      </header>

      <FramerMotion.motion.main className={s.stage} {...stage}>
        <aside className={s.side}>
          <img className={s.sideWord} src="/brand/logo-wordmark.webp" alt="Learnigo" draggable="false" />
          {tip && (
            <div className={s.pupRow}>
              <Mascot size="var(--pup)" mood={error ? "think" : "idle"} className={s.pup} />
              <p className={s.bubble}>{tip}</p>
            </div>
          )}
        </aside>

        <div className={s.col}>
          <section className={s.cardWrap} aria-labelledby={titleId}>
            <div className={s.card} ref={shakeRef}>
              <div className={s.head}>
                {Emblem && (
                  <span className={s.medal}>
                    <Emblem size="100%" />
                  </span>
                )}
                <div className={s.headText}>
                  <h1 id={titleId} className={s.title}>{title}</h1>
                  {badge && <span className={s.badge}>{badge}</span>}
                  {subtitle && <p className={s.subtitle}>{subtitle}</p>}
                </div>
              </div>
              <div className={s.body}>{children}</div>
            </div>
          </section>

          {footer && <div className={s.foot}>{footer}</div>}
        </div>
      </FramerMotion.motion.main>
    </div>
  );
}

/** The big white "Continue with Google" button. `main` makes it the page's primary action. */
export function GoogleButton({ main = false, children, ...rest }) {
  return (
    <button type="button" data-sound="open" className={`${s.google} ${main ? s.googleMain : ""}`} {...rest}>
      <span className={s.gBadge} aria-hidden="true"><FcGoogle /></span>
      <span>{children}</span>
    </button>
  );
}

/** A friendly problem message (announced to screen readers). */
export function EntryError({ children }) {
  return (
    <p className={s.error} role="alert">
      <span className={s.errorIcon} aria-hidden="true">!</span>
      <span>{children}</span>
    </p>
  );
}

/** "or" between two ways of signing in. */
export function EntryDivider({ children }) {
  return (
    <div className={s.divider}>
      <span>{children}</span>
    </div>
  );
}
