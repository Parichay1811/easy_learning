/**
 * Where the MediaPipe WASM runtime and the .task models come from.
 *
 * `client/scripts/setup-mediapipe.mjs` vendors both into `public/mediapipe/`
 * (run automatically by `npm run dev` / `npm run build`). We probe that copy
 * once and fall back to the public CDNs if it is missing, so a fresh clone that
 * skipped the setup script still plays.
 */

const LOCAL_WASM = '/mediapipe/wasm'
const LOCAL_MODELS = '/mediapipe/models'

const CDN_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const CDN_MODELS = {
  hand: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  pose: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
}

const LOCAL_MODEL_FILES = {
  hand: 'hand_landmarker.task',
  // MediaPipe's full palm detector + lite hand-landmark network, vendored from
  // scripts/models by the setup script. There is no public CDN copy, so phones
  // use it only when it has been vendored, and the full model otherwise.
  hand_lite: 'hand_landmarker_lite.task',
  pose: 'pose_landmarker_lite.task',
}

// Allow an operator to pin these (air-gapped deployment, private mirror).
const ENV_WASM = import.meta.env?.VITE_MEDIAPIPE_WASM_URL
const ENV_MODELS = import.meta.env?.VITE_MEDIAPIPE_MODEL_BASE

let probe = null

/**
 * HEAD-probes a URL. Returns false on any network/CORS failure rather than
 * throwing.
 *
 * A 200 is not enough: an SPA host (our Nginx `try_files ... /index.html`,
 * Netlify, Vercel...) answers *every* missing path with index.html and a 200.
 * Handing that HTML to MediaPipe as a WASM binary or a .task model fails deep
 * inside the runtime with an unhelpful error, on every device. So an HTML
 * response counts as "not there" and we fall through to the CDN.
 */
async function exists(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-cache' })
    if (!res.ok) return false
    const type = (res.headers.get('content-type') || '').toLowerCase()
    return !type.includes('text/html')
  } catch {
    return false
  }
}

/**
 * Resolves once per page load and memoises the answer.
 * @returns {Promise<{
 *   wasmPath: string,
 *   modelUrl: (k: 'hand'|'hand_lite'|'pose') => string|null,
 *   has: (k: string) => boolean,
 *   local: boolean,
 * }>}
 */
export function resolveVisionAssets() {
  if (probe) return probe

  probe = (async () => {
    if (ENV_WASM || ENV_MODELS) {
      const base = (ENV_MODELS || LOCAL_MODELS).replace(/\/$/, '')
      const hasLite = await exists(`${base}/${LOCAL_MODEL_FILES.hand_lite}`)
      return {
        wasmPath: (ENV_WASM || CDN_WASM).replace(/\/$/, ''),
        modelUrl: (k) => (k === 'hand_lite' && !hasLite ? null : `${base}/${LOCAL_MODEL_FILES[k]}`),
        has: (k) => k !== 'hand_lite' || hasLite,
        local: Boolean(ENV_MODELS),
      }
    }

    const [hasWasm, hasWasmBin, hasHand, hasHandLite, hasPose] = await Promise.all([
      exists(`${LOCAL_WASM}/vision_wasm_internal.js`),
      exists(`${LOCAL_WASM}/vision_wasm_internal.wasm`),
      exists(`${LOCAL_MODELS}/${LOCAL_MODEL_FILES.hand}`),
      exists(`${LOCAL_MODELS}/${LOCAL_MODEL_FILES.hand_lite}`),
      exists(`${LOCAL_MODELS}/${LOCAL_MODEL_FILES.pose}`),
    ])

    const localWasm = hasWasm && hasWasmBin
    const wasmPath = localWasm ? LOCAL_WASM : CDN_WASM
    const localModel = { hand: hasHand, hand_lite: hasHandLite, pose: hasPose }

    return {
      wasmPath,
      modelUrl: (k) =>
        localModel[k] ? `${LOCAL_MODELS}/${LOCAL_MODEL_FILES[k]}` : CDN_MODELS[k] || null,
      has: (k) => Boolean(localModel[k] || CDN_MODELS[k]),
      local: localWasm && hasHand && hasPose,
    }
  })().catch((err) => {
    probe = null
    throw err
  })

  return probe
}
