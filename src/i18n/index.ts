import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

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

/**
 * Each translation table is ~16 kB compressed and a visitor reads one of them, so
 * they ship as their own chunks instead of riding along in the entry bundle. The
 * pre-hydration bootstrap preloads the one it picked, so this costs no extra round
 * trip: the table downloads beside the application code rather than after it.
 */
const tables: Record<PortalLanguage, () => Promise<{ default: object }>> = {
  en: () => import('./locales/en.json'),
  'zh-CN': () => import('./locales/zh-CN.json'),
}

async function addTable(language: PortalLanguage): Promise<void> {
  if (i18n.hasResourceBundle(language, 'translation')) return
  const { default: translation } = await tables[language]()
  i18n.addResourceBundle(language, 'translation', translation, true, true)
}

/** Adds a table, waiting for the instance to exist. Safe to call at any time. */
export async function loadLocale(language: PortalLanguage): Promise<void> {
  await i18nReady
  await addTable(language)
}

export async function setStoredLanguage(language: PortalLanguage): Promise<void> {
  try { localStorage.setItem(LOCALE_STORAGE_KEY, language) } catch { /* Storage can be disabled in private browsing. */ }
  await loadLocale(language)
  await i18n.changeLanguage(language)
}

// Mirrors the pre-hydration bootstrap in deploy/prerender.mjs, which reads
// `navigator.languages?.[0] || navigator.language`. If the two disagreed, the
// prerendered homepage would flash one language and hydrate into the other.
const browserLanguages = typeof navigator === 'undefined' ? []
  : navigator.languages?.length ? navigator.languages : [navigator.language]

const initialLanguage = resolveInitialLanguage(browserLanguages)

/**
 * Resolves once the instance holds the visitor's table. `main.tsx` renders behind
 * it, so no component can call `t()` before its translations exist. A top-level
 * await here would read better but needs a newer build target than this site sets.
 */
export const i18nReady: Promise<void> = (async () => {
  await i18n.use(initReactI18next).init({
    resources: {},
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })
  await addTable(initialLanguage)
  if (typeof document === 'undefined') return
  const updateMetadata = () => {
    document.documentElement.lang = i18n.language
    document.title = i18n.t('site.title')
    document.querySelector('meta[name="description"]')?.setAttribute('content', i18n.t('site.description'))
  }
  i18n.on('languageChanged', updateMetadata)
  updateMetadata()
})()

export default i18n
