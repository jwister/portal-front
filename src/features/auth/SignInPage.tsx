import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthInput, AuthLayout, AuthSubmit, focusInvalidField } from './AuthLayout'
import githubLogo from '../../assets/github.webp'
import googleLogo from '../../assets/google.webp'

import {
  AuthApiError,
  buildGitHubOAuthUrl,
  buildOidcOAuthUrl,
  createOAuthState,
  getOAuthProviders,
  getSafeReturnTo,
  signIn,
  type OAuthProviderStatus,
} from '../../api/auth'
import '../../i18n'
import { authSwitchUrl, rememberOAuthReturn } from './auth-links'
import { resolveBalanceDestination } from '../catalog/use-model'

interface SignInPageProps {
  onAuthenticated?: () => void
  onOAuthNavigate?: (url: string) => void
}

export function SignInPage(props: SignInPageProps) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [providers, setProviders] = useState<OAuthProviderStatus | null>(null)
  const [providersLoading, setProvidersLoading] = useState(true)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [oauthProvider, setOAuthProvider] = useState<'github' | 'oidc' | null>(null)

  useEffect(() => {
    let active = true
    void getOAuthProviders().then((status) => {
      if (active) setProviders(status)
    }).catch(() => {
      // OAuth 未配置或临时不可用时保留密码登录，不向用户展示上游错误。
      if (active) setProviders(null)
    }).finally(() => { if (active) setProvidersLoading(false) })
    return () => { active = false }
  }, [])

  const submit = async (values: Record<string, unknown>): Promise<void> => {
    const username = typeof values.username === 'string' ? values.username.trim() : ''
    const password = typeof values.password === 'string' ? values.password : ''
    setSubmitting(true)
    setError(null)
    try {
      await signIn(username, password)
      if (props.onAuthenticated) props.onAuthenticated()
      else {
        const target = getSafeReturnTo(new URLSearchParams(window.location.search).get('returnTo'))
        const url = new URL(target, window.location.origin)
        const model = url.searchParams.get('model')
        window.location.assign(url.pathname === '/console/recharge' && model ? await resolveBalanceDestination(model) : target)
      }
    } catch (cause) {
      const message = cause instanceof AuthApiError ? cause.message : t('auth.error')
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const startOAuth = async (provider: 'github' | 'oidc'): Promise<void> => {
    if (!providers || oauthProvider) return
    setOAuthProvider(provider)
    setError(null)
    try {
      const state = await createOAuthState(provider)
      rememberOAuthReturn(provider, state)
      const destination = provider === 'github'
        ? buildGitHubOAuthUrl(providers.githubClientId, state)
        : buildOidcOAuthUrl(providers.oidcAuthorizationEndpoint, providers.oidcClientId, state)
      if (props.onOAuthNavigate) props.onOAuthNavigate(destination)
      else window.location.assign(destination)
    } catch {
      const message = t('auth.oauthFailed')
      setError(message)
      setOAuthProvider(null)
    }
  }

  const githubEnabled = !!providers?.githubEnabled && !!providers.githubClientId
  const oidcEnabled = !!providers?.oidcEnabled && !!providers.oidcClientId && !!providers.oidcAuthorizationEndpoint

  return <AuthLayout title={t('auth.title')} copy={t('auth.copy')}>
    <form className="zt-auth-form" noValidate onSubmit={(event) => {
      event.preventDefault()
      if (submitting || oauthProvider) return
      const form = event.currentTarget
      const values = Object.fromEntries(new FormData(form))
      const errors: Record<string, string> = {}
      for (const name of ['username', 'password']) {
        if (!String(values[name] || '').trim()) errors[name] = 'auth.required'
      }
      setFieldErrors(errors)
      setError(null)
      if (Object.keys(errors).length) { focusInvalidField(form, errors); return }
      void submit(values)
    }}>
      <AuthInput name="username" label={t('auth.username')} placeholder={t('auth.usernamePlaceholder')} autoComplete="username" autoCapitalize="none" spellCheck={false} required error={fieldErrors.username ? t(fieldErrors.username) : undefined} />
      <AuthInput name="password" label={t('auth.password')} placeholder={t('auth.passwordPlaceholder')} type="password" autoComplete="current-password" required error={fieldErrors.password ? t(fieldErrors.password) : undefined} />
      {error && <p className="zt-auth-error" role="alert">{error}</p>}
      <AuthSubmit busy={submitting} disabled={!!oauthProvider}>{t('auth.submit')}</AuthSubmit>
    </form>
    <p className="zt-auth-switch">{t('auth.noAccount')} <a href={authSwitchUrl('/sign-up')}>{t('register.submit')}</a></p>
    <div className="zt-auth-oauth" aria-busy={providersLoading}>
      {(providersLoading || githubEnabled || oidcEnabled) && <>
        <div className="zt-auth-divider">{t('auth.oauthDivider')}</div>
        <div className="zt-auth-providers">
          {providersLoading ? <><div className="zt-auth-provider-placeholder" aria-hidden="true" /><div className="zt-auth-provider-placeholder" aria-hidden="true" /><span className="zt-auth-sr-only" role="status">{t('auth.providersLoading')}</span></> : <>
            {githubEnabled && <button className="zt-auth-provider" type="button" aria-label={t('auth.continueGithub')} aria-busy={oauthProvider === 'github'} disabled={!!oauthProvider || submitting} onClick={() => void startOAuth('github')}>
              {oauthProvider === 'github' ? <span className="zt-auth-spinner" aria-hidden="true" /> : <img src={githubLogo} alt="" width="20" height="20" />}<span>GitHub</span>
            </button>}
            {oidcEnabled && <button className="zt-auth-provider" type="button" aria-label={t('auth.continueGoogle', { provider: providers?.oidcDisplayName || 'Google' })} aria-busy={oauthProvider === 'oidc'} disabled={!!oauthProvider || submitting} onClick={() => void startOAuth('oidc')}>
              {oauthProvider === 'oidc' ? <span className="zt-auth-spinner" aria-hidden="true" /> : <img src={googleLogo} alt="" width="20" height="20" />}<span>{providers?.oidcDisplayName || 'Google'}</span>
            </button>}
          </>}
        </div>
      </>}
    </div>
  </AuthLayout>
}
