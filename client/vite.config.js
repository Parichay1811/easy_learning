import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import aiAssistantStatic from './scripts/ai-assistant-static.mjs'
import seoPrerender from './scripts/seo-prerender.mjs'

// In dev, same-origin /api/* requests (the AI assistant's page makes these) go
// to the Express server named by VITE_API_BASE_URL, as Nginx does in production.
function apiOrigin(env) {
  try {
    return new URL(env.VITE_API_BASE_URL).origin
  } catch {
    return 'http://localhost:5001'
  }
}

// Libraries that get a chunk of their own (rolldown's codeSplitting groups: what
// Rollup called manualChunks). Each one changes far less often than the app's own
// code, so a returning browser keeps it cached across releases; and the heavy ones
// that only some pages use (three.js for the AI orb, recharts for the dashboards)
// are fetched only by those pages.
//   vendor    React, the router, redux and i18next: every page needs them. Highest
//             priority: a group also takes what its modules depend on, and React must
//             not be pulled into the charts' chunk (every page would then fetch it).
//   three     only the AI Teacher orb (AIAssistantWidget/orbScene.js), fetched lazily
//   firebase  sign-in
//   motion    framer-motion
//   recharts  the dashboards' charts (with the d3 pieces they use)
//   icons     the react-icons sets the first pages use (fa, md, bs, ri, fc). Each set
//             is one module, so it cannot be split by page; the sets only other
//             pages use (fa6, gi, ...) stay out of this chunk, with those pages.
const pkg = (names) => new RegExp(`[\\/]node_modules[\\/](?:${names})[\\/]`)
const CHUNK_GROUPS = [
  { name: 'vendor', test: pkg('react|react-dom|scheduler|react-router|react-router-dom|react-redux|redux|redux-thunk|@reduxjs[\\/]toolkit|immer|reselect|use-sync-external-store|i18next|react-i18next|i18next-http-backend|i18next-browser-languagedetector|html-parse-stringify|void-elements'), priority: 40 },
  { name: 'three', test: pkg('three'), priority: 30 },
  { name: 'firebase', test: pkg('firebase|@firebase|idb'), priority: 20 },
  { name: 'motion', test: pkg('framer-motion|motion-dom|motion-utils'), priority: 20 },
  { name: 'recharts', test: pkg('recharts|d3-[^\\/]+|victory-vendor|internmap|decimal\\.js-light|eventemitter3|es-toolkit|tiny-invariant'), priority: 20 },
  { name: 'icons', test: pkg('react-icons[\\/](?:fa|md|bs|ri|fc|lib)'), priority: 20 },
]

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // seoPrerender: static HTML per public page and language, sitemap.xml, llms.txt.
    plugins: [react(), basicSsl(), aiAssistantStatic(), seoPrerender()],
    // The AR vision worker (src/ar/core/visionWorker.js) must be an ES-module
    // worker: MediaPipe loads its WASM glue with `import()` there.
    worker: { format: 'es' },
    build: {
      rolldownOptions: {
        output: { codeSplitting: { groups: CHUNK_GROUPS } },
      },
    },
    server: {
      https: true,
      host: true,
      proxy: {
        '/api': { target: apiOrigin(env), changeOrigin: false },
      },
    },
  }
})
