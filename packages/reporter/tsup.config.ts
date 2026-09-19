import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: false,
  sourcemap: false,
  onSuccess: async () => {
    if (existsSync('src/template/index.html')) {
      mkdirSync('dist/template', { recursive: true });
      copyFileSync('src/template/index.html', 'dist/template/index.html');
      copyFileSync('src/template/index.html', 'dist/index.html');
    }
  },
});
