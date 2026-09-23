import { isDocumentedSeedance, seedanceExamples } from '../docs/seedance-api'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CopyButton } from './CatalogShared'
import type { CatalogModel } from './catalog-data'

export const MODEL_BASE_URL = ((window as any).PORTAL_PUBLIC_API_URL || 'https://api.ztoken.cc') + '/v1'
/** Anthropic-style clients expect the host without the OpenAI `/v1` suffix. */
export const MODEL_HOST = MODEL_BASE_URL.replace(/\/v1$/, '')
export const modelEndpointUrl = (endpoint: string) => `${MODEL_HOST}${endpoint.startsWith('/v1/') || endpoint.startsWith('/v1beta/') ? endpoint : `/v1${endpoint}`}`

const LANGUAGES = ['Python', 'Node.js', 'Shell'] as const
type Language = (typeof LANGUAGES)[number]

const json = (value: unknown) => JSON.stringify(value)
/** Shell-safe single-quoted JSON body that keeps embedded quotes intact. */
const shellJson = (value: unknown) => "'" + JSON.stringify(value).replaceAll("'", "'\"'\"'") + "'"

function endpointFamily(endpoint: string): string {
  if (endpoint.includes('/chat/completions')) return 'chat'
  if (endpoint.includes('/messages')) return 'messages'
  if (endpoint.includes('/responses')) return 'responses'
  if (endpoint.includes('/embeddings')) return 'embeddings'
  if (endpoint.includes('/images/generations')) return 'images'
  if (endpoint.includes('/audio/speech')) return 'audio'
  if (endpoint.includes('/models')) return 'models'
  return 'generic'
}

/** Produce a copy-paste example for one endpoint in the requested language. */
function exampleCode(endpoint: string, model: string, lang: Language): string {
  if (isDocumentedSeedance(model)) return seedanceExamples(model)[lang === 'Shell' ? 'cURL' : lang === 'Node.js' ? 'JavaScript' : 'Python']
  const family = endpointFamily(endpoint)
  const messages = [{ role: 'user', content: 'Hello!' }]

  if (family === 'chat') {
    if (lang === 'Python') return `from openai import OpenAI\n\nclient = OpenAI(\n    base_url="${MODEL_BASE_URL}",\n    api_key="YOUR_API_KEY",\n)\n\ncompletion = client.chat.completions.create(\n    model=${json(model)},\n    messages=[{"role": "user", "content": "Hello!"}],\n)\n\nprint(completion.choices[0].message.content)`
    if (lang === 'Node.js') return `import OpenAI from "openai";\n\nconst client = new OpenAI({\n  baseURL: "${MODEL_BASE_URL}",\n  apiKey: "YOUR_API_KEY",\n});\n\nconst completion = await client.chat.completions.create({\n  model: ${json(model)},\n  messages: [{ role: "user", content: "Hello!" }],\n});\n\nconsole.log(completion.choices[0].message.content);`
    return `curl ${MODEL_BASE_URL}/chat/completions \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d ${shellJson({ model, messages })}`
  }

  if (family === 'messages') {
    if (lang === 'Python') return `from anthropic import Anthropic\n\nclient = Anthropic(\n    base_url="${MODEL_HOST}",\n    api_key="YOUR_API_KEY",\n)\n\nmessage = client.messages.create(\n    model=${json(model)},\n    max_tokens=256,\n    messages=[{"role": "user", "content": "Hello!"}],\n)\n\nprint(message.content[0].text)`
    if (lang === 'Node.js') return `import Anthropic from "@anthropic-ai/sdk";\n\nconst client = new Anthropic({\n  baseURL: "${MODEL_HOST}",\n  apiKey: "YOUR_API_KEY",\n});\n\nconst message = await client.messages.create({\n  model: ${json(model)},\n  max_tokens: 256,\n  messages: [{ role: "user", content: "Hello!" }],\n});\n\nconsole.log(message.content[0].text);`
    return `curl ${MODEL_BASE_URL}/messages \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "anthropic-version: 2023-06-01" \\\n  -H "Content-Type: application/json" \\\n  -d ${shellJson({ model, max_tokens: 256, messages })}`
  }

  if (family === 'responses') {
    if (lang === 'Python') return `from openai import OpenAI\n\nclient = OpenAI(\n    base_url="${MODEL_BASE_URL}",\n    api_key="YOUR_API_KEY",\n)\n\nresponse = client.responses.create(\n    model=${json(model)},\n    input="Hello!",\n)\n\nprint(response.output_text)`
    if (lang === 'Node.js') return `import OpenAI from "openai";\n\nconst client = new OpenAI({\n  baseURL: "${MODEL_BASE_URL}",\n  apiKey: "YOUR_API_KEY",\n});\n\nconst response = await client.responses.create({\n  model: ${json(model)},\n  input: "Hello!",\n});\n\nconsole.log(response.output_text);`
    return `curl ${MODEL_BASE_URL}/responses \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d ${shellJson({ model, input: 'Hello!' })}`
  }

  if (family === 'embeddings') {
    if (lang === 'Python') return `from openai import OpenAI\n\nclient = OpenAI(\n    base_url="${MODEL_BASE_URL}",\n    api_key="YOUR_API_KEY",\n)\n\nresponse = client.embeddings.create(\n    model=${json(model)},\n    input="Hello!",\n)\n\nprint(response.data[0].embedding)`
    if (lang === 'Node.js') return `import OpenAI from "openai";\n\nconst client = new OpenAI({\n  baseURL: "${MODEL_BASE_URL}",\n  apiKey: "YOUR_API_KEY",\n});\n\nconst response = await client.embeddings.create({\n  model: ${json(model)},\n  input: "Hello!",\n});\n\nconsole.log(response.data[0].embedding);`
    return `curl ${MODEL_BASE_URL}/embeddings \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d ${shellJson({ model, input: 'Hello!' })}`
  }

  if (family === 'images') {
    if (lang === 'Python') return `from openai import OpenAI\n\nclient = OpenAI(\n    base_url="${MODEL_BASE_URL}",\n    api_key="YOUR_API_KEY",\n)\n\nresponse = client.images.generate(\n    model=${json(model)},\n    prompt="A sunset over the mountains",\n    n=1,\n)\n\nprint(response.data[0].url)`
    if (lang === 'Node.js') return `import OpenAI from "openai";\n\nconst client = new OpenAI({\n  baseURL: "${MODEL_BASE_URL}",\n  apiKey: "YOUR_API_KEY",\n});\n\nconst response = await client.images.generate({\n  model: ${json(model)},\n  prompt: "A sunset over the mountains",\n  n: 1,\n});\n\nconsole.log(response.data[0].url);`
    return `curl ${MODEL_BASE_URL}/images/generations \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d ${shellJson({ model, prompt: 'A sunset over the mountains', n: 1 })}`
  }

  if (family === 'audio') {
    if (lang === 'Python') return `from openai import OpenAI\n\nclient = OpenAI(\n    base_url="${MODEL_BASE_URL}",\n    api_key="YOUR_API_KEY",\n)\n\nresponse = client.audio.speech.create(\n    model=${json(model)},\n    voice="alloy",\n    input="Hello!",\n)\n\nresponse.stream_to_file("speech.mp3")`
    if (lang === 'Node.js') return `import OpenAI from "openai";\nimport fs from "node:fs";\n\nconst client = new OpenAI({\n  baseURL: "${MODEL_BASE_URL}",\n  apiKey: "YOUR_API_KEY",\n});\n\nconst response = await client.audio.speech.create({\n  model: ${json(model)},\n  voice: "alloy",\n  input: "Hello!",\n});\n\nfs.writeFileSync("speech.mp3", Buffer.from(await response.arrayBuffer()));`
    return `curl ${MODEL_BASE_URL}/audio/speech \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d ${shellJson({ model, voice: 'alloy', input: 'Hello!' })} \\\n  --output speech.mp3`
  }

  if (family === 'models') {
    if (lang === 'Python') return `from openai import OpenAI\n\nclient = OpenAI(\n    base_url="${MODEL_BASE_URL}",\n    api_key="YOUR_API_KEY",\n)\n\nfor model in client.models.list():\n    print(model.id)`
    if (lang === 'Node.js') return `import OpenAI from "openai";\n\nconst client = new OpenAI({\n  baseURL: "${MODEL_BASE_URL}",\n  apiKey: "YOUR_API_KEY",\n});\n\nconst list = await client.models.list();\nconsole.log(list.data.map((item) => item.id));`
    return `curl ${MODEL_BASE_URL}/models \\\n  -H "Authorization: Bearer YOUR_API_KEY"`
  }

  // Generic fallback for any other endpoint family (video, Gemini, future protocols).
  if (lang === 'Python') return `import requests\n\nresponse = requests.post(\n    "${modelEndpointUrl(endpoint)}",\n    headers={"Authorization": "Bearer YOUR_API_KEY"},\n    json={"model": ${json(model)}},\n)\n\nprint(response.json())`
  if (lang === 'Node.js') return `const response = await fetch("${modelEndpointUrl(endpoint)}", {\n  method: "POST",\n  headers: { Authorization: "Bearer YOUR_API_KEY", "Content-Type": "application/json" },\n  body: JSON.stringify({ model: ${json(model)} }),\n});\n\nconsole.log(await response.json());`
  return `curl ${modelEndpointUrl(endpoint)} \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d ${shellJson({ model })}`
}

/** Example code + API reference block, mirroring the upstream detail page. */
export function ModelExamples({ model }: { model: CatalogModel }) {
  const { t } = useTranslation()
  const endpoints = isDocumentedSeedance(model.name) ? ['/v1/videos'] : model.endpoints.length ? model.endpoints : ['/v1/chat/completions']
  const [endpoint, setEndpoint] = useState(endpoints[0])
  const [language, setLanguage] = useState<Language>('Python')
  const code = exampleCode(endpoint, model.name, language)
  return <section id="examples" className="zt-panel zt-examples">
    <div className="zt-panel-heading">
      <h2>{t('catalog.examplesTitle', { model: model.name })}</h2>
      <a className="zt-buy" href="/console/tokens">{t('catalog.getApiKey')}</a>
    </div>
    {isDocumentedSeedance(model.name) && <p><a href={`/docs/api/seedance?model=${encodeURIComponent(model.name)}`}>{t('docs.title.seedance')} →</a></p>}
    <p>{t('catalog.examples.intro1')}</p>
    <p>{t('catalog.examples.intro2')}</p>
    <p>{t('catalog.examples.intro3')}</p>
    <div className="zt-endpoint-heading"><span>{t('catalog.supportedEndpoints')}</span><CopyButton value={`${modelEndpointUrl(endpoint)}`} label={t('catalog.copyEndpoint')} /></div>
    <p className="zt-muted">{t('catalog.switchEndpointHint')}</p>
    <div className="zt-chips" role="group" aria-label={t('catalog.supportedEndpoints')}>
      {endpoints.map((ep) => <button key={ep} aria-pressed={ep === endpoint} onClick={() => setEndpoint(ep)}>{ep}</button>)}
    </div>
    <div className="zt-code">
      <div className="zt-code-toolbar">
        <div role="group" aria-label={t('catalog.codeLanguage')}>
          {LANGUAGES.map((lang) => <button key={lang} aria-pressed={language === lang} onClick={() => setLanguage(lang)}>{lang}</button>)}
        </div>
        <CopyButton value={code} label={t('docs.copyCode')} />
      </div>
      <pre><code>{code}</code></pre>
    </div>
    <h3>{t('catalog.thirdPartySdk')}</h3>
    <p>{t('catalog.thirdPartySdkNote')}</p>
    <p className="zt-muted">{t('catalog.requestDocsNote')}</p>
  </section>
}
