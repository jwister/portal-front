import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Quota granted to every new account, in NewAPI quota units (the unit of
 * `PORTAL_QUOTA_PER_USD`). Each deployment sets the real figure in `/api/config.js`, so the
 * overseas and mainland sites can differ; this one only stands in where that script has not
 * run — the build-time prerender, or a page whose config script failed to load.
 */
const DEFAULT_GIFT_QUOTA = 300_000

/** A configured zero means the deployment gives nothing, so the offer is hidden rather
 *  than advertised at the default. */
function readGiftQuota(): number | null {
  const quota = (window as { PORTAL_QUOTA_FOR_NEW_USER?: unknown }).PORTAL_QUOTA_FOR_NEW_USER
  if (typeof quota !== 'number' || !Number.isFinite(quota)) return DEFAULT_GIFT_QUOTA
  return quota > 0 ? quota : null
}

const subscribe = () => () => {}
const serverSnapshot = () => DEFAULT_GIFT_QUOTA

/** The homepage re-renders on every example rotation, and building an Intl formatter costs
 *  far more than reusing one, so each language keeps its own. */
const formatters = new Map<string, Intl.NumberFormat>()

/** "30万" / "300K": short enough for a badge, in the reader's own numerals. */
function formatGiftQuota(quota: number, language: string): string {
  let formatter = formatters.get(language)
  if (!formatter) {
    formatter = new Intl.NumberFormat(language, { notation: 'compact', maximumFractionDigits: 1 })
    formatters.set(language, formatter)
  }
  return formatter.format(quota)
}

/**
 * The sign-up gift as display text, or null when the deployment gives none.
 *
 * The homepage is prerendered without the config script, so hydration starts from the
 * default and React switches to the deployment's figure right after; reading `window` in
 * that first render instead would make the text disagree with the server HTML. That switch
 * re-renders every component calling this hook, so call it only in the small leaves that
 * print the figure, never in the page itself.
 */
export function useNewUserGift(): string | null {
  const { i18n } = useTranslation()
  const quota = useSyncExternalStore(subscribe, readGiftQuota, serverSnapshot)
  return quota === null ? null : formatGiftQuota(quota, i18n.language)
}
