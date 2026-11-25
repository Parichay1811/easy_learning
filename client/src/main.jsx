import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import store from './store/store'
import "@fontsource/fredoka/400.css";
import "@fontsource/fredoka/500.css";
import "@fontsource/fredoka/600.css";
import "@fontsource/fredoka/700.css";
import './index.css'
// i18n must be imported before <App> so the instance is configured
// before any component calls useTranslation()
import './i18n/i18n'
import { applyLiteAttr } from './utils/useLiteMode'
import App from './App.jsx'

// Lite mode (a weak device, Save-Data, less movement) is on <html> before the first
// paint, so nothing heavy is drawn and then taken away (utils/useLiteMode.js).
applyLiteAttr()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      {/* Suspense boundary holds the UI while translation files are
          fetched lazily for the first time (i18next-http-backend). */}
      <Suspense fallback={null}>
        <App />
      </Suspense>
    </Provider>
  </StrictMode>,
)
