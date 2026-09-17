import type { Plugin } from 'vite'
import type { OutputChunk } from 'rollup'

/**
 * Every route reaches its page through two lazy hops: the entry loads a route bundle
 * (SecondaryRoutes / AuthRoutes / ConsoleRoutes), which then loads the page chunk. On a
 * throttled connection each hop costs a full round trip before the next request is even
 * discovered. Declaring both hops in the HTML lets them download alongside the entry.
 */
const ROUTES: { pattern: string; chunks: string[] }[] = [
  { pattern: '^/models$', chunks: ['SecondaryRoutes', 'ModelsPage'] },
  { pattern: '^/models/.+', chunks: ['SecondaryRoutes', 'ModelDetailPage'] },
  { pattern: '^/docs(?:/|$)', chunks: ['SecondaryRoutes', 'DocsPage'] },
  { pattern: '^/purchase$', chunks: ['SecondaryRoutes', 'PurchasePage'] },
  { pattern: '^/(?:sign-in|sign-up|oauth/(?:github|oidc))$', chunks: ['AuthRoutes'] },
  { pattern: '^/console/', chunks: ['ConsoleRoutes'] },
]

/** Start the current route's critical downloads while the entry script loads. */
export function routePreload(): Plugin {
  return {
    name: 'current-route-preload',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, context) {
        const bundle = context.bundle
        if (!bundle) return []
        // The entry already ships in the HTML, so its own files are not worth repeating.
        const entryChunk = Object.values(bundle).find(item => item.type === 'chunk' && item.isEntry)
        const shipped = new Set<string>()
        const walk = (chunk: OutputChunk & { viteMetadata?: { importedCss: Set<string> } }, js: Set<string>, css: Set<string>) => {
          if (js.has(chunk.fileName)) return
          js.add(chunk.fileName)
          chunk.viteMetadata?.importedCss.forEach(file => css.add(file))
          for (const dependency of chunk.imports) {
            const next = bundle[dependency]
            if (next?.type === 'chunk') walk(next, js, css)
          }
        }
        if (entryChunk?.type === 'chunk') {
          const js = new Set<string>(), css = new Set<string>()
          walk(entryChunk, js, css)
          for (const file of [...js, ...css]) shipped.add(file)
        }
        const routes = ROUTES.flatMap(({ pattern, chunks }) => {
          const js = new Set<string>(), css = new Set<string>()
          for (const name of chunks) {
            const entry = Object.values(bundle).find(item => item.type === 'chunk' && item.name === name)
            if (entry?.type === 'chunk') walk(entry, js, css)
          }
          const files = {
            js: [...js].filter(file => !shipped.has(file)),
            css: [...css].filter(file => !shipped.has(file)),
          }
          return files.js.length || files.css.length ? [{ p: pattern, ...files }] : []
        })
        if (!routes.length) return []
        return [{
          tag: 'script',
          injectTo: 'head-prepend',
          children: `(()=>{const p=location.pathname,r=${JSON.stringify(routes)}.find(x=>new RegExp(x.p).test(p));if(!r)return;const add=(href,rel,as)=>{const l=document.createElement('link');l.rel=rel;if(as)l.as=as;l.href='/'+href;l.crossOrigin='';document.head.appendChild(l)};for(const f of r.js)add(f,'modulepreload');for(const f of r.css)add(f,'preload','style')})();`,
        }]
      },
    },
  }
}
