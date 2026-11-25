// Butterflies that behave like butterflies, not floating stickers.
//
// Flight: a wandering heading (smooth noise, not loops), a bob on every wing beat,
// moments of gliding with wings held open, speed and wing-beat rate that change with
// what the butterfly is doing, and depth (nearer ones are bigger and faster).
// Behaviour: they keep to open sky (each new destination is a point where nothing of
// the page is underneath), rest now and then on things marked data-butterfly-perch
// (new things), slow-flap while resting, take off when a pointer comes close, and come
// to the companion when there is something to celebrate. A butterfly that visits the
// dog asks first (the stage decides whether the dog is free to play): if so, it flies
// the path the filmed butterfly takes in the dog's "play" performance, in time with it,
// so the dog's eyes follow a real butterfly; if not, it rests somewhere else.
// One or two at most; a layer under the navbar and dialogs; never takes a click.
//
// Cost: a butterfly is three small pictures drawn ONCE (a wing, used twice, and the
// body) inside a box, and everything that moves is an animation the browser runs off
// the main thread. A script that moves something on every frame makes the browser run
// a whole frame of its own work sixty times a second; that, with a canvas the size of
// the screen, is what made phones lag. So:
//  - Cruising (most of the time): the next two or three seconds of flight are worked
//    out at once and handed over as one animation along that path. The script then
//    sleeps until the path runs out.
//  - Reacting (a pointer close by, coming in to land, playing with the dog, a
//    celebration): the script steers about fifteen times a second and the box glides
//    from one place to the next.
//  - Resting, a dialog open, the tab hidden: nothing moves; the wings open and close
//    on their own.
// Nothing the size of the screen is ever redrawn or blended, and a turn of the phone
// or the address bar sliding away reallocates nothing.
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

const UNIT_W = 40; // the drawing's own units (the SVG viewBox)
const UNIT_H = 32;
const PIVOT_Y = 17; // the body's middle: the point that is "where the butterfly is"
const FLAP_HZ = 8; // the wing animation's own pace; its playback rate follows the butterfly
const FLAP_EASE = "cubic-bezier(0.37, 0, 0.63, 1)"; // a sine: wings slow at each end of the beat
const TILT_STEP = 0.07; // radians (4 degrees): the lean changes in steps this size, eased by a transition
const TICK_MS = 66; // reacting: 15 steps a second (companion.module.css .flyer glides between them)
const PLAN_MS = 2600; // cruising: this much flight is worked out at once
const PLAN_STEP_MS = 1000 / 30; // ... in steps this long (one point of the path each)
const PLAN_SPARE_MS = 1000; // ... plus this much more path, in case the script is late to plan the next stretch
const NEAR_PX = 130; // a pointer this close to a cruising butterfly: it reacts
const BEATS = 24; // wing beats in one round of the wing animation (3 seconds)
const BOB_PX = 3.2; // lift on each downstroke: the little bob of a real butterfly's path
const REST_FRAME_MS = 250; // while every butterfly rests, nothing moves: just watch for a reason to fly

export function startButterflies({ count } = {}) {
  const sky = document.createElement("div");
  sky.className = css.sky;
  sky.setAttribute("aria-hidden", "true");
  document.body.appendChild(sky);
  let W = innerWidth;
  let H = innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let timer = 0; // the next tick (0: the loop is asleep)
  let modalTimer = 0;
  let stopped = false;
  const pointer = { x: -999, y: -999, at: 0 };
  let celebrateUntil = 0;
  // A dialog is a moment of focus: the butterflies fade away (they may come to the dog
  // for a celebration in it), and come back when it closes.
  let fade = 1;

  // Only the numbers change with the window: there is no screen-sized buffer to reallocate.
  function resize() {
    W = innerWidth;
    H = innerHeight;
    const now = performance.now();
    for (const b of flock) { interrupt(b, now); resizeSprite(b, b.z); }
    wake();
  }

  const sizeOf = (z) => 30 * z * (W < 700 ? 0.85 : 1);
  // A small picture, drawn once. `units`: how many of the drawing's units wide it is.
  const picture = (w, h, units, className, paint) => {
    const c = document.createElement("canvas");
    c.className = className;
    c.width = Math.max(1, Math.round(w * dpr));
    c.height = Math.max(1, Math.round(h * dpr));
    const g = c.getContext("2d");
    g.scale(c.width / units, c.height / UNIT_H);
    paint(g);
    return c;
  };
  // One butterfly's box: a wing picture used for both wings (the right one mirrored), and the body.
  function sprite(hue, z) {
    const w = Math.ceil(sizeOf(1.1)); // drawn once at the largest size; the box scales it
    const h = (w * UNIT_H) / UNIT_W;
    const el = document.createElement("div");
    el.className = css.flyer;
    const lean = document.createElement("div");
    lean.className = css.flyerLean;
    lean.style.transformOrigin = `50% ${(PIVOT_Y / UNIT_H) * 100}%`;
    const wing = () => picture(w / 2, h, UNIT_W / 2, css.flyerWing, (g) => {
      g.fillStyle = hue[0];
      g.fill(WING_UP);
      g.fillStyle = hue[1];
      g.fill(WING_DOWN);
    });
    const left = wing();
    const right = wing();
    const body = picture(w, h, UNIT_W, css.flyerBody, (g) => {
      g.fillStyle = "#5b3a29";
      g.beginPath();
      g.ellipse(20, 17, 1.6, 7, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#5b3a29";
      g.lineWidth = 0.9;
      g.beginPath();
      g.moveTo(20, 10); g.quadraticCurveTo(17, 5, 15, 4);
      g.moveTo(20, 10); g.quadraticCurveTo(23, 5, 25, 4);
      g.stroke();
    });
    const bobber = document.createElement("div");
    bobber.className = css.flyerBob;
    lean.append(left, right, body);
    bobber.appendChild(lean);
    el.appendChild(bobber);
    sky.appendChild(el);
    // Wings: open (1) to edge-on (0.18) and back, once per beat; both hinge on the body's
    // line. The bob: up on each downstroke, a quarter of a beat behind the wings.
    // One round of each animation is BEATS beats long, not one: the browser wakes the
    // main thread at the end of every round of an animation, and a round as short as a
    // wing beat would wake it sixteen times a second.
    const rounds = (node, a, b, delay = 0) => {
      const frames = [];
      for (let i = 0; i <= BEATS * 2; i += 1) frames.push({ transform: i % 2 ? b : a, easing: FLAP_EASE });
      try {
        return node.animate(frames, { duration: (BEATS * 1000) / FLAP_HZ, delay, iterations: Infinity });
      } catch { return null; }
    };
    const beat = (node, side) => rounds(node, `scaleX(${side})`, `scaleX(${side * 0.18})`);
    right.style.transform = "scaleX(-1)";
    const bob = rounds(bobber, `translateY(${BOB_PX}px)`, `translateY(${-BOB_PX}px)`, -1000 / (FLAP_HZ * 4));
    const wings = [beat(left, 1), beat(right, -1)].filter(Boolean);
    const out = { el, lean, wings, bobAnim: bob, flaps: bob ? [...wings, bob] : wings, flapHz: FLAP_HZ, held: false, bobbing: true, sized: 0, tilt: 0, px: NaN, py: NaN };
    resizeSprite(out, z);
    return out;
  }
  function resizeSprite(b, z) {
    const w = sizeOf(z);
    if (w === b.sized) return;
    b.sized = w;
    b.el.style.width = `${w}px`;
    b.el.style.height = `${(w * UNIT_H) / UNIT_W}px`;
  }
  // The wing beat follows what the butterfly is doing: held open on a glide, slow at
  // rest (and no bob: it is sitting on something), quick when it flees. The rate is
  // changed only when it differs enough to see.
  function setFlap(b, hz, resting = false) {
    const beating = hz > 0.05;
    if (beating === b.held) {
      b.held = !beating;
      for (const a of b.wings) { if (beating) a.play(); else { a.pause(); a.currentTime = 0; } }
    }
    const bobbing = beating && !resting;
    if (b.bobAnim && bobbing !== b.bobbing) {
      b.bobbing = bobbing;
      if (bobbing) b.bobAnim.play(); else b.bobAnim.pause();
    }
    if (beating && Math.abs(hz - b.flapHz) > Math.max(0.6, b.flapHz * 0.12)) {
      b.flapHz = hz;
      for (const a of b.flaps) { if (a.updatePlaybackRate) a.updatePlaybackRate(hz / FLAP_HZ); else a.playbackRate = hz / FLAP_HZ; }
    }
  }

  const n = count ?? (W < 700 ? 1 : 2);
  const flock = Array.from({ length: n }, (_, i) => {
    const fromLeft = i % 2 === 0;
    return {
      id: i,
      dance: null,
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
  for (const b of flock) Object.assign(b, sprite(b.hue, b.z));

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

  function perchSpot(b) {
    const dog = document.querySelector('[data-companion="dog"]');
    const marked = [...document.querySelectorAll("[data-butterfly-perch]")];
    const options = [...marked, ...(dog ? [dog] : [])]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && r.top > navBottom() && r.bottom < H && r.left >= 0 && r.right <= W);
    if (!options.length) return null;
    const o = options[Math.floor(Math.random() * options.length)];
    if (o.el.dataset.companion === "dog") {
      // Going to the dog means playing with it: ask (the answer comes back at once).
      companion.signal("butterflyVisit", { id: b.id });
      if (b.dance) return null;
      const others = options.filter((x) => x.el !== o.el);
      if (!others.length) return null;
      const m = others[Math.floor(Math.random() * others.length)];
      return { el: m.el, fx: rand(0.15, 0.85), fy: 0 };
    }
    // On a marked thing: its top edge, near a corner.
    return { el: o.el, fx: rand(0.15, 0.85), fy: 0 };
  }

  const perchPoint = (p) => {
    const r = p.el.getBoundingClientRect();
    return { x: r.left + r.width * p.fx, y: r.top + r.height * p.fy, r };
  };

  function endDance(b, now) {
    if (!b.dance) return;
    companion.signal("butterflyDone", { id: b.id });
    b.dance = null;
    b.state = "fly";
    b.speed = 90;
    b.target = openTarget();
    b.retarget = now + rand(3_000, 6_000);
    b.nextPerch = now + rand(30_000, 50_000);
  }

  // Coming over to play, waiting for the dog to start, then flying the film's path.
  function stepDance(b, dt, now, flee) {
    const d = b.dance;
    if (flee) return endDance(b, now);
    let p;
    if (d.phase === "dance") {
      const t = (now - d.startAt) / 1000;
      if (t > d.end) return endDance(b, now);
      p = d.at(Math.max(d.start, t));
      // Glued to the path (it is the film's butterfly), with a little give.
      const k = Math.min(1, dt * 14);
      const nx = b.x + (p.x - b.x) * k;
      const ny = b.y + (p.y - b.y) * k;
      if (Math.hypot(nx - b.x, ny - b.y) > 0.3) b.heading = Math.atan2(ny - b.y, nx - b.x);
      b.x = nx;
      b.y = ny;
      b.glide = 0;
      b.hz = 8.5;
      b.phase += dt * Math.PI * 2 * b.hz;
      b.bob = Math.sin(b.phase) * 2;
      return;
    }
    p = d.at(d.start);
    if (d.phase === "wait") {
      // Hover at the entry point until the dog's performance starts (or give up).
      if (now - d.waitFrom > 1500) return endDance(b, now);
      p = { x: p.x + Math.cos(now / 260) * 6, y: p.y + Math.sin(now / 330) * 5 };
    } else if (now - d.since > 7000) {
      return endDance(b, now);
    }
    b.target = p;
    const want = Math.atan2(p.y - b.y, p.x - b.x);
    let a = want - b.heading;
    a = Math.atan2(Math.sin(a), Math.cos(a));
    b.heading += Math.max(-3.2 * dt, Math.min(3.2 * dt, a)) + b.wander(now / 900) * 0.8 * dt;
    const dist = Math.hypot(p.x - b.x, p.y - b.y);
    const cruise = Math.max(20, Math.min(85, dist * 1.6));
    b.speed += (cruise - b.speed) * Math.min(1, dt * 3);
    b.hz = 8;
    b.glide = 0;
    b.phase += dt * Math.PI * 2 * b.hz;
    b.bob = Math.sin(b.phase) * 3;
    b.x += Math.cos(b.heading) * b.speed * dt;
    b.y += Math.sin(b.heading) * b.speed * dt;
    if (d.phase === "approach" && dist < 18) {
      d.phase = "wait";
      d.waitFrom = now;
      companion.signal("butterflyReady", { id: b.id });
    }
  }

  function step(b, dt, now) {
    const flee = Math.hypot(pointer.x - b.x, pointer.y - b.y) < 90 && now - pointer.at < 600;
    if (b.dance) return stepDance(b, dt, now, flee);
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
      const p = perchSpot(b);
      if (b.dance) return;
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

  // Reacting: put the butterfly's box where the butterfly is now. The box glides there
  // from where it was (a transition as long as a step, run by the compositor), so the
  // flight is smooth at any frame rate without this code running on every frame. The
  // lean into a turn is on an inner box and changes in small steps, eased the same way.
  function draw(b) {
    const w = b.sized;
    const resting = b.state === "perch" && !b.dance;
    setFlap(b, resting ? 0.9 : b.glide > 0 ? 0 : b.hz, resting);
    const tilt = resting ? 0 : Math.round(clamp(Math.cos(b.heading) * 0.35, -0.35, 0.35) / TILT_STEP) * TILT_STEP;
    if (tilt !== b.tilt) {
      b.tilt = tilt;
      b.lean.style.transform = tilt ? `rotate(${tilt.toFixed(2)}rad)` : "";
    }
    const x = Math.round((b.x - w / 2) * dpr) / dpr;
    const y = Math.round((b.y - (w * PIVOT_Y) / UNIT_W) * dpr) / dpr;
    if (x !== b.px || y !== b.py) {
      // The first placement, and a jump (the tab was away, a path was cut short): no glide across the screen.
      const jump = Number.isNaN(b.px) || Math.abs(x - b.px) + Math.abs(y - b.py) > 60;
      if (jump !== b.jumped) { b.jumped = jump; b.el.style.transition = jump ? "none" : ""; }
      b.px = x;
      b.py = y;
      b.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }

  // ── Cruising ──────────────────────────────────────────────────────────────────
  const boxX = (b, x) => x - b.sized / 2;
  const boxY = (b, y) => y - (b.sized * PIVOT_Y) / UNIT_W;
  const nearPointer = (x, y, now) => now - pointer.at < 600 && Math.hypot(pointer.x - x, pointer.y - y) < NEAR_PX;

  // May this butterfly fly a planned stretch now? Only plain wandering: anything that
  // has to react (a landing place that scrolls, the dog, a pointer) is steered step by step.
  function canCruise(b, now) {
    return fade > 0 && b.state === "fly" && !b.dance && !b.perch && now >= celebrateUntil
      && b.nextPerch - now > 300 && !nearPointer(b.x, b.y, now) && typeof b.el.animate === "function";
  }

  // Work out the next stretch of flight with the same steering as always (step), and
  // hand it to the browser as one animation along the path. The stretch ends early
  // when a glide starts or stops (the wings change) and before the butterfly next
  // thinks about landing. Its rounds never end (it is replaced first): an animation
  // with an end makes the browser's main thread tick for as long as it runs.
  function cruise(b, clock) {
    const stepS = PLAN_STEP_MS / 1000;
    // One stretch straight after another: this one starts when the last one ended, not
    // when the script got round to it, so the spare path already flown is the start of
    // this one and nothing jumps.
    const late = b.path && clock >= b.path.until && clock - b.path.until < PLAN_SPARE_MS / 2 ? clock - b.path.until : 0;
    const now = clock - late;
    const limit = Math.min(PLAN_MS, b.nextPerch - now - 50);
    const gliding = b.glide > 0;
    const xs = [b.x];
    const ys = [b.y];
    const hs = [b.heading];
    const sp = [b.speed];
    let t = now;
    while (t - now < limit) {
      t += PLAN_STEP_MS;
      step(b, stepS, t);
      xs.push(b.x); ys.push(b.y); hs.push(b.heading); sp.push(b.speed);
      if ((b.glide > 0) !== gliding || b.perch || b.dance || b.state !== "fly") break;
    }
    const n = xs.length - 1; // steps that count: the butterfly IS at the last of them when the stretch ends
    // The spare path: where it would go on, flown by a stand-in (never lands, never visits the dog).
    const ghost = { ...b, nextPerch: Infinity, target: b.target ? { ...b.target } : null };
    for (let k = Math.ceil(PLAN_SPARE_MS / PLAN_STEP_MS); k > 0; k -= 1) {
      t += PLAN_STEP_MS;
      step(ghost, stepS, t);
      xs.push(ghost.x); ys.push(ghost.y); hs.push(ghost.heading);
    }
    // Start from where the box is on screen now (it may still be gliding to its last step).
    let x0 = boxX(b, xs[0]);
    let y0 = boxY(b, ys[0]);
    if (!b.path) {
      try {
        const m = new DOMMatrixReadOnly(getComputedStyle(b.el).transform);
        if (Number.isFinite(m.m41) && Math.hypot(m.m41 - x0, m.m42 - y0) < 40) { x0 = m.m41; y0 = m.m42; }
      } catch { /* no DOMMatrix: start from the step itself */ }
    }
    const move = [];
    const lean = [];
    for (let i = 0; i < xs.length; i += 1) {
      const x = i ? boxX(b, xs[i]) : x0;
      const y = i ? boxY(b, ys[i]) : y0;
      move.push({ transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)` });
      lean.push({ transform: `rotate(${clamp(Math.cos(hs[i]) * 0.35, -0.35, 0.35).toFixed(3)}rad)` });
    }
    const timing = { duration: (xs.length - 1) * PLAN_STEP_MS, delay: -late, iterations: Infinity, easing: "linear" };
    const old = b.path;
    setFlap(b, gliding ? 0 : b.hz || FLAP_HZ);
    b.path = { xs, ys, hs, sp, n, start: now, until: now + n * PLAN_STEP_MS, anims: [b.el.animate(move, timing), b.lean.animate(lean, timing)] };
    if (old) for (const a of old.anims) a.cancel();
    // What the box and its lean are set to underneath, for when the path is taken away.
    b.px = NaN;
    b.tilt = NaN;
  }

  // Take a butterfly off its planned path at once (something to react to): it is where
  // the path had it at this moment, and from here it is steered step by step.
  function interrupt(b, now) {
    const path = b.path;
    if (!path) return;
    const i = Math.max(0, Math.min(path.n, Math.round((now - path.start) / PLAN_STEP_MS)));
    b.x = path.xs[i];
    b.y = path.ys[i];
    b.heading = path.hs[i];
    b.speed = path.sp[i];
    b.path = null;
    b.last = now;
    b.jumped = undefined;
    draw(b); // the box's own place, before the animation over it goes
    for (const a of path.anims) a.cancel();
  }

  // Where a butterfly is right now, on a path or not.
  function whereIs(b, now) {
    const path = b.path;
    if (!path) return b;
    const i = Math.max(0, Math.min(path.xs.length - 1, Math.round((now - path.start) / PLAN_STEP_MS)));
    return { x: path.xs[i], y: path.ys[i] };
  }

  // A dialog is a moment of focus: looked for a few times a second (a query, no frame).
  function watchDialogs() {
    if (stopped) return;
    const modal = !!document.querySelector('[aria-modal="true"], dialog[open]');
    const want = modal && performance.now() > celebrateUntil ? 0 : 1;
    if (want === fade) return;
    // The fade itself is a transition on the sky (companion.module.css).
    fade = want;
    if (want) delete sky.dataset.away; else sky.dataset.away = "true";
    wake();
  }

  function tick() {
    timer = 0;
    if (stopped || document.hidden) return;
    const now = performance.now();
    let next = 450; // nothing to show (a dialog is open): only watch for it to close
    for (let i = 0; i < flock.length; i += 1) {
      const b = flock[i];
      if (b.path && now < b.path.until && fade > 0) { next = Math.min(next, b.path.until - now); continue; }
      if (fade === 0) { interrupt(b, now); continue; }
      if (canCruise(b, now)) {
        cruise(b, now);
        b.last = b.path.until;
        next = Math.min(next, b.path.until - now);
        continue;
      }
      if (b.path) {
        // The stretch is over and the butterfly has something to react to: it is at the
        // stretch's last step; the box takes that place before the path's animation goes.
        const path = b.path;
        b.path = null;
        b.jumped = undefined;
        draw(b);
        for (const a of path.anims) a.cancel();
      }
      const dt = Math.min(0.12, b.last ? Math.max(0.001, (now - b.last) / 1000) : TICK_MS / 1000);
      b.last = now;
      step(b, dt, now);
      draw(b);
      // Resting: the wings open and close on their own; only watch for a reason to fly.
      next = Math.min(next, b.state === "perch" && !b.dance ? REST_FRAME_MS : TICK_MS);
    }
    timer = setTimeout(tick, Math.max(4, next));
  }
  // True while every butterfly rests (the loop then looks only a few times a second).
  const resting = () => flock.every((b) => b.state === "perch" && !b.dance);
  const kick = () => { if (!timer && !stopped && !document.hidden) timer = setTimeout(tick, 0); };
  // Something happened that the butterflies react to at once (a pointer near, a celebration, a scroll).
  const wake = () => {
    if (stopped || document.hidden) return;
    clearTimeout(timer);
    timer = setTimeout(tick, 0);
  };

  const onMove = (e) => {
    const now = performance.now();
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.at = now;
    if (fade === 0) return;
    let react = resting();
    for (let i = 0; i < flock.length; i += 1) {
      const b = flock[i];
      if (!b.path) continue;
      const at = whereIs(b, now);
      if (Math.hypot(at.x - pointer.x, at.y - pointer.y) < NEAR_PX) { interrupt(b, now); react = true; }
    }
    if (react) wake();
  };
  const onVis = () => {
    // Hidden: every butterfly off its path (the tab's clock is not to be trusted now), and the loop sleeps.
    if (document.hidden) { const now = performance.now(); for (const b of flock) interrupt(b, now); clearTimeout(timer); timer = 0; return; }
    for (const b of flock) { b.last = 0; b.px = NaN; }
    kick();
  };
  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("pointerdown", onMove, { passive: true });
  // A resting butterfly sits on something in the page: when the page scrolls it must move with it at once.
  const onScroll = () => { if (resting() && fade > 0) wake(); };
  addEventListener("resize", resize, { passive: true });
  addEventListener("scroll", onScroll, { passive: true, capture: true });
  document.addEventListener("visibilitychange", onVis);
  const off = companion.on((e) => {
    const now = performance.now();
    if (e.type === "success" && e.size === "big") {
      celebrateUntil = now + 2600;
      for (const x of flock) interrupt(x, now);
      watchDialogs();
      wake();
    }
    const b = e.id !== undefined ? flock.find((x) => x.id === e.id) : null;
    if (!b) return;
    interrupt(b, now);
    if (e.type === "butterflyDance") {
      b.dance = { at: e.at, start: e.start, end: e.end, phase: "approach", since: now };
      b.perch = null;
      b.state = "fly";
    } else if (e.type === "butterflyGo" && b.dance) {
      b.dance.phase = "dance";
      b.dance.startAt = e.startAt;
    } else if (e.type === "butterflyFree" && b.dance) {
      endDance(b, now);
    }
    wake();
  });
  modalTimer = setInterval(watchDialogs, 400);
  kick();

  return {
    stop() {
      stopped = true;
      clearTimeout(timer);
      clearInterval(modalTimer);
      for (const b of flock) if (b.path) for (const a of b.path.anims) a.cancel();
      for (const b of flock) for (const a of b.flaps) a.cancel();
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerdown", onMove);
      removeEventListener("resize", resize);
      removeEventListener("scroll", onScroll, { capture: true });
      document.removeEventListener("visibilitychange", onVis);
      off();
      sky.remove();
    },
  };
}
