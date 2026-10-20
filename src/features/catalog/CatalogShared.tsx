import { useTranslation } from 'react-i18next'
import '../../ui/semi-base'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Skeleton from '@douyinfe/semi-ui/lib/es/skeleton'
import { cardPriceRows, cardTierRows, formatPrice, offerRatio, priceGroup, promotionRate, struckPrice, tierLabelKey, unreadExpression, type CatalogModel, type PriceRow } from './catalog-data'
import type { NewApiPricingResponse } from '../../api/portal'
import { vendorLogoUrl } from './vendor-logos'
import { displayCurrency, formatMoney } from '../../support/portal-config'

export { CopyButton } from '../../components/CopyButton'

export function VendorMark({ vendor }: { vendor: string }) {
  const logo = vendorLogoUrl(vendor)
  return <span className="zt-vendor-mark" aria-hidden="true">{logo ? <img src={logo} alt="" /> : vendor.slice(0, 2)}</span>
}
export function CatalogState({ failed, retry }: { failed: boolean; retry: () => void }) {
  const { t } = useTranslation()
  return <main className="zt-public zt-state">{failed ? <div role="alert"><h1>{t('models.error')}</h1><Button onClick={retry}>{t('catalog.retry')}</Button></div> : <div role="status" aria-label={t('catalog.loading')}><Skeleton active placeholder={<Skeleton.Paragraph rows={8} />} /><p>{t('catalog.loading')}</p></div>}</main>
}
export function Discount({ model, pricing, group }: { model: CatalogModel; pricing: NewApiPricingResponse; group: string }) {
  const { t } = useTranslation()
  const promotion = promotionRate(model)
  const ratio = offerRatio(priceGroup(pricing, model, group).ratio, promotion)
  return ratio !== null && ratio > 0 && ratio < 1 && model.prices.some((row) => row.base !== null && row.base > 0)
    ? <span className={'zt-discount' + (promotion === null ? '' : ' is-promo')}><small>{t(promotion === null ? 'catalog.groupOffer' : 'catalog.promoOffer')}</small><span>{t('catalog.discount', { rate: Number((ratio * 10).toFixed(4)), percent: Number(((1 - ratio) * 100).toFixed(4)) })}</span></span> : null
}
function PriceRows({ rows, ratio, promotion }: { rows: PriceRow[]; ratio: number | null; promotion: number | null }) {
  const { t } = useTranslation()
  const currency = displayCurrency()
  return <>{rows.map((row) => {
    const struck = row.base === null || ratio === null ? null : struckPrice(row.base, ratio, promotion)
    return <div className="zt-price-row" key={row.key}>
      <span>{row.label ?? t(`catalog.price.${row.key}`)}<small>{t(`catalog.unit.${row.unit}`, { currency: currency.code })}</small></span>
      <span className="zt-price-value">{row.base === null || ratio === null ? <small>{t('models.priceUnavailable')}</small> : <>{struck !== null && <del title={t(promotion === null ? 'catalog.basePrice' : 'catalog.promoBasePrice')}>{formatMoney(struck, formatPrice, currency)}</del>}<strong title={t('catalog.salePrice')}>{formatMoney(row.base * ratio, formatPrice, currency)}</strong></>}</span>
    </div>
  })}</>
}

/** The expression's amounts are USD whatever the site's display currency, so it says so. */
function RawExpression({ expression }: { expression: string }) {
  const { t } = useTranslation()
  return <div className="zt-price-expression">
    <p className="zt-price-expression-title">{t('catalog.specialExpression')}</p>
    <code>{expression}</code>
    <small>{t('catalog.specialExpressionNote')}</small>
  </div>
}

export function PriceList({ model, pricing, group, compact = false }: { model: CatalogModel; pricing: NewApiPricingResponse; group: string; compact?: boolean }) {
  const { t } = useTranslation()
  const { ratio, name } = priceGroup(pricing, model, group)
  // A rate that changes with the request (off-peak hours, input length bands) prints every
  // band the gateway charges: one headline price would be right only part of the time.
  const tiers = model.tiers.length > 1 ? model.tiers : []
  const rows = compact ? cardPriceRows(model) : model.prices
  const expression = unreadExpression(model)
  const promotion = promotionRate(model)
  return <div className="zt-prices" data-testid={`model-card-${model.name}-pricing`}>
    {compact && (tiers.length > 0 || rows.length > 0) && <div className="zt-price-heading"><span>{t(tiers.length ? 'catalog.tierPrice' : 'catalog.salePrice')}</span><span>{name || '—'}</span></div>}
    {!compact && <p className="zt-muted">{t('catalog.priceGroup', { group: name || '—' })}</p>}
    {tiers.length > 0
      ? tiers.map((tier) => <div className="zt-price-tier" key={tier.label}>
        <p className="zt-price-tier-label">{tierLabelKey(tier.label) ? t(tierLabelKey(tier.label)!) : tier.label}</p>
        <PriceRows rows={compact ? cardTierRows(tier) : tier.rows} ratio={ratio} promotion={promotion} />
      </div>)
      : expression ? <RawExpression expression={expression} />
      : !rows.length ? <p className="zt-muted">{t('models.priceUnavailable')}</p> : <PriceRows rows={rows} ratio={ratio} promotion={promotion} />}
    {!compact && <p className="zt-muted zt-price-note">{t('catalog.priceNote', { currency: displayCurrency().code })}</p>}
  </div>
}
