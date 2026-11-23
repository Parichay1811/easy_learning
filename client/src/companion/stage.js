// The companion's stage: one dog for the whole app.
//
// Pages say where the dog may sit with <Mascot> (a "spot" in their own layout). The
// stage picks the best spot, moves the dog's element INTO that spot (so it scrolls
// with the page natively and sits under dialogs and cards like any element), and when
// the best spot changes it lifts the dog into a fixed layer and WALKS it to the new
// spot: it stands up, trots over (the filmed walk cycle, facing the way it goes) and
// turns to sit (filmed). Until the walk clips are downloaded it hops along an arc
// instead. It never teleports, and never takes clicks (pointer-events: none).
//
// The performance is chosen by brain.js; clips play through AlphaVideo.js; body
// motion (hops, lean, entrances) comes from motion.js.
import { AlphaVideo } from "./AlphaVideo";
import { createBrain } from "./brain";
import { companion, getSpots, getSpot, onSpots, setLive } from "./bus";
import { fitFrame, pickSpot, gazeTowards, visibleShare } from "./geometry";
import * as motion from "./motion";
import { onNarration } from "../utils/narrator";
import css from "./companion.module.css";

const LOOK_SELECTOR = "[data-companion-look]";
const GUIDE_SELECTOR = "[data-companion-guide]";
const GUIDE_AFTER_MS = 10_000;
const FLOAT_WAIT_MS = 900; // between pages: wait this long for the next page's spot
const WALK = ["standUp", "walk", "sitDown"];
const WALK_PACE = 1.5; // body widths a second at which the filmed walk cycle's paws do not slide

const shown = (el) => {
  if (!el?.isConnected) return false;
  const cs = getComputedStyle(el);
  return cs.display !== "none" && cs.visibility !== "hidden";
};

export function startCompanion({ base = "/companion/", onState } = {}) {
  let stopped = false;
  let manifest = null;
  let player = null;
  let hostId = null; // spot the dog is in
  let floating = null; // viewport rect while between spots
  let moving = false;
  let walking = false; // a filmed move (stand, walk, sit) owns the clips until it ends
  let again = false;
  let dance = null; // { id } while a butterfly is coming over to play
  let parkedTimer = 0;
  let guideTimer = 0;
  let doorTimer = 0;
  let io = null;
  let visible = true;
  const brain = createBrain();
  const offs = [];
  // localStorage.learnigo_companion_debug = "1" logs what the brain hears and decides.
  const debug = (() => { try { return localStorage.getItem("learnigo_companion_debug") === "1"; } catch { return false; } })();
  const log = (...a) => { if (debug) console.warn("[companion]", ...a); };
  const state = (s) => onState?.(s);

  // --- the dog's element (built once, moved between spots) ---
  const layer = document.createElement("div");
  layer.className = css.layer;
  layer.setAttribute("aria-hidden", "true");
  const dog = document.createElement("div");
  dog.className = css.dog;
  dog.dataset.companion = "dog";
  const shadow = document.createElement("div");
  shadow.className = css.shadow;
  const body = document.createElement("div");
  body.className = css.body;
  const canvas = document.createElement("canvas");
  canvas.className = css.canvas;
  const poster = new Image();
  poster.className = css.poster;
  poster.alt = "";
  poster.decoding = "async";
  poster.draggable = false;
  body.append(poster, canvas);
  dog.append(shadow, body);
  document.body.appendChild(layer);

  const frameRectIn = (spotRect) => fitFrame(spotRect, manifest.body, manifest);

  // Size the dog inside a spot (spot-relative coordinates) and size the canvas buffer.
  function fitInto(spotEl) {
    const r = spotEl.getBoundingClientRect();
    const f = frameRectIn({ left: 0, top: 0, width: r.width, height: r.height });
    Object.assign(dog.style, { position: "absolute", left: `${f.left}px`, top: `${f.top}px`, width: `${f.width}px`, height: `${f.height}px`, transform: "" });
    sizeCanvas(f.width);
  }
  function sizeCanvas(w) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.min(manifest.width, Math.round(w * dpr));
    player?.resize(cw, Math.round((cw * manifest.height) / manifest.width));
  }

  function host(spot) {
    dog.getAnimations().forEach((a) => a.cancel());
    spot.el.appendChild(dog);
    fitInto(spot.el);
    hostId = spot.id;
    floating = null;
    spot.el.dataset.companionHost = "true";
    layer.style.zIndex = ""; // back under dialogs once it has landed (it was above a door)
    // Fallback places (the answer sheet on a phone) fold away while the dog is in a main place.
    document.documentElement.dataset.companionMain = spot.fallback ? "false" : "true";
    observe(spot.el);
    state({ host: spot.id });
  }

  function unhostMarker() {
    const s = hostId && getSpot(hostId);
    if (s?.el) delete s.el.dataset.companionHost;
    delete document.documentElement.dataset.companionMain;
  }

  // Lift the dog out of its spot into the fixed layer at the same place on screen.
  function lift() {
    const r = dog.getBoundingClientRect();
    unhostMarker();
    hostId = null;
    dog.getAnimations().forEach((a) => a.cancel());
    Object.assign(dog.style, { position: "fixed", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, transform: "" });
    layer.appendChild(dog);
    floating = r.width ? { left: r.left, top: r.top, width: r.width, height: r.height } : null;
    return floating;
  }

  function park() {
    unhostMarker();
    hostId = null;
    floating = null;
    dog.getAnimations().forEach((a) => a.cancel());
    dog.remove();
    player?.pause();
    state({ host: null });
  }

  // Fixed-layer placement at a viewport rect (where a walk starts off screen).
  function placeFixed(r) {
    dog.getAnimations().forEach((a) => a.cancel());
    Object.assign(dog.style, { position: "fixed", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, transform: "" });
    if (dog.parentElement !== layer) layer.appendChild(dog);
    floating = { left: r.left, top: r.top, width: r.width, height: r.height };
  }

  // --- walking: stand up, trot over, sit down (docs/companion/INTERACTIONS.md) ---
  const canWalk = () => Boolean(player && manifest?.clips?.walk && player.canPlay(WALK));
  // The film faces right; going left, the whole picture is mirrored.
  const face = (dir) => { canvas.style.transform = dir < 0 ? "scaleX(-1)" : ""; };

  // Play one clip through, resolving when it ends (a stalled video never strands the dog).
  function perform(id, { rate = 1, fade = 120 } = {}) {
    return new Promise((resolve) => {
      clearTimeout(clipTimer);
      const ms = ((manifest.clips[id]?.duration || 1) / rate) * 1000;
      let t = 0;
      const done = () => { clearTimeout(t); resolve(true); };
      t = setTimeout(done, ms + 700);
      state({ clip: id, kind: "move" });
      log("move", id, rate.toFixed(2));
      player.play(id, { rate, fade, onEnd: done }).catch(() => { clearTimeout(t); resolve(false); });
    });
  }

  // From viewport rect a to b. Up on its feet first unless it is already walking in.
  async function walkBetween(a, b, { stand = true } = {}) {
    walking = true;
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    face(dx < 0 ? -1 : 1);
    if (stand) await perform("standUp", { rate: 1.3 });
    if (stopped) return;
    const w = (a.width + b.width) / 2;
    const dist = Math.hypot(dx, b.top + b.height - (a.top + a.height));
    const ms = Math.max(650, Math.min(2000, 380 + dist * 0.8));
    const pace = dist / w / (ms / 1000);
    clearTimeout(clipTimer);
    state({ clip: "walk", kind: "move" });
    player.play("walk", { loop: true, fade: 110, rate: Math.max(0.8, Math.min(1.7, pace / WALK_PACE)) }).catch(() => {});
    await motion.walk(dog, a, b, ms, { bounds: pace > WALK_PACE * 1.8 ? Math.max(1, Math.round(ms / 420)) : 0 });
  }

  // Arrived: turn to face the learner and sit (the film ends on the resting pose).
  async function sitHere() {
    // Quicker when the voice started speaking during the walk: the talk is waiting.
    await perform("sitDown", { rate: brain.state.speaking ? 1.7 : 1.15 });
    face(1);
    if (dog.isConnected) motion.hop(body, shadow, "small"); // settles in
    walking = false;
  }

  // The target spot's frame must hold still for a few frames (page transitions animate).
  function settled(spot, ms = 700) {
    return new Promise((resolve) => {
      const t0 = performance.now();
      let last = null;
      let same = 0;
      const tick = () => {
        if (stopped || !spot.el.isConnected) return resolve(null);
        const r = spot.el.getBoundingClientRect();
        if (last && Math.abs(r.left - last.left) < 0.5 && Math.abs(r.top - last.top) < 0.5 && Math.abs(r.width - last.width) < 0.5) same += 1;
        else same = 0;
        last = r;
        if (same >= 3 || performance.now() - t0 > ms) return resolve(r);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  async function moveTo(spot) {
    moving = true;
    clearTimeout(parkedTimer);
    // Its page went away (a new page, the door of light): it walks over. A move within
    // the same page (into a lesson's answer sheet) stays a quick hop: a reaction must
    // not take three seconds.
    const newPage = !hostId;
    const from = hostId ? lift() : floating;
    const r = await settled(spot);
    if (stopped) return;
    if (!r) { moving = false; return reconcile(); }
    const to = frameRectIn(r);
    const vw = innerWidth;
    const vh = innerHeight;
    const seenFrom = from && visibleShare(from, vw, vh) > 0.15;
    const seenTo = visibleShare(to, vw, vh) > 0.15;
    let walked = false;
    if (seenFrom && seenTo) {
      if (!dog.isConnected) layer.appendChild(dog);
      sizeCanvas(Math.max(from.width, to.width));
      player?.resume();
      const far = Math.hypot(to.left - from.left, to.top - from.top) > Math.max(from.width, to.width) * 0.55;
      // While the voice speaks the dog hurries (a hop) so it is there to talk with it.
      if (newPage && far && canWalk() && !walking && !brain.state.speaking) {
        await walkBetween(from, to);
        walked = true;
      } else {
        await motion.travel(dog, from, to);
      }
      if (stopped) return;
      host(spot);
    } else if (seenTo && canWalk() && !walking && !brain.state.speaking) {
      // Coming from off screen: it trots in from the nearer side of the window.
      const side = to.left + to.width / 2 < vw / 2 ? -1 : 1;
      const start = { ...to, left: side < 0 ? -to.width * 1.05 : vw + to.width * 0.05 };
      placeFixed(start);
      sizeCanvas(to.width);
      player?.resume();
      await walkBetween(start, to, { stand: false });
      if (stopped) return;
      host(spot);
      walked = true;
    } else {
      host(spot);
      motion.enter(body, shadow);
    }
    player?.resume();
    if (walked) await sitHere();
    if (stopped) return;
    moving = false;
    arrived(spot, walked);
    if (again) { again = false; reconcile(); }
  }

  // `restart`: a filmed move held the clips, so the performance loop starts again here.
  function arrived(spot, restart = false) {
    const mood = spot.mood;
    let interrupt;
    if (mood === "cheer") interrupt = brain.dispatch({ type: "success", size: "big" });
    else if (mood === "think") interrupt = brain.dispatch({ type: "curious" });
    else interrupt = brain.dispatch({ type: "arrive" });
    if (interrupt || restart) beat(Boolean(interrupt));
    armGuide();
  }

  function leave() {
    if (!hostId && !floating) return;
    const el = dog;
    const wasVisible = el.isConnected && visibleShare(el.getBoundingClientRect(), innerWidth, innerHeight) > 0.1;
    if (!wasVisible) return park();
    if (canWalk() && !walking) {
      // Nowhere to sit on this page: it gets up and trots off the nearer side.
      const r = hostId ? lift() : el.getBoundingClientRect();
      const side = r.left + r.width / 2 < innerWidth / 2 ? -1 : 1;
      const end = { left: side < 0 ? -r.width * 1.1 : innerWidth + r.width * 0.1, top: r.top, width: r.width, height: r.height };
      moving = true;
      walkBetween({ left: r.left, top: r.top, width: r.width, height: r.height }, end).then(() => {
        walking = false;
        face(1);
        moving = false;
        if (!stopped && !hostId) park();
        if (again) { again = false; reconcile(); }
      });
      return;
    }
    if (hostId) lift();
    moving = true;
    motion.exit(el).then(() => {
      moving = false;
      if (!stopped && !hostId) park();
      if (again) { again = false; reconcile(); }
    });
  }

  function reconcile() {
    if (stopped || !manifest) return;
    if (moving) { again = true; return; }
    const spots = getSpots().map((s) => ({ ...s, rect: s.el?.isConnected ? s.el.getBoundingClientRect() : null, hidden: !shown(s.el) }));
    const id = pickSpot(spots, hostId, innerWidth, innerHeight);
    if (id && id === hostId) {
      const s = getSpot(id);
      if (s?.el) fitInto(s.el);
      return;
    }
    if (id) return moveTo(getSpot(id));
    if (hostId || floating) {
      clearTimeout(parkedTimer);
      parkedTimer = setTimeout(() => { if (!stopped && !moving) { const again2 = getSpots().some((s) => shown(s.el)); if (!again2) leave(); else reconcile(); } }, hostId ? 250 : FLOAT_WAIT_MS);
    }
  }

  // --- pause when nobody can see it ---
  function observe(el) {
    io?.disconnect();
    if (!("IntersectionObserver" in window)) return;
    io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (!visible) player?.pause();
      else if (!document.hidden) player?.resume();
    });
    io.observe(el);
  }
  const onVisibility = () => { if (document.hidden) player?.pause(); else if (visible && (hostId || floating)) player?.resume(); };
  document.addEventListener("visibilitychange", onVisibility);
  offs.push(() => document.removeEventListener("visibilitychange", onVisibility));

  // --- the performance loop ---
  let clipTimer = 0;
  function beat(interrupt = false) {
    if (stopped || !player || walking) return;
    const b = brain.choose();
    log("beat", b.clip, b.kind, interrupt ? "interrupt" : "", JSON.stringify(b.cues || {}), b.keep ? "keep" : "");
    const dur = (manifest.clips[b.clip]?.duration || 3) * 1000;
    if (b.cues?.hop && dog.isConnected) motion.hop(body, shadow, b.cues.hop);
    if (b.cues?.lean && dog.isConnected) motion.lean(body, b.cues.lean, dur * 0.85);
    if (b.keep) return;
    state({ clip: b.clip, kind: b.kind });
    clearTimeout(clipTimer);
    if (dance && b.clip !== "play") { companion.signal("butterflyFree", { id: dance.id }); dance = null; }
    player
      .play(b.clip, { fade: interrupt ? 180 : 0, onEnd: () => beat(false) })
      .then(() => {
        // The butterfly that came to play follows the path the film's own butterfly took.
        if (b.clip === "play" && dance) { companion.signal("butterflyGo", { id: dance.id, startAt: performance.now() }); }
      })
      .catch(() => {
        // Video refused (iOS Low Power Mode, data saver...): keep the still image, retry
        // on the next tap. The dog still hops and moves with the body motion.
        clipTimer = setTimeout(() => beat(false), dur);
      });
  }

  // --- signals from the app, the voice, and the learner ---
  offs.push(companion.on((evt) => {
    // "Look at this element" (a new question, new content): the stage knows where both are.
    if (evt.type === "door") {
      // A full-screen transition (the entry "door of light") is about to cover the page:
      // lift the dog above it so it never blinks out, with a little hop into the light.
      if (hostId) lift();
      layer.style.zIndex = "9001";
      clearTimeout(doorTimer);
      doorTimer = setTimeout(() => { layer.style.zIndex = ""; }, 3000);
      if (dog.isConnected) motion.hop(body, shadow, "small");
      return;
    }
    if (evt.type === "butterflyVisit") {
      // A butterfly wants to come over. If the dog is free to play, it gets a path:
      // to where the filmed butterfly enters the picture, then along its flight.
      const track = manifest?.clips?.play?.track;
      log("butterflyVisit", JSON.stringify({ dance: !!dance, track: !!track?.length, hostId: !!hostId, moving, walking, connected: dog.isConnected, brain: brain.canPlay(), clip: !!player?.canPlay(["play"]) }));
      if (!dance && track?.length && hostId && !moving && !walking && dog.isConnected && brain.canPlay() && player?.canPlay(["play"])) {
        dance = { id: evt.id };
        companion.signal("butterflyDance", { id: evt.id, at: danceAt, start: track[0][0], end: track[track.length - 1][0] });
      }
      return;
    }
    if (evt.type === "butterflyReady") {
      if (dance?.id === evt.id && hostId && !walking && brain.dispatch({ type: "play" })) beat(true);
      else { companion.signal("butterflyFree", { id: evt.id }); if (dance?.id === evt.id) dance = null; }
      return;
    }
    if (evt.type === "butterflyDone") { if (dance?.id === evt.id) dance = null; return; }
    if (evt.type === "butterflyDance" || evt.type === "butterflyGo" || evt.type === "butterflyFree") return;
    if (evt.type === "lookAt") { log("lookAt", hostId ? "hosted" : "not hosted"); if (evt.el && hostId) look(evt.el, "attend"); return; }
    const i = brain.dispatch(evt);
    log("signal", evt.type, evt.size || "", i ? "interrupt" : "waits");
    if (i) beat(true);
  }));
  offs.push(onNarration((e) => {
    if (e.type === "start") { if (brain.dispatch({ type: "speakStart" })) beat(true); }
    else if (e.type === "end" || e.type === "blocked" || e.type === "unavailable") { if (brain.dispatch({ type: "speakEnd" })) beat(true); }
  }));

  let lastLook = { el: null, at: 0 };
  let lastMove = 0;
  let pointerRaf = 0;
  const onPointer = (e) => {
    if (e.pointerType === "touch") return;
    if (pointerRaf) return;
    pointerRaf = requestAnimationFrame(() => {
      pointerRaf = 0;
      const now = performance.now();
      if (now - lastMove > 1000) { lastMove = now; brain.dispatch({ type: "activity" }); }
      if (!hostId || !dog.isConnected) return;
      const near = nearest(e.clientX, e.clientY, 90);
      if (near && (near !== lastLook.el || now - lastLook.at > 15_000)) {
        lastLook = { el: near, at: now };
        look(near, "attend");
      }
    });
  };
  const onQuiet = () => brain.dispatch({ type: "quiet" });
  const onFocus = (e) => {
    const el = e.target?.closest?.(LOOK_SELECTOR);
    if (el && hostId) look(el, "attend");
    brain.dispatch({ type: "activity" });
  };
  const onDown = () => { clearTimeout(guideTimer); brain.dispatch({ type: "activity" }); player?.resume(); };
  addEventListener("pointermove", onPointer, { passive: true });
  addEventListener("scroll", onQuiet, { passive: true, capture: true });
  addEventListener("wheel", onQuiet, { passive: true });
  addEventListener("touchmove", onQuiet, { passive: true });
  addEventListener("keydown", onQuiet, { passive: true });
  addEventListener("focusin", onFocus);
  addEventListener("pointerdown", onDown, { passive: true });
  offs.push(() => {
    removeEventListener("pointermove", onPointer);
    removeEventListener("scroll", onQuiet, { capture: true });
    removeEventListener("wheel", onQuiet);
    removeEventListener("touchmove", onQuiet);
    removeEventListener("keydown", onQuiet);
    removeEventListener("focusin", onFocus);
    removeEventListener("pointerdown", onDown);
  });

  // Where the film's butterfly is at time t (s) of the "play" clip, on screen now.
  function danceAt(t) {
    const tr = manifest.clips.play.track;
    const r = dog.getBoundingClientRect();
    let i = 1;
    while (i < tr.length - 1 && tr[i][0] < t) i += 1;
    const [t0, x0, y0] = tr[i - 1];
    const [t1, x1, y1] = tr[i];
    const k = t1 > t0 ? Math.max(0, Math.min(1, (t - t0) / (t1 - t0))) : 0;
    return { x: r.left + (x0 + (x1 - x0) * k) * r.width, y: r.top + (y0 + (y1 - y0) * k) * r.height, scale: r.width / 160 };
  }

  function nearest(x, y, within) {
    let best = null;
    let bestD = within;
    document.querySelectorAll(LOOK_SELECTOR).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      const dx = Math.max(r.left - x, 0, x - r.right);
      const dy = Math.max(r.top - y, 0, y - r.bottom);
      const d = Math.hypot(dx, dy);
      if (d < bestD) { bestD = d; best = el; }
    });
    return best;
  }

  function look(el, type) {
    const g = gazeTowards(dog.getBoundingClientRect(), el.getBoundingClientRect());
    if (g.dir === "center") return;
    const i = brain.dispatch({ type, dir: g.dir });
    log(type, g.dir, i ? "interrupt" : "declined", JSON.stringify(brain.state));
    if (i) beat(true);
  }

  // A gentle "over there" towards the page's main action, once, if the learner seems unsure.
  function armGuide() {
    clearTimeout(guideTimer);
    guideTimer = setTimeout(() => {
      if (stopped || !hostId) return;
      const el = [...document.querySelectorAll(GUIDE_SELECTOR)].find((x) => visibleShare(x.getBoundingClientRect(), innerWidth, innerHeight) > 0.8);
      if (el) look(el, "guide");
    }, GUIDE_AFTER_MS);
  }

  // --- spots coming and going ---
  offs.push(onSpots((change) => {
    if (change?.removed && change.removed === hostId) {
      // The page that held the dog is going away (cleanup runs before the DOM goes):
      // keep the dog where it is on screen, and look for the next page's spot.
      lift();
    }
    if (change?.mood && change.updated === hostId) {
      const m = change.mood;
      const interrupt = m === "cheer" ? brain.dispatch({ type: "success", size: "big" }) : m === "think" ? brain.dispatch({ type: "curious" }) : m === "wave" ? brain.dispatch({ type: "greet" }) : false;
      if (interrupt) beat(true);
    }
    requestAnimationFrame(reconcile);
  }));
  let scrollT = 0;
  const onLayout = () => { clearTimeout(scrollT); scrollT = setTimeout(reconcile, 160); };
  addEventListener("resize", onLayout, { passive: true });
  addEventListener("scroll", onLayout, { passive: true, capture: true });
  offs.push(() => { removeEventListener("resize", onLayout); removeEventListener("scroll", onLayout, { capture: true }); });

  // --- start ---
  fetch(`${base}manifest.json`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`manifest ${r.status}`))))
    .then((m) => {
      if (stopped) return;
      manifest = m;
      poster.src = base + m.poster;
      try {
        player = new AlphaVideo(canvas, {
          base,
          manifest: m,
          onFirstFrame: () => {
            if (stopped) return;
            dog.dataset.live = "true";
            setLive(true);
            state({ live: true });
            // Likely next performances, fetched quietly once the first one shows.
            // Then the rest, so a reaction never waits for a download (2.2 MB in all).
            const later = () => {
              if (debug && localStorage.getItem("learnigo_companion_nopreload") === "1") return; // tests: cold switches
              // The walk first: the next page change should already be a walk, not a hop.
              player?.preload(["hello", "standUp", "walk", "sitDown", "talk", "cheer", "comfort"]);
              setTimeout(() => player?.preload(["lookRight", "lookLeft", "tilt", "point", "play"]), 6000);
            };
            if ("requestIdleCallback" in window) requestIdleCallback(later, { timeout: 4000 });
            else setTimeout(later, 1500);
          },
          onFail: () => stop(),
        });
      } catch {
        return stop();
      }
      sizeCanvas(160);
      if (debug) window.__companion = { player, brain, signal: (t, d) => companion.signal(t, d) };
      beat(false);
      reconcile();
    })
    .catch(() => stop());

  function stop() {
    if (stopped) return;
    stopped = true;
    clearTimeout(parkedTimer);
    clearTimeout(guideTimer);
    clearTimeout(doorTimer);
    clearTimeout(clipTimer);
    clearTimeout(scrollT);
    io?.disconnect();
    offs.forEach((f) => f());
    unhostMarker();
    player?.dispose();
    dog.remove();
    layer.remove();
    setLive(false);
    state({ live: false, stopped: true });
  }

  return { stop, get brain() { return brain; } };
}
