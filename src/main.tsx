import './styles/index.css'
import { StrictMode, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'

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

  // Route chunks remain lazy, but React and the app shell are statically linked
  // so Vite can emit modulepreload hints and avoid a late import waterfall.
  if (hadPrerenderedShell) await preloadPrerenderedRoute()
  const app = createElement(StrictMode, null, createElement(App))

  if (hadPrerenderedShell) {
    // Browser DOM normalization can make the SEO snapshot differ from the
    // original React tree, so mount cleanly instead of risking hydration errors.
    root.replaceChildren()
    delete root.dataset.prerendered
    document.querySelectorAll('style[data-ssg]').forEach((el) => el.remove())
    createRoot(root).render(app)
    return
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

  // Fleet and vehicle pages are pre-rendered for a fast first paint, but they
  // are still interactive booking pages. Hydrate as soon as the DOM is ready
  // instead of making the first visitor click trigger the real interface.
  void bootApp()

  return true
}

function scheduleHomeBoot() {
  // Keep the pre-rendered HTML visible while the React chunks download, then
  // mount immediately. Deferring this work until scroll/pointer interaction
  // caused the hero heading to be replaced several seconds after first paint,
  // resetting LCP and making the first click wait for the whole app to boot.
  void bootApp()
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
