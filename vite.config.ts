import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves this project under /FraudGraph/.
export default defineConfig({
  base: '/FraudGraph/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
