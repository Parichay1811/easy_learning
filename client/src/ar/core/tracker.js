/**
 * Camera + MediaPipe detection loop, producing one normalized "frame" object
 * per animation tick in STAGE space (see geometry.js).
 *
 * Deliberately not a React hook internally: at 30-60 fps, setState per frame
 * would re-render every game on every frame. Instead the tracker owns a mutable
 * `frame` object; the render loop and game logic read it directly, and React
 * only hears about coarse status changes (loading / ready / error).
 *
 * Mobile hardening (each of these was a way the games silently broke on
 * phones):
 *   - inference runs in a Web Worker (vision.js / visionWorker.js), one frame
 *     in flight at a time, so a slow model can only lower the tracking rate —
 *     it can never freeze the page. Where a worker is not possible, inference
 *     on the main thread gets a strict time budget instead,
 *   - frames reach MediaPipe through a small 2D canvas rather than the raw
 *     <video>, which sidesteps WebKit's camera-video → WebGL upload bugs and
 *     cuts the per-frame upload on high-resolution phone cameras,
 *   - a stalled requestVideoFrameCallback falls back to animation frames,
 *   - the camera is re-acquired when iOS/Android kill it in the background,
 *   - getUserMedia retries with looser constraints / after "camera busy".
 */
import { getVisionEngine, isConstrainedDevice, HAND, POSE } from './vision'
import { makeStageTransform, clamp, aspectDist } from './geometry'
import { PointFilter, Holder } from './filters'

const HAND_KEYS = ['left', 'right']

function emptyFrame() {
  return {
    t: 0,
    dt: 0,
    fps: 0,
    detectMs: 0,
    captureLatencyMs: null,
    latencyMs: 60,
    hands: [],
    left: null,
    right: null,
    primary: null,
    pose: null,
    bodyPresent: false,
    stage: { w: 0, h: 0 },
    handsSwapped: true,
    frames: 0,
  }
}

/** Per-hand smoothing state, kept across frames so filters have history. */
function makeHandState() {
  return {
    tip: new PointFilter({ minCutoff: 1.6, beta: 0.05 }),
    palm: new PointFilter({ minCutoff: 1.1, beta: 0.03 }),
    wrist: new PointFilter({ minCutoff: 1.1, beta: 0.03 }),
    holder: new Holder(240),
    pinchHigh: false,
    lastSeen: -Infinity,
  }
}

export class ARTracker {
  constructor(options = {}) {
    this.opts = {
      tracking: 'hand', // 'hand' | 'pose' | 'both'
      mirror: true,
      handSwap: true, // MediaPipe handedness assumes a mirrored frame; ours is raw.
      maxHands: 2,
      targetFps: 60,
      width: 960,
      height: 720,
      // Long side of the frame handed to MediaPipe. The camera picture the
      // child sees stays full resolution; the models only look at ~192-256 px
      // anyway, so analysing a 640 px copy loses nothing and saves a big
      // per-frame upload on phones with high-resolution cameras.
      inferenceSize: 640,
      ...options,
    }
    this._constrained = isConstrainedDevice()

    this.frame = emptyFrame()
    this.frame.handsSwapped = this.opts.handSwap
    this.status = 'idle' // idle | starting | ready | paused | error
    this.error = null

    this.video = null
    this.stream = null
    this.engine = null
    this._needHand = false
    this._needPose = false

    this.stageSize = { w: 0, h: 0 }
    this.transform = makeStageTransform(0, 0, 0, 0, this.opts.mirror)

    this._listeners = new Set()
    this._statusListeners = new Set()
    this._running = false
    this._paused = false
    this._rafId = null
    this._vfcId = null
    this._lastVideoTime = -1
    this._lastTick = 0
    this._fpsWindow = []
    this._captureLatencySamples = []
    this._detectSamples = []
    this._handState = { left: makeHandState(), right: makeHandState() }
    this._poseHolder = new Holder(320)
    this._boundLoop = this._loop.bind(this)

    // scheduling state
    this._pending = false
    this._useRaf = false
    this._watchdog = null
    this._lastDetectEnd = 0
    this._detectEma = { hand: 0, pose: 0 }
    this._gapEma = { hand: 0, pose: 0 }
    this._lastRun = { hand: 0, pose: 0 }
    this._turn = 0
    this._gen = 0
    this._inflight = false
    this._skipped = 0
    this._detected = 0

    // inference input
    this._input = null
    this._inputCtx = null

    // camera recovery
    this._reacquiring = null
    this._onVisibility = this._handleVisibility.bind(this)
    this._onTrackEnded = () => {
      if (typeof document === 'undefined' || !document.hidden) this._reacquireCamera()
    }
  }

  /** Delegate actually in use ('GPU' | 'CPU'), for HUD and telemetry. */
  get delegate() {
    const d = this.engine?.info().delegate
    return d?.hand || d?.pose || null
  }

  // ── subscriptions ──────────────────────────────────────────────────────────
  /** Called on every produced frame. Keep the callback cheap. */
  onFrame(fn) {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }

  onStatus(fn) {
    this._statusListeners.add(fn)
    fn(this.status, this.error)
    return () => this._statusListeners.delete(fn)
  }

  _setStatus(status, error = null) {
    if (this.status === status && this.error === error) return
    this.status = status
    this.error = error
    for (const fn of this._statusListeners) {
      try {
        fn(status, error)
      } catch (e) {
        console.error('[ar] status listener threw', e)
      }
    }
  }

  // ── lifecycle ──────────────────────────────────────────────────────────────
  setStageSize(w, h) {
    if (this.stageSize.w === w && this.stageSize.h === h) return
    this.stageSize = { w, h }
    this._rebuildTransform()
  }

  _rebuildTransform() {
    const vw = this.video?.videoWidth || 0
    const vh = this.video?.videoHeight || 0
    this._vw = vw
    this._vh = vh
    this.transform = makeStageTransform(
      vw,
      vh,
      this.stageSize.w,
      this.stageSize.h,
      this.opts.mirror
    )
    this.frame.stage = { ...this.stageSize }
  }

  setHandSwap(swap) {
    this.opts.handSwap = swap
    this.frame.handsSwapped = swap
  }

  /**
   * @param {HTMLVideoElement} video an element already in the DOM (muted, playsInline)
   */
  async start(video) {
    if (this._running) return
    this.video = video
    this._running = true
    this._setStatus('starting')

    // Models load while the camera permission prompt is up — on a phone the
    // two together used to take twice as long one after the other.
    const needHand = this.opts.tracking !== 'pose'
    const needPose = this.opts.tracking !== 'hand'
    const engine = getVisionEngine()
    const modelsReady = engine.ensure({ hand: needHand, pose: needPose, numHands: this.opts.maxHands })
    modelsReady.catch(() => {}) // reported below, after the camera

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw Object.assign(new Error('CAMERA_UNSUPPORTED'), { name: 'CameraUnsupported' })
      }
      const stream = await openCamera(this._cameraConstraints())
      if (!this._running) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      this._attachStream(stream)
      await playVideo(video)
      await waitForVideoSize(video, 5000)
      this._rebuildTransform()
    } catch (err) {
      this._fail(err, cameraErrorCode(err))
      return
    }

    try {
      await modelsReady
      if (!this._running) return
      this.engine = engine
      this._needHand = needHand
      this._needPose = needPose
    } catch (err) {
      this._fail(err, 'MODEL_FAILED')
      return
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this._onVisibility)
    }
    if (import.meta.env?.DEV && typeof window !== 'undefined') window.__arTracker = this
    this._setStatus('ready')
    this._scheduleNext()
  }

  _fail(err, code) {
    this._running = false
    console.error('[ar] tracker start failed:', err)
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    this._setStatus('error', code)
  }

  /**
   * Ask for the orientation the screen is actually in. A phone held upright
   * will usually hand back a genuinely portrait stream — its sensor is
   * physically rotated — which fills far more of the screen than a landscape
   * frame letterboxed into a tall window.
   *
   * These are `ideal`, never `exact`/`min`/`max`, on purpose: a device that has
   * only landscape modes must be free to ignore the request and give us its
   * full frame rather than crop its sensor (or refuse outright) to satisfy us.
   */
  _cameraConstraints() {
    const portrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth
    const longSide = Math.max(this.opts.width, this.opts.height)
    const shortSide = Math.min(this.opts.width, this.opts.height)
    return {
      facingMode: 'user',
      width: { ideal: portrait ? shortSide : longSide },
      height: { ideal: portrait ? longSide : shortSide },
      frameRate: { ideal: 30 },
    }
  }

  _attachStream(stream) {
    this.stream?.getVideoTracks().forEach((t) => t.removeEventListener('ended', this._onTrackEnded))
    this.stream = stream
    stream.getVideoTracks().forEach((t) => t.addEventListener('ended', this._onTrackEnded))
    const video = this.video
    video.muted = true
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    video.srcObject = stream
  }

  /**
   * iOS stops the camera when the page is backgrounded (and Android does when
   * the screen locks); coming back showed a frozen picture forever.
   */
  _handleVisibility() {
    if (!this._running || document.hidden) return
    const track = this.stream?.getVideoTracks()[0]
    if (!track || track.readyState === 'ended') {
      this._reacquireCamera()
    } else if (this.video?.paused) {
      this.video.play().catch(() => {})
    }
    this._restartLoop()
  }

  _reacquireCamera() {
    if (this._reacquiring || !this._running || !this.video) return this._reacquiring
    this._reacquiring = (async () => {
      try {
        this.stream?.getTracks().forEach((t) => t.stop())
        const stream = await openCamera(this._cameraConstraints())
        if (!this._running || !this.video) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        this._attachStream(stream)
        await playVideo(this.video)
        await waitForVideoSize(this.video, 5000)
        this._rebuildTransform()
        this._restartLoop()
      } catch (err) {
        console.warn('[ar] could not re-open the camera:', err?.message || err)
        this._setStatus('error', cameraErrorCode(err))
      } finally {
        this._reacquiring = null
      }
    })()
    return this._reacquiring
  }

  pause() {
    if (!this._running || this._paused) return
    this._paused = true
    this._cancelScheduled()
    this._setStatus('paused')
    // Keep the camera track live: re-acquiring getUserMedia on every resume
    // costs ~1 s and re-prompts on some browsers.
  }

  resume() {
    if (!this._running || !this._paused) return
    this._paused = false
    this._lastVideoTime = -1
    this._lastTick = 0
    for (const k of HAND_KEYS) {
      this._handState[k].tip.reset()
      this._handState[k].palm.reset()
      this._handState[k].wrist.reset()
      this._handState[k].holder.clear()
    }
    this._poseHolder.clear()
    this._setStatus('ready')
    this._scheduleNext()
  }

  stop() {
    this._running = false
    this._paused = false
    this._cancelScheduled()
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this._onVisibility)
    }
    this.stream?.getVideoTracks().forEach((t) => t.removeEventListener('ended', this._onTrackEnded))
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    if (typeof window !== 'undefined' && window.__arTracker === this) delete window.__arTracker
    if (this.video) {
      this.video.srcObject = null
      this.video = null
    }
    // The vision engine is a shared singleton — never disposed here.
    this.engine = null
    this._gen++
    this._inflight = false
    this._listeners.clear()
    this._statusListeners.clear()
    this._setStatus('idle')
  }

  // ── the loop ───────────────────────────────────────────────────────────────
  _cancelScheduled() {
    if (this._rafId != null) cancelAnimationFrame(this._rafId)
    if (this._vfcId != null && this.video?.cancelVideoFrameCallback) {
      this.video.cancelVideoFrameCallback(this._vfcId)
    }
    clearTimeout(this._watchdog)
    this._rafId = null
    this._vfcId = null
    this._watchdog = null
    this._pending = false
  }

  _scheduleNext() {
    if (!this._running || this._paused || this._pending) return
    const v = this.video
    this._pending = true
    if (!this._useRaf && v?.requestVideoFrameCallback) {
      // Frame-accurate: gives us the real capture timestamp, which is what makes
      // the rhythm game's timing error meaningful instead of measuring our own
      // pipeline lag.
      this._vfcId = v.requestVideoFrameCallback((now, meta) => this._boundLoop(now, meta))
      this._armWatchdog(v)
    } else {
      this._rafId = requestAnimationFrame((now) => this._boundLoop(now, null))
    }
  }

  /**
   * Some mobile WebKit builds stop delivering video-frame callbacks for a
   * camera stream (or never start). Without this the game sat on its first
   * frame forever; with it we drop to plain animation frames.
   */
  _armWatchdog(v, strikes = 0, ms = 1200) {
    clearTimeout(this._watchdog)
    const videoTimeAtArm = v.currentTime
    this._watchdog = setTimeout(() => {
      this._watchdog = null
      if (!this._running || this._paused || !this._pending || this._useRaf) return
      const hidden = typeof document !== 'undefined' && document.hidden
      // Only a stall if the camera *is* producing frames that never reach us.
      // A busy main thread or a paused/frozen camera is not this problem.
      const advancing = v.currentTime !== videoTimeAtArm
      if (hidden || v.paused || v.readyState < 2 || !advancing) {
        this._armWatchdog(v, 0)
        return
      }
      // One miss can be a long task finishing; two in a row is a real stall.
      if (strikes < 1) {
        this._armWatchdog(v, strikes + 1, 500)
        return
      }
      console.warn('[ar] video frame callbacks stalled — switching to animation frames')
      this._cancelScheduled()
      this._useRaf = true
      this._scheduleNext()
    }, ms)
  }

  /** Drops any pending callback and starts the loop afresh. */
  _restartLoop() {
    this._cancelScheduled()
    this._lastVideoTime = -1
    this._lastTick = 0
    this._scheduleNext()
  }

  _loop(now, meta) {
    this._pending = false
    clearTimeout(this._watchdog)
    this._watchdog = null
    this._rafId = null
    this._vfcId = null
    if (!this._running || this._paused) return
    const video = this.video
    if (!video || video.readyState < 2 || !video.videoWidth) {
      this._scheduleNext()
      return
    }
    if (video.videoWidth !== this._vw || video.videoHeight !== this._vh) {
      // The camera changed resolution (rotation, re-acquire, late metadata).
      this._rebuildTransform()
    }

    const dt = this._lastTick ? (now - this._lastTick) / 1000 : 1 / 30
    this._lastTick = now

    this._fpsWindow.push(now)
    while (this._fpsWindow.length && now - this._fpsWindow[0] > 1000) this._fpsWindow.shift()

    // Capture latency: how stale the pixels we are about to analyse already are.
    let captureLatency = null
    if (meta && Number.isFinite(meta.captureTime)) {
      captureLatency = clamp(now - meta.captureTime, 0, 400)
    } else if (meta && Number.isFinite(meta.presentationTime)) {
      captureLatency = clamp(now - meta.presentationTime, 0, 400)
    }
    if (captureLatency != null) {
      this._captureLatencySamples.push(captureLatency)
      if (this._captureLatencySamples.length > 90) this._captureLatencySamples.shift()
    }

    // Only analyse a genuinely new camera frame (display refresh is often
    // faster than the camera), one at a time, within the time budget.
    const vt = video.currentTime
    const isNewVideoFrame = meta ? true : vt !== this._lastVideoTime
    if (isNewVideoFrame) {
      this._lastVideoTime = vt
      if (this._canDetect(performance.now())) this._detect(video, now)
      else this._skipped++
    }

    this._composeFrame(now, dt)

    for (const fn of this._listeners) {
      try {
        fn(this.frame)
      } catch (e) {
        console.error('[ar] frame listener threw', e)
      }
    }

    this._scheduleNext()
  }

  /**
   * One frame in flight at a time, always.
   *
   * In the worker that is the whole story: the main thread never waits, so a
   * slow phone simply gets fewer tracking updates.
   *
   * On the main-thread fallback inference is synchronous. On a laptop it costs
   * ~5-10 ms; on a phone's CPU it can cost 60-150 ms, and back-to-back calls
   * left no time for touch or drawing, so the page froze. There, after an
   * inference of X ms we leave at least 0.6·X (phones) / 0.35·X (desktops) for
   * everything else. Holders and 1-euro filters bridge the gaps.
   */
  _canDetect(t) {
    if (!this.engine || this._inflight || this.engine.recovering) return false
    if (this.engine.mode === 'worker') return true
    const cost =
      (this._needHand ? this._detectEma.hand : 0) + (this._needPose ? this._detectEma.pose : 0)
    if (cost < 12) return true
    const share = this._constrained ? 0.6 : 0.35
    return t - this._lastDetectEnd >= cost * share
  }

  /** Draws the frame into the (small) inference canvas MediaPipe reads from. */
  _inferenceFrame(video) {
    const vw = video.videoWidth
    const vh = video.videoHeight
    const scale = Math.min(1, this.opts.inferenceSize / Math.max(vw, vh))
    const w = Math.max(1, Math.round(vw * scale))
    const h = Math.max(1, Math.round(vh * scale))
    if (!this._input) {
      this._input = document.createElement('canvas')
      this._inputCtx = this._input.getContext('2d', { alpha: false, desynchronized: true })
    }
    if (this._input.width !== w || this._input.height !== h) {
      this._input.width = w
      this._input.height = h
    }
    try {
      this._inputCtx.drawImage(video, 0, 0, w, h)
      return this._input
    } catch {
      // Canvas unusable for some reason — the video element itself still works
      // on most browsers (main-thread path only; a worker needs a bitmap).
      return this.engine?.mode === 'worker' ? null : video
    }
  }

  _detect(video, now) {
    const input = this._inferenceFrame(video)
    if (!input) return
    // With both models, alternate them frame by frame when they are slow:
    // each still updates at half rate, and a frame costs one model, not two.
    let runHand = this._needHand
    let runPose = this._needPose
    if (runHand && runPose) {
      const cost = this._detectEma.hand + this._detectEma.pose
      const slow = this.engine.mode === 'worker' ? cost > 60 : this._constrained || cost > 25
      if (slow) {
        this._turn ^= 1
        runHand = this._turn === 0
        runPose = !runHand
      }
    }
    const tStart = performance.now()
    const gen = this._gen
    this._inflight = true
    this.engine
      .detect(input, now, { hand: runHand, pose: runPose })
      .then((r) => {
        if (gen !== this._gen || !this._running) return
        const arrived = performance.now()
        this._lastDetectEnd = arrived
        if (!r) {
          this._skipped++
          return
        }
        const latency = arrived - tStart
        this._detectSamples.push(latency)
        if (this._detectSamples.length > 60) this._detectSamples.shift()
        this._detected++
        if (runHand) {
          this._noteCost('hand', r.ms?.hand || 0, latency)
          this._ingestHands(r.hand, now)
        }
        if (runPose) {
          this._noteCost('pose', r.ms?.pose || 0, latency)
          this._ingestPose(r.pose, now)
        }
      })
      .catch((err) => {
        // A single bad frame should not kill the game.
        console.warn('[ar] detect failed for one frame:', err?.message || err)
      })
      .finally(() => {
        if (gen === this._gen) this._inflight = false
      })
  }

  _noteCost(kind, ms, latency) {
    const prev = this._detectEma[kind]
    this._detectEma[kind] = prev ? prev * 0.85 + ms * 0.15 : ms
    // How long a lost hand/body is held must cover the gap between two
    // analyses plus how late a result lands, or on a slow phone the cursor
    // blinks out between every pair.
    const now = performance.now()
    const last = this._lastRun[kind]
    this._lastRun[kind] = now
    if (last) {
      const gap = Math.min(now - last, 1000)
      const g = this._gapEma[kind]
      this._gapEma[kind] = g ? g * 0.8 + gap * 0.2 : gap
      const hold = Math.round(Math.min(this._gapEma[kind] * 2 + latency, 1000))
      if (kind === 'hand') {
        for (const k of HAND_KEYS) this._handState[k].holder.holdMs = Math.max(240, hold)
      } else {
        this._poseHolder.holdMs = Math.max(320, hold)
      }
    }
  }

  // ── hand ingestion ─────────────────────────────────────────────────────────
  _ingestHands(result, now) {
    const seen = { left: false, right: false }
    const lists = result?.landmarks || []
    const handedness = result?.handedness || result?.handednesses || []

    for (let i = 0; i < lists.length; i++) {
      const lm = lists[i]
      if (!lm || lm.length < 21) continue
      const cat = handedness[i]?.[0]
      const rawLabel = cat?.category_name || cat?.categoryName || 'Right'
      const score = cat?.score ?? 0.5

      // MediaPipe's handedness assumes a mirrored (selfie-flipped) input. We
      // feed the raw frame, so by default the label refers to the opposite
      // hand. `handSwap` is auto-calibrated by the laterality games and
      // therapist-overridable in settings.
      let side = rawLabel.toLowerCase() === 'left' ? 'left' : 'right'
      if (this.opts.handSwap) side = side === 'left' ? 'right' : 'left'
      if (seen[side]) side = side === 'left' ? 'right' : 'left' // never two "left" hands
      if (seen[side]) continue
      seen[side] = true

      const st = this._handState[side]
      const dtSec = st.lastSeen === -Infinity ? 1 / 30 : Math.max((now - st.lastSeen) / 1000, 1 / 240)
      st.lastSeen = now

      const T = this.transform
      const stagePts = lm.map((p) => {
        const s = T.toStage(p.x, p.y)
        return { x: s.x, y: s.y, z: p.z ?? 0, visibility: p.visibility ?? 1 }
      })

      const tip = st.tip.filter(stagePts[HAND.INDEX_TIP], dtSec)
      const wrist = st.wrist.filter(stagePts[HAND.WRIST], dtSec)
      const palmRaw = {
        x: (stagePts[HAND.INDEX_MCP].x + stagePts[HAND.PINKY_MCP].x + stagePts[HAND.WRIST].x) / 3,
        y: (stagePts[HAND.INDEX_MCP].y + stagePts[HAND.PINKY_MCP].y + stagePts[HAND.WRIST].y) / 3,
      }
      const palm = st.palm.filter(palmRaw, dtSec)

      const { w, h } = this.stageSize
      // Hand span (wrist → middle MCP) is our scale reference, so pinch and
      // gesture thresholds work the same for a small child close to the camera
      // and a taller one further back.
      const span =
        aspectDist(stagePts[HAND.WRIST], stagePts[HAND.MIDDLE_MCP], w, h) || 0.12

      const pinchRaw = aspectDist(stagePts[HAND.THUMB_TIP], stagePts[HAND.INDEX_TIP], w, h) / span
      // 0 = fully pinched, 1 = wide open; hysteresis stops flicker at the edge.
      const pinch = clamp(1 - pinchRaw / 1.05, 0, 1)
      if (st.pinchHigh) st.pinchHigh = pinch > 0.45
      else st.pinchHigh = pinch > 0.65

      const extended = countExtendedFingers(stagePts, w, h, span)
      const openness = clamp(extended.count / 5, 0, 1)

      const hand = {
        side,
        score,
        rawLabel,
        lm: stagePts,
        tip,
        palm,
        wrist,
        span,
        pinch,
        pinching: st.pinchHigh,
        openness,
        fingers: extended.flags,
        gesture: classifyGesture(extended, st.pinchHigh),
        velocity: { ...st.tip.velocity },
        speed: Math.hypot(st.tip.velocity.x, st.tip.velocity.y),
        t: now,
      }
      st.holder.push(hand, now)
    }

    for (const k of HAND_KEYS) if (!seen[k]) this._handState[k].holder.get(now)
  }

  // ── pose ingestion ─────────────────────────────────────────────────────────
  _ingestPose(result, now) {
    const lm = result?.landmarks?.[0]
    if (!lm || lm.length < 33) return
    const T = this.transform
    const pts = lm.map((p) => {
      const s = T.toStage(p.x, p.y)
      return { x: s.x, y: s.y, z: p.z ?? 0, visibility: p.visibility ?? 1 }
    })
    // Mirroring swaps which physical side each landmark index belongs to. Remap
    // so `pose.lm[POSE.LEFT_WRIST]` really is the child's left wrist.
    const remapped = this.opts.mirror ? mirrorPoseSides(pts) : pts

    const keyJoints = [
      POSE.LEFT_SHOULDER, POSE.RIGHT_SHOULDER, POSE.LEFT_HIP, POSE.RIGHT_HIP,
      POSE.LEFT_WRIST, POSE.RIGHT_WRIST, POSE.NOSE,
    ]
    const visible =
      keyJoints.reduce((s, i) => s + (remapped[i]?.visibility > 0.5 ? 1 : 0), 0) / keyJoints.length

    const hipMid = mid(remapped[POSE.LEFT_HIP], remapped[POSE.RIGHT_HIP])
    const shoulderMid = mid(remapped[POSE.LEFT_SHOULDER], remapped[POSE.RIGHT_SHOULDER])
    const { w, h } = this.stageSize
    const shoulderWidth = aspectDist(
      remapped[POSE.LEFT_SHOULDER],
      remapped[POSE.RIGHT_SHOULDER],
      w,
      h
    )

    this._poseHolder.push(
      {
        lm: remapped,
        world: result.worldLandmarks?.[0] || null,
        visible,
        hipMid,
        shoulderMid,
        shoulderWidth,
        // Body midline in stage space — "cross the midline" games need this.
        midline: shoulderMid.x,
        t: now,
      },
      now
    )
  }

  // ── frame assembly ─────────────────────────────────────────────────────────
  _composeFrame(now, dt) {
    const f = this.frame
    f.t = now
    f.dt = dt
    f.frames++
    f.fps = this._fpsWindow.length
    f.detectMs = avg(this._detectSamples)
    f.captureLatencyMs = this._captureLatencySamples.length
      ? avg(this._captureLatencySamples)
      : null
    // Best available estimate of stimulus-shown → contact-registered lag: how
    // stale the analysed pixels were + inference + one display frame.
    f.latencyMs = Math.round((f.captureLatencyMs ?? 45) + f.detectMs + 1000 / Math.max(f.fps, 30))
    f.stage = { ...this.stageSize }
    f.handsSwapped = this.opts.handSwap

    const left = this._handState.left.holder.get(now)
    const right = this._handState.right.holder.get(now)
    f.left = left
    f.right = right
    f.hands = [left, right].filter(Boolean)
    // Primary pointer = the hand moving with intent, else the visible one.
    f.primary =
      f.hands.length === 2
        ? f.hands.reduce((a, b) => (b.speed > a.speed * 1.25 ? b : a))
        : f.hands[0] || null

    const pose = this._poseHolder.get(now)
    f.pose = pose
    f.bodyPresent = Boolean(pose && pose.visible >= 0.5)

    return f
  }

  /** Median inference cost + capture lag, for the telemetry record. */
  latencyReport() {
    return {
      captureLatencyMs: this._captureLatencySamples.length
        ? Math.round(avg(this._captureLatencySamples))
        : null,
      detectMs: Math.round(avg(this._detectSamples) * 10) / 10,
      estimatedPipelineMs: this.frame.latencyMs,
      fps: this.frame.fps,
      delegate: this.delegate || null,
      delegateFellBack: Boolean(this.engine?.info().fellBack),
      // 'worker' = inference off the main thread; 'main' = fallback path.
      inferenceThread: this.engine?.mode || null,
      handModel: this.engine?.info().handModel || null,
      // Share of new camera frames actually analysed (1 = every frame).
      detectRatio: this._detected + this._skipped
        ? Math.round((this._detected / (this._detected + this._skipped)) * 100) / 100
        : null,
      captureTimestampSource: this._captureLatencySamples.length ? 'videoFrameCallback' : 'estimated',
    }
  }
}

// ── camera helpers ───────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * getUserMedia with progressively looser requests. Some Android cameras reject
 * resolution hints outright (OverconstrainedError), some laptops have no
 * "user"-facing camera, and right after the previous game released the camera
 * Android often reports it busy (NotReadableError) for a few hundred ms.
 */
async function openCamera(preferred) {
  const attempts = [preferred, { facingMode: 'user' }, true]
  let lastErr = null
  for (const video of attempts) {
    for (let retry = 0; retry < 3; retry++) {
      try {
        return await navigator.mediaDevices.getUserMedia({ video, audio: false })
      } catch (err) {
        lastErr = err
        const name = err?.name
        // The person said no — asking again with other options will not help.
        if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') throw err
        if ((name === 'NotReadableError' || name === 'AbortError' || name === 'TrackStartError') && retry < 2) {
          await sleep(400 * (retry + 1))
          continue
        }
        break // try the next, looser request
      }
    }
  }
  throw lastErr
}

/**
 * Starting playback can be refused (iOS Low Power Mode, strict autoplay
 * policies). That used to be reported as "camera blocked"; it is not — the
 * stream is fine and the next tap anywhere starts it.
 */
async function playVideo(video) {
  try {
    await video.play()
  } catch (err) {
    if (err?.name === 'AbortError') return // superseded by a newer srcObject
    console.warn('[ar] video.play() was refused; will retry on next touch:', err?.message || err)
    const retry = () => video.play().catch(() => {})
    window.addEventListener('pointerdown', retry, { once: true, capture: true })
    window.addEventListener('touchend', retry, { once: true, capture: true })
  }
}

/**
 * Resolves once the video knows its size. Waiting on `loadedmetadata` alone
 * hung forever when the event had already fired before we listened (common on
 * iOS, where `play()` resolves after metadata), so this checks every way the
 * size can arrive, and gives up gracefully after `ms`.
 */
function waitForVideoSize(video, ms) {
  return new Promise((resolve) => {
    if (video.videoWidth > 0) return resolve(true)
    const events = ['loadedmetadata', 'loadeddata', 'resize', 'playing', 'canplay']
    let poll = null
    let timer = null
    const cleanup = () => {
      events.forEach((e) => video.removeEventListener(e, check))
      clearInterval(poll)
      clearTimeout(timer)
    }
    function check() {
      if (video.videoWidth > 0) {
        cleanup()
        resolve(true)
      }
    }
    events.forEach((e) => video.addEventListener(e, check))
    poll = setInterval(check, 100)
    timer = setTimeout(() => {
      cleanup()
      resolve(false)
    }, ms)
  })
}

function cameraErrorCode(err) {
  const name = err?.name
  if (name === 'CameraUnsupported' || err?.message === 'CAMERA_UNSUPPORTED') return 'CAMERA_UNSUPPORTED'
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
    return 'CAMERA_DENIED'
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') {
    return 'CAMERA_MISSING'
  }
  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') return 'CAMERA_BUSY'
  return 'CAMERA_MISSING'
}

// ── helpers ──────────────────────────────────────────────────────────────────
const avg = (a) => (a.length ? a.reduce((s, n) => s + n, 0) / a.length : 0)
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/**
 * A finger counts as extended when its tip is further from the wrist than its
 * PIP joint by a clear margin. Scale-invariant thanks to `span`.
 */
function countExtendedFingers(lm, w, h, span) {
  const wrist = lm[HAND.WRIST]
  const spec = [
    ['thumb', HAND.THUMB_TIP, HAND.THUMB_MCP],
    ['index', HAND.INDEX_TIP, HAND.INDEX_PIP],
    ['middle', HAND.MIDDLE_TIP, HAND.MIDDLE_PIP],
    ['ring', HAND.RING_TIP, HAND.RING_PIP],
    ['pinky', HAND.PINKY_TIP, HAND.PINKY_PIP],
  ]
  const flags = {}
  let count = 0
  for (const [name, tipIdx, pipIdx] of spec) {
    const tipD = aspectDist(lm[tipIdx], wrist, w, h) / span
    const pipD = aspectDist(lm[pipIdx], wrist, w, h) / span
    const up = tipD > pipD * (name === 'thumb' ? 1.02 : 1.08)
    flags[name] = up
    if (up) count++
  }
  return { flags, count }
}

function classifyGesture({ flags, count }, pinching) {
  if (pinching) return 'pinch'
  if (count === 0) return 'fist'
  if (count >= 4) return 'open'
  if (flags.index && !flags.middle && !flags.ring && !flags.pinky) return 'point'
  if (flags.thumb && count === 1) return 'thumbUp'
  if (flags.index && flags.middle && !flags.ring && !flags.pinky) return 'peace'
  return 'unknown'
}

/**
 * With a mirrored display, MediaPipe's LEFT_* indices land on the child's right
 * side of the screen. Swap the paired indices so downstream code can trust the
 * names.
 */
const POSE_PAIRS = [
  [1, 4], [2, 5], [3, 6], [7, 8], [9, 10],
  [11, 12], [13, 14], [15, 16], [17, 18], [19, 20], [21, 22],
  [23, 24], [25, 26], [27, 28], [29, 30], [31, 32],
]

function mirrorPoseSides(pts) {
  const out = pts.slice()
  for (const [a, b] of POSE_PAIRS) {
    const tmp = out[a]
    out[a] = out[b]
    out[b] = tmp
  }
  return out
}
