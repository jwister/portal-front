import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '../../../i18n'
import { RechargePage } from '../RechargePage'

let completionHandler: ((order: { orderNo: string; status: string }) => void) | undefined

vi.mock('../PayPalCheckout', () => ({
  PayPalCheckout: ({ onCompleted }: { onCompleted: (order: { orderNo: string; status: string }) => void }) => {
    completionHandler = onCompleted
    return <div>PayPal checkout</div>
  },
}))

describe('RechargePage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => url === '/api/auth/status' ? Promise.resolve(new Response(JSON.stringify({ authenticated: true, profile: { id: 1, username: 'test' } }))) : Promise.reject(new Error('Order request recorded'))))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    completionHandler = undefined
  })

  it('shows the shared amount selector with PayPal and TRC20 icon options', async () => {
    const fetchMock = vi.mocked(fetch)
    const user = userEvent.setup()
    render(<RechargePage />)

    expect(screen.getByRole('heading', { name: 'Recharge balance' })).toBeVisible()
    expect(screen.getByText('Choose a recharge amount, confirm payment, then wait for the recharge to complete.')).toBeVisible()
    expect(screen.getByRole('button', { name: '$500' })).toBeVisible()
    expect(screen.getByRole('radio', { name: 'PayPal' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'TRC20 USDT' })).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Confirm payment' })).toBeVisible()
    expect(screen.queryByText(/Authorize the charge/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Continue with PayPal' })).not.toBeInTheDocument()
    expect(screen.queryByText('Other payment method')).not.toBeInTheDocument()
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '$50' }))
    await user.click(screen.getByRole('button', { name: 'Confirm payment' }))

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [, init] = fetchMock.mock.calls[1]
    const body = String((init as RequestInit).body)
    expect(body).toContain('"amount":"50"')
    expect(body).toContain('"method":"PAYPAL"')
  })

  it('opens the completion page only after the server reports the order as paid', async () => {
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign })
    vi.mocked(fetch).mockImplementation((url) => {
      if (url === '/api/auth/status') {
        return Promise.resolve(new Response(JSON.stringify({ authenticated: true, profile: { id: 1, username: 'test' } })))
      }
      if (url === '/api/payments/orders') {
        return Promise.resolve(new Response(JSON.stringify({
          orderNo: 'PO-1',
          status: 'WAITING_PAYMENT',
          method: 'PAYPAL',
          amountUsdMinor: 5000,
          quotaToCredit: 5000000,
        })))
      }
      return Promise.reject(new Error('Order request recorded'))
    })
    const user = userEvent.setup()
    render(<RechargePage />)

    await user.click(screen.getByRole('button', { name: '$50' }))
    await user.click(screen.getByRole('button', { name: 'Confirm payment' }))
    await screen.findByText('PayPal checkout')
    completionHandler?.({ orderNo: 'PO-1', status: 'CONFIRMED' })
    expect(assign).not.toHaveBeenCalled()

    completionHandler?.({ orderNo: 'PO-1', status: 'PAID' })
    expect(assign).toHaveBeenCalledWith('/console/payment-complete?orderNo=PO-1')
  })
})
