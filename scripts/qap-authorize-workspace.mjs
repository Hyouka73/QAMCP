import { existsSync, lstatSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, parse, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

import { acquireProjectOperation, QapApplicationService, readProjectResetState } from '../packages/mcp/dist/index.js';

// Local operator entrypoint, deliberately not an MCP tool. This grants only local
// project preparation. It never authorizes application access or human reviews.
const candidate = process.argv[2];
if (!candidate || !isAbsolute(candidate)) throw new Error('Usage: node scripts/qap-authorize-workspace.mjs <absolute-workspace>');
const root = realpathSync(candidate);
if (root.toLowerCase() !== resolve(candidate).toLowerCase() || !lstatSync(root).isDirectory()) throw new Error('Use an existing unlinked workspace');
const defaultHome = resolve(process.env.QAP_MCP_HOST_DATA_DIR ?? join(homedir(), '.qap'));
const directory = resolve(process.env.QAP_MCP_WORKSPACE_HOST_DIR ?? join(defaultHome, 'workspaces'));
const applicationDirectory = resolve(process.env.QAP_MCP_APP_SERVICE_DIR ?? join(defaultHome, 'application'));
const registry = join(directory, 'authorized-roots.json');
let part = parse(registry).root;
for (const segment of registry.slice(part.length).split(/[\\/]/).filter(Boolean)) {
  part = join(part, segment);
  if (existsSync(part) && (lstatSync(part).isSymbolicLink() || (lstatSync(part).isFile() && lstatSync(part).nlink !== 1))) throw new Error('Unsafe host registry');
}
const release = acquireProjectOperation(directory);
let service;
try {
  if (readProjectResetState(directory, root)?.state === 'pending') throw new Error('project_reset_incomplete');
  service = new QapApplicationService({ hostRootDir: applicationDirectory });
  const state = service.getRootDeletionState(root);
  if (state && (state.version !== 1 || state.cleanup_status !== 'completed')) throw new Error('project_deletion_cleanup_incomplete');
  const roots = existsSync(registry) ? JSON.parse(readFileSync(registry, 'utf8')) : [];
  if (!Array.isArray(roots) || roots.some(r => typeof r !== 'string')) throw new Error('Invalid workspace registry');
  const sameRoot = value => process.platform === 'win32' ? value.toLowerCase() === root.toLowerCase() : value === root;
  const alreadyPresent = roots.some(sameRoot);
  const writeRegistry = values => {
    const staging = join(dirname(registry), randomUUID() + '.json');
    try {
      writeFileSync(staging, JSON.stringify(values), { flag: 'wx', mode: 0o600 });
      renameSync(staging, registry);
    } finally { rmSync(staging, { force: true }); }
  };
  if (!alreadyPresent) writeRegistry([...roots, root]);
  if (state) {
    try {
      service.recordRootAuthorizationGrant({ canonicalRoot: root, generation: state.generation,
        grantId: randomUUID(), mechanism: 'local_operator_helper', registryPublished: true });
    } catch (error) {
      // The grant transaction failed. Preserve pre-existing entries and best-effort
      // remove only the root added by this invocation; a crash can leave JSON alone.
      if (!alreadyPresent) {
        try { writeRegistry(roots); } catch { /* R4-D must require the published grant as well. */ }
      }
      throw error;
    }
  }
} finally { try { service?.close(); } finally { release(); } }
console.log('Workspace authorized for local QAP preparation. Reconnect the MCP, then call qap_status. No application permissions granted.');
