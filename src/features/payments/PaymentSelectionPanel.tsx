import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import '../../i18n'
import { AmountSelector, isValidCustomAmount, type AmountSelection } from './AmountSelector'
import { createPaymentOrder, PortalApiError, type PaymentOrder, type PaymentMethod } from '../../api/portal'
import { AuthApiError, getAuthStatus } from '../../api/auth'
import { signInUrl } from '../../auth/auth-links'
import { ConsoleIcon } from '../../components/ConsoleIcon'
import './payment-selection.css'

interface PaymentSelectionPanelProps {
  onConfirm: (order: PaymentOrder) => void
}

export function PaymentSelectionPanel({ onConfirm }: PaymentSelectionPanelProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<AmountSelection>(5)
  const [method, setMethod] = useState<PaymentMethod>('PAYPAL')
  const [customAmount, setCustomAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const customValid = selected !== 'custom' || isValidCustomAmount(customAmount)
  const amount = selected === 'custom' ? customAmount : String(selected)
  const amountIsUsable = customValid && amount !== ''

  const handleConfirm = async () => {
    if (!amountIsUsable || submitting) return
    setError(null)
    setSubmitting(true)
    const login = () => window.location.assign(signInUrl(window.location.pathname + window.location.search + window.location.hash))
    try {
      const auth = await getAuthStatus()
      if (!auth.authenticated) { login(); return }
      onConfirm(await createPaymentOrder({ amount, method }))
    } catch (cause) {
      if ((cause instanceof AuthApiError || cause instanceof PortalApiError) && cause.status === 401) { login(); return }
      setError(t('payment.createFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="purchase-panel zt-purchase-panel">
      <AmountSelector
        selected={selected}
        customAmount={customAmount}
        onSelect={setSelected}
        onCustomAmount={setCustomAmount}
      />
      <section className="zt-payment-methods" aria-labelledby="payment-method-title">
        <h2 id="payment-method-title">{t('payment.title')}</h2>
        <div className="zt-payment-options">
        <label className={`zt-payment-option ${method === 'PAYPAL' ? 'is-selected' : ''}`}>
          <input type="radio" name="payment-method" aria-label="PayPal" checked={method === 'PAYPAL'} onChange={() => setMethod('PAYPAL')} />
          <img src="/Paypal.png" alt="" width="56" height="32" />
          <span><strong>PayPal</strong><small>{t('payment.paypalHint')}</small></span><i aria-hidden="true" />
        </label>
        <label className={`zt-payment-option ${method === 'USDT_TRC20' ? 'is-selected' : ''}`}>
          <input type="radio" name="payment-method" aria-label="TRC20 USDT" checked={method === 'USDT_TRC20'} onChange={() => setMethod('USDT_TRC20')} />
          <img src="/Tron.png" alt="" width="32" height="32" />
          <span><strong>TRC20 USDT</strong><small>{t('payment.tronHint')}</small></span><i aria-hidden="true" />
        </label>
        </div>
      </section>
      <footer className="zt-payment-total">
        <div data-testid="purchase-ledger-summary" aria-live="polite"><span>{t('purchase.selected')}</span><strong key={amount}>${amount || '—'}</strong></div>
        <button className="zt-payment-confirm" type="button" disabled={!amountIsUsable || submitting} aria-busy={submitting} onClick={() => { void handleConfirm() }}>{submitting?<span className="console-loading-ring" aria-hidden="true" />:<ConsoleIcon name="recharge" />}{t('payment.confirm')}<ConsoleIcon name="arrow" /></button>
      </footer>
      {error && <p className="zt-payment-error" role="alert">{error}</p>}
    </section>
  )
}
