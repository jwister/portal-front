import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../../../i18n'
import { ModelsPage } from '../ModelsPage'
import { ModelDetailPage } from '../ModelDetailPage'
import { pricingFixture } from './pricing-fixture'

describe('catalog browsing and pricing', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('zh-CN')
    window.history.replaceState({}, '', '/models')
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => Promise.resolve(new Response(JSON.stringify(
      url === '/api/auth/status' ? { authenticated: false, profile: null } : pricingFixture,
    )))))
  })
  afterEach(() => { vi.unstubAllGlobals(); window.history.replaceState({}, '', '/') })

  it('advertises only verified discounts in the current results and follows group selection', async () => {
    const user = userEvent.setup()
    const offerPricing = {
      ...pricingFixture,
      group_ratio: { ...pricingFixture.group_ratio, image: 0.8, unpriced: 0.1 },
      data: pricingFixture.data.map((model) => model.model_name === 'image-test'
        ? { ...model, enable_groups: ['image'] }
        : model.model_name === 'cdance2.5-0807' ? { ...model, enable_groups: ['unpriced'] } : model),
    }
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(offerPricing)))
    render(<ModelsPage />)
    const promotion = await screen.findByTestId('models-promotion')
    expect(within(promotion).getByText('8 折')).toBeVisible()
    expect(within(promotion).getByText('比基础价节省 20%')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'DeepSeek' }))
    expect(within(promotion).getByText('9.5 折')).toBeVisible()
    expect(within(promotion).getByText('比基础价节省 5%')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'premium' }))
    expect(promotion).not.toHaveTextContent('折扣低至')
    await user.click(screen.getByRole('button', { name: '清除筛选' }))
    await user.type(screen.getByRole('searchbox'), 'cdance')
    expect(promotion).not.toHaveTextContent('折扣低至')
    await user.type(screen.getByRole('searchbox'), '-missing')
    expect(promotion).not.toHaveTextContent('折扣低至')
  })

  it('combines type, provider, group and search, then clears all conditions', async () => {
    const user = userEvent.setup()
    render(<ModelsPage />)
    await screen.findByRole('link', { name: 'deepseek-test' })
    await user.click(screen.getByRole('button', { name: '对话' }))
    await user.click(screen.getByRole('button', { name: 'DeepSeek' }))
    await user.click(screen.getByRole('button', { name: 'premium' }))
    await user.type(screen.getByRole('searchbox'), 'deepseek')
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'deepseek-test' })).toHaveAttribute('href', '/models/deepseek-test?group=premium')
    expect(screen.queryByText('9.5 折')).not.toBeInTheDocument()
    await user.type(screen.getByRole('searchbox'), '-missing')
    expect(screen.getByText('没有找到模型')).toBeVisible()
    await user.click(screen.getAllByRole('button', { name: '清除筛选' })[0])
    expect(screen.getAllByRole('article')).toHaveLength(pricingFixture.data.length)
    expect(window.location.search).toBe('')
  })

  it('copies an exact API ID without navigation and sends use to account routing', async () => {
    const user = userEvent.setup()
    render(<ModelsPage />)
    const card = await screen.findByTestId('model-card-deepseek-test')
    await user.click(within(card).getByRole('button', { name: '复制模型名' }))
    expect(await navigator.clipboard.readText()).toBe('deepseek-test')
    expect(window.location.pathname).toBe('/models')
    expect(fetch).toHaveBeenCalledTimes(1)
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ authenticated: false, profile: null })))
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign })
    await user.click(within(card).getByRole('button', { name: '立即使用' }))
    await waitFor(() => expect(assign).toHaveBeenCalledTimes(1))
    const destination = new URL(assign.mock.calls[0][0], 'https://example.test')
    expect(destination.pathname).toBe('/sign-in')
    expect(destination.searchParams.get('returnTo')).toBe('/console/recharge?model=deepseek-test')
  })

  it('keeps card and detail prices identical, including cache writes in detail', async () => {
    const catalog = render(<ModelsPage />)
    const card = await screen.findByTestId('model-card-deepseek-test')
    expect(within(card).getByText('$0.285')).toBeVisible()
    expect(within(card).getByText('$0.57')).toBeVisible()
    expect(within(card).getByText('$0.30').tagName).toBe('DEL')
    expect(within(card).getByText('9.5 折')).toBeVisible()
    expect(within(await screen.findByTestId('model-card-cdance2.5-0807')).getByText('价格暂不可用')).toBeVisible()
    catalog.unmount()
    render(<ModelDetailPage modelName="deepseek-test" />)
    // The header spec bar repeats the two headline prices shown in the pricing panel.
    expect((await screen.findAllByText('$0.285')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('$0.57').length).toBeGreaterThan(0)
    expect(screen.getByText('$0.35625')).toBeVisible()
    expect(screen.getByText('缓存写入')).toBeVisible()
  })

  it('prices cards and details in yuan at the gateway rate on a CNY site', async () => {
    vi.stubGlobal('PORTAL_QUOTA_DISPLAY_TYPE', 'CNY')
    vi.stubGlobal('PORTAL_USD_EXCHANGE_RATE', 6.7)
    const catalog = render(<ModelsPage />)
    const card = await screen.findByTestId('model-card-deepseek-test')
    expect(within(card).getByText('¥1.9095')).toBeVisible()
    expect(within(card).getByText('¥2.01').tagName).toBe('DEL')
    expect(within(card).getAllByText('CNY / 百万 Token').length).toBeGreaterThan(0)
    catalog.unmount()
    render(<ModelDetailPage modelName="deepseek-test" />)
    expect((await screen.findAllByText('¥1.9095')).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/价格以 CNY 列示/).length).toBeGreaterThan(0)
  })

  it('prices every tier on the card and the detail page, naming the one the header quotes', async () => {
    const catalog = render(<ModelsPage />)
    const card = await screen.findByTestId('model-card-deepseek-v4.1-flash')
    // Both windows are priced, and `peak`/`off_peak` reach the visitor as copy, not as the
    // gateway's own identifiers.
    expect(within(card).getByText('闲时')).toBeVisible()
    expect(within(card).getByText('忙时')).toBeVisible()
    expect(within(card).getByText('$0.283575')).toBeVisible()
    expect(within(card).getByText('$0.141835')).toBeVisible()
    expect(within(card).queryByText('价格暂不可用')).not.toBeInTheDocument()
    // Six rows would double the card's height, so the cache rates wait for the detail page.
    expect(within(card).queryByText('缓存读取')).not.toBeInTheDocument()
    // Input-length bands render the same way, straight from the gateway's own labels.
    const banded = await screen.findByTestId('model-card-deepseek-banded-test')
    expect(within(banded).getByText('输入<=32k')).toBeVisible()
    expect(within(banded).getByText('32k<输入<=200k')).toBeVisible()
    catalog.unmount()

    render(<ModelDetailPage modelName="deepseek-v4.1-flash" />)
    // Named in the header facts and again in the capability matrix.
    expect((await screen.findAllByText('分档计费 · 按请求条件')).length).toBe(2)
    // Both tiers' cache read rates, the ones the card left out.
    expect(screen.getByText('$0.0056715')).toBeVisible()
    expect(screen.getByText('$0.00283575')).toBeVisible()
    // The header quotes one tier, so it has to say which — and it is the dearer one, even
    // though the gateway writes the cheap band first.
    expect(screen.getAllByText(/USD \/ 百万 Token · 忙时/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('$0.283575').length).toBeGreaterThan(1)
  })

  it('shows the expression as written when its price cannot be read, never a blank card', async () => {
    const expression = 'tier("base", p * 2 + c * 8 + vid * 30)'
    const futurePricing = { ...pricingFixture, data: [...pricingFixture.data, { model_name: 'future-test', vendor_id: 1, billing_mode: 'tiered_expr', enable_groups: ['default'], supported_endpoint_types: ['openai'], billing_expr: expression }] }
    vi.mocked(fetch).mockImplementation((url) => Promise.resolve(new Response(JSON.stringify(
      url === '/api/auth/status' ? { authenticated: false, profile: null } : futurePricing,
    ))))
    const catalog = render(<ModelsPage />)
    const card = await screen.findByTestId('model-card-future-test')
    expect(within(card).getByText('特殊计费表达式')).toBeVisible()
    expect(within(card).getByText(expression)).toBeVisible()
    expect(within(card).queryByText('价格暂不可用')).not.toBeInTheDocument()
    catalog.unmount()
    render(<ModelDetailPage modelName="future-test" />)
    expect(await screen.findByText(expression)).toBeVisible()
    expect(screen.getByText(/公式中的金额为美元（USD）/)).toBeVisible()
  })

  it('adds the group comparison table and the protocol chips', async () => {
    render(<ModelDetailPage modelName="deepseek-test" />)

    // Protocols appear in the header facts (and again in the example-code block).
    expect((await screen.findAllByText('/v1/chat/completions')).length).toBeGreaterThan(0)

    const groupPanel = screen.getByRole('heading', { name: 'deepseek-test 分组价格' }).closest('section') as HTMLElement
    expect(within(groupPanel).getByText('×0.95')).toBeVisible()
    expect(within(groupPanel).getByText('×1.5')).toBeVisible()
  })

  it('shows missing and failed models and can retry a failed catalog', async () => {
    let catalogFailed = false
    vi.mocked(fetch).mockImplementation((url) => {
      if (url === '/api/auth/status') return Promise.resolve(new Response(JSON.stringify({ authenticated: false, profile: null })))
      if (!catalogFailed) { catalogFailed = true; return Promise.reject(new Error('offline')) }
      return Promise.resolve(new Response(JSON.stringify(pricingFixture)))
    })
    render(<ModelDetailPage modelName="missing" />)
    await screen.findByRole('alert')
    await userEvent.click(screen.getByRole('button', { name: '重试' }))
    expect(await screen.findByRole('heading', { name: '未找到这个模型' })).toBeVisible()
  })

  it('renders English units without applying token labels to video prices', async () => {
    await i18n.changeLanguage('en')
    render(<ModelDetailPage modelName="seedance-test" />)
    expect((await screen.findAllByText('$0.095')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('USD / second').length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText('USD / 1M tokens')).not.toBeInTheDocument()
    expect(screen.getByText('5% off')).toBeVisible()
  })

  it('keeps only the vendors that serve the selected type', async () => {
    const user = userEvent.setup()
    render(<ModelsPage />)
    await screen.findByRole('link', { name: 'deepseek-test' })
    const vendorRow = screen.getByRole('group', { name: '供应商' })

    expect(within(vendorRow).getByRole('button', { name: 'DeepSeek' })).toBeVisible()
    expect(within(vendorRow).getByRole('button', { name: 'ByteDance' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: '图像' }))
    expect(within(vendorRow).queryByRole('button', { name: 'DeepSeek' })).not.toBeInTheDocument()
    expect(within(vendorRow).queryByRole('button', { name: 'ByteDance' })).not.toBeInTheDocument()
    expect(within(vendorRow).getByRole('button', { name: 'Independent' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: '视频' }))
    expect(within(vendorRow).getByRole('button', { name: 'ByteDance' })).toBeVisible()
    expect(within(vendorRow).queryByRole('button', { name: 'Independent' })).not.toBeInTheDocument()
  })

  it('clears a vendor selection that the new type cannot serve', async () => {
    const user = userEvent.setup()
    render(<ModelsPage />)
    await screen.findByRole('link', { name: 'deepseek-test' })

    await user.click(screen.getByRole('button', { name: 'DeepSeek' }))
    expect(window.location.search).toBe('?vendor=DeepSeek')

    await user.click(screen.getByRole('button', { name: '图像' }))
    expect(window.location.search).toBe('?type=image')
    expect(screen.getByRole('button', { name: '全部厂商' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('link', { name: 'image-test' })).toBeVisible()
  })

  it('paints a repeat visit from the cached catalog while the network stalls', async () => {
    const first = render(<ModelsPage />)
    await screen.findByRole('link', { name: 'deepseek-test' })
    first.unmount()

    // The catalog is cached for the session, so a stalled revalidation must not
    // keep the second visit on the skeleton.
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))
    render(<ModelsPage />)

    expect(await screen.findByRole('link', { name: 'deepseek-test' })).toBeVisible()
  })
})

