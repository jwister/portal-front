import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStatus } from '../auth/use-auth-status'
import { authenticatedLink } from '../auth/auth-links'
import { AccountMenu } from './AccountMenu'
import { LanguageMenu } from './LanguageMenu'
import logo from '../assets/brand-logo.webp'

function prefetchRoute(path: string): void {
  if (path === '/models') {
    void import('../features/catalog/use-catalog').then(({ prefetchCatalog }) => prefetchCatalog())
    void import('../features/catalog/ModelsPage')
  } else if (path.startsWith('/docs')) {
    void import('../features/docs/DocsPage')
  } else if (path === '/purchase') {
    void import('../features/payments/PurchasePage')
  }
}

export function PublicHeader() {
  const { t } = useTranslation()
  const status = useAuthStatus()
  const [menuOpen, setMenuOpen] = useState(false)
  const header = useRef<HTMLElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!menuOpen) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus() } }
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !header.current?.contains(event.target)) setMenuOpen(false) }
    document.addEventListener('keydown', close)
    document.addEventListener('pointerdown', outside)
    return () => { document.removeEventListener('keydown', close); document.removeEventListener('pointerdown', outside) }
  }, [menuOpen])
  const account = status.kind === 'authenticated' ? status.profile : null
  const currentPath = typeof window === 'undefined' ? '/' : window.location.pathname
  const navItems = [
    ['/', t('nav.home')], ['/models', t('nav.models')],
    ['/docs/guides/quick-start', t('nav.docs')], ['/purchase', t('nav.purchase')],
  ]
  return <header ref={header} className={`public-header public-site-header${menuOpen ? ' site-menu-open' : ''}${account ? ' site-has-account' : ''}`}>
    <a className="site-brand" href="/" aria-label="ZToken"><img src={logo} alt="" width="26" height="26" />ZToken</a>
    <nav id="public-navigation" className="site-links" aria-label={t('nav.main')}>{navItems.map(([path, label]) => <a key={path} {...(path === '/purchase' ? authenticatedLink(status, path) : { href: path })} onMouseEnter={() => { if (window.matchMedia('(hover: hover)').matches) prefetchRoute(path) }} aria-current={(path === '/' ? currentPath === '/' : currentPath.startsWith(path.split('/').slice(0, 2).join('/'))) ? 'page' : undefined}>{label}</a>)}</nav>
    <div className="site-actions">
      <LanguageMenu />
      <button type="button" className="site-primary" aria-busy={status.kind === 'loading'} onClick={() => window.location.assign(account ? '/console/dashboard' : '/sign-in')}>{t(account ? 'nav.console' : 'auth.submit')}</button>
      {account && <AccountMenu username={account.username} />}
      <button ref={menuButton} type="button" className="site-mobile-menu-toggle" aria-label={t(menuOpen ? 'nav.closeMenu' : 'nav.openMenu')} aria-expanded={menuOpen} aria-controls="public-navigation" onClick={() => setMenuOpen(!menuOpen)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d={menuOpen ? 'm6 6 12 12M6 18 18 6' : 'M4 6h16M4 12h16M4 18h16'} /></svg></button>
    </div>
  </header>

}
