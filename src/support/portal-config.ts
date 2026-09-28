import { useSyncExternalStore } from 'react'

/**
 * Readers for the deployment settings `/api/config.js` puts on `window`. The overseas and
 * mainland sites serve the same build, so everything that differs between them — region,
 * display currency, ICP record — is read here at run time. `globalThis` rather than
 * `window`, because the homepage is also rendered in Node at build time.
 */
interface PortalConfig {
  PORTAL_ENABLE_RECHARGE?: unknown
  PORTAL_DOMESTIC_REGION?: unknown
  PORTAL_QUOTA_DISPLAY_TYPE?: unknown
  PORTAL_USD_EXCHANGE_RATE?: unknown
  PORTAL_QUOTA_PER_USD?: unknown
  PORTAL_ICP_RECORD?: unknown
}

const config = () => globalThis as PortalConfig
const positive = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0

/** Purchasing is on unless the deployment explicitly switches it off. */
export function isRechargeEnabled(): boolean {
  return config().PORTAL_ENABLE_RECHARGE !== false
}

/** The mainland site, which offers only models served from mainland nodes. */
export function isDomesticRegion(): boolean {
  return config().PORTAL_DOMESTIC_REGION === true
}

export function icpRecord(): string {
  const record = config().PORTAL_ICP_RECORD
  return typeof record === 'string' ? record.trim() : ''
}

/** NewAPI quota units per USD; the gateway's own default when the script has not run. */
export function quotaPerUsd(): number {
  const quota = config().PORTAL_QUOTA_PER_USD
  return positive(quota) ? quota : 500_000
}

export interface DisplayCurrency { code: 'USD' | 'CNY'; symbol: string; perUsd: number }

export const USD: DisplayCurrency = { code: 'USD', symbol: '$', perUsd: 1 }

let current: DisplayCurrency = USD

/**
 * The currency balances and model prices are shown in. The gateway keeps every amount in
 * USD, so a CNY site only converts at the gateway's own exchange rate, as NewAPI's console
 * does. `PORTAL_CURRENCY_SYMBOL` is not read: it is NewAPI's custom-currency sign (`¤`),
 * meaningful only for a CUSTOM display type this portal does not offer. A CNY site without
 * a usable rate stays in USD rather than print dollar figures under a yuan sign.
 *
 * Payments are not covered: orders are settled in USD on every site.
 */
export function displayCurrency(): DisplayCurrency {
  const { PORTAL_QUOTA_DISPLAY_TYPE: type, PORTAL_USD_EXCHANGE_RATE: rate } = config()
  const next = type === 'CNY' && positive(rate) ? { code: 'CNY' as const, symbol: '¥', perUsd: rate } : USD
  // One object per setting: useSyncExternalStore compares snapshots by identity.
  if (next.code !== current.code || next.perUsd !== current.perUsd) current = next
  return current
}

/** A USD amount in the display currency: `$1.50`, or `¥10.05` on a CNY site. `format`
 *  prints the converted number, so each page keeps its own precision. */
export function formatMoney(usd: number, format: (value: number) => string, currency = displayCurrency()): string {
  return currency.symbol + format(usd * currency.perUsd)
}

const subscribe = () => () => {}

/*
 * The homepage is prerendered without the config script, so hydration has to start from
 * the build's view (overseas, USD, no record) and switch right after. Reading `window` in
 * that first render instead makes the text disagree with the server HTML. Each switch
 * re-renders the component calling the hook, so call these in small leaves, never a page.
 */

export function useRechargeEnabled(): boolean {
  return useSyncExternalStore(subscribe, isRechargeEnabled, () => true)
}

export function useDomesticRegion(): boolean {
  return useSyncExternalStore(subscribe, isDomesticRegion, () => false)
}

export function useDisplayCurrency(): DisplayCurrency {
  return useSyncExternalStore(subscribe, displayCurrency, () => USD)
}

export function useIcpRecord(): string {
  return useSyncExternalStore(subscribe, icpRecord, () => '')
}
