import brandLogo from '../../../assets/brand-logo.webp'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { OAuthCallbackPage } from '../OAuthCallbackPage'
import { rememberOAuthReturn } from '../auth-links'

describe('OAuthCallbackPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    sessionStorage.clear()
    window.history.replaceState({}, '', '/')
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
