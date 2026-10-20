import { describe, it, expect } from 'vitest';

import { PlaywrightRunner } from '../src/runner.js';

describe('PlaywrightRunner (S7-001)', () => {
  it('ejecuta un plan sin casos y devuelve un ExecutionResult válido', async () => {
    const runner = new PlaywrightRunner();

    const result = await runner.execute(
      { modules: ['demo-module'], cases: [] },
      { headless: true }
    );

    // Campos obligatorios del contrato ExecutionResult (S5-001)
    expect(result._version).toBe('1');
    expect(result.module).toBe('demo-module');
    expect(typeof result.started_at).toBe('string');
    expect(typeof result.finished_at).toBe('string');
    expect(['passed', 'failed', 'partial', 'error']).toContain(result.result);
    expect(typeof result.timed_out).toBe('boolean');
    expect(result.summary).toBeDefined();
    expect(Array.isArray(result.cases)).toBe(true);

    // Sin casos en el plan, debe considerarse "passed" (0 fallos)
    expect(result.result).toBe('passed');
    expect(result.summary.total).toBe(0);
  }, 15000);

  it('ejecuta un caso real usando storageResolver y navega sin consumir tokens de IA', async () => {
    const runner = new PlaywrightRunner();

    const result = await runner.execute(
      { modules: ['demo-module'], cases: ['case-1'] },
      {
        headless: true,
        storageResolver: async () => ({
          _version: '1',
          id: 'a1b2c3d4-e5f6-4789-a123-456789abcdef',
          name: 'Caso de prueba de humo',
          steps: [
            {
              type: 'navigate',
              url: 'data:text/html,<html><body><h1 id="ok">Listo</h1></body></html>',
            },
            { type: 'assert', selector: '#ok', assertion_type: 'visible' },
          ],
        }),
      }
    );

    expect(result.result).toBe('passed');
    expect(result.cases).toHaveLength(1);
    expect(result.cases[0].id).toBe('case-1');
    expect(result.cases[0].title).toBe('Caso de prueba de humo');
    expect(result.cases[0].result).toBe('passed');
  }, 15000);

    it('con sesión válida inyectada vía resolveModuleSession, accede a ruta protegida sin redirigir a /login', async () => {
    const fs = await import('node:fs');
    const os = await import('node:os');
    const path = await import('node:path');
    const http = await import('node:http');
    const { SessionStore } = await import('@qap/auth');

    // Servidor local real: / es protegida y redirige a /login si falta la cookie 'auth_token'.
    const server = http.createServer((req, res) => {
      const cookie = req.headers.cookie ?? '';
      if (req.url === '/login') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1 id="login-page">Login</h1></body></html>');
        return;
      }
      if (!cookie.includes('auth_token=valid-session-token')) {
        res.writeHead(302, { Location: '/login' });
        res.end();
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html><body><div id="dashboard">Bienvenido Usuario Autenticado</div></body></html>');
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    const baseUrl = `http://127.0.0.1:${port}`;

        const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-runner-auth-test-'));
    const originalCwd = process.cwd();

    // SessionStore ignora internamente su parámetro projectPath y siempre usa
    // process.cwd() (bug preexistente en session-store.ts, archivo prohibido
    // de modificar por S75-006A). Por eso el chdir debe ocurrir ANTES de
    // guardar la sesión, para que guardar y leer usen el mismo cwd.
    process.chdir(projectRoot);

    const moduleDir = path.join(projectRoot, '.qa', 'modules', 'protected-module');
    fs.mkdirSync(moduleDir, { recursive: true });
    fs.writeFileSync(path.join(moduleDir, 'prereqs.yaml'), 'requires:\n  auth:\n    primary: "test-user"\n');

    const sessionStore = new SessionStore(undefined, projectRoot);
    sessionStore.saveSession('test-user', {
      cookies: [
        {
          name: 'auth_token',
          value: 'valid-session-token',
          domain: '127.0.0.1',
          path: '/',
          expires: Date.now() / 1000 + 3600,
          httpOnly: true,
          secure: false,
          sameSite: 'Lax' as const,
        },
      ],
      origins: [],
    });

    const runner = new PlaywrightRunner();

    try {
      const result = await runner.execute(
        { modules: ['protected-module'], cases: ['case-dashboard'] },
        {
          headless: true,
          projectRoot,
          storageResolver: async () => ({
            _version: '1',
            id: 'c3d4e5f6-a7b8-4901-c234-56789abcdef0',
            name: 'Acceso a dashboard protegido',
            steps: [
              { type: 'navigate', url: `${baseUrl}/` },
              { type: 'assert', selector: '#dashboard', assertion_type: 'visible' },
            ],
          }),
        }
      );
      expect(result.result).toBe('passed');
      expect(result.cases[0].result).toBe('passed');
      // La prueba de fondo: si NO se hubiera inyectado la cookie, el servidor
      // habría redirigido a /login y '#dashboard' nunca existiría, haciendo
      // fallar el assert anterior con selector_not_found.
        } finally {
      process.chdir(originalCwd);
      server.close();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  }, 20000);
});