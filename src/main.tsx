import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'


import { App } from './App'
import './i18n'
import './styles/base.css'
import './styles/home-reference.css'
import { scheduleSupportChat } from './support/load-chat'

const root = document.getElementById('root')!
const app = <StrictMode><App /></StrictMode>
if (root.dataset.prerendered === 'true') hydrateRoot(root, app)
else createRoot(root).render(app)
scheduleSupportChat()
