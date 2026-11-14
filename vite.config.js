import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative asset paths work on a root domain and under a GitHub Pages repo URL.
  base: './',
})
