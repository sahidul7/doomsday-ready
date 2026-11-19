import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In dev, forward /api to the backend so the browser never deals with CORS.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': process.env.API_URL ?? 'http://localhost:3001' } },
});
