import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { JSDOM } from 'jsdom'

const html = await readFile('dist/index.html', 'utf8')
assert.ok(html.includes('id="reference-hero-title"'), 'Homepage must be in the HTML response')
assert.ok(!html.includes('/src/assets/'), 'No development asset paths in the release')
for (const { path, browser, stored, expected, blockedStorage } of [
  { path: '/', browser: 'en-US', expected: 'One API gateway' },
  { path: '/', browser: 'zh-CN', expected: '统一 API 网关' },
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
    },
  })
  const doc = dom.window.document, root = doc.getElementById('root')
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
console.log(`Build verified: 8 locale/route cases; ${dependencies.size} initial JS modules; no blocking CSS or synchronous chat.`)
