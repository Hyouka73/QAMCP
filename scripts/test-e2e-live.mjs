/**
 * E2E Live Test Script - QA Agent Platform (QAP) v2.1
 * Valida de punta a punta el ciclo de vida desde cero en una carpeta aislada:
 * 1. Inicialización limpia (qap init --config)
 * 2. Validación de árbol .qa/ y esquemas generados
 * 3. Registro de perfil de autenticación (qap auth add)
 * 4. Generación de reporte inicial (qap report)
 * 5. Inventario no destructivo (qap clean --preview)
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const MONOREPO_ROOT = process.cwd();
const CLI_BIN = resolve(MONOREPO_ROOT, 'packages', 'cli', 'dist', 'entrypoint.js');
const FIXTURE_DIR = mkdtempSync(join(tmpdir(), 'qap-live-fixture-'));
const SANDBOX_DIR = join(FIXTURE_DIR, 'project');
process.env.QAP_MCP_WORKSPACE_HOST_DIR = join(FIXTURE_DIR, 'host');

console.log('====================================================');
console.log('  QAP v2.1 - Test E2E Live Sandbox (Zero Prefab)    ');
console.log('====================================================\n');

try {
  // Asegurar binario compilado
  if (!existsSync(CLI_BIN)) {
    throw new Error(`El binario standalone no existe en: ${CLI_BIN}. Ejecuta 'pnpm --filter @qap/cli build' primero.`);
  }

  // 0. Preparar sandbox limpio
  mkdirSync(SANDBOX_DIR, { recursive: true });
  console.log(`[Paso 0] Sandbox creado en: ${SANDBOX_DIR}`);

  // 1. Inicialización limpia con qap init
  const initConfigPath = join(SANDBOX_DIR, 'qap-init.json');
  writeFileSync(
    initConfigPath,
    JSON.stringify({
      _version: '1.0',
      projectName: 'evaluator-live-demo',
      environments: ['local', 'staging'],
    }),
    'utf-8'
  );

  console.log('\n[Paso 1] Ejecutando: qap init --config qap-init.json');
  const initOutput = execSync(`node "${CLI_BIN}" init --config qap-init.json`, {
    cwd: SANDBOX_DIR,
    encoding: 'utf-8',
  });
  console.log(initOutput.trim());

  // 2. Verificar estructura .qa/ y schemas
  const qaDir = join(SANDBOX_DIR, '.qa');
  if (!existsSync(qaDir)) {
    throw new Error('FALLO: El directorio .qa/ no fue creado.');
  }

  const expectedPaths = [
    join(qaDir, 'project', 'environments.yaml'),
    join(qaDir, 'project', 'context.yaml'),
    join(qaDir, '.gitignore'),
    join(qaDir, 'modules'),
    join(qaDir, 'cache'),
    join(qaDir, 'executions'),
  ];

  for (const p of expectedPaths) {
    if (!existsSync(p)) {
      throw new Error(`FALLO: Estructura incompleta. Falta: ${p}`);
    }
  }
  console.log('✔ Verificación de estructura .qa/ superada (todos los subdirectorios y configs presentes).');

  // 3. Configurar perfil auth de prueba
  console.log('\n[Paso 3] Ejecutando: qap auth add evaluator-profile');
  const authAddOutput = execSync(`node "${CLI_BIN}" auth add evaluator-profile`, {
    cwd: SANDBOX_DIR,
    encoding: 'utf-8',
  });
  console.log(authAddOutput.trim());

  const profilesPath = join(qaDir, 'project', 'auth', 'profiles.json');
  if (!existsSync(profilesPath)) {
    throw new Error('FALLO: No se creó .qa/project/auth/profiles.json.');
  }
  const profilesData = JSON.parse(readFileSync(profilesPath, 'utf-8'));
  const profileFound = profilesData.profiles?.some((p) => p.id === 'evaluator-profile');
  if (!profileFound) {
    throw new Error("FALLO: El perfil 'evaluator-profile' no se encuentra en profiles.json.");
  }
  console.log("✔ Perfil 'evaluator-profile' verificado en .qa/project/auth/profiles.json.");

  // Listar perfiles auth
  const authListOutput = execSync(`node "${CLI_BIN}" auth list`, {
    cwd: SANDBOX_DIR,
    encoding: 'utf-8',
  });
  console.log(authListOutput.trim());

  // Validar status
  console.log('\n[Paso 3.1] Verificando: qap status');
  const statusOutput = execSync(`node "${CLI_BIN}" status`, {
    cwd: SANDBOX_DIR,
    encoding: 'utf-8',
  });
  console.log(statusOutput.trim());

  // 4. Generar reporte inicial
  console.log('\n[Paso 4] Ejecutando: qap report live-run --format html');
  const reportOutput = execSync(`node "${CLI_BIN}" report live-run --format html`, {
    cwd: SANDBOX_DIR,
    encoding: 'utf-8',
  });
  console.log(reportOutput.trim());

  const expectedReport = join(qaDir, 'executions', 'live-run.report.html');
  if (!existsSync(expectedReport)) {
    throw new Error(`FALLO: No se generó el archivo de reporte esperado en: ${expectedReport}`);
  }
  console.log(`✔ Reporte HTML generado correctamente en: ${expectedReport}`);

  // 5. El script automático solo puede ver el inventario.
  console.log('\n[Paso 5] Ejecutando: qap clean --preview');
  const cleanOutput = execSync(`node "${CLI_BIN}" clean --preview`, {
    cwd: SANDBOX_DIR,
    encoding: 'utf-8',
  });
  console.log(cleanOutput.trim());

  if (JSON.parse(cleanOutput).status !== 'preview' || !existsSync(qaDir)) {
    throw new Error('FALLO: no se obtuvo un inventario no destructivo.');
  }

  console.log('\n====================================================');
  console.log('  ✔ PRUEBA E2E EN VIVO COMPLETADA EXITOSAMENTE!     ');
  console.log('====================================================\n');
} catch (error) {
  console.error('\n❌ ERROR EN LA PRUEBA E2E:', error.message);
  process.exitCode = 1;
} finally {
  rmSync(FIXTURE_DIR, { recursive: true, force: true });
}
