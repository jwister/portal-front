import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { App } from '../App'
import i18n, { LOCALE_STORAGE_KEY } from '../i18n'

describe('portal application shell', () => {
  beforeEach(async () => {
    localStorage.clear()
    await i18n.changeLanguage('en')
  })

  it('shows public navigation and the primary console action', () => {
    render(<App />)

    const brand = screen.getByRole('link', { name: 'ZToken' })
    expect(brand.querySelector('img')).toHaveAttribute('src', '/logo1.png')
    expect(screen.getAllByRole('link', { name: 'Models' })[0]).toBeVisible()
    expect(screen.getAllByRole('link', { name: 'Purchase' })[0]).toBeVisible()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeVisible()
    expect(screen.queryByRole('link', { name: 'Create account' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Console' })).not.toBeInTheDocument()
  })

  it('switches language and persists the visitor preference', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '中文' }))

    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('zh-CN')
    expect(screen.getAllByRole('link', { name: '模型' })[0]).toBeVisible()
  })

  it('mounts the ledger system on public and authentication routes', () => {
    window.history.pushState({}, '', '/sign-in')
    const { unmount } = render(<App />)
    expect(screen.getByTestId('ledger-auth-page')).toBeVisible()

    unmount()
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(screen.getByTestId('ledger-public-page')).toBeVisible()
  })

  it('scopes the ledger treatment to catalog and purchase routes', () => {
    window.history.pushState({}, '', '/models')

    render(<App />)

    expect(screen.getByTestId('public-ledger-route')).toBeVisible()
  })

  it('renders the console dashboard at its direct route', { timeout: 30000 }, async () => {
    window.history.pushState({}, '', '/console/dashboard')
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ authenticated: true, profile: { id: 7, username: 'alice' } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        availableQuota: 900,
        usedQuota: 100,
        requestCount: 12,
        tokenUsage: null,
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        dailyUsage: [],
        topModels: [],
        tokenUsage: [],
      }), { status: 200 })))

    render(<App />)

    // The dashboard ships as its own route chunk (echarts included), so the first
    // import can take longer than the default 1s wait inside the test environment.
    expect(await screen.findByRole('heading', { name: 'Console overview' }, { timeout: 10000 })).toBeVisible()
  })

  it('renders the lazy catalog route with its ledger shell', { timeout: 30000 }, async () => {
    window.history.pushState({}, '', '/models')
    // A fresh Response per call: the header and the catalog both read the same fetch.
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      success: true,
      data: [{ id: 1, model_name: 'gpt-5-mini', vendor_name: 'OpenAI', enable_groups: ['default'], model_ratio: 1, quota_type: 0 }],
      vendors: [],
      group_ratio: { default: 1 },
      usable_group: { default: 'default' },
      supported_endpoint: {},
      auto_groups: [],
      pricing_version: 'v1',
    }), { status: 200 }))))

    render(<App />)

    expect(screen.getByTestId('public-ledger-route')).toBeVisible()
    expect(await screen.findByRole('link', { name: 'gpt-5-mini' }, { timeout: 20000 })).toBeVisible()
  })
})
