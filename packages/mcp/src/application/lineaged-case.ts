/**
 * P0.3b-01A — Identidad y persistencia de casos con linaje.
 *
 * Contrato interno (no expuesto por handlers, catálogo MCP, CLI ni runner):
 *  - Identidad lógica estable: proyecto + aplicación + módulo + entorno + tenant + perfil + rol + ruta + regla.
 *  - Referencias comprobadas contra el estado persistido (dossier, vista, controles, evidencias,
 *    decisión de regla, regla fuente, confirmación de la regla). Una referencia nunca es autoridad:
 *    se verifica y se almacena como snapshot; no se acepta ningún alias ambiguo.
 *  - Digest SHA-256 versionado (`lcd-v1`) del candidato completo, guardado en `execution_content_digest`.
 *    No reutiliza `confirmation_digest` ni los campos de aprobación: estos permanecen vacíos.
 *  - Todo caso nuevo queda `pending_oracle` / `missing_oracle`, sin aprobación humana y sin
 *    elegibilidad de ejecución. La acreditación efectiva del oráculo corresponde a 01B.
 */
import { createHash } from 'node:crypto';

import { SchemaValidator, normalizeSlug, type TCCase } from '@qap/shared';

import {
  computeDossierContentHash,
  computeScopeHash,
  type DiscoveryRevisionRecord,
} from './discovery-dossier.js';
import {
  isWildcardToken,
  normalizeRuleRoute,
  type RuleScopeDeclaration,
  type RuleSourceKind,
  type ScopedBusinessRuleRecord,
} from './scoped-rule-resolver.js';

export const LINEAGED_CASE_SCHEMA = 'qap.lineaged_case.v1';
export const LINEAGED_CASE_DIGEST_PREFIX = 'lcd-v1';
export const LINEAGED_EXECUTION_KEY_PREFIX = 'lck-v1';

export type LineagedCaseErrorCode =
  | 'lineaged_case_invalid_input'
  | 'lineaged_case_ambiguous_alias'
  | 'lineaged_case_tc_case_invalid'
  | 'lineaged_case_reference_invalid'
  | 'lineaged_case_scope_mismatch'
  | 'lineaged_case_content_conflict'
  | 'lineaged_case_expected_version_required'
  | 'lineaged_case_stale_version'
  | 'lineaged_case_rule_revision_regression'
  | 'lineaged_case_corrupt'
  | 'lineaged_case_legacy_blocked';

export class LineagedCaseError extends Error {
  constructor(
    readonly code: LineagedCaseErrorCode,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'LineagedCaseError';
  }
}

// ---------------------------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------------------------

export interface LineagedCaseViewInput {
  readonly viewId: string;
  readonly evidenceIds: readonly string[];
  readonly controlIndexes: readonly number[];
  readonly routePathname?: string;
}

export interface LineagedCaseCandidateInput {
  readonly projectId: string;
  readonly applicationId?: string;
  readonly moduleKey: string;
  readonly environmentId: string;
  readonly tenantId: string | null;
  readonly profileId: string | null;
  readonly role: string | null;
  readonly routePathname: string;
  readonly dossier: {
    readonly revisionId: string;
    readonly scopeHash: string;
    readonly contentHash: string;
  };
  readonly view?: LineagedCaseViewInput;
  readonly views?: readonly LineagedCaseViewInput[];
  readonly decision: {
    readonly decisionId: string;
    readonly ruleId: string;
    readonly ruleRevision: number;
    readonly ruleSourceDigest: string | null;
  };
  /** Referencia (no copia) de la confirmación humana de la regla. No es aprobación de ejecución. */
  readonly ruleConfirmation: { readonly decisionId: string } | null;
  /** El UUID lo genera el servidor: `id` no se acepta. */
  readonly tcCase: Omit<TCCase, 'id'>;
  /** Obligatorio para avanzar el linaje de un caso existente (CAS). */
  readonly expectedVersion?: number;
}

export interface LineagedCaseReadScopeInput {
  readonly projectId: string;
  readonly applicationId: string;
  readonly moduleKey: string;
  readonly environmentId: string;
  readonly tenantId: string | null;
  readonly profileId: string | null;
  readonly role: string | null;
  readonly routePathname?: string;
}

export type LineagedCaseSelector =
  | { readonly caseId: string; readonly routePathname?: string }
  | { readonly executionKey: string; readonly routePathname?: string };

export interface LineagedCaseAssociatedView {
  readonly view_id: string;
  readonly route_index: number | null;
  readonly route_pathname: string;
  readonly evidence_id: string;
  readonly evidence_ids: readonly string[];
  readonly controls: ReadonlyArray<{ readonly control_index: number; readonly control_digest: string }>;
}

export interface LineagedCaseScope {
  readonly project_id: string;
  readonly application_id: string;
  readonly module_key: string;
  readonly environment_id: string;
  readonly environment_name: string;
  readonly tenant_id: string | null;
  readonly profile_id: string | null;
  readonly role: string | null;
  readonly route_pathname: string;
}

export interface LineagedCaseIdentity {
  readonly case_id: string;
  readonly execution_key: string;
  readonly rule_id: string;
  readonly rule_key: string;
}

export interface LineagedCaseLineage {
  readonly dossier: {
    readonly revision_id: string;
    readonly scope_hash: string;
    readonly content_hash: string;
  };
  readonly view: {
    readonly view_id: string;
    readonly route_index: number | null;
    readonly evidence_id: string;
  };
  readonly views?: readonly LineagedCaseAssociatedView[];
  readonly controls: ReadonlyArray<{ readonly control_index: number; readonly control_digest: string }>;
  readonly evidence_ids: readonly string[];
  /** Snapshot del dictamen del resolutor de reglas dentro del dossier. Informativo: no acredita nada. */
  readonly decision: {
    readonly decision_id: string;
    readonly decision_status: string;
    readonly rule_key: string;
    readonly route_pathname: string;
    readonly scope_match: string | null;
  };
  readonly rule: {
    readonly rule_id: string;
    readonly source_kind: RuleSourceKind;
    readonly source_id: string;
    readonly source_ref: string;
    readonly source_version: string;
    readonly revision: number;
    readonly source_digest: string | null;
  };
  readonly rule_confirmation: {
    readonly decision_id: string;
    readonly revision: number;
    readonly request_digest: string;
  } | null;
}

export interface LineagedCaseDocument {
  readonly schema: typeof LINEAGED_CASE_SCHEMA;
  readonly identity: LineagedCaseIdentity;
  readonly scope: LineagedCaseScope;
  readonly lineage: LineagedCaseLineage;
  readonly tc_case: TCCase;
}

export interface LineagedCaseRecord {
  readonly case_id: string;
  readonly project_id: string;
  readonly module_id: string;
  readonly module_key: string;
  readonly version: number;
  readonly execution_key: string;
  readonly title: string;
  readonly identity: LineagedCaseIdentity;
  readonly scope: LineagedCaseScope;
  readonly lineage: LineagedCaseLineage;
  readonly tc_case: TCCase;
  readonly execution_content_digest: string;
  /** Siempre null en 01A: la aprobación de ejecución no existe todavía. */
  readonly execution_approval_id: string | null;
  readonly conformity_status: string;
  readonly oracle_status: string;
  readonly confirmation_digest: string | null;
  readonly confirmed_by: string | null;
  readonly confirmed_at: string | null;
  /** Literal: en 01A ningún caso con linaje es elegible para ejecución. */
  readonly execution_eligible: false;
  readonly created_at: string;
  readonly updated_at: string;
}

export type LineagedCaseWriteOutcome = 'created' | 'unchanged' | 'advanced';

export interface LineagedCaseWriteResult {
  readonly outcome: LineagedCaseWriteOutcome;
  readonly case: LineagedCaseRecord;
}

// ---------------------------------------------------------------------------------------------
// Serialización canónica y digest
// ---------------------------------------------------------------------------------------------

/** JSON determinista: claves ordenadas (orden de unidades de código), arrays en su orden original. */
export function stableStringify(value: unknown): string {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'string':
      return JSON.stringify(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
      if (!Number.isFinite(value)) {
        throw new LineagedCaseError('lineaged_case_invalid_input', 'Número no finito no serializable.');
      }
      return JSON.stringify(value);
    case 'object': {
      if (Array.isArray(value)) {
        return `[${value.map((item) => (item === undefined ? 'null' : stableStringify(item))).join(',')}]`;
      }
      const record = value as Record<string, unknown>;
      const keys = Object.keys(record)
        .filter((key) => record[key] !== undefined)
        .sort();
      return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
    }
    default:
      throw new LineagedCaseError(
        'lineaged_case_invalid_input',
        `Valor de tipo '${typeof value}' no serializable en el candidato.`,
      );
  }
}

function sha256Hex(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export function computeLineagedExecutionKey(
  scope: LineagedCaseScope,
  rule: { readonly rule_id: string },
): string {
  const payload = {
    schema: 'qap.lineaged_case.identity.v1',
    project_id: scope.project_id,
    application_id: scope.application_id,
    module_key: scope.module_key,
    environment_id: scope.environment_id,
    tenant_id: scope.tenant_id,
    profile_id: scope.profile_id,
    role: scope.role,
    route_pathname: scope.route_pathname,
    rule_id: rule.rule_id,
  };
  return `${LINEAGED_EXECUTION_KEY_PREFIX}:${sha256Hex(stableStringify(payload))}`;
}

/**
 * Digest versionado sobre identidad, versión, ámbito, linaje y contenido ejecutable completo.
 * Es independiente del orden de claves; el orden de los arrays (p. ej. pasos) sí cuenta.
 */
export function computeLineagedCaseDigest(document: LineagedCaseDocument, version: number): string {
  const payload = {
    digest_schema: 'qap.lineaged_case.digest.v1',
    identity: document.identity,
    version,
    scope: document.scope,
    lineage: document.lineage,
    content: document.tc_case,
  };
  return `${LINEAGED_CASE_DIGEST_PREFIX}:${sha256Hex(stableStringify(payload))}`;
}

/** Revisión numérica de una regla. Solo versiones ordenables (`rev:N`, `vN`, `N`) son admisibles. */
export function parseRuleRevision(sourceVersion: string): number | null {
  const match = /^(?:rev:|v)?(\d+)$/.exec(sourceVersion.trim());
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

// ---------------------------------------------------------------------------------------------
// Validación estructural del candidato (sin acceso a base de datos)
// ---------------------------------------------------------------------------------------------

const SHA256_HEX = /^[a-f0-9]{64}$/;
const UUID_ANY_CASE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EXECUTION_KEY_ANY_CASE_RE = /^lck-v1:[0-9a-f]{64}$/i;
const EXECUTION_KEY_CANONICAL_RE = /^lck-v1:[a-f0-9]{64}$/;

function invalid(message: string, field: string): never {
  throw new LineagedCaseError('lineaged_case_invalid_input', message, { field });
}

function ambiguous(message: string, field: string): never {
  throw new LineagedCaseError('lineaged_case_ambiguous_alias', message, { field });
}

function requireToken(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) invalid(`'${field}' debe ser un texto no vacío.`, field);
  if (value !== value.trim()) {
    ambiguous(`'${field}' no admite espacios sobrantes: se exige la forma canónica exacta.`, field);
  }
  return value;
}

function requireCanonicalIdentifier(value: unknown, field: string): string {
  const token = requireToken(value, field);
  if (isWildcardToken(token)) {
    ambiguous(`'${field}' no admite comodines ('${token}'): se exige un identificador canónico concreto.`, field);
  }
  return token;
}

function requireCanonicalModuleKey(value: unknown, field = 'moduleKey'): string {
  const moduleKey = requireCanonicalIdentifier(value, field);
  if (normalizeSlug(moduleKey) !== moduleKey) {
    ambiguous(`'${field}' debe estar en su forma canónica '${normalizeSlug(moduleKey)}', no '${moduleKey}'.`, field);
  }
  return moduleKey;
}

function requireCanonicalPathname(value: unknown, field = 'routePathname'): string {
  const routePathname = requireToken(value, field);
  if (routePathname === '*' || normalizeRuleRoute(routePathname) !== routePathname || !routePathname.startsWith('/')) {
    ambiguous(`'${field}' debe ser un pathname canónico concreto (sin comodín, query ni hash).`, field);
  }
  return routePathname;
}

function requireScopeToken(value: unknown, field: string): string | null {
  if (value === null) return null;
  const token = requireToken(value, field);
  if (isWildcardToken(token)) {
    ambiguous(`'${field}' no admite comodines ('${token}'): el caso debe fijar un valor concreto o null.`, field);
  }
  return token;
}

export interface NormalizedLineagedViewInput {
  readonly viewId: string;
  readonly evidenceIds: readonly string[];
  readonly controlIndexes: readonly number[];
  readonly routePathname?: string;
}

export interface NormalizedLineagedCandidate {
  readonly projectId: string;
  readonly applicationId?: string;
  readonly moduleKey: string;
  readonly environmentId: string;
  readonly tenantId: string | null;
  readonly profileId: string | null;
  readonly role: string | null;
  readonly routePathname: string;
  readonly dossier: { readonly revisionId: string; readonly scopeHash: string; readonly contentHash: string };
  readonly viewId: string;
  readonly evidenceIds: readonly string[];
  readonly controlIndexes: readonly number[];
  readonly views: readonly NormalizedLineagedViewInput[];
  readonly hasExplicitViewsArray: boolean;
  readonly decisionId: string;
  readonly ruleId: string;
  readonly ruleRevision: number;
  readonly ruleSourceDigest: string | null;
  readonly ruleConfirmationDecisionId: string | null;
  readonly tcCase: Omit<TCCase, 'id'>;
  readonly expectedVersion: number | undefined;
}

function normalizeViewInput(rawView: unknown, missingField: string): NormalizedLineagedViewInput {
  if (!rawView || typeof rawView !== 'object' || Array.isArray(rawView)) {
    invalid(`Falta '${missingField}'.`, missingField);
  }
  const view = rawView as LineagedCaseViewInput;
  const viewId = requireCanonicalIdentifier(view.viewId, 'view.viewId');
  if (!Array.isArray(view.evidenceIds) || view.evidenceIds.length === 0) {
    invalid("'view.evidenceIds' requiere al menos una evidencia.", 'view.evidenceIds');
  }
  const evidenceIds = view.evidenceIds.map((id, i) => requireCanonicalIdentifier(id, `view.evidenceIds[${i}]`));
  if (new Set(evidenceIds).size !== evidenceIds.length) {
    invalid("'view.evidenceIds' contiene duplicados.", 'view.evidenceIds');
  }
  if (!Array.isArray(view.controlIndexes)) {
    invalid("'view.controlIndexes' debe ser un arreglo.", 'view.controlIndexes');
  }
  for (const index of view.controlIndexes) {
    if (!Number.isSafeInteger(index) || index < 0) {
      invalid("'view.controlIndexes' solo admite enteros >= 0.", 'view.controlIndexes');
    }
  }
  if (new Set(view.controlIndexes).size !== view.controlIndexes.length) {
    invalid("'view.controlIndexes' contiene duplicados.", 'view.controlIndexes');
  }
  const routePathname =
    view.routePathname !== undefined ? requireCanonicalPathname(view.routePathname, 'routePathname') : undefined;
  return {
    viewId,
    evidenceIds: [...evidenceIds].sort(),
    controlIndexes: [...view.controlIndexes].sort((a, b) => a - b),
    ...(routePathname !== undefined ? { routePathname } : {}),
  };
}

export function normalizeLineagedCandidateInput(input: LineagedCaseCandidateInput): NormalizedLineagedCandidate {
  if (input === null || typeof input !== 'object') invalid('El candidato debe ser un objeto.', 'input');

  const projectId = requireCanonicalIdentifier(input.projectId, 'projectId');
  const applicationId =
    input.applicationId !== undefined ? requireCanonicalIdentifier(input.applicationId, 'applicationId') : undefined;
  const moduleKey = requireCanonicalModuleKey(input.moduleKey, 'moduleKey');
  const environmentId = requireCanonicalIdentifier(input.environmentId, 'environmentId');
  const tenantId = requireScopeToken(input.tenantId, 'tenantId');
  const profileId = requireScopeToken(input.profileId, 'profileId');
  const role = requireScopeToken(input.role, 'role');
  const routePathname = requireCanonicalPathname(input.routePathname, 'routePathname');

  const dossier = input.dossier;
  if (!dossier || typeof dossier !== 'object') invalid("Falta 'dossier'.", 'dossier');
  const revisionId = requireCanonicalIdentifier(dossier.revisionId, 'dossier.revisionId');
  const scopeHash = requireToken(dossier.scopeHash, 'dossier.scopeHash');
  const contentHash = requireToken(dossier.contentHash, 'dossier.contentHash');
  if (!SHA256_HEX.test(scopeHash)) invalid("'dossier.scopeHash' debe ser SHA-256 hexadecimal.", 'dossier.scopeHash');
  if (!SHA256_HEX.test(contentHash)) invalid("'dossier.contentHash' debe ser SHA-256 hexadecimal.", 'dossier.contentHash');

  let views: NormalizedLineagedViewInput[];
  const hasExplicitViewsArray = input.views !== undefined;
  if (input.views !== undefined) {
    if (!Array.isArray(input.views) || input.views.length === 0) {
      invalid("'views' requiere al menos una vista.", 'views');
    }
    views = input.views.map((v) => normalizeViewInput(v, 'views'));
    const seenViewIds = new Set<string>();
    for (const v of views) {
      if (seenViewIds.has(v.viewId)) {
        invalid(`'views' contiene la vista duplicada '${v.viewId}'.`, 'views');
      }
      seenViewIds.add(v.viewId);
    }
    if (input.view !== undefined) {
      const primaryFromView = normalizeViewInput(input.view, 'view');
      const firstFromViews = views[0]!;
      if (
        primaryFromView.viewId !== firstFromViews.viewId ||
        stableStringify(primaryFromView.evidenceIds) !== stableStringify(firstFromViews.evidenceIds) ||
        stableStringify(primaryFromView.controlIndexes) !== stableStringify(firstFromViews.controlIndexes) ||
        (primaryFromView.routePathname !== undefined &&
          firstFromViews.routePathname !== undefined &&
          primaryFromView.routePathname !== firstFromViews.routePathname)
      ) {
        throw new LineagedCaseError(
          'lineaged_case_scope_mismatch',
          "La vista principal declarada en 'view' contradice 'views[0]'.",
          { field: 'view.viewId' },
        );
      }
    }
  } else {
    views = [normalizeViewInput(input.view, 'view')];
  }

  const primaryView = views[0]!;
  if (primaryView.routePathname !== undefined && primaryView.routePathname !== routePathname) {
    throw new LineagedCaseError(
      'lineaged_case_scope_mismatch',
      'La ruta declarada en la vista principal contradice la ruta del caso.',
      { field: 'routePathname' },
    );
  }

  const decision = input.decision;
  if (!decision || typeof decision !== 'object') invalid("Falta 'decision'.", 'decision');
  const decisionId = requireCanonicalIdentifier(decision.decisionId, 'decision.decisionId');
  const ruleId = requireCanonicalIdentifier(decision.ruleId, 'decision.ruleId');
  if (!Number.isSafeInteger(decision.ruleRevision) || decision.ruleRevision < 0) {
    invalid("'decision.ruleRevision' debe ser un entero >= 0.", 'decision.ruleRevision');
  }
  const ruleSourceDigest =
    decision.ruleSourceDigest === null ? null : requireToken(decision.ruleSourceDigest, 'decision.ruleSourceDigest');

  let ruleConfirmationDecisionId: string | null = null;
  if (input.ruleConfirmation !== null) {
    if (!input.ruleConfirmation || typeof input.ruleConfirmation !== 'object') {
      invalid("'ruleConfirmation' debe ser un objeto o null.", 'ruleConfirmation');
    }
    ruleConfirmationDecisionId = requireCanonicalIdentifier(
      input.ruleConfirmation.decisionId,
      'ruleConfirmation.decisionId',
    );
  }

  if (!input.tcCase || typeof input.tcCase !== 'object' || Array.isArray(input.tcCase)) {
    invalid("'tcCase' debe ser un objeto TCCase.", 'tcCase');
  }
  if ('id' in (input.tcCase as Record<string, unknown>)) {
    throw new LineagedCaseError(
      'lineaged_case_invalid_input',
      "El UUID del caso lo genera el servidor: 'tcCase.id' no se acepta.",
      { field: 'tcCase.id' },
    );
  }

  if (input.expectedVersion !== undefined && (!Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 1)) {
    invalid("'expectedVersion' debe ser un entero >= 1.", 'expectedVersion');
  }

  return {
    projectId,
    ...(applicationId !== undefined ? { applicationId } : {}),
    moduleKey,
    environmentId,
    tenantId,
    profileId,
    role,
    routePathname,
    dossier: { revisionId, scopeHash, contentHash },
    viewId: primaryView.viewId,
    evidenceIds: primaryView.evidenceIds,
    controlIndexes: primaryView.controlIndexes,
    views,
    hasExplicitViewsArray,
    decisionId,
    ruleId,
    ruleRevision: decision.ruleRevision,
    ruleSourceDigest,
    ruleConfirmationDecisionId,
    tcCase: input.tcCase,
    expectedVersion: input.expectedVersion,
  };
}

// ---------------------------------------------------------------------------------------------
// Validación canónica de ámbito y selector de lectura
// ---------------------------------------------------------------------------------------------

const DISALLOWED_READ_SCOPE_ALIAS_KEYS: Readonly<Record<string, string>> = {
  project: 'projectId',
  app: 'applicationId',
  application: 'applicationId',
  module: 'moduleKey',
  env: 'environmentId',
  environment: 'environmentId',
  tenant: 'tenantId',
  profile: 'profileId',
  profileLabel: 'profileId',
  route: 'routePathname',
  pathname: 'routePathname',
};

export interface NormalizedLineagedReadScope {
  readonly projectId: string;
  readonly applicationId: string;
  readonly moduleKey: string;
  readonly environmentId: string;
  readonly environmentName?: string;
  readonly tenantId: string | null;
  readonly profileId: string | null;
  readonly role: string | null;
  readonly routePathname?: string;
}

export type NormalizedLineagedSelector =
  | { readonly kind: 'caseId'; readonly caseId: string; readonly routePathname?: string }
  | { readonly kind: 'executionKey'; readonly executionKey: string; readonly routePathname?: string };

function extractPairedField(
  raw: Record<string, unknown>,
  camelKey: string,
  snakeKey: string,
  required: boolean,
): { readonly present: boolean; readonly value: unknown } {
  const hasCamel = Object.prototype.hasOwnProperty.call(raw, camelKey) && raw[camelKey] !== undefined;
  const hasSnake = Object.prototype.hasOwnProperty.call(raw, snakeKey) && raw[snakeKey] !== undefined;
  if (hasCamel && hasSnake && raw[camelKey] !== raw[snakeKey]) {
    ambiguous(`Conflicto entre '${camelKey}' y '${snakeKey}' en el ámbito de lectura.`, camelKey);
  }
  if (!hasCamel && !hasSnake) {
    if (required) {
      invalid(`Falta '${camelKey}' en el ámbito canónico de lectura.`, camelKey);
    }
    return { present: false, value: undefined };
  }
  return { present: true, value: hasCamel ? raw[camelKey] : raw[snakeKey] };
}

/**
 * Exige un ámbito canónico completo para cualquier lectura de casos con linaje:
 * proyecto, aplicación, módulo, entorno, tenant, perfil y rol (y ruta cuando se vincule a una).
 * No sustituye campos ausentes por defaults ni acepta aliases ambiguos.
 */
export function normalizeLineagedReadScope(
  rawScope: unknown,
  explicitProjectId?: unknown,
): NormalizedLineagedReadScope {
  if (!rawScope || typeof rawScope !== 'object' || Array.isArray(rawScope)) {
    invalid('Se requiere un ámbito canónico completo de lectura.', 'scope');
  }
  const raw = rawScope as Record<string, unknown>;

  for (const [aliasKey, canonicalField] of Object.entries(DISALLOWED_READ_SCOPE_ALIAS_KEYS)) {
    if (Object.prototype.hasOwnProperty.call(raw, aliasKey) && raw[aliasKey] !== undefined) {
      ambiguous(
        `El campo alias '${aliasKey}' no se acepta; utiliza el identificador canónico '${canonicalField}'.`,
        canonicalField,
      );
    }
  }

  let projectId: string;
  const scopeProject = extractPairedField(raw, 'projectId', 'project_id', explicitProjectId === undefined);
  if (explicitProjectId !== undefined) {
    const validatedExplicit = requireCanonicalIdentifier(explicitProjectId, 'projectId');
    if (scopeProject.present) {
      const validatedScopeProject = requireCanonicalIdentifier(scopeProject.value, 'projectId');
      if (validatedScopeProject !== validatedExplicit) {
        throw new LineagedCaseError(
          'lineaged_case_scope_mismatch',
          'El proyecto del ámbito no coincide con el proyecto solicitado.',
          { field: 'projectId' },
        );
      }
    }
    projectId = validatedExplicit;
  } else {
    projectId = requireCanonicalIdentifier(scopeProject.value, 'projectId');
  }

  const appField = extractPairedField(raw, 'applicationId', 'application_id', true);
  const applicationId = requireCanonicalIdentifier(appField.value, 'applicationId');

  const modField = extractPairedField(raw, 'moduleKey', 'module_key', true);
  const moduleKey = requireCanonicalModuleKey(modField.value, 'moduleKey');

  const envField = extractPairedField(raw, 'environmentId', 'environment_id', true);
  const environmentId = requireCanonicalIdentifier(envField.value, 'environmentId');

  const envNameField = extractPairedField(raw, 'environmentName', 'environment_name', false);
  const environmentName = envNameField.present ? requireCanonicalIdentifier(envNameField.value, 'environmentName') : undefined;

  const tenantField = extractPairedField(raw, 'tenantId', 'tenant_id', true);
  const tenantId = requireScopeToken(tenantField.value, 'tenantId');

  const profileField = extractPairedField(raw, 'profileId', 'profile_id', true);
  const profileId = requireScopeToken(profileField.value, 'profileId');

  if (!Object.prototype.hasOwnProperty.call(raw, 'role') || raw.role === undefined) {
    invalid("Falta 'role' en el ámbito canónico de lectura.", 'role');
  }
  const role = requireScopeToken(raw.role, 'role');

  let routePathname: string | undefined;
  const hasCamelRoute = Object.prototype.hasOwnProperty.call(raw, 'routePathname');
  const hasSnakeRoute = Object.prototype.hasOwnProperty.call(raw, 'route_pathname');
  if (hasCamelRoute || hasSnakeRoute) {
    const camelVal = raw.routePathname;
    const snakeVal = raw.route_pathname;
    if (camelVal !== undefined && snakeVal !== undefined && camelVal !== snakeVal) {
      ambiguous("Conflicto entre 'routePathname' y 'route_pathname' en el ámbito de lectura.", 'routePathname');
    }
    const chosen = camelVal !== undefined ? camelVal : snakeVal;
    if (chosen !== undefined) {
      routePathname = requireCanonicalPathname(chosen, 'routePathname');
    }
  }

  return {
    projectId,
    applicationId,
    moduleKey,
    environmentId,
    ...(environmentName !== undefined ? { environmentName } : {}),
    tenantId,
    profileId,
    role,
    ...(routePathname !== undefined ? { routePathname } : {}),
  };
}

export function normalizeLineagedSelector(rawSelector: unknown): NormalizedLineagedSelector {
  if (!rawSelector || typeof rawSelector !== 'object' || Array.isArray(rawSelector)) {
    invalid("Falta el selector de lectura ('caseId' o 'executionKey').", 'selector');
  }
  const raw = rawSelector as Record<string, unknown>;
  const hasCaseId = Object.prototype.hasOwnProperty.call(raw, 'caseId') && raw.caseId !== undefined;
  const hasExecutionKey = Object.prototype.hasOwnProperty.call(raw, 'executionKey') && raw.executionKey !== undefined;
  if (hasCaseId && hasExecutionKey) {
    invalid("El selector debe especificar 'caseId' o 'executionKey', pero no ambos.", 'selector');
  }
  if (!hasCaseId && !hasExecutionKey) {
    invalid("El selector requiere 'caseId' o 'executionKey'.", 'selector');
  }

  let routePathname: string | undefined;
  if (Object.prototype.hasOwnProperty.call(raw, 'routePathname') && raw.routePathname !== undefined) {
    routePathname = requireCanonicalPathname(raw.routePathname, 'routePathname');
  }

  if (hasCaseId) {
    const caseId = requireCanonicalIdentifier(raw.caseId, 'caseId');
    if (UUID_ANY_CASE_RE.test(caseId) && caseId !== caseId.toLowerCase()) {
      ambiguous("'caseId' debe estar en su forma canónica en minúsculas.", 'caseId');
    }
    return {
      kind: 'caseId',
      caseId,
      ...(routePathname !== undefined ? { routePathname } : {}),
    };
  }

  const executionKey = requireCanonicalIdentifier(raw.executionKey, 'executionKey');
  if (EXECUTION_KEY_ANY_CASE_RE.test(executionKey) && executionKey !== executionKey.toLowerCase()) {
    ambiguous("'executionKey' debe estar en su forma canónica en minúsculas.", 'executionKey');
  }
  if (!EXECUTION_KEY_CANONICAL_RE.test(executionKey)) {
    invalid("'executionKey' debe tener el formato canónico 'lck-v1:<sha256>'.", 'executionKey');
  }
  return {
    kind: 'executionKey',
    executionKey,
    ...(routePathname !== undefined ? { routePathname } : {}),
  };
}

export function resolveLineagedReadArguments(
  arg1: unknown,
  arg2: unknown,
  arg3?: unknown,
): { readonly scope: NormalizedLineagedReadScope; readonly selector: NormalizedLineagedSelector } {
  let scope: NormalizedLineagedReadScope;
  let selector: NormalizedLineagedSelector;

  if (typeof arg1 === 'string') {
    const projectId = requireCanonicalIdentifier(arg1, 'projectId');
    selector = normalizeLineagedSelector(arg2);
    const scopeSource = arg3 !== undefined ? arg3 : arg2;
    scope = normalizeLineagedReadScope(scopeSource, projectId);
    if (arg3 !== undefined && arg2 && typeof arg2 === 'object') {
      const extra = arg2 as Record<string, unknown>;
      for (const [camel, snake] of [['projectId','project_id'], ['applicationId','application_id'], ['moduleKey','module_key'], ['environmentId','environment_id'], ['environmentName','environment_name'], ['tenantId','tenant_id'], ['profileId','profile_id'], ['role','role']] as const) {
        const field = extractPairedField(extra, camel, snake, false);
        if (field.present && field.value !== scope[camel]) {
          throw new LineagedCaseError('lineaged_case_scope_mismatch', `El selector contradice '${camel}' del ámbito.`, { field: camel });
        }
      }
    }
  } else {
    scope = normalizeLineagedReadScope(arg1);
    selector = normalizeLineagedSelector(arg2);
  }

  if (selector.routePathname !== undefined) {
    if (scope.routePathname !== undefined && scope.routePathname !== selector.routePathname) {
      throw new LineagedCaseError(
        'lineaged_case_scope_mismatch',
        'La ruta del selector contradice la ruta del ámbito de lectura.',
        { field: 'routePathname' },
      );
    }
    scope = { ...scope, routePathname: selector.routePathname };
  }

  return { scope, selector };
}

export function resolveLineagedListArguments(
  arg1: unknown,
  arg2?: unknown,
): NormalizedLineagedReadScope {
  if (typeof arg1 === 'string') {
    const projectId = requireCanonicalIdentifier(arg1, 'projectId');
    return normalizeLineagedReadScope(arg2, projectId);
  }
  if (arg2 !== undefined) {
    invalid('No se admiten argumentos adicionales cuando el primer parámetro ya es el ámbito.', 'scope');
  }
  return normalizeLineagedReadScope(arg1);
}

export function matchesLineagedReadScope(
  docScope: LineagedCaseScope,
  readScope: NormalizedLineagedReadScope,
): boolean {
  if (docScope.project_id !== readScope.projectId) return false;
  if (docScope.application_id !== readScope.applicationId) return false;
  if (docScope.module_key !== readScope.moduleKey) return false;
  if (docScope.environment_id !== readScope.environmentId) return false;
  if (readScope.environmentName !== undefined && docScope.environment_name !== readScope.environmentName) return false;
  if (docScope.tenant_id !== readScope.tenantId) return false;
  if (docScope.profile_id !== readScope.profileId) return false;
  if (docScope.role !== readScope.role) return false;
  if (readScope.routePathname !== undefined && docScope.route_pathname !== readScope.routePathname) return false;
  return true;
}

let sharedValidator: SchemaValidator | undefined;

/** Valida el TCCase tipado con SchemaValidator y lo devuelve como copia JSON limpia con el UUID del servidor. */
export function buildValidatedTcCase(
  tcCase: Omit<TCCase, 'id'>,
  caseId: string,
  ruleId: string,
): TCCase {
  const candidate = JSON.parse(stableStringify({ ...tcCase, id: caseId })) as TCCase;
  sharedValidator ??= new SchemaValidator();
  const result = sharedValidator.validateTcCase(candidate);
  if (!result.valid) {
    throw new LineagedCaseError('lineaged_case_tc_case_invalid', 'El TCCase no supera la validación de esquema.', {
      errors: Array.isArray(result.errors) ? result.errors.slice(0, 10) : result.errors,
    });
  }
  if (candidate.source_rule_id !== undefined && candidate.source_rule_id !== ruleId) {
    throw new LineagedCaseError(
      'lineaged_case_scope_mismatch',
      "'tcCase.source_rule_id' contradice la regla fuente verificada.",
      { field: 'tcCase.source_rule_id' },
    );
  }
  return candidate;
}

// ---------------------------------------------------------------------------------------------
// Resolución de referencias comprobadas
// ---------------------------------------------------------------------------------------------

export interface LineagedRuleConfirmationRef {
  readonly decision_id: string;
  readonly project_id: string;
  readonly requirement_id: string;
  readonly rule_id: string;
  readonly rule_key: string;
  readonly module_key: string;
  readonly route_pathname: string;
  readonly environment_name: string;
  readonly tenant_id: string;
  readonly role: string;
  readonly scope_declaration: 'exact' | 'general_compatible';
  readonly revision: number;
  readonly decision: 'confirm' | 'reject' | 'defer';
  readonly request_digest: string;
}

/** Lectura mínima del estado persistido; el servicio la implementa dentro de la transacción de escritura. */
export interface LineagedReferenceReader {
  getEnvironment(projectId: string, environmentId: string): { readonly env_id: string; readonly name: string } | null;
  isEnvironmentNameAlias?(projectId: string, token: string): boolean;
  getProfile(
    projectId: string,
    profileId: string,
  ): {
    readonly profile_id: string;
    readonly env_id: string;
    readonly role_name: string | null;
    readonly tenant_id: string | null;
  } | null;
  isProfileLabelAlias?(projectId: string, token: string): boolean;
  getDiscoveryRevision(revisionId: string): DiscoveryRevisionRecord | null;
  getScopedRule(projectId: string, ruleId: string): ScopedBusinessRuleRecord | null;
  getRuleConfirmation(projectId: string, decisionId: string): LineagedRuleConfirmationRef | null;
}

export interface ResolvedLineagedReferences {
  readonly scope: LineagedCaseScope;
  readonly lineage: LineagedCaseLineage;
  readonly ruleId: string;
  readonly ruleKey: string;
  readonly ruleRevision: number;
  readonly executionKey: string;
}

function mismatch(field: string, _expected: unknown, _actual: unknown, message: string): never {
  throw new LineagedCaseError('lineaged_case_scope_mismatch', message, { field });
}

function badReference(field: string, message: string, extra?: Record<string, unknown>): never {
  throw new LineagedCaseError('lineaged_case_reference_invalid', message, { field, ...extra });
}

function sameNullable(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a ?? null) === (b ?? null);
}

function ruleScopeValueApplies(
  ruleValue: string | null,
  caseValue: string | null,
  declaration: RuleScopeDeclaration,
): boolean {
  if (ruleValue === null || isWildcardToken(ruleValue)) return declaration !== 'exact';
  return ruleValue === caseValue;
}

export function resolveLineagedReferences(
  reader: LineagedReferenceReader,
  project: { readonly project_id: string; readonly application_id: string },
  input: NormalizedLineagedCandidate,
): ResolvedLineagedReferences {
  if (input.projectId !== project.project_id) {
    mismatch('projectId', project.project_id, input.projectId, 'El proyecto del candidato no coincide.');
  }
  if (input.applicationId !== undefined && input.applicationId !== project.application_id) {
    mismatch('applicationId', project.application_id, input.applicationId, 'La aplicación del candidato no coincide.');
  }

  // --- Ámbito: entorno, perfil -----------------------------------------------------------------
  const environment = reader.getEnvironment(input.projectId, input.environmentId);
  if (!environment) {
    if (reader.isEnvironmentNameAlias?.(input.projectId, input.environmentId)) {
      ambiguous("'environmentId' debe ser el identificador canónico del entorno, no su nombre.", 'environmentId');
    }
    mismatch('environmentId', 'entorno del proyecto', input.environmentId, 'El entorno no pertenece al proyecto.');
  }
  if (input.profileId !== null) {
    const profile = reader.getProfile(input.projectId, input.profileId);
    if (!profile) {
      if (reader.isProfileLabelAlias?.(input.projectId, input.profileId)) {
        ambiguous("'profileId' debe ser el identificador canónico del perfil, no su alias/label.", 'profileId');
      }
      mismatch('profileId', 'perfil del proyecto', input.profileId, 'El perfil no pertenece al proyecto.');
    }
    if (profile.env_id !== input.environmentId) {
      mismatch('profileId', input.environmentId, profile.env_id, 'El perfil pertenece a otro entorno.');
    }
    if (profile.role_name !== null && profile.role_name !== input.role) {
      mismatch('role', profile.role_name, input.role, 'El rol declarado contradice el rol del perfil.');
    }
    if (profile.tenant_id !== null && profile.tenant_id !== input.tenantId) {
      mismatch('tenantId', profile.tenant_id, input.tenantId, 'El tenant declarado contradice el tenant del perfil.');
    }
  }

  // --- Dossier ----------------------------------------------------------------------------------
  const revision = reader.getDiscoveryRevision(input.dossier.revisionId);
  if (!revision) badReference('dossier.revisionId', `No existe la revisión de dossier '${input.dossier.revisionId}'.`);
  const dossier = revision.dossier;
  if (revision.project_id !== input.projectId || dossier.scope.project_id !== input.projectId) {
    mismatch('projectId', input.projectId, revision.project_id, 'El dossier pertenece a otro proyecto.');
  }
  if (revision.application_id !== project.application_id || dossier.scope.application_id !== project.application_id) {
    mismatch('applicationId', project.application_id, revision.application_id, 'El dossier pertenece a otra aplicación.');
  }
  if (normalizeSlug(revision.module_key) !== input.moduleKey || normalizeSlug(dossier.scope.module_key) !== input.moduleKey) {
    mismatch('moduleKey', input.moduleKey, revision.module_key, 'El dossier pertenece a otro módulo.');
  }
  if (revision.environment_id !== input.environmentId || dossier.scope.environment_id !== input.environmentId) {
    mismatch('environmentId', input.environmentId, revision.environment_id, 'El dossier pertenece a otro entorno.');
  }
  if (revision.environment_name !== environment.name || dossier.scope.environment_name !== environment.name) {
    mismatch('environmentName', environment.name, revision.environment_name, 'El nombre de entorno del dossier no coincide.');
  }
  if (!sameNullable(revision.tenant_id, input.tenantId) || !sameNullable(dossier.scope.tenant_id, input.tenantId)) {
    mismatch('tenantId', input.tenantId, revision.tenant_id, 'El dossier pertenece a otro tenant.');
  }
  if (!sameNullable(revision.profile_id, input.profileId) || !sameNullable(dossier.scope.profile_id, input.profileId)) {
    mismatch('profileId', input.profileId, revision.profile_id, 'El dossier pertenece a otro perfil.');
  }
  if (!sameNullable(revision.role, input.role) || !sameNullable(dossier.scope.role, input.role)) {
    mismatch('role', input.role, revision.role, 'El dossier pertenece a otro rol.');
  }
  if (
    input.dossier.scopeHash !== revision.scope_hash ||
    revision.scope_hash !== computeScopeHash(dossier.scope)
  ) {
    badReference('dossier.scopeHash', 'El scope_hash del dossier no coincide con la revisión persistida.');
  }
  if (
    input.dossier.contentHash !== revision.content_hash ||
    revision.content_hash !== computeDossierContentHash(dossier)
  ) {
    badReference('dossier.contentHash', 'El content_hash del dossier no coincide con la revisión persistida.');
  }

  // --- Vista(s), ruta(s), controles y evidencias (pertenencia conjunta estricta) ---------------
  // Un identificador NUNCA es válido solo por aparecer en el inventario global (source_refs/views):
  // cada vista seleccionada debe pertenecer a esta revisión de Discovery, resolver a una ruta
  // autorizada y visitada coherente con el caso, y vincular únicamente sus propios controles y su
  // propia evidencia de vista.
  const resolvedViews: LineagedCaseAssociatedView[] = [];
  const allEvidenceIds = new Set<string>();

  for (let vIdx = 0; vIdx < input.views.length; vIdx += 1) {
    const vInput = input.views[vIdx]!;
    const matchingViews = dossier.views.filter((v) => v.view_id === vInput.viewId);
    if (matchingViews.length === 0) {
      badReference('view.viewId', `La vista '${vInput.viewId}' no existe en el dossier.`);
    }
    if (matchingViews.length > 1) {
      throw new LineagedCaseError(
        'lineaged_case_ambiguous_alias',
        `La vista '${vInput.viewId}' es ambigua en el dossier.`,
        { field: 'view.viewId' },
      );
    }
    const view = matchingViews[0]!;

    let viewRoute: string | undefined;
    let resolvedRouteIndex: number | null = view.route_index ?? null;
    if (view.route_index !== undefined) {
      if (
        !Number.isSafeInteger(view.route_index) ||
        view.route_index < 0 ||
        view.route_index >= dossier.routes.length
      ) {
        badReference('view.viewId', 'La vista no resuelve a una ruta autorizada del dossier.');
      }
      const routeEntry = dossier.routes[view.route_index]!;
      if (
        typeof routeEntry.authorized_pathname !== 'string' ||
        !routeEntry.authorized_pathname.startsWith('/') ||
        routeEntry.authorized_pathname === '*' ||
        normalizeRuleRoute(routeEntry.authorized_pathname) !== routeEntry.authorized_pathname
      ) {
        badReference('view.viewId', 'La vista no resuelve a una ruta autorizada del dossier.');
      }
      if (routeEntry.state !== 'visited') {
        badReference('view.viewId', 'La ruta asociada a la vista no fue visitada en la revisión de Discovery.');
      }
      if (
        typeof view.route === 'string' &&
        view.route.length > 0 &&
        typeof routeEntry.reference === 'string' &&
        routeEntry.reference.length > 0 &&
        view.route !== routeEntry.reference
      ) {
        badReference('view.viewId', 'La referencia de ruta de la vista contradice la ruta indexada del dossier.');
      }
      if (dossier.routes.some((r, idx) => r.view_id === view.view_id && idx !== view.route_index)) {
        badReference('view.viewId', 'La vista está asociada a otro índice de ruta en el dossier.');
      }
      viewRoute = routeEntry.authorized_pathname;
    } else if (dossier.routes.length > 0) {
      const matchedRouteIndexes: number[] = [];
      dossier.routes.forEach((r, idx) => {
        if ((view.route && r.reference === view.route) || r.view_id === view.view_id) {
          matchedRouteIndexes.push(idx);
        }
      });
      if (matchedRouteIndexes.length !== 1) {
        badReference('view.viewId', 'La vista no se asocia unívocamente a una ruta del dossier.');
      }
      const routeIdx = matchedRouteIndexes[0]!;
      const routeEntry = dossier.routes[routeIdx]!;
      if (
        typeof routeEntry.authorized_pathname !== 'string' ||
        !routeEntry.authorized_pathname.startsWith('/') ||
        routeEntry.authorized_pathname === '*' ||
        normalizeRuleRoute(routeEntry.authorized_pathname) !== routeEntry.authorized_pathname ||
        routeEntry.state !== 'visited'
      ) {
        badReference('view.viewId', 'La vista no resuelve a una ruta autorizada y visitada del dossier.');
      }
      resolvedRouteIndex = routeIdx;
      viewRoute = routeEntry.authorized_pathname;
    } else {
      badReference('view.viewId', 'La vista requiere una ruta autorizada y visitada del dossier.');
    }

    const expectedRoute = vIdx === 0 ? input.routePathname : (vInput.routePathname ?? input.routePathname);
    if (viewRoute !== expectedRoute) {
      mismatch('routePathname', viewRoute, expectedRoute, 'La ruta del caso no coincide con la ruta de la vista.');
    }

    if (
      typeof view.evidence_id !== 'string' ||
      view.evidence_id.length === 0 ||
      view.evidence_id !== view.evidence_id.trim() ||
      isWildcardToken(view.evidence_id)
    ) {
      badReference('view.evidenceIds', `La vista '${view.view_id}' no posee una evidencia canónica válida.`);
    }
    const conflictingViews = dossier.views.filter(
      (other) => other.view_id !== view.view_id && other.evidence_id === view.evidence_id,
    );
    if (conflictingViews.length > 0) {
      throw new LineagedCaseError(
        'lineaged_case_ambiguous_alias',
        `La evidencia '${view.evidence_id}' está compartida ambiguamente entre múltiples vistas del dossier.`,
        { field: 'view.evidenceIds' },
      );
    }
    const observedNotes = (dossier.rule_resolution?.observed_evidence_notes ?? []).filter(
      (n) => n.view_id === view.view_id || n.evidence_id === view.evidence_id,
    );
    for (const note of observedNotes) {
      if (note.view_id !== view.view_id || note.evidence_id !== view.evidence_id || note.route !== view.route) {
        badReference(
          'view.evidenceIds',
          `La nota de evidencia observada para '${view.view_id}' es inconsistente con la vista en el dossier.`,
        );
      }
    }
    for (const src of dossier.source_refs) {
      if (src.ref_id === view.evidence_id && src.kind !== 'knowledge_evidence') {
        badReference(
          'view.evidenceIds',
          `La referencia '${view.evidence_id}' en el dossier no es una evidencia de vista ('${src.kind}').`,
        );
      }
    }

    // Solo la evidencia propia de la vista seleccionada es válida para esa vista;
    // se rechazan evidencias de otras vistas/rutas y cualquier ref_id del inventario global (source_refs).
    for (const evidenceId of vInput.evidenceIds) {
      if (evidenceId !== view.evidence_id) {
        badReference(
          'view.evidenceIds',
          `La evidencia '${evidenceId}' no pertenece a la vista seleccionada '${view.view_id}'.`,
        );
      }
    }
    if (!vInput.evidenceIds.includes(view.evidence_id)) {
      badReference('view.evidenceIds', 'Las evidencias deben incluir la evidencia propia de la vista referenciada.');
    }

    const viewControls = vInput.controlIndexes.map((controlIndex) => {
      const control = view.controls[controlIndex];
      if (!control) {
        badReference('view.controlIndexes', `El control #${controlIndex} no existe en la vista '${view.view_id}'.`);
      }
      return { control_index: controlIndex, control_digest: sha256Hex(stableStringify(control)) };
    });

    allEvidenceIds.add(view.evidence_id);
    resolvedViews.push({
      view_id: view.view_id,
      route_index: resolvedRouteIndex,
      route_pathname: viewRoute,
      evidence_id: view.evidence_id,
      evidence_ids: [...vInput.evidenceIds],
      controls: viewControls,
    });
  }

  const primaryResolvedView = resolvedViews[0]!;

  // --- Decisión del resolutor de reglas --------------------------------------------------------
  const decisions = (dossier.rule_resolution?.decisions ?? []).filter((d) => d.decision_id === input.decisionId);
  if (decisions.length === 0) badReference('decision.decisionId', `El dossier no contiene la decisión '${input.decisionId}'.`);
  if (decisions.length > 1) {
    throw new LineagedCaseError('lineaged_case_ambiguous_alias', `La decisión '${input.decisionId}' es ambigua en el dossier.`, {
      field: 'decision.decisionId',
    });
  }
  const decision = decisions[0]!;
  if (
    decision.source_kind === undefined ||
    decision.source_id === undefined ||
    decision.source_ref === undefined ||
    decision.source_version === undefined
  ) {
    badReference(
      'decision.decisionId',
      `La decisión '${decision.decision_id}' (${decision.decision_status}) no identifica una regla fuente única.`,
    );
  }
  if (decision.applied_scope.environment !== environment.name) {
    mismatch('environmentName', environment.name, decision.applied_scope.environment, 'La decisión se aplicó a otro entorno.');
  }
  if (!sameNullable(decision.applied_scope.tenant_id, input.tenantId)) {
    mismatch('tenantId', input.tenantId, decision.applied_scope.tenant_id, 'La decisión se aplicó a otro tenant.');
  }
  if (!sameNullable(decision.applied_scope.role, input.role)) {
    mismatch('role', input.role, decision.applied_scope.role, 'La decisión se aplicó a otro rol.');
  }
  if (normalizeSlug(decision.applied_scope.module_key) !== input.moduleKey) {
    mismatch('moduleKey', input.moduleKey, decision.applied_scope.module_key, 'La decisión se aplicó a otro módulo.');
  }
  if (decision.route_pathname !== '*' && decision.route_pathname !== input.routePathname) {
    mismatch('routePathname', decision.route_pathname, input.routePathname, 'La decisión corresponde a otra ruta.');
  }
  for (const rv of resolvedViews) {
    if (decision.route_pathname !== '*' && decision.route_pathname !== rv.route_pathname) {
      mismatch('routePathname', decision.route_pathname, rv.route_pathname, 'La vista seleccionada pertenece a otra ruta.');
    }
  }
  const matchingCandidates = decision.candidates.filter(
    (c) =>
      c.rule_id === input.ruleId &&
      c.source_kind === decision.source_kind &&
      c.source_id === decision.source_id &&
      c.source_ref === decision.source_ref &&
      c.source_version === decision.source_version,
  );
  if (matchingCandidates.length !== 1) {
    badReference('decision.ruleId', `La regla '${input.ruleId}' no es la fuente única de la decisión '${decision.decision_id}'.`);
  }

  // --- Regla fuente persistida -----------------------------------------------------------------
  const rule = reader.getScopedRule(input.projectId, input.ruleId);
  if (!rule) badReference('decision.ruleId', `No existe la regla fuente '${input.ruleId}' en el proyecto.`);
  if (
    rule.rule_key !== decision.rule_key ||
    rule.source_kind !== decision.source_kind ||
    rule.source_id !== decision.source_id ||
    rule.source_ref !== decision.source_ref ||
    rule.source_version !== decision.source_version ||
    rule.route_pathname !== decision.route_pathname
  ) {
    badReference(
      'decision.ruleId',
      `La regla '${rule.rule_id}' cambió respecto del dossier (referencia obsoleta o cruzada).`,
    );
  }
  if (rule.module_key !== '*' && normalizeSlug(rule.module_key) !== input.moduleKey) {
    mismatch('moduleKey', input.moduleKey, rule.module_key, 'La regla pertenece a otro módulo.');
  }
  for (const rv of resolvedViews) {
    if (rule.route_pathname !== '*' && rule.route_pathname !== rv.route_pathname) {
      mismatch('routePathname', rule.route_pathname, rv.route_pathname, 'La vista seleccionada no coincide con la ruta de la regla.');
    }
  }
  if (!ruleScopeValueApplies(rule.environment_name, environment.name, rule.scope_declaration)) {
    mismatch('environmentName', environment.name, rule.environment_name, 'La regla pertenece a otro entorno.');
  }
  if (!ruleScopeValueApplies(rule.tenant_id, input.tenantId, rule.scope_declaration)) {
    mismatch('tenantId', input.tenantId, rule.tenant_id, 'La regla pertenece a otro tenant.');
  }
  if (!ruleScopeValueApplies(rule.role, input.role, rule.scope_declaration)) {
    mismatch('role', input.role, rule.role, 'La regla pertenece a otro rol.');
  }
  const ruleRevision = parseRuleRevision(rule.source_version);
  if (ruleRevision === null) {
    badReference(
      'decision.ruleRevision',
      `La versión de la regla ('${rule.source_version}') no es una revisión numérica ordenable.`,
    );
  }
  if (input.ruleRevision !== ruleRevision) {
    badReference(
      'decision.ruleRevision',
      `La revisión declarada (${input.ruleRevision}) no coincide con la regla vigente (${ruleRevision}).`,
    );
  }
  if (input.ruleSourceDigest !== (rule.source_digest ?? null)) {
    badReference('decision.ruleSourceDigest', 'El digest de la regla fuente no coincide con el persistido.');
  }

  // --- Confirmación de la regla (referencia; nunca copia de aprobación) ------------------------
  let ruleConfirmation: LineagedCaseLineage['rule_confirmation'] = null;
  if (input.ruleConfirmationDecisionId === null) {
    if (rule.source_kind === 'confirmed_requirement') {
      badReference('ruleConfirmation', 'Una regla confirmada exige referenciar su confirmación.');
    }
  } else {
    const confirmation = reader.getRuleConfirmation(input.projectId, input.ruleConfirmationDecisionId);
    if (!confirmation) {
      badReference('ruleConfirmation.decisionId', `No existe la confirmación '${input.ruleConfirmationDecisionId}'.`);
    }
    if (
      confirmation.project_id !== input.projectId ||
      confirmation.decision !== 'confirm' ||
      confirmation.rule_id !== rule.rule_id ||
      confirmation.requirement_id !== rule.source_id ||
      confirmation.rule_key !== rule.rule_key ||
      confirmation.module_key !== rule.module_key ||
      confirmation.route_pathname !== rule.route_pathname ||
      confirmation.environment_name !== rule.environment_name ||
      confirmation.tenant_id !== rule.tenant_id ||
      confirmation.role !== rule.role ||
      confirmation.scope_declaration !== rule.scope_declaration
    ) {
      mismatch(
        'ruleConfirmation.decisionId',
        rule.rule_id,
        confirmation.rule_id,
        'La confirmación no corresponde a la regla fuente y a su ámbito.',
      );
    }
    if (confirmation.revision !== ruleRevision) {
      badReference(
        'ruleConfirmation.decisionId',
        `La confirmación corresponde a la revisión ${confirmation.revision}, no a la vigente (${ruleRevision}).`,
      );
    }
    if (confirmation.request_digest !== (rule.source_digest ?? null)) {
      badReference('ruleConfirmation.decisionId', 'El digest de la confirmación no coincide con la regla fuente.');
    }
    ruleConfirmation = {
      decision_id: confirmation.decision_id,
      revision: confirmation.revision,
      request_digest: confirmation.request_digest,
    };
  }

  const scope: LineagedCaseScope = {
    project_id: input.projectId,
    application_id: project.application_id,
    module_key: input.moduleKey,
    environment_id: input.environmentId,
    environment_name: environment.name,
    tenant_id: input.tenantId,
    profile_id: input.profileId,
    role: input.role,
    route_pathname: input.routePathname,
  };

  const includeViewsInLineage = input.hasExplicitViewsArray || resolvedViews.length > 1;

  return {
    scope,
    ruleId: rule.rule_id,
    ruleKey: rule.rule_key,
    ruleRevision,
    executionKey: computeLineagedExecutionKey(scope, rule),
    lineage: {
      dossier: {
        revision_id: revision.revision_id,
        scope_hash: revision.scope_hash,
        content_hash: revision.content_hash,
      },
      view: {
        view_id: primaryResolvedView.view_id,
        route_index: primaryResolvedView.route_index,
        evidence_id: primaryResolvedView.evidence_id,
      },
      ...(includeViewsInLineage ? { views: resolvedViews } : {}),
      controls: primaryResolvedView.controls,
      evidence_ids: [...allEvidenceIds].sort(),
      decision: {
        decision_id: decision.decision_id,
        decision_status: decision.decision_status,
        rule_key: decision.rule_key,
        route_pathname: decision.route_pathname,
        scope_match: decision.scope_match ?? null,
      },
      rule: {
        rule_id: rule.rule_id,
        source_kind: rule.source_kind,
        source_id: rule.source_id,
        source_ref: rule.source_ref,
        source_version: rule.source_version,
        revision: ruleRevision,
        source_digest: rule.source_digest ?? null,
      },
      rule_confirmation: ruleConfirmation,
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Filas SQLite
// ---------------------------------------------------------------------------------------------

function cell(value: unknown): string {
  return typeof value === 'string' ? value : typeof value === 'number' || typeof value === 'bigint' ? String(value) : '';
}
function cellOpt(value: unknown): string | null {
  return value === null || value === undefined ? null : cell(value);
}

/**
 * Determina si una fila pertenece al ámbito canónico de lectura.
 * Si `execution_lineage_json` fue alterado en disco pero `execution_key` sí corresponde al ámbito consultado,
 * devuelve `true` para que `parseLineagedCaseRow` detecte y reporte la corrupción al propietario legítimo.
 * Si la fila pertenece a otro ámbito distinto, devuelve `false` sin revelar existencia ni contenido.
 */
export function rowBelongsToLineagedReadScope(
  row: Record<string, unknown>,
  readScope: NormalizedLineagedReadScope,
): boolean {
  if (cell(row.project_id) !== readScope.projectId) return false;
  if (cell(row.module_key) !== readScope.moduleKey) return false;
  const executionKey = cell(row.execution_key);
  if (!executionKey) return false;

  try {
    const parsed = JSON.parse(cell(row.execution_lineage_json)) as Partial<LineagedCaseDocument>;
    const docScope = parsed?.scope;
    if (docScope && typeof docScope === 'object') {
      const ruleId = parsed?.lineage?.rule?.rule_id ?? parsed?.identity?.rule_id;
      const routeForKey = readScope.routePathname ?? (typeof docScope.route_pathname === 'string' ? docScope.route_pathname : undefined);
      if (typeof ruleId === 'string' && typeof routeForKey === 'string') {
        const expectedKeyForCaller = computeLineagedExecutionKey(
          {
            project_id: readScope.projectId,
            application_id: readScope.applicationId,
            module_key: readScope.moduleKey,
            environment_id: readScope.environmentId,
            environment_name:
              readScope.environmentName ??
              (typeof docScope.environment_name === 'string' ? docScope.environment_name : ''),
            tenant_id: readScope.tenantId,
            profile_id: readScope.profileId,
            role: readScope.role,
            route_pathname: routeForKey,
          },
          { rule_id: ruleId },
        );
        return expectedKeyForCaller === executionKey;
      }
      return false;
    }
  } catch {
    // Si el JSON es ilegible pero las columnas SQL coinciden con proyecto y módulo, solo se expone si no hay filtro de otro ámbito comprobable.
    return false;
  }
  return false;
}

/** Reconstruye el registro y verifica la integridad: recalcula el digest y cruza ID/clave/ámbito. */
export function parseLineagedCaseRow(
  row: Record<string, unknown>,
  expectedScope: NormalizedLineagedReadScope,
): LineagedCaseRecord {
  const scope = normalizeLineagedReadScope(expectedScope);
  if (!rowBelongsToLineagedReadScope(row, scope)) {
    throw new LineagedCaseError('lineaged_case_scope_mismatch', 'La fila no pertenece al ámbito solicitado.', { field: 'scope' });
  }
  const caseId = cell(row.case_id);
  const fail = (reason: string): never => {
    throw new LineagedCaseError('lineaged_case_corrupt', `El caso con linaje '${caseId}' está corrupto: ${reason}.`, {
      case_id: caseId,
    });
  };

  let document: LineagedCaseDocument;
  const executionKey = cell(row.execution_key);
  const version = Number(row.version);
  const storedDigest = cell(row.execution_content_digest);
  try {
    document = JSON.parse(cell(row.execution_lineage_json)) as LineagedCaseDocument;
    if (!document || document.schema !== LINEAGED_CASE_SCHEMA) fail('esquema desconocido');
    if (document.identity.case_id !== caseId || document.tc_case.id !== caseId) fail('ID inconsistente');
    if (document.identity.execution_key !== executionKey) fail('execution_key inconsistente');
    if (document.scope.project_id !== cell(row.project_id)) fail('proyecto inconsistente');
    if (document.scope.module_key !== cell(row.module_key)) fail('módulo inconsistente');
    if (computeLineagedExecutionKey(document.scope, document.lineage.rule) !== executionKey) {
      fail('identidad lógica alterada');
    }
    if (document.lineage.views !== undefined) {
      if (!Array.isArray(document.lineage.views) || document.lineage.views.length === 0) {
        fail('vistas asociadas inválidas');
      }
      const firstView = document.lineage.views[0]!;
      if (
        firstView.view_id !== document.lineage.view.view_id ||
        firstView.route_index !== document.lineage.view.route_index ||
        firstView.evidence_id !== document.lineage.view.evidence_id
      ) {
        fail('vista principal inconsistente con views[0]');
      }
      for (const assocView of document.lineage.views) {
        if (
          !Array.isArray(assocView.evidence_ids) ||
          assocView.evidence_ids.length !== 1 ||
          assocView.evidence_ids[0] !== assocView.evidence_id
        ) {
          fail('evidencia de vista asociada inconsistente');
        }
      }
    }
    if (computeLineagedCaseDigest(document, version) !== storedDigest) fail('digest no coincide con el contenido');
    if (!matchesLineagedReadScope(document.scope, scope)) {
      fail('ámbito persistido inconsistente con el ámbito esperado');
    }
  } catch (error) {
    if (error instanceof LineagedCaseError) throw error;
    return fail('execution_lineage_json ilegible o incompleto');
  }

  return {
    case_id: caseId,
    project_id: cell(row.project_id),
    module_id: cell(row.module_id),
    module_key: cell(row.module_key),
    version,
    execution_key: executionKey,
    title: cell(row.title),
    identity: document.identity,
    scope: document.scope,
    lineage: document.lineage,
    tc_case: document.tc_case,
    execution_content_digest: storedDigest,
    execution_approval_id: cellOpt(row.execution_approval_id),
    conformity_status: cell(row.conformity_status),
    oracle_status: cell(row.oracle_status),
    confirmation_digest: cellOpt(row.confirmation_digest),
    confirmed_by: cellOpt(row.confirmed_by),
    confirmed_at: cellOpt(row.confirmed_at),
    execution_eligible: false,
    created_at: cell(row.created_at),
    updated_at: cell(row.updated_at),
  };
}

export function legacyBlockedError(operation: string, caseId: string): LineagedCaseError {
  return new LineagedCaseError(
    'lineaged_case_legacy_blocked',
    `La operación legacy '${operation}' no puede operar sobre el caso con linaje '${caseId}'. ` +
      'Los candidatos con linaje solo se gestionan por sus operaciones internas dedicadas.',
    { operation, case_id: caseId },
  );
}
