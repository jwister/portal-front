import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAuthStatus, type AuthStatus } from '../../../api/auth'
import { getDashboard, type DashboardSummary } from '../../../api/portal'
import i18n from '../../../i18n'
import { resolveModelDestination, useModelNavigation } from '../use-model'

vi.mock('../../../api/auth', () => ({ getAuthStatus: vi.fn() }))
vi.mock('../../../api/portal', () => ({ getDashboard: vi.fn() }))

const signedIn: AuthStatus = { authenticated: true, profile: { id: 1, username: 'demo' } }
const anonymous: AuthStatus = { authenticated: false, profile: null }

function dashboard(availableQuota: number, quotaPerUsd = 500_000): DashboardSummary {
  return { availableQuota, quotaPerUsd, usedQuota: 0, requestCount: 0, tokenUsage: 0 }
}

describe('model access destination', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getAuthStatus).mockResolvedValue(signedIn)
  })

  it('sends anonymous visitors to registration with a safe return path and exact model name', async () => {
    vi.mocked(getAuthStatus).mockResolvedValue(anonymous)
    const model = 'vendor/model?returnTo=https://example.com&variant=高清'
    const destination = new URL(await resolveModelDestination(model), 'https://portal.example')
    expect(destination.pathname).toBe('/sign-in')
    const returnTo = new URL(destination.searchParams.get('returnTo')!, destination.origin)
    expect(returnTo.origin).toBe(destination.origin)
    expect(returnTo.pathname).toBe('/console/recharge')
    expect(returnTo.searchParams.get('model')).toBe(model)
    expect([...returnTo.searchParams.keys()]).toEqual(['model'])
    expect(getDashboard).not.toHaveBeenCalled()
  })

  it.each([
    { balance: dashboard(5_000_001), path: '/console/tokens' },
    { balance: dashboard(5_000_000), path: '/console/recharge' },
    { balance: dashboard(4_999_999), path: '/console/recharge' },
    { balance: dashboard(0), path: '/console/recharge' },
    { balance: dashboard(-500_000), path: '/console/recharge' },
    { balance: dashboard(500_000, 0), path: '/console/recharge' },
    { balance: dashboard(500_000, -1), path: '/console/recharge' },
    { balance: dashboard(Number.NaN), path: '/console/recharge' },
    { balance: dashboard(Number.POSITIVE_INFINITY), path: '/console/recharge' },
    { balance: dashboard(500_000, Number.NaN), path: '/console/recharge' },
  ])('selects $path for quota $balance.availableQuota at rate $balance.quotaPerUsd', async ({ balance, path }) => {
    vi.mocked(getDashboard).mockResolvedValue(balance)
    expect(await resolveModelDestination('seedance-2.0')).toBe(`${path}?model=seedance-2.0`)
  })

  it('falls back to recharge when the balance service is unavailable', async () => {
    vi.mocked(getDashboard).mockRejectedValue(new Error('Network error'))
    expect(await resolveModelDestination()).toBe('/console/recharge')
  })

  it('does not interpret an unavailable authentication service as an anonymous visitor', async () => {
    vi.mocked(getAuthStatus).mockRejectedValue(new Error('Network error'))
    await expect(resolveModelDestination()).rejects.toThrow('Network error')
    expect(getDashboard).not.toHaveBeenCalled()
  })

  it('rejects malformed account status instead of sending the visitor to registration', async () => {
    vi.mocked(getAuthStatus).mockResolvedValue({} as AuthStatus)
    await expect(resolveModelDestination()).rejects.toThrow('Invalid account status')
    expect(getDashboard).not.toHaveBeenCalled()
  })
})

describe('useModelNavigation', () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    await i18n.changeLanguage('en')
  })

  it('only reads the account on click and ignores concurrent clicks on other cards', async () => {
    let finish!: (auth: AuthStatus) => void
    vi.mocked(getAuthStatus).mockReturnValue(new Promise((resolve) => { finish = resolve }))
    const navigate = vi.fn()
    const { result } = renderHook(() => useModelNavigation(navigate))
    expect(getAuthStatus).not.toHaveBeenCalled()

    let started!: Promise<void>
    act(() => {
      started = result.current.start('first-model')
      void result.current.start('second-model')
    })
    expect(result.current.pending).toBe(true)
    expect(result.current.pendingModelName).toBe('first-model')
    expect(getAuthStatus).toHaveBeenCalledTimes(1)

    await act(async () => { finish(anonymous); await started })
    expect(navigate).toHaveBeenCalledTimes(1)
    const destination = new URL(navigate.mock.calls[0][0], 'https://portal.example')
    expect(destination.searchParams.get('returnTo')).toBe('/console/recharge?model=first-model')
    expect(result.current.pending).toBe(false)
  })

  it.each([
    ['en', 'Unable to check your account. Please try again.'],
    ['zh-CN', '暂时无法读取账户状态，请重试。'],
  ])('shows a retry message in %s after an auth failure and allows the next attempt', async (language, message) => {
    await i18n.changeLanguage(language)
    vi.mocked(getAuthStatus).mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce(anonymous)
    const navigate = vi.fn()
    const { result } = renderHook(() => useModelNavigation(navigate))
    await act(async () => { await result.current.start('model') })
    expect(navigate).not.toHaveBeenCalled()
    expect(result.current.error).toBe(message)
    expect(result.current.pending).toBe(false)

    await act(async () => { await result.current.start('model') })
    expect(result.current.error).toBeNull()
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(getAuthStatus).toHaveBeenCalledTimes(2)
  })

  it('does not navigate after leaving the catalog during an account request', async () => {
    let finish!: (auth: AuthStatus) => void
    vi.mocked(getAuthStatus).mockReturnValue(new Promise((resolve) => { finish = resolve }))
    const navigate = vi.fn()
    const { result, unmount } = renderHook(() => useModelNavigation(navigate))
    let started!: Promise<void>
    act(() => { started = result.current.start('model') })
    unmount()
    await act(async () => { finish(anonymous); await started })
    expect(navigate).not.toHaveBeenCalled()
  })
})
