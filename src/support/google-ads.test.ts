import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('Google Ads conversions', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    delete window.gtag
    delete window.dataLayer
    document.querySelectorAll('script[src*="/gtag/js"]').forEach((script) => script.remove())
  })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

  it('queues initialization once and loads one Google tag without replacing the GTM queue', async () => {
    window.dataLayer = [{ event: 'gtm.js' }]
    const { initializeGoogleAds, loadGoogleAds } = await import('./google-ads')
    initializeGoogleAds()
    initializeGoogleAds()
    loadGoogleAds()
    loadGoogleAds()
    expect(window.dataLayer[0]).toEqual({ event: 'gtm.js' })
    expect(window.dataLayer.slice(1).map((command) => Array.from(command as ArrayLike<unknown>)[0])).toEqual(['js', 'config'])
    expect(document.querySelectorAll('script[src*="/gtag/js?id=AW-18368347101"]')).toHaveLength(1)
  })

  it('waits for registration processing and falls back after two seconds when blocked', async () => {
    vi.useFakeTimers()
    const gtag = vi.fn()
    window.gtag = gtag
    const { trackRegistration } = await import('./google-ads')
    const done = vi.fn()
    const pending = trackRegistration().then(done)
    expect(gtag).toHaveBeenCalledWith('event', 'conversion', expect.objectContaining({ send_to: 'AW-18368347101/HAU6CParo-EcEN332rZE' }))
    expect(done).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(2000)
    await pending
    expect(done).toHaveBeenCalledOnce()
  })

  it('completes registration immediately on the Google callback or a tracking exception', async () => {
    window.gtag = vi.fn((command, _event, params) => {
      if (command === 'event') (params as { event_callback: () => void }).event_callback()
    })
    const { trackRegistration } = await import('./google-ads')
    await expect(trackRegistration()).resolves.toBeUndefined()
    window.gtag = () => { throw new Error('blocked') }
    await expect(trackRegistration()).resolves.toBeUndefined()
  })

  it('does not break page initialization when an existing Google tag throws', async () => {
    window.gtag = () => { throw new Error('blocked') }
    const { initializeGoogleAds } = await import('./google-ads')
    expect(() => initializeGoogleAds()).not.toThrow()
  })

  it('retries the script and an unprocessed purchase after a temporary download failure', async () => {
    const gtag = vi.fn()
    window.gtag = gtag
    const { trackPurchase } = await import('./google-ads')
    const order = { orderNo: 'PO-RETRY', status: 'PAID', amountUsdMinor: 100 }
    trackPurchase(order)
    const failedScript = document.querySelector('script[src*="/gtag/js"]')!
    failedScript.dispatchEvent(new Event('error'))
    trackPurchase(order)
    expect(document.querySelector('script[src*="/gtag/js"]')).not.toBe(failedScript)
    expect(gtag.mock.calls.filter(([command]) => command === 'event')).toHaveLength(2)
  })

  it.each([
    [{ amountUsdMinor: 2550 }, 25.5, 'USD'],
    [{ amountUsdMinor: 2550, conversionValue: 25.5 }, 25.5, 'USD'],
    [{ amountUsdMinor: 2550, conversionValue: 180, conversionCurrency: 'CNY' }, 180, 'CNY'],
  ])('sends the matching purchase value and currency with a unique order number', async (amount, value, currency) => {
    const gtag = vi.fn()
    window.gtag = gtag
    const { trackPurchase } = await import('./google-ads')
    trackPurchase({ orderNo: 'PO-1', status: 'PAID', ...amount })
    expect(gtag).toHaveBeenCalledWith('event', 'conversion', expect.objectContaining({
      send_to: 'AW-18368347101/lxjbCNK_x4cdEN332rZE', value, currency, transaction_id: 'PO-1',
    }))
  })

  it('suppresses duplicate renders and refreshes, while allowing an unprocessed event to retry on a later visit', async () => {
    const gtag = vi.fn()
    window.gtag = gtag
    let tracking = await import('./google-ads')
    const order = { orderNo: 'PO-1', status: 'PAID', amountUsdMinor: 2550 }
    tracking.trackPurchase(order)
    tracking.trackPurchase(order)
    expect(gtag.mock.calls.filter(([command]) => command === 'event')).toHaveLength(1)
    vi.resetModules()
    tracking = await import('./google-ads')
    tracking.trackPurchase(order)
    const events = gtag.mock.calls.filter(([command]) => command === 'event')
    expect(events).toHaveLength(2)
    events[1][2].event_callback()
    vi.resetModules()
    tracking = await import('./google-ads')
    tracking.trackPurchase(order)
    expect(gtag.mock.calls.filter(([command]) => command === 'event')).toHaveLength(2)
  })

  it('does not send unpaid orders or invalid money and does not break when storage is unavailable', async () => {
    const gtag = vi.fn()
    window.gtag = gtag
    const { trackPurchase } = await import('./google-ads')
    for (const data of [{ status: 'CONFIRMED' }, { amountUsdMinor: -1 }, { conversionValue: NaN }, { conversionCurrency: 'CNY' }, { conversionCurrency: 'USDT' }]) {
      trackPurchase({ orderNo: 'PO-1', status: 'PAID', amountUsdMinor: 2550, ...data })
    }
    expect(gtag.mock.calls.filter(([command]) => command === 'event')).toHaveLength(0)
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => { throw new Error('disabled') })
    expect(() => trackPurchase({ orderNo: 'PO-2', status: 'PAID', amountUsdMinor: 100 })).not.toThrow()
    expect(gtag.mock.calls.filter(([command]) => command === 'event')).toHaveLength(1)
  })
})
