import brandLogo from '../../../assets/brand-logo.webp'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SignInPage } from '../SignInPage'

describe('SignInPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the shared ZToken logo', () => {
    render(<SignInPage />)

    const brand = screen.getByRole('link', { name: 'ZToken' })
    expect(brand.querySelector('img')).toHaveAttribute('src', brandLogo)
  })

  it('posts entered credentials to the portal login endpoint', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    render(<SignInPage onAuthenticated={vi.fn()} />)
    await user.type(screen.getByLabelText('Username'), 'alice@example.com')
    await user.type(screen.getByLabelText('Password'), 'password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/sign-in', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ username: 'alice@example.com', password: 'password' }),
    }))
    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute('href', '/sign-up')
  })

  it('accepts a NewAPI username without requiring an email address', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    render(<SignInPage onAuthenticated={vi.fn()} />)
    await user.type(screen.getByLabelText('Username'), 'alice')
    await user.type(screen.getByLabelText('Password'), 'password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/sign-in', expect.objectContaining({
      body: JSON.stringify({ username: 'alice', password: 'password' }),
    }))
  })

  it('shows a server-provided error message when sign-in fails', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        githubEnabled: false, githubClientId: '', oidcEnabled: false, oidcClientId: '',
        oidcAuthorizationEndpoint: '', oidcDisplayName: 'Google',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Unable to verify sign-in details' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      }))
    vi.stubGlobal('fetch', fetchMock)
    render(<SignInPage onAuthenticated={vi.fn()} />)
    await user.type(screen.getByLabelText('Username'), 'alice@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    const messages = await screen.findAllByText('Unable to verify sign-in details')
    expect(messages.length).toBeGreaterThanOrEqual(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('keeps the submit button busy while the request is pending', async () => {
    let resolveFetch: (response: Response) => void = () => undefined
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => { resolveFetch = resolve }))
    vi.stubGlobal('fetch', fetchMock)
    render(<SignInPage onAuthenticated={vi.fn()} />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Username'), 'alice@example.com')
    await user.type(screen.getByLabelText('Password'), 'password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    const submitButton = screen.getByRole('button', { name: 'Sign in' })
    expect(fetchMock).toHaveBeenCalled()
    // Prevent duplicate submissions and expose the pending state accessibly.
    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveAttribute('aria-busy', 'true')
    resolveFetch(new Response(null, { status: 204 }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sign in' })).toHaveAttribute('aria-busy', 'false'))
  })

  it('requests a one-time state before starting GitHub OAuth', async () => {
    const user = userEvent.setup()
    const onOAuthNavigate = vi.fn()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        githubEnabled: true,
        githubClientId: 'github-client',
        oidcEnabled: false,
        oidcClientId: '',
        oidcAuthorizationEndpoint: '',
        oidcDisplayName: 'Google',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ state: 'flow-token' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      }))
    vi.stubGlobal('fetch', fetchMock)

    render(<SignInPage onOAuthNavigate={onOAuthNavigate} />)
    await user.click(await screen.findByRole('button', { name: 'Continue with GitHub' }))

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/auth/oauth/providers', expect.objectContaining({
      credentials: 'include',
    }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/auth/oauth/github/state', expect.objectContaining({
      method: 'POST', credentials: 'include',
    }))
    expect(onOAuthNavigate).toHaveBeenCalledWith(expect.stringContaining('state=flow-token'))
  })

  it('focuses the first invalid field without attempting a login', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<SignInPage />)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByLabelText('Username')).toHaveFocus()
    expect(screen.getByLabelText('Username')).toHaveAttribute('aria-invalid', 'true')
    expect(fetchMock.mock.calls.every(([path]) => path === '/api/auth/oauth/providers')).toBe(true)
  })

  it('reveals and hides the password without submitting the form', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<SignInPage />)
    const password = screen.getByLabelText('Password')
    await user.type(password, 'example-password')
    await user.click(screen.getByRole('button', { name: 'Show Password' }))
    expect(password).toHaveAttribute('type', 'text')
    expect(password).toHaveValue('example-password')
    await user.click(screen.getByRole('button', { name: 'Hide Password' }))
    expect(password).toHaveAttribute('type', 'password')
    expect(fetchMock.mock.calls.every(([path]) => path === '/api/auth/oauth/providers')).toBe(true)
  })
})
