import githubIcon from '../../assets/github.webp'
import googleIcon from '../../assets/google.webp'
import mailIcon from '../../assets/mail.webp'
import { useAuthStatus } from '../../auth/use-auth-status'
import { authenticatedLink } from '../../auth/auth-links'
import { vendorLogoUrl } from '../catalog/vendor-logos'
import { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import '../../i18n'
import { useScrollReveal } from './use-scroll-reveal'
import { useNewUserGift } from './use-new-user-gift'

type FeatureIcon = 'shield' | 'privacy' | 'route' | 'code' | 'wallet' | 'team' | 'gift'

const apiDemos = [
  {
    label: 'Chat',
    method: 'POST',
    endpoint: '/v1/chat/completions',
    request: `curl -X POST /v1/chat/completions \\
  -H "Authorization: Bearer sk-..." \\
  -d '{
    "model": "gpt-4o",
    "messages": [{ "role": "user", "content": "Hello!" }]
  }'`,
    response: `{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Chat request routed."
    }
  }]
}`,
    stats: ['184 MS', '31 TOKENS', 'COST  $0.00093', 'STREAM · SSE'],
  },
  {
    label: 'Responses',
    method: 'POST',
    endpoint: '/v1/responses',
    request: `curl -X POST /v1/responses \\
  -H "Authorization: Bearer sk-..." \\
  -d '{
    "model": "gpt-4o",
    "input": "Explain API gateways"
  }'`,
    response: `{
  "id": "resp_abc123",
  "output": [{
    "type": "message",
    "content": [{ "text": "Responses API routed." }]
  }]
}`,
    stats: ['243 MS', '27 TOKENS', 'COST  $0.00081', 'STREAM · SSE'],
  },
  {
    label: 'Claude',
    method: 'POST',
    endpoint: '/v1/messages',
    request: `curl -X POST /v1/messages \\
  -H "x-api-key: sk-..." \\
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 256,
    "messages": [{ "role": "user", "content": "Hello!" }]
  }'`,
    response: `{
  "id": "msg_abc123",
  "type": "message",
  "content": [{
    "type": "text",
    "text": "Claude request routed."
  }]
}`,
    stats: ['216 MS', '29 TOKENS', 'COST  $0.00112', 'STREAM · SSE'],
  },
  {
    label: 'Gemini',
    method: 'POST',
    endpoint: '/v1beta/models/{model}:generateContent',
    request: `curl -X POST /v1beta/models/gemini-pro:generateContent \\
  -H "x-goog-api-key: sk-..." \\
  -d '{
    "contents": [{
      "parts": [{ "text": "Hello!" }]
    }]
  }'`,
    response: `{
  "candidates": [{
    "content": {
      "parts": [{ "text": "Gemini request routed." }]
    }
  }]
}`,
    stats: ['201 MS', '25 TOKENS', 'COST  $0.00072', 'STREAM · SSE'],
  },
] as const

/**
 * A hand-picked shortlist, not the catalog: the homepage is prerendered, so these rows ship
 * as static HTML while `/models` reads every model and its live rate from the gateway.
 *
 * Both figures are the price after the default group discount, matching what a card on
 * `/models` shows, and each group names the copy that labels them — token models quote
 * input and output per million, video models quote two resolutions per second. Re-check
 * every figure against `/api/catalog/pricing` whenever a rate changes; nothing here fails
 * when the gateway moves. Last checked 2026-09-20.
 *
 * Models whose rate varies per request (`deepseek-v4.1-flash` off-peak, `glm-5.1` input
 * bands) are deliberately left out: one price slot cannot state two, and half a story about
 * a price is worse than sending the visitor to the catalog for it. The video rows quote
 * 720p and 1080p, which is why `seedance-2.0-mini` and `-fast` are absent — the gateway
 * prices neither of them at 1080p, and a blank cell sells nothing. Per-second rates are
 * rounded UP to four decimals so the column stays legible without ever quoting under the
 * real rate; `/models` carries the exact figure.
 */
const modelGroups = [
  {
    title: 'home.models.flagship',
    price: 'home.modelPrice',
    models: [
      ['Anthropic', 'claude-fable-5.1', '$9.50/M', '$47.50/M', 'aws'],
      ['OpenAI', 'gpt-6-astra', '$9.50/M', '$47.50/M', 'azure'],
    ],
  },
  {
    title: 'home.models.mainstream',
    price: 'home.modelPrice',
    models: [
      ['Anthropic', 'claude-opus-5', '$4.75/M', '$23.75/M', 'aws'],
      ['OpenAI', 'gpt-5.6-terra', '$1.90/M', '$11.40/M', 'azure'],
      ['DeepSeek', 'deepseek-v4-pro', '$1.691/M', '$3.382/M', 'deepseek'],
      ['Zhipu', 'glm-5.2', '$1.121/M', '$3.914/M', 'Baidu Cloud'],
    ],
  },
  {
    title: 'home.models.value',
    price: 'home.modelPrice',
    models: [
      ['Anthropic', 'claude-sonnet-5', '$1.90/M', '$9.50/M', 'aws'],
      ['OpenAI', 'gpt-5.6-luna', '$0.19/M', '$1.14/M', 'azure'],
      ['DeepSeek', 'deepseek-v3.2', '$0.285/M', '$0.4275/M', 'deepseek'],
      ['DeepSeek', 'deepseek-v4-flash', '$0.1425/M', '$0.285/M', 'deepseek'],
    ],
  },
  {
    title: 'home.models.video',
    price: 'home.modelPriceVideo',
    models: [
      ['ByteDance', 'seedance-2.5', '$0.1883', '$0.3511', 'Doubao'],
      ['ByteDance', 'seedance-2.0', '$0.1234', '$0.3087', 'Doubao'],
    ],
  },
] as const

function LineIcon({ name }: { name: FeatureIcon }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 1.8 }
  const paths: Record<FeatureIcon, React.ReactNode> = {
    shield: <><path {...common} d="M12 3 5 6v5c0 4.6 2.8 7.8 7 10 4.2-2.2 7-5.4 7-10V6l-7-3Z" /><path {...common} d="m9 12 2 2 4-5" /></>,
    privacy: <><path {...common} d="M3 3l18 18" /><path {...common} d="M10.6 10.7A2 2 0 0 0 13.4 13.4" /><path {...common} d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 5 9 8a9.6 9.6 0 0 1-2 3.6M6.6 6.5C4.4 8 3 10.3 3 12c0 3 3.5 8 9 8a9.8 9.8 0 0 0 3.1-.5" /></>,
    route: <><rect {...common} x="4" y="11" width="9" height="8" rx="2" /><path {...common} d="M8 11V8a3 3 0 0 1 3-3h7M15 5h3v3" /></>,
    code: <><path {...common} d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14" /></>,
    wallet: <><path {...common} d="M4 7h15a2 2 0 0 1 2 2v9H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13" /><path {...common} d="M15 11h6v4h-6a2 2 0 0 1 0-4Z" /></>,
    team: <><circle {...common} cx="9" cy="8" r="3" /><circle {...common} cx="17" cy="9" r="2" /><path {...common} d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6M15 15c3 0 5 1.7 6 5" /></>,
    gift: <><rect {...common} x="3" y="8" width="18" height="4" rx="1" /><path {...common} d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path {...common} d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5" /></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

/* The gift figure only settles after hydration (see useNewUserGift), so each place that
   prints it is its own small component: that switch then re-renders these, not the page. */

/** The sign-up offer as a one-line announcement pill: a link above the hero headline,
 *  plain text above the closing buttons, where a start button already sits beneath it. */
function GiftBadge({ link }: { link?: ReturnType<typeof authenticatedLink> }) {
  const { t } = useTranslation()
  const amount = useNewUserGift()
  if (!amount) return null
  const content = <>
    <span className="reference-gift-tag"><LineIcon name="gift" />{t('home.giftTag')}</span>
    <span className="reference-gift-text"><Trans i18nKey="home.giftOffer" values={{ amount }} components={{ strong: <strong /> }} /></span>
  </>
  return link ? <a className="reference-gift" {...link}>{content}</a> : <p className="reference-gift">{content}</p>
}

function GiftNote() {
  const { t } = useTranslation()
  return useNewUserGift() ? <small>{t('home.giftNote')}</small> : null
}

function GiftBalance() {
  const { t } = useTranslation()
  const amount = useNewUserGift()
  if (!amount) return null
  return <div className="reference-mini-balance"><Trans i18nKey="home.giftBalance" values={{ amount }} components={{ strong: <strong /> }} /><small className="reference-mini-gift">{t('home.giftTag')}</small></div>
}

/** The vendor's own mark. These sit below the fold, so they load lazily; the fixed
 *  box keeps the table row from shifting once they arrive. */
function VendorLogo({ vendor }: { vendor: string }) {
  const logo = vendorLogoUrl(vendor)
  return <span className="reference-vendor" aria-hidden="true">{logo
    ? <img src={logo} alt="" width="22" height="22" loading="lazy" decoding="async" />
    : vendor.slice(0, 1)}</span>
}

export function HomePage() {
  const { t } = useTranslation()
  const auth = useAuthStatus()
  const [activeDemo, setActiveDemo] = useState(0)
  const demo = apiDemos[activeDemo]
  const pageRef = useRef<HTMLElement>(null)
  useScrollReveal(pageRef)

  useEffect(() => {
    // On phones, automatic example changes can move the content below the card.
    // Keep switching manual there, and respect reduced-motion preferences.
    const manualOnly = window.matchMedia?.('(max-width: 720px), (prefers-reduced-motion: reduce)')
    let timer: number | undefined
    const schedule = () => {
      window.clearTimeout(timer)
      if (!manualOnly?.matches) timer = window.setTimeout(() => setActiveDemo((activeDemo + 1) % apiDemos.length), 4200)
    }
    schedule()
    manualOnly?.addEventListener('change', schedule)
    return () => { window.clearTimeout(timer); manualOnly?.removeEventListener('change', schedule) }
  }, [activeDemo])
  const steps = [
    [t('home.stepOne'), t('home.stepOneCopy'), 'account'],
    [t('home.stepTwo'), t('home.stepTwoCopy'), 'balance'],
    [t('home.stepThree'), t('home.stepThreeCopy'), 'key'],
  ]
  const trust: [FeatureIcon, string, string][] = [
    ['shield', t('home.trustOfficial'), t('home.trustOfficialCopy')],
    ['privacy', t('home.trustPrivacy'), t('home.trustPrivacyCopy')],
    ['route', t('home.trustSecure'), t('home.trustSecureCopy')],
  ]
  const features: [FeatureIcon, string, string][] = [
    ['shield', t('home.featureOne'), t('home.featureOneCopy')],
    ['code', t('home.featureTwo'), t('home.featureTwoCopy')],
    ['wallet', t('home.featureThree'), t('home.featureThreeCopy')],
    ['team', t('home.featureFour'), t('home.featureFourCopy')],
  ]
  // The last two terms carry legal weight, so they are shown as danger cards with the
  // key phrases highlighted — same treatment as the production landing page.
  const noticeTerms: { key: string; danger?: boolean }[] = [
    { key: 'home.noticeOne' },
    { key: 'home.noticeTwo' },
    { key: 'home.noticeThree' },
    { key: 'home.noticeFour', danger: true },
    { key: 'home.noticeFive', danger: true },
  ]

  return (
    <main className="reference-home" ref={pageRef}>
      <section className="reference-hero" aria-labelledby="reference-hero-title">
        <div className="reference-hero-copy">
          <GiftBadge link={authenticatedLink(auth, '/console/dashboard')} />
          <h1 id="reference-hero-title">{t('home.title')}<span>{t('home.titleAccent')}</span></h1>
          <p>{t('home.description')}</p>
          <div className="reference-hero-entry">
            <div className="reference-hero-entry-copy">
              <strong>{t('home.heroCtaTitle')}</strong>
              <GiftNote />
            </div>
            <div className="reference-hero-actions">
              <a className="reference-primary" {...authenticatedLink(auth, '/console/dashboard')}>{t('home.start')}</a>
              <a className="reference-hero-link" href="/models">{t('home.viewPrices')}</a>
            </div>
          </div>
        </div>
        <div className="reference-code-card" aria-label={t('home.example')}>
          <div className="reference-code-tabs" role="tablist" aria-label={t('home.example')}>
            {apiDemos.map((item, index) => <button key={item.label} type="button" role="tab" aria-selected={index === activeDemo} aria-controls="home-api-example" onClick={() => setActiveDemo(index)}>{item.label}</button>)}
          </div>
          <div className="reference-code-panel" id="home-api-example" role="tabpanel" aria-live="polite" key={demo.label}>
            <div className="reference-code-status"><span><b>{demo.method}</b> {demo.endpoint}</span><em>● 200 OK</em></div>
            <div className="reference-code-body"><pre>{demo.request}</pre><pre>{demo.response}</pre></div>
            <div className="reference-code-footer">{demo.stats.map((stat) => <span key={stat}>{stat}</span>)}</div>
          </div>
        </div>
      </section>

      <section className="reference-section reference-steps">
        <div className="reference-heading"><span>{t('home.stepsTag')}</span><h2>{t('home.stepsTitle')}</h2></div>
        <div className="reference-step-grid">
          {steps.map(([title, copy, kind], index) => <article className="reference-step" key={title}>
            <div className="reference-step-number">{index + 1}</div>
            <h3>{title}</h3>
            <p>{copy}</p>
            {kind === 'account' && <div className="reference-mini-buttons">
              <a href="/sign-in"><img src={githubIcon} alt="" width="14" height="14" loading="lazy" decoding="async" />GitHub</a>
              <a href="/sign-in"><img src={googleIcon} alt="" width="14" height="14" loading="lazy" decoding="async" />Google</a>
              <a href="/sign-in"><img src={mailIcon} alt="" width="14" height="14" loading="lazy" decoding="async" />{t('auth.email')}</a>
            </div>}
            {kind === 'balance' && <GiftBalance />}
            {kind === 'key' && <code className="reference-mini-key">sk-************************</code>}
          </article>)}
        </div>
        <div className="reference-credit-note"><GiftBadge /><GiftNote /></div>
        <div className="reference-actions"><a className="reference-primary" {...authenticatedLink(auth, '/console/dashboard')}>{t('home.start')}</a><a className="reference-secondary" href="/models">{t('home.viewPrices')}</a></div>
      </section>

      <section className="reference-trust" aria-label={t('home.trustLabel')}>
        {trust.map(([icon, title, copy]) => <div key={title}><span className="reference-icon"><LineIcon name={icon} /></span><p><strong>{title}</strong><small>{copy}</small></p></div>)}
      </section>

      <section className="reference-stats" aria-label={t('home.metricsLabel')}>
        {[['40+', t('home.metricProviders')], ['300+', t('home.metricModels')], ['5+', t('home.metricRoutes')], ['10+', t('home.metricPolicies')]].map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
      </section>

      <section className="reference-section reference-models">
        <div className="reference-heading"><span>{t('home.modelsTag')}</span><h2>{t('home.modelsTitle')}</h2></div>
        <div className="reference-model-groups">
          {modelGroups.map((group) => <article className="reference-model-group" key={group.title}>
            <h3>{t(group.title)}</h3>
            {group.models.map(([vendor, model, first, second, source]) => <div className="reference-model-row" key={model}>
              <VendorLogo vendor={vendor} />
              <p><small>{vendor}</small><strong>{model}</strong></p>
              <span className="reference-price">{t(group.price, { first, second })}</span>
              <span className="reference-source">{t('home.modelSource', { source })}</span>
              <b className="reference-discount">{t('home.modelDiscount')}</b>
              <a {...authenticatedLink(auth, '/purchase')}>{t('home.buyNow')}</a>
            </div>)}
          </article>)}
        </div>
        <a className="reference-more" href="/models">{t('home.moreModels')}</a>
      </section>

      <section className="reference-section reference-features">
        <div className="reference-heading"><span>{t('home.featureTag')}</span><h2>{t('home.featureTitle')}</h2></div>
        <div className="reference-feature-grid">
          {features.map(([icon, title, copy]) => <article key={title}><span className="reference-icon"><LineIcon name={icon} /></span><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </section>

      <section className="reference-section reference-compliance">
        <div className="reference-heading"><h2>{t('home.complianceTitle')}</h2><p>{t('home.complianceIntro')}</p></div>
        <div className="reference-notice-grid">{noticeTerms.map((term, index) => <article key={term.key} className={term.danger ? 'reference-notice-danger' : undefined}><span>{index + 1}</span>{term.danger
          ? <p><Trans i18nKey={term.key} components={{ highlight: <span className="reference-notice-highlight" />, strong: <strong /> }} /></p>
          : <p>{t(term.key)}</p>}</article>)}</div>
        <p className="reference-terms">{t('home.terms')}</p>
      </section>

      <footer className="reference-footer">© 2026 <strong>ZToken</strong>. All rights reserved.</footer>
    </main>
  )
}
