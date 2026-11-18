import { describe, expect, it } from 'vitest';
import type { ServiceRequirementRecord } from '@qap/shared';

import {
  parseScopedRulesFromDocument,
  resolveScopedBusinessRules,
  type ScopedBusinessRuleRecord,
} from '../application/scoped-rule-resolver.js';

function makeRule(overrides: Partial<ScopedBusinessRuleRecord> & { rule_id: string; rule_key: string; expected_outcome: string }): ScopedBusinessRuleRecord {
  const now = '2026-11-14T00:00:00.000Z';
  return {
    project_id: 'proj-1',
    source_kind: 'ingested_doc',
    source_id: 'doc-1',
    source_ref: 'docs/spec.md',
    source_version: '1.0.0',
    source_digest: 'sha256-test',
    module_key: 'pedidos',
    route_pathname: '/app',
    environment_name: 'staging',
    tenant_id: 'tenant-a',
    role: 'operador',
    scope_declaration: 'exact',
    authority_status: 'accredited',
    title: overrides.rule_key,
    assert_selector: null,
    assert_type: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

describe('scoped-rule-resolver — precedencia, aislamiento y compatibilidad', () => {
  it('excluye reglas de otro entorno o rol y no hace fallback cruzado aunque compartan tenant y ruta', () => {
    const res = resolveScopedBusinessRules({
      scope: {
        environment_name: 'staging',
        tenant_id: 'tenant-a',
        role: 'operador',
        module_key: 'pedidos',
      },
      targetPathname: '/app',
      discoveredRoutes: [{ pathname: '/app' }],
      views: [
        { view_id: 'v-1', evidence_id: 'ev-1', route: 'urn:qap:route:1', state: 'visited', controls: [{ tag: 'button' }], forms: [] },
      ],
      scopedRules: [
        makeRule({ rule_id: 'r-sandbox', environment_name: 'sandbox', rule_key: 'refund_limit', expected_outcome: 'Sandbox USD 999', source_ref: 'docs/sandbox.md' }),
        makeRule({ rule_id: 'r-auditor', role: 'auditor', rule_key: 'refund_limit', expected_outcome: 'Auditor USD 50000', source_ref: 'docs/auditor.md' }),
      ],
      ingestedDocs: [],
      legacyRequirements: [],
    });

    expect(res.summary.accredited_count).toBe(0);
    expect(res.decisions).toHaveLength(0);
    expect(res.excluded_sources.map((e) => e.reason)).toEqual(['out_of_scope_environment', 'out_of_scope_role']);
    expect(res.observed_evidence_notes).toHaveLength(1);
    expect(res.observed_evidence_notes[0]?.authority).toBe('observed_only');
  });

  it('aplica lista explícita compatible en documento general y mantiene pending la contradicción entre requisitos confirmados de igual autoridad', () => {
    const docCompat = parseScopedRulesFromDocument({
      sourceRef: 'docs/compat.md',
      rawContent: [
        'Version: 2.0.0',
        'Scope: general compatible; environment=staging; tenant=tenant-a,tenant-b; role=*',
        'Module: pedidos',
        'Route: /app',
        'Status: accredited',
        '- [RULE key=audit_flag] Bitácora activa: Mostrar indicador de auditoría',
      ].join('\n'),
    });
    expect(docCompat.hasCompatibleScopeDeclaration).toBe(true);
    expect(docCompat.declaredScopeDeclaration).toBe('general_compatible');
    expect(docCompat.rules).toHaveLength(1);

    const compatRule = makeRule({
      rule_id: 'r-compat',
      source_ref: 'docs/compat.md',
      source_version: '2.0.0',
      tenant_id: docCompat.rules[0]!.tenantId!,
      role: docCompat.rules[0]!.role!,
      scope_declaration: 'general_compatible',
      rule_key: 'audit_flag',
      expected_outcome: docCompat.rules[0]!.expectedOutcome,
    });

    const req1 = makeRule({
      rule_id: 'req-1',
      source_kind: 'confirmed_requirement',
      source_id: 'req-01',
      source_ref: 'qa:acta-1',
      source_version: 'rev:1',
      rule_key: 'approval_mode',
      expected_outcome: 'Doble firma',
    });
    const req2 = makeRule({
      rule_id: 'req-2',
      source_kind: 'confirmed_requirement',
      source_id: 'req-02',
      source_ref: 'qa:acta-2',
      source_version: 'rev:1',
      rule_key: 'approval_mode',
      expected_outcome: 'Firma única',
    });

    const legacyReq: ServiceRequirementRecord = {
      requirement_id: 'req-legacy',
      project_id: 'proj-1',
      module_id: 'mod-1',
      module_key: 'pedidos',
      revision: 1,
      title: 'Regla histórica sin scope',
      description: 'Desc',
      category: 'functional',
      source: 'user',
      validation_status: 'confirmed',
      acceptance_criteria: ['Criterio antiguo sin alcance'],
      risk_level: 'medium',
      risk_decision: 'not_required',
      risk_note: null,
      created_at: '2026-11-01T00:00:00.000Z',
      updated_at: '2026-11-01T00:00:00.000Z',
    };

    const resolved = resolveScopedBusinessRules({
      scope: { environment_name: 'staging', tenant_id: 'tenant-b', role: 'operador', module_key: 'pedidos' },
      targetPathname: '/app',
      discoveredRoutes: [{ pathname: '/app' }],
      views: [],
      scopedRules: [compatRule, req1, req2],
      ingestedDocs: [{ doc_id: 'doc-1', source_ref: 'docs/compat.md', sha256: 'abc123', ingested_at: '2026-11-14T00:00:00.000Z' }],
      legacyRequirements: [legacyReq],
    });

    expect(resolved.decisions.find((d) => d.rule_key === 'audit_flag')).toMatchObject({
      decision_status: 'accredited',
      scope_match: 'general_compatible',
    });
    expect(resolved.decisions.find((d) => d.rule_key === 'legacy_req_legacy')?.decision_status).toBe('pending_legacy_scope');
    expect(resolved.excluded_sources.filter((e) => e.reason === 'out_of_scope_tenant')).toHaveLength(2);

    const sameTenantContradiction = resolveScopedBusinessRules({
      scope: { environment_name: 'staging', tenant_id: 'tenant-a', role: 'operador', module_key: 'pedidos' },
      targetPathname: '/app',
      discoveredRoutes: [{ pathname: '/app' }],
      views: [],
      scopedRules: [compatRule, req1, req2],
      ingestedDocs: [{ doc_id: 'doc-1', source_ref: 'docs/compat.md', sha256: 'abc123', ingested_at: '2026-11-14T00:00:00.000Z' }],
      legacyRequirements: [],
    });
    expect(sameTenantContradiction.decisions.find((d) => d.rule_key === 'approval_mode')?.decision_status).toBe('pending_contradiction');
    expect(sameTenantContradiction.ambiguities.some((a) => a.code === 'equal_authority_contradiction' && a.rule_key === 'approval_mode')).toBe(true);
  });
});
