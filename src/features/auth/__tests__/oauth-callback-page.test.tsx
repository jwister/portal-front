import brandLogo from '../../../assets/brand-logo.webp'
import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { OAuthCallbackPage } from '../OAuthCallbackPage'
import { rememberOAuthReturn, readOAuthCallbackParameters } from '../auth-links'

const { trackRegistration } = vi.hoisted(() => ({ trackRegistration: vi.fn().mockResolvedValue(undefined) }))
vi.mock('../../../support/google-ads', () => ({ trackRegistration }))

describe('OAuthCallbackPage', () => {
  afterEach(() => {
    vi.useRealTimers()
    trackRegistration.mockClear()
    vi.unstubAllGlobals()
    sessionStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('shows the retry time without replaying the OAuth authorization code', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 429, headers: { 'Retry-After': '2' } }))
    vi.stubGlobal('fetch', fetchMock)
    window.history.replaceState({}, '', '/oauth/oidc?code=provider-code&state=flow-token')
    render(<OAuthCallbackPage provider="oidc" />)
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    expect(screen.getByRole('alert')).toHaveTextContent('Too many requests. Try again in 2 seconds.')
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled()
    await act(async () => { vi.advanceTimersByTime(2000) })
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(trackRegistration).not.toHaveBeenCalled()
  })

  it.each(['github', 'oidc'] as const)('reports only genuinely new %s accounts', async (provider) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ isNewUser: true }), { status: 200 })))
    window.history.replaceState({}, '', `/oauth/${provider}?code=provider-code&state=flow-token`)
    const onAuthenticated = vi.fn()
    render(<OAuthCallbackPage provider={provider} onAuthenticated={onAuthenticated} />)
    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledOnce())
    expect(trackRegistration).toHaveBeenCalledOnce()
  })

  it('does not report an existing OAuth account as a registration', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ isNewUser: false }), { status: 200 })))
    window.history.replaceState({}, '', '/oauth/github?code=provider-code&state=flow-token')
    const onAuthenticated = vi.fn()
    render(<OAuthCallbackPage provider="github" onAuthenticated={onAuthenticated} />)
    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledOnce())
    expect(trackRegistration).not.toHaveBeenCalled()
  })

  it('uses the shared ZToken logo', () => {
    render(<OAuthCallbackPage provider="github" />)

    const brand = screen.getByRole('link', { name: 'ZToken' })
    expect(brand.querySelector('img')).toHaveAttribute('src', brandLogo)
  })

  it('completes the provider callback before entering the console', async () => {
    const onAuthenticated = vi.fn()
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    window.history.replaceState({}, '', '/oauth/github?code=provider-code&state=flow-token')

    // 模拟 main 在统计脚本启动前提取授权参数，页面稍后仍应正确完成认证。
    readOAuthCallbackParameters()
    expect(window.location.search).toBe('')

    render(<OAuthCallbackPage provider="github" onAuthenticated={onAuthenticated} />)

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledOnce())
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/oauth/github/complete', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ code: 'provider-code', state: 'flow-token', error: null, errorDescription: null }),
    }))
  })

  it('does not submit malformed callbacks', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    window.history.replaceState({}, '', '/oauth/github?state=flow-token')

    render(<OAuthCallbackPage provider="github" />)

    expect(await screen.findByRole('alert')).toHaveTextContent('OAuth sign-in could not be completed.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each(['github', 'oidc'] as const)('returns to purchase after %s login', async (provider) => {
    window.history.replaceState({}, '', '/sign-in?returnTo=%2Fpurchase')
    rememberOAuthReturn(provider, 'purchase-flow')
    window.history.replaceState({}, '', `/oauth/${provider}?code=provider-code&state=purchase-flow`)
    const replace = vi.fn()
    vi.stubGlobal('location', { ...window.location, replace })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
    render(<OAuthCallbackPage provider={provider} />)
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/purchase'))
    expect(sessionStorage.getItem(`ztoken.oauth.returnTo:${provider}:purchase-flow`)).toBeNull()
  })
})
