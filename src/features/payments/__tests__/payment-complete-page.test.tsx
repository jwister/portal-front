import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '../../../i18n'
import { PaymentCompletePage } from '../PaymentCompletePage'

const paidOrder = {
  orderNo: 'PO-PAID-1', amountUsdMinor: 2550, quotaToCredit: 12_750_000, method: 'USDT_TRC20', status: 'PAID',
  expiresAt: '2026-09-02T01:00:00Z', confirmedAt: '2026-09-02T00:05:00Z', creditedAt: '2026-09-02T00:06:00Z', createdAt: '2026-09-02T00:00:00Z',
}

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

async function settleOrderLoad(): Promise<void> {
  await act(async () => { await Promise.resolve(); await Promise.resolve() })
}

describe('PaymentCompletePage', () => {
  const assign = vi.fn()

  beforeEach(async () => {
    await i18n.changeLanguage('en')
    assign.mockReset()
    window.history.replaceState({}, '', '/console/payment-complete?orderNo=PO-PAID-1')
    vi.stubGlobal('location', { ...window.location, assign })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('shows only the server-confirmed paid order and starts at five seconds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(paidOrder)))

    render(<PaymentCompletePage />)

    expect(await screen.findByRole('heading', { name: 'Payment complete' })).toBeVisible()
    expect(screen.getByText('PO-PAID-1')).toBeVisible()
    expect(screen.getByText('$25.50')).toBeVisible()
    expect(screen.getByText('12,750,000')).toBeVisible()
    expect(screen.getByText(/5 seconds/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Create API key now' })).toBeVisible()
  })

  it('redirects to the dashboard after five seconds', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(paidOrder)))

    render(<PaymentCompletePage />)
    await settleOrderLoad()
    expect(screen.getByRole('heading', { name: 'Payment complete' })).toBeVisible()
    await act(async () => { vi.advanceTimersByTime(5_000) })

    expect(assign).toHaveBeenCalledWith('/console/dashboard')
  })

  it('stops the countdown when the user opens API key management', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(paidOrder)))
    render(<PaymentCompletePage />)
    await settleOrderLoad()
    fireEvent.click(screen.getByRole('button', { name: 'Create API key now' }))
    await act(async () => { vi.advanceTimersByTime(5_000) })

    expect(assign).toHaveBeenCalledTimes(1)
    expect(assign).toHaveBeenCalledWith('/console/tokens')
  })

  it('does not claim success or start a redirect for an unpaid order', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ ...paidOrder, status: 'CONFIRMED' })))

    render(<PaymentCompletePage />)

    await settleOrderLoad()
    expect(screen.getByRole('heading', { name: 'Order not credited yet' })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Payment complete' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Create API key now' })).not.toBeInTheDocument()
    await act(async () => { vi.advanceTimersByTime(5_000) })
    expect(assign).not.toHaveBeenCalled()
  })
})
