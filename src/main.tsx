import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'


import { App } from './App'
import { i18nReady } from './i18n'
import './styles/base.css'
import './styles/home-reference.css'
import { scheduleSupportChat } from './support/load-chat'
import { scheduleTracking } from './support/load-tracking'

// The translation table is a separate chunk that the bootstrap already preloaded, so
// waiting for it costs no round trip. The prerendered homepage stays on screen while
// it settles; hydrating earlier would replace that text with untranslated keys.
// A failed table must not cost the visitor the page: render regardless, and i18next
// falls back to the keys rather than leaving an empty document behind.
void i18nReady.catch(() => undefined).then(() => {
  const root = document.getElementById('root')!
  const app = <StrictMode><App /></StrictMode>
  if (root.dataset.prerendered === 'true') hydrateRoot(root, app)
  else createRoot(root).render(app)
})
scheduleSupportChat()
scheduleTracking()
