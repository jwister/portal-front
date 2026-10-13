import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '../../i18n'
import { Select } from '../Select'

const MODELS = ['claude-sonnet-5', 'deepseek-chat', 'deepseek-reasoner', 'gemini-pro', 'glm-5', 'gpt-5', 'gpt-5-mini', 'kimi-k2', 'qwen-max']
  .map((name) => ({ value: name, label: name }))

function Harness({ options = MODELS, onChange = () => {} }: { options?: typeof MODELS; onChange?: (value: string) => void }) {
  const [value, setValue] = useState(options[1].value)
  return <><Select label="示例模型" value={value} options={options} onChange={(next) => { setValue(next); onChange(next) }} /><button>outside</button></>
}

describe('Select', () => {
  beforeEach(async () => { await i18n.changeLanguage('zh-CN') })

  it('filters a long list and picks with the keyboard', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const trigger = screen.getByRole('combobox', { name: '示例模型' })
    expect(trigger).toHaveTextContent('deepseek-chat')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    // Nine or more options open onto a focused filter box, with the current value marked.
    const search = screen.getByRole('searchbox', { name: '搜索' })
    expect(search).toHaveFocus()
    expect(screen.getByRole('option', { name: 'deepseek-chat' })).toHaveAttribute('aria-selected', 'true')

    await user.type(search, 'gpt')
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['gpt-5', 'gpt-5-mini'])
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenCalledWith('gpt-5-mini')
    expect(trigger).toHaveTextContent('gpt-5-mini')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(trigger).toHaveFocus()

    await user.click(trigger)
    await user.type(screen.getByRole('searchbox'), 'nothing-like-this')
    expect(screen.getByText('没有匹配的选项')).toBeVisible()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(trigger).toHaveFocus()
  })

  it('keeps short lists on the trigger and closes on an outside press', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness options={MODELS.slice(0, 3)} onChange={onChange} />)
    const trigger = screen.getByRole('combobox', { name: '示例模型' })
    trigger.focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.queryByRole('searchbox')).toBeNull()
    expect(trigger).toHaveFocus()
    // The highlighted option starts on the current value and follows the arrows.
    expect(trigger.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: 'deepseek-chat' }).id)
    await user.keyboard('{ArrowDown}')
    expect(trigger.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: 'deepseek-reasoner' }).id)

    await user.click(screen.getByRole('button', { name: 'outside' }))
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(onChange).not.toHaveBeenCalled()

    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: 'claude-sonnet-5' }))
    expect(onChange).toHaveBeenCalledWith('claude-sonnet-5')
  })
})
