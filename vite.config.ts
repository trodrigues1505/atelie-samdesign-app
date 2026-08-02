import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: '/atelie-samdesign-app/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Atualização automática: assim que uma nova versão é publicada,
      // o service worker troca sozinho na próxima visita, sem o usuário
      // precisar desinstalar/reinstalar nada.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Ateliê Samdesign.ab',
        short_name: 'Samdesign.ab',
        description: 'Acompanhe seus pedidos de roupas e fantasias infantis temáticas.',
        start_url: '/atelie-samdesign-app/',
        scope: '/atelie-samdesign-app/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#e6007e',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Permite visualizar produtos, pedidos e perfil offline: as respostas
        // da API do Supabase ficam em cache e são reaproveitadas quando não
        // há conexão (StaleWhileRevalidate = mostra o cache na hora e
        // atualiza em segundo plano sempre que há internet).
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/rest/v1/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/storage/v1/object/public/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'product-photos-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
