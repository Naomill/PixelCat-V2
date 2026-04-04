import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, mkdirSync } from 'fs'

function copyGifWorker() {
  return {
    name: 'copy-gif-worker',
    buildStart() {
      try {
        if (!existsSync('public')) mkdirSync('public')
        copyFileSync('node_modules/gif.js/dist/gif.worker.js', 'public/gif.worker.js')
      } catch (e) {
        console.warn('gif.worker.js copy failed:', e.message)
      }
    },
    configureServer(server) {
      try {
        if (!existsSync('public')) mkdirSync('public')
        copyFileSync('node_modules/gif.js/dist/gif.worker.js', 'public/gif.worker.js')
      } catch (e) {
        console.warn('gif.worker.js copy failed:', e.message)
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), copyGifWorker()],
})
