/**
 * QAMCP vNext R7 Preflight Automated Test Suite
 *
 * Verifies all 24+ test cases specified in spec.md and CONTRATO_EJECUTOR.md.
 * Uses native Node.js test runner ('node:test') and strict assertions ('node:assert/strict').
 *
 * Execution command:
 *   node --test docs/vnext/implementaciones/VNEXT-014-E01/r7/check-preflight.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import crypto from 'node:crypto';
import os from 'node:os';

import {
  validatePreflightManifest,
  parseCliArgs,
  CANONICAL_DIST_HASHES,
  CANONICAL_TOOLCHAIN,
  NORMATIVE_INTERFERENCE_LIMITS,
  AUTHORIZED_BRANCH,
  ALLOWED_GIT_EXCEPTIONS
} from './check-preflight.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load a fresh clone of manifest-ejemplo.json
function getCanonicalFixture() {
  const fixturePath = path.resolve(__dirname, 'manifest-ejemplo.json');
  const raw = fs.readFileSync(fixturePath, 'utf-8');
  return JSON.parse(raw);
}

// Helper to construct a synthetic continuous 60-sample telemetry window (60s span)
function generateSyntheticTelemetry(count = 60, intervalMs = 1000, startIso = '2026-11-07T17:14:00.000Z') {
  const startTime = Date.parse(startIso);
  const samples = [];

  for (let i = 0; i < count; i++) {
    const sStart = new Date(startTime + i * intervalMs);
    const sFinish = new Date(startTime + i * intervalMs + 150);
    samples.push({
      started_at: sStart.toISOString(),
      finished_at: sFinish.toISOString(),
      cpu_percent: 4.5,
      available_mb: 2500,
      committed_bytes: 31500000000,
      commit_limit_bytes: 49581215744,
      pages_input_per_sec: 10,
      pages_output_per_sec: 0,
      disk_queue: 0,
      groups: [
        {
          category: 'node',
          count: 16,
          cpu_percent_logical_capacity: 0,
          working_set_private_bytes: 25000000,
          page_faults_per_sec: 0
        },
        {
          category: 'chromium',
          count: 22,
          cpu_percent_logical_capacity: 0.5,
          working_set_private_bytes: 1000000000,
          page_faults_per_sec: 1000
        },
        {
          category: 'observer',
          count: 1,
          cpu_percent_logical_capacity: 1.5,
          working_set_private_bytes: 24000000,
          page_faults_per_sec: 500
        },
        {
          category: 'other',
          count: 350,
          cpu_percent_logical_capacity: 2.5,
          working_set_private_bytes: 7500000000,
          page_faults_per_sec: 2500
        }
      ]
    });
  }

  const endTime = new Date(startTime + (count - 1) * intervalMs + 150).toISOString();
  return {
    duration_ms: (count - 1) * intervalMs + 150,
    interval_ms: intervalMs,
    max_gap_ms: 5000,
    start_time: startIso,
    end_time: endTime,
    sample_count: count,
    cpu_stats: { min: 4.5, max: 4.5, mean: 4.5, p95: 4.5 },
    mem_stats: {
      min_available_mb: 2500,
      max_available_mb: 2500,
      mean_available_mb: 2500,
      committed_bytes_mean: 31500000000,
      commit_limit_bytes: 49581215744
    },
    page_faults: {
      max_pages_input_per_sec: 10,
      mean_pages_input_per_sec: 10,
      max_pages_output_per_sec: 0
    },
    samples
  };
}

// Helper to create a genuine temporary evidence doc JSON
function createTempEvidenceDoc(manifest, overrides = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-r7-evidence-'));
  const docPath = path.join(tmpDir, 'evidence-doc.json');
  const payload = {
    executor_id: manifest.executor_id || 'executor-synthetic-fixture-01',
    provenance: manifest.resource_reservation?.provenance || 'cloud_dedicated_host',
    type: manifest.resource_reservation?.type || 'dedicated_vm',
    allocated_cores: manifest.resource_reservation?.allocated_cores || 16,
    allocated_ram_mb: manifest.resource_reservation?.allocated_ram_mb || 16384,
    exclusive_reservation: true,
    provider_metadata: {
      hypervisor: 'Hyper-V-Isolated',
      reservation_id: 'res-20261109-001'
    },
    ...overrides
  };
  fs.writeFileSync(docPath, JSON.stringify(payload, null, 2), 'utf-8');
  return docPath;
}

// Helper to construct a valid auditor decision matching manifest and evidence doc
function getValidAuditorDecision(manifest, docPath, overrides = {}) {
  const bytes = fs.readFileSync(docPath);
  const hash = crypto.createHash('sha256').update(bytes).digest('hex').toLowerCase();
  const commitSha = overrides.approved_commit_sha || manifest.git?.commit_sha || 'c161c0f995a8f9844f2ec09c041354d77a08fea0';

  return {
    decision: 'APPROVED',
    auditor_id: 'codex-reauditor-2026-11-07',
    executor_id: manifest.executor_id || 'executor-synthetic-fixture-01',
    approved_commit_sha: commitSha,
    evidence_doc_sha256: hash,
    allocated_cores: manifest.resource_reservation?.allocated_cores ?? 16,
    allocated_ram_mb: manifest.resource_reservation?.allocated_ram_mb ?? 16384,
    issued_at_utc: '2026-11-07T17:00:00.000Z',
    expires_at_utc: '2026-11-07T18:00:00.000Z',
    ...overrides
  };
}

// Helper to create an accredited executor fixture with valid local evidence doc
function getAccreditedExecutorFixture() {
  const m = getCanonicalFixture();
  m.status = 'EJECUTOR_APTO';
  m.status_reason = 'Ejecutor debidamente acreditado con cuota reservada y telemetria continua';
  m.resource_reservation = {
    provenance: 'cloud_dedicated_host',
    evidence_doc: null,
    type: 'dedicated_vm',
    allocated_cores: 16,
    allocated_ram_mb: 16384,
    swap_policy: 'fixed_managed',
    accredited: true
  };
  const docPath = createTempEvidenceDoc(m);
  m.resource_reservation.evidence_doc = docPath;
  return m;
}

// ============================================================================
// Group 1: Fixtures Positivos y Separación Tripartita de Estados
// ============================================================================
test('TC-01: Validador aprueba fixture sintetico canonico (manifest-ejemplo.json)', () => {
  const manifest = getCanonicalFixture();
  const result = validatePreflightManifest(manifest);

  assert.equal(result.valid, true, 'El manifiesto sintetico debe ser valido');
  assert.equal(result.validador_status, 'VALIDADOR_PASS', 'El validador sintactico debe otorgar VALIDADOR_PASS');
  assert.equal(result.errors.length, 0, 'No debe haber errores');
  assert.equal(result.details.schema_valid, true);
  assert.equal(result.details.git_valid, true);
  assert.equal(result.details.toolchain_valid, true);
  assert.equal(result.details.dist_hashes_valid, true);
  assert.equal(result.details.telemetry_valid, true);
});

test('TC-02: Invariante de No Conversion: VALIDADOR_PASS jamas promueve a EJECUTOR_APTO', () => {
  const manifest = getCanonicalFixture();
  const result = validatePreflightManifest(manifest);

  assert.equal(result.validador_status, 'VALIDADOR_PASS');
  assert.equal(
    result.executor_status,
    'EJECUTOR_NO_APTO',
    'Un fixture sintetico o sin acreditar DEBE conservar executor_status en EJECUTOR_NO_APTO'
  );
  assert.ok(
    result.reasons.some(r => r.includes('RESERVA NO ACREDITADA')),
    'Las razones deben reportar RESERVA NO ACREDITADA'
  );
});

test('TC-03: Aprobacion de ejecutor real con reserva debidamente acreditada', () => {
  const manifest = getAccreditedExecutorFixture();
  const docPath = manifest.resource_reservation.evidence_doc;
  const decision = getValidAuditorDecision(manifest, docPath);
  const result = validatePreflightManifest(manifest, {
    expectedCommitSha: manifest.git.commit_sha,
    auditorDecision: decision
  });

  assert.equal(result.valid, true, 'Debe ser valido');
  assert.equal(result.validador_status, 'VALIDADOR_PASS', 'Debe otorgar VALIDADOR_PASS');
  assert.equal(result.executor_status, 'EJECUTOR_APTO', 'Debe otorgar EJECUTOR_APTO cuando hay acreditacion real');
  assert.equal(result.details.reservation_accredited, true, 'La reserva debe estar acreditada');
  assert.equal(result.errors.length, 0);
});

// ============================================================================
// Group 2: Rechazo por Manifiestos Incompletos y Prohibicion de PASS por Omision
// ============================================================================
test('TC-04: Rechazo por omision de executor_id', () => {
  const manifest = getCanonicalFixture();
  delete manifest.executor_id;

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.validador_status, 'VALIDADOR_FAIL');
  assert.equal(result.details.schema_valid, false);
  assert.ok(result.errors.some(e => e.includes('executor_id')));
});

test('TC-05: Rechazo por omision de bloque git', () => {
  const manifest = getCanonicalFixture();
  delete manifest.git;

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.validador_status, 'VALIDADOR_FAIL');
  assert.ok(result.errors.some(e => e.includes('git')));
});

test('TC-06: Rechazo por omision de bloque dist_hashes', () => {
  const manifest = getCanonicalFixture();
  delete manifest.dist_hashes;

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.validador_status, 'VALIDADOR_FAIL');
  assert.ok(result.errors.some(e => e.includes('dist_hashes')));
});

test('TC-07: Rechazo por omision de bloque resource_reservation', () => {
  const manifest = getCanonicalFixture();
  delete manifest.resource_reservation;

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.validador_status, 'VALIDADOR_FAIL');
  assert.ok(result.errors.some(e => e.includes('resource_reservation')));
});

test('TC-08: Rechazo por omision de bloque telemetry_window', () => {
  const manifest = getCanonicalFixture();
  delete manifest.telemetry_window;

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.validador_status, 'VALIDADOR_FAIL');
  assert.ok(result.errors.some(e => e.includes('telemetry_window')));
});

test('TC-09: Rechazo por paquete faltante en dist_hashes (solo 3 de los 4 requeridos)', () => {
  const manifest = getCanonicalFixture();
  delete manifest.dist_hashes['packages/shared/dist/index.js'];

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.details.dist_hashes_valid, false);
  assert.ok(result.errors.some(e => e.includes('packages/shared/dist/index.js')));
});

test('TC-23: Rechazo total de objeto vacio {} (Prohibicion de PASS por omision)', () => {
  const result = validatePreflightManifest({});

  assert.equal(result.valid, false, 'Objeto vacio debe ser invalido');
  assert.equal(result.validador_status, 'VALIDADOR_FAIL');
  assert.equal(result.executor_status, 'EJECUTOR_NO_APTO');
  assert.equal(result.details.schema_valid, false);
  assert.ok(result.errors.length >= 10, 'Debe registrar todos los campos faltantes');
});

test('TC-24: Manejo seguro y rechazo de null, undefined y valores primitivos', () => {
  const nullResult = validatePreflightManifest(null);
  assert.equal(nullResult.valid, false);
  assert.equal(nullResult.validador_status, 'VALIDADOR_FAIL');
  assert.equal(nullResult.executor_status, 'EJECUTOR_NO_APTO');

  const undefResult = validatePreflightManifest(undefined);
  assert.equal(undefResult.valid, false);

  const stringResult = validatePreflightManifest('not-an-object');
  assert.equal(stringResult.valid, false);

  const numberResult = validatePreflightManifest(12345);
  assert.equal(numberResult.valid, false);

  const arrayResult = validatePreflightManifest([]);
  assert.equal(arrayResult.valid, false);
});

test('TC-30: Rechazo por omision de schema_version, status_reason, os_info o predeclared_interference_limits', () => {
  const m1 = getCanonicalFixture();
  delete m1.schema_version;
  assert.equal(validatePreflightManifest(m1).valid, false);

  const m2 = getCanonicalFixture();
  delete m2.status_reason;
  assert.equal(validatePreflightManifest(m2).valid, false);

  const m3 = getCanonicalFixture();
  delete m3.os_info;
  assert.equal(validatePreflightManifest(m3).valid, false);

  const m4 = getCanonicalFixture();
  delete m4.predeclared_interference_limits;
  assert.equal(validatePreflightManifest(m4).valid, false);
});

// ============================================================================
// Group 3: Integridad de Git y Control de Versiones
// ============================================================================
test('TC-10: Rechazo por SHA truncado (7 hex en vez de 40)', () => {
  const manifest = getCanonicalFixture();
  manifest.git.commit_sha = 'c161c0f'; // Truncated 7-char hash

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.details.git_valid, false);
  assert.ok(result.errors.some(e => e.includes('commit_sha') && e.includes('40')));
});

test('TC-11: Rechazo por SHA no coincidente con el esperado en opciones', () => {
  const manifest = getCanonicalFixture();
  const expectedSha = '8dc020e000000000000000000000000000000000';

  const result = validatePreflightManifest(manifest, { expectedCommitSha: expectedSha });
  assert.equal(result.valid, false);
  assert.equal(result.details.git_valid, false);
  assert.ok(result.errors.some(e => e.includes('commit_sha') && e.includes('does not match')));
});

test('TC-12: Rechazo por rama distinta a la autorizada (feat/qap-vnext-architecture)', () => {
  const manifest = getCanonicalFixture();
  manifest.git.branch_name = 'main';

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.details.git_valid, false);
  assert.ok(result.errors.some(e => e.includes('Unauthorized git branch')));
});

test('TC-13: Rechazo por arbol sucio con archivos de codigo no autorizados', () => {
  const manifest = getCanonicalFixture();
  manifest.git.clean_working_tree = false;
  manifest.git.dirty_files = ['packages/mcp/src/server.ts'];

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.details.git_valid, false);
  assert.ok(result.errors.some(e => e.includes('Working tree is dirty')));
});

test('TC-25: Aceptacion de excepcion autorizada de arbol sucio (admin-user.json)', () => {
  const manifest = getCanonicalFixture();
  manifest.git.clean_working_tree = false;
  manifest.git.dirty_files = [
    'packages/playwright-runner/.qa/cache/sessions/admin-user.json'
  ];

  const result = validatePreflightManifest(manifest);
  assert.equal(result.details.git_valid, true, 'El archivo en whitelist no debe descalificar git');
  assert.equal(result.valid, true);
});

// ============================================================================
// Group 4: Hashes de Distribucion y Toolchain
// ============================================================================
test('TC-26: Rechazo por discrepancia de dist_hashes frente a linea base', () => {
  const manifest = getCanonicalFixture();
  manifest.dist_hashes['packages/mcp/dist/server.js'] = '0000000000000000000000000000000000000000000000000000000000000000';

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.details.dist_hashes_valid, false);
  assert.ok(result.errors.some(e => e.includes('Hash mismatch')));
});

test('TC-27: Normalizacion case-insensitive de dist_hashes (mayusculas vs minusculas)', () => {
  const manifest = getCanonicalFixture();
  // Lowercase all canonical hashes
  for (const k of Object.keys(manifest.dist_hashes)) {
    manifest.dist_hashes[k] = manifest.dist_hashes[k].toLowerCase();
  }

  const result = validatePreflightManifest(manifest);
  assert.equal(result.details.dist_hashes_valid, true, 'La comparacion de hashes debe ser case-insensitive');
  assert.equal(result.valid, true);
});

test('TC-28: Rechazo por dist hash corrupto (longitud != 64 o caracteres no hex)', () => {
  const manifest = getCanonicalFixture();
  manifest.dist_hashes['packages/mcp/dist/server.js'] = '3457541827D1F601591BD090CD8A929440B310ED223CFDDCE37BCEF0CA68AA'; // 62 chars

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.details.dist_hashes_valid, false);
  assert.ok(result.errors.some(e => e.includes('SHA-256 hash format')));
});

test('TC-31: Rechazo por version no conforme de Node.js o pnpm', () => {
  const mNode = getCanonicalFixture();
  mNode.toolchain.node_version = 'v20.18.0';
  const rNode = validatePreflightManifest(mNode);
  assert.equal(rNode.valid, false);
  assert.equal(rNode.details.toolchain_valid, false);

  const mPnpm = getCanonicalFixture();
  mPnpm.toolchain.pnpm_version = '9.15.0';
  const rPnpm = validatePreflightManifest(mPnpm);
  assert.equal(rPnpm.valid, false);
  assert.equal(rPnpm.details.toolchain_valid, false);
});

test('TC-32: Rechazo por chromium_version vacia o ausente', () => {
  const manifest = getCanonicalFixture();
  manifest.toolchain.chromium_version = '';

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.details.toolchain_valid, false);
});

// ============================================================================
// Group 5: Acreditacion de Reserva y Falacia de CPU Ociosa
// ============================================================================
test('TC-14: Rechazo de idoneidad ante accredited: false', () => {
  const manifest = getCanonicalFixture();
  manifest.resource_reservation.accredited = false;

  const result = validatePreflightManifest(manifest);
  assert.equal(result.executor_status, 'EJECUTOR_NO_APTO');
  assert.equal(result.details.reservation_accredited, false);
});

test('TC-15: Rechazo si accredited: true pero evidence_doc es nulo o vacio', () => {
  const manifest = getAccreditedExecutorFixture();
  manifest.resource_reservation.evidence_doc = null;

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.details.reservation_accredited, false);
  assert.equal(result.executor_status, 'EJECUTOR_NO_APTO');
  assert.ok(result.errors.some(e => e.includes('evidence_doc')));

  manifest.resource_reservation.evidence_doc = '   ';
  const resultEmpty = validatePreflightManifest(manifest);
  assert.equal(resultEmpty.valid, false);
  assert.equal(resultEmpty.details.reservation_accredited, false);
});

test('TC-16: Rechazo estricto de la Falacia de CPU Ociosa: CPU baja y RAM libre no otorgan aptitud', () => {
  const manifest = getCanonicalFixture();
  manifest.resource_reservation.accredited = false;
  manifest.resource_reservation.evidence_doc = null;

  // Make telemetry look overwhelmingly idle with mathematically consistent samples and stats
  manifest.telemetry_window.cpu_stats = { min: 0.2, max: 0.2, mean: 0.2, p95: 0.2 };
  manifest.telemetry_window.mem_stats.min_available_mb = 13500;
  manifest.telemetry_window.mem_stats.max_available_mb = 13500;
  manifest.telemetry_window.mem_stats.mean_available_mb = 13500;

  for (const s of manifest.telemetry_window.samples) {
    s.cpu_percent = 0.2;
    s.available_mb = 13500;
    for (const g of s.groups) {
      if (g.category === 'other') g.cpu_percent_logical_capacity = 0.2;
      else g.cpu_percent_logical_capacity = 0.0;
    }
  }

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, true, 'Sintacticamente el fixture puede ser valido');
  assert.equal(result.validador_status, 'VALIDADOR_PASS');
  assert.equal(
    result.executor_status,
    'EJECUTOR_NO_APTO',
    'La CPU ociosa JAMAS confiere EJECUTOR_APTO sin documento formal de reserva'
  );
  assert.ok(result.reasons.some(r => r.includes('RESERVA NO ACREDITADA')));
});

test('TC-33: Rechazo si accredited: true pero provenance es synthetic o unaccredited', () => {
  const manifest = getAccreditedExecutorFixture();
  manifest.resource_reservation.provenance = 'synthetic';

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.details.reservation_accredited, false);
  assert.equal(result.executor_status, 'EJECUTOR_NO_APTO');
  assert.ok(result.errors.some(e => e.includes('provenance')));
});

// ============================================================================
// Group 6: Telemetria, Continuidad Temporal y Calidad de Muestreo
// ============================================================================
test('TC-17: Rechazo por duracion de ventana menor a 60 segundos', () => {
  const manifest = getCanonicalFixture();
  manifest.telemetry_window = generateSyntheticTelemetry(40, 1000); // 40 seconds duration

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.details.telemetry_valid, false);
  assert.ok(result.errors.some(e => e.includes('less than required')));
});

test('TC-18: Rechazo por salto (gap) excesivo entre muestras (> 5000ms)', () => {
  const manifest = getCanonicalFixture();
  const tel = generateSyntheticTelemetry(60, 1000);

  // Inject a 12-second hiatus between sample 30 and 31
  const t30Finish = Date.parse(tel.samples[29].finished_at);
  const t31Start = new Date(t30Finish + 12000);
  const t31Finish = new Date(t30Finish + 12150);
  tel.samples[30].started_at = t31Start.toISOString();
  tel.samples[30].finished_at = t31Finish.toISOString();

  manifest.telemetry_window = tel;

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.details.telemetry_valid, false);
  assert.ok(result.errors.some(e => e.includes('Sampling gap')));
});

test('TC-19: Rechazo por consulta lenta de muestreo (> 5000ms query duration)', () => {
  const manifest = getCanonicalFixture();
  const tel = generateSyntheticTelemetry(60, 1000);

  // Make sample 15 query take 6200ms
  const sStart = Date.parse(tel.samples[15].started_at);
  tel.samples[15].finished_at = new Date(sStart + 6200).toISOString();

  manifest.telemetry_window = tel;

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.details.telemetry_valid, false);
  assert.ok(result.errors.some(e => e.includes('Degraded query duration')));
});

test('TC-20: Rechazo por marcas temporales corruptas (started_at > finished_at)', () => {
  const manifest = getCanonicalFixture();
  const tel = generateSyntheticTelemetry(60, 1000);

  // Reverse timestamps on sample 5
  const sStart = tel.samples[5].started_at;
  const sFinish = tel.samples[5].finished_at;
  tel.samples[5].started_at = sFinish;
  tel.samples[5].finished_at = sStart;

  manifest.telemetry_window = tel;

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.details.telemetry_valid, false);
  assert.ok(result.errors.some(e => e.includes('Corrupted timestamps')));
});

test('TC-22: Rechazo por discrepancia en conteo de muestras (sample_count vs samples.length)', () => {
  const manifest = getCanonicalFixture();
  manifest.telemetry_window.sample_count = 60;
  manifest.telemetry_window.samples = manifest.telemetry_window.samples.slice(0, 15);

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.details.telemetry_valid, false);
  assert.ok(result.errors.some(e => e.includes('sample_count mismatch')));
});

test('TC-34: Rechazo por inversion cronologica entre muestras consecutivas', () => {
  const manifest = getCanonicalFixture();
  const tel = generateSyntheticTelemetry(60, 1000);

  // Force sample 20 to have an earlier timestamp than sample 19
  const prevStart = Date.parse(tel.samples[18].started_at);
  tel.samples[19].started_at = new Date(prevStart - 5000).toISOString();
  tel.samples[19].finished_at = new Date(prevStart - 4800).toISOString();

  manifest.telemetry_window = tel;

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.details.telemetry_valid, false);
  assert.ok(result.errors.some(e => e.includes('Chronological inversion')));
});

// ============================================================================
// Group 7: Deteccion de Contradicciones Contractuales
// ============================================================================
test('TC-21: Rechazo por contradiccion fatal: declara EJECUTOR_APTO con accredited: false', () => {
  const manifest = getCanonicalFixture();
  manifest.status = 'EJECUTOR_APTO'; // Fraudulent / contradictory claim
  manifest.resource_reservation.accredited = false;

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false, 'Contradiccion debe marcarse como invalida');
  assert.equal(result.validador_status, 'VALIDADOR_FAIL');
  assert.equal(result.executor_status, 'EJECUTOR_NO_APTO');
  assert.ok(result.errors.some(e => e.includes('Contradiction') && e.includes('EJECUTOR_APTO')));
});

test('TC-29: Rechazo por contradiccion fatal: declara EJECUTOR_APTO con procedencia sintetica', () => {
  const manifest = getCanonicalFixture();
  manifest.status = 'EJECUTOR_APTO';
  manifest.resource_reservation.accredited = true;
  manifest.resource_reservation.evidence_doc = 'fake-doc.pdf';
  manifest.resource_reservation.provenance = 'synthetic';
  manifest.resource_reservation.type = 'synthetic_fixture';

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.executor_status, 'EJECUTOR_NO_APTO');
  assert.ok(result.errors.some(e => e.includes('Contradiction') || e.includes('provenance')));
});

test('TC-35: Rechazo por contradiccion fatal: declara EJECUTOR_APTO con telemetria invalida', () => {
  const manifest = getAccreditedExecutorFixture();
  manifest.telemetry_window.duration_ms = 30000; // 30s instead of 60s

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.executor_status, 'EJECUTOR_NO_APTO');
  assert.ok(result.errors.some(e => e.includes('Contradiction') || e.includes('duration')));
});

// ============================================================================
// Group 8: Regresiones Post-Auditoría Codex (VNEXT-014-E01 / R7-A01..R7-A07)
// ============================================================================

// --- R7-A01: Acreditación de Reserva y Verificación Documental ---
test('TC-R7-A01-REPRO: Rechazo estructurado de autodeclaracion con ruta de evidencia inexistente', () => {
  const manifest = getCanonicalFixture();
  Object.assign(manifest.resource_reservation, {
    accredited: true,
    provenance: 'cloud_dedicated_host',
    type: 'dedicated_host',
    evidence_doc: 'file:///NO-EXISTE/recibo.json'
  });

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false, 'Ruta de archivo inexistente DEBE fallar validacion');
  assert.equal(result.validador_status, 'VALIDADOR_FAIL');
  assert.equal(result.executor_status, 'EJECUTOR_NO_APTO');
  assert.equal(result.details.reservation_accredited, false);
  assert.ok(result.errors.some(e => e.includes('Evidence document does not exist') && e.includes('recibo.json')));
});

test('TC-R7-A01-NO-SELF-CERT: Manifest no puede autocertificarse sin compuerta de auditoria externa', () => {
  const manifest = getAccreditedExecutorFixture();
  manifest.status = 'VALIDADOR_PASS';
  const result = validatePreflightManifest(manifest);

  assert.equal(result.valid, true, 'Sintacticamente valido');
  assert.equal(result.validador_status, 'VALIDADOR_PASS');
  assert.equal(result.executor_status, 'EJECUTOR_NO_APTO', 'Sin auditorApproval, jamas emite EJECUTOR_APTO');
  assert.equal(result.details.reservation_accredited, false);
  assert.ok(result.reasons.some(r => r.includes('RESERVA NO ACREDITADA')));
});

test('TC-R7-A01-FRAUD-APTO: Rechazo por contradiccion si declara status EJECUTOR_APTO sin auditorApproval', () => {
  const manifest = getAccreditedExecutorFixture();
  manifest.status = 'EJECUTOR_APTO';
  const result = validatePreflightManifest(manifest);

  assert.equal(result.valid, false, 'Autodeclarar EJECUTOR_APTO sin auditorApproval es fraude contractual');
  assert.equal(result.validador_status, 'VALIDADOR_FAIL');
  assert.equal(result.executor_status, 'EJECUTOR_NO_APTO');
  assert.ok(result.errors.some(e => e.includes('Contradiction') && e.includes('EJECUTOR_APTO')));
});

test('TC-R7-A01-LOCAL-DOC-VERIFIED: Acepta archivo documental local existente y no vacio con auditorApproval y auditorDecision', () => {
  const manifest = getAccreditedExecutorFixture();
  const docPath = manifest.resource_reservation.evidence_doc;
  const decision = getValidAuditorDecision(manifest, docPath);

  const result = validatePreflightManifest(manifest, {
    expectedCommitSha: manifest.git.commit_sha,
    auditorDecision: decision
  });
  assert.equal(result.valid, true);
  assert.equal(result.validador_status, 'VALIDADOR_PASS');
  assert.equal(result.executor_status, 'EJECUTOR_APTO');
  assert.equal(result.details.reservation_accredited, true);
});

// --- R7-A02: PASS por Omisión en Telemetría y Esquema ---
test('TC-R7-A02-REPRO-EMPTY: Rechazo estructurado de arreglo samples vacio y duration_ms reiniciado', () => {
  const manifest = getCanonicalFixture();
  manifest.telemetry_window.samples = [];
  manifest.telemetry_window.sample_count = 0;

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false, 'Samples vacio debe ser rechazado');
  assert.equal(result.validador_status, 'VALIDADOR_FAIL');
  assert.equal(result.details.telemetry_valid, false);
  assert.equal(result.details.telemetry_duration_ms, 0, 'La duracion no debe heredarse del campo declarado');
  assert.ok(result.errors.some(e => e.includes('at least 30 samples')));
});

test('TC-R7-A02-REPRO-NO-METRICS: Rechazo de muestras reducidas solo a timestamps sin metricas ni grupos', () => {
  const manifest = getCanonicalFixture();
  manifest.telemetry_window.samples = manifest.telemetry_window.samples.map(({ started_at, finished_at }) => ({
    started_at,
    finished_at
  }));

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false, 'Muestras sin metricas deben ser rechazadas');
  assert.equal(result.validador_status, 'VALIDADOR_FAIL');
  assert.equal(result.details.telemetry_valid, false);
  assert.ok(result.errors.some(e => e.includes('missing required metric field')));
});

test('TC-R7-A02-NULL-SAMPLE: Manejo seguro y estructurado de muestra null sin lanzar TypeError', () => {
  const manifest = getCanonicalFixture();
  manifest.telemetry_window.samples[0] = null;

  assert.doesNotThrow(() => {
    const result = validatePreflightManifest(manifest);
    assert.equal(result.valid, false);
    assert.equal(result.validador_status, 'VALIDADOR_FAIL');
    assert.ok(result.errors.some(e => e.includes('null, undefined, or not a valid object')));
  }, 'No debe arrojar TypeError');
});

test('TC-R7-A02-MIN-SAMPLES: Rechazo si ventana tiene menos de 30 muestras (e.g. 29)', () => {
  const manifest = getCanonicalFixture();
  manifest.telemetry_window.samples = manifest.telemetry_window.samples.slice(0, 29);
  manifest.telemetry_window.sample_count = 29;

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('at least 30 samples')));
});

test('TC-R7-A02-INCOMPLETE-GROUPS: Rechazo de muestra con menos de 4 grupos de procesos', () => {
  const manifest = getCanonicalFixture();
  manifest.telemetry_window.samples[0].groups = manifest.telemetry_window.samples[0].groups.slice(0, 3);

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('must contain exactly 4 process groups')));
});

test('TC-R7-A02-OVERLAPPING-SAMPLES: Rechazo de traslape cronologico entre muestras consecutivas', () => {
  const manifest = getCanonicalFixture();
  const s1Finish = Date.parse(manifest.telemetry_window.samples[1].finished_at);
  manifest.telemetry_window.samples[2].started_at = new Date(s1Finish - 200).toISOString();

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('Sample overlap')));
});

test('TC-R7-A02-FUTURE-TIMESTAMPS: Rechazo de muestras con timestamp en el futuro', () => {
  const manifest = getCanonicalFixture();
  const futureDate = new Date(Date.now() + 3600000).toISOString();
  manifest.telemetry_window.samples[5].finished_at = futureDate;

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('timestamp in the future')));
});

// --- R7-A03: Presupuestos de Interferencia ---
test('TC-R7-A03-REPRO-SATURATED: Rechazo determinista por host saturado (CPU 100%, RAM 1MB, cola 173, paginacion)', () => {
  const manifest = getCanonicalFixture();
  for (const s of manifest.telemetry_window.samples) {
    s.cpu_percent = 100;
    s.available_mb = 1;
    s.disk_queue = 173;
    s.pages_input_per_sec = 275938;
    for (const g of s.groups) {
      g.cpu_percent_logical_capacity = 25;
    }
  }

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false, 'Host saturado DEBE ser rechazado');
  assert.equal(result.validador_status, 'VALIDADOR_FAIL');
  assert.equal(result.details.telemetry_valid, false);
  assert.ok(result.errors.some(e => e.includes('disk_queue limit')));
  assert.ok(result.errors.some(e => e.includes('pages_input_per_sec limit')));
  assert.ok(result.errors.some(e => e.includes('available_ram_mb limit')));
  assert.ok(result.errors.some(e => e.includes('max_external_cpu_percent limit')));
});

test('TC-R7-A03-DISK-QUEUE-SPIKE: Rechazo por pico aislado en cola de disco (> 2.0)', () => {
  const manifest = getCanonicalFixture();
  manifest.telemetry_window.samples[10].disk_queue = 3.5;

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('Sample 10 violates disk_queue limit')));
});

test('TC-R7-A03-RAM-DEPLETED: Rechazo por memoria RAM disponible por debajo del minimo normativo (< 2048 MB)', () => {
  const manifest = getCanonicalFixture();
  manifest.telemetry_window.samples[5].available_mb = 1500;
  manifest.telemetry_window.mem_stats.min_available_mb = 1500;

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('available_ram_mb limit')));
  assert.ok(result.errors.some(e => e.includes('mem_stats.min_available_mb')));
});

test('TC-R7-A03-PAGING-SPIKE: Rechazo por tasa de paginacion de disco superior al limite (> 500 pags/seg)', () => {
  const manifest = getCanonicalFixture();
  manifest.telemetry_window.samples[8].pages_input_per_sec = 850;
  manifest.telemetry_window.page_faults.max_pages_input_per_sec = 850;

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('pages_input_per_sec limit')));
  assert.ok(result.errors.some(e => e.includes('page_faults.max_pages_input_per_sec')));
});

test('TC-R7-A03-EXTERNAL-CPU-SPIKE: Rechazo por consumo excesivo de CPU externa en grupo other (> 10%)', () => {
  const manifest = getCanonicalFixture();
  const otherG = manifest.telemetry_window.samples[12].groups.find(g => g.category === 'other');
  otherG.cpu_percent_logical_capacity = 14.5;

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('max_external_cpu_percent limit')));
});

// --- R7-A04: Prohibición de Sustitución Canónica y Observaciones Faltantes ---
test('TC-R7-A04-NULL-OBSERVATIONS: Rechazo estricto si faltan observaciones requeridas en dist_hashes o toolchain', () => {
  const m1 = getCanonicalFixture();
  m1.dist_hashes['packages/mcp/dist/server.js'] = null;
  assert.equal(validatePreflightManifest(m1).valid, false);

  const m2 = getCanonicalFixture();
  m2.toolchain.node_version = null;
  assert.equal(validatePreflightManifest(m2).valid, false);

  const m3 = getCanonicalFixture();
  m3.git.commit_sha = null;
  assert.equal(validatePreflightManifest(m3).valid, false);
});

test('TC-R7-A04-NULL-SAMPLE-METRIC: Rechazo estructurado si una metrica individual en muestra es null o NaN', () => {
  const manifest = getCanonicalFixture();
  manifest.telemetry_window.samples[0].disk_queue = null;

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes("missing required metric field: 'disk_queue'")));
});

// --- R7-A05: Integridad Git y Opciones CLI ---
test('TC-R7-A05-REPRO-WHITELIST: Rechazo de arbol sucio aun si el manifiesto intenta autoincluirlo en allowed_untracked_or_modified', () => {
  const manifest = getCanonicalFixture();
  Object.assign(manifest.git, {
    clean_working_tree: false,
    dirty_files: ['packages/mcp/src/server.ts'],
    allowed_untracked_or_modified: ['packages/mcp/src/server.ts']
  });

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false, 'El ejecutor NO puede suministrar su propia whitelist');
  assert.equal(result.validador_status, 'VALIDADOR_FAIL');
  assert.equal(result.details.git_valid, false);
  assert.ok(result.errors.some(e => e.includes('Working tree is dirty with unapproved')));
});

test('TC-R7-A05-CLI-PARSER-OPTIONS: parseCliArgs parsea fielmente todas las opciones canónicas', () => {
  const args = [
    '--manifest', 'r7/manifest.json',
    '--expected-sha', 'c161c0f995a8f9844f2ec09c041354d77a08fea0',
    '--expected-branch', 'feat/qap-vnext-architecture',
    '--expected-chromium', '151.0.7922.34',
    '--require-chromium',
    '--min-duration', '65000',
    '--max-gap', '4000',
    '--auditor-approval'
  ];

  const parsed = parseCliArgs(args);
  assert.equal(parsed.manifestPath, 'r7/manifest.json');
  assert.equal(parsed.options.expectedCommitSha, 'c161c0f995a8f9844f2ec09c041354d77a08fea0');
  assert.equal(parsed.options.expectedBranch, 'feat/qap-vnext-architecture');
  assert.equal(parsed.options.expectedChromiumVersion, '151.0.7922.34');
  assert.equal(parsed.options.requireChromium, true);
  assert.equal(parsed.options.minDurationMs, 65000);
  assert.equal(parsed.options.maxGapMs, 4000);
  assert.equal(parsed.options.auditorApproval, true);
  assert.equal(parsed.unknownOptions.length, 0);
});

test('TC-R7-A05-CLI-UNKNOWN-FLAG: parseCliArgs detecta banderas desconocidas', () => {
  const parsed = parseCliArgs(['--unknown-flag', '--foo=bar']);
  assert.equal(parsed.unknownOptions.length, 2);
  assert.ok(parsed.unknownOptions.includes('--unknown-flag'));
  assert.ok(parsed.unknownOptions.includes('--foo=bar'));
});

test('TC-R7-A05-CLI-EXEC-SHA-MISMATCH: CLI invocado con SHA discrepante sale con codigo de error 1', () => {
  const scriptPath = path.resolve(__dirname, 'check-preflight.mjs');
  const manifestPath = path.resolve(__dirname, 'manifest-ejemplo.json');

  const res = spawnSync(process.execPath, [
    scriptPath,
    manifestPath,
    '--expected-sha', '0000000000000000000000000000000000000000'
  ], { encoding: 'utf-8' });

  assert.equal(res.status, 1, 'Debe salir con codigo 1');
  assert.ok(res.stdout.includes('VALIDADOR_FAIL') || res.stdout.includes('does not match expected'));
});

test('TC-R7-A05-CLI-EXEC-UNKNOWN-FLAG: CLI invocado con opcion desconocida sale con codigo de error 1', () => {
  const scriptPath = path.resolve(__dirname, 'check-preflight.mjs');
  const manifestPath = path.resolve(__dirname, 'manifest-ejemplo.json');

  const res = spawnSync(process.execPath, [
    scriptPath,
    manifestPath,
    '--opcion-inexistente'
  ], { encoding: 'utf-8' });

  assert.equal(res.status, 1, 'Debe salir con codigo 1');
  assert.ok(res.stderr.includes('Unknown CLI option'));
});

// --- R7-A06: Coherencia de Toolchain ---
test('TC-R7-A06-REPRO-TOOLCHAIN: Rechazo de versiones divergentes de Node (v24.0.1), pnpm (12.0.1) y Chromium (0.0.0.0)', () => {
  const manifest = getCanonicalFixture();
  Object.assign(manifest.toolchain, {
    node_version: 'v24.0.1',
    pnpm_version: '12.0.1',
    chromium_version: '0.0.0.0'
  });

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false, 'Versiones divergentes DEBEN ser rechazadas');
  assert.equal(result.validador_status, 'VALIDADOR_FAIL');
  assert.equal(result.details.toolchain_valid, false);
  assert.ok(result.errors.some(e => e.includes('v24.0.1')));
  assert.ok(result.errors.some(e => e.includes('12.0.1')));
  assert.ok(result.errors.some(e => e.includes('0.0.0.0')));
});

test('TC-R7-A06-CHROMIUM-BASELINE: Comprobacion obligatoria por defecto de Chromium frente a linea base canónica', () => {
  const manifest = getCanonicalFixture();
  manifest.toolchain.chromium_version = '150.0.0.0';

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.details.toolchain_valid, false);
  assert.ok(result.errors.some(e => e.includes('150.0.0.0') && e.includes('151.0.7922.34')));
});

// --- R7-A07: Confinamiento de Rutas y Fallo Conservador ---
test('TC-R7-A07-PATH-CONFINEMENT-EVIDENCE: Rechazo conservador de rutas con traversal o archivos ilegibles', () => {
  const manifest = getCanonicalFixture();
  manifest.resource_reservation.accredited = true;
  manifest.resource_reservation.evidence_doc = '../../../../Windows/System32/drivers/etc/hosts_ficticio.json';

  const result = validatePreflightManifest(manifest);
  assert.equal(result.valid, false);
  assert.equal(result.details.reservation_accredited, false);
  assert.ok(result.errors.some(e => e.includes('Evidence document does not exist') || e.includes('inaccessible')));
});

test('TC-R7-FAIL-CLOSED-INVARIANT: Principio Fail-Closed: VALIDADOR_PASS nunca equivale a EJECUTOR_APTO', () => {
  const manifest = getCanonicalFixture();
  const result = validatePreflightManifest(manifest);

  assert.equal(result.valid, true);
  assert.equal(result.validador_status, 'VALIDADOR_PASS');
  assert.equal(result.executor_status, 'EJECUTOR_NO_APTO', 'Fail-closed: fixture conforme sin acreditacion externa permanece en NO APTO');
  assert.notEqual(result.validador_status, result.executor_status);
  assert.ok(result.reasons.some(r => r.includes('PREPARADO / RESERVA NO ACREDITADA')));
});

// ============================================================================
// Group 9: Cierre Definitivo de Brechas Codex (R7-R01 a R7-R06 / REAUDITORIA_CODEX_2026-11-07)
// ============================================================================

// --- Reproducción de Casos del Snippet Codex ---
test('TC-R7-R02-REPRO-AGGREGATES: Rechazo estricto si agregados cpu_stats, mem_stats o page_faults estan vacios', () => {
  const m = getCanonicalFixture();
  m.telemetry_window.cpu_stats = {};
  m.telemetry_window.mem_stats = {};
  m.telemetry_window.page_faults = {};

  const r = validatePreflightManifest(m);
  assert.equal(r.valid, false);
  assert.equal(r.validador_status, 'VALIDADOR_FAIL');
  assert.equal(r.executor_status, 'EJECUTOR_NO_APTO');
  assert.ok(r.errors.some(e => e.includes('cpu_stats')));
  assert.ok(r.errors.some(e => e.includes('mem_stats')));
  assert.ok(r.errors.some(e => e.includes('page_faults')));
});

test('TC-R7-R02-REPRO-METADATA: Rechazo estricto de metadatos invalidos (sample_count no entero, interval negativo, fechas invalidas)', () => {
  const m = getCanonicalFixture();
  Object.assign(m.telemetry_window, {
    sample_count: 'sesenta',
    interval_ms: -1,
    start_time: 'INVALID',
    end_time: 'INVALID',
    duration_ms: 999999
  });

  const r = validatePreflightManifest(m);
  assert.equal(r.valid, false);
  assert.equal(r.validador_status, 'VALIDADOR_FAIL');
  assert.ok(r.errors.some(e => e.includes('sample_count')));
  assert.ok(r.errors.some(e => e.includes('interval_ms')));
  assert.ok(r.errors.some(e => e.includes('ISO-8601') || e.includes('timestamp')));
});

test('TC-R7-R02-REPRO-RANGES: Rechazo estricto de metricas fuera de rango (cpu_percent > 100, group.count no entero)', () => {
  const m = getCanonicalFixture();
  for (const s of m.telemetry_window.samples) {
    s.cpu_percent = 999;
    s.groups[0].count = 0.5;
  }

  const r = validatePreflightManifest(m);
  assert.equal(r.valid, false);
  assert.equal(r.validador_status, 'VALIDADOR_FAIL');
  assert.ok(r.errors.some(e => e.includes('cpu_percent')));
  assert.ok(r.errors.some(e => e.includes('count')));
});

test('TC-R7-R02-REPRO-ADDITIONAL: Rechazo Draft-07 estricto ante propiedades adicionales y swap_policy null', () => {
  const m = getCanonicalFixture();
  m.unapproved = true;
  m.resource_reservation.swap_policy = null;

  const r = validatePreflightManifest(m);
  assert.equal(r.valid, false);
  assert.equal(r.validador_status, 'VALIDADOR_FAIL');
  assert.ok(r.errors.some(e => e.includes('Additional property not allowed') && e.includes('unapproved')));
  assert.ok(r.errors.some(e => e.includes('swap_policy')));
});

test('TC-R7-R05-REPRO-GIT-CONTRADICTION: Rechazo determinista si clean_working_tree es true pero hay dirty_files', () => {
  const m = getCanonicalFixture();
  m.git.clean_working_tree = true;
  m.git.dirty_files = ['packages/mcp/src/server.ts'];

  const r = validatePreflightManifest(m);
  assert.equal(r.valid, false);
  assert.equal(r.validador_status, 'VALIDADOR_FAIL');
  assert.ok(r.errors.some(e => e.includes('Contradiction') && e.includes('clean_working_tree')));
});

test('TC-R7-R03-REPRO-EXTERNAL-NODE: Toda la CPU node/chromium/other se imputa como externa en baseline preflight', () => {
  const m = getCanonicalFixture();
  for (const s of m.telemetry_window.samples) {
    s.cpu_percent = 90;
    s.groups.find(g => g.category === 'node').cpu_percent_logical_capacity = 90;
    s.groups.find(g => g.category === 'other').cpu_percent_logical_capacity = 0;
  }
  m.telemetry_window.cpu_stats = { min: 90, max: 90, mean: 90, p95: 90 };

  const r = validatePreflightManifest(m);
  assert.equal(r.valid, false);
  assert.equal(r.validador_status, 'VALIDADOR_FAIL');
  assert.ok(r.errors.some(e => e.includes('external CPU') || e.includes('budget')));
});

test('TC-R7-R01-REPRO-UNVERIFIED-APPROVAL: Rechazo estricto de URLs no verificadas y bandera booleana sin auditorDecision', () => {
  const m = getCanonicalFixture();
  Object.assign(m.resource_reservation, {
    accredited: true,
    provenance: 'cloud_dedicated_host',
    type: 'dedicated_host',
    evidence_doc: 'https://no-evidence.invalid/reserva'
  });

  const r = validatePreflightManifest(m, { auditorApproval: true });
  assert.equal(r.valid, false);
  assert.equal(r.validador_status, 'VALIDADOR_FAIL');
  assert.equal(r.executor_status, 'EJECUTOR_NO_APTO');
  assert.ok(r.errors.some(e => e.includes('remote HTTP/HTTPS URLs') && e.includes('strictly prohibited')));
});

// --- R7-R03 & R7-R02 Consistencia Matemática y Balance ---
test('TC-R7-R03-GROUP-SUM-MISMATCH: Rechazo inmediato si la suma de grupos difiere de sample.cpu_percent en > 0.05%', () => {
  const m = getCanonicalFixture();
  // Alter groups sum in first sample
  m.telemetry_window.samples[0].groups.forEach(g => {
    g.cpu_percent_logical_capacity = 0.25;
  }); // sum = 1.0 vs cpu_percent = 4.5

  const r = validatePreflightManifest(m);
  assert.equal(r.valid, false);
  assert.equal(r.validador_status, 'VALIDADOR_FAIL');
  assert.ok(r.errors.some(e => e.includes('group sum mismatch') || e.includes('groups sum')));
});

test('TC-R7-R02-STATS-MATH-CONSISTENCY-CPU: Rechazo si cpu_stats.mean discrepa de las muestras computadas', () => {
  const m = getCanonicalFixture();
  m.telemetry_window.cpu_stats.mean = 45.0; // sample mean is ~4.5%

  const r = validatePreflightManifest(m);
  assert.equal(r.valid, false);
  assert.equal(r.validador_status, 'VALIDADOR_FAIL');
  assert.ok(r.errors.some(e => e.includes('cpu_stats.mean')));
});

test('TC-R7-R02-STATS-MATH-CONSISTENCY-MEM: Rechazo si mem_stats.min_available_mb discrepa del minimo de muestras', () => {
  const m = getCanonicalFixture();
  m.telemetry_window.mem_stats.min_available_mb = 9999; // sample min is 2500

  const r = validatePreflightManifest(m);
  assert.equal(r.valid, false);
  assert.equal(r.validador_status, 'VALIDADOR_FAIL');
  assert.ok(r.errors.some(e => e.includes('mem_stats.min_available_mb')));
});

// --- R7-R05 Parsing Robusto y Cierre ante CLI Inválido ---
test('TC-R7-R05-CLI-MISSING-EXPECTED-SHA-VALUE: CLI falla con exit code 1 si --expected-sha no tiene argumento', () => {
  const cliPath = path.resolve(__dirname, 'check-preflight.mjs');
  const manifestPath = path.resolve(__dirname, 'manifest-ejemplo.json');
  const res = spawnSync(process.execPath, [cliPath, manifestPath, '--expected-sha'], {
    encoding: 'utf-8'
  });
  assert.equal(res.status, 1);
  assert.ok(res.stderr.includes('--expected-sha') && res.stderr.includes('Missing value'));
});

test('TC-R7-R05-CLI-EMPTY-ARG-VALUE: CLI falla con exit code 1 si un argumento esta vacio (--expected-sha=)', () => {
  const cliPath = path.resolve(__dirname, 'check-preflight.mjs');
  const manifestPath = path.resolve(__dirname, 'manifest-ejemplo.json');
  const res = spawnSync(process.execPath, [cliPath, manifestPath, '--expected-sha='], {
    encoding: 'utf-8'
  });
  assert.equal(res.status, 1);
  assert.ok(res.stderr.includes('--expected-sha') && res.stderr.includes('Empty value'));
});

test('TC-R7-R05-CLI-INVALID-NUMERIC-MAX-GAP: CLI falla con exit code 1 si --max-gap no es un numero valido', () => {
  const cliPath = path.resolve(__dirname, 'check-preflight.mjs');
  const manifestPath = path.resolve(__dirname, 'manifest-ejemplo.json');
  const res = spawnSync(process.execPath, [cliPath, manifestPath, '--max-gap=abc'], {
    encoding: 'utf-8'
  });
  assert.equal(res.status, 1);
  assert.ok(res.stderr.includes('--max-gap') && res.stderr.includes('Invalid numeric value'));
});

test('TC-R7-R05-CLI-INVALID-NUMERIC-MIN-DURATION: CLI falla con exit code 1 si --min-duration es NaN', () => {
  const cliPath = path.resolve(__dirname, 'check-preflight.mjs');
  const manifestPath = path.resolve(__dirname, 'manifest-ejemplo.json');
  const res = spawnSync(process.execPath, [cliPath, manifestPath, '--min-duration=NaN'], {
    encoding: 'utf-8'
  });
  assert.equal(res.status, 1);
  assert.ok(res.stderr.includes('--min-duration') && res.stderr.includes('Invalid numeric value'));
});

// --- R7-R01 Auditor Decision Gate y Acreditación Verificable ---
test('TC-R7-R01-AUDITOR-DECISION-MISSING: Documento local valido sin decision de auditor permanece en EJECUTOR_NO_APTO', () => {
  const manifest = getAccreditedExecutorFixture();
  manifest.status = 'VALIDADOR_PASS';
  const res = validatePreflightManifest(manifest, {
    expectedCommitSha: manifest.git.commit_sha
  });
  assert.equal(res.valid, true);
  assert.equal(res.validador_status, 'VALIDADOR_PASS');
  assert.equal(res.executor_status, 'EJECUTOR_NO_APTO');
  assert.equal(res.details.reservation_accredited, false);
});

test('TC-R7-R01-AUDITOR-DECISION-MISMATCHED-EXECUTOR: Auditor decision con executor_id discrepante es rechazada', () => {
  const manifest = getAccreditedExecutorFixture();
  const decision = getValidAuditorDecision(manifest, manifest.resource_reservation.evidence_doc, {
    executor_id: 'discrepant-executor-999'
  });
  const res = validatePreflightManifest(manifest, {
    expectedCommitSha: manifest.git.commit_sha,
    auditorDecision: decision
  });
  assert.equal(res.executor_status, 'EJECUTOR_NO_APTO');
  assert.equal(res.details.reservation_accredited, false);
  assert.ok(res.errors.some(e => e.includes('executor_id')));
});

test('TC-R7-R01-AUDITOR-DECISION-EXPIRED: Decision expirada antes del final de la ventana de telemetria es rechazada', () => {
  const manifest = getAccreditedExecutorFixture();
  const decision = getValidAuditorDecision(manifest, manifest.resource_reservation.evidence_doc, {
    expires_at_utc: '2026-11-07T17:14:30.000Z' // window ends at 17:15:00
  });
  const res = validatePreflightManifest(manifest, {
    expectedCommitSha: manifest.git.commit_sha,
    auditorDecision: decision
  });
  assert.equal(res.executor_status, 'EJECUTOR_NO_APTO');
  assert.equal(res.details.reservation_accredited, false);
  assert.ok(res.errors.some(e => e.includes('expired before telemetry window end')));
});

test('TC-R7-R01-AUDITOR-DECISION-EVIDENCE-HASH-MISMATCH: Decision con hash SHA256 de evidencia no coincidente es rechazada', () => {
  const manifest = getAccreditedExecutorFixture();
  const decision = getValidAuditorDecision(manifest, manifest.resource_reservation.evidence_doc, {
    evidence_doc_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  });
  const res = validatePreflightManifest(manifest, {
    expectedCommitSha: manifest.git.commit_sha,
    auditorDecision: decision
  });
  assert.equal(res.executor_status, 'EJECUTOR_NO_APTO');
  assert.equal(res.details.reservation_accredited, false);
  assert.ok(res.errors.some(e => e.includes('evidence_doc_sha256')));
});

test('TC-R7-R01-AUDITOR-DECISION-COMMIT-SHA-MISMATCH: Decision con commit SHA no coincidente con el manifiesto es rechazada', () => {
  const manifest = getAccreditedExecutorFixture();
  const decision = getValidAuditorDecision(manifest, manifest.resource_reservation.evidence_doc, {
    approved_commit_sha: '1111111111111111111111111111111111111111'
  });
  const res = validatePreflightManifest(manifest, {
    expectedCommitSha: manifest.git.commit_sha,
    auditorDecision: decision
  });
  assert.equal(res.executor_status, 'EJECUTOR_NO_APTO');
  assert.equal(res.details.reservation_accredited, false);
  assert.ok(res.errors.some(e => e.includes('approved_commit_sha')));
});

test('TC-R7-R01-AUDITOR-DECISION-EXPECTED-SHA-MISSING: Decision rechazada si options.expectedCommitSha no se suministra', () => {
  const manifest = getAccreditedExecutorFixture();
  const decision = getValidAuditorDecision(manifest, manifest.resource_reservation.evidence_doc);
  const res = validatePreflightManifest(manifest, {
    auditorDecision: decision
  });
  assert.equal(res.executor_status, 'EJECUTOR_NO_APTO');
  assert.equal(res.details.reservation_accredited, false);
  assert.ok(res.errors.some(e => e.includes('options.expectedCommitSha') && e.includes('required')));
});

test('TC-R7-R01-AUDITOR-DECISION-VALID-APTO: Decision completa verificada otorga de forma legitima EJECUTOR_APTO', () => {
  const manifest = getAccreditedExecutorFixture();
  const decision = getValidAuditorDecision(manifest, manifest.resource_reservation.evidence_doc);
  const res = validatePreflightManifest(manifest, {
    expectedCommitSha: manifest.git.commit_sha,
    auditorDecision: decision
  });
  assert.equal(res.valid, true);
  assert.equal(res.validador_status, 'VALIDADOR_PASS');
  assert.equal(res.executor_status, 'EJECUTOR_APTO');
  assert.equal(res.details.reservation_accredited, true);
  assert.equal(res.errors.length, 0);
  assert.ok(res.reasons.some(r => r.includes('acreditado')));
});

// --- R7-R04 & R7-R06 Pruebas PowerShell Dinámicas ---
test('TC-R7-R04-POWERSHELL-GIT-STATUS-FAIL: Get-HostGitState emite clean_working_tree = false cuando git status falla', () => {
  const psScriptPath = path.resolve(__dirname, 'preflight.ps1');
  const psCode = `
    $ErrorActionPreference = 'Stop'
    $content = Get-Content -LiteralPath '${psScriptPath.replace(/'/g, "''")}' -Raw
    if ($content -match '(?s)(function Get-HostGitState\\s*\\{.*?\\n\\})\\s*\\r?\\nfunction Get-DistHashes') {
      $funcDef = $matches[1]
    } else {
      throw 'Cannot find Get-HostGitState definition'
    }
    Invoke-Expression $funcDef

    function git {
      param([Parameter(ValueFromRemainingArguments)]$args)
      if ($args -contains 'status') {
        $global:LASTEXITCODE = 128
        return $null
      }
      $global:LASTEXITCODE = 0
      return 'c161c0f995a8f9844f2ec09c041354d77a08fea0'
    }

    $state = Get-HostGitState -Root '${__dirname.replace(/'/g, "''")}'
    $state | ConvertTo-Json -Compress
  `;

  const res = spawnSync('powershell', ['-NoProfile', '-Command', psCode], {
    encoding: 'utf-8'
  });
  assert.equal(res.status, 0, `PowerShell execution failed: ${res.stderr}`);
  const gitState = JSON.parse(res.stdout.trim());
  assert.equal(gitState.clean_working_tree, false, 'Git status con exit code 128 NUNCA debe marcar arbol limpio');
  assert.ok(
    Array.isArray(gitState.dirty_files) && gitState.dirty_files.some(f => f.includes('git-status-failed')),
    'dirty_files debe reportar git-status-failed'
  );
});

test('TC-R7-R06-POWERSHELL-PATH-CONFINEMENT-JUNCTION: Assert-PathConfinement rechaza terminantemente enlaces reparse/junction', () => {
  const psScriptPath = path.resolve(__dirname, 'preflight.ps1');
  const tmpSandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'qap-confinement-test-'));
  const targetDir = path.join(tmpSandbox, 'target');
  fs.mkdirSync(targetDir, { recursive: true });

  try {
    const psCode = `
      $ErrorActionPreference = 'Stop'
      $content = Get-Content -LiteralPath '${psScriptPath.replace(/'/g, "''")}' -Raw
      if ($content -match '(?s)(function Assert-PathConfinement\\s*\\{.*?\\n\\})\\s*\\r?\\n# Confinement assertions') {
        $funcDef = $matches[1]
      } else {
        throw 'Cannot find Assert-PathConfinement definition'
      }
      Invoke-Expression $funcDef

      $sandbox = '${tmpSandbox.replace(/'/g, "''")}'
      $scriptDir = $sandbox
      $junctionPath = Join-Path $sandbox 'junction-link'
      $target = '${targetDir.replace(/'/g, "''")}'

      New-Item -ItemType Junction -Path $junctionPath -Target $target | Out-Null

      try {
        Assert-PathConfinement -Path $junctionPath -ParamName 'TestJunction'
        Write-Output 'ALLOWED'
      } catch {
        Write-Output ('REJECTED: ' + $_.Exception.Message)
      }
    `;

    const res = spawnSync('powershell', ['-NoProfile', '-Command', psCode], {
      encoding: 'utf-8'
    });
    assert.equal(res.status, 0, `PowerShell execution failed: ${res.stderr}`);
    const output = res.stdout.trim();
    assert.ok(output.startsWith('REJECTED:'), 'Junction DEBE ser rechazada por Assert-PathConfinement');
    assert.ok(output.includes('Reparse point') || output.includes('symbolic link'), 'Mensaje de error debe indicar Reparse point o symlink');
  } finally {
    fs.rmSync(tmpSandbox, { recursive: true, force: true });
  }
});

