import { expect } from '../../../../../packages/mcp/node_modules/vitest/dist/index.js';
// Files with additional FAILs relative to the R5 serial. No assertions or selection change.
if (/(?:lifecycle-v3-e2e|p3-canonical-discovery|p4-2-canonical-contract|p4-5a-canonical-integrity|p4-5a2-canonical-integrity|server-canonical-discovery|server-canonical-operations|test-handler)\.test\.ts$/.test(expect.getState().testPath ?? '')) {
  await import('./observer.setup.js');
}
