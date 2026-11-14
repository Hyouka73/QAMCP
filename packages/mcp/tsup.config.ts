import { defineConfig } from 'tsup';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { copyPackagedAssets } from '../../scripts/copy-dialog-assets.mjs';

export default defineConfig({
  entry: ['src/index.ts', 'src/server.ts'],
  format: ['esm'],
  target: 'node18',
  platform: 'node',
  clean: true,
  define: { 'process.env.QAP_BUILD_REVISION': JSON.stringify(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()) },
  dts: true,
  external: ['playwright-core'],
  banner: {
    js: `#!/usr/bin/env node
import { createRequire as __qapMcpCreateRequire } from 'node:module';
const require = __qapMcpCreateRequire(import.meta.url);`,
  },
  onSuccess: async () => {
    copyPackagedAssets(resolve('dist'));
  },
});
