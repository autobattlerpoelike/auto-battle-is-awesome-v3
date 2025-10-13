import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

const commitHash = execSync('git rev-parse --short HEAD').toString().trim()
const buildDate = new Date().toLocaleString()

export default defineConfig({
  plugins: [react()],
  base: '/auto-battle-is-awesome-v3/',
  define: {
    __BUILD_DATE__: JSON.stringify(buildDate),
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})
