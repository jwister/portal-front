import type { Plugin } from 'vite'
import type { OutputChunk } from 'rollup'

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
        const routes: Record<string, { js:string[]; css:string[] }> = {}
        for (const route of ['AuthRoutes', 'ConsoleRoutes']) {
          const entry = Object.values(bundle).find(item => item.type === 'chunk' && item.name === route)
          if (!entry || entry.type !== 'chunk') continue
          const js = new Set<string>(), css = new Set<string>()
          const visit = (chunk: OutputChunk & { viteMetadata?: { importedCss:Set<string> } }) => {
            if (js.has(chunk.fileName)) return
            js.add(chunk.fileName)
            chunk.viteMetadata?.importedCss.forEach(file => css.add(file))
            for (const dependency of chunk.imports) {
              const next = bundle[dependency]
              if (next?.type === 'chunk') visit(next)
            }
          }
          visit(entry)
          routes[route] = { js:[...js], css:[...css] }
        }
        return [{ tag:'script', injectTo:'head-prepend', children:`(()=>{const p=location.pathname,r=${JSON.stringify(routes)},k=/^\\/(sign-in|sign-up|oauth\\/(github|oidc))$/.test(p)?'AuthRoutes':/^\\/console\\//.test(p)?'ConsoleRoutes':null;if(!k||!r[k])return;for(const [kind,files]of Object.entries(r[k]))for(const file of files){const link=document.createElement('link');link.rel=kind==='js'?'modulepreload':'preload';if(kind==='css')link.as='style';link.href='/'+file;link.crossOrigin='';document.head.appendChild(link)}})();` }]
      },
    },
  }
}
