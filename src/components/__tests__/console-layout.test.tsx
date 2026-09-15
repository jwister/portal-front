import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '../../i18n'
import { getDashboard } from '../../api/portal'
import { ConsoleLayout } from '../ConsoleLayout'

describe('ConsoleLayout', () => {
  beforeEach(async () => { await i18n.changeLanguage('zh-CN') })

  it('renders readable console navigation with the active item selected', () => {
    render(<ConsoleLayout activeKey="dashboard"><div>content</div></ConsoleLayout>)

    const brand = screen.getByRole('link', { name: 'ZToken' })
    expect(brand.querySelector('img')).toHaveAttribute('src', expect.stringContaining('brand-logo.webp'))
    const navigation = screen.getByRole('navigation', { name: '控制台导航' })
    expect(navigation).toBeVisible()
    expect(within(navigation).getByText('仪表盘')).toBeVisible()
    expect(within(navigation).getByText('令牌管理')).toBeVisible()
    expect(within(navigation).getByRole('link', { name: '仪表盘' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryAllByText('门户首页')).toHaveLength(0)
  })

  it('renders the console avatar with account actions', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ authenticated: true, profile: { id: 7, username: 'alice' } }), { status: 200 })))
    render(<ConsoleLayout activeKey="dashboard"><div>content</div></ConsoleLayout>)

    const avatar = await screen.findByLabelText('alice 的用户头像')
    await user.click(avatar)
    expect(screen.getByText('alice')).toBeVisible()
    expect(screen.getByRole('button', { name: '退出登录' })).toBeVisible()
    expect(screen.queryAllByText('门户首页')).toHaveLength(0)
  })

  it('opens the mobile drawer and closes it after navigating', async () => {
    const user=userEvent.setup(), navigate=vi.fn()
    render(<ConsoleLayout activeKey="dashboard" onNavigate={navigate} profile={{id:1, username:'demo'}}><div>content</div></ConsoleLayout>)
    await user.click(screen.getByRole('button', {name:'打开控制台导航'}))
    const drawer=screen.getByRole('dialog')
    await user.click(within(drawer).getByRole('link', {name:'令牌管理'}))
    expect(navigate).toHaveBeenCalledWith('/console/tokens')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name:'打开控制台导航'})).toHaveFocus()
  })

  it('shows the account balance in dollars, refreshes it and offers language choices', async () => {
    const fetchMock=vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({availableQuota:6250000,quotaPerUsd:500000,usedQuota:0,requestCount:0,tokenUsage:0}),{status:200})))
    vi.stubGlobal('fetch', fetchMock)
    const user=userEvent.setup(), navigate=vi.fn()
    render(<ConsoleLayout activeKey="profile" onNavigate={navigate} profile={{id:1,username:'alice'}}><div>content</div></ConsoleLayout>)
    expect(await screen.findByRole('link', {name:'当前余额 $12.50，前往充值'})).toHaveAttribute('href','/console/recharge')
    await user.click(screen.getByRole('link', {name:'当前余额 $12.50，前往充值'}))
    expect(navigate).toHaveBeenCalledWith('/console/recharge')
    expect(screen.getByText('alice')).toBeVisible()
    fetchMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({availableQuota:10000000,quotaPerUsd:500000}),{status:200})))
    await getDashboard()
    expect(await screen.findByRole('link', {name:'当前余额 $20.00，前往充值'})).toBeVisible()
    await user.click(screen.getByLabelText('切换语言: 简体中文'))
    await user.click(screen.getByRole('button', {name:'English'}))
    expect(screen.getByLabelText('Choose language: English').closest('details')).not.toHaveAttribute('open')
    expect(screen.getByRole('link', {name:'Current balance $20.00, add credit'})).toBeVisible()
  })

  it('uses in-app navigation for sidebar menu changes', () => {
    const navigate = vi.fn()
    render(<ConsoleLayout activeKey="dashboard" onNavigate={navigate}><div>content</div></ConsoleLayout>)

    const navigation = screen.getByRole('navigation', { name: '控制台导航' })
    within(navigation).getByText('令牌管理').click()

    expect(navigate).toHaveBeenCalledWith('/console/tokens')
  })
})
