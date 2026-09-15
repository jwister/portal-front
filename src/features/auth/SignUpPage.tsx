import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthApiError, getCaptcha, sendEmailVerification, signUp } from '../../api/auth'
import { AuthDialog, AuthInput, AuthLayout, AuthSubmit, focusInvalidField } from './AuthLayout'
import { authSwitchUrl } from './auth-links'

interface SignUpPageProps { onRegistered?: () => void }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SignUpPage(props: SignUpPageProps) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [captcha, setCaptcha] = useState<{ captchaId: string; image: string } | null>(null)
  const [captchaCode, setCaptchaCode] = useState('')
  const [captchaError, setCaptchaError] = useState<string | null>(null)
  const [captchaLoading, setCaptchaLoading] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [captchaVisible, setCaptchaVisible] = useState(false)
  const [emailValue, setEmailValue] = useState('')
  const [verificationSent, setVerificationSent] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const coolingDown = countdown > 0

  useEffect(() => {
    if (verificationSent && !captchaVisible) {
      const input = formRef.current?.elements.namedItem('verificationCode')
      if (input instanceof HTMLInputElement) input.focus()
    }
  }, [verificationSent, captchaVisible])

  useEffect(() => {
    if (!coolingDown) return
    const expiresAt = Date.now() + 60_000
    const timer = window.setInterval(() => setCountdown(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))), 1000)
    return () => window.clearInterval(timer)
  }, [coolingDown])

  const refreshCaptcha = async () => {
    setCaptchaLoading(true)
    setCaptcha(null)
    setCaptchaCode('')
    try {
      setCaptcha(await getCaptcha())
      return true
    } catch {
      setCaptchaError(t('register.captchaLoadError'))
      return false
    } finally { setCaptchaLoading(false) }
  }

  const openCaptcha = async () => {
    if (coolingDown || captchaLoading || submitting) return
    setError(null)
    setCaptchaError(null)
    if (!emailPattern.test(emailValue.trim())) {
      const errors = { email: 'auth.emailInvalid' }
      setFieldErrors(errors)
      if (formRef.current) focusInvalidField(formRef.current, errors)
      return
    }
    setFieldErrors((errors) => ({ ...errors, email: '' }))
    if (await refreshCaptcha()) setCaptchaVisible(true)
    else setError(t('register.captchaLoadError'))
  }

  const verifyAndSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!captcha || sendingCode || captchaLoading) return
    if (!captchaCode.trim()) { setCaptchaError(t('auth.required')); return }
    setSendingCode(true)
    setCaptchaError(null)
    try {
      await sendEmailVerification(emailValue.trim(), captcha.captchaId, captchaCode.trim())
      setVerificationSent(true)
      setCaptchaVisible(false)
      setCountdown(60)
      setCaptchaCode('')
    } catch (cause) {
      const message = cause instanceof AuthApiError && cause.status > 0 && cause.status < 500 ? cause.message : t('register.verificationSendError')
      setCaptchaError(message)
      await refreshCaptcha()
    } finally { setSendingCode(false) }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    const form = event.currentTarget
    const values = new FormData(form)
    const username = String(values.get('username') || '').trim()
    const email = emailValue.trim()
    const password = String(values.get('password') || '')
    const confirmPassword = String(values.get('confirmPassword') || '')
    const verificationCode = String(values.get('verificationCode') || '').trim()
    const errors: Record<string, string> = {}
    if (!username) errors.username = 'auth.required'
    if (!emailPattern.test(email)) errors.email = 'auth.emailInvalid'
    if (!password) errors.password = 'auth.required'
    if (!confirmPassword) errors.confirmPassword = 'auth.required'
    else if (password !== confirmPassword) errors.confirmPassword = 'register.passwordMismatch'
    if (!verificationCode) errors.verificationCode = 'register.verificationRequired'
    setFieldErrors(errors)
    setError(null)
    if (Object.keys(errors).length) { focusInvalidField(form, errors); return }
    setSubmitting(true)
    try {
      await signUp(username, email, password, verificationCode)
      if (props.onRegistered) props.onRegistered()
      else window.location.assign(authSwitchUrl('/sign-in'))
    } catch (cause) {
      setError(cause instanceof AuthApiError ? cause.message : t('register.error'))
    } finally { setSubmitting(false) }
  }

  return <AuthLayout title={t('register.title')} copy={t('register.copy')} compact>
    <form ref={formRef} className="zt-auth-form" noValidate onSubmit={(event) => void submit(event)}>
      <AuthInput name="username" placeholder={t('register.usernamePlaceholder')} label={t('auth.username')} autoComplete="username" autoCapitalize="none" spellCheck={false} required error={fieldErrors.username ? t(fieldErrors.username) : undefined} />
      <AuthInput name="email" placeholder={t('register.emailPlaceholder')} label={t('auth.email')} type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={emailValue} onChange={(event) => { setEmailValue(event.target.value); setVerificationSent(false) }} readOnly={captchaLoading || captchaVisible || sendingCode} required error={fieldErrors.email ? t(fieldErrors.email) : undefined} />
      <div className="zt-auth-code-row">
        <AuthInput name="verificationCode" placeholder={t('register.verificationCodePlaceholder')} label={t('register.verificationCode')} autoComplete="one-time-code" inputMode="numeric" required error={fieldErrors.verificationCode ? t(fieldErrors.verificationCode) : undefined} />
        <button className="zt-auth-secondary" type="button" disabled={coolingDown || !emailValue || captchaLoading || submitting} aria-busy={captchaLoading} onClick={() => void openCaptcha()}>{captchaLoading && <span className="zt-auth-spinner" aria-hidden="true" />}{coolingDown ? t('register.sendCodeCountdown', { seconds: countdown }) : t('register.sendCode')}</button>
      </div>
      {verificationSent && <p className="zt-auth-success" role="status">{t('register.verificationSent')}</p>}
      <AuthInput name="password" placeholder={t('auth.passwordPlaceholder')} label={t('auth.password')} type="password" autoComplete="new-password" required error={fieldErrors.password ? t(fieldErrors.password) : undefined} />
      <AuthInput name="confirmPassword" placeholder={t('register.confirmPasswordPlaceholder')} label={t('register.confirmPassword')} type="password" autoComplete="new-password" required error={fieldErrors.confirmPassword ? t(fieldErrors.confirmPassword) : undefined} />
      {error && <p className="zt-auth-error" role="alert">{error}</p>}
      <AuthSubmit busy={submitting}>{t('register.submit')}</AuthSubmit>
    </form>
    <p className="zt-auth-switch">{t('register.haveAccount')} <a href={authSwitchUrl('/sign-in')}>{t('auth.submit')}</a></p>
    {captchaVisible && <AuthDialog title={t('register.captchaTitle')} busy={sendingCode} onClose={() => setCaptchaVisible(false)}>
      <form className="zt-auth-form" noValidate onSubmit={(event) => void verifyAndSend(event)}>
        <div className="zt-auth-captcha-image">
          {captcha?.image ? <img src={captcha.image} alt={t('register.captchaImage')} width="160" height="52" /> : captchaLoading ? <span role="status">{t('auth.imageLoading')}</span> : <span aria-hidden="true">—</span>}
          <button type="button" disabled={sendingCode || captchaLoading} onClick={() => { setCaptchaError(null); void refreshCaptcha() }}>{t('register.refreshCaptcha')}</button>
        </div>
        <AuthInput name="captchaCode" placeholder={t('register.captchaCodePlaceholder')} label={t('register.captchaCode')} value={captchaCode} onChange={(event) => setCaptchaCode(event.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} required />
        {captchaError && <p className="zt-auth-error" role="alert">{captchaError}</p>}
        <AuthSubmit busy={sendingCode} disabled={!captcha || captchaLoading}>{t('register.verifyAndSend')}</AuthSubmit>
      </form>
    </AuthDialog>}
  </AuthLayout>
}
