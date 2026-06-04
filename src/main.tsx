import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './app/App'

const chunkErrorPattern = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk/i
const reloadKey = 'carmatch-chunk-reload-attempted'

function reloadOnceForChunkError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  if (!chunkErrorPattern.test(message) || sessionStorage.getItem(reloadKey)) return

  sessionStorage.setItem(reloadKey, '1')
  window.location.reload()
}

window.addEventListener('unhandledrejection', (event) => {
  reloadOnceForChunkError(event.reason)
})

window.addEventListener('error', (event) => {
  reloadOnceForChunkError(event.error || event.message)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
