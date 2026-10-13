import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { JSDOM } from 'jsdom'

/**
 * What a first-time visitor downloads before the homepage is interactive, gzipped, with
 * roughly 15% headroom over the measured figures. The structural checks below already stop
 * a heavy route being imported outright; these catch the slower kind of regression, where
 * the entry grows a few KB at a time until the homepage is no longer cheap to open.
 *
 * Raising a budget is a deliberate decision, not a formality: confirm the bytes buy
 * something a visitor sees before the first interaction. Measured 2026-09-20 —
 * HTML 15.6 KB, initial JS 90.4 KB, as the line this script prints reports them.
 */
const BUDGET_GZIP = { html: 18_500, initialJs: 106_000 }

const html = await readFile('dist/index.html', 'utf8')
assert.ok(html.includes('id="reference-hero-title"'), 'Homepage must be in the HTML response')
assert.ok(!html.includes('/src/assets/'), 'No development asset paths in the release')
for (const { path, browser, stored, expected, blockedStorage, gift } of [
  { path: '/', browser: 'en-US', expected: 'One API gateway' },
  { path: '/', browser: 'zh-CN', expected: '统一 API 网关' },
  { path: '/', browser: 'zh-CN', gift: 0, expected: '统一 API 网关' },
  { path: '/', browser: 'zh-CN', stored: 'en', expected: 'One API gateway' },
  { path: '/', browser: 'en-US', stored: 'zh-CN', expected: '统一 API 网关' },
  { path: '/', browser: 'zh-CN', blockedStorage: true, expected: '统一 API 网关' },
  { path: '/sign-in' }, { path: '/purchase' }, { path: '/console/orders' },
]) {
  // Only inline bootstrap scripts run. No modules, external scripts or network resources
  // are loaded: this verifies what is displayed before the application downloads.
  const dom = new JSDOM(html, {
    url: `https://preview.example${path}`, runScripts: 'dangerously',
    beforeParse(window) {
      Object.defineProperty(window.navigator, 'languages', { value: [browser ?? 'en-US'] })
      if (stored) window.localStorage.setItem('ztoken.locale', stored)
      if (blockedStorage) Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable') } })
      // What `/api/config.js` sets on a deployment that gives no sign-up gift.
      if (gift !== undefined) window.PORTAL_QUOTA_FOR_NEW_USER = gift
    },
  })
  const doc = dom.window.document, root = doc.getElementById('root')
  assert.equal(doc.documentElement.dataset.gift, gift === 0 ? 'none' : undefined, 'A zero gift is hidden before first paint')
  if (expected) {
    assert.ok(doc.querySelector('h1')?.textContent.includes(expected), `Initial locale: ${browser}/${stored}`)
    assert.equal(root.dataset.prerendered, 'true')
  } else {
    assert.equal(root.childElementCount, 0, `No homepage flash on ${path}`)
    assert.equal(root.dataset.prerendered, undefined)
  }
  assert.equal(doc.querySelector('template'), null)
  assert.equal(doc.querySelector('link[rel="stylesheet"]'), null, 'Entry CSS must not block first paint')
  assert.ok(doc.querySelector('meta[name="description"]')?.content)
  assert.equal(doc.querySelector('script[src*="tidio.co"]'), null, 'Chat must start after the first page load')
  dom.window.close()
}
const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'))
const entry = manifest['index.html']
const dependencies = new Set()
function visit(key) {
  if (dependencies.has(key)) return
  dependencies.add(key)
  for (const child of manifest[key].imports ?? []) visit(child)
}
visit('index.html')
assert.ok(![...dependencies].some(key => /semi|echarts|AuthRoutes|ConsoleRoutes/.test(key)), 'Heavy routes stay out of the initial import graph')
for (const item of Object.values(manifest)) await access('dist/' + item.file)

const gzipOf = async (file) => gzipSync(await readFile(file), { level: 9 }).length
const htmlGzip = await gzipOf('dist/index.html')
let initialJsGzip = 0
for (const key of dependencies) initialJsGzip += await gzipOf('dist/' + manifest[key].file)
const overBudget = (label, actual, budget) =>
  `${label} is ${(actual / 1024).toFixed(1)} KB gzipped, over the ${(budget / 1024).toFixed(1)} KB budget in deploy/verify-build.mjs. `
  + 'Move the weight off the first load, or raise the budget deliberately.'
assert.ok(htmlGzip <= BUDGET_GZIP.html, overBudget('Prerendered homepage', htmlGzip, BUDGET_GZIP.html))
assert.ok(initialJsGzip <= BUDGET_GZIP.initialJs, overBudget('Initial JS', initialJsGzip, BUDGET_GZIP.initialJs))

/**
 * Lazy chunks that still grow with content. A locale table is a dynamic import, so the
 * initial-JS figure above never sees it, yet every page waits for one: documentation prose
 * belongs in the per-article chunks under src/features/docs/ecosystem, which only their own
 * page loads. When an article outgrows its budget, split the category rather than raising it.
 * Measured 2026-10-12 — locale 18.0 KB (zh-CN), DocsPage 7.0 KB, largest article 3.9 KB.
 */
const LAZY_BUDGET_GZIP = [
  { label: 'Locale table', test: /^src\/i18n\/locales\/[^/]+\.json$/, budget: 20_000 },
  { label: 'Docs article', test: /^src\/features\/docs\/ecosystem\/[^/]+\.ts$/, budget: 8_000 },
]
for (const { label, test, budget } of LAZY_BUDGET_GZIP) {
  const keys = Object.keys(manifest).filter(key => test.test(key))
  assert.ok(keys.length, `${label}: no chunk matched ${test}; update deploy/verify-build.mjs`)
  for (const key of keys) {
    const size = await gzipOf('dist/' + manifest[key].file)
    assert.ok(size <= budget, `${label} ${key} is ${(size / 1024).toFixed(1)} KB gzipped, over its ${(budget / 1024).toFixed(1)} KB budget `
      + 'in deploy/verify-build.mjs. Move docs prose out of the locale tables, or split the article.')
  }
}

/**
 * Everything a docs visit downloads on top of the entry. The docs render no Semi component:
 * their buttons, copy buttons and dropdown are plain elements, which keeps the UI library
 * (about 20 kB gzipped with its base styles) off the route. Measured 2026-10-12 — 15.4 KB JS,
 * 21.6 KB CSS; the code font is a separate file fetched only where code is shown.
 */
const DOCS_ROUTE_BUDGET_GZIP = { js: 18_000, css: 25_000 }
const docsRoute = new Set()
const walkRoute = key => {
  if (docsRoute.has(key) || dependencies.has(key)) return
  docsRoute.add(key)
  for (const child of manifest[key].imports ?? []) walkRoute(child)
}
walkRoute('src/SecondaryRoutes.tsx')
walkRoute('src/features/docs/DocsPage.tsx')
let docsJs = 0, docsCss = 0
for (const key of docsRoute) {
  const { file, css = [] } = manifest[key]
  assert.ok(!/semi-(button|skeleton|spin)/.test(await readFile('dist/' + file, 'utf8')), `${key} brings Semi into the docs route; use the plain components in src/components instead`)
  docsJs += await gzipOf('dist/' + file)
  for (const sheet of css) docsCss += await gzipOf('dist/' + sheet)
}
assert.ok(docsJs <= DOCS_ROUTE_BUDGET_GZIP.js, `Docs route JS is ${(docsJs / 1024).toFixed(1)} KB gzipped, over its ${(DOCS_ROUTE_BUDGET_GZIP.js / 1024).toFixed(1)} KB budget in deploy/verify-build.mjs.`)
assert.ok(docsCss <= DOCS_ROUTE_BUDGET_GZIP.css, `Docs route CSS is ${(docsCss / 1024).toFixed(1)} KB gzipped, over its ${(DOCS_ROUTE_BUDGET_GZIP.css / 1024).toFixed(1)} KB budget in deploy/verify-build.mjs.`)

console.log(`Build verified: 9 locale/route cases; ${dependencies.size} initial JS modules; no blocking CSS or synchronous chat.`)
console.log(`First load: ${(htmlGzip / 1024).toFixed(1)} KB HTML + ${(initialJsGzip / 1024).toFixed(1)} KB JS gzipped `
  + `(budget ${(BUDGET_GZIP.html / 1024).toFixed(1)} / ${(BUDGET_GZIP.initialJs / 1024).toFixed(1)} KB).`)
console.log(`Docs route: ${(docsJs / 1024).toFixed(1)} KB JS + ${(docsCss / 1024).toFixed(1)} KB CSS gzipped beyond the entry, no Semi `
  + `(budget ${(DOCS_ROUTE_BUDGET_GZIP.js / 1024).toFixed(1)} / ${(DOCS_ROUTE_BUDGET_GZIP.css / 1024).toFixed(1)} KB).`)
