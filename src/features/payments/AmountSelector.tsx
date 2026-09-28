import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import '../../i18n'

export const presetAmounts = [5, 10, 50, 100, 200, 500] as const
export type AmountSelection = number | 'custom'

interface AmountSelectorProps {
  selected: AmountSelection
  customAmount: string
  onSelect: (amount: AmountSelection) => void
  onCustomAmount: (amount: string) => void
}

export function isValidCustomAmount(value: string): boolean {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return false
  const amount = Number(value)
  return amount >= 1 && amount <= 10_000
}

export function AmountSelector({ selected, customAmount, onSelect, onCustomAmount }: AmountSelectorProps) {
  const { t } = useTranslation()
  const motion = useRef<Animation | undefined>(undefined)
  useEffect(() => () => motion.current?.cancel(), [])
  const select = (amount: AmountSelection, button: HTMLButtonElement) => {
    onSelect(amount)
    motion.current?.cancel()
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      motion.current = button.animate?.([{ transform:'scale(.96)' }, { transform:'scale(1.025)', offset:.55 }, { transform:'scale(1)' }], {duration:280,easing:'cubic-bezier(.2,.8,.2,1)'})
    }
  }
  const customHasError = selected === 'custom' && customAmount !== '' && !isValidCustomAmount(customAmount)

  return (
    <section className="zt-amount-selector" aria-labelledby="purchase-amount-title">
      <header><h2 id="purchase-amount-title">{t('purchase.amount')}</h2><p>{t('purchase.amountHint')}</p></header>
      <div className="zt-amount-options">
        {presetAmounts.map((amount) => <button key={amount} aria-pressed={selected === amount} type="button" onClick={(event) => select(amount,event.currentTarget)}><span className="zt-amount-value">${amount}</span><span className="zt-amount-check" aria-hidden="true">✓</span></button>)}
      </div>
      <button className="zt-amount-custom-toggle" aria-pressed={selected === 'custom'} aria-expanded={selected === 'custom'} aria-controls="custom-amount-panel" type="button" onClick={(event)=>select('custom',event.currentTarget)}>{t('purchase.custom')}<span aria-hidden="true">{selected === 'custom'?'−':'+'}</span></button>
      {selected === 'custom' && <div className="zt-amount-custom" id="custom-amount-panel"><label htmlFor="custom-amount">{t('purchase.customLabel')}</label><div><span aria-hidden="true">$</span><input id="custom-amount" type="number" min="1" max="10000" step="0.01" inputMode="decimal" value={customAmount} aria-invalid={customHasError} aria-describedby="custom-amount-hint" onChange={(event)=>onCustomAmount(event.target.value)} /></div><p id="custom-amount-hint" className={customHasError?'is-error':undefined} role={customHasError?'alert':undefined}>{t(customHasError?'purchase.amountError':'purchase.customHint')}</p></div>}
    </section>
  )
}
