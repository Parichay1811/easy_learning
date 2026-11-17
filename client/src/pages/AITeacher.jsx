import { useTranslation } from "react-i18next";
import * as FramerMotion from "framer-motion";
import VideoBackground from "../components/VideoBackground/VideoBackground";
import SEO from "../components/SEO/SEO";
import styles from "./AITeacher.module.css";

// The AI teacher as a page of the site: the site's navbar, background and
// footer around it, the teacher itself filling the rest. Its own page (plain
// ES modules, served at /ai-assistant/ by client/scripts/ai-assistant-static.mjs)
// is embedded from the same origin; it hides its own logo when embedded.
const AITeacher = () => {
  const { t } = useTranslation();
  const title = t("aiTeacher.title", { defaultValue: "AI Teacher" });

  return (
    <FramerMotion.motion.div
      className={styles.page}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35 }}
    >
      <SEO
        title="AI Teacher | Ask Out Loud, Learn with Pictures | Learnigo"
        description="Learnigo's AI teacher answers questions out loud with a drawn, narrated mini-lesson, then tests you — dyslexia-friendly, voice-first help with maths, science, English and more."
        path="/ai-teacher"
      />
      <VideoBackground />
      <div className={styles.frameWrap}>
        <iframe
          className={styles.frame}
          src="/ai-assistant/"
          title={title}
          allow="microphone; autoplay"
        />
      </div>
    </FramerMotion.motion.div>
  );
};

export default AITeacher;
