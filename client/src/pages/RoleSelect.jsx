import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import * as FramerMotion from "framer-motion";
import { useCalmMotion } from "../utils/useCalmMotion";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SEO from "../components/SEO/SEO";
import Mascot from "../components/Mascot/Mascot";
import EntryScene from "../components/Entry/EntryScene";
import RolePicture from "../components/Entry/RolePicture";
import { warmRolePicture } from "../components/Entry/rolePictures";
import { TeamEmblem } from "../components/Entry/RoleEmblems";
import { ROLE_THEME, roleVars } from "../components/Entry/roles";
import { passDoor } from "../components/Entry/door";
import { useDepth, tiltHandlers } from "../components/Entry/useDepth";
import { COMPANY } from "../config/company";
import { afterSplash } from "../components/Entry/splashSignal";
import { sfx, haptic } from "../utils/sounds";
import styles from "./RoleSelect.module.css";

// The first time the page appears in this visit it plays its short entrance
// (with a little sound); coming back from a sign-in page it is simply there.
let shownBefore = false;

const MAIN_ROLES = ["student", "parent", "teacher", "school"];

// How wide a card's picture is drawn (RoleSelect.module.css), for the browser
// to pick the right file.
const CARD_SIZES = "(orientation: landscape) and (max-height: 540px) 76px, (min-width: 900px) and (min-height: 560px) and (min-aspect-ratio: 1/1) min(24vw, 330px), (min-width: 700px) 310px, 47vw";
const TUTOR_SIZES = "64px";

const EASE = [0.2, 0.8, 0.2, 1];

// A calm, cinematic entrance: the cards rise out of the meadow one after the
// other. Movement only (transform and opacity): every card can be pressed
// straight away.
const cardMotion = {
  hidden: { opacity: 0, y: 34, rotateX: 16, scale: 0.94 },
  pop: (i) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    transition: { duration: 0.7, ease: EASE, delay: 0.24 + i * 0.09 },
  }),
  settle: { opacity: 1, y: 0, rotateX: 0, scale: 1, transition: { duration: 0.25, ease: "easeOut" } },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// "/" — who is signing in? A sunny meadow, the puppy says hello, and one big
// picture card per kind of player. Choosing one opens a door of light from
// that card into its sign-in page, and the card's picture carries across.
const RoleSelect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const reduce = useCalmMotion();
  const [first] = useState(() => !shownBefore);
  const [ready, setReady] = useState(() => shownBefore);
  const [chosen, setChosen] = useState(null);
  // Back from a sign-in page: that card takes its picture back (door.js).
  const [homeKey, setHomeKey] = useState(() => location.state?.back || null);
  const pageRef = useRef(null);
  const stageRef = useRef(null);
  const leaving = useRef(false);
  const [waving, setWaving] = useState(false);

  useDepth(pageRef, !reduce);

  useEffect(() => {
    if (shownBefore) return undefined;
    const timers = [];
    const cancel = afterSplash(() => {
      shownBefore = true;
      setReady(true);
      setWaving(true); // a short hello, then calm
      timers.push(setTimeout(() => sfx.pop(), 520), setTimeout(() => setWaving(false), 2600));
    });
    return () => { cancel(); timers.forEach(clearTimeout); };
  }, []);

  // The picture is home: it can lose its transition name (only one may have it).
  useEffect(() => {
    if (!homeKey) return undefined;
    const tm = setTimeout(() => setHomeKey(null), 1400);
    return () => clearTimeout(tm);
  }, [homeKey]);

  const label = {
    student: { name: t("roleSelect.roles.student", "Student"), desc: t("roleSelect.desc.student", "Play games and earn stars") },
    parent: { name: t("roleSelect.roles.parent", "Parent"), desc: t("roleSelect.desc.parent", "Follow your child's learning") },
    teacher: { name: t("roleSelect.roles.teacher", "Teacher"), desc: t("roleSelect.desc.teacher", "Run classes, help every child") },
    school: {
      name: t("roleSelect.roles.school", "School"),
      sub: t("roleSelect.roles.schoolSub", "School admin"),
      desc: t("roleSelect.desc.school", "Set up teachers and classes"),
    },
  };

  const choose = async (key, el) => {
    if (leaving.current) return;
    leaving.current = true;
    const theme = ROLE_THEME[key];
    sfx.enter();
    haptic("select");
    warmRolePicture(key);
    const target = el.querySelector("[data-emblem]") || el;
    const b = target.getBoundingClientRect();
    const x = b.left + b.width / 2;
    const y = b.top + b.height / 2;
    flushSync(() => { setHomeKey(null); setChosen(key); });
    if (!reduce) await sleep(170); // the other cards step back first
    if (!stageRef.current) return; // left by other means meanwhile
    await passDoor({
      x, y, color: theme.color, soft: theme.soft, calm: reduce,
      go: () => flushSync(() => navigate(theme.route, { state: { door: key } })),
      arrived: () => {
        const pg = document.querySelector(`[data-entry-role="${key}"]`);
        if (!pg) return false;
        const img = pg.querySelector("[data-role-hero] img");
        return !img || img.complete;
      },
    });
  };

  // Hover, focus or a press on a card: start fetching its sign-in picture.
  const warm = (key) => () => warmRolePicture(key);
  const variant = !ready ? "hidden" : first ? "pop" : "settle";
  const still = reduce || Boolean(location.state?.back);
  const tilt = tiltHandlers(!reduce);
  const heroName = (key) => ((chosen || homeKey) === key ? { viewTransitionName: "role-hero" } : undefined);

  return (
    <main ref={pageRef} className={`${styles.page} ${first && ready && !reduce ? styles.intro : ""}`}>
      <SEO path="/" />
      <EntryScene />
      {first && !reduce && <div className={`${styles.sweep} ${ready ? styles.sweeping : ""}`} aria-hidden="true" />}

      <div
        ref={stageRef}
        data-role-stage=""
        className={`${styles.stage} ${chosen ? styles.choosing : ""} ${reduce ? styles.still : ""}`}
      >
        <FramerMotion.motion.img
          src="/brand/logo-wordmark.webp"
          alt="Learnigo"
          width="1000"
          height="443"
          className={styles.word}
          draggable="false"
          initial={first && !reduce ? { opacity: 0, y: -18, scale: 0.94 } : false}
          animate={ready ? { opacity: 1, y: 0, scale: 1 } : undefined}
          transition={{ duration: 0.6, ease: EASE }}
        />

        <div className={styles.greet}>
          <Mascot size="var(--pup)" mood={waving ? "wave" : "idle"} />
          <FramerMotion.motion.div
            className={styles.bubble}
            initial={first && !reduce ? { opacity: 0, scale: 0.8, x: -14 } : false}
            animate={ready ? { opacity: 1, scale: 1, x: 0 } : undefined}
            transition={{ duration: 0.55, ease: EASE, delay: 0.12 }}
          >
            <h1 className={styles.title}>{t("roleSelect.welcomeTitle", "Welcome to Learnigo")}</h1>
            <p className={styles.subtitle}>{t("roleSelect.welcomeSubtitle", "Choose how you want to sign in")}</p>
          </FramerMotion.motion.div>
        </div>

        <ul className={styles.cards} aria-label={t("roleSelect.chooseAria", "Who is signing in?")} data-companion-guide="">
          {MAIN_ROLES.map((key, i) => (
            <FramerMotion.motion.li
              key={key}
              className={styles.slot}
              variants={cardMotion}
              custom={i}
              initial={still ? false : "hidden"}
              animate={still ? undefined : variant}
            >
              <button
                type="button"
                data-sound="none"
                data-companion-look=""
                className={`${styles.card} ${chosen === key ? styles.chosen : ""}`}
                style={roleVars(key)}
                onClick={(e) => choose(key, e.currentTarget)}
                onPointerEnter={warm(key)}
                onPointerDown={warm(key)}
                onFocus={warm(key)}
                {...tilt}
              >
                <span className={styles.media}>
                  <span className={styles.frame} data-emblem="" style={heroName(key)}>
                    <RolePicture role={key} sizes={CARD_SIZES} priority className={styles.picture} imgClassName={styles.pic} />
                  </span>
                  <span className={styles.sheen} aria-hidden="true" />
                  {label[key].sub && <span className={styles.chip} aria-hidden="true">{label[key].sub}</span>}
                  <span className={styles.go} aria-hidden="true">
                    <svg viewBox="0 0 20 20" width="100%" height="100%"><path d="M7.5 4.5 L13 10 L7.5 15.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                </span>
                <span className={styles.text}>
                  <span className={styles.name}>{label[key].name}</span>
                  {/* The chip on the picture, for screen readers in reading order. */}
                  {label[key].sub && <span className={styles.srOnly}>{label[key].sub}</span>}
                  <span className={styles.desc}>{label[key].desc}</span>
                </span>
              </button>
            </FramerMotion.motion.li>
          ))}
        </ul>

        <FramerMotion.motion.div
          className={styles.extra}
          variants={cardMotion}
          custom={MAIN_ROLES.length}
          initial={still ? false : "hidden"}
          animate={still ? undefined : variant}
        >
          <button
            type="button"
            data-sound="none"
            data-companion-look=""
            className={`${styles.tutor} ${chosen === "tutor" ? styles.chosen : ""}`}
            style={roleVars("tutor")}
            onClick={(e) => choose("tutor", e.currentTarget)}
            onPointerEnter={warm("tutor")}
            onPointerDown={warm("tutor")}
            onFocus={warm("tutor")}
          >
            <span className={styles.tutorFrame} data-emblem="" style={heroName("tutor")}>
              <RolePicture role="tutor" sizes={TUTOR_SIZES} priority className={styles.picture} imgClassName={styles.tutorPic} />
            </span>
            <span className={styles.tutorText}>
              <strong>{t("roleSelect.tutor.title", "I teach privately")}</strong>
              <span>{t("roleSelect.tutor.desc", "Start a free tutoring workspace")}</span>
            </span>
            <span className={styles.go} aria-hidden="true">
              <svg viewBox="0 0 20 20" width="100%" height="100%"><path d="M7.5 4.5 L13 10 L7.5 15.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </button>
        </FramerMotion.motion.div>

        <FramerMotion.motion.footer
          className={styles.foot}
          initial={first && !reduce ? { opacity: 0 } : false}
          animate={ready ? { opacity: 1 } : undefined}
          transition={{ duration: 0.5, delay: 0.75 }}
        >
          <button
            type="button"
            data-sound="none"
            className={`${styles.team} ${chosen === "team" ? styles.chosen : ""}`}
            style={roleVars("team")}
            onClick={(e) => choose("team", e.currentTarget)}
          >
            <span className={styles.teamEmblem} data-emblem="">
              <TeamEmblem size="100%" />
            </span>
            <span>
              {t("roleSelect.roles.team", "Learnigo team")}
              <span className={styles.teamSub}> · {t("roleSelect.roles.teamSub", "Super admin")}</span>
            </span>
          </button>
          <p className={styles.copyright}>
            {/* Learnigo is a Futuresight Analytics product: the credit opens the company's site. */}
            <a href={COMPANY.url} target="_blank" rel="noopener noreferrer" className={styles.copyrightLink}>
              {t("roleSelect.copyright", { year: new Date().getFullYear(), defaultValue: "A product by © {{year}} Futuresight Analytics Limited" })}
            </a>
          </p>
        </FramerMotion.motion.footer>
      </div>
    </main>
  );
};

export default RoleSelect;
