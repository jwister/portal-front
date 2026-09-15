import type { MouseEvent } from 'react'
import { getAuthStatus, getSafeReturnTo } from '../api/auth'
import type { AuthStatus } from './use-auth-status'

export function signInUrl(returnTo: string): string {
  return `/sign-in?${new URLSearchParams({ returnTo: getSafeReturnTo(returnTo) })}`
}

/** Preserve normal link behavior, but wait for an in-flight status check on click. */
export function authenticatedLink(status: AuthStatus, destination: string) {
  return {
    href: status.kind === 'authenticated' ? destination : signInUrl(destination),
    onClick: async (event: MouseEvent<HTMLAnchorElement>) => {
      if (status.kind !== 'loading' || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      try {
        const result = await getAuthStatus()
        window.location.assign(result.authenticated ? destination : signInUrl(destination))
      } catch {
        window.location.assign(signInUrl(destination))
      }
    },
  }
}
