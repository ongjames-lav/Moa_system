import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser'
  },
  server: {
    port: 5173,
    strictPort: false,
    open: true
  }
})
