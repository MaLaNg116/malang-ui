import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const source = (file: string) => fileURLToPath(new URL(`./src/${file}`, import.meta.url));

export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2022',
    sourcemap: true,
    lib: {
      entry: { index: source('index.ts'), utils: source('utils/index.ts'), motion: source('motion/index.ts'), all: source('all.ts') },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
      cssFileName: 'style'
    },
    rolldownOptions: { external: ['vue', 'gsap', '@floating-ui/dom'] }
  }
});
