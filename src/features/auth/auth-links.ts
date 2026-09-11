import { getSafeReturnTo } from '../../api/auth'

export function authSwitchUrl(path: '/sign-in' | '/sign-up'): string {
  const target = new URLSearchParams(window.location.search).get('returnTo')
  return target ? `${path}?${new URLSearchParams({ returnTo: getSafeReturnTo(target) })}` : path
}
