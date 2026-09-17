import '../../ui/semi-base'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Typography from '@douyinfe/semi-ui/lib/es/typography'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import '../../i18n'
import { formatUsd, getPaymentOrder, type PaymentOrder } from '../../api/portal'
import './payment-complete-page.css'

type CompletionState = { kind: 'loading' } | { kind: 'paid'; order: PaymentOrder } | { kind: 'not-paid' } | { kind: 'error' }

/** 只依据服务端已到账订单展示支付完成信息，并负责后续的安全跳转。 */
export function PaymentCompletePage() {
  const { t } = useTranslation()
  const [state, setState] = useState<CompletionState>({ kind: 'loading' })
  const [seconds, setSeconds] = useState(5)
  const timer = useRef<number | null>(null)
  const orderNo = new URLSearchParams(window.location.search).get('orderNo')?.trim()
  const clearTimer = () => { if (timer.current !== null) { window.clearInterval(timer.current); timer.current = null } }

  useEffect(() => {
    let active = true
    clearTimer()
    setSeconds(5)
    if (!orderNo) { setState({ kind: 'error' }); return () => { active = false } }
    void getPaymentOrder(orderNo).then((order) => {
      if (active) setState(order.status === 'PAID' ? { kind: 'paid', order } : { kind: 'not-paid' })
    }).catch(() => { if (active) setState({ kind: 'error' }) })
    return () => { active = false; clearTimer() }
  }, [orderNo])

  useEffect(() => {
    clearTimer()
    if (state.kind !== 'paid') return
    timer.current = window.setInterval(() => setSeconds((current) => {
      if (current <= 1) { clearTimer(); window.location.assign('/console/dashboard'); return 0 }
      return current - 1
    }), 1_000)
    return clearTimer
  }, [state.kind])

  const goToTokens = () => { clearTimer(); window.location.assign('/console/tokens') }
  if (state.kind === 'loading') return <main className="payment-complete-page"><Typography.Paragraph>{t('payment.complete.loading')}</Typography.Paragraph></main>
  if (state.kind === 'not-paid') return <CompletionFailure title={t('payment.complete.notPaidTitle')} description={t('payment.complete.notPaidDescription')} />
  if (state.kind === 'error') return <CompletionFailure title={t('payment.complete.loadErrorTitle')} description={t('payment.complete.loadErrorDescription')} />
  return <main className="payment-complete-page" aria-live="polite"><section className="payment-complete-card">
    <div className="payment-complete-icon" aria-hidden="true">✓</div><p className="payment-complete-kicker">{t('payment.complete.eyebrow')}</p><h1>{t('payment.complete.title')}</h1><p className="payment-complete-description">{t('payment.complete.description')}</p>
    <dl className="payment-complete-details"><div><dt>{t('orders.orderNo')}</dt><dd><code>{state.order.orderNo}</code></dd></div><div><dt>{t('orders.amount')}</dt><dd>{formatUsd(state.order.amountUsdMinor)}</dd></div></dl>
    <p className="payment-complete-countdown">{t('payment.complete.returning', { seconds })}</p><Button theme="solid" type="primary" block onClick={goToTokens}>{t('payment.complete.createApiKey')}</Button>
  </section></main>
}

/** 未到账或无法校验订单时复用的安全反馈，不暴露订单归属或支付细节。 */
function CompletionFailure({ title, description }: { title: string; description: string }) {
  const { t } = useTranslation()
  return <main className="payment-complete-page"><section className="payment-complete-card payment-complete-card--failure"><h1>{title}</h1><p className="payment-complete-description">{description}</p><a className="payment-complete-back" href="/console/orders">{t('payment.complete.backToOrders')}</a></section></main>
}
