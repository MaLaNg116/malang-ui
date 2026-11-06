import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  resolve: { alias: [{ find: /^malang-ui$/, replacement: fileURLToPath(new URL('../src/index.ts', import.meta.url)) }] },
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  plugins: [vue()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 5174, strictPort: true },
  build: { outDir: 'dist', target: 'es2022', sourcemap: true },
});
