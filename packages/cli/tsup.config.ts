import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/entrypoint.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node18',
  clean: true,
  minify: false,
  banner: {
    js: `#!/usr/bin/env node
import { createRequire as __qapCreateRequire } from 'node:module';
const require = __qapCreateRequire(import.meta.url);`,
  },
  noExternal: [/@qap\/.*/, 'ajv', 'ajv-formats'],
});
