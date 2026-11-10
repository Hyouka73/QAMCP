import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { SqliteKnowledgeAdapter } from '../packages/knowledge/dist/index.js';
import { SqliteInterviewDraftStore, SqliteModuleClosureStore } from '../packages/mcp/dist/index.js';
// Administrative setup only. This command never navigates to the application or makes review decisions.
const [settingsFile, hostDirectory] = process.argv.slice(2);
if (!settingsFile || !hostDirectory) throw new Error('Usage: node scripts/qap-provision-host.mjs <settings.json> <private-host-directory>');
const settings = JSON.parse(readFileSync(resolve(settingsFile), 'utf8'));
const protection = 'host_private_directory_and_managed_key';
if (settings.protection !== protection) throw new Error('Configure the private directory ACL and attest protection first');
const root = realpathSync(settings.projectRoot), host = realpathSync(hostDirectory);
if (!isAbsolute(settings.projectRoot) || root !== settings.projectRoot || resolve(hostDirectory) !== host ||
    host === root || host.startsWith(root + '/') || host.startsWith(root + String.fromCharCode(92))) throw new Error('Use canonical paths and a separate private host directory');
for (const field of ['applicationId','applicationName','environmentId','environmentName','baseUrl']) if (typeof settings[field] !== 'string' || !settings[field].trim()) throw new Error('Missing ' + field);
if (!Array.isArray(settings.modules) || !settings.modules.length || !settings.discoveryAuthorization || !settings.testAuthorization) throw new Error('Explicit module bindings and host navigation policies required');
for (const name of ['knowledge.sqlite','interview.sqlite','closure.sqlite','host.json','secrets.json','client-config.json']) if (existsSync(join(host,name))) throw new Error('Refusing to overwrite existing host data');
const keys = Object.fromEntries(['REVIEW','INTERVIEW','CLOSURE'].map(name => ['QAP_MCP_' + name + '_KEY_HEX', randomBytes(32).toString('hex')])); keys.QAP_SESSION_KEY = randomBytes(32).toString('hex');
const at = new Date().toISOString(), app = settings.applicationId;
const trace = { source: 'host_administrative_setup', recorded_by: 'local_host_operator', recorded_at: at, reason: 'Explicit application context supplied by operator; no business requirement approval', review: 'unreviewed', evidence_refs: [] };
const knowledgeDbPath = join(host,'knowledge.sqlite'), store = new SqliteKnowledgeAdapter(knowledgeDbPath);
try {
  await store.commit(app, [
    { kind: 'application', expected_revision: 0, trace, entity: { application_id: app, name: settings.applicationName, base_url: settings.baseUrl, created_at: at } },
    { kind: 'environment', expected_revision: 0, trace, entity: { application_id: app, environment_id: settings.environmentId, name: settings.environmentName, base_url: settings.baseUrl,
      safe_domains: settings.safeDomains, is_production: false, destructive_actions_allowed: false } },
    ...settings.modules.map(m => ({ kind: 'module', expected_revision: 0, trace, entity: { id: m.moduleId, application_id: app, key: m.moduleKey, title: m.title,
      certainty: 'confirmed', criticality: m.criticality, dependencies: [], created_at: at, updated_at: at, is_active: true } })),
  ]);
} finally { store.close(); }
const scope = { projectRoot: root, applicationId: app, environmentId: settings.environmentId };
const draftPath = join(host,'interview.sqlite'), closurePath = join(host,'closure.sqlite');
new SqliteInterviewDraftStore({ ...scope, path: draftPath, key: Buffer.from(keys.QAP_MCP_INTERVIEW_KEY_HEX,'hex'), initialize: true, protection }).close();
new SqliteModuleClosureStore({ ...scope, path: closurePath, key: Buffer.from(keys.QAP_MCP_CLOSURE_KEY_HEX,'hex'), initialize: true, protection }).close();
const reviews = join(host,'reviews'); mkdirSync(reviews);
const manifest = { version: 1, ...scope, knowledgeDbPath,
  moduleBindings: settings.modules.map(m => ({ plannedName: m.plannedName, moduleId: m.moduleId, moduleKey: m.moduleKey, moduleRevision: 1, applicationRevision: 1, environmentRevision: 1, provenance: 'host_declared' })),
  discoveryAuthorization: { ...settings.discoveryAuthorization, environmentRevision: 1 }, testAuthorization: settings.testAuthorization,
  humanReview: { directory: reviews, keyEnv: 'QAP_MCP_REVIEW_KEY_HEX', protection },
  interviewDraft: { dbPath: draftPath, keyEnv: 'QAP_MCP_INTERVIEW_KEY_HEX', protection },
  moduleClosure: { dbPath: closurePath, keyEnv: 'QAP_MCP_CLOSURE_KEY_HEX', protection } };
const manifestPath = join(host,'host.json'); writeFileSync(manifestPath, JSON.stringify(manifest,null,2), { flag:'wx', mode:0o600 });
writeFileSync(join(host,'secrets.json'), JSON.stringify(keys,null,2), { flag:'wx', mode:0o600 });
writeFileSync(join(host,'client-config.json'), JSON.stringify({ mcpServers: { qap: { command: process.execPath, args: [resolve('packages/mcp/dist/server.js')], env: { ...keys, QAP_MCP_HOST_CONFIG_PATH: manifestPath } } } },null,2), { flag:'wx', mode:0o600 });
console.log('Host provisioned: ' + join(host,'client-config.json') + '. This private file contains secrets; do not commit it.');
