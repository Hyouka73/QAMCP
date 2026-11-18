import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const api = await import(pathToFileURL(process.env.OPERATION_TEST_MODULE).href);
const { SqliteKnowledgeAdapter } = await import(pathToFileURL(createRequire(pathToFileURL(process.env.OPERATION_TEST_MODULE)).resolve('@qap/knowledge')).href);
const service = new api.QapApplicationService({ hostRootDir: process.env.OPERATION_TEST_APP,
  projectOperationDirectory: process.env.OPERATION_TEST_HOST });
let bootstrap;
const send = value => process.send(value);
const barrier = () => new Promise(resolve => process.once('message', resolve));
process.on('message', async message => {
  if (message === 'release') return;
  try {
    let result;
    if (message.action === 'hold') {
      const release = api.acquireProjectOperation(process.env.OPERATION_TEST_HOST);
      send({ event: 'held' });
      await barrier();
      release();
    } else if (message.action === 'publish') {
      const original = SqliteKnowledgeAdapter.prototype.get;
      SqliteKnowledgeAdapter.prototype.get = async function (...args) {
        send({ event: 'publication-held' });
        await barrier();
        return original.apply(this, args);
      };
      bootstrap = new api.WorkspaceBootstrap(process.env.OPERATION_TEST_HOST, service);
      try { result = Boolean(await bootstrap.prepare(message.root, 'https://example.invalid/')); }
      finally { SqliteKnowledgeAdapter.prototype.get = original; bootstrap.close(); }
    } else if (message.action === 'revoke') {
      result = service.authority.revokeGrant(message.project, message.grant);
    } else if (message.action === 'grant') {
      result = service.authority.grant({ project_id: message.project, capability: 'observe', granted_by: 'test' });
    } else if (message.action === 'revoke-root') {
      result = service.revokeRootAuthorizationGrant(message.root, message.generation, message.grant);
    } else if (message.action === 'record-root') {
      result = service.recordRootAuthorizationGrant({ canonicalRoot: message.root, generation: message.generation,
        grantId: message.grant, mechanism: 'local_operator_helper' });
    } else if (message.action === 'prepare') {
      bootstrap = new api.WorkspaceBootstrap(process.env.OPERATION_TEST_HOST, service);
      try { result = Boolean(await bootstrap.prepare(message.root, 'https://example.invalid/')); }
      finally { bootstrap.close(); }
    }
    send({ event: 'done', result });
  } catch (error) { send({ event: 'error', code: error.code ?? error.message }); }
});
process.on('disconnect', () => { bootstrap?.close(); service.close(); process.exit(0); });
send({ event: 'ready' });
