import { Suspense, lazy, useEffect, useState, type ReactNode } from 'react'
import { Skeleton } from '@douyinfe/semi-ui'
import { useTranslation } from 'react-i18next'
import { PublicHeader } from './components/PublicHeader'
import { useAuthStatus } from './auth/use-auth-status'
import { RemoteState } from './components/RemoteState'
import { ConsoleLayout, type ConsoleKey } from './components/ConsoleLayout'
import { HomePage } from './features/home/HomePage'
import { SignInPage } from './features/auth/SignInPage'
import { SignUpPage } from './features/auth/SignUpPage'
import './i18n'

/**
 * Route chunks keep the first visit to a public page from downloading the console,
 * payment and charting code. echarts only ships with the dashboard chunk.
 */
const ModelsPage = lazy(() => import('./features/catalog/ModelsPage').then(({ ModelsPage: Page }) => ({ default: Page })))
const ModelDetailPage = lazy(() => import('./features/catalog/ModelDetailPage').then(({ ModelDetailPage: Page }) => ({ default: Page })))
const DocsPage = lazy(() => import('./features/docs/DocsPage').then(({ DocsPage: Page }) => ({ default: Page })))
const DashboardPage = lazy(() => import('./features/console/DashboardPage').then(({ DashboardPage: Page }) => ({ default: Page })))
const TokensPage = lazy(() => import('./features/console/TokensPage').then(({ TokensPage: Page }) => ({ default: Page })))
const LogsPage = lazy(() => import('./features/console/LogsPage').then(({ LogsPage: Page }) => ({ default: Page })))
const ProfilePage = lazy(() => import('./features/console/ProfilePage').then(({ ProfilePage: Page }) => ({ default: Page })))
const OrdersPage = lazy(() => import('./features/orders/OrdersPage').then(({ OrdersPage: Page }) => ({ default: Page })))
const PurchasePage = lazy(() => import('./features/payments/PurchasePage').then(({ PurchasePage: Page }) => ({ default: Page })))
const RechargePage = lazy(() => import('./features/payments/RechargePage').then(({ RechargePage: Page }) => ({ default: Page })))

function RouteFallback() {
  const { t } = useTranslation()
  const label = t('catalog.loading')
  return <div className="route-fallback" role="status" aria-label={label}><Skeleton active placeholder={<Skeleton.Paragraph rows={6} />} /><p>{label}</p></div>
}

function ConsoleRoute({ activeKey, children, onNavigate }: { activeKey: ConsoleKey, children: ReactNode, onNavigate: (path: string) => void }) {
  const status = useAuthStatus()

  useEffect(() => {
    if (status.kind !== 'anonymous') return
    const returnTo = `${window.location.pathname}${window.location.search}`
    window.location.assign(`/sign-in?returnTo=${encodeURIComponent(returnTo)}`)
  }, [status])

  if (status.kind === 'loading') return <RemoteState kind="loading" />
  if (status.kind === 'anonymous') return null
  return <ConsoleLayout activeKey={activeKey} onNavigate={onNavigate}><div className="console-route-content" key={activeKey}><Suspense fallback={<RouteFallback />}>{children}</Suspense></div></ConsoleLayout>
}

export function App() {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateConsole = (nextPath: string) => {
    if (nextPath === path) return
    window.history.pushState({}, '', nextPath)
    setPath(nextPath)
  }

  if (path === '/console/dashboard') return <ConsoleRoute activeKey="dashboard" onNavigate={navigateConsole}><DashboardPage /></ConsoleRoute>
  if (path === '/console/tokens') return <ConsoleRoute activeKey="tokens" onNavigate={navigateConsole}><TokensPage /></ConsoleRoute>
  if (path === '/console/recharge') return <ConsoleRoute activeKey="recharge" onNavigate={navigateConsole}><RechargePage /></ConsoleRoute>
  if (path === '/console/logs') return <ConsoleRoute activeKey="logs" onNavigate={navigateConsole}><LogsPage /></ConsoleRoute>
  if (path === '/console/profile') return <ConsoleRoute activeKey="profile" onNavigate={navigateConsole}><ProfilePage /></ConsoleRoute>
  if (path === '/console/orders') return <ConsoleRoute activeKey="orders" onNavigate={navigateConsole}><OrdersPage /></ConsoleRoute>
  if (path === '/sign-in') return <SignInPage />
  if (path === '/sign-up') return <SignUpPage />
  if (path.startsWith('/models/')) {
    let modelName = ''
    try { modelName = decodeURIComponent(path.slice('/models/'.length)) } catch { /* Show not found for malformed encoding. */ }
    return <div className="public-ledger-route"><PublicHeader /><Suspense fallback={<RouteFallback />}><ModelDetailPage key={modelName} modelName={modelName} /></Suspense></div>
  }
  if (path === '/docs' || path.startsWith('/docs/')) return <div className="public-ledger-route"><PublicHeader /><Suspense fallback={<RouteFallback />}><DocsPage path={path} /></Suspense></div>
  if (path === '/models') return <div className="public-ledger-route" data-testid="public-ledger-route"><PublicHeader /><Suspense fallback={<RouteFallback />}><ModelsPage /></Suspense></div>
  if (path === '/purchase') return <div className="public-ledger-route" data-testid="public-ledger-route"><PublicHeader /><Suspense fallback={<RouteFallback />}><PurchasePage /></Suspense></div>
  if (path === '/') return <div className="ledger-public-page public-ledger-route" data-testid="ledger-public-page"><PublicHeader /><HomePage /></div>
  return <><PublicHeader /><main className="models-page"><h1>Not Found</h1></main></>
}
