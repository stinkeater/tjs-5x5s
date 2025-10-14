import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: "TJ's 5x5s",
        short_name: "5x5s",
        description: "Track your workouts",
        theme_color: "#8b5cf6",
        background_color: "#242424",
        display: "standalone",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" }
        ]
      }
    })
  ],
  base: '/tjs-5x5s/' // important for GitHub Pages
});