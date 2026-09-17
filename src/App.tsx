import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { PublicHeader } from './components/PublicHeader'
import { ContactWidget } from './components/ContactWidget'
import { RouteFallback } from './components/RouteFallback'
import { HomePage } from './features/home/HomePage'
import { useAuthStatus } from './auth/use-auth-status'

const SecondaryRoutes = lazy(() => import('./SecondaryRoutes').then(({ SecondaryRoutes }) => ({ default: SecondaryRoutes })))
const AuthRoutes = lazy(() => import('./AuthRoutes').then(({ AuthRoutes }) => ({ default: AuthRoutes })))
const ConsoleRoutes = lazy(() => import('./ConsoleRoutes').then(({ ConsoleRoutes }) => ({ default: ConsoleRoutes })))

const AUTH_ROUTES = ['/sign-in', '/sign-up', '/oauth/github', '/oauth/oidc']

export function App() {
  const [path, setPath] = useState(() => typeof window === 'undefined' ? '/' : window.location.pathname)
  const isConsoleRoute = /^\/console\/(dashboard|recharge|tokens|logs|profile|orders|payment-complete)$/.test(path)
  const consoleStatus = useAuthStatus(isConsoleRoute)
  useEffect(() => {
    const update = () => setPath(window.location.pathname)
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])
  const firstRoute = useRef(true)
  useEffect(() => {
    // The first paint keeps whatever scroll position a reload or an anchor restored.
    if (firstRoute.current) { firstRoute.current = false; return }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [path])
  const isAuthRoute = AUTH_ROUTES.includes(path)

  // Sign-in and the console bring their own shell, so they replace the public one.
  if (isAuthRoute || isConsoleRoute) return <>
    <Suspense fallback={<RouteFallback labelKey={isAuthRoute ? 'auth.pageLoading' : 'common.loading'} />}>
      {isAuthRoute ? <AuthRoutes path={path} /> : <ConsoleRoutes path={path} status={consoleStatus} />}
    </Suspense>
    <ContactWidget />
  </>

  // The header lives outside the route switch so moving between public pages swaps
  // only the content below it: the navigation never unmounts, reloads or reflows.
  const home = path === '/'
  return <>
    <div className={home ? 'ledger-public-page public-ledger-route' : 'public-ledger-route'} data-testid={home ? 'ledger-public-page' : 'public-ledger-route'}>
      <PublicHeader path={path} />
      {home ? <HomePage /> : <Suspense fallback={<RouteFallback />}><SecondaryRoutes path={path} /></Suspense>}
    </div>
    <ContactWidget />
  </>
}
