// The "door of light": when a player chooses who they are, a circle of soft
// light opens from the card they pressed until it fills the screen, the page
// changes behind it, and the light fades to show the sign-in page. It is
// drawn on <body> (not inside a page) so it stays put while the router swaps
// pages underneath. It plays with sfx.enter(): the whoosh rises as the light
// opens and the chord rings as it fades.
//
//   await openDoor({ x, y, color, soft });   // light fills the screen
//   navigate(route);
//   closeDoor();                              // light fades away
//
// passDoor() does all three, and where the browser can (View Transitions) it
// does it in one cinematic move instead: the new page opens in a circle of
// light from the card that was pressed while the card's picture flies into
// the new page's header (an element named "role-hero" on both pages). Going
// back, the circle closes onto the picture and the picture flies home to its
// card. With "less movement" it is a short fade.

import { companion } from "../../companion/bus";
import "./doorTransition.css";

let current = null;
let safety = 0;

const reducedMotion = () => {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
};

function remove(el) {
  try { el.remove(); } catch { /* already gone */ }
}

/** Opens the light from (x, y) in viewport pixels. Resolves when the screen is covered. */
export function openDoor({ x, y, color = "#339af0", soft = "#dbeefe", calm = false }) {
  if (typeof document === "undefined") return Promise.resolve();
  if (current) remove(current);
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.dataset.entryDoor = "";
  Object.assign(el.style, {
    position: "fixed",
    inset: "0",
    zIndex: "9000",
    pointerEvents: "none",
    background: `radial-gradient(circle at ${x}px ${y}px, #fffdf3 0, #fffdf3 9%, ${soft} 34%, ${color} 100%)`,
  });
  document.body.appendChild(el);
  current = el;
  // The live companion goes through the door with the player (it stays above the light).
  companion.signal("door");
  clearTimeout(safety);
  // Never leave the light up by mistake (a page that fails to load, a lost tab).
  safety = setTimeout(() => closeDoor(), 2600);

  const w = window.innerWidth;
  const h = window.innerHeight;
  const far = Math.ceil(Math.max(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y))) + 4;
  if (calm || reducedMotion() || !el.animate) {
    const a = el.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 140, fill: "forwards" });
    return a ? a.finished.catch(() => {}) : Promise.resolve();
  }
  const a = el.animate(
    [
      { clipPath: `circle(0px at ${x}px ${y}px)` },
      { clipPath: `circle(${Math.round(far * 0.18)}px at ${x}px ${y}px)`, offset: 0.35 },
      { clipPath: `circle(${far}px at ${x}px ${y}px)` },
    ],
    { duration: 520, easing: "cubic-bezier(0.5, 0, 0.7, 0.4)", fill: "forwards" },
  );
  return a.finished.catch(() => {});
}

/** Fades the light away (the new page is underneath by now). */
export function closeDoor(delay = 70, calm = false) {
  const el = current;
  if (!el) return;
  current = null;
  clearTimeout(safety);
  const fade = () => {
    if (!el.animate) { remove(el); return; }
    const a = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: calm || reducedMotion() ? 160 : 460, easing: "ease-out", fill: "forwards" });
    a.finished.then(() => remove(el), () => remove(el));
  };
  if (delay) setTimeout(fade, delay);
  else fade();
}

/** True when this browser can morph one page into the next (View Transitions). */
export function canMorph() {
  return typeof document !== "undefined" && typeof document.startViewTransition === "function";
}

// Waits (without requestAnimationFrame: the browser holds frames during a
// view transition's update) until `check()` is true or `maxMs` has passed.
function waitFor(check, maxMs) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const tick = () => {
      let ok = false;
      try { ok = Boolean(check()); } catch { ok = false; }
      if (ok || Date.now() - t0 >= maxMs) resolve();
      else setTimeout(tick, 16);
    };
    tick();
  });
}

let passing = false;

/**
 * Goes through the door to the next entry page.
 *   await passDoor({ x, y, color, soft, calm, back, go, arrived })
 * `go()` changes the page (synchronously: flushSync(() => navigate(...))),
 * `arrived()` says the new page is drawn (and its picture loaded), `x, y`
 * is where the light opens (forward) or closes (back), in viewport pixels.
 */
export async function passDoor({ x, y, color, soft, calm = false, back = false, go, arrived = () => true }) {
  if (typeof document === "undefined") { go(); return; }
  if (calm || passing || !canMorph()) {
    if (back) { go(); return; }
    await openDoor({ x, y, color, soft, calm });
    go();
    closeDoor(calm ? 0 : 70, calm);
    return;
  }
  passing = true;
  const root = document.documentElement;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const far = Math.ceil(Math.max(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y))) + 8;
  root.style.setProperty("--door-x", `${Math.round(x)}px`);
  root.style.setProperty("--door-y", `${Math.round(y)}px`);
  root.style.setProperty("--door-r", `${far}px`);
  root.style.setProperty("--door-soft", soft || "#fffdf3");
  root.dataset.door = back ? "back" : "in";
  // The live companion goes through the door with the player.
  if (!back) companion.signal("door");
  const done = () => {
    passing = false;
    delete root.dataset.door;
    ["--door-x", "--door-y", "--door-r", "--door-soft"].forEach((p) => root.style.removeProperty(p));
  };
  let vt;
  try {
    vt = document.startViewTransition(async () => {
      go();
      await waitFor(arrived, 900);
    });
  } catch {
    done();
    go();
    return;
  }
  try { await vt.finished; } catch { /* skipped: the page has changed anyway */ } finally { done(); }
}
