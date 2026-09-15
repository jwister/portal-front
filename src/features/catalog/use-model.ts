import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getAuthStatus } from '../../api/auth'
import { getDashboard } from '../../api/portal'
import '../../i18n'

export type ModelConsolePath = '/console/recharge' | '/console/tokens'

export function modelConsoleUrl(path: ModelConsolePath, modelName?: string): string {
  return modelName ? `${path}?${new URLSearchParams({ model: modelName })}` : path
}

/** Read the account once the user chooses a model, rather than for every card. */
export async function resolveModelDestination(modelName?: string): Promise<string> {
  const auth = await getAuthStatus()
  if (!auth || typeof auth.authenticated !== 'boolean') throw new Error('Invalid account status')

  const rechargeUrl = modelConsoleUrl('/console/recharge', modelName)
  if (!auth.authenticated) {
    return `/sign-in?${new URLSearchParams({ returnTo: rechargeUrl })}`
  }

  return resolveBalanceDestination(modelName)
}

export async function resolveBalanceDestination(modelName?: string): Promise<string> {
  const rechargeUrl = modelConsoleUrl('/console/recharge', modelName)

  try {
    const balance = await getDashboard()
    if (
      Number.isFinite(balance.availableQuota)
      && Number.isFinite(balance.quotaPerUsd)
      && balance.quotaPerUsd > 0
      && balance.availableQuota / balance.quotaPerUsd > 10
    ) {
      return modelConsoleUrl('/console/tokens', modelName)
    }
  } catch {
    // The recharge page is a safe destination when the balance cannot be read.
  }
  return rechargeUrl
}

function navigateToDestination(href: string): void {
  window.location.assign(href)
}

/** Share one instance across all cards on a page to suppress simultaneous clicks. */
export function useModelNavigation(navigate: (href: string) => void = navigateToDestination) {
  const { t, i18n } = useTranslation()
  const [pending, setPending] = useState(false)
  const [pendingModelName, setPendingModelName] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const resolving = useRef(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const start = useCallback(async (modelName?: string): Promise<void> => {
    if (resolving.current || !mounted.current) return
    resolving.current = true
    setPending(true)
    setPendingModelName(modelName ?? null)
    setFailed(false)

    try {
      const destination = await resolveModelDestination(modelName)
      if (mounted.current) navigate(destination)
    } catch {
      if (mounted.current) setFailed(true)
    } finally {
      resolving.current = false
      if (mounted.current) {
        setPending(false)
        setPendingModelName(null)
      }
    }
  }, [navigate])

  const error = failed ? t('models.useError', {
    defaultValue: (i18n.resolvedLanguage ?? i18n.language).startsWith('zh')
      ? '暂时无法读取账户状态，请重试。'
      : 'Unable to check your account. Please try again.',
  }) : null

  return { start, pending, pendingModelName, error }
}
