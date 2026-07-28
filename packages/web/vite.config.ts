import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Only used by `vite` (local dev server). In Docker the `web` service is served by nginx,
    // which does this same /api -> api:3000 proxy at the container level (docker/nginx.conf) —
    // the app itself always calls relative /api/* paths either way, so no VITE_API_URL is needed.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
