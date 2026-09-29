/**
 * E2E Live Test Script - QA Agent Platform (QAP) v2.1
 * Valida de punta a punta el ciclo de vida desde cero en una carpeta aislada:
 * 1. Inicialización limpia (qap init --config)
 * 2. Validación de árbol .qa/ y esquemas generados
 * 3. Registro de perfil de autenticación (qap auth add)
 * 4. Generación de reporte inicial (qap report)
 * 5. Reseteo y limpieza completa (qap clean --force)
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const MONOREPO_ROOT = process.cwd();
const CLI_BIN = resolve(MONOREPO_ROOT, 'packages', 'cli', 'dist', 'entrypoint.js');
const SANDBOX_DIR = resolve(MONOREPO_ROOT, 'test-sandbox');

console.log('====================================================');
console.log('  QAP v2.1 - Test E2E Live Sandbox (Zero Prefab)    ');
console.log('====================================================\n');

try {
  // Asegurar binario compilado
  if (!existsSync(CLI_BIN)) {
    throw new Error(`El binario standalone no existe en: ${CLI_BIN}. Ejecuta 'pnpm --filter @qap/cli build' primero.`);
  }

  // 0. Preparar sandbox limpio
  if (existsSync(SANDBOX_DIR)) {
    rmSync(SANDBOX_DIR, { recursive: true, force: true });
  }
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

  // 5. Ejecutar qap clean --force y verificar desaparición completa de .qa/
  console.log('\n[Paso 5] Ejecutando: qap clean --force');
  const cleanOutput = execSync(`node "${CLI_BIN}" clean --force`, {
    cwd: SANDBOX_DIR,
    encoding: 'utf-8',
  });
  console.log(cleanOutput.trim());

  if (existsSync(qaDir)) {
    throw new Error('FALLO: El directorio .qa/ sigue existiendo después de qap clean --force.');
  }
  console.log('✔ Verificación de limpieza superada: .qa/ ha desaparecido completamente sin dejar residuos.');

  // Limpiar sandbox final
  rmSync(SANDBOX_DIR, { recursive: true, force: true });

  console.log('\n====================================================');
  console.log('  ✔ PRUEBA E2E EN VIVO COMPLETADA EXITOSAMENTE!     ');
  console.log('====================================================\n');
} catch (error) {
  console.error('\n❌ ERROR EN LA PRUEBA E2E:', error.message);
  process.exit(1);
}
