import '../../ui/semi-base'
import Typography from '@douyinfe/semi-ui/lib/es/typography'
import { Fragment, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import '../../i18n'
import { type PaymentOrder } from '../../api/portal'
import { PaymentSelectionPanel } from './PaymentSelectionPanel'
import { PayPalCheckout } from './PayPalCheckout'
import { Trc20Checkout } from './Trc20Checkout'

export function PurchasePage() {
  const { t } = useTranslation()
  const [order, setOrder] = useState<PaymentOrder | null>(null)

  /** 公共购买页与控制台充值共用完成页，到账后再次校验订单并上报，避免购买入口漏计。 */
  const completed = useCallback((next: PaymentOrder) => {
    setOrder(next)
    if (next.status === 'PAID') {
      window.location.assign(`/console/payment-complete?${new URLSearchParams({ orderNo: next.orderNo })}`)
    }
  }, [])
  
  return (
    <main className="purchase-page">
      <header className="purchase-header">
        <h1>{t('purchase.title')}</h1>
        <p>{t('purchase.copy')}</p>
      </header>
      {order ? (
        <Fragment>
          {order.method === 'USDT_TRC20' ? <Trc20Checkout order={order} onCompleted={completed} /> : <PayPalCheckout order={order} onCompleted={completed} />}
          <button type="button" className="purchase-back" onClick={() => setOrder(null)}>
            {t('payment.changeAmount')}
          </button>
        </Fragment>
      ) : (
        <PaymentSelectionPanel onConfirm={setOrder} />
      )}
      <Typography.Paragraph type="tertiary" className="purchase-footnote">
          {t('purchase.footnote')}
        </Typography.Paragraph>
    </main>
  )
}
