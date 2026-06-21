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

function preloadPrerenderedRoute(pathname = window.location.pathname): Promise<unknown> {
  const normalizedPathname = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname

  if (normalizedPathname === '/xe') return import('./app/pages/Fleet')
  if (normalizedPathname.startsWith('/xe/')) return import('./app/pages/CarDetail')
  if (normalizedPathname === '/thue-xe-thang') return import('./app/pages/B2B')
  if (normalizedPathname === '/gioi-thieu') return import('./app/pages/About')
  if (normalizedPathname === '/hop-tac') return import('./app/pages/Partner')
  if (normalizedPathname === '/lien-he') return import('./app/pages/Contact')
  if (normalizedPathname === '/di-dau') return import('./app/pages/GoWhere')
  if (normalizedPathname.startsWith('/di-dau/chu-de/')) return import('./app/pages/GoWhereCollection')
  if (normalizedPathname.startsWith('/di-dau/')) return import('./app/pages/GoWhereDetail')
  if (normalizedPathname.startsWith('/lap-ke-hoach-chuyen-di')) return import('./app/pages/TripFinder')

  return Promise.resolve()
}

window.addEventListener('unhandledrejection', (event) => {
  reloadOnceForChunkError(event.reason)
})

window.addEventListener('error', (event) => {
  reloadOnceForChunkError(event.error || event.message)
})

async function bootApp() {
  const root = document.getElementById('root')!
  if (root.dataset.staticPage || root.dataset.staticFallback) return

  const hadStaticShell = Boolean(root.dataset.staticShell)
  const hadPrerenderedShell = Boolean(root.dataset.prerendered)

  if (hadPrerenderedShell) {
    await preloadPrerenderedRoute()
  }

  const [{ StrictMode, createElement }, { createRoot }, { default: App }] = await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('./app/App'),
  ])
  const app = createElement(StrictMode, null, createElement(App))

  if (hadPrerenderedShell) {
    root.replaceChildren()
    delete root.dataset.prerendered
  }

  if (root.dataset.staticShell) {
    root.replaceChildren()
    delete root.dataset.staticShell
    // Remove SSG-injected styles so their global rules (p, li, a, h1…) don't bleed into React content
    document.querySelectorAll('style[data-ssg]').forEach((el) => el.remove())
  }

  createRoot(root).render(app)

  if (hadStaticShell) {
    requestAnimationFrame(() => {
      root.style.transition = 'opacity 0.15s ease'
      root.style.opacity = '1'
    })
  }
}

function schedulePrerenderedBoot() {
  const root = document.getElementById('root')
  if (!root?.dataset.prerendered) return false

  let booted = false
  let armed = false
  const events = ['click'] as const
  window.setTimeout(() => {
    armed = true
  }, 1500)

  function cleanup() {
    events.forEach((eventName) => window.removeEventListener(eventName, boot))
  }

  function boot() {
    if (booted || !armed) return
    booted = true
    cleanup()
    void bootApp()
  }

  events.forEach((eventName) => {
    window.addEventListener(eventName, boot, { passive: true })
  })

  return true
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

function discardWrongHomePrerender() {
  const root = document.getElementById('root')
  if (root?.dataset.prerendered !== 'home') return

  root.replaceChildren()
  delete root.dataset.prerendered
}

function startApp() {
  if (window.location.pathname === '/' || window.location.pathname === '') {
    scheduleHomeBoot()
    return
  }

  discardWrongHomePrerender()
  if (!schedulePrerenderedBoot()) {
    void bootApp()
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp, { once: true })
} else {
  startApp()
}
