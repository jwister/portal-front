import '@testing-library/jest-dom/vitest'
import '../ui/semi-base'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { clearCatalogCache } from '../features/catalog/use-catalog'
import { loadLocale } from '../i18n'

// The browser fetches one translation table; tests switch languages freely, so both
// are loaded up front and `changeLanguage` stays synchronous for them.
await Promise.all([loadLocale('en'), loadLocale('zh-CN')])

const values = new Map<string, string>()

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  },
})

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: () => ({
    clearRect: () => undefined,
    fillRect: () => undefined,
    fillStyle: '',
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
  }),
})

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  configurable: true,
  value: () => 'data:image/png;base64,',
})

class TestResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  value: TestResizeObserver,
})

Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
  configurable: true,
  value: () => ({
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }),
})

// The catalog keeps a module-level cache for repeat visits; drop it so every test
// starts from a clean network state.
afterEach(() => { cleanup(); clearCatalogCache() })

Object.defineProperty(window, 'matchMedia', {
 configurable:true, writable:true,
 value:(query:string) => ({ matches:false, media:query, onchange:null, addListener:() => {}, removeListener:() => {}, addEventListener:() => {}, removeEventListener:() => {}, dispatchEvent:() => false }),
})
