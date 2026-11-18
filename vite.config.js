import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment files: .env, .env.local, .env.development
  const env = loadEnv(mode, process.cwd(), '');
  // Also load .env.production as fallback so editing .env.production works in dev mode too
  const prodEnv = loadEnv('production', process.cwd(), '');

  // Prioritize VITE_FLASK_URL from whichever env file is active
  const flaskUrl = prodEnv.VITE_FLASK_URL || env.VITE_FLASK_URL || '';

  return {
    plugins: [react()],
    define: {
      ...(flaskUrl ? { 'import.meta.env.VITE_FLASK_URL': JSON.stringify(flaskUrl) } : {}),
    },
  };
})
