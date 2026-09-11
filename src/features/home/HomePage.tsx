import { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import '../../i18n'
import { useScrollReveal } from './use-scroll-reveal'

type FeatureIcon = 'shield' | 'privacy' | 'route' | 'code' | 'wallet' | 'team'

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

const modelGroups = [
  {
    title: 'home.models.flagship',
    models: [
      ['Anthropic', 'claude-fable-5', '$9.5/M · $47.5/M', 'aws'],
      ['OpenAI', 'gpt-5.6-sol', '$4.75/M · $28.5/M', 'azure'],
    ],
  },
  {
    title: 'home.models.mainstream',
    models: [
      ['Anthropic', 'claude-opus-5', '$4.75/M · $23.75/M', 'aws'],
      ['Anthropic', 'claude-opus-4.8', '$4.75/M · $23.75/M', 'aws'],
      ['OpenAI', 'gpt-5.6-terra', '$1.9/M · $11.4/M', 'azure'],
      ['Zhipu', 'glm-5.2', '$1.121/M · $3.914/M', 'Baidu Cloud'],
    ],
  },
  {
    title: 'home.models.value',
    models: [
      ['OpenAI', 'gpt-5.6-luna', '$0.19/M · $1.14/M', 'azure'],
      ['Anthropic', 'claude-sonnet-5', '$1.9/M · $9.5/M', 'aws'],
      ['Anthropic', 'claude-sonnet-4-6', '$2.85/M · $14.25/M', 'aws'],
      ['Zhipu', 'glm-5.1', '$0.6745/M · $2.356/M', 'Baidu Cloud'],
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
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

export function HomePage() {
  const { t } = useTranslation()
  const [activeDemo, setActiveDemo] = useState(0)
  const demo = apiDemos[activeDemo]
  const pageRef = useRef<HTMLElement>(null)
  useScrollReveal(pageRef)

  useEffect(() => {
    const timer = window.setTimeout(() => setActiveDemo((activeDemo + 1) % apiDemos.length), 4200)
    return () => window.clearTimeout(timer)
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
          <h1 id="reference-hero-title">{t('home.title')}<span>{t('home.titleAccent')}</span></h1>
          <p>{t('home.description')}</p>
          <div className="reference-hero-entry">
            <div className="reference-hero-entry-copy">
              <strong>{t('home.heroCtaTitle')}</strong>
              <small>{t('home.creditGift')}</small>
            </div>
            <div className="reference-hero-actions">
              <a className="reference-primary" href="/sign-up">{t('home.start')}</a>
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
              <a href="/sign-in"><img src="/github.png" alt="" />GitHub</a>
              <a href="/sign-in"><img src="/google.png" alt="" />Google</a>
              <a href="/sign-in"><img src="/mail.png" alt="" />{t('auth.email')}</a>
            </div>}
            {kind === 'balance' && <div className="reference-mini-balance">$ <strong>1.00</strong><small>{t('home.creditFlexible')}</small></div>}
            {kind === 'key' && <code className="reference-mini-key">sk-************************</code>}
          </article>)}
        </div>
        <p className="reference-credit-note">{t('home.creditGift')}</p>
        <div className="reference-actions"><a className="reference-primary" href="/sign-up">{t('home.start')}</a><a className="reference-secondary" href="/models">{t('home.viewPrices')}</a></div>
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
            {group.models.map(([vendor, model, prices, source]) => <div className="reference-model-row" key={model}>
              <span className={`reference-vendor reference-vendor-${vendor.toLowerCase()}`}>{vendor.slice(0, 1)}</span>
              <p><small>{vendor}</small><strong>{model}</strong></p>
              <span className="reference-price">{t('home.modelPrice', { prices })}</span>
              <span className="reference-source">{t('home.modelSource', { source })}</span>
              <b className="reference-discount">{t('home.modelDiscount')}</b>
              <a href="/purchase">{t('home.buyNow')}</a>
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
