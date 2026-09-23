import '../../ui/semi-base'
import Typography from '@douyinfe/semi-ui/lib/es/typography'
import { Fragment, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import '../../i18n'
import { type PaymentOrder, getPaymentConfig } from '../../api/portal'
import { PaymentSelectionPanel } from './PaymentSelectionPanel'
import { PayPalCheckout } from './PayPalCheckout'
import { Trc20Checkout } from './Trc20Checkout'

export function PurchasePage() {
  const { t } = useTranslation()
  const [order, setOrder] = useState<PaymentOrder | null>(null)
  const [enabled, setEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    getPaymentConfig().then((config) => {
      if (active) setEnabled(config.enabled)
    }).catch(() => {
      if (active) setEnabled(false)
    })
    return () => { active = false }
  }, [])

  return (
    <main className="purchase-page">
      <header className="purchase-header">
        <h1>{t('purchase.title')}</h1>
        <p>{t('purchase.copy')}</p>
      </header>
      {enabled === false
        ? (
          <div style={{ padding: '40px', background: 'var(--semi-color-bg-1)', borderRadius: '8px', marginTop: '24px', maxWidth: '640px', margin: '24px auto 0' }}>
            <Typography.Title heading={4} style={{ textAlign: 'center', fontWeight: 'normal', color: 'var(--semi-color-text-1)' }}>未开启在线充值，请联系管理员。</Typography.Title>
          </div>
        )
        : order ? (
        <Fragment>
          {order.method === 'USDT_TRC20' ? <Trc20Checkout order={order} onCompleted={setOrder} /> : <PayPalCheckout order={order} onCompleted={setOrder} />}
          <button type="button" className="purchase-back" onClick={() => setOrder(null)}>
            {t('payment.changeAmount')}
          </button>
        </Fragment>
      ) : (
        <PaymentSelectionPanel onConfirm={setOrder} />
      )}
      {enabled !== false && (
        <Typography.Paragraph type="tertiary" className="purchase-footnote">
          {t('purchase.footnote')}
        </Typography.Paragraph>
      )}
    </main>
  )
}
