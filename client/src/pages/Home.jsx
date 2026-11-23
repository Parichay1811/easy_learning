import { lazy, Suspense } from "react";
import * as FramerMotion from "framer-motion";
import { useCalmMotion } from "../utils/useCalmMotion";
import { useNavigate } from "react-router-dom";
import Hero from "../components/Hero/Hero";
import VideoBackground from "../components/VideoBackground/VideoBackground";
import SEO from "../components/SEO/SEO";
import { useAuth } from "../context/AuthContext";
import { firebaseConfigured } from "../firebase/auth";
import styles from "./Home.module.css";

// The visitor sections (components/landing): fetched only for visitors, after
// the hero is on screen.
const Landing = lazy(() => import("../components/landing/Landing"));

// Home is a game screen: for a signed-in learner it fills exactly the space
// below the navbar, as before. A visitor gets the same hero, then the page
// scrolls on to the landing sections (the real learning experience, shown
// with samples).
const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const reduce = useCalmMotion();
  // undefined = still resolving. Without Firebase there is nothing left to
  // resolve, so undefined means nobody is signed in.
  const visitor = user === null || (user === undefined && !firebaseConfigured);

  // A visitor's tap anywhere on the hero leads to signing in (unchanged); the
  // landing sections below work on their own.
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
      {visitor && <VideoBackground />}
      <FramerMotion.motion.div
        className={visitor ? styles.page : styles.stage}
        initial={reduce ? { opacity: 0 } : { opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, x: 60 }}
        transition={{ duration: 0.35 }}
      >
        {!visitor && <VideoBackground />}
        <div className={styles.heroFrame} onClickCapture={handleClick}>
          <Hero />
        </div>
        {visitor && (
          <Suspense fallback={null}>
            <Landing />
          </Suspense>
        )}
      </FramerMotion.motion.div>
    </>
  );
};

export default Home;
