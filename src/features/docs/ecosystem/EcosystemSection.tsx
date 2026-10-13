import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CopyButton } from '../../../components/CopyButton'
import type { EcosystemModule, Entry, Snippet, Text } from './types'

export type EcosystemLoader = () => Promise<EcosystemModule>

/** Articles already downloaded, so returning to one (or one prefetched on hover) renders on the first frame. */
const loaded = new Map<EcosystemLoader, EcosystemModule>()

export function prefetchEcosystem(load: EcosystemLoader) {
  if (!loaded.has(load)) load().then((data) => { loaded.set(load, data) }, () => { /* The click will report it. */ })
}

/**
 * Fetches an article's entries. A failed chunk is not retried: browsers cache the
 * rejected import, so only a reload (which also picks up a newer deploy) can recover.
 */
export function useEcosystem(load?: EcosystemLoader) {
  const [state, setState] = useState<{ load: EcosystemLoader; data?: EcosystemModule; failed?: boolean }>()
  useEffect(() => {
    if (!load || loaded.has(load)) return
    let live = true
    load().then((data) => { loaded.set(load, data); if (live) setState({ load, data }) }, () => { if (live) setState({ load, failed: true }) })
    return () => { live = false }
  }, [load])
  const cached = load && loaded.get(load)
  if (cached) return { load, data: cached, failed: false }
  return load && state?.load === load ? state : undefined
}

export function useText() {
  const { i18n } = useTranslation()
  const language = i18n.language === 'zh-CN' ? 'zh-CN' : 'en'
  return (value: Text) => typeof value === 'string' ? value : value[language]
}

/** Code block whose tabs switch between install variants; only the chosen one is in the DOM. */
function Snippets({ items, label }: { items: Snippet[]; label: string }) {
  const { t } = useTranslation()
  const text = useText()
  const [index, setIndex] = useState(0)
  const current = items[index]
  return <div className="zt-code">
    <div className="zt-code-toolbar">
      {items.length > 1
        ? <div role="group" aria-label={label}>{items.map((item, i) => <button key={i} aria-pressed={i === index} onClick={() => setIndex(i)}>{text(item.label)}</button>)}</div>
        : <span className="zt-code-label">{text(current.label)}</span>}
      <CopyButton key={index} value={current.value} label={t('docs.copyCode')} />
    </div>
    <pre><code>{current.value}</code></pre>
  </div>
}

export function EcosystemSection({ entry, baseUrl, host }: { entry: Entry; baseUrl: string; host: string }) {
  const { t, i18n } = useTranslation()
  const text = useText()
  const fill = (value: string) => value.replaceAll('{baseUrl}', baseUrl).replaceAll('{host}', host)
  const address = entry.protocol && (entry.url ? fill(entry.url) : entry.protocol === 'openai' ? baseUrl : host)
  return <>
    <p>{text(entry.summary)}</p>
    <div className="zt-doc-links">
      {entry.homepage && <a href={entry.homepage} target="_blank" rel="noreferrer">{t('docs.eco.homepage')} ↗</a>}
      {entry.github && <a href={entry.github} target="_blank" rel="noreferrer">GitHub ↗</a>}
      {entry.stars !== undefined && <span className="zt-muted">★ {new Intl.NumberFormat(i18n.language, { notation: 'compact', maximumFractionDigits: 1 }).format(entry.stars)}</span>}
    </div>
    {entry.install && <><h3>{t('docs.eco.install')}</h3><Snippets items={entry.install} label={t('docs.eco.install')} /></>}
    {(address || entry.steps || entry.config) && <h3>{t('docs.eco.connect')}</h3>}
    {address && <dl className="zt-connection">
      <dt>{t('docs.table.family')}</dt><dd>{t(`docs.family.${entry.protocol}`)}</dd>
      <dt>Base URL</dt><dd><code>{address}</code><CopyButton value={address} label={t('docs.copyUrl')} /></dd>
    </dl>}
    {entry.steps && <ol className="zt-steps">{entry.steps.map((step, i) => <li key={i}>{fill(text(step))}</li>)}</ol>}
    {entry.config && <Snippets items={entry.config.map((item) => ({ ...item, value: fill(item.value) }))} label={t('docs.eco.connect')} />}
    {entry.note && <p className="zt-notice">{fill(text(entry.note))}</p>}
  </>
}
