import { fileURLToPath } from 'node:url';
import { defineConfig } from '../../../../../packages/mcp/node_modules/vitest/dist/config.js';

// Diagnostics only. All test/worker/timeout defaults are unchanged.
export default defineConfig({ test: { setupFiles: [fileURLToPath(new URL('../../../../../packages/mcp/src/__tests__/fixtures/e01-stages.setup.ts', import.meta.url))] } });
