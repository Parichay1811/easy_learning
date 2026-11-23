// Plays the companion's clips with transparency, in every browser.
//
// Each clip is one ordinary H.264 MP4 with the colour in the top half and the
// transparency (as grey) in the bottom half ("stacked alpha"). A tiny WebGL shader
// joins the halves, so one file works in Chrome, Firefox and Safari, decoded in
// hardware (WebM-alpha is not supported by Safari; HEVC-alpha only by Safari).
// See tools/companion/build.py for how the files are made.
//
//   const player = new AlphaVideo(canvas, { base: "/companion/", manifest });
//   await player.play("hello", { onEnd: () => … });
//   player.play("talk", { loop: true, fade: 180 });   // cross-fade when interrupting
//
// Throws from the constructor when WebGL is unavailable; the caller shows the still image.

const VS = `
attribute vec2 p;
varying vec2 uv;
void main() {
  uv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5);
  gl_Position = vec4(p, 0.0, 1.0);
}`;

// Colour is premultiplied in the file; output stays premultiplied.
const FS = `
precision mediump float;
uniform sampler2D a;
uniform sampler2D b;
uniform float k;
uniform float texel;
varying vec2 uv;
vec4 px(sampler2D t) {
  float yc = clamp(uv.y * 0.5, texel, 0.5 - texel);
  float ya = clamp(0.5 + uv.y * 0.5, 0.5 + texel, 1.0 - texel);
  float al = texture2D(t, vec2(uv.x, ya)).g;
  al = smoothstep(0.03, 0.97, al);
  vec3 c = min(texture2D(t, vec2(uv.x, yc)).rgb, vec3(al));
  return vec4(c, al);
}
void main() {
  gl_FragColor = mix(px(b), px(a), k);
}`;

const MAX_VIDEOS = 9; // all likely performances stay ready to switch to instantly

export class AlphaVideo {
  constructor(canvas, { base, manifest, onFirstFrame, onFail } = {}) {
    this.canvas = canvas;
    this.base = base;
    this.manifest = manifest;
    this.onFirstFrame = onFirstFrame;
    this.onFail = onFail;
    this.videos = new Map(); // id -> { v, tex, used, ready }
    this.cur = null; // id
    this.prev = null; // id (fading out)
    this.k = 1;
    this.fade = null; // { start, ms }
    this.painted = false;
    this.disposed = false;
    this.paused = false;
    this.endHandler = null;
    // Counters for tests and debugging: frames drawn, and frames drawn with nothing to show.
    this.stats = { draws: 0, blank: 0, switches: 0, waitMsMax: 0 };

    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
    if (!gl) throw new Error("no webgl");
    this.gl = gl;
    const prog = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, FS]]) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || "shader");
      gl.attachShader(prog, sh);
    }
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = { a: gl.getUniformLocation(prog, "a"), b: gl.getUniformLocation(prog, "b"), k: gl.getUniformLocation(prog, "k"), texel: gl.getUniformLocation(prog, "texel") };
    gl.uniform1i(this.u.a, 0);
    gl.uniform1i(this.u.b, 1);
    gl.uniform1f(this.u.texel, 0.5 / (manifest.height * 2));
    gl.clearColor(0, 0, 0, 0);
    this.blank = this.makeTex();
    this.lost = (e) => { e.preventDefault(); this.fail("context lost"); };
    canvas.addEventListener("webglcontextlost", this.lost);
  }

  makeTex() {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    return t;
  }

  fail(why) {
    if (this.failed) return;
    this.failed = true;
    this.onFail?.(why);
  }

  /** The video for a clip, created (and kept) on first use. */
  entry(id) {
    let e = this.videos.get(id);
    if (e) { e.used = performance.now(); return e; }
    const clip = this.manifest.clips[id];
    if (!clip) throw new Error(`unknown clip ${id}`);
    const v = document.createElement("video");
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("muted", "");
    v.preload = "auto";
    v.crossOrigin = "anonymous";
    v.disableRemotePlayback = true;
    v.src = this.base + clip.src;
    e = { id, v, tex: this.makeTex(), used: performance.now(), ready: false, frames: 0 };
    v.addEventListener("error", () => { if (this.cur === id) this.fail(`video error ${id}`); });
    this.videos.set(id, e);
    this.evict();
    return e;
  }

  evict() {
    if (this.videos.size <= MAX_VIDEOS) return;
    const keep = new Set([this.cur, this.prev, "idle"]);
    const old = [...this.videos.values()].filter((e) => !keep.has(e.id)).sort((a, b) => a.used - b.used)[0];
    if (!old) return;
    old.v.pause();
    old.v.removeAttribute("src");
    old.v.load();
    this.gl.deleteTexture(old.tex);
    this.videos.delete(old.id);
  }

  /** Start downloading clips that are likely next, without playing them. */
  preload(ids) {
    ids.forEach((id) => { if (this.manifest.clips[id]) this.entry(id); });
  }

  upload(e) {
    const gl = this.gl;
    if (e.v.readyState < 2) return false;
    gl.bindTexture(gl.TEXTURE_2D, e.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, e.v);
    e.ready = true;
    e.frames += 1;
    if (e.id === this.cur && !e.fresh) {
      // The new clip has a frame of its own: only now does the hand-over from the clip
      // on screen begin (a short cross-fade at a clip boundary, where both show the
      // resting pose; a longer one when a reaction interrupts).
      e.fresh = true;
      if (this.prev) { this.fade = { start: performance.now(), ms: this.handover || 90 }; this.k = 0; }
      this.stats.waitMsMax = Math.max(this.stats.waitMsMax, Math.round(performance.now() - (this.switchAt || 0)));
    }
    return true;
  }

  draw() {
    if (this.disposed || this.failed) return;
    const gl = this.gl;
    const c = this.canvas;
    gl.viewport(0, 0, c.width, c.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const cur = this.videos.get(this.cur);
    const prev = this.prev ? this.videos.get(this.prev) : null;
    // Never a gap: until the new clip has drawn its own first frame, the clip that was
    // on screen stays on screen (still playing, or holding its last frame).
    const curOk = Boolean(cur?.ready && cur.fresh);
    const hold = prev?.ready ? prev.tex : cur?.ready ? cur.tex : this.blank;
    const texA = curOk ? cur.tex : hold;
    const texB = prev?.ready ? prev.tex : texA;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texB);
    gl.uniform1f(this.u.k, curOk ? (this.fade ? this.k : 1) : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.stats.draws += 1;
    if (this.painted && texA === this.blank) this.stats.blank += 1;
    if (!this.painted && curOk) {
      this.painted = true;
      this.onFirstFrame?.();
    }
  }

  /** True while a new clip is waiting for its first frame (the old one is held). */
  get handingOver() {
    const cur = this.videos.get(this.cur);
    return Boolean(this.fade || (this.prev && !cur?.fresh));
  }

  /**
   * Frame pump: upload new frames and draw. While one clip plays, wake only when the
   * video has a new frame (requestVideoFrameCallback, 24 times a second); during a
   * hand-over between clips, every display frame (requestAnimationFrame).
   */
  pump() {
    if (this.disposed || this.paused) return;
    const cur = this.videos.get(this.cur);
    if (this.handingOver || !cur || typeof cur.v.requestVideoFrameCallback !== "function") { this.rafLoop(); return; }
    if (this.raf) return; // the hand-over loop passes back when it ends
    if (this.waiting === cur) return;
    this.waiting = cur;
    cur.v.requestVideoFrameCallback(() => {
      if (this.waiting === cur) this.waiting = null;
      if (this.disposed || this.paused) return;
      if (this.cur === cur.id && this.upload(cur)) this.draw();
      this.pump();
    });
  }

  rafLoop() {
    if (this.raf || this.disposed) return;
    const tick = () => {
      this.raf = 0;
      if (this.disposed || this.paused) return;
      const cur = this.videos.get(this.cur);
      const prev = this.prev ? this.videos.get(this.prev) : null;
      let changed = false;
      if (cur && cur.v.currentTime !== cur.t) { cur.t = cur.v.currentTime; changed = this.upload(cur) || changed; }
      if (prev && prev.v.currentTime !== prev.t) { prev.t = prev.v.currentTime; changed = this.upload(prev) || changed; }
      if (this.fade) {
        const k = Math.min(1, Math.max(0, (performance.now() - this.fade.start) / this.fade.ms));
        this.k = k * k * (3 - 2 * k);
        changed = true;
        if (k >= 1) {
          this.fade = null;
          this.k = 1;
          if (prev && prev.id !== this.cur) prev.v.pause();
          this.prev = null;
        }
      }
      if (changed) this.draw();
      if (!this.handingOver && cur && typeof cur.v.requestVideoFrameCallback === "function") { this.pump(); return; }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  /**
   * Play a clip from its start. Resolves once it is playing (or rejects when the
   * browser refuses to play video, e.g. iOS Low Power Mode: show the still image).
   * `fade`: the cross-fade length when this interrupts a clip (default: a short
   * boundary blend). The clip on screen is never dropped before the new one can draw.
   */
  async play(id, { loop = false, fade = 0, onEnd } = {}) {
    if (this.disposed || this.failed) return;
    const e = this.entry(id);
    const was = this.cur;
    if (was !== id) {
      const onScreen = was ? this.videos.get(was) : null;
      if (onScreen?.ready && onScreen.fresh) {
        if (this.prev && this.prev !== was) this.videos.get(this.prev)?.v.pause();
        this.prev = was;
      }
      // else: `was` never showed a frame; whatever is held (this.prev) stays held.
      this.handover = fade > 0 ? fade : 90;
      this.fade = null;
      this.k = 0;
      e.fresh = false;
      this.switchAt = performance.now();
      this.stats.switches += 1;
    }
    this.cur = id;
    if (this.endHandler) { this.endHandler.v.removeEventListener("ended", this.endHandler.fn); this.endHandler = null; }
    e.v.loop = loop;
    if (!loop && onEnd) {
      const fn = () => { if (this.cur === id) onEnd(); };
      e.v.addEventListener("ended", fn, { once: true });
      this.endHandler = { v: e.v, fn };
    }
    try { e.v.currentTime = 0; } catch { /* not seekable yet: starts at 0 anyway */ }
    e.t = -1;
    this.pump();
    await e.v.play();
  }

  /** Pause everything (tab hidden, off screen); resume() continues. */
  pause() {
    this.paused = true;
    this.waiting = null;
    this.videos.forEach((e) => e.v.pause());
    if (this.raf) { cancelAnimationFrame(this.raf); this.raf = 0; }
  }

  resume() {
    if (!this.paused || this.disposed) return;
    this.paused = false;
    const cur = this.videos.get(this.cur);
    cur?.v.play()?.catch?.(() => this.fail("play refused"));
    this.pump();
  }

  resize(w, h) {
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.draw();
    }
  }

  dispose() {
    this.disposed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.canvas.removeEventListener("webglcontextlost", this.lost);
    this.videos.forEach((e) => { e.v.pause(); e.v.removeAttribute("src"); e.v.load(); });
    this.videos.clear();
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
