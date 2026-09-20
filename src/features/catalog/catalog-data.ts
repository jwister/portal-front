import { isDocumentedSeedance } from '../docs/seedance-api'
import type { NewApiPricingModel, NewApiPricingResponse } from '../../api/portal'

export type ModelType = 'chat' | 'embedding' | 'image' | 'video' | 'audio' | 'other'
export interface PriceRow { key: string; label?: string; base: number | null; unit: 'million' | 'request' | 'second' }
/** One band of a rate that changes with the request, named by the gateway: an off-peak
 *  window, an input length band. The label is shown verbatim, never interpreted. */
export interface PriceTier { label: string; rows: PriceRow[] }
export interface CatalogModel {
  name: string
  vendor: string
  type: ModelType
  groups: string[]
  /** The rate to show where only one fits; for a tiered model, `dearestTier`'s rows. */
  prices: PriceRow[]
  /** Every band, in the gateway's own order. Empty unless the rate varies per request. */
  tiers: PriceTier[]
  endpoints: string[]
  raw: NewApiPricingModel
}

const validPrice = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0

export function modelType(model: NewApiPricingModel): ModelType {
  if (['chat', 'embedding', 'image', 'video', 'audio'].includes(model.model_type ?? '')) return model.model_type as ModelType
  const name = model.model_name.toLowerCase()
  if (model.billing_usage_schema?.duration || /seedance|cdance|veo|sora|kling|video|wan\d/.test(name)) return 'video'
  if (/embedding|embed|bge-|rerank/.test(name)) return 'embedding'
  if (/dall-e|flux|image|imagen|stable-diffusion|midjourney/.test(name)) return 'image'
  if (/whisper|tts|speech|audio/.test(name)) return 'audio'
  if (/^(gpt|claude|deepseek|glm|gemini|qwen|kimi|moonshot|llama|mistral|grok|doubao)/.test(name)) return 'chat'
  return ['chat', 'embedding', 'image', 'video', 'audio'].includes(model.model_type ?? '') ? model.model_type as ModelType : 'other'
}

/** Read only the known, linear video rate format. Never execute a server expression. */
export function videoPrices(expression: string | undefined): PriceRow[] {
  if (!expression) return []
  const tierCalls = expression.match(/tier\("[^"]+",\s*u\("duration"\)\s*\*\s*[\d.]+(?:\s*\+\s*u\("tokens"\)\s*\*\s*0\s*\/\s*1000000)?\s*\)/g) ?? []
  // Reject unsupported arithmetic, conditions or tier formats rather than displaying a partial price.
  const remainder = expression.replace(/tier\("[^"]+",\s*u\("duration"\)\s*\*\s*[\d.]+(?:\s*\+\s*u\("tokens"\)\s*\*\s*0\s*\/\s*1000000)?\s*\)/g, 'T')
  if (!/^(?:\s*u\("(?:ratio|resolution)"\)\s*==\s*"[\w:.\-]+"(?:\s*&&\s*u\("(?:ratio|resolution)"\)\s*==\s*"[\w:.\-]+")?\s*\?\s*T\s*:\s*)*T\s*$/.test(remainder)) return []
  const rows = tierCalls.flatMap((call) => {
    const match = call.match(/tier\("([^"]+)",\s*u\("duration"\)\s*\*\s*([\d.]+)/)
    if (!match || !validPrice(Number(match[2]))) return []
    return [{ key: match[1], label: match[1], base: Number(match[2]) > 0 ? Number(match[2]) : null, unit: 'second' as const }]
  })
  return rows.length === tierCalls.length ? rows : []
}

/** Which usage each expression variable bills, and the order the rows are printed in. */
const TOKEN_RATE_KEYS: Record<string, string> = { p: 'input', c: 'output', cr: 'cache', cw: 'cacheWrite' }
const TOKEN_ROW_ORDER = ['input', 'output', 'cache', 'cacheWrite']

/** Read one tier's `p * rate + c * rate` sum. A rate is written per million tokens, so
 *  `p * 0.15` is USD 0.15 per million prompt tokens. */
function tokenRates(formula: string): PriceRow[] {
  const rows: PriceRow[] = []
  for (const term of formula.split('+')) {
    const rate = term.trim().match(/^([a-z]{1,2})\s*\*\s*(\d+(?:\.\d+)?)$/)
    if (!rate) return []
    const key = TOKEN_RATE_KEYS[rate[1]]
    const base = Number(rate[2])
    // An unknown variable, a repeated one or an unreadable rate would leave part of the
    // request uncharged on the card, so the whole price is withheld instead.
    if (!key || !validPrice(base) || rows.some((row) => row.key === key)) return []
    // A zero rate means the tier carries no configured price, exactly as it does for video.
    rows.push({ key, base: base > 0 ? base : null, unit: 'million' })
  }
  return rows.some((row) => row.key === 'input')
    ? rows.sort((a, b) => TOKEN_ROW_ORDER.indexOf(a.key) - TOKEN_ROW_ORDER.indexOf(b.key))
    : []
}

/**
 * Once every tier call is a `T`, the expression must be `condition ? T : condition ? T : T`
 * and nothing else: every value it can produce has to be one of the tiers. What a condition
 * tests is deliberately not read, so a clock window and an input length band are both
 * accepted, and a new kind of condition needs no change here. Anything else — arithmetic on
 * the result, a bare amount in a branch, a statement separator — means part of the traffic
 * is charged at a rate the page never shows, so no price is shown at all. The expression is
 * never executed.
 */
function selectsTiersOnly(remainder: string): boolean {
  const structure = remainder
    .replace(/"[^"]*"/g, 'S') // a quoted timezone or enum value cannot be read as syntax
    .replace(/[^?:]*\?/g, '?') // a condition only chooses; its contents are never read
    .replace(/[\s()]/g, '')
  return /^\?*T(?::\?*T)*$/.test(structure)
}

const inputRate = (tier: PriceTier): number => tier.rows.find((row) => row.key === 'input')?.base ?? 0

/**
 * The tier a page quotes where it has room for only one, and names alongside the price.
 * It is the dearest, not the first: the gateway is free to put the cheap band first — the
 * off-peak window currently leads `deepseek-v4.1-flash` — and a headline below what a
 * request can actually cost is the one mistake worth ruling out.
 */
export function dearestTier(tiers: PriceTier[]): PriceTier | null {
  return tiers.length ? tiers.reduce((top, tier) => (inputRate(tier) > inputRate(top) ? tier : top)) : null
}

/** Bands the gateway names with an identifier rather than copy. Any other label is the
 *  operator's own wording (`输入<=32k`) and is shown exactly as written. */
const TIER_LABEL_KEYS: Record<string, string> = { peak: 'catalog.tier.peak', off_peak: 'catalog.tier.offPeak' }
export function tierLabelKey(label: string): string | undefined { return TIER_LABEL_KEYS[label] }

/**
 * Read the token rate tiers out of a billing expression, in the gateway's own order, so a
 * rate that changes with the request (off-peak hours, input length bands) shows every band
 * it charges instead of one price that is right only part of the day. A flat expression
 * yields a single tier.
 */
export function tokenTierPrices(expression: string | undefined): PriceTier[] {
  if (!expression) return []
  const tierCall = /tier\("([^"]*)",\s*([^()]*)\)/g
  const tiers: PriceTier[] = []
  for (const [, label, formula] of expression.matchAll(tierCall)) {
    const rows = tokenRates(formula)
    if (!rows.length) return []
    tiers.push({ label, rows })
  }
  return tiers.length && selectsTiersOnly(expression.replace(tierCall, 'T')) ? tiers : []
}

export function catalogModels(pricing: NewApiPricingResponse): CatalogModel[] {
  const vendors = new Map((pricing.vendors ?? []).map((vendor) => [vendor.id, vendor.name]))
  return pricing.data.map((raw) => {
    const type = modelType(raw)
    let prices: PriceRow[] = []
    let tiers: PriceTier[] = []
    if (raw.billing_mode === 'tiered_expr') {
      const perSecond = videoPrices(raw.billing_expr)
      if (perSecond.length) prices = perSecond
      else {
        tiers = tokenTierPrices(raw.billing_expr)
        prices = dearestTier(tiers)?.rows ?? []
      }
    }
    else if ((!raw.billing_mode || raw.billing_mode === 'ratio') && raw.quota_type === 1 && validPrice(raw.model_price)) prices = [{ key: 'request', base: type === 'video' && raw.model_price === 0 ? null : raw.model_price, unit: 'request' }]
    else if (type !== 'video' && (!raw.billing_mode || raw.billing_mode === 'ratio') && raw.quota_type !== 1 && validPrice(raw.model_ratio)) {
      // New API: one ratio unit is USD 2 per million tokens (USD 0.002 / 1K).
      const base = raw.model_ratio * 2
      prices = [{ key: 'input', base, unit: 'million' }]
      if (validPrice(raw.completion_ratio)) prices.push({ key: 'output', base: base * raw.completion_ratio, unit: 'million' })
      if (validPrice(raw.cache_ratio)) prices.push({ key: 'cache', base: base * raw.cache_ratio, unit: 'million' })
      if (validPrice(raw.create_cache_ratio)) prices.push({ key: 'cacheWrite', base: base * raw.create_cache_ratio, unit: 'million' })
    }
    let vendor = raw.vendor_name || (raw.vendor_id === undefined ? undefined : vendors.get(raw.vendor_id))
    if (!vendor) {
      if (/^seedance/i.test(raw.model_name)) vendor = 'ByteDance'
      else if (/^cdance/i.test(raw.model_name)) vendor = 'CDance'
      else vendor = 'Independent'
    }
    // The live catalog labels these video aliases as OpenAI chat; use the documented gateway route.
    const endpoints = isDocumentedSeedance(raw.model_name) ? ['/v1/videos'] : (raw.supported_endpoint_types ?? []).flatMap((key) => {
      const endpoint = pricing.supported_endpoint?.[key]
      return endpoint && !Array.isArray(endpoint) && endpoint.path.startsWith('/') ? [endpoint.path] : []
    })
    return { name: raw.model_name, vendor, type, groups: raw.enable_groups ?? [], prices, tiers, endpoints, raw }
  })
}

export function priceGroup(pricing: NewApiPricingResponse, model: CatalogModel, selected = 'all'): { name: string; ratio: number | null } {
  const name = selected !== 'all' ? selected : model.groups.includes('default') ? 'default' : model.groups[0] ?? ''
  const ratio = pricing.group_ratio?.[name]
  return { name, ratio: model.groups.includes(name) && validPrice(ratio) ? ratio : null }
}

export function cardPriceRows(model: CatalogModel): PriceRow[] {
  if (model.prices[0]?.unit !== 'second') return model.prices.filter((row) => row.key !== 'cacheWrite')
  const seen = new Set<string>()
  return model.prices.filter((row) => {
    const key = `${row.label?.split('·').pop()}:${row.base}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).map((row) => ({ ...row, label: row.label?.split('·').pop() }))
}

/** One tier's rows trimmed for a card. A tiered card repeats every row once per tier, so it
 *  keeps only the two rates that decide between them; the cache rates stay on the detail page. */
export function cardTierRows(tier: PriceTier): PriceRow[] { return tier.rows.filter((row) => row.key === 'input' || row.key === 'output') }

export function modelHref(name: string, group?: string): string { return `/models/${encodeURIComponent(name)}${group && group !== 'all' ? `?${new URLSearchParams({ group })}` : ''}` }
export function formatPrice(value: number): string {
  return value > 0 && value < 0.000000001 ? value.toExponential(3) : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 9 })
}

/** Headline vendors always lead the marketplace; everyone else sorts by name. */
const VENDOR_PRIORITY = ['OpenAI', 'Anthropic', 'DeepSeek']

export function vendorRank(vendor: string): number {
  const index = VENDOR_PRIORITY.indexOf(vendor)
  return index === -1 ? VENDOR_PRIORITY.length : index
}

/**
 * Version segments read from a model name, most significant first. A dash and a dot
 * separate the same levels, so `claude-opus-4-6` and `claude-opus-4.6` both read as
 * [4, 6]; `cdance2.0-0813` keeps its date as a third segment, which is what puts the
 * newer snapshot ahead of `cdance2.0-0807`.
 */
export function modelVersion(name: string): number[] {
  return (name.match(/\d+(?:\.\d+)?/g) ?? []).flatMap((part) => part.split('.').map(Number))
}

/** Newest first. A missing segment counts as zero, so v4.1 leads v4. */
function compareVersionsDescending(a: number[], b: number[]): number {
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (b[index] ?? 0) - (a[index] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}

/**
 * Stable marketplace ordering: headline vendors first, then vendor name, then the newest
 * model version, so a visitor meets `gpt-6-astra` before `gpt-5.4` instead of scrolling
 * past five older releases to reach it. Models sharing a version (`claude-opus-5` and
 * `claude-sonnet-5`) keep a stable alphabetical order.
 */
export function compareModelsByVendor(a: { vendor: string; name: string }, b: { vendor: string; name: string }): number {
  const rank = vendorRank(a.vendor) - vendorRank(b.vendor)
  if (rank !== 0) return rank
  const vendorName = a.vendor.localeCompare(b.vendor, 'zh')
  if (vendorName !== 0) return vendorName
  const version = compareVersionsDescending(modelVersion(a.name), modelVersion(b.name))
  if (version !== 0) return version
  return a.name.localeCompare(b.name)
}
