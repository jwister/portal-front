/** Vendor marks from `@lobehub/icons-static-svg`, served from `src/public/vendors`.
 *  Shared by the catalog and the homepage model table. Keep this module free of
 *  imports: the homepage is prerendered and must not pull in catalog dependencies. */
const vendorLogos: Record<string, string> = {
  OpenAI: 'openai', Anthropic: 'claude-color', DeepSeek: 'deepseek-color', Google: 'gemini-color',
  '智谱': 'zhipu-color', Zhipu: 'zhipu-color', '字节跳动': 'doubao-color', ByteDance: 'doubao-color',
  '阿里巴巴': 'qwen-color', Moonshot: 'moonshot', Meta: 'meta-color', Mistral: 'mistral-color',
  MiniMax: 'minimax-color', '百度': 'wenxin-color', xAI: 'xai', '即梦': 'jimeng-color', Cohere: 'cohere-color',
  '腾讯': 'hunyuan-color', Cloudflare: 'cloudflare-color', '零一万物': 'yi-color', Jina: 'jina', '讯飞': 'spark-color',
}

/** Public URL of a vendor's mark, or undefined when only the initials can be shown. */
export function vendorLogoUrl(vendor: string): string | undefined {
  const logo = vendorLogos[vendor]
  return logo && `/vendors/${logo}.svg`
}
