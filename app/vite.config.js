import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/piston': {
        target: 'http://localhost:2000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/piston/, ''),
      },
      '/groq': {
        target: 'http://localhost:8000',
        rewrite: path => path.replace(/^\/groq/, ''),
      },
      '/terminal': {
        target: 'ws://localhost:8000',
        ws: true,
      },
      '/api': {
        target: 'http://localhost:8000',
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
    host: '0.0.0.0',
    port: 5173, // optional, this is the default
  }
  
})