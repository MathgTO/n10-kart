import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // '/' for Netlify (default); GitHub Pages staging builds with N10_BASE=/n10-kart/ (scripts/deploy-gh-pages.sh).
  base: process.env.N10_BASE || '/',
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
