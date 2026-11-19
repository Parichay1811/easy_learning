import * as FramerMotion from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Hero from "../components/Hero/Hero";
import VideoBackground from "../components/VideoBackground/VideoBackground";
import SEO from "../components/SEO/SEO";
import { useAuth } from "../context/AuthContext";
import styles from "./Home.module.css";

// Home is a game screen: it fills exactly the space below the navbar.
const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const handleClick = (e) => {
    if (user === undefined) return; // still resolving auth — do nothing
    if (!user) {
      e.stopPropagation();
      navigate("/login?role=student");
    }
  };

  return (
    <>
      <SEO
        title="Learnigo Home | Continue Your Learning Adventure"
        description="Jump back into gamified English, Maths and Science practice on Learnigo — pick up where you left off or start a new adventure."
        path="/home"
      />
      <FramerMotion.motion.div
        className={styles.stage}
        initial={reduce ? { opacity: 0 } : { opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, x: 60 }}
        transition={{ duration: 0.35 }}
        onClickCapture={handleClick}
      >
        <VideoBackground />
        <Hero />
      </FramerMotion.motion.div>
    </>
  );
};

export default Home;
