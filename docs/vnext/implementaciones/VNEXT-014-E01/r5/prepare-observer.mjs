import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
// Reuse E01 observer verbatim except module paths and browser-file coverage.
let source=readFileSync(new URL('../../../../../packages/mcp/src/__tests__/fixtures/e01-stages.setup.ts',import.meta.url),'utf8');
const base='../../../../../packages/mcp/node_modules/';
source=source.replace("from 'vitest'",`from '${base}vitest/dist/index.js'`);
for(const pkg of ['knowledge','shared','playwright-adapter','playwright-runner'])source=source.replace(`from '@qap/${pkg}'`,`from '${base}@qap/${pkg}/dist/index.js'`);
source=source.replace("from '@modelcontextprotocol/sdk/server/index.js'",`from '${base}@modelcontextprotocol/sdk/dist/esm/server/index.js'`);
source=source.replace(/const browserFile = .*;/,"const browserFile = true; // selective.setup.ts has already restricted this to affected files.");
writeFileSync(fileURLToPath(new URL('./observer.setup.ts',import.meta.url)),source);
