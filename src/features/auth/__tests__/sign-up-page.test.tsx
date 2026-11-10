import brandLogo from '../../../assets/brand-logo.webp'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SignUpPage } from '../SignUpPage'

const { trackRegistration } = vi.hoisted(() => ({ trackRegistration: vi.fn() }))
vi.mock('../../../support/google-ads', () => ({ trackRegistration }))
// 只模拟滑块验证成功，避免测试访问验证码组件内部的真实网络接口。
vi.mock('aj-captcha-react', async () => {
  const { forwardRef, useImperativeHandle } = await import('react')
  return { Captcha: forwardRef(({ onSuccess }: { onSuccess: (data: unknown) => void }, ref) => {
    useImperativeHandle(ref, () => ({ verify: () => onSuccess({ captchaVerification: 'captcha-proof' }) }))
    return null
  }) }
})

/** 使用当前表单字段提交账号，验证码组件本身由独立测试负责。 */
function submitValidForm(email = 'alice@example.com', confirmation = 'password') {
  for (const [label, value] of [['Username', 'alice'], ['Email', email], ['Password', 'password'], ['Confirm password', confirmation], ['Email verification code', '123456']]) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
  }
  fireEvent.submit(screen.getByRole('button', { name: 'Create account' }).closest('form')!)
}

describe('SignUpPage', () => {
  beforeEach(() => { trackRegistration.mockReset().mockResolvedValue(undefined) })
  afterEach(() => { vi.unstubAllGlobals() })

  it('uses the shared ZToken logo', () => {
    render(<SignUpPage />)
    expect(screen.getByRole('link', { name: 'ZToken' }).querySelector('img')).toHaveAttribute('src', brandLogo)
  })

  it('reports email registration only after success and waits before entering the next page', async () => {
    let processed!: () => void
    trackRegistration.mockImplementation(() => new Promise<void>((resolve) => { processed = resolve }))
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const onRegistered = vi.fn()
    render(<SignUpPage onRegistered={onRegistered} />)
    submitValidForm()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/auth/sign-up', expect.objectContaining({
      method: 'POST', credentials: 'include', body: JSON.stringify({ username: 'alice', email: 'alice@example.com', password: 'password', verificationCode: '123456' }),
    })))
    await waitFor(() => expect(trackRegistration).toHaveBeenCalledOnce())
    expect(onRegistered).not.toHaveBeenCalled()
    processed()
    await waitFor(() => expect(onRegistered).toHaveBeenCalledOnce())
  })

  it('does not report a rejected registration', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Account already exists' }), { status: 400 })))
    render(<SignUpPage />)
    submitValidForm()
    expect(await screen.findByRole('alert')).toHaveTextContent('Account already exists')
    expect(trackRegistration).not.toHaveBeenCalled()
  })

  it.each([
    ['not-an-email', 'password', 'Please enter a valid email address.'],
    ['alice@example.com', 'different', 'Passwords do not match.'],
  ])('rejects invalid input before requesting or reporting (%s)', (email, confirmation, error) => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<SignUpPage />)
    submitValidForm(email, confirmation)
    expect(screen.getByText(error)).toBeVisible()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(trackRegistration).not.toHaveBeenCalled()
  })

  it('sends the email code after slider verification and restores the send button on failure', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<SignUpPage />)
    await user.type(screen.getByLabelText('Email'), 'alice@example.com')
    await user.click(screen.getByRole('button', { name: 'Send code' }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeVisible())
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('captchaVerification=captcha-proof'), expect.anything())
    expect(screen.getByRole('button', { name: 'Send code' })).toBeEnabled()
    expect(trackRegistration).not.toHaveBeenCalled()
  })
})
