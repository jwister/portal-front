interface TidioApi {
  on(event: 'ready' | 'open' | 'close', callback: () => void): void
  open(): void
  hide(): void
  show(): void
  getStatus(): string | null
  setColorPalette(color: string): void
  setFeatures(features: { widgetLabelStatus?: boolean; mobileHash?: boolean }): void
}
declare global { interface Window { tidioChatApi?: TidioApi } }

let ready = false
let chatOpen = false
let installed: TidioApi | undefined
const mobile = window.matchMedia('(max-width: 800px)')

// Tidio's desktop widget keeps a fixed width even in a narrow desktop window.
// Keep this adapter inside its open shadow root; never depend on generated classes.
function fitChatViewport() {
  const host = document.getElementById('tidio-chat')
  if (!host) return
  host.style.setProperty('--support-height', `${window.visualViewport?.height ?? window.innerHeight}px`)
  const root = host.shadowRoot
  if (!root || root.getElementById('ztoken-mobile-chat')) return
  const style = document.createElement('style')
  style.id = 'ztoken-mobile-chat'
  style.textContent = `
    #tidio-chat-root { --custom-action-color:#147b57!important; --custom-action-color-contrast:#fff!important; }
    @media(max-width:800px) {
      #tidio-chat-root { inset:0!important; margin:0!important; width:100%!important; max-width:100%!important; height:var(--support-height,100dvh)!important; }
      #tidio-chat-root .chat { left:12px!important; right:12px!important; bottom:calc(80px + env(safe-area-inset-bottom))!important; width:calc(100% - 24px)!important; max-width:none!important; height:calc(var(--support-height,100dvh) - 96px - env(safe-area-inset-bottom))!important; max-height:calc(var(--support-height,100dvh) - 96px - env(safe-area-inset-bottom))!important; }
      #tidio-chat-root #button { position:absolute!important; top:auto!important; left:auto!important; right:16px!important; bottom:calc(16px + env(safe-area-inset-bottom))!important; width:56px!important; height:56px!important; transform:none!important; }
      #tidio-chat-root input,#tidio-chat-root textarea { font-size:16px!important; }
    }
    @media(prefers-reduced-motion:reduce) { #tidio-chat-root * { transition:none!important; animation:none!important; } }
  `
  root.append(style)
}

function syncVisibility() {
  if (!ready) return
  fitChatViewport()
  if (mobile.matches && !chatOpen) window.tidioChatApi?.hide()
  else window.tidioChatApi?.show()
}

function configure() {
  const api = window.tidioChatApi
  if (!api || api === installed) return
  installed = api
  ready = true
  api.setColorPalette('#147b57')
  api.setFeatures({ widgetLabelStatus: false })
  api.on('open', () => { chatOpen = true; document.body.dataset.chatOpen = 'true'; fitChatViewport() })
  api.on('close', () => {
    chatOpen = false; delete document.body.dataset.chatOpen; syncVisibility()
    if (mobile.matches) document.querySelector<HTMLButtonElement>('.contact-chat-trigger')?.focus()
  })
  syncVisibility()
  window.dispatchEvent(new Event('ztoken:chat-ready'))
}

document.addEventListener('tidioChat-ready', configure)
if (window.tidioChatApi?.getStatus?.()) configure()
else window.tidioChatApi?.on('ready', configure)
mobile.addEventListener('change', syncVisibility)
window.visualViewport?.addEventListener('resize', fitChatViewport)

export function openSupportChat(): boolean {
  if (!ready || !window.tidioChatApi) return false
  // A restored conversation can already be open internally while its launcher is
  // hidden, so open() does not necessarily emit a new open event.
  chatOpen = true
  document.body.dataset.chatOpen = 'true'
  window.tidioChatApi.show()
  window.tidioChatApi.open()
  fitChatViewport()
  return true
}
