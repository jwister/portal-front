import telegramQr from '../assets/telegram-qr.webp'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { openSupportChat } from '../support/chat'

type SupportIconName = 'chat' | 'mail' | 'billing' | 'code' | 'arrow' | 'close'

function SupportIcon({ name }: { name: SupportIconName }) {
  const paths = {
    chat: <path d="M20 11.5a8 8 0 0 1-8 8H6l-4 3V11.5a8 8 0 0 1 16-1M7 10h6M7 14h4" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 6 9 7 9-7" /></>,
    billing: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18M7 15h4" /></>,
    code: <path d="m8 7-5 5 5 5m8-10 5 5-5 5M14 4l-4 16" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export function ContactWidget() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [chatPending, setChatPending] = useState(false)
  const [chatError, setChatError] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 800px)')
    const change = () => { setMobile(query.matches); setOpen(false); setChatPending(false) }
    change()
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])
  useEffect(() => {
    if (open && mobile && dialog.current) {
      if (dialog.current.showModal) dialog.current.showModal()
      else dialog.current.setAttribute('open', '')
    }
  }, [open, mobile])
  const startChat = () => {
    setChatError(false)
    setOpen(false)
    if (!openSupportChat()) setChatPending(true)
  }
  useEffect(() => {
    if (!chatPending) return
    const ready = () => { if (openSupportChat()) { setChatPending(false); setOpen(false) } }
    const failed = () => { setChatPending(false); setChatError(true) }
    window.addEventListener('ztoken:chat-ready', ready)
    window.addEventListener('ztoken:chat-error', failed)
    const timeout = window.setTimeout(() => { setChatPending(false); setChatError(true) }, 12000)
    return () => { window.removeEventListener('ztoken:chat-ready', ready); window.removeEventListener('ztoken:chat-error', failed); window.clearTimeout(timeout) }
  }, [chatPending])
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() }
    }
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('keydown', close)
    document.addEventListener('pointerdown', outside)
    return () => {
      document.removeEventListener('keydown', close)
      document.removeEventListener('pointerdown', outside)
    }
  }, [open])
  const panel = <>
        <header className="contact-panel-header">
          <div><h2 id="contact-title">{t('contact.title')}</h2><p>{t('contact.intro')}</p></div>
          <button type="button" className="contact-close" aria-label={t('contact.close')} onClick={() => { setOpen(false); trigger.current?.focus() }}><SupportIcon name="close" /></button>
        </header>
        <div className="contact-panel-body">
          <div className="contact-channel">
            <span className="contact-channel-icon"><SupportIcon name="billing" /></span>
            <div><h3>{t('contact.financeTitle')}</h3><p>{t('contact.financeHint')}</p><a href="mailto:support.02@ztoken.cc">support.02@ztoken.cc</a></div>
          </div>
          <div className="contact-channel">
            <span className="contact-channel-icon"><SupportIcon name="code" /></span>
            <div><h3>{t('contact.techTitle')}</h3><p>{t('contact.techHint')}</p><a href="mailto:support.01@ztoken.cc">support.01@ztoken.cc</a></div>
          </div>
          <div className="contact-telegram">
            <div><h3>{t('contact.telegram')}</h3><p>{t('contact.telegramHint')}</p><a href="https://t.me/AWSVIP321" target="_blank" rel="noopener noreferrer">@AWSVIP321 <SupportIcon name="arrow" /></a></div>
            <img src={telegramQr} alt={t('contact.telegramQr')} width="108" height="108" loading="lazy" decoding="async" />
          </div>
        </div>
      </>
  return <>
    <div className="contact-widget" ref={root}>
      {open && (mobile ? <dialog ref={dialog} className="contact-mobile-sheet" onClick={(event) => { if (event.target !== event.currentTarget) return; const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) { setOpen(false); trigger.current?.focus() } }} id="contact-panel" aria-labelledby="contact-title" onCancel={(event) => { event.preventDefault(); setOpen(false); trigger.current?.focus() }}>{panel}</dialog> : <section className="contact-panel" id="contact-panel" aria-labelledby="contact-title">{panel}</section>)}
      <button type="button" className="contact-trigger" ref={trigger} aria-expanded={open} aria-controls="contact-panel" aria-label={t('contact.title')} onClick={() => { setChatPending(false); setChatError(false); setOpen(!open) }}>
        <SupportIcon name={open ? 'close' : 'mail'} /><span>{t('contact.title')}</span>
      </button>
      {mobile && <button type="button" className="contact-chat-trigger" disabled={chatPending} aria-label={t(chatPending ? 'contact.chatLoading' : 'contact.onlineChat')} onClick={startChat}><SupportIcon name="chat" /><span>{t(chatPending ? 'contact.chatLoading' : 'contact.chatTrigger')}</span></button>}
      {mobile && chatError && <p className="contact-chat-status" role="alert">{t('contact.chatUnavailable')}</p>}
    </div>

  </>
}
