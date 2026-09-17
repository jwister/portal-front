import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { setStoredLanguage } from '../i18n'
import { ConsoleIcon } from './ConsoleIcon'

export function LanguageMenu() {
  const { t, i18n } = useTranslation()
  const menu = useRef<HTMLDetailsElement>(null)
  const current = i18n.language.startsWith('zh') ? 'zh-CN' : 'en'
  const label = current === 'zh-CN' ? '简体中文' : 'English'
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menu.current?.contains(event.target)) menu.current?.removeAttribute('open')
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !menu.current?.open) return
      menu.current.removeAttribute('open')
      menu.current.querySelector('summary')?.focus()
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [])
  return <details ref={menu} className="zt-language-menu" name="console-account-menu">
    <summary aria-label={`${t('console.language')}: ${label}`}><ConsoleIcon name="language" /><span className="zt-language-label">{label}</span><span className="zt-language-short" aria-hidden="true">{current === 'zh-CN' ? '中文' : 'EN'}</span><ConsoleIcon name="chevron" /></summary>
    <div className="zt-language-panel">{(['zh-CN', 'en'] as const).map((language) => <button key={language} type="button" aria-pressed={current === language} onClick={() => { void setStoredLanguage(language); menu.current?.removeAttribute('open'); menu.current?.querySelector('summary')?.focus() }}>{language === 'zh-CN' ? '简体中文' : 'English'}{current === language && <span aria-hidden="true">✓</span>}</button>)}</div>
  </details>
}
