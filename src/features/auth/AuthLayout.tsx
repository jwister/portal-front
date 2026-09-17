import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { setStoredLanguage } from '../../i18n'
import brandLogo from '../../assets/brand-logo.webp'
import { vendorLogoUrl } from '../catalog/vendor-logos'
import './auth.css'

/** The models the gateway fans out to in the illustration, each with its own mark. */
const authModels: [vendor: string, label: string, slot: string][] = [
  ['OpenAI', 'GPT', 'one'], ['Anthropic', 'Claude', 'two'], ['Google', 'Gemini', 'three'],
]

export function AuthLayout({ title, copy, children, compact = false }: { title: string; copy?: string; children: ReactNode; compact?: boolean }) {
  const { t, i18n } = useTranslation()
  const titleId = useId()
  return <main className={`zt-auth${compact ? ' zt-auth-compact' : ''}`} data-testid="ledger-auth-page">
    <header className="zt-auth-header">
      <a className="zt-auth-brand" href="/" aria-label="ZToken"><img src={brandLogo} alt="" width="32" height="32" /><span>ZToken</span></a>
      <nav aria-label={t('auth.navigation')}>
        <a href="/">{t('auth.backHome')}</a>
        <button type="button" onClick={() => void setStoredLanguage(i18n.language === 'zh-CN' ? 'en' : 'zh-CN')} aria-label={`${t('auth.changeLanguage')} (${i18n.language === 'zh-CN' ? 'EN' : '中文'})`}>{i18n.language === 'zh-CN' ? 'EN' : '中文'}</button>
      </nav>
    </header>
    <div className="zt-auth-body">
      <aside className="zt-auth-story" aria-label={t('auth.productIntro')}>
        <div className="zt-auth-story-copy">
          <h2><span>{t('auth.storyTitle')}</span><span>{t('auth.storyTitleEnd')}</span></h2>
          <p>{t('auth.storyCopy')}</p>
        </div>
        <div className="zt-auth-network" aria-hidden="true">
          <svg viewBox="0 0 480 280" fill="none" className="zt-auth-wires">
            <path d="M100 140H240M240 140C310 140 280 50 350 50H400M240 140H400M240 140C310 140 280 230 350 230H400" />
            <circle className="zt-auth-signal" cx="170" cy="140" r="4" />
            <circle className="zt-auth-signal zt-auth-signal-late" cx="326" cy="140" r="4" />
          </svg>
          <div className="zt-auth-app"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16" /></svg><span>{t('auth.yourApp')}</span></div>
          <div className="zt-auth-hub"><img src={brandLogo} alt="" width="44" height="44" /><strong>ZToken</strong></div>
          {authModels.map(([vendor, label, slot]) => <div className={`zt-auth-model zt-auth-model-${slot}`} key={label}>
            <span className="zt-auth-model-symbol"><img src={vendorLogoUrl(vendor)} alt="" width="18" height="18" loading="lazy" decoding="async" /></span>{label}
          </div>)}
        </div>
        <div className="zt-auth-story-footer"><p>{t('auth.storyFooter')}</p><a href="/docs">{t('auth.readDocs')}<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></a></div>
      </aside>
      <section className="zt-auth-form-area" aria-labelledby={titleId}>
        <div className="zt-auth-form-content">
          <div className="zt-auth-heading"><h1 id={titleId}>{title}</h1>{copy && <p>{copy}</p>}</div>
          {children}
        </div>
        <p className="zt-auth-help">{t('auth.needHelp')} <a href="mailto:support.01@ztoken.cc">{t('auth.contactSupport')}</a></p>
      </section>
    </div>
  </main>
}

export function AuthInput({ label, error, type = 'text', ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const id = useId()
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  return <div className="zt-auth-field">
    <label htmlFor={id}>{label}</label>
    <div className="zt-auth-input-wrap">
      <input {...props} id={id} type={isPassword && visible ? 'text' : type} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className={isPassword ? 'zt-auth-password' : undefined} />
      {isPassword && <button className="zt-auth-eye" type="button" aria-label={t(visible ? 'auth.hidePassword' : 'auth.showPassword', { field: label })} aria-pressed={visible} onClick={() => setVisible(!visible)}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{visible && <path d="m3 3 18 18" />}</svg>
      </button>}
    </div>
    {error && <p className="zt-auth-field-error" id={`${id}-error`} role="alert">{error}</p>}
  </div>
}

export function AuthSubmit({ busy, disabled, children }: { busy: boolean; disabled?: boolean; children: ReactNode }) {
  return <button className="zt-auth-primary" type="submit" disabled={busy || disabled} aria-busy={busy}>{busy && <span className="zt-auth-spinner" aria-hidden="true" />}{children}</button>
}

export function focusInvalidField(form: HTMLFormElement, errors: Record<string, string>) {
  const field = form.elements.namedItem(Object.keys(errors)[0])
  if (field instanceof HTMLElement) field.focus()
}

/** Native modal supplies focus trapping, background inertness and Escape dismissal. */
export function AuthDialog({ title, onClose, children, busy = false }: { title: string; onClose: () => void; children: ReactNode; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const { t } = useTranslation()
  useEffect(() => {
    const previous = document.activeElement
    const dialog = ref.current
    if (dialog?.showModal) dialog.showModal()
    else dialog?.setAttribute('open', '')
    dialog?.querySelector('input')?.focus()
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus() }
  }, [])
  return <dialog className="zt-auth-dialog" ref={ref} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}>
    <div className="zt-auth-dialog-heading"><h2 id={titleId}>{title}</h2><button type="button" className="zt-auth-dialog-close" disabled={busy} onClick={onClose} aria-label={t('auth.close')}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m6 6 12 12M6 18 18 6" /></svg></button></div>
    {children}
  </dialog>
}
