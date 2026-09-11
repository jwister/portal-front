import { useLayoutEffect, type RefObject } from 'react'

/**
 * Blocks of the public home page that fade and slide in as they scroll into view,
 * mirroring the landing effect used on ztoken.cc. The hidden state is applied in a
 * layout effect so the first paint never shows the elements un-animated.
 */
const REVEAL_SELECTORS = [
  '.reference-hero-copy',
  '.reference-code-card',
  '.reference-heading',
  '.reference-step',
  '.reference-trust > div',
  '.reference-stats > div',
  '.reference-model-group',
  '.reference-feature-grid > article',
  '.reference-notice-grid > article',
  '.reference-terms',
  '.reference-footer',
].join(',')

/**
 * Bands built from more than one block that read as a single unit — the service
 * assurances and the platform metrics sit against each other, so they start their
 * entrance together instead of waiting for their own scroll position.
 */
const REVEAL_GROUPS: string[][] = [
  ['.reference-trust > div', '.reference-stats > div'],
]

interface RevealUnit {
  /** Elements whose visibility triggers the unit. */
  triggers: HTMLElement[]
  /** Everything that becomes visible once the unit is triggered. */
  items: HTMLElement[]
}

export function useScrollReveal(root: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const container = root.current
    // Without the observer (or in tests) everything stays visible as rendered.
    if (!container || typeof IntersectionObserver === 'undefined') return

    const elements = Array.from(container.querySelectorAll<HTMLElement>(REVEAL_SELECTORS))
    if (!elements.length) return

    // Cards inside the same row follow each other with a small delay.
    const siblings = new Map<Element, number>()
    for (const element of elements) {
      const parent = element.parentElement ?? container
      const index = siblings.get(parent) ?? 0
      siblings.set(parent, index + 1)
      element.classList.add('reveal-on-scroll')
      if (index > 0) element.style.transitionDelay = `${Math.min(index, 8) * 0.1}s`
    }

    const claimed = new Set<Element>()
    const units: RevealUnit[] = []
    for (const group of REVEAL_GROUPS) {
      const items = group.flatMap((selector) => Array.from(container.querySelectorAll<HTMLElement>(selector)))
      if (!items.length) continue
      for (const item of items) claimed.add(item)
      units.push({ triggers: items, items })
    }
    for (const element of elements) {
      if (!claimed.has(element)) units.push({ triggers: [element], items: [element] })
    }

    const unitOf = new Map<Element, RevealUnit>()
    for (const unit of units) for (const trigger of unit.triggers) unitOf.set(trigger, unit)

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const unit = unitOf.get(entry.target)
        if (!unit) continue
        for (const item of unit.items) item.classList.add('is-visible')
        for (const trigger of unit.triggers) observer.unobserve(trigger)
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

    for (const unit of units) {
      // Anything already on screen shows immediately instead of waiting for a scroll.
      const onScreen = unit.triggers.some((trigger) => {
        const rect = trigger.getBoundingClientRect()
        return rect.top < window.innerHeight && rect.bottom > 0
      })
      if (onScreen) for (const item of unit.items) item.classList.add('is-visible')
      else for (const trigger of unit.triggers) observer.observe(trigger)
    }

    return () => observer.disconnect()
  }, [root])
}
