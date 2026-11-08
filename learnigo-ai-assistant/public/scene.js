// The 2.5D scene behind and around the lesson: depth layers that drift
// against the pointer (or the phone's tilt), a network of particles that
// speeds up when the teacher thinks, panels that tilt in 3D, the edge glow
// while the student speaks, and the visual pulse that goes with each haptic.
// Motion uses GSAP when it loaded (window.gsap) and plain styles otherwise;
// "reduce motion" keeps everything still.
const gsap = window.gsap;
if (gsap && window.Flip) gsap.registerPlugin(window.Flip);

const MODE_SPEED = { off: 0.25, idle: 0.35, hearing: 0.6, thinking: 1.6, teaching: 0.8, paused: 0.3 };
const MODE_HUE = { off: [91, 140, 255], idle: [91, 140, 255], hearing: [34, 211, 238], thinking: [167, 139, 250], teaching: [96, 165, 250], paused: [251, 191, 36] };

export function createScene({ reduced = false } = {}) {
  const root = document.documentElement;
  const layers = [...document.querySelectorAll('[data-depth]')];
  const tilts = [...document.querySelectorAll('[data-tilt]')];
  const pointer = { x: 0, y: 0 };
  let mode = 'off';

  // Each layer moves against the pointer by its depth; panels tilt toward it.
  const movers = layers.map((el) => {
    const d = Number(el.dataset.depth);
    if (!gsap || reduced) return () => {};
    const x = gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3.out' });
    const y = gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3.out' });
    return (px, py) => { x(-px * d * 40); y(-py * d * 26); };
  });
  const tilters = tilts.map((el) => {
    const deg = Number(el.dataset.tilt);
    if (!gsap || reduced) return () => {};
    gsap.set(el, { transformPerspective: 1400, transformStyle: 'preserve-3d' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.9, ease: 'power3.out' });
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.9, ease: 'power3.out' });
    return (px, py) => { ry(px * deg); rx(-py * deg); };
  });
  const move = () => {
    for (const m of movers) m(pointer.x, pointer.y);
    for (const t of tilters) t(pointer.x, pointer.y);
    root.style.setProperty('--px', pointer.x.toFixed(3));
    root.style.setProperty('--py', pointer.y.toFixed(3));
  };
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    move();
  }, { passive: true });
  const onTilt = (e) => {
    if (e.gamma == null) return;
    pointer.x = Math.max(-1, Math.min(1, e.gamma / 25));
    pointer.y = Math.max(-1, Math.min(1, (e.beta - 40) / 25));
    move();
  };
  // Phones: the tilt drives the parallax. iOS asks permission on a tap.
  async function enableTilt() {
    if (reduced || typeof DeviceOrientationEvent === 'undefined') return;
    try { if (typeof DeviceOrientationEvent.requestPermission === 'function' && (await DeviceOrientationEvent.requestPermission()) !== 'granted') return; } catch { return; }
    window.addEventListener('deviceorientation', onTilt, { passive: true });
  }

  // The particle network: points at three depths, linked when close.
  const space = document.getElementById('space');
  const ctx = space.getContext('2d');
  const N = window.innerWidth < 700 ? 60 : 120;
  const pts = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.7, vx: (Math.random() - 0.5) * 0.0004, vy: (Math.random() - 0.5) * 0.0004 }));
  let speed = MODE_SPEED.off;
  let hue = [...MODE_HUE.off];
  let last = performance.now();
  function draw(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!document.hidden) {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(space.clientWidth * dpr);
      const h = Math.round(space.clientHeight * dpr);
      if (space.width !== w || space.height !== h) { space.width = w; space.height = h; }
      const target = MODE_HUE[mode] || MODE_HUE.idle;
      for (let i = 0; i < 3; i++) hue[i] += (target[i] - hue[i]) * Math.min(1, dt * 2);
      speed += ((MODE_SPEED[mode] ?? 0.4) - speed) * Math.min(1, dt * 2);
      ctx.clearRect(0, 0, w, h);
      const [r, g, b] = hue.map(Math.round);
      const pos = pts.map((p) => {
        if (!reduced) { p.x = (p.x + p.vx * speed * 60 * dt * 60 + 1) % 1; p.y = (p.y + p.vy * speed * 60 * dt * 60 + 1) % 1; }
        return [p.x * w - pointer.x * p.z * 30 * dpr, p.y * h - pointer.y * p.z * 20 * dpr, p.z];
      });
      const reach = 130 * dpr;
      ctx.lineWidth = dpr;
      for (let i = 0; i < pos.length; i++) {
        for (let j = i + 1; j < pos.length; j++) {
          const dx = pos[i][0] - pos[j][0];
          const dy = pos[i][1] - pos[j][1];
          const d2 = dx * dx + dy * dy;
          if (d2 < reach * reach) {
            ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - Math.sqrt(d2) / reach) * 0.22 * Math.min(pos[i][2], pos[j][2])})`;
            ctx.beginPath(); ctx.moveTo(pos[i][0], pos[i][1]); ctx.lineTo(pos[j][0], pos[j][1]); ctx.stroke();
          }
        }
      }
      for (const [x, y, z] of pos) {
        ctx.fillStyle = `rgba(${r},${g},${b},${0.25 + z * 0.55})`;
        ctx.beginPath(); ctx.arc(x, y, (0.6 + z * 1.6) * dpr, 0, Math.PI * 2); ctx.fill();
      }
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  // The visual half of a haptic: a ring from the orb, a flash or a nudge.
  function pulse(kind) {
    if (reduced) return;
    const orb = document.querySelector('.orb-slot.live') || document.querySelector('.orb-slot');
    if (orb && gsap) {
      const ring = document.createElement('span');
      ring.className = `ripple ripple-${kind}`;
      orb.appendChild(ring);
      gsap.fromTo(ring, { scale: 0.55, opacity: 0.9 }, { scale: kind === 'success' ? 2.1 : 1.7, opacity: 0, duration: kind === 'think' ? 1.1 : 0.8, ease: 'power2.out', onComplete: () => ring.remove() });
    }
    const board = document.querySelector('.holo');
    if (!board || !gsap) return;
    if (kind === 'error') gsap.fromTo(board, { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
    if (kind === 'success' || kind === 'error') {
      board.classList.remove('flash-success', 'flash-error');
      void board.offsetWidth;
      board.classList.add(kind === 'success' ? 'flash-success' : 'flash-error');
    }
  }

  // The start screen gives way: the orb flies into its panel.
  function enter() {
    const orb = document.getElementById('orb');
    const slot = document.querySelector('.orb-slot.live');
    const hero = document.getElementById('hero');
    document.body.classList.add('started');
    if (!gsap || !window.Flip || reduced) { slot.appendChild(orb); hero.remove(); return; }
    const state = window.Flip.getState(orb);
    slot.appendChild(orb);
    window.Flip.from(state, { duration: 1.1, ease: 'power3.inOut', absolute: true });
    gsap.to(hero, { opacity: 0, duration: 0.6, delay: 0.2, onComplete: () => hero.remove() });
    gsap.from('.panel', { y: 40, opacity: 0, duration: 0.9, delay: 0.35, stagger: 0.12, ease: 'power3.out' });
  }

  function setMode(m) { mode = m; }

  fitBoard();
  return { setMode, pulse, enter, enableTilt };
}

// The board keeps 16:9 and takes the largest size that fits its box, so the
// whole lesson is on one screen on any device, in any orientation.
function fitBoard() {
  const box = document.querySelector('.holo-box');
  const holo = document.querySelector('.holo');
  if (!box || !holo) return;
  const caption = document.getElementById('caption');
  const column = matchMedia('(max-width: 860px) and (orientation: portrait), (max-width: 640px)');
  const fit = () => {
    const { width, height } = box.getBoundingClientRect();
    const cap = caption ? caption.offsetHeight + parseFloat(getComputedStyle(caption).marginTop || 0) : 0;
    let w = width;
    // In one column (a phone upright) the board is nearly square, so the
    // figure can fill it; side by side it keeps 16:9.
    let h = column.matches ? Math.min(w * 0.9, window.innerHeight * 0.38) : (w * 9) / 16;
    // Side by side the board fills the height left above its caption; in a
    // single column it takes the full width and the page below adapts.
    if (!column.matches && height > 0 && h > height - cap) { h = Math.max(120, height - cap); w = (h * 16) / 9; }
    holo.style.width = `${Math.floor(w)}px`;
    holo.style.height = `${Math.floor(h)}px`;
    if (caption) caption.style.width = `${Math.floor(w)}px`;
  };
  new ResizeObserver(fit).observe(box);
  fit();
}

// A new chat line or chip slides in.
export function reveal(el) {
  if (!window.gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  window.gsap.from(el, { y: 14, opacity: 0, duration: 0.45, ease: 'power3.out' });
}
