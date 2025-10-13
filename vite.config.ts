import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/auto-battle-is-awesome-v3/', // 👈 must match your repo name exactly
})
