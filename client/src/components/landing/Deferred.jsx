import { Suspense, useEffect, useRef, useState } from "react";
import styles from "./Landing.module.css";

/**
 * Renders a section (a React.lazy component, so its code is fetched then)
 * when it comes near the screen, or, at the latest, when the browser is idle
 * `idleAfter` ms after the page appeared (so find-in-page, screen readers'
 * browse mode and a jump to the end still reach every section). Until then a
 * placeholder of about the section's height keeps the page from jumping.
 *
 *   <Deferred minHeight={640} idleAfter={5000}><SampleJourney /></Deferred>
 */
export default function Deferred({ minHeight = 480, idleAfter = 8000, children }) {
  const ref = useRef(null);
  const [show, setShow] = useState(() => typeof window === "undefined" || typeof window.IntersectionObserver === "undefined");

  useEffect(() => {
    if (show) return undefined;
    const el = ref.current;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setShow(true);
    }, { rootMargin: "900px 0px" });
    if (el) io.observe(el);
    let idle = null;
    const timer = setTimeout(() => {
      idle = window.requestIdleCallback
        ? window.requestIdleCallback(() => setShow(true), { timeout: 3000 })
        : setTimeout(() => setShow(true), 0);
    }, idleAfter);
    return () => {
      io.disconnect();
      clearTimeout(timer);
      if (idle !== null) {
        if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
        else clearTimeout(idle);
      }
    };
  }, [show, idleAfter]);

  const holder = <div className={styles.slot} style={{ minHeight }} aria-hidden="true" />;
  return (
    <div ref={ref} className={styles.slot}>
      {show ? <Suspense fallback={holder}>{children}</Suspense> : holder}
    </div>
  );
}
