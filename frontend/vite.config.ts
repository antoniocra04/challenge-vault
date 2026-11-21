import { defineConfig } from 'vite';

export default defineConfig({
  server: { proxy: { '/api': 'http://127.0.0.1:3000' } },
  build: { outDir: '../internal/web/spa/generated', emptyOutDir: true },
});
