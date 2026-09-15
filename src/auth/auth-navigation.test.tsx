import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PublicHeader } from '../components/PublicHeader'
import { HomePage } from '../features/home/HomePage'
import i18n from '../i18n'

describe('login-aware public links', () => {
  beforeEach(async () => {
    window.history.replaceState({}, '', '/')
    await i18n.changeLanguage('en')
  })
  afterEach(() => { vi.unstubAllGlobals() })

  it.each([false, true])('routes homepage and navigation links using authenticated=%s', async (authenticated) => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      authenticated, profile: authenticated ? { id: 1, username: 'test' } : null,
    }))))
    vi.stubGlobal('fetch', fetchMock)
    render(<><PublicHeader /><HomePage /></>)
    const start = screen.getAllByRole('link', { name: i18n.t('home.start') })
    const buy = [...screen.getAllByRole('link', { name: i18n.t('home.buyNow') }), screen.getByRole('link', { name: 'Purchase' })]
    await waitFor(() => expect(screen.getByRole('button', { name: authenticated ? 'Console' : 'Sign in' })).toHaveAttribute('aria-busy', 'false'))
    for (const link of start) expect(link).toHaveAttribute('href', authenticated ? '/console/dashboard' : '/sign-in?returnTo=%2Fconsole%2Fdashboard')
    for (const link of buy) expect(link).toHaveAttribute('href', authenticated ? '/purchase' : '/sign-in?returnTo=%2Fpurchase')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('waits for a pending status response when the visitor clicks immediately', async () => {
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign })
    let finish!: (response: Response) => void
    const fetchMock = vi.fn().mockImplementation(() => new Promise<Response>((resolve) => { finish = resolve }))
    vi.stubGlobal('fetch', fetchMock)
    render(<><PublicHeader /><HomePage /></>)
    await userEvent.setup().click(screen.getAllByRole('link', { name: i18n.t('home.start') })[0])
    expect(assign).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await act(async () => { finish(new Response(JSON.stringify({ authenticated: true, profile: { id: 1, username: 'test' } }))) })
    expect(assign).toHaveBeenCalledWith('/console/dashboard')
  })
})
