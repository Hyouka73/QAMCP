import { createHash } from 'node:crypto';
import { dirname } from 'node:path';

import { normalizeSlug } from '@qap/shared';

import {
  atomicWritePrivateFile,
  ensurePrivateDir,
  resolveContainedPath,
} from './safe-storage.js';
import type { DiscoveryDossierRuleResolution } from './scoped-rule-resolver.js';

export interface DiscoveryDossierScope {
  readonly project_id: string;
  readonly application_id: string;
  readonly environment_id: string;
  readonly environment_name: string;
  readonly tenant_id: string | null;
  readonly profile_id: string | null;
  readonly role: string | null;
  readonly module_key: string;
  readonly module_title: string;
}

export interface DiscoveryDossierRoute {
  readonly reference: string;
  readonly state: 'visited' | 'candidate' | 'blocked' | 'unavailable' | 'inconclusive' | 'redirected';
  readonly depth: number;
  readonly http_status?: number;
  readonly reason?: string;
  readonly view_id?: string;
  readonly authorized_pathname?: string;
}

export interface DiscoveryDossierRelation {
  readonly from_route_index: number;
  readonly to_route_index: number;
  readonly kind: 'link_candidate' | 'http_redirect';
}

export interface DiscoveryDossierFormSummary {
  readonly action_kind: string;
  readonly method: string;
  readonly field_count: number;
}

export interface DiscoveryDossierLinkSummary {
  readonly target_route_index: number;
  readonly control_index: number;
  readonly authorized: boolean;
  readonly label?: string;
}

export interface DiscoveryDossierControl {
  readonly tag: string;
  readonly role?: string;
  readonly input_type?: string;
  readonly label?: string;
  readonly visibility: 'visible' | 'hidden' | 'not_evaluable';
  readonly disabled: boolean;
  readonly required_in_dom: boolean;
  readonly selector_candidates: readonly string[];
  readonly selector_stability: 'unverified';
}

export interface DiscoveryDossierView {
  readonly view_id: string;
  readonly route: string;
  readonly route_index?: number;
  readonly state: 'static_snapshot' | 'spa_rendered' | 'loading_or_script_dependent';
  readonly evidence_id: string;
  readonly headings: readonly string[];
  readonly controls: readonly DiscoveryDossierControl[];
  readonly menus?: number;
  readonly forms?: readonly DiscoveryDossierFormSummary[];
  readonly links?: readonly DiscoveryDossierLinkSummary[];
  readonly forms_count: number;
  readonly links_count: number;
  readonly truncated: boolean;
}

export interface DiscoveryDossierSourceRef {
  readonly kind: 'knowledge_evidence' | 'knowledge_observation' | 'ingested_doc' | 'confirmed_requirement';
  readonly ref_id: string;
  readonly label?: string;
}

export interface DiscoveryDossierGap {
  readonly code: string;
  readonly description: string;
  readonly severity: 'info' | 'warning' | 'blocking';
}

export interface DiscoveryDossierCanonical {
  readonly schema_version: '1';
  readonly scope: DiscoveryDossierScope;
  readonly target_pathname: string;
  readonly mode: string;
  readonly acquisition_status: string;
  readonly routes: readonly DiscoveryDossierRoute[];
  readonly relations?: readonly DiscoveryDossierRelation[];
  readonly route_counts: {
    readonly visited: number;
    readonly candidate: number;
    readonly blocked: number;
  };
  readonly views: readonly DiscoveryDossierView[];
  readonly source_refs: readonly DiscoveryDossierSourceRef[];
  readonly gaps: readonly DiscoveryDossierGap[];
  readonly limitations: readonly string[];
  readonly rule_resolution?: DiscoveryDossierRuleResolution;
}

export interface DiscoveryRevisionRecord {
  readonly revision_id: string;
  readonly project_id: string;
  readonly application_id: string;
  readonly environment_id: string;
  readonly environment_name: string;
  readonly tenant_id: string | null;
  readonly profile_id: string | null;
  readonly role: string | null;
  readonly module_key: string;
  readonly module_title: string;
  readonly target_url: string;
  readonly execution_id: string;
  readonly inventory_id: string | null;
  readonly content_hash: string;
  readonly scope_hash: string;
  readonly dossier: DiscoveryDossierCanonical;
  readonly created_at: string;
}

const SENSITIVE_TEXT_PATTERN =
  /(?:cookie|set-cookie|localstorage|sessionstorage|authorization\s*:|bearer\s+[a-z0-9._-]+|basic\s+[a-z0-9+/=]+|password\s*[:=]|passwd\s*[:=]|secret\s*[:=]|token\s*[:=]|api[_-]?key\s*[:=]|session[_-]?id\s*[:=]|eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})/i;
const RAW_URL_PATTERN = /https?:\/\/[^\s"'<>()]+/gi;

export function sanitizeDossierText(value: unknown, maxLen = 160): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed) return undefined;
  if (SENSITIVE_TEXT_PATTERN.test(trimmed)) return '[REDACTED]';
  const withoutUrls = trimmed.replace(RAW_URL_PATTERN, '[REDACTED_URL]');
  return withoutUrls.length > maxLen ? `${withoutUrls.slice(0, maxLen - 1)}…` : withoutUrls;
}

export function sanitizeTargetPathname(targetUrl: string): string {
  try {
    const parsed = new URL(targetUrl);
    const pathname = parsed.pathname || '/';
    return SENSITIVE_TEXT_PATTERN.test(pathname) ? '/[REDACTED]' : pathname;
  } catch {
    if (targetUrl.startsWith('/') && !targetUrl.includes('?') && !targetUrl.includes('#')) {
      return SENSITIVE_TEXT_PATTERN.test(targetUrl) ? '/[REDACTED]' : targetUrl;
    }
    return '/';
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function computeScopeHash(scope: DiscoveryDossierScope): string {
  const canonicalScope = {
    project_id: scope.project_id,
    application_id: scope.application_id,
    environment_id: scope.environment_id,
    environment_name: scope.environment_name,
    tenant_id: scope.tenant_id,
    profile_id: scope.profile_id,
    role: scope.role,
    module_key: normalizeSlug(scope.module_key),
  };
  return createHash('sha256').update(stableJson(canonicalScope), 'utf8').digest('hex');
}

export function computeDossierContentHash(dossier: DiscoveryDossierCanonical): string {
  // Exclude per-execution opaque HMAC/UUID identifiers (view_id, evidence_id, route ref, observation ref)
  // while preserving route slot structure, authorized pathnames, relations, links, menus, forms, and DOM details.
  const viewIndexById = new Map<string, number>();
  dossier.views.forEach((v, idx) => {
    viewIndexById.set(v.view_id, idx);
  });

  const normalized = {
    schema_version: dossier.schema_version,
    scope: {
      project_id: dossier.scope.project_id,
      application_id: dossier.scope.application_id,
      environment_id: dossier.scope.environment_id,
      environment_name: dossier.scope.environment_name,
      tenant_id: dossier.scope.tenant_id,
      profile_id: dossier.scope.profile_id,
      role: dossier.scope.role,
      module_key: normalizeSlug(dossier.scope.module_key),
    },
    target_pathname: dossier.target_pathname,
    mode: dossier.mode,
    acquisition_status: dossier.acquisition_status,
    routes: dossier.routes.map((r) => ({
      state: r.state,
      depth: r.depth,
      http_status: r.http_status,
      reason: r.reason,
      authorized_pathname: r.authorized_pathname,
      view_index: r.view_id ? (viewIndexById.get(r.view_id) ?? -1) : -1,
    })),
    relations: dossier.relations ?? [],
    route_counts: dossier.route_counts,
    views: dossier.views.map((v) => ({
      route_index: v.route_index ?? -1,
      state: v.state,
      headings: v.headings,
      controls: v.controls,
      menus: v.menus ?? 0,
      forms: v.forms ?? [],
      links: v.links ?? [],
      forms_count: v.forms_count,
      links_count: v.links_count,
      truncated: v.truncated,
    })),
    ingested_docs: dossier.source_refs.filter((s) => s.kind === 'ingested_doc' || s.kind === 'confirmed_requirement'),
    gaps: dossier.gaps,
    limitations: dossier.limitations,
    rule_resolution: dossier.rule_resolution
      ? {
          precedence_policy: dossier.rule_resolution.precedence_policy,
          legacy_compatibility_policy: dossier.rule_resolution.legacy_compatibility_policy,
          decisions: dossier.rule_resolution.decisions,
          ambiguities: dossier.rule_resolution.ambiguities,
          excluded_sources: dossier.rule_resolution.excluded_sources,
          observed_evidence_notes: dossier.rule_resolution.observed_evidence_notes
            .map((obs) => ({
              view_index: viewIndexById.get(obs.view_id) ?? -1,
              state: obs.state,
              controls_count: obs.controls_count,
              forms_count: obs.forms_count,
              authority: obs.authority,
            }))
            .sort((a, b) => a.view_index - b.view_index),
          summary: dossier.rule_resolution.summary,
        }
      : null,
  };
  return createHash('sha256').update(stableJson(normalized), 'utf8').digest('hex');
}

export function buildDiscoveryRevisionId(scopeHash: string, contentHash: string): string {
  const digest = createHash('sha256').update(`${scopeHash}:${contentHash}`, 'utf8').digest('hex');
  return `drev-${digest.slice(0, 12)}`;
}

export function buildPublishedModuleDocRelativeToIndex(
  revision: Pick<DiscoveryRevisionRecord, 'module_key' | 'scope_hash'>,
): string {
  const safeMod = normalizeSlug(revision.module_key) || 'modulo';
  const scopeTag = revision.scope_hash.replace(/[^a-f0-9]/gi, '').slice(0, 8) || 'default';
  return `modules/${safeMod}--${scopeTag}.md`;
}

export function buildPublishedModuleDocRepoPath(
  revision: Pick<DiscoveryRevisionRecord, 'module_key' | 'scope_hash'>,
): string {
  return `.qa/discovery/${buildPublishedModuleDocRelativeToIndex(revision)}`;
}

export function renderModuleDossierMarkdown(revision: DiscoveryRevisionRecord): string {
  const { dossier } = revision;
  const { scope } = dossier;
  const lines: string[] = [
    `# Expediente de Discovery: ${sanitizeDossierText(scope.module_title, 120) ?? scope.module_key} (\`${scope.module_key}\`)`,
    '',
    `- **Revisión:** \`${revision.revision_id}\``,
    `- **Fecha de captura:** ${revision.created_at}`,
    `- **Estado de adquisición:** \`${dossier.acquisition_status}\` (modo: \`${dossier.mode}\`)`,
    `- **Ruta objetivo:** \`${dossier.target_pathname}\``,
    '',
    '## Alcance',
    '',
    `- **Proyecto:** \`${scope.project_id}\` (App: \`${scope.application_id}\`)`,
    `- **Entorno:** \`${scope.environment_name}\` (\`${scope.environment_id}\`)`,
    `- **Tenant:** ${scope.tenant_id ? `\`${scope.tenant_id}\`` : '_no especificado_'}`,
    `- **Perfil / Rol:** ${scope.profile_id ? `\`${scope.profile_id}\`` : '_anónimo_'} / ${scope.role ? `\`${scope.role}\`` : '_sin rol_'}`,
    '',
    '## Rutas observadas',
    '',
    `- Visitadas: ${dossier.route_counts.visited} | Candidatas: ${dossier.route_counts.candidate} | Bloqueadas: ${dossier.route_counts.blocked}`,
    '',
  ];

  if (dossier.routes.length === 0) {
    lines.push('_No se registraron rutas._', '');
  } else {
    lines.push('| Referencia | Ruta autorizada | Estado | Profundidad | HTTP | Motivo |');
    lines.push('| --- | --- | --- | --- | --- | --- |');
    for (const r of dossier.routes) {
      const safeRef = sanitizeDossierText(r.reference, 120) ?? '-';
      const safePath = r.authorized_pathname ? `\`${r.authorized_pathname}\`` : '_opaca_';
      const safeReason = r.reason ? (sanitizeDossierText(r.reason, 80) ?? '-') : '-';
      lines.push(
        `| \`${safeRef}\` | ${safePath} | \`${r.state}\` | ${r.depth} | ${r.http_status ?? '-'} | ${safeReason} |`,
      );
    }
    lines.push('');
  }

  lines.push('## Vistas y controles observados', '');
  if (dossier.views.length === 0) {
    lines.push('_No se observaron vistas renderizadas._', '');
  } else {
    for (const v of dossier.views) {
      lines.push(`### Vista \`${v.view_id}\` (\`${v.state}\`)`);
      lines.push('');
      lines.push(`- **Ruta ref:** \`${v.route}\` | **Evidencia:** \`${v.evidence_id}\` | **Formularios:** ${v.forms_count} | **Enlaces:** ${v.links_count}${v.truncated ? ' (truncada)' : ''}`);
      if (v.headings.length > 0) {
        lines.push(`- **Encabezados observados:** ${v.headings.map((h) => `\`${sanitizeDossierText(h, 120) ?? '-'}\``).join(', ')}`);
      }
      if (v.controls.length > 0) {
        lines.push('');
        lines.push('| Tag | Rol | Tipo | Etiqueta | Visibilidad | Selectores candidatos |');
        lines.push('| --- | --- | --- | --- | --- | --- |');
        for (const c of v.controls) {
          const selectors = c.selector_candidates
            .slice(0, 2)
            .map((s) => `\`${sanitizeDossierText(s, 100) ?? '[REDACTED]'}\``)
            .join(', ') || '-';
          lines.push(
            `| \`${c.tag}\` | ${c.role ?? '-'} | ${c.input_type ?? '-'} | ${c.label ? (sanitizeDossierText(c.label, 80) ?? '-') : '-'} | \`${c.visibility}\` | ${selectors} |`,
          );
        }
      }
      lines.push('');
    }
  }

  lines.push('## Fuentes y referencias', '');
  if (dossier.source_refs.length === 0) {
    lines.push('_Sin referencias de fuente registradas._', '');
  } else {
    for (const src of dossier.source_refs) {
      const safeLabel = src.label ? sanitizeDossierText(src.label, 120) : undefined;
      lines.push(`- \`${src.kind}\`: \`${src.ref_id}\`${safeLabel ? ` — ${safeLabel}` : ''}`);
    }
    lines.push('');
  }

  lines.push('## Reglas de negocio por alcance, decisiones y ambigüedades', '');
  if (!dossier.rule_resolution) {
    lines.push('_Sin resolución estructurada de reglas por alcance en esta revisión._', '');
  } else {
    const rr = dossier.rule_resolution;
    lines.push('### Precedencia y compatibilidad', '');
    for (const step of rr.precedence_policy) {
      lines.push(`- ${sanitizeDossierText(step, 240) ?? step}`);
    }
    lines.push(`- **Compatibilidad legacy/general:** ${sanitizeDossierText(rr.legacy_compatibility_policy, 240) ?? rr.legacy_compatibility_policy}`);
    lines.push('');

    lines.push('### Decisiones sobre expectativas de negocio', '');
    if (rr.decisions.length === 0) {
      lines.push('_No se encontraron reglas de negocio aplicables para este alcance; ninguna expectativa ha sido acreditada._', '');
    } else {
      lines.push('| Rule Key | Ruta | Decisión | Expectativa | Fuente | Versión | Coincidencia | Detalle |');
      lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
      for (const dec of rr.decisions) {
        const expText = dec.expected_outcome
          ? sanitizeDossierText(dec.expected_outcome, 120) ?? '-'
          : '_Pendiente (sin oráculo)_';
        const srcText = dec.source_ref
          ? `\`${dec.source_kind ?? '-'}\`: \`${sanitizeDossierText(dec.source_ref, 80) ?? dec.source_ref}\` (\`${dec.source_id ?? '-'}\`)`
          : dec.candidates.map((c) => `\`${sanitizeDossierText(c.source_ref, 60) ?? c.source_ref}\` (\`${c.source_version}\`)`).join('; ') || '-';
        const verText = dec.source_version ? `\`${sanitizeDossierText(dec.source_version, 40) ?? dec.source_version}\`` : '-';
        const scopeText = dec.scope_match ? `\`${dec.scope_match}\`` : '-';
        const reasonText = sanitizeDossierText(dec.decision_reason, 180) ?? dec.decision_status;
        lines.push(
          `| \`${dec.rule_key}\` | \`${dec.route_pathname}\` | \`${dec.decision_status}\` | ${expText} | ${srcText} | ${verText} | ${scopeText} | ${reasonText} |`,
        );
      }
      lines.push('');
    }

    lines.push('### Ambigüedades y expectativas pendientes', '');
    if (rr.ambiguities.length === 0) {
      lines.push('_Sin contradicciones ni ambigüedades pendientes._', '');
    } else {
      for (const amb of rr.ambiguities) {
        lines.push(`- **[${amb.severity.toUpperCase()}] \`${amb.code}\` (\`${amb.rule_key}\` @ \`${amb.route_pathname}\`):** ${sanitizeDossierText(amb.message, 240) ?? amb.message}`);
        lines.push(`  - Pregunta QA: ${sanitizeDossierText(amb.question, 220) ?? amb.question}`);
        for (const c of amb.candidates) {
          lines.push(`  - Candidata: \`${c.source_kind}\` \`${sanitizeDossierText(c.source_ref, 80) ?? c.source_ref}\` (v\`${c.source_version}\`, \`${c.authority_status}\`, \`${c.scope_match}\`) -> "${sanitizeDossierText(c.expected_outcome, 120) ?? c.expected_outcome}"`);
        }
      }
      lines.push('');
    }

    lines.push('### Fuentes excluidas o reemplazadas', '');
    if (rr.excluded_sources.length === 0) {
      lines.push('_No hay fuentes excluidas para este alcance._', '');
    } else {
      for (const ex of rr.excluded_sources.slice(0, 30)) {
        lines.push(
          `- \`${ex.reason}\` — \`${sanitizeDossierText(ex.source_ref, 100) ?? ex.source_ref}\`${ex.source_version ? ` (v\`${ex.source_version}\`)` : ''}${ex.rule_key ? ` [\`${ex.rule_key}\`]` : ''}: ${sanitizeDossierText(ex.detail, 180) ?? ex.detail}`,
        );
      }
      lines.push('');
    }

    if (rr.observed_evidence_notes.length > 0) {
      lines.push('### Evidencia DOM descriptiva (observed_only)', '');
      for (const obs of rr.observed_evidence_notes) {
        lines.push(`- Vista \`${obs.view_id}\` (\`${obs.state}\`, evidencia \`${obs.evidence_id}\`): ${sanitizeDossierText(obs.note, 200) ?? obs.note}`);
      }
      lines.push('');
    }
  }

  lines.push('## Huecos explícitos y limitaciones', '');
  if (dossier.gaps.length === 0 && dossier.limitations.length === 0) {
    lines.push('_Sin huecos reportados._', '');
  } else {
    for (const g of dossier.gaps) {
      lines.push(`- **[${g.severity.toUpperCase()}] \`${g.code}\`:** ${sanitizeDossierText(g.description, 200) ?? g.code}`);
    }
    for (const lim of dossier.limitations) {
      lines.push(`- **Limitación crawler:** \`${sanitizeDossierText(lim, 120) ?? lim}\``);
    }
    lines.push('');
  }

  lines.push('> Nota: Las observaciones DOM no acreditan reglas de negocio por sí mismas; requieren confirmación explícita o fuente documental acreditada.');
  lines.push('');
  return lines.join('\n');
}

export function renderDiscoveryIndexMarkdown(
  projectId: string,
  latestByScope: readonly DiscoveryRevisionRecord[],
): string {
  const lines: string[] = [
    `# Índice del Expediente de Discovery (\`${projectId}\`)`,
    '',
    latestByScope.length === 0
      ? '_No hay revisiones de Discovery registradas todavía._'
      : `Alcances documentados: **${latestByScope.length}**`,
    '',
  ];

  if (latestByScope.length > 0) {
    lines.push('| Módulo | Revisión vigente | Entorno | Tenant | Perfil | Rol | Visitadas / Candidatas / Bloqueadas | Reglas (Acred./Pend.) | Huecos | Documento |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const rev of latestByScope) {
      const { scope, route_counts, gaps, rule_resolution } = rev.dossier;
      const docRel = buildPublishedModuleDocRelativeToIndex(rev);
      const safeTitle = sanitizeDossierText(scope.module_title, 80) ?? scope.module_key;
      const rulesCol = rule_resolution
        ? `${rule_resolution.summary.accredited_count} / ${rule_resolution.summary.pending_contradiction_count + rule_resolution.summary.unaccredited_pending_count + rule_resolution.summary.legacy_pending_count}`
        : '0 / 0';
      lines.push(
        `| ${safeTitle} (\`${scope.module_key}\`) | \`${rev.revision_id}\` | \`${scope.environment_name}\` | ${scope.tenant_id ? `\`${scope.tenant_id}\`` : '-'} | ${scope.profile_id ? `\`${scope.profile_id}\`` : '-'} | ${scope.role ? `\`${scope.role}\`` : '-'} | ${route_counts.visited} / ${route_counts.candidate} / ${route_counts.blocked} | ${rulesCol} | ${gaps.length} | [${docRel.replace(/^modules\//, '')}](${docRel}) |`,
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function writeDiscoveryMarkdownFiles(
  projectRootDir: string,
  projectId: string,
  latestByScope: readonly DiscoveryRevisionRecord[],
  options?: {
    readonly updatedPublishedRevision?: DiscoveryRevisionRecord;
    readonly regenerateAll?: boolean;
  },
): {
  readonly index_path: string;
  readonly module_doc_path?: string;
  readonly written_paths: readonly string[];
} {
  const indexRel = '.qa/discovery/INDEX.md';
  const indexAbs = resolveContainedPath(projectRootDir, indexRel);
  ensurePrivateDir(dirname(indexAbs));
  atomicWritePrivateFile(indexAbs, renderDiscoveryIndexMarkdown(projectId, latestByScope));

  const writtenPaths: string[] = [indexRel];
  let moduleDocPath: string | undefined;

  const publishedToWrite: DiscoveryRevisionRecord[] = options?.regenerateAll
    ? [...latestByScope]
    : options?.updatedPublishedRevision
      ? [
          latestByScope.find((r) => r.scope_hash === options.updatedPublishedRevision!.scope_hash) ??
            options.updatedPublishedRevision,
        ]
      : [];

  for (const rev of publishedToWrite) {
    const docRepoRel = buildPublishedModuleDocRepoPath(rev);
    const docAbs = resolveContainedPath(projectRootDir, docRepoRel);
    ensurePrivateDir(dirname(docAbs));
    atomicWritePrivateFile(docAbs, renderModuleDossierMarkdown(rev));
    writtenPaths.push(docRepoRel);
    if (options?.updatedPublishedRevision && rev.scope_hash === options.updatedPublishedRevision.scope_hash) {
      moduleDocPath = docRepoRel;
    }
  }

  return {
    index_path: indexRel,
    ...(moduleDocPath ? { module_doc_path: moduleDocPath } : {}),
    written_paths: writtenPaths,
  };
}
