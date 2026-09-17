import type { MouseEvent } from 'react'

/**
 * The app listens for `popstate` to pick up the current route, so an in-page
 * navigation has to announce itself: `pushState` alone fires no event.
 */
export function navigateTo(path: string): void {
  if (window.location.pathname + window.location.search === path) return
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

/**
 * A modified click means the visitor asked for a new tab, a download or a paste
 * target, so those must keep the browser's own behavior.
 */
export function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}
