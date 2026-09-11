import { useMemo, useState } from 'react'
import { Button } from '@douyinfe/semi-ui'
import { useTranslation } from 'react-i18next'
import '../../i18n'
import { compareModelsByVendor, modelHref, priceGroup, vendorRank } from './catalog-data'
import { useCatalog } from './use-catalog'
import { useModelNavigation } from './use-model'
import { CatalogState, CopyButton, Discount, PriceList, VendorMark } from './CatalogShared'

export function ModelsPage() {
  const { t } = useTranslation()
  const { pricing, models, failed, retry } = useCatalog()
  const initial = new URLSearchParams(window.location.search)
  const [query, setQuery] = useState(initial.get('q') ?? '')
  const [type, setType] = useState(initial.get('type') ?? 'all')
  const [vendor, setVendor] = useState(initial.get('vendor') ?? 'all')
  const [group, setGroup] = useState(initial.get('group') ?? 'all')
  const access = useModelNavigation()
  function update(key: string, value: string, set: (value: string) => void) {
    set(value)
    const params = new URLSearchParams(window.location.search)
    if (!value || value === 'all') params.delete(key); else params.set(key, value)
    window.history.replaceState({}, '', '/models' + (params.size ? '?' + params : ''))
  }
  const clear = () => { setQuery(''); setType('all'); setVendor('all'); setGroup('all'); window.history.replaceState({}, '', '/models') }
  /** Switching type retires a vendor that serves no model of that type. */
  function selectType(kind: string) {
    if (vendor !== 'all' && !models.some((m) => m.vendor === vendor && (kind === 'all' || m.type === kind))) update('vendor', 'all', setVendor)
    update('type', kind, setType)
  }
  // Filter changes re-render on every keystroke, so derive the lists once per input change.
  // Vendors follow the type filter: a chip that cannot return any model is hidden.
  const vendors = useMemo(() => [...new Set(models.filter((m) => type === 'all' || m.type === type).map((m) => m.vendor))].sort((a, b) => vendorRank(a) - vendorRank(b) || a.localeCompare(b, 'zh')), [models, type])
  const groups = useMemo(() => [...new Set(models.flatMap((m) => m.groups))].sort(), [models])
  const types = useMemo(() => ['all', 'chat', 'embedding', 'image', 'video', ...(['audio', 'other'].filter((kind) => models.some((m) => m.type === kind)))], [models])
  const filtered = useMemo(() => models.filter((m) => (type === 'all' || m.type === type) && (vendor === 'all' || m.vendor === vendor) && (group === 'all' || m.groups.includes(group)) && m.name.toLowerCase().includes(query.trim().toLowerCase())).sort(compareModelsByVendor), [models, type, vendor, group, query])
  const bestRatio = useMemo(() => {
    if (!pricing) return null
    const discountedRatios = filtered.flatMap((model) => {
      const { ratio } = priceGroup(pricing, model, group)
      return ratio !== null && ratio > 0 && ratio < 1 && model.prices.some((row) => row.base !== null && row.base > 0) ? [ratio] : []
    })
    return discountedRatios.length ? Math.min(...discountedRatios) : null
  }, [filtered, pricing, group])
  if (!pricing) return <CatalogState failed={failed} retry={retry} />
  return <main className="zt-public zt-marketplace"><div className="zt-container">
    <section className="zt-catalog-hero">
      <div className="zt-market-copy" data-testid="models-hero-copy">
        <span className="zt-eyebrow"><i aria-hidden="true" />{t('models.badge')}<span aria-hidden="true"> / ZTOKEN API</span></span>
        <h1>{t('catalog.heroTitle')}<em>{t('catalog.heroAccent')}</em></h1>
        <p>{t(bestRatio === null ? 'catalog.intro' : 'catalog.promoIntro')}</p>
        <div className="zt-hero-actions"><a className="zt-explore" href="#model-catalog">{t('catalog.explore')}<span aria-hidden="true">↗</span></a><a href="/docs/guides/quick-start">{t('catalog.quickStart')} →</a></div>
        <div className="zt-catalog-summary" data-testid="models-summary"><span data-testid="models-ledger-status">{t('models.liveCatalog')}</span><strong>{models.length}</strong><span>{t('models.modelsAvailable')}</span></div>
      </div>
      <aside className={'zt-promo-ticket' + (bestRatio === null ? ' is-neutral' : '')} data-testid="models-promotion">
        <div className="zt-ticket-top"><span>{t(bestRatio === null ? 'models.title' : 'catalog.promoScope')}</span><span aria-hidden="true">✳</span></div>
        {bestRatio !== null ? <><div className="zt-ticket-rate">{t('catalog.promoRate', { rate: Number((bestRatio * 10).toFixed(4)), percent: Number(((1 - bestRatio) * 100).toFixed(4)) })}</div><p className="zt-ticket-saving">{t('catalog.promoSaving', { percent: Number(((1 - bestRatio) * 100).toFixed(4)) })}</p></> : <><div className="zt-ticket-neutral">ONE API.<br />MORE IDEAS.</div><p className="zt-ticket-saving">{t('catalog.explore')}</p></>}
        <div className="zt-ticket-bottom"><span>{t(bestRatio === null ? 'catalog.currency' : 'catalog.promoTerms')}</span><span className="zt-ticket-bars" aria-hidden="true" /></div>
      </aside>
    </section>
    <section className="zt-filters" aria-label={t('catalog.filters')}>
      <div className="zt-filter-top"><div className="zt-chips" role="group" aria-label={t('catalog.types')}>{types.map((kind) => <button key={kind} aria-pressed={kind === type} onClick={() => selectType(kind)}>{t('catalog.type.' + kind)}</button>)}</div><input type="search" aria-label={t('models.search')} placeholder={t('models.search')} value={query} onChange={(e) => update('q', e.target.value, setQuery)} /></div>
      <div className="zt-chips zt-vendors" role="group" aria-label={t('models.vendor')}><button aria-pressed={vendor === 'all'} onClick={() => update('vendor', 'all', setVendor)}>{t('catalog.allVendors')}</button>{vendors.map((name) => <button key={name} aria-pressed={vendor === name} onClick={() => update('vendor', name, setVendor)}><VendorMark vendor={name} />{name}</button>)}</div>
      <nav className="zt-chips zt-groups" aria-label={t('models.groupsLabel')}><span>{t('models.groups')}</span><button aria-pressed={group === 'all'} onClick={() => update('group', 'all', setGroup)}>{t('models.allGroups')}</button>{groups.map((name) => <button key={name} aria-pressed={group === name} onClick={() => update('group', name, setGroup)}>{name}</button>)}</nav>
    </section>
    <section id="model-catalog" aria-label={t('models.catalogLabel')}>
      <div className="zt-results-bar"><p role="status">{t('models.count', { count: filtered.length })}</p><span>{t('catalog.currency')}</span>{(query || type !== 'all' || vendor !== 'all' || group !== 'all') && <Button theme="borderless" onClick={clear}>{t('catalog.clear')}</Button>}</div>
      {access.error && <p className="zt-error" role="alert">{access.error}</p>}
      {!filtered.length ? <div className="zt-empty"><h2>{t('models.empty')}</h2><Button onClick={clear}>{t('catalog.clear')}</Button></div> : <div className="zt-model-grid">{filtered.map((model) => <article className="zt-model-card" key={model.name} data-testid={'model-card-' + model.name} data-layout="catalog">
        <Discount model={model} pricing={pricing} group={group} />
        <div className="zt-card-meta"><VendorMark vendor={model.vendor} /><span>{model.vendor}</span><span className="zt-type">{t('catalog.type.' + model.type)}</span></div>
        <h2><a className="zt-card-link" href={modelHref(model.name, group)}>{model.name}</a></h2>
        <div className="zt-api-name"><code>{model.name}</code><CopyButton value={model.name} /></div>
        <PriceList model={model} pricing={pricing} group={group} compact />
        <footer><span>{t('catalog.viewPrice')} ↗</span><Button theme="solid" type="primary" disabled={access.pending} loading={access.pendingModelName === model.name} onClick={() => void access.start(model.name)}>{t('catalog.use')}</Button></footer>
      </article>)}</div>}
    </section>
    <p className="zt-catalog-note">{t('catalog.priceNote')}</p>
  </div></main>
}
