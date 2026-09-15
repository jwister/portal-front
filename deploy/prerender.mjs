import { readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

const server = await createServer({ configFile: false, plugins: [react()], appType: 'custom', server: { middlewareMode: true, hmr: false } })
try {
  const { renderHome } = await server.ssrLoadModule('/src/prerender.tsx')
  const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'))
  const assetUrls = Object.fromEntries(Object.entries(manifest).filter(([key]) => key.startsWith('src/assets/')).map(([key, asset]) => ['/' + key, '/' + asset.file]))
  const resolveAssets = (html) => html.replace(/\/src\/assets\/[^"\s<>]+/g, (url) => {
    if (!assetUrls[url]) throw new Error(`Missing production asset: ${url}`)
    return assetUrls[url]
  })
  const english = resolveAssets(await renderHome('en'))
  const chinese = resolveAssets(await renderHome('zh-CN'))
  let html = await readFile('dist/index.html', 'utf8')
  // The complete entry stylesheet is small. Inlining removes its render-blocking round trip
  // on every SPA entry route, while lazy feature styles retain their normal loading order.
  for (const css of manifest['index.html'].css ?? []) {
    const source = await readFile('dist/' + css, 'utf8')
    if (source.includes('</style')) throw new Error('Unsafe inline stylesheet')
    html = html.replace(new RegExp(`<link[^>]+href="/${css.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`), `<style data-entry-css>${source}</style>`)
  }
  const bootstrap = `<script>(()=>{const root=document.getElementById('root'),zh=document.getElementById('home-zh');if(location.pathname==='/'){let locale;try{locale=localStorage.getItem('ztoken.locale')}catch{}const chinese=locale==='zh-CN'||(locale!=='en'&&(navigator.languages?.[0]||navigator.language||'').toLowerCase().startsWith('zh'));if(chinese)root.replaceChildren(zh.content);root.dataset.prerendered='true';document.documentElement.lang=chinese?'zh-CN':'en'}else root.replaceChildren();zh.remove()})()</script>`
  html = html.replace('<div id="root"></div>', `<div id="root">${english}</div><template id="home-zh">${chinese}</template>${bootstrap}`)
  if (html.includes('/src/assets/') || !html.includes('id="reference-hero-title"')) throw new Error('Incomplete homepage prerender')
  await writeFile('dist/index.html', html)
  console.log('Prerendered English/Chinese homepage with inline entry CSS; other routes keep the SPA fallback.')
} finally {
  await server.close()
}
