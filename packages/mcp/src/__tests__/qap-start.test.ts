import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { expect, it } from 'vitest';

const serverPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../dist/server.js');
function authorize(workspace: string, host: string) {
  execFileSync(process.execPath, [resolve(dirname(fileURLToPath(import.meta.url)), '../../../../scripts/qap-authorize-workspace.mjs'), workspace],
    { env: { ...process.env, QAP_MCP_APP_SERVICE_DIR: join(host, 'application'), QAP_MCP_WORKSPACE_HOST_DIR: join(host, 'workspaces') }, windowsHide: true });
}

it.runIf(process.platform === 'win32')('persists the scoped login across Stdio restarts and renews an expired session from the keychain', async () => {
  const base = realpathSync(mkdtempSync(join(tmpdir(), 'qap-start-auth-')));
  const workspace = join(base, 'workspace');
  mkdirSync(workspace);
  const host = join(base, 'host');
  authorize(workspace, host);
  const username = 'qap-fixture-user';
  const password = 'qap-fixture-pass';
  let posts = 0;
  let validCookie = '';
  const site = createServer((request, response) => {
    const html = { 'content-type': 'text/html' };
    if (request.url === '/login') {
      response.writeHead(200, html).end('<form><input type="text"><input type="password" style="display:none"></form>' +
        '<form method="post" action="/login/submit"><input name="user"><input name="password" type="password"><button>Entrar</button></form>');
    } else if (request.method === 'POST' && request.url === '/login/submit') {
      posts++;
      const chunks: Buffer[] = [];
      request.on('data', chunk => chunks.push(chunk as Buffer));
      request.on('end', () => {
        const fields = new URLSearchParams(Buffer.concat(chunks).toString());
        if (fields.get('user') !== username || fields.get('password') !== password) return response.writeHead(403).end();
        validCookie = 'session=authenticated-' + posts;
        response.writeHead(302, { location: '/workspace/home', 'set-cookie': validCookie + '; Path=/; HttpOnly' }).end();
      });
    } else if (request.url === '/workspace/home' && validCookie && request.headers.cookie === validCookie) {
      response.writeHead(200, html).end('<h1>Portal interno</h1><input type="password" style="display:none"><a href="/reports">Reportes</a>');
    } else {
      response.writeHead(302, { location: '/login' }).end();
    }
  });
  await new Promise<void>(done => site.listen(0, '127.0.0.1', done));
  const url = 'http://127.0.0.1:' + (site.address() as { port: number }).port;
  let client: Client | undefined;
  async function connect() {
    await client?.close();
    client = new Client({ name: 'qap-start-auth-test', version: '1' });
    await client.connect(new StdioClientTransport({
      command: process.execPath, args: [serverPath], stderr: 'pipe',
      env: { PATH: process.env.PATH ?? '', NODE_ENV: 'test', QAP_MCP_HOST_DATA_DIR: host, QAP_MCP_WORKSPACE_ROOT: workspace,
        ...(process.env.PLAYWRIGHT_BROWSERS_PATH ? { PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH } : {}) },
    }));
  }
  async function call(name: string, args = {}) {
    const response = await client!.callTool({ name, arguments: { targetPath: workspace, ...args } });
    return JSON.parse((response.content[0] as { text: string }).text) as Record<string, unknown>;
  }
  try {
    await connect();
    const original = await call('qap_start', { base_url: url, credentials: { profile: 'fixture', username, password } });
    expect(original).toMatchObject({ autenticacion: { status: 'verified', secretSaved: true, profile: 'fixture' },
      discovery_inicial: { access: 'authenticated', counts: { views: 1 } } });
    expect(posts).toBe(1);
    await connect();
    const reopened = await call('qap_start');
    expect(reopened).toMatchObject({ autenticacion: { status: 'reused', profile: 'fixture' },
      discovery_inicial: { access: 'authenticated', counts: { views: 1 } } });
    expect(posts).toBe(1);
    validCookie = 'session=expired-on-server';
    await connect();
    const renewed = await call('qap_start');
    expect(renewed).toMatchObject({ autenticacion: { status: 'renewed', profile: 'fixture' },
      discovery_inicial: { access: 'authenticated', counts: { views: 1 } } });
    expect(posts).toBe(2);
    const notes = readFileSync(join(workspace, '.qa/discovery/INICIO.md'), 'utf8');
    expect(notes).toContain('/workspace/home');
    const logs = readFileSync(join(workspace, '.qa/logs/qap-events.jsonl'), 'utf8');
    expect(logs).not.toContain(password);
    expect(logs).not.toContain('session=authenticated-');
  } finally {
    await client?.close();
    const { QapApplicationService } = await import('../application/application-service.js');
    const { KeychainCredentialProvider } = await import('@qap/auth');
    const service = new QapApplicationService({ hostRootDir: join(host, 'application'), credentialProvider: new KeychainCredentialProvider() });
    try {
      const project = service.findActiveProjectByRoot(workspace);
      if (project) {
        const preview = service.previewDelete(project.project_id);
        await service.confirmDelete(project.project_id, preview.confirmation_token, 'confirm_delete', { purgeWorkspaceQa: false });
      }
    } finally { service.close(); }
    await new Promise<void>((done, reject) => site.close(error => error ? reject(error) : done()));
    rmSync(base, { recursive: true, force: true });
  }
}, 90_000);

it('starts from a client without roots or elicitation and persists separate MCP logs across reconnects', async () => {
  const base = realpathSync(mkdtempSync(join(tmpdir(), 'qap-start-')));
  const workspace = join(base, 'workspace');
  const outside = join(base, 'outside');
  mkdirSync(workspace);
  mkdirSync(outside);
  authorize(workspace, join(base, 'host'));
  let siteRequests = 0;
  const requestedMethods: string[] = [];
  const site = createServer((request, response) => {
    siteRequests++;
    requestedMethods.push(request.method ?? '');
    if (request.url === '/') {
      response.writeHead(302, { location: '/login;jsessionid=DO_NOT_LOG_THE_SESSION_ID' }).end();
    } else if (request.url === '/login') {
      response.writeHead(200, { 'content-type': 'text/html' }).end(
        '<h1>Portal de prueba</h1><form method="post"><label>Usuario<input name="user"></label>' +
        '<label>Contraseña<input type="password"></label><button>Entrar</button></form><a href="/help">Ayuda</a>',
      );
    } else {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>(done => site.listen(0, '127.0.0.1', done));
  const address = site.address() as { port: number };
  let client: Client | undefined;
  async function connect() {
    client = new Client({ name: 'qap-test-without-roots', version: '1.0.0' });
    await client.connect(new StdioClientTransport({
      command: process.execPath,
      args: [serverPath],
      env: { PATH: process.env.PATH ?? '', NODE_ENV: 'test',
        ...(process.env.PLAYWRIGHT_BROWSERS_PATH ? { PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH } : {}),
        QAP_MCP_HOST_DATA_DIR: join(base, 'host'), QAP_MCP_WORKSPACE_ROOT: workspace },
      stderr: 'pipe',
    }));
  }
  async function call(name: string, args: Record<string, unknown>) {
    const response = await client!.callTool({ name, arguments: args });
    const output = response.content as Array<{ text: string }>;
    return JSON.parse(output[0].text) as Record<string, unknown>;
  }
  try {
    await connect();
    expect(await client!.getPrompt({ name: 'qap_start' })).toMatchObject({ messages: [
      { content: { text: expect.stringContaining('Invoca qap_start') } },
    ] });
    expect((await client!.listTools()).tools.find(tool => tool.name === 'qap_start')).toBeDefined();
    expect(await call('qap_start', { targetPath: outside })).toMatchObject({ code: 'workspace_outside_configured_root' });
    expect(existsSync(join(outside, '.qa'))).toBe(false);
    expect(await call('qap_start', { base_url: 'https://fixture:private@example.test/' })).toMatchObject({ code: 'invalid_arguments' });
    const start = await call('qap_start', { base_url: 'http://127.0.0.1:' + address.port });
    expect(start, JSON.stringify(start)).toMatchObject({ status: 'success', initialized: true, fase: 'ONBOARDING',
      conversation_id: expect.any(String),
      onboarding_inventory: { state: 'BLOCKED', can_scope: false, auth_required: true, inspected_routes: 0 },
      siguiente_accion: { tool: 'qap_auth_add' }, discovery_inicial: {
        status: 'blocked', code: 'auth_required', notes_path: '.qa/discovery/INICIO.md',
        counts: { views: 0 }, routes: expect.arrayContaining([
          { path: '/', state: 'redirected' },
          { path: '/login', state: 'blocked', reason: 'AUTH_REQUIRED' },
        ]),
      } });
    const first = start.discovery_inicial as { doc_path: string; revision_id: string };
    const markdown = readFileSync(join(workspace, first.doc_path), 'utf8');
    expect(markdown).toContain('/login');
    expect(markdown).toContain('AUTH_REQUIRED');
    expect(markdown).not.toContain('DO_NOT_LOG_THE_SESSION_ID');
    expect(requestedMethods.every(method => method === 'GET')).toBe(true);
    expect(siteRequests).toBe(2);
    expect(readFileSync(join(workspace, '.qa/discovery/INICIO.md'), 'utf8')).toContain('Expediente de la vista');
    const path = String(start.conversation_log);
    expect(path).toBe(join(workspace, '.qa', 'logs', 'conversations', String(start.conversation_id) + '.jsonl'));
    expect(readFileSync(path, 'utf8')).toContain('qap_start');
    await client!.close();
    const previousRequests = siteRequests;
    mkdirSync(join(workspace, 'pages'));
    writeFileSync(join(workspace, 'pages', 'report.tsx'), 'export default function Report() { return null; }');
    writeFileSync(join(workspace, 'manual.md'), '# Manual de operaciones\n\nConsulta de reportes por oficina y fecha.');
    rmSync(join(workspace, first.doc_path));
    rmSync(join(workspace, '.qa/discovery/INDEX.md'));
    await connect();
    expect(await call('qap_status', { targetPath: workspace, conversation_id: start.conversation_id })).toMatchObject({ initialized: true });
    const second = await call('qap_start', { targetPath: workspace });
    expect(second.conversation_id).not.toBe(start.conversation_id);
    expect(second.discovery_inicial).toMatchObject({ revision_id: first.revision_id, reused: true });
    expect(siteRequests).toBe(previousRequests);
    expect(existsSync(join(workspace, first.doc_path))).toBe(false);
    expect(existsSync(join(workspace, '.qa/discovery/INDEX.md'))).toBe(false);
    expect(second.discovery_inicial).not.toHaveProperty('doc_path');
    expect(second.discovery_inicial).not.toHaveProperty('index_path');
    const resumeNotes = readFileSync(join(workspace, '.qa/discovery/INICIO.md'), 'utf8');
    expect(resumeNotes).toContain('manual.md');
    expect(resumeNotes).toContain('/report');
    expect(readFileSync(path, 'utf8').trim().split(/\r?\n/).map(line =>
      (JSON.parse(line) as { tool: string }).tool)).toEqual(['qap_discover', 'qap_start', 'qap_status']);
    expect(readFileSync(String(second.conversation_log), 'utf8').trim().split(/\r?\n/)).toHaveLength(1);
  } finally {
    await client?.close();
    await new Promise<void>((done, reject) => site.close(error => error ? reject(error) : done()));
    rmSync(base, { recursive: true, force: true });
  }
}, 45_000);

it.runIf(process.platform === 'win32')('checkpoints broad authorized discovery by profile without executing writes', async () => {
  const base = realpathSync(mkdtempSync(join(tmpdir(), 'qap-initial-inventory-')));
  const workspace = join(base, 'workspace');
  const host = join(base, 'host');
  mkdirSync(workspace);
  authorize(workspace, host);
  const fixturePassword = randomBytes(18).toString('hex');
  const departments = Array.from({ length: 12 }, (_, i) => '/departments/area-' + String(i).padStart(2, '0'));
  const session = new Map<string, string>();
  const requests: string[] = [];
  let unauthorizedWrites = 0;
  const site = createServer((req, res) => {
    const path = req.url ?? '/';
    requests.push(`${req.method} ${path}`);
    const send = (code: number, html: string) => res.writeHead(code, { 'content-type': 'text/html' }).end(html);
    if (req.method === 'POST' && path === '/login') {
      let body = '';
      req.on('data', chunk => { body += String(chunk); });
      req.on('end', () => {
        const fields = new URLSearchParams(body);
        const role = fields.get('user');
        if (fields.get('password') !== fixturePassword || (role !== 'operator' && role !== 'reader')) return send(403, '');
        const cookie = 'fixture=' + randomBytes(20).toString('hex');
        session.set(cookie, role);
        res.writeHead(303, { location: '/portal', 'set-cookie': cookie + '; Path=/; HttpOnly' }).end();
      });
      return;
    }
    if (req.method !== 'GET' || path === '/delete-record' || path === '/hidden-write' || path === '/script-get') {
      unauthorizedWrites++;
      return send(500, '');
    }
    if (path === '/login') return send(200, '<form method="post"><input name="user"><input name="password" type="password"><button type="submit">Entrar</button></form>');
    const role = session.get(req.headers.cookie ?? '');
    if (!role) return res.writeHead(302, { location: '/login' }).end();
    if (path === '/missing') return send(404, '');
    if (path === '/restricted' || (path === '/billing' && role === 'reader')) return send(403, '');
    if (path === '/portal') {
      const link = (route: string) => '<a href="' + route + '">Open</a>';
      const menu = ['/', '/billing', '/missing', '/restricted', ...(role === 'operator' ? ['/feature'] : []), ...departments];
      const controls = '<form action="/write" method="post"><input required><button>Guardar</button></form>' +
        '<a href="/delete-record">Remove</a><a href="/hidden-write" hidden>Hidden</a>' +
        (req.headers['user-agent'] === 'QAP-Recon/1' ? '<script>fetch("/script-get").catch(() => {})</script>' : '');
      const shell = role === 'operator' ? '<main><nav>' + menu.map(link).join('') + '</nav>' + controls + '</main>'
        : '<div role="main"><section role="navigation">' + menu.slice(0, 4).map(link).join('') + '</section>' + controls + '</div>';
      return send(200, shell);
    }
    return send(200, path === '/' ? '<main><nav><a href="/portal">Inicio</a></nav></main>'
      : '<main><h1>Status</h1><button type="button">Details</button></main>');
  });
  await new Promise<void>(done => site.listen(0, '127.0.0.1', done));
  const origin = 'http://127.0.0.1:' + (site.address() as { port: number }).port;
  let client: Client | undefined;
  async function connect() {
    await client?.close();
    client = new Client({ name: 'qap-inventory-fixture', version: '1' });
    await client.connect(new StdioClientTransport({ command: process.execPath, args: [serverPath], stderr: 'pipe',
      env: { PATH: process.env.PATH ?? '', NODE_ENV: 'test', QAP_MCP_HOST_DATA_DIR: host, QAP_MCP_WORKSPACE_ROOT: workspace } }));
  }
  async function call(name: string, args: Record<string, unknown> = {}) {
    const response = await client!.callTool({ name, arguments: { targetPath: workspace, ...args } });
    return JSON.parse((response.content[0] as { text: string }).text);
  }
  try {
    await connect();
    const publicStart = await call('qap_start', { base_url: origin });
    expect(publicStart).toMatchObject({ siguiente_accion: { tool: 'qap_auth_add' },
      onboarding_inventory: { state: 'BLOCKED', can_scope: false, auth_required: true, candidate_modules: [] } });
    await call('qap_context_set', { objective: 'Inventariar el fixture local', roles: [{ name: 'operator' }],
      critical_flows: [{ name: 'Consultar el portal', path: '/portal' }],
      source_of_truth: { type: 'none', declared: true }, source: 'user' });
    const plan = { plan: [{ module: 'billing', path: '/billing', priority: 'medium' }] };
    expect(await call('qap_session_plan', plan)).toMatchObject({ code: 'initial_inventory_required' });
    const access = await call('qap_auth_add', { profile: 'inventory-operator', username: 'operator',
      password: fixturePassword, role: 'operator', verification_route: '/portal', login_route: '/login' });
    expect(access).toMatchObject({ status: 'success' });
    const first = await call('qap_start');
    expect(first).toMatchObject({ siguiente_accion: { tool: 'qap_discover' },
      onboarding_inventory: { state: 'PARTIAL_READY', can_scope: false } });
    expect(first.onboarding_inventory.resumable_routes).toBeGreaterThan(0);
    const firstDossier = (await call('qap_project', { action: 'discovery_dossier',
      revision_id: first.onboarding_inventory.revision_id })).selected_revision.dossier;
    const pending = firstDossier.routes.find((route: { state: string; resumable?: boolean }) => route.state === 'candidate' && route.resumable);
    expect(pending).toBeDefined();
    expect(pending).not.toHaveProperty('view_id');
    expect(await call('qap_session_plan', plan)).toMatchObject({ code: 'initial_inventory_required' });
    const startsBeforeResume = requests.filter(item => item === 'GET /portal').length;
    await connect();
    const resumed = await call('qap_status');
    expect(resumed.onboarding_inventory.revision_id).toBe(first.onboarding_inventory.revision_id);
    const last = await call('qap_discover', resumed.siguiente_accion.parametros);
    expect(last).toMatchObject({ onboarding_inventory: { state: 'PARTIAL_READY', can_scope: true, resumable_routes: 0 } });
    expect(requests.filter(item => item === 'GET /portal')).toHaveLength(startsBeforeResume);
    const project = await call('qap_project', { action: 'discovery_dossier', revision_id: last.discovery_revision_id });
    const final = project.selected_revision.dossier;
    for (const path of departments) expect(final.routes).toContainEqual(expect.objectContaining({ authorized_pathname: path, state: 'visited', view_id: expect.any(String) }));
    expect(final.routes).toContainEqual(expect.objectContaining({ authorized_pathname: '/missing', state: 'unavailable' }));
    expect(final.routes).toContainEqual(expect.objectContaining({ authorized_pathname: '/restricted', state: 'blocked', reason: 'ACCESS_DENIED' }));
    expect(final.views).toContainEqual(expect.objectContaining({ forms_count: 1 }));
    expect(final.relations.length).toBeGreaterThan(12);
    expect(final.inventory.modules).toContainEqual(expect.objectContaining({ key: 'feature', status: 'inferred' }));
    expect(final.source_refs.filter((ref: { kind: string }) => ref.kind === 'confirmed_requirement')).toEqual([]);
    expect(existsSync(join(workspace, project.module_doc_path))).toBe(true);
    const reader = await call('qap_auth_add', { profile: 'inventory-reader', username: 'reader',
      password: fixturePassword, role: 'reader', verification_route: '/portal', login_route: '/login' });
    expect(reader).toMatchObject({ status: 'success' });
    const other = await call('qap_discover', { name: 'inventario-provisional', path: '/portal', profile: 'inventory-reader' });
    const alternate = (await call('qap_project', { action: 'discovery_dossier', revision_id: other.discovery_revision_id })).selected_revision.dossier;
    expect(alternate.scope).toMatchObject({ role: 'reader' });
    expect(alternate.scope.profile_id).not.toBe(final.scope.profile_id);
    expect(alternate.routes).toContainEqual(expect.objectContaining({ authorized_pathname: '/billing', state: 'blocked', reason: 'ACCESS_DENIED' }));
    expect(alternate.routes.some((route: { authorized_pathname: string }) => route.authorized_pathname === '/feature')).toBe(false);
    expect(alternate.views.some((view: { controls: Array<{ role: string }> }) => view.controls.some(control => control.role === 'navigation'))).toBe(true);
    expect(unauthorizedWrites).toBe(0);
  } finally {
    await client?.close();
    const { QapApplicationService } = await import('../application/application-service.js');
    const { KeychainCredentialProvider } = await import('@qap/auth');
    const service = new QapApplicationService({ hostRootDir: join(host, 'application'), credentialProvider: new KeychainCredentialProvider() });
    try {
      const project = service.findActiveProjectByRoot(workspace);
      if (project) {
        const preview = service.previewDelete(project.project_id);
        await service.confirmDelete(project.project_id, preview.confirmation_token, 'confirm_delete', { purgeWorkspaceQa: false });
      }
    } finally { service.close(); }
    await new Promise<void>(done => site.close(() => done()));
    rmSync(base, { recursive: true, force: true });
  }
}, 120_000);

it('does not publish discovery after observe G1 is revoked and replaced during navigation', async () => {
  const base = realpathSync(mkdtempSync(join(tmpdir(), 'qap-observe-fence-')));
  const workspace = join(base, 'workspace'), host = join(base, 'host'); mkdirSync(workspace); authorize(workspace, host);
  let release!: () => void, entered!: () => void;
  const barrier = new Promise<void>(resolve => { release = resolve; });
  const arrived = new Promise<void>(resolve => { entered = resolve; });
  const site = createServer(async (_request, response) => {
    entered(); await barrier; response.writeHead(200, { 'content-type': 'text/html' }).end('<h1>Visible</h1>');
  });
  await new Promise<void>(done => site.listen(0, '127.0.0.1', done));
  const client = new Client({ name: 'observe-fence', version: '1' });
  try {
    await client.connect(new StdioClientTransport({ command: process.execPath, args: [serverPath], stderr: 'pipe',
      env: { PATH: process.env.PATH ?? '', NODE_ENV: 'test', QAP_MCP_HOST_DATA_DIR: host, QAP_MCP_WORKSPACE_ROOT: workspace,
        ...(process.env.PLAYWRIGHT_BROWSERS_PATH ? { PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH } : {}) } }));
    const url = 'http://127.0.0.1:' + (site.address() as { port: number }).port;
    const pending = client.callTool({ name: 'qap_start', arguments: { targetPath: workspace, base_url: url } });
    await arrived;
    const { QapApplicationService } = await import('../application/application-service.js');
    const service = new QapApplicationService({ hostRootDir: join(host, 'application'), projectOperationDirectory: join(host, 'workspaces') });
    const project = service.findActiveProjectByRoot(workspace)!;
    const grant = service.authority.listGrants(project.project_id).find(item => item.capability === 'observe')!;
    service.authority.revokeGrant(project.project_id, grant.grant_id);
    service.authority.grant({ project_id: project.project_id, capability: 'observe', scope: grant.scope, granted_by: 'test' });
    release();
    await pending;
    expect(service.listLatestDiscoveryRevisionsByScope(project.project_id)).toHaveLength(0);
    expect(existsSync(join(workspace, '.qa/discovery/INDEX.md'))).toBe(false);
    const { workspaceStorageKey } = await import('../project-reset.js');
    const { DatabaseSync } = await import('node:sqlite');
    const knowledge = new DatabaseSync(join(host, 'workspaces', workspaceStorageKey(workspace), 'knowledge.sqlite'));
    expect(knowledge.prepare("SELECT count(*) AS n FROM knowledge_revisions WHERE kind IN ('observation', 'evidence')").get()).toMatchObject({ n: 0 });
    knowledge.close();
    service.close();
  } finally { release?.(); await client.close(); await new Promise<void>(done => site.close(() => done())); rmSync(base, { recursive: true, force: true }); }
}, 45_000);
