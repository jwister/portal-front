import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CopyButton } from '../catalog/CatalogShared'
import { ASSET_URL, ASSET_VERSION, SEEDANCE_MODELS, isDocumentedSeedance, seedanceExamples } from './seedance-api'

function Code({ value, label = 'JSON' }: { value: string; label?: string }) {
  const { t } = useTranslation()
  return <div className="zt-code"><div className="zt-code-toolbar"><span>{label}</span><CopyButton value={value} label={t('docs.copyCode')} /></div><pre><code>{value}</code></pre></div>
}

const assetActions = ['createAssetGroup', 'listAssetGroups', 'getAssetGroup', 'updateAssetGroup', 'deleteAssetGroup', 'createAsset', 'listAssets', 'getAsset', 'updateAsset', 'deleteAsset']
const params = [ ['model', 'string', true], ['content', 'array', true], ['resolution', 'string', false], ['ratio', 'string', false], ['duration', 'integer', false] ] as const

export function SeedanceSection({ id }: { id: string }) {
  const { t } = useTranslation()
  const requested = new URLSearchParams(window.location.search).get('model') ?? ''
  const [model, setModel] = useState(isDocumentedSeedance(requested) ? requested : SEEDANCE_MODELS[0])
  const [language, setLanguage] = useState<'cURL' | 'Python' | 'JavaScript'>('cURL')
  if (id === 'seedanceOverview') return <>
    <p>{t('seedance.overview')}</p>
    <dl className="zt-connection"><dt>Base URL</dt><dd><code>https://api.ztoken.cc/v1</code></dd><dt>{t('docs.authentication')}</dt><dd><code>Authorization: Bearer YOUR_API_KEY</code></dd><dt>Content-Type</dt><dd><code>application/json</code></dd></dl>
    <p><a href="/models">{t('seedance.availability')}</a></p>
  </>
  if (id === 'seedanceCreate') {
    const examples = seedanceExamples(model)
    return <>
      <p><code>POST /v1/videos</code></p>
      <div className="zt-table-wrap"><table><thead><tr><th>{t('docs.param.name')}</th><th>{t('docs.param.type')}</th><th>{t('docs.param.required')}</th><th>{t('docs.param.desc')}</th></tr></thead><tbody>{params.map(([name, type, required]) => <tr key={name}><td><code>{name}</code></td><td>{type}</td><td>{t(required ? 'docs.param.yes' : 'docs.param.no')}</td><td>{t(`seedance.param.${name}`)}</td></tr>)}</tbody></table></div>
      <p className="zt-notice">{t('seedance.limits')}</p>
      <label className="zt-example-select">{t('docs.exampleModel')}<select value={model} onChange={(event) => setModel(event.target.value)}>{SEEDANCE_MODELS.map((name) => <option key={name}>{name}</option>)}</select></label>
      <p>{t('seedance.environment')}</p>
      <div className="zt-chips" role="group" aria-label={t('docs.codeLanguage')}>{Object.keys(examples).map((lang) => <button key={lang} aria-pressed={language === lang} onClick={() => setLanguage(lang as typeof language)}>{lang}</button>)}</div>
      <Code value={examples[language]} label={language} />
      <p>{t('seedance.created')}</p>
      <Code value={'{"task":{"id":"TASK_ID","status":"queued"}}'} />
    </>
  }
  if (id === 'seedanceContent') return <>
    <p>{t('seedance.content')}</p>
    <Code value={JSON.stringify({ content: [
      { type: 'text', text: 'Use the supplied image as a visual reference.' },
      { type: 'image_url', image_url: { url: 'https://YOUR_CDN/product.jpg' } },
    ] }, null, 2)} />
    <p>{t('seedance.assetReference')}</p>
    <Code value={JSON.stringify({ type: 'image_url', image_url: { url: 'asset://ASSET_ID' } }, null, 2)} />
  </>
  if (id === 'seedancePoll') return <>
    <p><code>GET /v1/videos/{'{task_id}'}</code></p><p>{t('seedance.poll')}</p>
    <div className="zt-table-wrap"><table><thead><tr><th>{t('seedance.status')}</th><th>{t('docs.action')}</th></tr></thead><tbody>{['queued', 'running', 'completed', 'failed'].map((status) => <tr key={status}><td><code>{status}</code></td><td>{t(`seedance.states.${status}`)}</td></tr>)}</tbody></table></div>
    <Code value={'{"task":{"id":"TASK_ID","status":"completed","content":{"video_url":"https://VIDEO_CDN/result.mp4"}}}'} />
    <p>{t('seedance.responseNote')}</p>
  </>
  if (id === 'seedanceAssets') return <>
    <p>{t('seedance.assets')}</p><p><code>{`${ASSET_URL}?action=ACTION&version=${ASSET_VERSION}`}</code></p>
    <div className="zt-table-wrap"><table><thead><tr><th>action</th><th>{t('docs.param.desc')}</th></tr></thead><tbody>{assetActions.map((action) => <tr key={action}><td><code>{action}</code></td><td>{t(`seedance.actions.${action}`)}</td></tr>)}</tbody></table></div>
    <p>{t('seedance.assetFlow')}</p>
    <Code label="Python" value={`import os\nimport requests\n\nheaders = {"Authorization": "Bearer " + os.environ["ZTOKEN_API_KEY"]}\ndef assets(action, body):\n    response = requests.post(\n        "${ASSET_URL}",\n        params={"action": action, "version": "${ASSET_VERSION}"},\n        headers=headers, json=body, timeout=60,\n    )\n    response.raise_for_status()\n    return response.json()["data"]\n\ngroup = assets("createAssetGroup", {"name": "Product media", "groupType": "AIGC"})\nasset = assets("createAsset", {\n    "groupId": group["id"], "name": "Product photo",\n    "url": "https://YOUR_CDN/product.jpg", "assetType": "Image",\n})\nprint("Asset ID:", asset["id"])\n# Repeat getAsset until status is Active; stop on Failed.\nprint(assets("getAsset", {"id": asset["id"]}))\n# Once Active, reference it as: asset://<asset id>`} />
  </>
  if (id === 'seedanceErrors') return <>
    <p>{t('seedance.errors')}</p><p>{t('seedance.billing')}</p>
    <p>{t('seedance.supportContact')}<a href="mailto:support.01@ztoken.cc">support.01@ztoken.cc</a>{t('seedance.supportPunctuation')}</p>
  </>
  return null
}
