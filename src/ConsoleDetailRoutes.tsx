import './ui/semi-base'
import './styles.css'
import './styles/site-theme.css'
import { lazy, Suspense } from 'react'
import type { ConsoleKey } from './components/ConsoleLayout'
import { RemoteState } from './components/RemoteState'

const TokensPage = lazy(() => import('./features/console/TokensPage').then(({ TokensPage }) => ({ default: TokensPage })))
const OrdersPage = lazy(() => import('./features/orders/OrdersPage').then(({ OrdersPage }) => ({ default: OrdersPage })))
const RechargePage = lazy(() => import('./features/payments/RechargePage').then(({ RechargePage }) => ({ default: RechargePage })))

export function ConsoleDetailRoutes({ activeKey }: { activeKey: ConsoleKey }) {
  const pages = { tokens: <TokensPage />, logs: null, profile: null, orders: <OrdersPage />, recharge: <RechargePage />, dashboard: null }
  return <Suspense fallback={<RemoteState kind="loading" />}>{pages[activeKey]}</Suspense>
}
