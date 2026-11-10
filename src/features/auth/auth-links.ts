import { getSafeReturnTo } from '../../api/auth'

let oauthCallback: { path: string; params: URLSearchParams } | undefined

/** 在任何第三方脚本启动前移除授权参数，仅在本页内存保留，供异步加载的回调页使用。 */
export function readOAuthCallbackParameters(): URLSearchParams {
  const url = new URL(window.location.href)
  if (!/^\/oauth\/(github|oidc)$/.test(url.pathname)) return url.searchParams
  const sensitiveKeys = ['code', 'state', 'error', 'error_description']
  if (sensitiveKeys.some((key) => url.searchParams.has(key))) {
    oauthCallback = { path: url.pathname, params: new URLSearchParams(url.search) }
    sensitiveKeys.forEach((key) => url.searchParams.delete(key))
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  }
  return new URLSearchParams(oauthCallback?.path === url.pathname ? oauthCallback.params : url.searchParams)
}

export function authSwitchUrl(path: '/sign-in' | '/sign-up'): string {
  const target = new URLSearchParams(window.location.search).get('returnTo')
  return target ? `${path}?${new URLSearchParams({ returnTo: getSafeReturnTo(target) })}` : path
}

const oauthReturnKey = (provider: string, state: string) => `ztoken.oauth.returnTo:${provider}:${state}`

export function rememberOAuthReturn(provider: string, state: string): void {
  const target = getSafeReturnTo(new URLSearchParams(window.location.search).get('returnTo'))
  sessionStorage.setItem(oauthReturnKey(provider, state), target)
}

export function consumeOAuthReturn(provider: string, state: string): string {
  const key = oauthReturnKey(provider, state)
  const target = getSafeReturnTo(sessionStorage.getItem(key))
  sessionStorage.removeItem(key)
  return target
}
