import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconCopy } from '@douyinfe/semi-icons'
import { Button, Skeleton } from '@douyinfe/semi-ui'
import { cardPriceRows, formatPrice, priceGroup, type CatalogModel } from './catalog-data'
import type { NewApiPricingResponse } from '../../api/portal'

const logos: Record<string, string> = {
  OpenAI: 'openai', Anthropic: 'claude-color', DeepSeek: 'deepseek-color', Google: 'gemini-color',
  '智谱': 'zhipu-color', Zhipu: 'zhipu-color', '字节跳动': 'doubao-color', ByteDance: 'doubao-color',
  '阿里巴巴': 'qwen-color', Moonshot: 'moonshot', Meta: 'meta-color', Mistral: 'mistral-color',
  MiniMax: 'minimax-color', '百度': 'wenxin-color', xAI: 'xai', '即梦': 'jimeng-color', Cohere: 'cohere-color',
  '腾讯': 'hunyuan-color', Cloudflare: 'cloudflare-color', '零一万物': 'yi-color', Jina: 'jina', '讯飞': 'spark-color',
}
export function VendorMark({ vendor }: { vendor: string }) {
  const logo = logos[vendor]
  return <span className="zt-vendor-mark" aria-hidden="true">{logo ? <img src={`/vendors/${logo}.svg`} alt="" /> : vendor.slice(0, 2)}</span>
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
export function PriceList({ model, pricing, group, compact = false }: { model: CatalogModel; pricing: NewApiPricingResponse; group: string; compact?: boolean }) {
  const { t } = useTranslation()
  const { ratio, name } = priceGroup(pricing, model, group)
  const rows = compact ? cardPriceRows(model) : model.prices
  return <div className="zt-prices" data-testid={`model-card-${model.name}-pricing`}>
    {compact && rows.length > 0 && <div className="zt-price-heading"><span>{t('catalog.salePrice')}</span><span>{name || '—'}</span></div>}
    {!compact && <p className="zt-muted">{t('catalog.priceGroup', { group: name || '—' })}</p>}
    {!rows.length ? <p className="zt-muted">{t('models.priceUnavailable')}</p> : rows.map((row) => <div className="zt-price-row" key={row.key}>
      <span>{row.label ?? t(`catalog.price.${row.key}`)}<small>{t(`catalog.unit.${row.unit}`)}</small></span>
      <span className="zt-price-value">{row.base === null || ratio === null ? <small>{t('models.priceUnavailable')}</small> : <>{ratio < 1 && row.base > 0 && <del title={t('catalog.basePrice')}>${formatPrice(row.base)}</del>}<strong title={t('catalog.salePrice')}>${formatPrice(row.base * ratio)}</strong></>}</span>
    </div>)}
    {!compact && <p className="zt-muted zt-price-note">{t('catalog.priceNote')}</p>}
  </div>
}
