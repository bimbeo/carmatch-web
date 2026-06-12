import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
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
  const root = document.getElementById('root')!
  const app = (
    <StrictMode>
      <App />
    </StrictMode>
  )

  if (root.dataset.prerendered) {
    hydrateRoot(root, app)
    return
  }

  createRoot(root).render(app)
}

function scheduleHomeBoot() {
  let booted = false
  let timer: number | undefined
  const events = ['pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'] as const

  function cleanup() {
    if (timer) window.clearTimeout(timer)
    events.forEach((eventName) => window.removeEventListener(eventName, boot))
  }

  function boot() {
    if (booted) return
    booted = true
    cleanup()
    void bootApp()
  }

  events.forEach((eventName) => {
    window.addEventListener(eventName, boot, { once: true, passive: true })
  })

  window.addEventListener(
    'load',
    () => {
      timer = window.setTimeout(boot, 20000)
    },
    { once: true },
  )
}

if (window.location.pathname === '/' || window.location.pathname === '') {
  scheduleHomeBoot()
} else {
  void bootApp()
}
