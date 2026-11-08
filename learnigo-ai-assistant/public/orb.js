// The teacher's presence: a living orb drawn by a WebGL shader. It breathes
// when idle, ripples with the student's voice while listening, swirls while
// thinking and pulses with its own voice while speaking. Level changes are
// smoothed over frames, because raw audio jitter makes an orb look broken.
// No WebGL, or "reduce motion": a calm CSS orb instead.
const VERT = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }';
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uLevel; uniform float uSwirl;
uniform vec3 uA; uniform vec3 uB;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  float r = length(uv);
  float ang = atan(uv.y, uv.x);
  float t = uTime;
  // The surface wobbles, more with the voice.
  float wob = fbm(vec2(cos(ang), sin(ang)) * 1.8 + t * (0.25 + uSwirl));
  float radius = 0.24 + (wob - 0.5) * (0.06 + uLevel * 0.22) + uLevel * 0.04;
  float d = r - radius;
  // Plasma inside: twice domain-warped noise, with hot streaks.
  vec2 q = uv * 2.6;
  vec2 w1 = vec2(fbm(q + t * 0.25), fbm(q + vec2(5.2, 1.3) - t * 0.2));
  vec2 w2 = vec2(fbm(q + 3.0 * w1 + vec2(1.7, 9.2) + t * (0.15 + uSwirl * 0.4)), fbm(q + 3.0 * w1 + vec2(8.3, 2.8)));
  float n = fbm(q + 3.0 * w2);
  vec3 col = mix(mix(uA * 0.28, uA, smoothstep(0.2, 0.5, n)), uB, smoothstep(0.48, 0.8, n));
  col = mix(col, vec3(1.0), smoothstep(0.72, 0.92, n) * 0.28);
  float body = smoothstep(0.005, -0.005, d);
  float k = clamp(r / radius, 0.0, 1.0);
  float depth = sqrt(max(0.0, 1.0 - k * k));
  vec3 c = col * body * (0.25 + 0.8 * depth);
  c += uB * pow(k, 3.5) * body * 0.6;
  c += body * pow(max(0.0, 1.0 - length(uv - vec2(-0.075, 0.085)) * 6.0), 4.0) * 0.32;
  // Halo and two orbit rings, one dashed, turning.
  float halo = exp(-max(d, 0.0) * 9.0) * (0.42 + uLevel * 0.85) * (1.0 - body);
  float ring1 = smoothstep(0.006, 0.0, abs(r - 0.355)) * (0.35 + 0.65 * max(0.0, sin(ang * 3.0 + t * 1.2)));
  float ring2 = smoothstep(0.0045, 0.0, abs(r - 0.42)) * step(0.15, sin(ang * 16.0 - t * 0.9));
  c += mix(uA, uB, 0.5) * halo * 0.85 + uA * ring1 * 0.9 + uB * ring2 * 0.7;
  gl_FragColor = vec4(min(c, vec3(1.0)), clamp(body + halo + ring1 * 0.9 + ring2 * 0.7, 0.0, 1.0));
}`;

// Two colours per state (rgb 0..1) and how much it swirls.
const STATES = {
  off: { a: '#5b8cff', b: '#a78bfa', swirl: 0.05 },
  idle: { a: '#5b8cff', b: '#a78bfa', swirl: 0.05 },
  hearing: { a: '#22d3ee', b: '#34d399', swirl: 0.25 },
  thinking: { a: '#a78bfa', b: '#f472b6', swirl: 1 },
  teaching: { a: '#3b82f6', b: '#22d3ee', swirl: 0.35 },
  paused: { a: '#fbbf24', b: '#fb7185', swirl: 0.15 },
};
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

export function createOrb(canvas, { reduced = false } = {}) {
  const gl = !reduced && canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: true });
  if (!gl) {
    canvas.classList.add('orb-fallback');
    return { setState: (s) => { canvas.dataset.state = s; }, setLevel() {} };
  }
  const shader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    canvas.classList.add('orb-fallback');
    return { setState: (s) => { canvas.dataset.state = s; }, setLevel() {} };
  }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  const u = Object.fromEntries(['uRes', 'uTime', 'uLevel', 'uSwirl', 'uA', 'uB'].map((n) => [n, gl.getUniformLocation(prog, n)]));

  let target = STATES.idle;
  const cur = { a: rgb(target.a), b: rgb(target.b), swirl: target.swirl };
  let level = 0;
  let wanted = 0;
  let t0 = performance.now();
  let time = 0;

  const fit = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  function frame(now) {
    const dt = Math.min(0.05, (now - t0) / 1000);
    t0 = now;
    if (!document.hidden) {
      fit();
      level += (wanted - level) * 0.14;
      const k = 1 - Math.pow(0.02, dt);
      const ta = rgb(target.a);
      const tb = rgb(target.b);
      for (let i = 0; i < 3; i++) { cur.a[i] += (ta[i] - cur.a[i]) * k; cur.b[i] += (tb[i] - cur.b[i]) * k; }
      cur.swirl += (target.swirl - cur.swirl) * k;
      time += dt * (1 + cur.swirl * 1.5 + level * 2);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform1f(u.uTime, time);
      gl.uniform1f(u.uLevel, level);
      gl.uniform1f(u.uSwirl, cur.swirl);
      gl.uniform3fv(u.uA, cur.a);
      gl.uniform3fv(u.uB, cur.b);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    setState(s) { target = STATES[s] || STATES.idle; canvas.dataset.state = s; },
    setLevel(v) { wanted = Math.max(0, Math.min(1, v)); },
  };
}
