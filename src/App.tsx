import { lazy, Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PublicHeader } from './components/PublicHeader'
import { ContactWidget } from './components/ContactWidget'
import { HomePage } from './features/home/HomePage'
import { useAuthStatus } from './auth/use-auth-status'

const SecondaryRoutes = lazy(() => import('./SecondaryRoutes').then(({ SecondaryRoutes }) => ({ default: SecondaryRoutes })))
const AuthRoutes = lazy(() => import('./AuthRoutes').then(({ AuthRoutes }) => ({ default: AuthRoutes })))
const ConsoleRoutes = lazy(() => import('./ConsoleRoutes').then(({ ConsoleRoutes }) => ({ default: ConsoleRoutes })))

export function App() {
  const { t } = useTranslation()
  const [path, setPath] = useState(() => window.location.pathname)
  const isConsoleRoute = /^\/console\/(dashboard|recharge|tokens|logs|profile|orders)$/.test(path)
  const consoleStatus = useAuthStatus(isConsoleRoute)
  useEffect(() => {
    const update = () => setPath(window.location.pathname)
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])
  const isAuthRoute = ['/sign-in', '/sign-up', '/oauth/github', '/oauth/oidc'].includes(path)
  return <>
    {path === '/' ? <div className="ledger-public-page public-ledger-route" data-testid="ledger-public-page"><PublicHeader /><HomePage /></div>
      : <Suspense fallback={<div className="route-fallback" role="status">{t(isAuthRoute ? 'auth.pageLoading' : 'common.loading')}</div>}>
        {isAuthRoute ? <AuthRoutes path={path} /> : isConsoleRoute ? <ConsoleRoutes path={path} status={consoleStatus} /> : <SecondaryRoutes />}
      </Suspense>}
    <ContactWidget />
  </>
}
