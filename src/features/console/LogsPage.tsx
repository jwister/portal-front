import { ResponsiveTable as Table } from '../../components/ResponsiveTable'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import '../../i18n'
import { ConsolePageHeader } from '../../components/ConsolePageHeader'
import { MetricCard } from '../../components/MetricCard'
import { RemoteState } from '../../components/RemoteState'
import { ConsoleIcon } from '../../components/ConsoleIcon'
import { ChoiceField } from '../../components/ChoiceField'
import { DateTimeField } from '../../components/DateTimeField'
import { getLogs, getLogStats, type LogPage, type LogQuery, type LogStats } from '../../api/portal'

interface LogFilters {
  modelName: string
  tokenName: string
  type: string
  start: string
  end: string
}

function localDateTime(value: Date): string {
  const pad = (number: number) => String(number).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`
}
function todayFilters(): LogFilters { const end = new Date(); end.setHours(23, 59, 59, 999); const start = new Date(end); start.setHours(0, 0, 0, 0); return { modelName: '', tokenName: '', type: '', start: localDateTime(start), end: localDateTime(end) } }

function toTimestamp(value: string): number | undefined {
  if (!value) return undefined
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? undefined : Math.floor(timestamp / 1000)
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString()
}

const QUOTA_PER_USD = 500_000
const formatUsd = (quota: number) => `$${(quota / QUOTA_PER_USD).toFixed(4)}`
const formatSeconds = (seconds: number) => `${seconds.toFixed(1)}s`

export function LogsPage() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<LogFilters>(todayFilters)
  const [query, setQuery] = useState<LogQuery>(() => ({ page: 1, pageSize: 50, startTimestamp: toTimestamp(filters.start), endTimestamp: toTimestamp(filters.end) }))
  const [logs, setLogs] = useState<LogPage | null>(null)
  const [stats, setStats] = useState<LogStats | null>(null)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filtersExpanded, setFiltersExpanded] = useState(() => !window.matchMedia('(max-width: 700px)').matches)

  const applyFilters = () => {
    setQuery({
      page: 1,
      pageSize: 50,
      modelName: filters.modelName.trim() || undefined,
      tokenName: filters.tokenName.trim() || undefined,
      type: filters.type ? Number(filters.type) : undefined,
      startTimestamp: toTimestamp(filters.start),
      endTimestamp: toTimestamp(filters.end),
    })
  }

  const clearFilters = () => {
    const next = todayFilters()
    setFilters(next)
    setQuery({ page: 1, pageSize: 50, startTimestamp: toTimestamp(next.start), endTimestamp: toTimestamp(next.end) })
  }

  useEffect(() => {
    let active = true
    setFailed(false)
    setLoading(true)
    void Promise.all([
      getLogs(query),
      getLogStats({
        modelName: query.modelName,
        tokenName: query.tokenName,
        type: query.type,
        startTimestamp: query.startTimestamp,
        endTimestamp: query.endTimestamp,
      }),
    ]).then(([nextLogs, nextStats]) => {
      if (!active) return
      setLogs(nextLogs)
      setStats(nextStats)
    }).catch(() => {
      if (active) setFailed(true)
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [query])

  if (failed && !logs) return <RemoteState kind="error" onRetry={() => setQuery({ ...query })} />
  if (!logs || !stats) return <RemoteState kind="loading" />

  const columns = [
    { title: t('logs.time'), dataIndex: 'createdAt', render: (value: number) => formatTimestamp(value) },
    { title: t('logs.token'), dataIndex: 'tokenName' },
    { title: t('logs.model'), dataIndex: 'modelName' },
    { title: t('logs.stream'), render: (_: unknown, log: LogPage['items'][number]) => log.stream && log.useTime > 0 ? `${(log.completionTokens / log.useTime).toFixed(1)} t/s` : '-' },
    { title: t('logs.tokens'), render: (_: unknown, log: LogPage['items'][number]) => <span>{t('logs.inputTokens')} {log.promptTokens} / {t('logs.outputTokens')} {log.completionTokens}<br />{t('logs.cacheRead')} {log.cacheTokens} / {t('logs.cacheWrite')} {log.cacheCreationTokens}</span> },
    { title: t('logs.cost'), dataIndex: 'quota', render: (value: number) => formatUsd(value) },
    { title: t('logs.duration'), render: (_: unknown, log: LogPage['items'][number]) => <span>{t('logs.firstToken')} {log.firstResponseTime > 0 ? formatSeconds(log.firstResponseTime / 1000) : '-'}<br />{t('logs.totalTime')} {formatSeconds(log.useTime)}</span> },
    { title: t('logs.content'), dataIndex: 'content', width: '10%', render: (value: string) => <span className="log-detail" title={value}>{value}</span> },
  ]

  return (
    <main>
      <ConsolePageHeader title={t('logs.title')} description={t('logs.description')} actions={<button className="console-button" disabled={loading} onClick={() => setQuery({ ...query })}><ConsoleIcon name="refresh" />{t('dashboard.refresh')}</button>} />
      <details className="console-filters" open={filtersExpanded} onToggle={(event) => setFiltersExpanded(event.currentTarget.open)}><summary><span><ConsoleIcon name="filter" />{t('logs.filters')}</span><ConsoleIcon name="chevron" /></summary>
      <section aria-label={t('logs.filters')}>
        <form className="console-filter-fields" onSubmit={(event) => { event.preventDefault(); applyFilters() }}>
          <label className="console-field"><span>{t('logs.model')}</span><span className="console-search-field"><ConsoleIcon name="search" /><input value={filters.modelName} placeholder={t('logs.modelPlaceholder')} onChange={(event) => setFilters((current) => ({ ...current, modelName: event.target.value }))} /></span></label>
          <label className="console-field"><span>{t('logs.token')}</span><span className="console-search-field"><ConsoleIcon name="search" /><input value={filters.tokenName} placeholder={t('logs.tokenPlaceholder')} onChange={(event) => setFilters((current) => ({ ...current, tokenName: event.target.value }))} /></span></label>
          <ChoiceField label={t('logs.type')} value={filters.type} onChange={(value)=>setFilters(current=>({...current,type:value}))} options={[{value:'',label:t('logs.allTypes')},{value:'2',label:t('logs.consume')},{value:'5',label:t('logs.errorType')}]} />
          <DateTimeField label={t('logs.start')} value={filters.start} max={filters.end || undefined} onChange={(value)=>setFilters(current=>({...current,start:value}))} />
          <DateTimeField label={t('logs.end')} value={filters.end} min={filters.start || undefined} onChange={(value)=>setFilters(current=>({...current,end:value}))} />
          <div className="console-filter-actions"><button className="console-button console-button-primary" type="submit" disabled={loading}>{t('logs.apply')}</button><button className="console-button console-button-quiet" type="button" disabled={loading} onClick={clearFilters}>{t('logs.clear')}</button></div>
        </form>
      </section>
      </details>
      {failed && <p className="console-form-feedback is-error" role="alert">{t('common.loadError')}</p>}
      <section className="console-summary-grid logs-summary-grid" aria-label={t('logs.title')} aria-busy={loading}>
        <MetricCard label={t('logs.quota')} value={formatUsd(stats.quota)} icon={<ConsoleIcon name="recharge" />} tone="blue" />
        <MetricCard label={t('logs.rpm')} value={stats.rpm.toLocaleString()} icon={<ConsoleIcon name="activity" />} tone="mint" />
        <MetricCard label={t('logs.tpm')} value={stats.tpm.toLocaleString()} icon={<ConsoleIcon name="dashboard" />} tone="amber" />
      </section>
      {logs.items.length === 0
        ? <div className="console-empty" role="status"><ConsoleIcon name="logs" /><p>{t('logs.empty')}</p></div>
        : <div className="console-table-wrap logs-table-wrap"><Table columns={columns} dataSource={logs.items} rowKey="id" pagination={false} /></div>}
      {logs.total > logs.pageSize && <nav className="console-pagination" aria-label={t('logs.pagination')}><button className="console-button" disabled={loading || logs.page<=1} onClick={()=>setQuery({...query,page:logs.page-1})}>{t('logs.previousPage')}</button><span>{t('logs.pageStatus',{page:logs.page,total:Math.ceil(logs.total/logs.pageSize)})}</span><button className="console-button" disabled={loading || logs.page*logs.pageSize>=logs.total} onClick={()=>setQuery({...query,page:logs.page+1})}>{t('logs.nextPage')}</button></nav>}
    </main>
  )
}
