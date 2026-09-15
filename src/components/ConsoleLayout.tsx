import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { type AuthProfile } from '../api/auth'
import { getDashboard, type DashboardSummary } from '../api/portal'
import { useAuthStatus } from '../auth/use-auth-status'
import { LanguageMenu } from './LanguageMenu'
import { AccountMenu } from './AccountMenu'
import { ConsoleIcon } from './ConsoleIcon'
import brandLogo from '../assets/brand-logo.webp'

export type ConsoleKey = 'dashboard' | 'recharge' | 'tokens' | 'logs' | 'profile' | 'orders'
interface ConsoleLayoutProps { activeKey: ConsoleKey; children: ReactNode; onNavigate?: (path: string) => void; profile?: AuthProfile }
const destinations: Record<ConsoleKey, string> = { dashboard: '/console/dashboard', recharge: '/console/recharge', tokens: '/console/tokens', logs: '/console/logs', profile: '/console/profile', orders: '/console/orders' }

export function ConsoleLayout({ activeKey, children, onNavigate, profile }: ConsoleLayoutProps) {
  const { t, i18n } = useTranslation()
  const status = useAuthStatus(!profile)
  const account = profile ?? (status.kind === 'authenticated' ? status.profile : undefined)
  const accountName = account?.username ?? t('console.account')
  const [menuOpen, setMenuOpen] = useState(false)
  const [balance, setBalance] = useState<DashboardSummary | null>(null)
  const topbar = useRef<HTMLElement>(null)
  const closeMenus = () => topbar.current?.querySelectorAll('details[open]').forEach((menu) => menu.removeAttribute('open'))
  useEffect(() => {
    if (!account) return
    let active = true
    const refresh = () => { void getDashboard().then((next) => { if (active) setBalance(next) }).catch(() => { if (active) setBalance(null) }) }
    const update = (event: Event) => setBalance((event as CustomEvent<DashboardSummary>).detail)
    window.addEventListener('ztoken:balance-updated', update)
    window.addEventListener('focus', refresh)
    refresh()
    return () => { active = false; window.removeEventListener('ztoken:balance-updated', update); window.removeEventListener('focus', refresh) }
  }, [account?.id, activeKey])
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !topbar.current?.contains(event.target)) closeMenus() }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { const menu = topbar.current?.querySelector('details[open]'); closeMenus(); menu?.querySelector('summary')?.focus() } }
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [])
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const initialPage = useRef(true)
  const balanceText = balance && Number.isFinite(balance.availableQuota) && Number.isFinite(balance.quotaPerUsd) && balance.quotaPerUsd > 0
    ? '$' + new Intl.NumberFormat(i18n.language, { minimumFractionDigits:2, maximumFractionDigits:2 }).format(balance.availableQuota / balance.quotaPerUsd) : '$—'
  useEffect(() => {
    if (!menuOpen) return
    if (dialog.current?.showModal) dialog.current.showModal()
    else dialog.current?.setAttribute('open', '')
    return () => trigger.current?.focus()
  }, [menuOpen])
  useEffect(() => {
    if (initialPage.current) { initialPage.current = false; return }
    content.current?.focus()
    window.scrollTo({ top: 0, behavior: 'instant' })
    // Animate only navigation, so the initial paint and form state are unaffected.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const animation = content.current?.animate?.(
      [{ opacity: 0.6, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' },
    )
    return () => animation?.cancel()
  }, [activeKey])
  const navigate = (event: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0 || !onNavigate) return
    event.preventDefault()
    setMenuOpen(false)
    closeMenus()
    onNavigate(path)
  }
  const navigation = <nav aria-label={t('console.navigation')} className="zt-console-nav">
    {(Object.keys(destinations) as ConsoleKey[]).map((key) => <a key={key} href={destinations[key]} aria-current={key === activeKey ? 'page' : undefined} onClick={(event) => navigate(event, destinations[key])}><ConsoleIcon name={key} /><span>{t(`console.${key}`)}</span></a>)}
  </nav>
  const brand = <a className="zt-console-brand" href="/" aria-label="ZToken"><img src={brandLogo} alt="" width="32" height="32" /><strong>ZToken</strong></a>
  return <div className="zt-console console-shell">
    <a className="zt-console-skip" href="#console-main">{t('console.skipContent')}</a>
    <aside className="zt-console-sidebar">
      {brand}
      <p className="zt-console-nav-caption">{t('console.workspace')}</p>
      {navigation}
      <div className="zt-console-sidebar-footer"><a href="/docs"><ConsoleIcon name="docs" />{t('auth.readDocs')}</a><a href="/models"><ConsoleIcon name="arrow" />{t('console.exploreModels')}</a></div>
    </aside>
    <div className="zt-console-workspace">
      <header className="zt-console-topbar" ref={topbar}>
        <div className="zt-console-topbar-title"><button ref={trigger} className="zt-console-menu-toggle" type="button" aria-expanded={menuOpen} aria-label={t('console.openNavigation')} onClick={() => setMenuOpen(true)}><ConsoleIcon name="menu" /></button><span>{t(`console.${activeKey}`)}</span></div>
        <div className="zt-console-topbar-actions">
          <LanguageMenu />
          <a className="zt-console-balance" href="/console/recharge" aria-label={t('console.currentBalance', { balance:balanceText })} onClick={(event) => navigate(event, '/console/recharge')}><ConsoleIcon name="recharge" /><span>{balanceText}</span></a>
          <AccountMenu username={accountName} onNavigate={navigate} />
        </div>
      </header>
      <div className="zt-console-content" id="console-main" ref={content} tabIndex={-1}>{children}</div>
    </div>
    {menuOpen && <dialog ref={dialog} className="zt-console-mobile-menu" onClick={(event) => { if (event.target !== event.currentTarget) return; const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) { setMenuOpen(false) } }} aria-label={t('console.navigation')} onCancel={(event) => { event.preventDefault(); setMenuOpen(false) }}>
      <header>{brand}<button type="button" aria-label={t('console.closeNavigation')} onClick={() => setMenuOpen(false)}><ConsoleIcon name="close" /></button></header>
      {navigation}
      <a className="zt-console-mobile-docs" href="/docs"><ConsoleIcon name="docs" />{t('auth.readDocs')}</a>
    </dialog>}
  </div>
}
