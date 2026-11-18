// Host operator entry point, intentionally not registered as an MCP tool.
// Security boundary: the host must restrict local process execution and access
// to the application and coordination directories to its administrators.
// A terminal prompt alone does not establish human presence or OS identity.
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { QapApplicationService } from '../packages/mcp/dist/index.js';

const [projectId, generation] = process.argv.slice(2);
if (process.argv.length !== 4 || !projectId || !/^[0-9a-f-]{36}$/i.test(generation ?? '') || !stdin.isTTY || !stdout.isTTY) {
  throw new Error('Usage on a trusted host terminal: node scripts/qap-recover-project.mjs <project_id> <deletion_generation>');
}
const host = resolve(process.env.QAP_MCP_HOST_DATA_DIR ?? join(homedir(), '.qap'));
const app = resolve(process.env.QAP_MCP_APP_SERVICE_DIR ?? join(host, 'application'));
const domain = resolve(process.env.QAP_MCP_WORKSPACE_HOST_DIR ?? join(host, 'workspaces'));
const service = new QapApplicationService({ hostRootDir: app, projectOperationDirectory: domain });
try {
  const root = service.getDeletedProjectRoot(projectId);
  const state = root && service.getRootDeletionState(root);
  if (!state || state.version !== 1 || state.project_id !== projectId || state.generation !== generation || state.cleanup_status !== 'completed') {
    throw new Error('Deletion generation unavailable or cleanup incomplete');
  }
  const prompt = createInterface({ input: stdin, output: stdout });
  let answer;
  try {
    answer = await prompt.question(`Recover project ${projectId}\nRoot: ${root}\nDeletion generation: ${generation}\nType RECOVER to continue: `);
  } finally { prompt.close(); }
  if (answer !== 'RECOVER') throw new Error('Recovery rejected');
  // Rechecks the exact deletion generation under the existing coordinator.
  console.log(JSON.stringify(service.recoverDeletedProject(projectId, { expectedDeletionGeneration: generation })));
} finally { service.close(); }
