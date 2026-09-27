import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Bust + update so a new deploy replaces the old cached shell
    const swUrl = `${import.meta.env.BASE_URL}sw.js?v=5`
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
