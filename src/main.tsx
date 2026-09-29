import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { isNative } from './native/platform'
import { restoreNativeStorage } from './native/mirror'

async function boot() {
  // iOS shell only: restore sessions/prefs from native storage if WebKit evicted localStorage.
  // On the web this resolves immediately (no-op).
  await restoreNativeStorage()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
void boot()

// Service worker: web only. The iOS shell already serves every asset from the app bundle,
// and a service worker inside WKWebView only adds stale-shell bugs.
if (!isNative && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Bust + update so a new deploy replaces the old cached shell
    const swUrl = `${import.meta.env.BASE_URL}sw.js?v=9`
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        reg.update().catch(() => {})
      })
      .catch(() => {
        /* installability still works via manifest + icons on supported browsers */
      })
  })
}
