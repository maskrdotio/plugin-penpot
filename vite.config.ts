import { defineConfig, Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

/**
 * Dev server plugin:
 * 1. Redirects /plugin.js to /src/plugin.ts
 * 2. Serves a dev-friendly manifest.json with local paths
 */
function pluginDevServer(): Plugin {
  return {
    name: 'plugin-dev-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Redirect plugin.js to source file
        if (req.url === '/plugin.js') {
          req.url = '/src/plugin.ts'
          return next()
        }

        // Serve dev manifest with local paths
        if (req.url === '/manifest.json') {
          const devManifest = {
            name: 'Maskr.io (Dev)',
            description: 'AI-powered background removal for Penpot',
            code: 'http://localhost:3000/plugin.js',
            icon: 'http://localhost:3000/icon.png',
            permissions: [
              'content:read',
              'content:write',
              'user:read',
              'allow:downloads',
            ],
          }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(devManifest, null, 2))
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  // Use relative paths for GitHub Pages deployment
  base: './',
  plugins: [vue(), pluginDevServer()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    cors: true,
    proxy: {
      '/api': {
        target: 'https://api.maskr.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/auth': {
        target: 'https://auth.maskr.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/auth/, ''),
      },
      '/billing': {
        target: 'https://billing.maskr.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/billing/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        plugin: 'src/plugin.ts',
        index: './index.html',
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'plugin' ? 'plugin.js' : 'assets/[name]-[hash].js'
        },
      },
    },
  },
})
