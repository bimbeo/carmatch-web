import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'

const chunkErrorPattern = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk/i
const reloadKey = 'carmatch-chunk-reload-attempted'

async function clearStaleAppCache() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))
  }

  if ('caches' in window) {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  }
}

function reloadOnceForChunkError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  if (!chunkErrorPattern.test(message) || sessionStorage.getItem(reloadKey)) return

  sessionStorage.setItem(reloadKey, '1')
  void clearStaleAppCache().finally(() => window.location.reload())
}

window.addEventListener('unhandledrejection', (event) => {
  reloadOnceForChunkError(event.reason)
})

window.addEventListener('error', (event) => {
  reloadOnceForChunkError(event.error || event.message)
})

async function bootApp() {
  const { default: App } = await import('./app/App')
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootApp()
