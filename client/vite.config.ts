/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In development the API runs on :3001; proxy keeps the client on a same-origin /graphql.
    proxy: { '/graphql': 'http://127.0.0.1:3001' },
  },
  build: {
    target: 'es2023',
    sourcemap: true,
    rolldownOptions: {
      output: {
        // Long-lived vendor chunks cache well between deploys.
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/,
            },
            {
              name: 'apollo',
              test: /node_modules[\\/](@apollo|graphql|rxjs|@wry|optimism|tslib)[\\/]/,
            },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: { include: [/index\.css/] }, // lets the contrast test read the real tokens via ?raw
  },
});
