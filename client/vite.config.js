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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // seoPrerender: static HTML per public page and language, sitemap.xml, llms.txt.
    plugins: [react(), basicSsl(), aiAssistantStatic(), seoPrerender()],
    // The AR vision worker (src/ar/core/visionWorker.js) must be an ES-module
    // worker: MediaPipe loads its WASM glue with `import()` there.
    worker: { format: 'es' },
    server: {
      https: true,
      host: true,
      proxy: {
        '/api': { target: apiOrigin(env), changeOrigin: false },
      },
    },
  }
})
