import { describe, expect, it } from 'vitest'
import { catalogModels, priceGroup, videoPrices, tokenTierPrices, dearestTier, tierLabelKey, modelHref, modelType, compareModelsByVendor, modelVersion, vendorRank } from '../catalog-data'
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
  it('leads the marketplace with OpenAI, Anthropic and DeepSeek, then the newest release first', () => {
    expect(vendorRank('OpenAI')).toBe(0)
    expect(vendorRank('Anthropic')).toBe(1)
    expect(vendorRank('DeepSeek')).toBe(2)
    expect(vendorRank('Zhipu')).toBeGreaterThan(2)
    // Every name here is live in the production catalog, where each vendor used to open
    // with its oldest release: `openai/gpt-6-astra` sat behind five older GPTs.
    const models = [
      { vendor: 'Zhipu', name: 'glm-5.1' },
      { vendor: 'DeepSeek', name: 'deepseek-v4-pro' },
      { vendor: 'OpenAI', name: 'gpt-5.5' },
      { vendor: 'Anthropic', name: 'claude-opus-4-6' },
      { vendor: 'OpenAI', name: 'openai/gpt-6-astra' },
      { vendor: 'Anthropic', name: 'claude-opus-5' },
      { vendor: 'DeepSeek', name: 'deepseek/deepseek-v4.1-flash' },
      { vendor: 'Zhipu', name: 'glm-5.2' },
      { vendor: 'ByteDance', name: 'seedance-2.0' },
      { vendor: 'OpenAI', name: 'gpt-5.4' },
      { vendor: 'Anthropic', name: 'claude-sonnet-5' },
      { vendor: 'ByteDance', name: 'seedance-2.5' },
    ]
    expect(models.slice().sort(compareModelsByVendor).map((model) => model.name)).toEqual([
      'openai/gpt-6-astra', 'gpt-5.5', 'gpt-5.4',
      'claude-opus-5', 'claude-sonnet-5', 'claude-opus-4-6',
      'deepseek/deepseek-v4.1-flash', 'deepseek-v4-pro',
      'seedance-2.5', 'seedance-2.0',
      'glm-5.2', 'glm-5.1',
    ])
  })
  it('reads dash and dot version separators alike, and keeps dated snapshots newest first', () => {
    expect(modelVersion('claude-opus-4-6')).toEqual([4, 6])
    expect(modelVersion('claude-opus-4.6')).toEqual([4, 6])
    expect(modelVersion('openai/gpt-6-astra')).toEqual([6])
    expect(modelVersion('cdance2.0-0813')).toEqual([2, 0, 813])
    expect(modelVersion('whisper')).toEqual([])
    const snapshots = [
      { vendor: 'CDance', name: 'cdance2.0-0807' },
      { vendor: 'CDance', name: 'cdance2.5-0807' },
      { vendor: 'CDance', name: 'cdance2.0-0813' },
    ]
    expect(snapshots.slice().sort(compareModelsByVendor).map((model) => model.name))
      .toEqual(['cdance2.5-0807', 'cdance2.0-0813', 'cdance2.0-0807'])
  })
  it('reads per-million token rates from a flat expression', () => {
    expect(tokenTierPrices('tier("base", p * 0.14925 + c * 0.597 + cr * 0.014925)')).toEqual([
      { label: 'base', rows: [
        { key: 'input', base: 0.14925, unit: 'million' },
        { key: 'output', base: 0.597, unit: 'million' },
        { key: 'cache', base: 0.014925, unit: 'million' },
      ] },
    ])
  })
  it('keeps every clock and input-length band the gateway charges', () => {
    const [, , , , clock, banded] = catalogModels(pricingFixture)
    expect(clock.name).toBe('deepseek-v4.1-flash')
    expect(clock.type).toBe('chat')
    expect(clock.tiers.map((tier) => tier.label)).toEqual(['off_peak', 'peak'])
    expect(clock.tiers.map((tier) => tier.rows.map((row) => row.base))).toEqual([[0.1493, 0.597, 0.002985], [0.2985, 1.194, 0.00597]])
    expect(banded.tiers.map((tier) => [tier.label, tier.rows[0].base])).toEqual([['输入<=32k', 0.8955], ['32k<输入<=200k', 1.194]])
  })
  it('quotes the dearest band where only one price fits, not whichever the gateway wrote first', () => {
    const [, , , , clock, banded] = catalogModels(pricingFixture)
    // The cheap off-peak band leads this expression, so taking the first tier would headline
    // half the daytime rate.
    expect(clock.tiers[0].label).toBe('off_peak')
    expect(dearestTier(clock.tiers)?.label).toBe('peak')
    expect(clock.prices).toEqual(clock.tiers[1].rows)
    expect(dearestTier(banded.tiers)?.label).toBe('32k<输入<=200k')
    expect(dearestTier([])).toBeNull()
  })
  it('translates the labels written as identifiers and leaves operator wording alone', () => {
    expect(tierLabelKey('peak')).toBe('catalog.tier.peak')
    expect(tierLabelKey('off_peak')).toBe('catalog.tier.offPeak')
    expect(tierLabelKey('输入<=32k')).toBeUndefined()
  })
  it.each([
    ['an unknown usage variable', 'tier("base", x * 0.1)'],
    ['the same usage billed twice', 'tier("base", p * 0.1 + p * 0.2)'],
    ['no input rate at all', 'tier("base", c * 0.597)'],
    ['tiers added together', 'tier("a", p * 0.1) + tier("b", p * 0.2)'],
    ['arithmetic on the chosen tier', 'tier("base", p * 0.1) * 2'],
    ['a branch that is a bare amount, not a tier', 'hour("Asia/Shanghai") < 8 ? tier("闲时", p * 0.1) : 0.5'],
    ['a negative rate', 'tier("base", p * -0.1)'],
    ['a trailing statement', 'tier("base", p * 0.1); alert(1)'],
    ['a per-second video tier', 'u("resolution") == "720p" ? tier("720p", u("duration") * 0.1) : tier("1080p", u("duration") * 0.2)'],
  ])('withholds a token price it cannot read in full: %s', (_reason, expression) => {
    expect(tokenTierPrices(expression)).toEqual([])
  })
})

