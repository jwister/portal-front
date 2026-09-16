import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { routePreload } from './deploy/route-preload'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [react(), routePreload()],
    // Keep the existing asset folder as Vite's static public directory so
    // /small-logo.png is also available from the packaged Spring Boot app.
    publicDir: 'src/public',
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'https://ztoken.cc',
          changeOrigin: true,
          // The gateway sets cookies for its own domain, which a tunnelled / sandbox
          // origin cannot store. Rewrite them to host-only so sign-in survives the proxy.
          cookieDomainRewrite: '',
        },
      },
    },
    preview: {
      // Vite rejects requests whose Host it does not recognise. Set
      // VITE_PREVIEW_ALLOWED_HOSTS to expose a local preview through a tunnel,
      // e.g. VITE_PREVIEW_ALLOWED_HOSTS=foo.ngrok-free.dev for a PageSpeed run.
      allowedHosts: env.VITE_PREVIEW_ALLOWED_HOSTS ? env.VITE_PREVIEW_ALLOWED_HOSTS.split(',') : [],
    },
    build: {
      manifest: true,
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          // Keep the heavy third-party libraries in their own files so they download in
          // parallel with the app code and stay cached across deploys.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (id.includes('echarts') || id.includes('zrender')) return 'echarts'
            if (id.includes('@douyinfe')) return 'semi'
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react'
            return undefined
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  }
})
