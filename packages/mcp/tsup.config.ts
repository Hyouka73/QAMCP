import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/server.ts'],
  format: ['esm'],
  target: 'node18',
  platform: 'node',
  clean: true,
  dts: true,
  external: ['playwright-core'],
  banner: {
    js: `#!/usr/bin/env node
import { createRequire as __qapMcpCreateRequire } from 'node:module';
const require = __qapMcpCreateRequire(import.meta.url);`,
  },
});
