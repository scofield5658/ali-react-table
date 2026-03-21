import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'playground'),
  resolve: {
    alias: {
      '@srp-table': path.resolve(__dirname, 'src/srp-table.ts'),
      '@srp-table-pivot': path.resolve(__dirname, 'src/srp-table-pivot.ts'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3100,
  },
  build: {
    outDir: path.resolve(__dirname, 'playground-dist'),
    emptyOutDir: true,
  },
})
