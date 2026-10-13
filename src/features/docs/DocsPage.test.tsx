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
    expect(select).toHaveTextContent('deepseek-test')
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

  it('loads tool and skill articles from their own chunks', async () => {
    const user = userEvent.setup()
    render(<DocsPage path="/docs/skills" />)
    expect(await screen.findByRole('heading', { name: 'Superpowers' })).toBeVisible()
    expect(within(screen.getByRole('navigation', { name: '文档导航' })).getByText('工具与 Skill')).toBeVisible()
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent))
      .toEqual(['通用安装方式', 'Superpowers', 'Skills For Real Engineers', 'Anthropic Skills', 'Ponytail', 'UI UX Pro Max'])
    const section = screen.getByRole('heading', { name: 'Anthropic Skills' }).closest('section') as HTMLElement
    await user.click(within(section).getByRole('button', { name: '其他工具' }))
    await user.click(within(section).getByRole('button', { name: '复制代码' }))
    expect(await navigator.clipboard.readText()).toBe('npx skills@latest add anthropics/skills')
  })
  it('moves between articles without reloading the page', async () => {
    const user = userEvent.setup()
    const routeChange = vi.fn()
    window.addEventListener('popstate', routeChange)
    render(<DocsPage path="/docs/guides/tools" />)
    await user.click(screen.getByRole('link', { name: '命令行工具' }))
    expect(window.location.pathname).toBe('/docs/tools/cli')
    expect(window.location.search).toBe('?model=seedance-test')
    expect(routeChange).toHaveBeenCalledTimes(1)
    window.removeEventListener('popstate', routeChange)
    // Anchors on the same page stay with the browser, which only updates the hash.
    await user.click(screen.getAllByRole('link', { name: '地址与密钥' })[0])
    expect(window.location.pathname).toBe('/docs/tools/cli')
    expect(window.location.hash).toBe('#base')
  })
  it('fills the live ZToken address into tool setup snippets', async () => {
    render(<DocsPage path="/docs/tools/cli" />)
    const codex = (await screen.findByRole('heading', { name: 'Codex CLI' })).closest('section') as HTMLElement
    expect(within(codex).getByText('https://api.ztoken.cc/v1')).toBeVisible()
    expect(within(codex).getByText(/base_url = "https:\/\/api\.ztoken\.cc\/v1"/)).toBeVisible()
    // Anthropic-protocol tools take the bare host.
    const claude = screen.getByRole('heading', { name: 'Claude Code' }).closest('section') as HTMLElement
    expect(within(claude).getByText('https://api.ztoken.cc')).toBeVisible()
    expect(within(claude).queryByText(/\{host\}|\{baseUrl\}/)).toBeNull()
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

