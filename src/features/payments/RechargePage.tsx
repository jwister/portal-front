import { Typography } from '@douyinfe/semi-ui'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import '../../i18n'
import { ConsolePageHeader } from '../../components/ConsolePageHeader'
import { getDashboard, type PaymentOrder } from '../../api/portal'
import { PaymentSelectionPanel } from './PaymentSelectionPanel'
import { PayPalCheckout } from './PayPalCheckout'
import { Trc20Checkout } from './Trc20Checkout'

export function RechargePage() {
  const { t } = useTranslation()
  const [order, setOrder] = useState<PaymentOrder | null>(null)

  const completed = useCallback((next: PaymentOrder) => {
    setOrder(next)
    if (next.status === 'PAID') void getDashboard().catch(() => {})
  }, [])

  return (
    <main className="recharge-page">
      <ConsolePageHeader title={t('console.recharge')} description={t('purchase.copy')} />
      {order
        ? (
          <>
            {order.method === 'USDT_TRC20' ? <Trc20Checkout order={order} onCompleted={completed} /> : <PayPalCheckout order={order} onCompleted={completed} />}
            <button type="button" className="purchase-back" onClick={() => setOrder(null)}>
              {t('payment.changeAmount')}
            </button>
          </>
        )
        : <PaymentSelectionPanel onConfirm={setOrder} />}
      <Typography.Paragraph type="tertiary" className="purchase-footnote">
        {t('purchase.footnote')}
      </Typography.Paragraph>
    </main>
  )
}
