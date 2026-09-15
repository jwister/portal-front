import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../../i18n'
import { ContactWidget } from '../ContactWidget'

vi.mock('../../support/chat', () => ({ openSupportChat: vi.fn(() => false) }))
import { openSupportChat } from '../../support/chat'

describe('contact and chat', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks() })
  beforeEach(async () => { await i18n.changeLanguage('zh-CN') })

  it('dismisses a pending mobile chat without opening it when readiness arrives later', async () => {
    const original = window.matchMedia
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({ ...original(query), matches:true }))
    const user=userEvent.setup()
    render(<ContactWidget />)
    await user.click(screen.getByRole('button', {name:'在线客服'}))
    expect(screen.getByRole('button', {name:'正在打开客服…'})).toBeDisabled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', {name:'联系我们'}))
    expect(screen.getByRole('dialog')).toBeVisible()
    expect(screen.getByRole('dialog')).not.toHaveTextContent('在线客服')
    await user.click(screen.getByRole('button', {name:'关闭联系面板'}))
    window.dispatchEvent(new Event('ztoken:chat-ready'))
    expect(openSupportChat).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name:'联系我们'})).toHaveFocus()
  })

  it('supports keyboard access to the independent contact panel', async () => {
    const user = userEvent.setup()
    render(<ContactWidget />)
    expect(screen.queryByAltText('Telegram 客服二维码')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '联系我们' }))
    expect(screen.getByRole('link', { name: 'support.02@ztoken.cc' })).toHaveAttribute('href', 'mailto:support.02@ztoken.cc')
    expect(screen.getByRole('link', { name: 'support.01@ztoken.cc' })).toHaveAttribute('href', 'mailto:support.01@ztoken.cc')
    expect(screen.getByAltText('Telegram 客服二维码')).toBeVisible()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('heading', { name: '联系我们' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '联系我们' })).toHaveFocus()
  })

  it('closes from the panel and leaves chat to the native Tidio bubble', async () => {
    const user = userEvent.setup()
    render(<ContactWidget />)
    expect(screen.queryByRole('button', { name: '在线客服' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '联系我们' }))
    await user.click(screen.getByRole('button', { name: '关闭联系面板' }))
    expect(screen.queryByRole('heading', { name: '联系我们' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '联系我们' })).toHaveFocus()
  })
})
