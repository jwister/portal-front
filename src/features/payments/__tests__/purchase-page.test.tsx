import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '../../../i18n'
import { PurchasePage } from '../PurchasePage'

describe('PurchasePage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    window.history.replaceState({}, '', '/purchase')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    window.history.replaceState({}, '', '/')
  })

  it('offers every preset amount, validates custom amount, and shows a PayPal option without trusting client-side quota or user IDs', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockImplementation((url) => url === '/api/auth/status'
      ? Promise.resolve(new Response(JSON.stringify({ authenticated: true, profile: { id: 1, username: 'test' } })))
      : Promise.reject(new Error('Order request recorded')))
    vi.stubGlobal('fetch', fetchMock)

    render(<PurchasePage />)

    for (const amount of ['$5', '$10', '$50', '$100', '$200', '$500']) {
      expect(screen.getByRole('button', { name: amount })).toBeVisible()
    }

    await user.click(screen.getByRole('button', { name: 'Custom amount' }))
    const input = screen.getByLabelText('Custom amount')
    await user.type(input, '0')
    expect(screen.getByText('Enter an amount between $1 and $10,000.')).toBeVisible()

    await user.clear(input)
    await user.type(input, '25.5')
    await user.click(screen.getByRole('button', { name: 'Confirm payment' }))

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toBe('/api/payments/orders')
    const initObject = init as RequestInit
    expect(initObject.method).toBe('POST')
    expect(initObject.credentials).toBe('include')
    const body = String(initObject.body)
    expect(body).toContain('"amount":"25.5"')
    expect(body).toContain('"method":"PAYPAL"')
    expect(body).not.toContain('quota')
    expect(body).not.toContain('userId')
    expect(body).not.toContain('newapiUserId')
  })

  it('creates a TRC20 order with only the selected amount and payment method', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockImplementation((url) => url === '/api/auth/status'
      ? Promise.resolve(new Response(JSON.stringify({ authenticated: true, profile: { id: 1, username: 'test' } })))
      : Promise.reject(new Error('Order request recorded')))
    vi.stubGlobal('fetch', fetchMock)
    render(<PurchasePage />)

    await user.click(screen.getByRole('radio', { name: 'TRC20 USDT' }))
    await user.click(screen.getByRole('button', { name: 'Confirm payment' }))

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(url).toBe('/api/payments/orders')
    expect(init.body).toBe(JSON.stringify({ amount: '5', method: 'USDT_TRC20' }))
  })

  it('keeps the selected amount in the ledger summary while choosing a payment method', () => {
    render(<PurchasePage />)

    expect(screen.queryByTestId('purchase-ledger-steps')).not.toBeInTheDocument()
    expect(screen.getByTestId('purchase-ledger-summary')).toHaveTextContent('$5')
  })

  it('renders exactly the two supported payment choices', () => {
    render(<PurchasePage />)

    expect(screen.getByRole('radio', { name: 'PayPal' })).toBeVisible()
    expect(screen.getByRole('radio', { name: 'TRC20 USDT' })).toBeVisible()
    expect(screen.queryByText('Other payment method')).not.toBeInTheDocument()
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument()
  })

  it('redirects anonymous visitors to login without creating an order', async () => {
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign })
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ authenticated: false, profile: null })))
    vi.stubGlobal('fetch', fetchMock)
    render(<PurchasePage />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Confirm payment' }))
    await waitFor(() => expect(assign).toHaveBeenCalledWith('/sign-in?returnTo=%2Fpurchase'))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/status', expect.objectContaining({ credentials: 'include' }))
  })

  it('waits for authentication before sending any order request', async () => {
    let finish!: (response: Response) => void
    const fetchMock = vi.fn().mockImplementation((url) => url === '/api/auth/status'
      ? new Promise<Response>((resolve) => { finish = resolve })
      : Promise.reject(new Error('Order request recorded')))
    vi.stubGlobal('fetch', fetchMock)
    render(<PurchasePage />)
    const confirm = screen.getByRole('button', { name: 'Confirm payment' })
    await userEvent.setup().click(confirm)
    expect(confirm).toBeDisabled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await act(async () => { finish(new Response(JSON.stringify({ authenticated: true, profile: { id: 1, username: 'test' } }))) })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/payments/orders', expect.objectContaining({ method: 'POST' })))
  })

  it('does not create an order when the status request fails', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Offline'))
    vi.stubGlobal('fetch', fetchMock)
    render(<PurchasePage />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Confirm payment' }))
    expect(await screen.findByRole('alert')).toBeVisible()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns to login if the session expires between checking and creating the order', async () => {
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign })
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ authenticated: true, profile: { id: 1, username: 'test' } })))
      .mockResolvedValueOnce(new Response('{}', { status: 401 })))
    render(<PurchasePage />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Confirm payment' }))
    await waitFor(() => expect(assign).toHaveBeenCalledWith('/sign-in?returnTo=%2Fpurchase'))
  })

  it('submits the selected TRC20 method only when payment is confirmed', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockImplementation((url) => url === '/api/auth/status'
      ? Promise.resolve(new Response(JSON.stringify({ authenticated: true, profile: { id: 1, username: 'test' } })))
      : Promise.reject(new Error('Order request recorded')))
    vi.stubGlobal('fetch', fetchMock)
    render(<PurchasePage />)

    const trc20 = screen.getByRole('radio', { name: 'TRC20 USDT' })
    expect(screen.getByRole('radio', { name: 'PayPal' })).toBeChecked()
    await user.click(trc20)
    expect(trc20).toBeChecked()
    expect(fetchMock).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Confirm payment' }))
    expect(fetchMock).toHaveBeenCalledWith('/api/payments/orders', expect.objectContaining({
      body: JSON.stringify({ amount: '5', method: 'USDT_TRC20' }),
    }))
  })
})
