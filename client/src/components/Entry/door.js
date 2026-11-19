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

let current = null;
let safety = 0;

const reducedMotion = () => {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
};

function remove(el) {
  try { el.remove(); } catch { /* already gone */ }
}

/** Opens the light from (x, y) in viewport pixels. Resolves when the screen is covered. */
export function openDoor({ x, y, color = "#339af0", soft = "#dbeefe" }) {
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
  clearTimeout(safety);
  // Never leave the light up by mistake (a page that fails to load, a lost tab).
  safety = setTimeout(() => closeDoor(), 2600);

  const w = window.innerWidth;
  const h = window.innerHeight;
  const far = Math.ceil(Math.max(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y))) + 4;
  if (reducedMotion() || !el.animate) {
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
export function closeDoor(delay = 70) {
  const el = current;
  if (!el) return;
  current = null;
  clearTimeout(safety);
  const fade = () => {
    if (!el.animate) { remove(el); return; }
    const a = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reducedMotion() ? 160 : 460, easing: "ease-out", fill: "forwards" });
    a.finished.then(() => remove(el), () => remove(el));
  };
  if (delay) setTimeout(fade, delay);
  else fade();
}
