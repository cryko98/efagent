
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
    // This allows the client-side code to access the key during runtime.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
})
