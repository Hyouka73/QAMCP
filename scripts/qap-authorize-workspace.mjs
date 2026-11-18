import { existsSync, lstatSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, parse, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

import { acquireProjectOperation, QapApplicationService, readProjectResetState } from '../packages/mcp/dist/index.js';

// Local operator entrypoint, deliberately not an MCP tool. This grants only local
// project preparation. It never authorizes application access or human reviews.
const mode = process.argv[2];
const importRead = mode === 'import-read-grant' || mode === 'import-read-revoke';
const candidate = importRead ? process.argv[3] : mode;
if (!candidate || !isAbsolute(candidate)) throw new Error('Usage: node scripts/qap-authorize-workspace.mjs <absolute-workspace>');
const root = realpathSync(candidate);
if (root.toLowerCase() !== resolve(candidate).toLowerCase() || !lstatSync(root).isDirectory()) throw new Error('Use an existing unlinked workspace');
const defaultHome = resolve(process.env.QAP_MCP_HOST_DATA_DIR ?? join(homedir(), '.qap'));
const directory = resolve(process.env.QAP_MCP_WORKSPACE_HOST_DIR ?? join(defaultHome, 'workspaces'));
const applicationDirectory = resolve(process.env.QAP_MCP_APP_SERVICE_DIR ?? join(defaultHome, 'application'));
if (importRead) {
  const service = new QapApplicationService({ hostRootDir: applicationDirectory, projectOperationDirectory: directory });
  try {
    if (mode === 'import-read-grant') {
      if (process.argv.length !== 4) throw new Error('Usage: import-read-grant <absolute-source>');
      console.log(JSON.stringify(service.issueImportReadGrant(root)));
    } else {
      if (process.argv.length !== 5 || !service.revokeImportReadGrant(root, process.argv[4])) throw new Error('Unknown or revoked import_read grant');
      console.log('import_read grant revoked');
    }
  } finally { service.close(); }
  process.exit(0);
}
const registry = join(directory, 'authorized-roots.json');
let part = parse(registry).root;
for (const segment of registry.slice(part.length).split(/[\\/]/).filter(Boolean)) {
  part = join(part, segment);
  if (existsSync(part) && (lstatSync(part).isSymbolicLink() || (lstatSync(part).isFile() && lstatSync(part).nlink !== 1))) throw new Error('Unsafe host registry');
}
let release;
let service;
try {
  service = new QapApplicationService({ hostRootDir: applicationDirectory, projectOperationDirectory: directory });
  release = acquireProjectOperation(directory);
  if (readProjectResetState(directory, root)?.state === 'pending') throw new Error('project_reset_incomplete');
  const writeRegistry = values => {
    const staging = join(dirname(registry), randomUUID() + '.json');
    try {
      writeFileSync(staging, JSON.stringify(values), { flag: 'wx', mode: 0o600 });
      renameSync(staging, registry);
    } finally { rmSync(staging, { force: true }); }
  };
  let roots, added = false;
  service.publishRootAuthorization(root, randomUUID(), () => {
    roots = existsSync(registry) ? JSON.parse(readFileSync(registry, 'utf8')) : [];
    if (!Array.isArray(roots) || roots.some(r => typeof r !== 'string')) throw new Error('Invalid workspace registry');
    const sameRoot = value => process.platform === 'win32' ? value.toLowerCase() === root.toLowerCase() : value === root;
    if (!roots.some(sameRoot)) {
      writeRegistry([...roots, root]);
      added = true;
    }
  }, () => {
    // Preserve pre-existing entries. A crash can still leave JSON alone; D1-B
    // must require the published SQLite grant as well.
    if (added) writeRegistry(roots);
  }, release.context);
} finally { try { service?.close(); } finally { release?.(); } }
console.log('Workspace authorized for local QAP preparation. Reconnect the MCP, then call qap_status. No application permissions granted.');
