// Body motion for the companion, layered over the filmed performance: hops with
// anticipation and squash-and-stretch, travel along an arc, entrances, exits and a
// lean towards what the dog is looking at. Web Animations API only (transform and
// opacity: compositor-friendly, no layout).
import { hopKeyframes } from "./geometry";

const ease = { out: "cubic-bezier(.22,.9,.3,1)", inOut: "cubic-bezier(.45,0,.25,1)", spring: "cubic-bezier(.34,1.56,.64,1)" };

/** A hop in place. `size` "small" (a right answer) or "big" (a round, a badge). */
export function hop(body, shadow, size = "small") {
  const big = size === "big";
  const up = big ? -22 : -9; // % of the frame height
  const dur = big ? 760 : 460;
  const frames = [
    { transform: "translateY(0) scale(1,1)", offset: 0 },
    { transform: "translateY(0) scale(1.06,0.92)", offset: 0.16, easing: ease.out }, // anticipation: crouch
    { transform: `translateY(${up}%) scale(0.95,1.07)`, offset: 0.5, easing: "cubic-bezier(.3,0,.7,1)" }, // stretch at take-off, apex
    { transform: "translateY(0) scale(1.08,0.9)", offset: 0.78, easing: ease.out }, // landing squash
    { transform: "translateY(0) scale(0.99,1.01)", offset: 0.9 },
    { transform: "translateY(0) scale(1,1)", offset: 1 },
  ];
  const a = body.animate(frames, { duration: dur, composite: "add" });
  shadow?.animate(
    [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.08)", opacity: 1, offset: 0.16 }, { transform: `scale(${big ? 0.6 : 0.82})`, opacity: big ? 0.45 : 0.75, offset: 0.5 }, { transform: "scale(1.1)", opacity: 1, offset: 0.78 }, { transform: "scale(1)", opacity: 1 }],
    { duration: dur },
  );
  return a.finished.catch(() => {});
}

/** Lean towards a side (-1 left .. 1 right) for `ms`, then back. Natural for a look. */
export function lean(body, dir, ms = 2200) {
  if (!dir) return Promise.resolve();
  const r = 3.2 * Math.sign(dir);
  const x = 2.2 * Math.sign(dir);
  return body
    .animate(
      [
        { transform: "rotate(0deg) translateX(0)" },
        { transform: `rotate(${r}deg) translateX(${x}%)`, offset: 0.25, easing: ease.inOut },
        { transform: `rotate(${r}deg) translateX(${x}%)`, offset: 0.75, easing: ease.inOut },
        { transform: "rotate(0deg) translateX(0)" },
      ],
      { duration: ms, composite: "add" },
    )
    .finished.catch(() => {});
}

/**
 * Travel from rect a to rect b (viewport coordinates) along an arc, with a crouch
 * before take-off and a squash on landing. `el` is position:fixed with its box = a.
 */
export function travel(el, a, b) {
  const path = hopKeyframes(a, b);
  const dist = Math.hypot(b.left - a.left, b.top - a.top);
  const flight = Math.max(420, Math.min(900, 300 + dist * 0.55));
  const crouch = 150;
  const land = 220;
  const total = crouch + flight + land;
  const frames = [];
  const at = (ms) => ms / total;
  const box = (r, sx = 1, sy = 1) => `translate(${r.left - a.left}px, ${r.top - a.top}px) scale(${(r.width / a.width) * sx}, ${(r.height / a.height) * sy})`;
  frames.push({ transform: box(a), offset: 0 });
  frames.push({ transform: box(a, 1.07, 0.9), offset: at(crouch), easing: "linear" });
  path.forEach((p, i) => {
    if (i === 0) return;
    // stretch on the way up, round at the top, a little stretch on the way down
    const t = p.t;
    const s = t < 0.15 ? [0.94, 1.08] : t > 0.85 ? [0.97, 1.04] : [1, 1];
    frames.push({ transform: box(p, s[0], s[1]), offset: at(crouch + flight * t), easing: "linear" });
  });
  frames.push({ transform: box(b, 1.09, 0.88), offset: at(crouch + flight + land * 0.4), easing: ease.out });
  frames.push({ transform: box(b), offset: 1 });
  el.style.transformOrigin = "0 0";
  return el.animate(frames, { duration: total, fill: "forwards" }).finished.catch(() => {});
}

/** Arrive in a spot where the dog was not: it bounds up from just below, and settles. */
export function enter(body, shadow) {
  body.animate(
    [
      { transform: "translateY(26%) scale(0.86, 0.8)", opacity: 0 },
      { transform: "translateY(-6%) scale(0.96, 1.06)", opacity: 1, offset: 0.55, easing: ease.out },
      { transform: "translateY(0) scale(1.06, 0.93)", offset: 0.78 },
      { transform: "translateY(0) scale(1, 1)", opacity: 1 },
    ],
    { duration: 620, easing: "linear" },
  );
  shadow?.animate([{ opacity: 0, transform: "scale(.5)" }, { opacity: 1, transform: "scale(1)" }], { duration: 520, easing: ease.out });
}

/** Leave (no place to be on this page): a small hop down and out of sight. */
export function exit(el) {
  return el
    .animate(
      [
        { transform: "translateY(0) scale(1,1)", opacity: 1 },
        { transform: "translateY(0) scale(1.06,0.92)", offset: 0.2 },
        { transform: "translateY(-8%) scale(0.96,1.05)", offset: 0.45 },
        { transform: "translateY(30%) scale(0.85,0.85)", opacity: 0 },
      ],
      { duration: 480, easing: ease.inOut, fill: "forwards" },
    )
    .finished.catch(() => {});
}
