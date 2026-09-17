import { useTranslation } from 'react-i18next'

import '../i18n'

/**
 * Drawn with plain CSS on purpose. This is what a visitor looks at while a route
 * chunk downloads, so it must paint from the entry bundle alone — a fallback built
 * out of UI-library components cannot appear until that library has itself arrived.
 */
export function RouteFallback({ labelKey = 'common.loading' }: { labelKey?: string }) {
  const { t } = useTranslation()
  const label = t(labelKey)
  return <div className="route-fallback" role="status" aria-live="polite">
    <span className="route-fallback-ring" aria-hidden="true" />
    <p>{label}</p>
  </div>
}
