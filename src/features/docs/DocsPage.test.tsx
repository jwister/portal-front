import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../../i18n'
import { DocsPage, requestExamples } from './DocsPage'
import { pricingFixture } from '../catalog/__tests__/pricing-fixture'

describe('Ztoken documentation', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('zh-CN')
    window.history.replaceState({}, '', '/docs?model=seedance-test')
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify(pricingFixture)))))
  })
  afterEach(() => { vi.unstubAllGlobals(); window.history.replaceState({}, '', '/') })
  it('uses a supported chat model and copies each language example with the correct endpoint', async () => {
    const user = userEvent.setup()
    render(<DocsPage path="/docs" />)
    const select = await screen.findByRole('combobox', { name: '示例模型' })
    expect(select).toHaveValue('deepseek-test')
    expect(screen.getByText(/所选模型 seedance-test 不适用于/)).toBeVisible()
    expect(window.location.pathname).toBe('/docs/guides/quick-start')
    for (const lang of ['cURL', 'Python', 'JavaScript']) {
      await user.click(screen.getByRole('button', { name: lang }))
      await user.click(screen.getByRole('button', { name: '复制代码' }))
      const code = await navigator.clipboard.readText()
      expect(code).toContain('https://api.ztoken.cc/v1')
      expect(code).toContain('deepseek-test')
      expect(code).not.toContain('pay.ztoken.cc')
      expect(code).not.toContain('\n+  -')
    }
    for (const link of screen.getAllByRole('link').filter((link) => link.getAttribute('href')?.startsWith('#'))) {
      expect(document.getElementById(link.getAttribute('href')!.slice(1))).not.toBeNull()
    }
  })
  it('lists the live protocols and the tool setup guides', async () => {
    const view = render(<DocsPage path="/docs/api" />)

    // The protocol table is built from the catalog, so the fixture's endpoint shows up.
    expect(await screen.findByText('/v1/chat/completions')).toBeVisible()
    expect(screen.getByText('OpenAI 兼容')).toBeVisible()

    view.rerender(<DocsPage path="/docs/guides/tools" />)
    // The section heading and the on-this-page link share the title, so start from the heading.
    const endpoints = screen.getByRole('heading', { name: '地址与密钥' }).closest('section') as HTMLElement
    expect(within(endpoints).getByText('https://api.ztoken.cc/v1')).toBeVisible()
    expect(within(endpoints).getByText('https://api.ztoken.cc')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Claude Code' })).toBeVisible()
  })

  it('escapes model names as data inside shell and SDK examples', () => {
    const examples = requestExamples('vendor/"quote\'$(id)\\name')
    expect(examples.cURL).toContain("'\"'\"'")
    expect(examples.Python).toContain('model="vendor/\\"quote\'$(id)\\\\name"')
    expect(examples.JavaScript).toContain('process.env.ZTOKEN_API_KEY')
  })
  it('renders English troubleshooting and missing article states', async () => {
    await i18n.changeLanguage('en')
    const view = render(<DocsPage path="/docs/troubleshooting" />)
    expect(screen.getByRole('heading', { name: 'Troubleshooting' })).toBeVisible()
    expect(screen.getByText('401')).toBeVisible()
    view.rerender(<DocsPage path="/docs/missing" />)
    expect(screen.getByRole('heading', { name: 'Documentation not found' })).toBeVisible()
  })
})

