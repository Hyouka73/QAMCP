import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

export type WitnessIndependence = 'I0' | 'I1' | 'I2' | 'I3';

export type EffectVerdict =
  | 'PASS'
  | 'FAIL'
  | 'INDETERMINATE'
  | 'BLOCKED'
  | 'TECHNICAL_ERROR';

export interface ExpectationSourceRef {
  readonly id: string;
  readonly revision: string;
  readonly sha256: string;
  readonly rule: string;
  readonly expires_at?: string;
}

export interface WitnessSpec {
  readonly type: 'sqlite_readonly_process' | 'custom_observer';
  readonly independence: WitnessIndependence;
  readonly revision: string;
  readonly db_path?: string;
  readonly table?: string;
  readonly expected_key: string;
  readonly expected_value?: string;
  readonly expected_cardinality: number;
}

export interface RunSpec {
  readonly schema_version: 1;
  readonly case_id: string;
  readonly case_revision: string;
  readonly plan_hash: string;
  readonly discovery_revision_id: string;
  readonly project_id: string;
  readonly campaign_id?: string;
  readonly attempt_id: string;
  readonly execution_id: string;
  readonly scope: {
    readonly origin: string;
    readonly environment: string;
    readonly tenant: string | null;
    readonly principal?: string | null;
    readonly profile_id?: string | null;
  };
  readonly policy_digest: string;
  readonly expectation_source: ExpectationSourceRef;
  readonly witness_spec: WitnessSpec;
}

export interface WitnessRecord {
  readonly key: string;
  readonly value?: string;
}

export interface WitnessObservation {
  readonly phase: 'precondition' | 'post_write' | 'post_cleanup';
  readonly ok: boolean;
  readonly error_code?: string;
  readonly error_message?: string;
  readonly observed_at: string;
  readonly window_closed_at?: string;
  readonly outside_window?: boolean;
  readonly attempt_id?: string;
  readonly revision?: string;
  readonly scope?: {
    readonly environment?: string;
    readonly tenant?: string | null;
    readonly principal?: string | null;
  };
  readonly count: number;
  readonly records: readonly WitnessRecord[];
}

export interface EffectEvaluationResult {
  readonly verdict: EffectVerdict;
  readonly code: string;
  readonly reason: string;
  readonly run_spec_digest: string;
  readonly evidence_digest: string;
  readonly evaluated_at: string;
  readonly expectation_source_sha256_actual?: string;
  readonly precondition: WitnessObservation | null;
  readonly post_write: WitnessObservation | null;
  readonly post_cleanup: WitnessObservation | null;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(item => canonicalJson(item)).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
}

export function sha256Canonical(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex');
}

export function computeRunSpecDigest(spec: RunSpec): string {
  // Bind attempt_id/execution_id separately so deterministic replay of the same spec produces the same run_spec_digest.
  const { attempt_id: _attemptId, execution_id: _executionId, ...specIdentity } = spec;
  return sha256Canonical(specIdentity);
}

export function computeEffectEvidenceDigest(input: {
  run_spec_digest: string;
  verdict: EffectVerdict;
  code: string;
  precondition: WitnessObservation | null;
  post_write: WitnessObservation | null;
  post_cleanup: WitnessObservation | null;
}): string {
  return sha256Canonical(input);
}

export interface EvaluateEffectInput {
  readonly runSpec: RunSpec;
  readonly expectationSourceContent?: string | null;
  readonly precondition?: WitnessObservation | null;
  readonly postWrite?: WitnessObservation | null;
  readonly postCleanup?: WitnessObservation | null;
  readonly artifactIntegrityOk?: boolean;
  readonly now?: string;
}

export function evaluateEffect(input: EvaluateEffectInput): EffectEvaluationResult {
  const {
    runSpec,
    expectationSourceContent,
    precondition = null,
    postWrite = null,
    postCleanup = null,
    artifactIntegrityOk = true,
  } = input;
  const evaluatedAt = input.now ?? new Date().toISOString();
  const runSpecDigest = computeRunSpecDigest(runSpec);

  const finalize = (
    verdict: EffectVerdict,
    code: string,
    reason: string,
    expectationActualSha?: string,
  ): EffectEvaluationResult => ({
    verdict,
    code,
    reason,
    run_spec_digest: runSpecDigest,
    evidence_digest: computeEffectEvidenceDigest({
      run_spec_digest: runSpecDigest,
      verdict,
      code,
      precondition,
      post_write: postWrite,
      post_cleanup: postCleanup,
    }),
    evaluated_at: evaluatedAt,
    ...(expectationActualSha ? { expectation_source_sha256_actual: expectationActualSha } : {}),
    precondition,
    post_write: postWrite,
    post_cleanup: postCleanup,
  });

  // C10: Artifact or manifest integrity failure
  if (!artifactIntegrityOk) {
    return finalize('BLOCKED', 'artifact_integrity_mismatch', 'El artefacto o manifiesto fue alterado después de su captura.');
  }

  // C09: Independent expectation source must exist, match SHA-256, match revision, and not be expired
  if (!expectationSourceContent || expectationSourceContent.trim().length === 0) {
    return finalize('INDETERMINATE', 'expectation_source_missing', 'Falta la fuente independiente de expectativa.');
  }
  const actualSourceSha = createHash('sha256').update(expectationSourceContent, 'utf8').digest('hex');
  if (actualSourceSha !== runSpec.expectation_source.sha256) {
    return finalize(
      'INDETERMINATE',
      'expectation_source_digest_mismatch',
      'La fuente de expectativa no coincide con el digest SHA-256 congelado.',
      actualSourceSha,
    );
  }
  if (runSpec.expectation_source.expires_at && Date.parse(runSpec.expectation_source.expires_at) <= Date.parse(evaluatedAt)) {
    return finalize('INDETERMINATE', 'expectation_source_expired', 'La fuente de expectativa está vencida.', actualSourceSha);
  }

  // Parse source JSON if structured to check revision alignment
  try {
    const parsedSource = JSON.parse(expectationSourceContent) as { revision?: string; expires_at?: string };
    if (parsedSource.revision && parsedSource.revision !== runSpec.expectation_source.revision) {
      return finalize(
        'INDETERMINATE',
        'expectation_source_revision_mismatch',
        'La revisión de la fuente de expectativa no coincide con el RunSpec.',
        actualSourceSha,
      );
    }
    if (parsedSource.expires_at && Date.parse(parsedSource.expires_at) <= Date.parse(evaluatedAt)) {
      return finalize('INDETERMINATE', 'expectation_source_expired', 'La fuente de expectativa está vencida.', actualSourceSha);
    }
  } catch {
    // Plain-text/markdown source is allowed when SHA-256 matches
  }

  // C05: Witness independence must be at least I2
  if (runSpec.witness_spec.independence !== 'I2' && runSpec.witness_spec.independence !== 'I3') {
    return finalize(
      'INDETERMINATE',
      'witness_not_independent',
      `Nivel de independencia insuficiente (${runSpec.witness_spec.independence}); se requiere I2 o I3.`,
      actualSourceSha,
    );
  }

  // C08: Precondition witness technical failure
  if (!precondition || !precondition.ok) {
    return finalize(
      'TECHNICAL_ERROR',
      'witness_connection_error',
      precondition?.error_message ?? 'El testigo no pudo verificar la precondición.',
      actualSourceSha,
    );
  }

  // C02: Precondition must be clean (0 existing rows for the synthetic marker)
  if (precondition.count > 0) {
    return finalize(
      'BLOCKED',
      'precondition_not_clean',
      `Precondición sucia: existían ${precondition.count} fila(s) antes de la escritura.`,
      actualSourceSha,
    );
  }

  // C08: Post-write witness technical failure
  if (!postWrite || !postWrite.ok) {
    return finalize(
      'TECHNICAL_ERROR',
      'witness_connection_error',
      postWrite?.error_message ?? 'El testigo no pudo observar el estado posterior a la escritura.',
      actualSourceSha,
    );
  }

  // C12: Effect outside observation window / after close
  if (
    postWrite.outside_window === true ||
    (postWrite.window_closed_at && Date.parse(postWrite.observed_at) > Date.parse(postWrite.window_closed_at))
  ) {
    return finalize(
      'INDETERMINATE',
      'effect_outside_observation_window',
      'La observación ocurrió fuera de la ventana de medición o después del cierre.',
      actualSourceSha,
    );
  }

  // C06: Attempt and revision correlation
  if (postWrite.attempt_id !== runSpec.attempt_id) {
    return finalize(
      'BLOCKED',
      'correlation_mismatch',
      `El testigo reportó attempt_id=${postWrite.attempt_id ?? 'ausente'} distinto al esperado ${runSpec.attempt_id}.`,
      actualSourceSha,
    );
  }
  if (postWrite.revision && postWrite.revision !== runSpec.case_revision) {
    return finalize(
      'BLOCKED',
      'correlation_mismatch',
      `La revisión observada (${postWrite.revision}) no coincide con la del caso (${runSpec.case_revision}).`,
      actualSourceSha,
    );
  }

  // C07: Scope (environment, tenant, principal) alignment
  if (postWrite.scope) {
    if (postWrite.scope.environment && postWrite.scope.environment !== runSpec.scope.environment) {
      return finalize(
        'BLOCKED',
        'scope_mismatch',
        `Entorno del testigo (${postWrite.scope.environment}) distinto al RunSpec (${runSpec.scope.environment}).`,
        actualSourceSha,
      );
    }
    if (postWrite.scope.tenant !== undefined && postWrite.scope.tenant !== runSpec.scope.tenant) {
      return finalize(
        'BLOCKED',
        'scope_mismatch',
        `Tenant del testigo (${String(postWrite.scope.tenant)}) distinto al RunSpec (${String(runSpec.scope.tenant)}).`,
        actualSourceSha,
      );
    }
    if (
      runSpec.scope.principal !== undefined &&
      postWrite.scope.principal !== undefined &&
      postWrite.scope.principal !== runSpec.scope.principal
    ) {
      return finalize(
        'BLOCKED',
        'scope_mismatch',
        `Principal del testigo (${String(postWrite.scope.principal)}) distinto al RunSpec (${String(runSpec.scope.principal)}).`,
        actualSourceSha,
      );
    }
  }

  // C01: 201 with rolled-back / missing persistence
  if (postWrite.count === 0) {
    return finalize(
      'FAIL',
      'effect_missing_after_write',
      'La escritura devolvió respuesta HTTP exitosa pero el testigo I2 observó 0 filas persistidas.',
      actualSourceSha,
    );
  }

  // C04: Cardinality check (e.g., duplicate writes)
  if (postWrite.count !== runSpec.witness_spec.expected_cardinality) {
    return finalize(
      'FAIL',
      'effect_cardinality_mismatch',
      `Cardinalidad inesperada: se esperaban ${runSpec.witness_spec.expected_cardinality} fila(s) y se observaron ${postWrite.count}.`,
      actualSourceSha,
    );
  }

  // C03: Key and value match
  const matchedRecord = postWrite.records[0];
  if (!matchedRecord || matchedRecord.key !== runSpec.witness_spec.expected_key) {
    return finalize(
      'FAIL',
      'effect_key_or_value_mismatch',
      `Clave observada (${matchedRecord?.key ?? 'ninguna'}) distinta a la esperada (${runSpec.witness_spec.expected_key}).`,
      actualSourceSha,
    );
  }
  if (
    runSpec.witness_spec.expected_value !== undefined &&
    matchedRecord.value !== runSpec.witness_spec.expected_value
  ) {
    return finalize(
      'FAIL',
      'effect_key_or_value_mismatch',
      `Valor observado (${matchedRecord.value ?? 'ninguno'}) distinto al esperado (${runSpec.witness_spec.expected_value}).`,
      actualSourceSha,
    );
  }

  // C08 / C11: Post-cleanup verification
  if (!postCleanup || !postCleanup.ok) {
    return finalize(
      'TECHNICAL_ERROR',
      'witness_connection_error',
      postCleanup?.error_message ?? 'El testigo no pudo verificar el estado posterior a la limpieza.',
      actualSourceSha,
    );
  }
  if (postCleanup.count > 0) {
    return finalize(
      'TECHNICAL_ERROR',
      'cleanup_failed',
      `La limpieza devolvió 204/OK pero el testigo I2 observó ${postCleanup.count} fila(s) residual(es).`,
      actualSourceSha,
    );
  }

  return finalize(
    'PASS',
    'effect_verified',
    'Efecto persistido, correlacionado y limpiado según testigo I2 y expectativa independiente.',
    actualSourceSha,
  );
}

export function runSqliteReadOnlyWitness(options: {
  phase: 'precondition' | 'post_write' | 'post_cleanup';
  witnessScriptPath: string;
  dbPath: string;
  table: string;
  attemptId?: string;
  revision?: string;
  scope?: { environment?: string; tenant?: string | null; principal?: string | null };
  timeoutMs?: number;
}): WitnessObservation {
  const observedAt = new Date().toISOString();
  if (!existsSync(options.witnessScriptPath)) {
    return {
      phase: options.phase,
      ok: false,
      error_code: 'witness_script_missing',
      error_message: `No existe el script testigo: ${options.witnessScriptPath}`,
      observed_at: observedAt,
      count: 0,
      records: [],
    };
  }
  try {
    const raw = execFileSync(
      process.execPath,
      [options.witnessScriptPath, options.dbPath, options.table],
      {
        encoding: 'utf8',
        windowsHide: true,
        timeout: options.timeoutMs ?? 5000,
      },
    );
    const parsed = JSON.parse(raw.trim()) as { ok?: boolean; count?: number; markers?: string[]; error?: string };
    if (!parsed.ok) {
      return {
        phase: options.phase,
        ok: false,
        error_code: 'witness_query_failed',
        error_message: parsed.error ?? 'Error desconocido del testigo SQLite.',
        observed_at: observedAt,
        count: 0,
        records: [],
      };
    }
    const markers = Array.isArray(parsed.markers) ? parsed.markers : [];
    return {
      phase: options.phase,
      ok: true,
      observed_at: observedAt,
      ...(options.attemptId ? { attempt_id: options.attemptId } : {}),
      ...(options.revision ? { revision: options.revision } : {}),
      ...(options.scope ? { scope: options.scope } : {}),
      count: parsed.count ?? markers.length,
      records: markers.map(marker => ({ key: marker })),
    };
  } catch (err) {
    return {
      phase: options.phase,
      ok: false,
      error_code: 'witness_process_error',
      error_message: err instanceof Error ? err.message : String(err),
      observed_at: observedAt,
      count: 0,
      records: [],
    };
  }
}

export function readExpectationSourceSafe(filePath: string): string | null {
  try {
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}
