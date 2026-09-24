import '../../ui/semi-base'
import Typography from '@douyinfe/semi-ui/lib/es/typography'
import { useCallback, useEffect, useState } from 'react'
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
    // 仅在服务端确认实际到账后才跳转完成页，避免中间状态误报支付成功。
    if (next.status === 'PAID') {
      void getDashboard().catch(() => {})
      window.location.assign(`/console/payment-complete?${new URLSearchParams({ orderNo: next.orderNo })}`)
    }
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
