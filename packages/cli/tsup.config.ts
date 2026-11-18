import { defineConfig } from 'tsup';
import { resolve } from 'node:path';
import { copyPackagedAssets } from '../../scripts/copy-dialog-assets.mjs';

export default defineConfig({
  entry: ['src/entrypoint.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node18',
  clean: false,
  minify: false,
  external: ['playwright-core', 'chromium-bidi', 'keytar'],
  banner: {
    js: `#!/usr/bin/env node
import { createRequire as __qapCreateRequire } from 'node:module';
const require = __qapCreateRequire(import.meta.url);`,
  },
  noExternal: [/@qap\/.*/, 'ajv', 'ajv-formats'],
  onSuccess: async () => {
    copyPackagedAssets(resolve('dist'), { includeReporterTemplate: true });
  },
});
