import './styles.css'
import './styles/public-ledger.css'
import './styles/catalog-docs.css'
import './styles/site-theme.css'
import { Suspense, lazy, useEffect, useState } from 'react'
import './ui/semi-base'
import Skeleton from '@douyinfe/semi-ui/lib/es/skeleton'
import { useTranslation } from 'react-i18next'
import { PublicHeader } from './components/PublicHeader'
import './i18n'

/**
 * Route chunks keep the first visit to a public page from downloading the console,
 * payment and charting code. echarts only ships with the dashboard chunk.
 */
const ModelsPage = lazy(() => import('./features/catalog/ModelsPage').then(({ ModelsPage: Page }) => ({ default: Page })))
const ModelDetailPage = lazy(() => import('./features/catalog/ModelDetailPage').then(({ ModelDetailPage: Page }) => ({ default: Page })))
const DocsPage = lazy(() => import('./features/docs/DocsPage').then(({ DocsPage: Page }) => ({ default: Page })))
const PurchasePage = lazy(() => import('./features/payments/PurchasePage').then(({ PurchasePage: Page }) => ({ default: Page })))

function RouteFallback() {
  const { t } = useTranslation()
  const label = t('common.loading')
  return <div className="route-fallback" role="status" aria-label={label}><Skeleton active placeholder={<Skeleton.Paragraph rows={6} />} /><p>{label}</p></div>
}

export function SecondaryRoutes() {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  if (path.startsWith('/models/')) {
    let modelName = ''
    try { modelName = decodeURIComponent(path.slice('/models/'.length)) } catch { /* Show not found for malformed encoding. */ }
    return <div className="public-ledger-route"><PublicHeader /><Suspense fallback={<RouteFallback />}><ModelDetailPage key={modelName} modelName={modelName} /></Suspense></div>
  }
  if (path === '/docs' || path.startsWith('/docs/')) return <div className="public-ledger-route"><PublicHeader /><Suspense fallback={<RouteFallback />}><DocsPage path={path} /></Suspense></div>
  if (path === '/models') return <div className="public-ledger-route" data-testid="public-ledger-route"><PublicHeader /><Suspense fallback={<RouteFallback />}><ModelsPage /></Suspense></div>
  if (path === '/purchase') return <div className="public-ledger-route" data-testid="public-ledger-route"><PublicHeader /><Suspense fallback={<RouteFallback />}><PurchasePage /></Suspense></div>
  return <><PublicHeader /><main className="models-page"><h1>Not Found</h1></main></>
}
