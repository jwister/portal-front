import { afterEach, describe, expect, it, vi } from 'vitest'

import { displayCurrency, formatMoney, icpRecord, isDomesticRegion, quotaPerUsd, USD } from './portal-config'

const twoDecimals = (value: number) => value.toFixed(2)

describe('portal deployment config', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it('stays overseas, in USD, when the config script has not run', () => {
    expect(isDomesticRegion()).toBe(false)
    expect(displayCurrency()).toBe(USD)
    expect(quotaPerUsd()).toBe(500_000)
    expect(icpRecord()).toBe('')
    expect(formatMoney(1.5, twoDecimals)).toBe('$1.50')
  })

  it('converts at the gateway exchange rate on a CNY site and ignores the custom-currency sign', () => {
    vi.stubGlobal('PORTAL_QUOTA_DISPLAY_TYPE', 'CNY')
    vi.stubGlobal('PORTAL_USD_EXCHANGE_RATE', 6.7)
    vi.stubGlobal('PORTAL_CURRENCY_SYMBOL', '¤')

    expect(displayCurrency()).toEqual({ code: 'CNY', symbol: '¥', perUsd: 6.7 })
    expect(formatMoney(1.5, twoDecimals)).toBe('¥10.05')
  })

  it('keeps one snapshot per setting so a store subscriber does not loop', () => {
    vi.stubGlobal('PORTAL_QUOTA_DISPLAY_TYPE', 'CNY')
    vi.stubGlobal('PORTAL_USD_EXCHANGE_RATE', 6.7)

    expect(displayCurrency()).toBe(displayCurrency())
  })

  it('stays in USD when a CNY site has no usable rate, rather than relabel dollar figures', () => {
    vi.stubGlobal('PORTAL_QUOTA_DISPLAY_TYPE', 'CNY')
    vi.stubGlobal('PORTAL_USD_EXCHANGE_RATE', 0)

    expect(displayCurrency()).toBe(USD)
  })

  it('reads the region, quota unit and ICP record the deployment sets', () => {
    vi.stubGlobal('PORTAL_DOMESTIC_REGION', true)
    vi.stubGlobal('PORTAL_QUOTA_PER_USD', 1_000)
    vi.stubGlobal('PORTAL_ICP_RECORD', ' 苏ICP备2026073005号 ')

    expect(isDomesticRegion()).toBe(true)
    expect(quotaPerUsd()).toBe(1_000)
    expect(icpRecord()).toBe('苏ICP备2026073005号')
  })
})
