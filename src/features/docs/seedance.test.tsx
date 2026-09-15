import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import i18n from '../../i18n'
import { DocsPage } from './DocsPage'
import { catalogModels } from '../catalog/catalog-data'
import { pricingFixture } from '../catalog/__tests__/pricing-fixture'
import { ModelExamples, modelEndpointUrl } from '../catalog/ModelExamples'

describe('Seedance gateway documentation', () => {
  beforeEach(async () => { await i18n.changeLanguage('zh-CN'); window.history.replaceState({}, '', '/docs/api/seedance') })

  it('uses the video contract even when the live catalog labels Seedance as OpenAI chat', async () => {
    const models = catalogModels({ ...pricingFixture, data: [{ model_name: 'seedance-2.0', supported_endpoint_types: ['openai'] }] })
    expect(models[0].endpoints).toEqual(['/v1/videos'])
    render(<ModelExamples model={models[0]} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '复制代码' }))
    const code = await navigator.clipboard.readText()
    expect(code).toContain('https://api.ztoken.cc/v1/videos')
    expect(code).toContain('response.json()["task"]["id"]')
    expect(code).toContain('task["content"]["video_url"]')
    expect(code).not.toContain('chat.completions')
    expect(code).not.toContain('/v1/v1/')
    expect(screen.getByRole('link', { name: /Seedance 视频 API/ })).toHaveAttribute('href', '/docs/api/seedance?model=seedance-2.0')
    expect(modelEndpointUrl('/v1/videos')).toBe('https://api.ztoken.cc/v1/videos')
    expect(modelEndpointUrl('/v1beta/models/test:generateContent')).toBe('https://api.ztoken.cc/v1beta/models/test:generateContent')
  })

  it('offers localized parameters, task states and asset operations with copyable examples', async () => {
    const user = userEvent.setup()
    const view = render(<DocsPage path="/docs/api/seedance" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Seedance 视频 API' })).toBeVisible()
    await user.selectOptions(screen.getByRole('combobox', { name: '示例模型' }), 'seedance-2.0-fast')
    await user.click(screen.getByRole('button', { name: 'JavaScript' }))
    const code = view.container.querySelector('#seedanceCreate pre')!.textContent!
    expect(code).toContain('seedance-2.0-fast')
    expect(code).toContain('"resolution": "720p"')
    expect(code).toContain('AbortSignal.timeout')
    expect(screen.getByText('createAssetGroup')).toBeVisible()
    expect(screen.getByText('getAsset')).toBeVisible()
    for (const link of screen.getAllByRole('link').filter((link) => link.getAttribute('href')?.startsWith('#'))) {
      expect(document.getElementById(link.getAttribute('href')!.slice(1))).not.toBeNull()
    }
    await i18n.changeLanguage('en')
    expect(await screen.findByRole('heading', { name: 'Seedance Video API' })).toBeVisible()
  })
})
