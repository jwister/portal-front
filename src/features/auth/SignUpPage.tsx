import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Captcha } from 'aj-captcha-react'
import { AuthApiError, sendEmailVerification, signUp } from '../../api/auth'
import { AuthInput, AuthLayout, AuthSubmit, focusInvalidField } from './AuthLayout'
import { authSwitchUrl } from './auth-links'

interface SignUpPageProps { onRegistered?: () => void }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SignUpPage(props: SignUpPageProps) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [sendingCode, setSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [emailValue, setEmailValue] = useState('')
  const [verificationSent, setVerificationSent] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const coolingDown = countdown > 0

  useEffect(() => {
    if (verificationSent) {
      const input = formRef.current?.elements.namedItem('verificationCode')
      if (input instanceof HTMLInputElement) input.focus()
    }
  }, [verificationSent])

  useEffect(() => {
    if (!coolingDown) return
    const expiresAt = Date.now() + 60_000
    const timer = window.setInterval(() => setCountdown(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))), 1000)
    return () => window.clearInterval(timer)
  }, [coolingDown])

  const captchaRef = useRef<any>(null);

  const openCaptcha = async () => {
    if (coolingDown || submitting) return;
    setError(null);
    if (!emailPattern.test(emailValue.trim())) {
      const errors = { email: 'auth.emailInvalid' };
      setFieldErrors(errors);
      if (formRef.current) focusInvalidField(formRef.current, errors);
      return;
    }
    setFieldErrors((errors) => ({ ...errors, email: '' }));
    captchaRef.current?.verify();
  };

  const onCaptchaSuccess = async (data: any) => {
    if (sendingCode) return;
    setSendingCode(true);
    try {
      await sendEmailVerification(emailValue.trim(), data.captchaVerification);
      setVerificationSent(true);
      setCountdown(60);
    } catch (cause) {
      setError(cause instanceof AuthApiError && cause.status > 0 && cause.status < 500 ? cause.message : t('register.verificationSendError'));
    } finally {
      setSendingCode(false);
    }
  };

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
      <AuthInput name="email" placeholder={t('register.emailPlaceholder')} label={t('auth.email')} type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={emailValue} onChange={(event) => { setEmailValue(event.target.value); setVerificationSent(false) }} readOnly={sendingCode} required error={fieldErrors.email ? t(fieldErrors.email) : undefined} />
      <div className="zt-auth-code-row">
        <AuthInput name="verificationCode" placeholder={t('register.verificationCodePlaceholder')} label={t('register.verificationCode')} autoComplete="one-time-code" inputMode="numeric" required error={fieldErrors.verificationCode ? t(fieldErrors.verificationCode) : undefined} />
        <button className="zt-auth-secondary" type="button" disabled={coolingDown || !emailValue || submitting} onClick={() => void openCaptcha()}>{coolingDown ? t('register.sendCodeCountdown', { seconds: countdown }) : t('register.sendCode')}</button>
      </div>
      {verificationSent && <p className="zt-auth-success" role="status">{t('register.verificationSent')}</p>}
      <AuthInput name="password" placeholder={t('auth.passwordPlaceholder')} label={t('auth.password')} type="password" autoComplete="new-password" required error={fieldErrors.password ? t(fieldErrors.password) : undefined} />
      <AuthInput name="confirmPassword" placeholder={t('register.confirmPasswordPlaceholder')} label={t('register.confirmPassword')} type="password" autoComplete="new-password" required error={fieldErrors.confirmPassword ? t(fieldErrors.confirmPassword) : undefined} />
      {error && <p className="zt-auth-error" role="alert">{error}</p>}
      <AuthSubmit busy={submitting}>{t('register.submit')}</AuthSubmit>
    </form>
    <p className="zt-auth-switch">{t('register.haveAccount')} <a href={authSwitchUrl('/sign-in')}>{t('auth.submit')}</a></p>
    <Captcha
      ref={captchaRef}
      path="/api" // Our backend API proxies /api
      type="auto"
      onSuccess={onCaptchaSuccess}
    />
  </AuthLayout>
}
