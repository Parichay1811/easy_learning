import { useEffect, useRef, useState } from "react";
import * as FramerMotion from "framer-motion";
import { useCalmMotion } from "../utils/useCalmMotion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SEO from "../components/SEO/SEO";
import Mascot from "../components/Mascot/Mascot";
import EntryScene from "../components/Entry/EntryScene";
import { StudentEmblem, ParentEmblem, TeacherEmblem, SchoolEmblem, TeamEmblem, TutorEmblem } from "../components/Entry/RoleEmblems";
import { ROLE_THEME, roleVars } from "../components/Entry/roles";
import { openDoor, closeDoor } from "../components/Entry/door";
import { COMPANY } from "../config/company";
import { afterSplash } from "../components/Entry/splashSignal";
import { sfx, haptic } from "../utils/sounds";
import styles from "./RoleSelect.module.css";

// The first time the cards appear in this visit they pop in (with a little
// sound); coming back from a sign-in page they just settle into place.
let shownBefore = false;

const MAIN_ROLES = [
  { key: "student", Emblem: StudentEmblem },
  { key: "parent", Emblem: ParentEmblem },
  { key: "teacher", Emblem: TeacherEmblem },
  { key: "school", Emblem: SchoolEmblem },
];

const cardMotion = {
  hidden: { opacity: 0, scale: 0.55, y: 26 },
  pop: (i) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 17, delay: 0.12 + i * 0.08 },
  }),
  settle: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

// "/" — choose your player: who is signing in? A bright meadow, the puppy
// says hello, and one big card per kind of player. Choosing one opens a door
// of light from that card into its sign-in page (with the "stepping inside"
// sound).
const RoleSelect = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const reduce = useCalmMotion();
  const [first] = useState(() => !shownBefore);
  const [ready, setReady] = useState(() => shownBefore);
  const [chosen, setChosen] = useState(null);
  const [origin, setOrigin] = useState(null);
  const stageRef = useRef(null);
  const leaving = useRef(false);

  const [waving, setWaving] = useState(false);

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
    const target = el.querySelector("[data-emblem]") || el;
    const b = target.getBoundingClientRect();
    const x = b.left + b.width / 2;
    const y = b.top + b.height / 2;
    const st = stageRef.current?.getBoundingClientRect();
    if (st) setOrigin(`${Math.round(x - st.left)}px ${Math.round(y - st.top)}px`);
    setChosen(key);
    await openDoor({ x, y, color: theme.color, soft: theme.soft });
    if (!stageRef.current) { closeDoor(0); return; } // left by other means meanwhile
    navigate(theme.route, { state: { door: key } });
    closeDoor();
  };

  const variant = !ready ? "hidden" : first ? "pop" : "settle";

  return (
    <main className={styles.page}>
      <SEO path="/" />
      <EntryScene />

      <div
        ref={stageRef}
        className={`${styles.stage} ${chosen ? styles.choosing : ""} ${reduce ? styles.still : ""}`}
        style={origin ? { transformOrigin: origin } : undefined}
      >
        <FramerMotion.motion.img
          src="/brand/logo-wordmark.webp"
          alt="Learnigo"
          className={styles.word}
          draggable="false"
          initial={first && !reduce ? { opacity: 0, y: -14 } : false}
          animate={ready ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />

        <div className={styles.greet}>
          <Mascot size="var(--pup)" mood={waving ? "wave" : "idle"} />
          <FramerMotion.motion.div
            className={styles.bubble}
            initial={first && !reduce ? { opacity: 0, scale: 0.7, x: -12 } : false}
            animate={ready ? { opacity: 1, scale: 1, x: 0 } : undefined}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
          >
            <h1 className={styles.title}>{t("roleSelect.welcomeTitle", "Welcome to Learnigo")}</h1>
            <p className={styles.subtitle}>{t("roleSelect.welcomeSubtitle", "Choose how you want to sign in")}</p>
          </FramerMotion.motion.div>
        </div>

        <ul className={styles.cards} aria-label={t("roleSelect.chooseAria", "Who is signing in?")}>
          {MAIN_ROLES.map((role, i) => {
            const { key, Emblem } = role;
            return (
            <FramerMotion.motion.li
              key={key}
              className={styles.slot}
              variants={cardMotion}
              custom={i}
              initial={reduce ? false : "hidden"}
              animate={reduce ? undefined : variant}
            >
              <button
                type="button"
                data-sound="none"
                className={`${styles.card} ${chosen === key ? styles.chosen : ""}`}
                style={roleVars(key)}
                onClick={(e) => choose(key, e.currentTarget)}
              >
                <span className={styles.emblem} data-emblem="">
                  <Emblem size="100%" />
                </span>
                <span className={styles.text}>
                  <span className={styles.name}>{label[key].name}</span>
                  {label[key].sub && <span className={styles.sub}>{label[key].sub}</span>}
                  <span className={styles.desc}>{label[key].desc}</span>
                </span>
                <span className={styles.go} aria-hidden="true">
                  <svg viewBox="0 0 20 20" width="100%" height="100%"><path d="M7.5 4.5 L13 10 L7.5 15.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              </button>
            </FramerMotion.motion.li>
            );
          })}
        </ul>

        <FramerMotion.motion.div
          className={styles.extra}
          variants={cardMotion}
          custom={MAIN_ROLES.length}
          initial={reduce ? false : "hidden"}
          animate={reduce ? undefined : variant}
        >
          <button
            type="button"
            data-sound="none"
            className={`${styles.tutor} ${chosen === "tutor" ? styles.chosen : ""}`}
            style={roleVars("tutor")}
            onClick={(e) => choose("tutor", e.currentTarget)}
          >
            <span className={styles.tutorEmblem} data-emblem="">
              <TutorEmblem size="100%" />
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

        <footer className={styles.foot}>
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
        </footer>
      </div>
    </main>
  );
};

export default RoleSelect;
