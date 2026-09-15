import { lazy, Suspense, useEffect } from 'react'
import { ConsoleLayout, type ConsoleKey } from './components/ConsoleLayout'
import { RemoteState } from './components/RemoteState'
import type { AuthStatus } from './auth/use-auth-status'
import './styles/console.css'

import { DashboardPage } from './features/console/DashboardPage'
import { ProfilePage } from './features/console/ProfilePage'
import { LogsPage } from './features/console/LogsPage'
const ConsoleDetailRoutes = lazy(() => import('./ConsoleDetailRoutes').then(({ ConsoleDetailRoutes }) => ({ default: ConsoleDetailRoutes })))

export function ConsoleRoutes({ path, status }: { path: string; status: AuthStatus }) {
  useEffect(() => {
    if (status.kind === 'anonymous') window.location.assign(`/sign-in?${new URLSearchParams({ returnTo: window.location.pathname + window.location.search })}`)
  }, [status])
  if (status.kind === 'loading') return <RemoteState kind="loading" />
  if (status.kind !== 'authenticated') return null
  const activeKey = path.split('/')[2] as ConsoleKey
  const navigate = (nextPath: string) => {
    if (window.location.pathname === nextPath) return
    window.history.pushState({}, '', nextPath)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
  return <ConsoleLayout activeKey={activeKey} profile={status.profile} onNavigate={navigate}>
    <div className="console-route-content" key={path}><Suspense fallback={<RemoteState kind="loading" />}>
      {activeKey === 'dashboard' ? <DashboardPage /> : activeKey === 'profile' ? <ProfilePage /> : activeKey === 'logs' ? <LogsPage /> : <ConsoleDetailRoutes activeKey={activeKey} />}
    </Suspense></div>
  </ConsoleLayout>
}
