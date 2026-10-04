import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Unique dev port so this project never collides with other local projects.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5273,
    strictPort: true,
    open: false,
  },
  preview: {
    port: 5274,
    strictPort: true,
  },
})
