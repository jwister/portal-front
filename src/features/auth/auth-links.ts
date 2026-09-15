import { getSafeReturnTo } from '../../api/auth'

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
