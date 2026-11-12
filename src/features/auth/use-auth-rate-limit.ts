import { useEffect, useState } from 'react'
import { AuthApiError } from '../../api/auth'

/** 登录与注册共用等待状态，不自动重放密码提交或一次性 OAuth 授权。 */
export function useAuthRateLimit() {
  const [until, setUntil] = useState(0)
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!until) return
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000))
      setSeconds(remaining)
      if (!remaining) window.clearInterval(timer)
    }, 250)
    return () => window.clearInterval(timer)
  }, [until])

  /** 缺少有效 Retry-After 时仅短暂等待，避免永久禁用入口。 */
  const handle = (cause: unknown): boolean => {
    if (!(cause instanceof AuthApiError) || cause.status !== 429) return false
    const delay = Math.max(1, cause.retryAfterSeconds ?? 30)
    setSeconds(delay)
    setUntil(Date.now() + delay * 1000)
    return true
  }
  return { seconds, handle }
}
