import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import './select.css'

export interface SelectOption { value: string; label: string }

/** Long lists get a filter box; short ones open straight onto the options. */
const SEARCH_FROM = 9

/**
 * The public site's dropdown, replacing the native select whose popup cannot be styled.
 * Follows the WAI-ARIA select-only combobox pattern: the trigger (or the filter box, when
 * there is one) keeps focus and points at the highlighted option with aria-activedescendant.
 */
export function Select({ label, value, options, onChange, className }: {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  className?: string
}) {
  const { t } = useTranslation()
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const searchable = options.length >= SEARCH_FROM
  const needle = query.trim().toLowerCase()
  const shown = needle ? options.filter((option) => option.label.toLowerCase().includes(needle)) : options
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView?.({ block: 'nearest' })
  }, [open, active])

  const show = () => {
    setQuery('')
    setActive(Math.max(0, options.findIndex((option) => option.value === value)))
    setOpen(true)
  }
  const close = (refocus = true) => { setOpen(false); if (refocus) trigger.current?.focus() }
  const choose = (option: SelectOption | undefined) => {
    if (!option) return
    if (option.value !== value) onChange(option.value)
    close()
  }
  const move = (event: KeyboardEvent) => {
    const last = shown.length - 1
    const next = { ArrowDown: Math.min(active + 1, last), ArrowUp: Math.max(active - 1, 0), Home: 0, End: last, PageDown: Math.min(active + 8, last), PageUp: Math.max(active - 8, 0) }[event.key]
    if (next !== undefined) { event.preventDefault(); setActive(next); return }
    if (event.key === 'Enter') { event.preventDefault(); choose(shown[active]) }
    else if (event.key === 'Escape') { event.preventDefault(); close() }
    else if (event.key === 'Tab') close(false)
  }
  const optionId = (index: number) => `${id}-option-${index}`
  const activeId = open && shown[active] ? optionId(active) : undefined

  return <div ref={root} className={`zt-select${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`}>
    <span className="zt-select-label" id={`${id}-label`}>{label}</span>
    <div className="zt-select-control">
      <button ref={trigger} type="button" className="zt-select-trigger" role="combobox" aria-haspopup="listbox" aria-expanded={open}
        aria-controls={`${id}-list`} aria-labelledby={`${id}-label`} aria-activedescendant={searchable ? undefined : activeId}
        onClick={() => (open ? close() : show())}
        onKeyDown={(event) => {
          if (open && !searchable) return move(event)
          if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) { event.preventDefault(); show() }
        }}>
        <span className="zt-select-value">{selected?.label ?? value}</span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && <div className="zt-select-popover">
        {searchable && <div className="zt-select-search">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input autoFocus type="search" value={query} placeholder={t('common.search')} aria-label={t('common.search')} aria-controls={`${id}-list`}
            aria-activedescendant={activeId} autoComplete="off" spellCheck={false}
            onChange={(event) => { setQuery(event.target.value); setActive(0) }} onKeyDown={move} />
        </div>}
        <ul ref={list} id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`}>
          {shown.map((option, index) => <li key={option.value} id={optionId(index)} role="option" aria-selected={option.value === value}
            className={index === active ? 'is-active' : undefined} onPointerMove={() => setActive(index)}
            onClick={() => choose(option)}>
            <span>{option.label}</span>
            {option.value === value && <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>}
          </li>)}
        </ul>
        {!shown.length && <p className="zt-select-empty">{t('common.noMatch')}</p>}
      </div>}
    </div>
  </div>
}
