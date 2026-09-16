/* GTM and Clarity are analytics, not content: they are loaded the same way as the
   support chat, after the first paint, so their ~700 KB of script stays off the
   critical path. The noscript GTM iframe stays in index.html for no-JS visitors. */

const GTM_ID = 'GTM-NR5HZ2QB'
const CLARITY_ID = 'xyfilbhc5s'

declare global { interface Window { dataLayer?: unknown[]; clarity?: (...args: unknown[]) => void } }

function loadGtm(): void {
  if (document.querySelector('script[src*="googletagmanager.com/gtm.js"]')) return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
  const script = document.createElement('script')
  script.async = true
  script.fetchPriority = 'low'
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`
  document.head.append(script)
}

function loadClarity(): void {
  if (window.clarity) return
  const queue: ((...args: unknown[]) => void) & { q?: unknown[][] } = (...args) => { (queue.q = queue.q || []).push(args) }
  window.clarity = queue as Window['clarity']
  const script = document.createElement('script')
  script.async = true
  script.fetchPriority = 'low'
  script.src = `https://www.clarity.ms/tag/${CLARITY_ID}`
  document.head.append(script)
}

/** Same scheduling as the support chat: after load, inside an idle slice. */
export function scheduleTracking(): void {
  const afterLoad = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    const start = () => { loadGtm(); loadClarity() }
    if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 1500 })
    else setTimeout(start, 0)
  }))
  if (document.readyState === 'complete') afterLoad()
  else window.addEventListener('load', afterLoad, { once: true })
}
