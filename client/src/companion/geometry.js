// Layout maths for the companion. Pure functions, tested in geometry.test.mjs.
// Rects are { left, top, width, height } in CSS pixels (viewport coordinates).

/**
 * Where the clip's frame must go so that the dog's body (manifest.body, fractions of the
 * frame) fills the spot box exactly as the old still image did. The frame is bigger
 * than the body (room for ears, paws, a wave), so it overhangs the spot on every side.
 */
export function fitFrame(spot, body, frame) {
  const bodyW = (body.right - body.left) * frame.width;
  const bodyH = (body.bottom - body.top) * frame.height;
  // Fit by height (the old image was portrait), but never wider than the spot allows.
  const scale = Math.min(spot.height / bodyH, (spot.width * 1.08) / bodyW);
  const width = frame.width * scale;
  const height = frame.height * scale;
  const bodyCx = ((body.left + body.right) / 2) * width;
  return {
    left: spot.left + spot.width / 2 - bodyCx,
    top: spot.top + spot.height - body.bottom * height,
    width,
    height,
    scale,
  };
}

/** A hop from rect a to rect b: a parabola whose height grows with distance (capped). */
export function hopKeyframes(a, b, { steps = 12, lift } = {}) {
  const ax = a.left + a.width / 2;
  const ay = a.top + a.height;
  const bx = b.left + b.width / 2;
  const by = b.top + b.height;
  const dist = Math.hypot(bx - ax, by - ay);
  const h = lift ?? Math.min(220, 40 + dist * 0.28);
  const out = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    // ease the horizontal travel; vertical is a parabola on top of a straight line
    const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    const x = ax + (bx - ax) * e;
    const y = ay + (by - ay) * e - 4 * h * t * (1 - t);
    const w = a.width + (b.width - a.width) * e;
    const hh = a.height + (b.height - a.height) * e;
    out.push({ t, left: x - w / 2, top: y - hh, width: w, height: hh });
  }
  return out;
}

/** Which way the dog should look to see `target` from where it sits; lean is -1..1. */
export function gazeTowards(dog, target) {
  const dx = target.left + target.width / 2 - (dog.left + dog.width / 2);
  const dy = target.top + target.height / 2 - (dog.top + dog.height * 0.35);
  const ahead = Math.abs(dx) < dog.width * 0.35;
  return {
    dir: ahead ? "center" : dx < 0 ? "left" : "right",
    lean: Math.max(-1, Math.min(1, dx / 600)),
    up: dy < -dog.height * 0.5,
    distance: Math.hypot(dx, dy),
  };
}

/** Share of `r` inside the viewport (0..1). */
export function visibleShare(r, vw, vh) {
  if (!r || r.width <= 0 || r.height <= 0) return 0;
  const w = Math.max(0, Math.min(r.left + r.width, vw) - Math.max(r.left, 0));
  const h = Math.max(0, Math.min(r.top + r.height, vh) - Math.max(r.top, 0));
  return (w * h) / (r.width * r.height);
}

/**
 * The spot the companion should be in. Spots in an open dialog win; then the bigger
 * spot; then the newest. The current spot is kept unless it is mostly off screen
 * (hysteresis: the dog does not hop back and forth while the learner scrolls).
 */
export function pickSpot(spots, current, vw, vh) {
  const scored = spots
    .map((s) => ({ s, vis: visibleShare(s.rect, vw, vh) }))
    .filter(({ s, vis }) => s.rect && vis > 0 && !s.hidden);
  if (!scored.length) return null;
  const rank = ({ s }) => (s.modal ? 1e6 : 0) + (s.priority || 0) * 1e3 + Math.min(999, s.rect.height) + (s.order || 0) * 1e-3;
  const cur = scored.find(({ s }) => s.id === current);
  const best = scored.filter(({ vis }) => vis >= 0.6).sort((x, y) => rank(y) - rank(x))[0];
  if (cur && cur.vis >= 0.3) {
    // Stay unless a dialog opened or a clearly more important spot is fully in view.
    if (!best || best.s.id === cur.s.id) return cur.s.id;
    if (best.s.modal && !cur.s.modal) return best.s.id;
    if ((best.s.priority || 0) > (cur.s.priority || 0)) return best.s.id;
    return cur.s.id;
  }
  return best ? best.s.id : cur ? cur.s.id : null;
}
