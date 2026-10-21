import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// This repository is published at https://ryuupuff.github.io/FraudGraph/
export default defineConfig({
  base: '/FraudGraph/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
