import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'

export const LOCALE_STORAGE_KEY = 'ztoken.locale'

export type PortalLanguage = 'en' | 'zh-CN'

export function detectPortalLanguage(browserLanguage: string | undefined): PortalLanguage {
  return browserLanguage?.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}

export function resolveInitialLanguage(languages: readonly string[]): PortalLanguage {
  let stored: string | null = null
  try { stored = typeof localStorage === 'undefined' ? null : localStorage.getItem(LOCALE_STORAGE_KEY) } catch { /* Storage can be disabled in private browsing. */ }
  if (stored === 'en' || stored === 'zh-CN') return stored
  return detectPortalLanguage(languages[0])
}

export function setStoredLanguage(language: PortalLanguage): void {
  localStorage.setItem(LOCALE_STORAGE_KEY, language)
  void i18n.changeLanguage(language)
}

const browserLanguages = typeof navigator === 'undefined' ? [] : navigator.languages

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'zh-CN': { translation: zhCN },
  },
  lng: resolveInitialLanguage(browserLanguages),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

if (typeof document !== 'undefined') {
  const updateMetadata = () => {
    document.documentElement.lang = i18n.language
    document.title = i18n.t('site.title')
    document.querySelector('meta[name="description"]')?.setAttribute('content', i18n.t('site.description'))
  }
  i18n.on('languageChanged', updateMetadata)
  updateMetadata()
}

export default i18n
