import './styles.css'
import './styles/public-ledger.css'
import './styles/catalog-docs.css'
import './styles/site-theme.css'
import { Suspense, lazy } from 'react'
import { RouteFallback } from './components/RouteFallback'
import './i18n'

/**
 * Route chunks keep the first visit to a public page from downloading the console,
 * payment and charting code. echarts only ships with the dashboard chunk.
 */
const ModelsPage = lazy(() => import('./features/catalog/ModelsPage').then(({ ModelsPage: Page }) => ({ default: Page })))
const ModelDetailPage = lazy(() => import('./features/catalog/ModelDetailPage').then(({ ModelDetailPage: Page }) => ({ default: Page })))
const DocsPage = lazy(() => import('./features/docs/DocsPage').then(({ DocsPage: Page }) => ({ default: Page })))
const PurchasePage = lazy(() => import('./features/payments/PurchasePage').then(({ PurchasePage: Page }) => ({ default: Page })))

/** The public header is mounted by App and stays put while these pages swap. */
export function SecondaryRoutes({ path }: { path: string }) {
  if (path.startsWith('/models/')) {
    let modelName = ''
    try { modelName = decodeURIComponent(path.slice('/models/'.length)) } catch { /* Show not found for malformed encoding. */ }
    return <Suspense fallback={<RouteFallback />}><ModelDetailPage key={modelName} modelName={modelName} /></Suspense>
  }
  if (path === '/docs' || path.startsWith('/docs/')) return <Suspense fallback={<RouteFallback />}><DocsPage path={path} /></Suspense>
  if (path === '/models') return <Suspense fallback={<RouteFallback />}><ModelsPage /></Suspense>
  if (path === '/purchase') return <Suspense fallback={<RouteFallback />}><PurchasePage /></Suspense>
  return <main className="models-page"><h1>Not Found</h1></main>
}
