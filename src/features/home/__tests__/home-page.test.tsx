import githubIcon from '../../../assets/github.webp'
import googleIcon from '../../../assets/google.webp'
import mailIcon from '../../../assets/mail.webp'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '../../../i18n'
import { HomePage } from '../HomePage'

/** Minimal stand-in for the browser observer so the reveal logic can be driven by hand. */
class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []
  readonly observed = new Set<Element>()
  constructor(readonly callback: IntersectionObserverCallback) {
    MockIntersectionObserver.instances.push(this)
  }
  observe(element: Element): void { this.observed.add(element) }
  unobserve(element: Element): void { this.observed.delete(element) }
  disconnect(): void { this.observed.clear() }
}

describe('HomePage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('zh-CN')
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ authenticated: false, profile: null })))))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    MockIntersectionObserver.instances = []
  })

  it('renders the API hero, onboarding steps, and API-key action', () => {
    render(<HomePage />)

    expect(screen.getByRole('heading', { name: '统一 API 网关，服务于 所有 AI 模型' })).toBeVisible()
    expect(screen.getByText('注册账号')).toBeVisible()
    expect(screen.getByText('购买额度')).toBeVisible()
    expect(screen.getByText('获取 API Key')).toBeVisible()
    expect(screen.getAllByRole('link', { name: '开始使用' })[0]).toHaveAttribute('href', '/sign-in?returnTo=%2Fconsole%2Fdashboard')
  })

  it('advertises the sign-up gift the deployment configures', () => {
    vi.stubGlobal('PORTAL_QUOTA_FOR_NEW_USER', 100000)
    render(<HomePage />)

    const heroOffer = screen.getAllByText('10万 Token')[0].closest('a') as HTMLElement
    expect(heroOffer).toHaveTextContent('新人福利注册即送 10万 Token 额度')
    expect(heroOffer).toHaveAttribute('href', '/sign-in?returnTo=%2Fconsole%2Fdashboard')
    expect(screen.getAllByText('新用户赠送额度仅用于测试')).toHaveLength(2)
    const balanceStep = screen.getByText('购买额度').closest('article') as HTMLElement
    expect(within(balanceStep).getByText('10万')).toBeVisible()
  })

  it('falls back to the default gift when the config script has not run', () => {
    render(<HomePage />)

    expect(screen.getAllByText('30万 Token')).toHaveLength(2)
  })

  it('hides every mention of the gift when the deployment gives none', () => {
    vi.stubGlobal('PORTAL_QUOTA_FOR_NEW_USER', 0)
    const { container } = render(<HomePage />)

    expect(container.querySelector('.reference-gift')).toBeNull()
    expect(container.querySelector('.reference-mini-balance')).toBeNull()
    expect(screen.queryByText('新用户赠送额度仅用于测试')).toBeNull()
  })

  it('prerenders the default gift so hydration matches the build output', () => {
    vi.stubGlobal('PORTAL_QUOTA_FOR_NEW_USER', 100000)

    expect(renderToString(<HomePage />)).toContain('30万 Token')
  })

  it('starts the assurance and metric bands at the same time', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    const { container } = render(<HomePage />)

    const assurance = container.querySelector('.reference-trust > div') as HTMLElement
    const metric = container.querySelector('.reference-stats > div') as HTMLElement
    expect(assurance).toHaveClass('reveal-on-scroll')
    expect(metric).not.toHaveClass('is-visible')

    const observer = MockIntersectionObserver.instances[0]
    observer.callback(
      [{ target: assurance, isIntersecting: true } as unknown as IntersectionObserverEntry],
      observer as unknown as IntersectionObserver,
    )

    expect(assurance).toHaveClass('is-visible')
    expect(metric).toHaveClass('is-visible')
  })

  it('renders the five compliance terms with the last two flagged as danger', () => {
    render(<HomePage />)

    const section = screen.getByRole('heading', { name: '免责与合规声明' }).closest('section') as HTMLElement
    const terms = within(section).getAllByRole('article')
    expect(terms).toHaveLength(5)
    expect(terms[0]).not.toHaveClass('reference-notice-danger')
    expect(terms[3]).toHaveClass('reference-notice-danger')
    expect(terms[4]).toHaveClass('reference-notice-danger')
    expect(within(terms[3]).getByText('色情、暴力、政治敏感、诈骗')).toHaveClass('reference-notice-highlight')
    expect(within(terms[4]).getByText('开发测试')).toHaveClass('reference-notice-highlight')
    expect(within(section).getByText('使用本服务即表示您同意以上条款与条件')).toBeVisible()
  })

  it('sends each account shortcut to sign-in with its provider logo', () => {
    render(<HomePage />)

    const accountStep = screen.getByText('注册账号').closest('article') as HTMLElement
    const shortcuts: [string, string][] = [
      ['GitHub', githubIcon],
      ['Google', googleIcon],
      [i18n.t('auth.email'), mailIcon],
    ]
    for (const [name, logo] of shortcuts) {
      const link = within(accountStep).getByRole('link', { name })
      expect(link).toHaveAttribute('href', '/sign-in')
      expect(link.querySelector('img')).toHaveAttribute('src', logo)
    }
  })

  it('switches API examples by click and automatically rotates them', () => {
    vi.useFakeTimers()
    render(<HomePage />)

    expect(screen.getByRole('tab', { name: 'Chat' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('tab', { name: 'Claude' }))
    expect(screen.getByRole('tabpanel')).toHaveTextContent('/v1/messages')

    act(() => vi.advanceTimersByTime(4200))
    expect(screen.getByRole('tab', { name: 'Gemini' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('/v1beta/models/{model}:generateContent')
  })

  it('keeps phone examples stable until the visitor switches tabs', () => {
    vi.useFakeTimers()
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    try {
      render(<HomePage />)
      act(() => vi.advanceTimersByTime(12600))
      expect(screen.getByRole('tab', { name: 'Chat' })).toHaveAttribute('aria-selected', 'true')
      fireEvent.click(screen.getByRole('tab', { name: 'Gemini' }))
      act(() => vi.advanceTimersByTime(8400))
      expect(screen.getByRole('tab', { name: 'Gemini' })).toHaveAttribute('aria-selected', 'true')
    } finally { vi.unstubAllGlobals() }
  })
})
