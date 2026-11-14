import { fileURLToPath } from 'node:url';
import { defineConfig } from '../../../../../packages/mcp/node_modules/vitest/dist/config.js';
// Only setupFiles is added. Vitest defaults remain unchanged.
export default defineConfig({test:{setupFiles:[fileURLToPath(new URL('./selective.setup.ts',import.meta.url))]}});
