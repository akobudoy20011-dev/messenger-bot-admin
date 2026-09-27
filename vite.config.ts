import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  preview: {
    host: '0.0.0.0',
    // Render provides the public hostname at runtime.
    allowedHosts: [
      'messenger-bot-admin-1.onrender.com',
      process.env.RENDER_EXTERNAL_HOSTNAME || 'localhost',
    ],
  },
});
