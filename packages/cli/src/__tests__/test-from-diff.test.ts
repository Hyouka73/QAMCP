import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import YAML from 'yaml';

import { handleTest } from '../commands/test.js';

/**
 * Crea un repo Git real y aislado con dos módulos QAP registrados
 * (checkout y auth), cada uno con su repo-map.json, un commit base,
 * y luego modifica solo el archivo de 'checkout' sin commitear.
 */
function setupRepoWithTwoModules(): string {
  const rootDir = mkdtempSync(join(tmpdir(), 'qap-from-diff-test-'));

  execSync('git init -b main', { cwd: rootDir });
  execSync('git config user.email "test@qap.local"', { cwd: rootDir });
  execSync('git config user.name "QAP Test"', { cwd: rootDir });

  mkdirSync(join(rootDir, 'src', 'checkout'), { recursive: true });
  writeFileSync(join(rootDir, 'src', 'checkout', 'cart.ts'), 'export const cart = 1;\n');
  mkdirSync(join(rootDir, 'src', 'auth'), { recursive: true });
  writeFileSync(join(rootDir, 'src', 'auth', 'login.ts'), 'export const login = 1;\n');

  mkdirSync(join(rootDir, '.qa', 'modules', 'checkout', 'tests'), { recursive: true });
  writeFileSync(
    join(rootDir, '.qa', 'modules', 'checkout', 'context.yaml'),
    YAML.stringify({ _version: '2', module: 'checkout' })
  );
  writeFileSync(
    join(rootDir, '.qa', 'modules', 'checkout', 'repo-map.json'),
    JSON.stringify({ _version: '1', module: 'checkout', files: ['src/checkout/cart.ts'] })
  );

  mkdirSync(join(rootDir, '.qa', 'modules', 'auth', 'tests'), { recursive: true });
  writeFileSync(
    join(rootDir, '.qa', 'modules', 'auth', 'context.yaml'),
    YAML.stringify({ _version: '2', module: 'auth' })
  );
  writeFileSync(
    join(rootDir, '.qa', 'modules', 'auth', 'repo-map.json'),
    JSON.stringify({ _version: '1', module: 'auth', files: ['src/auth/login.ts'] })
  );

  execSync('git add .', { cwd: rootDir });
  execSync('git commit -m "base"', { cwd: rootDir });

  // Modifica solo 'checkout' sin commitear: solo ese módulo debe quedar afectado.
  writeFileSync(join(rootDir, 'src', 'checkout', 'cart.ts'), 'export const cart = 2;\n');

  return rootDir;
}

describe('qap test --from-diff (S75-002)', () => {
  let rootDir: string;
  let originalCwd: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    rootDir = setupRepoWithTwoModules();
    originalCwd = process.cwd();
    process.chdir(rootDir);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(rootDir, { recursive: true, force: true });
    logSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('acota la ejecución solo al módulo afectado por el cambio de Git', async () => {
    await handleTest(undefined, { fromDiff: true });

        const logs: string[] = logSpy.mock.calls.map((call: unknown[]) => String(call[0]));
    const scopingLog = logs.find((line: string) => line.includes('--from-diff'));

    expect(scopingLog).toContain('checkout');
    expect(scopingLog).not.toContain('auth');
  });

  it('termina limpio con exit code 0 si ningún módulo fue afectado', async () => {
    // Revertimos el cambio sin commitear: ya no hay nada afectado.
    execSync('git checkout -- .', { cwd: rootDir });

    await handleTest(undefined, { fromDiff: true });

    expect(process.exitCode).toBe(0);
  });

  it('con un módulo explícito, solo corre si está entre los afectados (intersección)', async () => {
    // 'auth' no fue modificado, así que pedirlo explícitamente con --from-diff
    // debe dar como resultado "nada que ejecutar", no forzar su ejecución.
    await handleTest('auth', { fromDiff: true });

    const logs: string[] = logSpy.mock.calls.map((call: unknown[]) => String(call[0]));
    const noAffectedLog = logs.find(
      (line: string) => line.includes('Nada que ejecutar') || line.includes('no hay módulos afectados')
    );

    expect(noAffectedLog).toBeDefined();
  });
});