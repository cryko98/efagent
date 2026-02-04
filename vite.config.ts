import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // ROBUST KEY LOADING:
  // 1. process.env.VITE_API_KEY (Vercel System Env)
  // 2. process.env.API_KEY (Fallback System Env)
  // 3. env.VITE_API_KEY (Loaded from local .env)
  // 4. env.API_KEY (Fallback local .env)
  const apiKey = process.env.VITE_API_KEY || process.env.API_KEY || env.VITE_API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
  }
})