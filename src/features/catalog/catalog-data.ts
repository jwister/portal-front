import { isDocumentedSeedance } from '../docs/seedance-api'
import type { NewApiPricingModel, NewApiPricingResponse } from '../../api/portal'

export type ModelType = 'chat' | 'embedding' | 'image' | 'video' | 'audio' | 'other'
export interface PriceRow { key: string; label?: string; base: number | null; unit: 'million' | 'request' | 'second' }
export interface CatalogModel {
  name: string
  vendor: string
  type: ModelType
  groups: string[]
  prices: PriceRow[]
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

export function catalogModels(pricing: NewApiPricingResponse): CatalogModel[] {
  const vendors = new Map((pricing.vendors ?? []).map((vendor) => [vendor.id, vendor.name]))
  return pricing.data.map((raw) => {
    const type = modelType(raw)
    let prices: PriceRow[] = []
    if (raw.billing_mode === 'tiered_expr') prices = videoPrices(raw.billing_expr)
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
    return { name: raw.model_name, vendor, type, groups: raw.enable_groups ?? [], prices, endpoints, raw }
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

/** Stable marketplace ordering: headline vendors first, then vendor name, then model name. */
export function compareModelsByVendor(a: { vendor: string; name: string }, b: { vendor: string; name: string }): number {
  const rank = vendorRank(a.vendor) - vendorRank(b.vendor)
  if (rank !== 0) return rank
  const vendorName = a.vendor.localeCompare(b.vendor, 'zh')
  if (vendorName !== 0) return vendorName
  return a.name.localeCompare(b.name)
}
