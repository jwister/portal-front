import { useEffect, useRef, useState } from 'react'
import { AuthLayout } from './AuthLayout'
import { useTranslation } from 'react-i18next'

import { completeOAuth } from '../../api/auth'
import { consumeOAuthReturn } from './auth-links'
import { resolveBalanceDestination } from '../catalog/use-model'
import '../../i18n'

interface OAuthCallbackPageProps {
  provider: 'github' | 'oidc'
  onAuthenticated?: () => void
}

/**
 * 接收授权服务的短期回调参数并交给 Portal BFF；页面不展示或持久化其中的敏感值。
 */
export function OAuthCallbackPage({ provider, onAuthenticated }: OAuthCallbackPageProps) {
  const { t } = useTranslation()
  const started = useRef(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const query = new URLSearchParams(window.location.search)
    const code = query.get('code')
    const state = query.get('state')
    const error = query.get('error')
    const errorDescription = query.get('error_description')
    if (!state || (!code && !error)) {
      setFailed(true)
      return
    }
    void completeOAuth(provider, { code, state, error, errorDescription })
      .then(async () => {
        const target = consumeOAuthReturn(provider, state)
        if (onAuthenticated) onAuthenticated()
        else {
          const url = new URL(target, window.location.origin)
          const model = url.searchParams.get('model')
          window.location.replace(url.pathname === '/console/recharge' && model ? await resolveBalanceDestination(model) : target)
        }
      })
      .catch(() => setFailed(true))
  }, [onAuthenticated, provider])

  return (
    <AuthLayout title={t(failed ? 'auth.oauthFailed' : 'auth.oauthLoading')}>
      <div aria-live="polite">
        {failed ? <>
          <p role="alert">{t('auth.oauthFailed')}</p>
          <button className="zt-auth-primary" type="button" onClick={() => window.location.replace('/sign-in')}>{t('auth.submit')}</button>
        </> : <>
          <p className="zt-auth-callback" role="status"><span className="zt-auth-spinner" aria-hidden="true" />{t('auth.oauthLoading')}</p>
        </>}
      </div>
    </AuthLayout>
  )
}
