import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '../../../i18n'
import { OrdersPage } from '../OrdersPage'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function order(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    orderNo: 'PO-1', amountUsdMinor: 2550, quotaToCredit: 12_750_000,
    method: 'PAYPAL', status: 'WAITING_PAYMENT', expiresAt: '2026-09-02T01:00:00Z',
    confirmedAt: null, creditedAt: null, createdAt: '2026-09-02T00:00:00Z', ...overrides,
  }
}

describe('OrdersPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('lists the current user orders from the payment API instead of an empty placeholder', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        items: [
          {
            orderNo: 'PO-1',
            amountUsdMinor: 2550,
            quotaToCredit: 12_750_000,
            method: 'PAYPAL',
            status: 'PAID',
            expiresAt: '2026-09-02T01:00:00Z',
            confirmedAt: '2026-09-02T00:05:00Z',
            creditedAt: '2026-09-02T00:06:00Z',
            createdAt: '2026-09-02T00:00:00Z',
          },
        ],
        page: 1,
        pageSize: 20,
        total: 8,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByText('PO-1')).toBeVisible()
    })

    expect(screen.getByText('$25.50')).toBeVisible()
    expect(screen.getByText('12,750,000')).toBeVisible()
    expect(screen.getByText('PayPal')).toBeVisible()
    expect(screen.getByText('Completed orders (this page)')).toBeVisible()
    expect(screen.getByText('Pending orders (this page)')).toBeVisible()
    expect(screen.getByText('Total orders').closest('section')).toHaveTextContent('8')
    expect(fetchMock).toHaveBeenCalledWith('/api/payments/orders?page=1&pageSize=20', expect.objectContaining({
      credentials: 'include',
    }))
  })

  it('shows an empty state when the customer has no orders yet', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ items: [], page: 1, pageSize: 20, total: 0 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<OrdersPage />)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Go to recharge/ })).toBeVisible()
    })
    expect(screen.queryByText('Order management is coming soon.')).not.toBeInTheDocument()
  })

  it('opens a read-only detail dialog when an already paid order is double-clicked', async () => {
    const paidOrder = order({ status: 'PAID' })
    const fetchMock = vi.fn((path: string) => {
      if (path === '/api/payments/orders?page=1&pageSize=20') return Promise.resolve(jsonResponse({ items: [paidOrder], page: 1, pageSize: 20, total: 1 }))
      if (path === '/api/payments/orders/PO-1') return Promise.resolve(jsonResponse(paidOrder))
      throw new Error(`Unexpected request: ${path}`)
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<OrdersPage />)
    await screen.findByText('PO-1')
    await user.dblClick(screen.getByText('PO-1').closest('tr')!)

    expect(await screen.findByRole('dialog', { name: 'Order details' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Cancel order' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Transaction ID')).not.toBeInTheDocument()
  })

  it('provides view and waiting-order cancellation actions in the last table column', async () => {
    const waitingOrder = order()
    const fetchMock = vi.fn((path: string) => {
      if (path === '/api/payments/orders?page=1&pageSize=20') return Promise.resolve(jsonResponse({ items: [waitingOrder], page: 1, pageSize: 20, total: 1 }))
      if (path === '/api/payments/orders/PO-1') return Promise.resolve(jsonResponse(waitingOrder))
      throw new Error(`Unexpected request: ${path}`)
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<OrdersPage />)
    await screen.findByText('PO-1')

    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'View order PO-1' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Cancel order PO-1' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'View order PO-1' }))
    expect(await screen.findByRole('dialog', { name: 'Order details' })).toBeVisible()
  })

  it('cancels a waiting order and refreshes the order list', async () => {
    const waitingOrder = order()
    const cancelledOrder = order({ status: 'CANCELLED' })
    let listRequests = 0
    const fetchMock = vi.fn((path: string) => {
      if (path === '/api/payments/orders?page=1&pageSize=20') {
        listRequests += 1
        return Promise.resolve(jsonResponse({ items: [listRequests === 1 ? waitingOrder : cancelledOrder], page: 1, pageSize: 20, total: 1 }))
      }
      if (path === '/api/payments/orders/PO-1') return Promise.resolve(jsonResponse(waitingOrder))
      if (path === '/api/payments/orders/PO-1/cancel') return Promise.resolve(jsonResponse(cancelledOrder))
      throw new Error(`Unexpected request: ${path}`)
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<OrdersPage />)
    await screen.findByText('PO-1')
    await user.dblClick(screen.getByText('PO-1').closest('tr')!)
    await user.click(await screen.findByRole('button', { name: 'Cancel order' }))
    expect(screen.queryByLabelText('Transaction ID')).not.toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Confirm cancellation' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/payments/orders/PO-1/cancel', expect.objectContaining({
      method: 'POST', credentials: 'include',
    })))
    await waitFor(() => expect(screen.getAllByText('Cancelled').length).toBeGreaterThanOrEqual(2))
  })

  it('lets a waiting TRC20 order submit a replacement transaction ID', async () => {
    const trc20Order = order({ orderNo: 'PO-TRON-1', method: 'USDT_TRC20' })
    const txid = 'a'.repeat(64)
    const fetchMock = vi.fn((path: string) => {
      if (path === '/api/payments/orders?page=1&pageSize=20') return Promise.resolve(jsonResponse({ items: [trc20Order], page: 1, pageSize: 20, total: 1 }))
      if (path === '/api/payments/orders/PO-TRON-1') return Promise.resolve(jsonResponse(trc20Order))
      if (path === '/api/payments/orders/PO-TRON-1/trc20/status') return Promise.resolve(jsonResponse({
        receiveAddress: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE', payableAmount: '1.01', payableCurrency: 'USDT',
        status: 'WAITING_PAYMENT', expiresAt: trc20Order.expiresAt, txidCheckResult: 'SUBMITTED',
      }))
      if (path === '/api/payments/orders/PO-TRON-1/trc20/txid') return Promise.resolve(jsonResponse({ result: 'CONFIRMED' }))
      throw new Error(`Unexpected request: ${path}`)
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<OrdersPage />)
    await screen.findByText('PO-TRON-1')
    await user.dblClick(screen.getByText('PO-TRON-1').closest('tr')!)

    expect(await screen.findByText('TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE')).toBeVisible()
    expect(screen.getByText('1.01 USDT')).toBeVisible()
    await user.type(screen.getByLabelText('Transaction ID'), txid)
    await user.click(screen.getByRole('button', { name: 'Verify transaction' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/payments/orders/PO-TRON-1/trc20/txid', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ txid }),
    })))
  })
})
