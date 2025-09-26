import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ساده و بدون هیچ import از ../package.json
export default defineConfig({
  plugins: [react()],
})
