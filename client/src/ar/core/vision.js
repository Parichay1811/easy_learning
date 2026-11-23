/**
 * The vision engine: MediaPipe hand + pose landmarkers, tuned to keep working
 * on phones.
 *
 * Two hard-won rules shape this file:
 *
 * 1. **Inference never runs on the main thread if it can avoid it.**
 *    `detectForVideo()` is synchronous; on a phone one call can take hundreds
 *    of milliseconds (and the GPU path can stall for seconds on its first real
 *    frame). On the main thread that froze the page the moment tracking
 *    started. So the landmarkers live in a Web Worker (`visionWorker.js`) and
 *    the main thread only posts a small ImageBitmap per frame. Browsers that
 *    cannot run MediaPipe in a worker (no OffscreenCanvas WebGL — e.g. iOS 16)
 *    fall back to the main thread with a strict time budget (tracker.js).
 *
 * 2. **Phones get the light models on the CPU delegate.**
 *    - Hands: `hand_landmarker_lite.task` — MediaPipe's full palm detector
 *      with its *lite* landmark network (4.4 MB instead of 7.8 MB; the
 *      per-hand, per-frame network is 2.2× faster). See
 *      `scripts/models/README.md`. Whole-body games keep the full hand model:
 *      the child stands back from the camera, and the lite network loses
 *      small, distant hands.
 *    - Body: `pose_landmarker_lite.task` (already the lightest pose model).
 *    - CPU (XNNPACK/WASM SIMD) rather than the mobile WebGL GPU delegate, which
 *      is the single most fragile piece of the stack on phones and, for models
 *      this small, rarely faster once texture upload and read-back are paid.
 *    Desktops keep the full hand model on the GPU, verified with a warm-up
 *    frame and switched to the CPU automatically if it fails at runtime.
 *
 * Overrides for support cases (URL, one visit):
 *   ?arDelegate=cpu|gpu   ?arModel=lite|full   ?arWorker=0
 * and Settings → Vision → "Compatibility tracking" (= CPU + lite + worker).
 */
import { FilesetResolver, HandLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision'
import { resolveVisionAssets } from './assets'
import { keepFiles, keptBytes, keptUrl } from './visionCache'
import { getSettings, onSettingsChange } from './settings'

const GPU_FAILED_KEY = 'ar_vision_gpu_failed_v1'
const KINDS = ['hand', 'pose']

// ── device knowledge ─────────────────────────────────────────────────────────

/** iPhone / iPad (iPadOS reports itself as a Mac with touch). */
export function isAppleMobile() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
}

/** Phones, tablets and very low-end machines. */
export function isConstrainedDevice() {
  if (typeof navigator === 'undefined') return false
  const mem = navigator.deviceMemory
  const cores = navigator.hardwareConcurrency
  const mobileUa = /Android|Mobi|iPhone|iPad|iPod/i.test(navigator.userAgent || '')
  return isAppleMobile() || mobileUa || (mem && mem <= 2) || (cores && cores <= 2)
}

function urlParam(name) {
  try {
    return new URLSearchParams(window.location.search).get(name)
  } catch {
    return null
  }
}

function hasWebGL2() {
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(gl)
  } catch {
    return false
  }
}

/**
 * MediaPipe in a worker needs module workers, ImageBitmap and a WebGL context
 * on an OffscreenCanvas (tasks-vision converts images through WebGL even on
 * the CPU delegate). Safari only gained the last one in 17.
 */
function workerSupported() {
  if (urlParam('arWorker') === '0') return false
  try {
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return false
    if (typeof createImageBitmap !== 'function') return false
    const gl = new OffscreenCanvas(1, 1).getContext('webgl2')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(gl)
  } catch {
    return false
  }
}

function readGpuFailed() {
  try {
    return localStorage.getItem(GPU_FAILED_KEY) === '1'
  } catch {
    return false
  }
}

function rememberGpuFailed() {
  try {
    localStorage.setItem(GPU_FAILED_KEY, '1')
  } catch {
    /* private mode — falls back again next visit, which is fine */
  }
}

/** Forget a remembered GPU failure (e.g. after a browser update). */
export function resetDelegateMemory() {
  try {
    localStorage.removeItem(GPU_FAILED_KEY)
  } catch {
    /* ignore */
  }
}

/** Which delegate to *try first*. 'CPU' is final; 'GPU' still falls back. */
function preferredDelegate() {
  const q = urlParam('arDelegate')
  if (q && /^cpu$/i.test(q)) return 'CPU'
  if (q && /^gpu$/i.test(q)) return 'GPU'
  if (getSettings().compatTracking) return 'CPU'
  if (isConstrainedDevice()) return 'CPU'
  if (readGpuFailed()) return 'CPU'
  if (!hasWebGL2()) return 'CPU'
  return 'GPU'
}

/**
 * 'lite' or 'full' hand model for a game. `far` = the game also tracks the
 * body, so the child stands back and hands are small in the frame.
 */
function handVariantFor({ far = false } = {}) {
  const q = urlParam('arModel')
  if (q && /^full$/i.test(q)) return 'full'
  if (q && /^lite$/i.test(q)) return 'lite'
  if (far) return 'full'
  return isConstrainedDevice() || getSettings().compatTracking ? 'lite' : 'full'
}

// ── assets ───────────────────────────────────────────────────────────────────

let assetsPromise = null
function assets() {
  if (!assetsPromise) {
    assetsPromise = resolveVisionAssets().catch((err) => {
      assetsPromise = null
      throw err
    })
  }
  return assetsPromise
}

async function modelPlan() {
  const info = await assets()
  return {
    wasmPath: info.wasmPath,
    // Falls back to the full model when the lite bundle was not vendored.
    hand: {
      full: info.modelUrl('hand'),
      lite: info.has('hand_lite') ? info.modelUrl('hand_lite') : info.modelUrl('hand'),
    },
    pose: info.modelUrl('pose'),
  }
}

const absolute = (u) => new URL(u, window.location.href).href

// ── shared options (main-thread path; the worker has its own copy) ───────────

function optionsFor(kind, delegate, plan, extra) {
  if (kind === 'hand') {
    return {
      baseOptions: { modelAssetPath: plan.hand[extra.variant || 'full'], delegate },
      runningMode: 'VIDEO',
      numHands: extra.numHands ?? 2,
      minHandDetectionConfidence: 0.4,
      minHandPresenceConfidence: 0.4,
      minTrackingConfidence: 0.4,
    }
  }
  return {
    baseOptions: { modelAssetPath: plan.pose, delegate },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputSegmentationMasks: false,
  }
}

const FACTORY = { hand: HandLandmarker, pose: PoseLandmarker }

function warmupImage() {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 96
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#806050'
  ctx.fillRect(0, 0, 128, 96)
  ctx.fillStyle = '#203040'
  ctx.fillRect(32, 24, 64, 48)
  return c
}

// ── main-thread implementation (fallback) ────────────────────────────────────

const GPU_RUNTIME_FAILS = 3
const ANY_RUNTIME_FAILS = 20

class MainThreadTask {
  constructor(kind, extra) {
    this.kind = kind
    this.extra = extra
    this.task = null
    this.delegate = null
    this.lastTs = 0
    this.failStreak = 0
    this.rebuilding = null
    this.fellBack = false
  }

  async build(first) {
    const plan = await modelPlan()
    const fileset = await FilesetResolver.forVisionTasks(plan.wasmPath)
    const keptWasm = await keptUrl(absolute(fileset.wasmBinaryPath), 'application/wasm')
    if (keptWasm) fileset.wasmBinaryPath = keptWasm
    const modelUrl = this.kind === 'hand' ? plan.hand[this.extra.variant || 'full'] : plan.pose
    const bytes = modelUrl ? await keptBytes(absolute(modelUrl)) : null
    const order = first === 'GPU' ? ['GPU', 'CPU'] : ['CPU']
    let lastErr = null
    let gpuErr = null
    for (const delegate of order) {
      let task = null
      try {
        const options = optionsFor(this.kind, delegate, plan, this.extra)
        if (bytes) options.baseOptions = { modelAssetBuffer: bytes.slice(), delegate }
        task = await FACTORY[this.kind].createFromOptions(fileset, options)
        task.detectForVideo(warmupImage(), this._nextTs())
        this.task = task
        this.delegate = delegate
        this.failStreak = 0
        // Only blame the GPU once the CPU has proved the model itself loads.
        if (gpuErr) {
          rememberGpuFailed()
          this.fellBack = true
        }
        return this
      } catch (err) {
        lastErr = err
        try {
          task?.close()
        } catch {
          /* already broken */
        }
        if (delegate === 'GPU') {
          gpuErr = err
          console.warn(`[ar] ${this.kind}: GPU delegate failed, trying CPU:`, err?.message || err)
        }
      }
    }
    throw lastErr || new Error('MODEL_FAILED')
  }

  _nextTs(t = performance.now()) {
    const ts = Math.max(Math.floor(t), this.lastTs + 1)
    this.lastTs = ts
    return ts
  }

  detect(image, now) {
    if (!this.task || this.rebuilding) return null
    try {
      const res = this.task.detectForVideo(image, this._nextTs(now))
      this.failStreak = 0
      return res
    } catch (err) {
      this.failStreak++
      if (this.failStreak === 1 || this.failStreak % 30 === 0) {
        console.warn(`[ar] ${this.kind} detect failed (${this.delegate}):`, err?.message || err)
      }
      const limit = this.delegate === 'GPU' ? GPU_RUNTIME_FAILS : ANY_RUNTIME_FAILS
      if (this.failStreak >= limit) this.rebuild(this.delegate === 'GPU' ? 'CPU' : this.delegate)
      return null
    }
  }

  rebuild(delegate, { blameGpu = true } = {}) {
    if (this.rebuilding) return this.rebuilding
    if (blameGpu && this.delegate === 'GPU' && delegate === 'CPU') {
      console.warn(`[ar] ${this.kind}: GPU keeps failing at runtime — switching to CPU`)
      rememberGpuFailed()
      this.fellBack = true
    }
    const old = this.task
    this.task = null
    try {
      old?.close()
    } catch {
      /* context already gone */
    }
    this.rebuilding = this.build(delegate)
      .catch((err) => console.error(`[ar] ${this.kind}: rebuild failed`, err))
      .finally(() => {
        this.rebuilding = null
      })
    return this.rebuilding
  }

  close() {
    try {
      this.task?.close()
    } catch {
      /* ignore */
    }
    this.task = null
  }
}

class MainThreadImpl {
  mode = 'main'
  tasks = {}

  async load(kind, numHands, variant) {
    const have = this.tasks[kind]
    if (have?.task && (kind !== 'hand' || have.extra.variant === variant)) return
    const t = new MainThreadTask(kind, { numHands, variant })
    await t.build(preferredDelegate())
    have?.close()
    this.tasks[kind] = t
  }

  handVariant() {
    return this.tasks.hand?.extra.variant || null
  }

  async detect(source, ts, run) {
    const out = { hand: null, pose: null, ms: { hand: 0, pose: 0 } }
    for (const kind of KINDS) {
      if (!run[kind] || !this.tasks[kind]) continue
      const t0 = performance.now()
      out[kind] = this.tasks[kind].detect(source, ts)
      out.ms[kind] = performance.now() - t0
    }
    return out
  }

  setDelegate(delegate) {
    for (const t of Object.values(this.tasks)) {
      if (t.task && t.delegate !== delegate) t.rebuild(delegate, { blameGpu: false })
    }
  }

  delegates() {
    const d = {}
    for (const k of KINDS) if (this.tasks[k]) d[k] = this.tasks[k].delegate
    return d
  }

  fellBack() {
    return Object.values(this.tasks).some((t) => t.fellBack)
  }

  terminate() {
    for (const t of Object.values(this.tasks)) t.close()
    this.tasks = {}
  }
}

// ── worker implementation (preferred) ────────────────────────────────────────

class WorkerTimeout extends Error {}

class WorkerImpl {
  mode = 'worker'

  constructor() {
    this.worker = new Worker(new URL('./visionWorker.js', import.meta.url), { type: 'module' })
    this.seq = 0
    this.pending = new Map()
    this.dead = null
    this._delegates = {}
    this._fellBack = false
    this.worker.onmessage = (e) => this._onMessage(e.data)
    this.worker.onerror = (e) => {
      e.preventDefault?.()
      this._die(new Error(`vision worker crashed: ${e.message || 'unknown error'}`))
    }
    this.worker.onmessageerror = () => this._die(new Error('vision worker message error'))
  }

  _onMessage(m) {
    if (m.type === 'log') {
      console[m.level === 'error' ? 'error' : 'warn']('[ar] (worker)', m.msg)
      return
    }
    if (m.type === 'gpuFailed') {
      rememberGpuFailed()
      this._fellBack = true
      return
    }
    if (m.type === 'delegateChanged') {
      this._delegates[m.kind] = m.delegate
      if (m.fellBack) this._fellBack = true
      return
    }
    const p = this.pending.get(m.id)
    if (!p) return
    this.pending.delete(m.id)
    clearTimeout(p.timer)
    if (m.error) p.reject(new Error(m.error))
    else p.resolve(m)
  }

  _die(err) {
    if (this.dead) return
    this.dead = err
    for (const p of this.pending.values()) {
      clearTimeout(p.timer)
      p.reject(err)
    }
    this.pending.clear()
    try {
      this.worker.terminate()
    } catch {
      /* ignore */
    }
  }

  call(msg, transfer = [], timeoutMs = 30000) {
    if (this.dead) return Promise.reject(this.dead)
    const id = ++this.seq
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new WorkerTimeout(`vision worker did not answer '${msg.type}' in ${timeoutMs} ms`))
      }, timeoutMs)
      this.pending.set(id, { resolve, reject, timer })
      try {
        this.worker.postMessage({ ...msg, id }, transfer)
      } catch (err) {
        clearTimeout(timer)
        this.pending.delete(id)
        reject(err)
      }
    })
  }

  async init() {
    this.plan = await modelPlan()
    this._variant = null
    await this.call(
      {
        type: 'init',
        wasmPath: absolute(this.plan.wasmPath),
        models: { hand: absolute(this.plan.hand.full), pose: absolute(this.plan.pose) },
        delegate: preferredDelegate(),
      },
      [],
      30000
    )
  }

  async load(kind, numHands, variant) {
    if (this._delegates[kind] && (kind !== 'hand' || this._variant === variant)) return
    const model = absolute(kind === 'hand' ? this.plan.hand[variant || 'full'] : this.plan.pose)
    const r = await this.call({ type: 'load', kind, numHands, model }, [], 90000)
    if (kind === 'hand') this._variant = variant
    this._delegates[kind] = r.delegate
    if (r.fellBack) {
      rememberGpuFailed()
      this._fellBack = true
    }
  }

  async detect(source, ts, run) {
    // createImageBitmap snapshots the canvas at call time, so the caller may
    // redraw it straight away.
    const bitmap = await createImageBitmap(source)
    const r = await this.call({ type: 'detect', bitmap, ts, run }, [bitmap], 8000)
    if (r.delegate) {
      for (const k of KINDS) if (r.delegate[k]) this._delegates[k] = r.delegate[k]
    }
    return r
  }

  setDelegate(delegate) {
    this.call({ type: 'setDelegate', delegate }).catch(() => {})
  }

  delegates() {
    return { ...this._delegates }
  }

  handVariant() {
    return this._variant
  }

  fellBack() {
    return this._fellBack
  }

  terminate() {
    this._die(new Error('terminated'))
  }
}

// ── the engine facade every tracker shares ───────────────────────────────────

/**
 * One per page. Owns either a worker or the main-thread fallback, swaps
 * between them when something breaks, and gives the tracker a single async
 * `detect()` regardless.
 */
class VisionEngine {
  constructor() {
    this.impl = null
    this.starting = null
    this.wanted = { hand: false, pose: false, handVariant: 'full' }
    this.numHands = 2
    this.busy = false
    this.recovering = null
    this.workerFailed = false
  }

  get mode() {
    return this.impl?.mode || null
  }

  async _startImpl() {
    if (!this.workerFailed && workerSupported()) {
      const w = new WorkerImpl()
      try {
        await w.init()
        await this._loadInto(w)
        return w
      } catch (err) {
        console.warn('[ar] vision worker unavailable, running on the main thread:', err?.message || err)
        w.terminate()
        this.workerFailed = true
      }
    }
    const m = new MainThreadImpl()
    await this._loadInto(m)
    return m
  }

  async _loadInto(impl) {
    // One model at a time: two WASM boots in parallel doubles the memory peak.
    if (this.wanted.hand) await impl.load('hand', this.numHands, this.wanted.handVariant)
    if (this.wanted.pose) await impl.load('pose', this.numHands)
  }

  /**
   * Makes sure the requested models are loaded. Safe to call repeatedly. A
   * game that tracks the body (`pose`) gets the full hand model; a hands-only
   * game on a phone gets the lite one — switching reloads only the hand model.
   */
  async ensure({ hand = false, pose = false, numHands, prewarm = false } = {}) {
    if (numHands && !this.impl && !this.starting) this.numHands = numHands
    if (hand && !(prewarm && this.wanted.hand)) {
      this.wanted.handVariant = handVariantFor({ far: pose })
    }
    this.wanted.hand ||= hand
    this.wanted.pose ||= pose
    if (this.recovering) await this.recovering
    if (!this.impl) {
      if (!this.starting) {
        this.starting = this._startImpl()
          .then((impl) => {
            this.impl = impl
            return impl
          })
          .finally(() => {
            this.starting = null
          })
      }
      await this.starting
    }
    try {
      await this._loadInto(this.impl)
    } catch (err) {
      if (this.impl.mode !== 'worker') throw err
      // The worker loaded one model but not the next — fall back wholesale.
      await this._recover(err, { abandonWorker: true })
    }
    return this
  }

  /**
   * @returns {Promise<{hand, pose, ms:{hand,pose}}|null>} null = frame dropped
   */
  async detect(source, ts, run) {
    if (!this.impl || this.recovering) return null
    this.busy = true
    try {
      return await this.impl.detect(source, ts, run)
    } catch (err) {
      if (this.impl?.mode === 'worker') this._recover(err)
      else console.warn('[ar] detect failed for one frame:', err?.message || err)
      return null
    } finally {
      this.busy = false
    }
  }

  /**
   * The worker crashed or hung (most likely a GPU stall). Restart it on the
   * CPU; if that fails too, use the main thread.
   */
  _recover(err, { abandonWorker = false } = {}) {
    if (this.recovering) return this.recovering
    const old = this.impl
    const hung = err instanceof WorkerTimeout
    // A worker that keeps dying is not going to start behaving.
    this.crashes = (this.crashes || 0) + 1
    if (this.crashes >= 3) abandonWorker = true
    console.warn('[ar] vision worker failed — recovering:', err?.message || err)
    if (hung && Object.values(old?.delegates?.() || {}).includes('GPU')) rememberGpuFailed()
    this.impl = null
    old?.terminate()
    if (abandonWorker) this.workerFailed = true
    this.recovering = this._startImpl()
      .then((impl) => {
        this.impl = impl
      })
      .catch((e) => console.error('[ar] vision engine could not recover', e))
      .finally(() => {
        this.recovering = null
      })
    return this.recovering
  }

  setDelegate(delegate) {
    this.impl?.setDelegate(delegate)
  }

  info() {
    return {
      mode: this.mode,
      delegate: this.impl?.delegates() || {},
      fellBack: Boolean(this.impl?.fellBack()),
      handModel: this.impl?.handVariant() || null,
    }
  }

  dispose() {
    this.impl?.terminate()
    this.impl = null
    this.wanted = { hand: false, pose: false, handVariant: 'full' }
  }
}

let engine = null

/** The shared engine (models are loaded by `engine.ensure()`). */
export function getVisionEngine() {
  if (!engine) engine = new VisionEngine()
  return engine
}

// "Compatibility tracking" applies immediately, even mid-game. Turning it *off*
// also forgets a remembered GPU failure, so the GPU genuinely gets another go.
let lastCompat = getSettings().compatTracking
onSettingsChange((s) => {
  if (s.compatTracking === lastCompat) return
  lastCompat = s.compatTracking
  if (!s.compatTracking) resetDelegateMemory()
  engine?.setDelegate(preferredDelegate())
})

/**
 * Warms the models while the child is still on the hub screen, so pressing Play
 * starts the game instead of a loading spinner. Phones only warm the hand
 * model: a second model the child may never use costs memory iOS may not give.
 */
export function prewarmVision(kinds = ['hand']) {
  const wanted = isConstrainedDevice() ? kinds.filter((k) => k === 'hand') : kinds
  // Keep the files first (Cache Storage: this visit and later ones load from there;
  // already done if Games was opened), then warm the hand model a hands-only game
  // would use; a body game swaps it.
  return prefetchVisionFiles()
    .catch(() => null)
    .then(() => getVisionEngine().ensure({ hand: wanted.includes('hand'), pose: false, prewarm: true }))
    .then(() => (wanted.includes('pose') ? getVisionEngine().ensure({ pose: true, prewarm: true }) : null))
    .catch(() => null)
}

/**
 * Downloads, and only downloads, the files a camera game will need: the runtime
 * (the worker build when workers work, else the main-thread one), the hand model
 * this device would use and, off phones, the pose model. They are kept in Cache
 * Storage (visionCache.js) at low priority, so opening Games starts the download
 * and the first camera game, this visit or a later one, finds them there. Nothing is compiled or started: no worker, no
 * GPU, no camera. Skipped under Save-Data and on 2G. Safe to call repeatedly.
 */
let prefetching = null
export function prefetchVisionFiles() {
  if (prefetching) return prefetching
  const c = typeof navigator !== 'undefined' ? navigator.connection : null
  if (c?.saveData || /(^|-)2g$/.test(c?.effectiveType || '')) return Promise.resolve(false)
  prefetching = (async () => {
    const plan = await modelPlan()
    const runtime = workerSupported() ? 'vision_wasm_module_internal' : 'vision_wasm_internal'
    const urls = [plan.hand[handVariantFor()], `${plan.wasmPath}/${runtime}.js`, `${plan.wasmPath}/${runtime}.wasm`]
    // Body games: the pose model too, where the hub would warm it (not on phones).
    if (!isConstrainedDevice() && plan.pose) urls.push(plan.pose)
    // Cache Storage (shared with the tracker's worker, kept across visits); the HTTP
    // cache alone did not reliably serve the worker a second time.
    if (await keepFiles(urls.map(absolute))) return true
    const got = await Promise.all(
      urls.map((u) =>
        fetch(absolute(u), { priority: 'low' })
          .then((r) => (r.ok ? r.arrayBuffer().then(() => true) : false))
          .catch(() => false)
      )
    )
    return got.every(Boolean)
  })().catch(() => {
    prefetching = null
    return false
  })
  return prefetching
}

export async function visionAssetInfo() {
  return assets()
}

/** Which engine/delegate is live — for the metrics HUD and telemetry. */
export function visionStatus() {
  return engine?.info() || null
}

export function disposeVision() {
  engine?.dispose()
  engine = null
}

// ── Landmark index maps ───────────────────────────────────────────────────────
export const HAND = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
}

export const POSE = {
  NOSE: 0,
  LEFT_EYE_INNER: 1, LEFT_EYE: 2, LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4, RIGHT_EYE: 5, RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7, RIGHT_EAR: 8,
  MOUTH_LEFT: 9, MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_PINKY: 17, RIGHT_PINKY: 18,
  LEFT_INDEX: 19, RIGHT_INDEX: 20,
  LEFT_THUMB: 21, RIGHT_THUMB: 22,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
  LEFT_HEEL: 29, RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31, RIGHT_FOOT_INDEX: 32,
}

/** Bone pairs for drawing a hand skeleton. */
export const HAND_BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
]

/** Bone pairs for drawing a body skeleton (torso + limbs, no face mesh). */
export const POSE_BONES = [
  [11, 12], [11, 23], [12, 24], [23, 24],
  [11, 13], [13, 15], [12, 14], [14, 16],
  [23, 25], [25, 27], [24, 26], [26, 28],
  [27, 31], [28, 32],
]
