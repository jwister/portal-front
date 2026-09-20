import { isDocumentedSeedance } from '../docs/seedance-api'
import { useAuthStatus } from '../../auth/use-auth-status'
import { authenticatedLink } from '../../auth/auth-links'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useCatalog } from './use-catalog'
import { CatalogState, CopyButton, Discount, PriceList, VendorMark } from './CatalogShared'
import { OfficialPriceReference } from './OfficialPriceReference'
import { ModelExamples } from './ModelExamples'
import { cardPriceRows, dearestTier, formatPrice, priceGroup, tierLabelKey, type CatalogModel } from './catalog-data'
import type { NewApiPricingResponse } from '../../api/portal'

/**
 * The catalog carries no modality metadata, so input/output modalities are derived from
 * the model type the catalog itself assigns.
 */
const MODALITIES: Record<CatalogModel['type'], { input: string[]; output: string[] }> = {
  chat: { input: ['text'], output: ['text'] },
  embedding: { input: ['text'], output: ['embedding'] },
  image: { input: ['text'], output: ['image'] },
  video: { input: ['text', 'image'], output: ['video'] },
  audio: { input: ['audio'], output: ['text'] },
  other: { input: ['text'], output: ['text'] },
}

function billingKey(model: CatalogModel): string {
  if (model.tiers.length > 1) return 'catalog.billing.tieredToken'
  const unit = model.prices[0]?.unit
  if (unit === 'second') return 'catalog.billing.tiered'
  if (unit === 'request') return 'catalog.billing.perRequest'
  return 'catalog.billing.perToken'
}

function Modality({ kind }: { kind: string }) {
  const { t } = useTranslation()
  return <span className={`zt-modality zt-modality-${kind}`}><i aria-hidden="true" />{t(`catalog.modality.${kind}`)}</span>
}

function CapabilityFlag({ ok }: { ok: boolean }) {
  const { t } = useTranslation()
  return <span className={'zt-cap-flag ' + (ok ? 'is-yes' : 'is-no')} role="img" aria-label={t(ok ? 'catalog.supported' : 'catalog.unsupported')}>{ok ? '✓' : '✗'}</span>
}

/** Capability matrix: every row is derived from the live catalog record, never hardcoded. */
function Capability({ model, pricing, group }: { model: CatalogModel; pricing: NewApiPricingResponse; group: string }) {
  const { t } = useTranslation()
  const modality = MODALITIES[model.type]
  const { ratio } = priceGroup(pricing, model, group)
  const discounted = ratio !== null && ratio > 0 && ratio < 1 ? ratio : null
  // Absence in the catalog's endpoint list is the only evidence this page has, so the
  // batch, search and fine-tune rows light up automatically once the gateway serves them.
  const exposes = (fragment: string) => model.endpoints.some((endpoint) => endpoint.includes(fragment))
  const conversational = exposes('/chat/completions') || exposes('/messages') || exposes('generateContent')
  const rows: { key: string; value: ReactNode }[] = [
    { key: 'catalog.cap.input', value: <>{modality.input.map((kind) => <Modality key={kind} kind={kind} />)}</> },
    { key: 'catalog.cap.output', value: <>{modality.output.map((kind) => <Modality key={kind} kind={kind} />)}</> },
    { key: 'catalog.cap.streaming', value: <CapabilityFlag ok={model.type === 'chat'} /> },
    { key: 'catalog.cap.memory', value: <CapabilityFlag ok={conversational} /> },
    { key: 'catalog.cap.billing', value: <span className="zt-cap-text">{t(billingKey(model))}</span> },
    { key: 'catalog.cap.cache', value: <CapabilityFlag ok={model.prices.some((row) => row.key === 'cache' || row.key === 'cacheWrite')} /> },
    { key: 'catalog.cap.batch', value: <CapabilityFlag ok={exposes('batch')} /> },
    { key: 'catalog.cap.search', value: <CapabilityFlag ok={exposes('search') || exposes('web')} /> },
    { key: 'catalog.cap.tuning', value: <CapabilityFlag ok={exposes('fine')} /> },
    { key: 'catalog.cap.groups', value: <>{model.groups.map((name) => <span className="zt-cap-chip" key={name}>{name}</span>)}</> },
    { key: 'catalog.cap.rate', value: <span className="zt-cap-text">{discounted === null
      ? t('catalog.cap.rateNone')
      : t('catalog.cap.rateValue', { rate: Number((discounted * 10).toFixed(4)), percent: Number(((1 - discounted) * 100).toFixed(4)) })}</span> },
  ]
  return <section id="capability" className="zt-panel zt-capability">
    <div className="zt-panel-heading"><h2>{t('catalog.capabilityTitle')}</h2></div>
    <div className="zt-capability-grid">{rows.map((row) => <div className="zt-capability-row" key={row.key}><dt>{t(row.key)}</dt><dd>{row.value}</dd></div>)}</div>
    <p className="zt-muted zt-capability-note">{t('catalog.capabilityNote')}</p>
  </section>
}

/**
 * Group comparison table. Token-priced models only repeat the two headline prices here so
 * the cache amounts from the pricing panel above are never printed twice on one page.
 */
function GroupPrices({ model, pricing, group }: { model: CatalogModel; pricing: NewApiPricingResponse; group: string }) {
  const { t } = useTranslation()
  const quoted = model.tiers.length > 1 ? dearestTier(model.tiers) : null
  const tokenPriced = model.prices[0]?.unit === 'million'
  const columns = tokenPriced ? (['input', 'output'] as const).filter((key) => model.prices.some((row) => row.key === key)) : []
  const current = priceGroup(pricing, model, group).name
  const appliedRatio = (name: string) => {
    const ratio = pricing.group_ratio?.[name]
    return typeof ratio === 'number' && Number.isFinite(ratio) && ratio > 0 ? ratio : null
  }
  return <section id="groups" className="zt-panel zt-group-prices">
    <div className="zt-panel-heading"><h2>{t('catalog.groupTable', { model: model.name })}</h2></div>
    {!model.groups.length ? <p className="zt-muted">{t('catalog.groupTableEmpty')}</p> : <div className="zt-table-wrap">
      <table className="zt-group-table">
        <thead><tr>
          <th scope="col">{t('models.groups')}</th>
          {columns.map((key) => <th scope="col" key={key}>{t(`catalog.price.${key}`)}<small>{t('catalog.unit.million')}</small></th>)}
          {!columns.length && <th scope="col">{t('models.pricing')}</th>}
          <th scope="col">{t('catalog.groupRatio')}</th>
        </tr></thead>
        <tbody>{model.groups.map((name) => {
          const ratio = appliedRatio(name)
          return <tr key={name} className={name === current ? 'is-current' : undefined}>
            <th scope="row">{pricing.usable_group?.[name] ?? name}{name === current && <span className="zt-group-current">{t('catalog.groupCurrent')}</span>}</th>
            {columns.map((key) => {
              const base = model.prices.find((row) => row.key === key)?.base ?? null
              return <td key={key}>{base === null || ratio === null
                ? <small>{t('models.priceUnavailable')}</small>
                : <span className="zt-price-value"><strong>${formatPrice(base * ratio)}</strong></span>}</td>
            })}
            {!columns.length && <td>{model.prices.length ? model.prices.map((row) => <span className="zt-group-price" key={row.key}>
              {row.label ?? t(`catalog.price.${row.key}`)}{' '}
              {row.base === null || ratio === null ? <small>{t('models.priceUnavailable')}</small> : `$${formatPrice(row.base * ratio)}`}
            </span>) : <small>{t('models.priceUnavailable')}</small>}</td>}
            <td>{ratio === null ? <small>{t('models.priceUnavailable')}</small> : `×${ratio}`}</td>
          </tr>
        })}</tbody>
      </table>
    </div>}
    <p className="zt-muted zt-price-note">{t('catalog.groupTableNote', { group: current || '—' })}
      {quoted && ` ${t('catalog.groupTableTier', { tier: tierLabelKey(quoted.label) ? t(tierLabelKey(quoted.label)!) : quoted.label })}`}</p>
  </section>
}

export function ModelDetailPage({ modelName }: { modelName: string }) {
  const { t } = useTranslation()
  const auth = useAuthStatus()
  const { pricing, models, failed, retry } = useCatalog()
  const [group, setGroup] = useState(new URLSearchParams(window.location.search).get('group') ?? 'all')
  if (!pricing) return <CatalogState failed={failed} retry={retry} />
  const model = models.find((item) => item.name === modelName)
  if (!model) return <main className="zt-public zt-state"><h1>{t('catalog.notFound')}</h1><a href="/models">{t('catalog.back')}</a></main>
  const { ratio, name } = priceGroup(pricing, model, group)
  const headline = cardPriceRows(model).slice(0, 2)
  // `prices` holds one tier only, so a tiered model names it here rather than letting two
  // unattributed numbers stand for a rate that changes with the request.
  const quoted = model.tiers.length > 1 ? dearestTier(model.tiers) : null
  const headlineTier = quoted && (tierLabelKey(quoted.label) ? t(tierLabelKey(quoted.label)!) : quoted.label)
  const docsHref = `${isDocumentedSeedance(model.name) ? '/docs/api/seedance' : '/docs/guides/quick-start'}?${new URLSearchParams({ model: model.name })}`
  return <main className="zt-public zt-detail"><div className="zt-container">
    <a className="zt-back" href="/models">← {t('catalog.back')}</a>
    <header className="zt-detail-header" id="overview">
      <div className="zt-detail-title">
        <div className="zt-card-meta"><VendorMark vendor={model.vendor} /><span>{model.vendor}</span><span className="zt-type">{t(`catalog.type.${model.type}`)}</span></div>
        <h1>{model.name}</h1>
        <div className="zt-api-name"><code>{model.name}</code><CopyButton value={model.name} /></div>
        <p className="zt-detail-lead">{t('catalog.introLine', { vendor: model.vendor, protocols: model.endpoints.join(' / ') || t(`catalog.type.${model.type}`) })}</p>
        <dl className="zt-detail-facts">
          {headline.map((row) => <div key={row.key}>
            <dt>{row.label ?? t(`catalog.price.${row.key}`)}<small>{t(`catalog.unit.${row.unit}`)}{headlineTier ? ` · ${headlineTier}` : ''}</small></dt>
            <dd>{row.base === null || ratio === null ? <small>{t('models.priceUnavailable')}</small> : <>{ratio < 1 && row.base > 0 && <del>${formatPrice(row.base)}</del>}<strong>${formatPrice(row.base * ratio)}</strong></>}</dd>
          </div>)}
          <div><dt>{t('catalog.cap.billing')}</dt><dd><span className="zt-cap-text">{t(billingKey(model))}</span></dd></div>
          <div><dt>{t('catalog.cap.groups')}</dt><dd>{model.groups.map((item) => <span className="zt-cap-chip" key={item}>{pricing.usable_group?.[item] ?? item}</span>)}</dd></div>
          <div><dt>{t('catalog.cap.protocol')}</dt><dd>{model.endpoints.length
            ? model.endpoints.map((endpoint) => <code className="zt-cap-code" key={endpoint}>{endpoint}</code>)
            : <small>{t('models.priceUnavailable')}</small>}</dd></div>
          <div><dt>{t('catalog.groupRatio')}</dt><dd><span className="zt-cap-chip">{name || '—'}</span><span className="zt-cap-text">{ratio === null ? '—' : `×${ratio}`}</span></dd></div>
        </dl>
      </div>
      <div className="zt-detail-actions">
        <a className="zt-buy" {...authenticatedLink(auth, '/purchase')}>{t('catalog.buyNow')}</a>
        <a href={docsHref}>{t('catalog.integrationDocs')} ↗</a>
      </div>
    </header>
    <nav className="zt-detail-tabs" aria-label={t('catalog.detailSections')}>
      <a href="#overview" aria-current="page">{t('catalog.tab.overview')}</a>
      <a href="#pricing">{t('models.pricing')}</a>
      <a href="#groups">{t('catalog.tab.groups')}</a>
      <a href="#capability">{t('catalog.capabilityTitle')}</a>
      <a href="#examples">{t('catalog.tab.examples')}</a>
    </nav>
    <a className="zt-billing-entry" href="/docs/billing">
      <span className="zt-billing-entry-copy"><strong>{t('catalog.billingGuide')}</strong><small>{t('catalog.billingGuideHint')}</small></span>
      <span className="zt-billing-entry-arrow" aria-hidden="true">→</span>
    </a>
    <div className="zt-detail-layout">
      <section id="pricing" className="zt-panel">
        <div className="zt-panel-heading"><h2>{t('models.pricing')}</h2><Discount model={model} pricing={pricing} group={group} /></div>
        <label className="zt-group-select">{t('models.groups')}<select value={group} onChange={(event) => {
          setGroup(event.target.value)
          const params = new URLSearchParams(window.location.search)
          if (event.target.value === 'all') params.delete('group'); else params.set('group', event.target.value)
          window.history.replaceState({}, '', `${window.location.pathname}${params.size ? `?${params}` : ''}`)
        }}><option value="all">{t('catalog.defaultGroup')}</option>{group !== 'all' && !model.groups.includes(group) && <option value={group}>{group}</option>}{model.groups.map((item) => <option key={item} value={item}>{pricing.usable_group?.[item] ?? item}</option>)}</select></label>
        <PriceList model={model} pricing={pricing} group={group} />
        {model.type === 'video' && <p className="zt-notice">{t('catalog.videoNote')}</p>}
      </section>
      <aside className="zt-panel zt-next-steps"><span className="zt-eyebrow">{t('catalog.getStarted')}</span><h2>{t('catalog.connectTitle')}</h2><ol><li>{t('catalog.stepAccount')}</li><li>{t('catalog.stepKey')}</li><li>{t('catalog.stepRequest')}</li></ol><a href={docsHref}>{t('catalog.quickStart')} →</a><p className="zt-muted">{t('catalog.balanceNote')}</p></aside>
    </div>
    <GroupPrices model={model} pricing={pricing} group={group} />
    <Capability model={model} pricing={pricing} group={group} />
    <ModelExamples model={model} />
    <OfficialPriceReference modelName={model.name} />
  </div></main>
}
