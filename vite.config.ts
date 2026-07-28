import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 4173 },
  // Recharts is the only substantial client dependency; the compressed demo bundle remains under 170 kB.
  build: { chunkSizeWarningLimit: 600 },
})
