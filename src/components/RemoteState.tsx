import { useTranslation } from 'react-i18next'

import '../i18n'

export type RemoteStateKind = 'loading' | 'error' | 'empty'

interface RemoteStateProps {
  kind: RemoteStateKind
  onRetry?: () => void
}

export function RemoteState({ kind, onRetry }: RemoteStateProps) {
  const { t } = useTranslation()

  if (kind === 'loading') {
    return (
      <div className="remote-state" role="status" aria-live="polite">
        <span className="console-loading-ring" aria-hidden="true" />
        <span>{t('common.loading')}</span>
      </div>
    )
  }

  if (kind === 'error') {
    return (
      <div className="remote-state" role="alert">
        <p>{t('common.loadError')}</p>
        {onRetry && <button className="console-button" type="button" onClick={onRetry}>{t('common.retry')}</button>}
      </div>
    )
  }

  return (
    <div className="remote-state">
      <p>{t('common.empty')}</p>
    </div>
  )
}
