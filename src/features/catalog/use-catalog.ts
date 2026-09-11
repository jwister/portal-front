import { useEffect, useMemo, useState } from 'react'
import { getPricing, type NewApiPricingResponse } from '../../api/portal'
import { catalogModels } from './catalog-data'

/**
 * The catalog moves between routes (`/models`, `/models/:name`, `/docs`), and every
 * navigation is a full document load. Keeping the last response in memory and in
 * sessionStorage lets those pages paint from cache while the fresh copy revalidates
 * in the background, instead of showing the skeleton for a second every time.
 */
const CACHE_KEY = 'ztoken.catalog.pricing.v1'

let memoryCache: NewApiPricingResponse | null = null
let inflight: Promise<NewApiPricingResponse> | null = null

function validPricing(data: unknown): data is NewApiPricingResponse {
  const candidate = data as NewApiPricingResponse | null
  return Boolean(candidate?.success)
    && Array.isArray(candidate?.data)
    && candidate.data.every((model) => typeof model?.model_name === 'string')
}

function readCache(): NewApiPricingResponse | null {
  if (memoryCache) return memoryCache
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (validPricing(parsed)) {
      memoryCache = parsed
      return memoryCache
    }
  } catch {
    // Ignore unreadable or corrupted cache entries and fall back to the network.
  }
  return null
}

function writeCache(data: NewApiPricingResponse): void {
  memoryCache = data
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // Storage can be full or unavailable; the in-memory copy still works.
  }
}

function requestPricing(): Promise<NewApiPricingResponse> {
  if (inflight) return inflight
  const request = getPricing().then((data) => {
    if (!validPricing(data)) throw new Error('Invalid catalog')
    writeCache(data)
    return data
  })
  inflight = request
  const release = () => { if (inflight === request) inflight = null }
  request.then(release, release)
  return request
}

/** Warm the catalog (data plus route chunk) before the visitor opens the catalog. */
export function prefetchCatalog(): void {
  void requestPricing().catch(() => undefined)
}

/** Drop every cached copy. Used by the retry action and by the test suite. */
export function clearCatalogCache(): void {
  memoryCache = null
  inflight = null
  try {
    sessionStorage.removeItem(CACHE_KEY)
  } catch {
    // Nothing to clean up when storage is unavailable.
  }
}

export function useCatalog() {
  const [pricing, setPricing] = useState<NewApiPricingResponse | null>(() => readCache())
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setFailed(false)
    void requestPricing().then((data) => {
      if (!active) return
      // Re-rendering every cache revalidation is wasted work; only swap when it changed.
      setPricing((current) => (current && current.pricing_version === data.pricing_version ? current : data))
    }).catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [attempt])

  const models = useMemo(() => pricing ? catalogModels(pricing) : [], [pricing])
  return { pricing, models, failed, retry: () => { clearCatalogCache(); setPricing(null); setAttempt((value) => value + 1) } }
}
