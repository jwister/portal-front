const SCRIPT_ID = 'ztoken-tidio-script'

export function loadSupportChat(): void {
  if (document.getElementById(SCRIPT_ID) || window.tidioChatApi) return
  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.src = 'https://code.tidio.co/7brexwzms4ux33ccp9hadopj9d3evnq7.js'
  script.async = true
  script.fetchPriority = 'low'
  script.onerror = () => { script.remove(); window.dispatchEvent(new Event('ztoken:chat-error')) }
  document.body.append(script)
}

/** Warm up automatically after the first page load/paint; clicking never needs consent. */
export function scheduleSupportChat(): void {
  const afterLoad = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(loadSupportChat, { timeout: 1000 })
    else setTimeout(loadSupportChat, 0)
  }))
  if (document.readyState === 'complete') afterLoad()
  else window.addEventListener('load', afterLoad, { once: true })
}
