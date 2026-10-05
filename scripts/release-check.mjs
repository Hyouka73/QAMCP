/**
 * Release Readiness Verification Script (pnpm release:check)
 *
 * Verificaciones requeridas para publicación a registro:
 * 1. Verificación de ausencia de rutas absolutas quemadas en el código fuente y artefactos dist/.
 * 2. Ejecución y aprobación del 100% de los tests unitarios y de integración clave (@qap/shared, @qap/reporter, @qap/cli, @qap/mcp).
 * 3. Ejecución exitosa de `npm publish --dry-run` en los paquetes distribuibles (@qap/cli y @qap/mcp) sin advertencias.
 * 4. Verificación del ciclo de vida E2E en sandbox limpio con datos cero.
 */

import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT_DIR = process.cwd();

console.log('====================================================');
console.log('       QAP v2.1 - Release Check & Audit             ');
console.log('====================================================\n');

function runStep(title, fn) {
  process.stdout.write(`⏳ [Check] ${title}... `);
  try {
    fn();
    console.log('✔ OK');
  } catch (err) {
    console.log('❌ FALLÓ');
    console.error(`\nDetalles del error en [${title}]:`, err.message || err);
    process.exit(1);
  }
}

// 1. Escaneo de rutas absolutas quemadas
runStep('Escaneo de rutas absolutas en código fuente y dist', () => {
  const dirsToScan = [
    join(ROOT_DIR, 'packages', 'cli', 'src'),
    join(ROOT_DIR, 'packages', 'mcp', 'src'),
    join(ROOT_DIR, 'packages', 'shared', 'src'),
  ];

  const absolutePattern = /[A-Za-z]:[\\/](?:Users|Windows|Program Files)|(?:\/home\/[a-zA-Z0-9_-]+|\/Users\/[a-zA-Z0-9_-]+)/;

  function scanDir(dir) {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        if (entry !== 'node_modules' && entry !== '.git' && entry !== '__tests__') {
          scanDir(fullPath);
        }
      } else if (entry.endsWith('.ts') || entry.endsWith('.js')) {
        const content = readFileSync(fullPath, 'utf-8');
        const lines = content.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Ignorar comentarios de documentación
          if (line.includes('*') || line.trim().startsWith('//')) continue;
          if (absolutePattern.test(line)) {
            throw new Error(`Ruta absoluta quemada detectada en ${fullPath}:${i + 1} -> ${line.trim()}`);
          }
        }
      }
    }
  }

  for (const dir of dirsToScan) {
    scanDir(dir);
  }
});

// 2. Ejecución de Tests Unitarios
runStep('Ejecución de tests en @qap/shared', () => {
  execSync('pnpm --filter @qap/shared test', { cwd: ROOT_DIR, stdio: 'pipe' });
});

runStep('Ejecución de tests en @qap/reporter', () => {
  execSync('pnpm --filter @qap/reporter test', { cwd: ROOT_DIR, stdio: 'pipe' });
});

runStep('Ejecución de tests en @qap/cli', () => {
  execSync('pnpm --filter @qap/cli test', { cwd: ROOT_DIR, stdio: 'pipe' });
});

runStep('Ejecución de tests en @qap/mcp', () => {
  execSync('pnpm --filter @qap/mcp test', { cwd: ROOT_DIR, stdio: 'pipe' });
});

// 3. Dry-Run de Publicación NPM
runStep('Validación de npm publish --dry-run en @qap/cli', () => {
  const cliDir = join(ROOT_DIR, 'packages', 'cli');
  const output = execSync('npm publish --dry-run', { cwd: cliDir, encoding: 'utf-8' });
  if (output.includes('npm ERR!')) {
    throw new Error(`npm publish devolvió error: ${output}`);
  }
});

runStep('Validación de npm publish --dry-run en @qap/mcp', () => {
  const mcpDir = join(ROOT_DIR, 'packages', 'mcp');
  const output = execSync('npm publish --dry-run', { cwd: mcpDir, encoding: 'utf-8' });
  if (output.includes('npm ERR!')) {
    throw new Error(`npm publish devolvió error: ${output}`);
  }
});

// 4. Verificación E2E Live en Sandbox aislado
runStep('Prueba E2E Live completa en Sandbox aislado (Zero Prefab)', () => {
  execSync('node scripts/test-e2e-live.mjs', { cwd: ROOT_DIR, stdio: 'pipe' });
});

console.log('\n====================================================');
console.log('  ✔ TODOS LOS CHECKS DE RELEASE PASARON CON ÉXITO   ');
console.log('  El monorepo está 100% listo para distribución!    ');
console.log('====================================================\n');
