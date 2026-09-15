import { afterEach, expect, it, vi } from 'vitest'
import { loadSupportChat, scheduleSupportChat } from './load-chat'

afterEach(() => {
  document.getElementById('ztoken-tidio-script')?.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it('automatically warms chat after paint and avoids duplicate loads on an early click', () => {
  vi.useFakeTimers()
  vi.spyOn(document, 'readyState', 'get').mockReturnValue('complete')
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(0), 16))
  vi.stubGlobal('requestIdleCallback', (callback: () => void) => setTimeout(callback, 1))
  scheduleSupportChat()
  expect(document.querySelector('script[src*="tidio.co"]')).toBeNull()
  vi.advanceTimersByTime(16)
  expect(document.querySelector('script[src*="tidio.co"]')).toBeNull()
  // A visitor can request chat immediately, without waiting for the idle callback.
  loadSupportChat()
  vi.runAllTimers()
  expect(document.querySelectorAll('script[src*="tidio.co"]')).toHaveLength(1)
  expect(document.querySelector('script')?.async).toBe(true)
})

it('reports a failed script and allows a later user retry', () => {
  const failed = vi.fn()
  window.addEventListener('ztoken:chat-error', failed, { once: true })
  loadSupportChat()
  document.getElementById('ztoken-tidio-script')?.dispatchEvent(new Event('error'))
  expect(failed).toHaveBeenCalledOnce()
  expect(document.getElementById('ztoken-tidio-script')).toBeNull()
  loadSupportChat()
  expect(document.querySelectorAll('script[src*="tidio.co"]')).toHaveLength(1)
})
