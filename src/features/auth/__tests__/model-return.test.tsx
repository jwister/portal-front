import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../../../i18n'
import { SignInPage } from '../SignInPage'
import { SignUpPage } from '../SignUpPage'
import { authSwitchUrl } from '../auth-links'

describe('model selection through registration and login', () => {
  const model = 'vendor/name?version=高清'
  const target = '/console/recharge?' + new URLSearchParams({ model })
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    window.history.replaceState({}, '', '/sign-up?' + new URLSearchParams({ returnTo: target }))
  })
  afterEach(() => { vi.unstubAllGlobals(); window.history.replaceState({}, '', '/') })

  it('preserves the exact model through registration success and the sign-in link', async () => {
    const user = userEvent.setup()
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
    render(<SignUpPage />)
    const link = screen.getByRole('link', { name: 'Sign in' })
    expect(new URL(link.getAttribute('href')!, 'https://example.test').searchParams.get('returnTo')).toBe(target)
    await user.type(screen.getByLabelText('Username'), 'test-user')
    await user.type(screen.getByLabelText('Email'), 'test@example.test')
    await user.type(screen.getByLabelText('Password'), 'test-password')
    await user.type(screen.getByLabelText('Confirm password'), 'test-password')
    await user.type(screen.getByLabelText('Email verification code'), '123456')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    await waitFor(() => expect(assign).toHaveBeenCalledWith(link.getAttribute('href')))
  })

  it.each([[5_000_000, '/console/recharge'], [5_000_001, '/console/tokens']])('rechecks account balance after login: %s', async (quota, path) => {
    const user = userEvent.setup()
    window.history.replaceState({}, '', '/sign-in?' + new URLSearchParams({ returnTo: target }))
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign })
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => Promise.resolve(url === '/api/auth/sign-in' ? new Response(null, { status: 204 }) : new Response(JSON.stringify({ availableQuota: quota, quotaPerUsd: 500_000 })))))
    render(<SignInPage />)
    expect(new URL(screen.getByRole('link', { name: 'Create account' }).getAttribute('href')!, 'https://example.test').searchParams.get('returnTo')).toBe(target)
    await user.type(screen.getByLabelText('Username'), 'test-user')
    await user.type(screen.getByLabelText('Password'), 'test-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(assign).toHaveBeenCalledWith(path + '?' + new URLSearchParams({ model })))
  })

  it('does not propagate an external return URL', () => {
    window.history.replaceState({}, '', '/sign-up?returnTo=//external.example')
    expect(new URL(authSwitchUrl('/sign-in'), 'https://example.test').searchParams.get('returnTo')).toBe('/console/dashboard')
  })
})
