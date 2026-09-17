import '../../ui/semi-base'
import Card from '@douyinfe/semi-ui/lib/es/card'
import Tag from '@douyinfe/semi-ui/lib/es/tag'
import Typography from '@douyinfe/semi-ui/lib/es/typography'
import { useTranslation } from 'react-i18next'

import '../../i18n'

export function PaymentMethodPlaceholder() {
  const { t } = useTranslation()
  const methods = [t('payment.paypal'), t('payment.crypto'), t('payment.other')]

  return (
    <section aria-labelledby="payment-method-title">
      <Typography.Title heading={4} id="payment-method-title">{t('payment.title')}</Typography.Title>
      <div className="payment-method-grid">
        {methods.map((method) => <Card key={method} className="payment-method-card">
          <Typography.Text strong>{method}</Typography.Text>
          <Tag color="grey">{t('payment.comingSoon')}</Tag>
        </Card>)}
      </div>
    </section>
  )
}
