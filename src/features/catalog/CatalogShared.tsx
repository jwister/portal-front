import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconCopy } from '@douyinfe/semi-icons'
import '../../ui/semi-base'
import Button from '@douyinfe/semi-ui/lib/es/button'
import Skeleton from '@douyinfe/semi-ui/lib/es/skeleton'
import { cardPriceRows, cardTierRows, formatPrice, priceGroup, tierLabelKey, type CatalogModel, type PriceRow } from './catalog-data'
import type { NewApiPricingResponse } from '../../api/portal'
import { vendorLogoUrl } from './vendor-logos'

export function VendorMark({ vendor }: { vendor: string }) {
  const logo = vendorLogoUrl(vendor)
  return <span className="zt-vendor-mark" aria-hidden="true">{logo ? <img src={logo} alt="" /> : vendor.slice(0, 2)}</span>
}
export function CopyButton({ value, label }: { value: string; label?: string }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<'idle' | 'done' | 'error'>('idle')
  return <span className="zt-copy"><Button theme="borderless" icon={<IconCopy />} aria-label={label ?? t('models.copyName')} onClick={async (event) => {
    event.stopPropagation()
    try { await navigator.clipboard.writeText(value); setStatus('done') } catch { setStatus('error') }
  }}>{status === 'done' ? t('models.copied') : label ?? t('models.copyName')}</Button><span role="status" className={status === 'error' ? 'zt-copy-error' : 'zt-sr-only'}>{status === 'error' ? t('catalog.copyError') : status === 'done' ? t('models.copied') : ''}</span></span>
}
export function CatalogState({ failed, retry }: { failed: boolean; retry: () => void }) {
  const { t } = useTranslation()
  return <main className="zt-public zt-state">{failed ? <div role="alert"><h1>{t('models.error')}</h1><Button onClick={retry}>{t('catalog.retry')}</Button></div> : <div role="status" aria-label={t('catalog.loading')}><Skeleton active placeholder={<Skeleton.Paragraph rows={8} />} /><p>{t('catalog.loading')}</p></div>}</main>
}
export function Discount({ model, pricing, group }: { model: CatalogModel; pricing: NewApiPricingResponse; group: string }) {
  const { t } = useTranslation()
  const { ratio } = priceGroup(pricing, model, group)
  return ratio !== null && ratio > 0 && ratio < 1 && model.prices.some((row) => row.base !== null && row.base > 0)
    ? <span className="zt-discount"><small>{t('catalog.groupOffer')}</small><span>{t('catalog.discount', { rate: Number((ratio * 10).toFixed(4)), percent: Number(((1 - ratio) * 100).toFixed(4)) })}</span></span> : null
}
function PriceRows({ rows, ratio }: { rows: PriceRow[]; ratio: number | null }) {
  const { t } = useTranslation()
  return <>{rows.map((row) => <div className="zt-price-row" key={row.key}>
    <span>{row.label ?? t(`catalog.price.${row.key}`)}<small>{t(`catalog.unit.${row.unit}`)}</small></span>
    <span className="zt-price-value">{row.base === null || ratio === null ? <small>{t('models.priceUnavailable')}</small> : <>{ratio < 1 && row.base > 0 && <del title={t('catalog.basePrice')}>${formatPrice(row.base)}</del>}<strong title={t('catalog.salePrice')}>${formatPrice(row.base * ratio)}</strong></>}</span>
  </div>)}</>
}

export function PriceList({ model, pricing, group, compact = false }: { model: CatalogModel; pricing: NewApiPricingResponse; group: string; compact?: boolean }) {
  const { t } = useTranslation()
  const { ratio, name } = priceGroup(pricing, model, group)
  // A rate that changes with the request (off-peak hours, input length bands) prints every
  // band the gateway charges: one headline price would be right only part of the time.
  const tiers = model.tiers.length > 1 ? model.tiers : []
  const rows = compact ? cardPriceRows(model) : model.prices
  return <div className="zt-prices" data-testid={`model-card-${model.name}-pricing`}>
    {compact && (tiers.length > 0 || rows.length > 0) && <div className="zt-price-heading"><span>{t(tiers.length ? 'catalog.tierPrice' : 'catalog.salePrice')}</span><span>{name || '—'}</span></div>}
    {!compact && <p className="zt-muted">{t('catalog.priceGroup', { group: name || '—' })}</p>}
    {tiers.length > 0
      ? tiers.map((tier) => <div className="zt-price-tier" key={tier.label}>
        <p className="zt-price-tier-label">{tierLabelKey(tier.label) ? t(tierLabelKey(tier.label)!) : tier.label}</p>
        <PriceRows rows={compact ? cardTierRows(tier) : tier.rows} ratio={ratio} />
      </div>)
      : !rows.length ? <p className="zt-muted">{t('models.priceUnavailable')}</p> : <PriceRows rows={rows} ratio={ratio} />}
    {!compact && <p className="zt-muted zt-price-note">{t('catalog.priceNote')}</p>}
  </div>
}
