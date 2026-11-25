import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { narrate } from "../../utils/narrator";
import { getSpeechLang } from "../../utils/speechLang";
import { usePrefs } from "../settings/usePrefs";
import { useCalmMotion } from "../../utils/useCalmMotion";
import { pickGuide, placeHand } from "./pickGuide";
import { GUIDE_EVENT } from "./nudge";
import s from "./guide.module.css";

const FIRST_MS = 1500; // after a page settles, before the hand first shows
const IDLE_MS = 9000; // without a tap, the hand comes back
const AGAIN_MS = 30000; // without a tap for this long, the words are said once more

const visible = (el) => {
  const r = el.getBoundingClientRect();
  if (r.width < 8 || r.height < 8) return false;
  if (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) return false;
  const st = getComputedStyle(el);
  return st.visibility !== "hidden" && st.display !== "none" && Number(st.opacity) > 0.05;
};

/**
 * Shows a learner where to tap next: a pointing hand and a soft glow on the ONE thing a
 * page has marked, and the instruction said aloud once. So a child who does not follow
 * the words still sees where to go.
 *
 * A page marks its next step on the element itself:
 *   <button data-guide="start" data-guide-say={t("…", "Tap the big orange button to start.")}>
 * with data-guide-order when there are several (lowest first). Mount <GuideCoach /> once.
 *
 * The hand hides the moment the learner touches anything and comes back after a quiet
 * while. It never blocks a tap (pointer-events: none), is hidden from screen readers (the
 * words reach them through the narrator's captions), keeps still under "less movement",
 * and can be switched off in the comfort settings ("Show me where to tap").
 */
export default function GuideCoach() {
  const { pathname, search } = useLocation();
  const { i18n } = useTranslation();
  const prefs = usePrefs();
  const calm = useCalmMotion();
  const on = prefs.guide !== false;
  const [spot, setSpot] = useState(null); // { key, rect, hand }
  const target = useRef(null);
  const said = useRef(new Map()); // key -> when it was last said, on this page
  const done = useRef(new Set()); // keys already tapped on this page
  const timer = useRef(0);
  const lastTouch = useRef(0);

  const place = useCallback(() => {
    const el = target.current;
    if (!el || !el.isConnected || !visible(el)) { setSpot(null); return; }
    const r = el.getBoundingClientRect();
    const rect = { left: r.left, top: r.top, width: r.width, height: r.height };
    setSpot({ key: el.dataset.guide, rect, hand: placeHand(rect, { width: window.innerWidth, height: window.innerHeight }) });
  }, []);

  const look = useCallback((speak = true) => {
    if (!on || document.hidden) return;
    const els = [...document.querySelectorAll("[data-guide]")];
    // An open dialog (some pages keep a closed one in the page, hidden).
    const dialog = [...document.querySelectorAll('[role="dialog"], dialog[open]')].reverse().find((el) => !el.closest('[aria-hidden="true"]') && visible(el)) || null;
    const list = els.map((el) => ({
      key: el.dataset.guide, order: Number(el.dataset.guideOrder) || 5, visible: visible(el),
      disabled: el.disabled || el.getAttribute("aria-disabled") === "true", inDialog: Boolean(dialog && dialog.contains(el)), done: done.current.has(el.dataset.guide),
    }));
    const i = pickGuide(list, { dialogOpen: Boolean(dialog) });
    target.current = i < 0 ? null : els[i];
    place();
    if (i < 0 || !speak) return;
    const el = els[i];
    const text = el.dataset.guideSay;
    const last = said.current.get(el.dataset.guide) || 0;
    if (text && (!last || Date.now() - last > AGAIN_MS)) {
      said.current.set(el.dataset.guide, Date.now());
      // After whatever is being said now (a greeting, a question), never over it.
      narrate(text, { lang: getSpeechLang(el.dataset.guideLang || i18n.language), queue: true });
    }
  }, [on, place, i18n.language]);

  const hideAndWait = useCallback(() => {
    lastTouch.current = Date.now();
    target.current = null;
    setSpot(null);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => look(true), IDLE_MS);
  }, [look]);

  // A new page: forget what was said and tapped, and look once it has settled.
  useEffect(() => {
    said.current = new Map();
    done.current = new Set();
    target.current = null;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => look(true), FIRST_MS);
    return () => clearTimeout(timer.current);
  }, [pathname, search, look]);

  useEffect(() => {
    if (!on) return undefined;
    const onDown = (e) => {
      const hit = e.target?.closest?.("[data-guide]");
      if (hit) done.current.add(hit.dataset.guide);
      hideAndWait();
    };
    const onKey = (e) => { if (e.key !== "Shift" && e.key !== "Control" && e.key !== "Alt" && e.key !== "Meta") hideAndWait(); };
    const onMove = () => { if (target.current) place(); };
    const onAsk = () => { clearTimeout(timer.current); timer.current = setTimeout(() => look(true), 500); };
    const onVis = () => { if (document.hidden) { target.current = null; setSpot(null); } };
    window.addEventListener("pointerdown", onDown, { capture: true, passive: true });
    window.addEventListener("keydown", onKey, { capture: true });
    window.addEventListener("scroll", onMove, { capture: true, passive: true });
    window.addEventListener("resize", onMove, { passive: true });
    window.addEventListener(GUIDE_EVENT, onAsk);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pointerdown", onDown, { capture: true });
      window.removeEventListener("keydown", onKey, { capture: true });
      window.removeEventListener("scroll", onMove, { capture: true });
      window.removeEventListener("resize", onMove);
      window.removeEventListener(GUIDE_EVENT, onAsk);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [on, hideAndWait, look, place]);

  // While the hand shows, keep it on its target (things slide in, lists load).
  useEffect(() => {
    if (!spot) return undefined;
    const id = setInterval(place, 600);
    return () => clearInterval(id);
  }, [spot, place]);

  if (!on || !spot) return null;
  const { rect, hand } = spot;
  const pad = 6;
  return createPortal(
    <div className={`${s.layer} ${calm ? s.calm : ""}`} aria-hidden="true" data-guide-layer>
      <span className={s.ring} style={{ transform: `translate(${rect.left - pad}px, ${rect.top - pad}px)`, width: rect.width + pad * 2, height: rect.height + pad * 2, borderRadius: Math.min(40, (rect.height + pad * 2) / 2) }} />
      <span className={s.handAt} style={{ transform: `translate(${hand.x}px, ${hand.y}px)` }}>
        <span className={`${s.hand} ${hand.below ? "" : s.handDown}`}>{hand.below ? "👆" : "👇"}</span>
      </span>
    </div>,
    document.body,
  );
}
