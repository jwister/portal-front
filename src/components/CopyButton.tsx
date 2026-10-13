import { useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * A plain button rather than Semi's: the docs pages render nothing else from Semi, so
 * this keeps the UI library (about 20 kB gzipped) off every documentation visit.
 */
export function CopyButton({ value, label }: { value: string; label?: string }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<'idle' | 'done' | 'error'>('idle')
  const text = label ?? t('models.copyName')
  return <span className="zt-copy">
    <button type="button" className="zt-copy-button" aria-label={text} onClick={async (event) => {
      event.stopPropagation()
      try { await navigator.clipboard.writeText(value); setStatus('done') } catch { setStatus('error') }
    }}>
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {status === 'done' ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" /></>}
      </svg>
      <span>{status === 'done' ? t('models.copied') : text}</span>
    </button>
    <span role="status" className={status === 'error' ? 'zt-copy-error' : 'zt-sr-only'}>{status === 'error' ? t('catalog.copyError') : status === 'done' ? t('models.copied') : ''}</span>
  </span>
}
