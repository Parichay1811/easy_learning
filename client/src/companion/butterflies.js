// Butterflies that behave like butterflies, not floating stickers.
//
// Flight: a wandering heading (smooth noise, not loops), a bob on every wing beat,
// moments of gliding with wings held open, speed and wing-beat rate that change with
// what the butterfly is doing, and depth (nearer ones are bigger and faster).
// Behaviour: they keep to open sky (each new destination is a point where nothing of
// the page is underneath), rest now and then on things marked data-butterfly-perch
// (new things) or on the companion's head, slow-flap while resting, take off when a
// pointer comes close, and come to the companion when there is something to celebrate.
// One or two at most; a canvas under the navbar and dialogs; never takes a click.
import { companion } from "./bus";
import css from "./companion.module.css";

const PALETTE = [
  ["#ff8fc8", "#ffd45c"],
  ["#7cc8ff", "#b69cff"],
  ["#ffb35c", "#ff7a7a"],
];
// The wing shapes from the original SVG butterfly (viewBox 40x32, body at x=20).
const WING_UP = new Path2D("M19 15 C 10 0, 0 4, 4 13 C 6 18, 14 18, 19 16 Z");
const WING_DOWN = new Path2D("M19 17 C 12 20, 5 26, 10 30 C 14 32, 18 24, 19 18 Z");

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Smooth 1-D value noise (for the wander), -1..1.
function noise(seed) {
  const h = (n) => { const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x); };
  return (t) => {
    const i = Math.floor(t);
    const f = t - i;
    const u = f * f * (3 - 2 * f);
    return (h(i) * (1 - u) + h(i + 1) * u) * 2 - 1;
  };
}

function isOpen(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el) return false;
  if (el === document.documentElement || el === document.body || el.id === "root") return true;
  if (el.closest("button, a, input, select, textarea, label, img, video, canvas, svg, nav, header, [role=dialog], p, h1, h2, h3, h4, li")) return false;
  const bg = getComputedStyle(el).backgroundColor;
  const transparent = bg === "transparent" || /rgba\([^)]*,\s*0\)$/.test(bg);
  const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  return transparent && !hasText;
}

export function startButterflies({ count } = {}) {
  const canvas = document.createElement("canvas");
  canvas.className = css.sky;
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  let W = 0;
  let H = 0;
  let dpr = 1;
  let raf = 0;
  let last = 0;
  let stopped = false;
  let pointer = { x: -999, y: -999, at: 0 };
  let celebrateUntil = 0;
  // A dialog is a moment of focus: the butterflies fade away (they may come to the dog
  // for a celebration in it), and come back when it closes.
  let fade = 1;
  let modal = false;
  let modalCheck = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth;
    H = innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  resize();

  const n = count ?? (W < 700 ? 1 : 2);
  const flock = Array.from({ length: n }, (_, i) => {
    const fromLeft = i % 2 === 0;
    return {
      x: fromLeft ? -30 : W + 30,
      y: rand(H * 0.18, H * 0.45),
      heading: fromLeft ? rand(-0.4, 0.2) : Math.PI + rand(-0.2, 0.4),
      speed: rand(55, 75),
      z: rand(0.8, 1.1),
      phase: rand(0, Math.PI * 2),
      hz: rand(7, 9),
      glide: 0,
      state: "fly",
      target: null,
      retarget: 0,
      perch: null,
      perchUntil: 0,
      nextPerch: performance.now() + rand(12_000, 25_000) + i * 6_000,
      wander: noise(Math.random() * 1000),
      hue: PALETTE[i % PALETTE.length],
      bob: 0,
    };
  });

  // The navbar's height (CSS --nav-h), read at most once a second: reading styles every frame is costly.
  let navH = 64;
  let navAt = -Infinity;
  const navBottom = () => {
    const t = performance.now();
    if (t - navAt > 1000) {
      navAt = t;
      const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h"));
      navH = Number.isFinite(v) ? v : 64;
    }
    return navH;
  };

  function openTarget() {
    const top = navBottom() + 16;
    for (let k = 0; k < 10; k += 1) {
      const edge = Math.random() < 0.6;
      const x = edge ? (Math.random() < 0.5 ? rand(12, W * 0.16) : rand(W * 0.84, W - 12)) : rand(W * 0.1, W * 0.9);
      const y = rand(top, Math.max(top + 40, H * (edge ? 0.85 : 0.35)));
      if (isOpen(x, y)) return { x, y };
    }
    return { x: rand(16, W - 16), y: rand(top, top + 80) };
  }

  function perchSpot() {
    const dog = document.querySelector('[data-companion="dog"]');
    const marked = [...document.querySelectorAll("[data-butterfly-perch]")];
    const options = [...marked, ...(dog ? [dog] : [])]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && r.top > navBottom() && r.bottom < H && r.left >= 0 && r.right <= W);
    if (!options.length) return null;
    const o = options[Math.floor(Math.random() * options.length)];
    const isDog = o.el.dataset.companion === "dog";
    // On the dog: on top of the head; on a marked thing: its top edge, near a corner.
    return { el: o.el, fx: isDog ? rand(0.4, 0.6) : rand(0.15, 0.85), fy: isDog ? 0.2 : 0, isDog };
  }

  const perchPoint = (p) => {
    const r = p.el.getBoundingClientRect();
    return { x: r.left + r.width * p.fx, y: r.top + r.height * p.fy, r };
  };

  function step(b, dt, now) {
    const flee = Math.hypot(pointer.x - b.x, pointer.y - b.y) < 90 && now - pointer.at < 600;
    if (b.state === "perch") {
      const p = b.perch?.el?.isConnected ? perchPoint(b.perch) : null;
      const moved = p && Math.hypot(p.x - b.x, p.y - b.y) > 6;
      if (!p || flee || moved || now > b.perchUntil) {
        b.state = "fly";
        b.perch = null;
        b.heading = -Math.PI / 2 + rand(-0.8, 0.8);
        b.speed = 95;
        b.target = openTarget();
        b.nextPerch = now + rand(20_000, 40_000);
      } else {
        b.x = p.x;
        b.y = p.y;
        b.phase += dt * Math.PI * 2 * 0.9; // slow open-and-close while resting
      }
      return;
    }
    // Decide where to go.
    const celebrating = now < celebrateUntil;
    if (celebrating) {
      const dog = document.querySelector('[data-companion="dog"]');
      if (dog) {
        const r = dog.getBoundingClientRect();
        const a = now / 700 + b.hz;
        b.target = { x: r.left + r.width / 2 + Math.cos(a) * r.width * 0.45, y: r.top + r.height * 0.25 + Math.sin(a) * r.height * 0.18 };
      }
    } else if (!b.perch && now > b.nextPerch && !flee) {
      const p = perchSpot();
      if (p) b.perch = p;
      else b.nextPerch = now + 15_000;
    }
    if (b.perch) b.target = perchPoint(b.perch);
    else if (!b.target || now > b.retarget || Math.hypot(b.target.x - b.x, b.target.y - b.y) < 30) {
      if (!celebrating) b.target = openTarget();
      b.retarget = now + rand(3_000, 6_000);
    }
    // Steer: towards the target, plus wander; away from a pointer.
    let want = Math.atan2(b.target.y - b.y, b.target.x - b.x);
    if (flee) want = Math.atan2(b.y - pointer.y, b.x - pointer.x);
    let d = want - b.heading;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    b.heading += clamp(d, -2.4 * dt, 2.4 * dt) + b.wander(now / 900) * 1.6 * dt;
    // Glide now and then (wings held open, a gentle sink), more often when calm.
    if (b.glide > 0) b.glide -= dt;
    else if (!flee && !b.perch && Math.random() < dt * 0.25) b.glide = rand(0.4, 1.1);
    const dist = Math.hypot(b.target.x - b.x, b.target.y - b.y);
    const cruise = flee ? 140 : b.perch ? clamp(dist * 1.2, 25, 80) : celebrating ? 110 : 62;
    b.speed += (cruise * b.z - b.speed) * Math.min(1, dt * 2);
    const sink = b.glide > 0 ? 14 : 0;
    b.hz = b.glide > 0 ? 0 : flee ? 12 : 7.5 + Math.sin(now / 1300) * 1.2;
    b.phase += dt * Math.PI * 2 * b.hz;
    // Lift on each downstroke: the little bob of a real butterfly's path.
    b.bob = b.glide > 0 ? b.bob * 0.9 : Math.sin(b.phase) * 3.2;
    b.x += Math.cos(b.heading) * b.speed * dt;
    b.y += Math.sin(b.heading) * b.speed * dt + sink * dt;
    // Soft walls.
    const top = navBottom() + 8;
    if (b.x < -40) b.heading = 0;
    if (b.x > W + 40) b.heading = Math.PI;
    if (b.y < top) b.heading += (Math.PI / 2 - b.heading) * dt * 3;
    if (b.y > H - 20) b.heading += (-Math.PI / 2 - b.heading) * dt * 3;
    // Land.
    if (b.perch && dist < 4) {
      b.state = "perch";
      b.perchUntil = now + rand(3_500, 7_000);
    }
  }

  function draw(b) {
    const size = 30 * b.z * (W < 700 ? 0.85 : 1);
    // Wings: open (1) to edge-on (0.18); resting butterflies close more slowly and fully.
    const open = b.glide > 0 ? 1 : 0.18 + 0.82 * (0.5 + 0.5 * Math.cos(b.phase));
    const tilt = b.state === "perch" ? 0 : clamp(Math.cos(b.heading) * 0.35, -0.35, 0.35);
    ctx.save();
    ctx.translate(b.x * dpr, (b.y + b.bob) * dpr);
    ctx.rotate(tilt);
    const s = (size / 40) * dpr;
    ctx.scale(s, s);
    ctx.translate(-20, -17);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(20, 0);
      ctx.scale(side * -1 * open, 1);
      ctx.translate(-20, 0);
      ctx.fillStyle = b.hue[0];
      ctx.fill(WING_UP);
      ctx.fillStyle = b.hue[1];
      ctx.fill(WING_DOWN);
      ctx.restore();
    }
    ctx.fillStyle = "#5b3a29";
    ctx.beginPath();
    ctx.ellipse(20, 17, 1.6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5b3a29";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(20, 10); ctx.quadraticCurveTo(17, 5, 15, 4);
    ctx.moveTo(20, 10); ctx.quadraticCurveTo(23, 5, 25, 4);
    ctx.stroke();
    ctx.restore();
  }

  function frame(now) {
    raf = 0;
    if (stopped || document.hidden) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    if (now - modalCheck > 400) {
      modalCheck = now;
      modal = !!document.querySelector('[aria-modal="true"], dialog[open]');
    }
    const want = modal && now > celebrateUntil ? 0 : 1;
    fade += (want - fade) * Math.min(1, dt * 4);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = fade;
    for (const b of flock) {
      step(b, dt, now);
      if (fade > 0.02) draw(b);
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && !stopped && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };

  const onMove = (e) => { pointer = { x: e.clientX, y: e.clientY, at: performance.now() }; };
  const onVis = () => kick();
  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("pointerdown", onMove, { passive: true });
  addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", onVis);
  const off = companion.on((e) => {
    if (e.type === "success" && e.size === "big") celebrateUntil = performance.now() + 2600;
  });
  kick();

  return {
    stop() {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerdown", onMove);
      removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      off();
      canvas.remove();
    },
  };
}
