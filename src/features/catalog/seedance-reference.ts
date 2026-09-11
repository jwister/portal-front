/**
 * Reference values transcribed from the user-supplied workbook, Sheet1.
 * These are the workbook's official-price references, not live ZToken prices.
 * Keep the API model ID unchanged; its provider is not established by the alias.
 */
type LocalizedText = { en: string; zh: string }
export type SeedanceVersion = '2.0' | '2.0-fast' | '2.0-mini' | '2.5'
export type SeedanceProvider = 'Volcengine' | 'BytePlus'
export type SeedanceResolution = '480p' | '720p' | '1080p' | '4k'

export interface SeedanceReferencePrice {
  resolution: SeedanceResolution | '480p / 720p'
  inputHasVideo: boolean
  /** Null means missing or explicitly unsupported, never free. */
  amount: number | null
  sourceCell: string
  reviewNote?: LocalizedText
}

export interface SeedanceReference {
  version: SeedanceVersion
  provider: SeedanceProvider
  currency: 'CNY' | 'USD'
  modelName: string
  displayName: LocalizedText
  namingNote: LocalizedText
  /** Workbook lists identical input and output rates; units are currency / 1M tokens. */
  tokenPrices: SeedanceReferencePrice[]
  /** Estimates only, under the shared source assumptions below; currency / second. */
  perSecondEstimates: SeedanceReferencePrice[]
}

export const seedanceReferenceSource = {
  title: '2026-0908模型折扣 - 视频.xlsx',
  sheet: 'Sheet1',
  asOf: '2026-09-08',
  officialPricingUrl: 'https://docs.byteplus.com/en/docs/ModelArk/1544106',
  note: {
    en: 'Official-price reference from the September 8 price sheet. Volcengine uses CNY and BytePlus uses USD. ZToken billing follows the live catalog and your account group.',
    zh: '官方参考价来自 9 月 8 日价格表。Volcengine 按人民币列示，BytePlus 按美元列示；ZToken 实际计费以实时价格及账户分组为准。',
  },
  estimateAssumptions: {
    en: 'Estimates assume 16:9 video, input video shorter than 5 seconds, a 5-second output and 24 fps. They are not fixed per-second official tariffs.',
    zh: '每秒价格为估算：16:9 画幅、输入视频不足 5 秒、输出 5 秒、24 帧/秒，不代表官方固定每秒费率。',
  },
  estimateAssumptionCells: ['F6', 'F10', 'F14', 'F18'],
  discountNote: {
    en: 'The discount column in the source sheet is blank; no ZToken discount is inferred from this reference.',
    zh: '原表折扣列为空，不据此推算 ZToken 折扣。',
  },
} as const

const columns = ['H', 'I', 'J', 'K', 'L', 'M'] as const
const resolutions = ['480p / 720p', '480p / 720p', '1080p', '1080p', '4k', '4k'] as const
type PriceMatrix = readonly [number | null, number | null, number | null, number | null, number | null, number | null]
type EstimateMatrix = readonly [number, number, number, number, number | null, number | null, number | null, number | null]

function tokenPrices(row: number, amounts: PriceMatrix): SeedanceReferencePrice[] {
  return amounts.map((amount, index) => ({
    resolution: resolutions[index]!,
    inputHasVideo: index % 2 === 1,
    amount,
    sourceCell: `${columns[index]}${row}`,
  }))
}

function estimates(row: number, amounts: EstimateMatrix): SeedanceReferencePrice[] {
  const specification = [
    ['480p', false, 'H'], ['720p', false, 'H'], ['480p', true, 'I'], ['720p', true, 'I'],
    ['1080p', false, 'J'], ['1080p', true, 'K'], ['4k', false, 'L'], ['4k', true, 'M'],
  ] as const
  return specification.map(([resolution, inputHasVideo, column], index) => ({
    resolution, inputHasVideo, amount: amounts[index]!, sourceCell: `${column}${row}`,
  }))
}

function reference(
  version: SeedanceVersion,
  provider: SeedanceProvider,
  tokenRow: number,
  tokenAmounts: PriceMatrix,
  estimateRow: number,
  estimateAmounts: EstimateMatrix,
): SeedanceReference {
  const suffix = version.replaceAll('.', '-')
  const modelName = `doubao-seedance-${suffix}`
  const versionLabel = version.replace('-fast', ' Fast').replace('-mini', ' Mini')
  return {
    version, provider, currency: provider === 'Volcengine' ? 'CNY' : 'USD', modelName,
    displayName: { en: `Seedance ${versionLabel} · ${provider}`, zh: `Seedance ${versionLabel} · ${provider}` },
    namingNote: {
      en: `${modelName} (${provider}). Version, Fast/Mini variant and provider identify separate reference prices; use the listed API ID for requests.`,
      zh: `${modelName}（${provider}）。版本、Fast/Mini 变体及供应渠道分别定价；调用时使用平台显示的 API 模型 ID。`,
    },
    tokenPrices: tokenPrices(tokenRow, tokenAmounts),
    perSecondEstimates: estimates(estimateRow, estimateAmounts),
  }
}

export const seedanceReferences: SeedanceReference[] = [
  reference('2.0', 'Volcengine', 3, [46, 28, 51, 31, 26, 16], 6, [0.462, 0.994, 0.506, 1.088, 2.478, 2.712, 5.054, 5.598]),
  reference('2.0-fast', 'Volcengine', 4, [37, 22, null, null, null, null], 7, [0.372, 0.8, 0.398, 0.856, null, null, null, null]),
  reference('2.0-mini', 'Volcengine', 5, [23, null, null, null, null, null], 8, [0.232, 0.496, 0.254, 0.544, null, null, null, null]),
  reference('2.5', 'Volcengine', 9, [70, 42, 77, 46, null, null], 10, [0.672, 1.512, 0.726, 1.632, 2.478, 2.712, null, null]),
  reference('2.0', 'BytePlus', 11, [7, 4.3, 7.7, 4.7, 2.4, 4], 14, [0.07, 0.15, 0.078, 0.168, 0.37, 0.412, 0.78, 0.84]),
  reference('2.0-fast', 'BytePlus', 12, [5.6, 3.3, null, null, null, null], 15, [0.06, 0.12, 0.06, 0.128, null, null, null, null]),
  reference('2.0-mini', 'BytePlus', 13, [3.5, 2.1, null, null, null, null], 16, [0.04, 0.08, 0.038, 0.082, null, null, null, null]),
  reference('2.5', 'BytePlus', 17, [10.7, 6.4, 11.7, 7, null, null], 18, [0.103, 0.231, 0.1106, 0.2488, 0.569, 0.6124, null, null]),
]

for (const item of seedanceReferences) {
  for (const price of item.tokenPrices) {
    if (price.sourceCell === 'I5') {
      price.reviewNote = {
        en: 'The source cell contains a model label instead of a price.',
        zh: '原表该单元格为模型名称，未提供数值价格。',
      }
    }
    if (price.sourceCell === 'L11' || price.sourceCell === 'M11') {
      price.reviewNote = {
        en: 'Verify the 4K input-video columns before comparison; their price order differs from the other resolutions in the source.',
        zh: '比较前需核对 4K 输入视频档位；原表这两列的价格顺序与其他分辨率不同。',
      }
    }
  }
  for (const price of item.perSecondEstimates) {
    if (price.sourceCell === 'J10' || price.sourceCell === 'K10') {
      price.reviewNote = {
        en: 'The source repeats the 2.0 estimates despite different 2.5 token rates; verify before quoting.',
        zh: '原表此处与 2.0 的估算值相同，但 2.5 Token 单价不同；报价前需核对。',
      }
    }
  }
}

/** Returns comparable references without asserting the API alias uses either provider. */
export function getSeedanceReferences(modelName: string): SeedanceReference[] {
  const name = modelName.toLowerCase().replace(/^doubao-/, '')
  const match = /^seedance-(2[.-]0(?:-fast|-mini)?|2[.-]5)(?:[（(](volcengine|byteplus)[）)])?$/.exec(name)
  if (!match) return []
  const version = match[1]!.replace(/^2-/, '2.')
  const provider = match[2]
  return seedanceReferences.filter((item) => item.version === version && (!provider || item.provider.toLowerCase() === provider))
}

/** Independently verified against the official page, not transcribed from the workbook.
 * Online inference list prices before BytePlus promotional discounts.
 * L11/M11 in the workbook are reversed; preserve the original transcription above.
 */
export const bytePlusOfficialSource = {
  url: 'https://docs.byteplus.com/en/docs/ModelArk/1544106',
  checkedAt: '2026-09-10',
  provider: 'BytePlus',
  currency: 'USD',
} as const

export const bytePlusOfficialReferences = [
  { alias: 'seedance-2.0', modelId: 'dreamina-seedance-2-0-260128', version: '2.0', prices: [
    { resolution: '480p / 720p', withoutVideo: 7, withVideo: 4.3 },
    { resolution: '1080p', withoutVideo: 7.7, withVideo: 4.7 },
    { resolution: '4K', withoutVideo: 4, withVideo: 2.4 },
  ] },
  { alias: 'seedance-2.0-fast', modelId: 'dreamina-seedance-2-0-fast-260128', version: '2.0 Fast', prices: [
    { resolution: '480p / 720p', withoutVideo: 5.6, withVideo: 3.3 },
  ] },
  { alias: 'seedance-2.0-mini', modelId: 'dreamina-seedance-2-0-mini-260615', version: '2.0 Mini', prices: [
    { resolution: '480p / 720p', withoutVideo: 3.5, withVideo: 2.1 },
  ] },
  { alias: 'seedance-2.5', modelId: 'dreamina-seedance-2-5-260628', version: '2.5', prices: [
    { resolution: '480p / 720p', withoutVideo: 10.7, withVideo: 6.4 },
    { resolution: '1080p', withoutVideo: 11.7, withVideo: 7 },
  ] },
] as const

// Only match known aliases or the exact official dated ID. Never infer a CDance mapping.
export function getBytePlusOfficialReference(modelName: string) {
  return bytePlusOfficialReferences.find((reference) => reference.alias === modelName || reference.modelId === modelName)
}
