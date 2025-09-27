import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// When deploying to GitHub Pages we need to serve assets from the repo folder name
const repoBase = '/PB-FR-SP1/'

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? repoBase : '/',
})
