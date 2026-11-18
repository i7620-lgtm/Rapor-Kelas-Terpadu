import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      manifest: false,
      includeAssets: [
        'icon.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable-512x512.png',
        'apple-touch-icon.png',
        'presets.json',
        'privacy.html',
        'terms.html',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        globIgnores: ['**/tesseract/**', 'tesseract/**', '**/tp*.json', 'tp*.json'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/privacy\.html$/, /^\/terms\.html$/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 12,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\/tp\d+\.json$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'curriculum-tp-cache',
              expiration: {
                maxEntries: 16,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\/tesseract\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tesseract-ocr-cache',
              expiration: {
                maxEntries: 15,
                maxAgeSeconds: 60 * 60 * 24 * 180,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-state': ['zustand', 'immer', 'localforage'],
          'vendor-icons': ['lucide-react'],
          'vendor-xlsx': ['xlsx'],
          'vendor-pdf': ['jspdf', 'html-to-image'],
          'vendor-ocr': ['tesseract.js'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
