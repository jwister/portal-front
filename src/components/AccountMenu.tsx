import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { signOut } from '../api/auth'
import { ConsoleIcon } from './ConsoleIcon'
import './account-menu.css'

export function AccountMenu({ username, onNavigate }: {
  username: string
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>, path: string) => void
}) {
  const { t } = useTranslation()
  const menu = useRef<HTMLDetailsElement>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menu.current?.contains(event.target)) menu.current?.removeAttribute('open')
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !menu.current?.open) return
      menu.current.removeAttribute('open')
      menu.current.querySelector('summary')?.focus()
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [])

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    setError(false)
    try { await signOut(); window.location.assign('/') }
    catch { setError(true); setSigningOut(false) }
  }

  return <details ref={menu} className="zt-account-menu" name="console-account-menu">
    <summary aria-label={t('auth.avatarLabel', { username })}>
      <span className="zt-account-avatar" aria-hidden="true">{username.charAt(0).toUpperCase()}</span>
      <strong className="zt-account-name" title={username}>{username}</strong>
      <ConsoleIcon name="chevron" />
    </summary>
    <div className="zt-account-panel">
      <a href="/console/profile" onClick={(event) => { menu.current?.removeAttribute('open'); onNavigate?.(event, '/console/profile') }}><ConsoleIcon name="profile" />{t('console.profile')}</a>
      <button type="button" disabled={signingOut} aria-busy={signingOut} onClick={() => void handleSignOut()}><ConsoleIcon name="logout" />{t('auth.signOut')}</button>
      {error && <p role="alert">{t('auth.signOutError')}</p>}
    </div>
  </details>
}
