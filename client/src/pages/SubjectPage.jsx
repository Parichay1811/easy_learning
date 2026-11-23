import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import * as FramerMotion from "framer-motion";
import { useCalmMotion } from "../utils/useCalmMotion";
import { fetchModuleStars } from "../store/slices/dashboardSlice";
import VideoBackground from "../components/VideoBackground/VideoBackground";
import SEO from "../components/SEO/SEO";
import { SubjectHeader, ModuleGrid } from "../components/SubjectOverlay/SubjectOverlay";
import Mascot from "../components/Mascot/Mascot";
import styles from "./SubjectPage.module.css";
import { sfx } from "../utils/sounds";
import { FaArrowLeft } from "react-icons/fa";


// A subject as a game level-select: back, the subject, its four modules.
const SubjectPage = () => {
  const { subject } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const reduce = useCalmMotion();

  useEffect(() => {
    if (localStorage.getItem("jwt_token")) dispatch(fetchModuleStars());
  }, [dispatch]);

  const subjectKey = ["english", "maths", "science"].includes(subject) ? subject : null;

  return (
    <FramerMotion.motion.div
      className={styles.page}
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: -60 }}
      transition={{ duration: 0.35 }}
    >
      {subjectKey && (
        <SEO path={`/subject/${subjectKey}`} />
      )}
      <VideoBackground />
      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.content}>
        <header className={styles.hud}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => { sfx.back(); navigate("/home"); }}
            aria-label={t("subjectPage.back")}
            data-sound="none"
          >
            <FaArrowLeft aria-hidden="true" />
            <span className={styles.backText}>{t("subjectPage.back")}</span>
          </button>
          <SubjectHeader subject={subject} className={styles.header} />
          <Mascot size={84} mood="wave" butterfly={false} className={styles.mascot} />
        </header>

        <div className={styles.gridWrap}>
          <ModuleGrid
            subject={subject}
            onPick={(type) => { sfx.forward(); navigate(`/module/${type}/${subject}`); }}
          />
        </div>
      </div>
    </FramerMotion.motion.div>
  );
};

export default SubjectPage;
