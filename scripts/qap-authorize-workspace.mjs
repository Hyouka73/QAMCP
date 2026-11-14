import { existsSync, lstatSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, parse, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

import { acquireProjectOperation, readProjectResetState } from '../packages/mcp/dist/index.js';

// Local operator entrypoint, deliberately not an MCP tool. This grants only local
// project preparation. It never authorizes application access or human reviews.
const candidate = process.argv[2];
if (!candidate || !isAbsolute(candidate)) throw new Error('Usage: node scripts/qap-authorize-workspace.mjs <absolute-workspace>');
const root = realpathSync(candidate);
if (root.toLowerCase() !== resolve(candidate).toLowerCase() || !lstatSync(root).isDirectory()) throw new Error('Use an existing unlinked workspace');
const directory = resolve(process.env.QAP_MCP_WORKSPACE_HOST_DIR ?? join(homedir(), '.qap', 'workspaces'));
const registry = join(directory, 'authorized-roots.json');
let part = parse(registry).root;
for (const segment of registry.slice(part.length).split(/[\\/]/).filter(Boolean)) {
  part = join(part, segment);
  if (existsSync(part) && (lstatSync(part).isSymbolicLink() || (lstatSync(part).isFile() && lstatSync(part).nlink !== 1))) throw new Error('Unsafe host registry');
}
const release = acquireProjectOperation(directory);
try {
  if (readProjectResetState(directory, root)?.state === 'pending') throw new Error('project_reset_incomplete');
  const roots = existsSync(registry) ? JSON.parse(readFileSync(registry, 'utf8')) : [];
  if (!Array.isArray(roots) || roots.some(r => typeof r !== 'string')) throw new Error('Invalid workspace registry');
  if (!roots.includes(root)) {
    const staging = join(dirname(registry), randomUUID() + '.json');
    writeFileSync(staging, JSON.stringify([...roots, root]), { flag: 'wx', mode: 0o600 });
    renameSync(staging, registry);
  }
} finally { release(); }
console.log('Workspace authorized for local QAP preparation. Reconnect the MCP, then call qap_status. No application permissions granted.');
