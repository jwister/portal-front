import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '../../i18n'
import { PublicHeader } from '../PublicHeader'

describe('PublicHeader', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('zh-CN')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows 登录 when the portal session is anonymous', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })))

    render(<PublicHeader />)

    await waitFor(() => expect(screen.getByRole('button', { name: '登录' })).toBeVisible())
    expect(screen.queryByRole('button', { name: '控制台' })).not.toBeInTheDocument()
    expect(screen.queryByText('alice')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '退出登录' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '控制台' })).not.toBeInTheDocument()
  })

  it('opens the shared account actions on click and restores focus on Escape', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ authenticated: true, profile: { id: 7, username: 'alice' } }), { status: 200 })))

    render(<PublicHeader />)

    expect(await screen.findByRole('button', { name: '控制台' })).toBeVisible()
    const avatar = screen.getByText('的账户菜单').closest('summary')!
    expect(avatar).toBeVisible()
    expect(screen.getByText('alice')).toBeVisible()
    expect(avatar.closest('details')).not.toHaveAttribute('open')
    await user.click(avatar)
    expect(screen.getByText('alice')).toBeVisible()
    expect(screen.getByRole('button', { name: '退出登录' })).toBeVisible()
    // The account menu carries the console link so the phone header can stay one row.
    expect(screen.getByRole('link', { name: '控制台' })).toHaveAttribute('href', '/console/dashboard')
    expect(screen.queryByText('创建账户')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '个人资料' })).toHaveAttribute('href', '/console/profile')
    await user.keyboard('{Escape}')
    expect(avatar.closest('details')).not.toHaveAttribute('open')
    expect(avatar).toHaveFocus()
  })

  it('signs out and returns home from the shared account menu', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ authenticated: true, profile: { id: 7, username: 'alice' } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign })

    render(<PublicHeader />)
    const avatar = (await screen.findByText('的账户菜单')).closest('summary')!
    await user.click(avatar)
    await user.click(screen.getByRole('button', { name: '退出登录' }))

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/'))
    expect(fetchMock).toHaveBeenLastCalledWith('/api/auth/sign-out', expect.objectContaining({ method: 'POST', credentials: 'include' }))
  })
})
