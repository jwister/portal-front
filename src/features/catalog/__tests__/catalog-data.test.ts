import { describe, expect, it } from 'vitest'
import { catalogModels, priceGroup, videoPrices, modelHref, modelType, compareModelsByVendor, vendorRank } from '../catalog-data'
import { pricingFixture } from './pricing-fixture'
import { getBytePlusOfficialReference } from '../seedance-reference'

describe('catalog billing rules', () => {
  it('keeps verified BytePlus references separate from aliases, promotions and CDance models', () => {
    const reference = getBytePlusOfficialReference('seedance-2.0')!
    expect(reference.modelId).toBe('dreamina-seedance-2-0-260128')
    expect(reference.prices.find((row) => row.resolution === '4K')).toEqual({ resolution: '4K', withoutVideo: 4, withVideo: 2.4 })
    expect(getBytePlusOfficialReference('cdance2.0-0807')).toBeUndefined()
    expect(getBytePlusOfficialReference('seedance-2.0-999999')).toBeUndefined()
  })
  it('converts the base ratio to USD per million and applies discounts independently', () => {
    const [model] = catalogModels(pricingFixture)
    expect(model.prices.map((row) => row.base)).toEqual([0.3, 0.6, 0.03, 0.375])
    expect(priceGroup(pricingFixture, model).ratio).toBe(0.95)
    expect(model.prices[0].base! * priceGroup(pricingFixture, model).ratio!).toBeCloseTo(0.285)
    expect(priceGroup(pricingFixture, model, 'premium').ratio).toBe(1.5)
    expect(model.vendor).toBe('DeepSeek')
  })
  it('does not invent token prices for per-request or unconfigured video models', () => {
    const models = catalogModels(pricingFixture)
    expect(models[1].prices).toEqual([{ key: 'request', base: 0.2, unit: 'request' }])
    expect(models[2].prices.map((row) => [row.base, row.unit])).toEqual([[0.1, 'second'], [null, 'second']])
    expect(models[3].prices).toEqual([])
    expect(models[3].vendor).toBe('CDance')
  })
  it.each([
    'tier("720p", u("duration") * 1) + 3',
    'u("audio") == "yes" ? tier("a", u("duration") * 1) : tier("b", u("duration") * 2)',
    'tier("720p", u("duration") * 1); alert(1)',
    'tier("720p", u("duration") * -1)',
    'tier("720p", u("duration") * 1) / 2',
  ])('rejects unsupported expressions without partial pricing: %s', (expression) => {
    expect(videoPrices(expression)).toEqual([])
  })
  it('does not apply an unavailable group or override an explicit type with a name heuristic', () => {
    const model = catalogModels(pricingFixture)[1]
    expect(priceGroup(pricingFixture, model, 'premium').ratio).toBeNull()
    expect(modelType({ model_name: 'gpt-example', model_type: 'image' })).toBe('image')
  })
  it('round-trips exact API IDs containing slash, percent, query and Unicode characters', () => {
    const name = 'vendor/model%高清?x=1#test'
    const url = new URL(modelHref(name, 'a&b'), 'https://example.test')
    expect(decodeURIComponent(url.pathname.slice('/models/'.length))).toBe(name)
    expect(url.searchParams.get('group')).toBe('a&b')
  })
  it('leads the marketplace with OpenAI, Anthropic and DeepSeek, then sorts the rest by name', () => {
    expect(vendorRank('OpenAI')).toBe(0)
    expect(vendorRank('Anthropic')).toBe(1)
    expect(vendorRank('DeepSeek')).toBe(2)
    expect(vendorRank('Zhipu')).toBeGreaterThan(2)
    const models = [
      { vendor: 'Zhipu', name: 'glm-5' },
      { vendor: 'DeepSeek', name: 'deepseek-v4-pro' },
      { vendor: 'OpenAI', name: 'gpt-5.5' },
      { vendor: 'Anthropic', name: 'claude-opus-5' },
      { vendor: 'ByteDance', name: 'seedance-2.0' },
      { vendor: 'OpenAI', name: 'gpt-5.4' },
    ]
    expect(models.slice().sort(compareModelsByVendor).map((model) => model.name)).toEqual([
      'gpt-5.4', 'gpt-5.5', 'claude-opus-5', 'deepseek-v4-pro', 'seedance-2.0', 'glm-5',
    ])
  })
})

