import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vercel serves this app from the domain root.
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
