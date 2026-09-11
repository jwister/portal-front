import { useTranslation } from 'react-i18next'
import { bytePlusOfficialSource, getBytePlusOfficialReference } from './seedance-reference'
import { formatPrice } from './catalog-data'

export function OfficialPriceReference({ modelName }: { modelName: string }) {
  const { t } = useTranslation()
  const reference = getBytePlusOfficialReference(modelName)
  if (!reference) return null
  return <details className="zt-panel zt-official-reference"><summary>{t('catalog.officialReference')} · BytePlus · Seedance {reference.version}</summary><p>{t('catalog.officialNote')}</p><p className="zt-muted">{t('catalog.officialModel')}<code>{reference.modelId}</code></p><p className="zt-muted">{t('catalog.officialUnit')}</p><div className="zt-table-wrap"><table><thead><tr><th>{t('catalog.resolution')}</th><th>{t('catalog.withoutVideo')}</th><th>{t('catalog.withVideo')}</th></tr></thead><tbody>{reference.prices.map((price) => <tr key={price.resolution}><td>{price.resolution}</td><td>${formatPrice(price.withoutVideo)}</td><td>${formatPrice(price.withVideo)}</td></tr>)}</tbody></table></div><p className="zt-muted">{t('catalog.officialConditions')}</p><a href={bytePlusOfficialSource.url} target="_blank" rel="noreferrer">{t('catalog.officialSource')} ↗</a><span className="zt-muted"> · {t('catalog.checkedAt', { date: bytePlusOfficialSource.checkedAt })}</span></details>
}
