import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import { KeychainCredentialProvider } from '../dist/index.js';

// Opt-in integration probe. Never reads existing accounts; always cleans up its own entry.
const provider = new KeychainCredentialProvider();
const reference = { projectId: `vnext005-probe-${randomUUID()}`, applicationId: 'probe',
  environment: 'test', auth_profile_id: 'probe', account: 'synthetic-probe' };
let written = false;
try {
  assert.equal(await provider.get(reference), null);
  await provider.set(reference, { password: 'synthetic-keychain-probe-005' });
  written = true;
  assert.deepEqual(await provider.get(reference), { password: 'synthetic-keychain-probe-005' });
  await provider.set(reference, { password: 'synthetic-keychain-replacement-005' });
  assert.deepEqual(await provider.get(reference), { password: 'synthetic-keychain-replacement-005' });
  assert.equal(await provider.delete(reference), true);
  written = false;
  assert.equal(await provider.get(reference), null);
  assert.equal(await provider.delete(reference), false);
  console.log(JSON.stringify({ platform: process.platform, node: process.version, keychain: 'passed', checks: 6 }));
} catch (error) {
  console.log(JSON.stringify({ platform: process.platform, node: process.version,
    keychain: error?.code === 'UNAVAILABLE' ? 'unavailable' : 'failed' }));
  process.exitCode = 1;
} finally {
  if (written) {
    try { await provider.delete(reference); }
    catch { console.error('Synthetic keychain probe cleanup failed'); process.exitCode = 1; }
  }
  provider.close();
}
