import { SeedanceSection } from './SeedanceSection'
import { useEffect, useState } from 'react'
import '../../ui/semi-base'
import Button from '@douyinfe/semi-ui/lib/es/button'
import { useTranslation } from 'react-i18next'
import { CopyButton } from '../catalog/CatalogShared'
import { useCatalog } from '../catalog/use-catalog'
import { modelHref } from '../catalog/catalog-data'

export const MODEL_BASE_URL = ((window as any).PORTAL_PUBLIC_API_URL || 'https://api.ztoken.cc') + '/v1'
/** Anthropic-style clients expect the host without the OpenAI `/v1` suffix. */
export const MODEL_HOST = MODEL_BASE_URL.replace(/\/v1$/, '')

/** Sidebar groups, in render order. */
const GROUPS = ['guides', 'api', 'resources'] as const

const articles = [
  { path: '/docs/guides/quick-start', key: 'quick', group: 'guides', sections: ['account', 'balance', 'key', 'connection', 'model', 'request', 'next'] },
  { path: '/docs/guides/tools', key: 'tools', group: 'guides', sections: ['base', 'claudeCode', 'sdk', 'clients', 'editors', 'verify'] },
  { path: '/docs/account', key: 'account', group: 'guides', sections: ['account', 'balance', 'key'] },
  { path: '/docs/billing', key: 'billing', group: 'guides', sections: ['tokens', 'requests', 'video', 'discounts'] },
  { path: '/docs/api', key: 'api', group: 'api', sections: ['apiProtocols', 'apiModels', 'apiRequest', 'apiParams', 'apiStreaming', 'apiEmbeddings', 'apiImages', 'apiAudio', 'apiVideo', 'apiAnthropic', 'apiGoogle', 'apiErrors'] },
  { path: '/docs/api/seedance', key: 'seedance', group: 'api', sections: ['seedanceOverview', 'seedanceCreate', 'seedanceContent', 'seedancePoll', 'seedanceAssets', 'seedanceErrors'] },
  { path: '/docs/troubleshooting', key: 'errors', group: 'guides', sections: ['errors', 'support'] },
  { path: '/docs/faq', key: 'faq', group: 'guides', sections: ['authKey', 'quota', 'modelMissing', 'priceCalc', 'contact'] },
]

const ERROR_CODES = ['400', '401', '403', '404', '429', '5xx']

/** chat/completions parameters worth documenting for callers; descriptions live in i18n. */
const CHAT_PARAMS: Array<[name: string, type: string, required: boolean, key: string]> = [
  ['model', 'string', true, 'docs.param.model'],
  ['messages', 'array', true, 'docs.param.messages'],
  ['stream', 'boolean', false, 'docs.param.stream'],
  ['temperature', 'number', false, 'docs.param.temperature'],
  ['top_p', 'number', false, 'docs.param.topP'],
  ['n', 'integer', false, 'docs.param.n'],
  ['stop', 'string / array', false, 'docs.param.stop'],
  ['max_tokens', 'integer', false, 'docs.param.maxTokens'],
  ['presence_penalty', 'number', false, 'docs.param.presence'],
  ['frequency_penalty', 'number', false, 'docs.param.frequency'],
]

export function requestExamples(model: string) {
  const payload = JSON.stringify({ model, messages: [{ role: 'user', content: 'Hello' }] }, null, 2)
  // A catalog model name is data, including quotes, dollar signs and backticks.
  const shellPayload = "'" + payload.replaceAll("'", "'\"'\"'") + "'"
  return {
    cURL: `curl ${MODEL_BASE_URL}/chat/completions \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d ${shellPayload}`,
    Python: `# python -m pip install openai\nimport os\nfrom openai import OpenAI\n\nclient = OpenAI(\n    api_key=os.environ["ZTOKEN_API_KEY"],\n    base_url="${MODEL_BASE_URL}",\n)\nresponse = client.chat.completions.create(\n    model=${JSON.stringify(model)},\n    messages=[{"role": "user", "content": "Hello"}],\n)\nprint(response.choices[0].message.content)`,
    JavaScript: `// npm install openai\n// Save as example.mjs and run: node example.mjs\nimport OpenAI from "openai";\n\nconst client = new OpenAI({\n  apiKey: process.env.ZTOKEN_API_KEY,\n  baseURL: "${MODEL_BASE_URL}",\n});\nconst response = await client.chat.completions.create({\n  model: ${JSON.stringify(model)},\n  messages: [{ role: "user", content: "Hello" }],\n});\nconsole.log(response.choices[0].message.content);`,
  }
}

/** Read-only snippet with a copy button; the language label replaces the tab strip. */
function Code({ value, language }: { value: string; language: string }) {
  const { t } = useTranslation()
  return <div className="zt-code">
    <div className="zt-code-toolbar">
      <span className="zt-code-label">{language}</span>
      <CopyButton value={value} label={t('docs.copyCode')} />
    </div>
    <pre><code>{value}</code></pre>
  </div>
}

function Examples() {
  const { t } = useTranslation()
  const { pricing, models, failed, retry } = useCatalog()
  const requested = new URLSearchParams(window.location.search).get('model')
  const [choice, setChoice] = useState('')
  const [language, setLanguage] = useState<'cURL' | 'Python' | 'JavaScript'>('cURL')
  const supported = models.filter((model) => model.type === 'chat' && model.endpoints.includes('/v1/chat/completions'))
  const selected = supported.find((model) => model.name === (choice || requested)) ?? supported.find((model) => model.name.startsWith('deepseek')) ?? supported[0]
  if (!pricing) return <div role={failed ? 'alert' : 'status'}><p>{t(failed ? 'models.error' : 'catalog.loading')}</p>{failed && <Button onClick={retry}>{t('catalog.retry')}</Button>}</div>
  if (!selected) return <p className="zt-notice">{t('docs.noExample')}</p>
  const examples = requestExamples(selected.name)
  return <div>
    {requested && !supported.some((model) => model.name === requested) && <p className="zt-notice">{t('docs.exampleMismatch', { model: requested })}</p>}
    <label className="zt-example-select">{t('docs.exampleModel')}<select value={selected.name} onChange={(event) => setChoice(event.target.value)}>{supported.map((model) => <option key={model.name}>{model.name}</option>)}</select></label>
    <p><a href={modelHref(selected.name)}>{t('catalog.viewPrice')} →</a></p>
    <p>{t('docs.environment')}</p>
    <div className="zt-code"><div className="zt-code-toolbar"><div role="group" aria-label={t('docs.codeLanguage')}>{Object.keys(examples).map((lang) => <button key={lang} aria-pressed={language === lang} onClick={() => setLanguage(lang as typeof language)}>{lang}</button>)}</div><CopyButton key={language + selected.name} value={examples[language]} label={t('docs.copyCode')} /></div><pre><code>{examples[language]}</code></pre></div>
    <p className="zt-muted">{t('docs.result')}</p>
  </div>
}

/** Endpoint families the catalog can expose; used to label the live protocol table. */
const FAMILIES: Array<{ key: string; test: (path: string) => boolean }> = [
  { key: 'anthropic', test: (path) => path.includes('/messages') },
  { key: 'google', test: (path) => path.includes('generateContent') },
  { key: 'openai', test: (path) => /^\/(v1\/)?(chat\/completions|responses|completions|embeddings|models)/.test(path) },
]
const FAMILY_ORDER = ['openai', 'anthropic', 'google', 'other']

function familyOf(path: string): string {
  return FAMILIES.find((family) => family.test(path))?.key ?? 'other'
}

function hostOf(family: string): string {
  return family === 'anthropic' ? MODEL_HOST : MODEL_BASE_URL
}

/**
 * Live protocol table: the endpoints, the number of models behind them and a sample model
 * all come from the pricing catalog, so a newly enabled protocol shows up by itself.
 */
function Protocols() {
  const { t } = useTranslation()
  const { pricing, models } = useCatalog()
  if (!pricing) return <p className="zt-muted">{t('catalog.loading')}</p>
  const rows: Array<{ path: string; family: string; models: string[] }> = []
  for (const model of models) {
    for (const endpoint of model.endpoints) {
      const row = rows.find((item) => item.path === endpoint)
      if (row) row.models.push(model.name)
      else rows.push({ path: endpoint, family: familyOf(endpoint), models: [model.name] })
    }
  }
  rows.sort((a, b) => (a.family === b.family ? a.path.localeCompare(b.path) : FAMILY_ORDER.indexOf(a.family) - FAMILY_ORDER.indexOf(b.family)))
  if (!rows.length) return <p className="zt-notice">{t('docs.noExample')}</p>
  return <>
    <div className="zt-table-wrap"><table>
      <thead><tr>
        <th scope="col">{t('docs.table.family')}</th>
        <th scope="col">{t('docs.table.baseUrl')}</th>
        <th scope="col">{t('docs.table.endpoint')}</th>
        <th scope="col">{t('docs.table.models')}</th>
        <th scope="col">{t('docs.table.example')}</th>
      </tr></thead>
      <tbody>{rows.map((row) => <tr key={row.path}>
        <td>{t(`docs.family.${row.family}`)}</td>
        <td><code>{hostOf(row.family)}</code></td>
        <td><code>{row.path}</code></td>
        <td>{row.models.length}</td>
        <td><a href={modelHref(row.models[0])}>{row.models[0]}</a></td>
      </tr>)}</tbody>
    </table></div>
    <p className="zt-muted">{t('docs.protocolsNote')}</p>
  </>
}

function ErrorTable() {
  const { t } = useTranslation()
  return <div className="zt-table-wrap"><table><thead><tr><th>{t('docs.statusCode')}</th><th>{t('docs.action')}</th></tr></thead><tbody>{ERROR_CODES.map((code) => <tr key={code}><td><code>{code}</code></td><td>{t(`docs.error.${code}`)}</td></tr>)}</tbody></table></div>
}

function SectionBody({ id }: { id: string }) {
  const { t } = useTranslation()
  if (id.startsWith('seedance')) return <SeedanceSection id={id} />
  return <>
    <p>{t(`docs.body.${id}`)}</p>
    {id === 'account' && <div className="zt-doc-links"><a href="/sign-up">{t('register.submit')} →</a><a href="/sign-in">{t('auth.submit')} →</a></div>}
    {id === 'balance' && <a href="/console/recharge">{t('docs.rechargeLink')} →</a>}
    {id === 'key' && <><a href="/console/tokens">{t('docs.keyLink')} →</a><p className="zt-notice">{t('docs.keySafety')}</p></>}
    {id === 'connection' && <dl className="zt-connection"><dt>Base URL</dt><dd><code>{MODEL_BASE_URL}</code><CopyButton value={MODEL_BASE_URL} label={t('docs.copyUrl')} /></dd><dt>{t('docs.authentication')}</dt><dd><code>Authorization: Bearer YOUR_API_KEY</code></dd><dt>{t('docs.endpoint')}</dt><dd><code>POST /chat/completions</code></dd></dl>}
    {id === 'model' && <a href="/models">{t('home.models')} →</a>}
    {id === 'request' && <Examples />}
    {id === 'next' && <div className="zt-doc-links"><a href="/docs/guides/tools">{t('docs.title.tools')} →</a><a href="/docs/api">{t('docs.title.api')} →</a><a href="/docs/billing">{t('docs.title.billing')} →</a><a href="/docs/troubleshooting">{t('docs.title.errors')} →</a></div>}
    {id === 'tokens' && <p className="zt-notice">{t('docs.tokenExample')}</p>}
    {id === 'discounts' && <a href="/models">{t('home.models')} →</a>}
    {id === 'errors' && <ErrorTable />}

    {id === 'base' && <dl className="zt-connection">
      <dt>{t('docs.field.baseOpenai')}</dt><dd><code>{MODEL_BASE_URL}</code><CopyButton value={MODEL_BASE_URL} label={t('docs.copyUrl')} /></dd>
      <dt>{t('docs.field.baseAnthropic')}</dt><dd><code>{MODEL_HOST}</code><CopyButton value={MODEL_HOST} label={t('docs.copyUrl')} /></dd>
      <dt>{t('docs.field.key')}</dt><dd><a href="/console/tokens">{t('docs.keyLink')} →</a></dd>
      <dt>{t('docs.field.model')}</dt><dd><a href="/models">{t('home.models')} →</a></dd>
    </dl>}

    {id === 'claudeCode' && <>
      <ol className="zt-steps">
        <li>{t('docs.step.export')}</li>
        <li>{t('docs.step.runClaude')}</li>
        <li>{t('docs.step.pickModel')}</li>
      </ol>
      <Code language="shell" value={`export ANTHROPIC_BASE_URL="${MODEL_HOST}"\nexport ANTHROPIC_AUTH_TOKEN="YOUR_API_KEY"\nclaude`} />
    </>}

    {id === 'sdk' && <>
      <p>{t('docs.sdkNote')}</p>
      <Code language="Python" value={`from openai import OpenAI\n\nclient = OpenAI(\n    api_key="YOUR_API_KEY",\n    base_url="${MODEL_BASE_URL}",\n)`} />
      <Code language="JavaScript" value={`import OpenAI from "openai";\n\nconst client = new OpenAI({\n  apiKey: "YOUR_API_KEY",\n  baseURL: "${MODEL_BASE_URL}",\n});`} />
    </>}

    {id === 'clients' && <>
      <ol className="zt-steps">
        <li>{t('docs.step.addProvider')}</li>
        <li>{t('docs.step.fillTable')}</li>
        <li>{t('docs.step.pickModelClient')}</li>
      </ol>
      <div className="zt-table-wrap"><table>
        <thead><tr><th scope="col">{t('docs.field.label')}</th><th scope="col">{t('docs.field.value')}</th></tr></thead>
        <tbody>
          <tr><td>{t('docs.field.base')}</td><td><code>{MODEL_BASE_URL}</code></td></tr>
          <tr><td>API Key</td><td>{t('docs.keyLink')} → <a href="/console/tokens">{t('docs.field.keyWhere')}</a></td></tr>
          <tr><td>{t('docs.field.model')}</td><td><a href="/models">{t('docs.modelHint')}</a></td></tr>
        </tbody>
      </table></div>
      <p className="zt-muted">{t('docs.clientsNote')}</p>
    </>}

    {id === 'editors' && <>
      <ol className="zt-steps">
        <li>{t('docs.step.pickCompatible')}</li>
        <li>{t('docs.step.fillTwo')}</li>
        <li>{t('docs.step.chooseModelName')}</li>
      </ol>
      <p className="zt-muted">{t('docs.editorsNote')}</p>
    </>}

    {id === 'verify' && <>
      <p>{t('docs.verifyNote')}</p>
      <Code language="cURL" value={`curl ${MODEL_BASE_URL}/models \\\n  -H "Authorization: Bearer YOUR_API_KEY"`} />
    </>}

    {id === 'apiProtocols' && <Protocols />}
    {id === 'apiModels' && <>
      <Code language="cURL" value={`curl ${MODEL_BASE_URL}/models \\\n  -H "Authorization: Bearer YOUR_API_KEY"`} />
      <Code language="JSON" value={`{\n  "object": "list",\n  "data": [\n    { "id": "deepseek-chat", "object": "model", "created": 0, "owned_by": "deepseek" }\n  ]\n}`} />
    </>}
    {id === 'apiRequest' && <Examples />}
    {id === 'apiParams' && <div className="zt-table-wrap"><table>
      <thead><tr>
        <th scope="col">{t('docs.param.name')}</th>
        <th scope="col">{t('docs.param.type')}</th>
        <th scope="col">{t('docs.param.required')}</th>
        <th scope="col">{t('docs.param.desc')}</th>
      </tr></thead>
      <tbody>{CHAT_PARAMS.map(([name, type, required, key]) => <tr key={name}>
        <td><code>{name}</code></td>
        <td>{type}</td>
        <td>{t(required ? 'docs.param.yes' : 'docs.param.no')}</td>
        <td>{t(key)}</td>
      </tr>)}</tbody>
    </table></div>}
    {id === 'apiStreaming' && <Code language="Python" value={`stream = client.chat.completions.create(\n    model="YOUR_MODEL",\n    messages=[{"role": "user", "content": "Hello"}],\n    stream=True,\n)\nfor chunk in stream:\n    print(chunk.choices[0].delta.content or "", end="")`} />}
    {id === 'apiEmbeddings' && <Code language="cURL" value={`curl ${MODEL_BASE_URL}/embeddings \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "YOUR_EMBEDDING_MODEL",\n    "input": "Text to embed"\n  }'`} />}
    {id === 'apiImages' && <Code language="cURL" value={`curl ${MODEL_BASE_URL}/images/generations \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "YOUR_IMAGE_MODEL",\n    "prompt": "A sunset over the mountains",\n    "n": 1,\n    "size": "1024x1024"\n  }'`} />}
    {id === 'apiAudio' && <Code language="cURL" value={`curl ${MODEL_BASE_URL}/audio/speech \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "YOUR_TTS_MODEL",\n    "input": "Text to speak",\n    "voice": "alloy"\n  }' \\\n  --output speech.mp3`} />}
    {id === 'apiVideo' && <a href="/docs/api/seedance">{t('docs.title.seedance')} →</a>}
    {['support', 'contact'].includes(id) && <a href="mailto:support.01@ztoken.cc">support.01@ztoken.cc</a>}
    {id === 'apiAnthropic' && <Code language="cURL" value={`curl ${MODEL_HOST}/v1/messages \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "anthropic-version: 2023-06-01" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "model": "YOUR_MODEL",\n    "max_tokens": 256,\n    "messages": [{ "role": "user", "content": "Hello" }]\n  }'`} />}
    {id === 'apiGoogle' && <Code language="cURL" value={`curl ${MODEL_BASE_URL}/models/YOUR_MODEL:generateContent \\\n  -H "x-goog-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "contents": [{ "parts": [{ "text": "Hello" }] }]\n  }'`} />}
    {id === 'apiErrors' && <ErrorTable />}
  </>
}

export function DocsPage({ path }: { path: string }) {
  const { t } = useTranslation()
  const article = articles.find((item) => item.path === (path === '/docs' || path === '/docs/' ? articles[0].path : path))
  const [active, setActive] = useState('')
  const [navOpen, setNavOpen] = useState(false)
  useEffect(() => {
    if (path === '/docs' || path === '/docs/') window.history.replaceState({}, '', articles[0].path + window.location.search + window.location.hash)
    if (!article || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      const heading = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top).at(-1)
      if (heading?.target.parentElement?.id) setActive(heading.target.parentElement.id)
    }, { rootMargin: '-90px 0px -65% 0px' })
    article.sections.forEach((id) => { const heading = document.getElementById(id)?.querySelector('h2'); if (heading) observer.observe(heading) })
    return () => observer.disconnect()
  }, [article, path])
  if (!article) return <main className="zt-public zt-state"><h1>{t('docs.notFound')}</h1><a href="/docs/guides/quick-start">{t('catalog.quickStart')}</a></main>
  const params = window.location.search
  return <main className="zt-public zt-docs"><div className="zt-doc-layout">
    <aside className="zt-doc-sidebar"><button className="zt-doc-toggle" aria-expanded={navOpen} aria-controls="docs-navigation" onClick={() => setNavOpen(!navOpen)}>{t('docs.navigation')} {navOpen ? '−' : '+'}</button><nav id="docs-navigation" className={navOpen ? 'is-open' : ''} aria-label={t('docs.navigation')}><span className="zt-eyebrow">ZTOKEN DOCS</span><p>{t('docs.startHere')}</p>{GROUPS.map((group) => {
      const items = articles.filter((item) => item.group === group)
      if (!items.length) return null
      return <div className="zt-doc-group" key={group}><p>{t(`docs.group.${group}`)}</p>{items.map((item) => <a key={item.key} href={item.path + params} aria-current={item === article ? 'page' : undefined}>{t(`docs.title.${item.key}`)}</a>)}</div>
    })}<p>{t('docs.resources')}</p><a href="/models">{t('models.title')} ↗</a><a href="/console/tokens">{t('docs.keyLink')} ↗</a></nav></aside>
    <article className="zt-doc-article"><span className="zt-eyebrow">{t('docs.startHere')}</span><h1>{t(`docs.title.${article.key}`)}</h1><p className="zt-doc-lead">{t(`docs.intro.${article.key}`)}</p><details className="zt-mobile-toc"><summary>{t('docs.onThisPage')}</summary>{article.sections.map((id) => <a href={`#${id}`} key={id}>{t(`docs.section.${id}`)}</a>)}</details>{article.sections.map((id) => <section key={id} id={id}><h2>{t(`docs.section.${id}`)}</h2><SectionBody id={id} /></section>)}</article>
    <nav className="zt-doc-toc" aria-label={t('docs.onThisPage')}><strong>{t('docs.onThisPage')}</strong>{article.sections.map((id) => <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined} onClick={() => setActive(id)}>{t(`docs.section.${id}`)}</a>)}</nav>
  </div></main>
}
