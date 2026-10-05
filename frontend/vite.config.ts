/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.E2E_BACKEND_URL || 'http://localhost:8080';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      global: 'window',
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      pool: 'threads',
      include: ['src/**/*.test.{ts,tsx}'],
      setupFiles: ['./src/setupTests.ts'],
    },
  };
});
