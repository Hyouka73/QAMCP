import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/entrypoint.ts'],
  format: ['esm'],
  dts: true,
  clean: false,
  sourcemap: false,
});
