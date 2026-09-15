import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => { vi.restoreAllMocks(); delete window.tidioChatApi; delete document.body.dataset.chatOpen })

it('opens a restored mobile conversation even without a new vendor event and restores the launcher on close', async () => {
  const original = window.matchMedia
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({ ...original(query), matches: true }))
  const listeners = new Map<string, () => void>()
  const api = { on: vi.fn((event: string, callback: () => void) => listeners.set(event, callback)), open: vi.fn(), hide: vi.fn(), show: vi.fn(), getStatus: () => 'online', setColorPalette: vi.fn(), setFeatures: vi.fn() }
  window.tidioChatApi = api
  const host = document.createElement('div'); host.id = 'tidio-chat'
  const shadow = host.attachShadow({ mode: 'open' })
  document.body.append(host)
  const { openSupportChat } = await import('./chat')
  expect(api.hide).toHaveBeenCalled()
  expect(openSupportChat()).toBe(true)
  expect(api.open).toHaveBeenCalledOnce()
  expect(document.body.dataset.chatOpen).toBe('true')
  expect(shadow.querySelectorAll('#ztoken-mobile-chat')).toHaveLength(1)
  openSupportChat()
  expect(shadow.querySelectorAll('#ztoken-mobile-chat')).toHaveLength(1)
  listeners.get('close')?.()
  expect(document.body.dataset.chatOpen).toBeUndefined()
  expect(api.hide).toHaveBeenCalledTimes(2)
  host.remove()
})
