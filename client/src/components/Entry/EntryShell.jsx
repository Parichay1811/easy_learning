// The frame every sign-in page shares: the sunny meadow, a back button, the
// Learnigo letters, the role's painted picture (the same one as on its card
// on "/"), the puppy with a speech bubble that answers the obvious question
// for this kind of player, and one card with a warm welcome and the sign-in.
//
// Pages keep their own auth logic; they pass the pieces in:
//   <EntryShell role="parent" title="Parent sign in" welcome="Welcome, parents"
//     subtitle="…" tip="…" footer={<…/>} error={error}>
//     <GoogleButton main onClick={…}>Continue with Google</GoogleButton>
//     {error && <EntryError>{error}</EntryError>}
//   </EntryShell>
// A role without a picture (the Learnigo team) passes `emblem` instead.
// `long`: a long form (the page scrolls instead of fitting one screen).
//
// Arriving from "/": with View Transitions the card's picture has flown into
// this page's picture (door.js), and the card, the puppy and the "new here?"
// panel follow it in; otherwise the door of light fades to show the page.
// An error plays sfx.error() with a gentle shake; "Back" sends the picture
// home to its card; any other way out (a successful sign-in) zooms forward,
// "stepping inside".
import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import * as FramerMotion from "framer-motion";
import { useCalmMotion } from "../../utils/useCalmMotion";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Mascot from "../Mascot/Mascot";
import EntryScene from "./EntryScene";
import RolePicture from "./RolePicture";
import { hasRolePicture, HERO_SIZES, ROLE_FOCUS } from "./rolePictures";
import { ROLE_THEME, roleVars } from "./roles";
import { passDoor, canMorph } from "./door";
import { afterSplash, splashActive } from "./splashSignal";
import { useDepth } from "./useDepth";
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

const EASE = [0.2, 0.8, 0.2, 1];

// Each piece of the page rises into place a moment after the one before.
const piece = (delay) => ({
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, delay } },
});
const calmPiece = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.2 } } };
// The picture, when it did not fly in: a camera settling on it.
const heroIn = {
  hidden: { opacity: 0, scale: 1.06 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: EASE } },
};

export default function EntryShell({ role = "student", emblem: Emblem, title, badge, subtitle, welcome, tip, footer, error, long = false, children }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const reduce = useCalmMotion();
  // How the visitor got here: the picture flew in ("morph"), through the classic
  // door of light ("door"), or straight to this address ("plain").
  const [arrival] = useState(() => {
    if (typeof document !== "undefined" && document.documentElement.dataset.door === "in") return "morph";
    return location.state?.door ? "door" : "plain";
  });
  const [ready, setReady] = useState(() => arrival !== "plain" || !splashActive());
  const [leaving, setLeaving] = useState("in");
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const shakeRef = useRef(null);
  const firstError = useRef(error);
  const busy = useRef(false);
  const titleId = useId();
  const theme = ROLE_THEME[role] || ROLE_THEME.student;
  const picture = hasRolePicture(role);

  useDepth(pageRef, !reduce);

  // Straight to this address: the splash is up; play the entrance once it has gone.
  useEffect(() => {
    if (ready) return undefined;
    return afterSplash(() => setReady(true));
  }, [ready]);

  // A problem: a low, kind "uh-oh" and a little shake (not for a message the
  // page opened with, like "your session ended").
  useEffect(() => {
    if (!error || error === firstError.current) return;
    sfx.error();
    haptic("error");
    if (!reduce) shakeRef.current?.animate?.(SHAKE, { duration: 420, easing: "ease-in-out" });
  }, [error, reduce]);

  const goBack = async () => {
    if (busy.current) return;
    busy.current = true;
    sfx.back();
    const morph = !reduce && canMorph();
    flushSync(() => setLeaving(morph ? "morph" : "back"));
    const b = heroRef.current?.getBoundingClientRect();
    const x = b && b.width ? b.left + b.width / 2 : window.innerWidth / 2;
    const y = b && b.height ? b.top + b.height / 2 : window.innerHeight / 2;
    await passDoor({
      back: true, x, y, soft: theme.soft, calm: !morph,
      go: () => flushSync(() => navigate("/", { state: { back: role } })),
      arrived: () => {
        const stage = document.querySelector("[data-role-stage]");
        if (!stage) return false;
        const img = stage.querySelector('[style*="role-hero"] img');
        return !img || img.complete;
      },
    });
  };

  const exit = leaving === "morph"
    ? undefined
    : reduce
      ? { opacity: 0, transition: { duration: 0.15 } }
      : leaving === "back"
        ? { opacity: 0, scale: 0.94, transition: { duration: 0.22, ease: "easeIn" } }
        : { opacity: 0, scale: 1.06, transition: { duration: 0.28, ease: "easeIn" } };

  const still = reduce || arrival === "morph" ? null : heroIn;
  const p = (delay) => (reduce ? calmPiece : piece(delay));

  return (
    <div ref={pageRef} className={`${s.page} ${long ? s.long : ""}`} style={roleVars(role)} data-entry-role={role}>
      <EntryScene tint={theme.color} butterflies={2} />

      <header className={s.top}>
        <button type="button" className={s.back} data-sound="none" onClick={goBack} aria-label={t("entry.backAria", "Back: choose who you are")}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
            <path d="M14.5 5 L7.5 12 L14.5 19" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className={s.backText}>{t("entry.back", "Back")}</span>
        </button>
        <img className={s.word} src="/brand/logo-wordmark.webp" width="1000" height="443" alt="Learnigo" draggable="false" />
        <span className={s.topEnd} aria-hidden="true" />
      </header>

      <FramerMotion.motion.main
        className={`${s.stage} ${picture ? s.withHero : ""}`}
        initial={reduce && arrival === "morph" ? false : "hidden"}
        animate={ready ? "show" : "hidden"}
        exit={exit}
        variants={{ hidden: { opacity: 1 }, show: { opacity: 1 } }}
      >
        {picture && (
          <FramerMotion.motion.div
            ref={heroRef}
            className={s.hero}
            data-role-hero={role}
            style={{ viewTransitionName: "role-hero", "--focus": ROLE_FOCUS[role] }}
            variants={still || undefined}
          >
            <RolePicture role={role} sizes={HERO_SIZES} priority className={s.heroPicture} imgClassName={s.heroPic} />
          </FramerMotion.motion.div>
        )}

        <FramerMotion.motion.aside className={s.side} variants={p(0.3)}>
          <img className={s.sideWord} src="/brand/logo-wordmark.webp" width="1000" height="443" alt="Learnigo" draggable="false" />
          {tip && (
            <div className={s.pupRow}>
              <Mascot size="var(--pup)" mood={error ? "think" : "idle"} className={s.pup} />
              <p className={s.bubble}>{tip}</p>
            </div>
          )}
        </FramerMotion.motion.aside>

        <div className={s.col}>
          <FramerMotion.motion.section className={s.cardWrap} aria-labelledby={titleId} variants={p(0.12)}>
            <div className={s.card} ref={shakeRef}>
              <div className={s.head}>
                {!picture && Emblem && (
                  <span className={s.medal}>
                    <Emblem size="100%" />
                  </span>
                )}
                <div className={s.headText}>
                  {welcome && <p className={s.welcome}>{welcome}</p>}
                  <h1 id={titleId} className={s.title}>{title}</h1>
                  {badge && <span className={s.badge}>{badge}</span>}
                  {subtitle && <p className={s.subtitle}>{subtitle}</p>}
                </div>
              </div>
              <div className={s.body}>{children}</div>
            </div>
          </FramerMotion.motion.section>

          {footer && <FramerMotion.motion.div className={s.foot} variants={p(0.38)}>{footer}</FramerMotion.motion.div>}
        </div>
      </FramerMotion.motion.main>
    </div>
  );
}

/** The big white "Continue with Google" button. `main` makes it the page's primary action. */
export function GoogleButton({ main = false, children, ...rest }) {
  return (
    <button type="button" data-sound="open" className={`${s.google} ${main ? s.googleMain : ""}`} {...(main ? { "data-companion-look": "", "data-companion-guide": "" } : {})} {...rest}>
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

/**
 * A labelled text box with an icon: the label stays visible above the box
 * (a placeholder disappears as soon as you type).
 *   <EntryField icon={FaEnvelope} label="Email address" type="email" … />
 */
export function EntryField({ icon: Icon, label, id, after, className = "", ...input }) {
  const auto = useId();
  const fieldId = id || auto;
  return (
    <div className={s.fieldWrap}>
      <label className={s.label} htmlFor={fieldId}>{label}</label>
      <div className={s.field}>
        {Icon && <Icon className={s.fieldIcon} aria-hidden="true" />}
        <input id={fieldId} className={`${s.input} ${after ? s.inputWithAfter : ""} ${className}`} {...input} />
        {after}
      </div>
    </div>
  );
}

/** A password box with a "show password" eye button (48 px), so nobody has to type blind. */
export function PasswordField({ icon, label, ...input }) {
  const { t } = useTranslation();
  const [shown, setShown] = useState(false);
  return (
    <EntryField
      icon={icon}
      label={label}
      type={shown ? "text" : "password"}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck="false"
      {...input}
      after={(
        <button
          type="button"
          className={s.reveal}
          data-sound="toggle"
          aria-pressed={shown}
          aria-label={t("entry.showPassword", "Show password")}
          title={t("entry.showPassword", "Show password")}
          onClick={() => setShown((v) => !v)}
        >
          {shown ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
        </button>
      )}
    />
  );
}
