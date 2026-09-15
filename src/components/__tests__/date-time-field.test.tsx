import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import i18n from '../../i18n'
import { DateTimeField } from '../DateTimeField'

beforeEach(async()=>{await i18n.changeLanguage('en')})

it('opens from the entire field, edits a date across months and commits on Enter without submitting the surrounding form',async()=>{
  const user=userEvent.setup(), change=vi.fn(), submit=vi.fn(event=>event.preventDefault())
  render(<form onSubmit={submit}><DateTimeField label="Start time" value="2026-09-15T12:30" onChange={change}/></form>)
  const trigger=screen.getByRole('button',{name:/^Start time/})
  await user.click(trigger)
  const picker=screen.getByRole('dialog',{name:/^Start time/})
  await user.click(within(picker).getByRole('button',{name:'Next month'}))
  await user.click(within(picker).getByRole('button',{name:'October 10, 2026'}))
  const hour=within(picker).getByRole('spinbutton',{name:'Hour'})
  await user.clear(hour);await user.type(hour,'09');await user.keyboard('{Enter}')
  expect(change).toHaveBeenCalledWith('2026-10-10T09:30')
  expect(submit).not.toHaveBeenCalled()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
})

it('rejects times beyond the filter range and cancels without changing the filter',async()=>{
  const user=userEvent.setup(),change=vi.fn()
  render(<DateTimeField label="End time" value="2026-09-15T12:30" min="2026-09-15T12:00" max="2026-09-15T13:00" onChange={change}/>)
  await user.click(screen.getByRole('button',{name:/^End time/}))
  const picker=screen.getByRole('dialog')
  expect(within(picker).getByRole('button',{name:'September 14, 2026'})).toBeDisabled()
  const hour=within(picker).getByRole('spinbutton',{name:'Hour'})
  await user.clear(hour);await user.type(hour,'14')
  expect(within(picker).getByRole('button',{name:'Confirm'})).toBeDisabled()
  await user.click(within(picker).getByRole('button',{name:'Close date picker'}))
  expect(change).not.toHaveBeenCalled()
})
