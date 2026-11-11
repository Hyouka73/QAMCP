import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false, // Desactivamos la generación automática de DTS para evitar el conflicto TS5055
  clean: true,
  sourcemap: true,
  splitting: false,
});