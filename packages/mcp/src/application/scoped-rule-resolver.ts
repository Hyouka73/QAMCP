import { createHash } from 'node:crypto';
import type { ServiceRequirementRecord } from '@qap/shared';

export type RuleSourceKind = 'confirmed_requirement' | 'ingested_doc';
export type RuleAuthorityStatus = 'accredited' | 'unaccredited';
export type RuleScopeDeclaration = 'exact' | 'general_compatible' | 'unscoped_legacy';
export type RuleScopeMatchMode = 'exact' | 'general_compatible';
export type RuleDecisionStatus =
  | 'accredited'
  | 'pending_contradiction'
  | 'unaccredited_pending'
  | 'pending_legacy_scope';

export type RuleAssertType = 'contains' | 'visible' | 'equals' | 'exists' | 'text' | 'count';

export interface ScopedBusinessRuleRecord {
  readonly rule_id: string;
  readonly project_id: string;
  readonly source_kind: RuleSourceKind;
  readonly source_id: string;
  readonly source_ref: string;
  readonly source_version: string;
  readonly source_digest?: string | null;
  readonly module_key: string;
  readonly route_pathname: string;
  readonly environment_name: string | null;
  readonly tenant_id: string | null;
  readonly role: string | null;
  readonly scope_declaration: RuleScopeDeclaration;
  readonly authority_status: RuleAuthorityStatus;
  readonly rule_key: string;
  readonly title: string;
  readonly expected_outcome: string;
  readonly assert_selector?: string | null;
  readonly assert_type?: RuleAssertType | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface UpsertScopedBusinessRuleInput {
  readonly ruleId?: string;
  readonly projectId: string;
  readonly sourceKind: RuleSourceKind;
  readonly sourceId: string;
  readonly sourceRef: string;
  readonly sourceVersion: string;
  readonly sourceDigest?: string | null;
  readonly moduleKey?: string | null;
  readonly routePathname?: string | null;
  readonly environmentName?: string | null;
  readonly tenantId?: string | null;
  readonly role?: string | null;
  readonly scopeDeclaration?: RuleScopeDeclaration;
  readonly authorityStatus: RuleAuthorityStatus;
  readonly ruleKey?: string | null;
  readonly title: string;
  readonly expectedOutcome: string;
  readonly assertSelector?: string | null;
  readonly assertType?: RuleAssertType | null;
}

export interface DossierRuleCandidateEvidence {
  readonly rule_id: string;
  readonly source_kind: RuleSourceKind;
  readonly source_id: string;
  readonly source_ref: string;
  readonly source_version: string;
  readonly scope_declaration: RuleScopeDeclaration;
  readonly scope_match: RuleScopeMatchMode;
  readonly authority_status: RuleAuthorityStatus;
  readonly specificity_score: number;
  readonly authority_rank: number;
  readonly expected_outcome: string;
  readonly assert_selector?: string;
  readonly assert_type?: RuleAssertType;
}

export interface DossierRuleDecision {
  readonly decision_id: string;
  readonly rule_key: string;
  readonly title: string;
  readonly route_pathname: string;
  readonly decision_status: RuleDecisionStatus;
  readonly decision_reason: string;
  readonly expected_outcome?: string;
  readonly assert_selector?: string;
  readonly assert_type?: RuleAssertType;
  readonly source_kind?: RuleSourceKind;
  readonly source_id?: string;
  readonly source_ref?: string;
  readonly source_version?: string;
  readonly scope_match?: RuleScopeMatchMode;
  readonly applied_scope: {
    readonly environment: string;
    readonly tenant_id: string | null;
    readonly role: string | null;
    readonly module_key: string;
  };
  readonly candidates: readonly DossierRuleCandidateEvidence[];
}

export interface DossierRuleAmbiguity {
  readonly ambiguity_id: string;
  readonly code: 'equal_authority_contradiction' | 'unaccredited_expectation' | 'legacy_unscoped_requirement';
  readonly severity: 'blocking' | 'warning';
  readonly rule_key: string;
  readonly route_pathname: string;
  readonly title: string;
  readonly message: string;
  readonly question: string;
  readonly options: ReadonlyArray<{ readonly id: string; readonly label: string }>;
  readonly candidates: readonly DossierRuleCandidateEvidence[];
}

export interface DossierExcludedRuleSource {
  readonly source_kind: RuleSourceKind | 'legacy_requirement' | 'ingested_doc_header';
  readonly source_id: string;
  readonly source_ref: string;
  readonly source_version?: string;
  readonly rule_key?: string;
  readonly reason:
    | 'out_of_scope_environment'
    | 'out_of_scope_tenant'
    | 'out_of_scope_role'
    | 'out_of_scope_module'
    | 'out_of_scope_route'
    | 'unscoped_general_doc'
    | 'superseded_same_source'
    | 'overridden_by_higher_precedence';
  readonly detail: string;
}

export interface DossierObservedEvidenceNote {
  readonly view_id: string;
  readonly evidence_id: string;
  readonly route: string;
  readonly state: string;
  readonly controls_count: number;
  readonly forms_count: number;
  readonly authority: 'observed_only';
  readonly note: string;
}

export interface DiscoveryDossierRuleResolution {
  readonly precedence_policy: readonly string[];
  readonly legacy_compatibility_policy: string;
  readonly decisions: readonly DossierRuleDecision[];
  readonly ambiguities: readonly DossierRuleAmbiguity[];
  readonly excluded_sources: readonly DossierExcludedRuleSource[];
  readonly observed_evidence_notes: readonly DossierObservedEvidenceNote[];
  readonly summary: {
    readonly accredited_count: number;
    readonly pending_contradiction_count: number;
    readonly unaccredited_pending_count: number;
    readonly legacy_pending_count: number;
    readonly excluded_sources_count: number;
    readonly observed_views_count: number;
  };
}

export interface TargetScopeForRules {
  readonly environment_name: string;
  readonly tenant_id: string | null;
  readonly role: string | null;
  readonly module_key: string;
}

export interface RuleDiscoveryViewSummary {
  readonly view_id: string;
  readonly evidence_id: string;
  readonly route: string;
  readonly state: string;
  readonly controls: ReadonlyArray<unknown>;
  readonly forms?: ReadonlyArray<unknown>;
  readonly forms_count?: number;
}

export interface ParseDocRulesInput {
  readonly rawContent: string;
  readonly sourceRef: string;
  readonly docVersion?: string;
  readonly defaultScope?: {
    readonly environment?: string;
    readonly tenant_id?: string;
    readonly role?: string;
    readonly module_key?: string;
    readonly route_pathname?: string;
  };
  readonly explicitRules?: ReadonlyArray<{
    readonly rule_id?: string;
    readonly rule_key?: string;
    readonly title?: string;
    readonly expected_outcome: string;
    readonly route_pathname?: string;
    readonly module_key?: string;
    readonly environment?: string;
    readonly tenant_id?: string;
    readonly role?: string;
    readonly version?: string;
    readonly authority_status?: RuleAuthorityStatus;
    readonly assert_selector?: string;
    readonly assert_type?: RuleAssertType;
  }>;
}

export interface ParsedDocRulesResult {
  readonly docVersion: string;
  readonly hasCompatibleScopeDeclaration: boolean;
  readonly declaredScopeDeclaration: RuleScopeDeclaration;
  readonly rules: readonly Omit<UpsertScopedBusinessRuleInput, 'projectId' | 'sourceKind' | 'sourceId' | 'sourceRef' | 'sourceDigest'>[];
  readonly unscopedReason?: string;
}

const VALID_ASSERT_TYPES: ReadonlySet<string> = new Set(['contains', 'visible', 'equals', 'exists', 'text', 'count']);

export function normalizeScopeToken(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed;
}

export function isWildcardToken(value: string | null | undefined): boolean {
  const norm = normalizeScopeToken(value)?.toLowerCase();
  return norm === '*' || norm === 'all' || norm === 'todos' || norm === 'todas';
}

export function normalizeRuleKey(value: string): string {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned.slice(0, 64) || 'rule';
}

export function normalizeRuleRoute(route: string | null | undefined): string {
  const raw = normalizeScopeToken(route);
  if (!raw || raw === '*') return '*';
  try {
    if (/^https?:\/\//i.test(raw)) {
      const url = new URL(raw);
      return url.pathname || '/';
    }
  } catch {
    // Fall through to relative pathname normalization
  }
  const stripped = raw.split('#')[0]!.split('?')[0]!.trim();
  if (!stripped || stripped === '*') return '*';
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
}

function normalizeAssertType(value: string | null | undefined): RuleAssertType | null {
  const lower = normalizeScopeToken(value)?.toLowerCase();
  if (!lower || !VALID_ASSERT_TYPES.has(lower)) return null;
  return lower as RuleAssertType;
}

function parseAuthorityToken(value: string | null | undefined, defaultStatus: RuleAuthorityStatus): RuleAuthorityStatus {
  const lower = normalizeScopeToken(value)?.toLowerCase();
  if (!lower) return defaultStatus;
  if (
    lower === 'accredited' ||
    lower === 'acreditada' ||
    lower === 'confirmed' ||
    lower === 'confirmada' ||
    lower === 'approved'
  ) {
    return 'accredited';
  }
  if (
    lower === 'unaccredited' ||
    lower === 'sin_acreditar' ||
    lower === 'draft' ||
    lower === 'borrador' ||
    lower === 'hypothesis' ||
    lower === 'hipotesis' ||
    lower === 'inferred' ||
    lower === 'pending' ||
    lower === 'unconfirmed'
  ) {
    return 'unaccredited';
  }
  return defaultStatus;
}

function parseScopeSpecString(spec: string): {
  environment?: string;
  tenant_id?: string;
  role?: string;
  module_key?: string;
  route_pathname?: string;
  explicitGeneral?: boolean;
} {
  const out: {
    environment?: string;
    tenant_id?: string;
    role?: string;
    module_key?: string;
    route_pathname?: string;
    explicitGeneral?: boolean;
  } = {};
  const trimmed = spec.trim();
  if (!trimmed) return out;
  if (/\b(general|compatible|global)\b/i.test(trimmed)) {
    out.explicitGeneral = true;
  }

  const pairRegex = /(env(?:ironment)?|entorno|tenant(?:_id)?|rol(?:e)?|mod(?:ule|ulo)?(?:_key)?|route(?:_pathname)?|ruta)\s*[:=]\s*([^\s,;)]+(?:\s*,\s*[^\s,;)]+)*?)(?=(?:\s*[,;]\s*(?:env(?:ironment)?|entorno|tenant(?:_id)?|rol(?:e)?|mod(?:ule|ulo)?(?:_key)?|route(?:_pathname)?|ruta)\s*[:=]|$|\)))/gi;
  let match: RegExpExecArray | null;
  while ((match = pairRegex.exec(trimmed)) !== null) {
    const key = match[1]!.toLowerCase();
    const val = match[2]!.trim().replace(/^["']|["']$/g, '');
    if (!val) continue;
    if (key.startsWith('env') || key === 'entorno') out.environment = val;
    else if (key.startsWith('tenant')) out.tenant_id = val;
    else if (key.startsWith('rol')) out.role = val;
    else if (key.startsWith('mod')) out.module_key = val;
    else if (key.startsWith('route') || key === 'ruta') out.route_pathname = val;
  }
  return out;
}

function parseHeaderMetadata(lines: readonly string[]): {
  version?: string;
  environment?: string;
  tenant_id?: string;
  role?: string;
  module_key?: string;
  route_pathname?: string;
  status?: RuleAuthorityStatus;
  explicitGeneral: boolean;
  unscopedExplicit: boolean;
} {
  const meta: {
    version?: string;
    environment?: string;
    tenant_id?: string;
    role?: string;
    module_key?: string;
    route_pathname?: string;
    status?: RuleAuthorityStatus;
    explicitGeneral: boolean;
    unscopedExplicit: boolean;
  } = {
    explicitGeneral: false,
    unscopedExplicit: false,
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line === '---' || line.startsWith('#')) continue;
    // Stop scanning top-level header once a rule section starts
    if (/^-\s*\[RULE\b/i.test(line)) break;
    const kv = line.match(/^([A-Za-z_-]+)\s*:\s*(.+)$/);
    if (!kv) continue;
    const key = kv[1]!.toLowerCase();
    const val = kv[2]!.trim();

    if (key === 'version' || key === 'doc_version') meta.version = val;
    else if (key === 'environment' || key === 'env' || key === 'entorno') meta.environment = val;
    else if (key === 'tenant' || key === 'tenant_id') meta.tenant_id = val;
    else if (key === 'role' || key === 'rol') meta.role = val;
    else if (key === 'module' || key === 'modulo' || key === 'module_key') meta.module_key = val;
    else if (key === 'route' || key === 'ruta' || key === 'route_pathname') meta.route_pathname = val;
    else if (key === 'status' || key === 'estado' || key === 'authority' || key === 'authority_status') {
      meta.status = parseAuthorityToken(val, 'accredited');
    } else if (key === 'scope' || key === 'alcance' || key === 'compatible') {
      if (/\b(unspecified|unscoped|ninguno|sin_alcance)\b/i.test(val)) {
        meta.unscopedExplicit = true;
      }
      const parsed = parseScopeSpecString(val);
      if (parsed.explicitGeneral) meta.explicitGeneral = true;
      if (parsed.environment) meta.environment = parsed.environment;
      if (parsed.tenant_id) meta.tenant_id = parsed.tenant_id;
      if (parsed.role) meta.role = parsed.role;
      if (parsed.module_key) meta.module_key = parsed.module_key;
      if (parsed.route_pathname) meta.route_pathname = parsed.route_pathname;
    }
  }
  return meta;
}

function resolveScopeFields(
  env: string | undefined,
  tenant: string | undefined,
  role: string | undefined,
  explicitGeneral: boolean,
): {
  environmentName: string | null;
  tenantId: string | null;
  role: string | null;
  declaration: RuleScopeDeclaration;
  isComplete: boolean;
} {
  const e = normalizeScopeToken(env);
  const t = normalizeScopeToken(tenant);
  const r = normalizeScopeToken(role);
  const isComplete = Boolean(e && t && r);
  if (!isComplete) {
    return {
      environmentName: e,
      tenantId: t,
      role: r,
      declaration: 'unscoped_legacy',
      isComplete: false,
    };
  }
  const hasWildcardOrList =
    explicitGeneral ||
    isWildcardToken(e) ||
    isWildcardToken(t) ||
    isWildcardToken(r) ||
    Boolean(e?.includes(',')) ||
    Boolean(t?.includes(',')) ||
    Boolean(r?.includes(','));
  return {
    environmentName: e,
    tenantId: t,
    role: r,
    declaration: hasWildcardOrList ? 'general_compatible' : 'exact',
    isComplete: true,
  };
}

function parseInlineAttributes(attrText: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /([a-zA-Z_][a-zA-Z0-9_-]*)=("([^"]*)"|'([^']*)'|([^\s\]]+))/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(attrText)) !== null) {
    const k = m[1]!.toLowerCase();
    const v = m[3] ?? m[4] ?? m[5] ?? '';
    attrs[k] = v.trim();
  }
  return attrs;
}

/**
 * Deterministically parses scoped business rules from an ingested document and/or
 * explicit structured rule declarations. Never synthesizes or guesses missing scopes:
 * a document/rule without explicit (environment, tenant, role) scope stays unscoped
 * and cannot accredit assertions for any scoped target.
 */
export function parseScopedRulesFromDocument(input: ParseDocRulesInput): ParsedDocRulesResult {
  const lines = input.rawContent.split(/\r?\n/);
  const docMeta = parseHeaderMetadata(lines);
  const docShaShort = createHash('sha256').update(input.rawContent, 'utf8').digest('hex').slice(0, 10);
  const docVersion = normalizeScopeToken(input.docVersion) ?? docMeta.version ?? `sha256:${docShaShort}`;

  const docEnv = normalizeScopeToken(input.defaultScope?.environment) ?? docMeta.environment;
  const docTenant = normalizeScopeToken(input.defaultScope?.tenant_id) ?? docMeta.tenant_id;
  const docRole = normalizeScopeToken(input.defaultScope?.role) ?? docMeta.role;
  const docModule = normalizeScopeToken(input.defaultScope?.module_key) ?? docMeta.module_key ?? '*';
  const docRoute = normalizeRuleRoute(input.defaultScope?.route_pathname ?? docMeta.route_pathname ?? '*');
  const docAuthority: RuleAuthorityStatus = docMeta.status ?? 'accredited';

  const docScopeResolved = docMeta.unscopedExplicit
    ? { environmentName: null, tenantId: null, role: null, declaration: 'unscoped_legacy' as const, isComplete: false }
    : resolveScopeFields(docEnv ?? undefined, docTenant ?? undefined, docRole ?? undefined, docMeta.explicitGeneral);

  const collected: Omit<UpsertScopedBusinessRuleInput, 'projectId' | 'sourceKind' | 'sourceId' | 'sourceRef' | 'sourceDigest'>[] = [];

  // 1. Explicit rules provided by caller alongside qap_context_ingest / saveIngestedDocument
  for (const r of input.explicitRules ?? []) {
    const expected = r.expected_outcome?.trim();
    if (!expected) continue;
    const resolved = resolveScopeFields(
      normalizeScopeToken(r.environment) ?? docScopeResolved.environmentName ?? undefined,
      normalizeScopeToken(r.tenant_id) ?? docScopeResolved.tenantId ?? undefined,
      normalizeScopeToken(r.role) ?? docScopeResolved.role ?? undefined,
      docMeta.explicitGeneral,
    );
    const title = r.title?.trim() || expected.slice(0, 80);
    const ruleKey = normalizeRuleKey(r.rule_key?.trim() || title);
    collected.push({
      ...(r.rule_id ? { ruleId: r.rule_id } : {}),
      sourceVersion: normalizeScopeToken(r.version) ?? docVersion,
      moduleKey: normalizeScopeToken(r.module_key) ?? docModule,
      routePathname: normalizeRuleRoute(r.route_pathname ?? docRoute),
      environmentName: resolved.environmentName,
      tenantId: resolved.tenantId,
      role: resolved.role,
      scopeDeclaration: resolved.declaration,
      authorityStatus: r.authority_status ?? docAuthority,
      ruleKey,
      title,
      expectedOutcome: expected,
      assertSelector: normalizeScopeToken(r.assert_selector),
      assertType: normalizeAssertType(r.assert_type),
    });
  }

  // 2. Inline bullet rules: - [RULE key=... env=... tenant=... role=... route=... version=... status=...] Title: Expected outcome
  for (const rawLine of lines) {
    const m = rawLine.trim().match(/^[-*]\s*\[(?:RULE|REGLA)\s+([^\]]+)\]\s*(.+)$/i);
    if (!m) continue;
    const attrs = parseInlineAttributes(m[1]!);
    const body = m[2]!.trim();
    const colonIdx = body.indexOf(':');
    const title = (colonIdx > 0 ? body.slice(0, colonIdx) : body).trim();
    const expectedOutcome = (colonIdx > 0 ? body.slice(colonIdx + 1) : body).trim();
    if (!expectedOutcome) continue;

    const resolved = resolveScopeFields(
      attrs.env ?? attrs.environment ?? attrs.entorno ?? docScopeResolved.environmentName ?? undefined,
      attrs.tenant ?? attrs.tenant_id ?? docScopeResolved.tenantId ?? undefined,
      attrs.role ?? attrs.rol ?? docScopeResolved.role ?? undefined,
      docMeta.explicitGeneral || Boolean(attrs.scope && /\bgeneral\b/i.test(attrs.scope)),
    );
    const ruleKey = normalizeRuleKey(attrs.key ?? attrs.rule_key ?? title);
    collected.push({
      ...(attrs.id ? { ruleId: attrs.id } : {}),
      sourceVersion: normalizeScopeToken(attrs.version) ?? docVersion,
      moduleKey: normalizeScopeToken(attrs.module ?? attrs.module_key ?? attrs.modulo) ?? docModule,
      routePathname: normalizeRuleRoute(attrs.route ?? attrs.ruta ?? docRoute),
      environmentName: resolved.environmentName,
      tenantId: resolved.tenantId,
      role: resolved.role,
      scopeDeclaration: resolved.declaration,
      authorityStatus: parseAuthorityToken(attrs.status ?? attrs.estado, docAuthority),
      ruleKey,
      title: title || expectedOutcome.slice(0, 80),
      expectedOutcome,
      assertSelector: normalizeScopeToken(attrs.selector),
      assertType: normalizeAssertType(attrs.assert ?? attrs.assert_type),
    });
  }

  // 3. Section block rules: ### Rule: <title> or ## Regla: <title>
  interface SectionDraft {
    title: string;
    ruleKey?: string;
    route?: string;
    module?: string;
    environment?: string;
    tenant?: string;
    role?: string;
    version?: string;
    status?: RuleAuthorityStatus;
    expected?: string;
    selector?: string;
    assertType?: RuleAssertType | null;
    explicitGeneral?: boolean;
  }
  let currentSection: SectionDraft | null = null;
  const flushSection = () => {
    if (!currentSection?.expected?.trim()) return;
    const expected = currentSection.expected.trim();
    const resolved = resolveScopeFields(
      currentSection.environment ?? docScopeResolved.environmentName ?? undefined,
      currentSection.tenant ?? docScopeResolved.tenantId ?? undefined,
      currentSection.role ?? docScopeResolved.role ?? undefined,
      Boolean(currentSection.explicitGeneral || docMeta.explicitGeneral),
    );
    collected.push({
      sourceVersion: currentSection.version ?? docVersion,
      moduleKey: currentSection.module ?? docModule,
      routePathname: normalizeRuleRoute(currentSection.route ?? docRoute),
      environmentName: resolved.environmentName,
      tenantId: resolved.tenantId,
      role: resolved.role,
      scopeDeclaration: resolved.declaration,
      authorityStatus: currentSection.status ?? docAuthority,
      ruleKey: normalizeRuleKey(currentSection.ruleKey ?? currentSection.title),
      title: currentSection.title,
      expectedOutcome: expected,
      assertSelector: normalizeScopeToken(currentSection.selector),
      assertType: currentSection.assertType ?? null,
    });
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const secMatch = line.match(/^#{2,4}\s*(?:Rule|Regla)\s*:\s*(.+)$/i);
    if (secMatch) {
      flushSection();
      currentSection = { title: secMatch[1]!.trim() };
      continue;
    }
    if (!currentSection) continue;
    if (/^#{1,4}\s+/.test(line)) {
      flushSection();
      currentSection = null;
      continue;
    }
    const kv = line.match(/^([A-Za-z_-]+)\s*:\s*(.+)$/);
    if (!kv) continue;
    const k = kv[1]!.toLowerCase();
    const v = kv[2]!.trim();
    if (k === 'rule-key' || k === 'rule_key' || k === 'key' || k === 'clave') currentSection.ruleKey = v;
    else if (k === 'route' || k === 'ruta' || k === 'route_pathname') currentSection.route = v;
    else if (k === 'module' || k === 'modulo' || k === 'module_key') currentSection.module = v;
    else if (k === 'environment' || k === 'env' || k === 'entorno') currentSection.environment = v;
    else if (k === 'tenant' || k === 'tenant_id') currentSection.tenant = v;
    else if (k === 'role' || k === 'rol') currentSection.role = v;
    else if (k === 'version') currentSection.version = v;
    else if (k === 'status' || k === 'estado' || k === 'authority') {
      currentSection.status = parseAuthorityToken(v, docAuthority);
    } else if (k === 'scope' || k === 'alcance' || k === 'compatible') {
      const parsed = parseScopeSpecString(v);
      if (parsed.explicitGeneral) currentSection.explicitGeneral = true;
      if (parsed.environment) currentSection.environment = parsed.environment;
      if (parsed.tenant_id) currentSection.tenant = parsed.tenant_id;
      if (parsed.role) currentSection.role = parsed.role;
      if (parsed.module_key) currentSection.module = parsed.module_key;
      if (parsed.route_pathname) currentSection.route = parsed.route_pathname;
    } else if (k === 'expected' || k === 'expectativa' || k === 'expected_outcome') {
      currentSection.expected = v;
    } else if (k === 'selector' || k === 'assert_selector') {
      currentSection.selector = v;
    } else if (k === 'assert' || k === 'assert_type') {
      currentSection.assertType = normalizeAssertType(v);
    }
  }
  flushSection();

  const hasAnyScopedRule = collected.some((r) => r.scopeDeclaration !== 'unscoped_legacy');
  const hasCompatibleScopeDeclaration = docScopeResolved.isComplete || hasAnyScopedRule;
  const unscopedReason = hasCompatibleScopeDeclaration
    ? undefined
    : `El documento '${input.sourceRef}' no declara un ámbito compatible explícito (environment, tenant, role); no aplica silenciosamente.`;

  return {
    docVersion,
    hasCompatibleScopeDeclaration,
    declaredScopeDeclaration: docScopeResolved.declaration,
    rules: collected,
    ...(unscopedReason ? { unscopedReason } : {}),
  };
}

function matchScopeValue(
  ruleValue: string | null | undefined,
  targetValue: string | null | undefined,
): { matched: boolean; exact: boolean } {
  const r = normalizeScopeToken(ruleValue);
  if (!r) return { matched: false, exact: false };
  const t = normalizeScopeToken(targetValue);
  if (isWildcardToken(r)) {
    return { matched: true, exact: false };
  }
  if (!t) {
    // Only anonymous/unauthenticated target could match explicit 'anonymous'
    return { matched: r.toLowerCase() === 'anonymous', exact: r.toLowerCase() === 'anonymous' };
  }
  const tokens = r.split(',').map((item) => item.trim()).filter(Boolean);
  if (tokens.length > 1) {
    const listMatch = tokens.some((tok) => isWildcardToken(tok) || tok.toLowerCase() === t.toLowerCase());
    return { matched: listMatch, exact: false };
  }
  const exact = r.toLowerCase() === t.toLowerCase();
  return { matched: exact, exact };
}

function matchRouteScope(
  ruleRoute: string,
  targetRoutes: ReadonlySet<string>,
  primaryRoute: string,
): { matched: boolean; exact: boolean; resolvedRoute: string } {
  const norm = normalizeRuleRoute(ruleRoute);
  if (norm === '*') {
    return { matched: true, exact: false, resolvedRoute: primaryRoute };
  }
  if (targetRoutes.has(norm)) {
    return { matched: true, exact: true, resolvedRoute: norm };
  }
  return { matched: false, exact: false, resolvedRoute: norm };
}

function normalizeExpectedOutcome(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

function compareVersionDescending(a: string, b: string): number {
  const parseSemver = (v: string): number[] | null => {
    const m = v.trim().replace(/^v/i, '').match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?$/);
    if (!m) return null;
    return [Number(m[1] ?? 0), Number(m[2] ?? 0), Number(m[3] ?? 0)];
  };
  const sa = parseSemver(a);
  const sb = parseSemver(b);
  if (sa && sb) {
    for (let i = 0; i < 3; i += 1) {
      if (sa[i]! !== sb[i]!) return sb[i]! - sa[i]!;
    }
    return 0;
  }
  return b.localeCompare(a);
}

export const DEFAULT_PRECEDENCE_POLICY: readonly string[] = [
  '1. Coincidencia estricta por alcance: environment, tenant_id, role y module_key deben coincidir explícitamente (o estar declarados en un documento general compatible con ese alcance). Nunca hay fallback entre entornos, tenants o roles distintos.',
  '2. Especificidad de alcance: regla exacta de (environment, tenant, role, module, route) > regla exacta de módulo con ruta "*" > documento general que declara compatibilidad explícita.',
  '3. Autoridad a igual especificidad: requisito confirmado por QA con procedencia (confirmed_requirement) > documento de negocio versionado y acreditado (ingested_doc).',
  '4. Contradicciones de igual autoridad o expectativas sin acreditar permanecen en estado pendiente (pending_oracle) y nunca generan aserciones ejecutables.',
  '5. Evidencia DOM y observaciones Knowledge son estrictamente descriptivas (observed_only) y nunca acreditan reglas de negocio.',
];

export const DEFAULT_LEGACY_COMPATIBILITY_POLICY =
  'Los datos históricos y documentos generales sin declaración explícita de alcance (environment, tenant, role) quedan excluidos o retenidos como pending_legacy_scope para confirmación explícita; nunca se promueven automáticamente como reglas válidas de un alcance específico.';

/**
 * Resolves accredited business rule expectations, conflicts, unaccredited claims,
 * excluded out-of-scope/general sources, and descriptive DOM notes for a Discovery scope.
 */
export function resolveScopedBusinessRules(params: {
  readonly scope: TargetScopeForRules;
  readonly targetPathname: string;
  readonly discoveredRoutes: ReadonlyArray<{ readonly pathname: string }>;
  readonly views: ReadonlyArray<RuleDiscoveryViewSummary>;
  readonly scopedRules: ReadonlyArray<ScopedBusinessRuleRecord>;
  readonly ingestedDocs: ReadonlyArray<{
    readonly doc_id: string;
    readonly source_ref: string;
    readonly sha256: string;
    readonly ingested_at: string;
    readonly raw_scope_note?: string;
  }>;
  readonly legacyRequirements: ReadonlyArray<ServiceRequirementRecord>;
}): DiscoveryDossierRuleResolution {
  const primaryRoute = normalizeRuleRoute(params.targetPathname);
  const targetRoutes = new Set<string>([primaryRoute]);
  for (const r of params.discoveredRoutes) {
    targetRoutes.add(normalizeRuleRoute(r.pathname));
  }

  const excludedSources: DossierExcludedRuleSource[] = [];
  interface MatchedCandidate {
    rule: ScopedBusinessRuleRecord;
    resolvedRoute: string;
    scopeMatch: RuleScopeMatchMode;
    specificityScore: number;
    authorityRank: number;
  }
  const matchedCandidates: MatchedCandidate[] = [];

  for (const rule of params.scopedRules) {
    if (rule.scope_declaration === 'unscoped_legacy') {
      excludedSources.push({
        source_kind: rule.source_kind,
        source_id: rule.source_id,
        source_ref: rule.source_ref,
        source_version: rule.source_version,
        rule_key: rule.rule_key,
        reason: 'unscoped_general_doc',
        detail: 'La fuente no declara un alcance compatible completo (environment, tenant, role).',
      });
      continue;
    }

    const envMatch = matchScopeValue(rule.environment_name, params.scope.environment_name);
    if (!envMatch.matched) {
      excludedSources.push({
        source_kind: rule.source_kind,
        source_id: rule.source_id,
        source_ref: rule.source_ref,
        source_version: rule.source_version,
        rule_key: rule.rule_key,
        reason: 'out_of_scope_environment',
        detail: `Entorno de la regla '${rule.environment_name ?? 'ninguno'}' != '${params.scope.environment_name}'.`,
      });
      continue;
    }

    const tenantMatch = matchScopeValue(rule.tenant_id, params.scope.tenant_id);
    if (!tenantMatch.matched) {
      excludedSources.push({
        source_kind: rule.source_kind,
        source_id: rule.source_id,
        source_ref: rule.source_ref,
        source_version: rule.source_version,
        rule_key: rule.rule_key,
        reason: 'out_of_scope_tenant',
        detail: `Tenant de la regla '${rule.tenant_id ?? 'ninguno'}' != '${params.scope.tenant_id}'.`,
      });
      continue;
    }

    const roleMatch = matchScopeValue(rule.role, params.scope.role);
    if (!roleMatch.matched) {
      excludedSources.push({
        source_kind: rule.source_kind,
        source_id: rule.source_id,
        source_ref: rule.source_ref,
        source_version: rule.source_version,
        rule_key: rule.rule_key,
        reason: 'out_of_scope_role',
        detail: `Rol de la regla '${rule.role ?? 'ninguno'}' != '${params.scope.role ?? 'sin rol'}'.`,
      });
      continue;
    }

    const modMatch = matchScopeValue(rule.module_key, params.scope.module_key);
    if (!modMatch.matched) {
      excludedSources.push({
        source_kind: rule.source_kind,
        source_id: rule.source_id,
        source_ref: rule.source_ref,
        source_version: rule.source_version,
        rule_key: rule.rule_key,
        reason: 'out_of_scope_module',
        detail: `Módulo de la regla '${rule.module_key}' != '${params.scope.module_key}'.`,
      });
      continue;
    }

    const routeMatch = matchRouteScope(rule.route_pathname, targetRoutes, primaryRoute);
    if (!routeMatch.matched) {
      excludedSources.push({
        source_kind: rule.source_kind,
        source_id: rule.source_id,
        source_ref: rule.source_ref,
        source_version: rule.source_version,
        rule_key: rule.rule_key,
        reason: 'out_of_scope_route',
        detail: `Ruta de la regla '${rule.route_pathname}' fuera de las rutas del módulo.`,
      });
      continue;
    }

    const isAllScopeExact =
      rule.scope_declaration === 'exact' &&
      envMatch.exact &&
      tenantMatch.exact &&
      roleMatch.exact;
    const scopeMatch: RuleScopeMatchMode = isAllScopeExact ? 'exact' : 'general_compatible';
    const specificityScore =
      (scopeMatch === 'exact' ? 200 : 100) +
      (envMatch.exact ? 20 : 0) +
      (tenantMatch.exact ? 20 : 0) +
      (roleMatch.exact ? 20 : 0) +
      (modMatch.exact ? 15 : 0) +
      (routeMatch.exact ? 15 : 0);
    const authorityRank = rule.source_kind === 'confirmed_requirement' ? 2 : 1;

    matchedCandidates.push({
      rule,
      resolvedRoute: routeMatch.resolvedRoute,
      scopeMatch,
      specificityScore,
      authorityRank,
    });
  }

  // Flag ingested documents that declared no compatible scoped rules
  const docIdsWithRules = new Set(params.scopedRules.filter((r) => r.source_kind === 'ingested_doc').map((r) => r.source_id));
  for (const doc of params.ingestedDocs) {
    if (!docIdsWithRules.has(doc.doc_id)) {
      excludedSources.push({
        source_kind: 'ingested_doc_header',
        source_id: doc.doc_id,
        source_ref: doc.source_ref,
        source_version: `sha256:${doc.sha256.slice(0, 10)}`,
        reason: 'unscoped_general_doc',
        detail: `El documento '${doc.source_ref}' no declara un ámbito compatible (environment/tenant/role) ni reglas aplicables.`,
      });
    }
  }

  // Deduplicate superseded revisions from identical (source_kind, source_ref, rule_key, resolvedRoute) across different source_id
  const bySourceRefKey = new Map<string, MatchedCandidate[]>();
  for (const cand of matchedCandidates) {
    const key = `${cand.rule.source_kind}::${cand.rule.source_ref}::${cand.rule.rule_key}::${cand.resolvedRoute}::${cand.scopeMatch}`;
    const bucket = bySourceRefKey.get(key) ?? [];
    bucket.push(cand);
    bySourceRefKey.set(key, bucket);
  }
  const activeCandidates: MatchedCandidate[] = [];
  for (const bucket of bySourceRefKey.values()) {
    const distinctSourceIds = new Set(bucket.map((b) => b.rule.source_id));
    if (distinctSourceIds.size <= 1) {
      activeCandidates.push(...bucket);
      continue;
    }
    const sorted = [...bucket].sort((a, b) => {
      const verCmp = compareVersionDescending(a.rule.source_version, b.rule.source_version);
      if (verCmp !== 0) return verCmp;
      return b.rule.updated_at.localeCompare(a.rule.updated_at);
    });
    const newest = sorted[0]!;
    for (const item of sorted) {
      if (item.rule.source_id === newest.rule.source_id) {
        activeCandidates.push(item);
      } else {
        excludedSources.push({
          source_kind: item.rule.source_kind,
          source_id: item.rule.source_id,
          source_ref: item.rule.source_ref,
          source_version: item.rule.source_version,
          rule_key: item.rule.rule_key,
          reason: 'superseded_same_source',
          detail: `Reemplazada por versión '${newest.rule.source_version}' de la misma fuente '${newest.rule.source_ref}'.`,
        });
      }
    }
  }

  // Group competing rules by (resolvedRoute, rule_key)
  const grouped = new Map<string, MatchedCandidate[]>();
  for (const cand of activeCandidates) {
    const gKey = `${cand.resolvedRoute}::${cand.rule.rule_key}`;
    const list = grouped.get(gKey) ?? [];
    list.push(cand);
    grouped.set(gKey, list);
  }

  const toEvidence = (c: MatchedCandidate): DossierRuleCandidateEvidence => ({
    rule_id: c.rule.rule_id,
    source_kind: c.rule.source_kind,
    source_id: c.rule.source_id,
    source_ref: c.rule.source_ref,
    source_version: c.rule.source_version,
    scope_declaration: c.rule.scope_declaration,
    scope_match: c.scopeMatch,
    authority_status: c.rule.authority_status,
    specificity_score: c.specificityScore,
    authority_rank: c.authorityRank,
    expected_outcome: c.rule.expected_outcome,
    ...(c.rule.assert_selector ? { assert_selector: c.rule.assert_selector } : {}),
    ...(c.rule.assert_type ? { assert_type: c.rule.assert_type } : {}),
  });

  const decisions: DossierRuleDecision[] = [];
  const ambiguities: DossierRuleAmbiguity[] = [];
  const sortedGroupKeys = [...grouped.keys()].sort();

  for (const gKey of sortedGroupKeys) {
    const group = grouped.get(gKey)!;
    const routePath = group[0]!.resolvedRoute;
    const ruleKey = group[0]!.rule.rule_key;
    const accredited = group.filter((c) => c.rule.authority_status === 'accredited');
    const unaccredited = group.filter((c) => c.rule.authority_status === 'unaccredited');

    if (accredited.length > 0) {
      const sortedAcc = [...accredited].sort((a, b) => {
        if (b.specificityScore !== a.specificityScore) return b.specificityScore - a.specificityScore;
        if (b.authorityRank !== a.authorityRank) return b.authorityRank - a.authorityRank;
        return a.rule.rule_id.localeCompare(b.rule.rule_id);
      });
      const top = sortedAcc[0]!;
      const topTier = sortedAcc.filter(
        (c) => c.specificityScore === top.specificityScore && c.authorityRank === top.authorityRank,
      );
      for (const lower of sortedAcc) {
        if (lower.specificityScore < top.specificityScore || lower.authorityRank < top.authorityRank) {
          excludedSources.push({
            source_kind: lower.rule.source_kind,
            source_id: lower.rule.source_id,
            source_ref: lower.rule.source_ref,
            source_version: lower.rule.source_version,
            rule_key: lower.rule.rule_key,
            reason: 'overridden_by_higher_precedence',
            detail: `Descartada por mayor precedencia de '${top.rule.source_ref}' (${top.rule.source_version}).`,
          });
        }
      }

      const distinctOutcomes = new Map<string, MatchedCandidate>();
      for (const item of topTier) {
        const normOut = normalizeExpectedOutcome(item.rule.expected_outcome);
        if (!distinctOutcomes.has(normOut)) {
          distinctOutcomes.set(normOut, item);
        }
      }

      const candidateEvidence = topTier.map(toEvidence);
      if (distinctOutcomes.size > 1) {
        const conflictId = `amb-contradiction-${createHash('sha256')
          .update(`${params.scope.environment_name}|${params.scope.tenant_id}|${params.scope.role ?? ''}|${routePath}|${ruleKey}`)
          .digest('hex')
          .slice(0, 10)}`;
        const summaryParts = [...distinctOutcomes.values()].map(
          (c) => `'${c.rule.expected_outcome}' (${c.rule.source_ref} @ ${c.rule.source_version})`,
        );
        decisions.push({
          decision_id: `dec-${ruleKey}-${routePath.replace(/[^a-z0-9]/gi, '_')}`,
          rule_key: ruleKey,
          title: top.rule.title,
          route_pathname: routePath,
          decision_status: 'pending_contradiction',
          decision_reason: `Contradicción de igual autoridad entre fuentes acreditadas: ${summaryParts.join(' vs ')}. Permanece pendiente sin generar oráculo.`,
          applied_scope: {
            environment: params.scope.environment_name,
            tenant_id: params.scope.tenant_id,
            role: params.scope.role,
            module_key: params.scope.module_key,
          },
          candidates: candidateEvidence,
        });
        ambiguities.push({
          ambiguity_id: conflictId,
          code: 'equal_authority_contradiction',
          severity: 'blocking',
          rule_key: ruleKey,
          route_pathname: routePath,
          title: top.rule.title,
          message: `Contradicción de igual autoridad para '${ruleKey}' en '${routePath}' (${params.scope.environment_name}/${params.scope.tenant_id}/${params.scope.role ?? 'sin-rol'}): ${summaryParts.join(' vs ')}.`,
          question: `¿Cuál es la expectativa vigente para '${top.rule.title}' en '${routePath}' (${params.scope.tenant_id} / ${params.scope.role ?? 'default'})?`,
          options: [...distinctOutcomes.values()].map((c, idx) => ({
            id: `opt_${idx + 1}`,
            label: `${c.rule.expected_outcome} [${c.rule.source_ref} v${c.rule.source_version}]`,
          })),
          candidates: candidateEvidence,
        });
      } else {
        decisions.push({
          decision_id: `dec-${ruleKey}-${routePath.replace(/[^a-z0-9]/gi, '_')}`,
          rule_key: ruleKey,
          title: top.rule.title,
          route_pathname: routePath,
          decision_status: 'accredited',
          decision_reason: `Acreditada por '${top.rule.source_kind}' (${top.rule.source_ref}, versión ${top.rule.source_version}, alcance ${top.scopeMatch}).`,
          expected_outcome: top.rule.expected_outcome,
          ...(top.rule.assert_selector ? { assert_selector: top.rule.assert_selector } : {}),
          ...(top.rule.assert_type ? { assert_type: top.rule.assert_type } : {}),
          source_kind: top.rule.source_kind,
          source_id: top.rule.source_id,
          source_ref: top.rule.source_ref,
          source_version: top.rule.source_version,
          scope_match: top.scopeMatch,
          applied_scope: {
            environment: params.scope.environment_name,
            tenant_id: params.scope.tenant_id,
            role: params.scope.role,
            module_key: params.scope.module_key,
          },
          candidates: candidateEvidence,
        });
      }
      continue;
    }

    // Only unaccredited candidates exist in this group -> remain pending
    if (unaccredited.length > 0) {
      const sortedUnacc = [...unaccredited].sort((a, b) => a.rule.rule_id.localeCompare(b.rule.rule_id));
      const first = sortedUnacc[0]!;
      const candEvidence = sortedUnacc.map(toEvidence);
      const ambId = `amb-unacc-${createHash('sha256')
        .update(`${routePath}|${ruleKey}|${first.rule.source_id}`)
        .digest('hex')
        .slice(0, 10)}`;
      decisions.push({
        decision_id: `dec-${ruleKey}-${routePath.replace(/[^a-z0-9]/gi, '_')}`,
        rule_key: ruleKey,
        title: first.rule.title,
        route_pathname: routePath,
        decision_status: 'unaccredited_pending',
        decision_reason: `Expectativa sin respaldo acreditado (${first.rule.source_ref}, versión ${first.rule.source_version}, estado unaccredited). No genera oráculo.`,
        applied_scope: {
          environment: params.scope.environment_name,
          tenant_id: params.scope.tenant_id,
          role: params.scope.role,
          module_key: params.scope.module_key,
        },
        candidates: candEvidence,
      });
      ambiguities.push({
        ambiguity_id: ambId,
        code: 'unaccredited_expectation',
        severity: 'blocking',
        rule_key: ruleKey,
        route_pathname: routePath,
        title: first.rule.title,
        message: `La expectativa '${first.rule.title}' (${first.rule.source_ref} @ ${first.rule.source_version}) carece de acreditación y queda pendiente sin generar oráculo.`,
        question: `¿Confirmas acreditar o descartar la expectativa '${first.rule.expected_outcome}' en '${routePath}'?`,
        options: [
          { id: 'confirm_rule', label: `Confirmar regla para ${params.scope.tenant_id}/${params.scope.role ?? 'default'}` },
          { id: 'discard_rule', label: 'Descartar expectativa sin acreditar' },
        ],
        candidates: candEvidence,
      });
    }
  }

  // Legacy service_requirements without scope metadata -> never auto-promoted to scoped oracles
  const scopedReqIds = new Set(
    params.scopedRules.filter((r) => r.source_kind === 'confirmed_requirement').map((r) => r.source_id),
  );
  for (const legacyReq of [...params.legacyRequirements].sort((a, b) => a.requirement_id.localeCompare(b.requirement_id))) {
    if (scopedReqIds.has(legacyReq.requirement_id)) continue;
    if (legacyReq.module_key !== params.scope.module_key) continue;
    const ruleKey = normalizeRuleKey(`legacy_${legacyReq.requirement_id}`);
    const cand: DossierRuleCandidateEvidence = {
      rule_id: `legacy-${legacyReq.requirement_id}`,
      source_kind: 'confirmed_requirement',
      source_id: legacyReq.requirement_id,
      source_ref: `service_requirement:${legacyReq.requirement_id}`,
      source_version: `rev:${legacyReq.revision}`,
      scope_declaration: 'unscoped_legacy',
      scope_match: 'general_compatible',
      authority_status: 'unaccredited',
      specificity_score: 0,
      authority_rank: 0,
      expected_outcome: legacyReq.acceptance_criteria[0] ?? legacyReq.description,
    };
    decisions.push({
      decision_id: `dec-${ruleKey}`,
      rule_key: ruleKey,
      title: legacyReq.title,
      route_pathname: primaryRoute,
      decision_status: 'pending_legacy_scope',
      decision_reason: `Requisito histórico '${legacyReq.requirement_id}' (rev:${legacyReq.revision}) sin declaración de alcance (environment/tenant/role); no se promueve automáticamente.`,
      applied_scope: {
        environment: params.scope.environment_name,
        tenant_id: params.scope.tenant_id,
        role: params.scope.role,
        module_key: params.scope.module_key,
      },
      candidates: [cand],
    });
    ambiguities.push({
      ambiguity_id: `amb-legacy-${legacyReq.requirement_id}`,
      code: 'legacy_unscoped_requirement',
      severity: 'warning',
      rule_key: ruleKey,
      route_pathname: primaryRoute,
      title: legacyReq.title,
      message: `Requisito histórico sin scope '${legacyReq.title}' (${legacyReq.requirement_id} rev:${legacyReq.revision}) requiere confirmación explícita para '${params.scope.environment_name}/${params.scope.tenant_id}/${params.scope.role ?? 'default'}'.`,
      question: `¿Aplica el requisito legado '${legacyReq.title}' al alcance '${params.scope.environment_name}/${params.scope.tenant_id}/${params.scope.role ?? 'default'}'?`,
      options: [
        { id: 'assign_scope', label: 'Confirmar para este alcance explícito' },
        { id: 'ignore_legacy', label: 'Mantener excluido de este alcance' },
      ],
      candidates: [cand],
    });
  }

  const observedEvidenceNotes: DossierObservedEvidenceNote[] = params.views.map((v) => {
      const formsCount = v.forms_count ?? v.forms?.length ?? 0;
      return {
        view_id: v.view_id,
        evidence_id: v.evidence_id,
        route: v.route,
        state: v.state,
        controls_count: v.controls.length,
        forms_count: formsCount,
        authority: 'observed_only' as const,
        note: `Observación DOM descriptiva (${v.controls.length} controles, ${formsCount} formularios); no acredita regla de negocio ni genera oráculo.`,
      };
    });

  return {
    precedence_policy: DEFAULT_PRECEDENCE_POLICY,
    legacy_compatibility_policy: DEFAULT_LEGACY_COMPATIBILITY_POLICY,
    decisions,
    ambiguities,
    excluded_sources: excludedSources,
    observed_evidence_notes: observedEvidenceNotes,
    summary: {
      accredited_count: decisions.filter((d) => d.decision_status === 'accredited').length,
      pending_contradiction_count: decisions.filter((d) => d.decision_status === 'pending_contradiction').length,
      unaccredited_pending_count: decisions.filter((d) => d.decision_status === 'unaccredited_pending').length,
      legacy_pending_count: decisions.filter((d) => d.decision_status === 'pending_legacy_scope').length,
      excluded_sources_count: excludedSources.length,
      observed_views_count: observedEvidenceNotes.length,
    },
  };
}
