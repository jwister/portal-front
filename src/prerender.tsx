import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { App } from './App'
import i18n, { type PortalLanguage } from './i18n'

/** Build-time only: public content, no account data or network requests. */
export async function renderHome(language: PortalLanguage) {
  await i18n.changeLanguage(language)
  return renderToString(<StrictMode><App /></StrictMode>)
}
